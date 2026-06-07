/**
 * Max Judgment Engine
 *
 * Executive judgment layer beyond scoring.
 * Classifies money type, founder effort, timing, and decision.
 * Provides voice-native copy for each judgment.
 * Deterministic — no model calls.
 * Truth label: Local Max Intelligence
 */

import { getMaxVerdict, getMaxRiskPhrase, getMaxRelationshipPhrase, getMaxSportsRead } from "./maxVoiceEngine";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type MoneyType =
  | "Sponsor Play"
  | "Relationship Play"
  | "Audience Growth Play"
  | "Authority Play"
  | "Package Play"
  | "Offline Money Play"
  | "Ignore";

export type FounderEffort =
  | "5-Minute Move"
  | "30-Minute Move"
  | "Half-Day Move"
  | "Needs Team"
  | "Not Worth Founder Time";

export type TimingRead =
  | "Act Now"
  | "Watch It"
  | "Save for Package"
  | "Relationship First"
  | "Ignore";

export type JudgmentDecision = "Chase" | "Watch" | "Package" | "Delegate" | "Ignore";

export interface MaxJudgment {
  moneyType: MoneyType;
  founderEffort: FounderEffort;
  timing: TimingRead;
  decision: JudgmentDecision;
  why: string;
  founderNextMove: string;
  whatMaxWouldNotDo: string;
  sportsRead: { analogy: string; meaning: string; founderAction: string } | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Keyword sets
// ──────────────────────────────────────────────────────────────────────────────

const SPONSOR_SIGNALS = [
  "sponsor", "brand deal", "partnership", "ad", "advertising", "integrate",
  "placement", "branded", "official partner", "campaign", "deal", "collaborate",
];

const RELATIONSHIP_SIGNALS = [
  "manager", "publicist", "agent", "label", "team", "reach out", "connect",
  "follow up", "warm intro", "meet", "relationship", "contact", "network",
  "rep", "booking", "attorney",
];

const AUDIENCE_SIGNALS = [
  "viral", "trending", "traffic", "views", "audience", "grow", "followers",
  "subscribers", "engagement", "reach", "impressions", "platform", "social",
];

const AUTHORITY_SIGNALS = [
  "exclusive", "interview", "scoop", "break", "first to", "insider",
  "access", "behind the scenes", "source", "credentials", "credibility",
  "expert", "opinion", "analysis",
];

const PACKAGE_SIGNALS = [
  "package", "series", "franchise", "weekly", "monthly", "recurring",
  "template", "playbook", "bundle", "season", "repeatable", "system",
];

const OFFLINE_SIGNALS = [
  "event", "live", "venue", "concert", "show", "panel", "pop-up", "popup",
  "activation", "appearance", "merch", "merchandise", "meet and greet",
  "conference", "festival", "summit", "workshop",
];

const IGNORE_SIGNALS = [
  "drama", "beef", "rumor", "gossip", "controversial", "problematic",
  "lawsuit", "arrest", "scandal", "beef", "fake", "scam", "mlm",
  "pyramid", "predatory",
];

const URGENT_SIGNALS = [
  "tonight", "today", "now", "urgent", "asap", "deadline", "breaking",
  "tomorrow", "this week", "time-sensitive", "limited", "expires",
  "exclusive window",
];

const COMPLEX_SIGNALS = [
  "negotiation", "legal", "contract", "multi-brand", "cross-platform",
  "full campaign", "team effort", "needs approval", "requires team",
];

// ──────────────────────────────────────────────────────────────────────────────
// Classifiers
// ──────────────────────────────────────────────────────────────────────────────

function hasAny(text: string, signals: string[]): boolean {
  const lower = text.toLowerCase();
  return signals.some((s) => lower.includes(s));
}

function countSignals(text: string, signals: string[]): number {
  const lower = text.toLowerCase();
  return signals.filter((s) => lower.includes(s)).length;
}

export function classifyMoneyType(text: string, signals: string[]): MoneyType {
  const all = [text, ...signals].join(" ").toLowerCase();
  const allText = all;

  if (hasAny(allText, IGNORE_SIGNALS)) return "Ignore";
  if (countSignals(allText, SPONSOR_SIGNALS) >= 2) return "Sponsor Play";
  if (countSignals(allText, OFFLINE_SIGNALS) >= 2) return "Offline Money Play";
  if (countSignals(allText, PACKAGE_SIGNALS) >= 1) return "Package Play";
  if (countSignals(allText, RELATIONSHIP_SIGNALS) >= 2) return "Relationship Play";
  if (countSignals(allText, AUTHORITY_SIGNALS) >= 2) return "Authority Play";
  if (countSignals(allText, AUDIENCE_SIGNALS) >= 2) return "Audience Growth Play";
  if (hasAny(allText, SPONSOR_SIGNALS)) return "Sponsor Play";
  if (hasAny(allText, RELATIONSHIP_SIGNALS)) return "Relationship Play";
  return "Package Play";
}

export function classifyFounderEffort(text: string): FounderEffort {
  const lower = text.toLowerCase();
  if (hasAny(lower, IGNORE_SIGNALS)) return "Not Worth Founder Time";
  if (hasAny(lower, COMPLEX_SIGNALS)) return "Needs Team";
  if (countSignals(lower, OFFLINE_SIGNALS) >= 2) return "Half-Day Move";
  if (hasAny(lower, PACKAGE_SIGNALS)) return "30-Minute Move";
  if (hasAny(lower, URGENT_SIGNALS) && hasAny(lower, SPONSOR_SIGNALS)) return "30-Minute Move";
  if (hasAny(lower, AUTHORITY_SIGNALS)) return "30-Minute Move";
  if (hasAny(lower, SPONSOR_SIGNALS)) return "5-Minute Move";
  return "5-Minute Move";
}

export function classifyTiming(text: string): TimingRead {
  const lower = text.toLowerCase();
  if (hasAny(lower, IGNORE_SIGNALS)) return "Ignore";
  if (hasAny(lower, URGENT_SIGNALS)) return "Act Now";
  if (hasAny(lower, RELATIONSHIP_SIGNALS)) return "Relationship First";
  if (hasAny(lower, PACKAGE_SIGNALS)) return "Save for Package";
  return "Watch It";
}

export function makeDecision(
  moneyType: MoneyType,
  effort: FounderEffort,
  timing: TimingRead,
  score: number,
): JudgmentDecision {
  if (moneyType === "Ignore" || effort === "Not Worth Founder Time") return "Ignore";
  if (effort === "Needs Team") return "Delegate";
  if (timing === "Ignore") return "Ignore";
  if (timing === "Act Now" && score >= 50) return "Chase";
  if (timing === "Save for Package" || moneyType === "Package Play") return "Package";
  if (score >= 65) return "Chase";
  if (score >= 40) return "Watch";
  return "Ignore";
}

// ──────────────────────────────────────────────────────────────────────────────
// Voice-native copy generators
// ──────────────────────────────────────────────────────────────────────────────

const MONEY_TYPE_WHY: Record<MoneyType, string> = {
  "Sponsor Play": "This has sponsor potential — an audience moment a brand would pay to be part of. The editorial trust makes the pitch cleaner.",
  "Relationship Play": "This is about the relationship, not the content. The money follows a warm lane. Build the lane first.",
  "Audience Growth Play": "Audience first, revenue second. Growing the right people compounds the sponsor value.",
  "Authority Play": "Credibility is the asset here. The exclusive or interview elevates the HMG brand. Revenue follows authority.",
  "Package Play": "This becomes money when it's repeatable. Build the package before the pitch.",
  "Offline Money Play": "The real bag is offline — event, appearance, activation. The content is the marketing.",
  "Ignore": "Nothing here that moves HMG forward. Save the Founder's time.",
};

const EFFORT_NEXT_MOVE: Record<FounderEffort, string> = {
  "5-Minute Move": "Flag it, note the angle, and slot it into the next content calendar review.",
  "30-Minute Move": "Block 30 minutes, draft the angle, and get a copy-ready brief to Output History.",
  "Half-Day Move": "Plan a half-day session. Outline the package, identify the sponsor fit, and prep for Founder decision.",
  "Needs Team": "This is a team play. Don't carry it solo. Define the brief, assign the parts, and checkpoint at 48 hours.",
  "Not Worth Founder Time": "Pass on this one. The Founder's time has a floor. This doesn't clear it.",
};

const DECISION_AVOID: Record<JudgmentDecision, string> = {
  Chase: "Don't chase without a clear close path. Speed without strategy burns relationships.",
  Watch: "Don't ignore it either. Watch means you're tracking it, not sleeping on it.",
  Package: "Don't pitch a one-off. The money is in the package, not the single placement.",
  Delegate: "Don't do this yourself. The moment you open this fully, you own it.",
  Ignore: "Don't reverse this without a major change in the situation. The cost is Founder time.",
};

// ──────────────────────────────────────────────────────────────────────────────
// Main entry point
// ──────────────────────────────────────────────────────────────────────────────

export function runJudgment(
  text: string,
  signals: string[],
  score: number,
): MaxJudgment {
  const seed = text.slice(0, 40);
  const moneyType = classifyMoneyType(text, signals);
  const effort = classifyFounderEffort(text);
  const timing = classifyTiming(text);
  const decision = makeDecision(moneyType, effort, timing, score);

  const why = `${MONEY_TYPE_WHY[moneyType]} ${getMaxVerdict(decision, seed)}`;
  const founderNextMove = EFFORT_NEXT_MOVE[effort];
  const whatMaxWouldNotDo = DECISION_AVOID[decision];
  const sportsRead = getMaxSportsRead(decision, effort, seed);

  return { moneyType, founderEffort: effort, timing, decision, why, founderNextMove, whatMaxWouldNotDo, sportsRead };
}

// ──────────────────────────────────────────────────────────────────────────────
// Founder Commands dispatcher
// ──────────────────────────────────────────────────────────────────────────────

export type FounderCommand =
  | "is-this-money-or-noise"
  | "whats-the-sponsor-angle"
  | "what-should-i-ignore"
  | "whats-the-relationship-play"
  | "turn-this-into-a-package"
  | "give-me-the-quick-read"
  | "what-would-max-do"
  | "what-would-max-not-do"
  | "give-me-the-buffett-read"
  | "give-me-the-deal-lawyer-read";

export function runFounderCommand(
  command: FounderCommand,
  judgment: MaxJudgment,
  seed: string,
): string {
  switch (command) {
    case "is-this-money-or-noise":
      return judgment.decision === "Ignore"
        ? `Noise. ${getMaxIgnoreText(seed)}`
        : `This is money. Money type: ${judgment.moneyType}. ${judgment.why}`;
    case "whats-the-sponsor-angle":
      return judgment.moneyType === "Sponsor Play"
        ? `Strong sponsor play. ${judgment.why} Next move: ${judgment.founderNextMove}`
        : `Sponsor angle is secondary here. Primary move: ${judgment.moneyType}. Still worth noting if a brand fits the audience.`;
    case "what-should-i-ignore":
      return judgment.moneyType === "Ignore"
        ? `All of it. ${judgment.whatMaxWouldNotDo}`
        : `Don't get distracted by the noise around this. Focus on: ${judgment.moneyType}. Ignore the rest.`;
    case "whats-the-relationship-play":
      return judgment.moneyType === "Relationship Play"
        ? `${getMaxRelationshipPhrase(seed)} ${judgment.founderNextMove}`
        : `Relationship angle exists but isn't the primary move. If there's a warm lane here, note it before any money conversation.`;
    case "turn-this-into-a-package":
      return `Package it. The money is in repeatability. ${judgment.founderNextMove} Avoid: ${judgment.whatMaxWouldNotDo}`;
    case "give-me-the-quick-read":
      return `${judgment.decision}. ${judgment.moneyType}. ${judgment.founderEffort}. ${judgment.founderNextMove}`;
    case "what-would-max-do":
      return `${getMaxVerdict(judgment.decision, seed)} ${judgment.founderNextMove}`;
    case "what-would-max-not-do":
      return judgment.whatMaxWouldNotDo;
    case "give-me-the-buffett-read":
      return `Is this durable? ${judgment.timing === "Act Now" ? "Time-sensitive, but check the shelf life." : "Worth watching."} Is it repeatable? ${judgment.moneyType === "Package Play" ? "Yes — this is a package play." : "Build toward repeatability."} Does it compound the brand? ${judgment.moneyType === "Authority Play" || judgment.moneyType === "Relationship Play" ? "Yes." : "Indirectly."} ${judgment.moneyType === "Ignore" ? "Low-drama money beats high-drama noise. Pass." : "Low-drama, quiet upside. Buffett lens says: watch and position."}`;
    case "give-me-the-deal-lawyer-read":
      return `Business risk review — not legal advice. ${getMaxRiskPhrase(seed)} Check: rights, brand safety, exclusivity claims, sponsor mismatch, reputation surface. ${judgment.whatMaxWouldNotDo}`;
    default:
      return `${judgment.why} Next: ${judgment.founderNextMove}`;
  }
}

function getMaxIgnoreText(seed: string): string {
  const phrases = [
    "Don't spend Founder time here.",
    "That's motion, not money.",
    "Nothing here for HMG.",
    "Move on.",
  ];
  let hash = 0;
  for (const c of seed) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return phrases[Math.abs(hash) % phrases.length];
}

// ──────────────────────────────────────────────────────────────────────────────
// Deal Lawyer Lens
// ──────────────────────────────────────────────────────────────────────────────

export interface DealLawyerReview {
  riskLevel: "Low" | "Medium" | "High" | "Flag";
  flags: string[];
  cleanPath: string;
  whatToProtect: string;
  verdict: string;
}

const RIGHTS_SIGNALS = ["exclusive", "rights", "license", "ownership", "ip", "trademark", "copyright", "contract", "agreement"];
const OVERPROMISE_SIGNALS = ["guarantee", "guaranteed", "promise", "will definitely", "assured", "100%", "certain"];
const BAD_OPTICS_SIGNALS = ["controversial", "problematic", "offensive", "insensitive", "drama", "beef", "scandal"];
const SPONSOR_MISMATCH = ["payday", "predatory", "tobacco", "vaping", "pyramid", "mlm", "gambling"];

export function runDealLawyerLens(text: string, moneyType: MoneyType): DealLawyerReview {
  const lower = text.toLowerCase();
  const flags: string[] = [];

  if (hasAny(lower, RIGHTS_SIGNALS)) flags.push("Rights / ownership language detected. Clarify who owns what before moving.");
  if (hasAny(lower, OVERPROMISE_SIGNALS)) flags.push("Overpromise language detected. Never guarantee results to a sponsor.");
  if (hasAny(lower, BAD_OPTICS_SIGNALS)) flags.push("Brand safety concern. Check optics before attaching HMG name.");
  if (hasAny(lower, SPONSOR_MISMATCH)) flags.push("Potential sponsor mismatch with HMG brand standards. Flag for Founder review.");
  if (moneyType === "Offline Money Play" && !hasAny(lower, ["contract", "agreement", "terms"])) {
    flags.push("Offline event or activation — get terms in writing before any commitment.");
  }
  if (moneyType === "Sponsor Play" && hasAny(lower, ["exclusive"])) {
    flags.push("Exclusivity claim detected. Clarify exclusivity scope — category? platform? duration?");
  }

  const riskLevel: DealLawyerReview["riskLevel"] =
    flags.length >= 3 ? "Flag"
    : flags.length === 2 ? "High"
    : flags.length === 1 ? "Medium"
    : "Low";

  const cleanPath =
    riskLevel === "Flag" ? "Get a second opinion before moving. Too many risk surfaces open."
    : riskLevel === "High" ? "Clean the risk flags before pitching."
    : riskLevel === "Medium" ? "One issue to resolve, then this is clear to move."
    : "Clean path. Low risk surface. Execute with standard brand protection.";

  return {
    riskLevel,
    flags,
    cleanPath,
    whatToProtect: "HMG brand reputation. Founder credibility. Editorial integrity. Content ownership.",
    verdict: `Business risk review — not legal advice. Risk level: ${riskLevel}. ${cleanPath}`,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Buffett Filter
// ──────────────────────────────────────────────────────────────────────────────

export interface BuffettFilter {
  isDurable: boolean;
  isRepeatable: boolean;
  buildsEquity: boolean;
  compoundsRelationships: boolean;
  isNoise: boolean;
  verdict: string;
  founderNote: string;
}

export function runBuffettFilter(text: string, moneyType: MoneyType, score: number): BuffettFilter {
  const lower = text.toLowerCase();
  const isDurable = !hasAny(lower, ["one-time", "one time", "one off", "trending", "viral", "hype"]) && score >= 45;
  const isRepeatable = moneyType === "Package Play" || hasAny(lower, PACKAGE_SIGNALS);
  const buildsEquity = moneyType === "Authority Play" || moneyType === "Relationship Play" || moneyType === "Sponsor Play";
  const compoundsRelationships = moneyType === "Relationship Play" || hasAny(lower, RELATIONSHIP_SIGNALS);
  const isNoise = moneyType === "Ignore" || score < 25;

  const verdict = isNoise
    ? "Noise. Buffett lens says: ignore the hype cycle. The brand is the moat."
    : isDurable && isRepeatable
    ? "This is durable and repeatable. Simple business, long-term play. This is the type of move Buffett would hold."
    : isRepeatable
    ? "Repeatable, but durability unclear. Build the package and test the market before over-investing."
    : isDurable
    ? "Durable, but needs a repeatable structure. One-offs don't compound. Find the franchise version."
    : "Time-sensitive. Take it if the upside is real, but don't mistake motion for a moat.";

  const founderNote = buildsEquity
    ? "This builds HMG brand equity. Prioritize accordingly."
    : compoundsRelationships
    ? "This compounds the relationship moat. The money follows trust."
    : "Execute cleanly, then move on. Don't over-invest in a one-time play.";

  return { isDurable, isRepeatable, buildsEquity, compoundsRelationships, isNoise, verdict, founderNote };
}

// ──────────────────────────────────────────────────────────────────────────────
// Max Questions Generator
// ──────────────────────────────────────────────────────────────────────────────

export interface MaxQuestion {
  question: string;
  category: "relationship" | "package" | "sponsor" | "timing" | "audience" | "founder";
}

export function generateMaxQuestions(text: string, moneyType: MoneyType, judgment: MaxJudgment): MaxQuestion[] {
  const qs: MaxQuestion[] = [];

  // Always ask
  qs.push({ question: "Is this money or noise? Be honest.", category: "founder" });
  qs.push({ question: "Is this worth Founder time or should it become a template?", category: "founder" });

  // Relationship
  if (moneyType === "Relationship Play" || hasAny(text.toLowerCase(), RELATIONSHIP_SIGNALS)) {
    qs.push({ question: "Do we already have a warm lane to this person?", category: "relationship" });
    qs.push({ question: "Is this a one-time contact or a recurring revenue relationship?", category: "relationship" });
    qs.push({ question: "The bag is in the relationship, not the post — are we leading with editorial trust?", category: "relationship" });
  }

  // Package
  if (moneyType === "Package Play" || hasAny(text.toLowerCase(), PACKAGE_SIGNALS)) {
    qs.push({ question: "Can this become a weekly franchise?", category: "package" });
    qs.push({ question: "Is this a one-off post or a repeatable sponsor category?", category: "package" });
    qs.push({ question: "What is the minimum viable package version of this?", category: "package" });
  }

  // Sponsor
  if (moneyType === "Sponsor Play" || hasAny(text.toLowerCase(), SPONSOR_SIGNALS)) {
    qs.push({ question: "Would a sponsor care about the audience or just the topic?", category: "sponsor" });
    qs.push({ question: "Is the clean sponsor angle here a brand fit or just a keyword match?", category: "sponsor" });
  }

  // Audience / vertical
  qs.push({ question: "Would this fit HipHopHaven, MusicHaven, or both?", category: "audience" });
  qs.push({ question: "Is there a clean local LA angle here?", category: "audience" });

  // Timing
  if (judgment.timing === "Act Now") {
    qs.push({ question: "What's the actual deadline on this? Is urgency real or manufactured?", category: "timing" });
  } else {
    qs.push({ question: "If we wait 30 days, does this opportunity get better or disappear?", category: "timing" });
  }

  // Noise
  qs.push({ question: "Are we chasing money or chasing noise?", category: "founder" });

  return qs.slice(0, 8); // cap at 8
}
