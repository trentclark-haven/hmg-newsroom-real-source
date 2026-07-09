import type { BrandVoiceProfile, VisualDirectionPacket } from "./types";
import { getBrandVisualRules, getImageSourcingChecklist } from "./visualPromptEngine";

function inferLayout(topic: string, imageCount: number): string {
  const lower = topic.toLowerCase();
  if (lower.includes("photo") || imageCount >= 4) return "Photo grid / recap collage";
  if (imageCount >= 3) return "Hero plus support images";
  if (imageCount === 2) return "Two-up comparison";
  if (lower.includes("quote") || lower.includes("interview")) return "Lower-third feature";
  return "Single hero";
}

function inferOutputSize(layout: string): string {
  if (layout.includes("Two-up")) return "1200x630 landscape";
  if (layout.includes("Photo grid")) return "1080x1350 feed card";
  if (layout.includes("Lower-third")) return "1920x1080 video thumbnail";
  return "1200x670 website hero";
}

export function generateHmgVisualPacket(input: {
  topic: string;
  brand: BrandVoiceProfile;
  imageCount?: number;
  headline?: string;
  currentLayout?: string;
  outputSize?: string;
}): VisualDirectionPacket {
  const imageCount = input.imageCount ?? 1;
  const recommendedLayout = input.currentLayout || inferLayout(input.topic, imageCount);
  const recommendedOutputSize = input.outputSize || inferOutputSize(recommendedLayout);
  const shortHeadline = (input.headline || input.topic || "HMG UPDATE")
    .trim()
    .split(/\s+/)
    .slice(0, 7)
    .join(" ")
    .toUpperCase();
  const platformFitWarning =
    recommendedOutputSize.includes("1920") && imageCount > 3
      ? "Too many images for a thumbnail. Use one hero image and one support label."
      : recommendedOutputSize.includes("1080x1350") && shortHeadline.length > 44
        ? "Feed card headline may wrap too much. Shorten the overlay."
        : null;
  const genericLookWarning =
    imageCount === 0
      ? "No source image staged. Avoid using vague generated-looking filler."
      : "Watch for overly smooth lighting, plastic skin, garbled signs, and fake-looking hands.";
  const packetLines = [
    `HMG VISUAL DIRECTION PACKET — ${input.brand.name}`,
    "",
    `Recommended layout: ${recommendedLayout}`,
    `Recommended output size: ${recommendedOutputSize}`,
    `Headline overlay: ${shortHeadline}`,
    `Image count: ${Math.max(1, Math.min(6, imageCount || 1))}`,
    "",
    "Crop/focus guidance:",
    `- Keep the subject in the center third with room for ${shortHeadline.length > 22 ? "a short label" : "the headline"}.`,
    "",
    "Lower-third guidance:",
    "- Source or speaker label bottom left; brand mark bottom right; keep it under two short lines.",
    "",
    "Quality checklist:",
    "- Text readable on mobile",
    "- Source/credit is known",
    "- Brand accent is visible but controlled",
    "- Crop does not change the meaning of the image",
  ];
  return {
    recommendedLayout,
    recommendedOutputSize,
    headlineOverlayRecommendation: shortHeadline,
    imageCountRecommendation: Math.max(1, Math.min(6, imageCount || 1)),
    cropFocusGuidance: `Center third subject lockup; leave clear space for ${shortHeadline.length > 22 ? "a shorter overlay" : "headline overlay"}.`,
    lowerThirdGuidance: "Source/speaker label bottom left; brand mark bottom right; two lines max.",
    platformFitWarning,
    genericLookWarning,
    brandVisualRules: getBrandVisualRules(input.brand),
    imageSourcingChecklist: getImageSourcingChecklist(),
    graphicQualityChecklist: [
      "Text reads clearly at phone size.",
      "Image source is known and creditable.",
      "No synthetic-looking artifacts or garbled text.",
      "Brand color supports the story instead of overpowering it.",
      "Crop preserves the facts of the image.",
    ],
    copyablePacket: packetLines.join("\n"),
  };
}
