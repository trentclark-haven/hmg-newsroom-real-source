/**
 * In-memory circuit breaker (client-side mirror).
 *
 * States:
 *   - closed:   normal traffic, failures count up
 *   - open:     all calls reject immediately for `cooldownMs`
 *   - half-open: one trial call allowed; success → closed, failure → open
 *
 * Per-key (e.g. "ai-text", "ai-image", "transcribe", `wp:silo`, "public-app").
 * Counts are not persisted across reloads — this is a pressure valve, not an
 * audit record (the job ledger is the audit record).
 */

export type BreakerState = "closed" | "open" | "half-open";

export interface BreakerConfig {
  failureThreshold: number; // open after this many consecutive failures
  cooldownMs: number; // how long to stay open before half-open trial
  rollingWindowMs: number; // failures older than this don't count
}

const DEFAULT_CONFIG: BreakerConfig = {
  failureThreshold: 4,
  cooldownMs: 20_000,
  rollingWindowMs: 60_000,
};

interface BreakerRecord {
  state: BreakerState;
  failures: number[]; // timestamps
  openedAt: number | null;
  trialInFlight: boolean;
  config: BreakerConfig;
}

const records = new Map<string, BreakerRecord>();

export class CircuitOpenError extends Error {
  readonly code = "circuit_open" as const;
  readonly retryAfterMs: number;
  constructor(key: string, retryAfterMs: number) {
    super("Service temporarily unavailable. Cooling down.");
    this.retryAfterMs = retryAfterMs;
    this.name = `CircuitOpenError(${key})`;
  }
}

function getOrCreate(key: string, config?: Partial<BreakerConfig>): BreakerRecord {
  const existing = records.get(key);
  if (existing) return existing;
  const rec: BreakerRecord = {
    state: "closed",
    failures: [],
    openedAt: null,
    trialInFlight: false,
    config: { ...DEFAULT_CONFIG, ...(config ?? {}) },
  };
  records.set(key, rec);
  return rec;
}

function trimWindow(rec: BreakerRecord) {
  const cutoff = Date.now() - rec.config.rollingWindowMs;
  rec.failures = rec.failures.filter((t) => t >= cutoff);
}

function maybeReopen(rec: BreakerRecord): boolean {
  if (rec.state !== "open" || rec.openedAt == null) return false;
  if (Date.now() - rec.openedAt >= rec.config.cooldownMs) {
    rec.state = "half-open";
    rec.trialInFlight = false;
    return true;
  }
  return false;
}

export interface BreakerStatus {
  state: BreakerState;
  recentFailures: number;
  retryAfterMs: number;
}

export function inspect(key: string): BreakerStatus {
  const rec = records.get(key);
  if (!rec) {
    return { state: "closed", recentFailures: 0, retryAfterMs: 0 };
  }
  trimWindow(rec);
  maybeReopen(rec);
  const retryAfterMs =
    rec.state === "open" && rec.openedAt != null
      ? Math.max(0, rec.config.cooldownMs - (Date.now() - rec.openedAt))
      : 0;
  return {
    state: rec.state,
    recentFailures: rec.failures.length,
    retryAfterMs,
  };
}

/**
 * Run `task` through the breaker for `key`. Throws `CircuitOpenError` if the
 * circuit is open, or rethrows the original error after recording the failure.
 */
export async function runThroughBreaker<T>(
  key: string,
  task: () => Promise<T>,
  config?: Partial<BreakerConfig>,
): Promise<T> {
  const rec = getOrCreate(key, config);
  trimWindow(rec);
  maybeReopen(rec);

  if (rec.state === "open") {
    const retryAfterMs =
      rec.openedAt != null
        ? Math.max(0, rec.config.cooldownMs - (Date.now() - rec.openedAt))
        : rec.config.cooldownMs;
    throw new CircuitOpenError(key, retryAfterMs);
  }
  if (rec.state === "half-open") {
    if (rec.trialInFlight) {
      throw new CircuitOpenError(key, 1000);
    }
    rec.trialInFlight = true;
  }

  try {
    const result = await task();
    // Success → close
    rec.failures = [];
    rec.state = "closed";
    rec.openedAt = null;
    rec.trialInFlight = false;
    return result;
  } catch (err) {
    rec.failures.push(Date.now());
    trimWindow(rec);
    rec.trialInFlight = false;
    if (rec.failures.length >= rec.config.failureThreshold) {
      rec.state = "open";
      rec.openedAt = Date.now();
    } else if (rec.state === "half-open") {
      rec.state = "open";
      rec.openedAt = Date.now();
    }
    throw err;
  }
}

export function resetBreaker(key: string): void {
  records.delete(key);
}

export function snapshotBreakers(): Record<string, BreakerStatus> {
  const out: Record<string, BreakerStatus> = {};
  for (const key of records.keys()) out[key] = inspect(key);
  return out;
}
