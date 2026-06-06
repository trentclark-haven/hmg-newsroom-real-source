import { useCallback, useEffect, useState } from "react";

/**
 * WebArt overlay model + bank.
 *
 * Overlays float over the composited image on the template stage. Positions and
 * sizes are stored as fractions (0–1) of the canvas so a composition exports
 * identically at every pixel size. Image-typed overlays carry an uploaded
 * screenshot; text-typed overlays carry styled, editable text.
 */

export type OverlayType =
  | "x-post"
  | "ig-screenshot"
  | "comment"
  | "screengrab"
  | "text-message"
  | "receipt"
  | "quote-card"
  | "article-snippet"
  | "breaking-badge"
  | "lower-third"
  | "source-label"
  | "stat-chip"
  | "logo-bug";

export type OverlayMedium = "text" | "image";

/** Curated, render-safe font families for the caption / text maker. */
export type OverlayFontId =
  | "grotesk"
  | "editorial"
  | "mono"
  | "condensed"
  | "rounded";

export interface OverlayFontDef {
  id: OverlayFontId;
  label: string;
  /** CSS font-family stack — only system + already-loaded webfonts. */
  stack: string;
}

export const OVERLAY_FONTS: OverlayFontDef[] = [
  {
    id: "grotesk",
    label: "Grotesk",
    stack: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
  },
  {
    id: "editorial",
    label: "Editorial",
    stack: 'Georgia, "Times New Roman", "Iowan Old Style", serif',
  },
  {
    id: "condensed",
    label: "Condensed",
    stack: '"Arial Narrow", "Roboto Condensed", "Helvetica Neue", sans-serif',
  },
  {
    id: "rounded",
    label: "Rounded",
    stack: '"Nunito", "Quicksand", ui-rounded, "Segoe UI", sans-serif',
  },
  {
    id: "mono",
    label: "Mono",
    stack: '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace',
  },
];

export const DEFAULT_OVERLAY_FONT: OverlayFontId = "grotesk";

/** Resolve an overlay font id to its CSS font-family stack (safe fallback). */
export function fontStack(id: OverlayFontId | undefined): string {
  return (OVERLAY_FONTS.find((f) => f.id === id) ?? OVERLAY_FONTS[0]).stack;
}

export interface OverlayTypeDef {
  type: OverlayType;
  label: string;
  short: string;
  medium: OverlayMedium;
  /** Starting width as a fraction of the canvas width. */
  defaultWidthFrac: number;
  /** Starting height as a fraction of the canvas height. */
  defaultHeightFrac: number;
  hint: string;
}

export const OVERLAY_TYPES: OverlayTypeDef[] = [
  {
    type: "x-post",
    label: "Twitter / X post",
    short: "X post",
    medium: "text",
    defaultWidthFrac: 0.62,
    defaultHeightFrac: 0.24,
    hint: "Styled tweet card — display name, @handle and body.",
  },
  {
    type: "ig-screenshot",
    label: "Instagram screenshot",
    short: "IG shot",
    medium: "image",
    defaultWidthFrac: 0.6,
    defaultHeightFrac: 0.5,
    hint: "Drop a screenshot grabbed from Instagram.",
  },
  {
    type: "comment",
    label: "Social comment",
    short: "Comment",
    medium: "text",
    defaultWidthFrac: 0.58,
    defaultHeightFrac: 0.16,
    hint: "Username + comment bubble.",
  },
  {
    type: "screengrab",
    label: "Screengrab",
    short: "Screengrab",
    medium: "image",
    defaultWidthFrac: 0.6,
    defaultHeightFrac: 0.42,
    hint: "Any captured frame or app screenshot.",
  },
  {
    type: "text-message",
    label: "Text message",
    short: "Text msg",
    medium: "text",
    defaultWidthFrac: 0.5,
    defaultHeightFrac: 0.14,
    hint: "iMessage-style chat bubble.",
  },
  {
    type: "receipt",
    label: "Receipt / evidence",
    short: "Receipt",
    medium: "image",
    defaultWidthFrac: 0.42,
    defaultHeightFrac: 0.55,
    hint: "Evidence screenshot — receipt, DM, doc.",
  },
  {
    type: "quote-card",
    label: "Quote card",
    short: "Quote",
    medium: "text",
    defaultWidthFrac: 0.7,
    defaultHeightFrac: 0.28,
    hint: "Pull-quote with attribution.",
  },
  {
    type: "article-snippet",
    label: "Article snippet",
    short: "Article",
    medium: "text",
    defaultWidthFrac: 0.66,
    defaultHeightFrac: 0.26,
    hint: "Kicker + headline + excerpt card.",
  },
  {
    type: "breaking-badge",
    label: "Breaking badge",
    short: "Breaking",
    medium: "text",
    defaultWidthFrac: 0.5,
    defaultHeightFrac: 0.1,
    hint: "Brand-coloured BREAKING / alert badge.",
  },
  {
    type: "lower-third",
    label: "Lower third",
    short: "Lower 3rd",
    medium: "text",
    defaultWidthFrac: 0.82,
    defaultHeightFrac: 0.16,
    hint: "Broadcast-style name + role bar in brand colour.",
  },
  {
    type: "source-label",
    label: "Source label",
    short: "Source",
    medium: "text",
    defaultWidthFrac: 0.5,
    defaultHeightFrac: 0.08,
    hint: "Small credit / source pill.",
  },
  {
    type: "stat-chip",
    label: "Stat chip",
    short: "Stat",
    medium: "text",
    defaultWidthFrac: 0.42,
    defaultHeightFrac: 0.2,
    hint: "Big number + label callout.",
  },
  {
    type: "logo-bug",
    label: "Logo bug",
    short: "Logo bug",
    medium: "text",
    defaultWidthFrac: 0.36,
    defaultHeightFrac: 0.1,
    hint: "Brand watermark tag for the corner.",
  },
];

export function overlayDef(type: OverlayType): OverlayTypeDef {
  return OVERLAY_TYPES.find((d) => d.type === type) ?? OVERLAY_TYPES[0];
}

export interface Overlay {
  id: string;
  type: OverlayType;
  /** top-left x as a fraction of canvas width (0–1). */
  x: number;
  /** top-left y as a fraction of canvas height (0–1). */
  y: number;
  /** width as a fraction of canvas width (0–1). */
  w: number;
  /** height as a fraction of canvas height (0–1). */
  h: number;
  z: number;
  hidden: boolean;
  /** Primary line — display name / username / kicker. */
  title: string;
  /** Secondary line — @handle / attribution. */
  subtitle: string;
  /** Body copy for text overlays. */
  body: string;
  /** Font family for text overlays (caption / text maker). */
  font?: OverlayFontId;
  /** Uploaded image (data URL) for image overlays. */
  image?: string;
}

const DEFAULT_TEXT: Record<OverlayType, Pick<Overlay, "title" | "subtitle" | "body">> = {
  "x-post": { title: "Display Name", subtitle: "@handle", body: "Tap to edit this tweet text. Keep it punchy." },
  "ig-screenshot": { title: "", subtitle: "", body: "" },
  comment: { title: "username", subtitle: "", body: "This comment is fire 🔥 tap to edit." },
  screengrab: { title: "", subtitle: "", body: "" },
  "text-message": { title: "", subtitle: "", body: "Tap to edit this message…" },
  receipt: { title: "", subtitle: "", body: "" },
  "quote-card": { title: "", subtitle: "— Source", body: "Tap to edit this pull-quote." },
  "article-snippet": { title: "EXCLUSIVE", subtitle: "", body: "Tap to edit the headline and excerpt for this article snippet." },
  "breaking-badge": { title: "BREAKING", subtitle: "", body: "" },
  "lower-third": { title: "Name Here", subtitle: "Role / handle", body: "" },
  "source-label": { title: "", subtitle: "", body: "Source: @handle" },
  "stat-chip": { title: "100K", subtitle: "", body: "streams in 24h" },
  "logo-bug": { title: "", subtitle: "", body: "@yourbrand" },
};

let seq = 0;
function uid(): string {
  seq += 1;
  return `ov_${Date.now().toString(36)}_${seq.toString(36)}`;
}

/** Build a fresh overlay of a type, centered, above the current top layer. */
export function makeOverlay(type: OverlayType, topZ: number): Overlay {
  const def = overlayDef(type);
  const w = def.defaultWidthFrac;
  const h = def.defaultHeightFrac;
  const text = DEFAULT_TEXT[type];
  return {
    id: uid(),
    type,
    x: Math.max(0, (1 - w) / 2),
    y: Math.max(0, (1 - h) / 2),
    w,
    h,
    z: topZ + 1,
    hidden: false,
    title: text.title,
    subtitle: text.subtitle,
    body: text.body,
    font: def.medium === "text" ? DEFAULT_OVERLAY_FONT : undefined,
  };
}

export const OVERLAY_BANK_KEY = "hmg-artbot-overlay-bank-v1";
const BANK_MAX = 60;

/** A stored overlay template (no position / layer / id). */
export interface BankedOverlay {
  id: string;
  type: OverlayType;
  w: number;
  h: number;
  title: string;
  subtitle: string;
  body: string;
  image?: string;
  savedAt: number;
}

function readBank(): BankedOverlay[] {
  try {
    const raw = localStorage.getItem(OVERLAY_BANK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BankedOverlay[]) : [];
  } catch {
    return [];
  }
}

function writeBank(items: BankedOverlay[]): void {
  try {
    localStorage.setItem(OVERLAY_BANK_KEY, JSON.stringify(items.slice(0, BANK_MAX)));
  } catch {
    /* storage full / unavailable — non-fatal */
  }
}

/**
 * Persistent overlay bank (localStorage). Stores reusable overlay templates so
 * an operator can build a comment, tweet card or evidence shot once and reuse
 * it across compositions.
 */
export function useOverlayBank() {
  const [items, setItems] = useState<BankedOverlay[]>(() => readBank());

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === OVERLAY_BANK_KEY) setItems(readBank());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const store = useCallback((ov: Overlay) => {
    const banked: BankedOverlay = {
      id: uid(),
      type: ov.type,
      w: ov.w,
      h: ov.h,
      title: ov.title,
      subtitle: ov.subtitle,
      body: ov.body,
      image: ov.image,
      savedAt: Date.now(),
    };
    setItems((prev) => {
      const next = [banked, ...prev].slice(0, BANK_MAX);
      writeBank(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((b) => b.id !== id);
      writeBank(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    writeBank([]);
  }, []);

  return { items, store, remove, clear };
}

/** Instantiate a placed overlay from a banked template. */
export function overlayFromBank(b: BankedOverlay, topZ: number): Overlay {
  const w = b.w;
  const h = b.h;
  return {
    id: uid(),
    type: b.type,
    x: Math.max(0, (1 - w) / 2),
    y: Math.max(0, (1 - h) / 2),
    w,
    h,
    z: topZ + 1,
    hidden: false,
    title: b.title,
    subtitle: b.subtitle,
    body: b.body,
    image: b.image,
  };
}
