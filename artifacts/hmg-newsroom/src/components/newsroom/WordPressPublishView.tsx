import { useMemo, useState } from "react";
import { verticals } from "@/lib/mock-data";
import { useWPSettings } from "@/lib/useWPSettings";
import { useDraft } from "@/lib/useDraft";
import { recordOutput } from "@/lib/useOutputHistory";
import { recordSafeModeBlock, useSafeMode } from "@/lib/safeMode";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Globe,
  Hash,
  Image as ImageIcon,
  Loader2,
  Lock,
  Send,
  Settings,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Honest WordPress publish-preparation view.
 *
 * This view prepares an article package for WordPress publishing. It never
 * simulates a connection: if credentials are missing it says so, blocks the
 * draft/publish actions, and points the user to WP Connections. Secret
 * values (WP_URL / WP_USER / WP_APP_PASSWORD) are never displayed — only the
 * env-var names are shown as hints.
 */

interface ArticlePackage {
  headline: string;
  body: string;
}

interface VisualPackage {
  featuredImageUrl: string;
}

interface SocialPackage {
  captions: string;
}

interface SeoPackage {
  seoTitle: string;
  metaDescription: string;
  slug: string;
  tags: string;
}

const EMPTY_ARTICLE: ArticlePackage = { headline: "", body: "" };
const EMPTY_VISUAL: VisualPackage = { featuredImageUrl: "" };
const EMPTY_SOCIAL: SocialPackage = { captions: "" };
const EMPTY_SEO: SeoPackage = {
  seoTitle: "",
  metaDescription: "",
  slug: "",
  tags: "",
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function StatusBadge({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <span
      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${
        ok
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-zinc-700/40 text-muted-foreground"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="w-2.5 h-2.5" />
      ) : (
        <AlertCircle className="w-2.5 h-2.5" />
      )}
      {label}
    </span>
  );
}

function ChecklistItem({
  ok,
  label,
  hint,
}: {
  ok: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <li className="flex items-start gap-2 py-1">
      {ok ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
      )}
      <div className="min-w-0">
        <div
          className={`text-[12px] font-semibold ${
            ok ? "text-foreground/90" : "text-amber-300"
          }`}
        >
          {label}
        </div>
        {hint && !ok && (
          <div className="text-[10px] text-muted-foreground leading-snug mt-0.5">
            {hint}
          </div>
        )}
      </div>
    </li>
  );
}

export function WordPressPublishView({
  onSelectView,
}: {
  onSelectView?: (view: string) => void;
}) {
  const [selectedBrandId, setSelectedBrandId] = useState<string>(
    verticals[0]?.id ?? "",
  );
  const selectedBrand = useMemo(
    () =>
      verticals.find((v) => v.id === selectedBrandId) ?? verticals[0],
    [selectedBrandId],
  );

  const silo = selectedBrand?.id ?? "";
  const siloName = selectedBrand?.name ?? "Brand";
  const brand = {
    color: selectedBrand?.color ?? "#6366f1",
    bg: selectedBrand?.accentBg ?? selectedBrand?.color ?? "#6366f1",
    on: selectedBrand?.onAccent ?? "#ffffff",
  };

  const { creds } = useWPSettings(silo);
  const { enabled: safeMode } = useSafeMode();

  // Draft-persisted package state (plain JSON — no secrets ever stored here).
  const [article, setArticle] = useDraft<ArticlePackage>(
    `wp-publish::${silo}::article`,
    EMPTY_ARTICLE,
  );
  const [visual, setVisual] = useDraft<VisualPackage>(
    `wp-publish::${silo}::visual`,
    EMPTY_VISUAL,
  );
  const [social, setSocial] = useDraft<SocialPackage>(
    `wp-publish::${silo}::social`,
    EMPTY_SOCIAL,
  );
  const [seo, setSeo] = useDraft<SeoPackage>(
    `wp-publish::${silo}::seo`,
    EMPTY_SEO,
  );

  const [creatingDraft, setCreatingDraft] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastDraft, setLastDraft] = useState<{
    title: string;
    slug: string;
    createdAt: number;
  } | null>(null);

  // Connection truth: creds must exist with a non-empty url AND user.
  const connected =
    !!creds && !!creds.url.trim() && !!creds.user.trim();
  const looksLikeUrl = /^https?:\/\//i.test(creds?.url ?? "");

  // Derived readiness flags.
  const hasHeadline = article.headline.trim().length > 0;
  const hasBody = article.body.trim().length > 0;
  const hasSeoTitle = seo.seoTitle.trim().length > 0;
  const hasMetaDescription = seo.metaDescription.trim().length > 0;
  const hasSlug = (seo.slug.trim() || slugify(article.headline)).length > 0;
  const hasTags = seo.tags.trim().length > 0;
  const hasFeaturedImage = visual.featuredImageUrl.trim().length > 0;
  const hasSocial = social.captions.trim().length > 0;

  const effectiveSlug = seo.slug.trim() || slugify(article.headline);

  const checklist = [
    {
      ok: !!selectedBrand,
      label: "Haven brand selected",
      hint: "Pick a brand at the top of this view.",
    },
    {
      ok: connected,
      label: "Site connected",
      hint: "Connect this brand in WP Connections (url + user + app password).",
    },
    {
      ok: hasBody,
      label: "Article body present",
      hint: "Paste the article body into the article package textarea.",
    },
    {
      ok: hasHeadline,
      label: "Headline present",
      hint: "Paste or type the article headline.",
    },
    {
      ok: hasSeoTitle,
      label: "SEO title set",
      hint: "Add an SEO title in the SEO & metadata section.",
    },
    {
      ok: hasFeaturedImage,
      label: "Featured image set",
      hint: "Paste a featured image URL in the visual package section.",
    },
    {
      ok: hasSocial,
      label: "Social package ready",
      hint: "Paste social captions in the social package section.",
    },
  ];
  const readyCount = checklist.filter((c) => c.ok).length;
  const allReady = readyCount === checklist.length;

  function handleCreateDraft() {
    if (!connected) {
      toast.error("WordPress is not connected — add credentials first.");
      return;
    }
    if (!hasHeadline || !hasBody) {
      toast.error("Add a headline and article body before creating a draft.");
      return;
    }
    if (safeMode) {
      recordSafeModeBlock("wordpress-draft");
      toast.error("Safe Mode is on — draft creation is disabled.");
      return;
    }
    setCreatingDraft(true);
    try {
      // Record the prepared draft into output history. This is a local
      // breadcrumb only — it does NOT publish to WordPress. The draft payload
      // is the package the operator assembled here.
      const draftPayload = {
        silo,
        siloName,
        headline: article.headline.trim(),
        bodyPreview: article.body.trim().slice(0, 280),
        bodyLength: article.body.trim().length,
        slug: effectiveSlug,
        seoTitle: seo.seoTitle.trim(),
        metaDescription: seo.metaDescription.trim(),
        tags: seo.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        featuredImageUrl: visual.featuredImageUrl.trim(),
        socialCaptions: social.captions.trim(),
        status: "draft-prepared",
        connectedSite: creds?.url ?? null,
      };
      recordOutput({
        silo,
        siloName,
        kind: "wordpress-draft",
        prompt: `Prepare WordPress draft: ${article.headline.trim()}`,
        output: draftPayload,
      });
      setLastDraft({
        title: article.headline.trim(),
        slug: effectiveSlug,
        createdAt: Date.now(),
      });
      toast.success(`Draft package prepared for ${siloName}`, {
        style: { background: brand.bg, color: brand.on, border: "none" },
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not prepare draft.",
      );
    } finally {
      setCreatingDraft(false);
    }
  }

  function handlePublish() {
    if (!connected) {
      toast.error("WordPress is not connected — cannot publish.");
      return;
    }
    if (safeMode) {
      recordSafeModeBlock("wordpress-publish");
      toast.error("Safe Mode is on — publish actions are disabled.");
      return;
    }
    if (!hasHeadline || !hasBody) {
      toast.error("Add a headline and article body before publishing.");
      return;
    }
    setPublishing(true);
    try {
      // Honest: we do NOT push to WordPress from this view. This is the
      // publish-preparation flow. The operator must open the prepared draft
      // in WordPress and click Publish there. We record the intent and point
      // them to their connected site.
      recordOutput({
        silo,
        siloName,
        kind: "wordpress-draft",
        prompt: `Publish intent: ${article.headline.trim()}`,
        output: {
          silo,
          siloName,
          headline: article.headline.trim(),
          slug: effectiveSlug,
          status: "publish-intent-recorded",
          note: "Operator confirmed publish intent. Open the draft in WordPress to publish.",
          connectedSite: creds?.url ?? null,
        },
      });
      toast.success(
        `Publish intent recorded for ${siloName}. Open the draft in WordPress to publish.`,
        {
          description: creds?.url
            ? `Connected site: ${creds.url}`
            : undefined,
          style: { background: brand.bg, color: brand.on, border: "none" },
        },
      );
      setConfirmPublish(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not record publish intent.",
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: brand.bg, color: brand.on }}
        >
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-black tracking-tight leading-none">
            WordPress Publish Prep
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            Assemble the article, visual, social, and SEO packages — then
            prepare a draft for your connected WordPress site.
          </p>
        </div>
      </div>

      {/* Brand selector */}
      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          Haven Brand
        </div>
        <div className="flex flex-wrap gap-1.5">
          {verticals.map((v) => {
            const active = v.id === selectedBrandId;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedBrandId(v.id)}
                data-testid={`wp-publish-brand-${v.id}`}
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all ${
                  active
                    ? "border-transparent text-foreground"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
                style={
                  active
                    ? {
                        background: v.accentBg || v.color,
                        color: v.onAccent,
                      }
                    : undefined
                }
              >
                {v.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Connected-site summary */}
      <div
        className="rounded-xl border border-border/60 bg-secondary/20 p-3 mb-3"
        data-testid="wp-publish-site-summary"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Globe
              className="w-4 h-4 flex-shrink-0"
              style={{ color: brand.color }}
            />
            <div className="min-w-0">
              <div className="text-[12px] font-bold uppercase tracking-wide truncate">
                {siloName}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {connected
                  ? creds?.url
                  : "WordPress Not Connected"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <StatusBadge ok={connected} label={connected ? "Connected" : "Off"} />
            {connected && !looksLikeUrl && (
              <StatusBadge ok={false} label="URL looks invalid" />
            )}
          </div>
        </div>

        {/* Env-var hints — names only, NEVER values */}
        <div className="mt-2 pt-2 border-t border-border/40">
          <div className="text-[10px] text-muted-foreground leading-snug">
            Credentials resolve from browser-saved settings or the server env
            vars{" "}
            <span className="font-mono text-foreground/80">WP_URL</span>,{" "}
            <span className="font-mono text-foreground/80">WP_USER</span>, and{" "}
            <span className="font-mono text-foreground/80">WP_APP_PASSWORD</span>
            . Values are never displayed here.
          </div>
        </div>
      </div>

      {/* Blocked state when credentials are missing */}
      {!connected && (
        <div
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 mb-3 space-y-2"
          data-testid="wp-publish-blocked"
        >
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-amber-400">
            <ShieldAlert className="w-4 h-4" />
            WordPress Not Connected
          </div>
          <p className="text-[11px] text-foreground/80 leading-snug">
            Draft and publish actions are blocked until this brand has a
            connected WordPress site. Add the site URL, username, and an
            application password in WP Connections.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-[11px] border-amber-500/50 text-amber-300 hover:bg-amber-500/10"
            onClick={() => onSelectView?.("wpconnections")}
            data-testid="wp-publish-goto-connections"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" />
            Connect in WP Connections
          </Button>
        </div>
      )}

      {/* Safe-mode banner */}
      {safeMode && (
        <div
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 mb-3 text-[11px] font-semibold text-amber-700 dark:text-amber-200 inline-flex items-center gap-1.5"
          data-testid="wp-publish-safe-mode-banner"
        >
          <Lock className="w-3.5 h-3.5" />
          Safe Mode is on — draft and publish actions are disabled.
        </div>
      )}

      {/* Article package */}
      <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 mb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/90">
            <FileText className="w-3.5 h-3.5" />
            Article Package
          </div>
          <StatusBadge ok={hasHeadline && hasBody} label="Ready" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Headline
          </label>
          <textarea
            value={article.headline}
            onChange={(e) =>
              setArticle({ ...article, headline: e.target.value })
            }
            placeholder="Paste the article headline here"
            rows={1}
            className="w-full rounded-md border border-border/60 bg-secondary/60 px-2 py-1.5 text-[12px] resize-y focus:outline-none focus:ring-1 focus:ring-foreground/30"
            data-testid="wp-publish-headline"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Article body (paste-in)
          </label>
          <textarea
            value={article.body}
            onChange={(e) => setArticle({ ...article, body: e.target.value })}
            placeholder="Paste the full article body (HTML or plain text) here"
            rows={6}
            className="w-full rounded-md border border-border/60 bg-secondary/60 px-2 py-1.5 text-[12px] font-mono resize-y focus:outline-none focus:ring-1 focus:ring-foreground/30"
            data-testid="wp-publish-body"
          />
          <div className="text-[10px] text-muted-foreground">
            {article.body.trim().length} chars
          </div>
        </div>
      </div>

      {/* Visual package */}
      <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 mb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/90">
            <ImageIcon className="w-3.5 h-3.5" />
            Visual Package
          </div>
          <StatusBadge ok={hasFeaturedImage} label={hasFeaturedImage ? "Set" : "Not set"} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Featured image URL
          </label>
          <input
            type="url"
            value={visual.featuredImageUrl}
            onChange={(e) =>
              setVisual({ ...visual, featuredImageUrl: e.target.value })
            }
            placeholder="https://example.com/wp-content/uploads/featured.jpg"
            className="w-full h-9 rounded-md border border-border/60 bg-secondary/60 px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-foreground/30"
            data-testid="wp-publish-featured-image-url"
          />
          {hasFeaturedImage && (
            <div className="flex items-center gap-2 mt-1">
              <img
                src={visual.featuredImageUrl}
                alt="Featured preview"
                className="w-16 h-16 rounded-md object-cover border border-border/60"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <a
                href={visual.featuredImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-emerald-300 hover:text-emerald-200 truncate"
              >
                Open image
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Social package */}
      <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 mb-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/90">
            <Sparkles className="w-3.5 h-3.5" />
            Social Package
          </div>
          <StatusBadge ok={hasSocial} label={hasSocial ? "Ready" : "Empty"} />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Social captions (paste-in)
          </label>
          <textarea
            value={social.captions}
            onChange={(e) => setSocial({ ...social, captions: e.target.value })}
            placeholder={"Paste social captions here, one per line:\n\nFacebook: ...\nX: ...\nInstagram: ..."}
            rows={5}
            className="w-full rounded-md border border-border/60 bg-secondary/60 px-2 py-1.5 text-[12px] resize-y focus:outline-none focus:ring-1 focus:ring-foreground/30"
            data-testid="wp-publish-social-captions"
          />
        </div>
      </div>

      {/* SEO & metadata review */}
      <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 mb-3 space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/90">
          <Hash className="w-3.5 h-3.5" />
          SEO & Metadata Review
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            SEO title
          </label>
          <input
            type="text"
            value={seo.seoTitle}
            onChange={(e) => setSeo({ ...seo, seoTitle: e.target.value })}
            placeholder="SEO title (recommended ~60 chars)"
            className="w-full h-9 rounded-md border border-border/60 bg-secondary/60 px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-foreground/30"
            data-testid="wp-publish-seo-title"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Meta description
          </label>
          <textarea
            value={seo.metaDescription}
            onChange={(e) =>
              setSeo({ ...seo, metaDescription: e.target.value })
            }
            placeholder="Meta description (recommended ~155 chars)"
            rows={2}
            className="w-full rounded-md border border-border/60 bg-secondary/60 px-2 py-1.5 text-[12px] resize-y focus:outline-none focus:ring-1 focus:ring-foreground/30"
            data-testid="wp-publish-meta-description"
          />
          <div className="text-[10px] text-muted-foreground">
            {seo.metaDescription.trim().length} chars
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Slug
          </label>
          <input
            type="text"
            value={seo.slug}
            onChange={(e) => setSeo({ ...seo, slug: e.target.value })}
            placeholder={effectiveSlug || "auto-slug-from-headline"}
            className="w-full h-9 rounded-md border border-border/60 bg-secondary/60 px-2 text-[12px] font-mono focus:outline-none focus:ring-1 focus:ring-foreground/30"
            data-testid="wp-publish-slug"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={seo.tags}
            onChange={(e) => setSeo({ ...seo, tags: e.target.value })}
            placeholder="hip-hop, album-review, 2026"
            className="w-full h-9 rounded-md border border-border/60 bg-secondary/60 px-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-foreground/30"
            data-testid="wp-publish-tags"
          />
        </div>
      </div>

      {/* Featured-image state badge (standalone, per spec) */}
      <div
        className="rounded-xl border border-border/60 bg-secondary/20 p-3 mb-3 flex items-center justify-between"
        data-testid="wp-publish-featured-state"
      >
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/90">
          <ImageIcon className="w-3.5 h-3.5" />
          Featured Image State
        </div>
        <StatusBadge
          ok={hasFeaturedImage}
          label={hasFeaturedImage ? "Set" : "Not set"}
        />
      </div>

      {/* Draft / publish actions */}
      <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 mb-3 space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/90">
          <Send className="w-3.5 h-3.5" />
          Draft & Publish
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-[12px] font-semibold"
            disabled={!connected || safeMode || creatingDraft || !hasHeadline || !hasBody}
            onClick={handleCreateDraft}
            data-testid="wp-publish-create-draft"
          >
            {creatingDraft ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 mr-1.5" />
            )}
            Create Draft
          </Button>

          {/* Publish requires explicit confirmation toggle + second click */}
          <div className="space-y-1.5">
            <Button
              type="button"
              size="sm"
              className="w-full h-9 text-[12px] font-bold"
              style={{ background: brand.bg, color: brand.on }}
              disabled={
                !connected ||
                safeMode ||
                publishing ||
                !hasHeadline ||
                !hasBody ||
                !confirmPublish
              }
              onClick={handlePublish}
              data-testid="wp-publish-publish"
            >
              {publishing ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 mr-1.5" />
              )}
              Publish
            </Button>
            <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmPublish}
                onChange={(e) => setConfirmPublish(e.target.checked)}
                disabled={!connected || safeMode}
                className="w-3.5 h-3.5 rounded"
                data-testid="wp-publish-confirm-toggle"
              />
              I confirm this is ready to publish
            </label>
          </div>
        </div>

        {!confirmPublish && connected && !safeMode && (
          <p className="text-[10px] text-muted-foreground leading-snug">
            Toggle the confirmation checkbox above to enable the Publish button.
          </p>
        )}

        {lastDraft && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2.5 space-y-0.5">
            <div className="text-[11px] font-semibold text-emerald-400 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Draft package prepared
            </div>
            <div className="text-[12px] text-foreground/90 line-clamp-1">
              {lastDraft.title}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              /{lastDraft.slug}
            </div>
          </div>
        )}
      </div>

      {/* Readiness checklist */}
      <div
        className="rounded-xl border border-border/60 bg-secondary/20 p-3"
        data-testid="wp-publish-checklist"
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/90">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Readiness Checklist
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">
            {readyCount}/{checklist.length}
          </span>
        </div>
        <ul className="space-y-0.5">
          {checklist.map((item) => (
            <ChecklistItem
              key={item.label}
              ok={item.ok}
              label={item.label}
              hint={item.hint}
            />
          ))}
        </ul>
        {allReady ? (
          <div className="mt-2 pt-2 border-t border-border/40 text-[11px] text-emerald-300 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            All checks passed — package is ready.
          </div>
        ) : (
          <div className="mt-2 pt-2 border-t border-border/40 text-[11px] text-amber-300 inline-flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {checklist.length - readyCount} item(s) still need attention.
          </div>
        )}
      </div>
    </div>
  );
}
