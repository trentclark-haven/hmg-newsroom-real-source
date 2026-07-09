import type { BrandVoiceProfile, SocialCampaignIntelligence } from "./types";

export function buildSocialCampaignIntelligence(input: {
  brand: BrandVoiceProfile;
  headline: string;
  articlePackage: string;
  visualPackage: string;
  clipPackage: string;
  campaignAngle: string;
}): SocialCampaignIntelligence {
  const warnings: string[] = [];
  const text = [
    input.headline,
    input.articlePackage,
    input.visualPackage,
    input.clipPackage,
    input.campaignAngle,
  ]
    .join(" ")
    .toLowerCase();
  if (!input.visualPackage.trim()) warnings.push("Needs visual asset receipt before posting manually.");
  if (!input.articlePackage.trim()) warnings.push("Needs article draft notes before campaign handoff.");
  if (/\b(update|news|story|content)\b/.test(input.headline.toLowerCase()) && input.headline.length < 32) {
    warnings.push("Too generic: headline needs a sharper subject or stakes angle.");
  }
  if (!text.includes(input.brand.name.toLowerCase().replace(/\s+/g, "")) && !text.includes(input.brand.name.toLowerCase())) {
    warnings.push(`Add one clear ${input.brand.name} brand cue.`);
  }
  const copyablePacket = [
    `SOCIAL CAMPAIGN INTELLIGENCE PACKET — ${input.brand.name}`,
    "",
    `Headline: ${input.headline || "(needs headline)"}`,
    `Campaign angle: ${input.campaignAngle || "Use the strongest verified takeaway."}`,
    "",
    "Caption tuning:",
    `- ${input.brand.socialCaptionStyle}`,
    "- Lead with the most specific fact or stake.",
    "- Keep the first sentence useful without needing the link.",
    "",
    "CTA recommendations:",
    "- Read the full story.",
    "- Save this for context.",
    "- Drop the strongest counterpoint manually after posting.",
    "",
    "Warnings:",
    ...(warnings.length ? warnings.map((item) => `- ${item}`) : ["- None flagged."]),
  ];
  return {
    brandAwareCaptionTuning: [
      input.brand.socialCaptionStyle,
      "Make the first sentence carry the angle.",
      "Use brand-specific nouns instead of generic hype.",
    ],
    platformToneChecks: [
      "Short post: one claim, one source-aware hook.",
      "Story text: headline plus one context line.",
      "Community post: ask for interpretation, not speculation.",
      "Long caption: lead with context, then give the reader the move.",
    ],
    ctaRecommendations: [
      "Read the full story.",
      "Save this for context.",
      "Send this to someone tracking the story.",
    ],
    hashtagQualityGuidance: [
      "Use 3 to 6 tags.",
      "Include brand tag, subject tag, and category tag.",
      "Avoid filler tags that do not describe the story.",
    ],
    altTextQualityCheck: [
      "Describe visible people, setting, and action.",
      "Do not add facts that are not visible in the image.",
      "Mention text overlays only if they are part of the graphic.",
    ],
    warnings,
    readyToPostChecklist: [
      "Article draft pasted.",
      "Visual asset receipt pasted.",
      "Clip notes pasted or marked not needed.",
      "CTA selected.",
      "Alt text reviewed.",
      "Manual posting destination chosen outside this app.",
    ],
    copyablePacket: copyablePacket.join("\n"),
  };
}
