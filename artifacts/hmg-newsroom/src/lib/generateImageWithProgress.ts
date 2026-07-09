/**
 * Art Desk streaming image creation client.
 *
 * Consumes the SSE stream from POST /api/openai/image and surfaces phase
 * events to the caller so the UI can show "Optimizing prompt..." while the
 * server's rewrite-and-retry pipeline does its work — instead of the old
 * red MODERATION_BLOCKED dead-end.
 *
 * Mirrors the structure of `transcribeWithProgress.ts` (WebEdit flow)
 * for consistency.
 */

export type ImageGenPhase =
  | { phase: "ready" }
  | { phase: "cached"; key: string }
  | {
      phase: "trying";
      attempt: number;
      rewriteLevel: number;
      provider: string;
    }
  | { phase: "optimizing"; attempt: number; reason: string }
  | { phase: "alternate"; attempt: number; nextLevel: number }
  | {
      phase: "delivered";
      attempts: number;
      rewriteLevel: number;
      provider: string;
      fromCache: boolean;
      totalMs: number;
    };

export interface ImageGenResult {
  image: string; // data:image/png;base64,...
  prompt: string; // final (post-rewrite) prompt used
  attempts: number;
  rewriteLevel: number;
  provider: string;
  fromCache: boolean;
  totalMs: number;
}

export type ImageGenStage =
  | "open"
  | "stream"
  | "pipeline";

export class ImageGenError extends Error {
  constructor(
    message: string,
    public code: string,
    public stage: ImageGenStage,
  ) {
    super(message);
    this.name = "ImageGenError";
  }
}

function coerceAbort(err: unknown, stage: ImageGenStage): never {
  const name = (err as { name?: string })?.name ?? "";
  if (name === "AbortError") {
    throw new ImageGenError("Image generation aborted", "aborted", stage);
  }
  throw new ImageGenError(
    (err as Error)?.message || "Network error",
    "network_error",
    stage,
  );
}

export type ImageGenSize =
  | "1024x1024"
  | "1024x1536"
  | "1536x1024"
  | "auto";

export interface GenerateImageWithProgressOptions {
  onPhase?: (event: ImageGenPhase) => void;
  signal?: AbortSignal;
  maxAttempts?: number;
  mode?: string;
  noCache?: boolean;
}

/**
 * Open an SSE stream to /api/openai/image and resolve with the final
 * { image, attempts, ... } payload. Rejects with ImageGenError on hard
 * failure or operator abort.
 */
export async function generateImageWithProgress(
  prompt: string,
  size: ImageGenSize,
  opts: GenerateImageWithProgressOptions = {},
): Promise<ImageGenResult> {
  const { onPhase, signal, maxAttempts, mode, noCache } = opts;

  let res: Response;
  try {
    res = await fetch("/api/openai/image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ prompt, size, maxAttempts, mode, noCache }),
      signal,
    });
  } catch (err) {
    coerceAbort(err, "open");
  }

  if (!res.ok || !res.body) {
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch {
      /* ignore */
    }
    throw new ImageGenError(
      `Image stream did not open (HTTP ${res.status}). ${bodyText.slice(0, 200)}`,
      "http_" + res.status,
      "open",
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let donePayload: ImageGenResult | null = null;
  let failureCode: string | null = null;
  let failureMessage: string | null = null;

  while (true) {
    if (signal?.aborted) {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      throw new ImageGenError(
        "Image generation aborted",
        "aborted",
        "stream",
      );
    }
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (err) {
      coerceAbort(err, "stream");
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
        try {
          const evt = JSON.parse(dataLines.join("\n")) as Record<
            string,
            unknown
          >;
          const phase = evt.phase as string | undefined;
          if (phase === "done") {
            donePayload = evt.payload as ImageGenResult;
          } else if (phase === "failed") {
            failureCode = (evt.code as string | undefined) ?? "image_failed";
            failureMessage =
              (evt.message as string | undefined) ?? "Image generation failed.";
          } else if (
            phase === "ready" ||
            phase === "cached" ||
            phase === "trying" ||
            phase === "optimizing" ||
            phase === "alternate" ||
            phase === "delivered"
          ) {
            onPhase?.(evt as unknown as ImageGenPhase);
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
    throw new ImageGenError(
      failureMessage ?? "Image generation failed.",
      failureCode,
      "pipeline",
    );
  }
  if (signal?.aborted) {
    throw new ImageGenError(
      "Image generation aborted",
      "aborted",
      "stream",
    );
  }
  throw new ImageGenError(
    "Image stream ended without a result.",
    "stream_truncated",
    "stream",
  );
}
