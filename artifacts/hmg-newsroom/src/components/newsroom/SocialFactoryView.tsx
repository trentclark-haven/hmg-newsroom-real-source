import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { verticals } from "@/lib/mock-data";
import { type Silo as ApiSilo } from "@workspace/api-client-react";
import { SiloPicker } from "./SiloPicker";
import { CopyButton } from "@/components/hmg/CopyButton";
import { recordOutput } from "@/lib/useOutputHistory";
import { hasDraft, useDraft } from "@/lib/useDraft";
import { recordSafeModeBlock, useSafeMode } from "@/lib/safeMode";
import {
  Eraser,
  FileText,
  Hash,
  Image as ImageIcon,
  Instagram,
  Loader2,
  Megaphone,
  Music2,
  Save,
  Sparkles,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type SourceType = "article" | "webart" | "webedit" | "history";

type Tone = "Neutral" | "Sharp" | "Celebratory" | "Critical" | "Explanatory";

interface PlatformPack {
  platform: string;
  caption: string;
  hashtags: string[];
  altText: string;
  cta: string;
}

interface SocialDraft {
  silo: ApiSilo;
  sourceType: SourceType;
  articleSource: string;
  webartSource: string;
  webeditSource: string;
  historySource: string;
  prompt: string;
  tone: Tone;
  cta: string;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const DRAFT_KEY = "hmg-socialfactory-draft-v2";

const SOURCE_TYPES: {
  id: SourceType;
  label: string;
  icon: typeof FileText;
  placeholder: string;
}[] = [
  {
    id: "article",
    label: "Article",
    icon: FileText,
    placeholder:
      "Paste the article headline, dek, summary, angle, and source notes from Editorial Desk...",
  },
  {
    id: "webart",
    label: "WebArt",
    icon: ImageIcon,
    placeholder:
      "Paste the visual layout, headline overlay, asset credit, and alt-text notes from WebArt...",
  },
  {
    id: "webedit",
    label: "WebEdit",
    icon: Music2,
    placeholder:
      "Paste the hook, cut list, caption angle, thumbnail brief, and receipt notes from WebEdit...",
  },
  {
    id: "history",
    label: "Output History",
    icon: Hash,
    placeholder:
      "Paste a prior Output History entry (article, WP draft, or clip package) to remix into a social pack...",
  },
];

const TONES: Tone[] = [
  "Neutral",
  "Sharp",
  "Celebratory",
  "Critical",
  "Explanatory",
];

const PLATFORMS: {
  id: string;
  label: string;
  icon: typeof Instagram;
  limit: number;
}[] = [
  { id: "instagram", label: "Instagram", icon: Instagram, limit: 2200 },
  { id: "x", label: "X", icon: Hash, limit: 280 },
  { id: "facebook", label: "Facebook", icon: Megaphone, limit: 5000 },
  { id: "youtube", label: "YouTube", icon: Youtube, limit: 5000 },
  { id: "tiktok", label: "TikTok", icon: Music2, limit: 2200 },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtHashtags(tags: string[]): string {
  if (!tags.length) return "";
  return tags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
}

function deriveTopic(source: string, prompt: string, brandName: string): string {
  const firstLine = source.trim().split("\n")[0].trim();
  if (firstLine && firstLine.length <= 140) return firstLine;
  if (firstLine) return firstLine.slice(0, 137) + "...";
  const promptLine = prompt.trim().split("\n")[0].trim();
  if (promptLine) return promptLine.slice(0, 140);
  return `${brandName} update`;
}

function toneFlair(tone: Tone): string {
  switch (tone) {
    case "Sharp":
      return "Here is the part that actually matters.";
    case "Celebratory":
      return "This is a win worth sharing.";
    case "Critical":
      return "Here is what needs scrutiny.";
    case "Explanatory":
      return "Here is the clean breakdown of what happened.";
    case "Neutral":
    default:
      return "Here is the latest.";
  }
}

function buildLocalSocialPack(args: {
  source: string;
  prompt: string;
  tone: Tone;
  cta: string;
  brandName: string;
  brandTag: string;
}): Record<string, PlatformPack> {
  const { source, prompt, tone, cta, brandName, brandTag } = args;
  const topic = deriveTopic(source, prompt, brandName);
  const flair = toneFlair(tone);
  const defaultCta = cta.trim() || "Read the full story.";
  const baseTags = [brandTag, "#HMG", "#News", "#Culture"];
  const altBase = `Branded ${brandName} visual for the story "${topic}" with headline overlay and source-safe editorial treatment.`;

  const captionCore = `${topic}\n\n${flair}\n\n${prompt.trim() || ""}`.trim();

  const packs: Record<string, PlatformPack> = {
    instagram: {
      platform: "instagram",
      caption: `${captionCore}\n\nAttach the approved visual asset. Keep the first line short so it sits above the fold.`,
      hashtags: baseTags,
      altText: altBase,
      cta: defaultCta,
    },
    x: {
      platform: "x",
      caption: `${topic}\n\n${flair}`.slice(0, 280),
      hashtags: baseTags.slice(0, 2),
      altText: altBase,
      cta: defaultCta,
    },
    facebook: {
      platform: "facebook",
      caption: `${topic}\n\n${flair}\n\nWe pulled the article, visual, and clip notes together so the full context is easy to follow.`,
      hashtags: baseTags,
      altText: altBase,
      cta: defaultCta,
    },
    youtube: {
      platform: "youtube",
      caption: `${topic}\n\n${flair}\n\nUse the strongest short clip if available. Drop your take after watching.`,
      hashtags: baseTags,
      altText: altBase,
      cta: cta.trim() || "Watch, read, then comment.",
    },
    tiktok: {
      platform: "tiktok",
      caption: `${flair}\n\n${topic}`.slice(0, 2200),
      hashtags: ["#Shorts", "#Reels", "#TikTok", ...baseTags.slice(0, 2)],
      altText: altBase,
      cta: cta.trim() || "Follow for the next update.",
    },
  };

  return packs;
}

function packToText(id: string, p: PlatformPack): string {
  const parts: string[] = [`=== ${id.toUpperCase()} ===`];
  if (p.caption) parts.push(p.caption);
  if (p.cta) parts.push(`CTA: ${p.cta}`);
  const tags = fmtHashtags(p.hashtags);
  if (tags) parts.push(tags);
  if (p.altText) parts.push(`Alt text: ${p.altText}`);
  return parts.join("\n");
}

function loadLatestOutputHistoryContent(): string | null {
  try {
    const raw = window.localStorage.getItem("hmg-newsroom-output-history-v2");
    if (!raw) return null;
    const all = JSON.parse(raw) as Array<{
      kind: string;
      output: Record<string, unknown>;
      createdAt: number;
      siloName: string;
      prompt: string;
    }>;
    if (!Array.isArray(all) || !all.length) return null;
    const latest = all.sort((a, b) => b.createdAt - a.createdAt)[0];
    const o = latest.output ?? {};
    const content =
      typeof o.content === "string" ? o.content : JSON.stringify(o, null, 2);
    return `FROM OUTPUT HISTORY — ${latest.siloName}\n${content}`.slice(0, 1600);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export function SocialFactoryView({
  onSelectView,
}: {
  onSelectView?: (view: string) => void;
}) {
  const [draft, setDraft, clearDraft] = useDraft<SocialDraft>(DRAFT_KEY, {
    silo: verticals[0].id as ApiSilo,
    sourceType: "article",
    articleSource: "",
    webartSource: "",
    webeditSource: "",
    historySource: "",
    prompt: "",
    tone: "Neutral",
    cta: "",
  });

  const setSilo = (v: ApiSilo) => setDraft((p) => ({ ...p, silo: v }));
  const setSourceType = (v: SourceType) =>
    setDraft((p) => ({ ...p, sourceType: v }));
  const setSourceFor = (type: SourceType) => (v: string) =>
    setDraft((p) => ({
      ...p,
      [`${type}Source`]: v,
    }));
  const setPrompt = (v: string) => setDraft((p) => ({ ...p, prompt: v }));
  const setTone = (v: Tone) => setDraft((p) => ({ ...p, tone: v }));
  const setCta = (v: string) => setDraft((p) => ({ ...p, cta: v }));

  const [draftSaved, setDraftSaved] = useState<boolean>(() => hasDraft(DRAFT_KEY));
  useEffect(() => {
    const i = setInterval(() => setDraftSaved(hasDraft(DRAFT_KEY)), 800);
    return () => clearInterval(i);
  }, []);

  const [isPending, setIsPending] = useState(false);
  const [packs, setPacks] = useState<Record<string, PlatformPack> | null>(null);
  const [saved, setSaved] = useState(false);

  const { enabled: safeMode } = useSafeMode();
  const v = verticals.find((x) => x.id === draft.silo) ?? verticals[0];
  const brandColor = v.color;
  const brandTag = `#${v.name.replace(/\s+/g, "")}`;

  const activeSourceValue = useMemo(() => {
    switch (draft.sourceType) {
      case "article":
        return draft.articleSource;
      case "webart":
        return draft.webartSource;
      case "webedit":
        return draft.webeditSource;
      case "history":
        return draft.historySource;
    }
  }, [draft]);

  const activeSourceConfig = useMemo(
    () => SOURCE_TYPES.find((s) => s.id === draft.sourceType)!,
    [draft.sourceType],
  );

  const setActiveSourceValue = setSourceFor(draft.sourceType);

  const sourceMaterial = useMemo(
    () => activeSourceValue.trim(),
    [activeSourceValue],
  );

  const isDisabled = isPending || !sourceMaterial || safeMode;

  function handleGenerate() {
    if (isPending || !sourceMaterial) return;
    if (safeMode) {
      recordSafeModeBlock("ai-call", "SocialFactoryView/generate");
      toast.error("Safe Mode is on — social pack generation disabled.");
      return;
    }
    setPacks(null);
    setSaved(false);
    setIsPending(true);
    // Deterministic local builder — no API calls.
    setTimeout(() => {
      const generated = buildLocalSocialPack({
        source: activeSourceValue,
        prompt: draft.prompt,
        tone: draft.tone,
        cta: draft.cta,
        brandName: v.name,
        brandTag,
      });
      setPacks(generated);
      setIsPending(false);
      toast.success(`${PLATFORMS.length} platform previews ready`);
    }, 250);
  }

  function handleSaveToHistory() {
    if (!packs) return;
    const platformIds = PLATFORMS.map((p) => p.id);
    const allText = platformIds
      .map((id) => packToText(id, packs[id]))
      .join("\n\n");
    recordOutput({
      silo: draft.silo,
      siloName: v.name,
      kind: "specialist",
      prompt: sourceMaterial,
      output: {
        content: allText,
        headline: deriveTopic(activeSourceValue, draft.prompt, v.name),
        tone: draft.tone,
        cta: draft.cta,
        platforms: platformIds,
        packs,
        mode: "local-social-pack",
      },
    });
    setSaved(true);
    toast.success("Saved to Output History");
  }

  function handleLoadFromHistory() {
    const latest = loadLatestOutputHistoryContent();
    if (latest) {
      setSourceFor("history")(latest);
      setSourceType("history");
      toast.success("Loaded latest Output History entry");
    } else {
      toast.error("No Output History entries yet — save one from another desk first");
    }
  }

  const activeSourceMeta = SOURCE_TYPES.find((s) => s.id === draft.sourceType)!;
  const ActiveSourceIcon = activeSourceMeta.icon;

  return (
    <div
      data-testid="socialfactory-view"
      className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-4 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "#F472B6", color: "#fff" }}
        >
          <Megaphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black tracking-tight leading-none">
            Social Factory
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            Pick a source, write the campaign angle, and generate a social pack
            for every platform.
          </p>
        </div>
      </div>

      <SiloPicker value={draft.silo} onChange={setSilo} />

      {/* Source tray */}
      <section className="mt-3 rounded-2xl border border-border/60 bg-card/45 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-[12px] font-black uppercase tracking-wider text-foreground">
            Source tray
          </h3>
          <span className="text-[10px] text-muted-foreground">
            One active source at a time
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {SOURCE_TYPES.map((s) => {
            const Icon = s.icon;
            const active = draft.sourceType === s.id;
            const hasContent =
              (s.id === "article" && draft.articleSource.trim()) ||
              (s.id === "webart" && draft.webartSource.trim()) ||
              (s.id === "webedit" && draft.webeditSource.trim()) ||
              (s.id === "history" && draft.historySource.trim());
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSourceType(s.id)}
                data-testid={`socialfactory-source-${s.id}`}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 transition-colors ${
                  active
                    ? "border-pink-500/60 bg-pink-500/10 text-foreground"
                    : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className="h-4 w-4"
                  style={{ color: active ? brandColor : undefined }}
                />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {s.label}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider ${
                    hasContent ? "text-emerald-400" : "text-muted-foreground/60"
                  }`}
                >
                  {hasContent ? "Ready" : "Empty"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active source editor */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ActiveSourceIcon
                className="h-3.5 w-3.5"
                style={{ color: brandColor }}
              />
              <span className="text-[11px] font-black uppercase tracking-wider text-foreground">
                {activeSourceConfig.label} source
              </span>
            </div>
            {draft.sourceType === "history" && (
              <button
                type="button"
                onClick={handleLoadFromHistory}
                className="text-[10px] font-bold uppercase tracking-wider text-violet-300 hover:text-violet-200"
              >
                Load latest
              </button>
            )}
          </div>
          <textarea
            value={activeSourceValue}
            onChange={(e) => setActiveSourceValue(e.target.value)}
            placeholder={activeSourceConfig.placeholder}
            data-testid={`socialfactory-source-input-${draft.sourceType}`}
            className="min-h-[96px] w-full resize-none rounded-xl border border-border/60 bg-background/50 p-2.5 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-pink-500/40"
          />
        </div>
      </section>

      {/* Campaign composer */}
      <section className="mt-3 rounded-2xl border border-border/60 bg-card/45 p-3">
        <h3 className="mb-2 text-[12px] font-black uppercase tracking-wider text-foreground">
          Campaign composer
        </h3>

        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          Prompt / campaign angle
        </label>
        <textarea
          value={draft.prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isPending}
          placeholder="Additional campaign notes, link, posting constraints, or angle guidance..."
          data-testid="socialfactory-prompt"
          className="mb-3 min-h-[72px] w-full resize-none rounded-xl border border-border/60 bg-background/50 p-2.5 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-pink-500/40 disabled:opacity-50"
        />

        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          Tone
        </label>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {TONES.map((t) => {
            const active = draft.tone === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                disabled={isPending}
                data-testid={`socialfactory-tone-${t.toLowerCase()}`}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${
                  active
                    ? "border-pink-500/60 bg-pink-500/10 text-foreground"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
                style={active ? { color: brandColor, borderColor: brandColor } : undefined}
              >
                {t}
              </button>
            );
          })}
        </div>

        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          CTA
        </label>
        <input
          type="text"
          value={draft.cta}
          onChange={(e) => setCta(e.target.value)}
          disabled={isPending}
          placeholder="Read the full story. / Watch, read, then comment. / Follow for the next update."
          data-testid="socialfactory-cta"
          className="mb-3 h-10 w-full rounded-xl border border-border/60 bg-background/50 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-pink-500/40 disabled:opacity-50"
        />

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {draftSaved && (
            <button
              type="button"
              onClick={() => {
                clearDraft();
                setDraftSaved(false);
                setPacks(null);
                setSaved(false);
                toast.message("Draft cleared");
              }}
              data-testid="socialfactory-clear-draft"
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:border-foreground/50 hover:text-foreground"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear draft
            </button>
          )}
          {onSelectView && (
            <button
              type="button"
              onClick={() => onSelectView("output-history")}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              View Output History →
            </button>
          )}
        </div>

        {safeMode && (
          <p
            data-testid="socialfactory-safe-mode-note"
            className="mb-2 text-[11px] text-amber-300"
          >
            Safe Mode is on — social pack generation disabled.
          </p>
        )}
        <Button
          onClick={handleGenerate}
          disabled={isDisabled}
          data-testid="socialfactory-generate"
          className="h-11 w-full rounded-full font-semibold disabled:opacity-50"
          style={{
            background: isDisabled ? "hsl(var(--muted))" : "#F472B6",
            color: isDisabled ? "hsl(var(--muted-foreground))" : "#fff",
          }}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Social Pack...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Social Pack
            </>
          )}
        </Button>
      </section>

      {/* Platform previews */}
      <div className="mt-4 flex-1 flex flex-col min-h-[240px]">
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Platform previews
          </h3>
          {packs && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: `${brandColor}22`,
                color: brandColor,
                border: `1px solid ${brandColor}55`,
              }}
            >
              {PLATFORMS.length} platforms ready
            </span>
          )}
        </div>

        <div className="flex-1 rounded-xl border border-border/50 bg-secondary/20 overflow-hidden">
          {isPending ? (
            <div className="flex h-full flex-col items-center justify-center space-y-3 py-8 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: brandColor }} />
              <p
                className="animate-pulse text-sm font-medium"
                style={{ color: brandColor }}
              >
                Generating the social pack...
              </p>
            </div>
          ) : packs ? (
            <div
              data-testid="socialfactory-output"
              className="h-full space-y-3 overflow-auto p-3"
            >
              {PLATFORMS.map((plat) => {
                const p = packs[plat.id];
                if (!p) return null;
                const Icon = plat.icon;
                const tags = fmtHashtags(p.hashtags);
                return (
                  <div
                    key={plat.id}
                    data-testid="socialfactory-pack-card"
                    data-platform={plat.id}
                    className="rounded-xl border border-border/60 bg-background/40 p-3"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Icon
                          className="h-3.5 w-3.5"
                          style={{ color: brandColor }}
                        />
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider"
                          style={{ color: brandColor }}
                        >
                          {plat.label}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          {p.caption.length}/{plat.limit}
                        </span>
                      </div>
                      <CopyButton
                        textToCopy={packToText(plat.id, p)}
                        label="Copy"
                        successMessage={`Copied ${plat.label}`}
                        className="h-7 text-[11px]"
                      />
                    </div>

                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
                      {p.caption}
                    </p>

                    {p.cta && (
                      <p className="mt-2 text-[12px] font-semibold text-foreground/80">
                        CTA: {p.cta}
                      </p>
                    )}

                    {tags && (
                      <p
                        className="mt-2 break-words text-[11px]"
                        style={{ color: brandColor }}
                      >
                        {tags}
                      </p>
                    )}

                    <div className="mt-2 rounded-lg border border-border/50 bg-background/30 p-1.5">
                      <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                        Alt text
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-foreground/80">
                        {p.altText}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Hashtag + alt-text guidance summary */}
              <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Hashtag guidance
                </p>
                <p className="mt-1 text-[11px] leading-snug text-foreground/80">
                  Lead with the brand tag {brandTag}. Keep X to 2 tags, IG/TikTok
                  to 4–6, Facebook to 3–4, YouTube to 5–8. Avoid trending tags
                  unless the story is the trend.
                </p>
                <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Alt text guidance
                </p>
                <p className="mt-1 text-[11px] leading-snug text-foreground/80">
                  Describe the visual, the headline overlay, and the editorial
                  treatment. Do not transcribe the caption into alt text.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground/60">
              <Megaphone className="mb-3 h-10 w-10 opacity-25" />
              <p className="max-w-[280px] text-sm">
                Pick a source, set the tone and CTA, then generate a social pack.
                Previews for Instagram, X, Facebook, YouTube, and TikTok appear
                here with captions, hashtags, alt text, and CTA.
              </p>
            </div>
          )}
        </div>

        {packs && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              onClick={handleSaveToHistory}
              disabled={saved}
              data-testid="socialfactory-save-history"
              className="h-10 rounded-full px-4 text-sm font-semibold disabled:opacity-50"
              variant="outline"
            >
              <Save className="mr-1.5 h-4 w-4" />
              {saved ? "Saved to Output History" : "Save to Output History"}
            </Button>
            <CopyButton
              textToCopy={
                packs
                  ? PLATFORMS.map((plat) => packToText(plat.id, packs[plat.id]))
                      .join("\n\n")
                  : ""
              }
              label="Copy all platforms"
              successMessage="All platform posts copied"
              className="h-10 text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}
