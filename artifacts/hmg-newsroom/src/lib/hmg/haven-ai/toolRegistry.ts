import type { HavenMissionMode } from "@/lib/hmg/haven-ai/types";

/**
 * Capabilities the Haven AI Engine can express per mission. Surfaced in the UI
 * as "what Maximillion can do here" and reusable as a future tool-calling map.
 */
export const havenToolRegistry: Record<HavenMissionMode, string[]> = {
  auto: ["Strategy read", "Next-action planning", "Copy-ready drafts"],
  founder_briefing: ["Wins/risks scan", "Opportunity ranking", "Leverage move"],
  sponsorship: ["Pitch angle", "Priced package tiers", "Outreach email", "Objection answer"],
  sales: ["Discovery framing", "Sales email", "Call opener", "Close path"],
  partnership: ["Value-exchange map", "Partnership structure", "Warm outreach DM"],
  follow_up: ["Multi-touch sequence", "Reply-driving copy", "Respectful breakup note"],
  objection_handling: ["Objection map", "Calm responses", "Reframe"],
  la_market: ["LA market read", "Local target list", "Local activation play"],
  internal_ops: ["Workflow mapping", "Handoff routing", "Team next actions"],
};

export function getMissionTools(mission: HavenMissionMode): string[] {
  return havenToolRegistry[mission] ?? havenToolRegistry.auto;
}
