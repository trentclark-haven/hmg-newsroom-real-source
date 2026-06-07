/**
 * Max Content-to-Money Translator — Final Overdrive
 *
 * 13 content types. Richer output fields.
 * Gossip-heavy warning. Controversy caution. Evergreen → franchise routing.
 * Timely → fast social. Brands/venues → follow-up. Artists → relationship map.
 * Low sponsor value — says so plainly.
 * Deterministic — no model calls.
 * Truth label: Local Max Intelligence
 */

export type ContentInputType =
  | "breaking-story"
  | "exclusive-source-note"
  | "interview"
  | "social-clip"
  | "explainer"
  | "opinion-founder-commentary"
  | "list-roundup"
  | "event-coverage"
  | "local-la-angle"
  | "sports-crossover"
  | "music-business-angle"
  | "artist-development-angle"
  | "brand-partnership-angle";

export interface ContentToMoneyResult {
  inputType: ContentInputType;
  inputTypeName: string;
  whatTheContentIs: string;
  whoTheAudienceIs: string;
  sponsorType: string;
  sponsorCategory: string;
  packageIdea: string;
  assetToCreate: string;
  clipSocialAngle: string;
  wpNewsletterAngle: string;
  relationshipAngle: string;
  followUpAngle: string;
  riskNote: string;
  whatNotToSell: string;
  primaryVertical: string;
  secondaryVertical: string;
  oneLinePitchStarter: string;
  warningFlags: string[];
  createdAt: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Keyword helpers
// ──────────────────────────────────────────────────────────────────────────────

function hasAny(text: string, signals: string[]): boolean {
  const lower = text.toLowerCase();
  return signals.some((s) => lower.includes(s));
}

const HH_SIGNALS = ["hip hop", "hiphop", "rap", "rapper", "album", "mixtape", "verse", "bars", "trap", "drill", "lyric", "beef rap", "diss track"];
const MH_SIGNALS = ["music", "artist", "song", "single", "tour", "concert", "streaming", "playlist", "r&b", "pop", "indie", "label", "a&r"];
const HS_SIGNALS = ["sport", "nba", "nfl", "nhl", "mlb", "athlete", "player", "draft", "trade", "game", "match", "league", "college", "ncaa"];
const LA_SIGNALS = ["los angeles", " la ", "compton", "inglewood", "watts", "crenshaw", "leimert", "dtla", "hollywood", "south la", "east la", "west adams"];
const GOSSIP_SIGNALS = ["beef", "feud", "drama", "clap back", "shots fired", "exposed", "blasted", "went off", "beef tweet", "diss"];
const CONTROVERSY_SIGNALS = ["controversial", "problematic", "backlash", "canceled", "problematic", "offensive", "called out"];
const EVERGREEN_SIGNALS = ["how to", "guide", "breakdown", "explained", "history of", "what is", "best of", "top 10", "all time"];
const TIMELY_SIGNALS = ["breaking", "just dropped", "announced", "today", "this week", "new album", "new single", "new deal", "just signed"];
const BRAND_SIGNALS = ["brand", "sponsor", "partnership", "deal", "collab", "collaboration", "merch", "endorsed", "ambassador"];
const ARTIST_SIGNALS = ["artist", "rapper", "singer", "producer", "dj", "musician", "performer", "celebrity", "talent"];
const VENUE_EVENT_SIGNALS = ["event", "venue", "concert", "show", "festival", "tour", "performance", "panel", "summit", "pop-up"];

function detectWarnings(text: string): string[] {
  const warnings: string[] = [];
  if (hasAny(text, GOSSIP_SIGNALS)) warnings.push("Gossip-heavy content: sponsor risk is elevated. Do not attach HMG brand to pure beef content without editorial purpose.");
  if (hasAny(text, CONTROVERSY_SIGNALS)) warnings.push("Controversy content: approach with caution. Cover the news; don't amplify the drama. Brand safety check required.");
  if (!hasAny(text, BRAND_SIGNALS) && !hasAny(text, VENUE_EVENT_SIGNALS) && !hasAny(text, ARTIST_SIGNALS)) warnings.push("Low direct sponsor signal in this content. The audience is the value — not the specific topic.");
  return warnings;
}

function detectPrimaryVertical(text: string): string {
  if (hasAny(text, HH_SIGNALS)) return "HipHopHaven";
  if (hasAny(text, MH_SIGNALS)) return "MusicHaven";
  if (hasAny(text, HS_SIGNALS)) return "HavenSports";
  if (hasAny(text, LA_SIGNALS)) return "HavenLA";
  return "HMG Master Brand";
}

function detectSecondaryVertical(text: string, primary: string): string {
  const options = ["HipHopHaven", "MusicHaven", "HavenSports", "HavenLA", "HMG Master Brand"];
  for (const v of options) {
    if (v !== primary) {
      if (v === "HipHopHaven" && hasAny(text, HH_SIGNALS)) return v;
      if (v === "MusicHaven" && hasAny(text, MH_SIGNALS)) return v;
      if (v === "HavenSports" && hasAny(text, HS_SIGNALS)) return v;
      if (v === "HavenLA" && hasAny(text, LA_SIGNALS)) return v;
    }
  }
  return "HMG Master Brand";
}

// ──────────────────────────────────────────────────────────────────────────────
// Templates per content type
// ──────────────────────────────────────────────────────────────────────────────

type TemplateConfig = {
  name: string;
  whatItIs: (text: string) => string;
  audience: string;
  sponsorType: string;
  sponsorCategory: string;
  packageIdea: string;
  assetToCreate: string;
  clipSocialAngle: string;
  wpNewsletterAngle: string;
  relationshipAngle: string;
  followUp: string;
  riskNote: string;
  whatNotToSell: string;
  pitchStarter: string;
  isTimely?: boolean;
  isEvergreen?: boolean;
  hasArtistAngle?: boolean;
  hasBrandAngle?: boolean;
  hasEventAngle?: boolean;
  lowSponsorValue?: boolean;
};

const TEMPLATES: Record<ContentInputType, TemplateConfig> = {
  "breaking-story": {
    name: "Breaking Story",
    whatItIs: (t) => `Breaking news piece — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Speed-seekers. Audience that wants to be first. Cultural consumers who track the news cycle.",
    sponsorType: "Endemic brands comfortable with news adjacency. Music-tech, streaming platforms.",
    sponsorCategory: "streaming-entertainment, music-tech",
    packageIdea: "Breaking news package: article + social burst + newsletter alert. Time-boxed.",
    assetToCreate: "Article draft → Output History → WordPress publish → social caption. Move fast.",
    clipSocialAngle: "First-to-publish angle. 'We broke it.' Short post, big moment, link in bio.",
    wpNewsletterAngle: "Breaking news post on primary vertical. Newsletter alert if subscriber list exists.",
    relationshipAngle: "The source who gave the tip — that's the relationship to protect and reciprocate.",
    followUp: "After publish, send the coverage link to any relevant manager or publicist. That's the follow-up play.",
    riskNote: "Speed without accuracy is the biggest risk. Verify before publishing. The credibility is the asset.",
    whatNotToSell: "Don't sell sponsored placement directly on breaking news. The editorial independence is the brand value.",
    pitchStarter: "We broke this story. Our audience was here first. The sponsor spot lives in the credibility, not the ad unit.",
    isTimely: true,
  },
  "exclusive-source-note": {
    name: "Exclusive / Source Note",
    whatItIs: (t) => `Exclusive tip or source note — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Insider-first audience. People who follow the source network, not just the headline.",
    sponsorType: "Access-adjacent brands. Music industry brands. Creator economy platforms.",
    sponsorCategory: "music-tech, creator-tools, streaming-entertainment",
    packageIdea: "Exclusive content package: first-to-publish article + pull quotes for social + editorial note to audience.",
    assetToCreate: "Article draft → Output History. Pull 2 social quotes. Keep the source context tight.",
    clipSocialAngle: "'Per sources…' is the hook. Short post with the exclusive angle. Drive to the article.",
    wpNewsletterAngle: "The exclusive post and a newsletter mention of the scoop. Audience context: 'You heard it here.'",
    relationshipAngle: "The source is the relationship. Editorial gratitude before any commercial conversation.",
    followUp: "Follow up with the source with the published link. That's the relationship maintenance move.",
    riskNote: "Sourcing accuracy is critical. 'Reportedly' is a shield. 'Confirmed' is a commitment. Know the difference.",
    whatNotToSell: "Don't sell sponsorships on exclusives — it creates perception that the news was paid for.",
    pitchStarter: "We have access others don't. Our audience trusts our sourcing. The sponsor is adjacent to that trust.",
    isTimely: true,
  },
  "interview": {
    name: "Interview",
    whatItIs: (t) => `Interview opportunity or published interview — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Fans and followers of the subject. Industry observers. Cultural media consumers.",
    sponsorType: "Brands that want celebrity/artist adjacency. Music brands, lifestyle, apparel.",
    sponsorCategory: "streetwear, sneakers, music-tech, streaming-entertainment",
    packageIdea: "Interview package: article + pull quote social posts + clip if video. Optional: sponsored editorial feature.",
    assetToCreate: "Interview notes → article draft → Output History → WordPress. Pull 3 social quotes. Build the clip if video.",
    clipSocialAngle: "Best quote from the interview → Reels/TikTok clip → drive to the full piece.",
    wpNewsletterAngle: "Feature article format. Newsletter introduction: 'We sat down with...' or 'Exclusive: inside the...'",
    relationshipAngle: "The subject and their team — this is the relationship entry point. Editorial coverage before commercial conversation.",
    followUp: "Send the subject the published link. That's the relationship maintenance move. Revenue conversation is second.",
    riskNote: "Don't misquote. Don't over-sensationalize. The subject's trust is the long-term asset.",
    whatNotToSell: "Don't sell sponsorships as 'access' to the subject. Sell the audience, not the celebrity.",
    pitchStarter: "We have access. The audience shows up for this. The sponsor spot is inside that moment.",
    hasArtistAngle: true,
  },
  "social-clip": {
    name: "Social Clip",
    whatItIs: (t) => `Short-form video or social clip concept — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Short-form video audience. Platform-native consumers. Reels, TikTok, YouTube Shorts.",
    sponsorType: "Mobile-first brands. Creator economy platforms. Apparel and lifestyle brands.",
    sponsorCategory: "creator-tools, streetwear, sneakers, streaming-entertainment",
    packageIdea: "Social video series package: 4 clips per month + brand integration + cross-channel amplification.",
    assetToCreate: "Script the hook → CutMaster for clip plan → Social Factory for caption → Output History.",
    clipSocialAngle: "The clip IS the content. Hook in the first 3 seconds. Link in bio for the full piece.",
    wpNewsletterAngle: "Embed the clip in a supporting article. Newsletter: 'Watch this clip from...'",
    relationshipAngle: "Creators and talent in the clip — those are the relationship plays worth logging.",
    followUp: "Track engagement. High-performing organic clips become the sponsor pitch proof points.",
    riskNote: "Platform policy risk if content is borderline. Check guidelines before posting.",
    whatNotToSell: "Don't sell a single clip. Sell the series, the theme, or the franchise.",
    pitchStarter: "Our video format connects with the audience you want. Here's the branded integration.",
  },
  "explainer": {
    name: "Explainer",
    whatItIs: (t) => `Explainer or educational content — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Engaged learners. Audience that wants context, not just news. Culture consumers who trust HMG for depth.",
    sponsorType: "Educational brands. Creator tools. Financial literacy products (vetted). Music education.",
    sponsorCategory: "creator-tools, music-tech",
    packageIdea: "Explainer series: 4-part monthly franchise covering a theme. Sponsor the series, not the individual piece.",
    assetToCreate: "Article → Output History → WordPress. Newsletter angle: 'Here's what you need to know.'",
    clipSocialAngle: "Pull the one-sentence insight from the explainer. Social hook: 'Did you know…'",
    wpNewsletterAngle: "Long-form article on primary vertical. Newsletter: summary + link. Drive email subscribers to the full piece.",
    relationshipAngle: "The experts or sources quoted — those are the relationship plays.",
    followUp: "Evergreen content — track performance monthly. High-traffic explainers become the franchise pitch.",
    riskNote: "Make sure claims are accurate and sourced. Explainers that get facts wrong damage long-term credibility.",
    whatNotToSell: "Don't present opinions as facts in sponsored explainers. Transparency is required.",
    pitchStarter: "Our audience comes to us for context. This explainer series is the franchise a sponsor wants to anchor.",
    isEvergreen: true,
  },
  "opinion-founder-commentary": {
    name: "Opinion / Founder Commentary",
    whatItIs: (t) => `Opinion piece or Founder voice commentary — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Audience that trusts the Founder's editorial voice. Loyal readers and followers.",
    sponsorType: "Brand-safe, credibility-adjacent sponsors. Mission-aligned brands.",
    sponsorCategory: "creator-tools, local-LA, streaming-entertainment",
    packageIdea: "Founder commentary series: monthly perspective pieces with brand sponsor. Founder voice is the product.",
    assetToCreate: "First-person article → Output History → WordPress. Keep the Founder voice clean and unfiltered.",
    clipSocialAngle: "Pull the sharpest line from the commentary → 60-second social take.",
    wpNewsletterAngle: "Featured editorial on primary vertical. Newsletter: direct Founder voice to subscribers.",
    relationshipAngle: "The Founder's voice builds relationships through credibility and consistency.",
    followUp: "High-performing opinion pieces become the pitch for a Founder newsletter or subscriber product.",
    riskNote: "Opinion pieces carry the Founder's personal credibility. What's written can be quoted back.",
    whatNotToSell: "Don't let sponsors dictate the opinion. Founder commentary must be editorially independent.",
    pitchStarter: "The Founder's voice carries editorial authority. Sponsor adjacency is earned, not bought.",
  },
  "list-roundup": {
    name: "List / Roundup",
    whatItIs: (t) => `List or roundup content piece — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Browsers and skimmers. Audience looking for curated recommendations and context.",
    sponsorType: "Product brands that want placement in curated lists. Lifestyle brands. Music products.",
    sponsorCategory: "music-tech, headphones-audio, streetwear, sneakers",
    packageIdea: "Sponsored list series: weekly top-10, monthly roundup, or seasonal best-of. Brand integration in the list.",
    assetToCreate: "Article → Output History → WordPress. Social: 'Top [X] of the week' format works well.",
    clipSocialAngle: "Each item in the list is a potential mini-post. Drip the list across social.",
    wpNewsletterAngle: "List-format article performs well in newsletters. Drive clicks with 'top pick' preview.",
    relationshipAngle: "The brands and artists featured in the list — those are relationship touch-points.",
    followUp: "Track which list items get clicks. That's the editorial signal for the next sponsor pitch.",
    riskNote: "Don't inflate rankings to please a sponsor. The credibility is the asset.",
    whatNotToSell: "Don't sell 'top spot' placement in editorial lists. Readers notice. Credibility dies.",
    pitchStarter: "We curate the list the audience trusts. A sponsor feature in that list is editorial validation.",
    isEvergreen: true,
  },
  "event-coverage": {
    name: "Event Coverage",
    whatItIs: (t) => `Event or live coverage plan — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Live event audience. In-person community. Fans of the artist, venue, or brand.",
    sponsorType: "Event and activation brands. Local businesses. Beverage, apparel, and lifestyle brands.",
    sponsorCategory: "local-LA, streetwear, streaming-entertainment",
    packageIdea: "Event coverage package: pre-event article + live social coverage + post-event recap + sponsor mention.",
    assetToCreate: "Pre-event brief → live social posts → recap article → Output History → WordPress.",
    clipSocialAngle: "Live event clips from the floor. Best moments → Reels within 24 hours.",
    wpNewsletterAngle: "Pre-event article for SEO. Post-event recap with photos for newsletter.",
    relationshipAngle: "Organizers, artists, and venue contacts — all relationship opportunities worth logging.",
    followUp: "Send post-event coverage to all attendees, artists, and organizers. That's the relationship play.",
    riskNote: "Event coverage requires physical presence or a trusted stringer. Confirm before committing.",
    whatNotToSell: "Don't promise editorial coverage as a condition of a sponsor deal. Coverage should be editorially earned.",
    pitchStarter: "We covered the event. Our audience was in the room. The sponsor adjacency is credibility, not advertising.",
    hasEventAngle: true,
  },
  "local-la-angle": {
    name: "Local LA Angle",
    whatItIs: (t) => `Local Los Angeles angle or community story — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "LA-based audience. Black LA community. Local culture and business consumers.",
    sponsorType: "Local LA businesses. Community brands. LA-based lifestyle and music brands.",
    sponsorCategory: "local-LA, streetwear, sneakers",
    packageIdea: "Local LA content package: feature + social coverage + newsletter + community distribution.",
    assetToCreate: "Feature article → Output History → WordPress HavenLA. Social: local community hook.",
    clipSocialAngle: "Local story, local voice. Geo-targeted social post with LA community hook.",
    wpNewsletterAngle: "Feature on HavenLA vertical. Community newsletter with direct local relevance.",
    relationshipAngle: "Local business and community contacts — those are the relationships worth building.",
    followUp: "Local stories build local relationships. Follow up with featured businesses and community figures.",
    riskNote: "Represent the community accurately. Local credibility takes years to build and moments to lose.",
    whatNotToSell: "Don't sell local coverage as advertising. Community stories are editorial, not sponsored.",
    pitchStarter: "We cover the LA community the sponsor wants to reach. Local editorial credibility is the value.",
  },
  "sports-crossover": {
    name: "Sports Crossover",
    whatItIs: (t) => `Sports and culture crossover content — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Sports and culture consumers. NBA/NFL fans who also follow hip-hop and music.",
    sponsorType: "Sports-adjacent brands. Athletic apparel, footwear, sports tech, streaming sports.",
    sponsorCategory: "sneakers, streaming-entertainment, headphones-audio",
    packageIdea: "Sports crossover package: game recap + culture angle + social + athlete relationship play.",
    assetToCreate: "Article → Output History → HavenSports + HipHopHaven cross-post. Social: sports + culture caption.",
    clipSocialAngle: "The culture angle on the sports story. 'Here's what the streets are saying about...'",
    wpNewsletterAngle: "Cross-post to HavenSports and music verticals. Newsletter: 'Sports meets culture' format.",
    relationshipAngle: "Athlete contacts and sports media relationships — those are the relationship opportunities.",
    followUp: "Athletes and their teams follow up editorial coverage. That's the access play.",
    riskNote: "Sports coverage can attract heated takes. Keep the editorial voice professional and sourced.",
    whatNotToSell: "Don't sell sports coverage as a team or league endorsement. Keep editorial independence clear.",
    pitchStarter: "We sit at the intersection of sports and culture. The audience that follows both is the sponsor's target.",
  },
  "music-business-angle": {
    name: "Music Business Angle",
    whatItIs: (t) => `Music industry business story or angle — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Music industry insiders. Artists, managers, A&Rs. Culture business consumers.",
    sponsorType: "Music business tools. Creator economy platforms. Music distribution brands.",
    sponsorCategory: "music-tech, creator-tools, streaming-entertainment",
    packageIdea: "Music business editorial package: industry breakdown + expert commentary + social + newsletter.",
    assetToCreate: "Industry analysis article → Output History → MusicHaven + HipHopHaven. Newsletter: industry context.",
    clipSocialAngle: "'The business behind the music.' Explainer clip format. Drive to the full article.",
    wpNewsletterAngle: "Music business feature on MusicHaven. Newsletter: industry context for the serious music reader.",
    relationshipAngle: "Music industry contacts — managers, A&Rs, label executives — these are the relationship plays.",
    followUp: "Music business contacts often follow strong industry analysis. That's the editorial relationship entry.",
    riskNote: "Business reporting requires sourcing. Don't speculate on deal terms without clear sourcing.",
    whatNotToSell: "Don't let a music brand's PR drive the editorial. Business analysis must be independent.",
    pitchStarter: "We analyze the business of music. Music tech and creator tools belong in this editorial space.",
  },
  "artist-development-angle": {
    name: "Artist Development Angle",
    whatItIs: (t) => `Artist development or emerging talent story — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Music discovery consumers. Tastemaker audience. Industry insiders watching emerging talent.",
    sponsorType: "Brands that want to be first to market with emerging artists. Creator tools. Musical instruments.",
    sponsorCategory: "music-tech, creator-tools, streaming-entertainment",
    packageIdea: "Artist spotlight series: feature + interview + social introduction + follow-up Q&A. Sponsor the series.",
    assetToCreate: "Artist feature article → Output History → Primary vertical. Pull quotes for social. Log the contact.",
    clipSocialAngle: "'Before they blow.' Emerging artist introduction clip. Short form, strong hook.",
    wpNewsletterAngle: "Artist feature on primary vertical. Newsletter: 'One to watch' format.",
    relationshipAngle: "The artist and their team — this is a long-term relationship play. Cover them early, build the lane.",
    followUp: "Follow emerging artists you cover. That's the access investment. When they blow, HMG is already there.",
    riskNote: "Emerging artist coverage can involve unclear rights to footage or images. Confirm before publishing.",
    whatNotToSell: "Don't sell 'hype' for artists who aren't ready. HMG credibility is built on accurate tastemaking.",
    pitchStarter: "We break emerging artists before they hit. The sponsor is first in the room with the audience that matters.",
    hasArtistAngle: true,
  },
  "brand-partnership-angle": {
    name: "Brand Partnership Angle",
    whatItIs: (t) => `Brand partnership or collaborative content — ${t.slice(0, 80)}${t.length > 80 ? "…" : ""}`,
    audience: "Culture consumers who follow brand collaborations. Music and lifestyle brand watchers.",
    sponsorType: "The partner brand itself. Co-sponsors adjacent to the collaboration.",
    sponsorCategory: "streetwear, sneakers, music-tech, streaming-entertainment",
    packageIdea: "Brand collab package: announcement coverage + behind-the-scenes + social campaign + editorial feature.",
    assetToCreate: "Feature article → Output History → Primary vertical. Social: visual-first collab announcement.",
    clipSocialAngle: "The collab reveal moment. First look. Behind-the-scenes clip. Drive audience to the article.",
    wpNewsletterAngle: "Brand partnership feature. Newsletter: first-look for subscribers.",
    relationshipAngle: "Both brand teams involved — those are the contacts worth logging for future sponsor conversations.",
    followUp: "Post-coverage, send to both brand teams. That's the relationship maintenance. Opens doors for future collabs.",
    riskNote: "Brand partnership coverage can blur editorial and advertising lines. Be transparent about the nature of coverage.",
    whatNotToSell: "Don't sell 'positive coverage' guarantees to brand partners. Editorial independence is the value.",
    pitchStarter: "We cover the culture collaborations your audience follows. Editorial adjacency is the sponsor buy.",
    hasBrandAngle: true,
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
  const warnings = detectWarnings(text);
  const primary = detectPrimaryVertical(text);
  const secondary = detectSecondaryVertical(text, primary);

  // Smart routing for timely content
  if (t.isTimely && hasAny(text, ["breaking", "just dropped", "just announced"])) {
    warnings.push("Time-sensitive: move fast. Get to social first, then the full article.");
  }

  // Smart routing for evergreen
  if (t.isEvergreen) {
    warnings.push("Evergreen content: pitch as a franchise. This doesn't expire — build the repeatable structure.");
  }

  // Artist relationship mapping
  if (t.hasArtistAngle && hasAny(text, ["artist", "rapper", "singer", "producer"])) {
    warnings.push("Artist angle: log the contact. Build the editorial relationship before any commercial conversation.");
  }

  // Brand/event follow-up routing
  if ((t.hasBrandAngle || t.hasEventAngle) && hasAny(text, ["brand", "event", "venue", "sponsor"])) {
    warnings.push("Brand or event angle: log all contacts for follow-up. Send coverage links to both teams after publish.");
  }

  return {
    inputType,
    inputTypeName: t.name,
    whatTheContentIs: t.whatItIs(text),
    whoTheAudienceIs: t.audience,
    sponsorType: t.sponsorType,
    sponsorCategory: t.sponsorCategory,
    packageIdea: t.packageIdea,
    assetToCreate: t.assetToCreate,
    clipSocialAngle: t.clipSocialAngle,
    wpNewsletterAngle: t.wpNewsletterAngle,
    relationshipAngle: t.relationshipAngle,
    followUpAngle: t.followUp,
    riskNote: t.riskNote,
    whatNotToSell: t.whatNotToSell,
    primaryVertical: primary,
    secondaryVertical: secondary,
    oneLinePitchStarter: t.pitchStarter,
    warningFlags: warnings,
    createdAt: new Date().toISOString(),
  };
}

export function buildContentToMoneyText(result: ContentToMoneyResult): string {
  const warnings = result.warningFlags.length > 0 ? `\nFLAGS\n${result.warningFlags.map((w) => `⚠ ${w}`).join("\n")}` : "";
  return `MAX CONTENT-TO-MONEY TRANSLATION — Local Max Intelligence
Content Type: ${result.inputTypeName}
Generated: ${new Date(result.createdAt).toLocaleString()}

WHAT THE CONTENT IS
${result.whatTheContentIs}

WHO THE AUDIENCE IS
${result.whoTheAudienceIs}

SPONSOR TYPE
${result.sponsorType} | Category: ${result.sponsorCategory}

PACKAGE IDEA
${result.packageIdea}

ASSET TO CREATE
${result.assetToCreate}

CLIP / SOCIAL ANGLE
${result.clipSocialAngle}

WP / NEWSLETTER ANGLE
${result.wpNewsletterAngle}

RELATIONSHIP ANGLE
${result.relationshipAngle}

FOLLOW-UP ANGLE
${result.followUpAngle}

RISK NOTE
${result.riskNote}

WHAT NOT TO SELL
${result.whatNotToSell}

VERTICALS
Primary: ${result.primaryVertical} | Secondary: ${result.secondaryVertical}

ONE-LINE PITCH STARTER
"${result.oneLinePitchStarter}"
${warnings}

— Local Max Intelligence — No Outreach Sent — No CRM Connected —`;
}

export const ALL_INPUT_TYPES: Array<{ type: ContentInputType; label: string }> = [
  { type: "breaking-story", label: "Breaking Story" },
  { type: "exclusive-source-note", label: "Exclusive / Source Note" },
  { type: "interview", label: "Interview" },
  { type: "social-clip", label: "Social Clip" },
  { type: "explainer", label: "Explainer" },
  { type: "opinion-founder-commentary", label: "Opinion / Commentary" },
  { type: "list-roundup", label: "List / Roundup" },
  { type: "event-coverage", label: "Event Coverage" },
  { type: "local-la-angle", label: "Local LA Angle" },
  { type: "sports-crossover", label: "Sports Crossover" },
  { type: "music-business-angle", label: "Music Business" },
  { type: "artist-development-angle", label: "Artist Development" },
  { type: "brand-partnership-angle", label: "Brand Partnership" },
];
