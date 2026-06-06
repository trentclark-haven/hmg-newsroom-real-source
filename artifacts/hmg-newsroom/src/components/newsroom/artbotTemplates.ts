/**
 * WebArt template engine config.
 *
 * Two orthogonal axes define the four core template families:
 *   - backdrop: brand-colored vs white header band
 *   - position: header band at the TOP vs the BOTTOM
 * Header letters are always black per the editorial spec.
 *
 * Export sizes are explicit pixel canvases; every on-stage measurement is
 * fractional / container-relative so the same composition renders identically
 * at any size.
 */

export type HeaderBackdrop = "brand" | "white";
export type HeaderPosition = "top" | "bottom";

export interface TemplateFamily {
  id: string;
  label: string;
  short: string;
  backdrop: HeaderBackdrop;
  position: HeaderPosition;
}

export const TEMPLATE_FAMILIES: TemplateFamily[] = [
  {
    id: "brand-top",
    label: "Brand band · header top",
    short: "Brand · Top",
    backdrop: "brand",
    position: "top",
  },
  {
    id: "brand-bottom",
    label: "Brand band · header bottom",
    short: "Brand · Bottom",
    backdrop: "brand",
    position: "bottom",
  },
  {
    id: "white-top",
    label: "White band · header top",
    short: "White · Top",
    backdrop: "white",
    position: "top",
  },
  {
    id: "white-bottom",
    label: "White band · header bottom",
    short: "White · Bottom",
    backdrop: "white",
    position: "bottom",
  },
];

export function familyById(id: string): TemplateFamily {
  return TEMPLATE_FAMILIES.find((f) => f.id === id) ?? TEMPLATE_FAMILIES[0];
}

export interface ExportSize {
  id: string;
  label: string;
  /** Human purpose, e.g. "Instagram Feed / Portrait". */
  purpose: string;
  width: number;
  height: number;
  /** Header band height as a fraction of canvas height for this size. */
  headerFrac: number;
}

/**
 * The five required export canvases — exact Founder-spec dimensions. Header
 * fraction is tuned per aspect so the band reads well on tall (story), square
 * and wide (landscape) outputs. All five are always visible in the studio.
 */
export const EXPORT_SIZES: ExportSize[] = [
  { id: "portrait-1080x1350", label: "1080 × 1350", purpose: "Instagram Feed / Portrait", width: 1080, height: 1350, headerFrac: 0.16 },
  { id: "square-1080x1080", label: "1080 × 1080", purpose: "Instagram Square", width: 1080, height: 1080, headerFrac: 0.18 },
  { id: "story-1080x1920", label: "1080 × 1920", purpose: "Story / TikTok / Reels", width: 1080, height: 1920, headerFrac: 0.14 },
  { id: "landscape-1200x675", label: "1200 × 675", purpose: "Website Hero / Social Link", width: 1200, height: 675, headerFrac: 0.22 },
  { id: "landscape-1920x1080", label: "1920 × 1080", purpose: "YouTube / Landscape Wide", width: 1920, height: 1080, headerFrac: 0.2 },
];

export function sizeById(id: string): ExportSize {
  return EXPORT_SIZES.find((s) => s.id === id) ?? EXPORT_SIZES[0];
}

/**
 * Premium frame styles — editorial visual treatments applied *around* the asset.
 * These ENHANCE the four required header families; they never replace them. A
 * frame style is a bundle of treatment tokens (border, matte, scrim, edge accent
 * and corner flash) that TemplateStage interprets, so the same composition
 * exports identically at every pixel size. No cheap "border/solid" toggles.
 */
export type FrameAccentColor = "brand" | "white" | "black";

export interface FrameStyle {
  id: string;
  label: string;
  short: string;
  vibe: string;
  /** Outer border width as a % of canvas width. 0 = none. */
  borderPct: number;
  borderColor: FrameAccentColor;
  /** Inset matte around the image as a % of canvas width. 0 = none. */
  mattePct: number;
  matteColor: FrameAccentColor;
  /** Legibility scrim gradient over the image. */
  scrim: "none" | "bottom" | "top" | "full";
  /** Accent bar hugging one edge of the image area. */
  accentEdge: "none" | "left" | "right" | "top" | "bottom";
  accentPct: number;
  accentColor: FrameAccentColor;
  /** Diagonal corner flash (no text) in the top-left of the image. */
  cornerFlash: boolean;
  cornerColor: FrameAccentColor;
}

export const FRAME_STYLES: FrameStyle[] = [
  { id: "clean-editorial", label: "Clean Editorial", short: "Editorial", vibe: "Thin white keyline, gallery calm.", borderPct: 0.6, borderColor: "white", mattePct: 0, matteColor: "white", scrim: "none", accentEdge: "none", accentPct: 0, accentColor: "brand", cornerFlash: false, cornerColor: "brand" },
  { id: "bold-tabloid", label: "Bold Tabloid", short: "Tabloid", vibe: "Thick brand frame, loud splash.", borderPct: 1.8, borderColor: "brand", mattePct: 0, matteColor: "white", scrim: "bottom", accentEdge: "none", accentPct: 0, accentColor: "brand", cornerFlash: false, cornerColor: "brand" },
  { id: "prestige-music", label: "Prestige Music", short: "Prestige", vibe: "Black matte, white inner line.", borderPct: 0.5, borderColor: "white", mattePct: 2.6, matteColor: "black", scrim: "bottom", accentEdge: "none", accentPct: 0, accentColor: "brand", cornerFlash: false, cornerColor: "brand" },
  { id: "breaking-news", label: "Breaking News", short: "Breaking", vibe: "Brand lower bar, urgent corner flash.", borderPct: 0, borderColor: "brand", mattePct: 0, matteColor: "white", scrim: "bottom", accentEdge: "bottom", accentPct: 6, accentColor: "brand", cornerFlash: true, cornerColor: "brand" },
  { id: "sports-scoreboard", label: "Sports Scoreboard", short: "Scoreboard", vibe: "Heavy bottom brand strip.", borderPct: 0.8, borderColor: "white", mattePct: 0, matteColor: "white", scrim: "bottom", accentEdge: "bottom", accentPct: 9, accentColor: "brand", cornerFlash: false, cornerColor: "brand" },
  { id: "canna-culture", label: "Canna Culture", short: "Culture", vibe: "Soft brand side rail.", borderPct: 0, borderColor: "brand", mattePct: 0, matteColor: "white", scrim: "bottom", accentEdge: "left", accentPct: 4, accentColor: "brand", cornerFlash: false, cornerColor: "brand" },
  { id: "fit-motivation", label: "Fit Motivation", short: "Motivation", vibe: "Brand base + crisp keyline.", borderPct: 0.8, borderColor: "white", mattePct: 0, matteColor: "white", scrim: "bottom", accentEdge: "bottom", accentPct: 5, accentColor: "brand", cornerFlash: false, cornerColor: "brand" },
  { id: "minimal-white", label: "Minimal White", short: "Minimal", vibe: "Wide white matte, museum air.", borderPct: 0.4, borderColor: "black", mattePct: 5, matteColor: "white", scrim: "none", accentEdge: "none", accentPct: 0, accentColor: "brand", cornerFlash: false, cornerColor: "brand" },
  { id: "heavy-lower-third", label: "Heavy Lower Third", short: "Lower 3rd", vibe: "Tall brand lower-third bar.", borderPct: 0, borderColor: "brand", mattePct: 0, matteColor: "white", scrim: "bottom", accentEdge: "bottom", accentPct: 14, accentColor: "brand", cornerFlash: false, cornerColor: "brand" },
  { id: "split-statement", label: "Split / Statement", short: "Statement", vibe: "Bold brand left column.", borderPct: 0, borderColor: "brand", mattePct: 1, matteColor: "black", scrim: "bottom", accentEdge: "left", accentPct: 8, accentColor: "brand", cornerFlash: false, cornerColor: "brand" },
  { id: "comment-receipt", label: "Comment Receipt", short: "Receipt", vibe: "White matte to frame a screengrab.", borderPct: 0.8, borderColor: "white", mattePct: 3, matteColor: "white", scrim: "none", accentEdge: "none", accentPct: 0, accentColor: "brand", cornerFlash: false, cornerColor: "brand" },
  { id: "x-post-spotlight", label: "X Post Spotlight", short: "Spotlight", vibe: "Full scrim to spotlight an overlay.", borderPct: 0.5, borderColor: "white", mattePct: 0, matteColor: "white", scrim: "full", accentEdge: "none", accentPct: 0, accentColor: "brand", cornerFlash: false, cornerColor: "brand" },
  { id: "ig-comment-stack", label: "IG Comment Stack", short: "IG Stack", vibe: "White keyline for stacked comments.", borderPct: 1, borderColor: "white", mattePct: 0, matteColor: "white", scrim: "bottom", accentEdge: "none", accentPct: 0, accentColor: "brand", cornerFlash: false, cornerColor: "brand" },
  { id: "evidence-card", label: "Evidence Card", short: "Evidence", vibe: "Heavy black matte, document feel.", borderPct: 1.4, borderColor: "black", mattePct: 2, matteColor: "black", scrim: "none", accentEdge: "none", accentPct: 0, accentColor: "brand", cornerFlash: false, cornerColor: "brand" },
  { id: "quote-pullout", label: "Quote Pullout", short: "Quote", vibe: "Brand rail for pull-quotes.", borderPct: 0, borderColor: "brand", mattePct: 0, matteColor: "white", scrim: "bottom", accentEdge: "left", accentPct: 5, accentColor: "brand", cornerFlash: false, cornerColor: "brand" },
];

export const DEFAULT_FRAME_STYLE_ID = "clean-editorial";

export function frameStyleById(id: string): FrameStyle {
  return FRAME_STYLES.find((f) => f.id === id) ?? FRAME_STYLES[0];
}

/** Default export sizes selected when a brand preset is applied. */
export const DEFAULT_EXPORT_SIZE_IDS: string[] = [
  "portrait-1080x1350",
  "square-1080x1080",
  "story-1080x1920",
];

/** Per-brand default family + frame style + export-size selection. */
export const BRAND_TEMPLATE_PRESETS: Record<
  string,
  { family: string; frame: string; sizes: string[] }
> = {
  hiphophaven: { family: "brand-bottom", frame: "bold-tabloid", sizes: ["portrait-1080x1350", "story-1080x1920", "square-1080x1080"] },
  raphaven: { family: "brand-top", frame: "x-post-spotlight", sizes: ["story-1080x1920", "portrait-1080x1350"] },
  musichaven: { family: "white-bottom", frame: "prestige-music", sizes: ["square-1080x1080", "landscape-1920x1080"] },
  sportshaven: { family: "brand-top", frame: "sports-scoreboard", sizes: ["landscape-1920x1080", "landscape-1200x675", "portrait-1080x1350"] },
  fithaven: { family: "white-top", frame: "fit-motivation", sizes: ["portrait-1080x1350", "story-1080x1920"] },
  cannahaven: { family: "brand-bottom", frame: "canna-culture", sizes: ["square-1080x1080", "portrait-1080x1350"] },
  hmg: { family: "white-bottom", frame: "clean-editorial", sizes: ["landscape-1200x675", "landscape-1920x1080", "square-1080x1080"] },
};

export function presetForSilo(silo: string): { family: string; frame: string; sizes: string[] } {
  return (
    BRAND_TEMPLATE_PRESETS[silo] ?? {
      family: "brand-top",
      frame: DEFAULT_FRAME_STYLE_ID,
      sizes: DEFAULT_EXPORT_SIZE_IDS,
    }
  );
}

/**
 * One-click starter recipes — a curated bundle of header family + frame style +
 * export size that produces a postable look instantly. These are brand-agnostic
 * (brand colour/logo still come from the active silo) so any starter works for
 * any silo. They sit on top of the four required header families and the 15
 * frame styles; they never introduce new primitives.
 */
export interface TemplateStarter {
  id: string;
  label: string;
  blurb: string;
  family: string;
  frame: string;
  sizes: string[];
}

export const TEMPLATE_STARTERS: TemplateStarter[] = [
  { id: "breaking-blast", label: "Breaking News Blast", blurb: "Urgent brand-top alert card.", family: "brand-top", frame: "breaking-news", sizes: ["portrait-1080x1350", "story-1080x1920"] },
  { id: "receipt-post", label: "Receipt Post", blurb: "White matte to frame a screengrab.", family: "white-bottom", frame: "comment-receipt", sizes: ["portrait-1080x1350"] },
  { id: "x-spotlight", label: "X Post Spotlight", blurb: "Full scrim spotlighting a tweet.", family: "brand-bottom", frame: "x-post-spotlight", sizes: ["portrait-1080x1350", "story-1080x1920"] },
  { id: "music-drop", label: "Music Drop", blurb: "Glossy prestige album/news drop.", family: "brand-bottom", frame: "prestige-music", sizes: ["square-1080x1080", "portrait-1080x1350"] },
  { id: "sports-take", label: "Sports Take", blurb: "Broadcast scoreboard energy.", family: "brand-top", frame: "sports-scoreboard", sizes: ["landscape-1920x1080", "portrait-1080x1350"] },
  { id: "statement-card", label: "Statement Card", blurb: "Bold split column for a quote.", family: "white-top", frame: "split-statement", sizes: ["square-1080x1080", "portrait-1080x1350"] },
  { id: "story-blast", label: "Vertical Story Blast", blurb: "Loud tabloid full-bleed story.", family: "brand-bottom", frame: "bold-tabloid", sizes: ["story-1080x1920"] },
  { id: "website-hero", label: "Website Hero", blurb: "Clean editorial link banner.", family: "brand-bottom", frame: "clean-editorial", sizes: ["landscape-1200x675"] },
];
