import type {
  CorpusSearchResponseDTO,
  HavenCorpusCitation,
  HavenCorpusContext,
  HavenCorpusRetriever,
} from "@/lib/hmg/haven-ai/corpus/types";

const MAX_EXCERPT_CHARS = 600;
const MAX_CONTEXT_CHARS = 6000;

function excerpt(content: string): string {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length > MAX_EXCERPT_CHARS
    ? `${clean.slice(0, MAX_EXCERPT_CHARS - 1)}…`
    : clean;
}

function toCitations(data: CorpusSearchResponseDTO): HavenCorpusCitation[] {
  const hits = Array.isArray(data.hits) ? data.hits : [];
  const out: HavenCorpusCitation[] = [];
  for (const hit of hits) {
    if (!hit || typeof hit.content !== "string" || !hit.content.trim()) continue;
    out.push({
      sourceId: typeof hit.sourceId === "string" ? hit.sourceId : "",
      title: typeof hit.title === "string" ? hit.title : "Untitled source",
      citationLabel:
        typeof hit.citationLabel === "string" ? hit.citationLabel : "Source",
      reliability: typeof hit.reliability === "string" ? hit.reliability : "unverified",
      brand: typeof hit.brand === "string" ? hit.brand : "master",
      sourceType: typeof hit.sourceType === "string" ? hit.sourceType : "paste",
      score: typeof hit.score === "number" ? hit.score : 0,
      reasons: Array.isArray(hit.reasons)
        ? hit.reasons.filter((r): r is string => typeof r === "string")
        : [],
      excerpt: excerpt(hit.content),
    });
  }
  return out;
}

function buildContextText(citations: HavenCorpusCitation[]): string {
  let text = "";
  for (let i = 0; i < citations.length; i++) {
    const c = citations[i];
    const block = `[${i + 1}] ${c.citationLabel} (reliability: ${c.reliability})\n${c.excerpt}\n`;
    if (text.length + block.length > MAX_CONTEXT_CHARS) break;
    text += `${block}\n`;
  }
  return text.trim();
}

/**
 * Build the corpus retriever bound to the API base. It hits the zero-paid
 * server retrieval endpoint and returns honest grounding — usedCorpus is only
 * true when real passages came back. Network/parse failures resolve to null so
 * the engine degrades to ungrounded answers instead of inventing sources.
 */
export function createCorpusRetriever(apiBase: string): HavenCorpusRetriever {
  const base = apiBase.replace(/\/+$/, "");
  return async ({ query, brand, module, limit }) => {
    if (!query || !query.trim()) return null;
    try {
      const res = await fetch(`${base}/corpus/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, brand, module, limit: limit ?? 6 }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as CorpusSearchResponseDTO;
      if (!data || typeof data !== "object") return null;

      const citations = toCitations(data);
      const usedCorpus = Boolean(data.usedCorpus) && citations.length > 0;
      const note =
        typeof data.note === "string" && data.note
          ? data.note
          : usedCorpus
            ? `Grounded on ${citations.length} corpus passage(s).`
            : "No corpus matches yet — answering from base knowledge.";

      const context: HavenCorpusContext = {
        usedCorpus,
        note,
        contextText: usedCorpus ? buildContextText(citations) : "",
        citations: usedCorpus ? citations : [],
      };
      return context;
    } catch {
      return null;
    }
  };
}
