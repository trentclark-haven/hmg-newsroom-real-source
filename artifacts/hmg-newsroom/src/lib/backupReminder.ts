import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hmg-last-backup-v1";
const CHANGED_EVENT = "hmg-last-backup-changed";

const REMINDER_DAYS = 7;
const SOON_DAYS = 5;

function read(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function write(ts: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(ts));
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export function markBackupNow() {
  write(Date.now());
}

export interface BackupReminderState {
  lastTs: number | null;
  daysSince: number | null;
  dueSoon: boolean;
  overdue: boolean;
}

function compute(lastTs: number | null): BackupReminderState {
  if (lastTs == null) {
    return {
      lastTs: null,
      daysSince: null,
      dueSoon: false,
      overdue: true,
    };
  }
  const days = Math.floor((Date.now() - lastTs) / (1000 * 60 * 60 * 24));
  return {
    lastTs,
    daysSince: days,
    dueSoon: days >= SOON_DAYS && days < REMINDER_DAYS,
    overdue: days >= REMINDER_DAYS,
  };
}

export function useBackupReminder(): BackupReminderState {
  const [state, setState] = useState<BackupReminderState>(() =>
    compute(read()),
  );

  useEffect(() => {
    const handler = () => setState(compute(read()));
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return state;
}

/**
 * Trivial helper for displays that need a stable callback identity.
 */
export function useMarkBackupNow() {
  return useCallback(() => markBackupNow(), []);
}
