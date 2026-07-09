import type {
  LeadPriority,
  RevenueType,
  SalesLeadInput,
  SalesStage,
} from "@/lib/sales";

export type LeadIntelligenceSection =
  | "local"
  | "national"
  | "sponsorship"
  | "creator"
  | "events"
  | "speaking"
  | "partnership"
  | "brand"
  | "advertising";

export interface LeadScoreFactors {
  brandFit: number;
  audienceOverlap: number;
  revenuePotential: number;
  easeOfAccess: number;
  relationshipProximity: number;
  calendarRelevance: number;
}

export interface LeadIntelligenceOpportunity {
  id: string;
  section: LeadIntelligenceSection;
  company: string;
  location: string;
  category: string;
  projectedRevenueRange: string;
  whyItMatchesHmg: string;
  suggestedOutreachAngle: string;
  suggestedContentAngle: string;
  suggestedSponsorAngle: string;
  urgencyScore: number;
  followUpRecommendation: string;
  revenueType: RevenueType;
  priority: LeadPriority;
  source: string;
  tags: string[];
  scoreFactors: LeadScoreFactors;
}

export interface DailyMoneyTask {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  title: string;
  estimatedRevenueImpact: string;
  rationale: string;
  nextAction: string;
}

export interface RevenueCalendarMoment {
  id: string;
  name: string;
  season: string;
  relevantBrands: string[];
  sponsorshipIdeas: string[];
  eventIdeas: string[];
  contentIdeas: string[];
  adPackageOpportunities: string[];
  affiliateOpportunities: string[];
  localActivationOpportunities: string[];
}

export interface RevenueMatrixItem {
  id: string;
  category: string;
  difficulty: "Low" | "Medium" | "High";
  startupCost: string;
  timeInvestment: string;
  estimatedRevenue: string;
  status: "Ready" | "Research" | "Packaging" | "Future";
  notes: string;
}

export interface MaximillionContact {
  id: string;
  name: string;
  company: string;
  role: string;
  relationshipStrength: number;
  potentialValue: string;
  tags: string[];
}

export interface RelationshipNote {
  id: string;
  contactId: string;
  note: string;
  lastDiscussedTopic: string;
  followUpHistory: string[];
}

export interface LeadHistory {
  id: string;
  leadName: string;
  stage: SalesStage;
  lastTouch: string;
  nextStep: string;
}

export interface OpportunityHistory {
  id: string;
  title: string;
  potentialValue: string;
  status: string;
  tags: string[];
}

export interface EventHistory {
  id: string;
  eventName: string;
  season: string;
  sponsorAngle: string;
}

export interface SponsorHistory {
  id: string;
  sponsor: string;
  category: string;
  fitReason: string;
}

export interface ConversationMemory {
  id: string;
  topic: string;
  takeaway: string;
  followUp: string;
}

export interface BusinessGoal {
  id: string;
  goal: string;
  target: string;
  status: string;
}

export interface PriorityGoal {
  id: string;
  goal: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  nextMove: string;
}

export interface MaximillionExecutiveMemoryState {
  contacts: MaximillionContact[];
  relationshipNotes: RelationshipNote[];
  leadHistory: LeadHistory[];
  opportunityHistory: OpportunityHistory[];
  eventHistory: EventHistory[];
  sponsorHistory: SponsorHistory[];
  conversationMemory: ConversationMemory[];
  businessGoals: BusinessGoal[];
  priorityGoals: PriorityGoal[];
}

export interface DocumentArchitectureNode {
  id: string;
  title: string;
  accepts: string[];
  mockOutput: string;
  futureHook: string;
}

export interface PersonalityMode {
  id: string;
  label: string;
  description: string;
  sample: string;
}

export interface AvatarFutureHook {
  id: string;
  label: string;
  note: string;
}

export const leadIntelligenceSections: Array<{
  id: LeadIntelligenceSection;
  label: string;
}> = [
  { id: "local", label: "Local Opportunities" },
  { id: "national", label: "National Opportunities" },
  { id: "sponsorship", label: "Sponsorship Opportunities" },
  { id: "creator", label: "Creator Opportunities" },
  { id: "events", label: "Events" },
  { id: "speaking", label: "Speaking Opportunities" },
  { id: "partnership", label: "Partnership Opportunities" },
  { id: "brand", label: "Brand Opportunities" },
  { id: "advertising", label: "Advertising Opportunities" },
];

export const leadIntelligenceOpportunities: LeadIntelligenceOpportunity[] = [
  {
    id: "culver-city-recovery-studio",
    section: "local",
    company: "Culver City Recovery Studio",
    location: "Culver City, CA",
    category: "Fitness / Wellness",
    projectedRevenueRange: "$1,500-$5,000",
    whyItMatchesHmg:
      "FitHaven can turn local recovery, mobility, and performance routines into sponsor-safe wellness content.",
    suggestedOutreachAngle:
      "Open with a 30-day FitHaven local partner pilot tied to summer transformation and athlete recovery content.",
    suggestedContentAngle:
      "Film short recovery explainers, trainer tips, and before/after challenge updates.",
    suggestedSponsorAngle:
      "Bundle studio placement with FitHaven newsletter, social cuts, and a local event recap.",
    urgencyScore: 86,
    followUpRecommendation:
      "Call this week and ask for the owner or partnerships lead.",
    revenueType: "event_sponsorship",
    priority: "high",
    source: "Local Lead Scout mock",
    tags: ["fithaven", "local", "culver-city", "wellness"],
    scoreFactors: {
      brandFit: 94,
      audienceOverlap: 84,
      revenuePotential: 76,
      easeOfAccess: 82,
      relationshipProximity: 70,
      calendarRelevance: 90,
    },
  },
  {
    id: "la-sports-bar-group",
    section: "local",
    company: "LA Sports Bar Group",
    location: "Los Angeles, CA",
    category: "Sports Bar / Hospitality",
    projectedRevenueRange: "$3,000-$12,000",
    whyItMatchesHmg:
      "SportsHaven can connect game-night coverage to real local foot traffic and sponsor-friendly watch parties.",
    suggestedOutreachAngle:
      "Pitch a Super Bowl and NBA Finals watch-party media package with clear deliverables.",
    suggestedContentAngle:
      "Create weekly game previews, watch-party guides, and postgame social recaps.",
    suggestedSponsorAngle:
      "Add beverage, delivery, and recovery sponsors around the venue package.",
    urgencyScore: 91,
    followUpRecommendation:
      "Send a one-page watch-party rate card before the next major sports window.",
    revenueType: "event_sponsorship",
    priority: "urgent",
    source: "Seasonal money engine",
    tags: ["sportshaven", "local", "watch-party", "beverage"],
    scoreFactors: {
      brandFit: 95,
      audienceOverlap: 88,
      revenuePotential: 85,
      easeOfAccess: 78,
      relationshipProximity: 68,
      calendarRelevance: 96,
    },
  },
  {
    id: "recovery-drink-brand",
    section: "national",
    company: "Recovery Drink Challenger Brand",
    location: "National",
    category: "Beverage / Recovery",
    projectedRevenueRange: "$10,000-$40,000",
    whyItMatchesHmg:
      "SportsHaven and FitHaven can give the brand sports, recovery, and lifestyle context without generic ad inventory.",
    suggestedOutreachAngle:
      "Lead with a direct-sold package across video, newsletter, event recap, and founder-read sponsorship.",
    suggestedContentAngle:
      "Build content around game-day recovery, summer training, and tournament weekends.",
    suggestedSponsorAngle:
      "Position as category partner for SportsHaven game coverage and FitHaven recovery guides.",
    urgencyScore: 78,
    followUpRecommendation:
      "Ask for brand partnerships contact and send the video sponsorship tier.",
    revenueType: "youtube_video",
    priority: "high",
    source: "National sponsor mock",
    tags: ["sportshaven", "fithaven", "beverage", "video"],
    scoreFactors: {
      brandFit: 88,
      audienceOverlap: 82,
      revenuePotential: 90,
      easeOfAccess: 58,
      relationshipProximity: 52,
      calendarRelevance: 82,
    },
  },
  {
    id: "music-tech-platform",
    section: "advertising",
    company: "Music Creator Tools Platform",
    location: "National",
    category: "Music Tech / SaaS",
    projectedRevenueRange: "$5,000-$25,000",
    whyItMatchesHmg:
      "MusicHaven, HipHopHaven, and RapHaven can reach creators who buy tools, plugins, distribution, and workflow software.",
    suggestedOutreachAngle:
      "Pitch a creator education series with sponsored content, newsletter placement, and mid-roll inventory.",
    suggestedContentAngle:
      "Produce producer toolkit guides, creator workflow explainers, and release-strategy breakdowns.",
    suggestedSponsorAngle:
      "Package direct-sold creator education with banner and video sponsorship add-ons.",
    urgencyScore: 74,
    followUpRecommendation:
      "Start with partnerships and creator marketing, then ask for campaign timing.",
    revenueType: "social_sponsorship",
    priority: "medium",
    source: "Advertising lane mock",
    tags: ["musichaven", "hiphophaven", "music-tech", "creator"],
    scoreFactors: {
      brandFit: 87,
      audienceOverlap: 86,
      revenuePotential: 80,
      easeOfAccess: 61,
      relationshipProximity: 45,
      calendarRelevance: 66,
    },
  },
  {
    id: "adrian-swish-intro",
    section: "partnership",
    company: "Adrian Swish Warm Intro",
    location: "Los Angeles / Sports media",
    category: "Sports media connector",
    projectedRevenueRange: "$2,500-$15,000",
    whyItMatchesHmg:
      "A warm sports-media relationship can unlock athlete-adjacent creators, sponsors, and SportsHaven distribution partners.",
    suggestedOutreachAngle:
      "Send a concise intro note framing HMG as a culture and sports media platform with direct-sold sponsor inventory.",
    suggestedContentAngle:
      "Collaborative SportsHaven segments, game-week creator hits, and sponsor-backed athlete lifestyle coverage.",
    suggestedSponsorAngle:
      "Use the intro to package SportsHaven creator inventory for beverage, recovery, and apparel partners.",
    urgencyScore: 82,
    followUpRecommendation:
      "Draft the intro note, ask for one specific introduction, and keep the CTA light.",
    revenueType: "partnership",
    priority: "high",
    source: "Introduce Max mock",
    tags: ["relationship", "sportshaven", "creator", "intro"],
    scoreFactors: {
      brandFit: 90,
      audienceOverlap: 78,
      revenuePotential: 76,
      easeOfAccess: 72,
      relationshipProximity: 88,
      calendarRelevance: 70,
    },
  },
  {
    id: "cannabis-lifestyle-brand",
    section: "sponsorship",
    company: "Cannabis Lifestyle Accessory Brand",
    location: "California",
    category: "Cannabis Lifestyle",
    projectedRevenueRange: "$7,500-$30,000",
    whyItMatchesHmg:
      "CannaHaven can sell compliant culture-first storytelling around 420, festivals, and music moments.",
    suggestedOutreachAngle:
      "Lead with a 420 sponsor package and a Rolling Loud culture lane.",
    suggestedContentAngle:
      "Gift guides, artist culture recaps, product education, and compliant lifestyle explainers.",
    suggestedSponsorAngle:
      "Offer category sponsorship across CannaHaven plus HipHopHaven cultural inventory.",
    urgencyScore: 88,
    followUpRecommendation:
      "Send the 420 package and confirm compliance guardrails before creative.",
    revenueType: "social_sponsorship",
    priority: "urgent",
    source: "CannaHaven seasonal mock",
    tags: ["cannahaven", "420", "festival", "sponsorship"],
    scoreFactors: {
      brandFit: 96,
      audienceOverlap: 84,
      revenuePotential: 83,
      easeOfAccess: 66,
      relationshipProximity: 58,
      calendarRelevance: 98,
    },
  },
  {
    id: "agency-brand-lab",
    section: "brand",
    company: "Culture Agency Brand Lab",
    location: "New York / Los Angeles",
    category: "Agency / Brand Strategy",
    projectedRevenueRange: "$15,000-$60,000",
    whyItMatchesHmg:
      "Agency buyers need credible cultural media partners with direct-sold inventory, reporting, and clear campaign packaging.",
    suggestedOutreachAngle:
      "Pitch HMG as a boutique culture media partner with rate cards and tentpole sponsor packages ready.",
    suggestedContentAngle:
      "Branded editorial, cultural explainers, talent-adjacent creator packages, and event recap products.",
    suggestedSponsorAngle:
      "Create a package the agency can resell to clients: premium content plus measurable distribution.",
    urgencyScore: 69,
    followUpRecommendation:
      "Ask for their next sports, music, fitness, or cannabis client campaign window.",
    revenueType: "partnership",
    priority: "medium",
    source: "Agency-side mock",
    tags: ["agency", "brand", "direct-sold", "partnership"],
    scoreFactors: {
      brandFit: 82,
      audienceOverlap: 74,
      revenuePotential: 92,
      easeOfAccess: 46,
      relationshipProximity: 42,
      calendarRelevance: 72,
    },
  },
  {
    id: "founder-speaking-media",
    section: "speaking",
    company: "Independent Media Conference",
    location: "National / Hybrid",
    category: "Speaking / Founder Authority",
    projectedRevenueRange: "$5,000-$20,000",
    whyItMatchesHmg:
      "Trent can sell authority around AI publishing, culture media, independent revenue, and HMG's operating system.",
    suggestedOutreachAngle:
      "Pitch a keynote or fireside chat on building a culture media company with AI and direct-sold revenue.",
    suggestedContentAngle:
      "Turn the talk into clips, newsletter content, and sponsor-backed founder education.",
    suggestedSponsorAngle:
      "Bundle speaking with a sponsor salon, private workshop, or brand partner package.",
    urgencyScore: 64,
    followUpRecommendation:
      "Create a one-sheet with three talk titles and a speaking fee ladder.",
    revenueType: "speaking",
    priority: "medium",
    source: "Speaking lane mock",
    tags: ["speaking", "founder", "hmg", "ai-aeo"],
    scoreFactors: {
      brandFit: 85,
      audienceOverlap: 70,
      revenuePotential: 68,
      easeOfAccess: 62,
      relationshipProximity: 48,
      calendarRelevance: 54,
    },
  },
];

export const dailyMoneyTasks: DailyMoneyTask[] = [
  {
    id: "daily-culver-fitness",
    priority: "critical",
    title: "Reach out to Culver City fitness studios",
    estimatedRevenueImpact: "$1,500-$5,000 possible",
    rationale:
      "FitHaven can convert a local studio into a repeatable wellness partner before summer challenge season.",
    nextAction: "Call or email the owner with a 30-day local partner pilot.",
  },
  {
    id: "daily-sports-advertiser",
    priority: "high",
    title: "Follow up with SportsHaven advertiser",
    estimatedRevenueImpact: "$3,000-$12,000 possible",
    rationale:
      "SportsHaven packages are strongest when timed around tentpole games and watch-party inventory.",
    nextAction: "Send the rate-card tier and ask for a package review window.",
  },
  {
    id: "daily-music-sponsor-call",
    priority: "high",
    title: "Schedule MusicHaven sponsor call",
    estimatedRevenueImpact: "$5,000-$25,000 possible",
    rationale:
      "Music-tech and creator brands need credible education inventory around artists and release workflows.",
    nextAction: "Ask for the partnerships lead and offer two call times.",
  },
  {
    id: "daily-youtube-monetization",
    priority: "medium",
    title: "Review YouTube monetization opportunities",
    estimatedRevenueImpact: "$2,500-$10,000 possible",
    rationale:
      "Video sponsorship can carry pre-roll, mid-roll, host-read, and Shorts packages beyond standard banner inventory.",
    nextAction: "Draft a three-tier YouTube sponsorship menu.",
  },
  {
    id: "daily-canna-event",
    priority: "medium",
    title: "Draft CannaHaven event sponsors",
    estimatedRevenueImpact: "$7,500-$30,000 possible",
    rationale:
      "420 and festival windows give CannaHaven a natural calendar reason to package compliant sponsors now.",
    nextAction: "Build a target list of accessories, lounges, beverage, and music-adjacent cannabis brands.",
  },
];

export const revenueCalendarMoments: RevenueCalendarMoment[] = [
  {
    id: "nfl-season",
    name: "NFL season",
    season: "September-February",
    relevantBrands: ["SportsHaven", "HMG", "FitHaven"],
    sponsorshipIdeas: ["sports bars", "beverage", "delivery", "fantasy tools"],
    eventIdeas: ["weekly watch parties", "playoff preview nights"],
    contentIdeas: ["game previews", "betting-free storylines", "player lifestyle"],
    adPackageOpportunities: ["banner takeovers", "video reads", "newsletter sponsor"],
    affiliateOpportunities: ["merch", "ticket partners", "fan gear"],
    localActivationOpportunities: ["LA bar circuit", "food truck tie-ins"],
  },
  {
    id: "nba-season",
    name: "NBA season",
    season: "October-June",
    relevantBrands: ["SportsHaven", "RapHaven", "FitHaven"],
    sponsorshipIdeas: ["sports bars", "recovery", "hydration", "streetwear"],
    eventIdeas: ["rivalry night watch parties", "Finals sponsor lounge"],
    contentIdeas: ["postgame shorts", "player fit checks", "recovery routines"],
    adPackageOpportunities: ["pre-roll", "mid-roll", "social sponsorship"],
    affiliateOpportunities: ["apparel", "fitness products", "supplements"],
    localActivationOpportunities: ["LA game-night venue package"],
  },
  {
    id: "march-madness",
    name: "March Madness",
    season: "March-April",
    relevantBrands: ["SportsHaven", "HMG"],
    sponsorshipIdeas: ["sports bars", "delivery", "beverage", "bracket tools"],
    eventIdeas: ["bracket nights", "Final Four viewing party"],
    contentIdeas: ["upset watch", "player stories", "coach narrative"],
    adPackageOpportunities: ["bracket sponsor", "newsletter series", "banner bundle"],
    affiliateOpportunities: ["fan gear", "streaming offers"],
    localActivationOpportunities: ["campus-adjacent LA watch parties"],
  },
  {
    id: "super-bowl",
    name: "Super Bowl",
    season: "February",
    relevantBrands: ["SportsHaven", "HMG", "MusicHaven"],
    sponsorshipIdeas: ["watch-party sponsors", "beverage", "food delivery", "recovery"],
    eventIdeas: ["Super Bowl watch parties", "halftime recap salon"],
    contentIdeas: ["commercial reviews", "halftime coverage", "legacy storylines"],
    adPackageOpportunities: ["premium takeover", "sponsor reads", "social recap"],
    affiliateOpportunities: ["party supplies", "food offers", "fan apparel"],
    localActivationOpportunities: ["sports bar network", "beverage pop-ups"],
  },
  {
    id: "world-cup",
    name: "World Cup",
    season: "Cycle event",
    relevantBrands: ["SportsHaven", "HMG"],
    sponsorshipIdeas: ["global sports brands", "bars", "food", "travel"],
    eventIdeas: ["country-specific watch parties", "final match activation"],
    contentIdeas: ["team guides", "player profiles", "culture explainers"],
    adPackageOpportunities: ["international sponsor series", "video explainers"],
    affiliateOpportunities: ["jerseys", "travel", "streaming"],
    localActivationOpportunities: ["LA international neighborhood watch guides"],
  },
  {
    id: "olympics",
    name: "Olympics",
    season: "Summer / Winter cycle",
    relevantBrands: ["SportsHaven", "FitHaven", "HMG"],
    sponsorshipIdeas: ["fitness", "recovery", "nutrition", "wearables"],
    eventIdeas: ["medal watch nights", "training challenge"],
    contentIdeas: ["athlete routines", "wellness explainers", "medal tracker"],
    adPackageOpportunities: ["performance package", "newsletter sponsor"],
    affiliateOpportunities: ["wearables", "supplements", "training programs"],
    localActivationOpportunities: ["gym challenges", "recovery studio partners"],
  },
  {
    id: "stagecoach",
    name: "Stagecoach",
    season: "April",
    relevantBrands: ["MusicHaven", "FitHaven"],
    sponsorshipIdeas: ["apparel", "hydration", "travel", "wellness"],
    eventIdeas: ["desert prep guide", "artist preview night"],
    contentIdeas: ["festival prep", "artist spotlights", "recovery guide"],
    adPackageOpportunities: ["festival sponsor bundle", "social story package"],
    affiliateOpportunities: ["festival gear", "travel", "hydration"],
    localActivationOpportunities: ["LA pre-festival partner event"],
  },
  {
    id: "coachella",
    name: "Coachella",
    season: "April",
    relevantBrands: ["MusicHaven", "HipHopHaven", "FitHaven"],
    sponsorshipIdeas: ["fashion", "beauty", "music tech", "creator tools"],
    eventIdeas: ["festival preview lounge", "post-weekend recap"],
    contentIdeas: ["fit checks", "artist previews", "creator field reports"],
    adPackageOpportunities: ["festival coverage partnership", "video sponsor"],
    affiliateOpportunities: ["fashion", "beauty", "travel"],
    localActivationOpportunities: ["LA creator meetup"],
  },
  {
    id: "rolling-loud",
    name: "Rolling Loud",
    season: "Festival season",
    relevantBrands: ["HipHopHaven", "RapHaven", "CannaHaven"],
    sponsorshipIdeas: ["streetwear", "cannabis lifestyle", "beverage", "creator tools"],
    eventIdeas: ["artist preview night", "festival recap show"],
    contentIdeas: ["artist cards", "set recaps", "culture reactions"],
    adPackageOpportunities: ["hip-hop festival sponsor stack", "shorts package"],
    affiliateOpportunities: ["streetwear", "tickets", "accessories"],
    localActivationOpportunities: ["LA listening party tie-in"],
  },
  {
    id: "420",
    name: "420",
    season: "April 20",
    relevantBrands: ["CannaHaven", "HipHopHaven", "MusicHaven"],
    sponsorshipIdeas: ["compliant cannabis", "rolling accessories", "lounges"],
    eventIdeas: ["CannaHaven sponsor campaign", "culture recap"],
    contentIdeas: ["gift guides", "artist crossover", "education explainers"],
    adPackageOpportunities: ["sponsored guide", "newsletter sponsor", "social recap"],
    affiliateOpportunities: ["accessories", "wellness", "lifestyle products"],
    localActivationOpportunities: ["dispensary-adjacent events", "lounge partners"],
  },
  {
    id: "summer",
    name: "Summer",
    season: "June-August",
    relevantBrands: ["FitHaven", "MusicHaven", "SportsHaven"],
    sponsorshipIdeas: ["fitness", "hydration", "travel", "apparel"],
    eventIdeas: ["FitHaven summer transformation challenge", "outdoor music recaps"],
    contentIdeas: ["training plans", "festival coverage", "summer league stories"],
    adPackageOpportunities: ["challenge sponsor", "summer guide sponsor"],
    affiliateOpportunities: ["fitness gear", "hydration", "travel"],
    localActivationOpportunities: ["Culver City studio challenge", "beach workouts"],
  },
  {
    id: "holiday",
    name: "Holiday campaigns",
    season: "November-December",
    relevantBrands: ["HMG", "MusicHaven", "FitHaven"],
    sponsorshipIdeas: ["gift guides", "apparel", "wellness", "tech"],
    eventIdeas: ["holiday buyer guide", "year-end culture recap"],
    contentIdeas: ["best-of lists", "gift picks", "year-end rankings"],
    adPackageOpportunities: ["gift guide sponsor", "newsletter bundle"],
    affiliateOpportunities: ["gifts", "subscriptions", "creator tools"],
    localActivationOpportunities: ["LA holiday market guide"],
  },
  {
    id: "back-to-school",
    name: "Back to school",
    season: "August-September",
    relevantBrands: ["HMG", "MusicHaven", "FitHaven"],
    sponsorshipIdeas: ["creator tools", "fitness", "tech", "apparel"],
    eventIdeas: ["student creator workshop", "campus media package"],
    contentIdeas: ["creator setup", "routine reset", "student athlete stories"],
    adPackageOpportunities: ["education sponsor", "newsletter sponsor"],
    affiliateOpportunities: ["software", "gear", "supplements"],
    localActivationOpportunities: ["college-adjacent LA partner events"],
  },
  {
    id: "award-season",
    name: "Award season",
    season: "January-March",
    relevantBrands: ["MusicHaven", "HipHopHaven", "RapHaven"],
    sponsorshipIdeas: ["fashion", "beauty", "beverage", "music tech"],
    eventIdeas: ["watch party", "red carpet recap salon"],
    contentIdeas: ["winner predictions", "fit checks", "performance reviews"],
    adPackageOpportunities: ["award-week takeover", "video recap sponsor"],
    affiliateOpportunities: ["fashion", "beauty", "music tools"],
    localActivationOpportunities: ["LA red carpet watch partners"],
  },
];

export const revenueMatrix: RevenueMatrixItem[] = [
  {
    id: "banner-ads",
    category: "Banner ads",
    difficulty: "Low",
    startupCost: "$0-$500",
    timeInvestment: "Low",
    estimatedRevenue: "$500-$5k/mo",
    status: "Ready",
    notes: "Package homepage, sidebar, article, and section takeovers.",
  },
  {
    id: "newsletter-sponsorship",
    category: "Newsletter sponsorship",
    difficulty: "Low",
    startupCost: "$0-$500",
    timeInvestment: "Medium",
    estimatedRevenue: "$1k-$10k/mo",
    status: "Packaging",
    notes: "Best sold with editorial calendar and audience promise.",
  },
  {
    id: "podcast-sponsorship",
    category: "Podcast sponsorship",
    difficulty: "Medium",
    startupCost: "$500-$2k",
    timeInvestment: "Medium",
    estimatedRevenue: "$2.5k-$20k/mo",
    status: "Future",
    notes: "Needs show inventory, host reads, and reporting cadence.",
  },
  {
    id: "video-sponsorship",
    category: "Video sponsorship",
    difficulty: "Medium",
    startupCost: "$500-$3k",
    timeInvestment: "High",
    estimatedRevenue: "$5k-$45k/mo",
    status: "Ready",
    notes: "Pre-roll, mid-roll, sponsor reads, and Shorts packages.",
  },
  {
    id: "sponsored-content",
    category: "Sponsored content",
    difficulty: "Medium",
    startupCost: "$0-$1k",
    timeInvestment: "Medium",
    estimatedRevenue: "$2.5k-$25k/deal",
    status: "Ready",
    notes: "Requires clear disclosure, approval windows, and usage terms.",
  },
  {
    id: "affiliate",
    category: "Affiliate revenue",
    difficulty: "Low",
    startupCost: "$0-$250",
    timeInvestment: "Medium",
    estimatedRevenue: "$250-$8k/mo",
    status: "Research",
    notes: "Strong for gear, creator tools, wellness, and ticketing.",
  },
  {
    id: "memberships",
    category: "Memberships",
    difficulty: "High",
    startupCost: "$1k-$5k",
    timeInvestment: "High",
    estimatedRevenue: "$1k-$30k/mo",
    status: "Future",
    notes: "Needs a clear premium promise and retention loop.",
  },
  {
    id: "courses",
    category: "Courses",
    difficulty: "Medium",
    startupCost: "$500-$4k",
    timeInvestment: "High",
    estimatedRevenue: "$5k-$50k/launch",
    status: "Research",
    notes: "Best around AI media, creator monetization, and publishing systems.",
  },
  {
    id: "speaking",
    category: "Speaking engagements",
    difficulty: "Medium",
    startupCost: "$0-$500",
    timeInvestment: "Medium",
    estimatedRevenue: "$5k-$25k/event",
    status: "Packaging",
    notes: "Needs a founder one-sheet, talk titles, and fee ladder.",
  },
  {
    id: "brand-partnerships",
    category: "Brand partnerships",
    difficulty: "Medium",
    startupCost: "$0-$2k",
    timeInvestment: "High",
    estimatedRevenue: "$10k-$100k/deal",
    status: "Ready",
    notes: "Highest upside when tied to tentpole calendar moments.",
  },
  {
    id: "live-events",
    category: "Live events",
    difficulty: "High",
    startupCost: "$2k-$15k",
    timeInvestment: "High",
    estimatedRevenue: "$10k-$75k/event",
    status: "Packaging",
    notes: "Protect margins with deposits and sponsor commitments.",
  },
  {
    id: "licensing",
    category: "Licensing",
    difficulty: "High",
    startupCost: "$0-$2k",
    timeInvestment: "Medium",
    estimatedRevenue: "$5k-$50k/deal",
    status: "Research",
    notes: "Useful for content, formats, brand assets, and data products.",
  },
  {
    id: "print",
    category: "Print opportunities",
    difficulty: "High",
    startupCost: "$3k-$20k",
    timeInvestment: "High",
    estimatedRevenue: "$10k-$60k/drop",
    status: "Future",
    notes: "Premium if tied to limited editions and sponsor exclusivity.",
  },
  {
    id: "youtube",
    category: "YouTube monetization",
    difficulty: "Medium",
    startupCost: "$500-$5k",
    timeInvestment: "High",
    estimatedRevenue: "$1k-$50k/mo",
    status: "Ready",
    notes: "Mix platform revenue with direct-sold sponsorship.",
  },
  {
    id: "merch",
    category: "Merchandise",
    difficulty: "Medium",
    startupCost: "$1k-$10k",
    timeInvestment: "Medium",
    estimatedRevenue: "$2k-$30k/drop",
    status: "Research",
    notes: "Stronger when connected to events, shows, and cultural moments.",
  },
  {
    id: "consulting",
    category: "Consulting",
    difficulty: "Medium",
    startupCost: "$0-$500",
    timeInvestment: "Medium",
    estimatedRevenue: "$5k-$40k/mo",
    status: "Packaging",
    notes: "Package HMG strategy for media, creator, and AI publishing teams.",
  },
  {
    id: "white-label",
    category: "White-label services",
    difficulty: "High",
    startupCost: "$1k-$8k",
    timeInvestment: "High",
    estimatedRevenue: "$10k-$80k/mo",
    status: "Future",
    notes: "Requires process, fulfillment guardrails, and scope discipline.",
  },
  {
    id: "ai-tools",
    category: "AI tools",
    difficulty: "High",
    startupCost: "$2k-$25k",
    timeInvestment: "High",
    estimatedRevenue: "$5k-$100k/mo",
    status: "Future",
    notes: "Could productize HMG workflows after internal systems stabilize.",
  },
  {
    id: "automation-products",
    category: "Automation products",
    difficulty: "High",
    startupCost: "$2k-$25k",
    timeInvestment: "High",
    estimatedRevenue: "$5k-$100k/mo",
    status: "Future",
    notes: "Best V4/V5 target after real usage and repeatable demand.",
  },
];

export const executiveMemoryState: MaximillionExecutiveMemoryState = {
  contacts: [
    {
      id: "contact-trent",
      name: "Trent",
      company: "Haven Media Group",
      role: "Founder",
      relationshipStrength: 100,
      potentialValue: "Owner economics",
      tags: ["founder", "strategy", "approval"],
    },
    {
      id: "contact-adrian-swish",
      name: "Adrian Swish",
      company: "Sports media network",
      role: "Connector",
      relationshipStrength: 72,
      potentialValue: "$2.5k-$15k intro value",
      tags: ["sportshaven", "intro", "creator"],
    },
  ],
  relationshipNotes: [
    {
      id: "note-adrian",
      contactId: "contact-adrian-swish",
      note: "Warm sports-media intro path for SportsHaven creators and sponsor inventory.",
      lastDiscussedTopic: "Adrian Swish introduction example",
      followUpHistory: ["Draft warm intro", "Ask for one specific connection"],
    },
  ],
  leadHistory: [
    {
      id: "lead-history-local-fitness",
      leadName: "Culver City Recovery Studio",
      stage: "lead",
      lastTouch: "Mock scout recommendation",
      nextStep: "Call owner with FitHaven 30-day pilot.",
    },
  ],
  opportunityHistory: [
    {
      id: "opp-history-super-bowl",
      title: "SportsHaven Super Bowl watch-party stack",
      potentialValue: "$25k-$80k",
      status: "Packaging",
      tags: ["sportshaven", "event", "watch-party"],
    },
  ],
  eventHistory: [
    {
      id: "event-history-420",
      eventName: "420",
      season: "April",
      sponsorAngle: "CannaHaven compliant culture sponsor package.",
    },
  ],
  sponsorHistory: [
    {
      id: "sponsor-history-recovery",
      sponsor: "Recovery and hydration brands",
      category: "Fitness / Sports",
      fitReason: "Fits SportsHaven and FitHaven around training, recovery, and big games.",
    },
  ],
  conversationMemory: [
    {
      id: "conversation-memory-tone",
      topic: "Personality guardrails",
      takeaway:
        "Executive language by default, culturally fluent when natural, never cartoonish.",
      followUp: "Keep Maximillion's profile note visible in Sales Pipeline.",
    },
  ],
  businessGoals: [
    {
      id: "business-goal-direct-sold",
      goal: "Build direct-sold sponsorship inventory",
      target: "$25k monthly pipeline",
      status: "In progress",
    },
  ],
  priorityGoals: [
    {
      id: "priority-goal-rate-card",
      goal: "Publish HMG rate-card tiers",
      priority: "Critical",
      nextMove: "Finalize banner, newsletter, video, sponsored content, and event packages.",
    },
  ],
};

export const documentArchitectureNodes: DocumentArchitectureNode[] = [
  {
    id: "document-pipeline",
    title: "DocumentPipeline",
    accepts: ["CSV", "PDF", "XLSX", "TXT", "Notes"],
    mockOutput: "Routes uploaded docs to the right future parser and report type.",
    futureHook: "Claude document reasoning or local parser layer.",
  },
  {
    id: "document-summary",
    title: "DocumentSummary",
    accepts: ["PDF", "TXT", "Notes"],
    mockOutput: "Produces executive summaries, action items, and risk flags.",
    futureHook: "Provider-neutral summarization adapter.",
  },
  {
    id: "chart-generator",
    title: "ChartGenerator",
    accepts: ["CSV", "XLSX", "Charts"],
    mockOutput: "Creates pipeline, expense, sponsor, and forecast chart specs.",
    futureHook: "Chart builder and presentation export.",
  },
  {
    id: "sales-brief",
    title: "SalesBrief",
    accepts: ["Call notes", "Email drafts", "Sales docs"],
    mockOutput: "Creates call prep, buyer objections, and next-best ask.",
    futureHook: "CRM, Gmail, and Calendar context.",
  },
  {
    id: "expense-report",
    title: "ExpenseReport",
    accepts: ["CSV", "XLSX", "Expenses"],
    mockOutput: "Breaks costs into production, activation, media, and margin risk.",
    futureHook: "Spreadsheet parser and finance rules.",
  },
  {
    id: "presentation-pack",
    title: "PresentationPack",
    accepts: ["Charts", "Deck notes", "Reports"],
    mockOutput: "Builds a mock chart pack and send-to-deck placeholder.",
    futureHook: "Presentation artifact generation.",
  },
  {
    id: "deal-memo",
    title: "DealMemo",
    accepts: ["Sales docs", "Notes", "Email drafts"],
    mockOutput: "Summarizes scope, deliverables, rights, fee, timeline, and next step.",
    futureHook: "Contract-aware review adapter.",
  },
];

export const personalityModes: PersonalityMode[] = [
  {
    id: "executive",
    label: "Executive Mode",
    description: "Polished, concise, boardroom-ready revenue guidance.",
    sample: "Lead with package value, decision timeline, and the next-best ask.",
  },
  {
    id: "founder",
    label: "Founder Mode",
    description: "Direct support for Trent's vision, energy, and approvals.",
    sample: "This is a clean HMG play. Keep the scope tight and make the buyer say yes or no.",
  },
  {
    id: "sales-killer",
    label: "Sales Killer Mode",
    description: "Sharper follow-up discipline, objection handling, and close logic.",
    sample: "Do not chase vibes. Ask for the decision maker, the blocker, and the pilot budget.",
  },
  {
    id: "analyst",
    label: "Analyst Mode",
    description: "Forecasts, scoring, risk, and operating metrics.",
    sample: "The pipeline needs priced stages, follow-up dates, and weighted confidence.",
  },
  {
    id: "creative",
    label: "Creative Mode",
    description: "Campaign angles, sponsor storytelling, and culture-first packaging.",
    sample: "Turn the event into a content product: preview, live moments, recap, and sponsor proof.",
  },
];

export const avatarFutureHooks: AvatarFutureHook[] = [
  {
    id: "realtime-voice",
    label: "Browser Voice",
    note: "Browser-first command mode for local revenue briefings where supported.",
  },
  {
    id: "emotion-engine",
    label: "Emotion engine",
    note: "Local tone and presence layer for avatar responses.",
  },
  {
    id: "calendar-access",
    label: "Calendar access",
    note: "Provider-optional meeting context, follow-up windows, and seasonal urgency.",
  },
  {
    id: "email-access",
    label: "Email access",
    note: "Provider-optional sponsor follow-up drafts and warm-intro memory.",
  },
  {
    id: "map-intelligence",
    label: "Map intelligence",
    note: "Provider-optional local prospect discovery from places and neighborhoods.",
  },
];

export function scoreLeadOpportunity(lead: LeadIntelligenceOpportunity): number {
  const factors = lead.scoreFactors;
  return Math.round(
    (factors.brandFit +
      factors.audienceOverlap +
      factors.revenuePotential +
      factors.easeOfAccess +
      factors.relationshipProximity +
      factors.calendarRelevance) /
      6,
  );
}

export function leadOpportunityToPipelineInput(
  lead: LeadIntelligenceOpportunity,
): SalesLeadInput {
  return {
    company: lead.company,
    contactName: "",
    contactTitle: "",
    email: "",
    phone: "",
    website: "",
    stage: "lead",
    priority: lead.priority,
    estimatedValue: estimateLowValue(lead.projectedRevenueRange),
    revenueType: lead.revenueType,
    brandFit: lead.whyItMatchesHmg,
    source: lead.source,
    tags: lead.tags,
    notes: [
      `Location: ${lead.location}`,
      `Category: ${lead.category}`,
      `Outreach: ${lead.suggestedOutreachAngle}`,
      `Content: ${lead.suggestedContentAngle}`,
      `Sponsor: ${lead.suggestedSponsorAngle}`,
      `Follow-up: ${lead.followUpRecommendation}`,
    ].join("\n"),
    nextFollowUpAt: "",
    owner: "Trent",
    contact: "",
    category: lead.category,
    interestedSilos: lead.tags.filter((tag) =>
      ["sportshaven", "fithaven", "cannahaven", "musichaven", "hiphophaven", "raphaven", "hmg"].includes(tag),
    ),
    proposedSpend: lead.projectedRevenueRange,
    nextFollowUp: "",
  };
}

function estimateLowValue(range: string): number {
  const first = range.match(/\$?([\d,.]+)\s*k?/i)?.[0] ?? "";
  const normalized = first.toLowerCase().replace(/[$,\s]/g, "");
  const value = Number(normalized.replace("k", ""));
  if (!Number.isFinite(value)) return 0;
  return normalized.includes("k") ? Math.round(value * 1000) : Math.round(value);
}
