/**
 * HMG Memory Router — deterministic routing rules.
 * Maps each MemoryType to the desks that can use it.
 * No AI, no fake intelligence — pure local rules.
 */

import type { MemoryType, RoutedSystem } from "./types";

export const MEMORY_ROUTING: Record<MemoryType, RoutedSystem[]> = {
  "founder-voice": ["editorial-desk", "artbot", "social-factory"],
  "old-article": ["editorial-desk", "artbot", "wordpress-builder"],
  "resume-bio": ["maximillion", "founder-os"],
  "pitch-deck": ["maximillion"],
  "sales-note": ["maximillion"],
  "relationship-note": ["maximillion", "relationship-graph"],
  "contact-csv": ["maximillion", "relationship-graph"],
  "brand-rule": ["editorial-desk", "artbot", "social-factory", "wordpress-builder", "webart"],
  "editorial-rule": ["editorial-desk", "artbot"],
  "wordpress-rule": ["wordpress-builder", "editorial-desk"],
  "social-example": ["social-factory", "artbot"],
  "revenue-max-note": ["maximillion"],
  "artbot-content-note": ["artbot", "editorial-desk"],
  "webart-visual-rule": ["webart", "hmg-visual-engine"],
  "webedit-clip-rule": ["webedit"],
};

export function routeMemoryItem(type: MemoryType): RoutedSystem[] {
  return MEMORY_ROUTING[type] ?? [];
}

export function getRoutingDescription(type: MemoryType): string {
  const systems = MEMORY_ROUTING[type] ?? [];
  if (systems.length === 0) return "No routing assigned.";
  const labels: Record<RoutedSystem, string> = {
    "editorial-desk": "Editorial Desk",
    artbot: "ARTBOT",
    "social-factory": "Social Factory",
    "wordpress-builder": "WordPress Builder",
    maximillion: "Maximillion",
    webart: "WebArt",
    "hmg-visual-engine": "HMG Visual Engine",
    webedit: "WebEdit",
    "relationship-graph": "Relationship Graph",
    "founder-os": "Founder OS",
  };
  return `Available to: ${systems.map((s) => labels[s]).join(", ")}.`;
}

export function isMaxMemory(type: MemoryType): boolean {
  return MEMORY_ROUTING[type]?.includes("maximillion") ?? false;
}

export function isEditorialMemory(type: MemoryType): boolean {
  const routes = MEMORY_ROUTING[type] ?? [];
  return routes.includes("editorial-desk") || routes.includes("artbot");
}

export function isVisualMemory(type: MemoryType): boolean {
  const routes = MEMORY_ROUTING[type] ?? [];
  return routes.includes("webart") || routes.includes("hmg-visual-engine");
}

export function isWordPressMemory(type: MemoryType): boolean {
  return MEMORY_ROUTING[type]?.includes("wordpress-builder") ?? false;
}

export function isSocialMemory(type: MemoryType): boolean {
  return MEMORY_ROUTING[type]?.includes("social-factory") ?? false;
}

/**
 * Given a target system, return all MemoryTypes that route to it.
 */
export function getTypesForSystem(system: RoutedSystem): MemoryType[] {
  return (Object.keys(MEMORY_ROUTING) as MemoryType[]).filter((type) =>
    MEMORY_ROUTING[type].includes(system),
  );
}
