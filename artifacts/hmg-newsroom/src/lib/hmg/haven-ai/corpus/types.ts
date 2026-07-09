import type { BrandId } from "@/lib/hmg/brandVoiceProfiles";

/**
 * Haven Corpus — client-side shapes for the owned-intelligence retrieval lane.
 *
 * These mirror the server contract (artifacts/api-server/src/overrides/corpus*)
 * over JSON. Artifacts cannot import each other in this monorepo, so the two
 * sides are kept in deliberate agreement rather than sharing a module.
 */

export interface HavenCorpusCitation {
  sourceId: string;
  title: string;
  citationLabel: string;
  reliability: string;
  brand: string;
  sourceType: string;
  score: number;
  reasons: string[];
  excerpt: string;
}

export interface HavenCorpusContext {
  /** True only when real corpus passages were retrieved and used. */
  usedCorpus: boolean;
  /** Honest, founder-readable status (e.g. "No corpus matches yet..."). */
  note: string;
  /** Assembled passage text handed to the engine's provider lane as grounding. */
  contextText: string;
  citations: HavenCorpusCitation[];
}

export interface HavenCorpusRetrieveArgs {
  query: string;
  brand?: BrandId;
  module?: string;
  limit?: number;
}

/**
 * Caller injected by the UI. The ONLY path the engine has to the corpus. If it
 * is omitted or returns null, the engine answers without grounding — it never
 * fabricates citations or pretends a corpus exists.
 */
export type HavenCorpusRetriever = (
  args: HavenCorpusRetrieveArgs,
) => Promise<HavenCorpusContext | null>;

/** Raw server /api/corpus/search response shape (untrusted; validated on read). */
export interface CorpusSearchResponseDTO {
  usedCorpus?: boolean;
  query?: string;
  note?: string;
  hits?: Array<{
    sourceId?: string;
    chunkIndex?: number;
    content?: string;
    brand?: string;
    module?: string;
    sourceType?: string;
    citationLabel?: string;
    reliability?: string;
    title?: string;
    score?: number;
    reasons?: string[];
  }>;
}
