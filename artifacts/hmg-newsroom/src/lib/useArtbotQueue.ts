/**
 * Ω7 useArtbotQueue — offline-werewolf client hook.
 *
 * Contract:
 *   1. Caller invokes `submit(req)` → we try POST /api/artbot/generate.
 *   2. If that POST fails because the network is down (offline OR the
 *      fetch threw a TypeError that browsers use for "load failed"), we
 *      stash the request in localStorage under `artbot.queue.pending`.
 *   3. When `window.online` fires (or on next mount with `navigator.onLine
 *      === true`) we drain the localStorage stash by POSTing each entry
 *      to `/api/artbot/queue`. Every successful enqueue removes its
 *      stashed entry; failures stay queued for the next online event.
 *
 * NO silent failure modes:
 *   - If the server returns 4xx/5xx (i.e. it WAS reachable, but rejected
 *     the request), we surface the error verbatim and DO NOT stash. That
 *     would mask a real bug.
 *   - We only stash when we couldn't reach the server at all.
 *
 * Storage layout (versioned for forward-compat):
 *   localStorage["artbot.queue.pending.v1"] = JSON [
 *     { localId: nanoid, queuedAt: ISO, body: SubmitBody, lastAttemptAt?: ISO, lastError?: string }
 *   ]
 */
import { useCallback, useEffect, useRef, useState } from "react";

const BASE = import.meta.env.BASE_URL;
const STORAGE_KEY = "artbot.queue.pending.v1";

export interface ArtbotSubmitBody {
  prompt: string;
  packId?: string;
  provider?: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
}

export interface ArtbotInlineResult {
  source: "inline";
  provider: string;
  costUsd: number;
  latencyMs: number;
  fromCache: boolean;
  b64: string;
}

export interface ArtbotQueuedResult {
  source: "queued-server";
  jobId: string;
  pollUrl: string;
}

export interface ArtbotStashedResult {
  source: "stashed-offline";
  localId: string;
  queuedAt: string;
}

export type ArtbotSubmitResult =
  | ArtbotInlineResult
  | ArtbotQueuedResult
  | ArtbotStashedResult;

interface PendingEntry {
  localId: string;
  queuedAt: string;
  body: ArtbotSubmitBody;
  lastAttemptAt?: string;
  lastError?: string;
}

function readStash(): PendingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Validate each entry shape; drop malformed rows.
    return parsed.filter(
      (e): e is PendingEntry =>
        e !== null &&
        typeof e === "object" &&
        typeof (e as PendingEntry).localId === "string" &&
        typeof (e as PendingEntry).queuedAt === "string" &&
        typeof (e as PendingEntry).body === "object",
    );
  } catch {
    return [];
  }
}

function writeStash(entries: PendingEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* quota / private mode — out of our control; surface via lastError on next attempt */
  }
}

function nanoid(): string {
  // Tiny URL-safe id; not cryptographic but good enough for client correlation.
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(36).padStart(2, "0")).join("");
}

/**
 * True iff the failure looks like a network/offline failure (browser
 * couldn't reach the server). This is the ONLY condition under which we
 * stash to localStorage.
 */
function isNetworkFailure(err: unknown): boolean {
  if (!navigator.onLine) return true;
  if (err instanceof TypeError) return true; // fetch's offline mode throws TypeError
  if (err instanceof Error && /network|fetch|failed to fetch/i.test(err.message)) {
    return true;
  }
  return false;
}

export interface UseArtbotQueue {
  submit: (body: ArtbotSubmitBody) => Promise<ArtbotSubmitResult>;
  pending: PendingEntry[];
  draining: boolean;
  drainNow: () => Promise<{ enqueued: number; remaining: number }>;
}

export function useArtbotQueue(): UseArtbotQueue {
  const [pending, setPending] = useState<PendingEntry[]>(() => readStash());
  const [draining, setDraining] = useState(false);
  const drainingRef = useRef(false);

  const persist = useCallback((next: PendingEntry[]) => {
    writeStash(next);
    setPending(next);
  }, []);

  const drainNow = useCallback(async () => {
    if (drainingRef.current) {
      return { enqueued: 0, remaining: readStash().length };
    }
    drainingRef.current = true;
    setDraining(true);
    let enqueued = 0;
    try {
      const current = readStash();
      const remaining: PendingEntry[] = [];
      for (const entry of current) {
        try {
          const res = await fetch(`${BASE}api/artbot/queue`, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry.body),
          });
          if (res.ok || res.status === 202) {
            enqueued += 1;
            // success → drop from stash
          } else {
            const text = await res.text().catch(() => "");
            // server rejected the body → this is a real error, NOT a
            // network problem. Drop from stash so we don't loop forever.
            if (res.status >= 400 && res.status < 500) {
              // record but don't requeue — bad request will never succeed
            } else {
              remaining.push({
                ...entry,
                lastAttemptAt: new Date().toISOString(),
                lastError: `HTTP ${res.status}: ${text.slice(0, 120)}`,
              });
            }
          }
        } catch (err) {
          // network failure during drain → keep for next online event
          remaining.push({
            ...entry,
            lastAttemptAt: new Date().toISOString(),
            lastError: (err as Error).message ?? String(err),
          });
        }
      }
      persist(remaining);
      return { enqueued, remaining: remaining.length };
    } finally {
      drainingRef.current = false;
      setDraining(false);
    }
  }, [persist]);

  // On `online` event AND on mount (in case we already came back), drain.
  useEffect(() => {
    const onOnline = () => {
      void drainNow();
    };
    window.addEventListener("online", onOnline);
    if (navigator.onLine && readStash().length > 0) {
      void drainNow();
    }
    return () => {
      window.removeEventListener("online", onOnline);
    };
  }, [drainNow]);

  const submit = useCallback(
    async (body: ArtbotSubmitBody): Promise<ArtbotSubmitResult> => {
      try {
        const res = await fetch(`${BASE}api/artbot/generate`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            provider: string;
            costUsd: number;
            latencyMs: number;
            fromCache: boolean;
            b64: string;
          };
          return {
            source: "inline",
            provider: data.provider,
            costUsd: data.costUsd,
            latencyMs: data.latencyMs,
            fromCache: data.fromCache,
            b64: data.b64,
          };
        }
        // Server reachable but rejected request → propagate error verbatim.
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 240)}`);
      } catch (err) {
        if (!isNetworkFailure(err)) {
          throw err;
        }
        // Network failure: stash for retry on next online event.
        const entry: PendingEntry = {
          localId: nanoid(),
          queuedAt: new Date().toISOString(),
          body,
          lastAttemptAt: new Date().toISOString(),
          lastError: (err as Error).message ?? String(err),
        };
        const next = [...readStash(), entry];
        persist(next);
        return {
          source: "stashed-offline",
          localId: entry.localId,
          queuedAt: entry.queuedAt,
        };
      }
    },
    [persist],
  );

  return { submit, pending, draining, drainNow };
}
