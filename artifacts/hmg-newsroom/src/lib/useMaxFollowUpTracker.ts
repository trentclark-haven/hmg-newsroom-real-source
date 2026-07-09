import { useCallback, useEffect, useState } from "react";
import { safeGetJSON, safeSetJSON } from "./safeStorage";

const STORAGE_KEY = "hmg-newsroom-max-followup-tracker-v1";
const MAX_ENTRIES = 200;

export type FollowUpStatus = "pending" | "contacted" | "responded" | "closed" | "snoozed";
export type FollowUpType = "lead" | "sponsor" | "partner" | "editorial" | "revenue" | "other";

export interface FollowUp {
  id: string;
  contactName: string;
  contactHandle?: string;
  type: FollowUpType;
  status: FollowUpStatus;
  subject: string;
  notes?: string;
  dueDate?: number;
  createdAt: number;
  updatedAt: number;
  snoozeUntil?: number;
  revenueValue?: number;
  brand?: string;
}

function readStore(): FollowUp[] {
  return safeGetJSON<FollowUp[]>(
    STORAGE_KEY,
    (raw): raw is FollowUp[] => Array.isArray(raw),
    [],
  );
}

function writeStore(items: FollowUp[]) {
  safeSetJSON(STORAGE_KEY, items.slice(0, MAX_ENTRIES));
}

let listeners = new Set<(items: FollowUp[]) => void>();

function notify(items: FollowUp[]) {
  listeners.forEach((cb) => cb(items));
}

export function addFollowUp(
  input: Omit<FollowUp, "id" | "createdAt" | "updatedAt">,
): FollowUp {
  const item: FollowUp = {
    ...input,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `fu_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const list = readStore();
  list.unshift(item);
  writeStore(list);
  notify(list);
  return item;
}

export function useMaxFollowUpTracker() {
  const [followUps, setFollowUps] = useState<FollowUp[]>(() => readStore());

  useEffect(() => {
    const listener = (items: FollowUp[]) => setFollowUps(items);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const addFollowUpItem = useCallback(
    (input: Omit<FollowUp, "id" | "createdAt" | "updatedAt">) => {
      return addFollowUp(input);
    },
    [],
  );

  const removeFollowUp = useCallback((id: string) => {
    const next = readStore().filter((item) => item.id !== id);
    writeStore(next);
    notify(next);
  }, []);

  const updateFollowUpStatus = useCallback(
    (id: string, status: FollowUpStatus) => {
      const next = readStore().map((item) =>
        item.id === id ? { ...item, status, updatedAt: Date.now() } : item,
      );
      writeStore(next);
      notify(next);
    },
    [],
  );

  const updateFollowUp = useCallback(
    (id: string, patch: Partial<Omit<FollowUp, "id" | "createdAt">>) => {
      const next = readStore().map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: Date.now() } : item,
      );
      writeStore(next);
      notify(next);
    },
    [],
  );

  const snoozeFollowUp = useCallback((id: string, until: number) => {
    const next = readStore().map((item) =>
      item.id === id
        ? { ...item, status: "snoozed" as FollowUpStatus, snoozeUntil: until, updatedAt: Date.now() }
        : item,
    );
    writeStore(next);
    notify(next);
  }, []);

  const getPending = useCallback(() => {
    const now = Date.now();
    return readStore().filter(
      (item) =>
        item.status === "pending" ||
        (item.status === "snoozed" && item.snoozeUntil !== undefined && item.snoozeUntil <= now),
    );
  }, []);

  return {
    followUps,
    addFollowUp: addFollowUpItem,
    removeFollowUp,
    updateFollowUpStatus,
    updateFollowUp,
    snoozeFollowUp,
    getPending,
  };
}
