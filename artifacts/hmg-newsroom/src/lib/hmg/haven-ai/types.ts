import type { BrandId } from "@/lib/hmg/brandVoiceProfiles";
import type {
  HavenCorpusContext,
  HavenCorpusRetriever,
} from "@/lib/hmg/haven-ai/corpus/types";

export type {
  HavenCorpusContext,
  HavenCorpusRetriever,
  HavenCorpusCitation,
  HavenCorpusRetrieveArgs,
} from "@/lib/hmg/haven-ai/corpus/types";

/**
 * Haven AI Engine — shared types.
 *
 * The engine is HMG Newsroom's internal AI orchestration brain. It is NOT a
 * provider wrapper: it always has a strong local intelligence lane and exposes
 * a clean adapter interface so OpenAI / Gemini / Claude / Ollama / a future
 * Haven model can plug in later without changing Maximillion's UI.
 */

export type HavenMissionMode =
  | "auto"
  | "founder_briefing"
  | "sponsorship"
  | "sales"
  | "partnership"
  | "follow_up"
  | "objection_handling"
  | "la_market"
  | "internal_ops";

/** Which intelligence lane actually produced the headline answer. */
export type HavenLane = "local" | "provider" | "hybrid";

export type HavenProviderId =
  | "openai"
  | "gemini"
  | "anthropic"
  | "ollama"
  | "haven";

export type HavenProviderUsed = HavenProviderId | "local-brain";

export type HavenConfidenceLabel = "high" | "medium" | "exploratory";

/** Product Truth QA classification for Maximillion. Never overstated. */
export type HavenTruthLabel =
  | "HAVEN AI ENGINE ACTIVE — LOCAL BRAIN"
  | "HAVEN AI ENGINE ACTIVE — HYBRID"
  | "HAVEN AI ENGINE ACTIVE — PROVIDER";

export interface HavenChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface HavenAISection {
  id: string;
  title: string;
  body: string;
}

export interface HavenCopyPacket {
  id: string;
  label: string;
  content: string;
}

export interface HavenProviderPayload {
  prompt: string;
  mission: HavenMissionMode;
  brand?: BrandId;
  leadsSummary?: string;
  history?: HavenChatTurn[];
  /** Maximillion persona + mission + brand-voice guidance for the provider. */
  systemHint: string;
}

export interface HavenProviderResult {
  provider: HavenProviderId;
  message: string;
}

/**
 * Caller injected by the UI. It is the ONLY way the engine reaches a real
 * provider. If it is omitted or returns null, the engine answers from the
 * local brain. This keeps the engine honest: it never fakes provider access.
 */
export type HavenProviderCaller = (
  payload: HavenProviderPayload,
) => Promise<HavenProviderResult | null>;

export interface HavenAIRequest {
  message: string;
  mission?: HavenMissionMode;
  brand?: BrandId;
  module?: string;
  leadsSummary?: string;
  history?: HavenChatTurn[];
  /**
   * Paid provider lane caller (e.g. OpenAI via the secure server proxy). Per the
   * zero-paid doctrine it engages ONLY when `enablePaidProvider` is true.
   */
  callProvider?: HavenProviderCaller;
  /**
   * Zero-paid local-model lane caller (Ollama / remote local model). Tried
   * BEFORE any paid provider. Returns null when unavailable so the engine falls
   * back to the always-on local brain — it never fabricates a local-model reply.
   */
  callLocalModel?: HavenProviderCaller;
  /**
   * Gate for the paid provider lane. Default OFF: the engine runs on the local
   * brain, corpus, and Ollama unless the Founder intentionally enables paid.
   */
  enablePaidProvider?: boolean;
  /**
   * Optional zero-paid corpus retriever injected by the UI. When supplied, the
   * engine grounds its answer on real founder-ingested passages and surfaces
   * citations. Omitted/returns-null → ungrounded answer (never faked).
   */
  retrieveCorpus?: HavenCorpusRetriever;
}

export interface HavenAIResponse {
  /** Headline prose answer (provider prose when hybrid, else local brain). */
  message: string;
  sections: HavenAISection[];
  nextActions: string[];
  copyPackets: HavenCopyPacket[];
  followUps: string[];
  confidence: HavenConfidenceLabel;
  truthLabel: HavenTruthLabel;
  lane: HavenLane;
  /** Short, founder-readable lane label, e.g. "Local Brain Active". */
  laneLabel: string;
  providerUsed: HavenProviderUsed;
  missionMode: HavenMissionMode;
  missionLabel: string;
  brandId: BrandId;
  brandName: string;
  availableTools: string[];
  /**
   * Corpus grounding actually used for this answer, if any. Present only when a
   * retriever was injected; usedCorpus is true only when real passages matched.
   */
  corpus?: HavenCorpusContext;
  /** One-click "Copy Full Packet" text. */
  exportPacket: string;
}
