import { useCallback, useEffect, useState } from "react";

export type TrentOverrideToggleId =
  | "sharper"
  | "funnier"
  | "more-historical"
  | "more-chaotic"
  | "more-respectful"
  | "more-sponsor-friendly"
  | "more-breaking-news"
  | "more-radio-host"
  | "less-fluff"
  | "shorter"
  | "longer";

export interface TrentOverrideToggleDef {
  id: TrentOverrideToggleId;
  label: string;
  serverName: string;
  hint: string;
}

export const TRENT_OVERRIDE_TOGGLES: TrentOverrideToggleDef[] = [
  {
    id: "sharper",
    label: "Sharper",
    serverName: "Sharper",
    hint: "Tighter sentences, stronger verbs, no hedging.",
  },
  {
    id: "funnier",
    label: "Funnier",
    serverName: "Funnier",
    hint: "More wit and punchlines without going corny.",
  },
  {
    id: "more-historical",
    label: "More historical",
    serverName: "More historical",
    hint: "Layer in rap / pop-culture history and context.",
  },
  {
    id: "more-chaotic",
    label: "More chaotic",
    serverName: "More chaotic",
    hint: "Faster pacing, bigger swings, sharper turns.",
  },
  {
    id: "more-respectful",
    label: "More respectful",
    serverName: "More respectful",
    hint: "Dial back snark, treat subjects with dignity.",
  },
  {
    id: "more-sponsor-friendly",
    label: "More sponsor-friendly",
    serverName: "More sponsor-friendly",
    hint: "Soften shock words, no profanity, ad-safe.",
  },
  {
    id: "more-breaking-news",
    label: "More breaking-news energy",
    serverName: "More breaking-news energy",
    hint: "Urgency, present tense, what we know / what's next.",
  },
  {
    id: "more-radio-host",
    label: "More radio-host energy",
    serverName: "More radio-host energy",
    hint: "Spoken-word cadence, direct address, call-and-response.",
  },
  {
    id: "less-fluff",
    label: "Less fluff",
    serverName: "Less fluff",
    hint: "Kill filler. Every sentence earns its place.",
  },
  {
    id: "shorter",
    label: "Shorter",
    serverName: "Shorter",
    hint: "Cut to ~60-70% of the original length.",
  },
  {
    id: "longer",
    label: "Longer",
    serverName: "Longer",
    hint: "Expand to ~130-150% with context and color.",
  },
];

export const TRENT_OVERRIDE_STORAGE_KEY = "hmg-trent-override-v1";
const CHANGED_EVENT = "hmg-trent-override-changed";
const MAX_CUSTOM_LEN = 600;
const MAX_DRAFT_LEN = 16_000;

export interface TrentOverridePrefs {
  toggles: TrentOverrideToggleId[];
  custom: string;
}

const EMPTY_PREFS: TrentOverridePrefs = { toggles: [], custom: "" };

function isToggleId(value: unknown): value is TrentOverrideToggleId {
  return (
    typeof value === "string" &&
    TRENT_OVERRIDE_TOGGLES.some((t) => t.id === value)
  );
}

function readPrefs(): TrentOverridePrefs {
  if (typeof window === "undefined") return EMPTY_PREFS;
  try {
    const raw = window.localStorage.getItem(TRENT_OVERRIDE_STORAGE_KEY);
    if (!raw) return EMPTY_PREFS;
    const parsed = JSON.parse(raw) as Partial<TrentOverridePrefs> | null;
    if (!parsed || typeof parsed !== "object") return EMPTY_PREFS;
    const togglesRaw = Array.isArray(parsed.toggles) ? parsed.toggles : [];
    const toggles: TrentOverrideToggleId[] = [];
    for (const t of togglesRaw) {
      if (isToggleId(t) && !toggles.includes(t)) toggles.push(t);
    }
    const custom =
      typeof parsed.custom === "string"
        ? parsed.custom.slice(0, MAX_CUSTOM_LEN)
        : "";
    return { toggles, custom };
  } catch {
    return EMPTY_PREFS;
  }
}

function writePrefs(prefs: TrentOverridePrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      TRENT_OVERRIDE_STORAGE_KEY,
      JSON.stringify(prefs),
    );
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export function useTrentOverridePrefs() {
  const [prefs, setPrefs] = useState<TrentOverridePrefs>(() => readPrefs());

  useEffect(() => {
    const handler = () => setPrefs(readPrefs());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const toggle = useCallback((id: TrentOverrideToggleId) => {
    const current = readPrefs();
    const next = current.toggles.includes(id)
      ? current.toggles.filter((t) => t !== id)
      : [...current.toggles, id];
    writePrefs({ ...current, toggles: next });
  }, []);

  const setCustom = useCallback((value: string) => {
    const current = readPrefs();
    writePrefs({ ...current, custom: value.slice(0, MAX_CUSTOM_LEN) });
  }, []);

  const reset = useCallback(() => {
    writePrefs(EMPTY_PREFS);
  }, []);

  return { prefs, toggle, setCustom, reset };
}

export interface TrentOverrideRequestInput {
  toggles: TrentOverrideToggleId[];
  custom: string;
  original: string;
}

/**
 * Build the user-prompt body sent to the `/openai/specialists` endpoint with
 * `specialist: "trentoverride"`. The server-side system prompt instructs the
 * model on how to interpret these labeled blocks.
 */
export function buildOverrideUserPrompt(input: TrentOverrideRequestInput): string {
  const safeOriginal = input.original.slice(0, MAX_DRAFT_LEN).trim();
  const toggleNames = input.toggles
    .map(
      (id) => TRENT_OVERRIDE_TOGGLES.find((t) => t.id === id)?.serverName ?? "",
    )
    .filter(Boolean)
    .join(", ");
  const customClean = input.custom.trim().slice(0, MAX_CUSTOM_LEN);
  return [
    `TOGGLES: ${toggleNames || "(none)"}`,
    `CUSTOM: ${customClean || "(none)"}`,
    `ORIGINAL DRAFT:`,
    safeOriginal,
  ].join("\n");
}

/**
 * True when there is at least one toggle selected OR a non-empty custom
 * instruction. Used to enable/disable the Override button.
 */
export function hasOverrideInstruction(prefs: TrentOverridePrefs): boolean {
  return prefs.toggles.length > 0 || prefs.custom.trim().length > 0;
}

export const TRENT_OVERRIDE_LIMITS = {
  MAX_CUSTOM_LEN,
  MAX_DRAFT_LEN,
};
