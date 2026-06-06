import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Copy,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchOllamaDiagnostics,
  getCorpusHealth,
  type CorpusHealthResult,
  type OllamaDiagnostics,
} from "@/lib/hmg/haven-ai";
import {
  RECOVERY_MODULES,
  clearAllModuleErrors,
  clearModuleError,
  computeOverallStatus,
  getModuleMeta,
  useModuleHealth,
  type ModuleErrorRecord,
} from "@/lib/hmg/recoveryCenter";

const API_BASE = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");

type Tone = "ok" | "warn" | "down" | "idle";

const TONE_CLASS: Record<Tone, string> = {
  ok: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  warn: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  down: "text-rose-400 border-rose-500/40 bg-rose-500/10",
  idle: "text-zinc-400 border-zinc-600/40 bg-zinc-700/10",
};

const TONE_DOT: Record<Tone, string> = {
  ok: "bg-emerald-400",
  warn: "bg-amber-400",
  down: "bg-rose-400",
  idle: "bg-zinc-500",
};

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

interface StatusCardProps {
  name: string;
  blurb: string;
  tone: Tone;
  label: string;
  detail: string;
  error?: ModuleErrorRecord;
  nextFix?: string;
  onRetry?: () => void;
  testId: string;
}

function StatusCard({
  name,
  blurb,
  tone,
  label,
  detail,
  error,
  nextFix,
  onRetry,
  testId,
}: StatusCardProps) {
  return (
    <div
      className="rounded-2xl border border-border/50 bg-card/40 p-4"
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${TONE_DOT[tone]}`} />
            <h3 className="text-[14px] font-bold tracking-tight truncate">
              {name}
            </h3>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
            {blurb}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${TONE_CLASS[tone]}`}
          data-testid={`${testId}-status`}
        >
          {label}
        </span>
      </div>

      <p className="mt-2.5 text-[12px] text-foreground/80 leading-relaxed">
        {detail}
      </p>

      {error && (
        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/[0.06] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-300">
            <AlertTriangle className="h-3 w-3" />
            Last error · {timeAgo(error.at)}
            {error.count > 1 && (
              <span className="text-rose-400/80">×{error.count}</span>
            )}
          </div>
          <p className="mt-1 text-[12px] text-rose-100/90 break-words">
            {error.message}
          </p>
          {nextFix && (
            <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground/80">
                Next fix:{" "}
              </span>
              {nextFix}
            </p>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              data-testid={`${testId}-retry`}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-[11px] font-bold text-background transition-opacity hover:opacity-90"
            >
              <RotateCcw className="h-3 w-3" />
              Clear &amp; retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ollamaTone(d: OllamaDiagnostics | null): {
  tone: Tone;
  label: string;
} {
  if (!d) return { tone: "idle", label: "Checking" };
  switch (d.status) {
    case "remote-ready":
      return { tone: "ok", label: "Remote ready" };
    case "config-needed":
      return { tone: "idle", label: "Not configured" };
    case "no-models":
      return { tone: "warn", label: "No models" };
    case "blocked":
    default:
      return { tone: "warn", label: "Local brain" };
  }
}

function corpusTone(c: CorpusHealthResult | null): {
  tone: Tone;
  label: string;
  detail: string;
} {
  if (!c) return { tone: "idle", label: "Checking", detail: "Checking corpus…" };
  if (!c.ok)
    return {
      tone: "warn",
      label: "Unreachable",
      detail: c.error || "Corpus health endpoint did not respond.",
    };
  if (c.stats.chunks > 0)
    return {
      tone: "ok",
      label: "Indexed",
      detail: `${c.stats.chunks} chunk(s) across ${c.stats.sources} source(s) indexed and grounding answers.`,
    };
  return {
    tone: "idle",
    label: "Empty",
    detail: "Corpus is empty — ingest sources to ground answers with citations.",
  };
}

export function RecoveryCenterView() {
  const liveErrors = useModuleHealth();
  const [ollama, setOllama] = useState<OllamaDiagnostics | null>(null);
  const [corpus, setCorpus] = useState<CorpusHealthResult | null>(null);
  const [loading, setLoading] = useState(false);

  const errorById = useMemo(() => {
    const m = new Map<string, ModuleErrorRecord>();
    for (const e of liveErrors) m.set(e.moduleId, e);
    return m;
  }, [liveErrors]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [diag, health] = await Promise.all([
        fetchOllamaDiagnostics(API_BASE),
        getCorpusHealth(API_BASE),
      ]);
      setOllama(diag);
      setCorpus(health);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const attention = liveErrors.length;
  const corpusReachable = corpus == null ? null : corpus.ok;
  const overall = computeOverallStatus({ errorCount: attention, corpusReachable });
  const overallTone: Tone = overall.tone === "checking" ? "idle" : overall.tone;

  const copyReport = useCallback(() => {
    const lines: string[] = [
      "HMG NEWSROOM — SYSTEM HEALTH REPORT",
      `Generated: ${new Date().toISOString()}`,
      "",
      `Overall: ${overall.headline}`,
      "",
      `Local brain (Ollama): ${ollama ? `${ollama.status} — ${ollama.note}` : "checking"}`,
      `Corpus: ${corpus ? (corpus.ok ? `${corpus.stats.chunks} chunks / ${corpus.stats.sources} sources` : corpus.error) : "checking"}`,
      "",
      "Modules:",
    ];
    for (const m of RECOVERY_MODULES) {
      const err = errorById.get(m.id);
      lines.push(
        `  - ${m.name}: ${err ? `ERROR (${err.count}×) — ${err.message}` : "operational"}`,
      );
    }
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => toast.success("Health report copied"))
      .catch(() => toast.error("Copy failed"));
  }, [overall.headline, ollama, corpus, errorById]);

  const otherErrors = liveErrors.filter((e) => !getModuleMeta(e.moduleId));

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      data-testid="recovery-center-view"
    >
      {/* Overall banner */}
      <div
        className={`rounded-2xl border p-4 ${
          overallTone === "ok"
            ? "border-emerald-500/40 bg-emerald-500/[0.06]"
            : overallTone === "warn"
              ? "border-amber-500/40 bg-amber-500/[0.06]"
              : "border-border/50 bg-card/40"
        }`}
        data-testid="recovery-overall"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              overallTone === "ok"
                ? "bg-emerald-500/15 text-emerald-400"
                : overallTone === "warn"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-muted/40 text-muted-foreground"
            }`}
          >
            {overallTone === "ok" ? (
              <ShieldCheck className="h-5 w-5" />
            ) : overallTone === "warn" ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <RefreshCw className="h-5 w-5 animate-spin" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-black tracking-tight">
              {overall.headline}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Live status across editorial, media, AI and publishing. Nothing
              here is faked — a module is healthy until something real fails.
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            data-testid="recovery-refresh"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-[11px] font-bold transition-colors hover:bg-foreground/5 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh checks
          </button>
          <button
            type="button"
            onClick={copyReport}
            data-testid="recovery-copy-report"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-[11px] font-bold transition-colors hover:bg-foreground/5"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy report
          </button>
          {attention > 0 && (
            <button
              type="button"
              onClick={() => {
                clearAllModuleErrors();
                toast.success("Cleared all flagged errors");
              }}
              data-testid="recovery-clear-all"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-1.5 text-[11px] font-bold transition-colors hover:bg-foreground/5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Module cards */}
      <div className="space-y-3">
        {RECOVERY_MODULES.map((m) => {
          const err = errorById.get(m.id);

          if (m.id === "havenai") {
            const ot = ollamaTone(ollama);
            return (
              <StatusCard
                key={m.id}
                testId={`recovery-module-${m.id}`}
                name={m.name}
                blurb={m.blurb}
                tone={err ? "down" : ot.tone}
                label={err ? "Error" : ot.label}
                detail={
                  ollama
                    ? ollama.note
                    : "Checking the owned-intelligence router status…"
                }
                error={err}
                nextFix={m.nextFix}
                onRetry={err ? () => clearModuleError(m.id) : undefined}
              />
            );
          }

          if (m.id === "corpus") {
            const ct = corpusTone(corpus);
            return (
              <StatusCard
                key={m.id}
                testId={`recovery-module-${m.id}`}
                name={m.name}
                blurb={m.blurb}
                tone={err ? "down" : ct.tone}
                label={err ? "Error" : ct.label}
                detail={ct.detail}
                error={err}
                nextFix={m.nextFix}
                onRetry={err ? () => clearModuleError(m.id) : undefined}
              />
            );
          }

          return (
            <StatusCard
              key={m.id}
              testId={`recovery-module-${m.id}`}
              name={m.name}
              blurb={m.blurb}
              tone={err ? "down" : "ok"}
              label={err ? "Needs attention" : "Operational"}
              detail={
                err
                  ? "This module reported a problem on its last use. Your work is preserved — clear and retry below."
                  : "Running normally. No errors reported this session."
              }
              error={err}
              nextFix={m.nextFix}
              onRetry={err ? () => clearModuleError(m.id) : undefined}
            />
          );
        })}

        {otherErrors.map((e) => (
          <StatusCard
            key={e.moduleId}
            testId={`recovery-other-${e.moduleId}`}
            name={String(e.moduleId)}
            blurb="Other module"
            tone="down"
            label="Error"
            detail="This area reported a problem. Clear and retry below."
            error={e}
            nextFix="Retry the action. If it persists, reload the app — your saved drafts are preserved."
            onRetry={() => clearModuleError(e.moduleId)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 px-1 pt-1 pb-6 text-[10px] text-muted-foreground">
        <Activity className="h-3 w-3" />
        System Health monitors crashes app-wide and surfaces honest recovery
        steps. It never blocks generation or publishing.
      </div>
    </div>
  );
}
