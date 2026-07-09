/**
 * Memory & resource leak watchdog. Runs every few minutes; cleans stale
 * object URLs and L1 cache, audits anomalies. Never touches drafts.
 */

import { recordAudit } from "./auditLog";
import { listJobs } from "./jobLedger";
import { cacheStats, sweepL1 } from "./hotCache";
import {
  memoryPoolStats,
  releaseObjectUrl,
  stalePresets,
} from "./memoryPool";
import { estimateUsage } from "./safeStorage";
import { isAppActive, registerLifecycleHandlers } from "./mobileLifecycle";

const STALE_OBJECT_URL_AGE_MS = 30 * 60 * 1000; // 30 minutes
const STALE_JOB_AGE_MS = 60 * 60 * 1000; // 1 hour
const TICK_MS = 4 * 60 * 1000; // every 4 minutes

let handle: number | null = null;
let paused = false;

interface WatchdogReport {
  staleObjectUrlsRevoked: number;
  staleJobsCount: number;
  l1EvictedExpired: number;
  storagePct: number;
}

function tick(): WatchdogReport {
  // 1. Stale object URLs → revoke (drafts are storage-backed, not URLs).
  const stale = stalePresets(STALE_OBJECT_URL_AGE_MS);
  for (const e of stale) releaseObjectUrl(e.url);
  // 2. Stale running jobs in the ledger (just count — never delete; the
  // ledger is its own truth and only completeJob/clearJobs touch it).
  const now = Date.now();
  const staleJobsCount = listJobs().filter(
    (j) =>
      j.status === "running" &&
      j.startedAt != null &&
      now - j.startedAt > STALE_JOB_AGE_MS,
  ).length;
  // 3. L1 cache sweep.
  const l1EvictedExpired = sweepL1();
  // 4. Storage pressure.
  const storage = estimateUsage();
  const storagePct = Math.round(storage.pct * 100);
  return {
    staleObjectUrlsRevoked: stale.length,
    staleJobsCount,
    l1EvictedExpired,
    storagePct,
  };
}

function audit(report: WatchdogReport) {
  // Only audit if anything noteworthy happened — avoid log churn.
  const noteworthy =
    report.staleObjectUrlsRevoked > 0 ||
    report.staleJobsCount > 0 ||
    report.l1EvictedExpired > 5 ||
    report.storagePct >= 75;
  if (!noteworthy) return;
  try {
    const mp = memoryPoolStats();
    const cs = cacheStats();
    recordAudit(
      "leak-watchdog-tick",
      "system",
      `urls:${report.staleObjectUrlsRevoked} stale-jobs:${report.staleJobsCount} l1-evict:${report.l1EvictedExpired} storage:${report.storagePct}% pool-urls:${mp.objectUrlCount} cache-hit:${(cs.hitRate * 100).toFixed(0)}%`,
    );
  } catch {
    /* ignore */
  }
}

function safeTick() {
  if (paused) return;
  if (!isAppActive()) return;
  try {
    const report = tick();
    audit(report);
  } catch {
    /* ignore */
  }
}

export function installLeakWatchdog(intervalMs: number = TICK_MS): () => void {
  if (typeof window === "undefined") return () => undefined;
  if (handle != null) return () => undefined;
  handle = window.setInterval(safeTick, intervalMs);
  // Also pause/resume with mobile lifecycle to avoid waking a backgrounded
  // tab just to sweep caches.
  const offLifecycle = registerLifecycleHandlers({
    onPause: () => {
      paused = true;
    },
    onResume: () => {
      paused = false;
      // Run one immediate sweep on resume.
      safeTick();
    },
  });
  return () => {
    if (handle != null) window.clearInterval(handle);
    handle = null;
    offLifecycle();
  };
}

export function runWatchdogNow(): WatchdogReport {
  return tick();
}
