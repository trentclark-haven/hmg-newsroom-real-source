import { useSyncExternalStore } from "react";

/**
 * Recovery Center module-health registry.
 *
 * A tiny, dependency-free external store that the app's ErrorBoundaries write to
 * when a module crashes, and the System Health / Recovery Center reads from to
 * show honest per-module status, the last error (secret-scrubbed), a plain
 * English "what to do next", and a retry/clear action.
 *
 * This never blocks creation and never fabricates status — a module is healthy
 * until something real fails. Errors are scrubbed of credential-shaped text and
 * truncated before they are ever stored or rendered.
 */

export type ModuleId =
  | "newsroom"
  | "socialfactory"
  | "artbot"
  | "cutmaster"
  | "wordpress"
  | "maximillion"
  | "seomaster"
  | "corpus"
  | "havenai"
  | "app"
  | (string & {});

export interface ModuleErrorRecord {
  moduleId: ModuleId;
  /** Plain-English, secret-scrubbed, length-capped message. */
  message: string;
  /** Epoch ms of the most recent occurrence. */
  at: number;
  /** Consecutive occurrences since the last clear. */
  count: number;
}

export interface ModuleMeta {
  id: ModuleId;
  name: string;
  blurb: string;
  /** What the Founder should do if this module trips. Plain English. */
  nextFix: string;
}

/**
 * Curated modules surfaced as primary cards in the Recovery Center. Any error
 * recorded against an id not in this list still renders under "Other modules"
 * so nothing is ever hidden.
 */
export const RECOVERY_MODULES: ModuleMeta[] = [
  {
    id: "newsroom",
    name: "Editorial Desk",
    blurb: "Quick + Breaking article drafts across all 7 silos.",
    nextFix:
      "Retry Create Article Draft — your draft is saved locally and not lost. If an outside service is down, the local desk still creates a usable draft.",
  },
  {
    id: "socialfactory",
    name: "Social Factory",
    blurb: "One story expanded into the full platform social output.",
    nextFix:
      "Retry Create Social Campaign. Your inputs are preserved, and the local desk keeps the output copyable.",
  },
  {
    id: "artbot",
    name: "WebArt",
    blurb: "Upload assets, create graphics, preview frames, and export visual outputs.",
    nextFix:
      "Retry. If the canvas is blank, re-upload your images. Very large images may need to be smaller before they load.",
  },
  {
    id: "cutmaster",
    name: "WebEdit",
    blurb: "Upload media, create cut plans, preview cut notes, and export receipts.",
    nextFix:
      "Retry, then re-select your media. If transcription is unavailable, use the manual transcript fallback — no fake captions.",
  },
  {
    id: "wordpress",
    name: "WordPress Bridge",
    blurb: "Pull-receiver drafts + manual export (no silent live push).",
    nextFix:
      "Use the Pull Receiver / Manual Export draft. Re-check the site credentials in WP Connections if a test fails.",
  },
  {
    id: "maximillion",
    name: "Maximillion",
    blurb: "Revenue brain, leads, sponsor offers and the AI console.",
    nextFix:
      "Retry your command. The always-on local brain answers even when no provider is connected — it never claims a provider it doesn't have.",
  },
  {
    id: "seomaster",
    name: "SEO Master",
    blurb: "Headlines, meta options, Yoast checklist and related stories.",
    nextFix:
      "Retry. Pick a silo and run again. The local brain covers any provider outage.",
  },
  {
    id: "corpus",
    name: "Knowledge Corpus",
    blurb: "Owned-intelligence retrieval that grounds answers with citations.",
    nextFix:
      "Re-ingest sources or check the API server. Search degrades to honest, ungrounded answers — it never invents citations.",
  },
  {
    id: "havenai",
    name: "Haven AI Control Center",
    blurb: "Zero-paid router status: local + corpus → Ollama → paid (off by default).",
    nextFix:
      "Refresh diagnostics. This panel only reports status — it never blocks generation.",
  },
  {
    id: "founderkb",
    name: "Founder Knowledge Base",
    blurb: "Local memory intake — Founder Voice, brand rules, Max notes, editorial rules, WordPress rules.",
    nextFix:
      "Reload the Founder Knowledge Base and re-save any memory that did not persist. All memory is localStorage-backed — no server required.",
  },
];

const META_BY_ID = new Map(RECOVERY_MODULES.map((m) => [m.id, m]));

export function getModuleMeta(id: ModuleId): ModuleMeta | undefined {
  return META_BY_ID.get(id);
}

const SCRUB_PATTERNS: Array<[RegExp, string]> = [
  [/sk-[A-Za-z0-9_-]{6,}/g, "sk-***"],
  [/Bearer\s+[A-Za-z0-9._-]{6,}/gi, "Bearer ***"],
  [/\b[A-Za-z0-9]{4}(?:\s[A-Za-z0-9]{4}){3,}\b/g, "**** (app password)"],
  [/(password|secret|token|api[_-]?key)\s*[:=]\s*\S+/gi, "$1: ***"],
];

/** Strip credential-shaped text and cap length so errors are safe to render. */
export function scrubMessage(input: string): string {
  let out = input;
  for (const [re, repl] of SCRUB_PATTERNS) out = out.replace(re, repl);
  out = out.replace(/\s+/g, " ").trim();
  return out.length > 280 ? `${out.slice(0, 277)}…` : out;
}

const errors = new Map<ModuleId, ModuleErrorRecord>();
const listeners = new Set<() => void>();
let snapshot: ModuleErrorRecord[] = [];

function emit() {
  snapshot = Array.from(errors.values()).sort((a, b) => b.at - a.at);
  for (const l of listeners) l();
}

export function recordModuleError(moduleId: ModuleId, error: unknown): void {
  const raw =
    error instanceof Error
      ? error.message || error.name
      : typeof error === "string"
        ? error
        : "Unexpected error";
  const message = scrubMessage(raw) || "Unexpected error";
  const existing = errors.get(moduleId);
  errors.set(moduleId, {
    moduleId,
    message,
    at: Date.now(),
    count: existing ? existing.count + 1 : 1,
  });
  emit();
}

export function clearModuleError(moduleId: ModuleId): void {
  if (errors.delete(moduleId)) emit();
}

export function clearAllModuleErrors(): void {
  if (errors.size) {
    errors.clear();
    emit();
  }
}

export function getModuleError(moduleId: ModuleId): ModuleErrorRecord | undefined {
  return errors.get(moduleId);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ModuleErrorRecord[] {
  return snapshot;
}

/** Live, sorted (newest-first) list of recorded module errors. */
export function useModuleHealth(): ModuleErrorRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export type OverallTone = "ok" | "warn" | "checking";

export interface OverallStatus {
  tone: OverallTone;
  headline: string;
}

/**
 * Synthesize the Recovery Center banner honestly. "All systems operational" is
 * only ever shown when there are zero recorded module errors AND the corpus
 * health check has resolved reachable. While a dependency check is still
 * pending we say "Checking" — never a premature all-clear.
 *
 * Ollama is intentionally NOT a degradation signal: in the zero-paid design a
 * blocked/unconfigured local model is the expected state and the always-on
 * local brain covers it, so it must not raise a false alarm.
 */
export function computeOverallStatus(input: {
  errorCount: number;
  /** true = reachable, false = check failed, null = still checking. */
  corpusReachable: boolean | null;
}): OverallStatus {
  if (input.errorCount > 0) {
    return {
      tone: "warn",
      headline: `${input.errorCount} module${input.errorCount > 1 ? "s" : ""} need attention`,
    };
  }
  if (input.corpusReachable === false) {
    return { tone: "warn", headline: "Corpus check needs attention" };
  }
  if (input.corpusReachable === null) {
    return { tone: "checking", headline: "Checking systems…" };
  }
  return { tone: "ok", headline: "All systems operational" };
}

/** Map a top-level View id to the module bucket it reports health under. */
export function viewToModuleId(view: string): ModuleId {
  switch (view) {
    case "newsroom":
      return "newsroom";
    case "socialfactory":
      return "socialfactory";
    case "artbot":
      return "artbot";
    case "cutmaster":
    case "clipbrand":
      return "cutmaster";
    case "wpconnections":
      return "wordpress";
    case "seomaster":
      return "seomaster";
    case "corpus":
      return "corpus";
    case "havenai":
      return "havenai";
    case "sales":
    case "commandcenter":
    case "aistaff":
    case "assignments":
      return "maximillion";
    case "founderkb":
      return "founderkb";
    default:
      return view;
  }
}
