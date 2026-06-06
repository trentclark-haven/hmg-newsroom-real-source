/**
 * Maximillion Memory Lane — deterministic previews from local memory.
 * No OpenAI. No Anthropic. No fake browsing. No fake autonomy.
 * Everything here is rule-based, honest, and local.
 */

import { getAllItems } from "./memoryStore";
import type { MemoryItem } from "./types";
import { isMaxMemory } from "./memoryRouter";

export interface MaxMemorySummary {
  totalItems: number;
  hasBio: boolean;
  hasPitchDeck: boolean;
  hasSalesNotes: boolean;
  hasRelationshipNotes: boolean;
  hasContacts: boolean;
  hasRevenueNotes: boolean;
  hasOpportunityNotes: boolean;
  topItems: MemoryItem[];
  pinnedItems: MemoryItem[];
  localStatus: "local-memory-saved" | "empty";
}

export interface MaxDeterministicPreview {
  label: string;
  value: string;
  honestStatus: "deterministic-recommendation" | "local-memory-saved" | "provider-hook-pending" | "no-data";
}

export function getMaxMemoryItems(): MemoryItem[] {
  return getAllItems().filter((i) => isMaxMemory(i.type));
}

export function getMaxMemorySummary(): MaxMemorySummary {
  const items = getMaxMemoryItems();
  const pinned = items.filter((i) => i.pinned);

  return {
    totalItems: items.length,
    hasBio: items.some((i) => i.type === "resume-bio"),
    hasPitchDeck: items.some((i) => i.type === "pitch-deck"),
    hasSalesNotes: items.some((i) => i.type === "sales-note"),
    hasRelationshipNotes: items.some((i) => i.type === "relationship-note"),
    hasContacts: items.some((i) => i.type === "contact-csv"),
    hasRevenueNotes: items.some((i) => i.type === "revenue-max-note"),
    hasOpportunityNotes: items.some((i) =>
      ["sales-note", "revenue-max-note", "pitch-deck"].includes(i.type),
    ),
    topItems: items.slice(0, 5),
    pinnedItems: pinned.slice(0, 3),
    localStatus: items.length > 0 ? "local-memory-saved" : "empty",
  };
}

/**
 * Deterministic previews — rule-based from local memory.
 * These are honest prompts/starters, NOT AI-generated or live outreach.
 */
export function buildMaxDeterministicPreviews(): MaxDeterministicPreview[] {
  const items = getMaxMemoryItems();
  const previews: MaxDeterministicPreview[] = [];

  // Today's Money Move
  const revenueNotes = items.filter((i) =>
    ["revenue-max-note", "sales-note"].includes(i.type),
  );
  if (revenueNotes.length > 0) {
    const top = revenueNotes[0];
    previews.push({
      label: "Today's Money Move",
      value: `Review: ${top.title}. ${top.preview.slice(0, 120)}`,
      honestStatus: "deterministic-recommendation",
    });
  } else {
    previews.push({
      label: "Today's Money Move",
      value: "Add a Revenue / Max Note to generate a daily money move prompt.",
      honestStatus: "no-data",
    });
  }

  // Relationship to Follow Up With
  const relationships = items.filter((i) =>
    ["relationship-note", "contact-csv"].includes(i.type),
  );
  if (relationships.length > 0) {
    const top = relationships[0];
    previews.push({
      label: "Relationship to Follow Up With",
      value: `${top.title}${top.notes ? ` — ${top.notes.slice(0, 80)}` : ""}`,
      honestStatus: "deterministic-recommendation",
    });
  } else {
    previews.push({
      label: "Relationship to Follow Up With",
      value: "Add Relationship Notes or Contact CSV to enable follow-up prompts.",
      honestStatus: "no-data",
    });
  }

  // Opportunity Score
  const opps = items.filter((i) =>
    ["sales-note", "pitch-deck", "revenue-max-note"].includes(i.type),
  );
  previews.push({
    label: "Opportunity Score",
    value:
      opps.length >= 3
        ? `${opps.length} opportunities loaded. Review top priority: ${opps[0].title}.`
        : opps.length > 0
          ? `${opps.length} opportunity note(s) loaded. Add more to strengthen scoring.`
          : "No opportunity notes saved. Add Sales Notes or Revenue Notes to score.",
    honestStatus: opps.length > 0 ? "deterministic-recommendation" : "no-data",
  });

  // Pitch Angle
  const pitches = items.filter((i) => i.type === "pitch-deck");
  const bio = items.find((i) => i.type === "resume-bio");
  if (pitches.length > 0 && bio) {
    previews.push({
      label: "Pitch Angle",
      value: `Pitch basis: ${pitches[0].title}. Bio loaded: ${bio.title}. Ready for angle review.`,
      honestStatus: "deterministic-recommendation",
    });
  } else {
    previews.push({
      label: "Pitch Angle",
      value: "Add a Pitch Deck and Resume / Bio to generate a pitch angle prompt.",
      honestStatus: pitches.length > 0 || bio ? "local-memory-saved" : "no-data",
    });
  }

  // Offline Money Move
  const allRevenue = items.filter((i) =>
    ["revenue-max-note", "sales-note", "relationship-note"].includes(i.type),
  );
  previews.push({
    label: "Offline Money Move",
    value:
      allRevenue.length >= 2
        ? `${allRevenue.length} revenue/relationship items. Top offline move: review ${allRevenue[0].title}.`
        : "Add Revenue Notes and Relationship Notes to surface offline money moves.",
    honestStatus: allRevenue.length > 0 ? "deterministic-recommendation" : "no-data",
  });

  // Follow-Up Draft
  const followUpCandidates = items.filter((i) =>
    ["relationship-note", "contact-csv", "sales-note"].includes(i.type),
  );
  if (followUpCandidates.length > 0) {
    const top = followUpCandidates[0];
    previews.push({
      label: "Follow-Up Draft",
      value: `Draft a follow-up for: ${top.title}. ${top.preview.slice(0, 100)}`,
      honestStatus: "deterministic-recommendation",
    });
  } else {
    previews.push({
      label: "Follow-Up Draft",
      value: "Add a Relationship Note or Sales Note to generate a follow-up draft starter.",
      honestStatus: "no-data",
    });
  }

  return previews;
}

export const MAX_MEMORY_STATUS_LABELS: Record<MaxDeterministicPreview["honestStatus"], string> = {
  "deterministic-recommendation": "Deterministic recommendation",
  "local-memory-saved": "Local memory saved",
  "provider-hook-pending": "Provider hook pending",
  "no-data": "No data",
};
