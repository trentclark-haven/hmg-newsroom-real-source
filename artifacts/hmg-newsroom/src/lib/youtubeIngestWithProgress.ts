/**
 * YouTube-URL counterpart to `transcribeWithProgress`.
 *
 * Pivot context (FOUNDER MEDIA WARFARE):
 *   The hosted local-file uploader is unstable on mobile Safari
 *   and large founder MOV files (>150 MB) routinely drop mid-upload.
 *   Until that path is fixed, all WebEdit testing flows through this
 *   helper instead. The downstream pipeline does NOT change — this helper
 *   simply chains:
 *
 *     1. POST /api/cutmaster/ingest-youtube  (Accept: text/event-stream)
 *        — yt-dlp pulls the video down server-side, registers it as a
 *          synthetic upload session, returns an uploadId in the same
 *          shape /transcribe-from-upload + /render expect.
 *     2. POST /api/cutmaster/transcribe-from-upload  (Accept: text/event-stream)
 *        — exact same call the file-upload path makes, with the
 *          uploadId from step 1.
 *
 *   The returned `data` payload is identical to what `transcribeWithProgress`
 *   resolves with, plus a `youtubeMetadata` field carrying provenance
 *   (title, channel, sourceUrl, durationSec) so the operator UI can show
 *   "Ingested from YouTube: <title> · <channel>" instead of a filename.
 *
 *   The uploadId is also exposed on the resolved value as `uploadId` so
 *   the render step can reuse it directly (no re-upload from the browser
 *   — the file is already on the server).
 *
 * Phase events:
 *   The helper emits a superset of `TranscribePhaseEvent`. The new
 *   `ingest_*` phases drive the YouTube-specific UI copy ("Resolving
 *   video…", "Downloading 23%…"). Once we cross over into transcription,
 *   the existing transcribe phases take over so the operator sees the
 *   same downstream copy as a normal upload.
 *
 * Honest failures:
 *   Throws `YoutubeIngestPipelineError` with a stable `code` + `stage`
 *   so the UI can show specific copy ("Live streams aren't supported",
 *   "Video is age-restricted, can't ingest", "Video is too long, max
 *   4 hours"). No silent fallbacks.
 */

import {
  type TranscribePhaseEvent,
  type TranscribePipelineData,
  TranscribePipelineError,
} from "./transcribeWithProgress";

/** Provenance attached to the resolved transcript when ingested from YouTube. */
export interface YoutubeMetadataPayload {
  id: string;
  title: string;
  channel: string;
  uploader: string;
  durationSec: number;
  thumbnail: string;
  uploadDate: string | null;
  viewCount: number | null;
  ageLimit: number;
  sourceUrl: string;
  chapters: Array<{ title: string; startSec: number; endSec: number }>;
}

/** Ingest-phase events emitted before transcribe-phase takes over. */
export type YoutubeIngestPhaseEvent =
  | { phase: "ingest_validating" }
  | {
      phase: "ingest_metadata";
      title: string;
      channel: string;
      durationSec: number;
      thumbnail: string;
      chaptersCount: number;
    }
  | {
      phase: "ingest_downloading";
      bytesDownloaded: number;
      totalBytes: number | null;
      percent: number | null;
      etaSec: number | null;
      speedBps: number | null;
    }
  | { phase: "ingest_finalizing"; bytes: number };

/** Combined event union — superset of TranscribePhaseEvent. */
export type YoutubePipelinePhaseEvent =
  | YoutubeIngestPhaseEvent
  | TranscribePhaseEvent;

export type YoutubeIngestStage =
  | "ingest_youtube"
  | "transcribe_stream"
  | "transcribe_pipeline";

export class YoutubeIngestPipelineError extends Error {
  constructor(
    message: string,
    public code: string,
    public stage: YoutubeIngestStage,
    public retryable: boolean = false,
    public stderrTail: string[] = [],
  ) {
    super(message);
    this.name = "YoutubeIngestPipelineError";
  }
}

export interface YoutubeIngestResult extends TranscribePipelineData {
  /** uploadId of the synthetic session — pass to /render to skip re-upload. */
  uploadId: string;
  youtubeMetadata: YoutubeMetadataPayload;
}

export interface YoutubeIngestWithProgressOptions {
  onPhase?: (event: YoutubePipelinePhaseEvent) => void;
  signal?: AbortSignal;
}

interface IngestSuccessPayload {
  uploadId: string;
  filename: string;
  fileBytes: number;
  contentType: string;
  metadata: YoutubeMetadataPayload;
  ingestDurationMs: number;
}

function coerceAbort(err: unknown, stage: YoutubeIngestStage): never {
  if (err instanceof YoutubeIngestPipelineError) throw err;
  if (err instanceof TranscribePipelineError) {
    // Re-wrap so the caller's catch block sees a single error type.
    throw new YoutubeIngestPipelineError(
      err.message,
      err.code,
      stage,
      err.retryable,
    );
  }
  const name = (err as { name?: string } | null)?.name ?? "";
  const isAbort =
    name === "AbortError" ||
    (err instanceof DOMException && err.name === "AbortError");
  if (isAbort) {
    throw new YoutubeIngestPipelineError(
      "YouTube ingest aborted",
      "aborted",
      stage,
      false,
    );
  }
  throw err;
}

/**
 * Ingest a YouTube URL and run the same downstream transcribe pipeline
 * the file-upload path runs. Resolves with the transcript payload + the
 * uploadId so the render step can reuse it directly.
 */
export async function youtubeIngestWithProgress(
  url: string,
  opts: YoutubeIngestWithProgressOptions = {},
): Promise<YoutubeIngestResult> {
  const { onPhase, signal } = opts;

  // ---- 1. Trigger ingest, stream phase events over SSE --------------------
  onPhase?.({ phase: "ingest_validating" });

  let ingestRes: Response;
  try {
    ingestRes = await fetch("/api/cutmaster/ingest-youtube", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ url }),
      signal,
    });
  } catch (err) {
    coerceAbort(err, "ingest_youtube");
  }

  if (!ingestRes.ok || !ingestRes.body) {
    let bodyText = "";
    try {
      bodyText = await ingestRes.text();
    } catch {
      /* ignore */
    }
    // Try to extract a structured error code from the JSON body.
    let code = `ingest_http_${ingestRes.status}`;
    try {
      const j = JSON.parse(bodyText) as { code?: string; error?: string };
      if (j.code) code = j.code;
    } catch {
      /* not JSON, fall through */
    }
    throw new YoutubeIngestPipelineError(
      bodyText.slice(0, 250) ||
        `YouTube ingest did not start (HTTP ${ingestRes.status})`,
      code,
      "ingest_youtube",
      ingestRes.status >= 500,
    );
  }

  const reader = ingestRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let donePayload: IngestSuccessPayload | null = null;
  let failureCode: string | null = null;
  let failureMessage: string | null = null;
  let failureStderrTail: string[] = [];

  while (true) {
    if (signal?.aborted) {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      throw new YoutubeIngestPipelineError(
        "YouTube ingest aborted",
        "aborted",
        "ingest_youtube",
        false,
      );
    }
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (err) {
      coerceAbort(err, "ingest_youtube");
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
      if (!dataLines.length) {
        nl = buffer.indexOf("\n\n");
        continue;
      }
      const json = dataLines.join("\n");
      try {
        const evt = JSON.parse(json) as Record<string, unknown>;
        const phase = evt.phase as string | undefined;
        if (phase === "done") {
          donePayload = evt.payload as IngestSuccessPayload;
        } else if (phase === "failed") {
          failureCode =
            (evt.code as string | undefined) ?? "ingest_failed";
          failureMessage =
            (evt.message as string | undefined) ?? "YouTube ingest failed.";
          const tail = evt.stderrTail;
          if (Array.isArray(tail)) {
            failureStderrTail = tail.filter((x): x is string => typeof x === "string");
          }
        } else if (phase === "validating") {
          // Server-side "validating" — already emitted client-side.
        } else if (phase === "metadata") {
          onPhase?.({
            phase: "ingest_metadata",
            title: String(evt.title ?? ""),
            channel: String(evt.channel ?? ""),
            durationSec: Number(evt.durationSec ?? 0),
            thumbnail: String(evt.thumbnail ?? ""),
            chaptersCount: Number(evt.chaptersCount ?? 0),
          });
        } else if (phase === "downloading") {
          onPhase?.({
            phase: "ingest_downloading",
            bytesDownloaded: Number(evt.bytesDownloaded ?? 0),
            totalBytes:
              typeof evt.totalBytes === "number" ? evt.totalBytes : null,
            percent: typeof evt.percent === "number" ? evt.percent : null,
            etaSec: typeof evt.etaSec === "number" ? evt.etaSec : null,
            speedBps:
              typeof evt.speedBps === "number" ? evt.speedBps : null,
          });
        } else if (phase === "finalizing") {
          onPhase?.({
            phase: "ingest_finalizing",
            bytes: Number(evt.bytes ?? 0),
          });
        }
        // Other phases ("ready") are silently ignored — they're SSE-handshake noise.
      } catch {
        /* skip malformed event */
      }
      nl = buffer.indexOf("\n\n");
    }
  }

  if (!donePayload) {
    if (failureCode) {
      throw new YoutubeIngestPipelineError(
        failureMessage ?? "YouTube ingest failed.",
        failureCode,
        "ingest_youtube",
        false,
        failureStderrTail,
      );
    }
    if (signal?.aborted) {
      throw new YoutubeIngestPipelineError(
        "YouTube ingest aborted",
        "aborted",
        "ingest_youtube",
        false,
      );
    }
    throw new YoutubeIngestPipelineError(
      "YouTube ingest stream ended without a result.",
      "stream_truncated",
      "ingest_youtube",
      true,
    );
  }

  const ingestDone = donePayload;
  const uploadId = ingestDone.uploadId;

  // ---- 2. Hand off to the existing /transcribe-from-upload SSE pipeline ---
  // This is the SAME route /transcribe-from-upload uses for browser uploads,
  // and it expects the same uploadId shape we just produced.
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
    let bodyText = "";
    try {
      bodyText = await sseRes.text();
    } catch {
      /* ignore */
    }
    throw new YoutubeIngestPipelineError(
      `Transcribe stream did not open (HTTP ${sseRes.status}). ${bodyText.slice(0, 200)}`,
      "transcribe_stream_failed",
      "transcribe_stream",
      sseRes.status >= 500,
    );
  }

  const tReader = sseRes.body.getReader();
  const tDecoder = new TextDecoder();
  let tBuffer = "";
  let transcriptDone: TranscribePipelineData | null = null;
  let tFailureCode: string | null = null;
  let tFailureMessage: string | null = null;

  while (true) {
    if (signal?.aborted) {
      try {
        await tReader.cancel();
      } catch {
        /* ignore */
      }
      throw new YoutubeIngestPipelineError(
        "Transcription aborted",
        "aborted",
        "transcribe_stream",
        false,
      );
    }
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await tReader.read();
    } catch (err) {
      coerceAbort(err, "transcribe_stream");
    }
    const { value, done } = chunk;
    if (done) break;
    tBuffer += tDecoder.decode(value, { stream: true });
    let nl = tBuffer.indexOf("\n\n");
    while (nl !== -1) {
      const event = tBuffer.slice(0, nl);
      tBuffer = tBuffer.slice(nl + 2);
      const lines = event.split("\n");
      const dataLines: string[] = [];
      for (const line of lines) {
        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trimStart());
        }
      }
      if (!dataLines.length) {
        nl = tBuffer.indexOf("\n\n");
        continue;
      }
      const json = dataLines.join("\n");
      try {
        const evt = JSON.parse(json) as Record<string, unknown>;
        const phase = evt.phase as string | undefined;
        if (phase === "done") {
          transcriptDone = evt.payload as TranscribePipelineData;
        } else if (phase === "failed") {
          tFailureCode =
            (evt.code as string | undefined) ?? "transcribe_failed";
          tFailureMessage =
            (evt.message as string | undefined) ?? "Transcription failed.";
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
      nl = tBuffer.indexOf("\n\n");
    }
  }

  if (!transcriptDone) {
    if (tFailureCode) {
      throw new YoutubeIngestPipelineError(
        tFailureMessage ?? "Transcription failed.",
        tFailureCode,
        "transcribe_pipeline",
        false,
      );
    }
    if (signal?.aborted) {
      throw new YoutubeIngestPipelineError(
        "Transcription aborted",
        "aborted",
        "transcribe_stream",
        false,
      );
    }
    throw new YoutubeIngestPipelineError(
      "Transcription stream ended without a result.",
      "stream_truncated",
      "transcribe_stream",
      true,
    );
  }

  return {
    ...transcriptDone,
    uploadId,
    youtubeMetadata: ingestDone.metadata,
  };
}
