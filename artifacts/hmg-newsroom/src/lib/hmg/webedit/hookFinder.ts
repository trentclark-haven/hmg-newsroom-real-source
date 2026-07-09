/**
 * Deterministic Hook Finder Engine — WebEdit Clip Studio
 *
 * Input: pasted transcript + notes + do-not-use markers
 * Output: hook candidates, angle suggestions, risk notes, platform guidance
 *
 * NO fake AI. NO fake transcription. NO external calls.
 * All logic is deterministic from pasted text.
 */

export interface HookCandidate {
  id: string;
  type:
    | "strongest-quote"
    | "first-hook"
    | "emotional"
    | "educational"
    | "headline"
    | "controversy"
    | "founder-note"
    | "risk-warning"
    | "needs-verification";
  label: string;
  text: string;
  confidence: "high" | "medium" | "low";
  note: string;
}

export interface HookFinderResult {
  candidates: HookCandidate[];
  recommendedFirstSegment: string;
  urgencyAngle: string;
  educationalAngle: string;
  emotionalAngle: string;
  controversyAngle: string;
  headlineAngle: string;
  captionStyleSuggestion: string;
  formatRecommendation: string;
  headlineOverlaySuggestion: string;
  riskNotes: string[];
  verificationNotes: string[];
  doNotUseFound: string[];
  wordCount: number;
  estimatedDurationSec: number;
  quoteHeavy: boolean;
  topSentences: string[];
}

const RISK_PATTERNS = [
  /\b(allegedly|reportedly|sources say|unconfirmed|rumor|claim|accused)\b/gi,
  /\b(lawsuit|legal|court|charges|arrested|indicted)\b/gi,
  /\b(exclusive|breaking|first reported)\b/gi,
];

const EMOTIONAL_MARKERS = [
  /\b(shocking|unbelievable|incredible|devastating|heartbreaking|inspiring|amazing|horrifying)\b/gi,
  /\b(never before|first time|historic|unprecedented|record-breaking)\b/gi,
  /[!]{2,}/g,
];

const EDUCATIONAL_MARKERS = [
  /\b(here is|here's|this is|this means|what you need to know|the reason|why|how|because)\b/gi,
  /\b(explained|breakdown|deep dive|context|background|history)\b/gi,
  /\b(step|tip|lesson|key|important|critical|essential)\b/gi,
];

const URGENCY_MARKERS = [
  /\b(just|now|today|breaking|latest|update|new|just happened|developing)\b/gi,
  /\b(this week|this month|right now|at this moment)\b/gi,
];

const CONTROVERSY_MARKERS = [
  /\b(controversial|scandal|backlash|outrage|slammed|called out|fired|resigned|accused|banned|suspended|arrested|crisis)\b/gi,
  /\b(divide|split opinion|angry|furious|disgusted|offended|disrespected|dragged|cancel|cancell)\b/gi,
  /\b(beef|beef with|feud|clash|blasted|destroyed|exposed|receipts)\b/gi,
];

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && s.length < 280);
}

function scoreEmotional(sentence: string): number {
  let score = 0;
  for (const pattern of EMOTIONAL_MARKERS) {
    const matches = sentence.match(pattern);
    score += (matches?.length ?? 0) * 2;
  }
  if (sentence.endsWith("!")) score += 1;
  if (sentence.length < 80) score += 1;
  return score;
}

function scoreEducational(sentence: string): number {
  let score = 0;
  for (const pattern of EDUCATIONAL_MARKERS) {
    const matches = sentence.match(pattern);
    score += matches?.length ?? 0;
  }
  return score;
}

function scoreUrgency(sentence: string): number {
  let score = 0;
  for (const pattern of URGENCY_MARKERS) {
    const matches = sentence.match(pattern);
    score += matches?.length ?? 0;
  }
  return score;
}

function scoreControversy(sentence: string): number {
  let score = 0;
  for (const pattern of CONTROVERSY_MARKERS) {
    const matches = sentence.match(pattern);
    score += (matches?.length ?? 0) * 2;
  }
  return score;
}

function hasRisk(sentence: string): boolean {
  return RISK_PATTERNS.some((p) => p.test(sentence));
}

function isQuoteHeavy(sentences: string[]): boolean {
  const quoteCount = sentences.filter(
    (s) => s.includes('"') || s.includes("\u201c") || s.includes("\u201d") || /^["']/.test(s),
  ).length;
  return quoteCount >= 2 || (sentences.length > 0 && quoteCount / sentences.length > 0.3);
}

function findStrongestQuote(sentences: string[]): string {
  if (!sentences.length) return "";
  const quoted = sentences.filter(
    (s) => s.includes('"') || s.includes("\u201c") || s.includes("\u201d"),
  );
  if (quoted.length) {
    return quoted.sort((a, b) => b.length - a.length)[0];
  }
  return sentences
    .slice()
    .sort((a, b) => {
      const aScore = scoreEmotional(a) + scoreUrgency(a);
      const bScore = scoreEmotional(b) + scoreUrgency(b);
      return bScore - aScore;
    })[0];
}

function findFirstHook(sentences: string[]): string {
  const short = sentences.filter((s) => s.length < 100);
  if (short.length) return short[0];
  return sentences[0] ?? "";
}

function findEmotionalHook(sentences: string[]): string {
  return (
    sentences
      .filter((s) => scoreEmotional(s) > 0)
      .sort((a, b) => scoreEmotional(b) - scoreEmotional(a))[0] ?? ""
  );
}

function findEducationalHook(sentences: string[]): string {
  return (
    sentences
      .filter((s) => scoreEducational(s) > 0)
      .sort((a, b) => scoreEducational(b) - scoreEducational(a))[0] ?? ""
  );
}

function findControversyHook(sentences: string[]): string {
  return (
    sentences
      .filter((s) => scoreControversy(s) > 0)
      .sort((a, b) => scoreControversy(b) - scoreControversy(a))[0] ?? ""
  );
}

function buildHeadlineHook(sentences: string[], topic: string): string {
  const urgentSentences = sentences.filter((s) => scoreUrgency(s) > 0);
  if (urgentSentences.length) {
    const s = urgentSentences[0];
    return s.length > 120 ? s.slice(0, 117) + "..." : s;
  }
  if (topic) return topic.slice(0, 120);
  return sentences[0]?.slice(0, 120) ?? "";
}

function suggestCaptionStyle(sentences: string[], platform: string): string {
  const emotionalTotal = sentences.reduce((sum, s) => sum + scoreEmotional(s), 0);
  const urgencyTotal = sentences.reduce((sum, s) => sum + scoreUrgency(s), 0);
  const controversyTotal = sentences.reduce((sum, s) => sum + scoreControversy(s), 0);
  const educationalTotal = sentences.reduce((sum, s) => sum + scoreEducational(s), 0);

  if (controversyTotal >= 4 || urgencyTotal >= 5) return "breaking";
  if (emotionalTotal >= 5) return "pop";
  if (educationalTotal >= 4) return "editorial";
  if (platform === "tiktok" || platform === "youtube-short") return "kinetic";
  if (platform === "instagram") return "pop";
  if (platform === "x") return "clean";
  return "clean";
}

function suggestFormat(platform: string, estimatedDurationSec: number): string {
  if (platform === "tiktok") return "9:16 — TikTok full-bleed vertical";
  if (platform === "youtube-short") return "9:16 — YouTube Shorts";
  if (platform === "instagram") {
    return estimatedDurationSec <= 90 ? "9:16 — Instagram Reels or 1:1 Feed" : "16:9 — Instagram IGTV";
  }
  if (platform === "x") return "16:9 or 1:1 — X video";
  if (platform === "youtube") return "16:9 — YouTube";
  return "9:16 and 16:9 — export both to cover TikTok/Reels and YouTube";
}

function buildHeadlineOverlay(
  strongestQuote: string,
  headlineHook: string,
  topic: string,
): string {
  const source = strongestQuote || headlineHook || topic;
  if (!source) return "Set a clip title in the Brand section";
  const clean = source.replace(/^["'\u201c\u201d]|["'\u201c\u201d]$/g, "").trim();
  if (clean.length <= 60) return clean.toUpperCase();
  const words = clean.split(/\s+/);
  const short = words.slice(0, 8).join(" ");
  return short.length > 4 ? short.toUpperCase() + "…" : clean.slice(0, 56).toUpperCase() + "…";
}

function detectDoNotUsePhrases(fullText: string, doNotUseText: string): string[] {
  if (!doNotUseText.trim()) return [];
  const markers = doNotUseText
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
  const found: string[] = [];
  for (const marker of markers) {
    const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(escaped, "i").test(fullText)) {
      found.push(marker);
    }
  }
  return found;
}

export function runHookFinder(opts: {
  transcript: string;
  notes?: string;
  topic?: string;
  platform?: string;
  brand?: string;
  doNotUseText?: string;
}): HookFinderResult {
  const {
    transcript,
    notes = "",
    topic = "",
    platform = "",
    brand = "",
    doNotUseText = "",
  } = opts;

  const fullText = [transcript.trim(), notes.trim()].filter(Boolean).join("\n\n");
  if (!fullText.trim()) {
    return {
      candidates: [],
      recommendedFirstSegment: "",
      urgencyAngle: "",
      educationalAngle: "",
      emotionalAngle: "",
      controversyAngle: "",
      headlineAngle: "",
      captionStyleSuggestion: "clean",
      formatRecommendation: "9:16 and 16:9 — export both to cover TikTok/Reels and YouTube",
      headlineOverlaySuggestion: topic ? topic.toUpperCase() : "Set a clip title to generate overlay",
      riskNotes: ["No transcript or notes provided. Paste content to generate hook suggestions."],
      verificationNotes: [],
      doNotUseFound: [],
      wordCount: 0,
      estimatedDurationSec: 0,
      quoteHeavy: false,
      topSentences: [],
    };
  }

  const tokens = fullText.split(/\s+/).filter(Boolean);
  const wordCount = tokens.length;
  const estimatedDurationSec = Math.round(wordCount / 2.5);

  const sentences = splitSentences(fullText);

  const strongestQuote = findStrongestQuote(sentences);
  const firstHook = findFirstHook(sentences);
  const emotionalHook = findEmotionalHook(sentences);
  const educationalHook = findEducationalHook(sentences);
  const controversyHook = findControversyHook(sentences);
  const headlineHook = buildHeadlineHook(sentences, topic);
  const quoteHeavy = isQuoteHeavy(sentences);

  const doNotUseFound = detectDoNotUsePhrases(fullText, doNotUseText);

  const riskSentences = sentences.filter(hasRisk);
  const riskNotes = riskSentences.length
    ? [
        `Risk language detected in ${riskSentences.length} sentence(s). Review before publishing.`,
        ...riskSentences
          .slice(0, 2)
          .map((s) => `⚠ "${s.slice(0, 100)}${s.length > 100 ? "..." : ""}"`),
      ]
    : [];

  const verificationNotes: string[] = [];
  if (/\b(source|according to|said|told|reported)\b/gi.test(fullText)) {
    verificationNotes.push("Source references found — confirm attribution before publishing.");
  }
  if (
    /\b(number|percent|%|\$[0-9]|[0-9]+\s*(million|billion|thousand))\b/gi.test(fullText)
  ) {
    verificationNotes.push("Statistics detected — verify figures against original source.");
  }
  if (doNotUseFound.length) {
    verificationNotes.push(
      `Do Not Use markers found in transcript: "${doNotUseFound.slice(0, 3).join('", "')}". Review before saving any segment that includes these lines.`,
    );
  }

  const topSentences = sentences
    .slice()
    .sort(
      (a, b) =>
        scoreEmotional(b) +
        scoreUrgency(b) +
        scoreEducational(b) -
        (scoreEmotional(a) + scoreUrgency(a) + scoreEducational(a)),
    )
    .slice(0, 5);

  const founderNote = brand
    ? `Open by establishing ${brand}'s angle on this story, not the raw facts.`
    : "Open from the Founder's perspective — what does this mean for the audience?";

  const platformHint =
    platform === "tiktok" || platform === "youtube-short"
      ? "First 1–2 seconds are critical. Start mid-action or mid-sentence."
      : platform === "instagram"
        ? "Hook must be visible before 'more' tap. Front-load the payoff."
        : platform === "x"
          ? "Lead with the sharpest declarative sentence. No throat-clearing."
          : "Lead with the sharpest sentence available.";

  const captionStyleSuggestion = suggestCaptionStyle(sentences, platform);
  const formatRecommendation = suggestFormat(platform, estimatedDurationSec);
  const headlineOverlaySuggestion = buildHeadlineOverlay(strongestQuote, headlineHook, topic);

  const candidates: HookCandidate[] = [];

  if (strongestQuote) {
    candidates.push({
      id: "strongest-quote",
      type: "strongest-quote",
      label: "Strongest Quote",
      text: strongestQuote,
      confidence: strongestQuote.includes('"') ? "high" : "medium",
      note: "Best candidate for opening the video. Works as the first spoken line or overlay text.",
    });
  }

  if (firstHook && firstHook !== strongestQuote) {
    candidates.push({
      id: "first-hook",
      type: "first-hook",
      label: "First 3-Second Hook",
      text: firstHook.length > 120 ? firstHook.slice(0, 117) + "..." : firstHook,
      confidence: firstHook.length < 80 ? "high" : "medium",
      note: platformHint,
    });
  }

  if (emotionalHook && emotionalHook !== strongestQuote && emotionalHook !== firstHook) {
    candidates.push({
      id: "emotional-hook",
      type: "emotional",
      label: "Emotional Hook",
      text: emotionalHook,
      confidence: scoreEmotional(emotionalHook) > 2 ? "high" : "medium",
      note: "Use this for reaction bait or evergreen shares. Verify it doesn't overstate the facts.",
    });
  }

  if (educationalHook && educationalHook !== strongestQuote && educationalHook !== firstHook) {
    candidates.push({
      id: "educational-hook",
      type: "educational",
      label: "Educational Hook",
      text: educationalHook,
      confidence: scoreEducational(educationalHook) > 1 ? "high" : "medium",
      note: "Works for explainer clips. Pair with a lower-third that names the topic.",
    });
  }

  if (
    controversyHook &&
    controversyHook !== strongestQuote &&
    controversyHook !== firstHook &&
    controversyHook !== emotionalHook
  ) {
    candidates.push({
      id: "controversy-hook",
      type: "controversy",
      label: "Controversy Angle",
      text: controversyHook,
      confidence: scoreControversy(controversyHook) > 2 ? "high" : "medium",
      note: "High engagement potential. Verify facts carefully — controversy clips attract scrutiny.",
    });
  }

  if (headlineHook) {
    candidates.push({
      id: "headline-hook",
      type: "headline",
      label: "Headline Hook",
      text: headlineHook,
      confidence: "medium",
      note: "Use as the overlay text or thumbnail headline. Keep to one line.",
    });
  }

  candidates.push({
    id: "founder-note",
    type: "founder-note",
    label: "Founder Note",
    text: founderNote,
    confidence: "high",
    note: "Positioning reminder — not a direct caption.",
  });

  if (riskNotes.length) {
    candidates.push({
      id: "risk-warning",
      type: "risk-warning",
      label: "Risk Warning",
      text: riskNotes[0],
      confidence: "high",
      note: "Review these lines before any clip goes live.",
    });
  }

  if (verificationNotes.length) {
    candidates.push({
      id: "needs-verification",
      type: "needs-verification",
      label: "Needs Verification",
      text: verificationNotes.join(" "),
      confidence: "high",
      note: "Standard source-check reminder. Not a claim that facts are wrong.",
    });
  }

  const urgencyAngle =
    sentences
      .filter((s) => scoreUrgency(s) > 0)
      .map((s) => s.slice(0, 160))
      .join(" · ")
      .slice(0, 280) ||
    "No time-sensitive language detected. Frame around why this matters now.";

  const controversyTopSentence = sentences
    .filter((s) => scoreControversy(s) > 0)
    .sort((a, b) => scoreControversy(b) - scoreControversy(a))[0];

  const controversyAngle = controversyTopSentence
    ? controversyTopSentence.slice(0, 200)
    : "No controversy signals detected. Lead with facts or the strongest quote.";

  const educationalAngle =
    educationalHook || "Explain what changed and why it matters.";
  const emotionalAngle =
    emotionalHook ||
    "Find the human moment — quote or reaction — that grounds the clip.";
  const headlineAngle =
    headlineHook ||
    (topic
      ? topic.slice(0, 120)
      : "Set a clear topic before building the headline hook.");

  const recommendedFirstSegment =
    strongestQuote ||
    firstHook ||
    (sentences[0] ?? "Add a transcript to get a first-segment recommendation.");

  return {
    candidates,
    recommendedFirstSegment,
    urgencyAngle,
    educationalAngle,
    emotionalAngle,
    controversyAngle,
    headlineAngle,
    captionStyleSuggestion,
    formatRecommendation,
    headlineOverlaySuggestion,
    riskNotes,
    verificationNotes,
    doNotUseFound,
    wordCount,
    estimatedDurationSec,
    quoteHeavy,
    topSentences,
  };
}
