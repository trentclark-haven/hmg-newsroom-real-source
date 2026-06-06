import type { HmgBrandKnowledge } from "@/lib/hmg/haven-ai/hmgKnowledgeBase";
import type { HavenMissionDefinition } from "@/lib/hmg/haven-ai/maximillionPersonality";
import { maximillionPersona } from "@/lib/hmg/haven-ai/maximillionPersonality";
import type { HavenChatTurn } from "@/lib/hmg/haven-ai/types";

export interface HavenContextArgs {
  brand: HmgBrandKnowledge;
  mission: HavenMissionDefinition;
  module?: string;
  leadsSummary?: string;
  history?: HavenChatTurn[];
  /** Assembled zero-paid corpus passages to ground the provider lane, if any. */
  corpusContext?: string;
}

export interface HavenContext {
  /** Compact situational summary used by the local brain. */
  summary: string;
  /** Full persona + mission + brand guidance for a provider lane. */
  systemHint: string;
  recentTopics: string[];
}

export function buildHavenContext(args: HavenContextArgs): HavenContext {
  const { brand, mission, module, leadsSummary, history, corpusContext } = args;

  const recentTopics = (history ?? [])
    .filter((turn) => turn.role === "user")
    .slice(-3)
    .map((turn) => turn.content.slice(0, 80));

  const summaryParts = [
    `Brand: ${brand.name} (${brand.toneLabel}).`,
    `Audience: ${brand.audience}`,
    `Mission: ${mission.label}.`,
    module ? `Module: ${module}.` : "",
    leadsSummary ? `Visible pipeline:\n${leadsSummary}` : "No pipeline summary supplied.",
    recentTopics.length ? `Recent topics: ${recentTopics.join(" | ")}` : "",
  ].filter(Boolean);

  const systemHint = [
    `You are ${maximillionPersona.name}, ${maximillionPersona.role}`,
    `Principles: ${maximillionPersona.principles.join(" ")}`,
    `Brand voice for ${brand.name}: ${brand.voiceRules.join(" ")}`,
    brand.compliance ? `Compliance: ${brand.compliance}` : "",
    `Mission focus: ${mission.systemHint}`,
    leadsSummary ? `Pipeline context:\n${leadsSummary}` : "",
    corpusContext
      ? `Grounding from the Haven Corpus — cite these passages by their [n] marker and do not invent facts beyond them:\n${corpusContext}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    summary: summaryParts.join("\n"),
    systemHint,
    recentTopics,
  };
}
