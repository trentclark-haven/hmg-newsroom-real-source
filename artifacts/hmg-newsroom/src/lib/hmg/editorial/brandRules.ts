import { getBrandVoiceProfile, type BrandVoiceProfile } from "../brandVoiceProfiles.ts";

export interface BrandRules {
  profile: BrandVoiceProfile;
  ledeFraming: (subject: string) => string;
  contextLine: (subject: string) => string;
  closer: (subject: string) => string;
  socialOpener: (subject: string) => string;
  hashtagSeed: string[];
  doNotClaim: string[];
}

const BASE = {
  doNotClaim: [
    "Unverified deal terms or contract numbers.",
    "Medical, legal, or financial claims without a source.",
    "Direct quotes that are not present in the source notes.",
  ],
};

function fmtHashtags(brand: string, extras: string[]): string[] {
  return [`#${brand.replace(/\s+/g, "")}`, ...extras];
}

export function buildBrandRules(brandId: string): BrandRules {
  const profile = getBrandVoiceProfile(brandId);
  const name = profile.name;

  switch (profile.id) {
    case "hiphop":
      return {
        profile,
        ledeFraming: (subject) =>
          `${name} is tracking ${subject} as a culture-first story — the kind of moment that only makes sense if you take hip-hop seriously as an art form and a business.`,
        contextLine: (subject) =>
          `Across the hip-hop ecosystem, ${subject} sits at the intersection of artistry, audience, and ownership. The context here is about the music, the moment, and the long arc — not gossip.`,
        closer: (subject) =>
          `For ${name}, the assignment is clear: keep the read on ${subject} sharp, credible, and culturally fluent. We will update as the desk verifies more.`,
        socialOpener: (subject) =>
          `${name}'s read on ${subject} keeps it culture-first.`,
        hashtagSeed: fmtHashtags(name, ["#HipHop", "#Culture", "#NewMusic"]),
        doNotClaim: [
          ...BASE.doNotClaim,
          "Avoid corny or forced slang. Stay in measured hip-hop journalism voice.",
          "No gossip framing — only confirmed cultural reporting.",
        ],
      };
    case "rap":
      return {
        profile,
        ledeFraming: (subject) =>
          `${name} is locked in on ${subject}. Rap moves fast and this one has the kind of timing the streets are already reading.`,
        contextLine: (subject) =>
          `The rap competitive picture around ${subject} is what makes the story matter: who's releasing, who's responding, and what the leaderboard says when the dust clears.`,
        closer: (subject) =>
          `${name} keeps the bar high. We'll update ${subject} the second a confirmed move drops — no speculation, no filler.`,
        socialOpener: (subject) =>
          `${name} called it on ${subject}.`,
        hashtagSeed: fmtHashtags(name, ["#Rap", "#NewRelease", "#Bars"]),
        doNotClaim: [
          ...BASE.doNotClaim,
          "No mock beef or invented diss claims — only verified releases and statements.",
          "Sales/streaming numbers must come from a named source.",
        ],
      };
    case "music":
      return {
        profile,
        ledeFraming: (subject) =>
          `${name} is examining ${subject} with the patience the record deserves — closer to criticism than chart talk.`,
        contextLine: (subject) =>
          `${subject} arrives in a broader music conversation about craft, intent, and the way artists are choosing to release work right now. The frame here is industry- and craft-aware.`,
        closer: (subject) =>
          `${name} continues to follow ${subject} as the rollout, reception, and longer cultural read settle in.`,
        socialOpener: (subject) =>
          `${name}'s longform read on ${subject} is in.`,
        hashtagSeed: fmtHashtags(name, ["#Music", "#NewMusic", "#Criticism"]),
        doNotClaim: [
          ...BASE.doNotClaim,
          "Avoid hyperbole. Stay in measured prestige-music voice.",
          "Do not assign chart placements without a confirmed source.",
        ],
      };
    case "sports":
      return {
        profile,
        ledeFraming: (subject) =>
          `${name} is on ${subject}. Stakes-first read: what happened, who it affects, and what the standings say about it.`,
        contextLine: (subject) =>
          `Inside the season-long arc, ${subject} matters because it changes the calculus — playoff math, depth chart, contract leverage, or all three. We keep it desk-tight.`,
        closer: (subject) =>
          `${name} is archiving athletic greatness in real time. We'll update ${subject} as the box score, depth chart, and locker-room reads come in.`,
        socialOpener: (subject) =>
          `${name} has the crisp read on ${subject}.`,
        hashtagSeed: fmtHashtags(name, ["#Sports", "#Analysis", "#GameTime"]),
        doNotClaim: [
          ...BASE.doNotClaim,
          "Do not report injuries unless source-confirmed.",
          "No trade speculation as fact.",
        ],
      };
    case "canna":
      return {
        profile,
        ledeFraming: (subject) =>
          `${name} is covering ${subject} as adult, compliant cannabis editorial — culture and business, not hype.`,
        contextLine: (subject) =>
          `${subject} fits a broader cannabis-business and culture picture: legal landscape, brand strategy, and the operators actually moving product. We keep it credible.`,
        closer: (subject) =>
          `${name} will keep following ${subject} with verified business reporting — culture-first, compliance-aware, never sloppy.`,
        socialOpener: (subject) =>
          `${name}'s adult read on ${subject} is here.`,
        hashtagSeed: fmtHashtags(name, ["#Cannabis", "#Culture", "#Business"]),
        doNotClaim: [
          ...BASE.doNotClaim,
          "No unsupported medical or therapeutic claims.",
          "Confirm state-level legality before asserting anything about product distribution.",
        ],
      };
    case "fit":
      return {
        profile,
        ledeFraming: (subject) =>
          `${name} is breaking down ${subject} into a practical read — what to do with it, who it helps, and what the science actually says.`,
        contextLine: (subject) =>
          `Around ${subject}, the useful question is: what does this change in a real training week, a real recovery plan, or a real wellness routine? We answer that, plainly.`,
        closer: (subject) =>
          `${name} closes ${subject} with the takeaway: the training move, the recovery note, or the protocol detail you can use tomorrow.`,
        socialOpener: (subject) =>
          `${name}'s practical read on ${subject}.`,
        hashtagSeed: fmtHashtags(name, ["#Fitness", "#Wellness", "#Training"]),
        doNotClaim: [
          ...BASE.doNotClaim,
          "Avoid medical overclaims — no 'cures' or 'guaranteed' results.",
          "Tag protocols as personal training advice, not medical advice.",
        ],
      };
    default:
      return {
        profile,
        ledeFraming: (subject) =>
          `${name} is leading the editorial read on ${subject} — strategic, clean, operator-grade.`,
        contextLine: (subject) =>
          `For the Haven Media Group desk, ${subject} sits inside a wider company-building and media-industry picture. We read it that way.`,
        closer: (subject) =>
          `${name} will update ${subject} as verified context, operator commentary, and strategic implications develop.`,
        socialOpener: (subject) =>
          `${name}'s operator read on ${subject} is published.`,
        hashtagSeed: fmtHashtags(name, ["#Media", "#Strategy", "#HMG"]),
        doNotClaim: [
          ...BASE.doNotClaim,
          "Do not assert internal company strategy without attribution.",
        ],
      };
  }
}
