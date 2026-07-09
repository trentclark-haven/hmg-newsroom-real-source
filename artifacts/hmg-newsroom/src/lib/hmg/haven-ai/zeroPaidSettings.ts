import { useCallback, useEffect, useState } from "react";

/**
 * Zero-paid router settings.
 *
 * Persists the Founder's lane preferences. The non-negotiable default is
 * paid-provider OFF: the Haven AI Engine runs on the owned local brain + corpus
 * (+ Ollama when configured) and only reaches a paid provider when the Founder
 * intentionally flips it on as an accelerator. Stored locally so it travels with
 * backups via the export allowlist (hmg-zero-paid-router-v1).
 */

export const ZERO_PAID_STORAGE_KEY = "hmg-zero-paid-router-v1";

export interface ZeroPaidSettings {
  /** Paid provider lane (OpenAI). Default false — zero-paid by default. */
  paidEnabled: boolean;
  /** Ollama / local-model lane. Default true — engages only if truly reachable. */
  ollamaEnabled: boolean;
}

const DEFAULTS: ZeroPaidSettings = {
  paidEnabled: false,
  ollamaEnabled: true,
};

function read(): ZeroPaidSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(ZERO_PAID_STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<ZeroPaidSettings>;
    return {
      paidEnabled: typeof parsed.paidEnabled === "boolean" ? parsed.paidEnabled : DEFAULTS.paidEnabled,
      ollamaEnabled:
        typeof parsed.ollamaEnabled === "boolean" ? parsed.ollamaEnabled : DEFAULTS.ollamaEnabled,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function write(value: ZeroPaidSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ZERO_PAID_STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage full / unavailable — settings stay in-memory for the session */
  }
}

export function useZeroPaidSettings() {
  const [settings, setSettings] = useState<ZeroPaidSettings>(read);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === ZERO_PAID_STORAGE_KEY) setSettings(read());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch: Partial<ZeroPaidSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      write(next);
      return next;
    });
  }, []);

  const setPaidEnabled = useCallback((on: boolean) => update({ paidEnabled: on }), [update]);
  const setOllamaEnabled = useCallback((on: boolean) => update({ ollamaEnabled: on }), [update]);

  return { settings, setPaidEnabled, setOllamaEnabled, update };
}
