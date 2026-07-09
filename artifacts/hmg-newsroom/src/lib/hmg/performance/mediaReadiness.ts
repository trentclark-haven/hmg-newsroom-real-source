import { MEDIA_LIMITS, formatBytes, maxBytesForMime } from "@/lib/mediaLimits";
import { acquireObjectUrl, releaseObjectUrl } from "@/lib/memoryPool";

export const IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const EDIT_ASSET_ACCEPTED_PREFIXES = ["video/", "audio/", "image/"] as const;

export type ReadinessLevel = "ready" | "large" | "blocked";

export interface MediaValidationResult {
  ok: boolean;
  level: ReadinessLevel;
  label: string;
  detail: string;
}

export interface LocalPreviewAsset {
  id: string;
  name: string;
  size: number;
  type: string;
  src: string;
  objectUrl: string;
  dimensions?: { width: number; height: number };
  readiness: MediaValidationResult;
}

export interface ProcessingQueueItem {
  id: string;
  filename: string;
  size: number;
  type: string;
  stage: "staged" | "selected" | "planned";
  readiness: ReadinessLevel;
}

const LARGE_IMAGE_WARNING_BYTES = Math.min(
  MEDIA_LIMITS.imageMaxBytes,
  3 * 1024 * 1024,
);

function makeId(prefix: string): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function validateImageFile(file: File): MediaValidationResult {
  const type = (file.type || "").toLowerCase();
  if (!IMAGE_ACCEPTED_TYPES.includes(type as (typeof IMAGE_ACCEPTED_TYPES)[number])) {
    return {
      ok: false,
      level: "blocked",
      label: "Unsupported",
      detail: "Use JPG, PNG, WebP, or GIF.",
    };
  }
  if (file.size > MEDIA_LIMITS.imageMaxBytes) {
    return {
      ok: false,
      level: "blocked",
      label: "Too large",
      detail: `${formatBytes(file.size)} file exceeds the ${formatBytes(MEDIA_LIMITS.imageMaxBytes)} image limit.`,
    };
  }
  if (file.size >= LARGE_IMAGE_WARNING_BYTES) {
    return {
      ok: true,
      level: "large",
      label: "Large image",
      detail: `${formatBytes(file.size)} local preview. Export may take longer.`,
    };
  }
  return {
    ok: true,
    level: "ready",
    label: "Ready",
    detail: `${formatBytes(file.size)} image ready for local preview.`,
  };
}

export function validateEditAssetFile(file: File): MediaValidationResult {
  const type = (file.type || "").toLowerCase();
  const accepted = EDIT_ASSET_ACCEPTED_PREFIXES.some((prefix) => type.startsWith(prefix));
  if (!accepted) {
    return {
      ok: false,
      level: "blocked",
      label: "Unsupported",
      detail: "Use video, audio, or image assets.",
    };
  }
  const maxBytes = type.startsWith("image/") ? MEDIA_LIMITS.imageMaxBytes : maxBytesForMime(type);
  if (file.size > maxBytes) {
    return {
      ok: false,
      level: "blocked",
      label: "Too large",
      detail: `${formatBytes(file.size)} file exceeds the ${formatBytes(maxBytes)} limit.`,
    };
  }
  const level: ReadinessLevel =
    file.size >= maxBytes * 0.75 && !type.startsWith("image/") ? "large" : "ready";
  return {
    ok: true,
    level,
    label: level === "large" ? "Large asset" : "Ready",
    detail:
      level === "large"
        ? `${formatBytes(file.size)} staged. Keep one heavy asset active at a time.`
        : `${formatBytes(file.size)} ${type.split("/")[0] || "media"} ready to stage.`,
  };
}

export function createPreviewAsset(file: File, ownerId: string): LocalPreviewAsset {
  const objectUrl = acquireObjectUrl(file, ownerId);
  return {
    id: makeId(ownerId),
    name: file.name,
    size: file.size,
    type: file.type || "media",
    src: objectUrl,
    objectUrl,
    readiness: validateImageFile(file),
  };
}

export function revokePreviewAsset(asset: Pick<LocalPreviewAsset, "objectUrl" | "src">): void {
  releaseObjectUrl(asset.objectUrl || asset.src);
}

export function readImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("image-dimensions-unavailable"));
    img.src = src;
  });
}

export function summarizeReadiness(items: Array<{ readiness: MediaValidationResult }>): string {
  if (!items.length) return "No assets staged";
  const blocked = items.filter((item) => item.readiness.level === "blocked").length;
  const large = items.filter((item) => item.readiness.level === "large").length;
  if (blocked) return `${blocked} blocked · review file limits`;
  if (large) return `${items.length} staged · ${large} large`;
  return `${items.length} staged · ready`;
}

export function buildProcessingQueue(
  files: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    readiness?: MediaValidationResult | ReadinessLevel;
  }>,
): ProcessingQueueItem[] {
  return files.map((file) => ({
    id: file.id,
    filename: file.name,
    size: file.size,
    type: file.type || "media",
    stage: "staged",
    readiness:
      typeof file.readiness === "string"
        ? file.readiness
        : file.readiness?.level ?? "ready",
  }));
}
