import type {
  HavenProviderCaller,
  HavenProviderId,
  HavenProviderPayload,
  HavenProviderResult,
} from "@/lib/hmg/haven-ai/types";

/**
 * Provider adapter registry.
 *
 * This documents the lanes the Haven AI Engine is wired to accept. Actual
 * runtime readiness is decided by whether the injected caller returns a real
 * provider result — the client never inspects secret values. `ready: false`
 * here simply means "no first-class client adapter is bundled yet"; the engine
 * still reaches OpenAI today through the secure server proxy via the caller.
 */
export interface HavenProviderAdapter {
  id: HavenProviderId;
  label: string;
  ready: boolean;
  describe: string;
}

export const HAVEN_PROVIDER_ADAPTERS: HavenProviderAdapter[] = [
  {
    id: "openai",
    label: "OpenAI",
    ready: true,
    describe: "Reached through the secure /api/maximillion/chat server proxy when a key is configured.",
  },
  {
    id: "gemini",
    label: "Gemini",
    ready: false,
    describe: "Adapter interface ready; connect through a server proxy to enable.",
  },
  {
    id: "anthropic",
    label: "Claude",
    ready: false,
    describe: "Adapter interface ready; connect through a server proxy to enable.",
  },
  {
    id: "ollama",
    label: "Ollama / local model",
    ready: false,
    describe: "Adapter interface ready for a self-hosted local model.",
  },
  {
    id: "haven",
    label: "Haven model",
    ready: false,
    describe: "Reserved for a future Haven-native fine-tuned model.",
  },
];

// ---------------------------------------------------------------------------
// Zero-paid lane priority.
//
// The engine routes intelligence by lane priority, cheapest-and-owned first:
//   1. local-corpus — Local Brain + Haven Corpus retrieval. ALWAYS on, no cost.
//   2. ollama       — Ollama / local model via a Founder-hosted (usually remote)
//                     endpoint. Zero marginal cost; honest about availability.
//   3. paid         — Paid provider (OpenAI). DEFAULT OFF; only engages when the
//                     Founder intentionally enables it as an accelerator.
//
// Paid is never the default dependency. The corpus + local brain answer on their
// own; Ollama and paid only layer prose on top when truly available.
// ---------------------------------------------------------------------------

export type HavenLaneId = "local-corpus" | "ollama" | "paid";

export type HavenLaneHealth =
  | "active" // lane is live and answering
  | "available" // lane is reachable but not the one that answered
  | "off" // intentionally disabled (paid, default)
  | "config-needed" // needs Founder configuration to engage
  | "blocked" // configured but unreachable
  | "fallback"; // not used; engine fell back to the always-on local lane

export interface HavenLaneDescriptor {
  id: HavenLaneId;
  label: string;
  priority: number;
  zeroPaid: boolean;
  describe: string;
}

export const HAVEN_LANES: HavenLaneDescriptor[] = [
  {
    id: "local-corpus",
    label: "Local Brain + Corpus",
    priority: 1,
    zeroPaid: true,
    describe:
      "Deterministic Haven local brain grounded on the owned corpus (Postgres full-text retrieval). Always on, zero paid cost.",
  },
  {
    id: "ollama",
    label: "Ollama / local model",
    priority: 2,
      zeroPaid: true,
      describe:
      "Self-hosted or remote Ollama endpoint (OLLAMA_URL). The browser app cannot host the daemon, so this runs against the Founder's Mac/remote host.",
  },
  {
    id: "paid",
    label: "Paid provider (OpenAI)",
    priority: 3,
    zeroPaid: false,
    describe:
      "Optional accelerator. Default OFF — engages only when the Founder enables it. Never the default dependency.",
  },
];

export interface HavenLaneStatus extends HavenLaneDescriptor {
  health: HavenLaneHealth;
  note: string;
}

export interface BuildLaneStatusArgs {
  corpusReady: boolean;
  corpusNote?: string;
  ollamaHealth: "remote-ready" | "config-needed" | "blocked" | "no-models" | "unknown";
  ollamaNote?: string;
  /**
   * Whether the Founder has opted the Ollama lane into routing. When false the
   * engine never injects the local-model caller, so the lane must report `off`
   * regardless of remote health — status must match actual routing behavior.
   */
  ollamaEnabled: boolean;
  paidEnabled: boolean;
  /** Which lane actually produced the active answer, if known. */
  activeLane?: HavenLaneId | null;
}

/** Build honest, founder-readable status for every lane. Pure; no side effects. */
export function buildLaneStatuses(args: BuildLaneStatusArgs): HavenLaneStatus[] {
  const { corpusReady, corpusNote, ollamaHealth, ollamaNote, ollamaEnabled, paidEnabled, activeLane } = args;
  return HAVEN_LANES.map((lane) => {
    let health: HavenLaneHealth;
    let note: string;
    if (lane.id === "local-corpus") {
      health = activeLane === "local-corpus" ? "active" : "available";
      note = corpusReady
        ? corpusNote || "Local brain active; corpus indexed and grounding answers."
        : corpusNote || "Local brain active; corpus empty — answering from base knowledge until you ingest sources.";
    } else if (lane.id === "ollama") {
      if (!ollamaEnabled) {
        // Founder has not opted the lane into routing — the engine will not
        // inject the local-model caller, so status must say so honestly even
        // when the remote endpoint is reachable.
        health = "off";
        note =
          ollamaHealth === "remote-ready"
            ? "Ollama lane OFF — remote endpoint is reachable; enable the lane in Zero-Paid settings to route through it."
            : "Ollama lane OFF — enable it in Zero-Paid settings to route through your local model.";
      } else {
        if (ollamaHealth === "remote-ready") {
          health = activeLane === "ollama" ? "active" : "available";
        } else if (ollamaHealth === "config-needed") {
          health = "config-needed";
        } else if (ollamaHealth === "blocked" || ollamaHealth === "no-models") {
          health = "blocked";
        } else {
          health = "fallback";
        }
        note = ollamaNote || lane.describe;
      }
    } else {
      // paid
      health = paidEnabled ? (activeLane === "paid" ? "active" : "available") : "off";
      note = paidEnabled
        ? "Paid provider enabled as an accelerator. Used only when the local lanes do not answer."
        : "Paid provider OFF (default). The system runs zero-paid on the local brain, corpus, and Ollama.";
    }
    return { ...lane, health, note };
  });
}

/**
 * Route a request through the provider lane. Returns null whenever no caller is
 * supplied or the caller cannot produce a real provider answer, so the engine
 * cleanly falls back to the local brain. Never throws.
 */
export async function routeThroughProvider(
  payload: HavenProviderPayload,
  caller?: HavenProviderCaller,
): Promise<HavenProviderResult | null> {
  if (!caller) return null;
  try {
    const result = await caller(payload);
    if (result && typeof result.message === "string" && result.message.trim()) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}
