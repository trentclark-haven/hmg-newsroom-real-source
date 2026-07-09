/**
 * HMG Media Connectivity Layer — shared MediaItem model + local-first Media Bank.
 *
 * This module is the connective tissue across Art Desk, WebEdit, Editorial and
 * Maximillion. It lives under components/ (not lib/) by project constraint.
 *
 * Honesty rules:
 *  - Local-first. We never claim cloud persistence we do not have.
 *  - Uploaded blobs live as session object URLs (not persisted). Small images
 *    are persisted as data URLs so they survive reloads; large files persist
 *    metadata only and must be re-selected to use.
 */
import { useCallback, useEffect, useState } from "react";

export type MediaSourceType =
  | "local"
  | "google_drive"
  | "youtube"
  | "url"
  | "clipboard"
  | "saved_asset"
  | "brand_asset";

export type MediaKind =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "transcript"
  | "overlay"
  | "template";

export type RightsStatus =
  | "user-supplied"
  | "brand-asset"
  | "screenshot-reference"
  | "needs-clearance"
  | "editorial-only"
  | "do-not-publish-unverified";

export interface MediaItem {
  id: string;
  sourceType: MediaSourceType;
  mediaType: MediaKind;
  title: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  /** Persisted data URL (small images / thumbnails) — survives reload. */
  dataUrl?: string;
  /** Remote thumbnail URL (e.g. YouTube) — survives reload, not a blob. */
  thumbUrl?: string;
  /** Session-only object URL (never persisted). */
  localObjectUrl?: string;
  sourceUrl?: string;
  youtubeId?: string;
  providerFileId?: string;
  createdAt: number;
  updatedAt: number;
  /** Silo id this asset is associated with. */
  brand?: string;
  rightsStatus: RightsStatus;
  usageNotes?: string;
  tags: string[];
  notes?: string;
  canUseInArtBot: boolean;
  canUseInCutMaster: boolean;
  canUseInEditorial: boolean;
  canUseInMaximillion: boolean;
}

export const RIGHTS_OPTIONS: Array<{ id: RightsStatus; label: string }> = [
  { id: "user-supplied", label: "User supplied" },
  { id: "brand-asset", label: "Brand asset" },
  { id: "screenshot-reference", label: "Screenshot / source reference" },
  { id: "needs-clearance", label: "Needs clearance" },
  { id: "editorial-only", label: "Editorial use only" },
  { id: "do-not-publish-unverified", label: "Do not publish without verification" },
];

let seq = 0;
function uid(): string {
  seq += 1;
  return `mi_${Date.now().toString(36)}_${seq.toString(36)}`;
}

export function formatBytes(n?: number): string {
  if (!n || n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function capsFor(kind: MediaKind): {
  art: boolean;
  cut: boolean;
  ed: boolean;
  max: boolean;
} {
  switch (kind) {
    case "image":
      return { art: true, cut: false, ed: true, max: true };
    case "video":
      return { art: false, cut: true, ed: true, max: true };
    case "audio":
      return { art: false, cut: true, ed: false, max: false };
    case "transcript":
      return { art: false, cut: true, ed: true, max: false };
    case "document":
      return { art: false, cut: false, ed: true, max: true };
    case "overlay":
      return { art: true, cut: false, ed: false, max: false };
    case "template":
      return { art: true, cut: true, ed: false, max: false };
    default:
      return { art: true, cut: true, ed: true, max: true };
  }
}

export function makeMediaItem(partial: Partial<MediaItem> & { mediaType: MediaKind }): MediaItem {
  const now = Date.now();
  const caps = capsFor(partial.mediaType);
  return {
    id: partial.id ?? uid(),
    sourceType: partial.sourceType ?? "local",
    mediaType: partial.mediaType,
    title: partial.title ?? "Untitled media",
    filename: partial.filename,
    mimeType: partial.mimeType,
    sizeBytes: partial.sizeBytes,
    durationSeconds: partial.durationSeconds,
    width: partial.width,
    height: partial.height,
    dataUrl: partial.dataUrl,
    thumbUrl: partial.thumbUrl,
    localObjectUrl: partial.localObjectUrl,
    sourceUrl: partial.sourceUrl,
    youtubeId: partial.youtubeId,
    providerFileId: partial.providerFileId,
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
    brand: partial.brand,
    rightsStatus: partial.rightsStatus ?? "user-supplied",
    usageNotes: partial.usageNotes,
    tags: partial.tags ?? [],
    notes: partial.notes,
    canUseInArtBot: partial.canUseInArtBot ?? caps.art,
    canUseInCutMaster: partial.canUseInCutMaster ?? caps.cut,
    canUseInEditorial: partial.canUseInEditorial ?? caps.ed,
    canUseInMaximillion: partial.canUseInMaximillion ?? caps.max,
  };
}

/** Best preview source for an item, in order of durability. */
export function previewSrc(item: MediaItem): string | undefined {
  return item.dataUrl || item.localObjectUrl || item.thumbUrl;
}

const VIDEO_EXT = /\.(mp4|mov|webm|m4v|avi|mkv)(\?|#|$)/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i;
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg|flac)(\?|#|$)/i;

/** Extract a YouTube video id from common URL shapes. */
export function youtubeId(url: string): string | null {
  const trimmed = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/i,
    /(?:youtu\.be\/)([\w-]{11})/i,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/i,
    /(?:youtube\.com\/embed\/)([\w-]{11})/i,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return null;
}

export function youtubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/** Classify a pasted URL into a media kind for the link source. */
export function classifyUrl(url: string): MediaKind {
  if (youtubeId(url)) return "video";
  if (IMAGE_EXT.test(url)) return "image";
  if (VIDEO_EXT.test(url)) return "video";
  if (AUDIO_EXT.test(url)) return "audio";
  return "document";
}

export function fileKind(mime: string): MediaKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}

function imageDims(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

/** Max data-url length we will persist (≈1.1MB of base64). */
const PERSIST_DATAURL_MAX = 1_500_000;

/**
 * Build a MediaItem from a local File. Images become data URLs (durable, with
 * dimensions); video/audio become session object URLs (not persisted).
 */
export async function fileToMediaItem(
  file: File,
  opts: { sourceType?: MediaSourceType; brand?: string } = {},
): Promise<MediaItem> {
  const kind = fileKind(file.type);
  const base: Partial<MediaItem> & { mediaType: MediaKind } = {
    mediaType: kind,
    sourceType: opts.sourceType ?? "local",
    title: file.name.replace(/\.[^.]+$/, ""),
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    brand: opts.brand,
    rightsStatus: "user-supplied",
  };
  if (kind === "image") {
    const dataUrl = await readDataUrl(file);
    const dims = await imageDims(dataUrl);
    return makeMediaItem({ ...base, dataUrl, width: dims.width, height: dims.height });
  }
  return makeMediaItem({ ...base, localObjectUrl: URL.createObjectURL(file) });
}

export const MEDIA_BANK_KEY = "hmg-media-bank-v1";
const BANK_MAX = 120;

/** Strip non-serializable / oversized fields before persisting. */
function serializeForStore(item: MediaItem): MediaItem {
  const copy: MediaItem = { ...item, localObjectUrl: undefined };
  if (copy.dataUrl && copy.dataUrl.length > PERSIST_DATAURL_MAX) {
    copy.dataUrl = undefined;
  }
  return copy;
}

function readBank(): MediaItem[] {
  try {
    const raw = localStorage.getItem(MEDIA_BANK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MediaItem[]) : [];
  } catch {
    return [];
  }
}

function writeBank(items: MediaItem[]): void {
  try {
    localStorage.setItem(
      MEDIA_BANK_KEY,
      JSON.stringify(items.slice(0, BANK_MAX).map(serializeForStore)),
    );
  } catch {
    /* storage full / unavailable — non-fatal */
  }
}

/**
 * Local-first Saved Asset Bank. Shared across every module so an asset saved in
 * one cockpit is instantly reusable in the others.
 */
export function useMediaBank() {
  const [items, setItems] = useState<MediaItem[]>(() => readBank());

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === MEDIA_BANK_KEY) setItems(readBank());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((item: MediaItem): MediaItem => {
    const stored = makeMediaItem({ ...item, id: item.id });
    setItems((prev) => {
      const next = [stored, ...prev.filter((p) => p.id !== stored.id)].slice(0, BANK_MAX);
      writeBank(next);
      return next;
    });
    return stored;
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.id !== id);
      writeBank(next);
      return next;
    });
  }, []);

  const update = useCallback((id: string, patch: Partial<MediaItem>) => {
    setItems((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p,
      );
      writeBank(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    writeBank([]);
  }, []);

  return { items, add, remove, update, clear };
}
