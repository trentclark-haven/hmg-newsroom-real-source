/**
 * Founder-only team management panel.
 *
 * Three tabs: Invites | Sessions | Audit Log.
 * - Invites: list / create (returns plaintext passcode ONCE) / revoke
 * - Sessions: list active + revoked, force-revoke any active session
 * - Audit: paginated event stream (login, logout, denials, invite ops, etc)
 *
 * The component renders nothing for non-founder roles. Server endpoints
 * are themselves founder-gated, so a forged client-side render would still
 * 403 on every action.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFounderSession, TEAM_ROLES, TEAM_ROLE_LABELS, type TeamRole } from "@/lib/useFounderSession";

const BASE = `${import.meta.env.BASE_URL}api/founder`;

type Tab = "invites" | "sessions" | "audit";

interface InviteRow {
  id: string;
  label: string;
  role: string;
  createdAt: string;
  createdBy: string;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  lastUsedAt: string | null;
  usesCount: number;
  maxUses: number | null;
  status: "active" | "revoked" | "expired" | "exhausted";
}

interface SessionRow {
  id: string;
  inviteId: string | null;
  role: string;
  label: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
  lastSeenAt: string;
  lastSeenIp: string | null;
  issuedIp: string | null;
  status: "active" | "revoked" | "expired";
}

interface AuditRow {
  id: number;
  ts: string;
  actorRole: string;
  actorLabel: string;
  actorSessionId: string | null;
  action: string;
  target: string | null;
  meta: Record<string, unknown> | null;
  ip: string | null;
  ua: string | null;
  statusCode: number | null;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export default function TeamPanel() {
  const session = useFounderSession();
  const [tab, setTab] = useState<Tab>("invites");

  if (!session.founder) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Team management is restricted to the founder role.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-6 gap-4 overflow-hidden" data-testid="team-panel">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Team Access</h2>
          <p className="text-xs text-muted-foreground">
            Issue invites, monitor sessions, and audit every privileged action.
          </p>
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">
          You: {session.label} · {session.role}
        </div>
      </div>
      <div className="flex gap-1 border-b border-border/40 text-sm">
        {(["invites", "sessions", "audit"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            data-testid={`team-tab-${t}`}
            className={`px-3 py-2 rounded-t-md transition-colors ${
              tab === t
                ? "bg-foreground/10 text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "invites" ? "Invites" : t === "sessions" ? "Sessions" : "Audit Log"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        {tab === "invites" && <InvitesTab />}
        {tab === "sessions" && <SessionsTab />}
        {tab === "audit" && <AuditTab />}
      </div>
    </div>
  );
}

function InvitesTab() {
  const [rows, setRows] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newRole, setNewRole] = useState<TeamRole>("editor");
  const [newMaxUses, setNewMaxUses] = useState<string>("");
  const [newExpiresDays, setNewExpiresDays] = useState<string>("");
  const [created, setCreated] = useState<{ id: string; label: string; passcode: string } | null>(null);
  const passcodeRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const body = await api<{ invites: InviteRow[] }>("/invites");
      setRows(body.invites);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newLabel.trim()) return;
      setErr(null);
      try {
        const expiresAt = newExpiresDays
          ? new Date(Date.now() + parseInt(newExpiresDays, 10) * 86400_000).toISOString()
          : undefined;
        const maxUses = newMaxUses ? parseInt(newMaxUses, 10) : undefined;
        const body = await api<{
          ok: boolean;
          invite: { id: string; label: string; passcode: string };
        }>("/invites", {
          method: "POST",
          body: JSON.stringify({
            label: newLabel.trim(),
            role: newRole,
            ...(expiresAt ? { expiresAt } : {}),
            ...(maxUses ? { maxUses } : {}),
          }),
        });
        setCreated(body.invite);
        setNewLabel("");
        setNewMaxUses("");
        setNewExpiresDays("");
        await refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    },
    [newLabel, newRole, newMaxUses, newExpiresDays, refresh],
  );

  const handleRevoke = useCallback(
    async (id: string) => {
      if (!confirm("Revoke this invite? Any active sessions issued from it will be killed.")) return;
      try {
        await api(`/invites/${id}/revoke`, {
          method: "POST",
          body: JSON.stringify({ reason: "founder-ui" }),
        });
        await refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    },
    [refresh],
  );

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 rounded-lg border border-border/40 bg-card/40">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Label (e.g. Sarah)"
          className="md:col-span-2 h-9 px-3 rounded-md border border-border bg-background text-sm"
          data-testid="invite-label"
        />
        <select
          value={newRole}
          onChange={(e) => setNewRole(e.target.value as TeamRole)}
          className="h-9 px-2 rounded-md border border-border bg-background text-sm"
          data-testid="invite-role"
        >
          {TEAM_ROLES.filter((r) => r !== "founder").map((r) => (
            <option key={r} value={r}>
              {TEAM_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <input
          value={newMaxUses}
          onChange={(e) => setNewMaxUses(e.target.value.replace(/\D/g, ""))}
          placeholder="Max uses (∞)"
          className="h-9 px-3 rounded-md border border-border bg-background text-sm"
        />
        <input
          value={newExpiresDays}
          onChange={(e) => setNewExpiresDays(e.target.value.replace(/\D/g, ""))}
          placeholder="Expires (days, ∞)"
          className="h-9 px-3 rounded-md border border-border bg-background text-sm"
        />
        <button
          type="submit"
          className="md:col-span-5 h-9 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-50"
          disabled={!newLabel.trim()}
          data-testid="invite-create"
        >
          Create invite
        </button>
      </form>

      {created && (
        <div className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 space-y-2" data-testid="invite-created">
          <div className="text-xs uppercase tracking-wider text-amber-300">
            New passcode — copy now, it will not be shown again
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Label:</span> {created.label}
          </div>
          <div className="flex gap-2">
            <input
              ref={passcodeRef}
              readOnly
              value={created.passcode}
              className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-sm font-mono"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={() => {
                passcodeRef.current?.select();
                void navigator.clipboard?.writeText(created.passcode);
              }}
              className="h-9 px-3 rounded-md border border-border text-sm"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => setCreated(null)}
              className="h-9 px-3 rounded-md text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {err && <div className="text-xs text-red-400">{err}</div>}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No invites yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-2 py-1">Label</th>
                <th className="text-left px-2 py-1">Role</th>
                <th className="text-left px-2 py-1">Status</th>
                <th className="text-left px-2 py-1">Uses</th>
                <th className="text-left px-2 py-1">Expires</th>
                <th className="text-left px-2 py-1">Last used</th>
                <th className="text-right px-2 py-1">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/30" data-testid={`invite-row-${r.id}`}>
                  <td className="px-2 py-2">{r.label}</td>
                  <td className="px-2 py-2">{r.role}</td>
                  <td className="px-2 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        r.status === "active"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 tabular-nums">
                    {r.usesCount}
                    {r.maxUses ? ` / ${r.maxUses}` : ""}
                  </td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">
                    {r.expiresAt ? new Date(r.expiresAt).toLocaleString() : "never"}
                  </td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">
                    {r.lastUsedAt ? new Date(r.lastUsedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {r.status === "active" && (
                      <button
                        onClick={() => void handleRevoke(r.id)}
                        className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted"
                        data-testid={`invite-revoke-${r.id}`}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SessionsTab() {
  const session = useFounderSession();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const body = await api<{ sessions: SessionRow[] }>("/sessions");
      setRows(body.sessions);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleRevoke = useCallback(
    async (id: string) => {
      if (id === session.sessionId && !confirm("This is YOUR active session. Revoke it?")) return;
      try {
        await api(`/sessions/${id}/revoke`, {
          method: "POST",
          body: JSON.stringify({ reason: "founder-ui" }),
        });
        await refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    },
    [session.sessionId, refresh],
  );

  return (
    <div className="space-y-4">
      {err && <div className="text-xs text-red-400">{err}</div>}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No sessions.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-2 py-1">Label</th>
                <th className="text-left px-2 py-1">Role</th>
                <th className="text-left px-2 py-1">Status</th>
                <th className="text-left px-2 py-1">IP</th>
                <th className="text-left px-2 py-1">Last seen</th>
                <th className="text-left px-2 py-1">Expires</th>
                <th className="text-right px-2 py-1">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-border/30"
                  data-testid={`session-row-${r.id}`}
                >
                  <td className="px-2 py-2">
                    {r.label}
                    {r.id === session.sessionId && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </td>
                  <td className="px-2 py-2">{r.role}</td>
                  <td className="px-2 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        r.status === "active"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-muted-foreground tabular-nums">
                    {r.lastSeenIp ?? r.issuedIp ?? "—"}
                  </td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">
                    {new Date(r.lastSeenAt).toLocaleString()}
                  </td>
                  <td className="px-2 py-2 text-xs text-muted-foreground">
                    {new Date(r.expiresAt).toLocaleString()}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {r.status === "active" && (
                      <button
                        onClick={() => void handleRevoke(r.id)}
                        className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted"
                        data-testid={`session-revoke-${r.id}`}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AuditTab() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const body = await api<{ entries: AuditRow[] }>("/audit?limit=200");
      setRows(body.entries);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return rows;
    const f = filter.toLowerCase();
    return rows.filter(
      (r) =>
        r.action.toLowerCase().includes(f) ||
        r.actorRole.toLowerCase().includes(f) ||
        r.actorLabel.toLowerCase().includes(f) ||
        (r.target ?? "").toLowerCase().includes(f) ||
        (r.ip ?? "").toLowerCase().includes(f),
    );
  }, [rows, filter]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter (action, actor, target, ip)…"
          className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-sm"
        />
        <button
          onClick={() => void refresh()}
          className="h-9 px-3 rounded-md border border-border text-sm"
        >
          Refresh
        </button>
      </div>
      {err && <div className="text-xs text-red-400">{err}</div>}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-2 py-1">When</th>
                <th className="text-left px-2 py-1">Action</th>
                <th className="text-left px-2 py-1">Actor</th>
                <th className="text-left px-2 py-1">Target</th>
                <th className="text-left px-2 py-1">IP</th>
                <th className="text-left px-2 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((r) => (
                <tr key={r.id} className="border-t border-border/30">
                  <td className="px-2 py-1 text-xs text-muted-foreground tabular-nums">
                    {new Date(r.ts).toLocaleString()}
                  </td>
                  <td className="px-2 py-1 font-mono text-xs">{r.action}</td>
                  <td className="px-2 py-1 text-xs">
                    {r.actorRole}
                    <span className="text-muted-foreground"> · {r.actorLabel}</span>
                  </td>
                  <td className="px-2 py-1 text-xs text-muted-foreground">{r.target ?? "—"}</td>
                  <td className="px-2 py-1 text-xs text-muted-foreground tabular-nums">
                    {r.ip ?? "—"}
                  </td>
                  <td className="px-2 py-1 text-xs tabular-nums">{r.statusCode ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
