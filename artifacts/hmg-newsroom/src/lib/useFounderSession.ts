/**
 * Server-validated team session hook.
 *
 * Calls GET /api/founder/me on mount and on a 60s interval. Exposes the
 * authoritative role + label coming from the server-signed cookie. Every
 * privileged UI surface in the client must gate render on either
 * `founder === true` (founder-only) or `can(role, [...])` (multi-role).
 *
 * Network behavior:
 *   - 401 → role=null, founder=false, no error surface (anonymous default).
 *   - 5xx / network error → role=null, founder=false, error captured.
 *   - 200 → role/label/sessionId/expiresAt populated.
 *
 * Cookie is sent automatically by the browser; no token plumbing needed.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cachedFetchJSON, invalidateCachedFetch, CachedFetchError } from "./cachedFetch";

const ME_URL = `${import.meta.env.BASE_URL}api/founder/me`;
const LOGIN_URL = `${import.meta.env.BASE_URL}api/founder/login`;
const LOGOUT_URL = `${import.meta.env.BASE_URL}api/founder/logout`;
const POLL_MS = 60_000;

export const TEAM_ROLES = [
  "founder",
  "admin",
  "editor",
  "writer",
  "video",
  "sales",
  "developer",
  "viewer",
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  founder: "Founder",
  admin: "Admin",
  editor: "Editor",
  writer: "Writer",
  video: "Video",
  sales: "Sales",
  developer: "Developer",
  viewer: "Viewer",
};

export interface FounderSession {
  /** True iff the server-validated role is "founder". Back-compat alias. */
  founder: boolean;
  /** Server-validated role, null when anonymous. */
  role: TeamRole | null;
  /** Display name from invite or "Founder" for direct founder login. */
  label: string | null;
  /** Server-issued session id (opaque). null when anonymous. */
  sessionId: string | null;
  /** Cookie expiry epoch ms. null when anonymous. */
  expiresAt: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  login: (passphrase: string) => Promise<{ ok: boolean; role?: TeamRole; label?: string; error?: string }>;
  logout: () => Promise<void>;
  /** Helper: does the current session have any of these roles? */
  can: (allowed: readonly TeamRole[]) => boolean;
}

export function useFounderSession(): FounderSession {
  const [role, setRole] = useState<TeamRole | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchMe = useCallback(async (forceFresh = false) => {
    try {
      // Phase 2.5 P1 — route /me through hot cache. The first poll is a
      // miss; subsequent polls inside the L1 5-min TTL are cache hits and
      // feed the Werewolf cacheHealth metric.
      const body = await cachedFetchJSON<{
        role?: string;
        label?: string;
        sessionId?: string;
        expiresAt?: number;
      }>(ME_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
        cls: "text",
        forceFresh,
      });
      if (cancelledRef.current) return;
      const r = body.role && (TEAM_ROLES as readonly string[]).includes(body.role)
        ? (body.role as TeamRole)
        : null;
      setRole(r);
      setLabel(body.label ?? null);
      setSessionId(body.sessionId ?? null);
      setExpiresAt(typeof body.expiresAt === "number" ? body.expiresAt : null);
      setError(null);
    } catch (e) {
      if (cancelledRef.current) return;
      if (e instanceof CachedFetchError && e.status === 401) {
        // Anonymous: drop role state, no error surface.
        setRole(null);
        setLabel(null);
        setSessionId(null);
        setExpiresAt(null);
        setError(null);
      } else {
        setRole(null);
        setLabel(null);
        setSessionId(null);
        setExpiresAt(null);
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    // Initial mount MUST force-fresh: cachedFetch L2 has a 6h TTL on the
    // "text" class, so without forceFresh a tab opened after server-side
    // session revocation could see a stale `founder=true` flash before the
    // first 401 arrives. Privileged UI gates trust the result of this
    // call, so it must always reflect server truth on mount.
    void fetchMe(true);
    const id = window.setInterval(() => {
      void fetchMe();
    }, POLL_MS);
    return () => {
      cancelledRef.current = true;
      window.clearInterval(id);
    };
  }, [fetchMe]);

  const login = useCallback(
    async (passphrase: string) => {
      try {
        const res = await fetch(LOGIN_URL, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ passphrase }),
        });
        if (res.ok) {
          const body = (await res.json()) as { role?: string; label?: string };
          // Login changed server state — invalidate /me cache so the next
          // fetchMe goes to the wire and reflects the new role.
          invalidateCachedFetch(ME_URL, { method: "GET", cls: "text" });
          await fetchMe(true);
          const r = body.role && (TEAM_ROLES as readonly string[]).includes(body.role)
            ? (body.role as TeamRole)
            : undefined;
          return { ok: true, role: r, label: body.label };
        }
        if (res.status === 401) {
          return { ok: false, error: "Invalid code" };
        }
        if (res.status === 429) {
          return { ok: false, error: "Too many attempts. Wait a minute." };
        }
        return { ok: false, error: `HTTP ${res.status}` };
      } catch (e) {
        return {
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    },
    [fetchMe],
  );

  const logout = useCallback(async () => {
    try {
      await fetch(LOGOUT_URL, {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      /* ignore — clearing cookie locally still useful but cookie is httpOnly */
    }
    // Bust the /me cache before re-fetching, otherwise the cached
    // founder=true value from before logout would be returned and the UI
    // would briefly continue rendering privileged surface. Mirror what
    // login() does on the way in.
    invalidateCachedFetch(ME_URL, { method: "GET", cls: "text" });
    await fetchMe(true);
  }, [fetchMe]);

  const can = useCallback(
    (allowed: readonly TeamRole[]) => role !== null && allowed.includes(role),
    [role],
  );

  return {
    founder: role === "founder",
    role,
    label,
    sessionId,
    expiresAt,
    loading,
    error,
    refresh: fetchMe,
    login,
    logout,
    can,
  };
}
