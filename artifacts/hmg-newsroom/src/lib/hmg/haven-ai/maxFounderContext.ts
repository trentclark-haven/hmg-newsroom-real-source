/**
 * Max Founder Context Model
 *
 * Local-first Founder DNA for Max CRO intelligence.
 * Stored in localStorage only. No cloud sync.
 * Truth label: Local Max Intelligence — Founder context helps local Max recommendations.
 * No CRM or live memory system connected yet.
 */
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "hmg-newsroom-max-founder-context-v1";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface FounderContext {
  // Identity / DNA — seeded from safe public record
  founderName: string;
  careerHighlights: string[];
  editorialStrengths: string[];

  // Business priorities — Founder configures
  businessPriorities: string[];
  verticalPriorities: string[];           // e.g. HipHopHaven first, then MusicHaven
  noGoCategories: string[];               // categories Max should flag / avoid
  preferredSponsorCategories: string[];   // e.g. music-tech, streetwear, local-LA

  // Relationships — Founder configures
  relationshipNotes: string;              // free text, general warm lanes

  // Pricing / packaging
  pricingNotes: string;                   // e.g. "min $500 for article sponsorships"

  // Past wins — builds Max's pattern sense
  pastWins: string[];

  // Ignore list — things that always waste Founder time
  ignoredCategories: string[];

  // Voice preferences
  voicePreferences: string;              // e.g. "direct, no fluff, AAVE ok"

  updatedAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Safe seed — derived from prompt only (public career record)
// ──────────────────────────────────────────────────────────────────────────────

export const DEFAULT_FOUNDER_CONTEXT: FounderContext = {
  founderName: "Trent Clark",
  careerHighlights: [
    "Former TMZ Hip Hop Head",
    "Former HipHopDX Editor-In-Chief",
    "Former HipHopWired Senior Editor",
    "Former The Smoking Section Managing Editor",
  ],
  editorialStrengths: [
    "Hip-hop editorial instincts",
    "Speed and practical execution",
    "Audience-first storytelling",
    "Cultural media credibility",
    "Automation-first workflow design",
    "Mobile-first publishing",
  ],
  businessPriorities: [
    "Reduce unnecessary founder work",
    "Build repeatable content packages",
    "Develop sponsor relationships through editorial trust",
    "Grow HMG as a media brand, not just a blog network",
    "Automation and clean systems over complexity",
  ],
  verticalPriorities: [
    "HipHopHaven",
    "MusicHaven",
    "HMG Master Brand",
    "HavenSports",
  ],
  noGoCategories: [
    "Payday loans / predatory finance",
    "Tobacco / vaping (unless editorial news context)",
    "Fake luxury / knockoffs",
    "Political campaigns",
    "Pyramid scheme / MLM",
    "Anything requiring editorial compromise",
  ],
  preferredSponsorCategories: [
    "music-tech",
    "headphones-audio",
    "streetwear",
    "sneakers",
    "local-LA",
    "streaming-entertainment",
    "creator-tools",
  ],
  relationshipNotes: "Editorial relationships built at TMZ, DX, HipHopWired. Publicists, managers, and artists in hip-hop and R&B space.",
  pricingNotes: "",
  pastWins: [],
  ignoredCategories: [],
  voicePreferences: "Direct, executive, founder-first. AAVE welcome when it sharpens the point. No corporate fluff.",
  updatedAt: new Date().toISOString(),
};

// ──────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ──────────────────────────────────────────────────────────────────────────────

export function loadFounderContext(): FounderContext {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FOUNDER_CONTEXT;
    const parsed = JSON.parse(raw) as Partial<FounderContext>;
    return { ...DEFAULT_FOUNDER_CONTEXT, ...parsed };
  } catch {
    return DEFAULT_FOUNDER_CONTEXT;
  }
}

export function saveFounderContext(ctx: FounderContext): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...ctx, updatedAt: new Date().toISOString() }));
  } catch { /* ignore */ }
}

// ──────────────────────────────────────────────────────────────────────────────
// Context quality scoring (T13)
// ──────────────────────────────────────────────────────────────────────────────

export type ContextQualityLabel = "Empty" | "Basic" | "Useful" | "Strong";

export interface ContextQualityResult {
  label: ContextQualityLabel;
  score: number;          // 0–100
  what: string[];         // what Max knows
  missing: string[];      // what Max still needs
  missingImpact: string;  // how each missing piece hurts
}

export function scoreFounderContext(ctx: FounderContext): ContextQualityResult {
  const checks: Array<{ key: keyof FounderContext; weight: number; label: string; impact: string }> = [
    { key: "preferredSponsorCategories", weight: 20, label: "Preferred sponsor categories", impact: "Max can't prioritize sponsor angles without this." },
    { key: "noGoCategories", weight: 15, label: "No-go categories", impact: "Max may surface opportunities the Founder would never take." },
    { key: "verticalPriorities", weight: 15, label: "Vertical priorities", impact: "Max doesn't know which brands to weight first." },
    { key: "pricingNotes", weight: 15, label: "Pricing notes", impact: "Max can't filter low-value deals." },
    { key: "relationshipNotes", weight: 15, label: "Relationship notes", impact: "Max can't factor warm lanes into follow-up recommendations." },
    { key: "businessPriorities", weight: 10, label: "Business priorities", impact: "Max gives generic advice instead of founder-specific moves." },
    { key: "pastWins", weight: 10, label: "Past wins", impact: "Max can't pattern-match to what's worked before." },
  ];

  const what: string[] = [];
  const missing: string[] = [];
  const missingImpacts: string[] = [];
  let total = 0;

  for (const c of checks) {
    const val = ctx[c.key];
    const filled = Array.isArray(val) ? (val as string[]).length > 0 : typeof val === "string" && val.trim().length > 0;
    if (filled) {
      total += c.weight;
      what.push(c.label);
    } else {
      missing.push(c.label);
      missingImpacts.push(c.impact);
    }
  }

  const label: ContextQualityLabel =
    total >= 75 ? "Strong"
    : total >= 50 ? "Useful"
    : total >= 25 ? "Basic"
    : "Empty";

  return {
    label,
    score: total,
    what,
    missing,
    missingImpact: missingImpacts.join(" "),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// React hook
// ──────────────────────────────────────────────────────────────────────────────

export function useFounderContext() {
  const [context, setContext] = useState<FounderContext>(DEFAULT_FOUNDER_CONTEXT);
  const [quality, setQuality] = useState<ContextQualityResult>(() => scoreFounderContext(DEFAULT_FOUNDER_CONTEXT));

  useEffect(() => {
    const loaded = loadFounderContext();
    setContext(loaded);
    setQuality(scoreFounderContext(loaded));
  }, []);

  const update = useCallback((patch: Partial<FounderContext>) => {
    setContext((prev) => {
      const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
      saveFounderContext(next);
      setQuality(scoreFounderContext(next));
      return next;
    });
  }, []);

  const addToList = useCallback(
    (field: keyof Pick<FounderContext, "pastWins" | "ignoredCategories" | "noGoCategories" | "preferredSponsorCategories" | "verticalPriorities" | "businessPriorities" | "careerHighlights" | "editorialStrengths">, value: string) => {
      setContext((prev) => {
        const arr = [...(prev[field] as string[])];
        if (!arr.includes(value.trim()) && value.trim()) arr.push(value.trim());
        const next = { ...prev, [field]: arr, updatedAt: new Date().toISOString() };
        saveFounderContext(next);
        setQuality(scoreFounderContext(next));
        return next;
      });
    },
    [],
  );

  const removeFromList = useCallback(
    (field: keyof Pick<FounderContext, "pastWins" | "ignoredCategories" | "noGoCategories" | "preferredSponsorCategories" | "verticalPriorities" | "businessPriorities" | "careerHighlights" | "editorialStrengths">, value: string) => {
      setContext((prev) => {
        const arr = (prev[field] as string[]).filter((v) => v !== value);
        const next = { ...prev, [field]: arr, updatedAt: new Date().toISOString() };
        saveFounderContext(next);
        setQuality(scoreFounderContext(next));
        return next;
      });
    },
    [],
  );

  const reset = useCallback(() => {
    saveFounderContext(DEFAULT_FOUNDER_CONTEXT);
    setContext(DEFAULT_FOUNDER_CONTEXT);
    setQuality(scoreFounderContext(DEFAULT_FOUNDER_CONTEXT));
  }, []);

  return { context, quality, update, addToList, removeFromList, reset };
}
