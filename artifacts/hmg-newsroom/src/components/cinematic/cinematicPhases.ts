/**
 * OPERATION ARRRUGGA — phase phrase tables.
 *
 * Each cross-system stage has a hero phrase, a milestone confirmation
 * ("awooga line"), and a list of cycling progress phrases used by
 * <PhasePanel> when work exceeds 2 seconds. Phrases are intentionally
 * short, action-oriented, and never repeat the verb — they are designed
 * to never feel like a static "Loading..." screen even on long runs.
 *
 * Adding a new stage: add it to STAGES, give it a hero / awooga / cycle
 * tuple here, and the rest of the cinematic system picks it up.
 */

export type Stage = "cut" | "create" | "distribute";

export const STAGES: readonly Stage[] = ["cut", "create", "distribute"] as const;

export interface StageDef {
  /** Display label on the StageRibbon. */
  label: string;
  /** Hero phrase shown by PhasePanel while in this stage. */
  hero: string;
  /** Awooga phrase shown when this stage completes successfully. */
  awooga: string;
  /** Glow color used by ribbon and panels when this stage is active. */
  color: string;
  /** Emoji icon shown in the StageRibbon. */
  icon: string;
  /** Cycling phrases for the PhasePanel. */
  cycle: readonly string[];
}

export const STAGE_DEFS: Record<Stage, StageDef> = {
  cut: {
    label: "CUT",
    hero: "Cutting through the noise…",
    awooga: "Frame locked.",
    color: "#22D3EE",
    icon: "🎬",
    cycle: [
      "Listening to the room",
      "Slicing the silence",
      "Catching every word",
      "Locking the frame",
      "Trimming the dead air",
      "Stamping the timeline",
    ],
  },
  create: {
    label: "CREATE",
    hero: "Painting the moment…",
    awooga: "Story found.",
    color: "#A855F7",
    icon: "🖼️",
    cycle: [
      "Mixing the palette",
      "Drafting the scene",
      "Testing brand lock",
      "Rolling alternates",
      "Polishing the highlights",
      "Composing the hero shot",
    ],
  },
  distribute: {
    label: "DISTRIBUTE",
    hero: "Turning sparks into headlines…",
    awooga: "Pack assembled.",
    color: "#F472B6",
    icon: "📣",
    cycle: [
      "Building the hooks",
      "Tuning every channel",
      "Optimizing delivery",
      "Wiring the CTAs",
      "Stamping the hashtags",
      "Loading the launch sequence",
    ],
  },
};

/**
 * Generic editorial filler used by PhasePanel before any stage begins
 * or when a generic action is in flight that hasn't claimed a stage.
 */
export const GENERIC_CYCLE: readonly string[] = [
  "Spinning up the room",
  "Waking the workers",
  "Warming the lines",
  "Catching breath",
  "Standing by",
];

/**
 * Pick the next phrase to show. Deterministic-by-index so the same
 * tick number across restarts always shows the same phrase — useful
 * for visual stability and for tests.
 */
export function phraseForTick(stage: Stage | null, tick: number): string {
  const cycle = stage ? STAGE_DEFS[stage].cycle : GENERIC_CYCLE;
  if (cycle.length === 0) return "Working";
  return cycle[Math.abs(tick) % cycle.length] ?? "Working";
}
