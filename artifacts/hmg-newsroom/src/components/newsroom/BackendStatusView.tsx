import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  ClipboardCopy,
  ExternalLink,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { View } from "./MenuOverlay";

interface RouteSpec {
  path: string;
  method: "GET" | "POST";
  label: string;
  description: string;
  relatedView?: View;
  honestNote: string;
}

const ROUTES: RouteSpec[] = [
  {
    path: "/api/healthz",
    method: "GET",
    label: "API Health Check",
    description: "Core server heartbeat — confirms the Express backend is running.",
    relatedView: "recovery",
    honestNote: "This is the only route that should return 200 in local mode. Confirms server is alive.",
  },
  {
    path: "/api/wordpress/status",
    method: "GET",
    label: "WordPress Status",
    description: "Returns connection status for all 7 WordPress silos. Honest unconfigured state when no env vars are set.",
    relatedView: "wpconnections",
    honestNote: "Returns 200 with configured=false when WP env vars are not set — correct, not a bug.",
  },
  {
    path: "/api/public-app/status",
    method: "GET",
    label: "Public App Status",
    description: "Public-facing app connection status. Returns not-connected in local mode.",
    honestNote: "Returns 200 but connected=false. Provider hook pending.",
  },
  {
    path: "/api/ai/generate",
    method: "POST",
    label: "AI Content Generation",
    description: "Article, social, and newsletter generation. Route is live — needs an AI provider key to generate.",
    relatedView: "aicapability",
    honestNote: "Wire OPENAI_API_KEY or configure Ollama in Haven AI settings to activate generation.",
  },
  {
    path: "/api/ai/generate-image",
    method: "POST",
    label: "AI Image Generation",
    description: "Concept image generation. Route is live — needs an AI provider with image support.",
    relatedView: "artbot",
    honestNote: "WebArt uses this for concept visuals. Wire an image-capable AI provider to activate.",
  },
  {
    path: "/api/wordpress/publish",
    method: "POST",
    label: "WordPress Publish",
    description: "Direct WordPress publish endpoint. Manual transfer only in local mode.",
    relatedView: "wpconnections",
    honestNote: "Returns 400 when WP credentials are missing. Configure per-silo credentials in WP Connections to activate direct publish.",
  },
  {
    path: "/api/ai/capability",
    method: "GET",
    label: "AI Capability Route",
    description: "AI capability check endpoint. Route not yet registered in the server.",
    relatedView: "aicapability",
    honestNote: "Returns 404 — route not yet added to Express. Register when backend contract is ready.",
  },
  {
    path: "/api/max/outputs",
    method: "GET",
    label: "Max CRO Outputs Route",
    description: "Max revenue intelligence outputs endpoint. Route not yet registered.",
    relatedView: "sales",
    honestNote: "Returns 404 — not yet registered. Will surface Max decisions via API when wired.",
  },
  {
    path: "/api/queue/items",
    method: "GET",
    label: "Agent Queue Route",
    description: "Operator agent queue endpoint. Route not yet registered.",
    relatedView: "commandcenter",
    honestNote: "Returns 404 — not yet registered. Will expose inbox queue via API when wired.",
  },
  {
    path: "/api/storage/health",
    method: "GET",
    label: "Storage Health Route",
    description: "Server-side storage health check. Route not yet registered.",
    relatedView: "recovery",
    honestNote: "Returns 404 — not yet registered. localStorage health is tracked client-side only.",
  },
];

type RouteStatus =
  | "checking"
  | "connected"
  | "contract-ready"
  | "route-missing"
  | "not-reachable"
  | "local-fallback";

interface RouteResult {
  path: string;
  status: RouteStatus;
  httpCode?: number;
  checkedAt: number;
  honestNote?: string;
}

const STATUS_CONFIG: Record<
  RouteStatus,
  { label: string; cls: string; icon: typeof CheckCircle2 }
> = {
  checking: {
    label: "Checking...",
    cls: "bg-zinc-700/40 text-zinc-400 border-zinc-600/30",
    icon: CircleDashed,
  },
  connected: {
    label: "Connected",
    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
  },
  "contract-ready": {
    label: "Contract Ready",
    cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: ServerCog,
  },
  "route-missing": {
    label: "Route Missing",
    cls: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    icon: AlertTriangle,
  },
  "not-reachable": {
    label: "Not Reachable",
    cls: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    icon: XCircle,
  },
  "local-fallback": {
    label: "Local Fallback Active",
    cls: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    icon: ShieldCheck,
  },
};

function resolveStatus(httpCode: number, isError: boolean): RouteStatus {
  if (isError) return "not-reachable";
  if (httpCode === 200) return "connected";
  if (httpCode === 501) return "contract-ready";
  if (httpCode === 404) return "route-missing";
  return "not-reachable";
}

async function pingRoute(spec: RouteSpec): Promise<RouteResult> {
  try {
    const res = await fetch(spec.path, {
      method: spec.method,
      headers: { "Content-Type": "application/json" },
      body: spec.method === "POST" ? JSON.stringify({}) : undefined,
      signal: AbortSignal.timeout(5000),
    });
    return {
      path: spec.path,
      status: resolveStatus(res.status, false),
      httpCode: res.status,
      checkedAt: Date.now(),
      honestNote: spec.honestNote,
    };
  } catch {
    return {
      path: spec.path,
      status: "not-reachable",
      httpCode: undefined,
      checkedAt: Date.now(),
      honestNote: spec.honestNote,
    };
  }
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const AUTO_REFRESH_INTERVALS = [
  { label: "30s", ms: 30_000 },
  { label: "60s", ms: 60_000 },
  { label: "2min", ms: 120_000 },
] as const;
type AutoInterval = (typeof AUTO_REFRESH_INTERVALS)[number]["ms"];

export function BackendStatusView({
  onNavigate,
}: {
  onNavigate?: (v: View) => void;
} = {}) {
  const [results, setResults] = useState<Map<string, RouteResult>>(new Map());
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoInterval, setAutoInterval] = useState<AutoInterval>(60_000);

  const runChecks = useCallback(async () => {
    setRunning(true);
    const init = new Map<string, RouteResult>();
    for (const r of ROUTES) {
      init.set(r.path, {
        path: r.path,
        status: "checking",
        checkedAt: Date.now(),
        honestNote: r.honestNote,
      });
    }
    setResults(new Map(init));
    const checks = await Promise.all(ROUTES.map(pingRoute));
    const next = new Map<string, RouteResult>();
    for (const c of checks) next.set(c.path, c);
    setResults(next);
    setLastRun(Date.now());
    setRunning(false);
  }, []);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      void runChecks();
    }, autoInterval);
    return () => window.clearInterval(id);
  }, [autoRefresh, autoInterval, runChecks]);

  const copyReport = useCallback(() => {
    const lines: string[] = [
      "HMG Newsroom — Backend/API Readiness Report",
      `Generated: ${new Date().toISOString()}`,
      "",
      "Route Status:",
    ];
    for (const spec of ROUTES) {
      const r = results.get(spec.path);
      const status = r ? STATUS_CONFIG[r.status].label : "Unknown";
      const code = r?.httpCode !== undefined ? ` [HTTP ${r.httpCode}]` : "";
      lines.push(`  ${spec.method} ${spec.path} — ${status}${code}`);
      lines.push(`    ${spec.description}`);
    }
    const vals = [...results.values()];
    const connected = vals.filter((r) => r.status === "connected").length;
    const contractReady = vals.filter((r) => r.status === "contract-ready").length;
    const routeMissing = vals.filter((r) => r.status === "route-missing").length;
    const notReachable = vals.filter((r) => r.status === "not-reachable").length;
    lines.push("", "Summary:");
    lines.push(`  Connected: ${connected}`);
    lines.push(`  Contract Ready (501): ${contractReady}`);
    lines.push(`  Route Missing (404): ${routeMissing}`);
    lines.push(`  Not Reachable: ${notReachable}`);
    lines.push("", "Notes:");
    lines.push('  - "Contract Ready" means the OpenAPI contract is defined but no AI provider is wired.');
    lines.push('  - "Route Missing" means the Express route does not yet exist — add it when ready.');
    lines.push('  - "Not Reachable" means the server is down or the fetch timed out.');
    lines.push("  - All local-only features use localStorage and never show fake live status.");
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      toast.success("Backend readiness report copied");
    }).catch(() => {
      toast.error("Could not copy to clipboard");
    });
  }, [results]);

  const vals = [...results.values()];
  const connected = vals.filter((r) => r.status === "connected").length;
  const contractReady = vals.filter((r) => r.status === "contract-ready").length;
  const routeMissing = vals.filter((r) => r.status === "route-missing").length;
  const notReachable = vals.filter((r) => r.status === "not-reachable").length;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 lg:px-8 py-5 gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Backend / API Readiness</h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Live route ping · Honest status · No fake success
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Auto-refresh interval selector */}
          {autoRefresh && (
            <div className="flex items-center gap-1">
              {AUTO_REFRESH_INTERVALS.map(({ label, ms }) => (
                <button
                  key={ms}
                  type="button"
                  onClick={() => setAutoInterval(ms)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                    autoInterval === ms
                      ? "bg-sky-500/20 border-sky-400/60 text-sky-400"
                      : "border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {/* Auto-refresh toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh((v) => !v)}
            className={`h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors ${
              autoRefresh
                ? "bg-sky-500/20 border-sky-400/60 text-sky-400"
                : "border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            Auto {autoRefresh ? "On" : "Off"}
          </button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-[11px] h-8"
            onClick={copyReport}
            disabled={running || results.size === 0}
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
            Copy Report
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-[11px] h-8"
            onClick={() => void runChecks()}
            disabled={running}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
            {running ? "Checking..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Honest disclaimer */}
      <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.06] px-4 py-3 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <div className="text-[12.5px] text-sky-200/80 leading-relaxed">
          <strong className="text-sky-300">No fake success.</strong> Each row is a live fetch to the Express API server. "Contract Ready" means the OpenAPI contract exists but the AI provider is not wired. "Route Missing" means the Express route does not exist yet. "Connected" means the endpoint responded 200.
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Connected", value: connected, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Contract Ready", value: contractReady, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Route Missing", value: routeMissing, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
          { label: "Not Reachable", value: notReachable, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl border p-3.5 ${bg}`}>
            <div className={`text-2xl font-black ${color}`}>{running ? "—" : value}</div>
            <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {lastRun !== null && (
        <p className="text-[11px] text-muted-foreground/60 -mt-3">
          Last checked: {fmtTime(lastRun)}
        </p>
      )}

      {/* Route list */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-400 px-2">
            Route Status — {ROUTES.length} Routes Tracked
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        {ROUTES.map((spec) => {
          const r = results.get(spec.path);
          const status: RouteStatus = r?.status ?? "checking";
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <div
              key={spec.path}
              className="rounded-xl border border-border/40 bg-card/40 p-3.5 flex flex-col sm:flex-row sm:items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[12px] font-bold text-foreground">{spec.label}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${cfg.cls}`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    {cfg.label}
                  </span>
                  {r?.httpCode !== undefined && (
                    <span className="text-[10px] font-mono text-muted-foreground/60 px-1.5 py-0.5 rounded bg-muted/30">
                      HTTP {r.httpCode}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-muted-foreground/60 mb-1">
                  <span className="text-muted-foreground/40">{spec.method}</span>{" "}
                  {spec.path}
                </div>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                  {spec.description}
                </p>
                {r?.honestNote !== undefined && status !== "checking" && (
                  <p className="text-[11px] text-muted-foreground/60 mt-1 leading-relaxed italic">
                    {r.honestNote}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {spec.relatedView !== undefined && onNavigate !== undefined && (
                  <button
                    type="button"
                    onClick={() => onNavigate(spec.relatedView!)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open View
                  </button>
                )}
                {r?.checkedAt !== undefined && status !== "checking" && (
                  <span className="text-[10px] text-muted-foreground/40">
                    {fmtTime(r.checkedAt)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="rounded-xl border border-border/40 bg-card/30 p-4">
        <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-3">
          Status Legend
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              ["connected", "HTTP 200 — endpoint is live and responding."],
              ["contract-ready", "HTTP 501 — OpenAPI contract defined, backend implementation pending."],
              ["route-missing", "HTTP 404 — route not yet registered in Express."],
              ["not-reachable", "Server down or fetch timed out (>5s)."],
            ] as const
          ).map(([key, note]) => {
            const cfg = STATUS_CONFIG[key];
            const Icon = cfg.icon;
            return (
              <div key={key} className="flex items-start gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center gap-1 shrink-0 ${cfg.cls}`}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {cfg.label}
                </span>
                <span className="text-[11px] text-muted-foreground leading-relaxed">{note}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 justify-center text-[11px] text-muted-foreground/50 py-2">
        <Activity className="w-3.5 h-3.5" />
        Backend / API Readiness · Live route ping · No fake success · HMG Newsroom
      </div>
    </div>
  );
}
