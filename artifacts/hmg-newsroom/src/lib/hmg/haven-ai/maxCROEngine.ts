/**
 * Max CRO Engine — deterministic local CRO review generator.
 *
 * Produces an 8-section revenue intelligence brief from a Source Intake item.
 * No model calls. No fake outreach. No fake CRM. No fake deal status.
 * All output is local, deterministic, and Founder-reviewed before action.
 *
 * Truth labels:
 *   - Local CRO Review
 *   - Founder Review Required
 *   - No Outreach Sent
 *   - No CRM Connected
 *   - Future Relationship Database Hook Pending
 */

export const CRO_REVENUE_KEYWORDS = [
  "sponsor",
  "brand",
  "business",
  "relationship",
  "partnership",
  "event",
  "interview",
  "artist",
  "team",
  "manager",
  "publicist",
  "product",
  "venue",
  "media opportunity",
  "revenue",
  "advertiser",
  "ad ",
  "sales",
  "deal",
  "money",
  "collab",
  "campaign",
  "activation",
  "merch",
  "consulting",
  "live ",
  "package",
  "pitch",
];

export function detectRevenueSignals(text: string): string[] {
  const lower = text.toLowerCase();
  return CRO_REVENUE_KEYWORDS.filter((kw) => lower.includes(kw));
}

export function hasRevenueSignal(text: string): boolean {
  return detectRevenueSignals(text).length > 0;
}

export type CROStatus =
  | "Revenue Review Needed"
  | "Max Review Drafted"
  | "Founder Review Required"
  | "Saved to Output History"
  | "Relationship Follow-Up Needed"
  | "Ignore / No Money Move";

export interface CROSection {
  id: string;
  title: string;
  body: string;
}

export interface CROReview {
  sponsorAngle: string;
  relationshipFollowUp: string;
  contentToRevenue: string;
  brandPartnership: string;
  offlineMoneyPlay: string;
  whatToIgnore: string;
  founderNextMove: string;
  riskReputationNote: string;
}

export interface MaxCROBrief {
  id: string;
  createdAt: number;
  sourceText: string;
  signals: string[];
  status: CROStatus;
  review: CROReview | null;
  silo: string;
  siloName: string;
  founderNote: string;
}

const HMG_VERTICALS: Record<string, string> = {
  hiphop: "HipHopHaven — Hip-Hop / Rap",
  rap: "HipHopHaven — Hip-Hop / Rap",
  music: "The Music Desk — General Music",
  sports: "Sports Haven",
  fitness: "FitHaven — Fitness & Wellness",
  cannabis: "CannaHaven — Cannabis",
  entertainment: "HMG Entertainment",
  lifestyle: "HMG Lifestyle",
};

function pickVertical(text: string): string {
  const lower = text.toLowerCase();
  if (/(hip.hop|rap|rapper|beat|trap|drill|verse|freestyle|cypher)/.test(lower))
    return "HipHopHaven — Hip-Hop / Rap";
  if (/(sport|athlete|nba|nfl|mlb|mma|fight|game|team|league|draft|trade)/.test(lower))
    return "Sports Haven";
  if (/(fitness|gym|workout|training|health|wellness|nutrition|supplement)/.test(lower))
    return "FitHaven — Fitness & Wellness";
  if (/(cannabis|weed|cbd|dispensary|strain|420|marijuana)/.test(lower))
    return "CannaHaven — Cannabis";
  if (/(music|artist|album|single|tour|concert|label|streaming|playlist)/.test(lower))
    return "The Music Desk";
  return "HMG Master Brand";
}

function pickSponsorCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/(fitness|gym|supplement|protein|health|wellness|workout)/.test(lower))
    return "Health & wellness brands, supplement companies, gym apparel";
  if (/(cannabis|cbd|dispensary)/.test(lower))
    return "Legal cannabis brands, CBD producers, lifestyle cannabis accessories";
  if (/(sport|athlete|nba|nfl|draft)/.test(lower))
    return "Sports apparel, energy drinks, sports tech, betting platforms";
  if (/(music|concert|tour|festival|album)/.test(lower))
    return "Music streaming platforms, audio gear brands, music tech companies";
  if (/(hip.hop|rap|rapper|trap)/.test(lower))
    return "Fashion brands, sneaker companies, streaming services, lifestyle beverages";
  return "Local businesses, media partners, lifestyle brands targeting HMG's audience";
}

function pickOfflinePlay(text: string): string {
  const lower = text.toLowerCase();
  if (/(event|concert|festival|show|live)/.test(lower))
    return "Live event sponsorship, event recap package, branded coverage deal";
  if (/(interview|exclusive|sit.down|one.on.one)/.test(lower))
    return "Exclusive interview package, media package sale, editorial sponsorship";
  if (/(artist|musician|rapper|performer)/.test(lower))
    return "Artist management consulting, content licensing, brand partnership facilitation";
  if (/(venue|location|space|club|studio)/.test(lower))
    return "Venue partnership, branded content shoot, recurring media residency";
  if (/(product|launch|drop|release|collab)/.test(lower))
    return "Product launch coverage package, affiliate deal, sponsored review";
  return "Local market activation, consulting package, or media partnership conversation";
}

function pickIgnoreNote(text: string): string {
  const lower = text.toLowerCase();
  if (/(drama|beef|controversy|beef|fight|beef)/.test(lower))
    return "Don't monetize controversy without Founder sign-off — reputation risk is real.";
  if (/(small|micro|tiny|unknown|nobody)/.test(lower))
    return "Small audience play — not worth pitching sponsors until reach is proven.";
  return "Skip chasing brand names that are too big for cold outreach with no existing relationship.";
}

function pickRiskNote(text: string): string {
  const lower = text.toLowerCase();
  if (/(politics|politician|election|vote)/.test(lower))
    return "Political adjacency — any sponsor play here could alienate HMG's audience. Flag for Founder.";
  if (/(beef|drama|controversy|arrest|lawsuit)/.test(lower))
    return "This source involves controversy. Selling against controversy without alignment reads desperate. Hold.";
  if (/(cannabis|weed|420|marijuana)/.test(lower))
    return "Cannabis-adjacent deals may conflict with platform advertiser policies. Verify before pitching.";
  return "Avoid pricing yourself out of early relationships. First deal builds the template — keep it real.";
}

export function runMaxCROReview(sourceText: string): CROReview {
  const signals = detectRevenueSignals(sourceText);
  const vertical = pickVertical(sourceText);
  const sponsorCat = pickSponsorCategory(sourceText);
  const offlinePlay = pickOfflinePlay(sourceText);
  const ignoreNote = pickIgnoreNote(sourceText);
  const riskNote = pickRiskNote(sourceText);

  const hasInterview = /interview|sit.down|exclusive|one.on.one/i.test(sourceText);
  const hasEvent = /event|concert|festival|show|live|activation/i.test(sourceText);
  const hasPartner = /partner|collab|brand|sponsor|deal/i.test(sourceText);
  const hasRelationship = /manager|publicist|agent|contact|relationship|team/i.test(sourceText);

  return {
    sponsorAngle: `${sponsorCat} would care about this. ${vertical} audience aligns with brands targeting ${/fitness|health/.test(sourceText.toLowerCase()) ? "active lifestyle consumers" : /sport/i.test(sourceText) ? "sports & gaming fans" : /hip.hop|rap/i.test(sourceText) ? "urban culture consumers 18–35" : "engaged media consumers"}.${hasEvent ? " Event tie-in creates a natural package hook." : ""}`,

    relationshipFollowUp: hasRelationship
      ? "A manager, publicist, or team rep is in the mix. Log the name and note the touch point. No cold DM until Founder approves approach and tone. Mark follow-up as Pending — Founder Review Required."
      : hasInterview
      ? "If you have a contact for this, it's worth a warm message — not cold email. Frame it as editorial interest first. Revenue conversation comes second after relationship is confirmed."
      : "No direct relationship signal. Map who the decision-maker is before initiating any outreach. Do not reach out without Founder sign-off.",

    contentToRevenue: `This ${hasInterview ? "interview" : hasEvent ? "event" : "story"} can become a sales asset three ways: (1) Sponsored content edition — brand underwrites the piece for reach. (2) Social clip package — short video + captions sold as a brand touchpoint. (3) Founder-to-brand pitch — use this as proof-of-concept in a partnership deck. None of these require outreach today — build the content first.`,

    brandPartnership: `Best fit vertical: ${vertical}. ${hasPartner ? "There is a partnership signal in this source. This is worth a short pitch note — one paragraph, no rate card yet." : "No direct partnership signal, but the topic creates an opening. Identify one local business in the category and keep them in mind for future pitches."} HMG offers editorial sponsorship, social distribution, and event coverage packages — no fake rate cards attached here.`,

    offlineMoneyPlay: offlinePlay,

    whatToIgnore: `${ignoreNote} Do not pitch to more than one brand in the same category at the same time — exclusive relationships are worth more. Do not fake a deal that isn't real. Do not post about a partnership until Founder signs off.`,

    founderNextMove: hasInterview
      ? "Book the interview first. Build the content. Then evaluate the revenue play once the piece is live."
      : hasEvent
      ? "Get the event details confirmed. Reach out to the venue or organizer for media credentials first. Revenue conversation comes after access is secured."
      : hasPartner || hasRelationship
      ? "Add this contact/opportunity to your follow-up tracker manually. Set a reminder for 7 days. No outreach until you have a warm intro or direct relationship."
      : "Save this source to the Knowledge Base. Flag the revenue angle. Come back to it when you have a piece published that proves the audience match.",

    riskReputationNote: riskNote,
  };
}

export function buildCROBriefText(item: MaxCROBrief): string {
  if (!item.review) return `Source: ${item.sourceText}\nStatus: ${item.status}`;
  const r = item.review;
  return [
    `MAX CRO REVENUE BRIEF`,
    `Generated: ${new Date(item.createdAt).toLocaleString()}`,
    `Source: ${item.sourceText}`,
    `Vertical / Brand: ${item.siloName || "HMG Master Brand"}`,
    `Revenue Signals: ${item.signals.join(", ") || "none detected"}`,
    `Status: ${item.status}`,
    ``,
    `1. SPONSOR ANGLE`,
    r.sponsorAngle,
    ``,
    `2. RELATIONSHIP FOLLOW-UP`,
    r.relationshipFollowUp,
    ``,
    `3. CONTENT-TO-REVENUE MOVE`,
    r.contentToRevenue,
    ``,
    `4. BRAND PARTNERSHIP IDEA`,
    r.brandPartnership,
    ``,
    `5. OFFLINE MONEY PLAY`,
    r.offlineMoneyPlay,
    ``,
    `6. WHAT TO IGNORE`,
    r.whatToIgnore,
    ``,
    `7. FOUNDER NEXT MOVE`,
    r.founderNextMove,
    ``,
    `8. RISK / REPUTATION NOTE`,
    r.riskReputationNote,
    ``,
    `--- TRUTH LABELS ---`,
    `Local CRO Review | Founder Review Required | No Outreach Sent | No CRM Connected | Future Relationship Database Hook Pending`,
  ].join("\n");
}
