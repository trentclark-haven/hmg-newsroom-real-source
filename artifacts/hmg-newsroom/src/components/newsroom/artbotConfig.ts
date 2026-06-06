import type { FramePlatform } from "./SocialFrame";

export type AssetSource = "upload" | "ai";

export type QualityLabelId =
  | "editorial-ready"
  | "official-source"
  | "ai-concept"
  | "internal-placeholder"
  | "not-verified";

export type LabelTone = "green" | "blue" | "amber" | "gray" | "red";

export interface QualityLabelDef {
  id: QualityLabelId;
  label: string;
  short: string;
  tone: LabelTone;
  description: string;
}

export const QUALITY_LABELS: Record<QualityLabelId, QualityLabelDef> = {
  "editorial-ready": {
    id: "editorial-ready",
    label: "Editorial-ready uploaded asset",
    short: "Editorial-ready",
    tone: "green",
    description: "Licensed or owned photo, cleared for publication.",
  },
  "official-source": {
    id: "official-source",
    label: "Official-source frame",
    short: "Official source",
    tone: "blue",
    description:
      "Screen-grabbed from an official channel (YouTube, Vevo, league/team, press).",
  },
  "ai-concept": {
    id: "ai-concept",
    label: "Concept art draft",
    short: "Concept art",
    tone: "amber",
    description:
      "AI-generated concept art — not a real photo and never a real person.",
  },
  "internal-placeholder": {
    id: "internal-placeholder",
    label: "Internal placeholder",
    short: "Placeholder",
    tone: "gray",
    description: "Internal mockup only — replace before publishing.",
  },
  "not-verified": {
    id: "not-verified",
    label: "Not celebrity-verified",
    short: "Not verified",
    tone: "red",
    description:
      "Likeness is not verified. Never present as a real public figure.",
  },
};

/** Labels an operator may assign to an uploaded asset. */
export const UPLOAD_LABEL_CHOICES: QualityLabelId[] = [
  "editorial-ready",
  "official-source",
  "internal-placeholder",
];

export const TONE_STYLES: Record<
  LabelTone,
  { bg: string; fg: string; border: string }
> = {
  green: { bg: "rgba(34,197,94,0.16)", fg: "#bbf7d0", border: "rgba(34,197,94,0.55)" },
  blue: { bg: "rgba(59,130,246,0.16)", fg: "#bfdbfe", border: "rgba(59,130,246,0.55)" },
  amber: { bg: "rgba(245,158,11,0.18)", fg: "#fde68a", border: "rgba(245,158,11,0.6)" },
  gray: { bg: "rgba(148,163,184,0.16)", fg: "#e2e8f0", border: "rgba(148,163,184,0.55)" },
  red: { bg: "rgba(239,68,68,0.2)", fg: "#fecaca", border: "rgba(239,68,68,0.6)" },
};

/**
 * Resolve the quality labels that apply to the current asset.
 * AI output is ALWAYS locked to "concept only" + "not celebrity-verified".
 */
export function labelsForAsset(
  origin: "upload" | "ai" | null,
  uploadLabel: QualityLabelId,
): QualityLabelDef[] {
  if (origin === "ai") {
    return [QUALITY_LABELS["ai-concept"], QUALITY_LABELS["not-verified"]];
  }
  if (origin === "upload") {
    return [QUALITY_LABELS[uploadLabel] ?? QUALITY_LABELS["editorial-ready"]];
  }
  return [];
}

/** Non-person, concept-only prompt presets WebArt is meant for. */
export interface AiUseChip {
  label: string;
  prompt: string;
}

export const AI_USE_CHIPS: AiUseChip[] = [
  { label: "Abstract background", prompt: "abstract editorial background, no people, " },
  { label: "Brand texture", prompt: "seamless brand texture, geometric pattern, no people, " },
  {
    label: "Concept art",
    prompt: "conceptual editorial illustration, symbolic, no real person, ",
  },
  {
    label: "CannaHaven psychedelic",
    prompt: "psychedelic cannabis-culture texture, swirling color, no people, ",
  },
  {
    label: "FitHaven neon",
    prompt: "neon fitness-studio atmosphere, glowing gradient, empty room, no people, ",
  },
  {
    label: "SportsHaven atmosphere",
    prompt: "empty stadium atmosphere, golden-hour light, dramatic, no people, ",
  },
  { label: "Gradient backdrop", prompt: "premium gradient backdrop, soft grain, no people, " },
];

/** Default frame/export preset per Haven silo. */
export const BRAND_FRAME_PRESETS: Record<string, FramePlatform[]> = {
  hiphophaven: ["website", "instagram-feed", "instagram-story", "x"],
  raphaven: ["instagram-story", "tiktok", "youtube-short", "x"],
  musichaven: ["website", "instagram-feed", "youtube-thumbnail", "facebook"],
  sportshaven: ["website", "x", "facebook", "youtube-thumbnail"],
  fithaven: ["instagram-feed", "instagram-story", "tiktok", "website"],
  cannahaven: ["instagram-feed", "instagram-story", "website", "facebook"],
  hmg: ["website", "facebook", "x", "youtube-thumbnail"],
};

export interface OfficialSource {
  name: string;
  how: string;
}

export const OFFICIAL_SOURCES: OfficialSource[] = [
  { name: "Official YouTube", how: "Play at highest quality, pause on a sharp frame, screenshot, then crop here." },
  { name: "Vevo", how: "Use the official Vevo upload — capture performance/press frames, not fan re-uploads." },
  { name: "League / team channels", how: "Pull highlight or media-day frames from the official league or team account." },
  { name: "Official interviews", how: "Screen-grab from the verified outlet's upload; keep the lower-third for credit." },
  { name: "Press conferences", how: "Capture podium frames from the official broadcast." },
  { name: "Podcasts", how: "Use the show's official video feed and grab a clean speaker frame." },
  { name: "Trailers", how: "Capture from the official studio or label trailer." },
  { name: "Media day footage", how: "Grab portrait/atmosphere frames from official media-day reels." },
];

export const SCREENGRAB_STEPS: string[] = [
  "Open the OFFICIAL upload — verified channel only.",
  "Set the player to the highest resolution available.",
  "Pause on a sharp, well-lit frame.",
  "Screenshot at full resolution and save the file.",
  "Upload it here, crop to your target aspect, then label it Official-source frame.",
  "Always credit the source channel in your published caption.",
];

/**
 * Concept-only enforcement for the AI path. The suffix is forced onto every
 * AI prompt so the provider is instructed to avoid real people / likenesses,
 * and the risk patterns hard-block prompts that explicitly ask for a real
 * public-figure depiction (use the upload path for real people instead).
 */
export const CONCEPT_ONLY_SUFFIX =
  " — concept art only, no real people, no celebrity likeness, no identifiable public figures";

const LIKENESS_RISK_PATTERNS: RegExp[] = [
  /\bdeep ?fakes?\b/i,
  /\blook[- ]?alikes?\b/i,
  /\blikeness of\b/i,
  /\bimpersonat/i,
  /\bcelebrit/i,
  /\b(real|actual) (photo|image|picture|portrait) of\b/i,
  /\bmake (it|him|her|them) look like\b/i,
  /\bas (a |an )?(celebrity|famous|real person)\b/i,
  /\bphotoreal(istic)? (portrait|face|headshot) of\b/i,
];

/** True when a prompt explicitly requests a real-person / celebrity likeness. */
export function detectLikenessRisk(prompt: string): boolean {
  return LIKENESS_RISK_PATTERNS.some((re) => re.test(prompt));
}

/** Force non-person constraints onto an AI prompt (idempotent). */
export function enforceConceptOnly(prompt: string): string {
  const trimmed = prompt.trim();
  if (/no real people/i.test(trimmed)) return trimmed;
  return trimmed + CONCEPT_ONLY_SUFFIX;
}

/**
 * A practical, plain-English image brief built from the real notes an editor
 * pasted. Everything here is derived from the source text — no vague filler. If
 * there is no usable source text, the builder returns null so the UI can say so
 * honestly instead of inventing content.
 */
export interface ImageBrief {
  headlineOptions: string[];
  captionOptions: string[];
  altText: string;
  sourceNote: string;
  visualTreatment: string;
  brandColorDirection: string;
  outputSizes: string[];
  exportChecklist: string[];
}

const BRIEF_STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "has", "are",
  "was", "were", "will", "into", "your", "you", "they", "their", "them",
  "about", "after", "before", "over", "under", "than", "then", "when", "what",
  "which", "while", "would", "could", "should", "been", "being", "also", "just",
  "more", "most", "some", "such", "only", "very", "into", "onto", "out",
  "its", "his", "her", "our", "but", "not", "all", "any", "who", "how",
]);

function briefCapitalize(word: string): string {
  return word.length === 0 ? word : word[0].toUpperCase() + word.slice(1);
}

/** Required export canvases an editor should produce for a finished image. */
export const IMAGE_BRIEF_OUTPUT_SIZES: string[] = [
  "Website hero — 1200 × 675",
  "Instagram feed — 1080 × 1350",
  "Instagram story / Reels / TikTok — 1080 × 1920",
  "YouTube thumbnail — 1280 × 720",
  "X / Facebook link — 1200 × 630",
];

/**
 * Build a concrete image brief from the editor's notes. Returns null when there
 * is no usable source text (caller should show an honest "add notes" message).
 */
export function buildImageBrief(
  source: string,
  brandName: string,
  brandColor: string,
): ImageBrief | null {
  const text = source.replace(/\s+/g, " ").trim();
  if (text.length < 12) return null;

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const core = sentences[0] || text;
  const shortCore =
    core.length > 72 ? `${core.slice(0, 69).trim()}…` : core;

  const words: string[] = text.toLowerCase().match(/[a-z0-9']+/g) || [];
  const keywords = Array.from(
    new Set(words.filter((w) => w.length > 3 && !BRIEF_STOP_WORDS.has(w))),
  ).slice(0, 6);
  const topic = keywords.slice(0, 3).map(briefCapitalize).join(" ");
  const leadKeyword = keywords[0] ? briefCapitalize(keywords[0]) : "Update";

  const headlineOptions = Array.from(
    new Set(
      [
        shortCore.toUpperCase(),
        topic ? topic.toUpperCase() : shortCore.toUpperCase(),
        `${brandName.toUpperCase()}: ${leadKeyword.toUpperCase()}`,
      ].filter((h) => h.trim().length > 0),
    ),
  );

  const captionOptions = Array.from(
    new Set(
      [
        shortCore,
        topic
          ? `${topic} — the latest from ${brandName}.`
          : `${brandName} update.`,
        keywords.length > 0
          ? `Inside: ${keywords.slice(0, 4).map(briefCapitalize).join(", ")}.`
          : `${brandName} story image.`,
      ].filter((c) => c.trim().length > 0),
    ),
  );

  const altText = `${brandName} image — ${
    topic ? topic.toLowerCase() : shortCore.toLowerCase()
  }`.slice(0, 120);

  const sourceNote =
    "Use a licensed photo or an official-source frame, and credit the source channel in your published caption. AI images are concept-only and must never depict a real person.";

  const visualTreatment = topic
    ? `Lead with a strong, well-lit subject that reads at a glance. Keep ${topic.toLowerCase()} as the focal point, leave clean space for the headline band, and avoid clutter at the edges where crops happen.`
    : "Lead with a strong, well-lit subject that reads at a glance. Leave clean space for the headline band and keep the edges clear so crops stay safe.";

  const brandColorDirection = `Anchor the headline band and accents to the ${brandName} brand color (${brandColor}). Keep text high-contrast (white or black) so it stays legible over the photo.`;

  const exportChecklist = [
    "Pick the right source: licensed photo or official-source frame.",
    "Crop the subject so nothing important sits in the trim zone.",
    "Apply the brand frame and headline band.",
    "Confirm the headline is readable at thumbnail size.",
    "Export every size you need (see list above).",
    "Add the source credit to the published caption.",
  ];

  return {
    headlineOptions,
    captionOptions,
    altText,
    sourceNote,
    visualTreatment,
    brandColorDirection,
    outputSizes: IMAGE_BRIEF_OUTPUT_SIZES,
    exportChecklist,
  };
}

/** Aspect-lock presets for the crop editor. */
export interface AspectPreset {
  label: string;
  value: number;
}

export const ASPECT_PRESETS: AspectPreset[] = [
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
  { label: "1.91:1", value: 1.91 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "3:2", value: 3 / 2 },
];
