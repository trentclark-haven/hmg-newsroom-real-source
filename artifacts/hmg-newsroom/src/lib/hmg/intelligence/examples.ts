import { chooseBlueprint } from "./articleBlueprints";
import { getBrandVoiceProfile } from "./brandVoiceProfiles";
import { generateHeadlineRecommendations } from "./headlineEngine";
import { generateHmgVisualPacket } from "./hmgVisualEngine";
import { generateSeoPacket } from "./seoPacketEngine";
import { buildSocialCampaignIntelligence } from "./socialCampaignBrain";
import { scoreArticleDraft } from "./qualityScorer";
import type { IntelligenceBrandId, IntelligenceExamplePacket } from "./types";

const scenarios: Array<{
  brandId: IntelligenceBrandId;
  scenario: string;
  topic: string;
  body: string;
  sourceCount: number;
}> = [
  {
    brandId: "hiphop",
    scenario: "HipHopHaven artist news",
    topic: "artist announces an independent rollout after a major-label exit",
    body: "The artist confirmed the move through an official statement and framed the next chapter around ownership, release control, and direct fan connection.",
    sourceCount: 2,
  },
  {
    brandId: "rap",
    scenario: "RapHaven release/news",
    topic: "new single sparks a producer-led rollout",
    body: "The release credits identify the producer team, rollout date, and the hook that is already driving conversation around the record.",
    sourceCount: 2,
  },
  {
    brandId: "music",
    scenario: "MusicHaven artist profile",
    topic: "genre-crossing artist builds a premium live-show lane",
    body: "The profile connects the artist's catalog, tour positioning, and industry timing without leaning on unsourced personal claims.",
    sourceCount: 3,
  },
  {
    brandId: "sports",
    scenario: "SportsHaven athlete story",
    topic: "athlete returns from injury with playoff stakes rising",
    body: "The recap uses official team status, game logs, and upcoming schedule context to explain what changes next.",
    sourceCount: 3,
  },
  {
    brandId: "canna",
    scenario: "CannaHaven business/culture article",
    topic: "regional cannabis brand expands into compliant retail culture",
    body: "The story focuses on licensing, market positioning, retail design, and consumer education without legal or medical promises.",
    sourceCount: 2,
  },
  {
    brandId: "fit",
    scenario: "FitHaven fitness feature",
    topic: "four-week strength block built around recovery discipline",
    body: "The feature explains the training structure, recovery habits, and common mistakes while avoiding medical claims.",
    sourceCount: 2,
  },
];

export const intelligenceExamples: IntelligenceExamplePacket[] = scenarios.map((scenario) => {
  const brand = getBrandVoiceProfile(scenario.brandId);
  const headlineIdeas = generateHeadlineRecommendations(scenario.topic, brand).alternates;
  const headline = generateHeadlineRecommendations(scenario.topic, brand).primary;
  const articleBlueprint = chooseBlueprint(scenario.brandId, scenario.topic);
  const seoPacket = generateSeoPacket(scenario.topic, headline, brand);
  const visualDirectionPacket = generateHmgVisualPacket({
    topic: scenario.topic,
    brand,
    headline,
    imageCount: 3,
  });
  const socialCampaignStarter = buildSocialCampaignIntelligence({
    brand,
    headline,
    articlePackage: scenario.body,
    visualPackage: visualDirectionPacket.copyablePacket,
    clipPackage: "",
    campaignAngle: "Lead with the verified angle and keep the manual CTA clean.",
  });
  const qualityScore = scoreArticleDraft({
    headline,
    body: scenario.body,
    brand,
    hasSeoPack: true,
    hasSocialPack: true,
    hasVisualDirection: true,
    sourceCount: scenario.sourceCount,
  });
  return {
    brandId: scenario.brandId,
    scenario: scenario.scenario,
    headlineIdeas: [headline, ...headlineIdeas].slice(0, 3),
    articleBlueprint,
    seoPacket,
    qualityScore,
    visualDirectionPacket,
    socialCampaignStarter,
  };
});
