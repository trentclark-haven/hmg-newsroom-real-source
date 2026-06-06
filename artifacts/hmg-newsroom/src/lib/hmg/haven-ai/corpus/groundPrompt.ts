import type {
  HavenCorpusCitation,
  HavenCorpusContext,
  HavenCorpusRetriever,
  HavenCorpusRetrieveArgs,
} from "@/lib/hmg/haven-ai/corpus/types";

/**
 * Shared corpus-grounding helper for the editorial modules (Editorial source
 * lookup, Breaking source recall, WP Builder / SEO related-stories).
 *
 * It runs the zero-paid corpus retriever and, when real passages match, returns
 * a grounded prompt that prepends the cited passages plus an explicit
 * instruction to use ONLY those sources. When nothing matches (or the retriever
 * is unavailable) it returns the original prompt untouched and an honest note —
 * it never fabricates sources or pretends the corpus answered.
 */

export interface GroundedPromptResult {
  /** Prompt to send to the generator (grounded when corpus matched, else original). */
  prompt: string;
  /** True only when real corpus passages were retrieved and prepended. */
  usedCorpus: boolean;
  /** Honest, founder-readable status for the UI. */
  note: string;
  /** Citations to render under the output. Empty when nothing matched. */
  citations: HavenCorpusCitation[];
  /** Raw context returned by the retriever, if any. */
  context: HavenCorpusContext | null;
}

function buildGroundingBlock(context: HavenCorpusContext): string {
  return [
    "HAVEN CORPUS GROUNDING — use ONLY these founder-ingested sources for factual claims.",
    "Cite the source by its [n] marker inline. Do not invent facts beyond these passages.",
    "",
    context.contextText,
    "",
    "----- end corpus grounding -----",
    "",
  ].join("\n");
}

export async function buildGroundedPrompt(
  retriever: HavenCorpusRetriever | undefined,
  args: HavenCorpusRetrieveArgs,
  basePrompt: string,
): Promise<GroundedPromptResult> {
  const empty: GroundedPromptResult = {
    prompt: basePrompt,
    usedCorpus: false,
    note: "No corpus matches — generated from base knowledge.",
    citations: [],
    context: null,
  };
  if (!retriever || !args.query.trim()) return empty;

  let context: HavenCorpusContext | null = null;
  try {
    context = await retriever(args);
  } catch {
    return { ...empty, note: "Corpus lookup unavailable — generated from base knowledge." };
  }

  if (!context || !context.usedCorpus || !context.contextText) {
    return {
      ...empty,
      note:
        context?.note ||
        "No corpus matches yet — generated from base knowledge. Ingest sources to ground future drafts.",
      context: context ?? null,
    };
  }

  return {
    prompt: `${buildGroundingBlock(context)}${basePrompt}`,
    usedCorpus: true,
    note: context.note || `Grounded on ${context.citations.length} corpus passage(s).`,
    citations: context.citations,
    context,
  };
}
