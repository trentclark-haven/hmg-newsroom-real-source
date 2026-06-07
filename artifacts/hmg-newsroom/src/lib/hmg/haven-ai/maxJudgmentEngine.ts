/**
 * Max Judgment Engine — Final Overdrive
 *
 * Deeper decision model: 9 money types, 7 decisions, 6 effort levels, 7 timing reads.
 * Adds: confidence level, upside/downside, what would make better/worse,
 *   "Founder should only touch this if…", Deal Lawyer Lens (15 flags), Buffett/Moolah Filter,
 *   Sports Money Lens (18 categories), Max Questions Generator, Founder Commands (18 commands).
 * Deterministic — no model calls.
 * Truth label: Local Max Intelligence
 */

import {
  getMaxVerdict,
  getMaxRiskPhrase,
  getMaxRelationshipFirstPhrase,
  getMaxPackagePhrase,
  getMaxIgnorePhrase,
  getMaxChasePhrase,
  getMaxSportsRead,
  type SportsRead,
} from "./maxVoiceEngine";

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
  | "Brand Equity Play"
  | "Franchise Content Play"
  | "Ignore";

export type JudgmentDecision =
  | "Chase"
  | "Watch"
  | "Package"
  | "Relationship First"
  | "Delegate"
  | "Save for Later"
  | "Ignore";

export type FounderEffort =
  | "5-Minute Move"
  | "15-Minute Move"
  | "30-Minute Move"
  | "Half-Day Move"
  | "Needs Team"
  | "Not Worth Founder Time";

export type TimingRead =
  | "Act Now"
  | "Same Day"
  | "This Week"
  | "Watch It"
  | "Save for Package"
  | "Relationship First"
  | "Ignore";

export interface MaxJudgment {
  moneyType: MoneyType;
  founderEffort: FounderEffort;
  timing: TimingRead;
  decision: JudgmentDecision;
  confidence: number;               // 0–100
  why: string;
  upsideExplanation: string;
  downsideExplanation: string;
  whatWouldMakeItBetter: string;
  whatWouldMakeItNotWorthIt: string;
  founderNextMove: string;
  whatMaxWouldDo: string;
  whatMaxWouldNotDo: string;
  founderShouldOnlyTouchIf: string;
  sportsRead: SportsRead | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Keyword helpers
// ──────────────────────────────────────────────────────────────────────────────

function hasAny(text: string, signals: string[]): boolean {
  const lower = text.toLowerCase();
  return signals.some((s) => lower.includes(s));
}

function countSignals(text: string, signals: string[]): number {
  const lower = text.toLowerCase();
  return signals.filter((s) => lower.includes(s)).length;
}

const SPONSOR_SIGNALS = ["sponsor", "brand deal", "partnership", "ad ", "advertising", "integrate", "placement", "branded", "official partner", "campaign", "deal", "collaborate"];
const RELATIONSHIP_SIGNALS = ["manager", "publicist", "agent", "label", "team", "reach out", "connect", "follow up", "warm intro", "meet", "relationship", "contact", "network", "rep", "booking", "attorney", "pr", "a&r"];
const AUDIENCE_SIGNALS = ["viral", "trending", "traffic", "views", "audience", "grow", "followers", "subscribers", "engagement", "reach", "impressions", "platform", "social", "tiktok", "instagram", "youtube"];
const AUTHORITY_SIGNALS = ["exclusive", "interview", "scoop", "break", "first to", "insider", "access", "behind the scenes", "source", "credentials", "credibility", "expert", "opinion", "analysis"];
const PACKAGE_SIGNALS = ["package", "series", "franchise", "weekly", "monthly", "recurring", "template", "playbook", "bundle", "season", "repeatable", "system"];
const OFFLINE_SIGNALS = ["event", "live", "venue", "concert", "show", "panel", "pop-up", "popup", "activation", "appearance", "merch", "merchandise", "meet and greet", "conference", "festival", "summit", "workshop"];
const BRAND_EQUITY_SIGNALS = ["brand", "equity", "reputation", "authority", "credibility", "long-term", "moat", "thought leader", "flagship"];
const FRANCHISE_SIGNALS = ["franchise", "recurring", "weekly show", "weekly series", "monthly series", "season", "ongoing", "permanent", "signature"];
const IGNORE_SIGNALS = ["drama", "beef", "rumor", "gossip-only", "controversial", "problematic", "lawsuit", "arrest", "scandal", "fake", "scam", "mlm", "pyramid", "predatory"];
const URGENT_SIGNALS = ["tonight", "today", "now", "urgent", "asap", "deadline", "breaking", "tomorrow", "this week", "time-sensitive", "limited", "expires", "exclusive window"];
const SAME_DAY_SIGNALS = ["today", "tonight", "this afternoon", "same day", "tonight's", "today's"];
const COMPLEX_SIGNALS = ["negotiation", "legal", "contract", "multi-brand", "cross-platform", "full campaign", "team effort", "needs approval", "requires team"];

// ──────────────────────────────────────────────────────────────────────────────
// Classifiers
// ──────────────────────────────────────────────────────────────────────────────

export function classifyMoneyType(text: string, signals: string[]): MoneyType {
  const all = [text, ...signals].join(" ").toLowerCase();
  if (hasAny(all, IGNORE_SIGNALS) && !hasAny(all, SPONSOR_SIGNALS)) return "Ignore";
  if (hasAny(all, FRANCHISE_SIGNALS)) return "Franchise Content Play";
  if (countSignals(all, OFFLINE_SIGNALS) >= 2) return "Offline Money Play";
  if (countSignals(all, BRAND_EQUITY_SIGNALS) >= 2) return "Brand Equity Play";
  if (countSignals(all, PACKAGE_SIGNALS) >= 1) return "Package Play";
  if (countSignals(all, SPONSOR_SIGNALS) >= 2) return "Sponsor Play";
  if (countSignals(all, RELATIONSHIP_SIGNALS) >= 2) return "Relationship Play";
  if (countSignals(all, AUTHORITY_SIGNALS) >= 2) return "Authority Play";
  if (countSignals(all, AUDIENCE_SIGNALS) >= 2) return "Audience Growth Play";
  if (hasAny(all, SPONSOR_SIGNALS)) return "Sponsor Play";
  if (hasAny(all, RELATIONSHIP_SIGNALS)) return "Relationship Play";
  if (hasAny(all, OFFLINE_SIGNALS)) return "Offline Money Play";
  return "Package Play";
}

export function classifyFounderEffort(text: string): FounderEffort {
  const lower = text.toLowerCase();
  if (hasAny(lower, IGNORE_SIGNALS)) return "Not Worth Founder Time";
  if (hasAny(lower, COMPLEX_SIGNALS)) return "Needs Team";
  if (countSignals(lower, OFFLINE_SIGNALS) >= 2) return "Half-Day Move";
  if (hasAny(lower, FRANCHISE_SIGNALS)) return "30-Minute Move";
  if (hasAny(lower, PACKAGE_SIGNALS)) return "15-Minute Move";
  if (hasAny(lower, URGENT_SIGNALS) && hasAny(lower, SPONSOR_SIGNALS)) return "15-Minute Move";
  if (hasAny(lower, AUTHORITY_SIGNALS)) return "30-Minute Move";
  if (hasAny(lower, SPONSOR_SIGNALS)) return "5-Minute Move";
  if (hasAny(lower, RELATIONSHIP_SIGNALS)) return "15-Minute Move";
  return "5-Minute Move";
}

export function classifyTiming(text: string): TimingRead {
  const lower = text.toLowerCase();
  if (hasAny(lower, IGNORE_SIGNALS) && !hasAny(lower, SPONSOR_SIGNALS)) return "Ignore";
  if (hasAny(lower, SAME_DAY_SIGNALS)) return "Same Day";
  if (hasAny(lower, URGENT_SIGNALS)) return "Act Now";
  if (hasAny(lower, RELATIONSHIP_SIGNALS)) return "Relationship First";
  if (hasAny(lower, FRANCHISE_SIGNALS) || hasAny(lower, PACKAGE_SIGNALS)) return "Save for Package";
  if (hasAny(lower, BRAND_EQUITY_SIGNALS)) return "This Week";
  return "Watch It";
}

function computeConfidence(
  moneyType: MoneyType, timing: TimingRead, score: number, signalCount: number,
): number {
  let c = 40;
  if (moneyType !== "Ignore") c += 15;
  if (timing === "Act Now" || timing === "Same Day") c += 10;
  if (timing === "This Week") c += 5;
  if (score >= 70) c += 20;
  else if (score >= 50) c += 10;
  else if (score >= 30) c += 5;
  if (signalCount >= 3) c += 10;
  else if (signalCount >= 1) c += 5;
  return Math.min(95, c);
}

export function makeDecision(
  moneyType: MoneyType, effort: FounderEffort, timing: TimingRead, score: number,
): JudgmentDecision {
  if (moneyType === "Ignore" || effort === "Not Worth Founder Time") return "Ignore";
  if (effort === "Needs Team") return "Delegate";
  if (timing === "Ignore") return "Ignore";
  if (moneyType === "Franchise Content Play") return "Package";
  if (moneyType === "Brand Equity Play") {
    return timing === "Act Now" || timing === "Same Day" ? "Chase" : "Save for Later";
  }
  if (moneyType === "Relationship Play" || timing === "Relationship First") return "Relationship First";
  if (timing === "Act Now" && score >= 50) return "Chase";
  if (timing === "Same Day" && score >= 40) return "Chase";
  if (timing === "Save for Package" || moneyType === "Package Play") return "Package";
  if (score >= 65) return "Chase";
  if (score >= 40) return "Watch";
  if (score >= 20) return "Save for Later";
  return "Ignore";
}

// ──────────────────────────────────────────────────────────────────────────────
// Voice-native copy
// ──────────────────────────────────────────────────────────────────────────────

const MONEY_TYPE_WHY: Record<MoneyType, string> = {
  "Sponsor Play": "This has sponsor potential — an audience moment a brand would pay to be part of. The editorial trust makes the pitch cleaner.",
  "Relationship Play": "The bag is in the relationship, not the post. The money follows the warm lane. Build the lane first.",
  "Audience Growth Play": "Audience first, revenue second. Growing the right people compounds the sponsor value over time.",
  "Authority Play": "Credibility is the asset. The exclusive or interview elevates the HMG brand. Revenue follows authority.",
  "Package Play": "This becomes money when it's repeatable. Package first, pitch second.",
  "Offline Money Play": "The real bag is offline — event, activation, appearance. The content is the marketing for the offline play.",
  "Brand Equity Play": "This is a brand equity move. Short-term revenue is secondary. The long game is the play.",
  "Franchise Content Play": "This has franchise potential — a repeatable, sponsor-friendly content structure worth building out.",
  "Ignore": "Nothing here that moves HMG forward. The opportunity cost outweighs the upside.",
};

const UPSIDE_BY_TYPE: Record<MoneyType, string> = {
  "Sponsor Play": "Direct revenue path if the sponsor category fits. Editorial credibility makes the ask cleaner.",
  "Relationship Play": "Relationship compound value — one warm contact can open multiple doors over time.",
  "Audience Growth Play": "Audience scale increases the value of future sponsor pitches.",
  "Authority Play": "Credibility and access compounding. One exclusive can establish HMG as the destination.",
  "Package Play": "Repeatable revenue structure once the package is built. Effort front-loaded, income recurring.",
  "Offline Money Play": "Event/offline activation revenue often exceeds digital ad rates. High-margin if executed.",
  "Brand Equity Play": "Long-term equity in the HMG brand. Every quality play compounds toward the moat.",
  "Franchise Content Play": "Monthly/weekly recurring revenue once the franchise sponsor is locked.",
  "Ignore": "No meaningful upside identified.",
};

const DOWNSIDE_BY_TYPE: Record<MoneyType, string> = {
  "Sponsor Play": "Sponsor mismatch or brand safety issue could cost credibility. Vetting is non-optional.",
  "Relationship Play": "Relationship plays require patience and no guarantee of revenue. Can feel like motion without money.",
  "Audience Growth Play": "Growth doesn't automatically convert to revenue. Need a monetization bridge.",
  "Authority Play": "Exclusives can burn sources if handled poorly. Credibility is both the asset and the liability.",
  "Package Play": "Packaging requires upfront build effort before any revenue flows.",
  "Offline Money Play": "High production cost if not properly funded. Event risk is real.",
  "Brand Equity Play": "Slow ROI. Can feel like overhead before it becomes moat.",
  "Franchise Content Play": "Franchise content requires sustained production commitment. Under-delivery burns sponsor trust.",
  "Ignore": "Opportunity cost if ignored incorrectly — double-check the read.",
};

const WHAT_MAKES_BETTER: Record<MoneyType, string> = {
  "Sponsor Play": "A tighter audience-to-sponsor match. Clear content hook. Exclusivity angle if possible.",
  "Relationship Play": "Warmer entry point. Editorial coverage first, then the conversation.",
  "Audience Growth Play": "A clear monetization bridge built into the growth strategy.",
  "Authority Play": "The exclusive angle needs to be real, not manufactured.",
  "Package Play": "A repeatable structure. Two or more use cases. Monthly pitch-ready.",
  "Offline Money Play": "Locked venue, defined audience, sponsor conversation before production starts.",
  "Brand Equity Play": "Patience + consistency. No shortcuts on quality.",
  "Franchise Content Play": "Committed production schedule. First three episodes built before pitching.",
  "Ignore": "A clear revenue signal and sponsor fit. Without both, this stays in ignore.",
};

const WHAT_MAKES_NOT_WORTH_IT: Record<MoneyType, string> = {
  "Sponsor Play": "Sponsor doesn't fit the editorial audience. The deal compromises HMG credibility.",
  "Relationship Play": "No warm lane. Cold outreach with no editorial history. Not the play.",
  "Audience Growth Play": "Growth without monetization runway. Building an audience with no path to revenue.",
  "Authority Play": "Shaky sourcing. Exclusivity that isn't real. Reputation risk on the claim.",
  "Package Play": "Package too complex to sell. No clear buyer for the structure.",
  "Offline Money Play": "No sponsor budget locked. Event cost not covered. Founder time drain.",
  "Brand Equity Play": "Brand equity play that compromises the brand. Contradiction kills the equity.",
  "Franchise Content Play": "Franchise concept that requires more team than available.",
  "Ignore": "If a revenue signal appears that wasn't visible initially, re-route to inbox.",
};

const FOUNDER_SHOULD_TOUCH_IF: Record<JudgmentDecision, string> = {
  Chase: "The brief is ready, the angle is clean, and the sponsor or relationship fit is clear.",
  Watch: "The signal strengthens, urgency increases, or a new angle emerges.",
  Package: "The package structure is built and a sponsor conversation is possible.",
  "Relationship First": "There's a specific warm lane to activate — not a cold outreach.",
  Delegate: "The team brief is ready and the scope is clearly defined.",
  "Save for Later": "The timing improves or the content fits a package being built.",
  Ignore: "A materially different signal appears that changes the revenue read.",
};

const WHAT_MAX_WOULD_DO: Record<JudgmentDecision, string> = {
  Chase: "Brief it, route it to Output History, and set a follow-up. Move this week.",
  Watch: "Log it, set a reminder, and check back in 7 days. Don't invest Founder time yet.",
  Package: "Build the one-page package structure. That's the next move. Pitch comes after.",
  "Relationship First": "Send the article or content link. Build the editorial warmth before any money conversation.",
  Delegate: "Write the brief, assign it, and checkpoint at 48 hours.",
  "Save for Later": "Log it to the watch list. Flag for the next package planning session.",
  Ignore: "Remove it from the Founder's mental queue. Not worth another look unless the situation changes.",
};

const WHAT_MAX_WOULD_NOT_DO: Record<JudgmentDecision, string> = {
  Chase: "Chase without a clear close path. Speed without strategy burns relationships.",
  Watch: "Ignore it entirely. Watch means tracking it, not sleeping on it.",
  Package: "Pitch a one-off. The money is in the package, not the single placement.",
  "Relationship First": "Lead with money. The relationship play dies the moment the pitch comes first.",
  Delegate: "Carry this solo. The complexity requires more than Founder bandwidth.",
  "Save for Later": "Invest Founder time now. The timing isn't right and the effort isn't worth it yet.",
  Ignore: "Reverse this without a material change in the situation. The cost is Founder time.",
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
  const confidence = computeConfidence(moneyType, timing, score, signals.length);

  const why = `${MONEY_TYPE_WHY[moneyType]} ${getMaxVerdict(decision, seed)}`;

  // Effort → next move category
  const moveCategory: "chase" | "watch" | "package" | "relationship" | "ignore" =
    decision === "Chase" ? "chase"
    : decision === "Watch" || decision === "Save for Later" ? "watch"
    : decision === "Package" ? "package"
    : decision === "Relationship First" ? "relationship"
    : "ignore";

  const founderNextMove =
    effort === "5-Minute Move"
      ? "Flag it. 5 minutes. Log it to Output History and move on."
      : effort === "15-Minute Move"
      ? "15-minute block. Draft the brief. Route to Output History."
      : decision === "Chase"
      ? "Block time this week. Draft the brief. Get it to Output History."
      : decision === "Package"
      ? "Block 30 minutes. Write the package structure. That's the move."
      : decision === "Relationship First"
      ? "Send the article or content link. Editorial warmth before money."
      : decision === "Watch" || decision === "Save for Later"
      ? "Log it. Set a reminder. No Founder time yet."
      : "Remove from the Founder's queue. Not worth the bandwidth.";

  const sportsRead = getMaxSportsRead(decision, effort, seed);

  return {
    moneyType,
    founderEffort: effort,
    timing,
    decision,
    confidence,
    why,
    upsideExplanation: UPSIDE_BY_TYPE[moneyType],
    downsideExplanation: DOWNSIDE_BY_TYPE[moneyType],
    whatWouldMakeItBetter: WHAT_MAKES_BETTER[moneyType],
    whatWouldMakeItNotWorthIt: WHAT_MAKES_NOT_WORTH_IT[moneyType],
    founderNextMove,
    whatMaxWouldDo: WHAT_MAX_WOULD_DO[decision],
    whatMaxWouldNotDo: WHAT_MAX_WOULD_NOT_DO[decision],
    founderShouldOnlyTouchIf: FOUNDER_SHOULD_TOUCH_IF[decision],
    sportsRead,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Deal Lawyer Lens — 15 flag types
// ──────────────────────────────────────────────────────────────────────────────

export interface DealFlag {
  type: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  whyItMatters: string;
  howToMakeSafer: string;
  founderReviewNote: string;
}

export interface DealLawyerReview {
  riskLevel: "Low" | "Medium" | "High" | "Flag";
  flags: DealFlag[];
  cleanerVersion: string;
  saferPitchAngle: string;
  doNotSayThis: string;
  humanReviewIf: string;
  cleanPath: string;
  whatToProtect: string;
  verdict: string;
}

const RIGHTS_SIGNALS = ["exclusive", "rights", "license", "ownership", "ip", "trademark", "copyright", "contract", "agreement"];
const OVERPROMISE_SIGNALS = ["guarantee", "guaranteed", "promise", "will definitely", "assured", "100%", "certain", "promise you"];
const BAD_OPTICS_SIGNALS = ["controversial", "problematic", "offensive", "insensitive", "drama", "beef", "scandal"];
const SPONSOR_MISMATCH_SIGNALS = ["payday", "predatory", "tobacco", "vaping", "pyramid", "mlm", "gambling", "crypto scam"];
const CONFLICT_SIGNALS = ["lawsuit", "sued", "suing", "legal action", "court", "settlement", "charged", "arrested"];
const FAKE_EXCL_SIGNALS = ["world exclusive", "only source", "breaking exclusively", "got it first"];
const PLATFORM_RISK_SIGNALS = ["tiktok ban", "demonetized", "banned from", "content strike", "age-restricted"];
const RELATIONSHIP_DAMAGE_SIGNALS = ["burn the bridge", "call out", "expose", "blast", "went off on"];
const SOURCE_UNCLEAR_SIGNALS = ["sources say", "allegedly", "reportedly", "unconfirmed", "rumors", "word is"];
const CLAIM_TOO_STRONG_SIGNALS = ["confirmed", "definitely", "absolutely", "no doubt", "100% true", "for a fact"];
const CONTROVERSY_HEAVY_SIGNALS = ["beef", "feud", "clap back", "shots fired", "responded", "went viral for"];
const TIME_DRAIN_SIGNALS = ["meeting required", "call needed", "multiple rounds", "complex negotiation", "back and forth"];
const AD_DISCOMFORT_SIGNALS = ["nsfw", "explicit", "adult content", "violence", "graphic"];

export function runDealLawyerLens(text: string, moneyType: MoneyType): DealLawyerReview {
  const lower = text.toLowerCase();
  const flags: DealFlag[] = [];

  if (hasAny(lower, RIGHTS_SIGNALS)) flags.push({ type: "Rights / Ownership", severity: "High", whyItMatters: "Unclear rights expose HMG to IP disputes.", howToMakeSafer: "Clarify who owns the content, placement, and any exclusivity scope.", founderReviewNote: "Do not sign or agree verbally until rights are clear." });
  if (hasAny(lower, OVERPROMISE_SIGNALS)) flags.push({ type: "Overpromising", severity: "High", whyItMatters: "Guaranteeing results damages credibility if not delivered.", howToMakeSafer: "Replace guarantees with 'best-effort' and audience-reach context.", founderReviewNote: "Never promise a sponsor specific results. Offer transparency instead." });
  if (hasAny(lower, BAD_OPTICS_SIGNALS)) flags.push({ type: "Brand Safety / Optics", severity: "High", whyItMatters: "Brand safety risk can damage HMG credibility with sponsors and audience.", howToMakeSafer: "Remove HMG branding from risky coverage or decline the angle.", founderReviewNote: "Founder review required before attaching HMG name to this." });
  if (hasAny(lower, SPONSOR_MISMATCH_SIGNALS)) flags.push({ type: "Sponsor Category Mismatch", severity: "Critical", whyItMatters: "Mismatched sponsor categories violate HMG editorial standards.", howToMakeSafer: "Decline. No deal in these categories is worth the brand cost.", founderReviewNote: "Hard no. No exceptions for predatory finance, MLM, or vaping." });
  if (hasAny(lower, CONFLICT_SIGNALS)) flags.push({ type: "Legal / Conflict Risk", severity: "High", whyItMatters: "Legal dispute adjacency is a reputation and legal liability risk.", howToMakeSafer: "Keep HMG coverage factual, sourced, and neutral.", founderReviewNote: "Founder review if HMG editorial is adjacent to a live legal dispute." });
  if (hasAny(lower, FAKE_EXCL_SIGNALS)) flags.push({ type: "Fake Exclusivity Risk", severity: "Medium", whyItMatters: "False exclusivity claims damage source relationships and audience trust.", howToMakeSafer: "Only claim exclusivity when genuinely first and sourced.", founderReviewNote: "Verify the exclusivity claim before publishing." });
  if (hasAny(lower, PLATFORM_RISK_SIGNALS)) flags.push({ type: "Platform Policy Risk", severity: "Medium", whyItMatters: "Platform strikes or bans can cut distribution at a critical time.", howToMakeSafer: "Review platform policy before publishing edge-case content.", founderReviewNote: "Check platform terms if content is borderline." });
  if (hasAny(lower, RELATIONSHIP_DAMAGE_SIGNALS)) flags.push({ type: "Relationship Damage Risk", severity: "High", whyItMatters: "Burning source or industry relationships has multi-year costs.", howToMakeSafer: "Soften the angle or decline the call-out play entirely.", founderReviewNote: "Is the story worth the relationship? Founder decides." });
  if (hasAny(lower, SOURCE_UNCLEAR_SIGNALS)) flags.push({ type: "Source Unclear", severity: "Medium", whyItMatters: "Unverified sourcing exposes HMG to credibility damage or correction cycles.", howToMakeSafer: "Verify before publishing. 'Reportedly' is a shield, not a fact.", founderReviewNote: "Do not treat unconfirmed tips as confirmed stories." });
  if (hasAny(lower, CLAIM_TOO_STRONG_SIGNALS)) flags.push({ type: "Claim Too Strong", severity: "Medium", whyItMatters: "Overconfident claims that turn out wrong damage editorial trust.", howToMakeSafer: "Scale back certainty language. 'Per sources' is safer than 'confirmed'.", founderReviewNote: "Verify before committing to strong language." });
  if (countSignals(lower, CONTROVERSY_HEAVY_SIGNALS) >= 2) flags.push({ type: "Controversy-Heavy Content", severity: "Medium", whyItMatters: "Controversy-heavy content risks alienating sponsors and sources.", howToMakeSafer: "Cover the news factually without amplifying the drama.", founderReviewNote: "Is this editorial purpose or entertainment noise?" });
  if (moneyType === "Offline Money Play" && !hasAny(lower, ["contract", "agreement", "terms", "signed"])) flags.push({ type: "Offline Without Written Terms", severity: "High", whyItMatters: "Verbal agreements for events or activations create liability.", howToMakeSafer: "Get terms in writing before any commitment — even informally.", founderReviewNote: "No offline activation without written terms." });
  if (hasAny(lower, TIME_DRAIN_SIGNALS)) flags.push({ type: "Founder Time Drain", severity: "Low", whyItMatters: "Processes requiring excessive Founder time without matching ROI drain capacity.", howToMakeSafer: "Delegate the back-and-forth. Founder enters at decision point only.", founderReviewNote: "Founder should not carry the full negotiation." });
  if (hasAny(lower, AD_DISCOMFORT_SIGNALS)) flags.push({ type: "Ad Partner Discomfort", severity: "Medium", whyItMatters: "Explicit or graphic content creates ad partner discomfort.", howToMakeSafer: "Keep explicit coverage off sponsor-adjacent pages or placements.", founderReviewNote: "Check if this content can live adjacent to ad placements." });
  if (moneyType === "Sponsor Play" && hasAny(lower, ["exclusive"])) flags.push({ type: "Exclusivity Scope Unclear", severity: "Medium", whyItMatters: "Exclusivity without defined scope (category, platform, duration) creates conflicts.", howToMakeSafer: "Define exclusivity: what category, which platforms, for how long.", founderReviewNote: "Clarify exclusivity scope before agreeing to any terms." });

  const riskLevel: DealLawyerReview["riskLevel"] =
    flags.some((f) => f.severity === "Critical") ? "Flag"
    : flags.filter((f) => f.severity === "High").length >= 2 ? "Flag"
    : flags.some((f) => f.severity === "High") ? "High"
    : flags.length >= 2 ? "Medium"
    : flags.length === 1 ? "Medium"
    : "Low";

  const cleanPath =
    riskLevel === "Flag" ? "Do not proceed without Founder review and resolution of critical flags."
    : riskLevel === "High" ? "Resolve the high-severity flags before moving forward."
    : riskLevel === "Medium" ? "Address the flagged items before the pitch. Manageable with care."
    : "Clean path. Low risk surface. Execute with standard brand protection.";

  const cleanerVersion = flags.length > 0
    ? `Remove or resolve: ${flags.slice(0, 2).map((f) => f.type).join(", ")}. Then the deal structure is cleaner.`
    : "The deal structure looks clean. Execute with standard brand protection.";

  const saferPitchAngle = flags.some((f) => f.type === "Brand Safety / Optics")
    ? "Lead with the editorial credibility and audience trust. De-emphasize the controversy angle."
    : flags.some((f) => f.type === "Overpromising")
    ? "Pitch with transparency: 'Here's what our audience looks like and how your brand fits.' No guarantees."
    : "Lead with the editorial value and audience access. Clean pitch, clean close.";

  const doNotSayThis =
    flags.some((f) => f.type === "Overpromising") ? "Don't say: 'guaranteed results' or 'I promise.'" :
    flags.some((f) => f.type === "Fake Exclusivity Risk") ? "Don't say: 'world exclusive' unless it's verified." :
    flags.some((f) => f.type === "Rights / Ownership") ? "Don't agree to any rights verbally. Always get it in writing." :
    "Don't overcommit. Keep the pitch grounded in what HMG can actually deliver.";

  const humanReviewIf = riskLevel === "Flag" || riskLevel === "High"
    ? "Human review required before any commitment is made. Do not move without Founder sign-off."
    : "Human review if the deal structure becomes complex or exclusivity claims appear.";

  return {
    riskLevel,
    flags,
    cleanerVersion,
    saferPitchAngle,
    doNotSayThis,
    humanReviewIf,
    cleanPath,
    whatToProtect: "HMG brand reputation. Founder editorial credibility. Content ownership. Source relationships.",
    verdict: `Business risk review — not legal advice. Risk level: ${riskLevel}. ${cleanPath}`,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Buffett / Moolah Filter
// ──────────────────────────────────────────────────────────────────────────────

export type BuffettVerdict = "Compound" | "Package" | "Wait" | "Avoid" | "Noise";

export interface MoolahPath {
  fastestMonetization: string;
  cleanestPackagePath: string;
  relationshipMoatPath: string;
  longTermBrandEquityPath: string;
  reasonNotToChase: string;
}

export interface BuffettFilter {
  compoundsEquity: boolean;
  isRepeatable: boolean;
  isSimpleEnoughToSell: boolean;
  buildsRelationshipMoat: boolean;
  isLowDrama: boolean;
  createsFutureDealFlow: boolean;
  protectsFounderTime: boolean;
  isJustHype: boolean;
  stillMatterIn30Days: boolean;
  canBecomeDurablePackage: boolean;
  verdict: BuffettVerdict;
  verdictExplanation: string;
  founderNote: string;
  moolahPath: MoolahPath;
}

export function runBuffettFilter(text: string, moneyType: MoneyType, score: number): BuffettFilter {
  const lower = text.toLowerCase();
  const compoundsEquity = moneyType === "Brand Equity Play" || moneyType === "Authority Play" || moneyType === "Franchise Content Play";
  const isRepeatable = moneyType === "Package Play" || moneyType === "Franchise Content Play" || hasAny(lower, PACKAGE_SIGNALS);
  const isSimpleEnoughToSell = !hasAny(lower, COMPLEX_SIGNALS) && score >= 40;
  const buildsRelationshipMoat = moneyType === "Relationship Play" || hasAny(lower, RELATIONSHIP_SIGNALS);
  const isLowDrama = !hasAny(lower, BAD_OPTICS_SIGNALS) && !hasAny(lower, CONTROVERSY_HEAVY_SIGNALS);
  const createsFutureDealFlow = buildsRelationshipMoat || compoundsEquity || isRepeatable;
  const protectsFounderTime = !hasAny(lower, TIME_DRAIN_SIGNALS) && !hasAny(lower, COMPLEX_SIGNALS);
  const isJustHype = hasAny(lower, ["viral", "trending", "blew up", "going crazy", "went viral"]) && !isRepeatable && score < 50;
  const stillMatterIn30Days = !hasAny(lower, SAME_DAY_SIGNALS) && !isJustHype;
  const canBecomeDurablePackage = isRepeatable || hasAny(lower, FRANCHISE_SIGNALS) || compoundsEquity;

  const positives = [compoundsEquity, isRepeatable, isSimpleEnoughToSell, buildsRelationshipMoat, isLowDrama, createsFutureDealFlow, protectsFounderTime, stillMatterIn30Days, canBecomeDurablePackage].filter(Boolean).length;
  const verdict: BuffettVerdict =
    moneyType === "Ignore" || score < 20 ? "Noise"
    : isJustHype ? "Avoid"
    : positives >= 7 ? "Compound"
    : positives >= 5 ? "Package"
    : positives >= 3 ? "Wait"
    : score < 30 ? "Noise"
    : "Avoid";

  const verdictExplanation: Record<BuffettVerdict, string> = {
    Compound: "This compounds HMG equity. Durable, repeatable, and relationship-building. Buffett lens says: this is the type of play that builds the moat.",
    Package: "Strong foundation for a package play. Build the structure, then the pitch. Repeatable revenue potential.",
    Wait: "Not ready. Some good signals but not enough durability or clarity yet. Wait for the angle to sharpen.",
    Avoid: "The hype is louder than the substance. Low-drama money beats high-drama noise. This doesn't pass the filter.",
    Noise: "Noise. Buffett lens says: ignore the hype cycle. The brand is the moat. This isn't moving the moat.",
  };

  const moolahPath: MoolahPath = {
    fastestMonetization:
      moneyType === "Sponsor Play" ? "Pitch the sponsor category match first. Don't wait for a package. Quick pitch, clean close."
      : moneyType === "Offline Money Play" ? "Lock the activation sponsor before confirming the event. Money first, then production."
      : moneyType === "Relationship Play" ? "The editorial coverage opens the relationship. The revenue conversation is the second touch."
      : moneyType === "Franchise Content Play" ? "Build the first three episodes. Show the format. Then pitch the franchise sponsor."
      : "Log the idea, brief it, route it to Output History. The fastest path is always the brief.",
    cleanestPackagePath:
      isRepeatable ? "Monthly editorial franchise: content + social + brand integration. Pitch as a retainer."
      : "Sponsored article + social amplification + newsletter mention. Three components, one pitch.",
    relationshipMoatPath:
      buildsRelationshipMoat ? "Send the editorial link first. The warm lane opens. Revenue conversation at the second touch."
      : "Cover the space consistently. The relationship moat builds through sustained editorial credibility.",
    longTermBrandEquityPath:
      compoundsEquity ? "This play directly builds HMG brand authority. The equity compounds with every quality execution."
      : "Every clean editorial play adds to the brand moat. Execute this well and it compounds over time.",
    reasonNotToChase:
      isJustHype ? "This is hype, not structure. The moment passes. The effort doesn't compound."
      : !isLowDrama ? "The drama risk is real. High-drama money comes with high-drama cost."
      : !protectsFounderTime ? "This requires more Founder bandwidth than the upside justifies."
      : "Low signal on durability and repeatability. The Buffett filter says wait for a better pitch.",
  };

  return {
    compoundsEquity, isRepeatable, isSimpleEnoughToSell, buildsRelationshipMoat,
    isLowDrama, createsFutureDealFlow, protectsFounderTime, isJustHype,
    stillMatterIn30Days, canBecomeDurablePackage,
    verdict, verdictExplanation: verdictExplanation[verdict],
    founderNote: compoundsEquity ? "This builds HMG brand equity. Prioritize accordingly."
      : buildsRelationshipMoat ? "This compounds the relationship moat. The money follows trust."
      : "Execute cleanly, then move on. Don't over-invest in a one-time play.",
    moolahPath,
  };
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
  const lower = text.toLowerCase();

  qs.push({ question: "Is this money or noise? Be honest.", category: "founder" });
  qs.push({ question: "Is this worth Founder time or should it become a template?", category: "founder" });

  if (moneyType === "Relationship Play" || hasAny(lower, RELATIONSHIP_SIGNALS)) {
    qs.push({ question: "Is there a warm editorial lane to this person?", category: "relationship" });
    qs.push({ question: "Is this a one-time contact or a recurring revenue relationship?", category: "relationship" });
    qs.push({ question: "The bag is in the relationship — are we leading with editorial trust?", category: "relationship" });
  }

  if (moneyType === "Package Play" || moneyType === "Franchise Content Play" || hasAny(lower, PACKAGE_SIGNALS)) {
    qs.push({ question: "Can this become a weekly or monthly franchise?", category: "package" });
    qs.push({ question: "Is this a one-off post or a repeatable sponsor category?", category: "package" });
    qs.push({ question: "What is the minimum viable package version of this?", category: "package" });
  }

  if (moneyType === "Sponsor Play" || hasAny(lower, SPONSOR_SIGNALS)) {
    qs.push({ question: "Would the sponsor care about the audience or just the topic?", category: "sponsor" });
    qs.push({ question: "Is the sponsor angle a real brand fit or just a keyword match?", category: "sponsor" });
    qs.push({ question: "What category of sponsor lives here naturally?", category: "sponsor" });
  }

  if (moneyType === "Audience Growth Play" || hasAny(lower, AUDIENCE_SIGNALS)) {
    qs.push({ question: "Does this fit HipHopHaven, MusicHaven, or both?", category: "audience" });
    qs.push({ question: "Is there a clean local LA angle here?", category: "audience" });
  }

  if (judgment.timing === "Act Now" || judgment.timing === "Same Day") {
    qs.push({ question: "What's the actual deadline? Is urgency real or manufactured?", category: "timing" });
  } else {
    qs.push({ question: "If we wait 30 days, does this opportunity get better or disappear?", category: "timing" });
  }

  qs.push({ question: "Are we chasing money or chasing noise?", category: "founder" });
  qs.push({ question: "What does Max see here that the Founder might be missing?", category: "founder" });
  qs.push({ question: "What would make this not worth it?", category: "founder" });

  return qs.slice(0, 8);
}

// ──────────────────────────────────────────────────────────────────────────────
// Founder Commands — 18 commands
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
  | "give-me-the-deal-lawyer-read"
  | "protect-my-time"
  | "make-this-mobile-simple"
  | "turn-into-weekly-franchise"
  | "whats-the-cleanest-moolah-path"
  | "what-goes-to-webedit"
  | "what-goes-to-social-factory"
  | "what-should-become-wp-article"
  | "what-should-max-save-for-later";

export function runFounderCommand(
  command: FounderCommand,
  judgment: MaxJudgment,
  seed: string,
): string {
  const moneyType: MoneyType = judgment.moneyType;
  const buffett = runBuffettFilter("", moneyType, 50);
  switch (command) {
    case "is-this-money-or-noise":
      return judgment.decision === "Ignore"
        ? `Noise. ${getMaxIgnorePhrase(seed)} ${judgment.downsideExplanation}`
        : `This is money. Money type: ${judgment.moneyType}. Confidence: ${judgment.confidence}%. ${judgment.why}`;
    case "whats-the-sponsor-angle":
      return judgment.moneyType === "Sponsor Play"
        ? `Strong sponsor play. ${judgment.upsideExplanation} Next move: ${judgment.whatMaxWouldDo}`
        : `Sponsor angle is secondary here. Primary move: ${judgment.moneyType}. Still worth flagging if a brand fits the audience. ${judgment.founderNextMove}`;
    case "what-should-i-ignore":
      return judgment.moneyType === "Ignore"
        ? `All of it. ${judgment.whatMaxWouldNotDo} ${judgment.downsideExplanation}`
        : `Ignore the noise around this — ${judgment.downsideExplanation} Focus on: ${judgment.moneyType}.`;
    case "whats-the-relationship-play":
      return judgment.moneyType === "Relationship Play"
        ? `${getMaxRelationshipFirstPhrase(seed)} ${judgment.founderNextMove}`
        : `Relationship angle exists but isn't the primary move. If there's a warm lane, note it before any money conversation. Primary play: ${judgment.moneyType}.`;
    case "turn-this-into-a-package":
      return `${getMaxPackagePhrase(seed)} ${judgment.whatWouldMakeItBetter} Moolah path: ${buffett.moolahPath.cleanestPackagePath}`;
    case "give-me-the-quick-read":
      return `${judgment.decision}. ${judgment.moneyType}. ${judgment.founderEffort}. Confidence: ${judgment.confidence}%. ${judgment.founderNextMove}`;
    case "what-would-max-do":
      return `${judgment.whatMaxWouldDo} ${judgment.founderNextMove}`;
    case "what-would-max-not-do":
      return judgment.whatMaxWouldNotDo;
    case "give-me-the-buffett-read":
      return `${buffett.verdictExplanation} Moolah path: ${buffett.moolahPath.fastestMonetization} Reason not to chase: ${buffett.moolahPath.reasonNotToChase}`;
    case "give-me-the-deal-lawyer-read":
      return `Business risk review — not legal advice. ${getMaxRiskPhrase(seed)} Decision: ${judgment.whatMaxWouldNotDo} Founder should only touch this if: ${judgment.founderShouldOnlyTouchIf}`;
    case "protect-my-time":
      return `Effort required: ${judgment.founderEffort}. ${judgment.founderShouldOnlyTouchIf} ${judgment.whatMaxWouldNotDo}`;
    case "make-this-mobile-simple":
      return `${judgment.decision} | ${judgment.moneyType} | ${judgment.founderEffort} | Next: ${judgment.founderNextMove}`;
    case "turn-into-weekly-franchise":
      return `${buffett.moolahPath.cleanestPackagePath} ${judgment.whatWouldMakeItBetter}`;
    case "whats-the-cleanest-moolah-path":
      return `Fastest: ${buffett.moolahPath.fastestMonetization} Package path: ${buffett.moolahPath.cleanestPackagePath} Relationship moat: ${buffett.moolahPath.relationshipMoatPath}`;
    case "what-goes-to-webedit":
      return judgment.moneyType === "Offline Money Play" || judgment.moneyType === "Audience Growth Play"
        ? `This has video/clip potential. WebEdit hook: pull the moment, find the hook, turn it into a short clip. The content is the marketing for the bigger play.`
        : `Low WebEdit priority for this one. Primary move is ${judgment.moneyType}. WebEdit if a clip angle emerges from the coverage.`;
    case "what-goes-to-social-factory":
      return judgment.moneyType === "Audience Growth Play" || judgment.moneyType === "Franchise Content Play"
        ? `Strong Social Factory play. Caption the moment, hit the vertical channels, drive the engagement. This is the audience growth move.`
        : `Social Factory as amplification only. Primary play: ${judgment.moneyType}. Social should support the main angle.`;
    case "what-should-become-wp-article":
      return judgment.moneyType === "Authority Play" || judgment.moneyType === "Sponsor Play" || judgment.moneyType === "Franchise Content Play"
        ? `Strong WordPress play. The article is the editorial proof of the sponsor pitch. Publish it. Use it to open the sponsor conversation.`
        : `WordPress article is secondary here. Primary play: ${judgment.moneyType}. If coverage exists, use it as the editorial warm-up.`;
    case "what-should-max-save-for-later":
      return `Timing: ${judgment.timing}. Decision: ${judgment.decision}. ${judgment.whatWouldMakeItBetter} Save it for: ${buffett.moolahPath.cleanestPackagePath}`;
    default:
      return `${judgment.why} Next: ${judgment.founderNextMove}`;
  }
}
