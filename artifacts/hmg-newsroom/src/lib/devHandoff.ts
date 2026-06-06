import { MENU_ITEMS } from "@/components/newsroom/MenuOverlay";
import { AUDIT_ACTION_LABELS, type AuditEntry } from "./auditLog";

export const APP_VERSION = "v1.3";

const KNOWN_LIMITATIONS = [
  "Local-only persistence: every record (drafts, sponsors, sales, assignments, approvals, audit log, role preset, safe mode) lives in window.localStorage. There is no cross-device sync.",
  "Authentication: there is no real user auth. Role presets are local UI hints only.",
  "Approval workflow: gating is a UI-only check on the publish action. A determined user with browser devtools can bypass it.",
  "Sponsor metrics: impression / click counters are stored on the sponsor record but no external collector writes to them.",
  "Audit log: capped at 500 entries with summary text hard-truncated to 160 characters; older entries roll off.",
  "Backup reminder fires every 7 days based on the local clock. If the device clock is wrong it can show the wrong cadence.",
  "Sample data: demos write directly to the same storage keys as real data and are tagged with __demo so the Clear button only removes demos.",
  "Safe Mode: disables AI calls, publishing, and media uploads in the UI. Direct API calls to /api/openai or /api/wordpress/publish are not blocked at the server.",
];

const STORAGE_KEYS = [
  // v1 baseline
  ["hmg-newsroom-wp-settings-v2", "Per-silo WP creds (browser-only)"],
  ["hmg-newsroom-output-history-v2", "Recent generation outputs (last 50)"],
  ["hmg-newsroom-draft::*", "Per-view autosave drafts (no blobs)"],
  ["hmg-media-library-v1", "Media metadata index (capped 200)"],
  ["hmg-commandcenter-checklist-v1", "Per-silo ops checklist toggles"],
  ["hmg-founder-voice-v1", "Per-silo Founder Voice toggles"],
  ["hmg-newsroom-usage-v1", "Local usage stats events"],
  ["hmg-newsroom-prompt-history-v1", "Prompt history"],
  // v1.2 revenue + delegation
  ["hmg-sponsors-v1", "Sponsor inventory records"],
  ["hmg-sales-v1", "Sales pipeline records (6 stages)"],
  ["hmg-assignments-v1", "Team assignment records (6 statuses)"],
  ["hmg-approvals-v1", "Per-article approval state (5 states)"],
  ["hmg-audit-log-v1", "Audit breadcrumbs (capped 500, scrubbed)"],
  // v1.3 founder-proofing
  ["hmg-safe-mode-v1", "Safe Mode toggle"],
  ["hmg-role-preset-v1", "Role preset (founder/editor/writer/sales/video/developer)"],
  ["hmg-last-backup-v1", "Timestamp of last backup export"],
] as const;

interface Deps {
  /** Pulled from `useAuditLog().entries` — newest first. */
  auditEntries?: AuditEntry[];
}

function listSafeRecentErrors(entries: AuditEntry[]): string[] {
  return entries
    .filter(
      (e) =>
        e.action === "publish-failure" || e.action === "safe-mode-blocked",
    )
    .slice(0, 20)
    .map(
      (e) =>
        `- ${new Date(e.ts).toISOString()} · ${AUDIT_ACTION_LABELS[e.action] ?? e.action} · ${e.silo} · ${e.summary}`,
    );
}

/**
 * Build a markdown handoff summary that can be safely pasted into Slack /
 * email / a ticket. Excludes anything secret-shaped because it pulls only:
 *   - hardcoded constants from this file
 *   - the View ids defined in MenuOverlay
 *   - audit log SUMMARY text (already scrubbed + truncated when written)
 *
 * Crucially this function never reaches into localStorage for raw values.
 */
export function buildHandoff(deps: Deps = {}): string {
  const auditEntries = deps.auditEntries ?? [];
  const recentErrors = listSafeRecentErrors(auditEntries);

  const routeLines = MENU_ITEMS.map(
    (m) => `- \`${m.id}\` — ${m.label}: ${m.description}`,
  );
  const storageLines = STORAGE_KEYS.map(
    ([k, desc]) => `- \`${k}\` — ${desc}`,
  );
  const limitationLines = KNOWN_LIMITATIONS.map((l) => `- ${l}`);

  const lines: string[] = [];
  lines.push(`# HMG Newsroom — Developer Handoff`);
  lines.push(``);
  lines.push(`**App version:** ${APP_VERSION}`);
  lines.push(`**Created:** ${new Date().toISOString()}`);
  lines.push(``);
  lines.push(
    `> No secrets, credentials, drafts, or created content are included below. Storage **keys** are listed; values are not.`,
  );
  lines.push(``);

  lines.push(`## Routes / Views`);
  lines.push(``);
  lines.push(...routeLines);
  lines.push(``);

  lines.push(`## Local storage keys`);
  lines.push(``);
  lines.push(...storageLines);
  lines.push(``);

  lines.push(`## Recent safe errors (audit log)`);
  lines.push(``);
  if (recentErrors.length === 0) {
    lines.push(`_No recent publish failures or Safe Mode blocks recorded._`);
  } else {
    lines.push(...recentErrors);
  }
  lines.push(``);

  lines.push(`## Known limitations`);
  lines.push(``);
  lines.push(...limitationLines);
  lines.push(``);

  return lines.join("\n");
}
