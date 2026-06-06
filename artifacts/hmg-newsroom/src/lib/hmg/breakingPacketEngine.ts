import type { BrandVoiceProfile } from "./brandVoiceProfiles";
import type { SourcePacket } from "./sourcePackets";

export interface BreakingPacket {
  headline: string;
  alertSummary: string;
  webPost: string;
  xPost: string;
  instagramCaption: string;
  tiktokHook: string;
  verificationNote: string;
  generatedAt: string;
}

export function generateBreakingPacket(source: SourcePacket, brandProfile: BrandVoiceProfile): BreakingPacket {
  const event = source.title || "Breaking Event";
  const brandTag = brandProfile.name.replace(/\s+/g, "");

  return {
    headline: `BREAKING: ${event} — What We Know Right Now`,
    alertSummary: `Urgent update regarding ${event}. ${brandProfile.name} is separating confirmed details from what still needs verification.`,
    webPost: `Just in: We are actively tracking a developing situation regarding ${event}. Initial source material points to meaningful movement, but this post should stay focused on verified details only. This article can be updated as new facts are confirmed.`,
    xPost: `🚨 BREAKING: ${event}.\n\nWe are verifying the details and separating confirmed facts from speculation. Keep it locked to ${brandProfile.name}.\n\n#BreakingNews #${brandTag}`,
    instagramCaption: `🚨 BREAKING NEWS 🚨\n\nReports are developing around ${event}. Our team is keeping the coverage focused on verified details, clear context, and what still needs confirmation.\n\n#Breaking #${brandTag}`,
    tiktokHook: `Breaking news is developing around ${event}. Here is what is verified, what is not, and what we are watching next...`,
    verificationNote: `FAST PUBLISH PROTOCOL: Sourced from ${source.mode}. Do not add speculation. Do not use confirmed language unless the source packet supports it.`,
    generatedAt: new Date().toISOString(),
  };
}

export function formatBreakingPacketForCopy(packet: BreakingPacket): string {
  return `BREAKING HEADLINE:\n${packet.headline}\n\nALERT SUMMARY:\n${packet.alertSummary}\n\nWEB POST:\n${packet.webPost}\n\nX POST:\n${packet.xPost}\n\nINSTAGRAM CAPTION:\n${packet.instagramCaption}\n\nTIKTOK HOOK:\n${packet.tiktokHook}\n\n---\nVERIFICATION:\n${packet.verificationNote}\n`;
}
