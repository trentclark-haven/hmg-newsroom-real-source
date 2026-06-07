/**
 * Max Content-to-Money Translator
 *
 * Turns editorial content ideas into structured revenue opportunities.
 * Deterministic — no model calls.
 * Truth label: Local Max Intelligence
 */

export type ContentInputType =
  | "article"
  | "source-note"
  | "social-post"
  | "video-clip"
  | "interview"
  | "event";

export interface ContentToMoneyResult {
  inputType: ContentInputType;
  whatTheContentIs: string;
  whoTheAudienceIs: string;
  whatSponsorWouldBuy: string;
  whatFounderShouldPackage: string;
  whatAssetToCreate: string;
  whatToAvoid: string;
  followUpAngle: string;
  possibleVerticals: string[];
  oneLinePitchStarter: string;
  createdAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Keyword detection helpers
// ──────────────────────────────────────────────────────────────────────────────

const HH_SIGNALS = ["hip hop", "hiphop", "rap", "rapper", "album", "mixtape", "verse", "bars", "trap", "drill", "lyric"];
const MH_SIGNALS = ["music", "artist", "song", "single", "tour", "concert", "streaming", "playlist", "r&b", "pop", "indie"];
const HS_SIGNALS = ["sport", "nba", "nfl", "nhl", "mlb", "athlete", "player", "draft", "trade", "game", "match", "league"];
const LA_SIGNALS = ["los angeles", "la", "compton", "inglewood", "watts", "crenshaw", "leimert", "dtla", "hollywood", "south la"];
const LOCAL_BIZ = ["restaurant", "store", "shop", "local", "business", "brand", "startup", "founder", "owner", "entrepreneur"];

function hasAny(text: string, signals: string[]): boolean {
  const lower = text.toLowerCase();
  return signals.some((s) => lower.includes(s));
}

function detectVerticals(text: string): string[] {
  const verticals: string[] = [];
  if (hasAny(text, HH_SIGNALS)) verticals.push("HipHopHaven");
  if (hasAny(text, MH_SIGNALS)) verticals.push("MusicHaven");
  if (hasAny(text, HS_SIGNALS)) verticals.push("HavenSports");
  if (hasAny(text, LA_SIGNALS)) verticals.push("HavenLA");
  if (hasAny(text, LOCAL_BIZ)) verticals.push("LocalHaven");
  if (verticals.length === 0) verticals.push("HMG Master Brand");
  return verticals;
}

// ──────────────────────────────────────────────────────────────────────────────
// Input-type templates
// ──────────────────────────────────────────────────────────────────────────────

const TEMPLATES: Record<ContentInputType, {
  whatItIs: (text: string) => string;
  audience: string;
  sponsorBuys: string;
  founderPackages: string;
  assetToCreate: string;
  avoid: string;
  followUp: string;
  pitchStarter: string;
}> = {
  article: {
    whatItIs: (t) => `An editorial article — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Readers who trust HMG editorial voice. Music fans, culture consumers, and community followers who want context, not just news.",
    sponsorBuys: "Branded content placement, sponsored article section, native ad adjacent to editorial. The editorial credibility makes the buy cleaner.",
    founderPackages: "Sponsored article package: 1 branded article + 3 social posts + newsletter mention. Repeatable monthly.",
    assetToCreate: "Polished article draft → Output History → WordPress publish. Screenshot the published piece for sponsor proof.",
    avoid: "Don't sell the article without packaging it. One-off article deals leave money on the table.",
    followUp: "After publish, send the coverage link to any relevant manager, publicist, or brand contact.",
    pitchStarter: "We published a piece your audience already found. Here's where it fits a sponsored placement.",
  },
  "source-note": {
    whatItIs: (t) => `A raw source or tip — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Insider audience — people who value being first. The scoop is the asset.",
    sponsorBuys: "Breaking news adjacency. A brand positioned next to a scoop gets credibility. The speed is the value.",
    founderPackages: "Breaking news package: first-to-publish article + social clip + exclusive commentary. Short shelf life — move fast.",
    assetToCreate: "Article draft first. Move it to Output History. Then social caption. Keep the package tight.",
    avoid: "Don't sit on a source note. The window is short. Package or pass.",
    followUp: "Who gave you this? That's the relationship. Follow up with editorial gratitude first, revenue conversation second.",
    pitchStarter: "We broke this story. Audience was here first. The sponsor spot has built-in credibility.",
  },
  "social-post": {
    whatItIs: (t) => `A social post or social content idea — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Social-first audience — platform followers, short-form consumers, culture observers.",
    sponsorBuys: "Social integration, brand mention, product placement in the post, or sponsored content series.",
    founderPackages: "Social content package: 5 posts + 1 branded reel + brand mention in bio. Monthly retainer model.",
    assetToCreate: "Social caption from Social Factory → Output History → manual publish. Screenshot + archive for sponsor deck.",
    avoid: "Don't sell a single post. Sell the series, the theme, or the franchise. One post is a sample, not a product.",
    followUp: "Track engagement. High-performing organic posts become the proof point for the sponsor pitch.",
    pitchStarter: "This content format already connects with our audience. Here's the branded version.",
  },
  "video-clip": {
    whatItIs: (t) => `A video clip concept or footage idea — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Video-first audience — YouTube viewers, Reels consumers, TikTok-adjacent. Visual culture consumers.",
    sponsorBuys: "Pre-roll sponsorship, in-video brand mention, branded intro/outro, product placement in the clip.",
    founderPackages: "Video series package: 4 clips per month + brand integration + social amplification. Monthly retainer.",
    assetToCreate: "Clip plan in CutMaster → hook script → caption in Social Factory → Output History. Then manual publish.",
    avoid: "Don't pitch a sponsor on a one-off clip. The value is the series. Build 3 episodes before the pitch.",
    followUp: "The clip is the proof. Use views and engagement to set up the sponsor conversation — not the other way around.",
    pitchStarter: "Our video format delivers audience moments brands want to be adjacent to. Here's the integration option.",
  },
  interview: {
    whatItIs: (t) => `An interview opportunity or guest angle — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Audience loyal to the subject. Fans, followers, and cultural observers who trust HMG for access.",
    sponsorBuys: "Interview sponsorship, brand integration in the feature, sponsored distribution of the piece.",
    founderPackages: "Interview package: article + pull quotes for social + clip from interview + distribution. One-time or series.",
    assetToCreate: "Interview notes → article draft → Output History → WordPress. Pull 3 social quotes. Build the clip if video.",
    avoid: "Don't let the interview sit in drafts. The moment passes. Package it the same week.",
    followUp: "The subject gets the link. That's the warm relationship moment. Revenue conversation comes after.",
    pitchStarter: "We have access. The audience already shows up for this. A sponsor slot is positioned inside that moment.",
  },
  event: {
    whatItIs: (t) => `An event idea, activation, or live opportunity — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Local, engaged, in-person audience. The most valuable audience in media — they showed up.",
    sponsorBuys: "Event title sponsorship, venue activation, product sampling, branded experience, live content rights.",
    founderPackages: "Event package: title sponsor + on-site branding + editorial coverage + post-event content. Full package.",
    assetToCreate: "Event brief → sponsor deck (manual) → coverage plan → output to HMG channels. Document everything.",
    avoid: "Don't run an event without a sponsor conversation first. The production cost is real. The bag needs to be locked.",
    followUp: "Post-event, send coverage to all attending managers, publicists, and brands. That's the next-event pitch.",
    pitchStarter: "We're bringing the audience to you. The activation is the product — here's the structure.",
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Main generator
// ──────────────────────────────────────────────────────────────────────────────

export function translateContentToMoney(
  text: string,
  inputType: ContentInputType,
): ContentToMoneyResult {
  const t = TEMPLATES[inputType];
  const verticals = detectVerticals(text);

  return {
    inputType,
    whatTheContentIs: t.whatItIs(text),
    whoTheAudienceIs: t.audience,
    whatSponsorWouldBuy: t.sponsorBuys,
    whatFounderShouldPackage: t.founderPackages,
    whatAssetToCreate: t.assetToCreate,
    whatToAvoid: t.avoid,
    followUpAngle: t.followUp,
    possibleVerticals: verticals,
    oneLinePitchStarter: t.pitchStarter,
    createdAt: new Date().toISOString(),
  };
}

export function buildContentToMoneyText(result: ContentToMoneyResult): string {
  return `MAX CONTENT-TO-MONEY TRANSLATION
Local Max Intelligence — No Outreach Sent — No CRM Connected

Content Type: ${result.inputType}
Generated: ${new Date(result.createdAt).toLocaleString()}

WHAT THE CONTENT IS
${result.whatTheContentIs}

WHO THE AUDIENCE IS
${result.whoTheAudienceIs}

WHAT A SPONSOR WOULD BUY
${result.whatSponsorWouldBuy}

WHAT FOUNDER SHOULD PACKAGE
${result.whatFounderShouldPackage}

ASSET TO CREATE
${result.whatAssetToCreate}

WHAT TO AVOID
${result.whatToAvoid}

FOLLOW-UP ANGLE
${result.followUpAngle}

POSSIBLE VERTICALS
${result.possibleVerticals.join(", ")}

ONE-LINE PITCH STARTER
"${result.oneLinePitchStarter}"`;
}

export const ALL_INPUT_TYPES: Array<{ type: ContentInputType; label: string }> = [
  { type: "article", label: "Article Idea" },
  { type: "source-note", label: "Source Note / Tip" },
  { type: "social-post", label: "Social Post" },
  { type: "video-clip", label: "Video Clip Idea" },
  { type: "interview", label: "Interview Opportunity" },
  { type: "event", label: "Event / Activation" },
];
