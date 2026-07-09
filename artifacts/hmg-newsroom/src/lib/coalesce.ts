/**
 * Request coalescing. When multiple callers ask for the same work within a
 * short window, only the first launches the upstream call; everyone else
 * attaches to the in-flight Promise and gets the same resolution. This is
 * different from requestQueue's `DuplicateJobError` rejection — coalesce
 * succeeds for all callers off a single upstream invocation.
 *
 * Caller responsibility: build a stable signature that excludes secrets and
 * large blobs (use a fingerprint hash for media). The signature is used as a
 * map key; collisions = wrong shared result.
 */

import { recordAudit } from "./auditLog";

interface InFlight<T> {
  promise: Promise<T>;
  startedAt: number;
  followerCount: number;
  silo: string;
  kind: string;
}

const inflight = new Map<string, InFlight<unknown>>();

let coalescedCount = 0;
let launchedCount = 0;

export interface CoalesceOptions {
  kind: string;
  silo: string;
  signature: string;
  /** Optional max age in ms after which we refuse to share the in-flight (forces a fresh call). */
  maxAgeMs?: number;
}

/**
 * Run `task` if no identical signature is in-flight; otherwise attach to the
 * existing one. Coalesced followers are recorded in the audit log so we can
 * see the savings later.
 */
export async function coalesce<T>(
  opts: CoalesceOptions,
  task: () => Promise<T>,
): Promise<T> {
  const key = `${opts.kind}::${opts.silo}::${opts.signature}`;
  const existing = inflight.get(key) as InFlight<T> | undefined;
  const now = Date.now();
  if (existing) {
    const age = now - existing.startedAt;
    if (!opts.maxAgeMs || age <= opts.maxAgeMs) {
      existing.followerCount += 1;
      coalescedCount += 1;
      // Audit metadata-only: no payload, no signature contents that might
      // include user prompt fragments — just kind/silo/age.
      try {
        recordAudit(
          "request-coalesced",
          opts.silo,
          `${opts.kind} coalesced (age ${age}ms, followers ${existing.followerCount})`,
        );
      } catch {
        /* ignore */
      }
      return existing.promise;
    }
    // Stale — drop and run fresh.
    inflight.delete(key);
  }

  launchedCount += 1;
  const promise = (async () => {
    try {
      return await task();
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, {
    promise,
    startedAt: now,
    followerCount: 0,
    silo: opts.silo,
    kind: opts.kind,
  });
  return promise;
}

export interface CoalesceStats {
  inflight: number;
  coalescedCount: number;
  launchedCount: number;
  /** ratio of coalesced followers to total requests. Higher = more savings. */
  hitRate: number;
}

export function coalesceStats(): CoalesceStats {
  const total = coalescedCount + launchedCount;
  const hitRate = total > 0 ? coalescedCount / total : 0;
  return {
    inflight: inflight.size,
    coalescedCount,
    launchedCount,
    hitRate,
  };
}

export function resetCoalesceStats(): void {
  coalescedCount = 0;
  launchedCount = 0;
}

/**
 * Fast non-cryptographic hash for building signatures from prompts/media. Not
 * for security purposes; just for keying.
 */
export function fingerprint(input: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
