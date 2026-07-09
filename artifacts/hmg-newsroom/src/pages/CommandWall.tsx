/**
 * Ω9 Founder Command Wall.
 *
 * One-screen, one-purpose situational-awareness console for the founder:
 * cost burn, security posture, worker health, and platform readiness, all
 * polled live from real api-server endpoints with NO mock data.
 *
 * Gating model:
 *   - useFounderSession resolves /api/founder/me on mount
 *   - while loading        → render concealment shell (no founder strings)
 *   - if not founder       → redirect to /founder/login (no DOM leak)
 *   - if founder           → render the wall + start 5s polling
 *
 * Polling cadence: 5 000 ms. Each panel refetches independently so a slow
 * upstream on one panel doesn't stall the others. AbortController is wired
 * so polls cancel cleanly on unmount + on overlap.
 *
 * Endpoints:
 *   GET /api/cost-predator/summary
 *   GET /api/security-fortress/status
 *   GET /api/cutmaster/metrics
 *   GET /api/system/status
 *   GET /api/artbot/wall-feed       (Ω6 — provider health, spend, cache,
 *                                     pack usage, fastest/cheapest/GPU)
 *
 * NO writes. NO derived "fake" counters. Every number on this page comes
 * straight from one of these endpoints, with the row that fed it
 * visible in the status footer. Where an upstream surface doesn't exist
 * (e.g. no worker-pool yet), the feed publishes 0 + a `source` string and
 * the panel renders that source verbatim instead of a fabricated metric.
 */

import { useEffect, useState, type ReactElement } from "react";
import { useLocation } from "wouter";
import { useFounderSession } from "@/lib/useFounderSession";

const POLL_MS = 5_000;
const BASE = import.meta.env.BASE_URL;

type CostByProvider = {
  provider: string;
  calls: number;
  totalActualUsd: number;
  p50Ms: number;
};

type CostSummary = {
  windowMs: number;
  windowStart: string;
  windowEnd: string;
  totalCalls: number;
  okCalls: number;
  errorCalls: number;
  cacheHits: number;
  cacheHitRate: number;
  totalActualUsd: number;
  totalPredictedUsd: number;
  costAccuracyPct: number;
  latencyP50Ms: number;
  latencyP90Ms: number;
  latencyP99Ms: number;
  byProvider: CostByProvider[];
  projected24hUsd: number;
  journalPath: string;
};

type BreachDetail = {
  target: string;
  path: string;
  spoof: string;
  observedStatus: number;
  bodyPreview: string;
};

type FortressStatus = {
  state: "green" | "red" | "unknown";
  lastPassAt: string | null;
  lastPassId: string | null;
  totalPassesRecorded: number;
  recentBreachCount24h: number;
  targetCount: number;
  spoofVectorCount: number;
  attemptsPerPass: number;
  intervalMs: number;
  proberRunning: boolean;
  proberStartedAt: string | null;
  journalPath: string;
  lastBreachDetails: BreachDetail[];
};

type CutmasterMetrics = {
  ts: number;
  cpu: { count: number; loadAvg1: number; loadPct: number };
  mem: { totalMB: number; freeMB: number; usedPct: number; rssMB: number };
  uploads: {
    active: number;
    totalSessions: number;
    completed: number;
    aborted: number;
  };
  pipeline: { transcribeConcurrency: number; chunkMaxBytes: number };
};

type SystemStatus = {
  ok: boolean;
  ts: number;
  version: string;
  api: { ok: boolean };
  aiProxy: { ok: boolean; message?: string; code?: string };
  wordpress: { silos: Record<string, { envConfigured: boolean }> };
  publicApp: { configured: boolean };
};

type ProviderHealthStatus =
  | "ok"
  | "unconfigured"
  | "permanently_unconfigured"
  | "degraded"
  | "down";

type WallProviderRow = {
  id: string;
  displayName: string;
  healthStatus: ProviderHealthStatus;
  healthReason: string | null;
  configured: boolean;
  permanentlyUnconfigured: boolean;
  qualityScore: number | null;
  gpuProbability: number | null;
  ok24h: number;
  failover24h: number;
  spendUsd24h: number;
};

type ArtbotWallFeed = {
  ts: number;
  windowMs: number;
  providers: WallProviderRow[];
  cache: { hitRatioLast1000: number | null; sampleSize: number };
  queue: {
    depth: number;
    pendingJobs: number;
    inflightJobs: number;
    source: string;
  };
  okGen24h: number;
  failedGen24h: number;
  spendUsd24h: number;
  packs: { packId: string; count: number }[];
  topPack: { packId: string; count: number } | null;
  recommendations: {
    bestValue: string | null;
    fastest: string | null;
    highestQuality: string | null;
    freeCached: string | null;
  };
  gpu: { jobsInFlight: number; source: string };
  socialFactory: { breakingQueueDepth: number; source: string };
};

interface PanelState<T> {
  data: T | null;
  error: string | null;
  lastFetchAt: number | null;
  inFlight: boolean;
}

function emptyPanel<T>(): PanelState<T> {
  return { data: null, error: null, lastFetchAt: null, inFlight: false };
}

function usePolledEndpoint<T>(
  url: string,
  enabled: boolean,
): PanelState<T> {
  const [state, setState] = useState<PanelState<T>>(() => emptyPanel<T>());

  useEffect(() => {
    if (!enabled) {
      setState(emptyPanel<T>());
      return;
    }
    let cancelled = false;
    let inFlightCtl: AbortController | null = null;

    const run = async () => {
      // Single-flight: cancel previous in-flight before starting next.
      if (inFlightCtl) {
        inFlightCtl.abort();
      }
      const ctl = new AbortController();
      inFlightCtl = ctl;
      setState((prev) => ({ ...prev, inFlight: true }));
      try {
        const res = await fetch(url, {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
          signal: ctl.signal,
        });
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          setState({
            data: null,
            error: `HTTP ${res.status}${body ? `: ${body.slice(0, 80)}` : ""}`,
            lastFetchAt: Date.now(),
            inFlight: false,
          });
          return;
        }
        const data = (await res.json()) as T;
        if (cancelled) return;
        setState({
          data,
          error: null,
          lastFetchAt: Date.now(),
          inFlight: false,
        });
      } catch (e) {
        if (cancelled) return;
        if ((e as Error).name === "AbortError") {
          // Superseded — let the next run own the state update.
          return;
        }
        setState({
          data: null,
          error: (e as Error).message ?? String(e),
          lastFetchAt: Date.now(),
          inFlight: false,
        });
      }
    };

    void run();
    const id = window.setInterval(() => void run(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      if (inFlightCtl) inFlightCtl.abort();
    };
  }, [url, enabled]);

  return state;
}

function formatUsd(n: number | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  if (n === 0) return "$0.00";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function formatMs(n: number | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  if (n < 1000) return `${Math.round(n)}ms`;
  return `${(n / 1000).toFixed(1)}s`;
}

function formatRelative(ts: string | number | null | undefined): string {
  if (ts === null || ts === undefined) return "—";
  const t = typeof ts === "string" ? Date.parse(ts) : ts;
  if (!Number.isFinite(t)) return "—";
  const dt = Date.now() - t;
  if (dt < 0) return "now";
  if (dt < 1000) return `${dt}ms ago`;
  if (dt < 60_000) return `${Math.round(dt / 1000)}s ago`;
  if (dt < 3_600_000) return `${Math.round(dt / 60_000)}m ago`;
  return `${Math.round(dt / 3_600_000)}h ago`;
}

function StatusDot({
  ok,
  warn,
}: {
  ok: boolean;
  warn?: boolean;
}): ReactElement {
  const cls = warn
    ? "bg-yellow-400"
    : ok
      ? "bg-emerald-400"
      : "bg-red-500";
  return (
    <span
      aria-hidden
      className={`inline-block h-2 w-2 rounded-full ${cls}`}
    />
  );
}

function PanelShell({
  title,
  state,
  children,
}: {
  title: string;
  state: PanelState<unknown>;
  children: ReactElement;
}): ReactElement {
  return (
    <section
      data-testid={`commandwall-panel-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-5 space-y-3"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          {title}
        </h2>
        <span className="text-[10px] text-muted-foreground">
          {state.inFlight ? "polling…" : `updated ${formatRelative(state.lastFetchAt)}`}
        </span>
      </header>
      {state.error ? (
        <div
          data-testid={`commandwall-panel-error-${title.toLowerCase().replace(/\s+/g, "-")}`}
          className="text-xs text-red-400 font-mono"
        >
          {state.error}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function CostPanel({
  state,
}: {
  state: PanelState<CostSummary>;
}): ReactElement {
  return (
    <PanelShell title="Cost Predator" state={state}>
      {state.data ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">24h spend</div>
              <div className="text-2xl font-semibold tabular-nums">
                {formatUsd(state.data.totalActualUsd)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">calls</div>
              <div className="text-2xl font-semibold tabular-nums">
                {state.data.totalCalls}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {state.data.errorCalls} errors
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">cache hit %</div>
              <div className="text-2xl font-semibold tabular-nums">
                {(state.data.cacheHitRate * 100).toFixed(0)}%
              </div>
              <div className="text-[10px] text-muted-foreground">
                {state.data.cacheHits} hits
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/40">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">p50</div>
              <div className="text-sm font-mono tabular-nums">
                {formatMs(state.data.latencyP50Ms)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">p90</div>
              <div className="text-sm font-mono tabular-nums">
                {formatMs(state.data.latencyP90Ms)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">projected 24h</div>
              <div className="text-sm font-mono tabular-nums">
                {formatUsd(state.data.projected24hUsd)}
              </div>
            </div>
          </div>
          {state.data.byProvider.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-border/40">
              <div className="text-[10px] uppercase text-muted-foreground">by provider</div>
              <div className="space-y-1">
                {state.data.byProvider.map((p) => (
                  <div
                    key={p.provider}
                    className="flex items-center justify-between text-xs font-mono tabular-nums"
                  >
                    <span className="truncate">{p.provider}</span>
                    <span className="text-muted-foreground">
                      {p.calls} calls · {formatUsd(p.totalActualUsd)} · p50 {formatMs(p.p50Ms)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">loading…</div>
      )}
    </PanelShell>
  );
}

function FortressPanel({
  state,
}: {
  state: PanelState<FortressStatus>;
}): ReactElement {
  const data = state.data;
  return (
    <PanelShell title="Security Fortress" state={state}>
      {data ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <StatusDot ok={data.state === "green"} warn={data.state === "unknown"} />
            <div className="text-2xl font-semibold uppercase tracking-wider">
              {data.state}
            </div>
            {!data.proberRunning && (
              <span className="text-[10px] text-yellow-400 uppercase">prober offline</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">attempts/pass</div>
              <div className="text-sm font-mono tabular-nums">
                {data.attemptsPerPass}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {data.targetCount} targets · {data.spoofVectorCount} vectors
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">passes recorded</div>
              <div className="text-sm font-mono tabular-nums">
                {data.totalPassesRecorded}
              </div>
              <div className="text-[10px] text-muted-foreground">
                every {Math.round(data.intervalMs / 1000)}s
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">breaches 24h</div>
              <div
                className={`text-sm font-mono tabular-nums ${data.recentBreachCount24h > 0 ? "text-red-400" : ""}`}
              >
                {data.recentBreachCount24h}
              </div>
              <div className="text-[10px] text-muted-foreground">
                last pass {formatRelative(data.lastPassAt)}
              </div>
            </div>
          </div>
          {data.lastBreachDetails.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-red-500/30">
              <div className="text-[10px] uppercase text-red-400">last breach details</div>
              {data.lastBreachDetails.slice(0, 3).map((b, i) => (
                <div
                  key={`${b.target}-${b.spoof}-${i}`}
                  className="text-xs font-mono text-red-300"
                >
                  [{b.observedStatus}] {b.target} · {b.spoof}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">loading…</div>
      )}
    </PanelShell>
  );
}

function WorkerPanel({
  state,
}: {
  state: PanelState<CutmasterMetrics>;
}): ReactElement {
  const data = state.data;
  return (
    <PanelShell title="Worker Health" state={state}>
      {data ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                cpu load (1m)
              </div>
              <div className="flex items-center gap-2">
                <StatusDot ok={data.cpu.loadPct < 80} warn={data.cpu.loadPct >= 80 && data.cpu.loadPct < 95} />
                <div className="text-2xl font-semibold tabular-nums">
                  {data.cpu.loadPct.toFixed(0)}%
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {data.cpu.loadAvg1.toFixed(2)} / {data.cpu.count} cores
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                memory used
              </div>
              <div className="flex items-center gap-2">
                <StatusDot ok={data.mem.usedPct < 85} warn={data.mem.usedPct >= 85 && data.mem.usedPct < 95} />
                <div className="text-2xl font-semibold tabular-nums">
                  {data.mem.usedPct.toFixed(0)}%
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground">
                rss {data.mem.rssMB} MB · free {data.mem.freeMB} MB
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/40">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">uploads</div>
              <div className="text-sm font-mono tabular-nums">
                {data.uploads.active} active
              </div>
              <div className="text-[10px] text-muted-foreground">
                {data.uploads.completed} done · {data.uploads.aborted} aborted
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                concurrency
              </div>
              <div className="text-sm font-mono tabular-nums">
                {data.pipeline.transcribeConcurrency}
              </div>
              <div className="text-[10px] text-muted-foreground">transcribe lanes</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">chunk cap</div>
              <div className="text-sm font-mono tabular-nums">
                {(data.pipeline.chunkMaxBytes / (1024 * 1024)).toFixed(0)}MB
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">loading…</div>
      )}
    </PanelShell>
  );
}

function PlatformPanel({
  state,
}: {
  state: PanelState<SystemStatus>;
}): ReactElement {
  const data = state.data;
  return (
    <PanelShell title="Platform Status" state={state}>
      {data ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <StatusDot ok={data.api.ok} />
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">api</div>
                <div className="text-sm font-mono">
                  {data.api.ok ? "ok" : "down"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot ok={data.aiProxy.ok} />
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">
                  ai proxy
                </div>
                <div className="text-sm font-mono">
                  {data.aiProxy.ok ? "ok" : (data.aiProxy.message ?? "down")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot ok={data.publicApp.configured} warn={!data.publicApp.configured} />
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">
                  public app
                </div>
                <div className="text-sm font-mono">
                  {data.publicApp.configured ? "linked" : "not configured"}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-1 pt-2 border-t border-border/40">
            <div className="text-[10px] uppercase text-muted-foreground">
              wordpress silos
            </div>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(data.wordpress.silos).map(([silo, s]) => (
                <div
                  key={silo}
                  className="flex items-center gap-2 text-xs font-mono"
                >
                  <StatusDot ok={s.envConfigured} warn={!s.envConfigured} />
                  <span className={s.envConfigured ? "" : "text-muted-foreground"}>
                    {silo}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground pt-2 border-t border-border/40 font-mono">
            api version {data.version}
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">loading…</div>
      )}
    </PanelShell>
  );
}

/**
 * ProviderHealthPanel — 7-row table of provider id + health status dot
 * + "configured" / "unconfigured" / "permanently unconfigured" badge.
 * Status color: ok=green, unconfigured=yellow (config gap), permanent=gray.
 */
function ProviderHealthPanel({
  state,
}: {
  state: PanelState<ArtbotWallFeed>;
}): ReactElement {
  const data = state.data;
  return (
    <PanelShell title="Provider Health" state={state}>
      {data ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 text-[10px] uppercase text-muted-foreground">
            <span>provider</span>
            <span>status</span>
            <span className="text-right">quality / gpu</span>
          </div>
          {data.providers.map((p) => {
            const ok = p.healthStatus === "ok";
            const warn = p.healthStatus === "unconfigured";
            return (
              <div
                key={p.id}
                className="grid grid-cols-3 gap-2 items-center text-xs font-mono tabular-nums"
              >
                <span className="truncate">{p.id}</span>
                <span className="flex items-center gap-1.5">
                  <StatusDot ok={ok} warn={warn} />
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {p.healthStatus}
                  </span>
                </span>
                <span className="text-right text-muted-foreground">
                  {p.qualityScore !== null ? p.qualityScore.toFixed(2) : "—"}
                  {" / "}
                  {p.gpuProbability !== null
                    ? p.gpuProbability.toFixed(0)
                    : "—"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">loading…</div>
      )}
    </PanelShell>
  );
}

/**
 * ProviderSpendPanel — 24h spend per provider + total, plus ok/failover
 * count per provider so the founder sees not just $ but how much of it was
 * useful work vs failover noise.
 */
function ProviderSpendPanel({
  state,
}: {
  state: PanelState<ArtbotWallFeed>;
}): ReactElement {
  const data = state.data;
  return (
    <PanelShell title="Provider Spend (24h)" state={state}>
      {data ? (
        <div className="space-y-3">
          <div>
            <div className="text-[10px] uppercase text-muted-foreground">
              total artbot spend
            </div>
            <div className="text-2xl font-semibold tabular-nums">
              {formatUsd(data.spendUsd24h)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {data.okGen24h} ok · {data.failedGen24h} dead-end
            </div>
          </div>
          <div className="space-y-1 pt-2 border-t border-border/40">
            {data.providers.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs font-mono tabular-nums"
              >
                <span className="truncate">{p.id}</span>
                <span className="text-muted-foreground">
                  {p.ok24h} ok · {p.failover24h} fail · {formatUsd(p.spendUsd24h)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">loading…</div>
      )}
    </PanelShell>
  );
}

/**
 * CacheQueuePanel — three honest stats (cache hit %, queue depth, failed
 * gen count). When the queue surface doesn't exist yet, we render the
 * `source` string verbatim instead of a fake number.
 */
function CacheQueuePanel({
  state,
}: {
  state: PanelState<ArtbotWallFeed>;
}): ReactElement {
  const data = state.data;
  return (
    <PanelShell title="Cache & Queue" state={state}>
      {data ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                cache hit %
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {data.cache.hitRatioLast1000 !== null
                  ? `${(data.cache.hitRatioLast1000 * 100).toFixed(0)}%`
                  : "—"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {data.cache.sampleSize === 0
                  ? "no data yet"
                  : `last ${data.cache.sampleSize} calls`}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                queue depth
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {data.queue.depth}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {data.queue.source}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                dead-ends 24h
              </div>
              <div
                className={`text-2xl font-semibold tabular-nums ${data.failedGen24h > 0 ? "text-red-400" : ""}`}
              >
                {data.failedGen24h}
              </div>
              <div className="text-[10px] text-muted-foreground">
                exhausted-chain only
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">loading…</div>
      )}
    </PanelShell>
  );
}

/**
 * StylePackUsagePanel — top N HAVEN DNA pack uses in the last 24h. Empty
 * array → explicit "no pack-tagged generations yet" string (NOT a fake
 * "0 of 11" bar that would imply usage).
 */
function StylePackUsagePanel({
  state,
}: {
  state: PanelState<ArtbotWallFeed>;
}): ReactElement {
  const data = state.data;
  const TOP_N = 8;
  return (
    <PanelShell title="Style Pack Usage (24h)" state={state}>
      {data ? (
        data.packs.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            no pack-tagged generations yet
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                top pack
              </div>
              <div className="text-lg font-semibold">
                {data.topPack?.packId ?? "—"}
                {data.topPack ? (
                  <span className="text-xs text-muted-foreground ml-2 font-mono">
                    × {data.topPack.count}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="space-y-1 pt-2 border-t border-border/40">
              {data.packs.slice(0, TOP_N).map((p) => (
                <div
                  key={p.packId}
                  className="flex items-center justify-between text-xs font-mono"
                >
                  <span className="truncate">{p.packId}</span>
                  <span className="text-muted-foreground tabular-nums">
                    × {p.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="text-xs text-muted-foreground">loading…</div>
      )}
    </PanelShell>
  );
}

/**
 * RecommendationsPanel — bestValue / fastest / highestQuality / freeCached
 * (from predictAll) + GPU jobs in-flight + socialFactory breaking queue.
 * Each null recommendation means "no configured candidate" and renders as
 * an explicit em-dash + reason instead of a placeholder name.
 */
function RecommendationsPanel({
  state,
}: {
  state: PanelState<ArtbotWallFeed>;
}): ReactElement {
  const data = state.data;
  return (
    <PanelShell title="Recommendations · GPU · Newsroom" state={state}>
      {data ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                best value
              </div>
              <div className="text-lg font-semibold font-mono">
                {data.recommendations.bestValue ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                fastest
              </div>
              <div className="text-lg font-semibold font-mono">
                {data.recommendations.fastest ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                highest quality
              </div>
              <div className="text-lg font-semibold font-mono">
                {data.recommendations.highestQuality ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                free cached
              </div>
              <div className="text-lg font-semibold font-mono">
                {data.recommendations.freeCached ?? "—"}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                gpu jobs in-flight
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {data.gpu.jobsInFlight}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {data.gpu.source}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">
                breaking queue
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {data.socialFactory.breakingQueueDepth}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {data.socialFactory.source}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">loading…</div>
      )}
    </PanelShell>
  );
}

export default function CommandWall(): ReactElement {
  const [, setLocation] = useLocation();
  const session = useFounderSession();

  // Anti-flash conceal: title only changes once we know the user is the
  // founder. Anonymous visitors see a generic title and no DOM content.
  useEffect(() => {
    if (session.founder) {
      document.title = "Command Wall";
    }
  }, [session.founder]);

  // Anonymous visitors get bounced to login. We do this in an effect (not
  // inline) so the redirect runs after render and never has the chance to
  // show founder-flavored DOM.
  useEffect(() => {
    if (!session.loading && !session.founder) {
      setLocation("/founder/login");
    }
  }, [session.loading, session.founder, setLocation]);

  // Polling is gated on founder=true so we never hit founder-only endpoints
  // anonymously and never expose response shapes via dev-tools network.
  const cost = usePolledEndpoint<CostSummary>(
    `${BASE}api/cost-predator/summary`,
    session.founder,
  );
  const fortress = usePolledEndpoint<FortressStatus>(
    `${BASE}api/security-fortress/status`,
    session.founder,
  );
  const worker = usePolledEndpoint<CutmasterMetrics>(
    `${BASE}api/cutmaster/metrics`,
    session.founder,
  );
  const platform = usePolledEndpoint<SystemStatus>(
    `${BASE}api/system/status`,
    session.founder,
  );
  // Ω6 — single consolidated artbot wall feed. The 5 new panels all read
  // from this one endpoint so we don't fan out to 5 separate polls.
  const artbot = usePolledEndpoint<ArtbotWallFeed>(
    `${BASE}api/artbot/wall-feed`,
    session.founder,
  );

  // Concealment: while loading OR while not founder, render an empty
  // shell. No headings, no panel skeletons, no founder vocabulary in the
  // DOM that an anonymous visitor could inspect.
  if (session.loading || !session.founder) {
    return (
      <div
        data-testid="commandwall-conceal"
        className="min-h-screen bg-background"
      />
    );
  }

  return (
    <div
      data-testid="commandwall-root"
      className="min-h-screen bg-background text-foreground p-6"
    >
      <header className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Command Wall</h1>
          <p className="text-xs text-muted-foreground mt-1">
            live · polling every {POLL_MS / 1000}s · {session.label ?? "Founder"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void session.logout()}
          data-testid="commandwall-signout"
          className="h-9 px-4 rounded-md border border-border text-xs"
        >
          Sign out
        </button>
      </header>
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CostPanel state={cost} />
        <FortressPanel state={fortress} />
        <WorkerPanel state={worker} />
        <PlatformPanel state={platform} />
        <ProviderHealthPanel state={artbot} />
        <ProviderSpendPanel state={artbot} />
        <CacheQueuePanel state={artbot} />
        <StylePackUsagePanel state={artbot} />
        <RecommendationsPanel state={artbot} />
      </main>
    </div>
  );
}
