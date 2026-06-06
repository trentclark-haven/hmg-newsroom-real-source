/**
 * HMG Founder Knowledge Base — localStorage-backed store.
 * Uses safeStorage helpers. Bounded to MAX_ITEMS.
 * Honest about local-only status.
 */

import { safeGetJSON, safeSetJSON, estimateUsage } from "@/lib/safeStorage";
import { routeMemoryItem } from "./memoryRouter";
import type { MemoryItem, MemoryStore, MemoryType, MemoryHealthReport } from "./types";
import { MEMORY_SCHEMA_VERSION, ALL_MEMORY_TYPES } from "./types";

const STORAGE_KEY = "hmg-founder-knowledge-base-v1";
const MAX_ITEMS = 200;

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function buildPreview(content: string): string {
  const trimmed = content.trim();
  return trimmed.length > 180 ? trimmed.slice(0, 177) + "…" : trimmed;
}

function isMemoryStore(raw: unknown): raw is MemoryStore {
  if (!raw || typeof raw !== "object") return false;
  const obj = raw as Record<string, unknown>;
  return obj.schemaVersion === MEMORY_SCHEMA_VERSION && Array.isArray(obj.items);
}

export function readMemoryStore(): MemoryStore {
  return safeGetJSON<MemoryStore>(
    STORAGE_KEY,
    isMemoryStore,
    { schemaVersion: MEMORY_SCHEMA_VERSION, items: [], lastUpdated: 0 },
  );
}

export function writeMemoryStore(store: MemoryStore): boolean {
  return safeSetJSON(STORAGE_KEY, store);
}

export function getAllItems(): MemoryItem[] {
  return readMemoryStore().items;
}

export function getItemsByType(type: MemoryType): MemoryItem[] {
  return readMemoryStore().items.filter((i) => i.type === type);
}

export function addMemoryItem(
  input: Omit<MemoryItem, "id" | "dateAdded" | "lastModified" | "routedSystems" | "localStatus" | "preview">,
): MemoryItem {
  const store = readMemoryStore();
  const now = Date.now();
  const item: MemoryItem = {
    ...input,
    id: generateId(),
    dateAdded: now,
    lastModified: now,
    routedSystems: routeMemoryItem(input.type),
    localStatus: "saved",
    preview: buildPreview(input.content),
  };
  const next = [item, ...store.items].slice(0, MAX_ITEMS);
  writeMemoryStore({ ...store, items: next, lastUpdated: now });
  return item;
}

export function updateMemoryItem(id: string, patch: Partial<Omit<MemoryItem, "id" | "dateAdded">>): boolean {
  const store = readMemoryStore();
  const idx = store.items.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  const existing = store.items[idx];
  const updated: MemoryItem = {
    ...existing,
    ...patch,
    id: existing.id,
    dateAdded: existing.dateAdded,
    lastModified: Date.now(),
    preview: patch.content !== undefined ? buildPreview(patch.content) : existing.preview,
    routedSystems: patch.type !== undefined ? routeMemoryItem(patch.type) : existing.routedSystems,
  };
  const next = [...store.items];
  next[idx] = updated;
  return writeMemoryStore({ ...store, items: next, lastUpdated: Date.now() });
}

export function deleteMemoryItem(id: string): boolean {
  const store = readMemoryStore();
  const next = store.items.filter((i) => i.id !== id);
  return writeMemoryStore({ ...store, items: next, lastUpdated: Date.now() });
}

export function clearAllMemory(): boolean {
  return writeMemoryStore({ schemaVersion: MEMORY_SCHEMA_VERSION, items: [], lastUpdated: Date.now() });
}

export function togglePin(id: string): boolean {
  const store = readMemoryStore();
  const idx = store.items.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  const next = [...store.items];
  next[idx] = { ...next[idx], pinned: !next[idx].pinned };
  return writeMemoryStore({ ...store, items: next, lastUpdated: Date.now() });
}

export function importItems(items: MemoryItem[]): number {
  const store = readMemoryStore();
  const existingIds = new Set(store.items.map((i) => i.id));
  const newItems = items.filter((i) => !existingIds.has(i.id));
  const merged = [...newItems, ...store.items].slice(0, MAX_ITEMS);
  writeMemoryStore({ ...store, items: merged, lastUpdated: Date.now() });
  return newItems.length;
}

export function getMemoryHealth(): MemoryHealthReport {
  const store = readMemoryStore();
  const items = store.items;
  const byType: Partial<Record<MemoryType, number>> = {};
  for (const type of ALL_MEMORY_TYPES) {
    const count = items.filter((i) => i.type === type).length;
    if (count > 0) byType[type] = count;
  }

  const missing: string[] = [];
  const recommended: string[] = [];

  if (!byType["founder-voice"] || byType["founder-voice"] === 0) {
    missing.push("Founder Voice");
    recommended.push("Add your writing voice, tone examples, and brand phrases.");
  }
  if (!byType["wordpress-rule"] || byType["wordpress-rule"] === 0) {
    missing.push("WordPress Rules");
    recommended.push("Add your WordPress category, tag, and slug rules.");
  }
  if ((!byType["revenue-max-note"] || byType["revenue-max-note"] === 0) &&
      (!byType["sales-note"] || byType["sales-note"] === 0)) {
    missing.push("Max Revenue Notes");
    recommended.push("Add revenue notes, opportunity scoring, and sales priorities for Max.");
  }
  if ((!byType["relationship-note"] || byType["relationship-note"] === 0) &&
      (!byType["contact-csv"] || byType["contact-csv"] === 0)) {
    missing.push("Relationship Notes");
    recommended.push("Add relationship notes or contact CSV for Max follow-up.");
  }

  const storageReport = estimateUsage();

  let overall: MemoryHealthReport["overall"] = "strong";
  if (items.length === 0) {
    overall = "empty";
  } else if (missing.includes("Founder Voice")) {
    overall = "needs-founder-voice";
  } else if (missing.includes("WordPress Rules")) {
    overall = "needs-wordpress";
  } else if (missing.includes("Max Revenue Notes")) {
    overall = "needs-max";
  } else if (missing.includes("Relationship Notes")) {
    overall = "needs-relationships";
  }

  return {
    overall,
    totalItems: items.length,
    byType,
    lastUpdated: store.lastUpdated || null,
    localStorageStatus: storageReport.status,
    missing,
    recommended,
  };
}

export function getLastUpdated(): number | null {
  const store = readMemoryStore();
  return store.lastUpdated || null;
}

/** Subscribe to store changes (cross-tab not supported — single tab). */
const listeners = new Set<() => void>();

export function subscribeMemoryStore(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function notifyMemoryStoreListeners(): void {
  listeners.forEach((cb) => cb());
}

export function addMemoryItemAndNotify(
  input: Omit<MemoryItem, "id" | "dateAdded" | "lastModified" | "routedSystems" | "localStatus" | "preview">,
): MemoryItem {
  const item = addMemoryItem(input);
  notifyMemoryStoreListeners();
  return item;
}

export function deleteMemoryItemAndNotify(id: string): boolean {
  const result = deleteMemoryItem(id);
  notifyMemoryStoreListeners();
  return result;
}

export function clearAllMemoryAndNotify(): boolean {
  const result = clearAllMemory();
  notifyMemoryStoreListeners();
  return result;
}
