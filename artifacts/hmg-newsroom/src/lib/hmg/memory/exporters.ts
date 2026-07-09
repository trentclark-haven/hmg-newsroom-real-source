/**
 * HMG Memory Exporters.
 * Produces clean JSON exports with schema version, date, source app, and routing map.
 */

import type { MemoryItem, MemoryType, MemoryExportPayload } from "./types";
import { MEMORY_SCHEMA_VERSION } from "./types";
import { MEMORY_ROUTING } from "./memoryRouter";
import { getAllItems, getItemsByType } from "./memoryStore";
import { isMaxMemory, isEditorialMemory } from "./memoryRouter";

function buildPayload(items: MemoryItem[]): MemoryExportPayload {
  return {
    schemaVersion: MEMORY_SCHEMA_VERSION,
    createdDate: new Date().toISOString(),
    sourceApp: "HMG Newsroom Suite",
    itemCount: items.length,
    items,
    routingMap: MEMORY_ROUTING,
  };
}

export function exportAllMemoryJSON(): string {
  const items = getAllItems();
  return JSON.stringify(buildPayload(items), null, 2);
}

export function exportFilteredMemoryJSON(types: MemoryType[]): string {
  const all = getAllItems();
  const filtered = types.length > 0 ? all.filter((i) => types.includes(i.type)) : all;
  return JSON.stringify(buildPayload(filtered), null, 2);
}

export function exportMaxMemoryJSON(): string {
  const items = getAllItems().filter((i) => isMaxMemory(i.type));
  return JSON.stringify(buildPayload(items), null, 2);
}

export function exportEditorialMemoryJSON(): string {
  const items = getAllItems().filter((i) => isEditorialMemory(i.type));
  return JSON.stringify(buildPayload(items), null, 2);
}

export function buildMemorySummaryText(): string {
  const items = getAllItems();
  if (items.length === 0) return "No memory items saved yet.";

  const lines: string[] = [
    `HMG Founder Knowledge Base — Summary`,
    `Generated: ${new Date().toLocaleString()}`,
    `Total items: ${items.length}`,
    ``,
  ];

  const byType: Partial<Record<MemoryType, MemoryItem[]>> = {};
  for (const item of items) {
    if (!byType[item.type]) byType[item.type] = [];
    byType[item.type]!.push(item);
  }

  for (const [type, group] of Object.entries(byType)) {
    if (!group || group.length === 0) continue;
    lines.push(`--- ${type.toUpperCase()} (${group.length}) ---`);
    for (const item of group) {
      lines.push(`  • ${item.title}`);
      if (item.preview) lines.push(`    ${item.preview.slice(0, 100)}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function buildRoutingSummaryText(): string {
  const lines: string[] = [
    "HMG Memory Routing Map",
    `Generated: ${new Date().toLocaleString()}`,
    "",
  ];
  for (const [type, systems] of Object.entries(MEMORY_ROUTING)) {
    lines.push(`${type} → ${systems.join(", ")}`);
  }
  return lines.join("\n");
}

/**
 * Trigger a browser download of a JSON string.
 */
export function downloadJSON(json: string, filename: string): void {
  try {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    /* ignore in non-browser environments */
  }
}
