/**
 * ARTBOT / Editorial Memory Lane — deterministic starters from local memory.
 * No fake AI. No fake provider connection.
 * Rule-based, honest, local-first.
 */

import { getAllItems } from "./memoryStore";
import type { MemoryItem } from "./types";
import { isEditorialMemory } from "./memoryRouter";

export interface EditorialMemorySummary {
  totalItems: number;
  hasFounderVoice: boolean;
  hasOldArticles: boolean;
  hasBrandRules: boolean;
  hasEditorialRules: boolean;
  hasSocialExamples: boolean;
  hasWordPressRules: boolean;
  hasARTBOTNotes: boolean;
  topItems: MemoryItem[];
  localStatus: "local-memory-saved" | "empty";
}

export interface ARTBOTStarterAction {
  label: string;
  prompt: string;
  honestStatus: "deterministic-starter" | "no-data";
  requiresType?: string;
}

export function getEditorialMemoryItems(): MemoryItem[] {
  return getAllItems().filter((i) => isEditorialMemory(i.type));
}

export function getEditorialMemorySummary(): EditorialMemorySummary {
  const items = getAllItems();

  return {
    totalItems: items.filter((i) => isEditorialMemory(i.type)).length,
    hasFounderVoice: items.some((i) => i.type === "founder-voice"),
    hasOldArticles: items.some((i) => i.type === "old-article"),
    hasBrandRules: items.some((i) => i.type === "brand-rule"),
    hasEditorialRules: items.some((i) => i.type === "editorial-rule"),
    hasSocialExamples: items.some((i) => i.type === "social-example"),
    hasWordPressRules: items.some((i) => i.type === "wordpress-rule"),
    hasARTBOTNotes: items.some((i) => i.type === "artbot-content-note"),
    topItems: items.filter((i) => isEditorialMemory(i.type)).slice(0, 5),
    localStatus:
      items.filter((i) => isEditorialMemory(i.type)).length > 0
        ? "local-memory-saved"
        : "empty",
  };
}

export function buildARTBOTStarterActions(): ARTBOTStarterAction[] {
  const items = getAllItems();
  const actions: ARTBOTStarterAction[] = [];

  const founderVoice = items.find((i) => i.type === "founder-voice");
  const brandRules = items.filter((i) => i.type === "brand-rule");
  const oldArticles = items.filter((i) => i.type === "old-article");
  const editorialRules = items.filter((i) => i.type === "editorial-rule");
  const socialExamples = items.filter((i) => i.type === "social-example");
  const wpRules = items.filter((i) => i.type === "wordpress-rule");

  // Article Ideas
  actions.push({
    label: "Article Ideas",
    prompt: founderVoice
      ? `Generate 5 article ideas using the Founder Voice loaded: "${founderVoice.title}". Match tone and editorial standards.`
      : "Add a Founder Voice memory to generate brand-aligned article ideas.",
    honestStatus: founderVoice ? "deterministic-starter" : "no-data",
  });

  // Headline Help
  actions.push({
    label: "Headline Help",
    prompt:
      brandRules.length > 0
        ? `Write 5 headline variations following brand rule: "${brandRules[0].title}". No clickbait, no fake claims.`
        : "Add a Brand Rule memory to generate headline help aligned to HMG standards.",
    honestStatus: brandRules.length > 0 ? "deterministic-starter" : "no-data",
  });

  // Draft Cleanup Prompts
  actions.push({
    label: "Draft Cleanup Prompts",
    prompt:
      editorialRules.length > 0
        ? `Apply editorial rules from "${editorialRules[0].title}" to clean up draft. Check: structure, tone, facts.`
        : "Add an Editorial Rule memory to generate cleanup prompts.",
    honestStatus: editorialRules.length > 0 ? "deterministic-starter" : "no-data",
  });

  // Caption Starters
  actions.push({
    label: "Caption Starters",
    prompt:
      socialExamples.length > 0
        ? `Write 3 captions in the style of saved social example: "${socialExamples[0].title}".`
        : "Add a Social Example memory to generate caption starters.",
    honestStatus: socialExamples.length > 0 ? "deterministic-starter" : "no-data",
  });

  // WordPress Excerpt
  actions.push({
    label: "WordPress Excerpt",
    prompt:
      wpRules.length > 0
        ? `Write a WordPress excerpt following rule: "${wpRules[0].title}". Under 160 chars, no spoilers.`
        : "Add a WordPress Rule memory to generate WordPress-optimized excerpts.",
    honestStatus: wpRules.length > 0 ? "deterministic-starter" : "no-data",
  });

  // Founder Voice Check
  actions.push({
    label: "Founder Voice Check",
    prompt: founderVoice
      ? `Check this draft against Founder Voice: "${founderVoice.title}". Flag anything off-tone or off-brand.`
      : "Add a Founder Voice memory to run a brand voice check.",
    honestStatus: founderVoice ? "deterministic-starter" : "no-data",
  });

  // No-Gossip Check
  actions.push({
    label: "No-Gossip Check",
    prompt: "Review draft: flag any unverified claims, gossip, hearsay, or speculation. Mark items needing source.",
    honestStatus: "deterministic-starter",
  });

  // No-Fake-Claim Check
  actions.push({
    label: "No-Fake-Claim Check",
    prompt: "Review draft: flag any fabricated statistics, unverified quotes, or unattributed facts. Do not publish without verification.",
    honestStatus: "deterministic-starter",
  });

  // SEO Meta Starter
  actions.push({
    label: "SEO Meta Starter",
    prompt:
      oldArticles.length > 0
        ? `Generate SEO title + meta description based on article style from: "${oldArticles[0].title}". Under 160 chars meta.`
        : "Add an Old Article memory to generate SEO-aligned meta descriptions.",
    honestStatus: oldArticles.length > 0 ? "deterministic-starter" : "no-data",
  });

  // Source Checklist
  actions.push({
    label: "Source Checklist",
    prompt: "Generate a source verification checklist for this article: primary source, secondary source, official statement, quote attribution, image rights.",
    honestStatus: "deterministic-starter",
  });

  return actions;
}
