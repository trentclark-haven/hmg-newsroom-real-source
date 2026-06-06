import React, { useEffect, useMemo, useRef, useState } from "react";
import { verticals } from "@/lib/mock-data";
import {
  useGetWordpressStatus,
  type Silo as ApiSilo,
} from "@workspace/api-client-react";
import { useWPSettings } from "@/lib/useWPSettings";
import {
  aggregateBySilo,
  startOfDay,
  startOfWeek,
  useUsageStats,
} from "@/lib/useUsageStats";
import { useFounderVoiceMap } from "@/lib/useFounderVoice";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  Brush,
  CheckCircle2,
  Circle,
  ClipboardCopy,
  Cloud,
  Code2,
  Download,
  HardDrive,
  ImageUp,
  Layers,
  LayoutDashboard,
  ListTodo,
  Megaphone,
  Newspaper,
  PackageCheck,
  RefreshCw,
  Rocket,
  Sparkles,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SponsorInventoryView } from "./SponsorInventoryView";
import { WeeklyReportCard } from "./WeeklyReportCard";
import {
  markBackupNow,
  useBackupReminder,
} from "@/lib/backupReminder";
import {
  clearDemoData,
  loadDemoAssignment,
  loadDemoSalesLead,
  loadDemoSponsor,
} from "@/lib/sampleData";
import { buildHandoff } from "@/lib/devHandoff";
import { recordAudit, scrubSecretText, useAuditLog } from "@/lib/auditLog";
import { useSponsors, isExpired } from "@/lib/sponsors";
import { useMediaLibrary } from "@/lib/useMediaLibrary";
import { useOutputHistory } from "@/lib/useOutputHistory";
import {
  PublishingStatus,
  type PublishingChannelStatus,
} from "@/components/hmg/PublishingStatus";
import { useZeroPaidSettings } from "@/lib/hmg/haven-ai/zeroPaidSettings";
import {
  getCorpusHealth,
  type CorpusHealthResult,
} from "@/lib/hmg/haven-ai/corpus/adminClient";
import { computeReadiness, type ReadinessResult } from "@/lib/readinessScore";
import {
  OPERATOR_ROLES,
  type OperatorRole,
  useOperatorProfile,
} from "@/lib/operatorProfile";
import { useJobLedger, recordRetry } from "@/lib/jobLedger";
import {
  useRecoverySnapshots,
  SNAPSHOT_REASONS,
  type SnapshotReason,
} from "@/lib/recoverySnapshots";
import { useNetworkStatus } from "@/lib/networkStatus";
import { snapshotQueue } from "@/lib/requestQueue";
import { snapshotBreakers } from "@/lib/circuitBreaker";
import { estimateUsage, SAFE_STORAGE_QUOTA_EVENT } from "@/lib/safeStorage";
import { WifiOff, User as UserIcon, Activity as ActivityIcon, Camera } from "lucide-react";
import { PerformanceHealthCard } from "./PerformanceHealthCard";
import { FailureDrillPanel } from "./FailureDrillPanel";
import { WerewolfScoreCard } from "./WerewolfScoreCard";
import type { View } from "./MenuOverlay";
import { MissionControlCockpit } from "./MissionControlCockpit";
import { IntelligencePreviewPanel } from "@/components/hmg/IntelligencePreviewPanel";

function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mt-4 mb-2 first:mt-0">
      <h3 className="text-[12px] font-black uppercase tracking-wider text-sky-400">
        {title}
      </h3>
      <p className="text-[10px] text-muted-foreground leading-snug">{hint}</p>
    </div>
  );
}

function AskMaxStrip({ onOpen }: { onOpen?: () => void }) {
  return (
    <section className="hmg-paper-panel mt-4 p-4" data-testid="ask-max-strip">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Ask Max
            </p>
            <h3 className="text-xl font-black leading-tight text-foreground">
              Revenue, relationships, opportunities, and founder moves.
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Max is the CRO / Founder OS layer. He does not handle graphics,
              collage, image prompts, or WebArt direction.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="hmg-primary-action bg-emerald-600 text-white"
        >
          Open Max
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function ArtbotEditorialStrip({ onOpen }: { onOpen?: () => void }) {
  return (
    <section className="hmg-paper-panel mt-3 p-4" data-testid="artbot-editorial-strip">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sky-600 text-white">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">
              ARTBOT Editorial Assistant
            </p>
            <h3 className="text-lg font-black leading-tight text-foreground">
              Article ideas, caption help, draft review, and content structure.
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              ARTBOT is content help. WebArt is the visual builder. Max is the
              revenue operator.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="hmg-secondary-action"
        >
          Open Editorial Desk
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function FounderKBStrip({ onOpen }: { onOpen?: () => void }) {
  const [itemCount, setItemCount] = React.useState(0);
  const [maxCount, setMaxCount] = React.useState(0);
  const [artbotCount, setArtbotCount] = React.useState(0);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);
  const [hasFounderVoice, setHasFounderVoice] = React.useState(false);
  const [hasBrandRules, setHasBrandRules] = React.useState(false);
  const [hasWPRules, setHasWPRules] = React.useState(false);
  const [hasMaxNotes, setHasMaxNotes] = React.useState(false);
  const [hasRelationships, setHasRelationships] = React.useState(false);

  React.useEffect(() => {
    function refresh() {
      try {
        const raw = window.localStorage.getItem("hmg-founder-knowledge-base-v1");
        if (!raw) {
          setItemCount(0);
          setMaxCount(0);
          setArtbotCount(0);
          setLastUpdated(null);
          setHasFounderVoice(false);
          setHasBrandRules(false);
          setHasWPRules(false);
          setHasMaxNotes(false);
          setHasRelationships(false);
          return;
        }
        const parsed = JSON.parse(raw);
        const items: { type: string }[] = Array.isArray(parsed?.items) ? parsed.items : [];
        setItemCount(items.length);
        setMaxCount(items.filter((i) => ["resume-bio","pitch-deck","sales-note","relationship-note","contact-csv","revenue-max-note"].includes(i.type)).length);
        setArtbotCount(items.filter((i) => ["founder-voice","old-article","brand-rule","editorial-rule","social-example","artbot-content-note","wordpress-rule"].includes(i.type)).length);
        setHasFounderVoice(items.some((i) => i.type === "founder-voice"));
        setHasBrandRules(items.some((i) => i.type === "brand-rule"));
        setHasWPRules(items.some((i) => i.type === "wordpress-rule"));
        setHasMaxNotes(items.some((i) => ["revenue-max-note","sales-note"].includes(i.type)));
        setHasRelationships(items.some((i) => ["relationship-note","contact-csv"].includes(i.type)));
        if (parsed?.lastUpdated) {
          setLastUpdated(new Date(parsed.lastUpdated as number).toLocaleDateString(undefined, { month: "short", day: "numeric" }));
        }
      } catch {
        /* ignore */
      }
    }
    refresh();
  }, []);

  return (
    <section className="hmg-paper-panel mt-3 p-4" data-testid="founder-kb-strip">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white" style={{ background: "#6366F1" }}>
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: "#6366F1" }}>
                Founder Knowledge Base
              </p>
              <h3 className="text-lg font-black leading-tight text-foreground">
                {itemCount === 0
                  ? "No HMG DNA loaded yet"
                  : `${itemCount} memory item${itemCount === 1 ? "" : "s"} loaded`}
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {itemCount === 0
                  ? "Load Founder Voice, brand rules, Max notes, WordPress rules, and relationship data to power the whole suite."
                  : `Max has ${maxCount} revenue/founder note${maxCount === 1 ? "" : "s"}. ARTBOT has ${artbotCount} editorial/voice note${artbotCount === 1 ? "" : "s"}.${lastUpdated ? ` Last updated ${lastUpdated}.` : ""}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="hmg-secondary-action"
            style={{ borderColor: "#6366F133", color: "#6366F1" }}
          >
            Open Founder Knowledge Base
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {itemCount > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/30">
            {[
              { label: "Founder Voice", ok: hasFounderVoice },
              { label: "Brand Rules", ok: hasBrandRules },
              { label: "WordPress Rules", ok: hasWPRules },
              { label: "Max Notes", ok: hasMaxNotes },
              { label: "Relationships", ok: hasRelationships },
            ].map(({ label, ok }) => (
              <span
                key={label}
                className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                  ok
                    ? "border-indigo-400/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                    : "border-border/40 bg-secondary/40 text-muted-foreground"
                }`}
              >
                {ok ? "✓ " : "○ "}{label}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const CHECKLIST_STORAGE_KEY = "hmg-commandcenter-checklist-v1";

const CHECKLIST_ITEMS: { id: string; label: string }[] = [
  { id: "site-health", label: "Site health: uptime + WP version current" },
  { id: "cache-lazy", label: "Caching + image lazy-load enabled" },
  { id: "ads", label: "AdSense + ads.txt validated" },
  { id: "sitemap", label: "Sitemap submitted + Yoast SEO green" },
  { id: "plugins", label: "Plugins/themes patched (no critical updates)" },
  { id: "publish", label: "Editorial calendar + publish queue ready" },
];

type ChecklistMap = Record<string, Record<string, boolean>>;

function readChecklist(): ChecklistMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as ChecklistMap)
      : {};
  } catch {
    return {};
  }
}

function writeChecklist(map: ChecklistMap) {
  try {
    window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

interface SystemStatus {
  ok: boolean;
  ts: number;
  version: string;
  api: { ok: boolean };
  aiProxy: { ok: boolean; message?: string };
  wordpress: { silos: Record<string, { envConfigured: boolean }> };
  publicApp: { configured: boolean };
}

// Field names anywhere in an exported value that must always be dropped, even
// if a key in the allowlist accidentally contained one. Belt-and-braces only —
// the allowlist excludes credential-bearing keys outright.
const SECRET_PASSWORD_FIELDS = new Set([
  "password",
  "appPassword",
  "app_password",
  "applicationPassword",
  "apiKey",
  "api_key",
  "secret",
  "token",
  "auth",
  "authorization",
  "credentials",
  "bearer",
]);

// B1: explicit allowlist of localStorage keys eligible for export.
// Anything not matching this regex is excluded — including
// `hmg-newsroom-wp-settings-*` (WordPress credentials) and any future or
// legacy plaintext settings key. Add new keys here intentionally.
const EXPORTABLE_KEY_PATTERN =
  /^hmg-(?:approvals|artbot-draft|artbot-frame-library|artbot-overlay-bank|assignments|audit-log|clipbrand-draft|commandcenter-checklist|cutmaster-draft|founder-voice|last-backup|media-library|newsroom-draft|newsroom-output-history|newsroom-prompt-history|newsroom-usage|role-preset|safe-mode|sales|socialfactory-draft|sponsors|station-schedule|trent-override|zero-paid-router)-v\d+$/;

// Hard denylist — used as a runtime assertion. Any key matching this must
// never appear in an export payload, regardless of allowlist drift.
const FORBIDDEN_KEY_PATTERNS: RegExp[] = [
  /^hmg-newsroom-wp-settings-/i,
  /wp-settings/i,
  /password/i,
  /credential/i,
  /-token-/i,
];

function isExportableKey(key: string): boolean {
  if (!EXPORTABLE_KEY_PATTERN.test(key)) return false;
  for (const re of FORBIDDEN_KEY_PATTERNS) {
    if (re.test(key)) return false;
  }
  return true;
}

function isForbiddenKey(key: string): boolean {
  for (const re of FORBIDDEN_KEY_PATTERNS) {
    if (re.test(key)) return true;
  }
  return false;
}

function stripSecrets<T>(value: T): T {
  if (typeof value === "string") {
    return scrubSecretText(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => stripSecrets(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_PASSWORD_FIELDS.has(k)) continue;
      out[k] = stripSecrets(v);
    }
    return out as T;
  }
  return value;
}

function collectExportableEntries(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (typeof window === "undefined") return out;
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (!isExportableKey(key)) continue;
    const raw = window.localStorage.getItem(key);
    if (raw === null) continue;
    try {
      out[key] = stripSecrets(JSON.parse(raw));
    } catch {
      // Raw string value — still scrub it before exporting.
      out[key] = scrubSecretText(raw);
    }
  }
  return out;
}

function assertNoForbiddenKeys(entries: Record<string, unknown>): void {
  for (const k of Object.keys(entries)) {
    if (isForbiddenKey(k)) {
      throw new Error(
        `Refusing to export forbidden key "${k}" — credential-bearing key leaked into payload.`,
      );
    }
  }
}

function SystemHealthCard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/system/status`);
      const json = (await res.json()) as SystemStatus;
      if (!res.ok) {
        setError(`HTTP ${res.status}`);
        setStatus(null);
      } else {
        setStatus(json);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "fetch failed");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pills: Array<{ key: string; label: string; ok: boolean; hint?: string }> = [];
  if (status) {
    pills.push({ key: "api", label: "API", ok: status.api.ok });
    pills.push({
      key: "ai",
      label: "AI proxy",
      ok: status.aiProxy.ok,
      hint: status.aiProxy.message,
    });
    pills.push({
      key: "publicapp",
      label: "Public App",
      ok: status.publicApp.configured,
      hint: status.publicApp.configured
        ? "env vars set"
        : "PUBLIC_APP_API_URL/KEY not set",
    });
  }

  return (
    <div
      data-testid="commandcenter-system-status"
      className="rounded-xl border border-border/60 bg-secondary/30 p-3 mb-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
            System Health
          </span>
          {status && (
            <span className="text-[10px] text-muted-foreground ml-1">
              v{status.version}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          aria-label="Refresh system status"
          className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-foreground/5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-red-300">Status check failed: {error}</p>
      )}

      {!error && (
        <div className="flex flex-wrap items-center gap-1.5">
          {pills.map((p) => (
            <span
              key={p.key}
              data-testid={`commandcenter-system-pill-${p.key}`}
              title={p.hint}
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                p.ok
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                  : "bg-amber-500/15 text-amber-300 border-amber-500/40"
              }`}
            >
              {p.ok ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {p.label}: {p.ok ? "ok" : "down"}
            </span>
          ))}
          {!status && !error && (
            <span className="text-[10px] text-muted-foreground">checking…</span>
          )}
          {status && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {new Date(status.ts).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ExportImportCard() {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    try {
      const data = collectExportableEntries();
      // B1 runtime assertion — last-line guard against allowlist drift.
      assertNoForbiddenKeys(data);
      const payload = {
        kind: "hmg-newsroom-backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        entries: data,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hmg-newsroom-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      markBackupNow();
      const n = Object.keys(data).length;
      toast.success(
        `Backup downloaded — ${n} key${n === 1 ? "" : "s"}, secrets excluded.`,
      );
    } catch (err) {
      const msg =
        err instanceof Error && err.message.startsWith("Refusing to export")
          ? "Export aborted — internal safety check failed."
          : "Export failed";
      toast.error(msg);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        toast.error("Import failed — file is not valid JSON.");
        return;
      }
      if (
        !parsed ||
        typeof parsed !== "object" ||
        (parsed as { kind?: unknown }).kind !== "hmg-newsroom-backup" ||
        !(parsed as { entries?: unknown }).entries ||
        typeof (parsed as { entries?: unknown }).entries !== "object" ||
        Array.isArray((parsed as { entries?: unknown }).entries)
      ) {
        toast.error("Not a valid HMG Newsroom backup file.");
        return;
      }
      const entries = (parsed as { entries: Record<string, unknown> }).entries;
      const total = Object.keys(entries).length;
      const ok = window.confirm(
        `Importing this backup will OVERWRITE up to ${total} keys in this browser. Invalid or unrecognized entries will be skipped. Continue?`,
      );
      if (!ok) return;

      let imported = 0;
      let skipped = 0;
      const skippedKeys: string[] = [];

      for (const [rawKey, rawValue] of Object.entries(entries)) {
        // B3: per-entry validation. One bad key must not break the import.
        try {
          if (typeof rawKey !== "string" || rawKey.length === 0) {
            skipped += 1;
            recordAudit(
              "import-skipped-invalid-key",
              "system",
              "Skipped non-string or empty key during backup import.",
            );
            continue;
          }
          if (!isExportableKey(rawKey)) {
            skipped += 1;
            if (skippedKeys.length < 10) skippedKeys.push(rawKey);
            recordAudit(
              "import-skipped-invalid-key",
              "system",
              `Skipped key not in allowlist: ${rawKey.slice(0, 64)}`,
            );
            continue;
          }
          // Accept any JSON-serializable value the export could emit:
          // string | number | boolean | null | object | array.
          const t = typeof rawValue;
          if (
            rawValue !== null &&
            t !== "string" &&
            t !== "number" &&
            t !== "boolean" &&
            t !== "object"
          ) {
            skipped += 1;
            if (skippedKeys.length < 10) skippedKeys.push(rawKey);
            recordAudit(
              "import-skipped-invalid-key",
              "system",
              `Skipped key with invalid value type: ${rawKey.slice(0, 64)}`,
            );
            continue;
          }
          if (typeof rawValue === "number" && !Number.isFinite(rawValue)) {
            skipped += 1;
            if (skippedKeys.length < 10) skippedKeys.push(rawKey);
            recordAudit(
              "import-skipped-invalid-key",
              "system",
              `Skipped key with non-finite numeric value: ${rawKey.slice(0, 64)}`,
            );
            continue;
          }
          let serialized: string;
          if (typeof rawValue === "string") {
            serialized = rawValue;
          } else {
            try {
              serialized = JSON.stringify(rawValue);
            } catch {
              skipped += 1;
              if (skippedKeys.length < 10) skippedKeys.push(rawKey);
              recordAudit(
                "import-skipped-invalid-key",
                "system",
                `Skipped key with non-serializable value: ${rawKey.slice(0, 64)}`,
              );
              continue;
            }
            if (serialized === undefined) {
              skipped += 1;
              if (skippedKeys.length < 10) skippedKeys.push(rawKey);
              recordAudit(
                "import-skipped-invalid-key",
                "system",
                `Skipped key with undefined-serialization value: ${rawKey.slice(0, 64)}`,
              );
              continue;
            }
          }
          window.localStorage.setItem(rawKey, serialized);
          imported += 1;
        } catch {
          skipped += 1;
          if (skippedKeys.length < 10) skippedKeys.push(String(rawKey));
          recordAudit(
            "import-skipped-invalid-key",
            "system",
            `Skipped key due to write error: ${String(rawKey).slice(0, 64)}`,
          );
        }
      }

      if (skipped > 0) {
        toast.success(
          `Imported ${imported} of ${total} keys (${skipped} skipped). Reload to see all changes.`,
        );
      } else {
        toast.success(
          `Imported ${imported} key${imported === 1 ? "" : "s"}. Reload to see all changes.`,
        );
      }
    } catch {
      toast.error("Import failed — unexpected error.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 mb-3">
      <div className="flex items-center gap-1.5 mb-2">
        <HardDrive className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
          Backup
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2 leading-snug">
        Export drafts, history, checklists, and settings as JSON. WordPress
        passwords and API tokens are stripped before download.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleExport}
          data-testid="commandcenter-export-btn"
          className="h-9 text-[11px]"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Export backup
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
          aria-label="Import backup file"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          data-testid="commandcenter-import-btn"
          className="h-9 text-[11px]"
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          Import backup
        </Button>
      </div>
    </div>
  );
}

function BackupReminderBanner() {
  const { daysSince, dueSoon, overdue } = useBackupReminder();
  if (!overdue && !dueSoon) return null;
  const tone = overdue
    ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-200"
    : "bg-sky-500/10 border-sky-500/40 text-sky-700 dark:text-sky-200";
  const label =
    daysSince == null
      ? "No backup yet — export one to start the 7-day cycle."
      : overdue
        ? `Last backup was ${daysSince} day${daysSince === 1 ? "" : "s"} ago. Export a backup to stay safe.`
        : `Backup due in ${7 - (daysSince ?? 0)} day(s).`;
  return (
    <div
      data-testid="commandcenter-backup-reminder"
      className={`rounded-xl border ${tone} p-3 mb-3 flex items-start gap-2`}
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 text-[12px] leading-snug">{label}</div>
    </div>
  );
}

function SampleDataCard() {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 mb-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
          Sample data
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2 leading-snug">
        Load tagged demo records to explore the system without dirtying your
        real data. Demos are flagged so the Clear button only removes them.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            loadDemoSponsor();
            toast.success("Demo sponsor loaded");
          }}
          data-testid="commandcenter-sample-sponsor"
          className="h-9 text-[11px]"
        >
          + Demo sponsor
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            loadDemoSalesLead();
            toast.success("Demo lead loaded");
          }}
          data-testid="commandcenter-sample-lead"
          className="h-9 text-[11px]"
        >
          + Demo lead
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            loadDemoAssignment();
            toast.success("Demo assignment loaded");
          }}
          data-testid="commandcenter-sample-assignment"
          className="h-9 text-[11px]"
        >
          + Demo assignment
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            const removed = clearDemoData();
            const total =
              removed.sponsors + removed.sales + removed.assignments;
            toast.message(
              total === 0
                ? "No demo records to clear"
                : `Cleared ${total} demo row${total === 1 ? "" : "s"}`,
            );
          }}
          data-testid="commandcenter-sample-clear"
          className="h-9 text-[11px]"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Clear demos
        </Button>
      </div>
    </div>
  );
}

function DevHandoffCard() {
  const { entries } = useAuditLog();
  async function handleCopy() {
    const md = buildHandoff({ auditEntries: entries });
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(md);
        toast.success("Developer handoff copied to clipboard");
        return;
      }
    } catch {
      /* fall through to download */
    }
    // Fallback: download as a .md file so the founder still has a way out.
    try {
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hmg-developer-handoff-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Developer handoff downloaded");
    } catch {
      toast.error("Could not copy or download handoff");
    }
  }
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 mb-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Code2 className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
          Developer handoff
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2 leading-snug">
        Creates a clean markdown summary — app version, routes, storage keys,
        recent safe errors, known limitations. No secrets, drafts, or content.
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleCopy}
        data-testid="commandcenter-dev-handoff-btn"
        className="h-9 text-[11px]"
      >
        <ClipboardCopy className="w-3.5 h-3.5 mr-1.5" />
        Copy developer handoff
      </Button>
    </div>
  );
}

function NetworkStatusBanner() {
  const status = useNetworkStatus();
  if (status === "online") return null;
  return (
    <div
      className="rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-300 px-3 py-2 mb-3 text-[11px] flex items-center gap-2"
      data-testid="commandcenter-network-banner"
    >
      <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
      <span>You appear offline. Drafts and queued jobs are preserved locally.</span>
    </div>
  );
}

function StorageQuotaBanner() {
  const [report, setReport] = useState(() => estimateUsage());
  useEffect(() => {
    const refresh = () => setReport(estimateUsage());
    const id = window.setInterval(refresh, 15_000);
    window.addEventListener(SAFE_STORAGE_QUOTA_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(SAFE_STORAGE_QUOTA_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  if (report.status === "ok") return null;
  const tone =
    report.status === "warning"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
      : "border-rose-500/50 bg-rose-500/10 text-rose-300";
  const pct = Math.round(report.pct * 100);
  return (
    <div
      className={`rounded-md border px-3 py-2 mb-3 text-[11px] flex items-center gap-2 ${tone}`}
      data-testid="commandcenter-storage-banner"
    >
      <HardDrive className="w-3.5 h-3.5 flex-shrink-0" />
      <span>
        Local storage is at ~{pct}% of safe capacity. Export a backup and clear
        old demo data to free space.
      </span>
    </div>
  );
}

function OperatorProfileCard() {
  const { profile, setProfile, clear } = useOperatorProfile();
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState<OperatorRole>(profile.role);
  useEffect(() => {
    setName(profile.name);
    setRole(profile.role);
  }, [profile.name, profile.role]);
  function handleSave() {
    setProfile({ name, role });
    toast.success("Operator profile saved");
  }
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 mb-3" data-testid="commandcenter-operator-card">
      <div className="flex items-center gap-1.5 mb-2">
        <UserIcon className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
          Operator
        </span>
        {profile.initials ? (
          <span className="ml-auto text-[10px] font-bold rounded bg-sky-500/20 text-sky-300 px-1.5 py-0.5">
            {profile.initials}
          </span>
        ) : null}
      </div>
      <p className="text-[11px] text-muted-foreground mb-2 leading-snug">
        Names and initials are local-only. Used for audit attribution and job
        attribution. Never sent to the server.
      </p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 48))}
          placeholder="Your name"
          className="bg-secondary/40 border border-border rounded-md px-2 py-1.5 text-[12px]"
          data-testid="commandcenter-operator-name"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as OperatorRole)}
          className="bg-secondary/40 border border-border rounded-md px-2 py-1.5 text-[12px]"
          data-testid="commandcenter-operator-role"
        >
          {OPERATOR_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleSave}
          className="h-8 text-[11px]"
          data-testid="commandcenter-operator-save"
        >
          Save profile
        </Button>
        {profile.name ? (
          <button
            type="button"
            onClick={() => {
              clear();
              setName("");
              setRole("founder");
              toast.success("Operator profile cleared");
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground underline"
            data-testid="commandcenter-operator-clear"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

function JobLedgerCard() {
  const { entries, clear, stats } = useJobLedger();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 5_000);
    return () => window.clearInterval(id);
  }, []);
  const queue = useMemo(() => snapshotQueue(), [tick, entries]);
  const breakers = useMemo(() => snapshotBreakers(), [tick, entries]);
  const recent = entries.slice(0, 8);
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 mb-3" data-testid="commandcenter-job-ledger-card">
      <div className="flex items-center gap-1.5 mb-2">
        <ActivityIcon className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
          Job ledger
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {stats.running} running · {stats.failures24h} failed (24h) · {stats.total} total
        </span>
      </div>
      {Object.entries(breakers).filter(([, v]) => v.state !== "closed").length > 0 ? (
        <div className="mb-2 text-[10px] text-amber-300">
          Cooling down:{" "}
          {Object.entries(breakers)
            .filter(([, v]) => v.state !== "closed")
            .map(([k, v]) => `${k} (${v.state})`)
            .join(", ")}
        </div>
      ) : null}
      {Object.keys(queue.active).length > 0 ? (
        <div className="mb-2 text-[10px] text-muted-foreground">
          Active lanes:{" "}
          {Object.entries(queue.active)
            .map(([k, n]) => `${k}×${n}`)
            .join(", ")}
        </div>
      ) : null}
      {recent.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No jobs recorded yet.</p>
      ) : (
        <ul className="space-y-1 mb-2">
          {recent.map((j) => {
            const ageMin = Math.max(0, Math.round((Date.now() - j.createdAt) / 60_000));
            const tone =
              j.status === "failure"
                ? "text-rose-300"
                : j.status === "success"
                  ? "text-emerald-300"
                  : j.status === "running"
                    ? "text-sky-300"
                    : "text-muted-foreground";
            return (
              <li
                key={j.id}
                className="flex items-center gap-2 text-[10.5px] leading-tight"
                data-testid="commandcenter-job-row"
              >
                <span className={`font-bold uppercase tracking-wider ${tone}`}>
                  {j.status}
                </span>
                <span className="text-muted-foreground">{j.kind}</span>
                <span className="truncate flex-1">{j.summary || j.silo}</span>
                {j.errorCode ? (
                  <span className="text-rose-300 font-mono">{j.errorCode}</span>
                ) : null}
                {j.status === "failure" ? (
                  <button
                    type="button"
                    onClick={() => {
                      recordRetry(j.id);
                      toast.message("Marked for retry — re-run from the source view.");
                    }}
                    className="text-[10px] text-sky-300 underline"
                    data-testid="commandcenter-job-retry"
                  >
                    Retry
                  </button>
                ) : null}
                <span className="text-muted-foreground/60 tabular-nums">
                  {ageMin}m
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            if (window.confirm("Clear all job ledger entries? Audit log is unaffected.")) {
              clear();
              toast.success("Job ledger cleared");
            }
          }}
          className="h-8 text-[11px]"
          data-testid="commandcenter-job-clear"
        >
          Clear ledger
        </Button>
      </div>
    </div>
  );
}

function SnapshotsCard() {
  const { entries, clear } = useRecoverySnapshots();
  const reasonLabel: Record<SnapshotReason, string> = {
    publish: "Publish",
    "import-backup": "Import",
    "clear-local": "Clear",
    "overwrite-draft": "Overwrite",
    "trent-override-applied": "Override",
    "media-upload": "Media",
    "large-job-start": "Large job",
  };
  // Reference SNAPSHOT_REASONS to keep the import alive even if the labels
  // map happens to be exhaustive in a future refactor.
  void SNAPSHOT_REASONS;
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 mb-3" data-testid="commandcenter-snapshots-card">
      <div className="flex items-center gap-1.5 mb-2">
        <Camera className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
          Recovery snapshots
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          last {entries.length}/10
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2 leading-snug">
        Lightweight metadata captured before publishing, large uploads, and
        destructive actions. No article bodies, transcripts, or credentials.
      </p>
      {entries.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No snapshots yet.</p>
      ) : (
        <ul className="space-y-1 mb-2">
          {entries.slice(0, 10).map((s) => {
            const ageMin = Math.max(0, Math.round((Date.now() - s.ts) / 60_000));
            return (
              <li
                key={s.id}
                className="text-[10.5px] flex items-center gap-2"
                data-testid="commandcenter-snapshot-row"
              >
                <span className="font-bold uppercase tracking-wider text-sky-300">
                  {reasonLabel[s.reason] ?? s.reason}
                </span>
                <span className="text-muted-foreground">{s.silo}</span>
                <span className="truncate flex-1">{s.label}</span>
                <span className="text-muted-foreground/60 tabular-nums">{ageMin}m</span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            if (window.confirm("Clear all recovery snapshots?")) {
              clear();
              toast.success("Snapshots cleared");
            }
          }}
          className="h-8 text-[11px]"
          data-testid="commandcenter-snapshots-clear"
        >
          Clear snapshots
        </Button>
      </div>
    </div>
  );
}

interface SiloCardProps {
  siloId: string;
  name: string;
  color: string;
  weekStats: { generated: number; drafts: number; published: number };
  founderVoice: boolean;
  checklist: Record<string, boolean>;
  onToggleChecklist: (id: string) => void;
  readiness: ReadinessResult;
}

function SiloCard({
  siloId,
  name,
  color,
  weekStats,
  founderVoice,
  checklist,
  onToggleChecklist,
  readiness,
}: SiloCardProps) {
  const status = useGetWordpressStatus({ silo: siloId as ApiSilo });
  const envConfigured = status.data?.configured === true;
  const envSiteUrl = status.data?.siteUrl ?? null;
  const { creds: browserCreds } = useWPSettings(siloId);
  const browserConfigured = Boolean(
    browserCreds && browserCreds.url && browserCreds.user && browserCreds.password,
  );

  // Compose a single overall WP status badge so testers can scan quickly.
  let wpStatusLabel: string;
  let wpStatusTone: "ok" | "err";
  if (envConfigured) {
    wpStatusLabel = "Env creds";
    wpStatusTone = "ok";
  } else if (browserConfigured) {
    wpStatusLabel = "Browser creds";
    wpStatusTone = "ok";
  } else {
    wpStatusLabel = "Not configured";
    wpStatusTone = "err";
  }

  const wpToneClass =
    wpStatusTone === "ok"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
      : "bg-red-500/15 text-red-300 border-red-500/40";

  const completedCount = CHECKLIST_ITEMS.filter(
    (i) => checklist[i.id],
  ).length;

  const readinessTone =
    readiness.band === "green"
      ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
      : readiness.band === "amber"
        ? "text-amber-300 border-amber-500/40 bg-amber-500/10"
        : "text-red-300 border-red-500/40 bg-red-500/10";
  const readinessBarBg =
    readiness.band === "green"
      ? "#10B981"
      : readiness.band === "amber"
        ? "#F59E0B"
        : "#EF4444";
  const missingItems = readiness.items.filter((it) => !it.ok);

  return (
    <div
      data-testid={`commandcenter-silo-${siloId}`}
      className="rounded-xl border border-border/60 bg-secondary/30 overflow-hidden"
    >
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ background: `${color}1A` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: color }}
          />
          <span
            className="text-[12px] font-bold uppercase tracking-wider"
            style={{ color }}
          >
            {name}
          </span>
          {founderVoice && (
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
              style={{ borderColor: color, color }}
              title="Founder Voice (Trent Clark Mode) is ON for this silo"
            >
              Founder Voice
            </span>
          )}
        </div>
        <span
          data-testid={`commandcenter-wp-status-${siloId}`}
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${wpToneClass}`}
          title={
            envConfigured
              ? `Env creds detected${envSiteUrl ? ` · ${envSiteUrl}` : ""}`
              : browserConfigured
                ? "Browser-saved creds (use WP Connections to manage)"
                : "No env or browser creds configured"
          }
        >
          {wpStatusTone === "ok" ? (
            <ShieldCheck className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
          {wpStatusLabel}
        </span>
      </div>

      {/* Readiness Score row */}
      <div
        data-testid={`commandcenter-readiness-${siloId}`}
        className="px-3 py-2 border-b border-border/40 space-y-1"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Manual Publish Readiness
          </span>
          <span
            data-testid={`commandcenter-readiness-score-${siloId}`}
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${readinessTone}`}
            title={
              missingItems.length === 0
                ? "All readiness checks pass"
                : `Missing: ${missingItems.map((i) => i.label).join(", ")}`
            }
          >
            {readiness.score}/100
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${readiness.score}%`,
              background: readinessBarBg,
            }}
          />
        </div>
      </div>

      <div className="px-3 py-2 grid grid-cols-3 gap-1.5 border-b border-border/40">
        <div className="rounded-md bg-secondary/40 border border-border/40 px-2 py-1.5 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Created
          </div>
          <div className="text-sm font-bold">{weekStats.generated}</div>
        </div>
        <div className="rounded-md bg-secondary/40 border border-border/40 px-2 py-1.5 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Drafts
          </div>
          <div className="text-sm font-bold">{weekStats.drafts}</div>
        </div>
        <div className="rounded-md bg-secondary/40 border border-border/40 px-2 py-1.5 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Manual
          </div>
          <div className="text-sm font-bold">{weekStats.published}</div>
        </div>
      </div>

      <div className="px-3 py-2 space-y-1">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Ops checklist</span>
          <span>
            {completedCount}/{CHECKLIST_ITEMS.length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-1">
          {CHECKLIST_ITEMS.map((item) => {
            const done = Boolean(checklist[item.id]);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggleChecklist(item.id)}
                className="w-full flex items-center gap-2 text-left text-[11px] py-1 px-1 rounded hover:bg-foreground/5 transition-colors"
              >
                {done ? (
                  <CheckCircle2
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color }}
                  />
                ) : (
                  <Circle className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                )}
                <span
                  className={
                    done ? "text-foreground/60 line-through" : "text-foreground/90"
                  }
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface QueueRow {
  id: string;
  label: string;
  count: number;
  hint: string;
}

function ActionQueueCard() {
  const { entries: outputs } = useOutputHistory();
  const { entries: media } = useMediaLibrary();
  const { entries: jobs } = useJobLedger();

  const draftsWaiting = outputs.filter((o) => o.kind === "quick").length;
  const socialPacksWaiting = outputs.filter((o) => o.kind === "pack").length;
  const imagesWaiting = media.filter((m) =>
    (m.type ?? "").toLowerCase().includes("image"),
  ).length;
  const wpJobs = jobs.filter((j) => j.kind === "wp-publish");
  const wpWaiting = wpJobs.filter((j) => j.status !== "success").length;
  const videoCaptionWaiting = jobs.filter((j) => j.kind === "transcribe").length;
  const failedJobs = jobs.filter((j) => j.status === "failure").length;

  const rows: QueueRow[] = [
    {
      id: "drafts",
      label: "Article drafts saved",
      count: draftsWaiting,
      hint: "Saved articles in your output history — finish and prepare for publishing.",
    },
    {
      id: "images",
      label: "Images ready",
      count: imagesWaiting,
      hint: "Images saved in the Media Library, ready to use or export.",
    },
    {
      id: "social",
      label: "Social posts created",
      count: socialPacksWaiting,
      hint: "Multi-platform post packs — copy or export to post by hand.",
    },
    {
      id: "wordpress",
      label: "WordPress jobs to review",
      count: wpWaiting,
      hint: "WordPress publish attempts not yet confirmed as successful.",
    },
    {
      id: "video",
      label: "Video / caption jobs",
      count: videoCaptionWaiting,
      hint: "Transcribe and caption jobs recorded by WebEdit.",
    },
    {
      id: "failed",
      label: "Failed jobs",
      count: failedJobs,
      hint: "Jobs that failed — review in Recent Jobs and retry the ones that matter.",
    },
  ];

  let nextAction: string;
  if (failedJobs > 0) {
    nextAction = "Review failed jobs in Recent Jobs and retry the ones that matter.";
  } else if (draftsWaiting > 0) {
    nextAction = "Finish an article draft and prepare it for WordPress in WP Connections.";
  } else if (imagesWaiting === 0) {
    nextAction = "Create your first graphic in WebArt.";
  } else if (socialPacksWaiting === 0) {
    nextAction = "Turn a story into social posts in Social Factory.";
  } else {
    nextAction = "You're caught up — start a new story in the Newsroom.";
  }

  const totalWaiting = rows.reduce((acc, r) => acc + r.count, 0);

  return (
    <div
      data-testid="commandcenter-action-queue"
      className="rounded-xl border border-border/60 bg-secondary/30 p-3 mb-3"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <ListTodo className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
          Today's Action Queue
        </span>
      </div>
      {totalWaiting === 0 ? (
        <p className="text-[11px] text-muted-foreground mb-2 leading-snug">
          Nothing waiting yet. As you create drafts, images, and posts they show
          up here so you always know what needs you next.
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {rows.map((r) => (
          <div
            key={r.id}
            data-testid={`commandcenter-queue-${r.id}`}
            title={r.hint}
            className="rounded-md bg-secondary/40 border border-border/40 px-2 py-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">
                {r.label}
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  r.id === "failed" && r.count > 0 ? "text-rose-300" : ""
                }`}
              >
                {r.count}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div
        data-testid="commandcenter-queue-next-action"
        className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2.5 py-2 text-[11px] leading-snug"
      >
        <span className="font-bold uppercase tracking-wider text-sky-300">
          Next:
        </span>{" "}
        {nextAction}
      </div>
    </div>
  );
}

function WebEditReadinessWidget({ onOpen }: { onOpen?: () => void }) {
  const [draftExists, setDraftExists] = React.useState(false);
  const [outputCount, setOutputCount] = React.useState(0);
  const [lastTitle, setLastTitle] = React.useState<string | null>(null);
  const [nextAction, setNextAction] = React.useState<string>("Start a clip — upload video or paste a transcript");

  React.useEffect(() => {
    function refresh() {
      try {
        const draft = window.localStorage.getItem("hmg-cutmaster-draft-v2");
        if (draft) {
          const parsed = JSON.parse(draft) as {
            webeditTitle?: string;
            manualText?: string;
            hookText?: string;
            thumbnailText?: string;
            captionPackAngle?: string;
          };
          setDraftExists(true);
          setLastTitle(parsed?.webeditTitle || null);
          const hasTranscript = Boolean(parsed.manualText?.trim());
          const hasHook = Boolean(parsed.hookText?.trim());
          const hasCaptionAngle = Boolean(parsed.captionPackAngle?.trim());
          const hasThumbnail = Boolean(parsed.thumbnailText?.trim());
          if (!hasTranscript) setNextAction("Step 2 — paste a transcript or upload a file");
          else if (!hasHook) setNextAction("Step 3 — run Hook Finder to pick your opening line");
          else if (!hasCaptionAngle) setNextAction("Step 5 — set your caption style and angle");
          else if (!hasThumbnail) setNextAction("Step 7 — add thumbnail headline and capture a frame");
          else setNextAction("Step 8 — save your Social Video Draft or Edit Brief");
        } else {
          setDraftExists(false);
          setLastTitle(null);
          setNextAction("Start a clip — upload video or paste a transcript");
        }
        const hist = window.localStorage.getItem("hmg-newsroom-output-history-v2");
        if (hist) {
          const parsed = JSON.parse(hist) as unknown[];
          const clipKinds = ["cut-note", "edit-brief", "caption-plan", "thumbnail-brief", "social-video-draft"];
          const entries = Array.isArray(parsed) ? parsed : [];
          setOutputCount(entries.filter((e) => e && typeof e === "object" && clipKinds.includes((e as { kind?: string }).kind ?? "")).length);
        } else {
          setOutputCount(0);
        }
      } catch {
        /* ignore */
      }
    }
    refresh();
  }, []);

  return (
    <section className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-red-600 text-white">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-400">WebEdit Clip Studio</p>
            <h3 className="text-[13px] font-black leading-tight text-foreground">
              {draftExists ? (lastTitle ? `Draft: ${lastTitle.slice(0, 36)}${lastTitle.length > 36 ? "…" : ""}` : "Draft in progress") : "No active draft"}
            </h3>
          </div>
        </div>
        <button type="button" onClick={onOpen}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-3 text-[11px] font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/20 transition-colors">
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Draft", value: draftExists ? "Active" : "None", ok: draftExists },
          { label: "Clip Outputs", value: String(outputCount), ok: outputCount > 0 },
          { label: "Timeline Mode", value: "Local", ok: true },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl border px-2 py-2 ${item.ok ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-border/50 bg-secondary/20"}`}>
            <p className={`text-[11px] font-black ${item.ok ? "text-emerald-300" : "text-muted-foreground"}`}>{item.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {["Local Timeline", "Hook Finder Live", "Render Backend Pending"].map((chip, i) => (
          <span key={chip} className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${i < 2 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" : "bg-amber-500/10 text-amber-400 border-amber-500/25"}`}>{chip}</span>
        ))}
      </div>
      <div className="mt-2 rounded-lg border border-border/50 bg-background/20 px-2.5 py-1.5 flex items-start gap-1.5">
        <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
        <p className="text-[10px] leading-snug">
          <span className="font-bold text-foreground/70">Next: </span>
          <span className="text-muted-foreground">{nextAction}</span>
        </p>
      </div>
    </section>
  );
}

function AiBrainStatusCard() {
  const { settings } = useZeroPaidSettings();
  const [corpus, setCorpus] = useState<CorpusHealthResult | null>(null);
  const [loading, setLoading] = useState(true);

  const apiBase = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await getCorpusHealth(apiBase);
      if (!cancelled) {
        setCorpus(result);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  type Tone = "ok" | "warn" | "muted";

  let corpusStatus: string;
  let corpusTone: Tone;
  if (loading) {
    corpusStatus = "Checking…";
    corpusTone = "muted";
  } else if (corpus && corpus.ok) {
    const chunks = corpus.stats.chunks;
    corpusStatus =
      chunks > 0 ? `Active — ${chunks} saved passage(s)` : "Ready — no sources yet";
    corpusTone = chunks > 0 ? "ok" : "warn";
  } else if (
    corpus &&
    corpus.ok === false &&
    (corpus.code === "unauthorized" ||
      corpus.status === 401 ||
      corpus.status === 403)
  ) {
    corpusStatus = "Sign in to view";
    corpusTone = "muted";
  } else {
    corpusStatus = "Unavailable — using base knowledge";
    corpusTone = "warn";
  }

  const lanes: Array<{
    id: string;
    label: string;
    status: string;
    tone: Tone;
    note: string;
  }> = [
    {
      id: "corpus",
      label: "Saved Knowledge",
      status: corpusStatus,
      tone: corpusTone,
      note: "Answers grounded on the sources you've imported.",
    },
    {
      id: "local-model",
      label: "Local Model",
      status: settings.ollamaEnabled
        ? "Enabled — connect an endpoint to use"
        : "Off",
      tone: settings.ollamaEnabled ? "warn" : "muted",
      note: "Runs on a self-hosted model once an endpoint is configured.",
    },
    {
      id: "paid",
      label: "Paid Provider",
      status: settings.paidEnabled ? "On (accelerator)" : "Off (default)",
      tone: settings.paidEnabled ? "ok" : "muted",
      note: "Only used when you explicitly turn it on.",
    },
    {
      id: "manual",
      label: "Manual Fallback",
      status: "Always available",
      tone: "ok",
      note: "Copy or export by hand if every other lane is unavailable.",
    },
  ];

  const toneClass: Record<Tone, string> = {
    ok: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    warn: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    muted: "bg-secondary/60 text-muted-foreground border-border/60",
  };

  return (
    <div
      data-testid="commandcenter-ai-brain"
      className="rounded-xl border border-border/60 bg-secondary/30 p-3 mb-3"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Brain className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
          AI Brain
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2 leading-snug">
        How the app answers right now. Statuses are real — nothing is shown as
        connected unless it actually is.
      </p>
      <div className="flex flex-col gap-1.5">
        {lanes.map((lane) => (
          <div
            key={lane.id}
            data-testid={`commandcenter-ai-lane-${lane.id}`}
            className="flex items-center justify-between gap-3 rounded-md border border-border/40 bg-secondary/40 px-2.5 py-1.5"
          >
            <div className="min-w-0">
              <p className="text-[12px] font-semibold leading-tight">
                {lane.label}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                {lane.note}
              </p>
            </div>
            <span
              className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${toneClass[lane.tone]}`}
            >
              {lane.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const VIEW_BTN_LABELS: Record<string, string> = {
  founderkb: "Open Knowledge Base",
  artboteditorial: "Run ARTBOT",
  sales: "Open Sales Desk",
  "wp-draft-history": "Review Drafts",
  socialfactory: "Open Social Factory",
  medialibrary: "Open Archive",
  recovery: "Open Backups",
  commandcenter: "View Status",
  backendstatus: "Check Backend",
  sessionrecap: "View Recap",
  newsroom: "Open Editorial Desk",
  artbot: "Open WebArt",
  cutmaster: "Open WebEdit",
};

function CockpitSnapshotCard({ onNavigate }: { onNavigate?: (v: View) => void }) {
  const stats = React.useMemo(() => {
    let todayCount = 0;
    let totalCount = 0;
    let memoryCount = 0;
    let storagePct = 0;

    try {
      const raw = window.localStorage.getItem("hmg-newsroom-output-history-v2");
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ createdAt?: number }>;
        if (Array.isArray(parsed)) {
          totalCount = parsed.length;
          const midnight = new Date();
          midnight.setHours(0, 0, 0, 0);
          todayCount = parsed.filter((e) => (e.createdAt ?? 0) >= midnight.getTime()).length;
        }
      }
      const kbRaw = window.localStorage.getItem("hmg-founder-knowledge-base-v1");
      if (kbRaw) {
        const kb = JSON.parse(kbRaw) as { items?: unknown[] };
        memoryCount = Array.isArray(kb?.items) ? kb.items.length : 0;
      }
      let bytes = 0;
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k) bytes += (window.localStorage.getItem(k) ?? "").length * 2;
      }
      storagePct = Math.min(100, Math.round((bytes / 1024 / 1024 / 5) * 100));
    } catch { /* ignore */ }

    const memoryGrade =
      memoryCount === 0
        ? { label: "Empty", cls: "text-rose-400 bg-rose-500/10 border-rose-500/30" }
        : memoryCount <= 2
          ? { label: "Basic", cls: "text-amber-400 bg-amber-500/10 border-amber-500/30" }
          : memoryCount <= 4
            ? { label: "Loaded", cls: "text-sky-400 bg-sky-500/10 border-sky-500/30" }
            : { label: "Strong", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };

    return { todayCount, totalCount, memoryCount, storagePct, memoryGrade };
  }, []);

  return (
    <section className="hmg-paper-panel mt-3 p-4" data-testid="cockpit-snapshot">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-600">Today's Cockpit</p>
          <h3 className="text-base font-black leading-tight">Quick state — what's saved, what's loaded, what matters.</h3>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("sessionrecap")}
            className="flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors whitespace-nowrap"
          >
            Full Session Recap →
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-3">
          <p className="text-2xl font-black text-violet-400">{stats.todayCount}</p>
          <p className="text-[10.5px] font-semibold text-muted-foreground mt-0.5">Outputs Today</p>
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-3">
          <p className="text-2xl font-black text-sky-400">{stats.totalCount}</p>
          <p className="text-[10.5px] font-semibold text-muted-foreground mt-0.5">Total Saved</p>
        </div>
        <div className={`rounded-xl border p-3 ${stats.memoryGrade.cls}`}>
          <p className="text-2xl font-black">{stats.memoryCount}</p>
          <p className="text-[10.5px] font-semibold text-muted-foreground mt-0.5">
            Memory Items · <span className="font-black">{stats.memoryGrade.label}</span>
          </p>
        </div>
        <div className={`rounded-xl border p-3 ${stats.storagePct > 75 ? "border-rose-500/30 bg-rose-500/[0.06]" : stats.storagePct > 50 ? "border-amber-500/30 bg-amber-500/[0.06]" : "border-emerald-500/20 bg-emerald-500/[0.04]"}`}>
          <p className={`text-2xl font-black ${stats.storagePct > 75 ? "text-rose-400" : stats.storagePct > 50 ? "text-amber-400" : "text-emerald-400"}`}>{stats.storagePct}%</p>
          <p className="text-[10.5px] font-semibold text-muted-foreground mt-0.5">Storage Used</p>
        </div>
      </div>
    </section>
  );
}

function FounderNextMovesPanel({ onNavigate }: { onNavigate?: (v: View) => void }) {
  interface Move {
    id: string;
    label: string;
    hint: string;
    view: View;
    priority: "critical" | "high" | "normal";
  }

  const moves = React.useMemo((): Move[] => {
    const result: Move[] = [];
    try {
      const kbRaw = window.localStorage.getItem("hmg-founder-knowledge-base-v1");
      const kbItems: { type: string }[] = kbRaw
        ? ((JSON.parse(kbRaw) as { items?: { type: string }[] })?.items ?? [])
        : [];

      const hasFounderVoice = kbItems.some((i) => i.type === "founder-voice");
      const hasWPRules = kbItems.some((i) => i.type === "wordpress-rule");
      const hasMaxNotes = kbItems.some((i) => ["revenue-max-note", "sales-note"].includes(i.type));
      const hasRelationships = kbItems.some((i) => ["relationship-note", "contact-csv"].includes(i.type));
      const hasBrandRules = kbItems.some((i) => i.type === "brand-rule");

      const histRaw = window.localStorage.getItem("hmg-newsroom-output-history-v2");
      const outputs = histRaw ? (JSON.parse(histRaw) as unknown) : [];
      const outputCount = Array.isArray(outputs) ? outputs.length : 0;
      const hasWPDraft =
        Array.isArray(outputs) &&
        (outputs as { kind?: string }[]).some((e) => e.kind === "wordpress-draft");

      let bytes = 0;
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k) bytes += (window.localStorage.getItem(k) ?? "").length * 2;
      }
      const storagePct = Math.min(100, Math.round((bytes / 1024 / 1024 / 5) * 100));

      if (kbItems.length === 0) {
        result.push({ id: "load-kb", label: "Load Founder Knowledge Base", hint: "Memory is empty — nothing powers editorial, social, or revenue engines.", view: "founderkb", priority: "critical" });
      }
      if (!hasFounderVoice) {
        result.push({ id: "add-voice", label: "Add Founder Voice", hint: "ARTBOT Editorial, Social Factory, and Editorial Desk all need voice context.", view: "founderkb", priority: "critical" });
      }
      if (!hasWPRules) {
        result.push({ id: "add-wp", label: "Add WordPress Rules", hint: "Draft export falls back to generic rules without this.", view: "founderkb", priority: "high" });
      }
      if (!hasMaxNotes) {
        result.push({ id: "add-max", label: "Add Max Revenue Notes", hint: "Next Moves engine has no revenue context. Sales Desk scoring is blind.", view: "founderkb", priority: "high" });
      }
      if (!hasRelationships) {
        result.push({ id: "add-rel", label: "Add Relationship Notes", hint: "Sales Desk has no contact data for outreach follow-up.", view: "sales", priority: "high" });
      }
      if (outputCount === 0) {
        result.push({ id: "first-output", label: "Generate Your First Content Output", hint: "Run ARTBOT Editorial to produce headline variants, source check, and WP prep.", view: "artboteditorial", priority: "high" });
      }
      if (outputCount > 0 && !hasWPDraft) {
        result.push({ id: "wp-draft", label: "Build a WordPress Draft", hint: "You have outputs but no WP drafts. Use WP Draft History.", view: "wp-draft-history", priority: "normal" });
      }
      if (storagePct > 75) {
        result.push({ id: "backup", label: "Export Backup Now", hint: `Storage at ${storagePct}% — export before hitting quota.`, view: "recovery", priority: "high" });
      }
      if (hasBrandRules && hasMaxNotes && outputCount > 0) {
        result.push({ id: "social", label: "Push Content to Social Factory", hint: "Memory and outputs ready — turn your best piece into platform posts.", view: "socialfactory", priority: "normal" });
      }
      if (hasRelationships) {
        result.push({ id: "sales-follow", label: "Review Sales Desk", hint: "Relationship notes loaded — check pipeline for follow-up opportunities.", view: "sales", priority: "normal" });
      }
    } catch { /* ignore */ }
    return result.slice(0, 6);
  }, []);

  if (moves.length === 0) return null;

  const priorityCls: Record<string, string> = {
    critical: "border-rose-500/30 bg-rose-500/[0.06]",
    high: "border-amber-500/30 bg-amber-500/[0.06]",
    normal: "border-border/40 bg-card/20",
  };
  const dotCls: Record<string, string> = {
    critical: "bg-rose-400",
    high: "bg-amber-400",
    normal: "bg-sky-400",
  };
  const textCls: Record<string, string> = {
    critical: "text-rose-300",
    high: "text-amber-300",
    normal: "text-sky-300",
  };

  return (
    <section className="hmg-paper-panel mt-3 p-4" data-testid="founder-next-moves-panel">
      <div className="flex items-start gap-3 mb-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-600 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-500">
            Founder Next Moves
          </p>
          <h3 className="text-lg font-black leading-tight text-foreground">
            Deterministic recommendations from your current state.
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            No AI. Reads memory + outputs directly. Priority based on what is missing or ready to act on.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {moves.map((move) => (
          <div
            key={move.id}
            className={`flex items-center gap-3 rounded-xl border p-3 ${priorityCls[move.priority]}`}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls[move.priority]}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-bold ${textCls[move.priority]}`}>{move.label}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{move.hint}</p>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate(move.view)}
                className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg border border-border/50 hover:border-foreground/30 bg-card/50 whitespace-nowrap"
              >
                {VIEW_BTN_LABELS[move.view] ?? "Open →"}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

const CONTENT_WEEK_KEY = "hmg-content-week-v1";

interface WeekState {
  weekStart: string;
  completed: Record<string, boolean>;
}

const WEEK_DAYS = [
  { id: "mon", label: "Monday", focus: "Write + Plan", desc: "Create 2 articles in Editorial Desk. Run ARTBOT Editorial on your top 3 story leads.", views: ["newsroom", "artboteditorial"] as View[] },
  { id: "tue", label: "Tuesday", focus: "Visual Day", desc: "WebArt graphics for all Monday articles. Set featured images. Update Media Library.", views: ["artbot", "medialibrary"] as View[] },
  { id: "wed", label: "Wednesday", focus: "Video Edit", desc: "WebEdit 3 clips from this week's content. Build Social Factory posts for each.", views: ["cutmaster", "socialfactory"] as View[] },
  { id: "thu", label: "Thursday", focus: "Revenue", desc: "Review Sales Desk. Max Revenue follow-ups. Check sponsor contacts and outreach targets.", views: ["sales", "commandcenter"] as View[] },
  { id: "fri", label: "Friday", focus: "Review + Archive", desc: "Output History cleanup. Export backup. WP Draft History review. Session Recap.", views: ["medialibrary", "sessionrecap"] as View[] },
] as const;

function getWeekStartStr(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

function readWeekState(): WeekState {
  try {
    const raw = window.localStorage.getItem(CONTENT_WEEK_KEY);
    if (!raw) return { weekStart: getWeekStartStr(), completed: {} };
    const parsed = JSON.parse(raw) as WeekState;
    if (parsed.weekStart !== getWeekStartStr()) {
      return { weekStart: getWeekStartStr(), completed: {} };
    }
    return parsed;
  } catch {
    return { weekStart: getWeekStartStr(), completed: {} };
  }
}

function writeWeekState(state: WeekState) {
  try {
    window.localStorage.setItem(CONTENT_WEEK_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

function ContentWeekPanel({ onNavigate }: { onNavigate?: (v: View) => void }) {
  const [completed, setCompleted] = React.useState<Record<string, boolean>>(
    () => readWeekState().completed,
  );

  const todayDayId = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()];
  const doneCount = WEEK_DAYS.filter((d) => completed[d.id]).length;

  function toggle(id: string) {
    setCompleted((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      writeWeekState({ weekStart: getWeekStartStr(), completed: next });
      return next;
    });
  }

  return (
    <section className="hmg-paper-panel mt-3 p-4" data-testid="content-week-panel">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sky-600 text-white">
            <ListTodo className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-600">
              Content Production Week
            </p>
            <h3 className="text-lg font-black leading-tight text-foreground">
              5-day rhythm — {doneCount}/5 complete
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Resets every Monday. Tracked in your browser only — no sync.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 pt-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${i < doneCount ? "bg-sky-400" : "bg-border/50"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {WEEK_DAYS.map((day) => {
          const isToday = day.id === todayDayId;
          const isDone = !!completed[day.id];
          return (
            <div
              key={day.id}
              className={`rounded-xl border p-3 flex items-start gap-3 transition-colors ${
                isDone
                  ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : isToday
                    ? "border-sky-500/30 bg-sky-500/[0.06]"
                    : "border-border/40 bg-card/20"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(day.id)}
                aria-label={isDone ? `Unmark ${day.label}` : `Mark ${day.label} complete`}
                className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isDone
                    ? "border-emerald-400 bg-emerald-500/20"
                    : isToday
                      ? "border-sky-400 hover:bg-sky-500/10"
                      : "border-border/60 hover:border-muted-foreground"
                }`}
              >
                {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className={`text-[12px] font-black uppercase tracking-wide ${isDone ? "text-muted-foreground/50 line-through" : isToday ? "text-sky-400" : "text-foreground/70"}`}>
                    {day.label}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isToday
                      ? "border-sky-400/40 bg-sky-500/10 text-sky-400"
                      : "border-border/40 text-muted-foreground/60"
                  }`}>
                    {day.focus}{isToday ? " · Today" : ""}
                  </span>
                </div>
                <p className={`text-[11.5px] leading-relaxed ${isDone ? "text-muted-foreground/40" : "text-muted-foreground"}`}>
                  {day.desc}
                </p>
              </div>
              {onNavigate && !isDone && (
                <button
                  type="button"
                  onClick={() => onNavigate(day.views[0])}
                  className="flex-shrink-0 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border/40 hover:border-muted-foreground/40"
                >
                  Open
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HavenPowerGrid({ onNavigate }: { onNavigate?: (v: View) => void }) {
  const widgets = useMemo(() => {
    let memoryCount = 0;
    let outputCount = 0;
    let wpConfigured = false;
    let storagePct = 0;
    try {
      const kbRaw = window.localStorage.getItem("hmg-founder-knowledge-base-v1");
      if (kbRaw) {
        const kb = JSON.parse(kbRaw) as { items?: unknown[] };
        memoryCount = Array.isArray(kb?.items) ? kb.items.length : 0;
      }
      const ohRaw = window.localStorage.getItem("hmg-newsroom-output-history-v2");
      if (ohRaw) {
        const oh = JSON.parse(ohRaw) as unknown;
        outputCount = Array.isArray(oh) ? oh.length : 0;
      }
      const wpRaw = window.localStorage.getItem("hmg-newsroom-wp-settings-v2");
      wpConfigured = Boolean(wpRaw && wpRaw.length > 10);
      let bytes = 0;
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        bytes += (window.localStorage.getItem(k) ?? "").length * 2;
      }
      storagePct = Math.min(100, Math.round((bytes / 1024 / 1024 / 5) * 100));
    } catch { /* ignore */ }

    return [
      {
        label: "Haven AI Engine",
        value: "Active",
        sub: "Local-first · No fake providers",
        icon: Brain,
        color: "#8B5CF6",
        tone: "border-violet-500/30 bg-violet-500/[0.06]",
        view: "aicapability" as View,
      },
      {
        label: "Memory Fuel",
        value: memoryCount > 0 ? `${memoryCount} items` : "Empty",
        sub: memoryCount > 0 ? "Founder KB loaded" : "Load Founder Knowledge Base",
        icon: HardDrive,
        color: memoryCount > 10 ? "#38BDF8" : memoryCount > 0 ? "#F59E0B" : "#6B7280",
        tone: memoryCount > 10
          ? "border-sky-500/30 bg-sky-500/[0.06]"
          : memoryCount > 0
            ? "border-amber-500/30 bg-amber-500/[0.06]"
            : "border-border/40 bg-card/30",
        view: "founderkb" as View,
      },
      {
        label: "Max Engine",
        value: "Local Brain",
        sub: "Revenue intelligence active",
        icon: TrendingUp,
        color: "#10B981",
        tone: "border-emerald-500/30 bg-emerald-500/[0.06]",
        view: "sales" as View,
      },
      {
        label: "ARTBOT Editorial",
        value: "Local Brain",
        sub: "Headline, source, gossip checks",
        icon: Newspaper,
        color: "#38BDF8",
        tone: "border-sky-500/30 bg-sky-500/[0.06]",
        view: "artboteditorial" as View,
      },
      {
        label: "WP Connections",
        value: wpConfigured ? "Configured" : "Not set up",
        sub: wpConfigured ? "Credentials saved locally" : "Configure WP REST credentials",
        icon: Cloud,
        color: wpConfigured ? "#0EA5E9" : "#6B7280",
        tone: wpConfigured
          ? "border-sky-500/30 bg-sky-500/[0.06]"
          : "border-border/40 bg-card/30",
        view: "wpconnections" as View,
      },
      {
        label: "Operator Roster",
        value: "9 Operators",
        sub: "Local work queue model",
        icon: ListTodo,
        color: "#0EA5E9",
        tone: "border-sky-500/30 bg-sky-500/[0.06]",
        view: "operatorreadiness" as View,
      },
      {
        label: "Output Receipts",
        value: outputCount > 0 ? `${outputCount} saved` : "None yet",
        sub: "Local receipt log",
        icon: PackageCheck,
        color: outputCount > 0 ? "#4ADE80" : "#6B7280",
        tone: outputCount > 0
          ? "border-emerald-500/30 bg-emerald-500/[0.06]"
          : "border-border/40 bg-card/30",
        view: "medialibrary" as View,
      },
      {
        label: "Storage Health",
        value: `${storagePct}% used`,
        sub: storagePct < 80 ? "Healthy" : storagePct < 95 ? "Getting full" : "Near limit",
        icon: Layers,
        color: storagePct < 80 ? "#4ADE80" : storagePct < 95 ? "#F59E0B" : "#EF4444",
        tone: storagePct < 80
          ? "border-emerald-500/30 bg-emerald-500/[0.06]"
          : storagePct < 95
            ? "border-amber-500/30 bg-amber-500/[0.06]"
            : "border-rose-500/30 bg-rose-500/[0.06]",
        view: "recovery" as View,
      },
      {
        label: "Backend / API",
        value: "10 Routes",
        sub: "View live route status",
        icon: Activity,
        color: "#0EA5E9",
        tone: "border-sky-500/30 bg-sky-500/[0.06]",
        view: "backendstatus" as View,
      },
    ];
  }, []);

  return (
    <section className="mt-4 px-0">
      <div className="flex items-center gap-2 mb-3 px-0">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-400">
          Haven AI System Power
        </span>
        <div className="h-px flex-1 bg-violet-500/20" />
        <span className="text-[10px] text-muted-foreground/60">Local-first · No fake providers</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {widgets.map((w) => {
          const Icon = w.icon;
          return (
            <button
              key={w.label}
              type="button"
              onClick={() => onNavigate?.(w.view)}
              className={`text-left rounded-xl border p-3 transition-all hover:scale-[1.02] active:scale-[0.99] ${w.tone}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: w.color }} />
                <span className="text-[11px] font-black uppercase tracking-wider truncate" style={{ color: w.color }}>
                  {w.label}
                </span>
              </div>
              <div className="text-[15px] font-black text-foreground leading-none mb-0.5">
                {w.value}
              </div>
              <div className="text-[10px] text-muted-foreground/80 leading-snug">
                {w.sub}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const PUBLISH_CHANNELS: PublishingChannelStatus[] = [
  { channel: "WordPress (direct publish)", status: "Blocked" },
  { channel: "WordPress (export feed)", status: "Requires Setup" },
  { channel: "Instagram", status: "Not Connected" },
  { channel: "Facebook", status: "Not Connected" },
  { channel: "TikTok", status: "Not Connected" },
  { channel: "YouTube", status: "Not Connected" },
  { channel: "X (Twitter)", status: "Not Connected" },
  { channel: "Media Library", status: "Ready" },
  { channel: "Export / Download", status: "Ready" },
];

interface CommandCenterViewProps {
  onNavigate?: (view: View) => void;
}

export function CommandCenterView({ onNavigate }: CommandCenterViewProps = {}) {
  const { events } = useUsageStats();
  const { effective: founderVoiceFor } = useFounderVoiceMap();
  const { sponsors } = useSponsors();
  const { entries: mediaEntries } = useMediaLibrary();
  const { entries: outputEntries } = useOutputHistory();
  const { entries: jobs } = useJobLedger();
  const [checklist, setChecklist] = useState<ChecklistMap>(() =>
    readChecklist(),
  );
  const [scope, setScope] = useState<"week" | "today">("week");
  const [publicAppOk, setPublicAppOk] = useState<boolean>(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(verticals[0].id);

  useEffect(() => {
    writeChecklist(checklist);
  }, [checklist]);

  // Lightweight side fetch so SiloCard readiness can include public-app status.
  // Errors are silently ignored — the score just falls back to "not ok".
  useEffect(() => {
    const apiBase = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/system/status`);
        if (!res.ok) return;
        const json = (await res.json()) as { publicApp?: { configured?: boolean } };
        if (!cancelled) setPublicAppOk(Boolean(json.publicApp?.configured));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sinceTs = scope === "today" ? startOfDay() : startOfWeek();
  const stats = useMemo(
    () =>
      aggregateBySilo(
        events,
        sinceTs,
        verticals.map((v) => v.id),
      ),
    [events, sinceTs],
  );
  const statsBySilo = useMemo(
    () => Object.fromEntries(stats.map((s) => [s.silo, s])),
    [stats],
  );

  const sponsorsBySilo = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sponsors) {
      if (!s.active || isExpired(s)) continue;
      map[s.silo] = (map[s.silo] ?? 0) + 1;
    }
    return map;
  }, [sponsors]);
  const mediaBySilo = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of mediaEntries) {
      map[m.silo] = (map[m.silo] ?? 0) + 1;
    }
    return map;
  }, [mediaEntries]);

  const totals = useMemo(
    () =>
      stats.reduce(
        (acc, s) => {
          acc.generated += s.generated;
          acc.drafts += s.drafts;
          acc.published += s.published;
          return acc;
        },
        { generated: 0, drafts: 0, published: 0 },
      ),
    [stats],
  );

  const selectedBrand = useMemo(
    () => verticals.find((vertical) => vertical.id === selectedBrandId) ?? verticals[0],
    [selectedBrandId],
  );
  const latestOutput = useMemo(() => outputEntries[0], [outputEntries]);
  const { failedJobs, runningJobs } = useMemo(
    () =>
      jobs.reduce(
        (acc, job) => {
          if (job.status === "failure") acc.failedJobs += 1;
          if (job.status === "running") acc.runningJobs += 1;
          return acc;
        },
        { failedJobs: 0, runningJobs: 0 },
      ),
    [jobs],
  );
  const { draftCount, outputCount } = useMemo(
    () =>
      outputEntries.reduce(
        (acc, entry) => {
          if (entry.kind === "quick") acc.draftCount += 1;
          else acc.outputCount += 1;
          return acc;
        },
        { draftCount: 0, outputCount: 0 },
      ),
    [outputEntries],
  );
  const imageAssetCount = useMemo(
    () =>
      mediaEntries.filter((entry) =>
        (entry.type ?? "").toLowerCase().includes("image"),
      ).length,
    [mediaEntries],
  );
  const todayMission =
    failedJobs > 0
      ? "Review the failed production item, then move the strongest story forward."
      : draftCount === 0
        ? "Create one clean article draft, then create its visual and social copy."
      : imageAssetCount === 0
          ? "Turn the newest article draft into a branded visual in WebArt."
          : outputCount === 0
            ? "Assemble the campaign copy around the article, visual, and clip plan."
            : "Export the best output, save receipts, and prep the next manual publish move.";
  const nextMove =
    failedJobs > 0
      ? {
          title: "Fix the one thing blocking momentum",
          body: "Open Operations details, review the failed job, then create the output that matters.",
          view: "commandcenter" as View,
        }
      : draftCount === 0
        ? {
            title: "Start with Editorial Desk",
            body: `Create today's ${selectedBrand.name} article draft before touching WebArt or social.`,
            view: "newsroom" as View,
          }
        : imageAssetCount === 0
          ? {
              title: "Give the story a face",
              body: "Open WebArt and create the hero image, square, story, and thumbnail plan.",
              view: "artbot" as View,
            }
          : {
              title: "Assemble the campaign",
              body: "Open Social Factory and turn the article, visual, and clip plan into platform-ready posts.",
              view: "socialfactory" as View,
            };
  const outputPreview = useMemo(
    () =>
      latestOutput && typeof latestOutput.output === "object" && latestOutput.output
        ? ((latestOutput.output as { content?: unknown }).content ?? latestOutput.prompt)
        : latestOutput?.prompt,
    [latestOutput],
  );
  const readinessSummaries = useMemo(
    () => [
      {
        label: "Ready",
        value: String(outputCount + imageAssetCount),
        hint: "Receipts and assets saved locally",
        tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
      },
      {
        label: "Needs asset",
        value: draftCount > 0 && imageAssetCount === 0 ? "1" : "0",
        hint: "Article exists without a saved image",
        tone: "border-amber-500/40 bg-amber-500/10 text-amber-300",
      },
      {
        label: "Needs review",
        value: String(failedJobs),
        hint: runningJobs ? `${runningJobs} running locally` : "Failed jobs only",
        tone: failedJobs
          ? "border-rose-500/50 bg-rose-500/10 text-rose-300"
          : "border-border/60 bg-secondary/20 text-muted-foreground",
      },
    ],
    [draftCount, failedJobs, imageAssetCount, outputCount, runningJobs],
  );
  const strongestBrandName = useMemo(() => {
    const ranked = verticals.map((brand) => {
      const stat = statsBySilo[brand.id];
      return {
        name: brand.name,
        score:
          (stat?.generated ?? 0) +
          (stat?.drafts ?? 0) * 1.5 +
          (mediaBySilo[brand.id] ?? 0) +
          (sponsorsBySilo[brand.id] ?? 0) * 2,
      };
    });
    ranked.sort((a, b) => b.score - a.score);
    return ranked[0]?.score ? ranked[0].name : selectedBrand.name;
  }, [mediaBySilo, selectedBrand.name, sponsorsBySilo, statsBySilo]);
  const weakestOutputArea =
    failedJobs > 0
      ? "Needs review"
      : draftCount === 0
        ? "Article draft"
        : imageAssetCount === 0
          ? "Visual asset"
          : outputCount === 0
            ? "Campaign packet"
            : "Receipt cleanup";
  const intelligenceTool =
    failedJobs > 0
      ? { label: "Operations Details", view: "commandcenter" as View }
      : draftCount === 0
        ? { label: "Editorial Desk", view: "newsroom" as View }
        : imageAssetCount === 0
          ? { label: "WebArt", view: "artbot" as View }
          : { label: "Social Factory", view: "socialfactory" as View };

  const toggleChecklist = (silo: string, id: string) => {
    setChecklist((prev) => {
      const siloMap = { ...(prev[silo] ?? {}) };
      siloMap[id] = !siloMap[id];
      return { ...prev, [silo]: siloMap };
    });
  };

  return (
    <div
      data-testid="commandcenter-view"
      className="hmg-paper-page"
    >
      <section className="hmg-paper-hero p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/20">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">
              Start Here
            </p>
            <h2 className="mt-1 text-3xl font-black leading-none tracking-tight text-foreground sm:text-4xl">
              Founder Command Center
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Pick the brand, open the right desk, and move today's strongest
              story from idea to output.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.18em] text-sky-700">
              <Rocket className="h-3.5 w-3.5" />
              Today's Mission
            </span>
            <span className="rounded-full border border-sky-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-800">
              {selectedBrand.name}
            </span>
          </div>
          <p className="text-base font-semibold leading-snug text-foreground">
            {todayMission}
          </p>
        </div>
      </section>

      <FounderNextMovesPanel onNavigate={onNavigate} />

      <CockpitSnapshotCard onNavigate={onNavigate} />

      <ContentWeekPanel onNavigate={onNavigate} />

      <section className="hmg-paper-panel mt-4 p-4" data-testid="commandcenter-inbox">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">
              Agent Inbox / Editorial Inbox
            </p>
            <h3 className="mt-1 text-2xl font-black leading-tight text-foreground">
              Review the next draft, source note, or assigned story.
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              No fake live status. This is a local work queue from saved drafts,
              media, receipts, and browser history.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-border/70 bg-secondary/60 p-3">
              <p className="text-2xl font-black">{draftCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Drafts</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/60 p-3">
              <p className="text-2xl font-black">{imageAssetCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Media</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/60 p-3">
              <p className="text-2xl font-black">{failedJobs}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Review</p>
            </div>
          </div>
        </div>
      </section>

      <AskMaxStrip onOpen={() => onNavigate?.("sales")} />
      <ArtbotEditorialStrip onOpen={() => onNavigate?.("newsroom")} />
      <FounderKBStrip onOpen={() => onNavigate?.("founderkb")} />

      <HavenPowerGrid onNavigate={onNavigate} />

      <div className="mt-4">
        <MissionControlCockpit
          onOpenAction={(nextView) => onNavigate?.(nextView as View)}
        />
      </div>

      <section className="hmg-paper-panel mt-4 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-[12px] font-black uppercase tracking-wider text-foreground">
              Brand Selector
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Everything below follows this brand's voice and color.
            </p>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
            style={{ background: selectedBrand.accentBg, color: selectedBrand.onAccent }}
          >
            Active
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {verticals.map((brand) => {
            const active = brand.id === selectedBrand.id;
            return (
              <button
                key={brand.id}
                type="button"
                onClick={() => setSelectedBrandId(brand.id)}
                className={`flex min-h-[58px] items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all ${
                  active
                    ? "border-transparent shadow-lg"
                    : "border-border/60 bg-secondary/20 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
                style={
                  active
                    ? {
                        background: brand.accentBg || brand.color,
                        color: brand.onAccent,
                        boxShadow: `0 14px 32px ${brand.color}24`,
                      }
                    : undefined
                }
              >
                {brand.logo ? (
                  <img src={brand.logo} alt="" className="h-7 w-7 rounded-md object-contain" />
                ) : (
                  <Newspaper className="h-5 w-5 shrink-0" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-black uppercase tracking-tight">
                    {brand.name}
                  </span>
                  <span className="block truncate text-[10px] opacity-80">
                    {brand.tagline}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <SectionHeading
        title="WordPress Queue"
        hint="What is waiting and the clean next step."
      />
      <ActionQueueCard />

      <section className="hmg-paper-panel mt-4 p-4" data-testid="commandcenter-output-history-access">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
              Output History
            </p>
            <h3 className="text-xl font-black leading-tight text-foreground">
              Saved Outputs, Media Library, WordPress Drafts.
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Open the shelf for receipts, media, and manual export files.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.("medialibrary")}
            className="hmg-primary-action bg-sky-600 text-white"
          >
            Open Output History
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <details className="mt-4 rounded-2xl border border-border/60 bg-secondary/20 p-3">
        <summary className="cursor-pointer list-none text-[12px] font-black uppercase tracking-wider text-muted-foreground">
          More on the Newsroom
          <span className="ml-2 text-[10px] font-semibold normal-case tracking-normal">
            attention, intelligence, health, backups, reporting
          </span>
        </summary>

        <div className="mt-3">
          <section className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {readinessSummaries.map((summary) => (
              <div
                key={summary.label}
                className={`rounded-2xl border p-3 ${summary.tone}`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em]">
                  {summary.label}
                </p>
                <p className="mt-1 text-2xl font-black leading-none">
                  {summary.value}
                </p>
                <p className="mt-1 text-[10px] leading-snug opacity-80">
                  {summary.hint}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-border/60 bg-card/45 p-3">
              <div className="mb-3 flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-sky-400" />
                <div>
                  <h3 className="text-[12px] font-black uppercase tracking-wider text-foreground">
                    What needs attention?
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Only the signals worth acting on right now.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  {
                    label: "Drafts",
                    value: draftCount,
                    hint: "Article drafts waiting",
                    icon: Newspaper,
                    color: "#38BDF8",
                  },
                  {
                    label: "Assets",
                    value: imageAssetCount,
                    hint: "Images in the library",
                    icon: ImageUp,
                    color: "#A855F7",
                  },
                  {
                    label: "Outputs",
                    value: outputCount,
                    hint: "Receipts and social posts",
                    icon: PackageCheck,
                    color: "#D4A23A",
                  },
                  {
                    label: "Issues",
                    value: failedJobs + runningJobs,
                    hint: failedJobs ? `${failedJobs} failed` : `${runningJobs} running`,
                    icon: AlertTriangle,
                    color: failedJobs ? "#EF4444" : "#F59E0B",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-xl border border-border/50 bg-secondary/25 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <Icon className="h-4 w-4" style={{ color: item.color }} />
                        <span className="text-xl font-black text-foreground">
                          {item.value}
                        </span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground/80">
                        {item.hint}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/45 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <h3 className="text-[12px] font-black uppercase tracking-wider text-foreground">
                  Next best move
                </h3>
              </div>
              <h4 className="text-lg font-black leading-tight text-foreground">
                {nextMove.title}
              </h4>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                {nextMove.body}
              </p>
              <button
                type="button"
                onClick={() => onNavigate?.(nextMove.view)}
                className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-[12px] font-black uppercase tracking-wider text-background transition-transform active:scale-[0.99]"
              >
                Open this desk
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          <IntelligencePreviewPanel
            todayMove={todayMission}
            strongestBrand={strongestBrandName}
            weakestArea={weakestOutputArea}
            recommendedTool={intelligenceTool}
            onOpenTool={onNavigate}
          />

          <section className="mt-4 rounded-2xl border border-border/60 bg-card/45 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-emerald-400" />
                <div>
                  <h3 className="text-[12px] font-black uppercase tracking-wider text-foreground">
                    Recent output / receipt
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Last useful output saved in this browser.
                  </p>
                </div>
              </div>
              {latestOutput && (
                <span className="rounded-full border border-border/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {latestOutput.kind}
                </span>
              )}
            </div>
            {latestOutput ? (
              <div className="rounded-xl border border-border/50 bg-secondary/25 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-black text-foreground">
                    {latestOutput.siloName}
                  </p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(latestOutput.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="line-clamp-4 text-[12px] leading-relaxed text-muted-foreground">
                  {String(outputPreview ?? "Output saved. Open Output History for the full receipt.")}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 p-4 text-center">
                <PackageCheck className="mx-auto h-7 w-7 text-muted-foreground/40" />
                <p className="mt-2 text-sm font-bold text-foreground">
                  No receipts yet
                </p>
                <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-muted-foreground">
                  Create an article, graphic, cut plan, or social output and the latest
                  receipt will appear here.
                </p>
              </div>
            )}
          </section>

          <WebEditReadinessWidget onOpen={() => onNavigate?.("cutmaster")} />

          <SectionHeading
            title="Local Intelligence"
            hint="Which local writing support is available right now, shown honestly."
          />
          <AiBrainStatusCard />

          <SectionHeading
            title="Manual Publish Readiness"
            hint="Where work is ready for manual publish and where export is required."
          />
          <PublishingStatus channels={PUBLISH_CHANNELS} className="mb-3" />

          <SectionHeading
            title="App Health"
            hint="Is everything online and running normally?"
          />
          <NetworkStatusBanner />
          <StorageQuotaBanner />
          <SystemHealthCard />
          <WerewolfScoreCard />
          <PerformanceHealthCard />

          <SectionHeading
            title="Errors That Need Action"
            hint="Anything that failed and is worth a look."
          />
          <FailureDrillPanel />

          <SectionHeading
            title="Recent Jobs"
            hint="The latest things the app ran for you."
          />
          <JobLedgerCard />

          <SectionHeading
            title="Recovery & Backup"
            hint="Keep a safe copy of your work and settings."
          />
          <BackupReminderBanner />
          <SnapshotsCard />
          <ExportImportCard />
          <DevHandoffCard />

          <SectionHeading
            title="Your Profile & Setup"
            hint="Who's operating, plus sample data to explore with."
          />
          <OperatorProfileCard />
          <SampleDataCard />

          <SectionHeading
            title="Sponsors & Reporting"
            hint="Ad inventory and your weekly recap."
          />
          <SponsorInventoryView />
          <WeeklyReportCard />

          <SectionHeading
            title="Publishing Status by Brand"
            hint="WordPress connection and how ready each brand is to publish."
          />

      <div className="flex items-center gap-1 p-1 mb-3 rounded-full bg-secondary/40 border border-border w-max">
        {(["today", "week"] as const).map((s) => {
          const active = scope === s;
          return (
            <button
              key={s}
              onClick={() => setScope(s)}
              className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-all"
              style={{
                background: active ? "#0EA5E9" : "transparent",
                color: active ? "#fff" : "hsl(var(--muted-foreground))",
              }}
            >
              {s === "today" ? "Today" : "This week"}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <div className="rounded-md bg-secondary/40 border border-border/40 px-2 py-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1 justify-center">
            <Layers className="w-3 h-3" /> Created
          </div>
          <div className="text-base font-bold">{totals.generated}</div>
        </div>
        <div className="rounded-md bg-secondary/40 border border-border/40 px-2 py-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1 justify-center">
            <HardDrive className="w-3 h-3" /> Drafts
          </div>
          <div className="text-base font-bold">{totals.drafts}</div>
        </div>
        <div className="rounded-md bg-secondary/40 border border-border/40 px-2 py-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1 justify-center">
            <Cloud className="w-3 h-3" /> Ready
          </div>
          <div className="text-base font-bold">{totals.published}</div>
        </div>
      </div>

      <div className="space-y-2.5">
        {verticals.map((v) => {
          const week = statsBySilo[v.id];
          const stats = week
            ? {
                generated: week.generated,
                drafts: week.drafts,
                published: week.published,
              }
            : { generated: 0, drafts: 0, published: 0 };
          const fv = founderVoiceFor(v.id as ApiSilo);
          // Readiness is computed in the parent so SiloCard stays presentational.
          // We use available signals as proxies (envConfigured WP detection
          // happens inside SiloCard so we approximate here using whether any
          // sponsors / media / drafts exist for the silo).
          const readiness = computeReadiness({
            wpConnected: typeof window !== "undefined"
              ? Boolean(window.localStorage.getItem("hmg-newsroom-wp-settings-v2")?.includes(`"${v.id}"`))
              : false,
            founderVoiceConfigured: fv,
            sponsorSlotsAvailable: (sponsorsBySilo[v.id] ?? 0) > 0,
            hasArticlePackage: stats.drafts + stats.published > 0,
            seoFieldsPresent: stats.generated > 0,
            publicAppOk,
            mediaLibraryItems: mediaBySilo[v.id] ?? 0,
          });
          return (
            <SiloCard
              key={v.id}
              siloId={v.id}
              name={v.name}
              color={v.color}
              weekStats={stats}
              founderVoice={fv}
              checklist={checklist[v.id] ?? {}}
              onToggleChecklist={(id) => toggleChecklist(v.id, id)}
              readiness={readiness}
            />
          );
        })}
      </div>

      <p className="mt-4 text-[10px] text-muted-foreground/70 leading-snug">
        Credentials are never displayed here — only whether they're configured
        in env or saved in this browser. Manage WP creds in WP Connections.
      </p>
        </div>
      </details>
    </div>
  );
}
