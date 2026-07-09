import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hmg-newsroom-usage-v1";
const MAX_EVENTS = 1000;

export type UsageEventType = "generate-quick" | "generate-pack" | "publish-draft" | "publish-live" | "specialist";

export interface UsageEvent {
  silo: string;
  type: UsageEventType;
  ts: number;
}

interface UsageStore {
  events: UsageEvent[];
}

function readStore(): UsageStore {
  if (typeof window === "undefined") return { events: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { events: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.events)) return { events: [] };
    return { events: parsed.events as UsageEvent[] };
  } catch {
    return { events: [] };
  }
}

function writeStore(store: UsageStore) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

const STATS_CHANGED_EVENT = "hmg-newsroom-usage-changed";

export function recordUsage(silo: string, type: UsageEventType) {
  if (typeof window === "undefined") return;
  const store = readStore();
  store.events.unshift({ silo, type, ts: Date.now() });
  if (store.events.length > MAX_EVENTS) {
    store.events.length = MAX_EVENTS;
  }
  writeStore(store);
  window.dispatchEvent(new Event(STATS_CHANGED_EVENT));
}

export function useUsageStats() {
  const [events, setEvents] = useState<UsageEvent[]>(() => readStore().events);

  useEffect(() => {
    const handler = () => setEvents(readStore().events);
    window.addEventListener(STATS_CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(STATS_CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const clearAll = useCallback(() => {
    writeStore({ events: [] });
    setEvents([]);
    window.dispatchEvent(new Event(STATS_CHANGED_EVENT));
  }, []);

  return { events, clearAll };
}

export function startOfWeek(now = new Date()): number {
  const d = new Date(now);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

export function startOfDay(now = new Date()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface SiloStats {
  silo: string;
  generated: number;
  drafts: number;
  published: number;
  total: number;
}

export function aggregateBySilo(
  events: UsageEvent[],
  sinceTs: number,
  silos: string[],
): SiloStats[] {
  const counts: Record<string, SiloStats> = Object.fromEntries(
    silos.map((s) => [s, { silo: s, generated: 0, drafts: 0, published: 0, total: 0 }]),
  );
  for (const e of events) {
    if (e.ts < sinceTs) continue;
    const c = counts[e.silo];
    if (!c) continue;
    if (e.type === "generate-quick" || e.type === "generate-pack") c.generated += 1;
    else if (e.type === "publish-draft") c.drafts += 1;
    else if (e.type === "publish-live") c.published += 1;
    c.total += 1;
  }
  return silos.map((s) => counts[s]);
}
