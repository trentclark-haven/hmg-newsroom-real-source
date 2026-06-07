/**
 * Max Voice Engine — Final Overdrive
 *
 * 12 voice modes. Richer phrase pools. Sharper copy.
 * Max sounds like: Harvard MBA + Black media exec + Buffett patience + Stuart Scott clarity.
 * Max does NOT sound like: generic startup bro, fake guru, corny hype, consultant fluff.
 * Deterministic — no model calls.
 * Truth label: Local Max Intelligence
 */

export type VoiceMode =
  | "executive-calm"
  | "black-money-brain"
  | "sports-desk"
  | "founder-reality"
  | "deal-lawyer"
  | "buffett-patience"
  | "street-smart-media"
  | "quick-mobile"
  | "relationship-money"
  | "brand-safety"
  | "package-builder"
  | "ignore-noise";

// ──────────────────────────────────────────────────────────────────────────────
// Deterministic seed hash
// ──────────────────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return arr[Math.abs(h) % arr.length];
}

// ──────────────────────────────────────────────────────────────────────────────
// Opener lines — mode-native
// ──────────────────────────────────────────────────────────────────────────────

const OPENERS: Record<VoiceMode, string[]> = {
  "executive-calm": [
    "Here's the clean read.",
    "One thing stands out here.",
    "The situation is straightforward.",
    "Let's be precise.",
    "This is the honest take.",
  ],
  "black-money-brain": [
    "The money move is clear.",
    "The bag is in the relationship.",
    "Don't sell the clip. Sell the audience moment.",
    "That's not money, that's motion.",
    "The real opportunity is under the surface.",
  ],
  "sports-desk": [
    "Film room says…",
    "This is a scouting report moment.",
    "Let's run the play.",
    "Quick read from the press box.",
    "Here's what the tape shows.",
  ],
  "founder-reality": [
    "Founder time is finite. Here's the honest read.",
    "Don't repeat work. Here's the leverage point.",
    "Mobile-first. Here's the two-sentence version.",
    "No noise. Here's the real decision.",
    "This is what actually matters.",
  ],
  "deal-lawyer": [
    "Before you move, check the downside.",
    "The risk surface here is worth noting.",
    "Clean deal structure requires a second look.",
    "Rights and ownership first. Revenue second.",
    "Reputation risk is the real cost here.",
  ],
  "buffett-patience": [
    "Would you still want this in five years?",
    "Simple business, durable audience, repeatable package.",
    "The compound play here is the relationship.",
    "Low-drama money beats high-drama revenue.",
    "Avoid the hype cycle. The brand is the moat.",
  ],
  "street-smart-media": [
    "This is a relationship play, not a content play.",
    "The audience knows when the bag is showing.",
    "Organic beats forced. The money follows trust.",
    "Edit the ego out. The sponsor follows the audience.",
    "Black media money runs on credibility first.",
  ],
  "quick-mobile": [
    "Short answer:",
    "Here's the move:",
    "Quick read:",
    "Bottom line:",
    "One line:",
  ],
  "relationship-money": [
    "The bag is in the relationship, not the post.",
    "Don't chase money. Chase the warm lane.",
    "Relationships compound. Posts don't.",
    "This is a people play, not a content play.",
    "The revenue follows the trust.",
  ],
  "brand-safety": [
    "The brand is the long-term asset.",
    "Protect the credibility. The money follows.",
    "Short-term bag, long-term risk. Think carefully.",
    "Brand safety is editorial self-defense.",
    "If the HMG name is on it, it has to be clean.",
  ],
  "package-builder": [
    "Package this before you pitch it.",
    "One-offs don't compound. Build the wrapper first.",
    "The money is in the repeatable structure.",
    "What's the monthly version of this?",
    "Don't sell the article. Sell the franchise.",
  ],
  "ignore-noise": [
    "Ignore the noise here.",
    "That's not money, that's motion.",
    "Don't spend Founder time on this.",
    "Hard pass. Move on.",
    "Nothing here for HMG.",
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// Phrase pools by category
// ──────────────────────────────────────────────────────────────────────────────

const CHASE_PHRASES: string[] = [
  "This is worth chasing. Move on it this week.",
  "Clear upside. Low Founder risk. Chase it.",
  "The bag is accessible. Chase with a plan.",
  "Editorial credibility plus sponsor fit. Chase.",
  "High upside, decent effort. This is a chase.",
  "Low effort, decent upside. Get on it.",
  "The lane is open. Take it.",
  "This one is a go. Execute cleanly.",
];

const WATCH_PHRASES: string[] = [
  "Not today, but keep it in the frame.",
  "Watch it. The angle gets better with more info.",
  "Low urgency, high potential. Watch and wait.",
  "Save it for the right package moment.",
  "The relationship isn't warm enough yet. Watch.",
  "This one needs patience, not pressure.",
  "Good signal. Wrong timing. Watch.",
  "Not a pass — just not yet. Keep it warm.",
];

const PACKAGE_PHRASES: string[] = [
  "Package this before you pitch it.",
  "Strong package play. Build the wrapper first.",
  "This becomes money when it's repeatable.",
  "The pitch is cleaner when it's a package, not a one-off.",
  "Don't sell the article. Sell the franchise.",
  "What's the monthly version of this? Build that.",
  "Package it. Then the sponsor conversation changes.",
  "One-offs leave money on the table. Build the structure.",
];

const RELATIONSHIP_FIRST_PHRASES: string[] = [
  "The bag is in the relationship, not the post.",
  "Build the lane first. Revenue conversation comes second.",
  "Don't chase the headline if the relationship is the asset.",
  "Editorial warmth opens the revenue door here.",
  "Do not pitch money first. Build the relationship first.",
  "This is a people play, not a content play.",
  "Relationships compound. Posts don't.",
  "The warm lane is worth more than the one-time deal.",
];

const IGNORE_PHRASES: string[] = [
  "Ignore the noise here.",
  "That's not money, that's motion.",
  "Don't spend Founder time on this.",
  "Nothing here for HMG. Move on.",
  "Hard pass.",
  "Low upside. High distraction.",
  "This is a trap game. Don't bite.",
  "Save the Founder's time for something real.",
  "Pass. The opportunity cost is too high.",
];

const SPONSOR_ANGLE_PHRASES: string[] = [
  "The clean sponsor angle is the audience moment, not just the topic.",
  "A sponsor buys the audience trust, not the article.",
  "The editorial credibility makes the sponsor pitch cleaner.",
  "The audience is the product. The content is the proof.",
  "Frame it as audience access, not advertising space.",
  "Sponsor entry point: branded placement next to editorial credibility.",
  "This is the kind of content a music-tech brand would want to sit next to.",
  "The sponsor angle only works if the content is clean.",
];

const RISK_WARNING_PHRASES: string[] = [
  "Do not chase this unless reputation risk is managed.",
  "Brand safety question lives here. Founder review first.",
  "High upside, but the optics need a second look.",
  "Risk is manageable with the right framing.",
  "This is a trap game. Move carefully.",
  "The downside here is real. Don't skip the review.",
  "Protect the HMG name first. Revenue second.",
  "If the name is on it, it has to be clean.",
];

const PACKAGE_PITCH_PHRASES: string[] = [
  "We cover the audience you want. Here's the package.",
  "Editorial trust plus audience access. Here's the structure.",
  "This is a repeatable franchise, not a one-time placement.",
  "We built the audience. Here's how a sponsor fits.",
  "The content is already landing. Here's the branded version.",
  "Monthly package: content + social + brand integration.",
  "This becomes a sponsored editorial franchise.",
  "Repeatable structure. Transparent audience. Clean deal.",
];

const MOBILE_SHORT_PHRASES: string[] = [
  "Chase it.",
  "Watch it.",
  "Package first.",
  "Relationship play.",
  "Ignore.",
  "Founder review.",
  "Move this week.",
  "Not yet.",
  "Low effort, decent upside.",
  "High upside — Founder review first.",
];

const NOT_WORTH_CHASING_PHRASES: string[] = [
  "Not worth the Founder's time.",
  "The opportunity cost is too high.",
  "Nothing here compounds HMG equity.",
  "Pass. Save the bandwidth.",
  "That's motion, not money.",
  "The effort doesn't clear the bar here.",
  "Not a real play. Move on.",
  "Ignore the noise here.",
];

const LOW_EFFORT_DECENT_UPSIDE_PHRASES: string[] = [
  "Low effort, decent upside. Get on it.",
  "5-minute move with real upside. Take it.",
  "Easy win. Don't overthink it.",
  "Clean, quick, and useful. Execute.",
  "The effort is minimal. The upside is real.",
  "This is a layup. Don't miss it.",
  "Flag it, move it, done.",
  "Low friction, decent return. Worth the 5 minutes.",
];

const HIGH_UPSIDE_REVIEW_PHRASES: string[] = [
  "High upside — Founder review first.",
  "Strong signal. Don't move without Founder sign-off.",
  "The bag is real, but this needs a second set of eyes.",
  "Worth it. But get the Founder on this before you move.",
  "High upside. Don't rush it without a clean plan.",
  "This is a franchise move. Treat it accordingly.",
  "Strong play. Founder decision required before action.",
  "Big upside. Founder review is not optional here.",
];

const FOUNDER_NEXT_MOVE_PHRASES: Record<string, string[]> = {
  chase: [
    "Flag it, block 30 minutes, and get it into Output History.",
    "Move this week. Don't let it sit.",
    "Brief it, route it, execute.",
    "Get the draft to Output History and set a follow-up.",
    "One move now: write the brief. Then set the follow-up.",
  ],
  watch: [
    "Set a reminder. Don't invest Founder time yet.",
    "Log it. Check back in 7 days.",
    "Keep it in the frame. No action yet.",
    "Watch and wait. The signal gets clearer with time.",
    "Note the opportunity. Don't commit yet.",
  ],
  package: [
    "Block a 30-minute session. Build the package first, then the pitch.",
    "Write the one-page package structure. That's the next move.",
    "Turn the concept into a repeatable brief before going to market.",
    "The package is the pitch. Build it first.",
    "Package brief → Output History → sponsor conversation.",
  ],
  relationship: [
    "Log the contact. Note the warm lane. One outreach this week.",
    "Build the lane before the money conversation.",
    "Editorial warmth first. The revenue follows.",
    "Send the article link. That's the relationship move.",
    "Connect the editorial touch-point. Revenue comes second.",
  ],
  ignore: [
    "Don't revisit unless the situation changes significantly.",
    "Remove it from the Founder's mental queue.",
    "Pass and move on. This is not the play.",
    "Not worth logging again. Ignore and move.",
    "Hard pass. No further action needed.",
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// Sports reads — 18 categories
// ──────────────────────────────────────────────────────────────────────────────

export interface SportsRead {
  category: string;
  analogy: string;
  meaning: string;
  moneyLesson: string;
  founderAction: string;
  whatToAvoid: string;
}

const SPORTS_READS: SportsRead[] = [
  {
    category: "NBA",
    analogy: "Layup",
    meaning: "Clean, high-percentage move with minimal resistance.",
    moneyLesson: "Take the high-percentage play. Not every deal needs to be a logo three.",
    founderAction: "Execute now. Don't overthink a layup.",
    whatToAvoid: "Don't pass up the easy money while hunting the harder bag.",
  },
  {
    category: "NBA",
    analogy: "Fast break",
    meaning: "Time-sensitive opportunity. Speed is the advantage.",
    moneyLesson: "The window closes fast. Speed beats strategy here.",
    founderAction: "Move this week. The break window doesn't stay open.",
    whatToAvoid: "Don't slow the break down with unnecessary deliberation.",
  },
  {
    category: "NBA",
    analogy: "Franchise player",
    meaning: "This relationship or package could anchor the whole program.",
    moneyLesson: "Franchise moves require franchise-level investment and protection.",
    founderAction: "Invest seriously. This is not a role-player conversation.",
    whatToAvoid: "Don't underprice franchise-level access.",
  },
  {
    category: "NBA",
    analogy: "Role player",
    meaning: "Useful, not central. Good supplement to the core.",
    moneyLesson: "Role players have a place. Don't over-invest.",
    founderAction: "Plug it in. Set expectations. Move on.",
    whatToAvoid: "Don't build the strategy around a role player.",
  },
  {
    category: "NFL",
    analogy: "Red zone",
    meaning: "Close to scoring. Execution matters more than strategy now.",
    moneyLesson: "The hard work is done. Finish clean.",
    founderAction: "Don't fumble the finish. Execute the close.",
    whatToAvoid: "Don't introduce new complexity in the red zone.",
  },
  {
    category: "NFL",
    analogy: "Trap game",
    meaning: "Looks easy but has hidden risk and distraction potential.",
    moneyLesson: "Easy-looking plays hide expensive mistakes.",
    founderAction: "Read the fine print. Move carefully.",
    whatToAvoid: "Don't assume this is low-risk because it looks obvious.",
  },
  {
    category: "NFL",
    analogy: "Punt",
    meaning: "Give this one up. Protect field position for a better play.",
    moneyLesson: "Sometimes the smartest move is the one you don't make.",
    founderAction: "Pass. Protect Founder time for better plays.",
    whatToAvoid: "Don't force a play that isn't there.",
  },
  {
    category: "NFL",
    analogy: "Full-court press",
    meaning: "Aggressive, sustained effort that drains resources fast.",
    moneyLesson: "Aggression requires fuel. Make sure you have the team.",
    founderAction: "Only if you have the bandwidth and team support.",
    whatToAvoid: "Don't press without the depth to sustain it.",
  },
  {
    category: "MLB",
    analogy: "Bunt",
    meaning: "Low-upside move that advances the runner. Practical.",
    moneyLesson: "Small wins compound. Bunts win games over time.",
    founderAction: "Take it. Small moves stack up.",
    whatToAvoid: "Don't call it a win that it isn't — it's a setup play.",
  },
  {
    category: "MLB",
    analogy: "Home run swing",
    meaning: "High-upside, high-risk move with a real miss rate.",
    moneyLesson: "Know your miss rate before you swing for the fence.",
    founderAction: "Only if you can afford a miss and have the team to absorb it.",
    whatToAvoid: "Don't swing big on a pitch you can't reach.",
  },
  {
    category: "Boxing",
    analogy: "Jab to set up the right",
    meaning: "The initial move creates the conditions for the real play.",
    moneyLesson: "Editorial warmth is the jab. Sponsor pitch is the right.",
    founderAction: "Lead with the content. Follow with the money conversation.",
    whatToAvoid: "Don't throw the right hand before you've set it up.",
  },
  {
    category: "Boxing",
    analogy: "Don't lead with your chin",
    meaning: "Don't expose yourself to unnecessary risk at the opening.",
    moneyLesson: "Brand safety first. Protect before you engage.",
    founderAction: "Check the downside before making any move.",
    whatToAvoid: "Don't commit resources before the risk is managed.",
  },
  {
    category: "Scouting",
    analogy: "Scouting report",
    meaning: "Gather information before committing.",
    moneyLesson: "More intel before the commitment. Don't sign without the tape.",
    founderAction: "Watch first. More information sharpens the decision.",
    whatToAvoid: "Don't commit before the scouting is done.",
  },
  {
    category: "Film Room",
    analogy: "Film room",
    meaning: "Study this opportunity before acting. The tape tells the story.",
    moneyLesson: "The preparation is the advantage.",
    founderAction: "Review before committing. The details are in the film.",
    whatToAvoid: "Don't skip the homework because the opportunity looks obvious.",
  },
  {
    category: "College Recruiting",
    analogy: "Recruiting visit",
    meaning: "Build the relationship before asking for the commitment.",
    moneyLesson: "Sponsors are recruited, not cold-pitched. Warm the relationship first.",
    founderAction: "Lead with editorial value. Ask for the deal after.",
    whatToAvoid: "Don't pitch the deal before they know the program.",
  },
  {
    category: "Front Office / GM",
    analogy: "GM move",
    meaning: "Strategic, high-impact decision that shapes the roster.",
    moneyLesson: "Long-term decisions require long-term thinking.",
    founderAction: "Think past the immediate bag. What does this do to the program?",
    whatToAvoid: "Don't make GM decisions under short-term pressure.",
  },
  {
    category: "Dynasty",
    analogy: "Dynasty build",
    meaning: "This is a long play that compounds over time.",
    moneyLesson: "Dynasty plays require patience. The payoff is compounding equity.",
    founderAction: "Invest in this for the long game. Not the quick bag.",
    whatToAvoid: "Don't expect quick revenue from a dynasty-building move.",
  },
  {
    category: "Rebuild",
    analogy: "Rebuild year",
    meaning: "This is a foundational play. Short-term pain for long-term position.",
    moneyLesson: "Rebuilds are investments, not losses.",
    founderAction: "Think of this as equity building. The bag comes later.",
    whatToAvoid: "Don't measure this against short-term revenue metrics.",
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Public phrase helpers
// ──────────────────────────────────────────────────────────────────────────────

export function getMaxOpener(mode: VoiceMode, seed: string): string {
  return pick(OPENERS[mode], seed);
}

export function getMaxChasePhrase(seed: string): string { return pick(CHASE_PHRASES, seed); }
export function getMaxWatchPhrase(seed: string): string { return pick(WATCH_PHRASES, seed); }
export function getMaxPackagePhrase(seed: string): string { return pick(PACKAGE_PHRASES, seed); }
export function getMaxRelationshipFirstPhrase(seed: string): string { return pick(RELATIONSHIP_FIRST_PHRASES, seed); }
export function getMaxIgnorePhrase(seed: string): string { return pick(IGNORE_PHRASES, seed); }
export function getMaxSponsorAnglePhrase(seed: string): string { return pick(SPONSOR_ANGLE_PHRASES, seed); }
export function getMaxRiskPhrase(seed: string): string { return pick(RISK_WARNING_PHRASES, seed); }
export function getMaxPackagePitchPhrase(seed: string): string { return pick(PACKAGE_PITCH_PHRASES, seed); }
export function getMaxMobilePhrase(seed: string): string { return pick(MOBILE_SHORT_PHRASES, seed); }
export function getMaxNotWorthChasingPhrase(seed: string): string { return pick(NOT_WORTH_CHASING_PHRASES, seed); }
export function getMaxLowEffortUpsidePhrase(seed: string): string { return pick(LOW_EFFORT_DECENT_UPSIDE_PHRASES, seed); }
export function getMaxHighUpsideReviewPhrase(seed: string): string { return pick(HIGH_UPSIDE_REVIEW_PHRASES, seed); }

// Keep backward compat alias
export function getMaxRelationshipPhrase(seed: string): string { return getMaxRelationshipFirstPhrase(seed); }

export function getMaxFounderNextMove(
  decision: "chase" | "watch" | "package" | "relationship" | "ignore",
  seed: string,
): string {
  return pick(FOUNDER_NEXT_MOVE_PHRASES[decision] ?? FOUNDER_NEXT_MOVE_PHRASES.ignore, seed);
}

// ──────────────────────────────────────────────────────────────────────────────
// Verdict helper
// ──────────────────────────────────────────────────────────────────────────────

export function getMaxVerdict(
  decision: "Chase" | "Watch" | "Package" | "Relationship First" | "Delegate" | "Save for Later" | "Ignore",
  seed: string,
): string {
  const map: Record<string, () => string> = {
    Chase: () => getMaxChasePhrase(seed),
    Watch: () => getMaxWatchPhrase(seed),
    Package: () => getMaxPackagePhrase(seed),
    "Relationship First": () => getMaxRelationshipFirstPhrase(seed),
    Delegate: () => `This needs a delegate. Founder time is better spent elsewhere.`,
    "Save for Later": () => getMaxWatchPhrase(seed) + " Save for the right package moment.",
    Ignore: () => getMaxIgnorePhrase(seed),
  };
  return (map[decision] ?? map.Ignore)();
}

// ──────────────────────────────────────────────────────────────────────────────
// Sports read selector
// ──────────────────────────────────────────────────────────────────────────────

export function getMaxSportsRead(
  decision: "Chase" | "Watch" | "Package" | "Relationship First" | "Delegate" | "Save for Later" | "Ignore",
  effortLevel: string,
  seed: string,
): SportsRead | null {
  // Probabilistic: 1-in-3 to keep it sharp and not forced
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  if (Math.abs(h) % 3 === 0) return null;

  const map: Record<string, SportsRead[]> = {
    Chase: [SPORTS_READS[0], SPORTS_READS[1], SPORTS_READS[2], SPORTS_READS[10]],
    Watch: [SPORTS_READS[12], SPORTS_READS[13], SPORTS_READS[3]],
    Package: [SPORTS_READS[8], SPORTS_READS[3], SPORTS_READS[15]],
    "Relationship First": [SPORTS_READS[14], SPORTS_READS[11], SPORTS_READS[16]],
    Delegate: [SPORTS_READS[3], SPORTS_READS[6]],
    "Save for Later": [SPORTS_READS[17], SPORTS_READS[12]],
    Ignore: [SPORTS_READS[6], SPORTS_READS[5], SPORTS_READS[7]],
  };
  const candidates = map[decision] ?? map.Ignore;
  return pick(candidates, seed);
}

// ──────────────────────────────────────────────────────────────────────────────
// Format a complete Max line
// ──────────────────────────────────────────────────────────────────────────────

export function formatMaxLine(mode: VoiceMode, body: string, seed: string): string {
  return `${getMaxOpener(mode, seed)} ${body}`;
}
