import type {
  CorpusHealthResult,
  HavenLaneHealth,
  HavenLaneId,
  HavenLaneStatus,
  OllamaDiagnostics,
} from "@/lib/hmg/haven-ai";

/**
 * Pure state helpers for the Haven AI Control Center.
 *
 * The Control Center itself is a `.tsx` component that cannot run under the
 * node:test type-strip harness, so its lane-status / recovery decisions live
 * here as framework-free functions. The component is a thin wrapper around these
 * helpers, which keeps the one-tap retry behavior the Founder relies on under
 * automated coverage even if the component is later refactored.
 */

export const OLLAMA_UNREACHABLE_MSG =
  "Couldn't reach remote model — check connection and try again.";

export interface OllamaLaneState {
  ollama: OllamaDiagnostics | null;
  ollamaError: string | null;
}

export interface ControlCenterState extends OllamaLaneState {
  corpus: CorpusHealthResult | null;
}

/**
 * A lane shows the CHECKING badge (and suppresses its error note + retry) only
 * while a diagnostics pass is in flight. Only the two owned-intelligence lanes
 * are re-checked live.
 */
export function isLaneChecking(laneId: string, loading: boolean): boolean {
  return (laneId === "ollama" || laneId === "local-corpus") && loading;
}

/**
 * The inline "Try again" retry on the Ollama lane appears only when the Ollama
 * check has failed and is hidden mid-check. It never renders on other lanes.
 */
export function shouldShowOllamaRetry(args: {
  laneId: string;
  ollamaError: string | null;
  checking: boolean;
}): boolean {
  return (
    args.laneId === "ollama" && Boolean(args.ollamaError) && !args.checking
  );
}

/**
 * Honest error derivation: an unreachable diagnostics fetch surfaces the failure
 * note; a real status (reachable, even if blocked) clears it.
 */
export function deriveOllamaError(diag: OllamaDiagnostics): string | null {
  return diag.unreachable ? OLLAMA_UNREACHABLE_MSG : null;
}

export interface OllamaRecheckDeps {
  fetchDiagnostics: () => Promise<OllamaDiagnostics>;
  prev: OllamaLaneState;
}

/**
 * Re-check only the remote-model (Ollama) lane. Calls the Ollama diagnostics
 * fetch and nothing else — the corpus lane is deliberately untouched — clearing
 * the rose error note on a reachable result and surfacing it on an unreachable
 * one. Never throws; preserves the prior diagnostics on an unexpected failure.
 */
export async function runOllamaRecheck(
  deps: OllamaRecheckDeps,
): Promise<OllamaLaneState> {
  try {
    const ollama = await deps.fetchDiagnostics();
    return { ollama, ollamaError: deriveOllamaError(ollama) };
  } catch {
    return { ollama: deps.prev.ollama, ollamaError: OLLAMA_UNREACHABLE_MSG };
  }
}

export interface CorpusLaneState {
  corpus: CorpusHealthResult | null;
}

export interface CorpusRecheckDeps {
  fetchCorpus: () => Promise<CorpusHealthResult>;
  prev: CorpusLaneState;
}

/**
 * Re-check only the corpus lane. Mirrors {@link runOllamaRecheck} for the corpus
 * half: calls the corpus health fetch and nothing else — the Ollama lane is
 * deliberately untouched — so a successful check (corpus.ok === true) clears the
 * rose error note and a still-failing one keeps it. Never throws; preserves the
 * prior corpus state on an unexpected failure.
 */
export async function runCorpusRecheck(
  deps: CorpusRecheckDeps,
): Promise<CorpusLaneState> {
  try {
    const corpus = await deps.fetchCorpus();
    return { corpus };
  } catch {
    return { corpus: deps.prev.corpus };
  }
}

export interface OllamaToggleDeps {
  /** New enabled state after the toggle has been applied. */
  enabling: boolean;
  /** Re-checks ONLY the remote-model (Ollama) lane. */
  recheckOllama: () => void;
  /** Re-checks ONLY the corpus lane. Must never fire on an Ollama toggle. */
  recheckCorpus: () => void;
}

/**
 * Decide what runs when the Founder flips the Ollama lane toggle. Enabling the
 * lane fires a single Ollama-only re-check so the card reflects real remote
 * health (remote-ready / config-needed / blocked) immediately, without waiting
 * for a manual Refresh. Disabling it — or any state where {@link
 * OllamaToggleDeps.enabling} is false — fires nothing. The corpus lane is
 * deliberately never touched here.
 */
export function applyOllamaToggle(deps: OllamaToggleDeps): void {
  if (deps.enabling) deps.recheckOllama();
}

export interface PaidToggleDeps {
  /** New enabled state after the paid (accelerator) toggle has been applied. */
  enabling: boolean;
  /** Re-checks ONLY the remote-model (Ollama) lane. Must never fire here. */
  recheckOllama: () => void;
  /** Re-checks ONLY the corpus lane. Must never fire here. */
  recheckCorpus: () => void;
}

/**
 * Decide what runs when the Founder flips the paid ("accelerator") provider
 * toggle. Unlike {@link applyOllamaToggle}, this deliberately fires NOTHING —
 * no lane health re-check (Ollama or corpus) and no paid call — in EITHER
 * direction. This preserves the zero-paid-by-default, honest-status doctrine:
 * enabling paid must never quietly probe a lane or kick off a billable call,
 * and disabling it must stay equally silent. The asymmetry with the Ollama
 * toggle is intentional and lives here so it can be held under automated
 * coverage even if the component is later refactored.
 */
export function applyPaidToggle(deps: PaidToggleDeps): void {
  void deps;
}

// ---------------------------------------------------------------------------
// AI Lane Diagnostics — per-lane, founder-readable truth table.
//
// The Founder mandate: every lane blocker must be proven as one of (1) correct
// security behavior, (2) a recoverable connection issue, (3) a properly disabled
// optional lane, or (4) a real bug. This builder turns the live lane state into
// an explicit row per lane with: why it is blocked/available, what unlocks it,
// the founder action needed, the safe fallback path, whether a retry applies,
// and a single TRUTH STATE label. It is pure and framework-free so it stays
// under automated coverage even if the Control Center component is refactored.
// ---------------------------------------------------------------------------

/**
 * Honest truth-state vocabulary surfaced on every lane row.
 * - REAL      — live, genuine lane (diagnostics/retry/auth machinery, or an
 *               enabled paid accelerator) that actually does what it claims.
 * - LOCAL ONLY— owned local intelligence running on Haven infra (indexed corpus
 *               or a reachable self-hosted model). Zero paid cost.
 * - BLOCKED   — unreachable or unauthorized: corpus needs sign-in, or the local
 *               model is unconfigured/offline. Not a silent failure.
 * - FUTURE    — reserved capability not built yet.
 * - PAID OFF  — paid provider intentionally disabled (zero-paid default).
 * - OFF       — an optional non-paid lane the Founder has intentionally disabled.
 */
export type LaneTruthState =
  | "REAL"
  | "LOCAL ONLY"
  | "BLOCKED"
  | "FUTURE"
  | "PAID OFF"
  | "OFF";

export interface LaneDiagnostic {
  id: HavenLaneId;
  label: string;
  /** Reuses the lane health badge so status stays consistent with the router. */
  health: HavenLaneHealth;
  /** Why the lane is currently blocked or available. */
  why: string;
  /** What must happen to unlock / activate the lane. */
  unlock: string;
  /** The concrete Founder action needed (or "None"). */
  founderAction: string;
  /** Where requests safely route while this lane is not serving. */
  fallback: string;
  /** Whether a one-tap retry is meaningful for this lane. */
  canRetry: boolean;
  /** Single honest truth-state label. */
  truth: LaneTruthState;
}

/** True only when the corpus health check failed because of auth (401/403). */
export function isCorpusUnauthorized(corpus: CorpusHealthResult | null): boolean {
  return Boolean(
    corpus &&
      corpus.ok === false &&
      (corpus.code === "unauthorized" ||
        corpus.status === 401 ||
        corpus.status === 403),
  );
}

export interface BuildLaneDiagnosticsArgs {
  /** The lane statuses already built by buildLaneStatuses (labels + health). */
  lanes: HavenLaneStatus[];
  corpus: CorpusHealthResult | null;
  ollama: OllamaDiagnostics | null;
  ollamaEnabled: boolean;
  paidEnabled: boolean;
}

const LOCAL_FALLBACK = "Local brain answers from base knowledge — no dead end.";

function diagnoseLocalCorpus(
  lane: HavenLaneStatus,
  corpus: CorpusHealthResult | null,
): LaneDiagnostic {
  const base = { id: lane.id, label: lane.label, health: lane.health, canRetry: true };
  if (corpus === null) {
    return {
      ...base,
      why: "Corpus health check is in flight.",
      unlock: "Wait for the check to finish.",
      founderAction: "None — check in progress.",
      fallback: LOCAL_FALLBACK,
      truth: "REAL",
    };
  }
  if (corpus.ok === false) {
    if (isCorpusUnauthorized(corpus)) {
      return {
        ...base,
        why: "Corpus management is auth-gated; this browser is not signed in as Founder/Admin (server returned 401/403). This is correct security behavior, not a bug.",
        unlock: "Sign in as Founder/Admin, then re-run the check.",
        founderAction: "Sign in as Founder/Admin and tap Try again.",
        fallback: LOCAL_FALLBACK,
        truth: "BLOCKED",
      };
    }
    return {
      ...base,
      why: `Corpus server error: ${corpus.error}`,
      unlock: "Resolve the corpus server error, then re-run the check.",
      founderAction: "Tap Try again; if it persists, check the API server.",
      fallback: LOCAL_FALLBACK,
      truth: "BLOCKED",
    };
  }
  if (corpus.stats.chunks > 0) {
    return {
      ...base,
      why: `Corpus indexed: ${corpus.stats.chunks} chunk(s) across ${corpus.stats.sources} source(s), grounding answers locally.`,
      unlock: "Already unlocked — lane is live.",
      founderAction: "None.",
      fallback: "n/a — lane is live and grounding answers.",
      truth: "LOCAL ONLY",
    };
  }
  return {
    ...base,
    why: "Corpus is reachable but empty — no sources ingested yet.",
    unlock: "Ingest sources in Knowledge Corpus to ground answers.",
    founderAction: "Import sources in Knowledge Corpus.",
    fallback: LOCAL_FALLBACK,
    truth: "LOCAL ONLY",
  };
}

function diagnoseOllama(
  lane: HavenLaneStatus,
  ollama: OllamaDiagnostics | null,
  ollamaEnabled: boolean,
): LaneDiagnostic {
  const base = { id: lane.id, label: lane.label, health: lane.health, canRetry: true };
  const fallback = "Local brain + corpus answer every request at zero paid cost.";
  if (!ollamaEnabled) {
    return {
      ...base,
      canRetry: false,
      why: "Ollama lane is intentionally OFF (toggle disabled). No local-model calls are made. This is a properly disabled optional lane, not a failure.",
      unlock:
        "Turn the Ollama lane toggle ON, then set OLLAMA_URL (and OLLAMA_MODEL) in Secrets to your remote/Mac endpoint.",
      founderAction: "Enable the Ollama lane toggle to route through your local model.",
      fallback,
      truth: "OFF",
    };
  }
  if (ollama === null) {
    return {
      ...base,
      canRetry: false,
      why: "Probing the remote Ollama endpoint…",
      unlock: "Wait for the probe to finish.",
      founderAction: "None — probe in progress.",
      fallback,
      truth: "REAL",
    };
  }
  if (ollama.unreachable) {
    return {
      ...base,
      why: "The diagnostics probe could not reach the server to check the lane (network/timeout).",
      unlock: "Restore connectivity, then re-run the check.",
      founderAction: "Tap Try again.",
      fallback,
      truth: "BLOCKED",
    };
  }
  if (ollama.status === "config-needed") {
    return {
      ...base,
      why: "No OLLAMA_URL configured. This browser app cannot host an in-container Ollama daemon, so this lane runs against a remote/Mac endpoint.",
      unlock: "Set OLLAMA_URL (and optionally OLLAMA_MODEL) in Secrets to your remote/Mac Ollama endpoint.",
      founderAction: "Add the OLLAMA_URL secret, then Refresh.",
      fallback,
      truth: "BLOCKED",
    };
  }
  if (ollama.status === "blocked" || ollama.status === "no-models") {
    return {
      ...base,
      why: ollama.note || "Remote endpoint configured but not currently serving the model.",
      unlock:
        ollama.status === "no-models"
          ? "Pull the configured model on the host (ollama pull …) or adjust OLLAMA_MODEL."
          : "Bring the remote endpoint online and confirm the app can reach it.",
      founderAction: "Fix the remote host, then tap Try again.",
      fallback,
      truth: "BLOCKED",
    };
  }
  // remote-ready
  return {
    ...base,
    why: ollama.note || "Remote Ollama is reachable with model(s) installed; the local-model lane is live.",
    unlock: "Already unlocked — lane is live.",
    founderAction: "None.",
    fallback: "n/a — lane is live and serving local-model prose.",
    truth: "LOCAL ONLY",
  };
}

function diagnosePaid(lane: HavenLaneStatus, paidEnabled: boolean): LaneDiagnostic {
  const base = { id: lane.id, label: lane.label, health: lane.health, canRetry: false };
  if (!paidEnabled) {
    return {
      ...base,
      why: "Paid provider is OFF by default. Zero hidden paid calls are made — the engine never touches a paid provider unless you explicitly enable it.",
      unlock: "Turn the Paid provider toggle ON (optional accelerator).",
      founderAction: "None needed — the system runs zero-paid.",
      fallback: "Local brain + corpus + Ollama serve every request.",
      truth: "PAID OFF",
    };
  }
  return {
    ...base,
    why: "Paid accelerator is ENABLED. It is used only when the local lanes do not answer; the corpus + local brain still run first.",
    unlock: "Already enabled.",
    founderAction: "Optional: disable to return to the zero-paid default.",
    fallback: "Local brain + corpus answer first regardless.",
    truth: "REAL",
  };
}

/**
 * Build the per-lane diagnostics rows. Pure; no side effects, never throws.
 * Maps the three router lanes to their honest truth state and recovery path.
 */
export function buildLaneDiagnostics(
  args: BuildLaneDiagnosticsArgs,
): LaneDiagnostic[] {
  return args.lanes.map((lane) => {
    if (lane.id === "local-corpus") return diagnoseLocalCorpus(lane, args.corpus);
    if (lane.id === "ollama")
      return diagnoseOllama(lane, args.ollama, args.ollamaEnabled);
    return diagnosePaid(lane, args.paidEnabled);
  });
}

export interface FullRefreshDeps {
  fetchDiagnostics: () => Promise<OllamaDiagnostics>;
  fetchCorpus: () => Promise<CorpusHealthResult>;
  prev: ControlCenterState;
}

/**
 * Global refresh — re-checks both the Ollama and corpus lanes in parallel.
 * Mirrors {@link runOllamaRecheck} for the Ollama half but additionally pulls
 * corpus health. Preserves prior state on an unexpected failure.
 */
export async function runFullRefresh(
  deps: FullRefreshDeps,
): Promise<ControlCenterState> {
  try {
    const [ollama, corpus] = await Promise.all([
      deps.fetchDiagnostics(),
      deps.fetchCorpus(),
    ]);
    return { ollama, corpus, ollamaError: deriveOllamaError(ollama) };
  } catch {
    return {
      ollama: deps.prev.ollama,
      corpus: deps.prev.corpus,
      ollamaError: OLLAMA_UNREACHABLE_MSG,
    };
  }
}
