import type {
  ParsedResearchNotes,
  ResearchSection,
  ResearchSectionId,
} from "./types.ts";

export const RESEARCH_SECTIONS: ResearchSection[] = [
  {
    id: "founderNotes",
    label: "Story Notes",
    helper: "What happened in plain words. What you want the desk to say.",
    placeholder: "Drop the raw idea — what happened, why it matters, what you want to say...",
    text: "",
  },
  {
    id: "brandAngle",
    label: "Founder Angle",
    helper: "How the story should land for this Haven specifically.",
    placeholder: "Frame this as a cultural milestone, not a chart story.\nLead with the production credit angle.",
    text: "",
  },
  {
    id: "timeline",
    label: "Timeline",
    helper: "One date per line — 'Mar 14, 2026 — album dropped' or 'Q1 2026: investor round closed'.",
    placeholder: "Mar 14, 2026 — album released\nMar 17, 2026 — single went #1\n2026-04-02 — tour dates announced",
    text: "",
  },
  {
    id: "notebookLM",
    label: "NotebookLM Notes",
    helper: "Paste a NotebookLM summary, source breakdown, or chat answer.",
    placeholder: "Paste a NotebookLM summary or briefing here...",
    text: "",
  },
  {
    id: "geminiResearch",
    label: "Google / Gemini Research",
    helper: "Paste research notes from Gemini, Google search summaries, or briefing docs.",
    placeholder: "Paste Gemini research, Google AI summary, or search briefing...",
    text: "",
  },
  {
    id: "youtubeTranscript",
    label: "Video / Interview Notes",
    helper: "Paste a YouTube transcript, interview transcript, or podcast quote.",
    placeholder: "Paste transcript text. Quoted lines and speakers are kept verbatim.",
    text: "",
  },
  {
    id: "sourceLinks",
    label: "Sources",
    helper: "One per line. Format: 'Label — https://...' or just the URL.",
    placeholder: "Variety — https://variety.com/...\nOfficial press release — https://...\nhttps://x.com/...",
    text: "",
  },
  {
    id: "evergreenFacts",
    label: "Background Facts",
    helper: "Stable facts: history, prior releases, career stats, business context.",
    placeholder: "Artist signed to label X in 2018.\nPrior album debuted at #2.\nFounded the imprint in 2021.",
    text: "",
  },
  {
    id: "quotes",
    label: "Quotes",
    helper: "Each on its own line. Format: \"quote\" — speaker, source.",
    placeholder: "\"This is the most important project of my career.\" — Artist Name, press release",
    text: "",
  },
  {
    id: "whatNotToClaim",
    label: "Do Not Claim",
    helper: "Rumors, legal questions, unconfirmed numbers — anything that must stay out of the article body.",
    placeholder: "Do not claim deal terms — unconfirmed.\nDo not name the producer — not officially credited yet.",
    text: "",
  },
];

export interface ResearchGroup {
  id: "mainStory" | "research" | "facts" | "safety";
  label: string;
  helper: string;
  sectionIds: ResearchSectionId[];
}

/**
 * Founder-facing groupings of the 10 research sections. Section IDs stay
 * stable so the parser / engine never care about presentation order.
 */
export const RESEARCH_GROUPS: ResearchGroup[] = [
  {
    id: "mainStory",
    label: "Main Story",
    helper: "What happened and what angle should HMG take?",
    sectionIds: ["founderNotes", "brandAngle", "timeline"],
  },
  {
    id: "research",
    label: "Research",
    helper: "Paste research from NotebookLM, Gemini, Google, YouTube, interviews, or links.",
    sectionIds: ["notebookLM", "geminiResearch", "youtubeTranscript", "sourceLinks"],
  },
  {
    id: "facts",
    label: "Facts & Quotes",
    helper: "Add confirmed facts, background context, and quote attribution.",
    sectionIds: ["evergreenFacts", "quotes"],
  },
  {
    id: "safety",
    label: "Safety",
    helper: "Add rumors, claims, or weak details the article should avoid.",
    sectionIds: ["whatNotToClaim"],
  },
];

const URL_RE = /(https?:\/\/[^\s)]+)/i;
const DATE_LIKE_RE =
  /(\b\d{4}-\d{2}-\d{2}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,\s*\d{4})?|\bQ[1-4]\s+\d{4}\b|\bFY\s*\d{4}\b)/i;
const QUOTE_RE = /["“]([^"”]{4,400})["”]\s*[—–-]\s*([^\n]{2,160})/g;
const SPEAKER_LINE_RE = /^([A-Z][\w'.\- ]{1,40}):\s+(.{6,})$/;

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function unique<T>(arr: T[], key: (v: T) => string = String): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const v of arr) {
    const k = key(v);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

function extractCapitalizedNames(text: string): string[] {
  // Crude proper-noun detector for who/what.
  const re =
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}|[A-Z]{2,5}(?:\s+[A-Z]{2,5}){0,2})\b/g;
  const STOP = new Set([
    "The",
    "This",
    "That",
    "These",
    "Those",
    "There",
    "Their",
    "They",
    "It",
    "He",
    "She",
    "We",
    "His",
    "Her",
    "And",
    "But",
    "For",
    "With",
    "Also",
    "After",
    "Before",
    "While",
    "When",
    "If",
    "On",
    "In",
    "Of",
    "To",
    "At",
    "By",
    "As",
    "From",
    "Will",
    "Have",
    "Has",
    "Had",
    "Is",
    "Was",
    "Were",
    "Are",
    "Be",
    "Been",
    "Being",
    "Today",
    "Yesterday",
    "Tomorrow",
    "Now",
    "Soon",
    "Recently",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
    "January",
    "February",
    "March",
    "April",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ]);
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const candidate = m[1].trim();
    if (candidate.length < 3) continue;
    if (STOP.has(candidate)) continue;
    if (/^[A-Z]\.?$/.test(candidate)) continue;
    out.push(candidate);
  }
  // Frequency-rank, prefer multi-word entities.
  const freq = new Map<string, number>();
  for (const name of out) freq.set(name, (freq.get(name) ?? 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return b[0].split(/\s+/).length - a[0].split(/\s+/).length;
    })
    .map(([n]) => n)
    .slice(0, 8);
}

function extractQuotesFromText(
  text: string,
): { text: string; attribution: string }[] {
  const out: { text: string; attribution: string }[] = [];
  QUOTE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = QUOTE_RE.exec(text)) !== null) {
    out.push({ text: m[1].trim(), attribution: m[2].trim() });
  }
  // Speaker-prefixed lines from transcript-style input.
  for (const line of splitLines(text)) {
    const sp = line.match(SPEAKER_LINE_RE);
    if (sp) out.push({ text: sp[2].trim(), attribution: sp[1].trim() });
  }
  return unique(out, (q) => `${q.text}::${q.attribution}`);
}

function extractTimelineLines(text: string): string[] {
  return unique(
    splitLines(text).filter((l) => DATE_LIKE_RE.test(l) || /^\d+\./.test(l)),
  );
}

function extractFactLines(text: string): string[] {
  return splitLines(text).filter(
    (l) => l.length >= 8 && !l.startsWith("#") && !l.startsWith(">"),
  );
}

function extractLinks(
  text: string,
): { label: string; url: string }[] {
  const out: { label: string; url: string }[] = [];
  for (const line of splitLines(text)) {
    const sep = line.split(/\s*[—–-]\s*/);
    if (sep.length >= 2 && URL_RE.test(sep[sep.length - 1])) {
      const url = (sep[sep.length - 1].match(URL_RE) || [""])[0];
      const label = sep.slice(0, -1).join(" - ").trim();
      out.push({ label: label || url, url });
      continue;
    }
    const m = line.match(URL_RE);
    if (m) out.push({ label: line.replace(URL_RE, "").trim() || m[0], url: m[0] });
  }
  return unique(out, (v) => v.url);
}

function firstNonEmptySentence(text: string, max = 240): string {
  const first = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .find((s) => s.length >= 8);
  if (!first) return "";
  return first.length > max ? `${first.slice(0, max - 3)}...` : first;
}

function pickStoryTitle(
  notes: Partial<Record<ResearchSectionId, string>>,
): string {
  // Prefer Brand Angle, then Founder Notes, then NotebookLM/Gemini.
  for (const id of [
    "founderNotes",
    "brandAngle",
    "notebookLM",
    "geminiResearch",
  ] as ResearchSectionId[]) {
    const raw = (notes[id] ?? "").trim();
    if (!raw) continue;
    const first = firstNonEmptySentence(raw, 120);
    if (first) return first.replace(/[."]+$/, "").trim();
  }
  // Fallback to a flat scan.
  const flat = Object.values(notes).filter(Boolean).join("\n");
  return firstNonEmptySentence(flat, 120) || "Untitled story";
}

export function parseResearchNotes(
  sections: ResearchSection[],
): ParsedResearchNotes {
  const map: Partial<Record<ResearchSectionId, string>> = {};
  for (const s of sections) {
    if (s.text.trim()) map[s.id] = s.text.trim();
  }
  const everythingForNames = [
    map.founderNotes,
    map.notebookLM,
    map.geminiResearch,
    map.youtubeTranscript,
    map.evergreenFacts,
    map.brandAngle,
  ]
    .filter(Boolean)
    .join("\n\n");

  const quoteBlobs = [
    map.quotes,
    map.youtubeTranscript,
    map.notebookLM,
    map.geminiResearch,
    map.founderNotes,
  ]
    .filter(Boolean)
    .join("\n\n");

  const timelineBlob = [map.timeline, map.evergreenFacts, map.notebookLM]
    .filter(Boolean)
    .join("\n");

  const factsBlob = [
    map.evergreenFacts,
    map.notebookLM,
    map.geminiResearch,
    map.founderNotes,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    storyTitle: pickStoryTitle(map),
    what: firstNonEmptySentence(
      map.founderNotes ||
        map.brandAngle ||
        map.notebookLM ||
        map.geminiResearch ||
        "",
      320,
    ),
    who: extractCapitalizedNames(everythingForNames),
    timeline: extractTimelineLines(timelineBlob),
    verifiedFacts: extractFactLines(factsBlob).slice(0, 16),
    quotes: extractQuotesFromText(quoteBlobs).slice(0, 12),
    sourceLinks: extractLinks(map.sourceLinks ?? ""),
    context: (map.geminiResearch || map.notebookLM || "").trim(),
    angle: (map.brandAngle || map.founderNotes || "").trim(),
    whatNotToClaim: splitLines(map.whatNotToClaim ?? "").slice(0, 12),
    raw: map,
  };
}

export const PASTE_TEMPLATE = `STORY NOTES:
[what happened in 1–3 plain sentences]

WHO / WHAT:
[key people, brands, teams, places — one per line]

TIMELINE:
[Mar 14, 2026 — key event]
[Mar 17, 2026 — follow-up event]

VERIFIED FACTS:
[fact 1]
[fact 2]

QUOTES:
"Direct quote here." — Speaker Name, source

CONTEXT:
[background paragraph]

ANGLE:
[what HMG should emphasize]

WHAT NOT TO CLAIM:
[unsafe or unverified claim]

TARGET:
HipHopHaven · Feature
`;

export function splitPasteTemplate(
  raw: string,
): Partial<Record<ResearchSectionId, string>> {
  const lines = raw.split(/\r?\n/);
  const out: Partial<Record<ResearchSectionId, string>> = {};
  let current: ResearchSectionId | null = null;
  const buf: string[] = [];
  const HEADERS: { rx: RegExp; id: ResearchSectionId }[] = [
    { rx: /^STORY NOTES:?$/i, id: "founderNotes" },
    { rx: /^WHO\s*\/?\s*WHAT:?$/i, id: "founderNotes" },
    { rx: /^TIMELINE:?$/i, id: "timeline" },
    { rx: /^VERIFIED FACTS:?$/i, id: "evergreenFacts" },
    { rx: /^QUOTES:?$/i, id: "quotes" },
    { rx: /^CONTEXT:?$/i, id: "geminiResearch" },
    { rx: /^ANGLE:?$/i, id: "brandAngle" },
    { rx: /^WHAT NOT TO CLAIM:?$/i, id: "whatNotToClaim" },
    { rx: /^SOURCES?:?$/i, id: "sourceLinks" },
    { rx: /^NOTEBOOKLM:?$/i, id: "notebookLM" },
    { rx: /^TRANSCRIPT:?$/i, id: "youtubeTranscript" },
  ];
  const flush = () => {
    if (current && buf.length) {
      out[current] = (out[current] ? out[current] + "\n" : "") + buf.join("\n");
    }
    buf.length = 0;
  };
  for (const line of lines) {
    const t = line.trim();
    const hit = HEADERS.find((h) => h.rx.test(t));
    if (hit) {
      flush();
      current = hit.id;
      continue;
    }
    if (current) buf.push(line);
  }
  flush();
  return out;
}
