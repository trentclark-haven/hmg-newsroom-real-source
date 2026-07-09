/**
 * Canonical media-upload limits for HMG Newsroom (client).
 *
 * The backend mirrors these values in
 * `artifacts/api-server/src/lib/mediaLimits.ts`. Both modules MUST stay in
 * sync — the server enforces the cap, the client uses these values for UI
 * copy and pre-flight checks.
 *
 * No hardcoded byte literals (e.g. `25 * 1024 * 1024`) anywhere else in the
 * client codebase — always import from this module.
 */

const MB = 1024 * 1024;

export const MEDIA_LIMITS = {
  /** WebEdit + ClipBrand video uploads. */
  videoMaxBytes: 250 * MB,
  /** WebEdit + ClipBrand audio uploads. */
  audioMaxBytes: 100 * MB,
  /** WordPress media (image / poster / featured image) uploads. */
  wordpressMediaMaxBytes: 100 * MB,
  /** Inline image attachments (Art Desk reference image, Specialists, TabContent). */
  imageMaxBytes: 5 * MB,
} as const;

/** MIME prefix → matching limit. */
export function maxBytesForMime(mime: string | undefined | null): number {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("audio/")) return MEDIA_LIMITS.audioMaxBytes;
  return MEDIA_LIMITS.videoMaxBytes;
}

/** "250 MB" / "1.2 GB" — UI-friendly format. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * MB) {
    const gb = bytes / (1024 * MB);
    return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
  }
  const mb = bytes / MB;
  return `${mb % 1 === 0 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
}

/** UI label for the WebEdit / ClipBrand drop zone. */
export function uploadLimitLabel(): string {
  return `Supports large uploads — video up to ${formatBytes(
    MEDIA_LIMITS.videoMaxBytes,
  )}, audio up to ${formatBytes(MEDIA_LIMITS.audioMaxBytes)}.`;
}
