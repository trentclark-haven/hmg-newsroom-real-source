/**
 * OPERATION ARRRUGGA barrel — single import surface for the cinematic
 * polish layer. Keep this thin; it should never re-export anything from
 * outside the cinematic/ directory.
 */

export {
  CinematicProvider,
  useCinematic,
  awoogaForStage,
  type CinematicAPI,
  type CurrentPhase,
  type PhaseHistoryEntry,
  type AwoogaEvent,
} from "./CinematicProvider";
export { StageRibbon } from "./StageRibbon";
export { PhasePanel } from "./PhasePanel";
export { AwoogaToast } from "./AwoogaToast";
export { HeroReveal } from "./HeroReveal";
export {
  STAGES,
  STAGE_DEFS,
  GENERIC_CYCLE,
  phraseForTick,
  type Stage,
  type StageDef,
} from "./cinematicPhases";
