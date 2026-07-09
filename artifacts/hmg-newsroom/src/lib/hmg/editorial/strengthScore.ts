import type { ParsedResearchNotes } from "./types.ts";

export type StrengthBand = "weak" | "fair" | "strong";

export interface StrengthSignal {
  id:
    | "sourceDepth"
    | "timeline"
    | "quotes"
    | "sourceLinks"
    | "verificationRisk"
    | "publishReadiness";
  label: string;
  band: StrengthBand;
  detail: string;
}

export interface ArticleStrength {
  score: number;
  band: StrengthBand;
  signals: StrengthSignal[];
  recommendation: string;
}

function bandFromCount(count: number, weakAt: number, strongAt: number): StrengthBand {
  if (count <= weakAt) return "weak";
  if (count >= strongAt) return "strong";
  return "fair";
}

function bandScore(band: StrengthBand): number {
  if (band === "strong") return 100;
  if (band === "fair") return 60;
  return 25;
}

export function computeArticleStrength(notes: ParsedResearchNotes): ArticleStrength {
  const sourceDepthCount = notes.verifiedFacts.length;
  const sourceDepthBand = bandFromCount(sourceDepthCount, 1, 4);
  const sourceDepth: StrengthSignal = {
    id: "sourceDepth",
    label: "Source depth",
    band: sourceDepthBand,
    detail:
      sourceDepthCount === 0
        ? "No verified facts pasted yet."
        : `${sourceDepthCount} verified fact line${sourceDepthCount === 1 ? "" : "s"} captured.`,
  };

  const timelineCount = notes.timeline.length;
  const timelineBand = bandFromCount(timelineCount, 0, 3);
  const timeline: StrengthSignal = {
    id: "timeline",
    label: "Timeline",
    band: timelineBand,
    detail:
      timelineCount === 0
        ? "No timeline beats — add at least one date."
        : `${timelineCount} timeline beat${timelineCount === 1 ? "" : "s"} captured.`,
  };

  const quoteCount = notes.quotes.length;
  const quoteBand = bandFromCount(quoteCount, 0, 2);
  const quotes: StrengthSignal = {
    id: "quotes",
    label: "Quotes",
    band: quoteBand,
    detail:
      quoteCount === 0
        ? "No quotes — do not invent them. Add a real one if you want pull-quote material."
        : `${quoteCount} quote${quoteCount === 1 ? "" : "s"} with attribution.`,
  };

  const linkCount = notes.sourceLinks.length;
  const linkBand = bandFromCount(linkCount, 0, 2);
  const sourceLinks: StrengthSignal = {
    id: "sourceLinks",
    label: "Source links",
    band: linkBand,
    detail:
      linkCount === 0
        ? "No source URLs — add at least one before manual publish."
        : `${linkCount} source link${linkCount === 1 ? "" : "s"} attached.`,
  };

  // Verification risk: high when the do-not-claim list AND key signals are both thin.
  const hasGuardrails = notes.whatNotToClaim.length > 0;
  const verificationBand: StrengthBand = !hasGuardrails && sourceDepthCount < 2
    ? "weak"
    : sourceDepthCount < 3
      ? "fair"
      : "strong";
  const verificationRisk: StrengthSignal = {
    id: "verificationRisk",
    label: "Verification risk",
    band: verificationBand,
    detail:
      verificationBand === "weak"
        ? "Low source coverage and no do-not-claim guardrails. Verify before manual publish."
        : verificationBand === "fair"
          ? "Some coverage; still scan the body against the source lines before manual publish."
          : "Adequate coverage and guardrails recorded.",
  };

  const signals: StrengthSignal[] = [
    sourceDepth,
    timeline,
    quotes,
    sourceLinks,
    verificationRisk,
  ];
  const partial =
    signals.reduce((sum, s) => sum + bandScore(s.band), 0) / signals.length;

  // Manual publish readiness — weighted output of the other signals + a final pass/fail check.
  const blockingMissing =
    sourceDepthCount === 0 || (linkCount === 0 && timelineCount === 0);
  const publishBand: StrengthBand = blockingMissing
    ? "weak"
    : partial >= 70
      ? "strong"
      : "fair";
  const publishReadiness: StrengthSignal = {
    id: "publishReadiness",
    label: "Manual publish readiness",
    band: publishBand,
    detail:
      publishBand === "weak"
        ? "Publish Blocked. Add verified facts and at least one source link or timeline beat."
        : publishBand === "fair"
          ? "Tighten quotes, links, or the do-not-claim list before manual publish."
          : "Ready for editorial polish and manual publish review.",
  };

  signals.push(publishReadiness);

  const score = Math.round(
    signals.reduce((sum, s) => sum + bandScore(s.band), 0) / signals.length,
  );
  const band: StrengthBand =
    score >= 75 ? "strong" : score >= 45 ? "fair" : "weak";
  const recommendation =
    band === "strong"
      ? "Draft is in good shape. Edit once, then create WebArt visuals and Social Factory posts."
      : band === "fair"
        ? "Close the weak signals above before manual publish — usually one more fact line or a source link fixes it."
        : "Publish Blocked. Add real source material; the article body is a frame, not a finished piece.";

  return { score, band, signals, recommendation };
}
