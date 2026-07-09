/**
 * Founder Knowledge Base — top-level aggregation and sample seeds.
 * Re-exports key helpers for convenience.
 */

export * from "./types";
export * from "./memoryStore";
export * from "./memoryRouter";
export * from "./importers";
export * from "./exporters";
export { getMaxMemoryItems, getMaxMemorySummary, buildMaxDeterministicPreviews, MAX_MEMORY_STATUS_LABELS } from "./maximillionMemory";
export { getEditorialMemoryItems, getEditorialMemorySummary, buildARTBOTStarterActions } from "./editorialMemory";

import { addMemoryItemAndNotify } from "./memoryStore";
import type { MemoryItem } from "./types";

/**
 * Sample seed items for quick-start onboarding.
 */
export function seedFounderVoiceSample(): MemoryItem {
  return addMemoryItemAndNotify({
    title: "HMG Founder Voice — Sample",
    type: "founder-voice",
    brand: "master",
    tags: ["voice", "tone", "editorial", "sample"],
    source: "Founder seed",
    notes: "Sample Founder Voice entry. Replace with your actual voice profile.",
    content: `HMG writes with authority, clarity, and respect for the audience.
No gossip. No fabricated quotes. No clickbait headlines.
We credit sources. We verify before publishing.
Tone: direct, credible, community-first.
Headline style: factual, punchy, no question mark clickbait.
Never publish rumor as fact.`,
    pinned: true,
  });
}

export function seedWordPressRuleSample(): MemoryItem {
  return addMemoryItemAndNotify({
    title: "HMG WordPress Rules — Sample",
    type: "wordpress-rule",
    brand: "master",
    tags: ["wordpress", "rules", "publishing", "sample"],
    source: "Founder seed",
    notes: "Sample WordPress rule set. Replace with actual site rules.",
    content: `WordPress publishing rules for HMG sites:
- Categories: use only approved brand categories (HipHopHaven, RapHaven, etc.)
- Tags: max 10 tags, all lowercase, hyphenated
- Slug: lowercase, hyphens only, no dates in slug, max 60 chars
- Excerpt: under 160 chars, no spoilers, end with period
- Featured image: required, minimum 1200x628px, credit in alt text
- SEO title: 50-60 chars, include primary keyword
- SEO meta: 150-160 chars, natural language, include CTA
- Status: Draft only — no live push from this app
- Author: set to correct byline before manual publish`,
    pinned: false,
  });
}

export function seedMaxRevenueSample(): MemoryItem {
  return addMemoryItemAndNotify({
    title: "Max Revenue Note — Sample",
    type: "revenue-max-note",
    brand: "master",
    tags: ["revenue", "max", "opportunities", "sample"],
    source: "Founder seed",
    notes: "Sample revenue note for Max. Replace with actual priorities.",
    content: `Current revenue priorities:
1. Podcast sponsorship — outreach to 3 targets this week
2. Display ad CPM optimization — review analytics Thursday
3. Newsletter paid tier — pricing review pending
4. Affiliate deal — music merch partner draft proposal
5. Event partnership — local venue Q3 opportunity

Offline money move: Follow up with sponsor contact from last week's event.`,
    pinned: false,
  });
}

export function seedBrandRuleSample(): MemoryItem {
  return addMemoryItemAndNotify({
    title: "HMG Brand Rules — Sample",
    type: "brand-rule",
    brand: "master",
    tags: ["brand", "rules", "guidelines", "sample"],
    source: "Founder seed",
    notes: "Sample brand rule set. Replace with actual HMG brand guidelines.",
    content: `HMG Brand Rules:
- Brand name: always "HMG" or full brand name (e.g. HipHopHaven), never abbreviated casually
- Logo: do not alter colors or proportions
- Tone: authoritative, community-first, never sensationalist
- Language: English, accessible reading level, no jargon without definition
- Attribution: always credit source, photographer, and artist
- Embargoes: honor all press embargoes — never break early
- Corrections policy: issue corrections prominently with timestamp
- Social voice: matches editorial voice — no slang that conflicts with brand
- Categories: use only approved categories per site
- Do not publish: rumor, unverified claims, personal attacks, gossip without verification`,
    pinned: false,
  });
}
