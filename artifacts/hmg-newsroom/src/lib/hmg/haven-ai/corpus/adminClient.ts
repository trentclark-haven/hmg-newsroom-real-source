import type { BrandId } from "@/lib/hmg/brandVoiceProfiles";

/**
 * Haven Corpus — admin/ingest client for the owned-intelligence lane.
 *
 * Mirrors the server contract (artifacts/api-server/src/overrides/corpus*) over
 * JSON. Artifacts cannot import each other in this monorepo, so the two sides
 * are kept in deliberate agreement. All calls are same-origin so the founder
 * session cookie rides along automatically; ingest/fetch endpoints are
 * founder/admin-gated on the server.
 */

export const CORPUS_SOURCE_TYPES = [
  "paste",
  "txt",
  "md",
  "csv",
  "json",
  "html",
  "url",
  "rss",
] as const;
export type CorpusSourceType = (typeof CORPUS_SOURCE_TYPES)[number];

export const CORPUS_RELIABILITY_LEVELS = [
  "verified",
  "trusted",
  "unverified",
  "user-supplied",
] as const;
export type CorpusReliability = (typeof CORPUS_RELIABILITY_LEVELS)[number];

export const RELIABILITY_LABELS: Record<CorpusReliability, string> = {
  verified: "Verified",
  trusted: "Trusted",
  unverified: "Unverified",
  "user-supplied": "User-supplied",
};

export const SOURCE_TYPE_LABELS: Record<CorpusSourceType, string> = {
  paste: "Pasted text",
  txt: "Plain text",
  md: "Markdown",
  csv: "CSV",
  json: "JSON",
  html: "HTML",
  url: "Web page",
  rss: "RSS item",
};

/** Cap mirrors the server's MAX_TEXT_CHARS so the UI can warn before sending. */
export const CORPUS_MAX_TEXT_CHARS = 600_000;

export interface CorpusImportInput {
  title: string;
  text: string;
  sourceType: CorpusSourceType;
  brand: BrandId | string;
  module: string;
  reliability: CorpusReliability;
  rightsNote?: string;
  tags?: string[];
  originalFilename?: string;
}

export interface CorpusImportReceipt {
  ok: true;
  sourceId: string;
  duplicate: boolean;
  status: "indexed" | "empty";
  title: string;
  brand: string;
  module: string;
  sourceType: string;
  reliability: string;
  citationLabel: string;
  chunkCount: number;
  charCount: number;
  tags: string[];
  entities: string[];
  warnings: string[];
}

export interface CorpusCallError {
  ok: false;
  error: string;
  code?: string;
  status?: number;
}

export type CorpusImportResult = CorpusImportReceipt | CorpusCallError;

export interface CorpusStats {
  sources: number;
  chunks: number;
  totalChars: number;
  quarantined: number;
  byBrand: Record<string, number>;
  byModule: Record<string, number>;
  bySourceType: Record<string, number>;
  byReliability: Record<string, number>;
  lastIngestedAt: string | null;
}

export interface CorpusHealth {
  ok: true;
  stats: CorpusStats;
  capabilities: {
    retrieval: string;
    ranking: string;
    embeddings: boolean;
    paidProvider: boolean;
    ingestTypes: string[];
  };
  notes: string;
}

export type CorpusHealthResult = CorpusHealth | CorpusCallError;

export interface UrlFetchSuccess {
  ok: true;
  url: string;
  finalUrl: string;
  status: number;
  title: string;
  excerpt: string;
  text: string;
  charCount: number;
  contentType: string;
}

export interface UrlFetchFailure {
  ok: false;
  url?: string;
  code: string;
  error: string;
  manualPasteFallback?: boolean;
  status?: number;
}

export type UrlFetchResult = UrlFetchSuccess | UrlFetchFailure;

export interface FeedItem {
  title: string;
  link: string;
  excerpt: string;
  publishedAt: string | null;
}

export interface FeedFetchSuccess {
  ok: true;
  url: string;
  finalUrl: string;
  feedTitle: string;
  items: FeedItem[];
  count: number;
}

export type FeedFetchResult = FeedFetchSuccess | UrlFetchFailure;

function trimBase(apiBase: string): string {
  return apiBase.replace(/\/+$/, "");
}

async function readError(res: Response): Promise<CorpusCallError> {
  let message = `Request failed (HTTP ${res.status}).`;
  let code: string | undefined;
  try {
    const data = (await res.json()) as { error?: unknown; code?: unknown };
    if (typeof data?.error === "string" && data.error) message = data.error;
    if (typeof data?.code === "string") code = data.code;
  } catch {
    /* keep default message */
  }
  if (res.status === 401 || res.status === 403) {
    message = "Sign in as Founder/Admin to manage the corpus.";
    code = code ?? "unauthorized";
  }
  return { ok: false, error: message, code, status: res.status };
}

export async function importCorpusSource(
  apiBase: string,
  input: CorpusImportInput,
): Promise<CorpusImportResult> {
  try {
    const res = await fetch(`${trimBase(apiBase)}/corpus/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input.title,
        text: input.text,
        sourceType: input.sourceType,
        brand: input.brand,
        module: input.module,
        reliability: input.reliability,
        rightsNote: input.rightsNote,
        tags: input.tags,
        originalFilename: input.originalFilename,
      }),
    });
    if (!res.ok) return readError(res);
    const data = (await res.json()) as CorpusImportReceipt;
    if (!data || data.ok !== true) {
      return { ok: false, error: "Unexpected response from the corpus server." };
    }
    return data;
  } catch {
    return { ok: false, error: "Network error reaching the corpus server.", code: "network" };
  }
}

export async function getCorpusHealth(apiBase: string): Promise<CorpusHealthResult> {
  try {
    const res = await fetch(`${trimBase(apiBase)}/corpus/health`, { method: "GET" });
    if (!res.ok) return readError(res);
    const data = (await res.json()) as CorpusHealth;
    if (!data || data.ok !== true) {
      return { ok: false, error: "Unexpected response from the corpus server." };
    }
    return data;
  } catch {
    return { ok: false, error: "Network error reaching the corpus server.", code: "network" };
  }
}

export async function fetchCorpusUrl(apiBase: string, url: string): Promise<UrlFetchResult> {
  try {
    const res = await fetch(`${trimBase(apiBase)}/corpus/fetch-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const err = await readError(res);
      return { ok: false, error: err.error, code: err.code ?? "bad_status", status: err.status, manualPasteFallback: true };
    }
    return (await res.json()) as UrlFetchResult;
  } catch {
    return { ok: false, error: "Network error reaching the corpus server.", code: "network", manualPasteFallback: true };
  }
}

export async function fetchCorpusRss(apiBase: string, url: string): Promise<FeedFetchResult> {
  try {
    const res = await fetch(`${trimBase(apiBase)}/corpus/fetch-rss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const err = await readError(res);
      return { ok: false, error: err.error, code: err.code ?? "bad_status", status: err.status, manualPasteFallback: true };
    }
    return (await res.json()) as FeedFetchResult;
  } catch {
    return { ok: false, error: "Network error reaching the corpus server.", code: "network", manualPasteFallback: true };
  }
}

export interface PreviewChunk {
  index: number;
  content: string;
  charCount: number;
}

/**
 * Client-side chunk PREVIEW. It mirrors the server chunker's paragraph-packing
 * strategy closely enough to set expectations, but the server is the source of
 * truth — the import receipt returns the real chunk count. Labeled as an
 * estimate in the UI so no false precision is implied.
 */
export function previewChunks(raw: string, targetChars = 1200, maxChars = 1800): PreviewChunk[] {
  const text = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!text) return [];
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const units: string[] = [];
  for (const para of paragraphs) {
    if (para.length <= maxChars) {
      units.push(para);
      continue;
    }
    for (let i = 0; i < para.length; i += maxChars) units.push(para.slice(i, i + maxChars));
  }

  const packed: string[] = [];
  let current = "";
  for (const unit of units) {
    if (!current) current = unit;
    else if (current.length + unit.length + 2 <= targetChars) current = `${current}\n\n${unit}`;
    else {
      packed.push(current);
      current = unit;
    }
  }
  if (current) packed.push(current);

  return packed.map((content, index) => ({ index, content, charCount: content.length }));
}
