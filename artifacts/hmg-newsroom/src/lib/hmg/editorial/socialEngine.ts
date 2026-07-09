import { buildBrandRules } from "./brandRules.ts";
import { truncate } from "./articleEngine.ts";
import type { ParsedResearchNotes } from "./types.ts";

export interface SocialPiece {
  id: string;
  platform: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string;
}

export interface SocialPostsPackage {
  id: string;
  brand: string;
  brandName: string;
  pieces: SocialPiece[];
  createdAt: string;
}

export function generateSocialPosts(
  brand: string,
  notes: ParsedResearchNotes,
): SocialPostsPackage {
  const rules = buildBrandRules(brand);
  const brandName = rules.profile.name;
  const subject = notes.storyTitle || notes.what || "the latest story";
  const hashtags = rules.hashtagSeed.slice(0, 3).join(" ");
  const opener = rules.socialOpener(subject);

  const pieces: SocialPiece[] = [
    {
      id: "x-single",
      platform: "X / Twitter (single post)",
      hook: opener,
      body: truncate(
        `${brandName} has the verified read on ${subject}.`,
        220,
      ),
      cta: "Full breakdown in the link.",
      hashtags,
    },
    {
      id: "x-thread",
      platform: "X / Twitter (thread hook)",
      hook: truncate(
        `A thread on ${subject} — what's verified, what's not, what to watch.`,
        220,
      ),
      body: truncate(
        `${brandName} broke down the story in the editorial brain. Here's the short version: ${notes.what || "verified beats inside"}. 1/`,
        260,
      ),
      cta: "Read the full piece.",
      hashtags,
    },
    {
      id: "ig-feed",
      platform: "Instagram Feed",
      hook: opener,
      body: truncate(
        `${brandName} published the verified breakdown of ${subject} — facts, timeline, and what still needs confirmation. Read it before you scroll past this story.`,
        1800,
      ),
      cta: "Link in bio for the full read.",
      hashtags,
    },
    {
      id: "ig-story",
      platform: "Instagram Story",
      hook: "NEW",
      body: truncate(`${brandName}: ${subject} — the verified read.`, 220),
      cta: "Tap to read.",
      hashtags: "",
    },
    {
      id: "tiktok",
      platform: "TikTok",
      hook: truncate(`Do not scroll past ${subject}.`, 150),
      body: truncate(
        `${brandName} broke this one down with the verified beats and the timeline. Here's the fast read before you keep scrolling.`,
        220,
      ),
      cta: "Full piece — link in bio.",
      hashtags: `${hashtags} #Explained`,
    },
    {
      id: "newsletter",
      platform: "Newsletter",
      hook: `Inside: ${subject}`,
      body: truncate(
        `${brandName}'s read on ${subject} runs the verified facts, the timeline, and the things the desk is still confirming. If you've been hearing the noise, this is the reset.`,
        500,
      ),
      cta: "Read the full editorial.",
      hashtags: "",
    },
    {
      id: "youtube-short",
      platform: "YouTube Shorts",
      hook: truncate(`${brandName} on ${subject}.`, 100),
      body: truncate(
        `Here's the verified short version of ${subject} — no speculation, no filler. Full breakdown is on the site.`,
        200,
      ),
      cta: "Subscribe for more.",
      hashtags: `#Shorts ${hashtags}`,
    },
    {
      id: "youtube-long",
      platform: "YouTube (longform)",
      hook: truncate(`${subject} — the ${brandName} breakdown`, 100),
      body: truncate(
        `In this video, ${brandName} runs the verified facts, the timeline, and the names involved in ${subject}. Plus what's still being confirmed.`,
        4000,
      ),
      cta: "Subscribe for more longform breakdowns.",
      hashtags,
    },
    {
      id: "discord",
      platform: "Discord / Community",
      hook: `New Drop: ${subject}`,
      body: truncate(
        `${brandName} just published the verified read on ${subject}. Drop your take in the thread after you read it.`,
        2000,
      ),
      cta: "Link: [insert URL]",
      hashtags: "",
    },
  ];

  return {
    id: `soc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    brand,
    brandName,
    pieces,
    createdAt: new Date().toISOString(),
  };
}

export function socialPackToText(pack: SocialPostsPackage): string {
  return pack.pieces
    .map((p) =>
      [
        `[${p.platform.toUpperCase()}]`,
        `HOOK: ${p.hook}`,
        `BODY: ${p.body}`,
        `CTA: ${p.cta}`,
        p.hashtags ? `HASHTAGS: ${p.hashtags}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n---\n\n");
}
