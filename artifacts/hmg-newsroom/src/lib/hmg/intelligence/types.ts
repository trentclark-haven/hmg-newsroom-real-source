export type IntelligenceBrandId =
  | "hiphop"
  | "rap"
  | "music"
  | "sports"
  | "canna"
  | "fit"
  | "master";

export type BlueprintId =
  | "breaking_news"
  | "artist_profile"
  | "release_coverage"
  | "sports_recap"
  | "culture_analysis"
  | "business_move"
  | "fitness_feature"
  | "photo_story";

export interface BrandVoiceProfile {
  id: IntelligenceBrandId;
  name: string;
  voiceDescription: string;
  headlineStyle: string;
  articleTone: string;
  allowedAngles: string[];
  bannedAngles: string[];
  seoTendencies: string;
  socialCaptionStyle: string;
  visualStyleNotes: string;
  articleStructurePreferences: string[];
  neverSoundLike: string[];
}

export interface ArticleBlueprint {
  id: BlueprintId;
  name: string;
  recommendedFlow: string[];
  headlinePattern: string;
  dekPattern: string;
  seoFields: string[];
  tagsCategoriesGuidance: string;
  visualAssetNeeds: string[];
  socialPackageNeeds: string[];
  verificationChecklist: string[];
}

export interface QualityScoreResult {
  score: number;
  founderVoiceFit: number;
  brandFit: number;
  unsupportedClaimRisk: number;
  noGossipCheck: "pass" | "needs-review" | "blocked";
  seoReadiness: number;
  topStrengths: string[];
  topFixes: string[];
  recommendedNextAction: string;
  blockedReason: string | null;
}

export interface SeoPacket {
  title: string;
  description: string;
  slug: string;
  tags: string[];
  categories: string[];
  readiness: number;
  fixes: string[];
}

export interface VisualDirectionPacket {
  recommendedLayout: string;
  recommendedOutputSize: string;
  headlineOverlayRecommendation: string;
  imageCountRecommendation: number;
  cropFocusGuidance: string;
  lowerThirdGuidance: string;
  platformFitWarning: string | null;
  genericLookWarning: string | null;
  brandVisualRules: string[];
  imageSourcingChecklist: string[];
  graphicQualityChecklist: string[];
  copyablePacket: string;
}

export interface SocialCampaignIntelligence {
  brandAwareCaptionTuning: string[];
  platformToneChecks: string[];
  ctaRecommendations: string[];
  hashtagQualityGuidance: string[];
  altTextQualityCheck: string[];
  warnings: string[];
  readyToPostChecklist: string[];
  copyablePacket: string;
}

export interface IntelligenceExamplePacket {
  brandId: IntelligenceBrandId;
  scenario: string;
  headlineIdeas: string[];
  articleBlueprint: ArticleBlueprint;
  seoPacket: SeoPacket;
  qualityScore: QualityScoreResult;
  visualDirectionPacket: VisualDirectionPacket;
  socialCampaignStarter: SocialCampaignIntelligence;
}
