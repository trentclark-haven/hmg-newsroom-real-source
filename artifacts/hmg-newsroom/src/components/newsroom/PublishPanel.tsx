import { useCallback, useEffect, useRef, useState } from "react";
import {
  useGetWordpressStatus,
  useGetPublicAppStatus,
  usePublishToWordpress,
  usePublishToPublicApp,
  type Silo as ApiSilo,
  type PublishStatus,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Code2,
  Eye,
  ExternalLink,
  FileSearch,
  Image as ImageIcon,
  Link2,
  Loader2,
  Send,
  Settings,
  Upload,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { recordUsage } from "@/lib/useUsageStats";
import { useWPSettings } from "@/lib/useWPSettings";
import { WPSettingsModal } from "./WPSettingsModal";
import {
  PUBLISH_TARGETS,
  type PublishTargetId,
} from "@/lib/publishTargets";
import {
  buildPublishPayload,
  isPayloadPublishable,
  type PublishPayload,
} from "@/lib/publishPayload";
import { PackagePreview } from "./PackagePreview";
import { recordAudit } from "@/lib/auditLog";
import { recordSafeModeBlock, useSafeMode } from "@/lib/safeMode";
import {
  enqueue,
  isAlreadyRunning,
  dedupeKeyOf,
  DuplicateJobError,
} from "@/lib/requestQueue";
import { runThroughBreaker, CircuitOpenError } from "@/lib/circuitBreaker";
import { startJob, completeJob } from "@/lib/jobLedger";
import { captureSnapshot } from "@/lib/recoverySnapshots";
import { getOperatorInitials } from "@/lib/operatorProfile";
import {
  APPROVAL_STATE_COLORS,
  APPROVAL_STATE_LABELS,
  articleKey,
  type ApprovalState,
} from "@/lib/approvals";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

interface PublishPanelProps {
  silo: ApiSilo;
  siloName: string;
  payload: PublishPayload | null;
  brand: { bg: string; on: string; color: string };
}

interface ApiErrorLike {
  data?: { error?: string; code?: string } | null;
  message?: string;
}

function readError(err: unknown, fallback: string): string {
  const e = err as ApiErrorLike;
  const dataError =
    e?.data && typeof e.data === "object"
      ? (e.data as { error?: string })
      : null;
  return dataError?.error || (typeof e?.message === "string" ? e.message : fallback);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function PublishPanel({
  silo,
  siloName,
  payload,
  brand,
}: PublishPanelProps) {
  const { creds } = useWPSettings(silo);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const statusQuery = useGetWordpressStatus(
    { silo },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: !creds } as any },
  );
  const publicAppStatusQuery = useGetPublicAppStatus();
  const publishMutation = usePublishToWordpress();
  const publicAppPublishMutation = usePublishToPublicApp();

  const [target, setTarget] = useState<PublishTargetId>("wordpress");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("");
  const [bodyEdited, setBodyEdited] = useState(false);
  const [htmlMode, setHtmlMode] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [packagePreviewOpen, setPackagePreviewOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<PublishStatus | null>(
    null,
  );
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [videoEmbed, setVideoEmbed] = useState("");
  const [featuredMedia, setFeaturedMedia] = useState<{
    id: number;
    url: string;
    title?: string;
  } | null>(null);
  const [featuredUploading, setFeaturedUploading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const featuredRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);

  const [lastPublished, setLastPublished] = useState<{
    link: string;
    status: string;
    title: string;
    target: PublishTargetId;
  } | null>(null);

  // Server-side approval record is the source of truth for the review gate.
  // The old localStorage ledger was advisory only — the server now enforces it.
  const apiBase = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");
  const [approvalRecord, setApprovalRecord] = useState<{
    articleId: string;
    state: ApprovalState;
    approvedBy: string;
  } | null>(null);
  const [approvalBusy, setApprovalBusy] = useState(false);

  const isLoading = !creds && statusQuery.isLoading;
  const envStatus = statusQuery.data;
  const wpConfigured = creds ? true : envStatus?.configured ?? false;
  const siteUrl = creds ? creds.url : envStatus?.siteUrl ?? "";
  const looksLikeUrl = /^https?:\/\//i.test(siteUrl);
  const publicAppConfigured = publicAppStatusQuery.data?.configured ?? false;

  // Effective body: user override wins, else generated payload
  const effectiveBody = bodyEdited ? body : payload?.content ?? "";
  const effectiveSlug = slug.trim() || (payload ? slugify(payload.title) : "");
  const articleId = articleKey(silo, effectiveSlug || payload?.title || "");
  const approvalState: ApprovalState = approvalRecord?.state ?? "draft";
  // Live publishing is always gated server-side now; this mirrors that rule so
  // the UI blocks (and explains) before the request is rejected with 409.
  const blockedByApproval =
    approvalState !== "approved" && approvalState !== "published";

  // Normalize the payload through the shared builder so categories / tags /
  // trims are deduped consistently with the Public App publisher.
  const normalizedPayload: PublishPayload | null = payload
    ? buildPublishPayload({
        title: payload.title,
        content: effectiveBody,
        excerpt: payload.excerpt,
        metaDescription: payload.metaDescription,
        categories: payload.categories,
        tags: payload.tags,
      })
    : null;

  async function uploadToWordpress(file: File): Promise<{
    id: number;
    url: string;
    title?: string;
  }> {
    const apiBase = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("silo", silo);
    if (creds) {
      fd.append("overrideUrl", creds.url);
      fd.append("overrideUser", creds.user);
      fd.append("overridePassword", creds.password);
    }
    const res = await fetch(`${apiBase}/wordpress/media`, {
      method: "POST",
      body: fd,
    });
    const json = (await res.json()) as {
      id?: number;
      url?: string;
      title?: string;
      error?: string;
    };
    if (!res.ok || !json.id || !json.url) {
      throw new Error(json.error || `Media upload failed (${res.status})`);
    }
    return { id: json.id, url: json.url, title: json.title };
  }

  async function handleFeaturedUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!wpConfigured) {
      toast.error("Connect WordPress first.");
      return;
    }
    setFeaturedUploading(true);
    try {
      const m = await uploadToWordpress(file);
      setFeaturedMedia(m);
      toast.success(`Featured image uploaded (#${m.id})`);
    } catch (err) {
      toast.error(readError(err, "Featured upload failed"));
    } finally {
      setFeaturedUploading(false);
      if (featuredRef.current) featuredRef.current.value = "";
    }
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!wpConfigured) {
      toast.error("Connect WordPress first.");
      return;
    }
    setMediaUploading(true);
    try {
      const m = await uploadToWordpress(file);
      const isVideo = file.type.startsWith("video/");
      const tag = isVideo
        ? `<video controls src="${m.url}"></video>`
        : `<img src="${m.url}" alt="${m.title || ""}" />`;
      setBody((prev) => {
        const base = bodyEdited ? prev : effectiveBody;
        const next = base ? `${base}\n\n${tag}` : tag;
        return next;
      });
      setBodyEdited(true);
      toast.success(`Inserted ${isVideo ? "video" : "image"} into body`);
    } catch (err) {
      toast.error(readError(err, "Media upload failed"));
    } finally {
      setMediaUploading(false);
      if (mediaRef.current) mediaRef.current.value = "";
    }
  }

  async function publishWordpress(publishStatus: PublishStatus) {
    if (!normalizedPayload) throw new Error("Create article draft first.");
    if (!wpConfigured) throw new Error(`WordPress not configured for ${siloName}.`);
    // NOTE: do NOT append videoEmbed here — the server appends it once when
    // `videoEmbed` is provided in the payload. Appending in both places
    // produces duplicate embeds in the published WP post.
    return publishMutation.mutateAsync({
      data: {
        silo,
        title: normalizedPayload.title,
        content: normalizedPayload.content,
        excerpt: normalizedPayload.excerpt,
        metaDescription: normalizedPayload.metaDescription,
        categories: normalizedPayload.categories,
        tags: normalizedPayload.tags,
        status: publishStatus as unknown as import("@workspace/api-client-react").PublishRequestStatus,
        slug: effectiveSlug || undefined,
        canonicalUrl: canonicalUrl.trim() || undefined,
        videoEmbed: videoEmbed.trim() || undefined,
        featuredMediaId: featuredMedia?.id,
        ...(creds
          ? {
              overrideUrl: creds.url,
              overrideUser: creds.user,
              overridePassword: creds.password,
            }
          : {}),
      },
    });
  }

  async function publishPublicApp() {
    if (!normalizedPayload) throw new Error("Create article draft first.");
    return publicAppPublishMutation.mutateAsync({
      data: {
        silo,
        title: normalizedPayload.title,
        content: normalizedPayload.content,
        excerpt: normalizedPayload.excerpt,
        slug: effectiveSlug || undefined,
        canonicalUrl: canonicalUrl.trim() || undefined,
        videoEmbed: videoEmbed.trim() || undefined,
        featuredImageUrl: featuredMedia?.url,
        categories: normalizedPayload.categories,
        tags: normalizedPayload.tags,
      },
    });
  }

  function openPackagePreview(publishStatus: PublishStatus) {
    if (!isPayloadPublishable(normalizedPayload)) {
      toast.error("Create article draft first.");
      return;
    }
    setPendingStatus(publishStatus);
    setPackagePreviewOpen(true);
  }

  // Load the server-side approval record for the current article. Cookies are
  // sent same-origin so the session role is enforced by the server.
  const loadApproval = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(
          `${apiBase}/approvals/${encodeURIComponent(id)}`,
        );
        if (res.status === 404) {
          setApprovalRecord(null);
          return;
        }
        if (!res.ok) return;
        const json = (await res.json()) as {
          record?: { articleId: string; state: ApprovalState; approvedBy: string };
        };
        setApprovalRecord(json.record ?? null);
      } catch {
        /* network blip — leave last known state */
      }
    },
    [apiBase],
  );

  useEffect(() => {
    if (!articleId) {
      setApprovalRecord(null);
      return;
    }
    void loadApproval(articleId);
  }, [articleId, loadApproval]);

  async function approvalAction(
    path: "submit" | "approve" | "reject",
    extra: Record<string, unknown>,
  ): Promise<boolean> {
    setApprovalBusy(true);
    try {
      const res = await fetch(`${apiBase}/approvals/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, ...extra }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        record?: { articleId: string; state: ApprovalState; approvedBy: string };
        error?: string;
      };
      if (!res.ok) {
        toast.error(json.error || `Action failed (${res.status})`);
        return false;
      }
      if (json.record) setApprovalRecord(json.record);
      return true;
    } catch (err) {
      toast.error(readError(err, "Approval action failed"));
      return false;
    } finally {
      setApprovalBusy(false);
    }
  }

  async function handleSubmitForReview() {
    if (!normalizedPayload) {
      toast.error("Create article draft first.");
      return;
    }
    const ok = await approvalAction("submit", {
      silo,
      title: normalizedPayload.title,
    });
    if (!ok) return;
    recordAudit(
      "approval-updated",
      silo,
      `Submitted for review (article ${articleId})`,
    );
    toast.success("Submitted for review");
  }

  async function handleApprove() {
    if (!approvalRecord) return;
    const ok = await approvalAction("approve", {});
    if (!ok) return;
    recordAudit("approval-updated", silo, `Approved (article ${articleId})`);
    toast.success("Approved");
  }

  async function handleReject() {
    if (!approvalRecord) return;
    const note = window.prompt("Rejection reason?", "") ?? "";
    const ok = await approvalAction("reject", { reviewNotes: note });
    if (!ok) return;
    recordAudit("approval-updated", silo, `Rejected (article ${articleId})`);
    toast.success("Rejected");
  }

  async function handlePublish(publishStatus: PublishStatus) {
    if (!normalizedPayload || !isPayloadPublishable(normalizedPayload)) {
      toast.error("Create article draft first.");
      return;
    }
    if (safeMode) {
      recordSafeModeBlock(
        "publish",
        `PublishPanel/${publishStatus} → ${target}`,
      );
      toast.error("Safe Mode is on — manual publishing actions disabled.");
      return;
    }
    // Approval gate only applies to live publish — drafts always allowed.
    if (publishStatus === "publish" && blockedByApproval) {
      toast.error(
        "Approval required — submit for review and have an editor approve before manual publish.",
      );
      return;
    }
    if (
      (target === "public-app" || target === "both") &&
      !publicAppConfigured
    ) {
      toast.error(
        "Public App is not configured (set PUBLIC_APP_API_URL + PUBLIC_APP_API_KEY).",
      );
      if (target === "public-app") return;
    }
    // Per-silo publish lock + dedupe so 10 rapid taps cannot spawn 10 publishes.
    const dedupeKey = dedupeKeyOf(
      "publish",
      target,
      publishStatus,
      articleId,
      normalizedPayload.title,
    );
    if (isAlreadyRunning({ kind: "wp-publish", dedupeKey, silo })) {
      toast.message("Already running");
      return;
    }
    // Pre-publish recovery snapshot — metadata only, never the article body.
    captureSnapshot({
      reason: "publish",
      silo,
      label: `${publishStatus === "publish" ? "Publish" : "Draft"} → ${target}`,
      meta: {
        articleId,
        target,
        publishStatus,
        titleLen: normalizedPayload.title.length,
        approvalState: approvalRecord?.state ?? null,
      },
    });
    recordAudit(
      "publish-attempt",
      silo,
      `${publishStatus === "publish" ? "Publish" : "Draft"} → ${target} (article ${articleId})`,
    );
    const jobId = startJob({
      kind: target === "public-app" ? "public-app" : "wp-publish",
      silo,
      summary: `${publishStatus} → ${target} (article ${articleId})`,
      operator: getOperatorInitials() || null,
    });
    try {
      let wpRes: Awaited<ReturnType<typeof publishWordpress>> | null = null;
      let publicAppRes:
        | Awaited<ReturnType<typeof publishPublicApp>>
        | null = null;

      if (target === "wordpress" || target === "both") {
        wpRes = await enqueue({ kind: "wp-publish", dedupeKey, silo }, () =>
          runThroughBreaker(`wp:${silo}`, () => publishWordpress(publishStatus)),
        );
      }
      if (target === "public-app" || target === "both") {
        publicAppRes = await enqueue(
          { kind: "public-app", dedupeKey: `${dedupeKey}:pa` },
          () =>
            runThroughBreaker("public-app", () => publishPublicApp()),
        );
        if (publicAppRes && publicAppRes.configured === false) {
          // Don't block WP publish — just inform.
          toast.message("Public App manual publish path is not configured yet", {
            description:
              "Set PUBLIC_APP_API_URL + PUBLIC_APP_API_KEY env vars when the public app is ready.",
          });
        }
      }

      const remote = publicAppRes?.remote as
        | { url?: string; link?: string }
        | undefined;
      const link =
        wpRes?.link ||
        (publicAppRes && publicAppRes.configured
          ? remote?.url ?? remote?.link ?? ""
          : "") ||
        "";
      const title = wpRes?.title || normalizedPayload.title;
      setLastPublished({
        link,
        status: wpRes?.status || (publishStatus === "publish" ? "publish" : "draft"),
        title,
        target,
      });
      recordUsage(
        silo,
        publishStatus === "publish" ? "publish-live" : "publish-draft",
      );
      recordAudit(
        "publish-success",
        silo,
        `${publishStatus === "publish" ? "Ready for Manual Publish" : "Draft saved"} → ${target} (article ${articleId})`,
      );
      completeJob(jobId, { status: "success" });
      if (publishStatus === "publish" && approvalRecord) {
        // Move the server-side record to `published` (fire-and-forget; the gate
        // already allowed this publish so it can't down-grade an approval).
        void fetch(`${apiBase}/approvals/mark-published`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId }),
        })
          .then(() => loadApproval(articleId))
          .catch(() => {});
      }

      if (target === "wordpress") {
        toast.success(
          publishStatus === "publish"
            ? `${siloName} post marked Ready for Manual Publish`
            : `Draft saved to ${siloName}`,
          { style: { background: brand.bg, color: brand.on, border: "none" } },
        );
      } else if (target === "public-app") {
        toast.success(
          publicAppRes?.configured ? "Public App draft ready" : "Public App draft queued",
        );
      } else {
        toast.success(`Sent to ${siloName} + Public App`);
      }
    } catch (err: unknown) {
      completeJob(jobId, { status: "failure", error: err });
      if (err instanceof DuplicateJobError) {
        toast.message("Already running");
        return;
      }
      if (err instanceof CircuitOpenError) {
        recordAudit(
          "publish-failure",
          silo,
          `Cooldown → ${target} (article ${articleId}, code circuit_open)`,
        );
        toast.error(
          "Publishing is cooling down after repeated upstream failures. Your draft is preserved — try again shortly.",
        );
        return;
      }
      const msg = readError(err, "Publish failed.");
      // Never include the raw error body in the audit summary — it can carry
      // request URLs, headers, or response bodies. Log only the target + a
      // short error code if one is present.
      const code =
        typeof err === "object" && err && "code" in err
          ? String((err as { code?: unknown }).code ?? "").slice(0, 32)
          : "";
      recordAudit(
        "publish-failure",
        silo,
        `Failed → ${target} (article ${articleId}${code ? `, code ${code}` : ""})`,
      );
      toast.error(msg);
    }
  }

  const { enabled: safeMode } = useSafeMode();
  const isPublishing =
    publishMutation.isPending || publicAppPublishMutation.isPending;
  const wpPicked = target === "wordpress" || target === "both";

  return (
    <div className="rounded-lg border border-border/60 bg-secondary/40">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <div
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: brand.color }}
        >
          <Send className="w-3.5 h-3.5" />
          WordPress Post Builder
        </div>
        <div className="flex items-center gap-1.5">
          {wpConfigured && looksLikeUrl && wpPicked && (
            <span className="text-[10px] text-emerald-400 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {creds ? "Custom" : "Connected"}
            </span>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-foreground/5"
            aria-label="WordPress settings"
            title="WordPress settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <WPSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        silo={silo}
        siloName={siloName}
        brand={brand}
      />

      <div className="p-3 space-y-3">
        {/* Target selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PUBLISH_TARGETS.map((t) => {
            const active = target === t.id;
            const disabled = t.id === "public-app" && !publicAppConfigured;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => !disabled && setTarget(t.id)}
                disabled={disabled}
                data-testid={`publish-target-${t.id}`}
                title={
                  disabled
                    ? "Public App not configured (env vars missing)"
                    : t.description
                }
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all ${
                  active
                    ? "border-transparent text-foreground"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                style={
                  active ? { background: brand.bg, color: brand.on } : undefined
                }
              >
                {t.label}
              </button>
            );
          })}
          <span
            data-testid="public-app-status"
            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              publicAppConfigured
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-300"
            }`}
            title={
              publicAppConfigured
                ? "Public App env vars configured"
                : "Public App not configured (placeholder)"
            }
          >
            public app: {publicAppConfigured ? "ready" : "placeholder"}
          </span>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Checking connection...
          </div>
        )}

        {!isLoading && wpPicked && !wpConfigured && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
              <Settings className="w-3.5 h-3.5" />
              WordPress not configured
            </div>
            <p className="text-[12px] text-foreground/80 leading-snug">
              Tap the gear icon to add this silo's WordPress URL, username, and
              Application Password — or set the env vars{" "}
              <span className="font-mono text-foreground/90">
                WP_{silo.toUpperCase()}_URL / USER / APP_PASSWORD
              </span>
              .
            </p>
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-[11px] font-semibold underline hover:no-underline text-amber-300"
            >
              Open settings
            </button>
          </div>
        )}

        {!isLoading && wpPicked && wpConfigured && !looksLikeUrl && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 space-y-1">
            <div className="text-[11px] font-semibold text-amber-400">
              Site URL looks invalid
            </div>
            <p className="text-[11px] text-foreground/80 leading-snug">
              Saved URL is{" "}
              <span className="font-mono text-amber-300">
                "{siteUrl || "(empty)"}"
              </span>
              . It should look like{" "}
              <span className="font-mono">https://{silo}.com</span>.
            </p>
          </div>
        )}

        {!payload && (
          <p className="text-[11px] text-muted-foreground italic">
            Create an article draft first, then preview or export the WordPress draft here.
          </p>
        )}

        {payload && (
          <>
            <div className="rounded-md bg-secondary/40 border border-border/40 p-2 space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                WordPress Post Builder
              </div>
              <div className="text-[12px] text-foreground/90 line-clamp-2">
                {payload.title}
              </div>
              <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                <span>Title</span>
                <span>Slug: {effectiveSlug || "auto"}</span>
                <span>{effectiveBody.length} chars</span>
                <span>Excerpt</span>
                {payload.categories.length > 0 && (
                  <span>{payload.categories.length} categories</span>
                )}
                {payload.tags.length > 0 && (
                  <span>{payload.tags.length} tags</span>
                )}
                {featuredMedia ? <span>featured image #{featuredMedia.id}</span> : <span>featured image needed</span>}
                <span>SEO title/meta</span>
                <span>status: {pendingStatus === "publish" ? "Ready for Manual Publish" : "Save Draft"}</span>
              </div>
            </div>

            {/* Slug */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider">
                Slug
              </Label>
              <Input
                data-testid="publish-slug"
                placeholder={slugify(payload.title) || "post-slug"}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Body editor + html toggle + preview toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider">
                  Body
                </Label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setHtmlMode((v) => !v)}
                    data-testid="publish-html-toggle"
                    title="Toggle raw HTML editing"
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      htmlMode
                        ? "border-transparent text-foreground"
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      htmlMode
                        ? { background: brand.bg, color: brand.on }
                        : undefined
                    }
                  >
                    <Code2 className="w-3 h-3 inline mr-1" />
                    HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen((v) => !v)}
                    data-testid="publish-preview-toggle"
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      previewOpen
                        ? "border-transparent text-foreground"
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                    style={
                      previewOpen
                        ? { background: brand.bg, color: brand.on }
                        : undefined
                    }
                  >
                    <Eye className="w-3 h-3 inline mr-1" />
                    Preview
                  </button>
                </div>
              </div>
              <Textarea
                value={effectiveBody}
                onChange={(e) => {
                  setBody(e.target.value);
                  setBodyEdited(true);
                }}
                className="min-h-[100px] resize-y text-[12px] font-mono bg-secondary/60"
                spellCheck={!htmlMode}
              />
              {previewOpen && (
                <div className="rounded-md border border-border/40 bg-secondary/60 p-2.5 max-h-[200px] overflow-y-auto text-[12px] leading-relaxed">
                  {htmlMode ? (
                    <div
                      // Preview only — content originates from the same browser session.
                      dangerouslySetInnerHTML={{ __html: effectiveBody }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{effectiveBody}</p>
                  )}
                </div>
              )}
            </div>

            {/* Featured image upload */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider">
                Featured image
              </Label>
              <input
                ref={featuredRef}
                type="file"
                accept="image/*"
                onChange={handleFeaturedUpload}
                className="hidden"
                data-testid="publish-featured-upload"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px]"
                  disabled={featuredUploading || !wpConfigured}
                  onClick={() => featuredRef.current?.click()}
                >
                  {featuredUploading ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {featuredMedia ? "Replace featured" : "Upload featured"}
                </Button>
                {featuredMedia && (
                  <a
                    href={featuredMedia.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-emerald-300 inline-flex items-center gap-1 truncate max-w-[180px]"
                  >
                    <ExternalLink className="w-3 h-3" />#{featuredMedia.id}
                  </a>
                )}
              </div>
            </div>

            {/* Inline media upload */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider">
                Inline media (image / video)
              </Label>
              <input
                ref={mediaRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="hidden"
                data-testid="publish-media-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[11px]"
                disabled={mediaUploading || !wpConfigured}
                onClick={() => mediaRef.current?.click()}
              >
                {mediaUploading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                )}
                Upload + insert tag
              </Button>
            </div>

            {/* Video embed */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider">
                Video embed (YouTube / Vimeo URL or HTML)
              </Label>
              <Input
                data-testid="publish-video-embed"
                placeholder="https://youtu.be/abc or <iframe ...>"
                value={videoEmbed}
                onChange={(e) => setVideoEmbed(e.target.value)}
                className="h-9"
              />
              {videoEmbed && (
                <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  Will be included in the WordPress draft.
                </p>
              )}
            </div>

            {/* Canonical URL */}
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider">
                Canonical URL (Yoast)
              </Label>
              <Input
                data-testid="publish-canonical-url"
                placeholder="https://hiphophaven.com/original-source"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                className="h-9"
              />
              {canonicalUrl && (
                <p className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  Stored as Yoast canonical meta on the WP post.
                </p>
              )}
            </div>

            {/* Approval workflow */}
            <div
              data-testid="publish-approval-section"
              className="rounded-md border border-border/60 bg-secondary/30 p-2.5 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold">
                  Editor approval required before manual publish
                </span>
                <span
                  data-testid="publish-approval-state"
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center gap-1"
                  style={{
                    color: APPROVAL_STATE_COLORS[approvalState],
                    borderColor: `${APPROVAL_STATE_COLORS[approvalState]}66`,
                    background: `${APPROVAL_STATE_COLORS[approvalState]}1A`,
                  }}
                >
                  {approvalState === "approved" ? (
                    <ShieldCheck className="w-3 h-3" />
                  ) : approvalState === "rejected" ? (
                    <ShieldX className="w-3 h-3" />
                  ) : (
                    <ShieldAlert className="w-3 h-3" />
                  )}
                  {APPROVAL_STATE_LABELS[approvalState]}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={!normalizedPayload || approvalBusy}
                  data-testid="publish-submit-review"
                  className="text-[11px] font-semibold px-2.5 py-1 rounded border border-border/60 hover:bg-foreground/5 disabled:opacity-50"
                >
                  Submit for review
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={
                    !approvalRecord || approvalState === "approved" || approvalBusy
                  }
                  data-testid="publish-approve"
                  className="text-[11px] font-semibold px-2.5 py-1 rounded border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={
                    !approvalRecord || approvalState === "rejected" || approvalBusy
                  }
                  data-testid="publish-reject"
                  className="text-[11px] font-semibold px-2.5 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
              {blockedByApproval && (
                <p className="text-[10px] text-amber-300/90">
                  Publish Blocked until an editor approves this article.
                </p>
              )}
            </div>

            {safeMode && (
              <div
                data-testid="publish-safe-mode-banner"
                className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-200"
              >
                Safe Mode is on — manual publishing actions disabled.
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handlePublish("draft")}
                disabled={isPublishing || safeMode}
                data-testid="publish-draft"
                className="text-[12px] font-semibold px-3 py-2 rounded-md border border-border/60 text-foreground/90 hover:bg-foreground/5 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                {isPublishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Save Draft
              </button>
              <button
                onClick={() => handlePublish("publish")}
                disabled={isPublishing || safeMode}
                data-testid="publish-live"
                className="text-[12px] font-bold px-3 py-2 rounded-md disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                style={{ background: brand.bg, color: brand.on }}
              >
                {isPublishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Ready for Manual Publish
              </button>
            </div>

            <button
              type="button"
              onClick={() => openPackagePreview("publish")}
              disabled={isPublishing || !isPayloadPublishable(normalizedPayload)}
              data-testid="publish-preview-btn"
              className="w-full text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-md border border-border/60 text-foreground/90 hover:bg-foreground/5 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              <FileSearch className="w-3.5 h-3.5" />
              Preview Post
            </button>

            <PackagePreview
              open={packagePreviewOpen}
              onOpenChange={(next) => {
                setPackagePreviewOpen(next);
                if (!next) setPendingStatus(null);
              }}
              payload={normalizedPayload}
              effectiveBody={effectiveBody}
              slug={effectiveSlug}
              target={target}
              status={(pendingStatus ?? "publish") as "draft" | "publish"}
              siloName={siloName}
              featuredMediaUrl={featuredMedia?.url}
              brand={brand}
              isPublishing={isPublishing}
              onConfirm={() => {
                const status = pendingStatus ?? "publish";
                setPackagePreviewOpen(false);
                setPendingStatus(null);
                void handlePublish(status);
              }}
            />
          </>
        )}

        {lastPublished && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5 space-y-1">
            <div className="text-[11px] font-semibold text-emerald-400">
              {lastPublished.status === "publish" ? "Ready for Manual Publish" : "Draft saved"}
              {" · "}
              {lastPublished.target}
            </div>
            <div className="text-[12px] text-foreground/90 line-clamp-1">
              {lastPublished.title}
            </div>
            {lastPublished.link && (
              <a
                href={lastPublished.link}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-300 hover:text-emerald-700 dark:text-emerald-200 inline-flex items-center gap-1"
              >
                Open
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
