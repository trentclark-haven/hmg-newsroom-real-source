export type LeadProviderStatus = "future_adapter_only";

export interface LeadProviderAdapter {
  id: string;
  label: string;
  status: LeadProviderStatus;
  supportedInputs: string[];
  note: string;
}

export interface BrandCompatibilityScores {
  FitHaven: number;
  SportsHaven: number;
  MusicHaven: number;
  CannaHaven: number;
}

export interface LocalLeadScoutResult {
  id: string;
  leadName: string;
  category: string;
  address: string;
  website: string;
  revenueEstimate: string;
  sponsorProbability: number;
  compatibility: BrandCompatibilityScores;
  relationshipPotentialScore: number;
  urgencyScore: number;
  estimatedDealValue: string;
  reasoningSummary: string;
  sourceTag: string;
  keywords: string[];
}

export interface LocalLeadScoutRun {
  query: string;
  interpretedIntent: string;
  sourceNotice: string;
  results: LocalLeadScoutResult[];
}

export interface RelationshipProfile {
  id: string;
  name: string;
  role: string;
  skills: string[];
  industry: string;
  notes: string;
  personalityTraits: string[];
  interests: string[];
  lastInteraction: string;
  suggestedOpportunities: string[];
  mutualContacts: string[];
  potentialHmgRelevance: string;
  conversationHistory: string[];
  trustScore: number;
  relationshipScore: number;
  revenueOpportunityScore: number;
}

export interface RelationshipGraphNode {
  id: string;
  label: string;
  type: "trent" | "contact" | "brand" | "company" | "event";
  score?: number;
}

export interface RelationshipGraphEdge {
  from: string;
  to: string;
  label: string;
}

export interface MoneyPlaybookLesson {
  id: string;
  category: string;
  quickLesson: string;
  actionItem: string;
  hmgApplication: string;
  potentialRevenueImpact: string;
  difficulty: "Low" | "Medium" | "High";
  timeEstimate: string;
}

export interface AutopilotItem {
  id: string;
  lane: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  title: string;
  action: string;
  revenueRange: string;
}

export interface RevenueCalendarV2Item {
  id: string;
  moment: string;
  timing: string;
  potentialSponsors: string[];
  contentIdeas: string[];
  projectedRevenue: string;
  leadOpportunities: string[];
  suggestedMeetings: string[];
  actionChecklist: string[];
}

export interface DocumentBrainPipeline {
  id: string;
  inputType: string;
  accepts: string[];
  outputs: string[];
  riskNote: string;
  futureHook: string;
}

export interface PersonalityModeV4 {
  id: string;
  label: string;
  profile: string;
  sampleLine: string;
}

export interface FutureRevenueHookV4 {
  id: string;
  label: string;
  status: "coming_next";
  note: string;
}

export type OpportunityMissionState =
  | "Queued"
  | "Running"
  | "Paused"
  | "Needs Review"
  | "Completed"
  | "Archived";

export interface OpportunityMission {
  id: string;
  missionName: string;
  goal: string;
  regions: string[];
  categories: string[];
  priority: "Critical" | "High" | "Medium" | "Low";
  estimatedValue: string;
  timeStarted: string;
  timeElapsed: string;
  opportunitiesDiscovered: number;
  confidenceScore: number;
  notes: string;
  completionPercentage: number;
  state: OpportunityMissionState;
}

export interface GlobalMarketOpportunity {
  id: string;
  region: string;
  market: string;
  industry: string;
  event: string;
  artists: string[];
  brands: string[];
  festivals: string[];
  estimatedOpportunityValue: string;
  relevanceScore: number;
  summary: string;
}

export interface FestivalArtistOpportunity {
  id: string;
  name: string;
  country: string;
  timing: string;
  estimatedAudience: string;
  sponsorOpportunities: string[];
  mediaOpportunities: string[];
  artistOpportunities: string[];
  interviewOpportunities: string[];
  hmgCompatibilityScore: number;
}

export interface IntroDraft {
  id: string;
  type:
    | "Initial outreach"
    | "Follow-up outreach"
    | "Meeting request"
    | "Sponsor pitch summary"
    | "Event partnership summary"
    | "Media partnership summary"
    | "Sales notes";
  subject: string;
  draft: string;
  nextStep: string;
}

export interface WorkCycle {
  id: string;
  label: string;
  operatingStyle: string;
  bestFor: string;
  output: string;
}

export interface MorningMoneyReport {
  found: string[];
  highValueOpportunities: string[];
  urgentOpportunities: string[];
  followUps: string[];
  potentialRevenue: string;
  newContacts: string[];
  calendarSuggestions: string[];
  recommendedNextActions: string[];
}

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const hasAny = (query: string, keywords: string[]) =>
  keywords.some((keyword) => query.includes(keyword));

export const leadProviderAdapters: LeadProviderAdapter[] = [
  {
    id: "google-places",
    label: "Google Places",
    status: "future_adapter_only",
    supportedInputs: ["local search", "addresses", "maps"],
    note: "Future adapter for real local business discovery. Disabled now.",
  },
  {
    id: "maps",
    label: "Maps",
    status: "future_adapter_only",
    supportedInputs: ["nearby businesses", "drive-time clusters"],
    note: "Future map intelligence hook only.",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    status: "future_adapter_only",
    supportedInputs: ["relationship proximity", "decision makers"],
    note: "Future B2B contact and warm-intro adapter.",
  },
  {
    id: "crunchbase",
    label: "Crunchbase",
    status: "future_adapter_only",
    supportedInputs: ["funded companies", "growth signals"],
    note: "Future funding and company intelligence hook.",
  },
  {
    id: "apollo",
    label: "Apollo",
    status: "future_adapter_only",
    supportedInputs: ["email enrichment", "ICP lists"],
    note: "Future outbound list adapter. No API active.",
  },
  {
    id: "hubspot",
    label: "HubSpot",
    status: "future_adapter_only",
    supportedInputs: ["CRM sync", "deal status"],
    note: "Future CRM sync adapter. Disabled now.",
  },
  {
    id: "eventbrite",
    label: "Eventbrite",
    status: "future_adapter_only",
    supportedInputs: ["local events", "speaking", "sponsors"],
    note: "Future event discovery adapter.",
  },
  {
    id: "rss",
    label: "RSS",
    status: "future_adapter_only",
    supportedInputs: ["public feeds", "industry monitoring"],
    note: "Future source feed adapter.",
  },
  {
    id: "manual-csv",
    label: "Manual CSV Import",
    status: "future_adapter_only",
    supportedInputs: ["lead lists", "sponsor spreadsheets"],
    note: "Future importer for Trent-provided files.",
  },
];

export const leadScoutExamples = [
  "I'm home all day - find Culver City gyms for FitHaven.",
  "Find cannabis brands around LA.",
  "Find SportsHaven Super Bowl sponsors.",
  "Find podcast sponsors.",
  "Find speaking opportunities.",
  "Find hip hop brands.",
];

export const missionCommandExamples = [
  "Max, scour international music markets.",
  "Max, find sponsorship opportunities.",
  "Max, hunt for speaking engagements.",
  "Max, search for fitness partnerships.",
  "Max, locate festival opportunities.",
];

export const missionStateLabels: OpportunityMissionState[] = [
  "Queued",
  "Running",
  "Paused",
  "Needs Review",
  "Completed",
  "Archived",
];

export const globalScoutRegions = [
  "North America",
  "South America",
  "Europe",
  "Africa",
  "Middle East",
  "Asia",
  "Australia",
  "Caribbean",
];

export const localLeadScoutSeeds: LocalLeadScoutResult[] = [
  {
    id: "culver-performance-lab",
    leadName: "Culver Performance Lab",
    category: "Fitness studio",
    address: "Culver City, CA - local lead placeholder",
    website: "https://example.com/culver-performance-lab",
    revenueEstimate: "$1,500-$6,000",
    sponsorProbability: 78,
    compatibility: { FitHaven: 96, SportsHaven: 72, MusicHaven: 36, CannaHaven: 28 },
    relationshipPotentialScore: 74,
    urgencyScore: 88,
    estimatedDealValue: "$4,500",
    reasoningSummary:
      "Strong FitHaven match for transformation content, trainer explainers, and local wellness sponsorship inventory.",
    sourceTag: "local-deterministic-scout",
    keywords: ["culver", "gym", "gyms", "fitness", "fithaven", "wellness", "home all day"],
  },
  {
    id: "westside-recovery-house",
    leadName: "Westside Recovery House",
    category: "Recovery and mobility",
    address: "West LA / Culver City - local lead placeholder",
    website: "https://example.com/westside-recovery-house",
    revenueEstimate: "$2,000-$8,500",
    sponsorProbability: 82,
    compatibility: { FitHaven: 94, SportsHaven: 80, MusicHaven: 34, CannaHaven: 32 },
    relationshipPotentialScore: 70,
    urgencyScore: 84,
    estimatedDealValue: "$6,000",
    reasoningSummary:
      "Recovery brands can underwrite athlete-adjacent FitHaven and SportsHaven content with clean local activation.",
    sourceTag: "local-deterministic-scout",
    keywords: ["culver", "fitness", "recovery", "gym", "sports", "fithaven"],
  },
  {
    id: "la-craft-cannabis-co",
    leadName: "LA Craft Cannabis Co.",
    category: "Cannabis lifestyle brand",
    address: "Los Angeles, CA - local lead placeholder",
    website: "https://example.com/la-craft-cannabis",
    revenueEstimate: "$3,000-$15,000",
    sponsorProbability: 86,
    compatibility: { FitHaven: 24, SportsHaven: 42, MusicHaven: 68, CannaHaven: 96 },
    relationshipPotentialScore: 76,
    urgencyScore: 90,
    estimatedDealValue: "$11,000",
    reasoningSummary:
      "CannaHaven can package compliant culture coverage, 4/20 guides, and event-adjacent sponsor reads.",
    sourceTag: "cannabis-local-mock",
    keywords: ["cannabis", "weed", "la", "cannahaven", "420", "lifestyle"],
  },
  {
    id: "game-day-beverage-stack",
    leadName: "Game Day Beverage Stack",
    category: "Beverage sponsor bucket",
    address: "National / LA activation - sponsor placeholder",
    website: "https://example.com/game-day-beverage-stack",
    revenueEstimate: "$8,000-$35,000",
    sponsorProbability: 88,
    compatibility: { FitHaven: 46, SportsHaven: 97, MusicHaven: 50, CannaHaven: 30 },
    relationshipPotentialScore: 68,
    urgencyScore: 96,
    estimatedDealValue: "$25,000",
    reasoningSummary:
      "Super Bowl inventory is time-sensitive and clean for SportsHaven watch-party, video, and newsletter packages.",
    sourceTag: "sports-seasonal-scout",
    keywords: ["sports", "sportshaven", "super bowl", "sponsor", "beverage", "watch party"],
  },
  {
    id: "creator-tools-podcast-lane",
    leadName: "Creator Tools Podcast Lane",
    category: "Podcast sponsor bucket",
    address: "Remote / national - sponsor placeholder",
    website: "https://example.com/creator-tools-podcast-lane",
    revenueEstimate: "$2,500-$12,000",
    sponsorProbability: 74,
    compatibility: { FitHaven: 42, SportsHaven: 60, MusicHaven: 86, CannaHaven: 38 },
    relationshipPotentialScore: 66,
    urgencyScore: 71,
    estimatedDealValue: "$7,500",
    reasoningSummary:
      "Podcast and creator tools fit HMG interviews, host-read packages, and founder-led media literacy content.",
    sourceTag: "podcast-sponsor-scout",
    keywords: ["podcast", "sponsors", "creator", "tools", "youtube", "media"],
  },
  {
    id: "black-media-leadership-forum",
    leadName: "Black Media Leadership Forum",
    category: "Speaking opportunity",
    address: "Conference / virtual - opportunity placeholder",
    website: "https://example.com/black-media-leadership-forum",
    revenueEstimate: "$1,000-$10,000",
    sponsorProbability: 65,
    compatibility: { FitHaven: 28, SportsHaven: 48, MusicHaven: 82, CannaHaven: 54 },
    relationshipPotentialScore: 88,
    urgencyScore: 73,
    estimatedDealValue: "$5,000",
    reasoningSummary:
      "Trent can speak on Black-owned media, AI newsroom operations, sponsorship packaging, and culture-safe monetization.",
    sourceTag: "speaking-opportunity-scout",
    keywords: ["speaking", "conference", "media", "black", "founder", "opportunities"],
  },
  {
    id: "indie-hip-hop-fashion-collab",
    leadName: "Indie Hip-Hop Fashion Collab",
    category: "Hip-hop brand partnership",
    address: "Los Angeles / Atlanta / remote - brand placeholder",
    website: "https://example.com/indie-hip-hop-fashion",
    revenueEstimate: "$4,000-$22,000",
    sponsorProbability: 79,
    compatibility: { FitHaven: 32, SportsHaven: 44, MusicHaven: 94, CannaHaven: 58 },
    relationshipPotentialScore: 82,
    urgencyScore: 78,
    estimatedDealValue: "$14,000",
    reasoningSummary:
      "MusicHaven can package interviews, editorial drops, social sponsorships, and creator-led merch moments.",
    sourceTag: "hip-hop-brand-scout",
    keywords: ["hip hop", "hip-hop", "music", "brand", "fashion", "musichaven"],
  },
];

export function runLocalLeadScoutEngine(query: string): LocalLeadScoutRun {
  const normalized = query.trim().toLowerCase();
  const safeQuery = normalized || "Find sponsorship opportunities for Haven Media Group";
  const scored = localLeadScoutSeeds
    .map((lead) => {
      const keywordHits = lead.keywords.filter((keyword) => safeQuery.includes(keyword)).length;
      const brandBoost =
        hasAny(safeQuery, ["fithaven", "gym", "fitness", "wellness"]) ? lead.compatibility.FitHaven :
        hasAny(safeQuery, ["sportshaven", "sports", "super bowl", "nba", "nfl"]) ? lead.compatibility.SportsHaven :
        hasAny(safeQuery, ["music", "hip hop", "hip-hop", "festival"]) ? lead.compatibility.MusicHaven :
        hasAny(safeQuery, ["cannabis", "420", "cannahaven"]) ? lead.compatibility.CannaHaven :
        Math.max(...Object.values(lead.compatibility));
      const searchScore = clampScore(keywordHits * 18 + brandBoost * 0.42 + lead.urgencyScore * 0.2);
      return { lead, searchScore };
    })
    .filter(({ searchScore }) => searchScore >= 42)
    .sort((a, b) => b.searchScore - a.searchScore)
    .slice(0, 5)
    .map(({ lead, searchScore }) => ({
      ...lead,
      sponsorProbability: clampScore((lead.sponsorProbability + searchScore) / 2),
    }));

  return {
    query: query.trim(),
    interpretedIntent: inferScoutIntent(safeQuery),
    sourceNotice:
      "Local deterministic scout only. No live internet, map, email, CRM, or provider call is active.",
    results: scored.length ? scored : localLeadScoutSeeds.slice(0, 4),
  };
}

function inferScoutIntent(query: string) {
  if (hasAny(query, ["culver", "gym", "fitness", "fithaven"])) {
    return "Local FitHaven fitness and wellness prospecting";
  }
  if (hasAny(query, ["cannabis", "420", "cannahaven"])) {
    return "CannaHaven sponsor and lifestyle brand prospecting";
  }
  if (hasAny(query, ["super bowl", "sports", "sportshaven"])) {
    return "SportsHaven seasonal sponsor prospecting";
  }
  if (hasAny(query, ["podcast", "youtube", "creator"])) {
    return "Podcast, creator, and media sponsor prospecting";
  }
  if (hasAny(query, ["speaking", "conference", "keynote"])) {
    return "Speaking engagement prospecting";
  }
  if (hasAny(query, ["hip hop", "hip-hop", "music"])) {
    return "MusicHaven and hip-hop brand partnership prospecting";
  }
  return "General HMG revenue prospecting";
}

export const relationshipProfiles: RelationshipProfile[] = [
  {
    id: "trent",
    name: "Trent",
    role: "Founder / Operator",
    skills: ["media strategy", "AI workflows", "editorial direction", "brand building"],
    industry: "Media",
    notes: "Anchor node for all HMG relationship intelligence.",
    personalityTraits: ["direct", "creative", "ambitious", "culture fluent"],
    interests: ["media ownership", "sports", "hip-hop", "AI revenue systems"],
    lastInteraction: "Current command center session",
    suggestedOpportunities: ["Founder-led sponsor calls", "AI newsroom speaking"],
    mutualContacts: [],
    potentialHmgRelevance: "Primary revenue decision maker.",
    conversationHistory: ["Maximillion V4 revenue OS buildout"],
    trustScore: 100,
    relationshipScore: 100,
    revenueOpportunityScore: 100,
  },
  {
    id: "adrian-swish",
    name: "Adrian Swish",
    role: "Music connector / basketball culture operator",
    skills: ["artist relationships", "sports culture", "event curation"],
    industry: "Music / Sports / Culture",
    notes:
      "High-context intro example for artist, sponsor, and event relationship mapping.",
    personalityTraits: ["connected", "taste-driven", "fast-moving"],
    interests: ["music discovery", "basketball", "brand moments"],
    lastInteraction: "Mock intro prep",
    suggestedOpportunities: [
      "MusicHaven interview lane",
      "SportsHaven x artist watch-party package",
      "Festival sponsor introductions",
    ],
    mutualContacts: ["Trent"],
    potentialHmgRelevance:
      "Could unlock artist interviews, branded culture activations, and sponsor intros.",
    conversationHistory: ["Discussed warm intro positioning and HMG fit."],
    trustScore: 72,
    relationshipScore: 78,
    revenueOpportunityScore: 84,
  },
  {
    id: "culver-gym-owner",
    name: "Culver City Gym Owner",
    role: "Local fitness business decision maker",
    skills: ["local marketing", "fitness programming", "community events"],
    industry: "Fitness",
    notes: "Representative profile for FitHaven local lead scout output.",
    personalityTraits: ["practical", "community-oriented", "ROI focused"],
    interests: ["member acquisition", "local visibility", "transformation stories"],
    lastInteraction: "Not contacted - mock memory",
    suggestedOpportunities: ["FitHaven challenge sponsor", "trainer video series"],
    mutualContacts: ["Trent"],
    potentialHmgRelevance:
      "Strong local partner for repeatable FitHaven sponsorship packages.",
    conversationHistory: ["No live conversation stored yet."],
    trustScore: 45,
    relationshipScore: 58,
    revenueOpportunityScore: 76,
  },
];

export const relationshipGraphNodes: RelationshipGraphNode[] = [
  { id: "trent", label: "Trent", type: "trent", score: 100 },
  { id: "adrian-swish", label: "Adrian Swish", type: "contact", score: 84 },
  { id: "culver-gym-owner", label: "Culver Gym Owner", type: "contact", score: 76 },
  { id: "music-haven", label: "MusicHaven", type: "brand", score: 92 },
  { id: "fit-haven", label: "FitHaven", type: "brand", score: 88 },
  { id: "rolling-loud", label: "Rolling Loud", type: "event", score: 86 },
  { id: "local-fitness-studios", label: "Local Fitness Studios", type: "company", score: 82 },
];

export const relationshipGraphEdges: RelationshipGraphEdge[] = [
  { from: "trent", to: "adrian-swish", label: "warm intro potential" },
  { from: "adrian-swish", to: "music-haven", label: "artist access" },
  { from: "adrian-swish", to: "rolling-loud", label: "festival lane" },
  { from: "trent", to: "culver-gym-owner", label: "outbound target" },
  { from: "culver-gym-owner", to: "fit-haven", label: "local sponsor fit" },
  { from: "fit-haven", to: "local-fitness-studios", label: "repeatable package" },
];

export const moneyPlaybookLessons: MoneyPlaybookLesson[] = [
  {
    id: "buffett-rate-card",
    category: "Warren Buffett lessons",
    quickLesson: "Price power matters more than noise. Sell inventory with durable value, not desperate discounts.",
    actionItem: "Create a rate-card floor for direct-sold SportsHaven and MusicHaven packages.",
    hmgApplication:
      "Anchor every sponsor pitch with clear deliverables, scarcity, and a minimum viable package.",
    potentialRevenueImpact: "$5k-$25k per package",
    difficulty: "Medium",
    timeEstimate: "2-3 hours",
  },
  {
    id: "conde-nast-premium-context",
    category: "Conde Nast publishing",
    quickLesson: "Premium context lets media brands charge for association, not just impressions.",
    actionItem: "Package HMG verticals as cultural context bundles with editorial adjacency.",
    hmgApplication:
      "Sell CannaHaven and MusicHaven as trusted cultural environments for brands that need taste and safety.",
    potentialRevenueImpact: "$7.5k-$40k",
    difficulty: "Medium",
    timeEstimate: "1 day",
  },
  {
    id: "fox-upfront-thinking",
    category: "TV network sales",
    quickLesson: "Upfront thinking converts calendar moments into sponsor commitments before the rush.",
    actionItem: "Build seasonal sponsor menus for Super Bowl, NBA Finals, festival season, and holidays.",
    hmgApplication:
      "Turn the revenue calendar into packages Trent can pre-sell before buyers are flooded.",
    potentialRevenueImpact: "$10k-$80k",
    difficulty: "High",
    timeEstimate: "1-2 days",
  },
  {
    id: "saatchi-single-minded",
    category: "Saatchi advertising",
    quickLesson: "One sharp promise beats ten vague benefits.",
    actionItem: "Rewrite sponsor outreach around one measurable buyer outcome.",
    hmgApplication:
      "For local gyms: 'own the FitHaven summer transformation lane in Culver City.'",
    potentialRevenueImpact: "$1.5k-$8k per local deal",
    difficulty: "Low",
    timeEstimate: "45 minutes",
  },
  {
    id: "youtube-repeatable-series",
    category: "YouTube growth lessons",
    quickLesson: "Repeatable formats give sponsors confidence and audiences a reason to return.",
    actionItem: "Create 3 recurring HMG video franchises with sponsor slots.",
    hmgApplication:
      "SportsHaven predictions, MusicHaven discovery, and FitHaven transformation check-ins.",
    potentialRevenueImpact: "$3k-$20k monthly",
    difficulty: "Medium",
    timeEstimate: "1 day",
  },
  {
    id: "podcast-midroll-trust",
    category: "podcast monetization lessons",
    quickLesson: "Host trust is the inventory. Reads need a real reason to believe.",
    actionItem: "Draft host-read templates tied to Trent's actual founder POV.",
    hmgApplication:
      "Sell podcast sponsors with founder credibility, not generic ad copy.",
    potentialRevenueImpact: "$2k-$12k",
    difficulty: "Low",
    timeEstimate: "1 hour",
  },
  {
    id: "harvard-bant-champ",
    category: "Harvard business frameworks",
    quickLesson: "Frameworks do not close deals. They expose what is missing before time gets wasted.",
    actionItem: "Score every serious lead against budget, authority, urgency, pain, and champion strength.",
    hmgApplication:
      "Use the score to decide whether Trent asks for a meeting, a pilot, or a polite pass.",
    potentialRevenueImpact: "$5k-$50k protected pipeline",
    difficulty: "Medium",
    timeEstimate: "90 minutes",
  },
  {
    id: "ted-clear-idea",
    category: "TED talk insights",
    quickLesson: "A memorable idea travels faster than a complete explanation.",
    actionItem: "Give every HMG package a one-line thesis buyers can repeat internally.",
    hmgApplication:
      "Example: 'FitHaven owns local transformation stories for brands that want wellness trust.'",
    potentialRevenueImpact: "$2k-$15k per package",
    difficulty: "Low",
    timeEstimate: "30 minutes",
  },
  {
    id: "startup-wedge",
    category: "startup case studies",
    quickLesson: "A wedge market creates proof before expansion.",
    actionItem: "Win one local FitHaven sponsor lane, then clone the package across LA neighborhoods.",
    hmgApplication:
      "Culver City gyms become the model for recovery studios, trainers, and wellness products.",
    potentialRevenueImpact: "$10k-$60k repeatable local revenue",
    difficulty: "Medium",
    timeEstimate: "1 week",
  },
  {
    id: "sports-sponsorship-moment",
    category: "sports sponsorship lessons",
    quickLesson: "Sponsors buy moments when the audience is already gathered.",
    actionItem: "Pre-build watch-party, recap, and prediction packages before tentpole sports windows.",
    hmgApplication:
      "SportsHaven can sell the Super Bowl, NBA Finals, March Madness, and Olympics as inventory moments.",
    potentialRevenueImpact: "$10k-$100k",
    difficulty: "High",
    timeEstimate: "2 days",
  },
  {
    id: "ai-business-ops",
    category: "AI business lessons",
    quickLesson: "AI is valuable when it compresses decision time, not when it creates theater.",
    actionItem: "Use Maximillion to rank opportunities, draft asks, and expose next-best moves locally first.",
    hmgApplication:
      "Provider hooks can improve intelligence later without locking HMG into one paid model.",
    potentialRevenueImpact: "$5k-$40k in faster execution",
    difficulty: "Low",
    timeEstimate: "Today",
  },
];

export const autopilotItems: AutopilotItem[] = [
  {
    id: "focus",
    lane: "Today's revenue focus",
    priority: "Critical",
    title: "Move one sponsor from idea to ask",
    action: "Pick SportsHaven or FitHaven, define one package, and ask for a 15-minute review.",
    revenueRange: "$1,500-$10,000",
  },
  {
    id: "quick-win",
    lane: "Quick wins",
    priority: "High",
    title: "Send 3 local partner messages",
    action: "Target Culver City gyms, recovery studios, and sports bars with a short local sponsor pilot.",
    revenueRange: "$1,500-$6,000",
  },
  {
    id: "calls",
    lane: "Calls to make",
    priority: "High",
    title: "Ask for the decision maker",
    action: "Call local fitness and venue leads. The next-best ask is a package review, not a vague intro.",
    revenueRange: "$2,000-$12,000",
  },
  {
    id: "reconnect",
    lane: "People to reconnect with",
    priority: "Medium",
    title: "Warm intro lane",
    action: "Use Adrian Swish as the mock profile for artist, event, and sponsor relationship mapping.",
    revenueRange: "$5,000-$25,000",
  },
  {
    id: "seasonal",
    lane: "Seasonal opportunities",
    priority: "High",
    title: "Pre-sell the next sports or festival window",
    action: "Build one seasonal package with content, social, newsletter, and event activation.",
    revenueRange: "$7,500-$40,000",
  },
  {
    id: "low-effort-high-return",
    lane: "Low effort / high return",
    priority: "High",
    title: "Create one rate-card PDF",
    action: "Package banner, newsletter, video, and sponsor-read slots into starter/growth/takeover tiers.",
    revenueRange: "$3,000-$30,000",
  },
  {
    id: "website-monetization",
    lane: "Website monetization opportunities",
    priority: "Medium",
    title: "Package direct-sold banner and newsletter inventory",
    action: "Create one starter banner/newsletter tier with pricing, dates, and reporting expectations.",
    revenueRange: "$1,000-$8,000",
  },
  {
    id: "social-monetization",
    lane: "Social monetization opportunities",
    priority: "Medium",
    title: "Turn short-form clips into sponsor assets",
    action: "Bundle three social posts, one recap, and one founder note for a small sponsor test.",
    revenueRange: "$1,500-$7,500",
  },
  {
    id: "speaking-lane",
    lane: "Speaking opportunities",
    priority: "Medium",
    title: "Pitch Trent on AI newsroom revenue systems",
    action: "Use the Black Media Leadership Forum profile as the first speaking-opportunity template.",
    revenueRange: "$1,000-$10,000",
  },
];

export const revenueCalendarV2: RevenueCalendarV2Item[] = [
  {
    id: "super-bowl",
    moment: "Super Bowl",
    timing: "January-February",
    potentialSponsors: ["sports bars", "beverage brands", "delivery apps", "recovery products"],
    contentIdeas: ["watch-party guide", "prop-bet culture explainer", "game-day food rankings"],
    projectedRevenue: "$10k-$80k",
    leadOpportunities: ["SportsHaven watch-party package", "local venue sponsor stack"],
    suggestedMeetings: ["venue GM", "beverage rep", "local creator host"],
    actionChecklist: ["build one-sheet", "price tiers", "draft venue email", "lock follow-up dates"],
  },
  {
    id: "rolling-loud",
    moment: "Rolling Loud",
    timing: "Festival season",
    potentialSponsors: ["fashion", "creator tools", "music tech", "streetwear"],
    contentIdeas: ["artist preview", "festival fits", "creator street team recap"],
    projectedRevenue: "$8k-$45k",
    leadOpportunities: ["MusicHaven festival coverage partnership"],
    suggestedMeetings: ["brand partnerships lead", "artist manager", "streetwear founder"],
    actionChecklist: ["build sponsor deck", "identify artists", "draft interview asks"],
  },
  {
    id: "nba-finals",
    moment: "NBA Finals",
    timing: "May-June",
    potentialSponsors: ["sports bars", "athlete recovery", "beverage", "sports betting education"],
    contentIdeas: ["series preview", "watch-party guide", "player legacy debates"],
    projectedRevenue: "$8k-$60k",
    leadOpportunities: ["SportsHaven Finals content sponsor", "venue activation sponsor"],
    suggestedMeetings: ["sports bar owner", "recovery brand lead", "basketball creator"],
    actionChecklist: ["build Finals package", "draft local venue list", "prepare short-form sponsor slots"],
  },
  {
    id: "march-madness",
    moment: "March Madness",
    timing: "March-April",
    potentialSponsors: ["sports bars", "delivery apps", "office pools", "beverage"],
    contentIdeas: ["bracket culture", "upset watch guide", "LA watch-party list"],
    projectedRevenue: "$5k-$35k",
    leadOpportunities: ["SportsHaven bracket sponsor", "newsletter takeover"],
    suggestedMeetings: ["venue GM", "food delivery partner", "local sports creator"],
    actionChecklist: ["price newsletter takeover", "draft bracket sponsor email", "schedule buyer calls"],
  },
  {
    id: "bet-awards",
    moment: "BET Awards",
    timing: "June",
    potentialSponsors: ["fashion", "beauty", "music tech", "creator tools"],
    contentIdeas: ["red-carpet culture", "artist moments", "brand-safe recap"],
    projectedRevenue: "$6k-$45k",
    leadOpportunities: ["MusicHaven awards sponsor", "social recap sponsor"],
    suggestedMeetings: ["fashion brand", "music distributor", "beauty founder"],
    actionChecklist: ["build awards content calendar", "draft sponsor tiers", "identify artist contacts"],
  },
  {
    id: "coachella-stagecoach",
    moment: "Coachella / Stagecoach",
    timing: "April",
    potentialSponsors: ["fashion", "travel", "beverage", "music gear"],
    contentIdeas: ["festival fits", "artist discovery", "brand activation recap"],
    projectedRevenue: "$8k-$50k",
    leadOpportunities: ["festival coverage sponsor", "creator street team"],
    suggestedMeetings: ["streetwear buyer", "festival-adjacent venue", "creator manager"],
    actionChecklist: ["draft festival package", "map sponsor categories", "prepare interview angles"],
  },
  {
    id: "olympics",
    moment: "Olympics",
    timing: "Olympic cycle",
    potentialSponsors: ["fitness apps", "recovery brands", "sportswear", "nutrition"],
    contentIdeas: ["athlete discipline stories", "training explainers", "wellness challenge"],
    projectedRevenue: "$10k-$70k",
    leadOpportunities: ["FitHaven x SportsHaven training package"],
    suggestedMeetings: ["fitness tech brand", "sportswear buyer", "trainer creator"],
    actionChecklist: ["build athlete-adjacent package", "prepare brand-safe copy", "rank fitness leads"],
  },
  {
    id: "back-to-school",
    moment: "Back-to-school",
    timing: "July-September",
    potentialSponsors: ["tech", "fashion", "fitness", "education tools"],
    contentIdeas: ["creator productivity", "campus culture", "fitness reset"],
    projectedRevenue: "$4k-$30k",
    leadOpportunities: ["MusicHaven student creator package", "FitHaven reset sponsor"],
    suggestedMeetings: ["creator tool buyer", "fashion brand", "campus event producer"],
    actionChecklist: ["define student audience", "draft campus content angles", "package social placements"],
  },
  {
    id: "cannabis-holidays",
    moment: "Cannabis holidays",
    timing: "4/20 plus culture moments",
    potentialSponsors: ["lifestyle papers", "lounges", "accessories", "wellness brands"],
    contentIdeas: ["CannaHaven guide", "compliance-safe product story", "local event recap"],
    projectedRevenue: "$5k-$35k",
    leadOpportunities: ["CannaHaven compliant sponsor package"],
    suggestedMeetings: ["brand owner", "event producer", "venue partner"],
    actionChecklist: ["confirm compliance language", "build target list", "create sponsor menu"],
  },
  {
    id: "holiday-campaigns",
    moment: "Holiday campaigns",
    timing: "October-December",
    potentialSponsors: ["gift guides", "fitness challenges", "music merch", "AI tools"],
    contentIdeas: ["HMG holiday gift guide", "creator tools roundup", "fitness reset plan"],
    projectedRevenue: "$6k-$50k",
    leadOpportunities: ["cross-vertical holiday sponsor bundle"],
    suggestedMeetings: ["ecommerce founder", "agency buyer", "affiliate manager"],
    actionChecklist: ["define categories", "set publishing dates", "build affiliate-safe copy"],
  },
];

export const documentBrainPipelines: DocumentBrainPipeline[] = [
  {
    id: "expense-brain",
    inputType: "Expenses and mock invoices",
    accepts: ["CSV", "XLSX", "PDF", "TXT", "notes"],
    outputs: ["budget summary", "risk summary", "chart pack"],
    riskNote: "Mock architecture only. No real parsing or accounting advice.",
    futureHook: "Claude/Gemini/Ollama document reasoning adapter can slot in later.",
  },
  {
    id: "sales-brain",
    inputType: "Sales sheets and sponsor lists",
    accepts: ["CSV", "spreadsheets", "rate cards", "decks"],
    outputs: ["executive summary", "sales call prep", "outreach summary"],
    riskNote: "Local mock outputs only.",
    futureHook: "Manual CSV importer and CRM sync adapter prepared conceptually.",
  },
  {
    id: "contract-brain",
    inputType: "Mock contracts and deal memos",
    accepts: ["PDF", "DOC notes", "TXT", "meeting notes"],
    outputs: ["deal memo", "risk summary", "approval checklist"],
    riskNote: "Not legal advice. Future review should preserve attorney workflow.",
    futureHook: "Provider-neutral contract review interface.",
  },
  {
    id: "presentation-brain",
    inputType: "Decks, charts, meeting notes, and emails",
    accepts: ["PPT notes", "emails", "reports", "charts", "TXT"],
    outputs: ["presentation slides", "chart pack", "sales call prep", "outreach summary"],
    riskNote: "Mock report architecture only. No document extraction is active.",
    futureHook: "Future chart builder, slide exporter, and email summary adapter.",
  },
];

export const personalityModesV4: PersonalityModeV4[] = [
  {
    id: "founder",
    label: "Founder Mode",
    profile: "Direct, protective of Trent's time, focused on leverage and next-best action.",
    sampleLine: "Trent, the move is not more noise. It is one clean package and one clear ask.",
  },
  {
    id: "harvard-mba",
    label: "Harvard MBA Mode",
    profile: "Structured strategy, margin awareness, buyer segmentation, and deal quality.",
    sampleLine: "Lead with package value, then qualify budget, authority, timing, and fit.",
  },
  {
    id: "shark-tank",
    label: "Shark Tank Mode",
    profile: "Fast pressure-test of pricing, proof, differentiation, and close probability.",
    sampleLine: "If the buyer cannot repeat the value in one sentence, the offer is not ready.",
  },
  {
    id: "buffett",
    label: "Warren Buffett Mode",
    profile: "Patient, price-power obsessed, allergic to low-quality revenue.",
    sampleLine: "Protect the brand. Premium context is an asset, not clearance inventory.",
  },
  {
    id: "media-exec",
    label: "Media Executive Mode",
    profile: "Upfront packages, sponsorship inventory, branded content, and buyer-safe language.",
    sampleLine: "Turn the calendar into inventory before the market gets loud.",
  },
  {
    id: "sports-agent",
    label: "Sports Agent Mode",
    profile: "Relationship-driven, deadline-aware, understands moments and leverage.",
    sampleLine: "We do not chase the whole league today. We call the buyer closest to the ball.",
  },
  {
    id: "festival-planner",
    label: "Festival Planner Mode",
    profile: "Builds sponsor lanes around talent, venue, audience, and content capture.",
    sampleLine: "The money is in the pre-event story, the on-site moment, and the recap rights.",
  },
];

export const futureRevenueHooksV4: FutureRevenueHookV4[] = [
  { id: "voice", label: "Browser Voice", status: "coming_next", note: "Browser-first voice panel works where supported; provider voice remains optional." },
  { id: "avatar", label: "Avatar mode", status: "coming_next", note: "Responsive avatar presence works locally; generated media remains provider-optional." },
  { id: "calendar", label: "Calendar integration", status: "coming_next", note: "Future scheduling and meeting prep." },
  { id: "email", label: "Email integration", status: "coming_next", note: "Future Gmail/Outlook lead scan and draft assist." },
  { id: "crm", label: "CRM sync", status: "coming_next", note: "Future HubSpot/Airtable/export adapter." },
  { id: "maps", label: "Google Maps sync", status: "coming_next", note: "Future local search and proximity intelligence." },
  { id: "podcasts", label: "Podcast summaries", status: "coming_next", note: "Future show and sponsor intelligence." },
  { id: "youtube", label: "YouTube trend intelligence", status: "coming_next", note: "Future trend and video monetization adapter." },
  { id: "aeo", label: "AEO intelligence", status: "coming_next", note: "Future answer-engine opportunity reports." },
  { id: "seo", label: "SEO intelligence", status: "coming_next", note: "Future search demand and content monetization." },
  { id: "social", label: "Social monetization engine", status: "coming_next", note: "Future creator and platform revenue planner." },
];

export const opportunityMissions: OpportunityMission[] = [
  {
    id: "international-music-markets",
    missionName: "International Music Markets",
    goal: "Map global music scenes where MusicHaven can build interviews, sponsor packages, and event relationships.",
    regions: ["Europe", "Africa", "Caribbean"],
    categories: ["music", "festivals", "artist interviews"],
    priority: "High",
    estimatedValue: "$15k-$90k",
    timeStarted: "Architecture preview",
    timeElapsed: "Not running in background",
    opportunitiesDiscovered: 7,
    confidenceScore: 82,
    notes: "Mission state model only. No autonomous web scanning is active.",
    completionPercentage: 42,
    state: "Needs Review",
  },
  {
    id: "fitness-partnerships",
    missionName: "Fitness Partnerships",
    goal: "Find local and national FitHaven sponsor lanes across gyms, recovery, supplements, and challenges.",
    regions: ["North America"],
    categories: ["fitness", "wellness", "local activation"],
    priority: "Critical",
    estimatedValue: "$5k-$40k",
    timeStarted: "Architecture preview",
    timeElapsed: "Not running in background",
    opportunitiesDiscovered: 5,
    confidenceScore: 86,
    notes: "Best near-term mission because access and package clarity are high.",
    completionPercentage: 58,
    state: "Queued",
  },
  {
    id: "festival-opportunities",
    missionName: "Festival Opportunities",
    goal: "Identify music, creator, sports, cannabis, and fitness events for coverage and sponsorship packages.",
    regions: ["North America", "Europe", "Africa", "Caribbean"],
    categories: ["festivals", "events", "sponsors"],
    priority: "High",
    estimatedValue: "$10k-$120k",
    timeStarted: "Architecture preview",
    timeElapsed: "Not running in background",
    opportunitiesDiscovered: 9,
    confidenceScore: 79,
    notes: "Future providers can enrich this with Eventbrite, RSS, maps, and manual CSV imports.",
    completionPercentage: 35,
    state: "Paused",
  },
];

export const globalMarketOpportunities: GlobalMarketOpportunity[] = [
  {
    id: "europe-night-shift",
    region: "Europe",
    market: "UK / France / Netherlands",
    industry: "music and creator events",
    event: "Afrobeats and dance festival season",
    artists: ["Afrobeats headliners", "diaspora DJs", "emerging rap acts"],
    brands: ["streetwear", "music tech", "beverage"],
    festivals: ["Afrobeats festivals", "dance festivals", "creator conferences"],
    estimatedOpportunityValue: "$12k-$75k",
    relevanceScore: 86,
    summary:
      "Late night in LA is a clean planning window for Europe outreach queues without pretending live scanning is active.",
  },
  {
    id: "asia-night-shift",
    region: "Asia",
    market: "Japan / South Korea / Philippines",
    industry: "music, creator tools, sports culture",
    event: "creator and music conference windows",
    artists: ["hip-hop crossover artists", "K-pop adjacent creators"],
    brands: ["creator tools", "streetwear", "gaming"],
    festivals: ["music conferences", "creator events"],
    estimatedOpportunityValue: "$10k-$60k",
    relevanceScore: 78,
    summary:
      "Useful for Global Hunter and Night Shift mode: queue research topics for future provider-backed enrichment.",
  },
  {
    id: "north-america-morning",
    region: "North America",
    market: "LA / Atlanta / New York / Toronto",
    industry: "sports, music, fitness, cannabis",
    event: "sponsor and speaking cycles",
    artists: ["independent artists", "athlete-creators"],
    brands: ["gyms", "sports bars", "cannabis lifestyle", "podcast sponsors"],
    festivals: ["Rolling Loud", "fitness expos", "cannabis events"],
    estimatedOpportunityValue: "$5k-$120k",
    relevanceScore: 92,
    summary:
      "Morning in LA should prioritize local calls, warm intros, and North American sponsor follow-ups.",
  },
  {
    id: "south-america-music",
    region: "South America",
    market: "Brazil / Colombia / Argentina",
    industry: "Latin music, creator culture, sports lifestyle",
    event: "Latin music and sports festival windows",
    artists: ["Latin hip-hop artists", "dance producers", "football creators"],
    brands: ["beverage", "fashion", "mobile tools"],
    festivals: ["Latin music festivals", "sports festivals", "creator events"],
    estimatedOpportunityValue: "$8k-$55k",
    relevanceScore: 80,
    summary:
      "Strong MusicHaven and SportsHaven crossover lane for future global research adapters.",
  },
  {
    id: "africa-afrobeats-market",
    region: "Africa",
    market: "Nigeria / Ghana / South Africa",
    industry: "Afrobeats, fashion, media, creator commerce",
    event: "diaspora music and culture windows",
    artists: ["Afrobeats artists", "Amapiano DJs", "diaspora creators"],
    brands: ["fashion", "fintech", "beverage"],
    festivals: ["Afrobeats festivals", "music conferences", "creator events"],
    estimatedOpportunityValue: "$10k-$70k",
    relevanceScore: 87,
    summary:
      "High MusicHaven compatibility for interviews, trend reports, and sponsor-safe diaspora coverage.",
  },
  {
    id: "middle-east-creator-market",
    region: "Middle East",
    market: "UAE / Saudi Arabia / Qatar",
    industry: "creator events, sports, luxury media",
    event: "sports and entertainment investment windows",
    artists: ["global DJs", "creator entrepreneurs", "sports personalities"],
    brands: ["luxury", "travel", "sports tech"],
    festivals: ["creator conferences", "sports festivals", "music events"],
    estimatedOpportunityValue: "$15k-$100k",
    relevanceScore: 74,
    summary:
      "Useful for future partnership research around media rights, events, and premium sponsorship.",
  },
  {
    id: "australia-festival-market",
    region: "Australia",
    market: "Sydney / Melbourne / Brisbane",
    industry: "music festivals, fitness, sports lifestyle",
    event: "summer festival and fitness expo windows",
    artists: ["dance artists", "hip-hop acts", "fitness creators"],
    brands: ["fitness gear", "beverage", "music tech"],
    festivals: ["dance festivals", "fitness expos", "sports festivals"],
    estimatedOpportunityValue: "$6k-$45k",
    relevanceScore: 76,
    summary:
      "Good Night Shift research lane for festivals, FitHaven products, and creator partnerships.",
  },
  {
    id: "caribbean-culture-market",
    region: "Caribbean",
    market: "Jamaica / Trinidad / Barbados",
    industry: "music, carnival, tourism, culture media",
    event: "carnival and dancehall culture windows",
    artists: ["dancehall artists", "soca artists", "diaspora DJs"],
    brands: ["travel", "beverage", "fashion"],
    festivals: ["carnival events", "music festivals", "tourism activations"],
    estimatedOpportunityValue: "$7k-$50k",
    relevanceScore: 83,
    summary:
      "Strong MusicHaven culture lane for interviews, travel sponsors, and diaspora storytelling.",
  },
];

export const festivalArtistOpportunities: FestivalArtistOpportunity[] = [
  {
    id: "rolling-loud-center",
    name: "Rolling Loud",
    country: "United States / global editions",
    timing: "Festival season",
    estimatedAudience: "75k+ event audiences plus global social reach",
    sponsorOpportunities: ["streetwear", "creator tools", "beverage", "music tech"],
    mediaOpportunities: ["artist interviews", "festival fit recaps", "sponsor content"],
    artistOpportunities: ["emerging rapper spotlights", "manager intros"],
    interviewOpportunities: ["pre-festival press", "backstage short-form", "post-set reactions"],
    hmgCompatibilityScore: 92,
  },
  {
    id: "afrobeats-festival-lane",
    name: "Afrobeats Festival Lane",
    country: "UK / Ghana / Nigeria / Portugal",
    timing: "Summer and diaspora culture windows",
    estimatedAudience: "15k-60k per major event",
    sponsorOpportunities: ["travel", "fashion", "beverage", "music platforms"],
    mediaOpportunities: ["diaspora music coverage", "culture explainers", "artist interviews"],
    artistOpportunities: ["cross-market discovery", "playlist partnerships"],
    interviewOpportunities: ["artist managers", "festival founders", "brand activators"],
    hmgCompatibilityScore: 88,
  },
  {
    id: "fitness-expo-lane",
    name: "Fitness Expo Lane",
    country: "United States",
    timing: "Spring and summer challenge windows",
    estimatedAudience: "5k-40k per expo",
    sponsorOpportunities: ["supplements", "recovery", "wearables", "gyms"],
    mediaOpportunities: ["FitHaven challenge content", "trainer interviews", "product demos"],
    artistOpportunities: ["athlete-creators", "fitness influencers"],
    interviewOpportunities: ["founders", "trainers", "sports performance experts"],
    hmgCompatibilityScore: 84,
  },
  {
    id: "cannabis-event-lane",
    name: "Cannabis Event Lane",
    country: "United States / Canada",
    timing: "4/20 plus local event cycles",
    estimatedAudience: "2k-25k per event",
    sponsorOpportunities: ["accessories", "lounges", "wellness", "lifestyle brands"],
    mediaOpportunities: ["CannaHaven guides", "event recap", "compliant brand storytelling"],
    artistOpportunities: ["music-cannabis crossover", "lifestyle creators"],
    interviewOpportunities: ["brand founders", "event producers", "culture voices"],
    hmgCompatibilityScore: 86,
  },
  {
    id: "latin-music-festival-lane",
    name: "Latin Music Festival Lane",
    country: "United States / Colombia / Mexico",
    timing: "Spring through fall",
    estimatedAudience: "20k-80k per major event",
    sponsorOpportunities: ["beverage", "fashion", "travel", "music platforms"],
    mediaOpportunities: ["artist discovery", "festival explainers", "brand activation coverage"],
    artistOpportunities: ["Latin hip-hop acts", "reggaeton producers", "bilingual creators"],
    interviewOpportunities: ["artist teams", "festival programmers", "brand activation leads"],
    hmgCompatibilityScore: 85,
  },
  {
    id: "creator-event-lane",
    name: "Creator Event Lane",
    country: "United States / Europe / Asia",
    timing: "Year-round conference cycle",
    estimatedAudience: "3k-30k per event",
    sponsorOpportunities: ["creator tools", "AI tools", "podcast sponsors", "camera gear"],
    mediaOpportunities: ["founder interviews", "tool roundups", "creator monetization reports"],
    artistOpportunities: ["video creators", "podcasters", "AI builders"],
    interviewOpportunities: ["tool founders", "platform reps", "creator managers"],
    hmgCompatibilityScore: 82,
  },
  {
    id: "sports-festival-lane",
    name: "Sports Festival Lane",
    country: "United States / Middle East / Europe",
    timing: "Major tournament windows",
    estimatedAudience: "10k-100k per event",
    sponsorOpportunities: ["sports tech", "recovery", "beverage", "sportswear"],
    mediaOpportunities: ["athlete culture", "fan activations", "training content"],
    artistOpportunities: ["athlete-creators", "sports podcasters", "performance coaches"],
    interviewOpportunities: ["event producers", "brand reps", "athlete managers"],
    hmgCompatibilityScore: 84,
  },
];

export const introDrafts: IntroDraft[] = [
  {
    id: "initial-sponsor-outreach",
    type: "Initial outreach",
    subject: "HMG sponsor package intro",
    draft:
      "Quick intro from Haven Media Group. We are building sponsor-safe culture, sports, music, fitness, and cannabis media packages with clear deliverables. Worth a 15-minute package review next week?",
    nextStep: "Customize with brand, vertical, package value, and one CTA.",
  },
  {
    id: "meeting-request",
    type: "Meeting request",
    subject: "15-minute sponsor fit review",
    draft:
      "I think there is a clean fit between your audience goals and HMG's vertical inventory. I would like to show one simple package, answer objections, and confirm whether there is a real lane.",
    nextStep: "Add two specific times and the relevant HMG vertical.",
  },
  {
    id: "event-partnership",
    type: "Event partnership summary",
    subject: "Event media partnership concept",
    draft:
      "HMG can support the event with pre-event editorial, short-form coverage, sponsor mentions, interview capture, and recap assets. The strongest package ties audience, talent, and sponsor outcomes together.",
    nextStep: "Attach event timing, sponsor categories, and recap rights.",
  },
  {
    id: "sales-notes",
    type: "Sales notes",
    subject: "Call prep notes",
    draft:
      "Lead with business outcome, confirm buyer role, ask for timing, name the package, handle budget objection with tiering, and close on the next meeting or package review.",
    nextStep: "Convert into call bullets before outreach.",
  },
];

export const workCycles: WorkCycle[] = [
  {
    id: "sprint",
    label: "Sprint Mode",
    operatingStyle: "Fast 30-60 minute revenue push with one clear outcome.",
    bestFor: "Quick wins, local calls, sponsor follow-ups.",
    output: "A short action list and draft outreach.",
  },
  {
    id: "deep-dive",
    label: "Deep Dive Mode",
    operatingStyle: "Structured research plan for one vertical, buyer, or event lane.",
    bestFor: "Complex sponsor categories and seasonal packages.",
    output: "Opportunity map, objections, package strategy.",
  },
  {
    id: "global-hunter",
    label: "Global Hunter Mode",
    operatingStyle: "Region-first market mapping with no fake autonomous claims.",
    bestFor: "International music, festivals, creator markets.",
    output: "Markets, festivals, brands, and outreach priorities.",
  },
  {
    id: "rapid-lead",
    label: "Rapid Lead Mode",
    operatingStyle: "Quick scoring and prioritization of manually entered leads.",
    bestFor: "CSV imports, event lists, sponsor spreadsheets.",
    output: "Ranked lead cards and next actions.",
  },
  {
    id: "founder-priority",
    label: "Founder Priority Mode",
    operatingStyle: "Protect Trent's attention and prioritize only high-leverage moves.",
    bestFor: "Busy days and decision fatigue.",
    output: "Three moves max, each tied to money.",
  },
  {
    id: "night-shift",
    label: "Night Shift Mode",
    operatingStyle:
      "Overseas opportunity planning while US markets sleep; queues findings for morning review.",
    bestFor: "Europe, Asia, Africa, Middle East, Australia, Caribbean.",
    output: "Morning briefing queue. No background task is active yet.",
  },
];

export const morningMoneyReport: MorningMoneyReport = {
  found: [
    "Europe and Asia are useful Night Shift research windows for music and creator partnerships.",
    "Fitness partnerships remain the fastest local-money lane.",
    "Festival opportunities need early sponsor packaging before buyer calendars fill.",
  ],
  highValueOpportunities: [
    "SportsHaven Super Bowl / NBA Finals sponsor stack",
    "MusicHaven festival coverage partnerships",
    "FitHaven local transformation sponsor pilots",
  ],
  urgentOpportunities: [
    "Call Culver City fitness leads before the week gets crowded.",
    "Build one package for the next sports window.",
  ],
  followUps: [
    "Adrian Swish intro prep",
    "Sports bar watch-party package review",
    "CannaHaven 4/20 sponsor menu",
  ],
  potentialRevenue: "$15k-$125k across near-term packages",
  newContacts: ["festival partnership lead", "fitness studio owner", "music tech brand buyer"],
  calendarSuggestions: [
    "Hold 30 minutes for sponsor outreach.",
    "Hold 45 minutes for seasonal package building.",
    "Hold one morning slot for warm-intro follow-ups.",
  ],
  recommendedNextActions: [
    "Pick one vertical package today.",
    "Send three short outreach drafts.",
    "Move one interested lead into a scheduled call.",
  ],
};
