import { useCallback, useEffect, useState } from "react";
import { safeGetJSON, safeSetJSON } from "./safeStorage";

const STORAGE_KEY = "hmg-newsroom-max-cro-inbox-v1";
const MAX_ENTRIES = 100;

export type CROItemStatus = "new" | "in-progress" | "done" | "dismissed";
export type CROItemPriority = "high" | "medium" | "low";

export interface CROItem {
  id: string;
  title: string;
  description: string;
  status: CROItemStatus;
  priority: CROItemPriority;
  category: string;
  createdAt: number;
  updatedAt: number;
  notes?: string;
  revenueImpact?: string;
  assignedTo?: string;
}

function readStore(): CROItem[] {
  return safeGetJSON<CROItem[]>(
    STORAGE_KEY,
    (raw): raw is CROItem[] => Array.isArray(raw),
    [],
  );
}

function writeStore(items: CROItem[]) {
  safeSetJSON(STORAGE_KEY, items.slice(0, MAX_ENTRIES));
}

let listeners = new Set<(items: CROItem[]) => void>();

function notify(items: CROItem[]) {
  listeners.forEach((cb) => cb(items));
}

export function addCROItem(
  input: Omit<CROItem, "id" | "createdAt" | "updatedAt">,
): CROItem {
  const item: CROItem = {
    ...input,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `cro_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const list = readStore();
  list.unshift(item);
  writeStore(list);
  notify(list);
  return item;
}

export function useMaxCROInbox() {
  const [inbox, setInbox] = useState<CROItem[]>(() => readStore());

  useEffect(() => {
    const listener = (items: CROItem[]) => setInbox(items);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const addItem = useCallback(
    (input: Omit<CROItem, "id" | "createdAt" | "updatedAt">) => {
      return addCROItem(input);
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    const next = readStore().filter((item) => item.id !== id);
    writeStore(next);
    notify(next);
  }, []);

  const updateStatus = useCallback((id: string, status: CROItemStatus) => {
    const next = readStore().map((item) =>
      item.id === id ? { ...item, status, updatedAt: Date.now() } : item,
    );
    writeStore(next);
    notify(next);
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<Omit<CROItem, "id" | "createdAt">>) => {
    const next = readStore().map((item) =>
      item.id === id ? { ...item, ...patch, updatedAt: Date.now() } : item,
    );
    writeStore(next);
    notify(next);
  }, []);

  const clearAll = useCallback(() => {
    writeStore([]);
    notify([]);
  }, []);

  return { inbox, addItem, removeItem, updateStatus, updateItem, clearAll };
}
