import type { BrandVoiceProfile } from "./types";

export function generateVisualPrompt(topic: string, brand: BrandVoiceProfile): string {
  const cleanTopic = topic.trim() || `${brand.name} story`;
  return [
    `Visual topic: ${cleanTopic}`,
    `Brand style: ${brand.visualStyleNotes}`,
    "Treatment: premium editorial, high contrast, mobile-readable, source-safe.",
    "Avoid: generic synthetic gloss, unreadable text, misleading crops, and unsourced people imagery.",
  ].join("\n");
}

export function getBrandVisualRules(brand: BrandVoiceProfile): string[] {
  return [
    brand.visualStyleNotes,
    "Keep text readable at small mobile sizes.",
    "Use brand accent color as a controlled highlight, not a full-page wash.",
    "Leave safe space for headline overlays and lower-third labels.",
    "Credit source material when a real person, event, or official asset is shown.",
  ];
}

export function getImageSourcingChecklist(): string[] {
  return [
    "Official, licensed, owned, or clearly source-attributed image.",
    "High enough resolution for the selected output size.",
    "Subject is not cropped through the face, hands, or key action.",
    "No watermarks, garbled text, or misleading context.",
    "Alt text can describe what is actually visible.",
  ];
}
