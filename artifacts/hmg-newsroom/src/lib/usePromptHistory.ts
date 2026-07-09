import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hmg-newsroom-prompt-history-v2";
const MAX_PER_SILO = 10;

type HistoryStore = Record<string, string[]>;

function readStore(): HistoryStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: HistoryStore) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function usePromptHistory(siloId: string) {
  const [history, setHistory] = useState<string[]>(() => {
    return readStore()[siloId] ?? [];
  });

  useEffect(() => {
    setHistory(readStore()[siloId] ?? []);
  }, [siloId]);

  const addPrompt = useCallback(
    (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;
      setHistory((prev) => {
        const next = [trimmed, ...prev.filter((p) => p !== trimmed)].slice(
          0,
          MAX_PER_SILO,
        );
        const store = readStore();
        store[siloId] = next;
        writeStore(store);
        return next;
      });
    },
    [siloId],
  );

  const removePrompt = useCallback(
    (prompt: string) => {
      setHistory((prev) => {
        const next = prev.filter((p) => p !== prompt);
        const store = readStore();
        store[siloId] = next;
        writeStore(store);
        return next;
      });
    },
    [siloId],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    const store = readStore();
    delete store[siloId];
    writeStore(store);
  }, [siloId]);

  return { history, addPrompt, removePrompt, clearHistory };
}
