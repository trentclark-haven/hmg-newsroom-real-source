/**
 * Werewolf Score — single 0–100 throughput health number for the Command
 * Center. Composed from queue depth, breaker states, latency, cache hit,
 * retry rate, and storage pressure. Bands map to stages of the moon: the
 * higher the score, the more capacity headroom.
 */

import { listJobs } from "./jobLedger";
import { snapshotQueue } from "./requestQueue";
import { snapshotBreakers } from "./circuitBreaker";
import { cacheStats } from "./hotCache";
import { coalesceStats } from "./coalesce";
import { memoryPoolStats } from "./memoryPool";
import { estimateUsage } from "./safeStorage";
import { getBackpressureState } from "./backpressure";

export type WerewolfBand = "Sleeping" | "Awake" | "Hunting" | "Alpha" | "Full Moon";

export interface WerewolfBreakdown {
  score: number;
  band: WerewolfBand;
  components: {
    queueHealth: number;
    breakerHealth: number;
    latencyHealth: number;
    cacheHealth: number;
    retryHealth: number;
    storageHealth: number;
    memoryHealth: number;
    backpressureHealth: number;
  };
  hint: string;
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function bandForScore(score: number): WerewolfBand {
  if (score >= 90) return "Full Moon";
  if (score >= 75) return "Alpha";
  if (score >= 55) return "Hunting";
  if (score >= 30) return "Awake";
  return "Sleeping";
}

export function computeWerewolfScore(): WerewolfBreakdown {
  const jobs = listJobs();
  const queue = snapshotQueue();
  const breakers = snapshotBreakers();
  const cache = cacheStats();
  const coal = coalesceStats();
  const mem = memoryPoolStats();
  const storage = estimateUsage();
  const totalRetries = jobs.reduce((s, j) => s + (j.retries ?? 0), 0);
  const bp = getBackpressureState();

  // Component scores: each 0–100, higher is better.
  const queued = Object.values(queue.waiting).reduce(
    (a: number, n: number) => a + n,
    0,
  );
  const queueHealth = clamp(100 - queued * 12);

  const openBreakers = Object.values(breakers).filter(
    (b) => b.state === "open",
  ).length;
  const halfBreakers = Object.values(breakers).filter(
    (b) => b.state === "half-open",
  ).length;
  const breakerHealth = clamp(100 - openBreakers * 35 - halfBreakers * 15);

  // Latency: use avg duration of last 20 successful text-ai jobs.
  const recentText = jobs
    .filter((j) => j.kind === "text-ai" && j.status === "success" && j.durationMs)
    .slice(0, 20);
  const avgText =
    recentText.length > 0
      ? recentText.reduce((s, j) => s + (j.durationMs ?? 0), 0) /
        recentText.length
      : 0;
  // 0ms → 100, 30000ms → ~25, 60000ms → 0
  const latencyHealth =
    recentText.length === 0 ? 80 : clamp(100 - avgText / 600);

  // Cache hit rate (heavily reward >50%, factor in coalesce hits too).
  const haveAnySamples = cache.hits + cache.misses + coal.coalescedCount + coal.launchedCount > 0;
  const combinedHitRate = haveAnySamples
    ? (cache.hitRate + coal.hitRate) / 2
    : 0;
  const cacheHealth = clamp(combinedHitRate * 100 + 30);

  // Retry health: fewer retries per job is better.
  const total = jobs.length || 1;
  const retryRatio = totalRetries / total;
  const retryHealth = clamp(100 - retryRatio * 60);

  // Storage pressure.
  const storageHealth =
    storage.status === "ok"
      ? 95
      : storage.status === "warning"
        ? 65
        : storage.status === "critical"
          ? 30
          : 0;

  // Memory: more object URLs in flight = less headroom.
  const memoryHealth = clamp(100 - mem.objectUrlCount * 4);

  // Backpressure rolls into the score directly.
  const backpressureHealth = bp === "green" ? 100 : bp === "yellow" ? 60 : 25;

  // Weighted blend.
  const score = Math.round(
    queueHealth * 0.1 +
      breakerHealth * 0.15 +
      latencyHealth * 0.18 +
      cacheHealth * 0.12 +
      retryHealth * 0.1 +
      storageHealth * 0.1 +
      memoryHealth * 0.1 +
      backpressureHealth * 0.15,
  );
  const band = bandForScore(score);

  // Pick the lowest-scoring component as a human hint.
  const components = {
    queueHealth,
    breakerHealth,
    latencyHealth,
    cacheHealth,
    retryHealth,
    storageHealth,
    memoryHealth,
    backpressureHealth,
  };
  const labels: Record<keyof typeof components, string> = {
    queueHealth: "queue depth",
    breakerHealth: "circuit breakers",
    latencyHealth: "AI latency",
    cacheHealth: "cache hit rate",
    retryHealth: "retry rate",
    storageHealth: "storage pressure",
    memoryHealth: "object URL count",
    backpressureHealth: "backpressure",
  };
  const lowestKey = (Object.entries(components) as [keyof typeof components, number][])
    .sort((a, b) => a[1] - b[1])[0][0];
  const hint =
    components[lowestKey] >= 80
      ? "All systems nominal."
      : `Headroom limited by ${labels[lowestKey]}.`;

  return {
    score: clamp(score),
    band,
    components,
    hint,
  };
}
