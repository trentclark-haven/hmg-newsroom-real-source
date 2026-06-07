/**
 * Max Voice Engine
 *
 * Max's voice modes and copy helpers.
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
  | "quick-mobile";

export interface MaxVoiceLine {
  mode: VoiceMode;
  line: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Core vocabulary by voice mode
// ──────────────────────────────────────────────────────────────────────────────

const VOICE_OPENERS: Record<VoiceMode, string[]> = {
  "executive-calm": [
    "This is worth a look.",
    "Here is the clean read.",
    "One thing stands out.",
    "The situation is straightforward.",
    "Let's be precise about this.",
  ],
  "black-money-brain": [
    "The money move is clear.",
    "The bag is in the relationship.",
    "Don't sell the clip. Sell the audience moment.",
    "That's not money, that's motion.",
    "The real opportunity is under the surface.",
  ],
  "sports-desk": [
    "This is a layup if executed cleanly.",
    "This is a scouting report moment.",
    "Film room says: this is worth studying.",
    "This is a bunt, not a home run — but bunts win games too.",
    "Think fast break. Don't overthink it.",
  ],
  "founder-reality": [
    "Founder time is finite. Here's the honest read.",
    "Don't repeat work. Here's the leverage point.",
    "Mobile-first. Here's the two-sentence version.",
    "This is what actually matters here.",
    "No noise. Here's the real decision.",
  ],
  "deal-lawyer": [
    "Before you move, check the downside.",
    "The risk surface here is narrow but real.",
    "Clean deal structure: here's what to protect.",
    "Reputation risk is the cost of bad optics.",
    "Rights and ownership first. Revenue second.",
  ],
  "buffett-patience": [
    "Would you still want this in five years?",
    "Simple business, durable audience, repeatable package.",
    "The compound play here is the relationship.",
    "Low-drama money beats high-drama revenue every time.",
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
    "Chase this.",
    "Watch it.",
    "Package it.",
    "Ignore this.",
    "Founder review first.",
  ],
};

const CHASE_PHRASES: string[] = [
  "This is worth chasing. Move on it this week.",
  "Clear upside. Low founder risk. Chase it.",
  "The bag is accessible. Chase with a plan.",
  "Editorial credibility + sponsor fit. Chase.",
  "High upside, decent effort. This is a chase.",
];

const WATCH_PHRASES: string[] = [
  "Not today, but keep it in the frame.",
  "Watch it. The angle gets better with more info.",
  "Low urgency. High potential. Watch and wait.",
  "Save it for the right package moment.",
  "The relationship isn't warm enough yet. Watch.",
];

const PACKAGE_PHRASES: string[] = [
  "Turn this into a package before pitching.",
  "Strong package play. Build the wrapper first.",
  "This becomes money when it's repeatable.",
  "Package it. Then the sponsor conversation is cleaner.",
  "The pitch is in the package, not the one-off.",
];

const IGNORE_PHRASES: string[] = [
  "Ignore the noise here.",
  "Not money. Don't spend Founder time on this.",
  "That's motion, not money. Move on.",
  "Low upside. High distraction. Hard pass.",
  "Nothing here for HMG. Ignore.",
];

const RISK_PHRASES: string[] = [
  "Do not chase this unless reputation risk is managed.",
  "Brand safety question lives here. Founder review first.",
  "High upside, but the optics need a second look.",
  "Risk is manageable with the right framing.",
  "This is a trap game. Move carefully.",
];

const RELATIONSHIP_PHRASES: string[] = [
  "The bag is in the relationship, not the post.",
  "This is a relationship play. Build the lane first.",
  "Editorial warmth opens the revenue door here.",
  "Do not pitch money first. Build the relationship first.",
  "The follow-up matters more than the content here.",
];

// ──────────────────────────────────────────────────────────────────────────────
// Sports analogy map
// ──────────────────────────────────────────────────────────────────────────────

export interface SportsRead {
  analogy: string;
  meaning: string;
  founderAction: string;
}

const SPORTS_READS: SportsRead[] = [
  {
    analogy: "Layup",
    meaning: "Clean, high-percentage move with minimal resistance.",
    founderAction: "Execute now. Don't overthink a layup.",
  },
  {
    analogy: "Fast break",
    meaning: "Time-sensitive opportunity. Speed is the advantage.",
    founderAction: "Move this week. The window closes fast.",
  },
  {
    analogy: "Bunt",
    meaning: "Low-upside but moves the runner. Practical, not glamorous.",
    founderAction: "Take it. Bunts win games over time.",
  },
  {
    analogy: "Red zone",
    meaning: "Close to scoring. Execution matters more than strategy now.",
    founderAction: "Don't fumble the finish. Execute cleanly.",
  },
  {
    analogy: "Scouting report",
    meaning: "Gather information before committing.",
    founderAction: "More info needed. Watch before you chase.",
  },
  {
    analogy: "Film room",
    meaning: "Study this opportunity before acting.",
    founderAction: "Sit on it. Review the full situation first.",
  },
  {
    analogy: "Franchise player",
    meaning: "This relationship or package could anchor the whole program.",
    founderAction: "Invest in this seriously. It's a franchise move.",
  },
  {
    analogy: "Role player",
    meaning: "Useful, not central. Good supplement.",
    founderAction: "Plug it in. Don't over-invest.",
  },
  {
    analogy: "Punt",
    meaning: "Give this one up. Protect field position.",
    founderAction: "Ignore. Save Founder time for better plays.",
  },
  {
    analogy: "Trap game",
    meaning: "Looks easy but has hidden risk.",
    founderAction: "Move carefully. Read the fine print.",
  },
  {
    analogy: "Home run swing",
    meaning: "High-upside, high-risk move.",
    founderAction: "Only swing if you can afford a miss.",
  },
  {
    analogy: "Full-court press",
    meaning: "Aggressive move that requires sustained energy.",
    founderAction: "Only if you have the team or time for it.",
  },
];

function pick<T>(arr: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return arr[Math.abs(hash) % arr.length];
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

export function getMaxOpener(mode: VoiceMode, seed: string): string {
  return pick(VOICE_OPENERS[mode], seed);
}

export function getMaxChasePhrase(seed: string): string {
  return pick(CHASE_PHRASES, seed);
}

export function getMaxWatchPhrase(seed: string): string {
  return pick(WATCH_PHRASES, seed);
}

export function getMaxPackagePhrase(seed: string): string {
  return pick(PACKAGE_PHRASES, seed);
}

export function getMaxIgnorePhrase(seed: string): string {
  return pick(IGNORE_PHRASES, seed);
}

export function getMaxRiskPhrase(seed: string): string {
  return pick(RISK_PHRASES, seed);
}

export function getMaxRelationshipPhrase(seed: string): string {
  return pick(RELATIONSHIP_PHRASES, seed);
}

/** Returns a sports analogy that fits a given opportunity signal, or null if not applicable. */
export function getMaxSportsRead(
  decision: "Chase" | "Watch" | "Package" | "Delegate" | "Ignore",
  effortLevel: string,
  seed: string,
): SportsRead | null {
  // Only apply sports reads where they genuinely clarify — not to every item
  const roll = Math.abs(seed.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 0) | 0) % 3;
  if (roll === 0) return null; // 1-in-3 chance — keeps it from being forced

  const candidates: SportsRead[] = {
    Chase: [SPORTS_READS[0], SPORTS_READS[1], SPORTS_READS[6]], // layup, fast break, franchise
    Watch: [SPORTS_READS[4], SPORTS_READS[5], SPORTS_READS[7]], // scouting, film room, role player
    Package: [SPORTS_READS[2], SPORTS_READS[7]], // bunt, role player
    Delegate: [SPORTS_READS[7], SPORTS_READS[8]], // role player, punt
    Ignore: [SPORTS_READS[8], SPORTS_READS[9]], // punt, trap game
  }[decision];

  return pick(candidates, seed);
}

/** One-line Max verdict in the right voice. */
export function getMaxVerdict(
  decision: "Chase" | "Watch" | "Package" | "Delegate" | "Ignore",
  seed: string,
): string {
  const map: Record<string, () => string> = {
    Chase: () => getMaxChasePhrase(seed),
    Watch: () => getMaxWatchPhrase(seed),
    Package: () => getMaxPackagePhrase(seed),
    Delegate: () => `This needs a delegate. Founder time is better spent elsewhere.`,
    Ignore: () => getMaxIgnorePhrase(seed),
  };
  return (map[decision] ?? map.Ignore)();
}

/** Format a complete Max voice line for a given mode. */
export function formatMaxLine(mode: VoiceMode, body: string, seed: string): string {
  return `${getMaxOpener(mode, seed)} ${body}`;
}
