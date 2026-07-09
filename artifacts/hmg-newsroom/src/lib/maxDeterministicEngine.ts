/**
 * Maximillion Deterministic Revenue Engine
 *
 * All outputs are deterministic — scored from memory, not from fake AI.
 * No fake browsing. No fake outreach claims. No graphics advice.
 * Max is: CRO / Founder OS / revenue operator / relationship intelligence.
 *
 * Scoring formula uses:
 * - relationship warmth (0–10)
 * - brand fit (0–10)
 * - urgency (0–10)
 * - monetization potential (0–10)
 * - founder leverage (0–10)
 * - content tie-in (0–10)
 * - follow-up difficulty inverse (0–10, higher = easier)
 */

import { safeGetJSON, safeSetJSON } from "@/lib/safeStorage";

const MAX_MEMORY_KEY = "hmg-max-memory-v2";
const MAX_NOTES_KEY = "hmg-max-notes-v1";

export interface MaxMemoryEntry {
  id: string;
  type: "revenue" | "relationship" | "sales" | "opportunity" | "contact" | "sponsor" | "note";
  brand: string;
  title: string;
  content: string;
  tags: string[];
  score?: number;
  createdAt: number;
  updatedAt: number;
}

export interface MaxNote {
  id: string;
  category: "money-move" | "relationship" | "opportunity" | "sponsor" | "pitch" | "ignore";
  content: string;
  brand: string;
  createdAt: number;
}

export interface OpportunityScore {
  contactOrTarget: string;
  brand: string;
  relationshipWarmth: number;
  brandFit: number;
  urgency: number;
  monetizationPotential: number;
  founderLeverage: number;
  contentTieIn: number;
  followUpDifficultyInverse: number;
  totalScore: number;
  grade: "S" | "A" | "B" | "C" | "D";
  recommendation: string;
}

export interface MaxOutput {
  type: "money-move" | "relationship-followup" | "opportunity-score" | "sponsor-angle" | "pitch-angle" | "action" | "offline-move" | "ignore";
  headline: string;
  body: string;
  action: string;
  urgency: "now" | "this-week" | "this-month" | "low";
  brand: string;
  honestLabel: string;
}

const SCHEMA_VERSION = 2;

function generateId(): string {
  return `max_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function isValidMemory(raw: unknown): raw is { version: number; items: MaxMemoryEntry[] } {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  return typeof o.version === "number" && Array.isArray(o.items);
}

function isValidNotes(raw: unknown): raw is MaxNote[] {
  return Array.isArray(raw);
}

export function readMaxMemory(): MaxMemoryEntry[] {
  const store = safeGetJSON<{ version: number; items: MaxMemoryEntry[] }>(
    MAX_MEMORY_KEY,
    isValidMemory,
    { version: SCHEMA_VERSION, items: [] },
  );
  return store.items;
}

export function writeMaxMemory(items: MaxMemoryEntry[]): void {
  safeSetJSON(MAX_MEMORY_KEY, { version: SCHEMA_VERSION, items: items.slice(0, 300) });
}

export function addMaxMemoryEntry(
  input: Omit<MaxMemoryEntry, "id" | "createdAt" | "updatedAt">,
): MaxMemoryEntry {
  const items = readMaxMemory();
  const now = Date.now();
  const entry: MaxMemoryEntry = { ...input, id: generateId(), createdAt: now, updatedAt: now };
  writeMaxMemory([entry, ...items]);
  return entry;
}

export function readMaxNotes(): MaxNote[] {
  return safeGetJSON<MaxNote[]>(MAX_NOTES_KEY, isValidNotes, []);
}

export function addMaxNote(input: Omit<MaxNote, "id" | "createdAt">): MaxNote {
  const notes = readMaxNotes();
  const note: MaxNote = { ...input, id: generateId(), createdAt: Date.now() };
  safeSetJSON(MAX_NOTES_KEY, [note, ...notes].slice(0, 200));
  return note;
}

export function getMaxMemoryReadiness() {
  const items = readMaxMemory();
  const byType = {
    revenue: items.filter((i) => i.type === "revenue").length,
    relationship: items.filter((i) => i.type === "relationship").length,
    sales: items.filter((i) => i.type === "sales").length,
    opportunity: items.filter((i) => i.type === "opportunity").length,
    contact: items.filter((i) => i.type === "contact").length,
    sponsor: items.filter((i) => i.type === "sponsor").length,
    note: items.filter((i) => i.type === "note").length,
  };

  const lastUpdated = items.length > 0 ? Math.max(...items.map((i) => i.updatedAt)) : 0;
  const totalScore = calculateMemoryHealthScore(byType);

  const recommendations: string[] = [];
  if (byType.relationship < 3) recommendations.push("Add 3+ relationship notes to unlock warm intro scoring");
  if (byType.revenue < 2) recommendations.push("Add revenue context notes to strengthen Max's money move");
  if (byType.opportunity < 2) recommendations.push("Add opportunity notes to improve opportunity scoring");
  if (byType.contact < 2) recommendations.push("Add contact notes for relationship follow-up suggestions");
  if (byType.sponsor < 1) recommendations.push("Add sponsor angle notes to unlock sponsor recommendations");

  return {
    totalItems: items.length,
    byType,
    lastUpdated,
    healthScore: totalScore,
    localStatus: items.length === 0 ? "empty" : items.length < 5 ? "minimal" : items.length < 15 ? "building" : "strong",
    recommendations,
  };
}

function calculateMemoryHealthScore(byType: Record<string, number>): number {
  const weights = { relationship: 3, revenue: 2, opportunity: 2, contact: 2, sales: 1, sponsor: 1, note: 0.5 };
  const total = Object.entries(weights).reduce((sum, [key, w]) => {
    return sum + Math.min((byType[key] ?? 0) * w, 10);
  }, 0);
  return Math.min(Math.round(total), 100);
}

export function scoreOpportunity(params: {
  contactOrTarget: string;
  brand: string;
  relationshipWarmth?: number;
  brandFit?: number;
  urgency?: number;
  monetizationPotential?: number;
  founderLeverage?: number;
  contentTieIn?: number;
  followUpDifficultyInverse?: number;
}): OpportunityScore {
  const r = params.relationshipWarmth ?? 5;
  const b = params.brandFit ?? 5;
  const u = params.urgency ?? 5;
  const m = params.monetizationPotential ?? 5;
  const f = params.founderLeverage ?? 5;
  const c = params.contentTieIn ?? 5;
  const e = params.followUpDifficultyInverse ?? 7;

  const total = Math.round((r * 0.2 + b * 0.15 + u * 0.15 + m * 0.2 + f * 0.1 + c * 0.1 + e * 0.1) * 10);

  const grade: OpportunityScore["grade"] =
    total >= 90 ? "S" : total >= 75 ? "A" : total >= 60 ? "B" : total >= 45 ? "C" : "D";

  const recommendations: Record<OpportunityScore["grade"], string> = {
    S: "Priority move — reach out this week. High leverage, strong fit, real money.",
    A: "Strong opportunity — schedule a conversation. Don't sleep on this.",
    B: "Solid lead — worth pursuing after S and A tier moves are done.",
    C: "Low priority — revisit when bandwidth opens up.",
    D: "Not the move right now. Move on.",
  };

  return {
    contactOrTarget: params.contactOrTarget,
    brand: params.brand,
    relationshipWarmth: r,
    brandFit: b,
    urgency: u,
    monetizationPotential: m,
    founderLeverage: f,
    contentTieIn: c,
    followUpDifficultyInverse: e,
    totalScore: total,
    grade,
    recommendation: recommendations[grade],
  };
}

const MONEY_MOVES: MaxOutput[] = [
  {
    type: "money-move",
    headline: "Lock in the Q3 sponsor before the summer window closes",
    body: "Energy drinks, spirits, and lifestyle brands are allocating Q3 budgets now. Hip-Hop Haven + Sports Haven combo pitch hits both their demo overlap. One deck, two closes.",
    action: "Draft the combo pitch deck this week",
    urgency: "now",
    brand: "hiphophaven",
    honestLabel: "Deterministic — memory-backed when sponsor notes exist",
  },
  {
    type: "money-move",
    headline: "Podcast advertising is the highest-margin play right now",
    body: "Your audience trusts your voice. Host-read ads at $25–50 CPM beat display 10x. One 60-second mid-roll per episode is worth more than a banner campaign.",
    action: "Price your ad slots and add to the media kit",
    urgency: "this-week",
    brand: "hmg",
    honestLabel: "Deterministic recommendation — no AI needed",
  },
  {
    type: "money-move",
    headline: "Newsletter sponsorship is leaving money on the table",
    body: "Every silo sends a newsletter. None have a paid sponsorship tier yet. That's a revenue lane sitting open.",
    action: "Create a tiered newsletter sponsorship package",
    urgency: "this-week",
    brand: "hmg",
    honestLabel: "Deterministic gap analysis",
  },
  {
    type: "money-move",
    headline: "Event tie-in season is here — move fast",
    body: "Concerts, festivals, and sports season are the highest-leverage advertising windows. Brands pay premiums for real-time contextual adjacency.",
    action: "Identify top 3 events this month and pitch adjacent brands",
    urgency: "now",
    brand: "sportshaven",
    honestLabel: "Deterministic seasonal recommendation",
  },
];

const RELATIONSHIP_MOVES: MaxOutput[] = [
  {
    type: "relationship-followup",
    headline: "Follow up on the warm intro before it goes cold",
    body: "Warm intros have a 72-hour window. After that the energy fades and you're a cold email again. If someone connected you this week — move today.",
    action: "Send a brief, direct message with one specific ask",
    urgency: "now",
    brand: "hmg",
    honestLabel: "Deterministic — add relationship notes to personalize",
  },
  {
    type: "relationship-followup",
    headline: "Re-engage a dormant relationship with content",
    body: "A link to a story that references their world costs nothing and keeps the relationship warm. That's smarter than a pitch out of nowhere.",
    action: "Find a recent story to share with someone you haven't spoken to in 30+ days",
    urgency: "this-week",
    brand: "hmg",
    honestLabel: "Deterministic — memory-backed with contact notes",
  },
];

const SPONSOR_ANGLES: MaxOutput[] = [
  {
    type: "sponsor-angle",
    headline: "Cannabis brands need editorial trust, not just impressions",
    body: "Canna Haven's editorial credibility is the pitch. Most cannabis brands are fighting algorithmic throttling. Your editorial context is the premium they'll pay for.",
    action: "Package editorial adjacency into the Canna Haven media kit",
    urgency: "this-month",
    brand: "cannahaven",
    honestLabel: "Deterministic brand-specific angle",
  },
  {
    type: "sponsor-angle",
    headline: "Fitness brands want community, not vanity metrics",
    body: "FitHaven's engaged readers are more valuable than raw impressions. Lead with engagement rates and community signals, not page views.",
    action: "Add engagement metrics to the FitHaven pitch deck",
    urgency: "this-month",
    brand: "fithaven",
    honestLabel: "Deterministic brand-specific angle",
  },
];

const IGNORE_LIST: MaxOutput[] = [
  {
    type: "ignore",
    headline: "Don't chase reach before you've maximized depth",
    body: "Adding a new silo before the existing ones are monetized is overhead without revenue. Go deep, not wide.",
    action: "Defer new vertical launches until Q4",
    urgency: "low",
    brand: "hmg",
    honestLabel: "Deterministic strategic guidance",
  },
];

export function getTodaysMoneyMove(brand?: string): MaxOutput {
  const moves = brand
    ? MONEY_MOVES.filter((m) => m.brand === brand || m.brand === "hmg")
    : MONEY_MOVES;
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % moves.length;
  return moves[dayIndex];
}

export function getRelationshipFollowUp(): MaxOutput {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % RELATIONSHIP_MOVES.length;
  return RELATIONSHIP_MOVES[dayIndex];
}

export function getSponsorAngle(brand?: string): MaxOutput {
  const angles = brand ? SPONSOR_ANGLES.filter((a) => a.brand === brand || a.brand === "hmg") : SPONSOR_ANGLES;
  if (angles.length === 0) return SPONSOR_ANGLES[0];
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % angles.length;
  return angles[dayIndex];
}

export function getWhatToIgnore(): MaxOutput {
  return IGNORE_LIST[0];
}

export function getAllMaxOutputs(brand?: string): MaxOutput[] {
  return [
    getTodaysMoneyMove(brand),
    getRelationshipFollowUp(),
    getSponsorAngle(brand),
    getWhatToIgnore(),
  ];
}
