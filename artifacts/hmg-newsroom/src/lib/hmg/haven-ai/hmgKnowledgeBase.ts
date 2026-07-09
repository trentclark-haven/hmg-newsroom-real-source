import {
  brandVoiceProfiles,
  type BrandId,
  type BrandVoiceProfile,
} from "@/lib/hmg/brandVoiceProfiles";

/**
 * HMG brand knowledge base for the Haven AI Engine.
 *
 * Voice rules come from the shared `brandVoiceProfiles` so there is one source
 * of truth for tone. This file adds the commercial context (audience, content
 * categories, CTAs, monetization lanes) Maximillion needs to reason about money.
 */
export interface HmgBrandKnowledge {
  id: BrandId;
  name: string;
  audience: string;
  categories: string[];
  ctas: string[];
  monetization: string[];
  compliance?: string;
  toneLabel: string;
  voiceRules: string[];
}

const COMMERCIAL: Record<
  BrandId,
  Omit<HmgBrandKnowledge, "toneLabel" | "voiceRules">
> = {
  hiphop: {
    id: "hiphop",
    name: "HipHopHaven",
    audience: "Hip-hop fans, culture heads, label and artist teams.",
    categories: [
      "Album & single news",
      "Artist moves & business",
      "Culture & history",
      "Charts & milestones",
      "Industry analysis",
    ],
    ctas: [
      "Read the full breakdown",
      "Follow HipHopHaven",
      "Join the culture newsletter",
    ],
    monetization: [
      "Artist/label sponsored features",
      "Premium culture newsletter",
      "Event coverage packages",
      "YouTube breakdown sponsorships",
    ],
  },
  rap: {
    id: "rap",
    name: "RapHaven",
    audience: "Rap superfans and the lyricism/competition community.",
    categories: [
      "Bars & lyricism",
      "Competition & movement",
      "Release reactions",
      "Rising artists",
      "Rap business",
    ],
    ctas: ["Drop your verdict", "Subscribe to RapHaven", "Catch the next breakdown"],
    monetization: [
      "Sponsored rankings & lists",
      "Paid rising-artist spotlights",
      "Merch drops",
      "Reaction-video sponsors",
    ],
  },
  music: {
    id: "music",
    name: "MusicHaven",
    audience: "Industry pros, serious fans, and music investors.",
    categories: [
      "Industry business",
      "Artistry & craft",
      "Streaming & data",
      "Label & catalog deals",
      "Music & tech",
    ],
    ctas: ["Read the analysis", "Subscribe to MusicHaven", "Get the industry brief"],
    monetization: [
      "B2B industry newsletter",
      "Sponsored deep dives",
      "Data report sponsorships",
      "Conference partnerships",
    ],
  },
  sports: {
    id: "sports",
    name: "SportsHaven",
    audience: "Sports fans, fantasy players, and game-day crowds.",
    categories: [
      "Game results & stakes",
      "Trades & roster moves",
      "Standings & playoffs",
      "Player profiles",
      "Sports business",
    ],
    ctas: ["Read the full recap", "Follow SportsHaven", "Get game-day alerts"],
    monetization: [
      "Sportsbook/affiliate partners (where compliant)",
      "Game-day sponsor reads",
      "Local sports-bar packages",
      "Fantasy tool sponsorships",
    ],
  },
  canna: {
    id: "canna",
    name: "CannaHaven",
    audience: "Adult cannabis consumers, dispensary and brand operators.",
    categories: [
      "Cannabis business",
      "Culture & lifestyle",
      "Product & brand news",
      "Policy & compliance",
      "Events",
    ],
    ctas: ["Read responsibly", "Subscribe to CannaHaven", "See the brand guide"],
    monetization: [
      "Compliant brand features",
      "Dispensary partner packages",
      "Event sponsorships",
      "B2B operator newsletter",
    ],
    compliance:
      "Adults 21+. No medical or legal claims. Keep language compliant and culture/business framed.",
  },
  fit: {
    id: "fit",
    name: "FitHaven",
    audience: "Fitness enthusiasts, gym owners, and wellness brands.",
    categories: [
      "Training & programming",
      "Nutrition (general, non-medical)",
      "Gym & studio business",
      "Wellness products",
      "Community challenges",
    ],
    ctas: ["Start the plan", "Join FitHaven", "Get the weekly challenge"],
    monetization: [
      "Gym/studio partner packages",
      "Compliant supplement/apparel sponsors",
      "Challenge sponsorships",
      "Local wellness partners",
    ],
    compliance:
      "No medical claims. Frame nutrition and training as general guidance, not personalized medical advice.",
  },
  master: {
    id: "master",
    name: "HMG Master",
    audience: "Company stakeholders, partners, and cross-brand sponsors.",
    categories: [
      "Company updates",
      "Cross-brand campaigns",
      "Partnerships",
      "Network milestones",
      "Operator/investor notes",
    ],
    ctas: ["Partner with HMG", "Read the network update", "Request the media kit"],
    monetization: [
      "Network-wide sponsor packages",
      "Cross-brand bundles",
      "Investor/partner relations",
      "Premium operator briefings",
    ],
  },
};

export const hmgBrandKnowledge: Record<BrandId, HmgBrandKnowledge> = (
  Object.keys(COMMERCIAL) as BrandId[]
).reduce(
  (acc, id) => {
    const voice: BrandVoiceProfile = brandVoiceProfiles[id];
    acc[id] = {
      ...COMMERCIAL[id],
      toneLabel: voice.toneLabel,
      voiceRules: voice.voiceRules,
    };
    return acc;
  },
  {} as Record<BrandId, HmgBrandKnowledge>,
);

export function getBrandKnowledge(brand?: BrandId): HmgBrandKnowledge {
  return hmgBrandKnowledge[brand ?? "master"] ?? hmgBrandKnowledge.master;
}

export const HMG_BRAND_ORDER: BrandId[] = [
  "hiphop",
  "rap",
  "music",
  "sports",
  "canna",
  "fit",
  "master",
];
