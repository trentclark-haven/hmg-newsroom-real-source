import { useCallback, useEffect, useState } from "react";
import { recordAudit } from "./auditLog";

const STORAGE_KEY = "hmg-safe-mode-v1";
const CHANGED_EVENT = "hmg-safe-mode-changed";

/**
 * Capabilities that Safe Mode disables. View code reads these as documentation
 * for what the gate covers.
 */
export const SAFE_MODE_BLOCKS = [
  "ai-call",
  "publish",
  "media-upload",
] as const;
export type SafeModeBlock = (typeof SAFE_MODE_BLOCKS)[number];

export const SAFE_MODE_BLOCK_LABELS: Record<SafeModeBlock, string> = {
  "ai-call": "AI calls",
  publish: "Publishing",
  "media-upload": "Media uploads",
};

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

/**
 * Module-level synchronous read. Useful inside event handlers that must not
 * trip a re-render.
 */
export function isSafeMode(): boolean {
  return read();
}

/**
 * Record an audit entry every time Safe Mode blocks an action. The summary is
 * intentionally metadata-only.
 */
export function recordSafeModeBlock(block: SafeModeBlock, where: string) {
  recordAudit(
    "safe-mode-blocked",
    "system",
    `Blocked ${block} in ${where.slice(0, 40)}`,
  );
}

export function useSafeMode() {
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

  const setSafeMode = useCallback((next: boolean) => {
    write(next);
    recordAudit(
      "safe-mode-toggled",
      "system",
      `Safe Mode ${next ? "enabled" : "disabled"}`,
    );
  }, []);

  return { enabled, setSafeMode };
}
