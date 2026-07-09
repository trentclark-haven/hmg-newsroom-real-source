export const memorySeed = {
  version: "2.0",
  durableRules: [
    "WebArt is the in-app visual builder.",
    "WebEdit is the in-app cut desk.",
    "Social Factory is the campaign assembler.",
    "Founder Command Center is the cockpit.",
    "Editorial Desk is the article draft and WordPress post engine.",
    "HMG Visual Engine is the WebArt guidance layer.",
    "Maximillion is the revenue, Founder OS, and business intelligence layer.",
    "Maximillion is not graphics, WebArt, collage, image, or visual prompt intelligence.",
    "HMG has a strict no-gossip policy.",
    "Do not claim publishing happened unless a real publish action occurred.",
    "Do not claim external output unless the connected service actually returned it.",
    "Prefer ZIP-first handoffs for Founder review.",
    "External welding-shop workflows come later; this app must be useful locally first.",
  ],
  status: {
    memorySeed: "local-ready",
    styleEngine: "local-ready",
    hmgVisualEngine: "local-ready",
    articleQuality: "local-ready",
  },
  brands: ["HipHopHaven", "RapHaven", "MusicHaven", "SportsHaven", "CannaHaven", "FitHaven", "HMG"],
};

export function formatMemorySeedSummary(): string {
  return [
    `MEMORY SEED SUMMARY — v${memorySeed.version}`,
    "",
    "Durable rules:",
    ...memorySeed.durableRules.map((rule) => `- ${rule}`),
    "",
    "Local engine status:",
    ...Object.entries(memorySeed.status).map(([key, value]) => `- ${key}: ${value}`),
  ].join("\n");
}
