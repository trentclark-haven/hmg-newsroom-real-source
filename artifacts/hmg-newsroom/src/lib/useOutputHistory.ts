import { useCallback, useEffect, useState } from "react";
import { safeGetJSON, safeSetJSON } from "./safeStorage";

const STORAGE_KEY = "hmg-newsroom-output-history-v2";
const MAX_ENTRIES = 50;
const MAX_HISTORY_BYTES = 900 * 1024;

export interface OutputHistoryEntry {
  id: string;
  silo: string;
  siloName: string;
  kind:
    | "quick"
    | "pack"
    | "specialist"
    | "wordpress-draft"
    | "cut-note"
    | "social-video-draft"
    | "caption-plan"
    | "thumbnail-brief"
    | "edit-brief"
    | "max-cro-brief"
    | "max-daily-money-brief"
    | "max-follow-up"
    | "max-revenue-package"
    | "max-strategy-questions"
    | "max-risk-review"
    | "max-buffett-filter"
    | "max-executive-money-brief"
    | "max-content-to-money"
    | "max-judgment"
    | "max-quick-read"
    | "max-founder-command"
    | "max-sports-read";
  createdAt: number;
  prompt: string;
  role?: string;
  tone?: string;
  platform?: string;
  specialist?: string;
  output: unknown;
}

export function recordWordPressDraft(
  opts: Pick<OutputHistoryEntry, "silo" | "siloName" | "prompt" | "output">,
): OutputHistoryEntry {
  return recordOutput({ ...opts, kind: "wordpress-draft" });
}

export function recordCutNote(
  opts: Pick<OutputHistoryEntry, "silo" | "siloName" | "prompt" | "output">,
): OutputHistoryEntry {
  return recordOutput({ ...opts, kind: "cut-note" });
}

export function recordSocialVideoDraft(
  opts: Pick<OutputHistoryEntry, "silo" | "siloName" | "prompt" | "output">,
): OutputHistoryEntry {
  return recordOutput({ ...opts, kind: "social-video-draft" });
}

export function recordCaptionPlan(
  opts: Pick<OutputHistoryEntry, "silo" | "siloName" | "prompt" | "output">,
): OutputHistoryEntry {
  return recordOutput({ ...opts, kind: "caption-plan" });
}

export function recordThumbnailBrief(
  opts: Pick<OutputHistoryEntry, "silo" | "siloName" | "prompt" | "output">,
): OutputHistoryEntry {
  return recordOutput({ ...opts, kind: "thumbnail-brief" });
}

export function recordEditBrief(
  opts: Pick<OutputHistoryEntry, "silo" | "siloName" | "prompt" | "output">,
): OutputHistoryEntry {
  return recordOutput({ ...opts, kind: "edit-brief" });
}

function readStore(): OutputHistoryEntry[] {
  return safeGetJSON<OutputHistoryEntry[]>(
    STORAGE_KEY,
    (raw): raw is OutputHistoryEntry[] => Array.isArray(raw),
    [],
  );
}

function trimForStorage(entries: OutputHistoryEntry[]): OutputHistoryEntry[] {
  const next = entries.slice(0, MAX_ENTRIES);
  while (next.length > 1 && JSON.stringify(next).length * 2 > MAX_HISTORY_BYTES) {
    next.pop();
  }
  return next;
}

function writeStore(entries: OutputHistoryEntry[]) {
  safeSetJSON(STORAGE_KEY, trimForStorage(entries));
}

let cachedListeners = new Set<(entries: OutputHistoryEntry[]) => void>();

function notify(entries: OutputHistoryEntry[]) {
  cachedListeners.forEach((cb) => cb(entries));
}

export function recordOutput(entry: Omit<OutputHistoryEntry, "id" | "createdAt">) {
  const next: OutputHistoryEntry = {
    ...entry,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `e_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
  };
  const list = readStore();
  list.unshift(next);
  const trimmed = trimForStorage(list);
  writeStore(trimmed);
  notify(trimmed);
  return next;
}

export function useOutputHistory() {
  const [entries, setEntries] = useState<OutputHistoryEntry[]>(() => readStore());

  useEffect(() => {
    const listener = (next: OutputHistoryEntry[]) => setEntries(next);
    cachedListeners.add(listener);
    return () => {
      cachedListeners.delete(listener);
    };
  }, []);

  const remove = useCallback((id: string) => {
    const next = readStore().filter((e) => e.id !== id);
    writeStore(next);
    notify(next);
  }, []);

  const clear = useCallback(() => {
    writeStore([]);
    notify([]);
  }, []);

  return { entries, remove, clear };
}
