/**
 * HMG Collage layout engine.
 *
 * Pure data + math for the in-app multi-image collage builder. Defines a set of
 * layouts that combine 1–6 images with brand-aware headline / subheadline /
 * credit overlays. Every layout describes its slots in fractional coordinates
 * so the same composition renders identically at preview scale and at the full
 * export pixel canvas (1080×1350, 1920×1080, etc.).
 *
 * Honesty rule for this module:
 *   - Layouts are deterministic geometry — no fake AI generation hidden here.
 *   - Preview and export use the same composition; what the operator sees is
 *     exactly what html2canvas exports.
 */
export type CollageLayoutId =
  | "single-hero"
  | "hero-two-thumbs"
  | "two-up-split"
  | "three-up-strip"
  | "grid-2x2"
  | "news-card"
  | "lower-third"
  | "story-stack";

export type HeaderBand = "top" | "bottom" | "lower-third" | "none";

/** A fractional rectangle inside the canvas (0..1). */
export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CollageLayout {
  id: CollageLayoutId;
  label: string;
  short: string;
  blurb: string;
  /** Minimum images required to use this layout. */
  minImages: number;
  /** Maximum images this layout consumes. Extras are ignored. */
  maxImages: number;
  /** Image slots (rendered in order). */
  slots: Slot[];
  /** Where the brand header band sits. */
  headerBand: HeaderBand;
  /** Height of the header band as a fraction of canvas height. */
  headerFrac: number;
  /** Aspects this layout shines at. */
  bestFor: string[];
}

export const COLLAGE_LAYOUTS: CollageLayout[] = [
  {
    id: "single-hero",
    label: "Single Hero",
    short: "Hero",
    blurb: "One full-bleed image with a clean brand header band.",
    minImages: 1,
    maxImages: 1,
    slots: [{ x: 0, y: 0, w: 1, h: 1 }],
    headerBand: "bottom",
    headerFrac: 0.18,
    bestFor: ["Website hero", "Article featured", "Story"],
  },
  {
    id: "hero-two-thumbs",
    label: "Hero + Two Thumbs",
    short: "Hero + 2",
    blurb: "One lead image and two supporting thumbs underneath.",
    minImages: 3,
    maxImages: 3,
    slots: [
      { x: 0, y: 0, w: 1, h: 0.66 },
      { x: 0, y: 0.66, w: 0.5, h: 0.34 },
      { x: 0.5, y: 0.66, w: 0.5, h: 0.34 },
    ],
    headerBand: "top",
    headerFrac: 0.14,
    bestFor: ["News card", "Breaking story", "Multi-angle"],
  },
  {
    id: "two-up-split",
    label: "Two-up Split",
    short: "2-up",
    blurb: "Side-by-side comparison with brand header on top.",
    minImages: 2,
    maxImages: 2,
    slots: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
    headerBand: "top",
    headerFrac: 0.16,
    bestFor: ["Versus", "Before/after", "Two-subject feature"],
  },
  {
    id: "three-up-strip",
    label: "Three-up Strip",
    short: "3-up",
    blurb: "Three images side-by-side with a thick lower headline band.",
    minImages: 3,
    maxImages: 3,
    slots: [
      { x: 0, y: 0, w: 1 / 3, h: 1 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
    ],
    headerBand: "bottom",
    headerFrac: 0.22,
    bestFor: ["Trio feature", "Roundup", "Group story"],
  },
  {
    id: "grid-2x2",
    label: "2 × 2 Grid",
    short: "Grid",
    blurb: "Four images in a clean grid with a top brand band.",
    minImages: 4,
    maxImages: 4,
    slots: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
    headerBand: "top",
    headerFrac: 0.14,
    bestFor: ["Recap", "Photo essay", "Best-of"],
  },
  {
    id: "news-card",
    label: "News Card",
    short: "News",
    blurb: "Image left, headline + credit panel right.",
    minImages: 1,
    maxImages: 1,
    slots: [{ x: 0, y: 0, w: 0.56, h: 1 }],
    headerBand: "lower-third",
    headerFrac: 0,
    bestFor: ["Article preview", "Quote card", "Bulletin"],
  },
  {
    id: "lower-third",
    label: "Lower-Third",
    short: "Lower 3rd",
    blurb: "Full image with a heavy lower-third band for headline + credit.",
    minImages: 1,
    maxImages: 1,
    slots: [{ x: 0, y: 0, w: 1, h: 1 }],
    headerBand: "lower-third",
    headerFrac: 0.28,
    bestFor: ["Broadcast", "Talking-head", "Press card"],
  },
  {
    id: "story-stack",
    label: "Story Stack",
    short: "Stack",
    blurb: "Three images stacked vertically for story / reels feel.",
    minImages: 3,
    maxImages: 3,
    slots: [
      { x: 0, y: 0, w: 1, h: 1 / 3 },
      { x: 0, y: 1 / 3, w: 1, h: 1 / 3 },
      { x: 0, y: 2 / 3, w: 1, h: 1 / 3 },
    ],
    headerBand: "bottom",
    headerFrac: 0.12,
    bestFor: ["Story / Reels", "Sequence", "Build-up"],
  },
];

export function collageLayoutById(id: CollageLayoutId | string): CollageLayout {
  return COLLAGE_LAYOUTS.find((l) => l.id === id) ?? COLLAGE_LAYOUTS[0];
}

/** Filter layouts to the ones the current image count can satisfy. */
export function layoutsForImageCount(count: number): CollageLayout[] {
  return COLLAGE_LAYOUTS.filter((l) => count >= l.minImages);
}

/** Per-brand default layout when the operator hasn't picked one yet. */
export const BRAND_DEFAULT_LAYOUT: Record<string, CollageLayoutId> = {
  hiphophaven: "single-hero",
  raphaven: "lower-third",
  musichaven: "two-up-split",
  sportshaven: "hero-two-thumbs",
  fithaven: "single-hero",
  cannahaven: "news-card",
  hmg: "single-hero",
};

export function defaultLayoutForBrand(silo: string): CollageLayoutId {
  return BRAND_DEFAULT_LAYOUT[silo] ?? "single-hero";
}

/** Compose-time text the operator fills in. */
export interface CollageOverlay {
  headline: string;
  subheadline: string;
  credit: string;
}

export const EMPTY_OVERLAY: CollageOverlay = {
  headline: "",
  subheadline: "",
  credit: "",
};

/** Multi-asset entry in the upload tray. Tray order = render order. */
export interface CollageAsset {
  id: string;
  /** Session object URL used for local preview/export. */
  src: string;
  objectUrl?: string;
  /** Original filename (for receipts). */
  filename?: string;
  size?: number;
  type?: string;
  dimensions?: { width: number; height: number };
  readiness?: "ready" | "large" | "blocked";
  readinessLabel?: string;
  readinessDetail?: string;
  /** Source label rendered in the credit line if no explicit credit is set. */
  sourceLabel?: string;
}

/**
 * Resolve which assets fill which slots for a chosen layout.
 *
 * If the operator has more assets than the layout consumes, the extras are
 * preserved in the tray (for swapping). If they have fewer, the remaining
 * slots stay empty — the UI shows an honest "drop an image here" placeholder
 * instead of inventing pixels.
 */
export function resolveSlots(
  layout: CollageLayout,
  assets: CollageAsset[],
): Array<CollageAsset | null> {
  const out: Array<CollageAsset | null> = [];
  for (let i = 0; i < layout.slots.length; i += 1) {
    out.push(assets[i] ?? null);
  }
  return out;
}
