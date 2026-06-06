/**
 * useMaxCROInbox — localStorage hook for Max CRO Inbox items.
 *
 * Storage key: hmg-newsroom-max-cro-inbox-v1
 * All data is local-first. No outreach, no CRM, no fake deal status.
 */
import { useCallback, useEffect, useState } from "react";
import { safeGetJSON, safeSetJSON } from "./safeStorage";
import {
  runMaxCROReview,
  hasRevenueSignal,
  detectRevenueSignals,
  type MaxCROBrief,
  type CROStatus,
} from "@/lib/hmg/haven-ai/maxCROEngine";
import { computeRevenueScore } from "@/lib/hmg/haven-ai/maxRevenueScoring";

const STORAGE_KEY = "hmg-newsroom-max-cro-inbox-v1";
const MAX_ITEMS = 50;

function readStore(): MaxCROBrief[] {
  return safeGetJSON<MaxCROBrief[]>(
    STORAGE_KEY,
    (raw): raw is MaxCROBrief[] => Array.isArray(raw),
    [],
  );
}

function writeStore(items: MaxCROBrief[]) {
  safeSetJSON(STORAGE_KEY, items.slice(0, MAX_ITEMS));
}

let listeners = new Set<(items: MaxCROBrief[]) => void>();

function notifyAll(items: MaxCROBrief[]) {
  listeners.forEach((cb) => cb(items));
}

export function submitSourceIntake(opts: {
  sourceText: string;
  silo?: string;
  siloName?: string;
  founderNote?: string;
}): MaxCROBrief | null {
  const { sourceText, silo = "hmg", siloName = "HMG Master Brand", founderNote = "" } = opts;
  const signals = detectRevenueSignals(sourceText);
  const isRevenue = hasRevenueSignal(sourceText);

  const item: MaxCROBrief = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `cro-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    sourceText,
    signals,
    status: isRevenue ? "Revenue Review Needed" : "Ignore / No Money Move",
    review: null,
    score: null,
    generatedPackage: null,
    silo,
    siloName,
    founderNote,
  };

  const list = readStore();
  list.unshift(item);
  writeStore(list);
  notifyAll(readStore());
  return item;
}

export function sendToMax(id: string): MaxCROBrief | null {
  const list = readStore();
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const item = list[idx];
  const review = runMaxCROReview(item.sourceText);
  const score = computeRevenueScore(item.sourceText, item.signals);
  list[idx] = {
    ...item,
    review,
    score,
    status: "Max Review Drafted",
  };
  writeStore(list);
  notifyAll(readStore());
  return list[idx];
}

export function updateCROStatus(id: string, status: CROStatus): void {
  const list = readStore();
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], status };
  writeStore(list);
  notifyAll(readStore());
}

export function removeCROItem(id: string): void {
  const list = readStore().filter((i) => i.id !== id);
  writeStore(list);
  notifyAll(list);
}

export function clearCROInbox(): void {
  writeStore([]);
  notifyAll([]);
}

export function useMaxCROInbox() {
  const [items, setItems] = useState<MaxCROBrief[]>(() => readStore());

  useEffect(() => {
    const listener = (next: MaxCROBrief[]) => setItems(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const submit = useCallback(
    (opts: { sourceText: string; silo?: string; siloName?: string; founderNote?: string }) =>
      submitSourceIntake(opts),
    [],
  );

  const runMax = useCallback((id: string) => sendToMax(id), []);

  const setStatus = useCallback((id: string, status: CROStatus) => updateCROStatus(id, status), []);

  const remove = useCallback((id: string) => removeCROItem(id), []);

  const clear = useCallback(() => clearCROInbox(), []);

  return { items, submit, runMax, setStatus, remove, clear };
}
