/**
 * Storage Health — quota-aware status, pinned-key protection,
 * pruning strategy, and export/import for all memory lanes.
 *
 * Built on top of safeStorage.ts — never throws, always signals via return value.
 */

import { estimateUsage, safeGetJSON, safeSetJSON, type SafeStorageReport } from "@/lib/safeStorage";
import { getAllItems as getMemoryItems } from "@/lib/hmg/memory/memoryStore";
import { readMaxMemory, readMaxNotes } from "@/lib/maxDeterministicEngine";

export interface MemoryLaneSummary {
  lane: string;
  storageKey: string;
  itemCount: number;
  estimatedBytes: number;
  pinned: boolean;
  lastUpdated: number | null;
  description: string;
}

export interface StorageHealthReport {
  usage: SafeStorageReport;
  lanes: MemoryLaneSummary[];
  totalItems: number;
  recommendations: string[];
  canExport: boolean;
  importReady: boolean;
}

const PINNED_KEYS = [
  "hmg-founder-knowledge-base-v1",
  "hmg-max-memory-v2",
  "hmg-operator-profile-v1",
  "hmg-wp-settings",
];

export const MEMORY_LANES = [
  { lane: "Founder Voice", key: "hmg-founder-voice-v1", description: "Founder Voice style samples and rules" },
  { lane: "Brand Rules", key: "hmg-brand-rules-v1", description: "Per-silo brand voice and style rules" },
  { lane: "WordPress Rules", key: "hmg-wp-rules-v1", description: "WordPress formatting and publishing rules" },
  { lane: "Editorial Rules", key: "hmg-editorial-rules-v1", description: "Source standards, tone guidelines, no-gossip rules" },
  { lane: "Social Examples", key: "hmg-social-examples-v1", description: "Platform-specific social caption examples" },
  { lane: "Max Revenue Notes", key: "hmg-max-memory-v2", description: "Maximillion revenue and opportunity notes" },
  { lane: "Relationship Notes", key: "hmg-max-notes-v1", description: "Contact and relationship intelligence" },
  { lane: "WebArt Visual Rules", key: "hmg-visual-rules-v1", description: "Visual identity and image direction rules" },
  { lane: "WebEdit Clip Rules", key: "hmg-clip-rules-v1", description: "Cut note and editing standards" },
  { lane: "Founder KB", key: "hmg-founder-knowledge-base-v1", description: "Main Founder Knowledge Base" },
  { lane: "Output History", key: "hmg-output-history-v1", description: "Saved content outputs and exports" },
  { lane: "WordPress Drafts", key: "hmg-wp-draft-history-v1", description: "WordPress draft history" },
];

function estimateKeyBytes(key: string): number {
  try {
    const val = localStorage.getItem(key) ?? "";
    return (key.length + val.length) * 2;
  } catch {
    return 0;
  }
}

function getKeyLastUpdated(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      if (typeof parsed.lastUpdated === "number") return parsed.lastUpdated;
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].updatedAt === "number") {
        return parsed[0].updatedAt;
      }
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].createdAt === "number") {
        return parsed[0].createdAt;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function getKeyItemCount(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.length;
    if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.items)) return parsed.items.length;
    }
    return 1;
  } catch {
    return 0;
  }
}

export function getStorageHealthReport(): StorageHealthReport {
  const usage = estimateUsage();

  const lanes: MemoryLaneSummary[] = MEMORY_LANES.map((l) => ({
    lane: l.lane,
    storageKey: l.key,
    itemCount: getKeyItemCount(l.key),
    estimatedBytes: estimateKeyBytes(l.key),
    pinned: PINNED_KEYS.includes(l.key),
    lastUpdated: getKeyLastUpdated(l.key),
    description: l.description,
  }));

  const totalItems = lanes.reduce((sum, l) => sum + l.itemCount, 0);
  const recommendations: string[] = [];

  if (usage.status === "critical" || usage.status === "hard-stop") {
    recommendations.push("⚠ Storage is near capacity — export and archive old outputs before adding more");
  }
  if (usage.pct > 0.5) {
    recommendations.push("Storage is over 50% full — consider exporting Output History to free space");
  }
  if (lanes.find((l) => l.lane === "Founder KB")?.itemCount === 0) {
    recommendations.push("Founder Knowledge Base is empty — add memory to unlock full ARTBOT and Max power");
  }
  if (lanes.find((l) => l.lane === "Max Revenue Notes")?.itemCount === 0) {
    recommendations.push("No Max revenue notes saved — add notes to power Max's money move recommendations");
  }

  return {
    usage,
    lanes: lanes.filter((l) => l.itemCount > 0 || l.pinned),
    totalItems,
    recommendations,
    canExport: totalItems > 0,
    importReady: true,
  };
}

export interface FullMemoryExport {
  exportedAt: number;
  version: 1;
  appVersion: string;
  founderKB: unknown;
  maxMemory: unknown;
  maxNotes: unknown;
  outputHistory: unknown;
  wpDraftHistory: unknown;
}

export function exportAllMemory(): FullMemoryExport {
  function safeRead(key: string): unknown {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  return {
    exportedAt: Date.now(),
    version: 1,
    appVersion: "2.0-power-pass",
    founderKB: safeRead("hmg-founder-knowledge-base-v1"),
    maxMemory: safeRead("hmg-max-memory-v2"),
    maxNotes: safeRead("hmg-max-notes-v1"),
    outputHistory: safeRead("hmg-output-history-v1"),
    wpDraftHistory: safeRead("hmg-wp-draft-history-v1"),
  };
}

export interface ImportResult {
  success: boolean;
  imported: string[];
  skipped: string[];
  errors: string[];
}

function isFullMemoryExport(raw: unknown): raw is FullMemoryExport {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  return typeof o.version === "number" && typeof o.exportedAt === "number";
}

export function importMemoryFromJSON(json: string): ImportResult {
  const result: ImportResult = { success: false, imported: [], skipped: [], errors: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    result.errors.push("Invalid JSON — file could not be parsed");
    return result;
  }

  if (!isFullMemoryExport(parsed)) {
    result.errors.push("Invalid export format — missing required version or exportedAt fields");
    return result;
  }

  const keyMap: Record<string, unknown> = {
    "hmg-founder-knowledge-base-v1": parsed.founderKB,
    "hmg-max-memory-v2": parsed.maxMemory,
    "hmg-max-notes-v1": parsed.maxNotes,
    "hmg-output-history-v1": parsed.outputHistory,
    "hmg-wp-draft-history-v1": parsed.wpDraftHistory,
  };

  for (const [key, value] of Object.entries(keyMap)) {
    if (value == null) {
      result.skipped.push(key);
      continue;
    }
    try {
      const ok = safeSetJSON(key, value);
      if (ok) {
        result.imported.push(key);
      } else {
        result.errors.push(`${key}: storage write failed (quota?)`);
      }
    } catch (e) {
      result.errors.push(`${key}: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

export function exportMaxMemoryJSON(): string {
  return JSON.stringify({
    exportedAt: Date.now(),
    type: "max-memory",
    items: readMaxMemory(),
    notes: readMaxNotes(),
  }, null, 2);
}

export function exportFounderKBJSON(): string {
  const items = getMemoryItems();
  return JSON.stringify({ exportedAt: Date.now(), type: "founder-kb", items }, null, 2);
}

export function pruneUnpinnedOutputHistory(maxItems = 50): number {
  const key = "hmg-output-history-v1";
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : (parsed?.outputs ?? []);
    if (!Array.isArray(arr) || arr.length <= maxItems) return 0;
    const pruned = arr.slice(0, maxItems);
    const before = arr.length;
    localStorage.setItem(key, JSON.stringify(pruned));
    return before - maxItems;
  } catch {
    return 0;
  }
}
