import { getBrandKnowledge } from "@/lib/hmg/haven-ai/hmgKnowledgeBase";
import { getMission } from "@/lib/hmg/haven-ai/maximillionPersonality";
import { buildHavenContext } from "@/lib/hmg/haven-ai/contextBuilder";
import { runLocalBrain } from "@/lib/hmg/haven-ai/localBrain";
import { routeThroughProvider } from "@/lib/hmg/haven-ai/providerRouter";
import { getMissionTools } from "@/lib/hmg/haven-ai/toolRegistry";
import type {
  HavenAIRequest,
  HavenAIResponse,
  HavenAISection,
  HavenCorpusContext,
  HavenLane,
  HavenProviderUsed,
  HavenTruthLabel,
} from "@/lib/hmg/haven-ai/types";

/**
 * runHavenAIEngine — HMG Newsroom's internal AI orchestration brain.
 *
 * Flow:
 *  1. Resolve mission + brand and build situational context.
 *  2. ALWAYS run the local brain (strong deterministic intelligence).
 *  3. Optionally route through a provider via the injected caller.
 *  4. Compose an honest response: provider prose leads when available (hybrid),
 *     otherwise the local brain leads. Status is never overstated.
 *
 * The engine never fakes provider access and never requires a provider to be
 * useful. No keys are read or exposed here — provider access only happens
 * through the caller the UI injects (the secure server proxy).
 */
export async function runHavenAIEngine(
  request: HavenAIRequest,
): Promise<HavenAIResponse> {
  const brand = getBrandKnowledge(request.brand);
  const missionDef = getMission(request.mission);

  // Zero-paid corpus grounding. Only runs when the UI injects a retriever; a
  // null/empty result means we answer ungrounded rather than fabricate sources.
  let corpus: HavenCorpusContext | null = null;
  if (request.retrieveCorpus && request.message.trim()) {
    corpus = await request.retrieveCorpus({
      query: request.message,
      brand: brand.id,
      module: request.module,
      limit: 6,
    });
  }
  const grounded = Boolean(corpus?.usedCorpus && corpus.contextText);

  const context = buildHavenContext({
    brand,
    mission: missionDef,
    module: request.module,
    leadsSummary: request.leadsSummary,
    history: request.history,
    corpusContext: grounded ? corpus!.contextText : undefined,
  });

  const local = runLocalBrain({
    message: request.message,
    mission: missionDef.id,
    missionDef,
    brand,
    context,
  });

  const providerPayload = {
    prompt: request.message,
    mission: missionDef.id,
    brand: brand.id,
    leadsSummary: request.leadsSummary,
    history: request.history,
    systemHint: context.systemHint,
  };

  // Zero-paid lane priority: try the owned local-model lane (Ollama / remote)
  // first; only reach the paid provider when the Founder has intentionally
  // enabled it. Either lane returning null leaves the local brain in charge.
  let provider = request.callLocalModel
    ? await routeThroughProvider(providerPayload, request.callLocalModel)
    : null;
  if (!provider && request.enablePaidProvider && request.callProvider) {
    provider = await routeThroughProvider(providerPayload, request.callProvider);
  }

  const lane: HavenLane = provider ? "hybrid" : "local";
  const providerUsed: HavenProviderUsed = provider ? provider.provider : "local-brain";
  const laneLabel = provider
    ? provider.provider === "ollama"
      ? "Hybrid — Ollama local model"
      : `Hybrid — ${provider.provider} provider`
    : "Local Brain Active";
  const truthLabel: HavenTruthLabel = provider
    ? "HAVEN AI ENGINE ACTIVE — HYBRID"
    : "HAVEN AI ENGINE ACTIVE — LOCAL BRAIN";

  // Provider prose leads when present; the local brain's structured frameworks
  // (sections, copy packets, next actions) always travel with the answer.
  const headline = provider ? provider.message.trim() : local.message;

  // Citations section appears whenever real corpus passages grounded the answer,
  // independent of which lane wrote the prose. Honest provenance, every reply.
  const corpusSection: HavenAISection[] = grounded
    ? [
        {
          id: "corpus-sources",
          title: `Corpus sources (${corpus!.citations.length})`,
          body: corpus!.citations
            .map(
              (c, i) =>
                `[${i + 1}] ${c.citationLabel} — ${c.reliability}\n${c.excerpt}`,
            )
            .join("\n\n"),
        },
      ]
    : [];

  const sections: HavenAISection[] = provider
    ? [
        {
          id: "provider-note",
          title: "Connected Service",
          body: `Answered through the connected ${provider.provider} service, layered on the Haven local brain's frameworks below.`,
        },
        ...corpusSection,
        ...local.sections,
      ]
    : [...corpusSection, ...local.sections];

  const exportPacket = buildExportPacket({
    brandName: brand.name,
    missionLabel: missionDef.label,
    headline,
    sections,
    nextActions: local.nextActions,
  });

  return {
    message: headline,
    sections,
    nextActions: local.nextActions,
    copyPackets: local.copyPackets,
    followUps: local.followUps,
    confidence: provider ? "high" : local.confidence,
    truthLabel,
    lane,
    laneLabel,
    providerUsed,
    missionMode: missionDef.id,
    missionLabel: missionDef.label,
    brandId: brand.id,
    brandName: brand.name,
    availableTools: getMissionTools(missionDef.id),
    corpus: corpus ?? undefined,
    exportPacket,
  };
}

function buildExportPacket(args: {
  brandName: string;
  missionLabel: string;
  headline: string;
  sections: HavenAISection[];
  nextActions: string[];
}): string {
  const lines = [
    `HAVEN AI ENGINE — ${args.brandName} — ${args.missionLabel}`,
    "",
    args.headline,
    "",
    ...args.sections.map((s) => `## ${s.title}\n${s.body}`),
    "",
    "## Next actions",
    ...args.nextActions.map((a) => `- ${a}`),
  ];
  return lines.join("\n");
}
