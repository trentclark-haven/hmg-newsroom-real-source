import { useCallback, useEffect, useState } from "react";
import { safeGetJSON, safeSetJSON } from "./safeStorage";

const STORAGE_KEY = "hmg-audit-log-v1";
const CHANGED_EVENT = "hmg-audit-log-changed";
const MAX_ENTRIES = 500;
const MAX_SUMMARY_LEN = 240;

export const AUDIT_ACTIONS = [
  "article-created",
  "article-edited",
  "image-generated",
  "clip-packaged",
  "wp-credentials-updated",
  "publish-attempt",
  "publish-success",
  "publish-failure",
  "sponsor-updated",
  "assignment-updated",
  "sales-updated",
  "approval-updated",
  "safe-mode-toggled",
  "safe-mode-blocked",
  "sample-data-cleared",
  "import-skipped-invalid-key",
  "schedule-generated",
  "schedule-cleared",
  "schedule-copied",
  "schedule-exported",
  "schedule-duplicated",
  "schedule-repeat-applied",
  "request-coalesced",
  "cache-warmup",
  "backpressure-state-change",
  "leak-watchdog-tick",
  "app-backgrounded",
  "app-resumed",
  "cache-warmup",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  "article-created": "Article created",
  "article-edited": "Article edited",
  "image-generated": "Image generated",
  "clip-packaged": "Clip packaged",
  "wp-credentials-updated": "WP credentials updated",
  "publish-attempt": "Publish attempt",
  "publish-success": "Publish success",
  "publish-failure": "Publish failure",
  "sponsor-updated": "Sponsor updated",
  "assignment-updated": "Assignment updated",
  "sales-updated": "Sales updated",
  "approval-updated": "Approval updated",
  "safe-mode-toggled": "Safe Mode toggled",
  "safe-mode-blocked": "Safe Mode blocked action",
  "sample-data-cleared": "Sample data cleared",
  "import-skipped-invalid-key": "Import skipped invalid key",
  "schedule-generated": "Schedule generated",
  "schedule-cleared": "Schedule cleared",
  "schedule-copied": "Schedule copied",
  "schedule-exported": "Schedule exported",
  "schedule-duplicated": "Schedule duplicated",
  "schedule-repeat-applied": "Schedule repeats applied",
  "request-coalesced": "Request coalesced",
  "cache-warmup": "Cache warmup",
  "backpressure-state-change": "Backpressure state change",
  "leak-watchdog-tick": "Leak watchdog tick",
  "app-backgrounded": "App backgrounded",
  "app-resumed": "App resumed",
};

export interface AuditEntry {
  id: string;
  ts: number;
  action: AuditAction;
  silo: string;
  summary: string;
  /** Operator initials at time of action, if a profile is set. Local-only. */
  operator?: string;
}

// Defense-in-depth: strip anything that looks like a secret before persisting,
// even though callers should already pass safe text. Patterns are intentionally
// conservative so they don't false-positive on normal article copy.
const SECRET_PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{8,}/g,
  /\bBearer\s+[A-Za-z0-9._\-+/=]{8,}/gi,
  /\bBasic\s+[A-Za-z0-9+/=]{8,}/gi,
  /\b(password|app[_-]?password|api[_-]?key|secret|token|auth|credentials?)\s*[:=]\s*\S{3,}/gi,
  // B2 additions — common high-entropy or vendor-prefixed credentials.
  /[\w.+-]+@[\w-]+\.[\w.-]+/g, // emails
  /\bAKIA[0-9A-Z]{16}\b/g, // AWS access key id
  /\basia[0-9A-Z]{16}\b/gi, // AWS temporary access key
  /\bsk_live_[A-Za-z0-9]{16,}\b/g, // Stripe live secret
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, // GitHub PAT family
  /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g, // Slack tokens
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, // JWT
];

function scrub(text: string): string {
  let out = text;
  for (const re of SECRET_PATTERNS) out = out.replace(re, "[redacted]");
  return out.slice(0, MAX_SUMMARY_LEN);
}

/**
 * Public scrubber for callers that need to sanitize a freeform string with the
 * same patterns as the audit log (without the length cap). Used by the backup
 * exporter to scrub raw string values as defense-in-depth.
 */
export function scrubSecretText(text: string): string {
  let out = text;
  for (const re of SECRET_PATTERNS) out = out.replace(re, "[redacted]");
  return out;
}

function isAuditEntry(x: unknown): x is AuditEntry {
  if (!x || typeof x !== "object") return false;
  const e = x as AuditEntry;
  return (
    typeof e.id === "string" &&
    typeof e.ts === "number" &&
    typeof e.action === "string" &&
    typeof e.silo === "string" &&
    typeof e.summary === "string"
  );
}

function isAuditEntryArray(x: unknown): x is AuditEntry[] {
  // Best-effort validator: must be an array; entries that fail per-item shape
  // are filtered out below so a single corrupt row does not nuke history.
  return Array.isArray(x);
}

function read(): AuditEntry[] {
  // safeStorage handles try/catch + corrupt-key quarantine + fallback. We
  // additionally drop per-row malformed entries so the cap stays meaningful.
  const raw = safeGetJSON<AuditEntry[]>(STORAGE_KEY, isAuditEntryArray, []);
  return raw.filter(isAuditEntry);
}

function write(entries: AuditEntry[]) {
  if (safeSetJSON(STORAGE_KEY, entries)) {
    try {
      window.dispatchEvent(new Event(CHANGED_EVENT));
    } catch {
      /* ignore */
    }
  }
}

function makeId() {
  return `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Module-level recorder so call sites do not need a hook. Always scrubs the
 * summary text. Caps history at MAX_ENTRIES (newest first).
 */
// Hard cap on summary length. The audit log is for short, structured
// human-readable breadcrumbs only — never a place to dump prompts,
// transcripts, raw API responses, or freeform user content.
const MAX_SUMMARY_CHARS = 160;

export function recordAudit(
  action: AuditAction,
  silo: string,
  summary: string,
) {
  if (typeof window === "undefined") return;
  // Best-effort operator attribution. Imported lazily via require-style dynamic
  // to avoid a hard cycle with operatorProfile (which itself uses safeStorage,
  // not auditLog). If the lookup fails we just record without operator.
  let operator: string | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./operatorProfile") as typeof import("./operatorProfile");
    const initials = mod.getOperatorInitials();
    if (initials) operator = initials;
  } catch {
    /* ignore */
  }
  const entry: AuditEntry = {
    id: makeId(),
    ts: Date.now(),
    action,
    silo: silo.slice(0, 32),
    summary: scrub(summary).slice(0, MAX_SUMMARY_CHARS),
    ...(operator ? { operator } : {}),
  };
  const next = [entry, ...read()].slice(0, MAX_ENTRIES);
  write(next);
}

export function useAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>(() => read());

  useEffect(() => {
    const handler = () => setEntries(read());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const clear = useCallback(() => {
    write([]);
  }, []);

  return { entries, clear };
}
