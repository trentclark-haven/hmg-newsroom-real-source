export type FounderCapabilityLane = "Editorial" | "Executive" | "Growth";

export interface FounderCapabilityCategory {
  lane: FounderCapabilityLane;
  strengths: string[];
  supportNeeded: string[];
  automationCandidates: string[];
}

export interface FounderProfileEngine {
  founder: "Trent Clark";
  professionalBackground: string[];
  formerMediaEditorialExperience: string[];
  leadershipStyle: string[];
  strengths: string[];
  skills: string[];
  industries: string[];
  creativeStrengths: string[];
  relationshipStrengths: string[];
  operationalStrengths: string[];
  personalMission: string;
  riskTolerance: string;
  preferredCommunicationStyle: string[];
  longTermGoals: string[];
  weaknessesAndBlindSpots: string[];
  areasNeedingSupport: string[];
  systemAutomationPriorities: string[];
  capabilityCategories: FounderCapabilityCategory[];
}

export interface HavenStrategicThesis {
  id: string;
  brand: string;
  currentThesis: string;
  potentialStrengths: string[];
  potentialRisks: string[];
  strategicLeveragePoints: string[];
  nextEvidenceToCollect: string[];
}

export interface StrategicConfidenceScore {
  brandId: string;
  visionScore: number;
  marketOpportunity: number;
  executionReadiness: number;
  audiencePotential: number;
  monetizationPotential: number;
  operationalRisk: number;
  capitalIntensity: number;
  competitivePressure: number;
  potentialUpsideRange: string;
  reasons: string[];
  keyRisks: string[];
  suggestedActions: string[];
}

export interface FounderBriefing {
  id: string;
  title: string;
  cadence: "Morning" | "Weekly" | "Quarterly";
  wins: string[];
  risks: string[];
  opportunities: string[];
  resourceGaps: string[];
  highLeverageActions: string[];
}

export interface MaximillionOperatingDoctrine {
  id: string;
  title: string;
  principle: string;
  howMaximillionActs: string;
}

export const founderProfileEngine: FounderProfileEngine = {
  founder: "Trent Clark",
  professionalBackground: [
    "Founder and operator of Haven Media Group.",
    "Media/editorial builder with a strong orientation toward culture, music, sports, cannabis, fitness, and AI-enabled newsroom systems.",
    "Product-minded creative operator building a portfolio of vertical brands instead of a single isolated publication.",
  ],
  formerMediaEditorialExperience: [
    "Long-form journalism instincts.",
    "Hip-hop and music editorial judgment.",
    "Culture coverage, interviewing, and narrative framing.",
    "Ability to connect archival credibility with modern content formats.",
  ],
  leadershipStyle: [
    "Founder-led, high-context, direct, ambitious, and creatively opinionated.",
    "Best supported by systems that turn broad vision into ranked actions, outreach, packages, and repeatable operating rhythms.",
    "Moves fastest when strategy is translated into tangible asks, dashboards, and next steps.",
  ],
  strengths: [
    "Editorial taste",
    "Brand architecture",
    "Founder conviction",
    "Culture fluency",
    "Creative direction",
    "Cross-vertical thinking",
    "Relationship-led opportunity sensing",
  ],
  skills: [
    "long-form journalism",
    "interviewing",
    "storytelling",
    "recruiting",
    "networking",
    "partnerships",
    "branding",
    "product architecture",
    "creative direction",
    "audience building",
    "monetization",
    "content ecosystems",
  ],
  industries: [
    "media",
    "hip-hop",
    "music",
    "sports",
    "cannabis",
    "fitness",
    "culture",
    "AI tooling",
    "events",
    "sponsorship",
  ],
  creativeStrengths: [
    "Seeing editorial lanes before they are cleanly packaged.",
    "Connecting cultural credibility to modern media products.",
    "Naming and shaping brands with distinct audience energy.",
  ],
  relationshipStrengths: [
    "Warm-intro potential across culture, sports, music, and local business.",
    "Ability to talk founder-to-founder instead of sounding like a generic salesperson.",
    "Strong instinct for people who can unlock artists, sponsors, events, or distribution.",
  ],
  operationalStrengths: [
    "Can architect systems when the vision is clear.",
    "Can build repeatable workflows from messy creative ideas.",
    "Can use AI tools as leverage while keeping editorial judgment human.",
  ],
  personalMission:
    "Build Haven Media Group into a respected, culturally fluent media ecosystem that creates ownership, opportunity, and durable revenue across multiple verticals.",
  riskTolerance:
    "High creative ambition with a need for evidence gates, calendar discipline, and capital-aware execution.",
  preferredCommunicationStyle: [
    "Direct",
    "executive",
    "strategic",
    "plainspoken",
    "optimistic but not gullible",
    "specific about the next move",
  ],
  longTermGoals: [
    "Build a multi-brand Haven ecosystem.",
    "Create premium editorial, video, events, sponsorships, and product revenue.",
    "Use AI systems to compress operational drag, not replace taste or relationships.",
    "Turn HMG into a culture-driven media company with real ownership and leverage.",
  ],
  weaknessesAndBlindSpots: [
    "Too many promising verticals can split focus before proof is established.",
    "Founder energy can create more ideas than the operating system can ship in a week.",
    "Audience acquisition and distribution need as much discipline as brand creation.",
    "Sales packaging must become concrete before opportunity volume increases.",
  ],
  areasNeedingSupport: [
    "Prioritization",
    "follow-up discipline",
    "sales packaging",
    "rate-card structure",
    "calendar-driven execution",
    "delegation",
    "proof tracking",
  ],
  systemAutomationPriorities: [
    "Lead scoring and follow-up reminders",
    "sponsor package drafting",
    "briefing generation",
    "calendar opportunity mapping",
    "relationship memory",
    "document/report scaffolding",
    "weekly focus pruning",
  ],
  capabilityCategories: [
    {
      lane: "Editorial",
      strengths: [
        "long-form journalism",
        "hip-hop",
        "music",
        "sports",
        "cannabis",
        "culture",
        "interviewing",
        "storytelling",
      ],
      supportNeeded: [
        "content calendar discipline",
        "audience feedback loops",
        "repeatable editorial formats",
      ],
      automationCandidates: [
        "brief templates",
        "interview prep",
        "archive mining",
        "headline and package variants",
      ],
    },
    {
      lane: "Executive",
      strengths: [
        "recruiting",
        "networking",
        "partnerships",
        "branding",
        "product architecture",
        "creative direction",
      ],
      supportNeeded: [
        "decision filters",
        "operating cadence",
        "resource allocation",
      ],
      automationCandidates: [
        "priority dashboards",
        "meeting prep",
        "outreach drafts",
        "relationship graph updates",
      ],
    },
    {
      lane: "Growth",
      strengths: [
        "audience building",
        "monetization",
        "content ecosystems",
        "cross-brand expansion",
      ],
      supportNeeded: [
        "distribution experiments",
        "offer testing",
        "conversion tracking",
      ],
      automationCandidates: [
        "sponsor target ranking",
        "revenue calendar reminders",
        "weekly funnel notes",
      ],
    },
  ],
};

export const havenStrategicTheses: HavenStrategicThesis[] = [
  {
    id: "hiphophaven",
    brand: "HipHopHaven",
    currentThesis:
      "Strong archive opportunity and modern premium hip-hop journalism upside.",
    potentialStrengths: [
      "credibility",
      "founder experience",
      "historical coverage",
      "content depth",
      "video expansion",
    ],
    potentialRisks: [
      "audience acquisition",
      "platform dependence",
      "content scale",
    ],
    strategicLeveragePoints: [
      "Turn archive depth into premium features and documentary-style video.",
      "Use interviews and historical context as defensible editorial territory.",
      "Package credibility for sponsors that need culture-safe placement.",
    ],
    nextEvidenceToCollect: [
      "Which archive topics still pull search and social interest?",
      "Which artists/managers respond to interview or retrospective formats?",
      "Which sponsor categories value credible hip-hop context?",
    ],
  },
  {
    id: "raphaven",
    brand: "RapHaven",
    currentThesis:
      "Fast, personality-driven rap culture and breaking news opportunity.",
    potentialStrengths: ["speed", "social energy", "entertainment appeal"],
    potentialRisks: ["burnout", "volume pressure", "trend dependence"],
    strategicLeveragePoints: [
      "Use RapHaven as the quick-twitch social/news layer.",
      "Separate fast takes from deeper HipHopHaven editorial to protect quality.",
      "Create sponsor inventory around recurring formats rather than chaos.",
    ],
    nextEvidenceToCollect: [
      "Which formats can be repeated without draining the team?",
      "Which topics convert into followers rather than one-off views?",
      "What is the minimum viable daily publishing rhythm?",
    ],
  },
  {
    id: "musichaven",
    brand: "MusicHaven",
    currentThesis: "Cross-genre editorial/media opportunity.",
    potentialStrengths: ["broad audience", "music discovery", "artist ecosystem"],
    potentialRisks: ["competition", "audience fragmentation"],
    strategicLeveragePoints: [
      "Own discovery and context instead of trying to cover every release.",
      "Build artist, festival, and music-tech sponsor lanes.",
      "Use cross-genre breadth to create packages for brands beyond hip-hop.",
    ],
    nextEvidenceToCollect: [
      "Which genres create the strongest repeat audience?",
      "Which artist teams are reachable now?",
      "Which festivals or music-tech sponsors need media partners?",
    ],
  },
  {
    id: "sportshaven",
    brand: "SportsHaven",
    currentThesis: "Sports media with event and sponsorship upside.",
    potentialStrengths: [
      "large audience",
      "events",
      "partnerships",
      "games",
      "Olympics/Super Bowl possibilities",
    ],
    potentialRisks: ["rights limitations", "scaling cost"],
    strategicLeveragePoints: [
      "Prioritize commentary, culture, watch parties, and sponsor-safe fan experiences.",
      "Use tentpole calendars to pre-sell packages.",
      "Avoid rights-heavy ideas until licensing and budgets are clear.",
    ],
    nextEvidenceToCollect: [
      "Which sports moments can HMG cover without rights risk?",
      "Which local venues want watch-party media packages?",
      "Which sponsor categories buy before major events?",
    ],
  },
  {
    id: "cannahaven",
    brand: "CannaHaven",
    currentThesis:
      "Cannabis culture + education + underserved audiences opportunity.",
    potentialStrengths: ["community", "education", "lifestyle"],
    potentialRisks: ["regulations", "advertising restrictions"],
    strategicLeveragePoints: [
      "Build compliant education and lifestyle coverage.",
      "Focus on culture, wellness, events, and founder stories.",
      "Keep sponsor language careful and platform-aware.",
    ],
    nextEvidenceToCollect: [
      "Which cannabis categories can advertise safely?",
      "Which local events need credible media coverage?",
      "Which compliance language should be standardized?",
    ],
  },
  {
    id: "fithaven",
    brand: "FitHaven",
    currentThesis: "Fitness + biohacking + behavior opportunity.",
    potentialStrengths: ["habit systems", "creator partnerships", "products"],
    potentialRisks: ["scientific credibility", "crowded market"],
    strategicLeveragePoints: [
      "Focus on habits, local transformation stories, and credible experts.",
      "Partner with gyms, recovery studios, trainers, and wellness products.",
      "Avoid unsupported health claims; use expert review when needed.",
    ],
    nextEvidenceToCollect: [
      "Which local fitness businesses will test a small sponsor package?",
      "Which recurring content formats build trust?",
      "Which claims require expert sourcing or disclaimers?",
    ],
  },
];

export const strategicConfidenceScores: StrategicConfidenceScore[] = [
  {
    brandId: "hiphophaven",
    visionScore: 92,
    marketOpportunity: 84,
    executionReadiness: 72,
    audiencePotential: 86,
    monetizationPotential: 80,
    operationalRisk: 66,
    capitalIntensity: 48,
    competitivePressure: 78,
    potentialUpsideRange: "Strong niche-to-premium media upside if archive, video, and sponsor packaging become repeatable.",
    reasons: [
      "Founder/editorial fit is high.",
      "Historical depth can differentiate the brand.",
      "Video and interviews can expand monetization.",
    ],
    keyRisks: [
      "Audience growth needs a repeatable distribution system.",
      "Premium work can bottleneck on founder time.",
      "Competition for hip-hop attention is intense.",
    ],
    suggestedActions: [
      "Pick one archive series and one video format.",
      "Build a sponsor-safe editorial package.",
      "Track audience response by topic and format.",
    ],
  },
  {
    brandId: "raphaven",
    visionScore: 82,
    marketOpportunity: 88,
    executionReadiness: 68,
    audiencePotential: 90,
    monetizationPotential: 72,
    operationalRisk: 82,
    capitalIntensity: 42,
    competitivePressure: 88,
    potentialUpsideRange: "High attention upside, but only valuable if publishing cadence and burnout controls are real.",
    reasons: [
      "Rap culture moves fast and rewards speed.",
      "Personality-driven coverage can travel socially.",
      "Low capital intensity makes experimentation possible.",
    ],
    keyRisks: [
      "Trend dependence can dilute brand quality.",
      "Volume pressure can drain the operator.",
      "Monetization lags if the audience is only drive-by attention.",
    ],
    suggestedActions: [
      "Define a sustainable daily format limit.",
      "Use RapHaven to feed deeper HipHopHaven pieces.",
      "Avoid chasing every story.",
    ],
  },
  {
    brandId: "musichaven",
    visionScore: 86,
    marketOpportunity: 82,
    executionReadiness: 70,
    audiencePotential: 84,
    monetizationPotential: 78,
    operationalRisk: 70,
    capitalIntensity: 52,
    competitivePressure: 84,
    potentialUpsideRange: "Broad upside as a discovery and artist ecosystem brand, but focus is the gating factor.",
    reasons: [
      "Cross-genre scope creates sponsor range.",
      "Artist discovery can become relationship infrastructure.",
      "Festival and music-tech lanes are monetizable.",
    ],
    keyRisks: [
      "Too broad a mandate can fragment audience.",
      "Competition is deep across every genre.",
      "Needs a clear editorial thesis to avoid generic coverage.",
    ],
    suggestedActions: [
      "Choose two discovery lanes to test first.",
      "Build artist relationship memory.",
      "Package festival and music-tech sponsor opportunities.",
    ],
  },
  {
    brandId: "sportshaven",
    visionScore: 88,
    marketOpportunity: 92,
    executionReadiness: 68,
    audiencePotential: 94,
    monetizationPotential: 86,
    operationalRisk: 76,
    capitalIntensity: 64,
    competitivePressure: 90,
    potentialUpsideRange: "Major sponsorship/event upside if HMG stays rights-aware and focuses on fan culture, events, and packages.",
    reasons: [
      "Sports audiences are large and calendar-driven.",
      "Tentpole events create sponsor urgency.",
      "Local watch-party and creator angles are reachable.",
    ],
    keyRisks: [
      "Rights limitations can constrain content ideas.",
      "Sports media is expensive to scale.",
      "Competition is extremely strong.",
    ],
    suggestedActions: [
      "Build rights-safe event packages.",
      "Start with local venue sponsors.",
      "Pre-sell around Super Bowl, NBA Finals, March Madness, and Olympics.",
    ],
  },
  {
    brandId: "cannahaven",
    visionScore: 84,
    marketOpportunity: 78,
    executionReadiness: 66,
    audiencePotential: 76,
    monetizationPotential: 74,
    operationalRisk: 86,
    capitalIntensity: 46,
    competitivePressure: 70,
    potentialUpsideRange: "Meaningful culture and education upside, with monetization limited by regulation and ad policy.",
    reasons: [
      "Underserved audiences need credible cannabis culture and education.",
      "Lifestyle and events can create community.",
      "Founder-led editorial can avoid generic cannabis content.",
    ],
    keyRisks: [
      "Regulations and platform policies can restrict growth.",
      "Sponsor language must be careful.",
      "Scientific and health claims require discipline.",
    ],
    suggestedActions: [
      "Create compliant sponsor templates.",
      "Prioritize education and founder stories.",
      "Map 4/20 and local event opportunities early.",
    ],
  },
  {
    brandId: "fithaven",
    visionScore: 86,
    marketOpportunity: 86,
    executionReadiness: 74,
    audiencePotential: 82,
    monetizationPotential: 84,
    operationalRisk: 72,
    capitalIntensity: 50,
    competitivePressure: 88,
    potentialUpsideRange: "Strong local-to-product upside if credibility, expert sourcing, and repeatable challenge formats are built.",
    reasons: [
      "Fitness has clear sponsor and product categories.",
      "Habit systems can produce recurring content.",
      "Local businesses are reachable for early revenue.",
    ],
    keyRisks: [
      "The market is crowded.",
      "Scientific credibility matters.",
      "Unsupported health claims can hurt trust.",
    ],
    suggestedActions: [
      "Start with Culver City gym/recovery pilots.",
      "Build expert-reviewed content templates.",
      "Create a summer transformation sponsor package.",
    ],
  },
];

export const founderBriefings: FounderBriefing[] = [
  {
    id: "morning-founder-brief",
    title: "Morning Founder Brief",
    cadence: "Morning",
    wins: [
      "HMG now has a multi-layer Maximillion architecture for revenue, missions, documents, relationships, and founder strategy.",
      "The strongest immediate monetization lanes are local FitHaven, SportsHaven tentpoles, and MusicHaven relationship-led packages.",
    ],
    risks: [
      "Too many verticals can create motion without proof.",
      "Sales packaging still needs concrete deliverables and pricing discipline.",
    ],
    opportunities: [
      "Turn one brand into a proof-of-revenue sprint this week.",
      "Use warm intros and local leads before chasing distant complex markets.",
    ],
    resourceGaps: [
      "Rate card",
      "sponsor deck",
      "follow-up cadence",
      "proof metrics",
    ],
    highLeverageActions: [
      "Pick one vertical package today.",
      "Send three sponsor asks.",
      "Schedule one buyer conversation.",
    ],
  },
  {
    id: "weekly-founder-brief",
    title: "Weekly Founder Brief",
    cadence: "Weekly",
    wins: [
      "Brand ecosystem thesis is broad but coherent around culture, media, events, and sponsorship.",
      "Maximillion can now rank opportunities without requiring provider calls.",
    ],
    risks: [
      "Weekly execution must prune ideas, not just add more.",
      "Audience acquisition strategy needs sharper testing.",
    ],
    opportunities: [
      "Clone one successful sponsor package across adjacent verticals.",
      "Turn one relationship into an intro or event opportunity.",
    ],
    resourceGaps: [
      "Analytics rhythm",
      "editorial calendar",
      "sales CRM hygiene",
      "delegation map",
    ],
    highLeverageActions: [
      "Review top five leads by value and ease.",
      "Kill or pause low-proof tasks.",
      "Publish one repeatable format.",
    ],
  },
  {
    id: "quarterly-founder-review",
    title: "Quarterly Founder Review",
    cadence: "Quarterly",
    wins: [
      "Haven has multiple credible expansion paths: premium editorial, fast culture, sports sponsorships, cannabis education, fitness habits, events, and AI workflows.",
      "The portfolio can compound if each brand has a clear role instead of competing for Trent's attention.",
    ],
    risks: [
      "Without proof gates, the ecosystem can become too wide too early.",
      "Capital, content volume, and sales operations must match ambition.",
    ],
    opportunities: [
      "Select one flagship revenue vertical and one audience-growth vertical per quarter.",
      "Use quarterly reviews to decide what scales, pauses, or gets delegated.",
    ],
    resourceGaps: [
      "Operating scorecard",
      "budget model",
      "contract templates",
      "repeatable sales assets",
      "team capacity plan",
    ],
    highLeverageActions: [
      "Set quarterly proof targets by brand.",
      "Rank verticals by revenue readiness and strategic upside.",
      "Decide the next hire, partner, or automation based on bottlenecks.",
    ],
  },
];

export const maximillionOperatingDoctrine: MaximillionOperatingDoctrine[] = [
  {
    id: "optimistic-not-naive",
    title: "Optimistic, not naive",
    principle:
      "These brands have massive upside potential, but none should be treated as guaranteed outcomes.",
    howMaximillionActs:
      "Names the upside, then asks what proof, distribution, capital, and execution are still missing.",
  },
  {
    id: "support-with-standards",
    title: "Aggressive support with standards",
    principle:
      "Maximillion supports Trent hard, but refuses to become a yes-man.",
    howMaximillionActs:
      "Challenges weak assumptions, vague revenue claims, unfunded scope, and ideas without next actions.",
  },
  {
    id: "evidence-driven",
    title: "Evidence beats hype",
    principle:
      "Strategic confidence rises when audience, sponsor, relationship, and operational evidence improves.",
    howMaximillionActs:
      "Separates vision, readiness, risk, capital intensity, and competitive pressure in the model.",
  },
  {
    id: "leverage-first",
    title: "Leverage first",
    principle:
      "The best move is the one that creates reusable assets, relationships, proof, or revenue systems.",
    howMaximillionActs:
      "Prioritizes packages, calendars, templates, warm intros, and proof loops over random hustle.",
  },
];

export function getStrategicConfidenceAverage(score: StrategicConfidenceScore) {
  const upside =
    score.visionScore +
    score.marketOpportunity +
    score.executionReadiness +
    score.audiencePotential +
    score.monetizationPotential;
  const drag =
    score.operationalRisk * 0.45 +
    score.capitalIntensity * 0.25 +
    score.competitivePressure * 0.3;
  return Math.max(0, Math.min(100, Math.round(upside / 5 - drag * 0.18)));
}

export function getStrategicConfidenceLabel(score: StrategicConfidenceScore) {
  const average = getStrategicConfidenceAverage(score);
  if (average >= 82) return "High upside, still proof-gated";
  if (average >= 72) return "Promising, needs tighter execution";
  if (average >= 62) return "Selective build, validate first";
  return "Hold until evidence improves";
}
