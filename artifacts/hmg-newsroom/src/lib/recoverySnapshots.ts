/**
 * Pre-destructive recovery snapshots. Capture lightweight metadata about app
 * state before publish / overwrite / clear / large job. Snapshots NEVER store
 * full article bodies, transcripts, media blobs, or credentials.
 *
 * "Restore" returns the metadata to the caller — restoring full state is the
 * caller's responsibility (e.g. PublishPanel knows to re-queue a job, not to
 * re-write a draft from snapshot data).
 */

import { useEffect, useState } from "react";
import { safeGetJSON, safeSetJSON } from "./safeStorage";

const STORAGE_KEY = "hmg-recovery-snapshots-v1";
const CHANGED_EVENT = "hmg-recovery-snapshots-changed";
const MAX_SNAPSHOTS = 10;
const MAX_LABEL = 80;

export const SNAPSHOT_REASONS = [
  "publish",
  "import-backup",
  "clear-local",
  "overwrite-draft",
  "trent-override-applied",
  "media-upload",
  "large-job-start",
] as const;
export type SnapshotReason = (typeof SNAPSHOT_REASONS)[number];

export interface SnapshotMeta {
  id: string;
  ts: number;
  reason: SnapshotReason;
  label: string;
  silo: string;
  /**
   * Free-form metadata bag. Must contain only primitive values, small arrays,
   * or small objects. The caller is responsible for not putting secrets here;
   * we additionally cap the JSON size at SNAPSHOT_PAYLOAD_LIMIT bytes.
   */
  meta: Record<string, unknown>;
}

const SNAPSHOT_PAYLOAD_LIMIT = 4 * 1024;

function isSnap(x: unknown): x is SnapshotMeta {
  if (!x || typeof x !== "object") return false;
  const s = x as SnapshotMeta;
  return (
    typeof s.id === "string" &&
    typeof s.ts === "number" &&
    typeof s.reason === "string" &&
    typeof s.silo === "string"
  );
}
function isSnapArray(x: unknown): x is SnapshotMeta[] {
  return Array.isArray(x) && x.every(isSnap);
}

function read(): SnapshotMeta[] {
  return safeGetJSON<SnapshotMeta[]>(STORAGE_KEY, isSnapArray, []);
}

function persist(list: SnapshotMeta[]) {
  const trimmed = list
    .slice()
    .sort((a, b) => b.ts - a.ts)
    .slice(0, MAX_SNAPSHOTS);
  if (safeSetJSON(STORAGE_KEY, trimmed)) {
    try {
      window.dispatchEvent(new Event(CHANGED_EVENT));
    } catch {
      /* ignore */
    }
  }
}

function clamp(meta: Record<string, unknown>): Record<string, unknown> {
  // Drop obviously-bad keys defensively. Callers should already follow the
  // rules but this keeps the snapshot lean and secret-free.
  const banned = /password|token|secret|auth|credential|key/i;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (banned.test(k)) continue;
    if (typeof v === "string") out[k] = v.slice(0, 240);
    else if (
      typeof v === "number" ||
      typeof v === "boolean" ||
      v == null ||
      Array.isArray(v) ||
      typeof v === "object"
    )
      out[k] = v;
  }
  // Hard cap: serialize and truncate if oversized.
  try {
    const ser = JSON.stringify(out);
    if (ser.length > SNAPSHOT_PAYLOAD_LIMIT) {
      return { _truncated: true, _len: ser.length };
    }
  } catch {
    return { _unserializable: true };
  }
  return out;
}

export function captureSnapshot(input: {
  reason: SnapshotReason;
  silo: string;
  label?: string;
  meta?: Record<string, unknown>;
}): SnapshotMeta {
  const snap: SnapshotMeta = {
    id: `snap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
    reason: input.reason,
    label: (input.label ?? input.reason).slice(0, MAX_LABEL),
    silo: input.silo.slice(0, 32),
    meta: clamp(input.meta ?? {}),
  };
  persist([snap, ...read()]);
  return snap;
}

export function listSnapshots(): SnapshotMeta[] {
  return read();
}

export function latestSnapshot(): SnapshotMeta | null {
  const list = read();
  return list[0] ?? null;
}

export function clearSnapshots(): void {
  persist([]);
}

export function useRecoverySnapshots() {
  const [entries, setEntries] = useState<SnapshotMeta[]>(() => read());
  useEffect(() => {
    const handler = () => setEntries(read());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return { entries, clear: clearSnapshots };
}
