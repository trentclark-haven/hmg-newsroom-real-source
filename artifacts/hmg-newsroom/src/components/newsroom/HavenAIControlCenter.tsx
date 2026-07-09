import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CircuitBoard,
  Copy,
  Database,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  buildLaneDiagnostics,
  buildLaneStatuses,
  deriveOllamaError,
  fetchOllamaDiagnostics,
  applyOllamaToggle,
  applyPaidToggle,
  getCorpusHealth,
  isLaneChecking,
  OLLAMA_UNREACHABLE_MSG,
  runCorpusRecheck,
  runFullRefresh,
  runOllamaRecheck,
  shouldShowOllamaRetry,
  useZeroPaidSettings,
  type ControlCenterState,
  type CorpusHealthResult,
  type HavenLaneHealth,
  type HavenLaneStatus,
  type LaneTruthState,
  type OllamaDiagnostics,
} from "@/lib/hmg/haven-ai";

const API_BASE = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");

const WIRED_MODULES: { name: string; detail: string }[] = [
  { name: "Maximillion Console", detail: "Lane-priority engine + corpus grounding" },
  { name: "Editorial (Quick)", detail: "Corpus grounding + visible citations" },
  { name: "Breaking (Pack)", detail: "Corpus source recall + citations" },
  { name: "SEO Master", detail: "Related-stories grounding + citations" },
];

// One plain-English status per lane, derived from the honest health + truth
// signals so the Founder never sees a contradictory "AVAILABLE + BLOCKED"
// combo. The detailed Why / Unlock / Founder action fields below still carry
// the full technical truth — this badge just summarizes it in plain words.
const PLAIN_TONE = {
  ready: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  usable: "text-sky-400 border-sky-500/40 bg-sky-500/10",
  off: "text-zinc-300 border-zinc-600/40 bg-zinc-700/20",
  attention: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  blocked: "text-rose-400 border-rose-500/40 bg-rose-500/10",
} as const;

function plainLaneStatus(
  health: HavenLaneHealth,
  opts: { truth?: LaneTruthState; hint?: string } = {},
): { label: string; tone: string } {
  const hint = (opts.hint ?? "").toLowerCase();
  const signIn =
    hint.includes("sign in") ||
    hint.includes("sign-in") ||
    hint.includes("log in") ||
    hint.includes("not signed in") ||
    hint.includes("auth-gated") ||
    hint.includes("unauthorized") ||
    hint.includes("401") ||
    hint.includes("403");
  const connection =
    hint.includes("connect") ||
    hint.includes("reach") ||
    hint.includes("unreachable") ||
    hint.includes("network") ||
    hint.includes("offline") ||
    hint.includes("timeout") ||
    hint.includes("could not") ||
    hint.includes("couldn't");
  // Any non-clean signal on an otherwise "available" lane must downgrade the
  // badge away from READY — honesty rule: never claim working when degraded.
  const degraded =
    hint.includes("error") ||
    hint.includes("failed") ||
    hint.includes("empty") ||
    hint.includes("ingest") ||
    hint.includes("no chunks");
  switch (health) {
    case "active":
      return { label: "READY", tone: PLAIN_TONE.ready };
    case "available":
      if (signIn) return { label: "SIGN-IN REQUIRED", tone: PLAIN_TONE.usable };
      if (opts.truth === "BLOCKED" || connection || degraded)
        return { label: "DEGRADED BUT USABLE", tone: PLAIN_TONE.usable };
      return { label: "READY", tone: PLAIN_TONE.ready };
    case "fallback":
      return { label: "DEGRADED BUT USABLE", tone: PLAIN_TONE.usable };
    case "off":
      return { label: "OFF BY CHOICE", tone: PLAIN_TONE.off };
    case "config-needed":
      if (signIn) return { label: "SIGN-IN REQUIRED", tone: PLAIN_TONE.attention };
      if (opts.truth === "FUTURE")
        return { label: "NOT CONFIGURED", tone: PLAIN_TONE.off };
      return { label: "CONNECTION NEEDED", tone: PLAIN_TONE.attention };
    case "blocked":
      if (opts.truth === "FUTURE")
        return { label: "NOT CONFIGURED", tone: PLAIN_TONE.off };
      if (signIn) return { label: "SIGN-IN REQUIRED", tone: PLAIN_TONE.attention };
      if (connection)
        return { label: "CONNECTION NEEDED", tone: PLAIN_TONE.attention };
      return { label: "BLOCKED — ACTION REQUIRED", tone: PLAIN_TONE.blocked };
    default:
      return { label: "READY", tone: PLAIN_TONE.ready };
  }
}

const HEALTH_LABEL: Record<HavenLaneHealth, string> = {
  active: "ACTIVE",
  available: "AVAILABLE",
  off: "OFF",
  "config-needed": "CONFIG NEEDED",
  blocked: "BLOCKED",
  fallback: "FALLBACK",
};

function copy(text: string, label: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error("Copy failed"));
}

export function HavenAIControlCenter() {
  const { settings, setPaidEnabled, setOllamaEnabled } = useZeroPaidSettings();
  const [ollama, setOllama] = useState<OllamaDiagnostics | null>(null);
  const [corpus, setCorpus] = useState<CorpusHealthResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Latest state mirror so the refresh callbacks can preserve prior state on an
  // unexpected fetch failure without listing state in their dependency arrays —
  // keeping their identity stable so the mount effect can't loop.
  const stateRef = useRef<ControlCenterState>({
    ollama: null,
    corpus: null,
    ollamaError: null,
  });
  useEffect(() => {
    stateRef.current = { ollama, corpus, ollamaError };
  }, [ollama, corpus, ollamaError]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await runFullRefresh({
        fetchDiagnostics: () => fetchOllamaDiagnostics(API_BASE),
        fetchCorpus: () => getCorpusHealth(API_BASE),
        prev: stateRef.current,
      });
      setOllama(next.ollama);
      setCorpus(next.corpus);
      setOllamaError(next.ollamaError);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Re-check only the remote local-model lane. Fired the moment the Founder
   * enables the Ollama lane so the card reflects real remote health
   * (remote-ready / config-needed / blocked) without waiting for a manual
   * refresh. Honest by design — never fabricates a status, no paid calls.
   */
  const refreshOllama = useCallback(async () => {
    setLoading(true);
    try {
      const next = await runOllamaRecheck({
        fetchDiagnostics: () => fetchOllamaDiagnostics(API_BASE),
        prev: stateRef.current,
      });
      setOllama(next.ollama);
      setOllamaError(next.ollamaError);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Re-check only the corpus lane. Mirrors {@link refreshOllama} so the corpus
   * error/unreachable note can recover with one tap instead of forcing a global
   * Refresh. Honest by design — getCorpusHealth never throws and a successful
   * check (corpus.ok === true) clears the rose error note automatically.
   */
  const refreshCorpus = useCallback(async () => {
    setLoading(true);
    try {
      const next = await runCorpusRecheck({
        fetchCorpus: () => getCorpusHealth(API_BASE),
        prev: stateRef.current,
      });
      setCorpus(next.corpus);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleOllama = useCallback(() => {
    const next = !settings.ollamaEnabled;
    setOllamaEnabled(next);
    applyOllamaToggle({
      enabling: next,
      recheckOllama: () => void refreshOllama(),
      recheckCorpus: () => void refreshCorpus(),
    });
  }, [
    settings.ollamaEnabled,
    setOllamaEnabled,
    refreshOllama,
    refreshCorpus,
  ]);

  const handleTogglePaid = useCallback(() => {
    const next = !settings.paidEnabled;
    setPaidEnabled(next);
    applyPaidToggle({
      enabling: next,
      recheckOllama: () => void refreshOllama(),
      recheckCorpus: () => void refreshCorpus(),
    });
  }, [
    settings.paidEnabled,
    setPaidEnabled,
    refreshOllama,
    refreshCorpus,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const corpusReady = corpus?.ok === true && corpus.stats.chunks > 0;
  const corpusNote = corpus
    ? corpus.ok
      ? corpus.stats.chunks > 0
        ? `${corpus.stats.chunks} chunk(s) across ${corpus.stats.sources} source(s) indexed.`
        : "Corpus is empty — ingest sources to ground answers."
      : corpus.error
    : "Checking corpus…";

  const lanes: HavenLaneStatus[] = useMemo(
    () =>
      buildLaneStatuses({
        corpusReady,
        corpusNote,
        ollamaHealth: ollama?.status ?? "unknown",
        ollamaNote: ollama?.note,
        ollamaEnabled: settings.ollamaEnabled,
        paidEnabled: settings.paidEnabled,
        activeLane: null,
      }),
    [corpusReady, corpusNote, ollama, settings.ollamaEnabled, settings.paidEnabled],
  );

  const diagnostics = useMemo(
    () =>
      buildLaneDiagnostics({
        lanes,
        corpus,
        ollama,
        ollamaEnabled: settings.ollamaEnabled,
        paidEnabled: settings.paidEnabled,
      }),
    [lanes, corpus, ollama, settings.ollamaEnabled, settings.paidEnabled],
  );

  const blockers = useMemo(() => {
    const out: string[] = [];
    if (ollama && ollama.status !== "remote-ready") {
      out.push(`Ollama lane: ${ollama.note}`);
    }
    if (corpus && corpus.ok === false) {
      out.push(`Corpus: ${corpus.error}`);
    } else if (corpus?.ok && corpus.stats.chunks === 0) {
      out.push("Corpus is empty — ingest sources in Knowledge Corpus to ground answers.");
    }
    return out;
  }, [ollama, corpus]);

  const statusReport = useMemo(() => {
    const lines = [
      "HAVEN AI CONTROL CENTER — STATUS",
      `Created: ${new Date().toISOString()}`,
      "",
      "LANES (priority order):",
      ...lanes.map(
        (l) => `  [${HEALTH_LABEL[l.health]}] ${l.label} — ${l.note}`,
      ),
      "",
      "AI LANE DIAGNOSTICS:",
      ...diagnostics.flatMap((d) => [
        `  ${d.label} — TRUTH: ${d.truth} / STATUS: ${HEALTH_LABEL[d.health]}`,
        `    Why: ${d.why}`,
        `    Unlock: ${d.unlock}`,
        `    Founder action: ${d.founderAction}`,
        `    Safe fallback: ${d.fallback}`,
      ]),
      `  Last checked: ${lastChecked ? lastChecked.toISOString() : "never"}`,
      "",
      `Paid provider: ${settings.paidEnabled ? "ENABLED (accelerator)" : "OFF (zero-paid default)"}`,
      `Ollama lane: ${settings.ollamaEnabled ? "enabled" : "disabled"} / status ${ollama?.status ?? "unknown"}`,
      corpus?.ok
        ? `Corpus: ${corpus.stats.chunks} chunks, ${corpus.stats.sources} sources, ${corpus.stats.totalChars} chars`
        : `Corpus: ${corpus?.error ?? "unknown"}`,
      "",
      "WIRED MODULES:",
      ...WIRED_MODULES.map((m) => `  - ${m.name}: ${m.detail}`),
      "",
      blockers.length ? "BLOCKERS:" : "BLOCKERS: none",
      ...blockers.map((b) => `  - ${b}`),
    ];
    return lines.join("\n");
  }, [lanes, diagnostics, lastChecked, settings, ollama, corpus, blockers]);

  return (
    <div
      className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-6 overflow-y-auto"
      data-testid="havenai-control-center"
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "#7C3AED", color: "#fff" }}
        >
          <Brain className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-black tracking-tight leading-none">
            Haven AI Control Center
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            Owned-intelligence status — zero-paid by default
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          disabled={loading}
          data-testid="havenai-refresh"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Lane priority */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <CircuitBoard className="h-4 w-4" />
          Router lanes (priority order)
        </div>
        {lanes.map((lane) => {
          const checking = isLaneChecking(lane.id, loading);
          const laneDiag = diagnostics.find((x) => x.id === lane.id);
          const laneStatus = plainLaneStatus(lane.health, {
            truth: laneDiag?.truth,
            hint: `${laneDiag?.founderAction ?? ""} ${laneDiag?.why ?? ""} ${lane.note}`,
          });
          return (
            <div
              key={lane.id}
              data-testid={`havenai-lane-${lane.id}`}
              className="rounded-lg border border-border/60 bg-secondary/20 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground">
                  #{lane.priority}
                </span>
                <span className="text-sm font-semibold text-foreground">{lane.label}</span>
                {lane.zeroPaid && (
                  <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 px-1.5 py-0.5 text-[10px] text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    zero-paid
                  </span>
                )}
                {checking ? (
                  <span
                    data-testid={`havenai-lane-${lane.id}-checking`}
                    className="ml-auto inline-flex items-center gap-1 rounded border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-400"
                  >
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    CHECKING…
                  </span>
                ) : (
                  <span
                    className={`ml-auto rounded border px-2 py-0.5 text-[10px] font-bold ${laneStatus.tone}`}
                  >
                    {laneStatus.label}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                {checking
                  ? lane.id === "local-corpus"
                    ? "Checking corpus…"
                    : "Checking remote model…"
                  : lane.note}
              </p>
              {shouldShowOllamaRetry({ laneId: lane.id, ollamaError, checking }) && (
                <div
                  data-testid="havenai-lane-ollama-error"
                  className="mt-1.5 flex items-start gap-1.5 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1.5 text-[11px] font-medium leading-snug text-rose-300"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1">{ollamaError}</span>
                  <button
                    type="button"
                    onClick={() => void refreshOllama()}
                    disabled={checking}
                    data-testid="havenai-lane-ollama-retry"
                    className="ml-1 inline-flex shrink-0 items-center gap-1 rounded border border-rose-400/50 px-1.5 py-0.5 text-[10px] font-bold text-rose-200 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Try again
                  </button>
                </div>
              )}
              {lane.id === "local-corpus" && corpus?.ok === false && !checking && (
                <div
                  data-testid="havenai-lane-corpus-error"
                  className="mt-1.5 flex items-start gap-1.5 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1.5 text-[11px] font-medium leading-snug text-rose-300"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1">{corpus.error}</span>
                  <button
                    type="button"
                    onClick={() => void refreshCorpus()}
                    disabled={checking}
                    data-testid="havenai-lane-corpus-retry"
                    className="ml-1 inline-flex shrink-0 items-center gap-1 rounded border border-rose-400/50 px-1.5 py-0.5 text-[10px] font-bold text-rose-200 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Try again
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* AI Lane Diagnostics — founder-readable truth table */}
      <section className="mt-5 space-y-2" data-testid="havenai-diagnostics">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          AI Lane Diagnostics
          <span className="ml-auto font-normal normal-case text-[10px] text-muted-foreground">
            Last checked:{" "}
            <span data-testid="havenai-diag-lastchecked">
              {lastChecked ? lastChecked.toLocaleTimeString() : "—"}
            </span>
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Every lane blocker is proven below as correct security, a recoverable
          connection issue, a disabled optional lane, or a real bug — never hidden,
          never faked.
        </p>
        {diagnostics.map((d) => {
          const retry =
            d.id === "ollama"
              ? refreshOllama
              : d.id === "local-corpus"
                ? refreshCorpus
                : null;
          const ds = plainLaneStatus(d.health, {
            truth: d.truth,
            hint: `${d.founderAction} ${d.why}`,
          });
          return (
            <div
              key={d.id}
              data-testid={`havenai-diag-${d.id}`}
              className="rounded-lg border border-border/60 bg-secondary/20 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {d.label}
                </span>
                <span
                  data-testid={`havenai-diag-${d.id}-truth`}
                  className={`rounded border px-2 py-0.5 text-[10px] font-bold ${ds.tone}`}
                >
                  {ds.label}
                </span>
                {d.canRetry && retry && (
                  <button
                    type="button"
                    onClick={() => void retry()}
                    disabled={loading}
                    data-testid={`havenai-diag-${d.id}-retry`}
                    className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-bold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                    Try again
                  </button>
                )}
              </div>
              <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                <DiagField label="Why" value={d.why} />
                <DiagField label="What unlocks it" value={d.unlock} />
                <DiagField label="Founder action" value={d.founderAction} />
                <DiagField label="Safe fallback" value={d.fallback} />
              </dl>
            </div>
          );
        })}
      </section>

      {/* Lane toggles */}
      <section className="mt-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <ServerCog className="h-4 w-4" />
          Lane controls
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleToggleOllama}
            data-testid="havenai-toggle-ollama"
            className="rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors"
            style={{
              background: settings.ollamaEnabled ? "#0EA5E9" : "transparent",
              color: settings.ollamaEnabled ? "#fff" : "hsl(var(--muted-foreground))",
              borderColor: settings.ollamaEnabled ? "#0EA5E9" : "hsl(var(--border))",
            }}
          >
            Ollama lane {settings.ollamaEnabled ? "ON" : "OFF"}
          </button>
          <button
            onClick={handleTogglePaid}
            data-testid="havenai-toggle-paid"
            className="rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors"
            style={{
              background: settings.paidEnabled ? "#F59E0B" : "transparent",
              color: settings.paidEnabled ? "#000" : "hsl(var(--muted-foreground))",
              borderColor: settings.paidEnabled ? "#F59E0B" : "hsl(var(--border))",
            }}
          >
            Paid provider {settings.paidEnabled ? "ON" : "OFF (default)"}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Paid is an optional accelerator. Default is OFF — the system runs on the local brain,
          corpus, and Ollama at zero paid cost.
        </p>
      </section>

      {/* Corpus stats */}
      <section className="mt-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Database className="h-4 w-4" />
          Corpus index
        </div>
        <div
          data-testid="havenai-corpus-stats"
          className="rounded-lg border border-border/60 bg-secondary/20 p-3 text-[11px] text-muted-foreground"
        >
          {corpus?.ok ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Sources" value={corpus.stats.sources} />
              <Stat label="Chunks" value={corpus.stats.chunks} />
              <Stat label="Characters" value={corpus.stats.totalChars} />
              <Stat label="Quarantined" value={corpus.stats.quarantined} />
            </div>
          ) : (
            <p>{corpus?.error ?? "Checking corpus…"}</p>
          )}
        </div>
      </section>

      {/* Wired modules */}
      <section className="mt-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          Modules wired to owned intelligence
        </div>
        <ul className="space-y-1.5">
          {WIRED_MODULES.map((m) => (
            <li
              key={m.name}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-[11px]"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold text-foreground">{m.name}</span>
              <span className="text-muted-foreground">— {m.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Blockers */}
      {blockers.length > 0 && (
        <section className="mt-5 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Honest blockers
          </div>
          <ul
            data-testid="havenai-blockers"
            className="space-y-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] text-amber-200/90"
          >
            {blockers.map((b, i) => (
              <li key={i}>• {b}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Copy actions */}
      <section className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => copy(statusReport, "Status report")}
          data-testid="havenai-copy-status"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy status report
        </button>
        {ollama && (
          <button
            onClick={() => copy(JSON.stringify(ollama, null, 2), "Ollama diagnostics")}
            data-testid="havenai-copy-ollama"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy Ollama diagnostics
          </button>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border/40 bg-background/40 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-foreground">{value.toLocaleString()}</div>
    </div>
  );
}

function DiagField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-[11px] leading-snug text-foreground/90">{value}</dd>
    </div>
  );
}
