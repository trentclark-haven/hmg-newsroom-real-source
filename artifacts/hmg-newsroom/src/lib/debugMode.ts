/**
 * Debug Mode toggle. Off by default. When ON, the Command Center exposes the
 * Failure Drill Panel so operators can rehearse error paths under real
 * conditions (queue, breaker, ledger, snapshots, audit). Stored locally only.
 */

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hmg-debug-mode-v1";
const CHANGED_EVENT = "hmg-debug-mode-changed";

function read(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function write(on: boolean) {
  try {
    if (on) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export function isDebugMode(): boolean {
  return read();
}

export function setDebugMode(on: boolean): void {
  write(on);
}

export function useDebugMode() {
  const [enabled, setEnabled] = useState<boolean>(() => read());
  useEffect(() => {
    const handler = () => setEnabled(read());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  const toggle = useCallback(() => {
    write(!read());
  }, []);
  return { enabled, toggle };
}
