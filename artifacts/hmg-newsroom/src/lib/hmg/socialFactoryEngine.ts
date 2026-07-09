import type { BrandVoiceProfile } from "./brandVoiceProfiles";
import type { SourcePacket } from "./sourcePackets";

export interface SocialPiece {
  id: string;
  platform: string;
  hookOrHeadline: string;
  body: string;
  cta: string;
  hashtags: string;
}

export interface SocialPack12 {
  pieces: SocialPiece[];
  generatedAt: string;
}

export function generateSocialPack(source: SourcePacket, brandProfile: BrandVoiceProfile): SocialPack12 {
  const topic = source.title || "Latest Update";
  const brandName = brandProfile.name.replace(/\s+/g, "");
  const baseHashtags = `#${brandName} #News #Culture`;

  return {
    pieces: [
      { id: "web-head", platform: "Website", hookOrHeadline: `The Clean Breakdown: ${topic}`, body: `A source-aware editorial package that removes the noise and explains what ${topic} actually means.`, cta: "Read Full Article", hashtags: "" },
      { id: "push", platform: "Push Alert", hookOrHeadline: `New on ${brandProfile.name}`, body: `Our clean breakdown of ${topic} is ready. Tap for the verified context.`, cta: "Tap to Read", hashtags: "" },
      { id: "newsletter", platform: "Newsletter", hookOrHeadline: `Inside: ${topic}`, body: `If the timeline has been confusing, this is the reset. We parsed the source material around ${topic} and built the clearest version of what matters.`, cta: "Read the Deep Dive", hashtags: "" },
      { id: "discord", platform: "Discord/Community", hookOrHeadline: `New Drop: ${topic}`, body: `The editorial team just published our clean breakdown on ${topic}. Read it first, then drop your thoughts in the community thread.`, cta: "Link: [Insert URL]", hashtags: "" },
      { id: "facebook", platform: "Facebook", hookOrHeadline: `What you need to know about ${topic}.`, body: `There is a lot of noise around this story. We pulled the useful details together and separated confirmed context from claims that still need proof.`, cta: "Click to read more.", hashtags: baseHashtags },
      { id: "x-post", platform: "X / Twitter (Single Post)", hookOrHeadline: `The breakdown of ${topic} is here.`, body: `We looked at the source material, cut through the noise, and flagged what still needs confirmation.`, cta: "Read the full piece.", hashtags: baseHashtags },
      { id: "x-thread", platform: "X / Twitter (Thread Hook)", hookOrHeadline: `A lot of people are discussing ${topic}, but the key context is getting buried.`, body: `Here is the source-aware breakdown, step by step. (1/x)`, cta: "Read the thread", hashtags: baseHashtags },
      { id: "ig-feed", platform: "Instagram Feed", hookOrHeadline: `The timeline is loud. We brought the context.`, body: `Our latest editorial breaks down ${topic}, explains what matters, and identifies what still needs verification.`, cta: "Link in bio for the full read.", hashtags: baseHashtags },
      { id: "ig-story", platform: "Instagram Story", hookOrHeadline: `New Editorial`, body: `${topic}: the facts, context, and next move.`, cta: "Tap to Read", hashtags: "" },
      { id: "tiktok", platform: "TikTok", hookOrHeadline: `Here is what you need to know about ${topic}.`, body: `If you have been confused about this story, this is the fast breakdown before you scroll.`, cta: "Link in bio for the full story.", hashtags: `#${brandName} #Trending #Explained` },
      { id: "yt-long", platform: "YouTube (Longform)", hookOrHeadline: `${topic} Explained | Full Breakdown`, body: `In this video, we separate the facts from the noise and explain why ${topic} matters.`, cta: "Subscribe for more deep dives.", hashtags: baseHashtags },
      { id: "yt-shorts", platform: "YouTube Shorts", hookOrHeadline: `Do not scroll past this if you want to understand ${topic}.`, body: `The fastest clean breakdown: what is known, what is missing, and what happens next.`, cta: "Subscribe for more.", hashtags: `#Shorts #${brandName} #Explained` },
    ],
    generatedAt: new Date().toISOString(),
  };
}

export function formatSocialPackForCopy(pack: SocialPack12): string {
  return pack.pieces.map((p) => `[${p.platform.toUpperCase()}]\nHOOK: ${p.hookOrHeadline}\nBODY: ${p.body}\nCTA: ${p.cta}\nHASHTAGS: ${p.hashtags}\n`).join("\n---\n\n");
}
