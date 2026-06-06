/**
 * Drop-in `fetch` wrapper that consults the hot cache first. Designed for
 * idempotent GETs whose body is JSON and whose payload tolerates a short
 * staleness window (system status, founder/me, social-factory/status, etc.).
 *
 * Behavior:
 *   - L1/L2 hit  → returns cached value immediately, no network.
 *   - Miss       → issues fetch, caches the parsed JSON under a stable key,
 *                  returns the value.
 *   - HTTP error → throws, NEVER caches; subsequent retries hit the wire.
 *   - 401        → throws (so callers can fall back to anon state) and
 *                  invalidates the key (so a new login sees fresh data).
 *
 * Cache key is `fetch::<class>::<fingerprint(method+url+body)>`. Body is
 * stringified for POSTs but cachedFetch is intended for GET; POST callers
 * should opt in explicitly because of side-effects.
 *
 * Counters in hotCache (`cacheStats()`) feed the Werewolf cacheHealth
 * component, so wiring this around any read-mostly endpoint produces real
 * hit/miss ratios after the first call.
 */

import {
  cacheGet,
  cacheSet,
  cacheInvalidate,
  type ContentClass,
} from "./hotCache";
import { coalesce, fingerprint } from "./coalesce";

export interface CachedFetchOptions extends RequestInit {
  /** Cache class — controls L2 TTL. Defaults to "text". */
  cls?: ContentClass;
  /** Skip the cache lookup but still write the result. Useful for forced refresh. */
  forceFresh?: boolean;
  /** Don't write the result to cache. */
  noStore?: boolean;
}

function buildKey(url: string, init: CachedFetchOptions, cls: ContentClass): string {
  const method = (init.method ?? "GET").toUpperCase();
  const bodyStr =
    typeof init.body === "string"
      ? init.body
      : init.body
        ? "binary-body"
        : "";
  return `fetch::${cls}::${fingerprint(`${method} ${url} ${bodyStr}`)}`;
}

export class CachedFetchError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    message?: string,
  ) {
    super(message ?? `HTTP ${status} from ${url}`);
    this.name = "CachedFetchError";
  }
}

/**
 * Fetch JSON with hot-cache awareness. Caller specifies the content class so
 * L2 TTL matches the data's tolerance for staleness.
 */
export async function cachedFetchJSON<T>(
  url: string,
  init: CachedFetchOptions = {},
): Promise<T> {
  const cls: ContentClass = init.cls ?? "text";
  const key = buildKey(url, init, cls);

  if (!init.forceFresh) {
    const hit = cacheGet<T>(key, cls);
    if (hit !== null) return hit;
  }

  // Phase 2.6 P1 — coalesce identical inflight cache misses. Two callers
  // racing for the same key now share one network call + one JSON parse,
  // and the second caller is recorded as a coalesce hit (which feeds the
  // Werewolf cacheHealth combined hit-rate component).
  const data = await coalesce<T>(
    { kind: "cached-fetch", silo: cls, signature: key, maxAgeMs: 30_000 },
    async () => {
      const res = await fetch(url, {
        ...init,
        credentials: init.credentials ?? "same-origin",
      });
      if (res.status === 401) {
        cacheInvalidate(key);
        throw new CachedFetchError(401, url, "unauthenticated");
      }
      if (!res.ok) {
        throw new CachedFetchError(res.status, url);
      }
      return (await res.json()) as T;
    },
  );

  if (!init.noStore) {
    cacheSet(key, data, cls);
  }
  return data;
}

/**
 * Force a fresh read AND update cache. Useful after a write/mutation that
 * invalidates a cached read.
 */
export async function refreshCachedFetchJSON<T>(
  url: string,
  init: CachedFetchOptions = {},
): Promise<T> {
  return cachedFetchJSON<T>(url, { ...init, forceFresh: true });
}

/**
 * Invalidate any cachedFetch entry for the given URL/method/body combination.
 */
export function invalidateCachedFetch(
  url: string,
  init: CachedFetchOptions = {},
): void {
  const cls: ContentClass = init.cls ?? "text";
  cacheInvalidate(buildKey(url, init, cls));
}
