/**
 * HMG WebEdit — cut plan engine.
 *
 * Creates a structured, copy-ready edit packet from the operator's inputs:
 *   - clip goal + brand
 *   - target length and platform
 *   - hook concepts
 *   - caption pack
 *   - lower-third copy
 *   - thumbnail text
 *   - cut list with timing markers
 *   - export checklist
 *   - production receipt
 *
 * No fake video conversion happens here — the engine is a deterministic
 * planner that produces a real artifact an editor can take into any video
 * editor. The product surface above is the cut desk; this module is the brain.
 *
 * Honesty rule: every output is derived from the operator's typed inputs or
 * pulled from the curated CLIP_GOAL_PRESETS / PLATFORM_PRESETS tables. No
 * provider call, no AI fabrication, no claim about uploads we cannot verify.
 */

export type ClipGoalId =
  | "hook-first-news"
  | "drama-reveal"
  | "educational-explain"
  | "atmosphere-mood"
  | "highlight-recap"
  | "interview-pull";

export type ClipPlatformId =
  | "tiktok"
  | "reels"
  | "shorts"
  | "x-video"
  | "ig-feed-video"
  | "website-embed"
  | "youtube-long";

export type ClipLengthBucketId =
  | "ultra-short" // <= 15s
  | "short" // 16–30s
  | "medium" // 31–60s
  | "long" // 61–180s
  | "extended"; // > 180s

export interface ClipGoalPreset {
  id: ClipGoalId;
  label: string;
  blurb: string;
  /** Order of structural beats this goal works best with. */
  beats: SegmentBeat[];
  /** Caption tone the planner should follow. */
  captionTone: string;
}

export type SegmentBeat =
  | "hook"
  | "setup"
  | "context"
  | "reveal"
  | "evidence"
  | "payoff"
  | "cta";

export interface ClipPlatformPreset {
  id: ClipPlatformId;
  label: string;
  aspect: "9:16" | "1:1" | "16:9";
  /** Hard upper bound the planner respects. */
  maxLengthSec: number;
  blurb: string;
}

export interface ClipLengthBucket {
  id: ClipLengthBucketId;
  label: string;
  /** Seconds (low, high). */
  range: [number, number];
}

export const CLIP_GOAL_PRESETS: ClipGoalPreset[] = [
  {
    id: "hook-first-news",
    label: "Hook-first News",
    blurb: "Strong opening claim, fact, then payoff. Created for fast scrolls.",
    beats: ["hook", "context", "evidence", "payoff", "cta"],
    captionTone: "Direct, headline-style. Lead with the claim, support with evidence, close with the action.",
  },
  {
    id: "drama-reveal",
    label: "Drama Reveal",
    blurb: "Tease → buildup → reveal. Best for breaking takes and exclusives.",
    beats: ["hook", "setup", "reveal", "payoff", "cta"],
    captionTone: "Withhold the punch until the reveal. Caption hints, never spoils. Earn the watch.",
  },
  {
    id: "educational-explain",
    label: "Educational Explain",
    blurb: "Premise → walk-through → takeaway. Good for breakdowns and primers.",
    beats: ["hook", "context", "evidence", "payoff"],
    captionTone: "Clear, sourced, no slang spike. Open with the question, close with the lesson.",
  },
  {
    id: "atmosphere-mood",
    label: "Atmosphere / Mood",
    blurb: "Vibe-led: visuals + lower-third only. No talking-head necessary.",
    beats: ["hook", "context", "payoff"],
    captionTone: "Sensory, short, almost lyrical. The visuals speak first.",
  },
  {
    id: "highlight-recap",
    label: "Highlight Recap",
    blurb: "Top moments back-to-back. Great for sports / event roundups.",
    beats: ["hook", "evidence", "evidence", "evidence", "payoff"],
    captionTone: "Listy and momentum-driven. Each beat is its own micro-headline.",
  },
  {
    id: "interview-pull",
    label: "Interview Pull",
    blurb: "Pull a quote-worthy moment out of a longer interview.",
    beats: ["hook", "context", "reveal", "payoff"],
    captionTone: "Anchor the speaker, set the stakes, let the quote land. Credit the source clearly.",
  },
];

export function clipGoalById(id: ClipGoalId | string): ClipGoalPreset {
  return CLIP_GOAL_PRESETS.find((g) => g.id === id) ?? CLIP_GOAL_PRESETS[0];
}

export const CLIP_PLATFORM_PRESETS: ClipPlatformPreset[] = [
  { id: "tiktok", label: "TikTok", aspect: "9:16", maxLengthSec: 180, blurb: "Vertical. Hook in the first 2 seconds." },
  { id: "reels", label: "Instagram Reels", aspect: "9:16", maxLengthSec: 90, blurb: "Vertical. Music-friendly. Caption matters." },
  { id: "shorts", label: "YouTube Shorts", aspect: "9:16", maxLengthSec: 60, blurb: "Vertical. Subscribe-baiting close works." },
  { id: "x-video", label: "X / Twitter Video", aspect: "16:9", maxLengthSec: 140, blurb: "Landscape. Auto-plays muted — open with motion + captions." },
  { id: "ig-feed-video", label: "Instagram Feed Video", aspect: "1:1", maxLengthSec: 60, blurb: "Square reads on every device. Heavy on captions." },
  { id: "website-embed", label: "Website Embed", aspect: "16:9", maxLengthSec: 600, blurb: "Long-form OK. Title + thumbnail land the watch." },
  { id: "youtube-long", label: "YouTube Long-form", aspect: "16:9", maxLengthSec: 1800, blurb: "Long-form. Chapters welcome." },
];

export function clipPlatformById(id: ClipPlatformId | string): ClipPlatformPreset {
  return CLIP_PLATFORM_PRESETS.find((p) => p.id === id) ?? CLIP_PLATFORM_PRESETS[0];
}

export const CLIP_LENGTH_BUCKETS: ClipLengthBucket[] = [
  { id: "ultra-short", label: "≤ 15s", range: [6, 15] },
  { id: "short", label: "16–30s", range: [16, 30] },
  { id: "medium", label: "31–60s", range: [31, 60] },
  { id: "long", label: "61–180s", range: [61, 180] },
  { id: "extended", label: "> 180s", range: [181, 1800] },
];

export function lengthBucketById(id: ClipLengthBucketId | string): ClipLengthBucket {
  return CLIP_LENGTH_BUCKETS.find((b) => b.id === id) ?? CLIP_LENGTH_BUCKETS[2];
}

/**
 * Operator-provided input the engine consumes. None of these are auto-filled
 * from external services — the operator types or pastes them.
 */
export interface CutPlanInput {
  brand: string;
  brandName: string;
  /** Short noun phrase: "Drake Toronto Forum surprise set." */
  topic: string;
  goal: ClipGoalId;
  platform: ClipPlatformId;
  length: ClipLengthBucketId;
  /** Notes / context the editor needs to honor. */
  notes: string;
  /** Optional intended on-screen headline. */
  headline?: string;
  /** Optional speaker name for lower-third. */
  speakerName?: string;
  /** Optional speaker title / role for lower-third. */
  speakerTitle?: string;
  /** Optional source / credit (e.g. "OVO 20 footage"). */
  source?: string;
  /** Tray of staged asset names (filenames only — no blobs persisted here). */
  assetFilenames?: string[];
}

export interface CutSegment {
  beat: SegmentBeat;
  label: string;
  /** Suggested duration in seconds for this beat. */
  durationSec: number;
  /** Plain-English direction for the editor. */
  direction: string;
}

export interface LowerThirdPlan {
  primary: string;
  secondary: string;
  credit: string;
}

export interface ThumbnailPlan {
  bigWord: string;
  tagline: string;
  credit: string;
  faceFocus: string;
}

export interface CaptionPack {
  hook: string;
  body: string;
  hashtags: string[];
  cta: string;
}

export interface CutPlan {
  id: string;
  createdAt: string;
  input: CutPlanInput;
  totalLengthSec: number;
  segments: CutSegment[];
  hooks: string[];
  lowerThird: LowerThirdPlan;
  thumbnail: ThumbnailPlan;
  caption: CaptionPack;
  editorNotes: string[];
  exportChecklist: string[];
  verificationNotes: string[];
}

function makeId(): string {
  return `cp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function divideLength(beats: SegmentBeat[], totalSec: number): number[] {
  // Hook gets ~15%, CTA ~10%, rest evenly. Always rounded to whole seconds.
  const isCta = (b: SegmentBeat) => b === "cta";
  const isHook = (b: SegmentBeat) => b === "hook";
  const weights = beats.map((b) => (isHook(b) ? 1.5 : isCta(b) ? 1 : 2));
  const sum = weights.reduce((a, c) => a + c, 0);
  const raw = weights.map((w) => Math.max(2, Math.round((w / sum) * totalSec)));
  // Adjust to match total
  let diff = totalSec - raw.reduce((a, c) => a + c, 0);
  for (let i = 0; diff !== 0 && i < raw.length * 4; i += 1) {
    const idx = i % raw.length;
    if (diff > 0) {
      raw[idx] += 1;
      diff -= 1;
    } else if (raw[idx] > 2) {
      raw[idx] -= 1;
      diff += 1;
    }
  }
  return raw;
}

function titleize(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function firstSentence(s: string): string {
  const m = s.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s/);
  return m[0] ?? s.trim();
}

function topKeywords(s: string, n = 5): string[] {
  const stop = new Set([
    "the", "and", "for", "with", "that", "this", "from", "have", "has", "are",
    "was", "were", "will", "into", "your", "you", "they", "their", "them", "about",
    "after", "before", "over", "under", "than", "then", "when", "what", "which",
    "while", "would", "could", "should", "been", "being", "also", "just", "more",
    "most", "some", "such", "only", "very", "into", "onto", "out", "its", "his",
    "her", "our", "but", "not", "all", "any", "who", "how", "her", "him",
  ]);
  const words = (s.toLowerCase().match(/[a-z0-9']{3,}/g) ?? []).filter(
    (w) => !stop.has(w),
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= n) break;
  }
  return out;
}

function inferHashtags(input: CutPlanInput, kws: string[]): string[] {
  const brand = input.brandName.replace(/\s+/g, "");
  const platformTag =
    input.platform === "tiktok"
      ? "tiktok"
      : input.platform === "reels"
        ? "reels"
        : input.platform === "shorts"
          ? "shorts"
          : input.platform === "x-video"
            ? "xvideo"
            : input.platform === "ig-feed-video"
              ? "instagram"
              : "video";
  const tagged = kws.map((k) => k.replace(/[^a-z0-9]/g, "")).filter((k) => k.length > 2);
  return Array.from(
    new Set([
      brand,
      "HavenMedia",
      platformTag,
      ...tagged.slice(0, 4),
    ]),
  ).map((t) => `#${t}`);
}

export function buildCutPlan(input: CutPlanInput): CutPlan {
  const goal = clipGoalById(input.goal);
  const platform = clipPlatformById(input.platform);
  const lengthBucket = lengthBucketById(input.length);

  // Pick a concrete target length: midpoint of the bucket but never above the
  // platform cap.
  const [lo, hi] = lengthBucket.range;
  const mid = Math.round((lo + hi) / 2);
  const totalSec = Math.min(mid, platform.maxLengthSec);

  const durations = divideLength(goal.beats, totalSec);
  const segments: CutSegment[] = goal.beats.map((beat, i) => ({
    beat,
    label: beatLabel(beat),
    durationSec: durations[i],
    direction: beatDirection(beat, input, goal),
  }));

  const cleanTopic = firstSentence(input.topic) || input.topic.trim();
  const kws = topKeywords(`${cleanTopic} ${input.notes ?? ""}`);

  const hooks: string[] = [
    `${input.headline?.trim() || cleanTopic}.`,
    `What ${input.brandName} caught on tape from ${cleanTopic}.`,
    `Wait for it — the ${kws[0] ? titleize(kws[0]) : "moment"} no one was ready for.`,
    `${input.brandName} broke it first: ${cleanTopic}.`,
  ];

  const lowerThird: LowerThirdPlan = {
    primary: input.speakerName?.trim() || input.brandName.toUpperCase(),
    secondary:
      input.speakerTitle?.trim() ||
      (input.headline?.trim() ?? `${cleanTopic}`.slice(0, 60)),
    credit:
      input.source?.trim() ||
      `${input.brandName} · ${input.assetFilenames?.[0] ?? "Source footage"}`,
  };

  const thumbnail: ThumbnailPlan = {
    bigWord: (input.headline?.split(/\s+/)[0] ?? kws[0] ?? "WATCH").toUpperCase(),
    tagline: input.headline?.trim() || `${cleanTopic}`.slice(0, 72),
    credit: `${input.brandName} · ${input.source ?? "On-tape"}`,
    faceFocus:
      input.speakerName?.trim()
        ? `Center ${input.speakerName} face in the safe-zone third.`
        : "Pick the highest-energy frame for the cover.",
  };

  const caption: CaptionPack = {
    hook: hooks[0],
    body: `${cleanTopic}. ${goal.captionTone} ${
      input.notes ? `Notes: ${firstSentence(input.notes)}` : ""
    }`.trim(),
    hashtags: inferHashtags(input, kws),
    cta:
      input.platform === "shorts"
        ? "Subscribe — more on the channel."
        : input.platform === "tiktok"
          ? "Follow for the full edit + part 2."
          : input.platform === "reels"
            ? "Save this. Send to a friend who needs it."
            : input.platform === "x-video"
              ? "Reply with your take."
              : "Full story on the site — link in bio.",
  };

  const editorNotes: string[] = [
    `Target length: ${totalSec}s (bucket ${lengthBucket.label}).`,
    `Aspect: ${platform.aspect}. Safe zones matter on ${platform.label}.`,
    `Caption-on by default — assume the viewer is muted.`,
    input.assetFilenames && input.assetFilenames.length > 0
      ? `Source assets staged: ${input.assetFilenames.join(", ")}.`
      : `No assets staged yet — pull them before the timeline pass.`,
    input.notes.trim() ? `Editor brief: ${firstSentence(input.notes)}` : "Add editor brief in Notes.",
  ];

  const exportChecklist: string[] = [
    `Export ${platform.aspect} at ${platform.aspect === "9:16" ? "1080×1920" : platform.aspect === "1:1" ? "1080×1080" : "1920×1080"}.`,
    `Bake captions or attach an SRT file.`,
    `Confirm lower-third reads at ${platform.aspect === "9:16" ? "story" : "feed"} preview size.`,
    `Confirm thumbnail readable at a 240px grid cell.`,
    `Confirm credit line matches the source.`,
    `Save the cut plan receipt with the file for proof.`,
  ];

  const verificationNotes: string[] = [
    `No live transcription was run here — paste the transcript or pull from the source file.`,
    `Quote any speaker line verbatim from the source. Do not paraphrase as a quote.`,
    `If using third-party footage, confirm rights before manual publish.`,
    `If the clip implies a legal, medical, financial, or criminal claim, route to editorial for verification.`,
  ];

  return {
    id: makeId(),
    createdAt: new Date().toISOString(),
    input,
    totalLengthSec: totalSec,
    segments,
    hooks,
    lowerThird,
    thumbnail,
    caption,
    editorNotes,
    exportChecklist,
    verificationNotes,
  };
}

function beatLabel(b: SegmentBeat): string {
  switch (b) {
    case "hook":
      return "Hook";
    case "setup":
      return "Setup";
    case "context":
      return "Context";
    case "reveal":
      return "Reveal";
    case "evidence":
      return "Evidence";
    case "payoff":
      return "Payoff";
    case "cta":
      return "Call to action";
  }
}

function beatDirection(
  b: SegmentBeat,
  input: CutPlanInput,
  goal: ClipGoalPreset,
): string {
  const topic = firstSentence(input.topic) || input.topic;
  switch (b) {
    case "hook":
      return `Open with the strongest visual + one-line claim (${topic}). No logo first.`;
    case "setup":
      return `Establish where, when, and who. Use lower-third primary name.`;
    case "context":
      return `Plant the stake: why this matters. Keep words off-screen, use captions.`;
    case "reveal":
      return `Hold the reveal frame for a full beat. Cut audio if it punches harder silent.`;
    case "evidence":
      return `Show the receipt: clip / quote / score / screen-grab. Cite source in the lower-third.`;
    case "payoff":
      return `Land the takeaway in one breath. This is the line viewers will quote.`;
    case "cta":
      return goal.id === "educational-explain"
        ? `Close with the takeaway sentence. Logo + handle last.`
        : `Direct ask: "${input.platform === "shorts" ? "Subscribe" : "Follow + save"}".`;
  }
}

/** Render the cut plan as Markdown for a copy/export receipt. */
export function cutPlanToMarkdown(plan: CutPlan): string {
  const lines: string[] = [];
  lines.push(`# WebEdit Cut Plan — ${plan.input.topic}`);
  lines.push("");
  lines.push(
    `**Brand:** ${plan.input.brandName}  \n**Goal:** ${clipGoalById(plan.input.goal).label}  \n**Platform:** ${clipPlatformById(plan.input.platform).label} (${clipPlatformById(plan.input.platform).aspect})  \n**Target length:** ${plan.totalLengthSec}s`,
  );
  lines.push("");
  lines.push("## Hooks");
  plan.hooks.forEach((h, i) => lines.push(`${i + 1}. ${h}`));
  lines.push("");
  lines.push("## Cut list");
  let running = 0;
  for (const s of plan.segments) {
    const start = running;
    const end = start + s.durationSec;
    lines.push(
      `- **${s.label}** (${formatTime(start)}–${formatTime(end)} · ${s.durationSec}s) — ${s.direction}`,
    );
    running = end;
  }
  lines.push("");
  lines.push("## Lower-third");
  lines.push(`- Primary: ${plan.lowerThird.primary}`);
  lines.push(`- Secondary: ${plan.lowerThird.secondary}`);
  lines.push(`- Credit: ${plan.lowerThird.credit}`);
  lines.push("");
  lines.push("## Thumbnail");
  lines.push(`- Big word: **${plan.thumbnail.bigWord}**`);
  lines.push(`- Tagline: ${plan.thumbnail.tagline}`);
  lines.push(`- Credit: ${plan.thumbnail.credit}`);
  lines.push(`- Face focus: ${plan.thumbnail.faceFocus}`);
  lines.push("");
  lines.push("## Caption pack");
  lines.push(`- Hook: ${plan.caption.hook}`);
  lines.push(`- Body: ${plan.caption.body}`);
  lines.push(`- CTA: ${plan.caption.cta}`);
  lines.push(`- Hashtags: ${plan.caption.hashtags.join(" ")}`);
  lines.push("");
  lines.push("## Editor notes");
  plan.editorNotes.forEach((n) => lines.push(`- ${n}`));
  lines.push("");
  lines.push("## Export checklist");
  plan.exportChecklist.forEach((n) => lines.push(`- [ ] ${n}`));
  lines.push("");
  lines.push("## Verification notes");
  plan.verificationNotes.forEach((n) => lines.push(`- ${n}`));
  return lines.join("\n");
}

function formatTime(sec: number): string {
  const mm = Math.floor(sec / 60).toString().padStart(2, "0");
  const ss = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

/** Lightweight receipt for the audit trail / Media Library. */
export interface CutPlanReceipt {
  id: string;
  createdAt: string;
  brand: string;
  brandName: string;
  topic: string;
  goal: ClipGoalId;
  platform: ClipPlatformId;
  totalLengthSec: number;
  segmentCount: number;
  hookCount: number;
}

export function cutPlanToReceipt(plan: CutPlan): CutPlanReceipt {
  return {
    id: plan.id,
    createdAt: plan.createdAt,
    brand: plan.input.brand,
    brandName: plan.input.brandName,
    topic: plan.input.topic,
    goal: plan.input.goal,
    platform: plan.input.platform,
    totalLengthSec: plan.totalLengthSec,
    segmentCount: plan.segments.length,
    hookCount: plan.hooks.length,
  };
}
