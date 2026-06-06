/**
 * Client-side request queue with per-kind concurrency caps and dedupe.
 *
 * Goals:
 *   - if the user taps Generate 10 times in a row, we must NOT spawn 10 backend
 *     calls — identical jobs (same kind+key) collapse to a single in-flight
 *     promise that all callers await.
 *   - heavy kinds (transcription, image gen) get smaller caps so they don't
 *     drown out lighter calls (text AI).
 *   - per-silo publish lock: WordPress publish/media calls per silo cap at 1.
 *
 * Caps mirror the spec:
 *   text-ai: 5, image-ai: 2, transcribe: 2, wp-publish: 1 per silo,
 *   public-app: 1 global.
 */

export type QueueKind =
  | "text-ai"
  | "image-ai"
  | "transcribe"
  | "wp-publish"
  | "public-app";

const CAPS: Record<QueueKind, number> = {
  "text-ai": 5,
  "image-ai": 2,
  transcribe: 2,
  "wp-publish": 1,
  "public-app": 1,
};

interface InFlight<T> {
  promise: Promise<T>;
  startedAt: number;
}

interface QueueState {
  // Active running tasks per "lane" (kind or kind:silo for wp-publish).
  active: Map<string, number>;
  // Dedupe map: lane:dedupeKey → in-flight promise.
  inflight: Map<string, InFlight<unknown>>;
  // FIFO waiting tasks per lane.
  waiting: Map<string, Array<() => void>>;
}

const state: QueueState = {
  active: new Map(),
  inflight: new Map(),
  waiting: new Map(),
};

function laneFor(kind: QueueKind, silo?: string): string {
  if (kind === "wp-publish" && silo) return `${kind}:${silo}`;
  return kind;
}

function activeCount(lane: string): number {
  return state.active.get(lane) ?? 0;
}

function bumpActive(lane: string, delta: number) {
  const next = (state.active.get(lane) ?? 0) + delta;
  if (next <= 0) state.active.delete(lane);
  else state.active.set(lane, next);
}

function laneCap(kind: QueueKind): number {
  return CAPS[kind] ?? 1;
}

function waitForSlot(lane: string, kind: QueueKind): Promise<void> {
  if (activeCount(lane) < laneCap(kind)) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const arr = state.waiting.get(lane) ?? [];
    arr.push(resolve);
    state.waiting.set(lane, arr);
  });
}

function releaseSlot(lane: string) {
  bumpActive(lane, -1);
  const arr = state.waiting.get(lane);
  if (arr && arr.length > 0) {
    const next = arr.shift();
    if (arr.length === 0) state.waiting.delete(lane);
    else state.waiting.set(lane, arr);
    if (next) next();
  }
}

export interface EnqueueOptions {
  kind: QueueKind;
  /** Stable signature for dedupe. Identical signatures collapse to one job. */
  dedupeKey: string;
  /** WordPress publish silo, used for per-silo concurrency. Ignored for other kinds. */
  silo?: string;
}

export class DuplicateJobError extends Error {
  readonly code = "duplicate_job" as const;
  constructor() {
    super("Already running");
  }
}

/**
 * Enqueue a task. If an identical task (same kind + dedupeKey) is already
 * in-flight, the existing promise is returned (the caller may opt to throw
 * `DuplicateJobError` instead by checking `isDuplicate`).
 */
export async function enqueue<T>(
  opts: EnqueueOptions,
  task: () => Promise<T>,
): Promise<T> {
  const lane = laneFor(opts.kind, opts.silo);
  const dedupeId = `${lane}::${opts.dedupeKey}`;
  const existing = state.inflight.get(dedupeId);
  if (existing) return existing.promise as Promise<T>;

  const run = (async () => {
    await waitForSlot(lane, opts.kind);
    bumpActive(lane, 1);
    try {
      return await task();
    } finally {
      releaseSlot(lane);
      state.inflight.delete(dedupeId);
    }
  })();

  state.inflight.set(dedupeId, { promise: run as Promise<unknown>, startedAt: Date.now() });
  return run;
}

/**
 * Strict variant: throws `DuplicateJobError` immediately if an identical job
 * is already in flight, instead of returning the existing promise. Use this
 * for user-tap handlers where "Already running" is a useful UX message.
 */
export function isAlreadyRunning(opts: { kind: QueueKind; dedupeKey: string; silo?: string }): boolean {
  const lane = laneFor(opts.kind, opts.silo);
  return state.inflight.has(`${lane}::${opts.dedupeKey}`);
}

export interface QueueSnapshot {
  active: Record<string, number>;
  waiting: Record<string, number>;
  inflight: number;
}

export function snapshotQueue(): QueueSnapshot {
  const active: Record<string, number> = {};
  for (const [k, v] of state.active.entries()) active[k] = v;
  const waiting: Record<string, number> = {};
  for (const [k, v] of state.waiting.entries()) waiting[k] = v.length;
  return { active, waiting, inflight: state.inflight.size };
}

/**
 * Hash a small set of params into a stable dedupe key. Caller is responsible
 * for not including secrets / large blobs.
 */
export function dedupeKeyOf(...parts: Array<string | number | boolean | null | undefined>): string {
  return parts
    .map((p) => (p == null ? "" : String(p)))
    .join("|")
    .slice(0, 240);
}

export const QUEUE_CAPS = CAPS;
