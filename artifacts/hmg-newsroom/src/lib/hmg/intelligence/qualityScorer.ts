import type { BrandVoiceProfile, QualityScoreResult } from "./types";
import { analyzeFounderVoice } from "./founderVoice";

const gossipTerms = [
  "rumor",
  "sources close",
  "allegedly",
  "secretly",
  "spotted with",
  "dating",
  "beef rumor",
];

const unsupportedClaimTerms = [
  "confirmed",
  "guaranteed",
  "cured",
  "will definitely",
  "everyone knows",
  "without proof",
  "insider says",
];

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countHits(text: string, terms: string[]): number {
  const lower = text.toLowerCase();
  return terms.reduce((sum, term) => sum + (lower.includes(term) ? 1 : 0), 0);
}

export function scoreArticleDraft(input: {
  headline: string;
  body: string;
  brand: BrandVoiceProfile;
  hasSeoPack?: boolean;
  hasSocialPack?: boolean;
  hasVisualDirection?: boolean;
  sourceCount?: number;
}): QualityScoreResult {
  const text = `${input.headline}\n${input.body}`.trim();
  const founder = analyzeFounderVoice(text);
  const sourceCount = input.sourceCount ?? 0;
  const gossipHits = countHits(text, gossipTerms);
  const claimHits = countHits(text, unsupportedClaimTerms);
  const brandAngleHits = input.brand.allowedAngles.filter((angle) =>
    text.toLowerCase().includes(angle.toLowerCase().split(/\s+/)[0]),
  ).length;
  const bannedBrandHits = input.brand.bannedAngles.filter((angle) =>
    text.toLowerCase().includes(angle.toLowerCase().split(/\s+/)[0]),
  ).length;

  const founderVoiceFit = founder.score;
  const brandFit = clamp(72 + brandAngleHits * 8 - bannedBrandHits * 16);
  const unsupportedClaimRisk = clamp(claimHits * 24 + (sourceCount === 0 ? 24 : 0));
  const seoReadiness = clamp(
    (input.hasSeoPack ? 82 : 48) +
      (input.headline.length >= 35 && input.headline.length <= 78 ? 12 : -8),
  );
  const visualPenalty = input.hasVisualDirection ? 0 : 8;
  const socialPenalty = input.hasSocialPack ? 0 : 7;
  const gossipPenalty = gossipHits * 18;
  const claimPenalty = unsupportedClaimRisk * 0.34;
  const score = clamp(
    100 -
      (100 - founderVoiceFit) * 0.18 -
      (100 - brandFit) * 0.16 -
      (100 - seoReadiness) * 0.12 -
      gossipPenalty -
      claimPenalty -
      visualPenalty -
      socialPenalty,
  );

  const topStrengths: string[] = [];
  const topFixes: string[] = [];
  if (founder.passes) topStrengths.push("Founder voice is clean and direct.");
  else topFixes.push(founder.flags[0] ?? "Tighten founder voice.");
  if (brandFit >= 80) topStrengths.push(`Strong ${input.brand.name} brand fit.`);
  else topFixes.push(`Add one clear ${input.brand.name} angle: ${input.brand.allowedAngles[0]}.`);
  if (sourceCount > 0) topStrengths.push("Source material is present.");
  else topFixes.push("Add at least one clear source note before the post is ready for manual publish.");
  if (!input.hasVisualDirection) topFixes.push("Add a visual direction packet before handoff.");
  if (!input.hasSocialPack) topFixes.push("Add a social campaign packet before promotion.");
  if (gossipHits > 0) topFixes.unshift("Remove or verify gossip-risk language.");
  if (unsupportedClaimRisk >= 50) topFixes.unshift("Reduce unsupported claim risk with source attribution.");

  const noGossipCheck =
    gossipHits >= 3 ? "blocked" : gossipHits > 0 ? "needs-review" : "pass";
  const blockedReason =
    noGossipCheck === "blocked"
      ? "Blocked by no-gossip policy until speculative language is removed or sourced."
      : null;

  let recommendedNextAction = "Edit the draft, then create the visual and campaign copy.";
  if (blockedReason) recommendedNextAction = "Remove blocked claims before continuing.";
  else if (!input.hasVisualDirection) recommendedNextAction = "Open WebArt and create the HMG Visual Direction Packet.";
  else if (!input.hasSocialPack) recommendedNextAction = "Open Social Factory and create the social campaign output.";
  else if (score < 82) recommendedNextAction = "Apply the top fixes, then re-check quality.";

  return {
    score,
    founderVoiceFit,
    brandFit,
    unsupportedClaimRisk,
    noGossipCheck,
    seoReadiness,
    topStrengths: topStrengths.slice(0, 3),
    topFixes: topFixes.slice(0, 3),
    recommendedNextAction,
    blockedReason,
  };
}

export function formatArticleQualityReceipt(result: QualityScoreResult): string {
  return [
    "ARTICLE QUALITY RECEIPT",
    "",
    `Quality Score: ${result.score}/100`,
    `Founder Voice Fit: ${result.founderVoiceFit}/100`,
    `Brand Fit: ${result.brandFit}/100`,
    `Unsupported Claim Risk: ${result.unsupportedClaimRisk}/100`,
    `No-Gossip Check: ${result.noGossipCheck}`,
    `SEO Readiness: ${result.seoReadiness}/100`,
    "",
    "Top fixes:",
    ...(result.topFixes.length ? result.topFixes : ["- None flagged."]).map((item) => `- ${item}`),
    "",
    `Recommended next action: ${result.recommendedNextAction}`,
  ].join("\n");
}
