/**
 * Canonical client-side transcription pipeline for HMG Newsroom.
 *
 * Founder reality check (May 2026 — iPhone Safari upload UX):
 *
 *   The previous build chunked correctly (4 MB × 3-way parallel), but
 *   showed the founder a "stuck at 0%" experience because:
 *
 *     a) `fetch()` cannot expose request-body upload progress in any
 *        production browser (iOS Safari included). Progress only fired
 *        when an entire 4 MB chunk completed — over a 5 Mbps cellular
 *        pipe that's a 6+ second silent gap per chunk.
 *
 *     b) After a refresh / Safari background suspend / api-server
 *        restart, the upload had to start over from chunk 0.
 *
 *     c) `cancel` only aborted the in-flight `fetch`, never told the
 *        server about it; the half-uploaded chunks sat on disk for the
 *        24 h TTL.
 *
 *     d) HTTP errors surfaced as `Could not register upload (HTTP 500)`
 *        with no body — the founder had no way to tell whether it was
 *        an upload-too-large, provider-down, or proxy-413 failure.
 *
 *   This file is the founder-grade rewrite that fixes all four:
 *
 *     - Each chunk is POSTed via XMLHttpRequest so `upload.onprogress`
 *       fires every few hundred ms, even mid-chunk on a slow uplink.
 *       The user always sees the bar move.
 *
 *     - Before uploading, we look at localStorage for a pending
 *       `uploadId` whose file fingerprint (name + size + lastModified)
 *       matches the picked file, and ask the server which chunk indices
 *       it already has via `GET /api/uploads/session/:id`. Matching
 *       chunks are skipped. Survives refresh + api-server restart
 *       (the server-side store now persists to disk).
 *
 *     - On AbortController.abort() we ALSO fire-and-forget
 *       `POST /api/uploads/abort` so the server can free the chunk dir
 *       immediately and the next probe doesn't see a ghost session.
 *
 *     - Every non-2xx response has its body parsed and the upstream
 *       `error` code surfaced into TranscribePipelineError.message so
 *       the visible toast names the actual failure.
 *
 *   The end-to-end pipeline this drives:
 *
 *     1. POST /api/uploads/session                  - register a chunked upload
 *     2. (optional) GET /api/uploads/session/:id    - probe for resumable state
 *     3. POST /api/uploads/chunk x N (XHR + skip)   - stream 4 MB chunks
 *     4. POST /api/uploads/complete                 - finalize the upload session
 *     5. POST /api/cutmaster/transcribe-from-upload (Accept: text/event-stream)
 *        - server runs ffmpeg → opus → chunk → ElevenLabs Scribe → stitch
 *        - emits {phase} events as it goes
 *        - emits {phase:"done", payload:{...}} on success
 *        - emits {phase:"failed", code, message} on real failure
 *
 *   Manual fallback is appropriate ONLY when this helper throws — i.e.
 *   after the server has actually tried to extract + chunk + transcribe
 *   and hit a hard error. Provider-cap errors are no longer reachable
 *   from the UI.
 */

const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB — matches /api/uploads/chunk router limit.

/**
 * Number of chunk POSTs the client keeps in flight at once.
 *
 * The /api/uploads/chunk route supports out-of-order writes via the
 * `x-chunk-index` header, so we can dispatch several chunks concurrently
 * and the server reassembles them by index. Default 3; override via
 * `transcribeWithProgress({ uploadConcurrency })`.
 *
 * Picked conservatively because the typical mobile upstream pipe will
 * saturate well before this — going higher mostly adds memory pressure
 * (each in-flight chunk holds a 4 MB ArrayBuffer) without throughput gain.
 */
const DEFAULT_UPLOAD_CONCURRENCY = 3;

/**
 * localStorage key holding the pending uploadId for the most recently
 * started chunked upload. We keep ONLY the small manifest (uploadId +
 * file fingerprint + totalChunks) — never any chunk content.
 *
 * Cleared on success, abort, or when a different file is picked.
 */
const PENDING_UPLOAD_KEY = "hmg.upload.pending";

interface PendingUploadRecord {
  uploadId: string;
  fileName: string;
  fileSize: number;
  lastModified: number;
  totalChunks: number;
  startedAt: number;
}

function readPendingUpload(): PendingUploadRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PENDING_UPLOAD_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<PendingUploadRecord>;
    if (
      typeof o.uploadId === "string" &&
      typeof o.fileName === "string" &&
      typeof o.fileSize === "number" &&
      typeof o.lastModified === "number" &&
      typeof o.totalChunks === "number" &&
      typeof o.startedAt === "number"
    ) {
      return o as PendingUploadRecord;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writePendingUpload(rec: PendingUploadRecord): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_UPLOAD_KEY, JSON.stringify(rec));
  } catch {
    /* quota / private mode — non-fatal */
  }
}

function clearPendingUpload(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PENDING_UPLOAD_KEY);
  } catch {
    /* ignore */
  }
}

export interface TranscribeWord {
  word: string;
  start: number;
  end: number;
}

export interface TranscribeSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscribeSuggestedClip {
  id: string;
  start: number;
  end: number;
  text: string;
  hookScore: number;
}

/**
 * Provenance of word-level timings, mirroring the server's `TimingMode`.
 *
 *   "word"      — per-word timings came directly from the STT provider
 *                 (ElevenLabs Scribe today); safe to highlight the
 *                 spoken word in real time.
 *   "segment"   — only segment-level timings; per-word spans were
 *                 synthesized by even-spacing inside each segment.
 *   "estimated" — no timings at all; spans derived from token count
 *                 + duration. UI shows an "estimated" banner.
 */
export type TranscribeTimingMode = "word" | "segment" | "estimated";

export interface TranscribePipelineData {
  text: string;
  duration: number;
  language: string;
  words: TranscribeWord[];
  segments: TranscribeSegment[];
  suggestedClips: TranscribeSuggestedClip[];
  timingMode: TranscribeTimingMode;
  pipeline?: {
    stitched: boolean;
    chunks: number;
    uploadedBytes: number;
    pipelineDurationMs: number;
  };
}

/**
 * Phase events emitted by the helper. The first three are client-only
 * (tracking the chunked upload). The rest mirror server-side pipeline
 * phases received over SSE.
 *
 * `resuming` fires once if we found a pending uploadId on disk that
 * matches the current file — useful so the UI can render
 * "Resuming previous upload (12/47 chunks already on server)…".
 */
export type TranscribePhaseEvent =
  | {
      phase: "uploading";
      uploadedBytes: number;
      totalBytes: number;
      chunkIndex: number;
      totalChunks: number;
    }
  | {
      phase: "resuming";
      alreadyUploadedChunks: number;
      totalChunks: number;
      alreadyUploadedBytes: number;
      totalBytes: number;
    }
  | { phase: "finalizing" }
  | { phase: "ready" }
  | { phase: "extracting" }
  | { phase: "compressing"; bytes: number }
  | { phase: "chunking"; totalChunks: number; totalDurationSec: number }
  | {
      phase: "transcribing";
      chunkIndex: number;
      totalChunks: number;
      chunkBytes: number;
    }
  | { phase: "stitching"; totalChunks: number }
  | { phase: "interrupted"; message: string }
  | { phase: "session"; uploadId: string; resumed: boolean }
  | { phase: "chunk_retry"; chunkIndex: number; attempt: number; maxAttempts: number; reason: string }
  | { phase: "chunk_acked"; chunkIndex: number; totalChunks: number };

export type TranscribeStage =
  | "upload_session"
  | "upload_resume"
  | "upload_chunk"
  | "upload_complete"
  | "transcribe_stream"
  | "transcribe_pipeline";

export class TranscribePipelineError extends Error {
  constructor(
    message: string,
    public code: string,
    public stage: TranscribeStage,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = "TranscribePipelineError";
  }
}

export interface TranscribeWithProgressOptions {
  onPhase?: (event: TranscribePhaseEvent) => void;
  signal?: AbortSignal;
  /** Number of chunk POSTs to keep in flight at once. Default 3. */
  uploadConcurrency?: number;
  /**
   * Disable the resume probe (start fresh even if a pending uploadId
   * for this exact file is in localStorage). Bench harness uses this to
   * compare cold vs warm-cache numbers.
   */
  forceFresh?: boolean;
}

/**
 * Coerce a native abort exception into our pipeline error so callers'
 * `err.code === "aborted"` suppression works regardless of whether the
 * abort came from `fetch(..., { signal })` (DOMException), our
 * worker-loop check (TranscribePipelineError), or XHR's onabort
 * (plain Event).
 */
function coerceAbort(err: unknown, stage: TranscribeStage): never {
  if (err instanceof TranscribePipelineError) throw err;
  const name = (err as { name?: string } | null)?.name ?? "";
  const isAbort =
    name === "AbortError" ||
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.message === "xhr-aborted");
  if (isAbort) {
    throw new TranscribePipelineError(
      "Upload aborted",
      "aborted",
      stage,
      false,
    );
  }
  throw err;
}

/**
 * Best-effort body-shape extractor. Tries JSON first (our routes always
 * respond with `{ error: "..." }`), falls back to text. Used to surface
 * the actual upstream error string in the toast instead of a generic
 * HTTP-code-only message.
 */
async function readErrorBody(res: Response): Promise<string> {
  try {
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const j = (await res.json()) as { error?: string };
      if (j && typeof j.error === "string") return j.error;
    }
    const t = await res.text();
    return t.slice(0, 240);
  } catch {
    return "";
  }
}

/**
 * Parse XHR responseText into the same `{ error: "..." }` shape used by
 * the upload routes. Returns "" if the body is not JSON.
 */
function parseXhrErrorBody(responseText: string): string {
  if (!responseText) return "";
  try {
    const j = JSON.parse(responseText) as { error?: string };
    if (j && typeof j.error === "string") return j.error;
  } catch {
    /* not JSON */
  }
  return responseText.slice(0, 240);
}

/**
 * Fire-and-forget /abort. Does NOT await the response — by the time we
 * call this, the user has already cancelled. We just want the server to
 * free the disk + remove the session entry so a future resume probe
 * doesn't see a ghost. Errors are swallowed.
 */
function fireAbortServerSide(uploadId: string): void {
  try {
    void fetch("/api/uploads/abort", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId }),
      // keepalive lets the request survive a tab close (Safari supports
      // it for small POSTs).
      keepalive: true,
    }).catch(() => {
      /* swallow */
    });
  } catch {
    /* swallow */
  }
}

/**
 * Run the full chunked-upload + audio-pipeline transcription against the
 * given file, surfacing per-phase progress to `onPhase`. Resolves with the
 * final transcript payload, or throws `TranscribePipelineError` on a
 * genuine failure (manual transcript prompt territory).
 */
export async function transcribeWithProgress(
  file: File,
  opts: TranscribeWithProgressOptions = {},
): Promise<TranscribePipelineData> {
  const { onPhase, signal } = opts;
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
  const requestedConcurrency = Math.max(
    1,
    Math.min(8, Math.floor(opts.uploadConcurrency ?? DEFAULT_UPLOAD_CONCURRENCY)),
  );
  const concurrency = Math.min(requestedConcurrency, totalChunks);

  // INSTANT FEEDBACK — emit the first phase event SYNCHRONOUSLY before any
  // network I/O so the UI can paint the progress strip in the same render
  // frame as the file pick.
  onPhase?.({
    phase: "uploading",
    uploadedBytes: 0,
    totalBytes: file.size,
    chunkIndex: 0,
    totalChunks,
  });

  // ---- 0. Resume probe ------------------------------------------------------
  // Look at localStorage first. If we have a pending uploadId from a prior
  // session whose file fingerprint matches the picked file, ask the server
  // which chunks it still has and skip them. This survives refresh, Safari
  // tab suspension, and api-server restart (the server-side store now
  // persists each chunk acknowledgment to disk).
  let resumedUploadId: string | null = null;
  let alreadyReceived = new Set<number>();
  let alreadyReceivedBytes = 0;
  if (!opts.forceFresh) {
    const pending = readPendingUpload();
    if (
      pending &&
      pending.fileName === file.name &&
      pending.fileSize === file.size &&
      pending.lastModified === (file.lastModified ?? 0) &&
      pending.totalChunks === totalChunks
    ) {
      try {
        const probe = await fetch(
          `/api/uploads/session/${encodeURIComponent(pending.uploadId)}`,
          { signal },
        );
        if (probe.ok) {
          const j = (await probe.json()) as {
            status: string;
            receivedIndices: number[];
            receivedBytes: number;
            totalChunks: number;
          };
          if (
            j.status === "open" &&
            j.totalChunks === totalChunks &&
            Array.isArray(j.receivedIndices)
          ) {
            resumedUploadId = pending.uploadId;
            alreadyReceived = new Set(j.receivedIndices);
            alreadyReceivedBytes = j.receivedBytes;
            onPhase?.({
              phase: "resuming",
              alreadyUploadedChunks: alreadyReceived.size,
              totalChunks,
              alreadyUploadedBytes: alreadyReceivedBytes,
              totalBytes: file.size,
            });
          }
        } else {
          // 404 (server-side TTL swept it, or different process) — drop
          // the stale localStorage entry quietly.
          clearPendingUpload();
        }
      } catch (err) {
        if ((err as { name?: string } | null)?.name === "AbortError") {
          throw new TranscribePipelineError(
            "Upload aborted",
            "aborted",
            "upload_resume",
            false,
          );
        }
        // Resume probe is best-effort — fall through to a fresh session.
        clearPendingUpload();
      }
    }
  }

  // ---- 1. Register chunked-upload session (if not resuming) -----------------
  let uploadId: string;
  if (resumedUploadId) {
    uploadId = resumedUploadId;
    onPhase?.({ phase: "session", uploadId, resumed: true });
  } else {
    let sessionRes: Response;
    try {
      sessionRes = await fetch("/api/uploads/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name || "clip.mp4",
          totalBytes: file.size,
          totalChunks,
          contentType: file.type || "video/mp4",
        }),
        signal,
      });
    } catch (err) {
      coerceAbort(err, "upload_session");
    }
    if (!sessionRes.ok) {
      const body = await readErrorBody(sessionRes);
      throw new TranscribePipelineError(
        `Could not register upload (HTTP ${sessionRes.status}${body ? `: ${body}` : ""})`,
        "upload_session_failed",
        "upload_session",
        sessionRes.status >= 500,
      );
    }
    const sessionJson = (await sessionRes.json()) as { uploadId?: string };
    if (!sessionJson.uploadId) {
      throw new TranscribePipelineError(
        "Upload session response missing uploadId",
        "upload_session_no_id",
        "upload_session",
        false,
      );
    }
    uploadId = sessionJson.uploadId;
    onPhase?.({ phase: "session", uploadId, resumed: false });
    writePendingUpload({
      uploadId,
      fileName: file.name,
      fileSize: file.size,
      lastModified: file.lastModified ?? 0,
      totalChunks,
      startedAt: Date.now(),
    });
  }

  // Wire abort → server-side /abort. We register the listener up-front so
  // a cancel during chunk upload also frees the server-side state.
  let abortFiredServerSide = false;
  const onAbort = () => {
    if (abortFiredServerSide) return;
    abortFiredServerSide = true;
    fireAbortServerSide(uploadId);
    clearPendingUpload();
  };
  if (signal) {
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  }

  // ---- 2. Stream chunks (parallel + skip-already-received + XHR progress) ---
  // Track byte-level progress per in-flight chunk so the visible bar moves
  // every few hundred ms, not just at chunk completion. `chunkInflight`
  // holds the most recent `loaded` value reported by XHR for each chunk
  // index; the cumulative number is recomputed on every progress event.
  const sessionUploadId: string = uploadId;
  const chunkInflight = new Map<number, number>();
  let nextChunkIndex = 0;
  let pipelineAborted = false;
  let lastProgressEmit = 0;

  function emitUploadProgress(currentChunkIndex: number) {
    let inflight = 0;
    for (const v of chunkInflight.values()) inflight += v;
    const completedBytes = (() => {
      // Sum bytes of every fully-received chunk (alreadyReceived + done).
      // For "done" chunks, we use the per-chunk size; for the last chunk
      // it may be smaller than CHUNK_SIZE.
      let b = alreadyReceivedBytes;
      for (let i = 0; i < totalChunks; i++) {
        if (alreadyReceived.has(i)) continue;
        const v = chunkInflight.get(i);
        if (v === -1) {
          // marker: this chunk fully completed in this session
          const start = i * CHUNK_SIZE;
          const end = Math.min(file.size, start + CHUNK_SIZE);
          b += end - start;
        }
      }
      return b;
    })();
    // Clamp & throttle progress emits to ~10 Hz to keep React happy.
    const now =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();
    if (now - lastProgressEmit < 80) return;
    lastProgressEmit = now;
    const uploadedBytes = Math.min(file.size, completedBytes + inflight);
    onPhase?.({
      phase: "uploading",
      uploadedBytes,
      totalBytes: file.size,
      chunkIndex: currentChunkIndex,
      totalChunks,
    });
  }

  /**
   * XHR-based chunk POST. Used instead of fetch() because fetch cannot
   * expose request-body upload progress in any production browser
   * (iOS Safari included).
   *
   * Resolves on 2xx; rejects with TranscribePipelineError on:
   *   - 4xx/5xx (body parsed for error code)
   *   - network error (xhr.onerror)
   *   - timeout (xhr.ontimeout)
   *   - abort (signal-driven xhr.abort())
   */
  function postChunkXhr(
    i: number,
    body: ArrayBuffer,
    checksum: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/uploads/chunk", true);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.setRequestHeader("x-upload-id", sessionUploadId);
      xhr.setRequestHeader("x-chunk-index", String(i));
      xhr.setRequestHeader("x-chunk-total", String(totalChunks));
      xhr.setRequestHeader("x-chunk-checksum", checksum);
      // 60 s per chunk should be more than enough even on a 5 Mbps pipe
      // (4 MB / 5 Mbps = ~6.4 s); a 60 s timeout catches a fully stalled
      // connection without false-positiving slow links.
      xhr.timeout = 60000;
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          chunkInflight.set(i, evt.loaded);
          emitUploadProgress(i);
        }
      };
      xhr.upload.onloadend = () => {
        // Body fully sent; server is processing. Fix the inflight value
        // at full-chunk size so the bar doesn't dip while waiting for
        // the server's 200.
        const start = i * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        chunkInflight.set(i, end - start);
        emitUploadProgress(i);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Mark as done and stop counting toward "inflight".
          chunkInflight.set(i, -1);
          emitUploadProgress(i);
          resolve();
          return;
        }
        const body = parseXhrErrorBody(xhr.responseText);
        reject(
          new TranscribePipelineError(
            `Chunk ${i + 1}/${totalChunks} upload failed (HTTP ${xhr.status}${
              body ? `: ${body}` : ""
            })`,
            body || "upload_chunk_failed",
            "upload_chunk",
            xhr.status >= 500 || xhr.status === 0,
          ),
        );
      };
      xhr.onerror = () => {
        reject(
          new TranscribePipelineError(
            `Chunk ${i + 1}/${totalChunks} network error`,
            "upload_chunk_network",
            "upload_chunk",
            true,
          ),
        );
      };
      xhr.ontimeout = () => {
        reject(
          new TranscribePipelineError(
            `Chunk ${i + 1}/${totalChunks} timed out after 60 s`,
            "upload_chunk_timeout",
            "upload_chunk",
            true,
          ),
        );
      };
      xhr.onabort = () => {
        reject(new Error("xhr-aborted"));
      };
      // Hook up the AbortSignal: if the caller aborts mid-chunk, abort
      // the XHR immediately so we don't keep wasting bandwidth.
      const abortListener = () => xhr.abort();
      if (signal) {
        if (signal.aborted) {
          xhr.abort();
          return;
        }
        signal.addEventListener("abort", abortListener, { once: true });
      }
      // Always remove the listener once the request settles to avoid
      // leaking listeners across the AbortController's lifetime.
      const cleanup = () => {
        if (signal) signal.removeEventListener("abort", abortListener);
      };
      xhr.addEventListener("loadend", cleanup);
      xhr.send(body);
    });
  }

  /**
   * Per-chunk retry policy: 2 retries with exponential backoff so a
   * single transient cellular blip doesn't fail the whole upload.
   * Retryable errors (network, 5xx, timeout) only — checksum-mismatch
   * and other 4xx fail immediately.
   */
  async function uploadOneChunk(i: number): Promise<void> {
    if (alreadyReceived.has(i)) return; // resume skip
    const start = i * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const part = file.slice(start, end);
    const partBuf = await part.arrayBuffer();
    // FNV-1a 32-bit checksum (matches server expectation).
    const u8 = new Uint8Array(partBuf);
    let h = 0x811c9dc5;
    for (let j = 0; j < u8.length; j++) {
      h ^= u8[j];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    const checksum = h.toString(16).padStart(8, "0");

    let attempt = 0;
    const maxAttempts = 3; // 1 initial + 2 retries
    while (true) {
      attempt++;
      try {
        await postChunkXhr(i, partBuf, checksum);
        onPhase?.({ phase: "chunk_acked", chunkIndex: i, totalChunks });
        return;
      } catch (err) {
        if (
          err instanceof TranscribePipelineError &&
          err.code === "aborted"
        ) {
          throw err;
        }
        const isRetryable =
          err instanceof TranscribePipelineError && err.retryable;
        if (!isRetryable || attempt >= maxAttempts) {
          throw err;
        }
        // Reset inflight counter for this chunk so the bar doesn't show
        // partial progress for a doomed attempt.
        chunkInflight.delete(i);
        emitUploadProgress(i);
        onPhase?.({ phase: "chunk_retry", chunkIndex: i, attempt, maxAttempts, reason: err instanceof Error ? err.message : "retry" });
        // Exponential backoff: 400 ms, 1200 ms.
        await new Promise((r) => setTimeout(r, 400 * Math.pow(3, attempt - 1)));
      }
    }
  }

  async function uploadWorker(): Promise<void> {
    while (true) {
      if (pipelineAborted) return;
      if (signal?.aborted) {
        pipelineAborted = true;
        throw new TranscribePipelineError(
          "Upload aborted",
          "aborted",
          "upload_chunk",
          false,
        );
      }
      const i = nextChunkIndex++;
      if (i >= totalChunks) return;
      try {
        await uploadOneChunk(i);
      } catch (err) {
        // Stop sibling workers from launching new chunks on first failure.
        pipelineAborted = true;
        throw err;
      }
    }
  }
  await Promise.all(
    Array.from({ length: concurrency }, () => uploadWorker()),
  );

  // ---- 3. Finalize -----------------------------------------------------------
  onPhase?.({ phase: "finalizing" });
  let completeRes: Response;
  try {
    completeRes = await fetch("/api/uploads/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId }),
      signal,
    });
  } catch (err) {
    coerceAbort(err, "upload_complete");
  }
  if (!completeRes.ok) {
    const body = await readErrorBody(completeRes);
    throw new TranscribePipelineError(
      `Could not finalize upload (HTTP ${completeRes.status}${body ? `: ${body}` : ""})`,
      body || "upload_complete_failed",
      "upload_complete",
      completeRes.status >= 500,
    );
  }
  // Upload succeeded — clear the localStorage breadcrumb so the next
  // upload of the same file starts fresh.
  clearPendingUpload();
  if (signal) signal.removeEventListener("abort", onAbort);

  // ---- 4. Stream transcription via SSE --------------------------------------
  let sseRes: Response;
  try {
    sseRes = await fetch("/api/cutmaster/transcribe-from-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ uploadId }),
      signal,
    });
  } catch (err) {
    coerceAbort(err, "transcribe_stream");
  }
  if (!sseRes.ok || !sseRes.body) {
    const body = await readErrorBody(sseRes);
    throw new TranscribePipelineError(
      `Transcribe stream did not open (HTTP ${sseRes.status}${body ? `: ${body}` : ""})`,
      body || "transcribe_stream_failed",
      "transcribe_stream",
      sseRes.status >= 500,
    );
  }

  const reader = sseRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let donePayload: TranscribePipelineData | null = null;
  let failureCode: string | null = null;
  let failureMessage: string | null = null;

  while (true) {
    if (signal?.aborted) {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      throw new TranscribePipelineError(
        "Transcription aborted",
        "aborted",
        "transcribe_stream",
        false,
      );
    }
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (err) {
      coerceAbort(err, "transcribe_stream");
    }
    const { value, done } = chunk;
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl = buffer.indexOf("\n\n");
    while (nl !== -1) {
      const event = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 2);
      const lines = event.split("\n");
      const dataLines: string[] = [];
      for (const line of lines) {
        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trimStart());
        }
      }
      if (dataLines.length) {
        const json = dataLines.join("\n");
        try {
          const evt = JSON.parse(json) as Record<string, unknown>;
          const phase = evt.phase as string | undefined;
          if (phase === "done") {
            donePayload = evt.payload as TranscribePipelineData;
          } else if (phase === "failed") {
            failureCode = (evt.code as string | undefined) ?? "transcribe_failed";
            failureMessage =
              (evt.message as string | undefined) ?? "Transcription failed.";
          } else if (phase === "interrupted") {
            failureCode = "interrupted";
            failureMessage =
              (evt.message as string | undefined) ??
              "Server restarted while transcription was running. Re-trigger to retry.";
            onPhase?.(evt as unknown as TranscribePhaseEvent);
          } else if (
            phase === "ready" ||
            phase === "extracting" ||
            phase === "compressing" ||
            phase === "chunking" ||
            phase === "transcribing" ||
            phase === "stitching"
          ) {
            onPhase?.(evt as unknown as TranscribePhaseEvent);
          }
        } catch {
          /* skip malformed event */
        }
      }
      nl = buffer.indexOf("\n\n");
    }
  }

  if (donePayload) return donePayload;
  if (failureCode) {
    throw new TranscribePipelineError(
      failureMessage ?? "Transcription failed.",
      failureCode,
      "transcribe_pipeline",
      false,
    );
  }
  if (signal?.aborted) {
    throw new TranscribePipelineError(
      "Transcription aborted",
      "aborted",
      "transcribe_stream",
      false,
    );
  }
  throw new TranscribePipelineError(
    "Transcription stream ended without a result.",
    "stream_truncated",
    "transcribe_stream",
    true,
  );
}

/**
 * Drop any pending-upload localStorage breadcrumb. WebEdit calls
 * this from its "cancel" / "replace file" paths so a future picks of a
 * different file don't accidentally hit the resume-probe codepath.
 */
export function clearPendingTranscribeUpload(): void {
  clearPendingUpload();
}

/**
 * Read the pending-upload manifest if any. WebEdit shows a tiny
 * "Resume previous upload?" hint on mount when this returns non-null,
 * so the founder doesn't have to remember whether they were mid-upload.
 */
export function peekPendingTranscribeUpload(): PendingUploadRecord | null {
  return readPendingUpload();
}
