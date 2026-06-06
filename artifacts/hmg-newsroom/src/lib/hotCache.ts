/**
 * Three-layer hot cache.
 *   L1 — in-memory Map, ~5min TTL, lost on reload.
 *   L2 — safeStorage-backed JSON, 6–24h TTL by content type, survives reload.
 *   L3 — recovery snapshot (manual restore only; piggybacks recoverySnapshots).
 *
 * Caller is responsible for picking a stable cache key that excludes secrets
 * and big blobs. We never serialize media payloads here.
 */

import { safeGetJSON, safeSetJSON, safeRemove } from "./safeStorage";

const L1_TTL_MS = 5 * 60 * 1000;
const STORAGE_PREFIX = "hmg-cache-v1::";

export type ContentClass = "text" | "image-meta" | "transcript" | "wp-status";

const L2_TTL_BY_CLASS: Record<ContentClass, number> = {
  text: 6 * 60 * 60 * 1000, // 6h
  "image-meta": 24 * 60 * 60 * 1000, // 24h
  transcript: 24 * 60 * 60 * 1000,
  "wp-status": 10 * 60 * 1000, // 10m — connection state shifts often
};

interface L1Entry<T> {
  value: T;
  expiresAt: number;
  bytes: number;
}

interface L2Wrapper<T> {
  v: T;
  exp: number;
  cls: ContentClass;
}

const l1 = new Map<string, L1Entry<unknown>>();

let hits = 0;
let misses = 0;
let evictions = 0;

function isWrapper(x: unknown): x is L2Wrapper<unknown> {
  return Boolean(
    x && typeof x === "object" && "v" in (x as object) && "exp" in (x as object),
  );
}

export function cacheGet<T>(key: string, cls: ContentClass): T | null {
  const now = Date.now();
  // L1 lookup
  const l1Entry = l1.get(key) as L1Entry<T> | undefined;
  if (l1Entry) {
    if (l1Entry.expiresAt > now) {
      hits += 1;
      return l1Entry.value;
    }
    l1.delete(key);
    evictions += 1;
  }
  // L2 lookup — promote into L1 if fresh
  const wrapper = safeGetJSON<L2Wrapper<T>>(
    STORAGE_PREFIX + key,
    isWrapper as (x: unknown) => x is L2Wrapper<T>,
    null as unknown as L2Wrapper<T>,
  );
  if (wrapper && wrapper.exp > now) {
    hits += 1;
    l1.set(key, {
      value: wrapper.v,
      expiresAt: now + L1_TTL_MS,
      bytes: estimateBytes(wrapper.v),
    });
    void cls;
    return wrapper.v;
  }
  if (wrapper) {
    safeRemove(STORAGE_PREFIX + key);
    evictions += 1;
  }
  misses += 1;
  return null;
}

export function cacheSet<T>(key: string, value: T, cls: ContentClass): void {
  const now = Date.now();
  l1.set(key, {
    value,
    expiresAt: now + L1_TTL_MS,
    bytes: estimateBytes(value),
  });
  const wrapper: L2Wrapper<T> = {
    v: value,
    exp: now + L2_TTL_BY_CLASS[cls],
    cls,
  };
  safeSetJSON(STORAGE_PREFIX + key, wrapper);
}

export function cacheInvalidate(key: string): void {
  if (l1.delete(key)) evictions += 1;
  safeRemove(STORAGE_PREFIX + key);
}

export function cacheClear(): void {
  evictions += l1.size;
  l1.clear();
  if (typeof window !== "undefined") {
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
      }
      for (const k of keys) safeRemove(k);
    } catch {
      /* ignore */
    }
  }
}

export interface CacheStats {
  l1Entries: number;
  l1Bytes: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

export function cacheStats(): CacheStats {
  let bytes = 0;
  for (const e of l1.values()) bytes += e.bytes;
  const total = hits + misses;
  return {
    l1Entries: l1.size,
    l1Bytes: bytes,
    hits,
    misses,
    evictions,
    hitRate: total > 0 ? hits / total : 0,
  };
}

export function resetCacheStats(): void {
  hits = 0;
  misses = 0;
  evictions = 0;
}

function estimateBytes(v: unknown): number {
  try {
    return JSON.stringify(v).length;
  } catch {
    return 0;
  }
}

/**
 * Sweep L1 for expired entries. Cheap O(n) walk; call from leakWatchdog.
 */
export function sweepL1(): number {
  const now = Date.now();
  let n = 0;
  for (const [k, e] of l1.entries()) {
    if (e.expiresAt <= now) {
      l1.delete(k);
      n += 1;
    }
  }
  evictions += n;
  return n;
}
