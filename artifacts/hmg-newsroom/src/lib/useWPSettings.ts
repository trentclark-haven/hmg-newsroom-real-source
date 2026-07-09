import { useCallback, useEffect, useState } from "react";
import { recordAudit } from "./auditLog";

const STORAGE_KEY = "hmg-newsroom-wp-settings-v2";

export interface WPCreds {
  url: string;
  user: string;
  password: string;
}

type WPStore = Record<string, WPCreds>;

function readStore(): WPStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as WPStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: WPStore) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

const listeners = new Set<(store: WPStore) => void>();

function notify(store: WPStore) {
  listeners.forEach((cb) => cb(store));
}

export function useWPSettings(silo: string) {
  const [creds, setCreds] = useState<WPCreds | undefined>(
    () => readStore()[silo],
  );

  useEffect(() => {
    setCreds(readStore()[silo]);
    const listener = (store: WPStore) => setCreds(store[silo]);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [silo]);

  const save = useCallback(
    (next: WPCreds) => {
      const store = readStore();
      const url = next.url.trim().replace(/\/+$/, "");
      const user = next.user.trim();
      store[silo] = {
        url,
        user,
        password: next.password.trim(),
      };
      writeStore(store);
      notify(store);
      // Only non-secret metadata is logged. Password is never passed.
      // We deliberately omit the raw url/user here — both are safe but the
      // audit log is for breadcrumbs, not a credential ledger.
      recordAudit(
        "wp-credentials-updated",
        silo,
        `Saved WP creds for ${silo}`,
      );
    },
    [silo],
  );

  const remove = useCallback(() => {
    const store = readStore();
    delete store[silo];
    writeStore(store);
    notify(store);
    recordAudit(
      "wp-credentials-updated",
      silo,
      `Cleared WP creds for ${silo}`,
    );
  }, [silo]);

  return { creds, save, remove };
}
