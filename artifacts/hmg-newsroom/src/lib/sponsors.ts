import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hmg-sponsors-v1";
const CHANGED_EVENT = "hmg-sponsors-changed";
const MAX_ENTRIES = 500;

export const SPONSOR_SLOTS = [
  "header-banner",
  "sidebar-card",
  "command-center-panel",
  "socialfactory-output",
  "cutmaster-export",
  "artbot-export",
  "publishing-preview",
  "ai-staff-card",
] as const;

export type SponsorSlot = (typeof SPONSOR_SLOTS)[number];

export const SPONSOR_SLOT_LABELS: Record<SponsorSlot, string> = {
  "header-banner": "Header banner",
  "sidebar-card": "Sidebar card",
  "command-center-panel": "Command Center panel",
  "socialfactory-output": "Social Factory output",
  "cutmaster-export": "WebEdit export",
  "artbot-export": "Art Desk export",
  "publishing-preview": "Manual publish preview",
  "ai-staff-card": "AI Staff card",
};

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
  slot: SponsorSlot;
  silo: string;
  active: boolean;
  startDate: string;
  endDate: string;
  notes: string;
  impressions: number;
  clicks: number;
  createdAt: number;
  updatedAt: number;
}

export type SponsorInput = Omit<
  Sponsor,
  "id" | "createdAt" | "updatedAt" | "impressions" | "clicks"
>;

function read(): Sponsor[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Sponsor[]) : [];
  } catch {
    return [];
  }
}

function write(entries: Sponsor[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    /* ignore quota errors */
  }
}

function makeId() {
  return `spon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isExpiringSoon(s: Sponsor, days = 14): boolean {
  if (!s.endDate) return false;
  const end = new Date(s.endDate).getTime();
  if (Number.isNaN(end)) return false;
  const horizon = Date.now() + days * 24 * 60 * 60 * 1000;
  return end <= horizon && end >= Date.now();
}

export function isExpired(s: Sponsor): boolean {
  if (!s.endDate) return false;
  const end = new Date(s.endDate).getTime();
  if (Number.isNaN(end)) return false;
  return end < Date.now();
}

export function useSponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>(() => read());

  useEffect(() => {
    const handler = () => setSponsors(read());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const add = useCallback((input: SponsorInput): Sponsor => {
    const now = Date.now();
    const next: Sponsor = {
      ...input,
      id: makeId(),
      impressions: 0,
      clicks: 0,
      createdAt: now,
      updatedAt: now,
    };
    const list = [next, ...read()].slice(0, MAX_ENTRIES);
    write(list);
    return next;
  }, []);

  const update = useCallback((id: string, patch: Partial<SponsorInput>) => {
    const list = read().map((s) =>
      s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s,
    );
    write(list);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((s) => s.id !== id));
  }, []);

  const incrementImpression = useCallback((id: string) => {
    const list = read().map((s) =>
      s.id === id ? { ...s, impressions: s.impressions + 1 } : s,
    );
    write(list);
  }, []);

  const incrementClick = useCallback((id: string) => {
    const list = read().map((s) =>
      s.id === id ? { ...s, clicks: s.clicks + 1 } : s,
    );
    write(list);
  }, []);

  return {
    sponsors,
    add,
    update,
    remove,
    incrementImpression,
    incrementClick,
  };
}
