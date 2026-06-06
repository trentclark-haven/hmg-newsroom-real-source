/**
 * OPERATION ARRRUGGA — cross-system cinematic context.
 *
 * Pure client-side orchestration layer. NO server calls, NO writes to
 * artifacts/api-server, NO writes to any /lib directory. The provider
 * tracks which stage of the CUT → CREATE → DISTRIBUTE pipeline is
 * currently active, how long the active phase has been running, what
 * milestones have completed, and how many assets / cache-hits have
 * been emitted. Consumers are the StageRibbon, PhasePanel, AwoogaToast,
 * and HeroReveal primitives plus the three pipeline views.
 *
 * Reliability contract (per OPERATION ARRRUGGA brief):
 *   - never block the UI
 *   - no layout shifts (animations use transform/opacity only)
 *   - degrades to silent no-op when a consumer forgets to wrap
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { Stage } from "./cinematicPhases";
import { STAGE_DEFS } from "./cinematicPhases";

export interface PhaseHistoryEntry {
  id: string;
  stage: Stage;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  status: "success" | "failure";
  summary: string | null;
}

export interface CurrentPhase {
  id: string;
  stage: Stage;
  startedAt: number;
  summary: string | null;
}

export interface AwoogaEvent {
  id: string;
  message: string;
  stage: Stage | null;
  emittedAt: number;
}

interface State {
  current: CurrentPhase | null;
  history: PhaseHistoryEntry[];
  awooga: AwoogaEvent | null;
  totalAssets: number;
  cacheHits: number;
  failures: number;
  /** monotonic counter so subscribers can re-render even when state shape
   * is identical (e.g. two consecutive "create" phases). */
  rev: number;
}

type Action =
  | { type: "begin"; stage: Stage; id: string; summary: string | null; at: number }
  | { type: "end"; id: string; status: "success" | "failure"; at: number }
  | { type: "awooga"; id: string; message: string; stage: Stage | null; at: number }
  | { type: "consumeAwooga"; id: string }
  | { type: "incCache"; n: number }
  | { type: "incAssets"; n: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "begin": {
      // If a phase is already in flight, mark it failed (runaway) and
      // start the new one. Defensive — should be rare with proper
      // begin/end pairing.
      let history = state.history;
      if (state.current) {
        const runaway: PhaseHistoryEntry = {
          id: state.current.id,
          stage: state.current.stage,
          startedAt: state.current.startedAt,
          endedAt: action.at,
          durationMs: action.at - state.current.startedAt,
          status: "failure",
          summary: state.current.summary,
        };
        history = [...history, runaway].slice(-50);
      }
      return {
        ...state,
        current: {
          id: action.id,
          stage: action.stage,
          startedAt: action.at,
          summary: action.summary,
        },
        history,
        rev: state.rev + 1,
      };
    }
    case "end": {
      if (!state.current || state.current.id !== action.id) {
        // stale end — ignore (already superseded by next begin)
        return state;
      }
      const entry: PhaseHistoryEntry = {
        id: state.current.id,
        stage: state.current.stage,
        startedAt: state.current.startedAt,
        endedAt: action.at,
        durationMs: action.at - state.current.startedAt,
        status: action.status,
        summary: state.current.summary,
      };
      return {
        ...state,
        current: null,
        history: [...state.history, entry].slice(-50),
        totalAssets:
          action.status === "success" ? state.totalAssets + 1 : state.totalAssets,
        failures:
          action.status === "failure" ? state.failures + 1 : state.failures,
        rev: state.rev + 1,
      };
    }
    case "awooga":
      return {
        ...state,
        awooga: {
          id: action.id,
          message: action.message,
          stage: action.stage,
          emittedAt: action.at,
        },
        rev: state.rev + 1,
      };
    case "consumeAwooga":
      if (!state.awooga || state.awooga.id !== action.id) return state;
      return { ...state, awooga: null, rev: state.rev + 1 };
    case "incCache":
      return { ...state, cacheHits: state.cacheHits + action.n, rev: state.rev + 1 };
    case "incAssets":
      return {
        ...state,
        totalAssets: state.totalAssets + action.n,
        rev: state.rev + 1,
      };
    default:
      return state;
  }
}

const INITIAL: State = {
  current: null,
  history: [],
  awooga: null,
  totalAssets: 0,
  cacheHits: 0,
  failures: 0,
  rev: 0,
};

export interface CinematicAPI {
  current: CurrentPhase | null;
  history: PhaseHistoryEntry[];
  awooga: AwoogaEvent | null;
  totalAssets: number;
  cacheHits: number;
  failures: number;
  /** Begin a phase. Returns the id used to end it. */
  beginPhase(stage: Stage, summary?: string): string;
  /** End a phase by id. Idempotent — safe to call after teardown. */
  endPhase(id: string, status?: "success" | "failure"): void;
  /** Fire a celebration toast. If a stage is given the toast picks up
   *  that stage's color; otherwise it shows in neutral. */
  awoogaSay(message: string, stage?: Stage | null): void;
  /** Consume the active awooga (called by the toast renderer after fade). */
  consumeAwooga(id: string): void;
  /** Increment counters for the StageRibbon mission-control display. */
  recordCacheHit(n?: number): void;
  recordAsset(n?: number): void;
}

const noop = () => {};
const SILENT: CinematicAPI = {
  current: null,
  history: [],
  awooga: null,
  totalAssets: 0,
  cacheHits: 0,
  failures: 0,
  beginPhase: () => "",
  endPhase: noop,
  awoogaSay: noop,
  consumeAwooga: noop,
  recordCacheHit: noop,
  recordAsset: noop,
};

const CinematicContext = createContext<CinematicAPI>(SILENT);

let _seq = 0;
function nextId(): string {
  _seq = (_seq + 1) % Number.MAX_SAFE_INTEGER;
  return `phase-${Date.now().toString(36)}-${_seq.toString(36)}`;
}

export function CinematicProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const stateRef = useRef(state);
  stateRef.current = state;

  const beginPhase = useCallback((stage: Stage, summary?: string): string => {
    const id = nextId();
    dispatch({ type: "begin", stage, id, summary: summary ?? null, at: Date.now() });
    // Skip side effects in non-DOM contexts (SSR, test env without window).
    if (typeof window === "undefined") return id;
    // Fire a tasteful haptic on capable mobile devices. No-op on desktop.
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try { navigator.vibrate(8); } catch { /* ignore */ }
    }
    // Public hook for future audio cues — listeners can wire SFX here.
    window.dispatchEvent(
      new CustomEvent("arrugga:phase-begin", { detail: { id, stage, summary } }),
    );
    return id;
  }, []);

  const endPhase = useCallback(
    (id: string, status: "success" | "failure" = "success") => {
      // Guard side effects: only fire haptic + event if this id is
      // actually the active phase. Stale ends (component unmount, retry
      // races) are dispatched but produce no false haptic / completion
      // event. Reducer is independently idempotent.
      const willClose = stateRef.current.current?.id === id;
      dispatch({ type: "end", id, status, at: Date.now() });
      if (!willClose) return;
      if (
        status === "success" &&
        typeof navigator !== "undefined" &&
        typeof navigator.vibrate === "function"
      ) {
        try { navigator.vibrate([6, 30, 18]); } catch { /* ignore */ }
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("arrugga:phase-end", { detail: { id, status } }),
        );
      }
    },
    [],
  );

  const awoogaSay = useCallback((message: string, stage?: Stage | null) => {
    const id = nextId();
    dispatch({ type: "awooga", id, message, stage: stage ?? null, at: Date.now() });
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("arrugga:awooga", { detail: { id, message, stage } }),
      );
    }
  }, []);

  const consumeAwooga = useCallback((id: string) => {
    dispatch({ type: "consumeAwooga", id });
  }, []);

  const recordCacheHit = useCallback((n: number = 1) => {
    dispatch({ type: "incCache", n });
  }, []);

  const recordAsset = useCallback((n: number = 1) => {
    dispatch({ type: "incAssets", n });
  }, []);

  // Auto-fail any phase that has been in flight for > 5 minutes. Safety
  // net so the StageRibbon never sticks on an active stage forever.
  useEffect(() => {
    const handle = setInterval(() => {
      const cur = stateRef.current.current;
      if (cur && Date.now() - cur.startedAt > 5 * 60 * 1000) {
        dispatch({ type: "end", id: cur.id, status: "failure", at: Date.now() });
      }
    }, 30_000);
    return () => clearInterval(handle);
  }, []);

  const api = useMemo<CinematicAPI>(
    () => ({
      current: state.current,
      history: state.history,
      awooga: state.awooga,
      totalAssets: state.totalAssets,
      cacheHits: state.cacheHits,
      failures: state.failures,
      beginPhase,
      endPhase,
      awoogaSay,
      consumeAwooga,
      recordCacheHit,
      recordAsset,
    }),
    [state, beginPhase, endPhase, awoogaSay, consumeAwooga, recordCacheHit, recordAsset],
  );

  return (
    <CinematicContext.Provider value={api}>{children}</CinematicContext.Provider>
  );
}

export function useCinematic(): CinematicAPI {
  return useContext(CinematicContext);
}

/**
 * Stage-bound helper: tracks an active phase id for the lifetime of an
 * async block. Usage:
 *
 *   const cine = useCinematic();
 *   const phase = cine.beginPhase("create", "Art Desk");
 *   try { ...; cine.endPhase(phase, "success"); cine.awoogaSay(STAGE_DEFS.create.awooga, "create"); }
 *   catch { cine.endPhase(phase, "failure"); }
 *
 * Kept inline at call sites rather than wrapped in a generic helper so
 * each view keeps its own try/catch/control-flow shape.
 */

export function awoogaForStage(stage: Stage): string {
  return STAGE_DEFS[stage].awooga;
}
