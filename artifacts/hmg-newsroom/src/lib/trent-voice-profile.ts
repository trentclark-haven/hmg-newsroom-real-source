import type { Silo } from "@workspace/api-client-react";

/**
 * Founder Voice — Trent Clark Mode
 *
 * Frontend-side metadata for the "Haven editorial voice informed by Trent Clark's
 * journalism style" feature. Used to:
 *   - render labels/descriptions in the AI Staff view
 *   - decide whether the toggle defaults ON for a given silo
 *
 * The actual style instructions injected into the AI system prompts live on
 * the server in `artifacts/api-server/src/lib/silo-prompts.ts` (TRENT_VOICE_LAYER).
 *
 * IMPORTANT: This voice is INSPIRED BY Trent Clark's public body of work and
 * editorial tendencies. We never reproduce sentences, paragraphs, or article
 * structures from any source article. We never claim the AI is Trent Clark.
 */

export const TRENT_VOICE_LABEL = "Founder Voice: Trent Clark Mode";

export const TRENT_VOICE_DESCRIPTION =
  "Haven editorial voice informed by Trent Clark's journalism style — hip-hop credibility, newsroom authority, no generic AI phrasing.";

export const TRENT_VOICE_TRAITS: string[] = [
  "Sharp, culturally fluent, confident, insider-aware",
  "Hip-hop credibility first; never generic entertainment-blog fluff",
  "Punchy opening lines with clear stakes",
  "Newsroom authority + street-level cultural fluency",
  "Humor and edge without losing factual discipline",
  "Strong sense of rap history and industry context",
  "Active verbs, clean forward motion",
  "No sterile AI phrasing, no fake slang",
];

export const FOUNDER_VOICE_DEFAULTS: Record<Silo, boolean> = {
  hmg: true,
  hiphophaven: true,
  raphaven: true,
  musichaven: true,
  sportshaven: false,
  fithaven: false,
  cannahaven: false,
};

export const TRENT_VOICE_BLEND_BY_SILO: Record<Silo, string> = {
  hmg: "Celebrity/newsroom instincts with fast, clickable, fact-checked entertainment reporting.",
  hiphophaven: "HipHopDX-style credibility, deeper hip-hop history, careful editorial polish.",
  raphaven: "Punchy newsroom-tabloid urgency with raw RapHaven attitude.",
  musichaven: "Applied lightly — keep brand elegant, add cultural confidence and sharper framing.",
  sportshaven: "Optional — adds newsroom credibility and editorial spine.",
  fithaven: "Optional — adds newsroom directness without sloganeering.",
  cannahaven: "Optional — adds Atlantic-meets-High-Times insider polish.",
};
