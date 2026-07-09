import { useCallback, useEffect, useState } from "react";
import { safeGetJSON, safeSetJSON } from "./safeStorage";

const STORAGE_KEY = "hmg-media-library-v1";
const CHANGED_EVENT = "hmg-media-library-changed";
const MAX_ENTRIES = 200;

export interface MediaEntry {
  id: string;
  name: string;
  type: string;
  silo: string;
  intendedUse: string;
  createdAt: number;
}

function read(): MediaEntry[] {
  return safeGetJSON<MediaEntry[]>(
    STORAGE_KEY,
    (raw): raw is MediaEntry[] => Array.isArray(raw),
    [],
  );
}

function write(entries: MediaEntry[]) {
  if (safeSetJSON(STORAGE_KEY, entries.slice(0, MAX_ENTRIES))) {
    window.dispatchEvent(new Event(CHANGED_EVENT));
  }
}

function makeId() {
  return `media-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useMediaLibrary() {
  const [entries, setEntries] = useState<MediaEntry[]>(() => read());

  useEffect(() => {
    const handler = () => setEntries(read());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const add = useCallback(
    (entry: Omit<MediaEntry, "id" | "createdAt">) => {
      const next: MediaEntry = {
        ...entry,
        id: makeId(),
        createdAt: Date.now(),
      };
      const list = [next, ...read()].slice(0, MAX_ENTRIES);
      write(list);
      return next;
    },
    [],
  );

  const remove = useCallback((id: string) => {
    const list = read().filter((e) => e.id !== id);
    write(list);
  }, []);

  const clear = useCallback(() => {
    write([]);
  }, []);

  return { entries, add, remove, clear };
}
