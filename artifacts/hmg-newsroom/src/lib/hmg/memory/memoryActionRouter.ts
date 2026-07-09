/**
 * HMG Memory Action Router — T2 Supplemental Pass
 * Maps each MemoryType to the app views and desks that consume it.
 * Deterministic — no AI, no model calls, no fake intelligence.
 * Used by: Daily Brain Panel, Session Recap, FounderNextMoves, FounderKB "Used By" section.
 */

import type { MemoryType } from "./types";
import type { View } from "@/components/newsroom/MenuOverlay";

export interface MemoryAction {
  label: string;
  view: View;
  hint: string;
  priority: "critical" | "high" | "normal";
}

export const MEMORY_ACTION_MAP: Record<MemoryType, MemoryAction[]> = {
  "founder-voice": [
    { label: "ARTBOT Editorial", view: "artboteditorial", hint: "Founder Voice powers headline variants and editorial tone checks", priority: "critical" },
    { label: "Social Factory", view: "socialfactory", hint: "Voice informs caption tone, hook style, and platform copy", priority: "high" },
    { label: "Editorial Desk", view: "newsroom", hint: "Voice context used for brief generation and article review", priority: "normal" },
  ],
  "brand-rule": [
    { label: "ARTBOT Editorial", view: "artboteditorial", hint: "Brand rules gate what headlines and copy are acceptable", priority: "critical" },
    { label: "WebArt", view: "artbot", hint: "Visual brand rules power frame, layout, and color choices", priority: "high" },
    { label: "Social Factory", view: "socialfactory", hint: "Brand tone rules applied to all platform post copy", priority: "normal" },
  ],
  "editorial-rule": [
    { label: "ARTBOT Editorial", view: "artboteditorial", hint: "Editorial rules run gossip check, source standards, and fact check", priority: "critical" },
    { label: "Editorial Desk", view: "newsroom", hint: "Source and tone standards used in article review workflow", priority: "high" },
  ],
  "wordpress-rule": [
    { label: "WordPress Draft History", view: "wp-draft-history", hint: "WP rules auto-applied to every draft field — slug, excerpt, category, tags", priority: "critical" },
    { label: "Editorial Desk", view: "newsroom", hint: "Used for slug format, category, and excerpt guidance during article prep", priority: "high" },
  ],
  "revenue-max-note": [
    { label: "Command Center", view: "commandcenter", hint: "Max Revenue Notes power the Founder Next Moves engine", priority: "critical" },
    { label: "Sales Desk", view: "sales", hint: "Revenue notes fuel opportunity scoring and pipeline prioritization", priority: "high" },
  ],
  "sales-note": [
    { label: "Sales Desk", view: "sales", hint: "Sales notes inform pipeline follow-ups and sponsor conversations", priority: "high" },
    { label: "Command Center", view: "commandcenter", hint: "Powers Next Moves revenue suggestions and weekly focus", priority: "normal" },
  ],
  "relationship-note": [
    { label: "Command Center", view: "commandcenter", hint: "Relationship notes surface contact follow-up actions in Next Moves", priority: "high" },
    { label: "Sales Desk", view: "sales", hint: "Contact intel used for outreach scoring and relationship CRM", priority: "high" },
  ],
  "contact-csv": [
    { label: "Sales Desk", view: "sales", hint: "Contact CSV feeds the CRM pipeline view and sponsor tracking", priority: "high" },
    { label: "Command Center", view: "commandcenter", hint: "Contact data surfaces in Next Moves relationship actions", priority: "normal" },
  ],
  "social-example": [
    { label: "Social Factory", view: "socialfactory", hint: "Social examples train caption style and platform hook generation", priority: "high" },
  ],
  "old-article": [
    { label: "ARTBOT Editorial", view: "artboteditorial", hint: "Old articles provide editorial style reference and topic angle context", priority: "normal" },
    { label: "Editorial Desk", view: "newsroom", hint: "Reference for topic coverage depth and angle freshness checking", priority: "normal" },
  ],
  "resume-bio": [
    { label: "Command Center", view: "commandcenter", hint: "Bio used for byline, author block, and founder context generation", priority: "normal" },
  ],
  "pitch-deck": [
    { label: "Sales Desk", view: "sales", hint: "Pitch deck content used for sponsor angle builder and outreach copy", priority: "high" },
    { label: "Command Center", view: "commandcenter", hint: "Informs revenue strategy and Founder Next Moves suggestions", priority: "normal" },
  ],
  "artbot-content-note": [
    { label: "ARTBOT Editorial", view: "artboteditorial", hint: "Content notes power editorial idea generation and headline variants", priority: "high" },
    { label: "Editorial Desk", view: "newsroom", hint: "Informs article direction, brief generation, and story angle selection", priority: "normal" },
  ],
  "webart-visual-rule": [
    { label: "WebArt", view: "artbot", hint: "Visual rules gate every image, frame, and layout output in WebArt", priority: "critical" },
  ],
  "webedit-clip-rule": [
    { label: "WebEdit", view: "cutmaster", hint: "Clip rules power the 8-step editing workflow and cut note generation", priority: "critical" },
  ],
};

export function getActionsForMemoryType(type: MemoryType): MemoryAction[] {
  return MEMORY_ACTION_MAP[type] ?? [];
}

export function getTopActionForMemoryType(type: MemoryType): MemoryAction | null {
  return MEMORY_ACTION_MAP[type]?.[0] ?? null;
}

export function getSystemsUsingMemory(type: MemoryType): View[] {
  return (MEMORY_ACTION_MAP[type] ?? []).map((a) => a.view);
}

/**
 * Given a target view, return all MemoryTypes that route to it.
 * Useful for "this memory powers these desks" display.
 */
export function getTypesForView(view: View): MemoryType[] {
  return (Object.keys(MEMORY_ACTION_MAP) as MemoryType[]).filter((type) =>
    MEMORY_ACTION_MAP[type].some((a) => a.view === view),
  );
}

/**
 * Given a list of loaded memory items, return which views are powered,
 * which critical types are missing, and what the operator should do next.
 */
export function buildMemoryActionSummary(items: { type: string }[]): {
  loadedTypes: MemoryType[];
  poweredViews: View[];
  missingImpact: string[];
  topNextAction: string;
} {
  const loadedTypes = [
    ...new Set(items.map((i) => i.type)),
  ] as MemoryType[];

  const poweredViews = [
    ...new Set(loadedTypes.flatMap((t) => getSystemsUsingMemory(t))),
  ];

  const missingImpact: string[] = [];

  if (!loadedTypes.includes("founder-voice")) {
    missingImpact.push("Editorial Desk and Social Factory lack voice context");
  }
  if (!loadedTypes.includes("brand-rule")) {
    missingImpact.push("WebArt and ARTBOT have no brand guardrails");
  }
  if (!loadedTypes.includes("editorial-rule")) {
    missingImpact.push("Gossip check and source standards not loaded");
  }
  if (!loadedTypes.includes("wordpress-rule")) {
    missingImpact.push("WordPress drafts use fallback field rules");
  }
  if (
    !loadedTypes.includes("revenue-max-note") &&
    !loadedTypes.includes("sales-note")
  ) {
    missingImpact.push("Max Next Moves engine has no revenue context");
  }
  if (
    !loadedTypes.includes("relationship-note") &&
    !loadedTypes.includes("contact-csv")
  ) {
    missingImpact.push("Sales Desk has no contact or relationship data");
  }

  let topNextAction = "Memory fully loaded — open Command Center and run today's content plan.";

  if (items.length === 0) {
    topNextAction = "No memory loaded — open Founder Knowledge Base and load Founder Voice, brand rules, and Max notes.";
  } else if (!loadedTypes.includes("founder-voice")) {
    topNextAction = "Add a Founder Voice memory item — it powers ARTBOT Editorial, Social Factory, and Editorial Desk.";
  } else if (!loadedTypes.includes("wordpress-rule")) {
    topNextAction = "Add WordPress rules — needed for clean draft export and category/tag field generation.";
  } else if (
    !loadedTypes.includes("revenue-max-note") &&
    !loadedTypes.includes("sales-note")
  ) {
    topNextAction = "Add Max Revenue notes — they power the Next Moves engine and opportunity scoring in Command Center.";
  }

  return { loadedTypes, poweredViews, missingImpact, topNextAction };
}
