/**
 * Durable local job ledger — every AI / publish / transcribe / image job
 * records start, completion, and safe error code. Used by the Command Center
 * Job Ledger card and by the failure-recovery surfaces.
 *
 * SECURITY: never store article body, transcripts, media blobs, credentials,
 * or any secret. Summaries are hard-capped and scrubbed.
 */

import { useEffect, useState } from "react";
import { safeGetJSON, safeSetJSON } from "./safeStorage";
import { scrubSecretText } from "./auditLog";

const STORAGE_KEY = "hmg-job-ledger-v1";
const CHANGED_EVENT = "hmg-job-ledger-changed";
const MAX_ENTRIES = 300;
const ARCHIVE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SUMMARY = 140;

export const JOB_KINDS = [
  "text-ai",
  "image-ai",
  "transcribe",
  "wp-publish",
  "wp-test",
  "wp-media",
  "public-app",
] as const;
export type JobKind = (typeof JOB_KINDS)[number];

export const JOB_STATUSES = [
  "pending",
  "running",
  "success",
  "failure",
  "cancelled",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export interface JobEntry {
  id: string;
  kind: JobKind;
  silo: string;
  status: JobStatus;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  durationMs: number | null;
  retries: number;
  errorCode: string | null;
  summary: string;
  operator: string | null; // initials or null
}

function isJob(x: unknown): x is JobEntry {
  if (!x || typeof x !== "object") return false;
  const j = x as JobEntry;
  return (
    typeof j.id === "string" &&
    typeof j.kind === "string" &&
    typeof j.silo === "string" &&
    typeof j.status === "string" &&
    typeof j.createdAt === "number"
  );
}

function isJobArray(x: unknown): x is JobEntry[] {
  return Array.isArray(x) && x.every(isJob);
}

function read(): JobEntry[] {
  return safeGetJSON<JobEntry[]>(STORAGE_KEY, isJobArray, []);
}

function persist(list: JobEntry[]) {
  // Keep newest first, cap at MAX_ENTRIES, drop archived items.
  const cutoff = Date.now() - ARCHIVE_AFTER_MS;
  const trimmed = list
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((j) => {
      if (j.status === "running" || j.status === "pending") return true;
      return (j.completedAt ?? j.createdAt) >= cutoff;
    })
    .slice(0, MAX_ENTRIES);
  if (safeSetJSON(STORAGE_KEY, trimmed)) {
    try {
      window.dispatchEvent(new Event(CHANGED_EVENT));
    } catch {
      /* ignore */
    }
  }
}

function makeId() {
  return `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeSummary(text: string): string {
  return scrubSecretText(String(text ?? "")).slice(0, MAX_SUMMARY);
}

function safeErrorCode(err: unknown): string {
  if (!err) return "unknown";
  if (typeof err === "string") return err.slice(0, 40);
  if (typeof err === "object") {
    const e = err as { code?: unknown; name?: unknown };
    if (typeof e.code === "string") return e.code.slice(0, 40);
    if (typeof e.name === "string") return e.name.slice(0, 40);
  }
  return "unknown";
}

export interface StartJobInput {
  kind: JobKind;
  silo: string;
  summary?: string;
  operator?: string | null;
}

export function startJob(input: StartJobInput): string {
  const id = makeId();
  const entry: JobEntry = {
    id,
    kind: input.kind,
    silo: input.silo.slice(0, 32),
    status: "running",
    createdAt: Date.now(),
    startedAt: Date.now(),
    completedAt: null,
    durationMs: null,
    retries: 0,
    errorCode: null,
    summary: safeSummary(input.summary ?? ""),
    operator: input.operator ? input.operator.slice(0, 6) : null,
  };
  persist([entry, ...read()]);
  return id;
}

export function completeJob(
  id: string,
  outcome: { status: "success" } | { status: "failure"; error: unknown } | { status: "cancelled" },
): void {
  const list = read();
  const idx = list.findIndex((j) => j.id === id);
  if (idx < 0) return;
  const j = list[idx];
  const now = Date.now();
  const updated: JobEntry = {
    ...j,
    status: outcome.status,
    completedAt: now,
    durationMs: j.startedAt != null ? now - j.startedAt : null,
    errorCode: outcome.status === "failure" ? safeErrorCode(outcome.error) : null,
  };
  list[idx] = updated;
  persist(list);
}

export function recordRetry(id: string): void {
  const list = read();
  const idx = list.findIndex((j) => j.id === id);
  if (idx < 0) return;
  list[idx] = {
    ...list[idx],
    retries: list[idx].retries + 1,
    status: "running",
    startedAt: Date.now(),
    completedAt: null,
    errorCode: null,
  };
  persist(list);
}

export function listJobs(): JobEntry[] {
  return read();
}

export function clearJobs(): void {
  persist([]);
}

export interface JobLedgerStats {
  running: number;
  failures24h: number;
  total: number;
}

export function statsForLedger(list: JobEntry[]): JobLedgerStats {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let running = 0;
  let failures24h = 0;
  for (const j of list) {
    if (j.status === "running" || j.status === "pending") running++;
    if (j.status === "failure" && (j.completedAt ?? j.createdAt) >= cutoff) failures24h++;
  }
  return { running, failures24h, total: list.length };
}

export function useJobLedger() {
  const [entries, setEntries] = useState<JobEntry[]>(() => read());
  useEffect(() => {
    const handler = () => setEntries(read());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return { entries, clear: clearJobs, stats: statsForLedger(entries) };
}
