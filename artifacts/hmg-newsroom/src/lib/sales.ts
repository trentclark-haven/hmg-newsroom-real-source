import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hmg-sales-v1";
const CHANGED_EVENT = "hmg-sales-changed";
const MAX_ENTRIES = 500;

export const SALES_STAGES = [
  "lead",
  "contacted",
  "deck_sent",
  "negotiating",
  "closed_won",
  "closed_lost",
] as const;

export type SalesStage = (typeof SALES_STAGES)[number];

export const SALES_STAGE_LABELS: Record<SalesStage, string> = {
  lead: "Lead",
  contacted: "Contacted",
  deck_sent: "Deck Sent",
  negotiating: "Negotiating",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export const SALES_STAGE_COLORS: Record<SalesStage, string> = {
  lead: "#94a3b8",
  contacted: "#38bdf8",
  deck_sent: "#a855f7",
  negotiating: "#f59e0b",
  closed_won: "#10b981",
  closed_lost: "#ef4444",
};

export const REVENUE_TYPES = [
  "website_ads",
  "google_ads",
  "youtube_video",
  "social_sponsorship",
  "event_sponsorship",
  "print",
  "speaking",
  "affiliate",
  "ai_aeo",
  "partnership",
] as const;

export type RevenueType = (typeof REVENUE_TYPES)[number];

export const REVENUE_TYPE_LABELS: Record<RevenueType, string> = {
  website_ads: "Website Ads",
  google_ads: "Google Ads",
  youtube_video: "YouTube / Video",
  social_sponsorship: "Social Sponsorship",
  event_sponsorship: "Event Sponsorship",
  print: "Print / Publishing",
  speaking: "Speaking",
  affiliate: "Affiliate",
  ai_aeo: "AI / AEO",
  partnership: "Partnership",
};

export const LEAD_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export const LEAD_PRIORITY_LABELS: Record<LeadPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const LEGACY_STAGE_MAP: Record<string, SalesStage> = {
  "deck-sent": "deck_sent",
  "closed-won": "closed_won",
  "closed-lost": "closed_lost",
};

export interface Lead {
  id: string;
  company: string;
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  website: string;
  stage: SalesStage;
  priority: LeadPriority;
  estimatedValue: number;
  revenueType: RevenueType;
  brandFit: string;
  source: string;
  tags: string[];
  notes: string;
  nextFollowUpAt: string;
  owner: string;
  createdAt: number;
  updatedAt: number;
}

interface LegacySalesLeadFields {
  contact: string;
  category: string;
  interestedSilos: string[];
  proposedSpend: string;
  nextFollowUp: string;
}

export interface SalesLead extends Lead, LegacySalesLeadFields {}

export type SalesLeadInput = Omit<Lead, "id" | "createdAt" | "updatedAt"> &
  Partial<LegacySalesLeadFields>;

function read(): SalesLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.flatMap((entry) => {
          const lead = normalizeLead(entry);
          return lead ? [lead] : [];
        })
      : [];
  } catch {
    return [];
  }
}

function write(entries: SalesLead[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

function makeId() {
  return `lead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeLead(entry: unknown): SalesLead | null {
  if (!entry || typeof entry !== "object") return null;
  const raw = entry as Record<string, unknown>;
  const company = toText(raw.company);
  const contactName = toText(raw.contactName) || toText(raw.contact);
  const interestedSilos = toStringArray(raw.interestedSilos);
  const tags = toStringArray(raw.tags);
  const estimatedValue =
    toNumber(raw.estimatedValue) || parseMoney(toText(raw.proposedSpend));
  const revenueType = toRevenueType(raw.revenueType);
  const brandFit =
    toText(raw.brandFit) ||
    toText(raw.category) ||
    (interestedSilos.length ? interestedSilos.join(", ") : "");
  const nextFollowUpAt = toText(raw.nextFollowUpAt) || toText(raw.nextFollowUp);

  return {
    id: toText(raw.id) || makeId(),
    company,
    contactName,
    contactTitle: toText(raw.contactTitle),
    email: toText(raw.email),
    phone: toText(raw.phone),
    website: toText(raw.website),
    stage: toSalesStage(raw.stage),
    priority: toLeadPriority(raw.priority),
    estimatedValue,
    revenueType,
    brandFit,
    source: toText(raw.source),
    tags: tags.length ? tags : interestedSilos,
    notes: toText(raw.notes),
    nextFollowUpAt,
    owner: toText(raw.owner) || "Trent",
    createdAt: toNumber(raw.createdAt) || Date.now(),
    updatedAt: toNumber(raw.updatedAt) || Date.now(),
    contact: contactName,
    category: brandFit || REVENUE_TYPE_LABELS[revenueType],
    interestedSilos,
    proposedSpend: toText(raw.proposedSpend) || formatMoney(estimatedValue),
    nextFollowUp: nextFollowUpAt,
  };
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function parseMoney(value: string): number {
  if (!value) return 0;
  const cleaned = value.toLowerCase().replace(/[$,\s]/g, "");
  const multiplier = cleaned.includes("m")
    ? 1_000_000
    : cleaned.includes("k")
      ? 1_000
      : 1;
  const parsed = Number(cleaned.replace(/[a-z/]+/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed * multiplier) : 0;
}

function formatMoney(value: number): string {
  if (!value) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function toSalesStage(value: unknown): SalesStage {
  const stage = toText(value);
  const normalized = LEGACY_STAGE_MAP[stage] ?? stage;
  return SALES_STAGES.includes(normalized as SalesStage)
    ? (normalized as SalesStage)
    : "lead";
}

function toRevenueType(value: unknown): RevenueType {
  const revenueType = toText(value);
  return REVENUE_TYPES.includes(revenueType as RevenueType)
    ? (revenueType as RevenueType)
    : "social_sponsorship";
}

function toLeadPriority(value: unknown): LeadPriority {
  const priority = toText(value);
  return LEAD_PRIORITIES.includes(priority as LeadPriority)
    ? (priority as LeadPriority)
    : "medium";
}

export function useSalesPipeline() {
  const [leads, setLeads] = useState<SalesLead[]>(() => read());

  useEffect(() => {
    const handler = () => setLeads(read());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const add = useCallback((input: SalesLeadInput): SalesLead => {
    const now = Date.now();
    const next = normalizeLead({
      ...input,
      id: makeId(),
      createdAt: now,
      updatedAt: now,
    });
    if (!next) throw new Error("Unable to create sales lead");
    const list = [next, ...read()].slice(0, MAX_ENTRIES);
    write(list);
    return next;
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<SalesLeadInput>) => {
      const list = read().map((l) => {
        if (l.id !== id) return l;
        return (
          normalizeLead({ ...l, ...patch, updatedAt: Date.now() }) ?? l
        );
      });
      write(list);
    },
    [],
  );

  const moveStage = useCallback((id: string, stage: SalesStage) => {
    const list = read().map((l) =>
      l.id === id ? { ...l, stage, updatedAt: Date.now() } : l,
    );
    write(list);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((l) => l.id !== id));
  }, []);

  return { leads, add, update, moveStage, remove };
}
