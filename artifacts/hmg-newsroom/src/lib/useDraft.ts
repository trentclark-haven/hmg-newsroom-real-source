import { useCallback, useEffect, useRef, useState } from "react";
import { safeGet, safeRemove, safeSet } from "./safeStorage";

const PREFIX = "hmg-newsroom-draft::";

function storageKey(key: string) {
  return key.startsWith(PREFIX) ? key : `${PREFIX}${key}`;
}

function readDraft<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = safeGet(storageKey(key));
    if (!raw) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function writeDraft<T>(key: string, value: T) {
  try {
    safeSet(storageKey(key), JSON.stringify(value));
  } catch {
    /* quota / disabled — silently ignore */
  }
}

function eraseDraft(key: string) {
  try {
    safeRemove(storageKey(key));
  } catch {
    /* ignore */
  }
}

/**
 * Returns whether a saved draft exists for `key`.
 * Lightweight check — does not load or parse the value.
 */
export function hasDraft(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return safeGet(storageKey(key)) !== null;
  } catch {
    return false;
  }
}

/**
 * Generic versioned-key autosave hook.
 * `useDraft<T>(key, initial, debounceMs?)` returns `[value, setValue, clear]`.
 *
 * - Hydrates from localStorage on mount (if a saved draft exists).
 * - Debounced write on every change.
 * - `clear()` wipes the saved draft AND resets state to `initial`.
 *
 * IMPORTANT: never store secrets, file blobs, base64 images, or anything that
 * could leak across sessions. Pass plain JSON-serializable shapes only.
 */
export function useDraft<T>(
  key: string,
  initial: T,
  debounceMs = 400,
): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    const stored = readDraft<T>(key);
    return stored !== undefined ? stored : initial;
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextWriteRef = useRef(false);

  useEffect(() => {
    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      writeDraft<T>(key, value);
    }, debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [key, value, debounceMs]);

  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) =>
      typeof next === "function" ? (next as (p: T) => T)(prev) : next,
    );
  }, []);

  const clear = useCallback(() => {
    eraseDraft(key);
    skipNextWriteRef.current = true;
    setValue(initial);
  }, [key, initial]);

  return [value, update, clear];
}
