// EditorialArticlePackage — the canonical output of the Editorial Desk.
// Created deterministically from structured ResearchNotes + brand voice. No paid
// providers, no fake claims; if the source material is thin, that is reported
// in verificationNotes rather than fabricated.

export type ArticleType =
  | "news"
  | "feature"
  | "review"
  | "analysis"
  | "explainer"
  | "interview-recap"
  | "list"
  | "opinion";

export type ArticleTone =
  | "neutral"
  | "sharp"
  | "celebratory"
  | "critical"
  | "investigative"
  | "explanatory";

export type ArticleRole =
  | "managing-editor"
  | "staff-writer"
  | "senior-critic"
  | "beat-reporter"
  | "columnist";

export interface EditorialArticlePackage {
  id: string;
  brand: string;
  brandName: string;
  articleType: ArticleType;
  tone: ArticleTone;
  role: ArticleRole;
  headline: string;
  alternateHeadlines: string[];
  dek: string;
  articleBody: string;
  keyFacts: string[];
  timelineDates: string[];
  sourceNotesUsed: string[];
  verificationNotes: string[];
  whatNotToClaim: string[];
  seoTitle: string;
  seoDescription: string;
  suggestedTags: string[];
  socialCaption: string;
  xPost: string;
  instagramCaption: string;
  youtubeDescription: string;
  wordpressExcerpt: string;
  publishChecklist: string[];
  nextActions: string[];
  createdAt: string;
}

export interface EditorialEngineInput {
  brand: string;
  articleType: ArticleType;
  tone: ArticleTone;
  role: ArticleRole;
  notes: ParsedResearchNotes;
  savedFacts?: SavedFact[];
}

// --- Research Notes ---------------------------------------------------------

export type ResearchSectionId =
  | "founderNotes"
  | "notebookLM"
  | "geminiResearch"
  | "youtubeTranscript"
  | "timeline"
  | "evergreenFacts"
  | "sourceLinks"
  | "quotes"
  | "whatNotToClaim"
  | "brandAngle";

export interface ResearchSection {
  id: ResearchSectionId;
  label: string;
  helper: string;
  placeholder: string;
  text: string;
}

export interface ParsedResearchNotes {
  storyTitle: string;
  what: string;
  who: string[];
  timeline: string[];
  verifiedFacts: string[];
  quotes: { text: string; attribution: string }[];
  sourceLinks: { label: string; url: string }[];
  context: string;
  angle: string;
  whatNotToClaim: string[];
  raw: Partial<Record<ResearchSectionId, string>>;
}

// --- Saved Facts / Evergreen ------------------------------------------------

export type SavedFactKind =
  | "person"
  | "brand"
  | "artist"
  | "athlete"
  | "team"
  | "date"
  | "claim-warning"
  | "context";

export type TrustLevel = "verified" | "reported" | "unconfirmed";

export interface SavedFact {
  id: string;
  kind: SavedFactKind;
  label: string;
  detail: string;
  tags: string[];
  brand?: string;
  /** What the fact is about — e.g. "Album rollout", "Q3 earnings". */
  topic?: string;
  /** Source type — e.g. "press release", "interview", "founder notes". */
  sourceType?: string;
  /** Named source — e.g. "Variety", "Official statement". */
  sourceName?: string;
  /** Optional URL to the source. */
  sourceUrl?: string;
  /** Trust level for editorial review. Defaults to "reported". */
  trust?: TrustLevel;
  /** Plain-English summary for fast scanning in the saved-facts list. */
  summary?: string;
  /** Claims the desk must NOT make based on this fact. */
  whatNotToClaim?: string[];
  createdAt: string;
  updatedAt?: string;
}
