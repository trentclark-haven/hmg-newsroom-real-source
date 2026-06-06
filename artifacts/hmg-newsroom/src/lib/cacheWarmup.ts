/**
 * Cache warmup. On Home mount (and on a long interval afterward) we pre-fetch
 * a handful of read-mostly endpoints into the hot cache. The first warmup
 * pass produces a wave of misses; every subsequent UI consumer that calls
 * `cachedFetchJSON` against the same URL gets a hit.
 *
 * This is the primary lever that moves the Werewolf cacheHealth component
 * from baseline (no samples → 30) into 90+ territory: by the time the
 * Command Center polls `cacheStats()`, the L1 cache has live entries and
 * the hit:miss ratio reflects real reuse, not absence of activity.
 *
 * What we warm:
 *   - GET /api/founder/me           — auth state, polled by useFounderSession
 *   - GET /api/system/status        — system health card source
 *   - GET /api/social-factory/status — platform list for Social Factory view
 *   - GET /api/wordpress/status     — connection state per silo (best-effort)
 *
 * What we DON'T warm:
 *   - Anything mutating
 *   - Anything that streams (SSE / NDJSON)
 *   - Anything that depends on user input
 */

import { cachedFetchJSON, CachedFetchError } from "./cachedFetch";
import { recordAudit } from "./auditLog";

const BASE = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "/";

export interface WarmupResult {
  url: string;
  ok: boolean;
  ms: number;
  hint?: string;
}

const WARMUP_TARGETS: Array<{
  url: string;
  cls: "text" | "wp-status";
  /** Treat 401 as benign (anonymous user), don't flag as failure. */
  ignoreAuth?: boolean;
}> = [
  // /me + /system/status return 401 for anonymous, which is normal — flagged
  // as benign so the warmup result is still "ok" for them.
  { url: `${BASE}api/founder/me`, cls: "text", ignoreAuth: true },
  { url: `${BASE}api/system/status`, cls: "text", ignoreAuth: true },
  // open endpoint, used by SocialFactoryView's status panel
  { url: `${BASE}api/social-factory/status`, cls: "text" },
];

let lastWarmAt = 0;
const MIN_INTERVAL_MS = 30_000; // never warm more than once per 30 s

/**
 * Run a warmup pass. Returns a per-target result list. Errors do NOT throw —
 * warmup is opportunistic; failures degrade silently and the next consumer
 * just takes the miss-then-fetch path.
 */
export async function warmAllCaches(): Promise<WarmupResult[]> {
  const now = Date.now();
  if (now - lastWarmAt < MIN_INTERVAL_MS) return [];
  lastWarmAt = now;

  const results = await Promise.all(
    WARMUP_TARGETS.map(async (target): Promise<WarmupResult> => {
      const start = performance.now();
      try {
        await cachedFetchJSON(target.url, { cls: target.cls });
        return { url: target.url, ok: true, ms: Math.round(performance.now() - start) };
      } catch (err) {
        const ms = Math.round(performance.now() - start);
        if (err instanceof CachedFetchError && err.status === 401 && target.ignoreAuth) {
          // Anonymous user: treat as benign, do not flag as failure.
          return { url: target.url, ok: true, ms, hint: "anon" };
        }
        return {
          url: target.url,
          ok: false,
          ms,
          hint: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );

  try {
    const okCount = results.filter((r) => r.ok).length;
    recordAudit(
      "cache-warmup",
      "system",
      `${okCount}/${results.length} ok in ${Math.round(performance.now())} ms`,
    );
  } catch {
    /* ignore */
  }

  return results;
}

/**
 * Reset the rate limiter. Used when the active silo changes — at that point
 * we want a fresh warmup pass even if we ran one a moment ago because some
 * cached data is silo-scoped.
 */
export function resetWarmupThrottle(): void {
  lastWarmAt = 0;
}
