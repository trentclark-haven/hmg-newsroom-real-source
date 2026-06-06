import { Activity, Gauge, AlertTriangle, CheckCircle2 } from "lucide-react";
import { usePerfReport, type PerfMetric, type PerfStatus } from "@/lib/perfMetrics";

const STATUS_TONE: Record<PerfStatus, string> = {
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  yellow: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  red: "bg-red-500/15 text-red-300 border-red-500/40",
  "n/a": "bg-muted/20 text-muted-foreground border-border/40",
};

function MetricRow({ m }: { m: PerfMetric }) {
  return (
    <div
      data-testid={`perf-metric-${m.id}`}
      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-border/30 bg-secondary/20"
    >
      <span className="text-[11px] font-medium text-foreground/90 truncate">
        {m.label}
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className="text-[10px] tabular-nums text-muted-foreground"
          data-testid={`perf-metric-value-${m.id}`}
        >
          {m.value}
        </span>
        <span
          data-testid={`perf-metric-status-${m.id}`}
          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${STATUS_TONE[m.status]}`}
        >
          {m.status === "n/a" ? "—" : m.status}
        </span>
      </div>
    </div>
  );
}

export function PerformanceHealthCard() {
  const { metrics, worst } = usePerfReport(4000);
  return (
    <div
      data-testid="commandcenter-performance-card"
      className="rounded-xl border border-border/60 bg-secondary/30 p-3 mb-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
            Performance health
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
          <Activity className="w-3 h-3" /> live
        </span>
      </div>
      {worst ? (
        <div
          data-testid="commandcenter-performance-worst"
          className={`text-[11px] mb-2 px-2 py-1.5 rounded-md border inline-flex items-start gap-1.5 ${STATUS_TONE[worst.status]}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Bottleneck: <strong>{worst.label}</strong> · {worst.value}
          </span>
        </div>
      ) : (
        <div
          data-testid="commandcenter-performance-worst"
          className="text-[11px] mb-2 px-2 py-1.5 rounded-md border inline-flex items-start gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 border-emerald-500/30"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>All metrics in the green band.</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-1">
        {metrics.map((m) => (
          <MetricRow key={m.id} m={m} />
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground/70 leading-snug">
        Latencies are rolling averages over the last 20 successful jobs of each
        kind. No content bodies are stored or shown here.
      </p>
    </div>
  );
}
