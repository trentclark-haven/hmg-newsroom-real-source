/**
 * Centralized localStorage helpers with quota-awareness, JSON validation, and
 * corrupt-key quarantine. Existing call sites that already wrap their reads in
 * try/catch can keep doing so — this module is for new infra (job ledger,
 * snapshots, operator profile) and for any caller that wants a single source
 * of truth for storage failures.
 *
 * Design rules:
 *   - never throws (all failures are signaled through return value)
 *   - never logs values (only key + error class)
 *   - quota-exceeded triggers a `safeStorageQuotaWarning` window event so the
 *     UI can surface a banner without hard-coupling to any specific component
 */

const QUARANTINE_PREFIX = "hmg-quarantine-";
const QUOTA_EVENT = "hmg-safe-storage-quota";
const WARN_PCT = 0.7;
const CRITICAL_PCT = 0.85;
const HARD_PCT = 0.9;

// Conservative ceiling. Browsers vary (5–10 MB) but we treat 5 MB as the floor
// so the warning fires before we get a real `QuotaExceededError`.
const ASSUMED_QUOTA_BYTES = 5 * 1024 * 1024;

export type SafeStorageStatus = "ok" | "warning" | "critical" | "hard-stop";

export interface SafeStorageReport {
  bytes: number;
  pct: number;
  status: SafeStorageStatus;
}

function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; code?: number };
  return (
    e.name === "QuotaExceededError" ||
    e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    e.code === 22 ||
    e.code === 1014
  );
}

export function estimateUsage(): SafeStorageReport {
  if (typeof window === "undefined") {
    return { bytes: 0, pct: 0, status: "ok" };
  }
  let total = 0;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k) continue;
      const v = window.localStorage.getItem(k) ?? "";
      total += k.length + v.length;
    }
  } catch {
    /* ignore */
  }
  // 2 bytes per char (UTF-16 in-memory) is the typical browser accounting.
  const bytes = total * 2;
  const pct = bytes / ASSUMED_QUOTA_BYTES;
  let status: SafeStorageStatus = "ok";
  if (pct >= HARD_PCT) status = "hard-stop";
  else if (pct >= CRITICAL_PCT) status = "critical";
  else if (pct >= WARN_PCT) status = "warning";
  return { bytes, pct, status };
}

function emitQuotaWarning(report: SafeStorageReport) {
  try {
    window.dispatchEvent(
      new CustomEvent(QUOTA_EVENT, { detail: report }),
    );
  } catch {
    /* ignore */
  }
}

export function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (isQuotaError(err)) {
      emitQuotaWarning(estimateUsage());
    }
    return false;
  }
}

export function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Read + JSON.parse with a validator. If the stored value is corrupt or fails
 * the validator, quarantine the original payload (so it can be inspected
 * later) and return `fallback`.
 */
export function safeGetJSON<T>(
  key: string,
  validate: (raw: unknown) => raw is T,
  fallback: T,
): T {
  const raw = safeGet(key);
  if (raw == null) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (validate(parsed)) return parsed;
    quarantine(key, raw);
    return fallback;
  } catch {
    quarantine(key, raw);
    return fallback;
  }
}

export function safeSetJSON(key: string, value: unknown): boolean {
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return false;
  }
  return safeSet(key, serialized);
}

/**
 * Move a corrupt value to a quarantine key and remove the original so the app
 * can recover on next boot. Quarantined keys are capped at 4 to avoid runaway
 * accumulation; oldest is dropped first.
 */
function quarantine(key: string, raw: string): void {
  if (typeof window === "undefined") return;
  try {
    const ts = Date.now();
    window.localStorage.setItem(
      `${QUARANTINE_PREFIX}${ts}-${key.slice(0, 60)}`,
      raw.slice(0, 8000),
    );
    window.localStorage.removeItem(key);
    pruneQuarantine();
  } catch {
    /* ignore */
  }
}

function pruneQuarantine(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(QUARANTINE_PREFIX)) keys.push(k);
    }
    keys.sort(); // timestamp prefix → lexicographic == chronological
    while (keys.length > 4) {
      const drop = keys.shift();
      if (drop) window.localStorage.removeItem(drop);
    }
  } catch {
    /* ignore */
  }
}

export const SAFE_STORAGE_QUOTA_EVENT = QUOTA_EVENT;
