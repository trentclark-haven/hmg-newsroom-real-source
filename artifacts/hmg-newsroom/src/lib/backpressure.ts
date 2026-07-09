/**
 * Backpressure controller. Watches recent ledger latency to assign a global
 * throughput band: green (full speed), yellow (slow intake), red (cooling
 * down). Consumers ask `concurrencyMultiplier()` and `retryDelayMs()` to
 * bend their behavior. State changes are audited.
 */

import { useEffect, useState } from "react";
import { listJobs } from "./jobLedger";
import { recordAudit } from "./auditLog";

export type BackpressureState = "green" | "yellow" | "red";

interface Bands {
  /** rolling p95 (ms) latency boundary into yellow */
  yellow: number;
  /** rolling p95 boundary into red */
  red: number;
}

// p95 of recent successful jobs, by kind. Only AI-text drives the global
// signal; image / transcribe are slower by nature and have their own
// patience already.
const BANDS_BY_KIND: Record<string, Bands> = {
  "text-ai": { yellow: 25_000, red: 60_000 },
  "image-ai": { yellow: 30_000, red: 75_000 },
  transcribe: { yellow: 60_000, red: 150_000 },
  "wp-publish": { yellow: 12_000, red: 30_000 },
};

const ROLLING_WINDOW = 12;

let currentState: BackpressureState = "green";
let lastChangedAt = Date.now();
const listeners = new Set<(s: BackpressureState) => void>();

function p95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[idx];
}

function evaluate(): BackpressureState {
  const jobs = listJobs();
  let worst: BackpressureState = "green";
  for (const kind of Object.keys(BANDS_BY_KIND)) {
    const band = BANDS_BY_KIND[kind];
    const successDurations = jobs
      .filter(
        (j) =>
          j.kind === kind &&
          j.status === "success" &&
          typeof j.durationMs === "number",
      )
      .slice(0, ROLLING_WINDOW)
      .map((j) => j.durationMs as number);
    if (successDurations.length < 3) continue;
    const p = p95(successDurations);
    let s: BackpressureState = "green";
    if (p >= band.red) s = "red";
    else if (p >= band.yellow) s = "yellow";
    if (s === "red") worst = "red";
    else if (s === "yellow" && worst !== "red") worst = "yellow";
  }
  // Recent failures spike pressure regardless of latency.
  const recentFailures = jobs
    .slice(0, 12)
    .filter((j) => j.status === "failure").length;
  if (recentFailures >= 5 && worst !== "red") worst = "red";
  else if (recentFailures >= 3 && worst === "green") worst = "yellow";
  return worst;
}

let pollHandle: number | null = null;
let pollPaused = false;

function tick() {
  if (pollPaused) return;
  const next = evaluate();
  if (next !== currentState) {
    const prev = currentState;
    currentState = next;
    lastChangedAt = Date.now();
    try {
      recordAudit(
        "backpressure-state-change",
        "system",
        `${prev} → ${next}`,
      );
    } catch {
      /* ignore */
    }
    for (const cb of listeners) {
      try {
        cb(next);
      } catch {
        /* ignore */
      }
    }
  }
}

export function startBackpressure(intervalMs = 8000): () => void {
  if (typeof window === "undefined") return () => undefined;
  if (pollHandle != null) return () => undefined;
  pollHandle = window.setInterval(tick, intervalMs);
  return () => {
    if (pollHandle != null) window.clearInterval(pollHandle);
    pollHandle = null;
  };
}

export function pauseBackpressure(): void {
  pollPaused = true;
}
export function resumeBackpressure(): void {
  pollPaused = false;
}

export function getBackpressureState(): BackpressureState {
  return currentState;
}

export function concurrencyMultiplier(): number {
  switch (currentState) {
    case "green":
      return 1;
    case "yellow":
      return 0.6;
    case "red":
      return 0.3;
  }
}

export function retryDelayMs(baseMs = 800): number {
  switch (currentState) {
    case "green":
      return baseMs;
    case "yellow":
      return Math.round(baseMs * 1.8);
    case "red":
      return Math.round(baseMs * 4);
  }
}

export function onBackpressureChange(
  cb: (s: BackpressureState) => void,
): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useBackpressure(): { state: BackpressureState; lastChangedAt: number } {
  const [state, setState] = useState<BackpressureState>(currentState);
  useEffect(() => {
    setState(currentState);
    return onBackpressureChange(setState);
  }, []);
  return { state, lastChangedAt };
}
