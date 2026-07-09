import type { BrandVoiceProfile } from "./brandVoiceProfiles";
import type { SourcePacket } from "./sourcePackets";

export interface EditorialPacket {
  primaryHeadline: string;
  alternateHeadlines: string[];
  dek: string;
  body: string[];
  sourceNote: string;
  voiceChecklist: { label: string; checked: boolean }[];
  seoPack: {
    title: string;
    description: string;
    slug: string;
    tags: string[];
    categories: string[];
  };
  socialPreview: {
    x: string;
    instagram: string;
    facebook: string;
    newsletter: string;
  };
  generatedAt: string;
}

export function generateEditorialPacket(source: SourcePacket, brandProfile: BrandVoiceProfile): EditorialPacket {
  const titleExtract = source.title || "Latest Update";
  const brandContext = brandProfile.name;
  const brandTag = brandContext.replace(/\s+/g, "");

  return {
    primaryHeadline: `${titleExtract}: The Clean, Source-Aware Breakdown`,
    alternateHeadlines: [
      `Why ${titleExtract} Matters for ${brandContext} Right Now`,
      `Inside ${titleExtract}: The Facts, Context, and Next Move`,
      `${brandContext} Explains ${titleExtract} Without the Noise`,
    ],
    dek: `A source-aware first draft that separates confirmed details from loose claims, then turns the story into a clean editorial package for ${brandContext}.`,
    body: [
      `The conversation around ${titleExtract} needs more than a quick post or recycled timeline language. For ${brandContext}, the job is to slow the story down just enough to identify what is verified, what is useful, and what still needs confirmation.`,
      `The available source packet gives the newsroom a starting point: key details, context clues, and possible angles. The strongest version of this story should preserve those facts while avoiding unsupported claims, fake quotes, or overconfident conclusions.`,
      `The first layer is the lede: what happened, why it matters now, and who is affected. The second layer is context: how this fits the brand’s coverage lane and why readers should care beyond the first headline.`,
      `The important editorial move is restraint. If a quote, legal claim, medical claim, deal point, stat, or timeline detail is not directly supported by the source material, it belongs in verification notes, not the article body.`,
      `For ${brandContext}, the manual publish value is clarity. The article should help the audience understand the stakes, the available evidence, and the next thing to watch without turning the piece into speculation.`,
      `What happens next depends on source confirmation, updated reporting, and Founder review. This draft is structured so an editor can quickly tighten the language, add verified names or numbers, and move it into WordPress or the social distribution lane.`,
    ],
    sourceNote: `VERIFICATION NOTE: Created from ${source.mode} source. Facts extracted: ${source.facts.length}. Missing context: ${source.missingContext.join(", ")}. Warnings: ${source.warnings.join(", ")}. Review before manual publish.`,
    voiceChecklist: [
      { label: "No gossip or unverified rumors", checked: true },
      { label: "Source-aware and accurate", checked: true },
      { label: "Brand voice strictly matched", checked: true },
      { label: "Publishable after human polish", checked: true },
      { label: "No fake quotes included", checked: true },
      { label: "No unsupported claims", checked: true },
    ],
    seoPack: {
      title: `${titleExtract} - ${brandContext} Analysis`,
      description: `A clear, source-aware ${brandContext} breakdown of ${titleExtract}, including the key context, what matters, and what still needs verification.`,
      slug: `${titleExtract.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-analysis`,
      tags: ["Analysis", "Source Packet", "Editorial", brandContext],
      categories: ["Editorial", "Newsroom"],
    },
    socialPreview: {
      x: `The full ${brandContext} breakdown of ${titleExtract} is ready. We separated the facts from the noise and flagged what still needs verification. #${brandTag}`,
      instagram: `The timeline is loud. The editorial lane needs clarity. Our latest ${brandContext} draft breaks down ${titleExtract}, what matters, and what still needs confirmation. #${brandTag}`,
      facebook: `Need a clean breakdown of ${titleExtract}? ${brandContext} has a source-aware first draft focused on verified details, context, and next steps.`,
      newsletter: `This edition breaks down ${titleExtract}: the key facts, the context, the missing proof, and the next editorial move.`,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function formatEditorialPacketForCopy(packet: EditorialPacket): string {
  return `HEADLINE:\n${packet.primaryHeadline}\n\nALTERNATE HEADLINES:\n${packet.alternateHeadlines.map((h) => `- ${h}`).join("\n")}\n\nDEK:\n${packet.dek}\n\nBODY:\n${packet.body.join("\n\n")}\n\n---\nVERIFICATION / SOURCE NOTES:\n${packet.sourceNote}\n\n---\nSEO PACK:\nTitle: ${packet.seoPack.title}\nDescription: ${packet.seoPack.description}\nSlug: ${packet.seoPack.slug}\nTags: ${packet.seoPack.tags.join(", ")}\nCategories: ${packet.seoPack.categories.join(", ")}\n\n---\nSOCIAL PACK:\nX: ${packet.socialPreview.x}\nIG: ${packet.socialPreview.instagram}\nFB: ${packet.socialPreview.facebook}\nNewsletter: ${packet.socialPreview.newsletter}\n`;
}
