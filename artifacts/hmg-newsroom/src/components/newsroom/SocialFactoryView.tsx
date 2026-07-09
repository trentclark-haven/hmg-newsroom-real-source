import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { verticals } from "@/lib/mock-data";
import { type Silo as ApiSilo } from "@workspace/api-client-react";
import { SiloPicker } from "./SiloPicker";
import { JetFirePanel } from "@/components/hmg/JetFirePanel";
import { NextActionBar, type NextAction } from "@/components/hmg/NextActionBar";
import { useFounderVoice } from "@/lib/useFounderVoice";
import { recordOutput } from "@/lib/useOutputHistory";
import { recordUsage } from "@/lib/useUsageStats";
import { hasDraft, useDraft } from "@/lib/useDraft";
import { recordSafeModeBlock, useSafeMode } from "@/lib/safeMode";
import { FounderVoiceCheck } from "./FounderVoiceCheck";
import {
  Brush,
  Check,
  Copy,
  Eraser,
  FileText,
  Film,
  Hash,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  MessageCircle,
  Send,
  Sparkles,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/hmg/CopyButton";
import {
  buildSocialCampaignIntelligence,
  getBrandVoiceProfile as getIntelligenceBrandVoiceProfile,
} from "@/lib/hmg/intelligence";

interface SocialDraft {
  silo: ApiSilo;
  prompt: string;
  headline: string;
  youtubeFirst: boolean;
  articlePackage?: string;
  visualPackage?: string;
  clipPackage?: string;
  campaignAngle?: string;
}

interface PlatformPack {
  platform: string;
  headline: string;
  caption: string;
  hook: string;
  cta: string;
  hashtags: string[];
  description: string;
}

interface PackResponse {
  ok: boolean;
  silo: string;
  builderVersion: string;
  durationMs: number;
  aiEnhanced: boolean;
  platforms: string[];
  packs: Record<string, PlatformPack>;
}

const DRAFT_KEY = "hmg-socialfactory-draft-v1";

const PLATFORM_LABELS: Record<string, string> = {
  website: "Website",
  push: "Push Alert",
  newsletter: "Newsletter",
  discord: "Discord",
  fb: "Facebook",
  "facebook-post": "Facebook post",
  "x-post": "X post",
  "x-thread": "X thread",
  "ig-feed": "Instagram — Feed",
  "ig-caption": "IG caption",
  "ig-story": "Instagram — Story",
  "ig-story-text": "IG story text",
  tiktok: "TikTok",
  "shorts-caption": "TikTok/Reels/Shorts caption",
  yt: "YouTube",
  "yt-community": "YouTube community post",
  "yt-shorts": "YouTube Shorts",
  "pinned-comment": "Pinned comment",
  hashtags: "Hashtags",
  "alt-text": "Alt text",
  "cta-variants": "CTA variants",
  "follow-up-ideas": "Follow-up post ideas",
  "adjacent-angles": "Adjacent angles",
};

function platformLabel(id: string): string {
  return PLATFORM_LABELS[id] ?? id;
}

function fmtHashtags(tags: string[] | undefined): string {
  if (!tags || !tags.length) return "";
  return tags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
}

function packToText(id: string, p: PlatformPack): string {
  const parts: string[] = [`=== ${platformLabel(id)} ===`];
  if (p.headline) parts.push(`Headline: ${p.headline}`);
  if (p.hook) parts.push(`Hook: ${p.hook}`);
  if (p.caption) parts.push(`\n${p.caption}`);
  if (p.cta) parts.push(`\nCTA: ${p.cta}`);
  const tags = fmtHashtags(p.hashtags);
  if (tags) parts.push(`\n${tags}`);
  return parts.join("\n");
}

function allPacksToText(
  platforms: string[],
  packs: Record<string, PlatformPack>,
  siloName: string,
): string {
  const lines: string[] = [`${siloName} — Social Campaign Output`, ""];
  for (const id of platforms) {
    const p = packs[id];
    if (!p) continue;
    lines.push(packToText(id, p));
    lines.push("");
  }
  return lines.join("\n").trim();
}

function csvEscape(value: string): string {
  const v2 = value ?? "";
  return /[",\n]/.test(v2) ? `"${v2.replace(/"/g, '""')}"` : v2;
}

function packsToCsvText(
  platforms: string[],
  packs: Record<string, PlatformPack>,
): string {
  if (!platforms.length) return "";
  const header = ["Platform", "Headline", "Hook", "Caption", "CTA", "Hashtags"];
  const rows: string[] = [header.map(csvEscape).join(",")];
  for (const id of platforms) {
    const p = packs[id];
    if (!p) continue;
    rows.push(
      [
        platformLabel(id),
        p.headline ?? "",
        p.hook ?? "",
        p.caption ?? "",
        p.cta ?? "",
        fmtHashtags(p.hashtags),
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return rows.join("\n");
}

function buildLocalCampaignPacks({
  headline,
  source,
  brandName,
  campaignAngle,
  visualPackage,
  clipPackage,
}: {
  headline: string;
  source: string;
  brandName: string;
  campaignAngle: string;
  visualPackage: string;
  clipPackage: string;
}): { platforms: string[]; packs: Record<string, PlatformPack> } {
  const topic = headline || source.split(/\s+/).slice(0, 10).join(" ") || `${brandName} update`;
  const angle = campaignAngle || "Read the full HMG story";
  const visualNote = visualPackage ? "Visual asset is staged from WebArt." : "Attach the approved visual asset.";
  const clipNote = clipPackage ? "Clip notes are staged from WebEdit." : "Use the strongest short clip if available.";
  const baseTags = [
    `#${brandName.replace(/\s+/g, "")}`,
    "#HMG",
    "#News",
    "#Culture",
  ];

  const packs: Record<string, PlatformPack> = {
    "ig-caption": {
      platform: "ig-caption",
      headline: topic,
      hook: angle,
      caption: `${topic}\n\n${angle}\n\n${visualNote} ${clipNote}`,
      cta: "Full story in bio.",
      hashtags: baseTags,
      description: "Instagram feed caption",
    },
    "ig-story-text": {
      platform: "ig-story-text",
      headline: topic,
      hook: "Tap through for the full context.",
      caption: `${topic}\n\nWhat happened, why it matters, and what to watch next.`,
      cta: "Tap to read",
      hashtags: [],
      description: "Instagram story copy",
    },
    "x-post": {
      platform: "x-post",
      headline: topic,
      hook: angle,
      caption: `${topic}\n\n${angle}`,
      cta: "Read the full story.",
      hashtags: baseTags.slice(0, 2),
      description: "X post",
    },
    "facebook-post": {
      platform: "facebook-post",
      headline: topic,
      hook: "Here is the clean breakdown.",
      caption: `${topic}\n\nWe pulled the article, visual, and clip notes together so the full context is easy to follow.`,
      cta: "Read more.",
      hashtags: baseTags,
      description: "Facebook post",
    },
    "yt-community": {
      platform: "yt-community",
      headline: topic,
      hook: "New HMG post is ready.",
      caption: `${topic}\n\n${clipNote} Drop your take after watching.`,
      cta: "Watch, read, then comment.",
      hashtags: baseTags,
      description: "YouTube community post",
    },
    "shorts-caption": {
      platform: "shorts-caption",
      headline: topic,
      hook: hookFromText(angle),
      caption: `${hookFromText(angle)}\n\n${topic}`,
      cta: "Follow for the next update.",
      hashtags: ["#Shorts", "#Reels", "#TikTok", ...baseTags.slice(0, 2)],
      description: "Short-form video caption",
    },
    "pinned-comment": {
      platform: "pinned-comment",
      headline: "Pinned comment",
      hook: "Keep the thread focused.",
      caption: `What is your read on ${topic}? Keep it sharp and stay on the facts.`,
      cta: "Drop your take.",
      hashtags: [],
      description: "Pinned comment",
    },
    hashtags: {
      platform: "hashtags",
      headline: "Hashtag set",
      hook: "Primary tags",
      caption: baseTags.join(" "),
      cta: "",
      hashtags: baseTags,
      description: "Hashtag group",
    },
    "alt-text": {
      platform: "alt-text",
      headline: "Alt text",
      hook: "Accessibility copy",
      caption: `Branded ${brandName} visual for the story "${topic}" with headline overlay and source-safe editorial treatment.`,
      cta: "",
      hashtags: [],
      description: "Alt text",
    },
    "cta-variants": {
      platform: "cta-variants",
      headline: "CTA variants",
      hook: "Choose based on placement",
      caption: "Read the full story.\nWatch the clip.\nSave this breakdown.\nSend this to someone following the story.",
      cta: "Pick one CTA per platform.",
      hashtags: [],
      description: "CTA options",
    },
    "follow-up-ideas": {
      platform: "follow-up-ideas",
      headline: "Follow-up post ideas",
      hook: "Keep the story moving without repeating the same post.",
      caption: `1. What changed after ${topic}?\n2. What source detail still needs confirmation?\n3. What should ${brandName} watch next?`,
      cta: "Choose one follow-up after the first post is live.",
      hashtags: [],
      description: "Follow-up ideas",
    },
    "adjacent-angles": {
      platform: "adjacent-angles",
      headline: "Adjacent angles",
      hook: "Remix the story for another audience lane.",
      caption: `- Reader context angle\n- Visual-first angle\n- Short clip reaction angle\n- Source verification angle`,
      cta: "Use one adjacent angle for the next draft.",
      hashtags: [],
      description: "Adjacent content angles",
    },
  };

  return {
    platforms: [
      "ig-caption",
      "ig-story-text",
      "x-post",
      "facebook-post",
      "yt-community",
      "shorts-caption",
      "pinned-comment",
      "hashtags",
      "alt-text",
      "cta-variants",
      "follow-up-ideas",
      "adjacent-angles",
    ],
    packs,
  };
}

function loadLatestArticleOutput(): { content: string; label: string } | null {
  try {
    const raw = window.localStorage.getItem("hmg-newsroom-output-history-v2");
    if (!raw) return null;
    const all = JSON.parse(raw) as Array<{
      kind: string;
      output: Record<string, unknown>;
      createdAt: number;
      silo: string;
      siloName: string;
      prompt: string;
    }>;
    if (!Array.isArray(all) || !all.length) return null;
    const articleKinds = ["specialist", "quick", "wordpress-draft"];
    const latest = all
      .filter((e) => articleKinds.includes(e.kind))
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    if (!latest) return null;
    const o = latest.output ?? {};
    const label = `${latest.siloName ?? ""} — ${new Date(latest.createdAt).toLocaleDateString()}`;
    if (latest.kind === "wordpress-draft") {
      const tags = Array.isArray(o.tags) ? (o.tags as string[]).join(", ") : "";
      const content = [
        `WP DRAFT — ${String(o.title ?? latest.prompt)}`,
        `Excerpt: ${String(o.excerpt ?? "")}`,
        tags ? `Tags: ${tags}` : "",
        String(o.content ?? ""),
      ].filter(Boolean).join("\n").slice(0, 1200);
      return { content, label };
    }
    const content = typeof o.content === "string" ? o.content : JSON.stringify(o, null, 2);
    return { content: content.slice(0, 1200), label };
  } catch {
    return null;
  }
}

function loadLatestWebEditOutput(): string | null {
  try {
    const raw = window.localStorage.getItem("hmg-newsroom-output-history-v2");
    if (!raw) return null;
    const all = JSON.parse(raw) as Array<{
      kind: string;
      output: Record<string, unknown>;
      createdAt: number;
      silo: string;
      siloName: string;
    }>;
    if (!Array.isArray(all) || !all.length) return null;
    const webeditKinds = ["social-video-draft", "edit-brief", "cut-note"];
    const latest = all
      .filter((e) => webeditKinds.includes(e.kind))
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    if (!latest) return null;
    const o = latest.output ?? {};
    const lines: string[] = [
      `WEBEDIT CLIP PACKAGE — ${String(latest.siloName ?? "")}`,
      `Saved: ${new Date(latest.createdAt).toLocaleString()}`,
      "",
    ];
    if (o.title) lines.push(`Title: ${String(o.title)}`);
    if (o.goal) lines.push(`Goal: ${String(o.goal)}`);
    if (o.platform) lines.push(`Platform: ${String(o.platform)}`);
    if (o.hookText) lines.push(`Hook line: ${String(o.hookText)}`);
    if (o.captionStyle) lines.push(`Caption style: ${String(o.captionStyle)}`);
    if (o.captionPackAngle) lines.push(`Caption angle: ${String(o.captionPackAngle)}`);
    if (o.lowerThirdName || o.lowerThirdContext)
      lines.push(
        `Lower third: ${String(o.lowerThirdName ?? "")} / ${String(o.lowerThirdContext ?? "")}`,
      );
    if (o.pinnedComment) lines.push(`Pinned comment: ${String(o.pinnedComment)}`);
    if (o.captionPlatformNotes) lines.push(`Platform notes: ${String(o.captionPlatformNotes)}`);
    if (Array.isArray(o.segments) && (o.segments as unknown[]).length) {
      lines.push("Key segments:");
      for (const seg of (o.segments as Array<Record<string, unknown>>).slice(0, 5)) {
        const risk = seg.riskFlag ? ` ⚠ ${String(seg.riskFlag)}` : "";
        lines.push(
          `  ${String(seg.label ?? "")} [${String(seg.role ?? "")}]: ${String(seg.start ?? "")}s–${String(seg.end ?? "")}s — ${String(seg.note ?? "")}${risk}`,
        );
      }
    }
    if (o.transcriptSummary) lines.push(`Transcript: ${String(o.transcriptSummary)}`);
    if (o.clipPackageText) lines.push("", String(o.clipPackageText).slice(0, 400));
    return lines.join("\n");
  } catch {
    return null;
  }
}

function hookFromText(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "Here is the part everyone is reacting to.";
  return clean.length > 96 ? `${clean.slice(0, 93)}...` : clean;
}

export function SocialFactoryView() {
  const [draft, setDraft, clearDraft] = useDraft<SocialDraft>(DRAFT_KEY, {
    silo: verticals[0].id as ApiSilo,
    prompt: "",
    headline: "",
    youtubeFirst: false,
    articlePackage: "",
    visualPackage: "",
    clipPackage: "",
    campaignAngle: "",
  });
  const silo = draft.silo;
  const prompt = draft.prompt;
  const headline = draft.headline;
  const youtubeFirst = draft.youtubeFirst;
  const articlePackage = draft.articlePackage ?? "";
  const visualPackage = draft.visualPackage ?? "";
  const clipPackage = draft.clipPackage ?? "";
  const campaignAngle = draft.campaignAngle ?? "";
  const setSilo = (v: ApiSilo) => setDraft((p) => ({ ...p, silo: v }));
  const setPrompt = (v: string) => setDraft((p) => ({ ...p, prompt: v }));
  const setHeadline = (v: string) => setDraft((p) => ({ ...p, headline: v }));
  const setArticlePackage = (v: string) =>
    setDraft((p) => ({ ...p, articlePackage: v }));
  const setVisualPackage = (v: string) =>
    setDraft((p) => ({ ...p, visualPackage: v }));
  const setClipPackage = (v: string) =>
    setDraft((p) => ({ ...p, clipPackage: v }));
  const setCampaignAngle = (v: string) =>
    setDraft((p) => ({ ...p, campaignAngle: v }));
  const setYoutubeFirst = (fn: (prev: boolean) => boolean) =>
    setDraft((p) => ({ ...p, youtubeFirst: fn(p.youtubeFirst) }));
  const [draftSaved, setDraftSaved] = useState<boolean>(() => hasDraft(DRAFT_KEY));
  useEffect(() => {
    const i = setInterval(() => setDraftSaved(hasDraft(DRAFT_KEY)), 800);
    return () => clearInterval(i);
  }, []);

  const [isPending, setIsPending] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [packs, setPacks] = useState<Record<string, PlatformPack> | null>(null);
  const [meta, setMeta] = useState<{ durationMs: number; aiEnhanced: boolean } | null>(
    null,
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);
  const [founderVoice] = useFounderVoice(silo);

  const { enabled: safeMode } = useSafeMode();
  const v = verticals.find((x) => x.id === silo)!;
  const brandColor = v.color;
  const intelligenceBrand = useMemo(
    () => getIntelligenceBrandVoiceProfile(silo),
    [silo],
  );
  const sourceMaterial = useMemo(
    () =>
      [
        articlePackage.trim() && `ARTICLE PACKAGE\n${articlePackage.trim()}`,
        visualPackage.trim() && `VISUAL PACKAGE\n${visualPackage.trim()}`,
        clipPackage.trim() && `CLIP PACKAGE\n${clipPackage.trim()}`,
        prompt.trim() && `CAMPAIGN NOTES\n${prompt.trim()}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    [articlePackage, visualPackage, clipPackage, prompt],
  );
  const derivedHeadline = useMemo(
    () =>
      headline.trim() ||
      articlePackage.trim().split("\n")[0].slice(0, 160) ||
      prompt.trim().split("\n")[0].slice(0, 160) ||
      `${v.name} update`,
    [articlePackage, headline, prompt, v.name],
  );
  const sourcePacketState = useMemo(
    () => [
      { label: "Article", ready: Boolean(articlePackage.trim()) },
      { label: "Visual", ready: Boolean(visualPackage.trim()) },
      { label: "Clip", ready: Boolean(clipPackage.trim()) },
    ],
    [articlePackage, clipPackage, visualPackage],
  );
  const readyPacketCount = sourcePacketState.filter((item) => item.ready).length;
  const socialIntelligence = useMemo(
    () =>
      buildSocialCampaignIntelligence({
        brand: intelligenceBrand,
        headline: derivedHeadline,
        articlePackage,
        visualPackage,
        clipPackage,
        campaignAngle,
      }),
    [
      articlePackage,
      campaignAngle,
      clipPackage,
      derivedHeadline,
      intelligenceBrand,
      visualPackage,
    ],
  );
  const campaignPacket = useMemo(
    () =>
      packs && platforms.length
        ? {
            text: allPacksToText(platforms, packs, v.name),
            csv: packsToCsvText(platforms, packs),
            count: platforms.length,
          }
        : null,
    [packs, platforms, v.name],
  );
  const isDisabled = isPending || !sourceMaterial.trim() || safeMode;

  function flagCopied(key: string) {
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
  }

  async function handleGenerate() {
    if (isPending || !sourceMaterial.trim()) return;
    if (safeMode) {
      recordSafeModeBlock("ai-call", "SocialFactoryView/generate");
      toast.error("Safe Mode is on — social output creation disabled.");
      return;
    }
    setPacks(null);
    setPlatforms([]);
    setMeta(null);
    setPosted(false);
    setIsPending(true);
    try {
      const apiBase = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");
      const res = await fetch(`${apiBase}/social-factory/pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          silo,
          headline: derivedHeadline,
          source: sourceMaterial.trim(),
          founderVoice,
          aiEnhance: false,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as PackResponse;
      if (!data.ok || !data.packs) {
        throw new Error("Empty pack");
      }
      const order = youtubeFirst
        ? [
            ...data.platforms.filter((p) => p === "yt" || p === "yt-shorts"),
            ...data.platforms.filter((p) => p !== "yt" && p !== "yt-shorts"),
          ]
        : data.platforms;
      setPlatforms(order);
      setPacks(data.packs);
      setMeta({ durationMs: data.durationMs, aiEnhanced: data.aiEnhanced });
      const campaignText = allPacksToText(order, data.packs, v.name);
      recordUsage(silo, "specialist");
      recordOutput({
        silo,
        siloName: v.name,
        kind: "specialist",
        prompt: sourceMaterial,
        specialist: "socialfactory",
        output: {
          content: campaignText,
          headline: derivedHeadline,
          youtubeFirst,
          pieces: order.length,
        },
      });
      toast.success(`${order.length} posts ready`);
    } catch (err) {
      const local = buildLocalCampaignPacks({
        headline: derivedHeadline,
        source: sourceMaterial,
        brandName: v.name,
        campaignAngle,
        visualPackage,
        clipPackage,
      });
      const order = youtubeFirst
        ? [
            ...local.platforms.filter((p) => p === "yt-community" || p === "shorts-caption"),
            ...local.platforms.filter((p) => p !== "yt-community" && p !== "shorts-caption"),
          ]
        : local.platforms;
      setPlatforms(order);
      setPacks(local.packs);
      setMeta({ durationMs: 0, aiEnhanced: false });
      const campaignText = allPacksToText(order, local.packs, v.name);
      recordUsage(silo, "specialist");
      recordOutput({
        silo,
        siloName: v.name,
        kind: "specialist",
        prompt: sourceMaterial,
        specialist: "socialfactory",
        output: {
          content: campaignText,
          headline: derivedHeadline,
          youtubeFirst,
          pieces: order.length,
          mode: "local-social-package",
        },
      });
      toast.success(
        err instanceof Error
          ? `Local social output ready (${err.message})`
          : "Local social output ready",
      );
    } finally {
      setIsPending(false);
    }
  }

  function copyOne(id: string) {
    if (!packs) return;
    const p = packs[id];
    if (!p) return;
    navigator.clipboard
      .writeText(packToText(id, p))
      .then(() => {
        flagCopied(id);
        toast.success(`Copied ${platformLabel(id)}`);
      })
      .catch(() => toast.error("Copy failed"));
  }

  function copyAll() {
    if (!campaignPacket) return;
    navigator.clipboard
      .writeText(campaignPacket.text)
      .then(() => {
        flagCopied("__all__");
        toast.success("Copied all posts");
      })
      .catch(() => toast.error("Copy failed"));
  }

  function downloadFile(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportPack() {
    if (!campaignPacket) return;
    downloadFile(
      `${v.id}-social-output.txt`,
      campaignPacket.text,
      "text/plain;charset=utf-8",
    );
    toast.success("Exported campaign output");
  }

  function downloadCsv() {
    if (!campaignPacket?.csv) return;
    downloadFile(`${v.id}-social-output.csv`, campaignPacket.csv, "text/csv;charset=utf-8");
    toast.success("Exported CSV");
  }

  function copyFirstPlatform() {
    if (!packs || !platforms.length) return;
    copyOne(platforms[0]);
  }

  function markPosted() {
    setPosted(true);
    toast.success("Manual post receipt saved");
  }

  const pieceCount = campaignPacket?.count ?? platforms.length;

  const outputActions: NextAction[] = [
    { id: "copy-all-posts", label: "Copy All Posts", onClick: copyAll },
    {
      id: "copy-platform-post",
      label: "Copy Platform Post",
      onClick: copyFirstPlatform,
      hint: "Copies the first platform's post. Each card also has its own Copy button.",
    },
    { id: "export-social-pack", label: "Export Campaign Output", onClick: exportPack },
    { id: "download-csv", label: "Export CSV", onClick: downloadCsv },
    {
      id: "mark-posted",
      label: posted ? "Manual Post Receipt Saved" : "Save Manual Post Receipt",
      onClick: markPosted,
      disabled: posted,
      hint: "Manual tracking only — saves a receipt after you post outside HMG Newsroom.",
    },
    {
      id: "post-direct",
      label: "Ready for Manual Publish",
      disabled: true,
      blockedReason:
        "Publish Blocked here — copy posts or export the campaign output for manual posting.",
    },
  ];

  return (
    <div
      data-testid="socialfactory-view"
      className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-4 overflow-y-auto"
    >
      <div className="flex items-center gap-2 mb-2">
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
            Campaign assembler. Bring the article draft, visual asset, and clip notes
            together, then write what gets posted with the asset.
          </p>
        </div>
      </div>

      <SiloPicker value={silo} onChange={setSilo} />

      <section className="mt-3 rounded-2xl border border-border/60 bg-card/45 p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" style={{ color: brandColor }} />
            <div>
              <h3 className="text-[12px] font-black uppercase tracking-wider text-foreground">
                Campaign inputs
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Import or paste inputs from the other desks.
              </p>
            </div>
          </div>
          <span
            className="rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider"
            style={{ background: `${brandColor}22`, color: brandColor, border: `1px solid ${brandColor}55` }}
          >
            {readyPacketCount}/3 ready
          </span>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {sourcePacketState.map((packet) => (
            <div
              key={packet.label}
              className={`rounded-xl border px-2 py-1.5 ${
                packet.ready
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-border/60 bg-secondary/20 text-muted-foreground"
              }`}
            >
              <p className="text-[9px] font-black uppercase tracking-wider">
                {packet.label}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold">
                {packet.ready ? "Ready" : "Needs input"}
              </p>
            </div>
          ))}
        </div>

        <details className="mb-3 rounded-xl border border-border/60 bg-secondary/20 p-3">
          <summary className="cursor-pointer list-none text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            Social Campaign Intelligence
            <span className="ml-2 text-[10px] font-semibold normal-case tracking-normal">
              tone, CTA, tags, alt text
            </span>
          </summary>
          <div className="mt-3 mb-2 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">
                Social Campaign Intelligence
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Local checks for brand tone, CTA, tags, alt text, and manual posting readiness.
              </p>
            </div>
            <CopyButton
              textToCopy={socialIntelligence.copyablePacket}
              label="Copy Social Campaign Intelligence Packet"
              successMessage="Social Campaign Intelligence Packet copied"
              className="h-8 text-[11px]"
            />
          </div>
          <div className="grid gap-2 lg:grid-cols-3">
            <div className="rounded-lg border border-border/50 bg-background/30 p-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Caption tuning
              </p>
              <p className="mt-1 text-[11px] leading-snug text-foreground">
                {socialIntelligence.brandAwareCaptionTuning[0]}
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/30 p-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                CTA recommendation
              </p>
              <p className="mt-1 text-[11px] leading-snug text-foreground">
                {socialIntelligence.ctaRecommendations[0]}
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/30 p-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Readiness
              </p>
              <p className="mt-1 text-[11px] leading-snug text-foreground">
                {socialIntelligence.readyToPostChecklist.filter((item) =>
                  !item.toLowerCase().includes("pasted") || readyPacketCount > 0,
                ).length} checks available
              </p>
            </div>
          </div>
          {socialIntelligence.warnings.length ? (
            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-200">
                Warnings
              </p>
              <ul className="mt-1 space-y-1">
                {socialIntelligence.warnings.slice(0, 3).map((warning) => (
                  <li key={warning} className="text-[11px] leading-snug text-amber-100">
                    - {warning}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Tone checks", items: socialIntelligence.platformToneChecks },
              { label: "Tag guidance", items: socialIntelligence.hashtagQualityGuidance },
              { label: "Alt text", items: socialIntelligence.altTextQualityCheck },
              { label: "Manual checklist", items: socialIntelligence.readyToPostChecklist },
            ].map((block) => (
              <div key={block.label} className="rounded-lg border border-border/50 bg-background/30 p-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  {block.label}
                </p>
                <ul className="mt-1 space-y-1">
                  {block.items.slice(0, 3).map((item) => (
                    <li key={item} className="text-[10px] leading-snug text-muted-foreground">
                      - {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              const latest = loadLatestArticleOutput();
              if (latest) {
                setArticlePackage(latest.content);
                toast.success(`Loaded from Output History — ${latest.label}`);
              } else {
                toast.error("No article or WP draft in Output History yet — save one from Editorial Desk first");
              }
            }}
            data-testid="socialfactory-import-output-history"
            className="rounded-full border border-violet-500/50 bg-violet-500/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-300 hover:text-violet-200 hover:border-violet-500/70"
          >
            From Output History
          </button>
          <button
            type="button"
            onClick={() => {
              setArticlePackage(
                `Headline: ${headline.trim() || "(paste article headline)"}\nDek: (paste dek / subhead)\nArticle body summary: ${prompt.trim() || "(paste 2-4 sentence summary)"}\nLink: (paste WordPress URL or working draft slug)\nVerification notes: (paste any caveats from Editorial Desk)`,
              );
              toast.success("Article draft added");
            }}
            data-testid="socialfactory-template-article"
            className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            From Editorial Article
          </button>
          <button
            type="button"
            onClick={() => {
              setVisualPackage(
                `Layout: (hero collage / article featured / story / thumbnail)\nOutput size: (paste size)\nHeadline overlay: ${headline.trim() || "(paste overlay headline)"}\nSubheadline: (optional)\nCredit: (paste source / credit line)\nIntended use: (website hero / IG feed / link card / etc.)`,
              );
              toast.success("Visual asset notes added");
            }}
            data-testid="socialfactory-template-visual"
            className="rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            From WebArt Visual
          </button>
          <button
            type="button"
            onClick={() => {
              const saved = loadLatestWebEditOutput();
              if (saved) {
                setClipPackage(saved);
                toast.success("Latest WebEdit output loaded — review and adjust below");
              } else {
                setClipPackage(
                  `WEBEDIT CLIP PACKAGE\nTopic: ${prompt.trim() || "(paste clip topic)"}\nGoal: (viral-hook / headline-recap / quote-pull / reaction / evergreen)\nPlatform: (TikTok / Reels / Shorts / X / IG Feed / website)\nTotal length: (seconds)\nHook line: ${headline.trim() || "(paste hook from WebEdit Step 3)"}\nCaption style: (Clean / Pop / Bold Kinetic / Subtitle / Editorial / Breaking)\nCaption angle: (paste angle from WebEdit Step 5)\nLower third: (speaker name / source)\nKey segments: (paste timeline from WebEdit Step 4)\nPinned comment: (paste from WebEdit Step 5)\nVerification notes: (paste risk flags from WebEdit Step 2)`,
                );
                toast.success("WebEdit Clip template added — no saved output found yet, save one in WebEdit Step 8 to auto-load");
              }
            }}
            data-testid="socialfactory-template-clip"
            className="rounded-full border border-red-500/40 bg-red-500/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-300 hover:text-red-200 hover:border-red-500/60"
          >
            From WebEdit Clip Studio
          </button>
        </div>

        <div className="grid gap-2 lg:grid-cols-3">
          {[
            {
              label: "Article draft",
              helper: "From Editorial Desk",
              icon: FileText,
              value: articlePackage,
              setValue: setArticlePackage,
              placeholder: "Paste article headline, summary, angle, facts, and source notes...",
            },
            {
              label: "Visual asset",
              helper: "From WebArt",
              icon: Brush,
              value: visualPackage,
              setValue: setVisualPackage,
              placeholder: "Paste layout, headline overlay, asset, credit, alt-text notes...",
            },
            {
              label: "Clip notes",
              helper: "From WebEdit",
              icon: Film,
              value: clipPackage,
              setValue: setClipPackage,
              placeholder: "Paste hook, cut list, caption angle, thumbnail, and receipt notes...",
            },
          ].map((item) => {
            const Icon = item.icon;
            const ready = Boolean(item.value.trim());
            return (
              <div
                key={item.label}
                className={`rounded-xl border p-2.5 ${
                  ready
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-border/60 bg-secondary/20"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" style={{ color: ready ? "#34D399" : brandColor }} />
                    <span className="text-[11px] font-black uppercase tracking-wider text-foreground">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    {ready ? "Ready" : "Paste"}
                  </span>
                </div>
                <p className="mb-1.5 text-[10px] text-muted-foreground">
                  {item.helper}
                </p>
                <Textarea
                  value={item.value}
                  onChange={(e) => item.setValue(e.target.value)}
                  placeholder={item.placeholder}
                  className="min-h-[104px] resize-none bg-background/50 border-border text-xs"
                />
              </div>
            );
          })}
        </div>
      </section>

      <details className="mt-3 rounded-xl border border-border/60 bg-secondary/20 p-3">
        <summary className="cursor-pointer list-none text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Optional source notes
        </summary>
        <JetFirePanel
          brandId={silo}
          modes={["social", "editorial"]}
          defaultMode="social"
          title="Source Notes"
          modeLabels={{ social: "Platform Posts", editorial: "Editorial Draft" }}
          className="mt-3"
        />
      </details>

      <div className="mt-2 space-y-2">
        <Input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Campaign headline"
          data-testid="socialfactory-headline"
          className="bg-secondary/40 border-border text-sm h-10"
        />

        <Input
          value={campaignAngle}
          onChange={(e) => setCampaignAngle(e.target.value)}
          placeholder="Campaign angle / CTA direction"
          data-testid="socialfactory-campaign-angle"
          className="bg-secondary/40 border-border text-sm h-10"
        />

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isPending}
          placeholder="Additional campaign notes, link, posting constraints, or tone guidance..."
          data-testid="socialfactory-input"
          className="min-h-[104px] resize-none bg-secondary/40 border-border text-sm p-3 rounded-xl placeholder:text-muted-foreground/60"
        />

        <div className="flex flex-wrap items-center gap-2">
          {draftSaved && (
            <button
              type="button"
              onClick={() => {
                clearDraft();
                setDraftSaved(false);
                toast.message("Draft cleared");
              }}
              data-testid="socialfactory-clear-draft"
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-border hover:border-foreground/50"
            >
              <Eraser className="w-3.5 h-3.5" />
              Clear draft
            </button>
          )}
          <button
            type="button"
            onClick={() => setYoutubeFirst((v) => !v)}
            disabled={isPending}
            data-testid="socialfactory-youtube-first"
            className="text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50"
            style={{
              background: youtubeFirst ? "#FF0000" : "transparent",
              color: youtubeFirst ? "#fff" : "hsl(var(--muted-foreground))",
              borderColor: youtubeFirst ? "#FF0000" : "hsl(var(--border))",
            }}
          >
            <Youtube className="w-3.5 h-3.5" />
            YouTube-first {youtubeFirst ? "ON" : "OFF"}
          </button>

          {founderVoice && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border"
              style={{ borderColor: brandColor, color: brandColor }}
              title="Founder Voice (Trent Clark Mode) is ON for this silo"
            >
              Founder Voice ON
            </span>
          )}
        </div>

        {founderVoice && (
          <details className="rounded-xl border border-border/60 bg-secondary/20 p-3">
            <summary className="cursor-pointer list-none text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Founder Voice Check
              <span className="ml-2 text-[10px] font-semibold normal-case tracking-normal">
                optional review before copy/export
              </span>
            </summary>
            <div className="mt-3">
              <FounderVoiceCheck
                brandColor={brandColor}
                siloName={v.name}
                storageKey={`hmg-founder-voice-check::socialfactory::${silo}`}
                instanceId={`socialfactory-${silo}`}
              />
            </div>
          </details>
        )}

        {safeMode && (
          <p
            data-testid="socialfactory-safe-mode-note"
            className="text-[11px] text-amber-300"
          >
            Safe Mode is on — social output creation disabled.
          </p>
        )}
        <Button
          onClick={handleGenerate}
          disabled={isDisabled}
          data-testid="socialfactory-generate"
          className="w-full rounded-full font-semibold h-11 disabled:opacity-50"
          style={{
            background: isDisabled ? "hsl(var(--muted))" : "#F472B6",
            color: isDisabled ? "hsl(var(--muted-foreground))" : "#fff",
          }}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Social Posts...
            </>
          ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
              Create Social Campaign
          </>
          )}
        </Button>
      </div>

      <div className="mt-4 flex-1 flex flex-col min-h-[240px]">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Preview Posts
            </h3>
            {packs && (
              <span
                data-testid="socialfactory-mode"
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: `${brandColor}22`,
                  color: brandColor,
                  border: `1px solid ${brandColor}55`,
                }}
              >
                {pieceCount} pieces ready
                {meta?.durationMs ? ` · ${meta.durationMs}ms` : ""}
              </span>
            )}
          </div>
          {packs && (
            <button
              onClick={copyAll}
              data-testid="socialfactory-copy-all"
              className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
            >
              {copiedKey === "__all__" ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              Copy Posts
            </button>
          )}
        </div>

        <div className="flex-1 rounded-xl border border-border/50 bg-secondary/20 overflow-hidden">
          {isPending ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 py-8">
              <Loader2
                className="w-7 h-7 animate-spin"
                style={{ color: brandColor }}
              />
                <p
                  className="text-sm font-medium animate-pulse"
                  style={{ color: brandColor }}
                >
                Creating the social posts...
              </p>
            </div>
          ) : packs && platforms.length ? (
            <div
              data-testid="socialfactory-output"
              className="p-3 space-y-3 overflow-auto h-full"
            >
              {platforms.map((id) => {
                const p = packs[id];
                if (!p) return null;
                const tags = fmtHashtags(p.hashtags);
                return (
                  <div
                    key={id}
                    data-testid="socialfactory-pack-card"
                    data-platform={id}
                    className="rounded-xl border border-border/60 bg-background/40 p-3"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: brandColor }}
                      >
                        {platformLabel(id)}
                      </span>
                      <button
                        onClick={() => copyOne(id)}
                        data-testid={`socialfactory-copy-${id}`}
                        className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
                      >
                        {copiedKey === id ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Copy this
                      </button>
                    </div>
                    {p.headline && (
                      <p className="text-sm font-bold leading-snug text-foreground">
                        {p.headline}
                      </p>
                    )}
                    {p.hook && (
                      <p className="text-[12px] text-muted-foreground mt-1">
                        {p.hook}
                      </p>
                    )}
                    {p.caption && (
                      <p className="text-[13px] text-foreground/90 whitespace-pre-wrap mt-2 leading-relaxed">
                        {p.caption}
                      </p>
                    )}
                    {p.cta && (
                      <p className="text-[12px] font-semibold mt-2 text-foreground/80">
                        CTA: {p.cta}
                      </p>
                    )}
                    {tags && (
                      <p
                        className="text-[11px] mt-2 break-words"
                        style={{ color: brandColor }}
                      >
                        {tags}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 p-6 text-center">
              <Megaphone className="w-10 h-10 mb-3 opacity-25" />
              <p className="text-sm max-w-[260px]">
                Paste an article draft, visual asset notes, or clip notes.
                Social Factory will assemble IG caption, story text, X post,
                Facebook post, YouTube community post, short-form caption,
                pinned comment, hashtags, alt text, and CTA variants.
              </p>
            </div>
          )}
        </div>

        {!packs && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              { icon: MessageCircle, label: "Captions" },
              { icon: Send, label: "Posts" },
              { icon: Youtube, label: "Community" },
              { icon: Hash, label: "Hashtags" },
              { icon: ImageIcon, label: "Alt text" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-border/50 bg-secondary/20 px-3 py-2 text-center"
                >
                  <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {packs && platforms.length > 0 && (
          <NextActionBar
            title="Next actions"
            actions={outputActions}
            className="mt-3"
          />
        )}
      </div>
    </div>
  );
}
