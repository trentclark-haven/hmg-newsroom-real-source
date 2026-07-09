import { verticals } from "@/lib/mock-data";

export type GlobalSiloId = (typeof verticals)[number]["id"];
export const GLOBAL_SILO_KEY = "hmg-global-silo-v1";

export function isValidGlobalSilo(value: string): value is GlobalSiloId {
  return verticals.some((v) => v.id === value);
}

export function readGlobalSilo(): GlobalSiloId {
  if (typeof window === "undefined") return verticals[0].id;
  const raw = window.localStorage.getItem(GLOBAL_SILO_KEY);
  return raw && isValidGlobalSilo(raw) ? raw : verticals[0].id;
}

export function writeGlobalSilo(silo: GlobalSiloId): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GLOBAL_SILO_KEY, silo);
}
