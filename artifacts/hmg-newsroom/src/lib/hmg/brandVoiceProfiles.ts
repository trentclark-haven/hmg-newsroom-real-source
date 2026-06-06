export type BrandId =
  | "hiphop"
  | "rap"
  | "music"
  | "sports"
  | "canna"
  | "fit"
  | "master";

export interface BrandVoiceProfile {
  id: BrandId;
  name: string;
  voiceRules: string[];
  toneLabel: string;
}

export const brandVoiceProfiles: Record<BrandId, BrandVoiceProfile> = {
  hiphop: {
    id: "hiphop",
    name: "HipHopHaven",
    voiceRules: [
      "Culturally sharp and authoritative.",
      "Hip-hop fluent without forced or corny slang.",
      "Focus on serious music-news context.",
      "Strictly no gossip.",
    ],
    toneLabel: "Sharp Culture",
  },
  rap: {
    id: "rap",
    name: "RapHaven",
    voiceRules: [
      "Sharper, rap-specific focus.",
      "Analyze bars, releases, competition, and movement.",
      "More direct and punchy than HipHopHaven.",
      "No generic music-blog tone.",
    ],
    toneLabel: "Direct & Punchy",
  },
  music: {
    id: "music",
    name: "MusicHaven",
    voiceRules: [
      "Premium, sophisticated analysis of the broader music industry.",
      "Thoughtful cultural analysis regarding artistry and business.",
      "Elegant but not boring.",
    ],
    toneLabel: "Premium Industry",
  },
  sports: {
    id: "sports",
    name: "SportsHaven",
    voiceRules: [
      "Crisp sports desk energy.",
      "Focus on player/team/stakes context including trades, standings, and playoff implications when relevant.",
      "Embody the energy of Archiving Athletic Greatness In Real Time.",
    ],
    toneLabel: "Crisp Sports Desk",
  },
  canna: {
    id: "canna",
    name: "CannaHaven",
    voiceRules: [
      "Adult, compliant, and culture/business aware.",
      "No sloppy medical or legal claims.",
      "Premium cannabis editorial tone.",
    ],
    toneLabel: "Premium Cannabis",
  },
  fit: {
    id: "fit",
    name: "FitHaven",
    voiceRules: [
      "Practical, strong, and useful.",
      "Fitness/wellness authority.",
      "No medical overclaims.",
      "Always deliver a clear training takeaway.",
    ],
    toneLabel: "Practical Authority",
  },
  master: {
    id: "master",
    name: "HMG Master",
    voiceRules: [
      "Executive media operator tone.",
      "Focus on business strategy and clean media-industry framing.",
      "Founder-level clarity, direct and confident.",
    ],
    toneLabel: "Executive Clarity",
  },
};

export function getBrandVoiceProfile(id: string): BrandVoiceProfile {
  const lower = id.toLowerCase();
  const normalized = (lower.includes("hiphop") ? "hiphop"
    : lower.includes("rap") ? "rap"
    : lower.includes("sports") ? "sports"
    : lower.includes("canna") ? "canna"
    : lower.includes("fit") ? "fit"
    : lower.includes("music") ? "music"
    : "master") as BrandId;

  return brandVoiceProfiles[normalized] || brandVoiceProfiles.master;
}
