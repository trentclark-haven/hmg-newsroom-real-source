/**
 * HMG Newsroom — Performance Utilities
 * Task 10: safe localStorage helpers, debounced save, memoized counters
 */

/**
 * Safely read a JSON value from localStorage.
 * Returns null on any error — never throws.
 */
export function safeReadJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Safely write a JSON value to localStorage.
 * Returns false if quota is exceeded or serialization fails — never throws.
 */
export function safeWriteJSON(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Count entries in an array stored under a localStorage key.
 * Looks for { entries: unknown[] } or { items: unknown[] } shapes.
 * Returns 0 on any error.
 */
export function countStoredEntries(key: string): number {
  const parsed = safeReadJSON<{ entries?: unknown[]; items?: unknown[] }>(key);
  if (!parsed) return 0;
  if (Array.isArray(parsed.entries)) return parsed.entries.length;
  if (Array.isArray(parsed.items)) return parsed.items.length;
  return 0;
}

/**
 * Estimate total localStorage usage in bytes and percentage of 5 MB soft quota.
 */
export function estimateLocalStorageUsage(): {
  usedBytes: number;
  usedMB: number;
  pct: number;
  healthy: boolean;
} {
  if (typeof window === "undefined") {
    return { usedBytes: 0, usedMB: 0, pct: 0, healthy: true };
  }
  let bytes = 0;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      bytes += (window.localStorage.getItem(key) ?? "").length * 2;
    }
  } catch {
    /* ignore */
  }
  const usedMB = bytes / 1024 / 1024;
  const pct = Math.min(100, Math.round((usedMB / 5) * 100));
  return { usedBytes: bytes, usedMB, pct, healthy: usedMB < 4 };
}

type DebouncedFn<T extends unknown[]> = (...args: T) => void;

/**
 * Returns a debounced version of fn that only executes after
 * the given delay has elapsed with no further calls.
 */
export function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delayMs: number,
): DebouncedFn<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (...args: T) {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delayMs);
  };
}

/**
 * Revoke an object URL safely — no-op if url is empty or already revoked.
 */
export function safeRevokeObjectURL(url: string | null | undefined): void {
  if (!url) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}
