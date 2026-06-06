import type { BrandVoiceProfile } from "./types";
import { founderVoiceRules } from "./founderVoice";

export interface HeadlineRecommendation {
  primary: string;
  alternates: string[];
  flags: string[];
}

export function generateHeadlineRecommendations(
  topic: string,
  brand: BrandVoiceProfile,
  existingHeadline?: string,
): HeadlineRecommendation {
  const flags: string[] = [];
  const lowerHeadline = (existingHeadline ?? "").toLowerCase();
  for (const phrase of founderVoiceRules.bannedPhrases) {
    if (lowerHeadline.includes(phrase)) flags.push(`Rewrite weak phrase: "${phrase}"`);
  }
  const cleanTopic = topic.trim() || "the story";
  let primary = `${cleanTopic}: What matters now`;
  let alternates = [
    `Why ${cleanTopic} matters right now`,
    `The real stakes behind ${cleanTopic}`,
    `${cleanTopic} and the next move`,
  ];
  if (brand.id === "sports") {
    primary = `${cleanTopic}: the stakes, the swing, and what comes next`;
    alternates = [`How ${cleanTopic} changes the picture`, `The real cost of ${cleanTopic}`];
  } else if (brand.id === "rap" || brand.id === "hiphop") {
    primary = `Why ${cleanTopic} has the culture watching`;
    alternates = [`The impact behind ${cleanTopic}`, `${cleanTopic} is bigger than the headline`];
  } else if (brand.id === "fit") {
    primary = `${cleanTopic}: the practical guide that actually helps`;
    alternates = [`How to use ${cleanTopic} without overdoing it`, `The clean way to approach ${cleanTopic}`];
  } else if (brand.id === "master") {
    primary = `${cleanTopic}: the strategy behind the move`;
    alternates = [`The operating logic behind ${cleanTopic}`, `Why ${cleanTopic} changes the media math`];
  }
  return {
    primary: existingHeadline && !flags.length ? existingHeadline : primary,
    alternates,
    flags,
  };
}
