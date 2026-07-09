import type { ArticleBlueprint, BlueprintId } from "./types";

export const articleBlueprints: Record<BlueprintId, ArticleBlueprint> = {
  breaking_news: {
    id: "breaking_news",
    name: "Breaking News",
    recommendedFlow: ["Verified lede", "Immediate context", "Stakes", "What to confirm next"],
    headlinePattern: "[Subject] [action] as [stakes/context]",
    dekPattern: "One-line verified summary with the immediate consequence.",
    seoFields: ["Subject", "event", "location or date when relevant"],
    tagsCategoriesGuidance: "Use the brand, subject name, and clear news category.",
    visualAssetNeeds: ["Clean alert card", "Official or licensed source image"],
    socialPackageNeeds: ["Fast post", "story card copy", "manual reply prompt"],
    verificationChecklist: ["Primary source checked", "Timeline clear", "No speculation"],
  },
  artist_profile: {
    id: "artist_profile",
    name: "Artist Profile",
    recommendedFlow: ["Why now", "Origin context", "Work and impact", "What comes next"],
    headlinePattern: "How [artist] is [impact] right now",
    dekPattern: "A focused profile on the rise, work, and stakes around the artist.",
    seoFields: ["Artist", "genre", "project", "collaborators"],
    tagsCategoriesGuidance: "Use profile, artist name, genre, and project tags.",
    visualAssetNeeds: ["Editorial portrait", "performance or studio image", "collage option"],
    socialPackageNeeds: ["Feed caption", "story text", "quote card"],
    verificationChecklist: ["Bio facts verified", "Quotes attributed", "No personal-life speculation"],
  },
  release_coverage: {
    id: "release_coverage",
    name: "Release Coverage",
    recommendedFlow: ["Release fact", "Sound or strategy", "Standout moment", "Audience impact"],
    headlinePattern: "[artist/project] lands with [specific impact]",
    dekPattern: "A concise breakdown of the release and why it matters.",
    seoFields: ["Artist", "project title", "producer", "label"],
    tagsCategoriesGuidance: "Use release, artist, project, and genre tags.",
    visualAssetNeeds: ["Cover art reference", "artist image", "platform-safe crop"],
    socialPackageNeeds: ["Short caption", "carousel beat list", "comment prompt"],
    verificationChecklist: ["Release details checked", "Credits verified", "No invented numbers"],
  },
  sports_recap: {
    id: "sports_recap",
    name: "Sports Recap",
    recommendedFlow: ["Result", "Turning point", "Player/team stakes", "Next matchup"],
    headlinePattern: "[team/player] [action] as [stakes] shift",
    dekPattern: "The result, the turning point, and what changes next.",
    seoFields: ["Player", "team", "game", "league"],
    tagsCategoriesGuidance: "Use player, team, league, and recap tags.",
    visualAssetNeeds: ["Action image", "score-safe thumbnail", "stat card option"],
    socialPackageNeeds: ["Stakes caption", "manual comment prompt", "short clip plan"],
    verificationChecklist: ["Score checked", "Stats checked", "No unverified injury claim"],
  },
  culture_analysis: {
    id: "culture_analysis",
    name: "Culture Analysis",
    recommendedFlow: ["Thesis", "Evidence", "Why it is happening", "What it changes"],
    headlinePattern: "The [adjective] shift behind [trend]",
    dekPattern: "A clear argument about the trend, backed by actual evidence.",
    seoFields: ["Trend", "key figures", "category"],
    tagsCategoriesGuidance: "Use analysis, trend, and key figure tags.",
    visualAssetNeeds: ["Conceptual hero", "collage", "quote card"],
    socialPackageNeeds: ["Discussion caption", "story prompt", "manual CTA"],
    verificationChecklist: ["Thesis supported", "Examples real", "No sweeping unsupported claim"],
  },
  business_move: {
    id: "business_move",
    name: "Business Move",
    recommendedFlow: ["The move", "The verified details", "The strategy", "Market impact"],
    headlinePattern: "[entity] [move]: what the strategy signals",
    dekPattern: "A business-first breakdown of the move and its likely impact.",
    seoFields: ["Company", "executive", "market", "deal type"],
    tagsCategoriesGuidance: "Use business, company, and strategy tags.",
    visualAssetNeeds: ["Logo lockup", "executive-safe image", "market chart option"],
    socialPackageNeeds: ["Executive caption", "newsletter summary", "manual CTA"],
    verificationChecklist: ["Figures verified", "No private financial claim", "Source note included"],
  },
  fitness_feature: {
    id: "fitness_feature",
    name: "Fitness Feature",
    recommendedFlow: ["The problem", "The method", "How to execute", "Common mistakes"],
    headlinePattern: "[training method] for [clear outcome]",
    dekPattern: "A practical guide with a clear training takeaway.",
    seoFields: ["Exercise", "training goal", "equipment", "duration"],
    tagsCategoriesGuidance: "Use training, method, and outcome tags.",
    visualAssetNeeds: ["Clear form image", "step card", "thumbnail with movement"],
    socialPackageNeeds: ["Instruction caption", "checklist story", "manual CTA"],
    verificationChecklist: ["No medical advice", "Claims modest", "Instructions practical"],
  },
  photo_story: {
    id: "photo_story",
    name: "Photo Story",
    recommendedFlow: ["Lead image", "Sequence", "Context", "Caption set"],
    headlinePattern: "[subject] in [moment/context]",
    dekPattern: "A visual-first article with concise context and source-safe captions.",
    seoFields: ["Subject", "event", "location", "photographer/source"],
    tagsCategoriesGuidance: "Use photo story, subject, and event tags.",
    visualAssetNeeds: ["Multi-image tray", "hero collage", "credit line"],
    socialPackageNeeds: ["Photo dump caption", "story text", "alt text"],
    verificationChecklist: ["Source rights noted", "Credits present", "No misleading crop"],
  },
};

export function chooseBlueprint(brandId: string, text: string): ArticleBlueprint {
  const lower = `${brandId} ${text}`.toLowerCase();
  if (lower.includes("sports") || lower.includes("game") || lower.includes("athlete")) return articleBlueprints.sports_recap;
  if (lower.includes("release") || lower.includes("album") || lower.includes("single")) return articleBlueprints.release_coverage;
  if (lower.includes("profile") || lower.includes("rise")) return articleBlueprints.artist_profile;
  if (lower.includes("business") || lower.includes("deal") || lower.includes("market")) return articleBlueprints.business_move;
  if (lower.includes("fitness") || lower.includes("training") || lower.includes("workout")) return articleBlueprints.fitness_feature;
  if (lower.includes("photo") || lower.includes("gallery") || lower.includes("dump")) return articleBlueprints.photo_story;
  if (lower.includes("breaking") || lower.includes("urgent")) return articleBlueprints.breaking_news;
  return articleBlueprints.culture_analysis;
}
