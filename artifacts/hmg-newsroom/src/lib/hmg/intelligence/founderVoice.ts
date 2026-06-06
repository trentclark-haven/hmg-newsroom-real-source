export const founderVoiceRules = {
  tone: [
    "Confident and sharp",
    "Culturally fluent",
    "Media-savvy",
    "Direct and authoritative",
    "Premium without getting stiff",
  ],
  bannedPhrases: [
    "in conclusion",
    "here's what we know",
    "breaking down the situation",
    "only time will tell",
    "at the end of the day",
    "it goes without saying",
    "in today's digital age",
    "delve into",
    "furthermore",
    "moreover",
  ],
  requiredElements: [
    "Clear point of view",
    "Fact-based analysis over speculation",
    "Tight sentences",
    "No fake quotes",
    "No weak filler",
    "No corporate mush",
  ],
};

export function analyzeFounderVoice(text: string): {
  score: number;
  passes: boolean;
  flags: string[];
} {
  const lower = text.toLowerCase();
  const flags: string[] = [];
  for (const phrase of founderVoiceRules.bannedPhrases) {
    if (lower.includes(phrase)) {
      flags.push(`Rewrite phrase: "${phrase}"`);
    }
  }
  if (/\b(utilize|synergy|leverage|robust solution)\b/i.test(text)) {
    flags.push("Corporate filler detected. Make it plainer and sharper.");
  }
  if (/\b(undeniably|without a doubt|obviously)\b/i.test(text)) {
    flags.push("Over-certainty detected. Let sourced facts carry the claim.");
  }
  const score = Math.max(0, 100 - flags.length * 18);
  return { score, passes: score >= 82, flags };
}

export function formatFounderVoicePacket(): string {
  return [
    "FOUNDER VOICE PACKET",
    "",
    "Tone:",
    ...founderVoiceRules.tone.map((item) => `- ${item}`),
    "",
    "Required elements:",
    ...founderVoiceRules.requiredElements.map((item) => `- ${item}`),
    "",
    "Rewrite if these appear:",
    ...founderVoiceRules.bannedPhrases.map((item) => `- ${item}`),
  ].join("\n");
}
