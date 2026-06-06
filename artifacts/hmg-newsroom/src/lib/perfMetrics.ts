/**
 * Performance metrics derived from existing infrastructure (jobLedger, queue
 * snapshot, safeStorage estimate). No content bodies, no secrets — only
 * timing aggregates and counts. Read-only consumer for the Performance Health
 * card.
 */

import { useEffect, useMemo, useState } from "react";
import { listJobs, type JobEntry, type JobKind } from "./jobLedger";
import { snapshotQueue, type QueueSnapshot } from "./requestQueue";
import { estimateUsage, safeSet, safeRemove } from "./safeStorage";

export type PerfStatus = "green" | "yellow" | "red" | "n/a";

export interface PerfMetric {
  id: string;
  label: string;
  value: string;
  latestMs: number | null;
  rollingMs: number | null;
  status: PerfStatus;
  hint?: string;
}

interface LatencyThreshold {
  green: number; // <= green => green
  yellow: number; // <= yellow => yellow, else red
}

// Conservative thresholds tuned to current OpenAI proxy latency. Adjust as we
// learn real-world distributions; the Command Center exposes the rolling avg
// so the operator can see drift.
const LATENCY_THRESHOLDS: Record<string, LatencyThreshold> = {
  "article-latency": { green: 12000, yellow: 25000 },
  "pack-latency": { green: 35000, yellow: 70000 },
  "image-latency": { green: 18000, yellow: 35000 },
  "transcribe-latency": { green: 25000, yellow: 60000 },
  "publish-latency": { green: 6000, yellow: 15000 },
};

const RATE_THRESHOLDS = {
  "retry-rate": { green: 0.05, yellow: 0.15 },
  "timeout-rate": { green: 0.02, yellow: 0.08 },
};

const ROLLING_WINDOW = 20; // last N completed jobs of a kind

function bandFor(ms: number, t: LatencyThreshold): PerfStatus {
  if (ms <= t.green) return "green";
  if (ms <= t.yellow) return "yellow";
  return "red";
}

function rateBand(rate: number, t: { green: number; yellow: number }): PerfStatus {
  if (rate <= t.green) return "green";
  if (rate <= t.yellow) return "yellow";
  return "red";
}

function fmtMs(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)} s`;
}

function fmtPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function latencyMetric(
  id: string,
  label: string,
  jobs: JobEntry[],
  kind: JobKind,
): PerfMetric {
  const completed = jobs
    .filter(
      (j) =>
        j.kind === kind &&
        j.status === "success" &&
        typeof j.durationMs === "number" &&
        j.durationMs > 0,
    )
    .slice(0, ROLLING_WINDOW);
  if (completed.length === 0) {
    return {
      id,
      label,
      value: "no data",
      latestMs: null,
      rollingMs: null,
      status: "n/a",
    };
  }
  const latest = completed[0].durationMs ?? 0;
  const rolling = Math.round(
    completed.reduce((sum, j) => sum + (j.durationMs ?? 0), 0) /
      completed.length,
  );
  const t = LATENCY_THRESHOLDS[id];
  const status: PerfStatus = t ? bandFor(rolling, t) : "n/a";
  return {
    id,
    label,
    value: `${fmtMs(latest)} (avg ${fmtMs(rolling)})`,
    latestMs: latest,
    rollingMs: rolling,
    status,
  };
}

function appLoadMetric(): PerfMetric {
  const id = "app-load";
  const label = "App load";
  if (typeof performance === "undefined" || typeof window === "undefined") {
    return { id, label, value: "—", latestMs: null, rollingMs: null, status: "n/a" };
  }
  try {
    const nav = performance.getEntriesByType?.("navigation")?.[0] as
      | PerformanceNavigationTiming
      | undefined;
    const ms = nav?.domContentLoadedEventEnd ?? null;
    if (!ms || ms <= 0) {
      return { id, label, value: "—", latestMs: null, rollingMs: null, status: "n/a" };
    }
    const status: PerfStatus =
      ms <= 1500 ? "green" : ms <= 3500 ? "yellow" : "red";
    return {
      id,
      label,
      value: fmtMs(ms),
      latestMs: ms,
      rollingMs: ms,
      status,
    };
  } catch {
    return { id, label, value: "—", latestMs: null, rollingMs: null, status: "n/a" };
  }
}

function queueWaitMetric(snapshot: QueueSnapshot): PerfMetric {
  const id = "ai-queue-wait";
  const label = "AI queue depth";
  const totalQueued = Object.values(snapshot.waiting ?? {}).reduce(
    (a: number, n: number) => a + n,
    0,
  );
  const totalRunning = Object.values(snapshot.active ?? {}).reduce(
    (a: number, n: number) => a + n,
    0,
  );
  const status: PerfStatus =
    totalQueued === 0 ? "green" : totalQueued <= 3 ? "yellow" : "red";
  return {
    id,
    label,
    value: `${totalRunning} running · ${totalQueued} queued`,
    latestMs: null,
    rollingMs: null,
    status,
  };
}

function rateMetric(
  id: "retry-rate" | "timeout-rate",
  label: string,
  jobs: JobEntry[],
): PerfMetric {
  const recent = jobs.slice(0, 100);
  if (recent.length === 0) {
    return { id, label, value: "no data", latestMs: null, rollingMs: null, status: "n/a" };
  }
  let num = 0;
  for (const j of recent) {
    if (id === "retry-rate") {
      if (j.retries > 0) num++;
    } else {
      if (j.errorCode === "ai_timeout" || j.errorCode === "timeout") num++;
    }
  }
  const rate = num / recent.length;
  const status = rateBand(rate, RATE_THRESHOLDS[id]);
  return {
    id,
    label,
    value: `${fmtPct(rate)} (${num}/${recent.length})`,
    latestMs: null,
    rollingMs: null,
    status,
  };
}

function storageWriteTimeMetric(): PerfMetric {
  const id = "storage-write-time";
  const label = "Storage write";
  if (typeof performance === "undefined") {
    return { id, label, value: "—", latestMs: null, rollingMs: null, status: "n/a" };
  }
  // Time a tiny write+remove cycle. Safe — uses a probe key, ~32 bytes.
  const probeKey = "hmg-perf-probe-v1";
  try {
    const start = performance.now();
    safeSet(probeKey, "0123456789abcdef0123456789abcdef");
    safeRemove(probeKey);
    const ms = performance.now() - start;
    const status: PerfStatus =
      ms <= 5 ? "green" : ms <= 25 ? "yellow" : "red";
    return {
      id,
      label,
      value: fmtMs(ms),
      latestMs: ms,
      rollingMs: ms,
      status,
    };
  } catch {
    return { id, label, value: "—", latestMs: null, rollingMs: null, status: "n/a" };
  }
}

function storageQuotaMetric(): PerfMetric {
  const id = "storage-quota";
  const label = "Storage quota";
  const r = estimateUsage();
  const pct = Math.round(r.pct * 100);
  const status: PerfStatus =
    r.status === "ok"
      ? "green"
      : r.status === "warning"
        ? "yellow"
        : "red";
  return {
    id,
    label,
    value: `${pct}% used`,
    latestMs: null,
    rollingMs: null,
    status,
  };
}

export interface PerfReport {
  metrics: PerfMetric[];
  worst: PerfMetric | null;
}

export function computePerfReport(): PerfReport {
  const jobs = listJobs();
  const queue = snapshotQueue();
  const metrics: PerfMetric[] = [
    appLoadMetric(),
    queueWaitMetric(queue),
    latencyMetric("article-latency", "Article", jobs, "text-ai"),
    latencyMetric("pack-latency", "Pack", jobs, "text-ai"),
    latencyMetric("image-latency", "Image", jobs, "image-ai"),
    latencyMetric("transcribe-latency", "Transcribe", jobs, "transcribe"),
    latencyMetric("publish-latency", "Publish", jobs, "wp-publish"),
    rateMetric("retry-rate", "Retry rate", jobs),
    rateMetric("timeout-rate", "Timeout rate", jobs),
    storageWriteTimeMetric(),
    storageQuotaMetric(),
  ];
  // worst = the metric in red, then yellow, with the largest impact (latency
  // gets priority over rates because user-facing latency drives perception).
  const orderForWorst = (m: PerfMetric): number => {
    if (m.status === "red") return 0;
    if (m.status === "yellow") return 1;
    return 99;
  };
  const candidates = metrics.filter((m) => m.status === "red" || m.status === "yellow");
  candidates.sort((a, b) => {
    const oa = orderForWorst(a);
    const ob = orderForWorst(b);
    if (oa !== ob) return oa - ob;
    return (b.rollingMs ?? 0) - (a.rollingMs ?? 0);
  });
  return { metrics, worst: candidates[0] ?? null };
}

export function usePerfReport(intervalMs = 4000): PerfReport {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return useMemo(() => {
    void tick;
    return computePerfReport();
  }, [tick]);
}
