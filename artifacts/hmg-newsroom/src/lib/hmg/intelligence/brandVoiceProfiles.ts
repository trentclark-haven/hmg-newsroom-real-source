import type { BrandVoiceProfile, IntelligenceBrandId } from "./types";

export const intelligenceBrandProfiles: Record<IntelligenceBrandId, BrandVoiceProfile> = {
  hiphop: {
    id: "hiphop",
    name: "HipHopHaven",
    voiceDescription: "Culturally sharp, authoritative, and embedded in hip-hop without forced slang.",
    headlineStyle: "Factual, culture-aware, and built around impact.",
    articleTone: "Analytical, respectful, and direct.",
    allowedAngles: ["Business moves", "Cultural impact", "Release strategy", "Historical context"],
    bannedAngles: ["Gossip", "Unverified conflict", "Personal-life speculation"],
    seoTendencies: "Exact artist names, project titles, producers, labels, and subgenres.",
    socialCaptionStyle: "Direct hooks that invite debate without turning thin claims into bait.",
    visualStyleNotes: "Dark editorial contrast, sharp portraits, bold type, and clean blue accents.",
    articleStructurePreferences: ["Strong lede", "Context", "Why it matters", "What to watch"],
    neverSoundLike: ["A generic culture blog", "A tabloid", "Someone forcing slang"],
  },
  rap: {
    id: "rap",
    name: "RapHaven",
    voiceDescription: "Sharper rap desk focused on bars, releases, movement, and competitive stakes.",
    headlineStyle: "Punchy, active, and specific.",
    articleTone: "Direct, craft-aware, and energetic.",
    allowedAngles: ["Track breakdowns", "Chart battles", "Producer highlights", "Scene movement"],
    bannedAngles: ["Lifestyle fluff", "Irrelevant celebrity chatter", "Gossip"],
    seoTendencies: "Track names, producer credits, regions, and rap subgenres.",
    socialCaptionStyle: "Short, sharp hooks with a clear take.",
    visualStyleNotes: "High-energy composition, red accents, performance stills, and motion.",
    articleStructurePreferences: ["Hook", "The breakdown", "The stakes", "The verdict"],
    neverSoundLike: ["An academic paper", "A soft pop review"],
  },
  music: {
    id: "music",
    name: "MusicHaven",
    voiceDescription: "Premium music-industry and artistry analysis with elegant clarity.",
    headlineStyle: "Sophisticated, industry-aware, and intriguing.",
    articleTone: "Thoughtful, polished, and useful.",
    allowedAngles: ["Industry trends", "Cross-genre analysis", "Executive moves", "Artistic evolution"],
    bannedAngles: ["Low-context conflict", "Unverified numbers", "Tabloid framing"],
    seoTendencies: "Genre intersections, artist names, album titles, industry terms.",
    socialCaptionStyle: "Polished takeaway first, then a concise reason to read.",
    visualStyleNotes: "Gold accents, clean editorial photography, strong negative space.",
    articleStructurePreferences: ["Executive summary", "The shift", "Market impact", "Why it matters"],
    neverSoundLike: ["A dry financial memo", "A fan account"],
  },
  sports: {
    id: "sports",
    name: "SportsHaven",
    voiceDescription: "Crisp sports desk voice focused on stakes, performance, team context, and legacy.",
    headlineStyle: "Action-oriented, stakes-driven, and clear.",
    articleTone: "Urgent, factual, and analytical.",
    allowedAngles: ["Game impact", "Roster strategy", "Playoff stakes", "Historical comparison"],
    bannedAngles: ["Off-field gossip", "Unverified rumors", "Personal attacks"],
    seoTendencies: "Player names, team names, matchup, league, and stakes.",
    socialCaptionStyle: "Stats or stakes first, then one clean prompt for reaction.",
    visualStyleNotes: "Action shots, orange accents, clear subject motion, scoreboard energy.",
    articleStructurePreferences: ["The news", "The stakes", "What changed", "Next steps"],
    neverSoundLike: ["A biased fan rant", "A gossip column"],
  },
  canna: {
    id: "canna",
    name: "CannaHaven",
    voiceDescription: "Adult, compliant cannabis culture and business coverage with premium restraint.",
    headlineStyle: "Professional, clear, and forward-looking.",
    articleTone: "Educated, compliant, and grounded.",
    allowedAngles: ["Business trends", "Legal context", "Culture shifts", "Product innovation with clear limits"],
    bannedAngles: ["Medical advice", "Legal advice", "Illegal-market glamor", "Stereotypes"],
    seoTendencies: "Market regions, business terms, policy terms, and compliant product language.",
    socialCaptionStyle: "Informative and community-aware with no medical or legal promises.",
    visualStyleNotes: "Green accents, premium macro detail, clean light, and mature typography.",
    articleStructurePreferences: ["The update", "Market context", "Culture impact", "What to watch"],
    neverSoundLike: ["A stereotype", "A medical claim sheet"],
  },
  fit: {
    id: "fit",
    name: "FitHaven",
    voiceDescription: "Practical fitness authority with strong takeaways and no medical overclaims.",
    headlineStyle: "Actionable, benefit-driven, and specific.",
    articleTone: "Encouraging, direct, and useful.",
    allowedAngles: ["Training methods", "Recovery habits", "Athlete routines", "Equipment usefulness"],
    bannedAngles: ["Medical advice", "Fad-diet promises", "Body-shaming", "Unrealistic claims"],
    seoTendencies: "Exercise names, workout types, recovery terms, and practical outcomes.",
    socialCaptionStyle: "Instructional, motivational, and grounded in a clear training takeaway.",
    visualStyleNotes: "Pink/blue accents, clean form demonstrations, high-energy but legible layouts.",
    articleStructurePreferences: ["The concept", "Why it works", "How to execute", "Common mistakes"],
    neverSoundLike: ["An infomercial", "A diagnosis"],
  },
  master: {
    id: "master",
    name: "HMG",
    voiceDescription: "Executive media operator tone with direct founder-level clarity.",
    headlineStyle: "Strategic, bold, and precise.",
    articleTone: "Authoritative and practical.",
    allowedAngles: ["Media strategy", "Revenue systems", "Brand architecture", "Platform shifts"],
    bannedAngles: ["Complaining", "Vague strategy", "Gossip", "Unverified financial claims"],
    seoTendencies: "Media business terms, strategy language, brand names, and operating systems.",
    socialCaptionStyle: "Thought-leadership clarity with a direct next move.",
    visualStyleNotes: "Steel/gold premium finish, dark mode, clear hierarchy, and executive polish.",
    articleStructurePreferences: ["The thesis", "The reality", "The system", "The move"],
    neverSoundLike: ["A junior marketer", "A generic business textbook"],
  },
};

export function normalizeIntelligenceBrandId(id: string): IntelligenceBrandId {
  const lower = id.toLowerCase();
  if (lower.includes("hiphop")) return "hiphop";
  if (lower.includes("rap")) return "rap";
  if (lower.includes("sports")) return "sports";
  if (lower.includes("canna")) return "canna";
  if (lower.includes("fit")) return "fit";
  if (lower.includes("music")) return "music";
  return "master";
}

export function getBrandVoiceProfile(id: string): BrandVoiceProfile {
  return intelligenceBrandProfiles[normalizeIntelligenceBrandId(id)];
}

export function formatBrandVoicePacket(profile: BrandVoiceProfile): string {
  return [
    `BRAND VOICE PACKET — ${profile.name}`,
    "",
    `Voice: ${profile.voiceDescription}`,
    `Headline style: ${profile.headlineStyle}`,
    `Article tone: ${profile.articleTone}`,
    "",
    "Allowed angles:",
    ...profile.allowedAngles.map((item) => `- ${item}`),
    "",
    "Avoid:",
    ...profile.bannedAngles.map((item) => `- ${item}`),
    "",
    "Structure:",
    ...profile.articleStructurePreferences.map((item) => `- ${item}`),
  ].join("\n");
}
