/**
 * Max Founder Context Model — Final Overdrive
 *
 * Deeper Founder DNA. 6 quality labels. 12 context areas.
 * Copy fill-in prompts for every missing field.
 * Local-first localStorage only. No cloud sync.
 * Truth label: Local Max Intelligence — Founder context sharpens local recommendations.
 */
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "hmg-newsroom-max-founder-context-v1";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface FounderContext {
  // Identity / Career Canon — seeded from safe public record
  founderName: string;
  founderCareerCanon: string[];        // milestone career facts (public only)
  editorialVoiceCanon: string[];       // editorial style descriptors
  editorialStrengths: string[];

  // Money philosophy & deal style
  moneyPhilosophy: string;             // e.g. "Relationship money > cold pitch. Package > one-off."
  preferredDealStyle: string;          // e.g. "Retainer preferred. Project deals ok. No rev-share without upside"
  riskTolerance: "Low" | "Moderate" | "High" | "";

  // Communication & workflow
  preferredCommunicationStyle: string; // e.g. "Direct. Short. AAVE ok. No fluff."
  mobileWorkflowPreferences: string;   // e.g. "Mobile-first. Decisions made from phone."
  automationPreferences: string;       // e.g. "Automate everything possible. No repeated manual work."

  // Business priorities
  businessPriorities: string[];
  verticalPriorities: string[];
  verticalPriorityWeights: Record<string, number>; // e.g. { HipHopHaven: 10, MusicHaven: 8 }
  contentFranchiseIdeas: string[];     // repeatable content franchises Founder wants to build
  packagePreferences: string[];        // what packaging structures the Founder likes

  // Sponsors
  preferredSponsorCategories: string[];
  noGoCategories: string[];
  sponsorNoGoReasons: string;          // why certain categories are off-limits

  // Relationships
  relationshipNotes: string;
  relationshipWarmLanes: string[];     // named warm categories (not real contact names)

  // Pricing
  pricingNotes: string;

  // Reputation & time protection
  reputationRules: string;             // what would damage the brand / what to avoid
  timeProtectionRules: string;         // what should never reach the Founder without filtering
  repeatedWorkToAvoid: string;         // work Max should catch before Founder repeats it

  // Past wins & review style
  pastWins: string[];
  founderReviewStyle: string;          // e.g. "Top 3 bullets. Decision point clear. Mobile length."

  // Ignore list
  ignoredCategories: string[];

  // Voice
  voicePreferences: string;

  updatedAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Default — seeded from safe public Founder DNA only
// ──────────────────────────────────────────────────────────────────────────────

export const DEFAULT_FOUNDER_CONTEXT: FounderContext = {
  founderName: "Trent Clark",
  founderCareerCanon: [
    "Former TMZ Hip Hop Head",
    "Former HipHopDX Editor-In-Chief",
    "Former HipHopWired Senior Editor",
    "Former The Smoking Section Managing Editor",
  ],
  editorialVoiceCanon: [
    "Speed over polish when the story is live",
    "Cultural authority earned through editorial accuracy",
    "Audience-first before advertiser-first",
    "Black media credibility is non-negotiable",
  ],
  editorialStrengths: [
    "Hip-hop editorial instincts",
    "Speed and practical execution",
    "Audience-first storytelling",
    "Cultural media credibility",
    "Automation-first workflow design",
    "Mobile-first publishing",
  ],
  moneyPhilosophy: "Relationship money over cold pitch. Package over one-off. Credibility first, revenue second.",
  preferredDealStyle: "",
  riskTolerance: "",

  preferredCommunicationStyle: "Direct. Short. AAVE welcome when it sharpens the point. No corporate fluff.",
  mobileWorkflowPreferences: "Mobile-first decisions. Copy-ready briefs. Minimum scrolling. Fast read.",
  automationPreferences: "Automate everything possible. Reduce repeated Founder work to zero.",

  businessPriorities: [
    "Reduce unnecessary Founder work",
    "Build repeatable content packages",
    "Develop sponsor relationships through editorial trust",
    "Grow HMG as a media brand, not just a blog network",
    "Automation and clean systems over complexity",
  ],
  verticalPriorities: ["HipHopHaven", "MusicHaven", "HMG Master Brand", "HavenSports"],
  verticalPriorityWeights: { HipHopHaven: 10, MusicHaven: 8, "HMG Master Brand": 7, HavenSports: 6 },
  contentFranchiseIdeas: [],
  packagePreferences: [],

  preferredSponsorCategories: [
    "music-tech",
    "headphones-audio",
    "streetwear",
    "sneakers",
    "local-LA",
    "streaming-entertainment",
    "creator-tools",
  ],
  noGoCategories: [
    "Payday loans / predatory finance",
    "Tobacco / vaping (unless editorial news context)",
    "Fake luxury / knockoffs",
    "Political campaigns",
    "Pyramid scheme / MLM",
    "Anything requiring editorial compromise",
  ],
  sponsorNoGoReasons: "Protect editorial credibility. HMG name is the asset. No deal is worth brand compromise.",

  relationshipNotes: "Editorial relationships built at TMZ, DX, HipHopWired. Publicists, managers, and artists in hip-hop and R&B space.",
  relationshipWarmLanes: [
    "Hip-hop publicists (prior editorial coverage)",
    "Music managers (prior source relationships)",
    "Major label contacts (editorial history)",
  ],

  pricingNotes: "",

  reputationRules: "No beef content that serves no editorial purpose. No controversy plays that compromise source trust. No outing or privacy violations.",
  timeProtectionRules: "",
  repeatedWorkToAvoid: "",

  pastWins: [],
  founderReviewStyle: "Top 3 bullets. Clear decision point. Mobile-ready length. No corporate summaries.",

  ignoredCategories: [],
  voicePreferences: "Direct, executive, founder-first. AAVE welcome when it sharpens the point. No generic startup bro language.",
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
// Context quality scoring — 12 areas, 6 labels
// ──────────────────────────────────────────────────────────────────────────────

export type ContextQualityLabel = "Empty" | "Basic" | "Useful" | "Strong" | "Sharp";

export interface ContextArea {
  id: string;
  label: string;
  weight: number;
  filled: boolean;
  whatMaxKnows: string;
  whatMaxNeeds: string;
  whyItMatters: string;
  howToImprove: string;
  copyFillPrompt: string;
}

export interface ContextQualityResult {
  label: ContextQualityLabel;
  score: number;
  maxScore: number;
  areas: ContextArea[];
  what: string[];
  missing: string[];
  missingImpact: string;
  overallCopyPrompt: string;
}

export function scoreFounderContext(ctx: FounderContext): ContextQualityResult {
  type CheckConfig = {
    id: string; label: string; weight: number;
    check: (c: FounderContext) => boolean;
    whatFilled: string; whatMissing: string;
    whyMatters: string; howToImprove: string; copyPrompt: string;
  };

  const checks: CheckConfig[] = [
    {
      id: "sponsor-prefs", label: "Sponsor Preferences", weight: 15,
      check: (c) => c.preferredSponsorCategories.length > 0,
      whatFilled: "Preferred sponsor categories loaded.",
      whatMissing: "Max needs your preferred sponsor categories.",
      whyMatters: "Without this, Max surfaces generic sponsor angles instead of ones that fit your brand.",
      howToImprove: "Add 3–5 sponsor category types (e.g. music-tech, streetwear, local-LA).",
      copyPrompt: "My preferred sponsor categories are: [list them]. These fit best with HMG editorial because [reason].",
    },
    {
      id: "no-go", label: "No-Go Categories", weight: 12,
      check: (c) => c.noGoCategories.length > 0,
      whatFilled: "No-go categories defined.",
      whatMissing: "Max needs your no-go sponsor and content categories.",
      whyMatters: "Without this, Max may recommend opportunities you'd never take, wasting review time.",
      howToImprove: "List categories you'd never sponsor or cover regardless of the bag.",
      copyPrompt: "Categories I will never touch: [list them]. The reason is [reason].",
    },
    {
      id: "vertical-weights", label: "Vertical Priorities", weight: 10,
      check: (c) => c.verticalPriorities.length > 0,
      whatFilled: "Vertical priority order defined.",
      whatMissing: "Max doesn't know which HMG brands to prioritize.",
      whyMatters: "Max routes sponsor and content angles to verticals. Without priority order, routes are generic.",
      howToImprove: "Rank your 7 verticals from most to least important.",
      copyPrompt: "My vertical priority order from highest to lowest: [list them].",
    },
    {
      id: "pricing", label: "Pricing Notes", weight: 12,
      check: (c) => Boolean(c.pricingNotes?.trim()),
      whatFilled: "Pricing floor and structure noted.",
      whatMissing: "Max needs pricing notes before filtering deals.",
      whyMatters: "Without pricing notes, Max can't flag low-value deals or help structure clean packages.",
      howToImprove: "Add minimum price per deal type (article, social, retainer, etc.).",
      copyPrompt: "My pricing floor is: sponsored article = $[X], social package = $[X], monthly retainer = $[X].",
    },
    {
      id: "relationship-lanes", label: "Warm Relationship Lanes", weight: 10,
      check: (c) => Boolean(c.relationshipNotes?.trim()) || c.relationshipWarmLanes.length > 0,
      whatFilled: "Warm relationship lanes defined.",
      whatMissing: "Max needs relationship notes to surface follow-up angles.",
      whyMatters: "Without relationship context, Max gives cold-pitch advice instead of warm-lane strategy.",
      howToImprove: "Note your warm contact categories (not names): publicists, managers, label contacts.",
      copyPrompt: "My warm lanes include: [publicist types, manager categories, media relationships]. I have existing editorial history with [general description].",
    },
    {
      id: "deal-style", label: "Deal Style", weight: 8,
      check: (c) => Boolean(c.preferredDealStyle?.trim()),
      whatFilled: "Deal style preference noted.",
      whatMissing: "Max doesn't know your deal structure preferences.",
      whyMatters: "Without this, Max may suggest deal structures that don't fit your business model.",
      howToImprove: "Note whether you prefer retainers, project deals, rev-share, or flat fees.",
      copyPrompt: "My preferred deal structure is: [retainer/project/flat fee]. I avoid [deal types I don't like] because [reason].",
    },
    {
      id: "money-philosophy", label: "Money Philosophy", weight: 8,
      check: (c) => Boolean(c.moneyPhilosophy?.trim()),
      whatFilled: "Money philosophy defined.",
      whatMissing: "Max needs your money philosophy to align recommendations.",
      whyMatters: "Without this, Max gives generic CRO advice instead of founder-specific money logic.",
      howToImprove: "Write 1–2 sentences on how you think about money in the business.",
      copyPrompt: "My approach to money in the business: [your philosophy]. I prioritize [X] over [Y] because [reason].",
    },
    {
      id: "reputation-rules", label: "Reputation Rules", weight: 8,
      check: (c) => Boolean(c.reputationRules?.trim()),
      whatFilled: "Reputation and brand safety rules defined.",
      whatMissing: "Max needs reputation rules to filter risk.",
      whyMatters: "Without this, Max can't flag brand safety risks specific to your business.",
      howToImprove: "Note what would damage HMG's brand and what editorial lines you won't cross.",
      copyPrompt: "Things that would damage HMG's brand: [list]. Lines I won't cross editorially: [list].",
    },
    {
      id: "time-protection", label: "Time Protection Rules", weight: 6,
      check: (c) => Boolean(c.timeProtectionRules?.trim()),
      whatFilled: "Founder time protection rules defined.",
      whatMissing: "Max doesn't know what to filter before it reaches Founder.",
      whyMatters: "Without this, Max routes low-value items to Founder review unnecessarily.",
      howToImprove: "Note what categories of requests should be auto-filtered or delegated.",
      copyPrompt: "Things that should never reach me without pre-filtering: [list]. These should be handled by [process/delegate].",
    },
    {
      id: "content-franchises", label: "Content Franchise Ideas", weight: 5,
      check: (c) => c.contentFranchiseIdeas.length > 0,
      whatFilled: "Content franchise ideas on file.",
      whatMissing: "No content franchise ideas on file yet.",
      whyMatters: "Max can route Package plays to existing franchise concepts you want to build.",
      howToImprove: "Add recurring content series or franchise ideas you want to build out.",
      copyPrompt: "Recurring content ideas I want to build into franchises: [list them].",
    },
    {
      id: "past-wins", label: "Past Wins", weight: 5,
      check: (c) => c.pastWins.length > 0,
      whatFilled: "Past wins on file. Max can pattern-match.",
      whatMissing: "No past wins logged yet.",
      whyMatters: "Without past wins, Max can't pattern-match to what's worked before.",
      howToImprove: "Log 2–3 past successes (doesn't need to be specific dollar amounts).",
      copyPrompt: "Past wins I can reference: [general description of deals or editorial wins that worked].",
    },
    {
      id: "review-style", label: "Founder Review Style", weight: 1,
      check: (c) => Boolean(c.founderReviewStyle?.trim()),
      whatFilled: "Review style preference defined.",
      whatMissing: "Max will default to longer briefs without review style notes.",
      whyMatters: "Max can format output to match Founder reading style.",
      howToImprove: "Note how you prefer briefs: bullets, length, decision-point clarity.",
      copyPrompt: "I want Max briefs formatted as: [format]. Length should be [mobile / short / medium]. Always include [must-have elements].",
    },
  ];

  const maxScore = checks.reduce((a, c) => a + c.weight, 0);
  let total = 0;
  const what: string[] = [];
  const missing: string[] = [];
  const missingImpacts: string[] = [];
  const areas: ContextArea[] = [];

  for (const c of checks) {
    const filled = c.check(ctx);
    if (filled) {
      total += c.weight;
      what.push(c.label);
    } else {
      missing.push(c.label);
      missingImpacts.push(c.whyMatters);
    }
    areas.push({
      id: c.id,
      label: c.label,
      weight: c.weight,
      filled,
      whatMaxKnows: filled ? c.whatFilled : "",
      whatMaxNeeds: filled ? "" : c.whatMissing,
      whyItMatters: c.whyMatters,
      howToImprove: filled ? "" : c.howToImprove,
      copyFillPrompt: filled ? "" : c.copyPrompt,
    });
  }

  const pct = maxScore > 0 ? total / maxScore : 0;
  const label: ContextQualityLabel =
    pct >= 0.9 ? "Sharp"
    : pct >= 0.7 ? "Strong"
    : pct >= 0.5 ? "Useful"
    : pct >= 0.25 ? "Basic"
    : "Empty";

  const overallCopyPrompt = missing.length > 0
    ? `Max still needs: ${missing.slice(0, 3).join(", ")}. ${missingImpacts[0] ?? ""}`
    : "Max context is strong. Keep it updated as the business evolves.";

  return { label, score: total, maxScore, areas, what, missing, missingImpact: missingImpacts.join(" "), overallCopyPrompt };
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

  type ArrayField = keyof Pick<FounderContext,
    "pastWins" | "ignoredCategories" | "noGoCategories" | "preferredSponsorCategories" |
    "verticalPriorities" | "businessPriorities" | "editorialStrengths" |
    "founderCareerCanon" | "editorialVoiceCanon" | "contentFranchiseIdeas" | "packagePreferences" |
    "relationshipWarmLanes"
  >;

  const addToList = useCallback((field: ArrayField, value: string) => {
    setContext((prev) => {
      const arr = [...((prev[field] as string[]) ?? [])];
      if (!arr.includes(value.trim()) && value.trim()) arr.push(value.trim());
      const next = { ...prev, [field]: arr, updatedAt: new Date().toISOString() };
      saveFounderContext(next);
      setQuality(scoreFounderContext(next));
      return next;
    });
  }, []);

  const removeFromList = useCallback((field: ArrayField, value: string) => {
    setContext((prev) => {
      const arr = ((prev[field] as string[]) ?? []).filter((v) => v !== value);
      const next = { ...prev, [field]: arr, updatedAt: new Date().toISOString() };
      saveFounderContext(next);
      setQuality(scoreFounderContext(next));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    saveFounderContext(DEFAULT_FOUNDER_CONTEXT);
    setContext(DEFAULT_FOUNDER_CONTEXT);
    setQuality(scoreFounderContext(DEFAULT_FOUNDER_CONTEXT));
  }, []);

  return { context, quality, update, addToList, removeFromList, reset };
}

