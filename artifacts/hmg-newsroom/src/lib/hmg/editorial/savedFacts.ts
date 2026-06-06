import type { SavedFact, SavedFactKind } from "./types.ts";

const STORAGE_KEY = "hmg-editorial-saved-facts-v1";

function readStore(): SavedFact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedFact[]) : [];
  } catch {
    return [];
  }
}

function writeStore(facts: SavedFact[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(facts));
  } catch {
    /* storage may be full or blocked; surface in UI via try/catch caller */
  }
}

export function listSavedFacts(brand?: string): SavedFact[] {
  const all = readStore();
  if (!brand) return all;
  return all.filter((f) => !f.brand || f.brand === brand);
}

export function addSavedFact(
  fact: Omit<SavedFact, "id" | "createdAt">,
): SavedFact {
  const created: SavedFact = {
    ...fact,
    id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  const all = readStore();
  writeStore([created, ...all]);
  return created;
}

export function removeSavedFact(id: string): void {
  writeStore(readStore().filter((f) => f.id !== id));
}

export function updateSavedFact(
  id: string,
  patch: Partial<Omit<SavedFact, "id" | "createdAt">>,
): SavedFact | null {
  const all = readStore();
  const idx = all.findIndex((f) => f.id === id);
  if (idx < 0) return null;
  const next = { ...all[idx], ...patch };
  all[idx] = next;
  writeStore(all);
  return next;
}

export const SAVED_FACT_KINDS: { id: SavedFactKind; label: string }[] = [
  { id: "person", label: "Person" },
  { id: "artist", label: "Artist" },
  { id: "athlete", label: "Athlete" },
  { id: "team", label: "Team" },
  { id: "brand", label: "Brand / Company" },
  { id: "date", label: "Key Date" },
  { id: "context", label: "Context Note" },
  { id: "claim-warning", label: "Do-Not-Claim" },
];

export function factsAsNotesText(facts: SavedFact[]): string {
  return facts
    .map((f) => {
      const tag = SAVED_FACT_KINDS.find((k) => k.id === f.kind)?.label ?? f.kind;
      return `[${tag}] ${f.label}${f.detail ? ` — ${f.detail}` : ""}`;
    })
    .join("\n");
}
