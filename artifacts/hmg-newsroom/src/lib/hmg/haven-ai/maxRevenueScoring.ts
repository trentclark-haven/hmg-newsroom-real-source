/**
 * Max Revenue Scoring Engine — deterministic 0-100 scoring for CRO items.
 *
 * No model calls. No fake revenue numbers. No estimated dollars.
 * Scores reflect content/audience/relationship signal quality only.
 * All score labels are editorial guidance, not financial projections.
 *
 * Truth: Local CRO Review | Founder Review Required | No Outreach Sent
 */

export type RevenueScoreLabel =
  | "No Money Move"
  | "Light Opportunity"
  | "Real Opportunity"
  | "Priority Revenue Move"
  | "Founder-Level Deal Signal";

export interface RevenueScoreDimension {
  name: string;
  score: number; // 0–10
  note: string;
}

export interface RevenueScore {
  audienceFit: number;       // 0–10
  sponsorFit: number;        // 0–10
  relationshipValue: number; // 0–10
  urgency: number;           // 0–10
  repeatablePackage: number; // 0–10
  reputationSafety: number;  // 0–10
  founderEffort: number;     // 0–10 (10 = low effort needed — inverted for UX)
  moneyMoveScore: number;    // 0–100 composite
  label: RevenueScoreLabel;
  breakdown: string;
  dimensions: RevenueScoreDimension[];
}

function clamp(n: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function labelFromScore(score: number): RevenueScoreLabel {
  if (score >= 80) return "Founder-Level Deal Signal";
  if (score >= 65) return "Priority Revenue Move";
  if (score >= 45) return "Real Opportunity";
  if (score >= 25) return "Light Opportunity";
  return "No Money Move";
}

export function scoreLabelColor(label: RevenueScoreLabel): string {
  const map: Record<RevenueScoreLabel, string> = {
    "No Money Move": "text-muted-foreground",
    "Light Opportunity": "text-amber-600 dark:text-amber-400",
    "Real Opportunity": "text-sky-600 dark:text-sky-300",
    "Priority Revenue Move": "text-emerald-600 dark:text-emerald-400",
    "Founder-Level Deal Signal": "text-violet-600 dark:text-violet-300",
  };
  return map[label];
}

export function scoreLabelBg(label: RevenueScoreLabel): string {
  const map: Record<RevenueScoreLabel, string> = {
    "No Money Move": "bg-secondary border-border text-muted-foreground",
    "Light Opportunity": "bg-amber-500/10 border-amber-400/40 text-amber-700 dark:text-amber-300",
    "Real Opportunity": "bg-sky-500/10 border-sky-400/40 text-sky-700 dark:text-sky-300",
    "Priority Revenue Move": "bg-emerald-500/10 border-emerald-400/40 text-emerald-700 dark:text-emerald-300",
    "Founder-Level Deal Signal": "bg-violet-500/10 border-violet-400/40 text-violet-700 dark:text-violet-300",
  };
  return map[label];
}

export function computeRevenueScore(sourceText: string, signals: string[]): RevenueScore {
  const t = sourceText.toLowerCase();

  // ─── 1. Audience Fit ───────────────────────────────────────────────────────
  let audienceFit = 3;
  if (/(hip.hop|rap|music|artist|album|tour)/.test(t)) audienceFit += 3;
  if (/(sport|athlete|nba|nfl|mma|fight)/.test(t)) audienceFit += 2;
  if (/(fitness|wellness|gym|health)/.test(t)) audienceFit += 2;
  if (/(cannabis|cbd)/.test(t)) audienceFit += 1;
  if (/(festival|event|live|concert)/.test(t)) audienceFit += 2;
  if (/(exclusive|breaking|first look|debut)/.test(t)) audienceFit += 1;
  const audienceFitScore = clamp(audienceFit);
  const audienceFitNote =
    audienceFitScore >= 8
      ? "Strong vertical audience match."
      : audienceFitScore >= 5
      ? "Decent audience fit — confirm vertical alignment before pitching."
      : "Weak audience signal. Sharpen the angle before approaching a sponsor.";

  // ─── 2. Sponsor Fit ────────────────────────────────────────────────────────
  let sponsorFit = 2;
  if (/(sponsor|advertiser|brand deal|ad read|campaign|collab)/.test(t)) sponsorFit += 4;
  if (/(product|launch|drop|merch|apparel|gear)/.test(t)) sponsorFit += 2;
  if (/(streaming|platform|tech|app|software)/.test(t)) sponsorFit += 1;
  if (/(local business|restaurant|shop|store|venue)/.test(t)) sponsorFit += 2;
  if (/(beverage|drink|energy|supplement|protein)/.test(t)) sponsorFit += 2;
  if (signals.length >= 4) sponsorFit += 2;
  const sponsorFitScore = clamp(sponsorFit);
  const sponsorFitNote =
    sponsorFitScore >= 8
      ? "Clear sponsor category identified. Worth building a pitch note."
      : sponsorFitScore >= 5
      ? "Some sponsor signals. Identify one specific category before moving."
      : "No obvious sponsor fit yet. Develop the content angle first.";

  // ─── 3. Relationship Value ─────────────────────────────────────────────────
  let relValue = 1;
  if (/(manager|publicist|agent|rep|label|team)/.test(t)) relValue += 4;
  if (/(interview|sit.down|exclusive|meeting|call)/.test(t)) relValue += 3;
  if (/(partner|collab|intro|connect|referral)/.test(t)) relValue += 2;
  if (/(reached out|contact|follow.up|relationship)/.test(t)) relValue += 2;
  const relationshipValueScore = clamp(relValue);
  const relationshipNote =
    relationshipValueScore >= 7
      ? "Real relationship signal. Log the contact manually. No outreach without Founder sign-off."
      : relationshipValueScore >= 4
      ? "Some relationship potential. Map the contact path before moving."
      : "No direct relationship signal. This is a content play first.";

  // ─── 4. Urgency ───────────────────────────────────────────────────────────
  let urgency = 2;
  if (/(today|tonight|this week|tomorrow|imminent|dropping|launches|drops)/.test(t)) urgency += 5;
  if (/(event|show|festival|concert|game|match|fight|release)/.test(t)) urgency += 3;
  if (/(limited|exclusive|early|first|breaking|breaking|debut)/.test(t)) urgency += 2;
  const urgencyScore = clamp(urgency);
  const urgencyNote =
    urgencyScore >= 7
      ? "Time-sensitive. This window closes. Build content now."
      : urgencyScore >= 4
      ? "Moderate urgency. Move within 3–7 days or the angle softens."
      : "No immediate time pressure. Pace this correctly.";

  // ─── 5. Repeatable Package ────────────────────────────────────────────────
  let repeatable = 2;
  if (/(series|recurring|weekly|monthly|season|regular|ongoing)/.test(t)) repeatable += 4;
  if (/(interview|sit.down|profile)/.test(t)) repeatable += 3;
  if (/(event|show|festival)/.test(t)) repeatable += 2;
  if (/(newsletter|recap|roundup|column)/.test(t)) repeatable += 2;
  const repeatableScore = clamp(repeatable);
  const repeatableNote =
    repeatableScore >= 7
      ? "High repeatability. This could be a scalable package — worth documenting."
      : repeatableScore >= 4
      ? "Some repeat potential. If this works once, build a template."
      : "One-off play. Execute it well but don't overbuild the infrastructure.";

  // ─── 6. Reputation Safety ─────────────────────────────────────────────────
  let reputationSafety = 8;
  if (/(beef|drama|controversy|arrest|lawsuit|scandal|beef)/.test(t)) reputationSafety -= 5;
  if (/(politics|politician|election|vote|political)/.test(t)) reputationSafety -= 3;
  if (/(explicit|nsfw|adult|pornographic)/.test(t)) reputationSafety -= 4;
  if (/(criminal|illegal|fraud|scam)/.test(t)) reputationSafety -= 5;
  if (/(clean|family|community|positive|inspire)/.test(t)) reputationSafety += 1;
  const reputationSafetyScore = clamp(reputationSafety);
  const reputationNote =
    reputationSafetyScore >= 8
      ? "Reputation-clean. Low brand safety risk."
      : reputationSafetyScore >= 5
      ? "Some reputation considerations. Flag for Founder before pitching sponsors."
      : "Reputation risk present. Do not pitch sponsors until Founder reviews and approves.";

  // ─── 7. Founder Effort (10 = low effort = good) ───────────────────────────
  let founderEffort = 5;
  if (/(complex|complicated|difficult|high risk|sensitive|legal)/.test(t)) founderEffort -= 2;
  if (/(easy|simple|quick|fast|straightforward|clear)/.test(t)) founderEffort += 2;
  if (/(cold outreach|no relationship|unknown|never met)/.test(t)) founderEffort -= 3;
  if (/(existing|already know|warm|established|ongoing)/.test(t)) founderEffort += 3;
  if (signals.length >= 5) founderEffort -= 1;
  const founderEffortScore = clamp(founderEffort);
  const effortNote =
    founderEffortScore >= 8
      ? "Low effort required. This can move fast."
      : founderEffortScore >= 5
      ? "Moderate effort. Allocate time before committing."
      : "High effort. Weigh the upside carefully before going deep.";

  // ─── Composite Money Move Score ────────────────────────────────────────────
  // Weighted: sponsorFit (25%), audienceFit (20%), reputationSafety (20%),
  //           relationshipValue (15%), urgency (10%), repeatable (5%), founderEffort (5%)
  const rawComposite =
    sponsorFitScore * 2.5 +
    audienceFitScore * 2.0 +
    reputationSafetyScore * 2.0 +
    relationshipValueScore * 1.5 +
    urgencyScore * 1.0 +
    repeatableScore * 0.5 +
    founderEffortScore * 0.5;
  const moneyMoveScore = Math.max(0, Math.min(100, Math.round(rawComposite)));
  const label = labelFromScore(moneyMoveScore);

  const breakdown =
    moneyMoveScore >= 80
      ? `Score ${moneyMoveScore}/100 — ${label}. This is worth your time and attention. Founder review before any outreach.`
      : moneyMoveScore >= 65
      ? `Score ${moneyMoveScore}/100 — ${label}. Real move here. Build the content, then open the revenue conversation.`
      : moneyMoveScore >= 45
      ? `Score ${moneyMoveScore}/100 — ${label}. Worth tracking. Don't rush it — let the content prove the audience first.`
      : moneyMoveScore >= 25
      ? `Score ${moneyMoveScore}/100 — ${label}. Light signal. Log it and revisit when you have more context.`
      : `Score ${moneyMoveScore}/100 — ${label}. Not worth chasing right now. Move on.`;

  const dimensions: RevenueScoreDimension[] = [
    { name: "Audience Fit", score: audienceFitScore, note: audienceFitNote },
    { name: "Sponsor Fit", score: sponsorFitScore, note: sponsorFitNote },
    { name: "Relationship Value", score: relationshipValueScore, note: relationshipNote },
    { name: "Urgency", score: urgencyScore, note: urgencyNote },
    { name: "Repeatable Package", score: repeatableScore, note: repeatableNote },
    { name: "Reputation Safety", score: reputationSafetyScore, note: reputationNote },
    { name: "Founder Effort (Low = Better)", score: founderEffortScore, note: effortNote },
  ];

  return {
    audienceFit: audienceFitScore,
    sponsorFit: sponsorFitScore,
    relationshipValue: relationshipValueScore,
    urgency: urgencyScore,
    repeatablePackage: repeatableScore,
    reputationSafety: reputationSafetyScore,
    founderEffort: founderEffortScore,
    moneyMoveScore,
    label,
    breakdown,
    dimensions,
  };
}
