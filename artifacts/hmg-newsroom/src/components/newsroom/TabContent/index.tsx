import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { verticals } from "@/lib/mock-data";
import { usePromptHistory } from "@/lib/usePromptHistory";
import { recordUsage } from "@/lib/useUsageStats";
import { recordAudit } from "@/lib/auditLog";
import { recordOutput } from "@/lib/useOutputHistory";
import { useFounderVoice } from "@/lib/useFounderVoice";
import { hasDraft, useDraft } from "@/lib/useDraft";
import { recordSafeModeBlock, useSafeMode } from "@/lib/safeMode";
import {
  enqueue,
  isAlreadyRunning,
  dedupeKeyOf,
  DuplicateJobError,
} from "@/lib/requestQueue";
import { runThroughBreaker, CircuitOpenError } from "@/lib/circuitBreaker";
import { startJob, completeJob } from "@/lib/jobLedger";
import { getOperatorInitials } from "@/lib/operatorProfile";
import { FounderVoiceCheck } from "@/components/newsroom/FounderVoiceCheck";
import {
  useGenerateContent,
  useGeneratePack,
  type Silo as ApiSilo,
  type Role as ApiRole,
  type Tone as ApiTone,
  type Platform as ApiPlatform,
} from "@workspace/api-client-react";
import {
  Copy,
  Download,
  Eraser,
  ImagePlus,
  Loader2,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  PLATFORM_OPTIONS,
  PillGroup,
  PlatformGroup,
  ROLE_OPTIONS,
  TONE_OPTIONS,
  copyText,
  packToMarkdown,
  platformLabel,
  quickToMarkdown,
} from "./shared";
import { HistoryDock } from "./HistoryDock";
import { JetFirePanel } from "@/components/hmg/JetFirePanel";
import { QuickOutput } from "./QuickMode";
import { PackOutput } from "./PackMode";
import {
  createCorpusRetriever,
  buildGroundedPrompt,
  type GroundedPromptResult,
} from "@/lib/hmg/haven-ai";
import { CorpusCitations } from "@/components/newsroom/CorpusCitations";
import { BookOpen } from "lucide-react";
import type { Platform, Result, Role, Tone } from "./types";
import { MEDIA_LIMITS, formatBytes } from "@/lib/mediaLimits";
import { Paperclip, X as XIcon } from "lucide-react";
import {
  UniversalMediaSource,
  type MediaAction,
  type MediaActionId,
} from "@/components/media/UniversalMediaSource";
import {
  makeMediaItem,
  previewSrc,
  useMediaBank,
  type MediaItem,
} from "@/components/media/mediaItem";

const EDITORIAL_MEDIA_ACTIONS: MediaAction[] = [
  { id: "attach-source", label: "Add to Story Context", primary: true },
  { id: "main-image", label: "Use as Reference Image" },
];

interface TabContentProps {
  verticalId: string;
}

interface NewsroomDraftEntry {
  prompt: string;
  role: Role;
  tone: Tone;
  platform: Platform;
}

const NEWSROOM_DRAFT_KEY = "hmg-newsroom-draft-v1";

const CORPUS_API_BASE = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");

/**
 * Zero-paid corpus retriever for the editorial modules. Grounds Quick (Editorial)
 * and Breaking generations on real founder-ingested passages, rendered as visible
 * citations. Returns null on any failure so generation degrades to ungrounded —
 * never faked sources.
 */
const retrieveCorpus = createCorpusRetriever(CORPUS_API_BASE);

function siloDraftKey(siloId: string) {
  return `${NEWSROOM_DRAFT_KEY}::${siloId}`;
}

const EMPTY_DRAFT: NewsroomDraftEntry = {
  prompt: "",
  role: "managing_editor",
  tone: "professional",
  platform: "website",
};

export function TabContent({ verticalId }: TabContentProps) {
  const vertical = verticals.find((v) => v.id === verticalId)!;

  const [draft, setDraft, clearDraft] = useDraft<NewsroomDraftEntry>(
    siloDraftKey(verticalId),
    EMPTY_DRAFT,
  );
  const prompt = draft.prompt;
  const role = draft.role;
  const tone = draft.tone;
  const platform = draft.platform;
  const setPrompt = (v: string) => setDraft((p) => ({ ...p, prompt: v }));
  const setRole = (v: Role) => setDraft((p) => ({ ...p, role: v }));
  const setTone = (v: Tone) => setDraft((p) => ({ ...p, tone: v }));
  const setPlatform = (v: Platform) => setDraft((p) => ({ ...p, platform: v }));

  const [draftSaved, setDraftSaved] = useState<boolean>(() =>
    hasDraft(siloDraftKey(verticalId)),
  );
  useEffect(() => {
    const interval = setInterval(
      () => setDraftSaved(hasDraft(siloDraftKey(verticalId))),
      800,
    );
    return () => clearInterval(interval);
  }, [verticalId]);

  const [result, setResult] = useState<Result | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useCorpus, setUseCorpus] = useState(true);
  const [grounding, setGrounding] = useState<GroundedPromptResult | null>(null);
  // Per-section retry tracking for the Pack output. Only one section can be
  // retrying at a time; the full-pack mutation is re-used and only the named
  // section is merged back into existing result so prior successful sections
  // are preserved.
  const [retryingSection, setRetryingSection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [sources, setSources] = useState<MediaItem[]>([]);
  const mediaBank = useMediaBank();
  const { history, addPrompt, removePrompt, clearHistory } =
    usePromptHistory(verticalId);
  const [founderVoice] = useFounderVoice(verticalId as ApiSilo);

  const lastPromptRef = useRef("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MEDIA_LIMITS.imageMaxBytes) {
      toast.error(`Image must be under ${formatBytes(MEDIA_LIMITS.imageMaxBytes)}.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(typeof ev.target?.result === "string" ? ev.target.result : null);
    };
    reader.readAsDataURL(file);
  };

  const handleMediaPick = (item: MediaItem, action: MediaActionId) => {
    if (action === "main-image") {
      const src = previewSrc(item);
      if (!src) {
        toast.error("This asset has no usable image — re-select the file.");
        return;
      }
      setImage(src);
      toast.success("Set as reference image");
      return;
    }
    // attach-source: keep as story context + fold into the prompt
    setSources((prev) =>
      prev.some((p) => p.id === item.id) ? prev : [...prev, item],
    );
    const line = `Source: ${item.title}${item.sourceUrl ? ` — ${item.sourceUrl}` : ""}`;
    setPrompt(prompt.trim() ? `${prompt.trim()}\n${line}` : line);
    recordAudit("article-edited", verticalId, `Attached source: ${item.title}`);
    toast.success("Source added to story context");
  };

  const sendImageToArtBot = () => {
    if (!image) return;
    mediaBank.add(
      makeMediaItem({
        mediaType: "image",
        sourceType: "saved_asset",
        title: `${vertical.name} editorial reference`,
        dataUrl: image,
        brand: verticalId,
        rightsStatus: "user-supplied",
        tags: ["editorial", verticalId],
      }),
    );
    toast.success("Saved to Media Library — open WebArt and add saved media");
  };

  const clearImage = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const generateMutation = useGenerateContent();
  const packMutation = useGeneratePack();
  const { enabled: safeMode } = useSafeMode();

  const isGenerating = generateMutation.isPending || packMutation.isPending;
  const isPackPending = packMutation.isPending;

  const brand = {
    bg: vertical.accentBg,
    on: vertical.onAccent,
    color: vertical.color,
  };

  const handleQuickGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    if (safeMode) {
      recordSafeModeBlock("ai-call", `TabContent/quick/${verticalId}`);
      toast.error("Safe Mode is on — AI calls disabled.");
      return;
    }
    const dedupeKey = dedupeKeyOf("quick", verticalId, role, tone, platform, prompt);
    if (isAlreadyRunning({ kind: "text-ai", dedupeKey })) {
      toast.message("Already running");
      return;
    }
    setResult(null);
    setGrounding(null);
    addPrompt(prompt);
    lastPromptRef.current = prompt;

    // Zero-paid corpus grounding: prepend real founder-ingested passages to the
    // prompt and surface them as citations. Honest no-op when nothing matches.
    const ground = useCorpus
      ? await buildGroundedPrompt(
          retrieveCorpus,
          { query: prompt, module: "editorial-quick", limit: 6 },
          prompt,
        )
      : null;
    setGrounding(ground);
    const promptToSend = ground?.prompt ?? prompt;

    const jobId = startJob({
      kind: "text-ai",
      silo: verticalId,
      summary: `Quick ${role}/${tone}/${platform}`,
      operator: getOperatorInitials() || null,
    });
    try {
      const data = await enqueue({ kind: "text-ai", dedupeKey }, () =>
        runThroughBreaker("ai-text", () =>
          generateMutation.mutateAsync({
            data: {
              silo: verticalId as ApiSilo,
              role: role as ApiRole,
              tone: tone as ApiTone,
              platform: platform as ApiPlatform,
              prompt: promptToSend,
              image: image ?? undefined,
              founderVoice,
            },
          }),
        ),
      );
      setResult({ kind: "quick", platform, data });
      if ((data as { fallback?: boolean }).fallback) {
        toast.message("Draft built with the Haven Writing Desk.");
      }
      recordUsage(verticalId, "generate-quick");
      recordAudit(
        "article-created",
        verticalId,
        `Quick: ${role}/${tone}/${platform} (prompt ${prompt.length}c)`,
      );
      recordOutput({
        silo: verticalId,
        siloName: vertical.name,
        kind: "quick",
        prompt,
        role,
        tone,
        platform,
        output: data,
      });
      completeJob(jobId, { status: "success" });
    } catch (err) {
      completeJob(jobId, { status: "failure", error: err });
      if (err instanceof DuplicateJobError) {
        toast.message("Already running");
      } else if (err instanceof CircuitOpenError) {
        toast.error("AI is cooling down after repeated failures. Try again shortly.");
      } else {
        toast.error("Failed to generate content.");
      }
    }
  };

  const handleBreakingGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    if (safeMode) {
      recordSafeModeBlock("ai-call", `TabContent/pack/${verticalId}`);
      toast.error("Safe Mode is on — AI calls disabled.");
      return;
    }
    const dedupeKey = dedupeKeyOf("pack", verticalId, role, tone, useWebSearch, prompt);
    if (isAlreadyRunning({ kind: "text-ai", dedupeKey })) {
      toast.message("Already running");
      return;
    }
    setResult(null);
    setGrounding(null);
    addPrompt(prompt);
    lastPromptRef.current = prompt;

    // Zero-paid corpus grounding for Breaking source recall (honest no-op when
    // nothing matches; never fabricates sources).
    const ground = useCorpus
      ? await buildGroundedPrompt(
          retrieveCorpus,
          { query: prompt, module: "breaking-pack", limit: 6 },
          prompt,
        )
      : null;
    setGrounding(ground);
    const promptToSend = ground?.prompt ?? prompt;

    const jobId = startJob({
      kind: "text-ai",
      silo: verticalId,
      summary: `Pack ${role}/${tone}`,
      operator: getOperatorInitials() || null,
    });
    try {
      const data = await enqueue({ kind: "text-ai", dedupeKey }, () =>
        runThroughBreaker("ai-text", () =>
          packMutation.mutateAsync({
            data: {
              silo: verticalId as ApiSilo,
              role: role as ApiRole,
              tone: tone as ApiTone,
              prompt: promptToSend,
              image: image ?? undefined,
              useWebSearch,
              founderVoice,
            },
          }),
        ),
      );
      setResult({ kind: "pack", data });
      if ((data as { fallback?: boolean }).fallback) {
        toast.message("Draft built with the Haven Writing Desk.");
      }
      recordUsage(verticalId, "generate-pack");
      recordAudit(
        "article-created",
        verticalId,
        `Breaking pack: ${role}/${tone} (prompt ${prompt.length}c)`,
      );
      recordOutput({
        silo: verticalId,
        siloName: vertical.name,
        kind: "pack",
        prompt,
        role,
        tone,
        output: data,
      });
      completeJob(jobId, { status: "success" });
    } catch (err) {
      completeJob(jobId, { status: "failure", error: err });
      if (err instanceof DuplicateJobError) {
        toast.message("Already running");
      } else if (err instanceof CircuitOpenError) {
        toast.error("AI is cooling down after repeated failures. Try again shortly.");
      } else {
        toast.error("Failed to generate Breaking pack.");
      }
    }
  };

  // Re-run the full pack and merge only the requested section into the
  // existing result. Successful sections from prior calls are preserved so
  // the operator never loses good work.
  const handleRetrySection = async (sectionId: string) => {
    if (!result || result.kind !== "pack") return;
    if (retryingSection) return;
    if (safeMode) {
      recordSafeModeBlock("ai-call", `TabContent/pack-retry/${verticalId}`);
      toast.error("Safe Mode is on — AI calls disabled.");
      return;
    }
    const dedupeKey = dedupeKeyOf(
      "pack-section",
      verticalId,
      role,
      tone,
      useWebSearch,
      sectionId,
      lastPromptRef.current,
    );
    if (isAlreadyRunning({ kind: "text-ai", dedupeKey })) {
      toast.message("Already running");
      return;
    }
    setRetryingSection(sectionId);
    const jobId = startJob({
      kind: "text-ai",
      silo: verticalId,
      summary: `Pack section retry: ${sectionId}`,
      operator: getOperatorInitials() || null,
    });
    try {
      const fresh = await enqueue({ kind: "text-ai", dedupeKey }, () =>
        runThroughBreaker("ai-text", () =>
          packMutation.mutateAsync({
            data: {
              silo: verticalId as ApiSilo,
              role: role as ApiRole,
              tone: tone as ApiTone,
              prompt: lastPromptRef.current,
              image: image ?? undefined,
              useWebSearch,
              founderVoice,
            },
          }),
        ),
      );
      setResult((prev) => {
        if (!prev || prev.kind !== "pack") return prev;
        const merged = { ...prev.data };
        switch (sectionId) {
          case "headlines":
            if (fresh.headline?.trim()) merged.headline = fresh.headline;
            if (fresh.summary?.trim()) merged.summary = fresh.summary;
            break;
          case "article":
            if (fresh.article?.trim()) merged.article = fresh.article;
            break;
          case "seo":
            merged.seo = {
              ...prev.data.seo,
              metaDescription:
                fresh.seo?.metaDescription?.trim() ||
                prev.data.seo.metaDescription,
              categories:
                fresh.seo?.categories && fresh.seo.categories.length > 0
                  ? fresh.seo.categories
                  : prev.data.seo.categories,
            };
            break;
          case "social":
            merged.social = {
              x: fresh.social?.x?.trim() || prev.data.social.x,
              instagram:
                fresh.social?.instagram?.trim() || prev.data.social.instagram,
              tiktok: fresh.social?.tiktok?.trim() || prev.data.social.tiktok,
              newsletter:
                fresh.social?.newsletter?.trim() || prev.data.social.newsletter,
              youtube: fresh.social?.youtube?.trim() || prev.data.social.youtube,
            };
            break;
          case "image":
            if (fresh.imagePrompts && fresh.imagePrompts.length > 0) {
              merged.imagePrompts = fresh.imagePrompts;
            }
            break;
          case "hashtags":
            merged.seo = {
              ...merged.seo,
              tags:
                fresh.seo?.tags && fresh.seo.tags.length > 0
                  ? fresh.seo.tags
                  : prev.data.seo.tags,
            };
            break;
          default:
            break;
        }
        return { kind: "pack", data: merged };
      });
      recordAudit(
        "article-edited",
        verticalId,
        `Pack section retry: ${sectionId}`,
      );
      completeJob(jobId, { status: "success" });
      toast.success("Section refreshed");
    } catch (err) {
      completeJob(jobId, { status: "failure", error: err });
      if (err instanceof DuplicateJobError) {
        toast.message("Already running");
      } else if (err instanceof CircuitOpenError) {
        toast.error("AI is cooling down. Try again shortly.");
      } else {
        toast.error("Section retry failed.");
      }
    } finally {
      setRetryingSection(null);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10);
    const timePart = now.toTimeString().slice(0, 5).replace(":", "");
    const modeSlug =
      result.kind === "pack"
        ? "breaking"
        : platformLabel(result.platform).toLowerCase();
    const filename = `${vertical.id}-${modeSlug}-${datePart}-${timePart}.md`;

    const body =
      result.kind === "pack"
        ? packToMarkdown(result.data)
        : quickToMarkdown(result.data, result.platform);

    const header = [
      `# ${vertical.name}`,
      ``,
      `_${role === "managing_editor" ? "Managing Editor" : "Staff Writer"} · ${tone} · ${result.kind === "pack" ? "Breaking Mode" : platformLabel(result.platform)}_`,
      `_Created: ${now.toLocaleString()}_`,
      ``,
      `**Prompt:** ${lastPromptRef.current}`,
      ``,
      `---`,
      ``,
      body,
    ].join("\n");

    const blob = new Blob([header], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Downloaded", {
      style: { background: brand.bg, color: brand.on, border: "none" },
      icon: <Download className="w-4 h-4" style={{ color: brand.on }} />,
    });
  };

  const handleCopyAll = () => {
    if (!result) return;
    const text =
      result.kind === "pack"
        ? packToMarkdown(result.data)
        : quickToMarkdown(result.data, result.platform);
    copyText(text, { ...brand, label: "everything" });
  };

  const isDisabled = isGenerating || !prompt.trim() || safeMode;
  // PLATFORM_OPTIONS used by PlatformGroup; surface it here so refactor reads
  // identical to the legacy single-file version.
  void PLATFORM_OPTIONS;

  return (
    <div
      className="flex flex-col h-full space-y-4 pt-4"
      style={
        {
          "--brand": vertical.color,
          "--brand-bg": vertical.accentBg,
          "--brand-on": vertical.onAccent,
        } as React.CSSProperties
      }
    >
      {/* Tagline */}
      <div className="px-1 pb-1">
        <p className="text-xs text-muted-foreground/80 italic leading-relaxed">
          {vertical.tagline}
        </p>
      </div>

      {/*
       * Integration: the legacy Quick/Pack Role/Tone/Format pills are now
       * hidden because Editorial Desk (mounted below) is the single editorial
       * flow per the integration spec — it has Article Type / Tone / Role
       * built into its own panel. The state stays so any historical drafts
       * and the legacy Quick output card keep their shape; only the duplicate
       * UI is hidden.
       */}
      <div hidden aria-hidden="true" data-testid="legacy-quick-pills">
        <div className="space-y-2">
          <PillGroup
            label="Role"
            options={ROLE_OPTIONS}
            value={role}
            onChange={(v) => setRole(v as Role)}
            disabled={isGenerating}
            brand={brand}
          />
          <PillGroup
            label="Tone"
            options={TONE_OPTIONS}
            value={tone}
            onChange={(v) => setTone(v as Tone)}
            disabled={isGenerating}
            brand={brand}
          />
          <PlatformGroup
            value={platform}
            onChange={setPlatform}
            disabled={isGenerating}
            brand={brand}
          />
        </div>
      </div>

      {/* Work toolbar — kept in the active work zone, above the story input */}
      <div className="flex items-center flex-wrap gap-2">
        {draftSaved && (
          <button
            type="button"
            onClick={() => {
              clearDraft();
              setDraftSaved(false);
              toast.message("Draft cleared");
            }}
            data-testid={`tabcontent-clear-draft-${verticalId}`}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-border hover:border-foreground/50"
          >
            <Eraser className="w-3.5 h-3.5" />
            Clear draft
          </button>
        )}
        {image ? (
          <div className="relative inline-block">
            <img
              src={image}
              alt="Reference"
              className="h-14 w-14 object-cover rounded-md border border-border"
            />
            <button
              onClick={clearImage}
              className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5 hover:bg-muted"
              aria-label="Remove image"
              type="button"
            >
              <X className="w-2.5 h-2.5" />
            </button>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] uppercase font-bold tracking-wider px-1 rounded bg-background border border-border">
              attached
            </span>
            <button
              onClick={sendImageToArtBot}
              type="button"
              data-testid={`tabcontent-send-artbot-${verticalId}`}
              title="Save to Media Library for WebArt"
              className="absolute -top-1.5 -left-1.5 bg-background border border-border rounded-full px-1.5 py-0.5 text-[8px] font-bold hover:bg-muted"
            >
              → Art
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            type="button"
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-border hover:border-foreground/50 transition-colors disabled:opacity-50"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            Attach image
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        <button
          onClick={() => setMediaOpen(true)}
          disabled={isGenerating}
          type="button"
          data-testid={`tabcontent-attach-source-${verticalId}`}
          className="text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-border hover:border-foreground/50 transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-3.5 h-3.5" />
          Attach source
        </button>

        {founderVoice && (
          <span
            data-testid={`tabcontent-founder-voice-${verticalId}`}
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border"
            style={{
              borderColor: vertical.color,
              color: vertical.color,
              background: "transparent",
            }}
            title="Founder Voice (Trent Clark Mode) is active for this silo"
          >
            Founder Voice ON
          </span>
        )}
      </div>

      <JetFirePanel
        brandId={verticalId}
        modes={["editorial", "breaking", "social"]}
        defaultMode="editorial"
        title="Editorial Desk"
        className="mb-3"
        liveWebOn={useWebSearch}
        corpusReady={useCorpus}
      />

      {/*
       * Integration: Editorial Desk (above) owns the research input. The
       * legacy free-form prompt textarea is kept hidden so any saved-draft
       * prompts and prompt-history entries still load, but the duplicate
       * editorial surface is gone from the founder UI.
       */}
      <div hidden aria-hidden="true" data-testid="legacy-quick-textarea">
        <div className="relative group">
          <Textarea
            placeholder={vertical.placeholder}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            className="min-h-[120px] resize-none bg-secondary/40 border-border focus-visible:ring-1 focus-visible:ring-[var(--brand)] text-base p-4 rounded-xl placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {sources.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5"
          data-testid={`tabcontent-sources-${verticalId}`}
        >
          {sources.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-2.5 py-1 text-[10px] font-semibold text-foreground"
            >
              <Paperclip className="w-3 h-3 text-muted-foreground" />
              <span className="max-w-[140px] truncate">{s.title}</span>
              <button
                type="button"
                onClick={() => setSources((prev) => prev.filter((p) => p.id !== s.id))}
                aria-label="Remove source"
                className="text-muted-foreground hover:text-foreground"
              >
                <XIcon className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {safeMode && (
        <p
          data-testid={`tabcontent-safe-mode-note-${verticalId}`}
          className="text-[11px] text-amber-300"
        >
          Safe Mode is on — AI calls disabled.
        </p>
      )}

      <UniversalMediaSource
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        context="editorial"
        brand={{ id: verticalId, color: brand.color, on: brand.on }}
        actions={EDITORIAL_MEDIA_ACTIONS}
        onPick={handleMediaPick}
        accept="all"
      />

      {/*
       * Integration: Editorial Desk owns the Create Article Draft / Create
       * Breaking Story / Create Social Posts actions. These legacy buttons are
       * hidden so the founder never sees two competing builders, but the
       * mutations stay intact so any historical Quick / Pack output still
       * renders cleanly below.
       */}
      <div hidden aria-hidden="true" data-testid="legacy-quick-actions">
        <div className="flex items-stretch gap-2">
          <Button
            onClick={handleQuickGenerate}
            disabled={isDisabled}
            className="flex-1 rounded-full font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-0 h-11"
            style={{
              background: isDisabled ? "hsl(var(--muted))" : vertical.accentBg,
              color: isDisabled
                ? "hsl(var(--muted-foreground))"
                : vertical.onAccent,
            }}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating draft...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Create Article Draft
              </>
            )}
          </Button>
          <Button
            onClick={handleBreakingGenerate}
            disabled={isDisabled}
            variant="outline"
            className="rounded-full font-semibold border h-11 px-4"
            style={{
              borderColor: vertical.color,
              color: vertical.color,
            }}
          >
            {isPackPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {useWebSearch ? "Pulling fresh sources..." : "Creating breaking story..."}
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Create Breaking Story
              </>
            )}
          </Button>
        </div>
      </div>

      <HistoryDock
        history={history}
        isGenerating={isGenerating}
        onPick={setPrompt}
        onRemove={removePrompt}
        onClear={clearHistory}
      />

      {founderVoice && (
        <FounderVoiceCheck
          brandColor={vertical.color}
          siloName={vertical.name}
          storageKey={`hmg-founder-voice-check::${verticalId}`}
          instanceId={`tab-${verticalId}`}
        />
      )}

      {/* Output */}
      <div className="flex-1 flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Output
          </h3>
          <AnimatePresence>
            {result && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAll}
                  className="h-8 px-3 text-xs hover:bg-[var(--brand)]/10 rounded-full"
                  style={{ color: vertical.color }}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-8 px-3 text-xs hover:bg-[var(--brand)]/10 rounded-full"
                  style={{ color: vertical.color }}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 relative rounded-xl border border-border/50 bg-secondary/20 overflow-hidden">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground space-y-4"
              >
                <Loader2
                  className="w-8 h-8 animate-spin"
                  style={{ color: vertical.color }}
                />
                <p
                  className="text-sm font-medium animate-pulse"
                  style={{ color: vertical.color }}
                >
                  {isPackPending
                    ? "Creating full article draft..."
                    : "Creating..."}
                </p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 p-4 overflow-y-auto space-y-3"
              >
                {(() => {
                  const meta = result.data as {
                    fallback?: boolean;
                    notice?: string;
                  };
                  if (!meta.fallback) return null;
                  return (
                    <div
                      data-testid="editorial-fallback-notice"
                      className="flex items-center gap-2 rounded-lg border bg-secondary/30 px-3 py-2 text-xs text-foreground/80"
                      style={{ borderColor: `${vertical.color}55` }}
                    >
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0"
                        style={{ background: vertical.color, color: brand.on }}
                      >
                        <Sparkles className="w-3 h-3" />
                        Haven Desk
                      </span>
                      <span className="flex-1">
                        {meta.notice ??
                          "Draft ready — fact-check and add a quote before manual publish."}
                      </span>
                    </div>
                  );
                })()}
                {result.kind === "quick" ? (
                  <QuickOutput
                    result={result}
                    brand={brand}
                    silo={verticalId as ApiSilo}
                    siloName={vertical.name}
                    promptText={lastPromptRef.current}
                    onUpdateContent={(next) =>
                      setResult((prev) =>
                        prev && prev.kind === "quick"
                          ? {
                              ...prev,
                              data: { ...prev.data, content: next },
                            }
                          : prev,
                      )
                    }
                  />
                ) : (
                  <PackOutput
                    result={result}
                    brand={brand}
                    silo={verticalId as ApiSilo}
                    siloName={vertical.name}
                    retryingSection={retryingSection}
                    onRetrySection={handleRetrySection}
                    founderVoiceOn={founderVoice}
                    onUpdateArticle={(next) =>
                      setResult((prev) =>
                        prev && prev.kind === "pack"
                          ? {
                              ...prev,
                              data: { ...prev.data, article: next },
                            }
                          : prev,
                      )
                    }
                  />
                )}
                {grounding && (
                  <CorpusCitations
                    usedCorpus={grounding.usedCorpus}
                    note={grounding.note}
                    citations={grounding.citations}
                    testIdPrefix={`tabcontent-corpus-${verticalId}`}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 p-6 text-center"
              >
                <Sparkles className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm max-w-[280px]">
                  Paste research above, pick a tone & format, then tap{" "}
                  <span
                    className="font-semibold"
                    style={{ color: vertical.color }}
                  >
                    Create Article Draft
                  </span>{" "}
                  for the full editorial draft, or{" "}
                  <span
                    className="font-semibold"
                    style={{ color: vertical.color }}
                  >
                    Create Breaking Story
                  </span>{" "}
                  for the alert pack.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
