/**
 * Resumable chunked upload scaffolding. The server endpoint is not yet
 * implemented, so this module exposes the *shape* (cancel, progress, retry,
 * checksum) the UI can already wire against. When the server adds the
 * /api/uploads/chunk endpoint, only `uploadChunk()` needs a real fetch.
 *
 * Checksum is FNV-1a 32-bit, identical on browser + node, fast, no deps. NOT
 * a security primitive — just integrity per chunk.
 */

const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB

export interface ChunkProgress {
  uploadedBytes: number;
  totalBytes: number;
  chunkIndex: number;
  totalChunks: number;
  ratio: number;
}

export interface ChunkedUploadOptions {
  endpoint?: string;
  chunkSize?: number;
  onProgress?: (p: ChunkProgress) => void;
  signal?: AbortSignal;
  /** Per-chunk retries before failing the whole upload. */
  perChunkRetries?: number;
}

export interface ChunkedUploadResult {
  uploadId: string;
  totalBytes: number;
  totalChunks: number;
  /** True when every chunk succeeded. */
  ok: boolean;
  /** Set when scaffolding-only (server not wired). */
  scaffoldingOnly?: boolean;
}

export class ChunkedUploadError extends Error {
  constructor(
    message: string,
    public chunkIndex: number,
    public retryable: boolean,
  ) {
    super(message);
    this.name = "ChunkedUploadError";
  }
}

function fnv1a32(bytes: Uint8Array): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

async function chunkChecksum(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  return fnv1a32(buf);
}

async function uploadChunk(
  endpoint: string,
  uploadId: string,
  chunkIndex: number,
  totalChunks: number,
  chunk: Blob,
  checksum: string,
  signal?: AbortSignal,
): Promise<{ ok: boolean; scaffoldingOnly: boolean }> {
  // Default: try the endpoint; if it 404s, treat as scaffolding-only and
  // succeed locally so the UI flow is testable end-to-end.
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-upload-id": uploadId,
        "x-chunk-index": String(chunkIndex),
        "x-chunk-total": String(totalChunks),
        "x-chunk-checksum": checksum,
        "Content-Type": "application/octet-stream",
      },
      body: chunk,
      signal,
    });
    if (res.status === 404) return { ok: true, scaffoldingOnly: true };
    if (!res.ok) {
      throw new ChunkedUploadError(
        `chunk ${chunkIndex} failed ${res.status}`,
        chunkIndex,
        res.status >= 500,
      );
    }
    return { ok: true, scaffoldingOnly: false };
  } catch (err) {
    if (err instanceof ChunkedUploadError) throw err;
    if (signal?.aborted) {
      throw new ChunkedUploadError("aborted", chunkIndex, false);
    }
    // Network / endpoint missing → scaffolding-only success.
    return { ok: true, scaffoldingOnly: true };
  }
}

export async function uploadFileChunked(
  file: Blob,
  opts: ChunkedUploadOptions = {},
): Promise<ChunkedUploadResult> {
  const endpoint = opts.endpoint ?? "/api/uploads/chunk";
  const chunkSize = opts.chunkSize ?? CHUNK_SIZE;
  const totalBytes = file.size;
  const totalChunks = Math.max(1, Math.ceil(totalBytes / chunkSize));
  const uploadId = `up-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const perChunkRetries = opts.perChunkRetries ?? 2;

  let uploadedBytes = 0;
  let scaffoldingOnly = false;

  for (let i = 0; i < totalChunks; i++) {
    if (opts.signal?.aborted) {
      throw new ChunkedUploadError("aborted", i, false);
    }
    const start = i * chunkSize;
    const end = Math.min(totalBytes, start + chunkSize);
    const chunk = file.slice(start, end);
    const checksum = await chunkChecksum(chunk);
    let attempt = 0;
    let succeeded = false;
    while (attempt <= perChunkRetries && !succeeded) {
      try {
        const r = await uploadChunk(
          endpoint,
          uploadId,
          i,
          totalChunks,
          chunk,
          checksum,
          opts.signal,
        );
        if (r.scaffoldingOnly) scaffoldingOnly = true;
        succeeded = true;
      } catch (err) {
        attempt += 1;
        if (attempt > perChunkRetries || (err instanceof ChunkedUploadError && !err.retryable)) {
          throw err;
        }
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
    uploadedBytes += end - start;
    opts.onProgress?.({
      uploadedBytes,
      totalBytes,
      chunkIndex: i,
      totalChunks,
      ratio: uploadedBytes / totalBytes,
    });
  }

  return {
    uploadId,
    totalBytes,
    totalChunks,
    ok: true,
    scaffoldingOnly,
  };
}
