/**
 * Max Sponsor Category Map — deterministic sponsor category suggestions.
 *
 * No real sponsor contacts. No fake brand relationships.
 * These are category intelligence notes for the Founder, not pitches.
 *
 * Truth: Local CRO Review | No Outreach Sent | No CRM Connected
 */

export interface SponsorCategory {
  id: string;
  name: string;
  bestVerticals: string[];
  contentFit: string;
  pitchAngle: string;
  riskNotes: string;
  whatNotToSay: string;
}

export const SPONSOR_CATEGORIES: SponsorCategory[] = [
  {
    id: "music-tech",
    name: "Music Technology",
    bestVerticals: ["HipHopHaven", "The Music Desk"],
    contentFit: "Artist profiles, studio sessions, gear reviews, producer content",
    pitchAngle: "HMG reaches working artists and fans who buy the tools they see in use. Authentic placement — no fake endorsement.",
    riskNotes: "Avoid platforms with questionable royalty practices — can alienate music audience.",
    whatNotToSay: "Don't claim exclusive artist partnerships you don't have. Don't fake endorsement deals.",
  },
  {
    id: "headphones-audio",
    name: "Headphones / Audio Gear",
    bestVerticals: ["HipHopHaven", "The Music Desk", "Sports Haven"],
    contentFit: "Studio sessions, DJ sets, workout content, commute lifestyle",
    pitchAngle: "HMG's audience lives in headphones. Organic placement in content beats banner ads every time.",
    riskNotes: "Mid-range brands are more approachable than premium — match price point to audience income signal.",
    whatNotToSay: "Don't oversell reach numbers you can't verify. Don't promise exclusivity you can't deliver.",
  },
  {
    id: "streetwear",
    name: "Streetwear",
    bestVerticals: ["HipHopHaven", "The Music Desk"],
    contentFit: "Artist features, event coverage, style profiles, cultural moments",
    pitchAngle: "Streetwear is cultural currency. HipHopHaven gives brands a credible editorial lane, not a billboard.",
    riskNotes: "Authenticity matters more than reach here. A corny placement is worse than no placement.",
    whatNotToSay: "Don't use 'urban' as a demographic descriptor. Don't fake street credibility.",
  },
  {
    id: "sneakers",
    name: "Sneakers",
    bestVerticals: ["HipHopHaven", "Sports Haven"],
    contentFit: "Release coverage, athlete features, sneaker culture moments",
    pitchAngle: "Sneaker culture drives massive engagement. HMG covers the moments that matter to buyers.",
    riskNotes: "Resell market is polarizing — frame around culture, not investment.",
    whatNotToSay: "Don't claim you move product. Don't fake influence numbers. Don't promise sell-through.",
  },
  {
    id: "sports-apparel",
    name: "Sports Apparel",
    bestVerticals: ["Sports Haven", "FitHaven"],
    contentFit: "Athlete profiles, game coverage, training content, performance features",
    pitchAngle: "HMG covers the athletes these brands want to reach. Editorial credibility beats ad placement.",
    riskNotes: "Major brand deals require agency relationships — start with local/regional brands.",
    whatNotToSay: "Don't promise athlete exclusives you haven't confirmed. Don't fake partnership announcements.",
  },
  {
    id: "cannabis",
    name: "Cannabis",
    bestVerticals: ["CannaHaven"],
    contentFit: "Product reviews, culture features, dispensary spotlights, wellness angles",
    pitchAngle: "CannaHaven is a dedicated lane — no crossover confusion. Brand-safe within the vertical.",
    riskNotes: "Platform advertiser policies vary. Verify before any digital placement. Legal landscape differs by region.",
    whatNotToSay: "Don't make medical claims. Don't promise platform ad placements that may be blocked.",
  },
  {
    id: "fitness-wellness",
    name: "Fitness / Wellness",
    bestVerticals: ["FitHaven", "Sports Haven"],
    contentFit: "Training features, athlete interviews, supplement reviews, recovery content",
    pitchAngle: "HMG's fitness audience is active and purchase-intent. These brands need editorial credibility, not just impressions.",
    riskNotes: "Supplement claims need care — do not make health claims that could create liability.",
    whatNotToSay: "Don't make nutrition or health claims without verification. Don't fake transformation results.",
  },
  {
    id: "sober-lifestyle",
    name: "Alcohol Alternative / Sober Lifestyle",
    bestVerticals: ["FitHaven", "HipHopHaven"],
    contentFit: "Wellness content, lifestyle features, artist sobriety stories, festival coverage",
    pitchAngle: "Growing category. HMG can own this lane authentically — especially for artists open about sobriety.",
    riskNotes: "Handle personal stories with care. Never out anyone's sobriety publicly without consent.",
    whatNotToSay: "Don't make it preachy. Don't push a narrative on artists who haven't embraced it.",
  },
  {
    id: "local-restaurants",
    name: "Local Restaurants",
    bestVerticals: ["HMG Master Brand", "HipHopHaven"],
    contentFit: "Event catering, artist dinner features, local culture pieces",
    pitchAngle: "Local businesses want local media. HMG is the credible local media option in its market.",
    riskNotes: "Low deal value but high relationship value. These become referral anchors.",
    whatNotToSay: "Don't promise foot traffic numbers. Don't imply editorial coverage is part of the deal.",
  },
  {
    id: "venues",
    name: "Venues",
    bestVerticals: ["HipHopHaven", "The Music Desk", "Sports Haven"],
    contentFit: "Event coverage, behind-the-scenes, venue profiles, exclusive access",
    pitchAngle: "Venues need content. HMG needs access. The trade is clean — editorial coverage for exclusive media access.",
    riskNotes: "Don't blur editorial and advertising in venue content without disclosure.",
    whatNotToSay: "Don't promise ticket sales. Don't fake event exclusivity.",
  },
  {
    id: "festivals-events",
    name: "Festivals / Events",
    bestVerticals: ["HipHopHaven", "The Music Desk", "Sports Haven"],
    contentFit: "Event previews, live coverage, recap packages, artist interview access",
    pitchAngle: "Events need media partners. HMG provides editorial coverage with social distribution — not a press release service.",
    riskNotes: "Clearly separate media partnership from ad buy. Maintain editorial independence.",
    whatNotToSay: "Don't promise press credentialing you haven't confirmed. Don't overcommit on coverage scope.",
  },
  {
    id: "gaming",
    name: "Gaming",
    bestVerticals: ["Sports Haven", "HipHopHaven"],
    contentFit: "Gaming lifestyle, athlete gaming, esports adjacency, gaming culture moments",
    pitchAngle: "Gaming culture overlaps heavily with HMG's core demographic. Natural extension, not a stretch.",
    riskNotes: "Esports deal structures are complex — get legal review before any formal agreement.",
    whatNotToSay: "Don't claim gaming audience if you haven't built it yet. Don't fake esports credibility.",
  },
  {
    id: "creator-tools",
    name: "Creator Tools",
    bestVerticals: ["HMG Master Brand", "HipHopHaven"],
    contentFit: "Behind-the-scenes, production process, creator story features",
    pitchAngle: "HMG is a media operation. Creator tool brands reach the right operator audience through authentic use-case coverage.",
    riskNotes: "Disclose when a tool is a sponsor — audience trusts transparency more than mystery.",
    whatNotToSay: "Don't fake organic use of a tool you've never used. Don't oversell creator reach.",
  },
  {
    id: "camera-video-gear",
    name: "Cameras / Video Gear",
    bestVerticals: ["HMG Master Brand", "The Music Desk"],
    contentFit: "Production content, behind-the-scenes, video quality showcases",
    pitchAngle: "HMG produces video. The gear it uses is authentic proof of concept — not an ad.",
    riskNotes: "Only promote gear you actually use or plan to use. Fake endorsements erode trust fast.",
    whatNotToSay: "Don't claim professional film credits you don't have. Don't fake production scale.",
  },
  {
    id: "auto-lifestyle",
    name: "Cars / Auto Lifestyle",
    bestVerticals: ["HipHopHaven", "Sports Haven"],
    contentFit: "Artist car culture, athlete lifestyle, event coverage",
    pitchAngle: "Auto lifestyle is aspirational content that HMG's audience already consumes. Brand placement feels natural.",
    riskNotes: "Don't endorse specific financing or lease deals without legal review.",
    whatNotToSay: "Don't promise specific impressions. Don't fake luxury lifestyle access.",
  },
  {
    id: "streaming-entertainment",
    name: "Streaming / Entertainment",
    bestVerticals: ["HipHopHaven", "The Music Desk", "Sports Haven"],
    contentFit: "Content premieres, exclusive interviews, streaming culture",
    pitchAngle: "Streaming platforms need editorial coverage. HMG provides context and culture, not just press releases.",
    riskNotes: "Streaming companies have legal and PR teams — all partnerships must go through their official channels.",
    whatNotToSay: "Don't claim unreleased content access you haven't confirmed. Don't fake streaming numbers.",
  },
  {
    id: "education-workforce",
    name: "Education / Workforce",
    bestVerticals: ["HMG Master Brand", "FitHaven"],
    contentFit: "Success stories, career features, skills development content",
    pitchAngle: "HMG's audience is working and career-building. Education brand alignment adds credibility.",
    riskNotes: "For-profit education brands carry reputation risk — vet carefully before partnering.",
    whatNotToSay: "Don't imply income guarantees from any education program. Don't fake success metrics.",
  },
  {
    id: "veteran-owned",
    name: "Veteran-Owned Businesses",
    bestVerticals: ["HMG Master Brand", "Sports Haven"],
    contentFit: "Business spotlights, community features, service stories",
    pitchAngle: "Veteran-owned business coverage builds community trust and opens doors to a highly loyal customer base.",
    riskNotes: "Vet the veteran ownership claim — some businesses misuse the designation.",
    whatNotToSay: "Don't exploit military service for marketing without genuine respect and accuracy.",
  },
  {
    id: "black-owned",
    name: "Black-Owned Businesses",
    bestVerticals: ["HipHopHaven", "HMG Master Brand"],
    contentFit: "Business spotlights, founder stories, community investment features",
    pitchAngle: "HMG is positioned to authentically cover Black-owned businesses — this is culture, not marketing.",
    riskNotes: "Don't tokenize. Don't make it a trend piece. These businesses deserve editorial respect.",
    whatNotToSay: "Don't use this as a clout move. Don't promise community reach you can't deliver.",
  },
  {
    id: "local-la",
    name: "Local LA Businesses",
    bestVerticals: ["HMG Master Brand", "HipHopHaven"],
    contentFit: "Local culture, neighborhood features, LA scene coverage",
    pitchAngle: "HMG is an LA media operation. Local brands want local media partners who actually understand the market.",
    riskNotes: "Don't overpromise hyper-local reach. Be honest about digital vs. physical footprint.",
    whatNotToSay: "Don't fake LA credentials if the brand is remote. Don't promise street-level access you don't have.",
  },
];

export function getCategoriesForVertical(silo: string): SponsorCategory[] {
  const lower = silo.toLowerCase();
  return SPONSOR_CATEGORIES.filter((c) =>
    c.bestVerticals.some((v) => v.toLowerCase().includes(lower.split("-")[0])),
  );
}

export function getCategoriesForText(text: string): SponsorCategory[] {
  const lower = text.toLowerCase();
  const scored = SPONSOR_CATEGORIES.map((cat) => {
    let score = 0;
    const terms = [
      ...cat.name.toLowerCase().split(/\W+/),
      ...cat.contentFit.toLowerCase().split(/\W+/),
    ];
    terms.forEach((t) => {
      if (t.length > 3 && lower.includes(t)) score++;
    });
    return { cat, score };
  });
  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.cat);
}
