import type { SalesLead } from "@/lib/sales";
import { dailyMoneyTasks } from "@/components/newsroom/sales/mockMaximillionV3Data";
import {
  autopilotItems,
  morningMoneyReport,
  relationshipProfiles,
  revenueCalendarV2,
} from "@/components/newsroom/sales/mockMaximillionV4Data";

export type ExecutionActionStatus =
  | "Suggested"
  | "Approved"
  | "Active"
  | "Complete"
  | "Archived";

export type RelationshipEntityType =
  | "Person"
  | "Company"
  | "Brand"
  | "Event"
  | "City";

export type RelationshipLabel =
  | "friend"
  | "business"
  | "media"
  | "investor"
  | "sponsor"
  | "talent"
  | "high value"
  | "warm lead"
  | "cold lead";

export interface MaximillionExecutionAction {
  id: string;
  title: string;
  category: string;
  priorityScore: number;
  estimatedRevenueImpact: string;
  effortEstimate: "Low" | "Medium" | "High";
  dueDate: string;
  status: ExecutionActionStatus;
  rationale: string;
  nextStep: string;
}

export interface RelationshipGraphEntity {
  id: string;
  label: string;
  type: RelationshipEntityType;
  note: string;
}

export interface RelationshipGraphConnection {
  id: string;
  from: string;
  to: string;
  labels: RelationshipLabel[];
  strengthScore: number;
  lastInteraction: string;
  recommendedNextAction: string;
}

export interface OpportunityScoreFactors {
  revenuePotential: number;
  difficulty: number;
  brandAlignment: number;
  timeSensitivity: number;
  strategicValue: number;
  relationshipProximity: number;
}

export interface ScoredOpportunity {
  id: string;
  title: string;
  category: string;
  estimatedRevenue: string;
  recommendedAction: string;
  factors: OpportunityScoreFactors;
}

export interface PodcastBrainInput {
  id: string;
  title: string;
  inputType: "Podcast title" | "Video title" | "Manual summary" | "URL placeholder";
  sourcePlaceholder: string;
  manualSummary: string;
  keyLessons: string[];
  actionIdeas: string[];
  revenueOpportunities: string[];
  founderNotes: string[];
  hmgImplications: string[];
}

export interface FounderWarRoomState {
  todayPriorities: string[];
  moneyOpportunities: string[];
  followups: string[];
  meetings: string[];
  revenueAlerts: string[];
  brandOpportunities: string[];
  founderEnergyLevel: "Low" | "Medium" | "High" | "Locked In";
  roadblocks: string[];
}

export interface OfflineMoneyOpportunity {
  id: string;
  category:
    | "Speaking opportunities"
    | "Event appearances"
    | "Sponsor activations"
    | "Local networking"
    | "University opportunities"
    | "Brand partnerships"
    | "Consulting"
    | "Media interviews";
  title: string;
  estimatedRevenue: string;
  effort: "Low" | "Medium" | "High";
  bestFitBrands: string[];
  whyItWorks: string;
  nextAction: string;
}

export const ACTION_STORAGE_KEY = "hmg-maximillion-v8-actions-v1";

export const executionStatuses: ExecutionActionStatus[] = [
  "Suggested",
  "Approved",
  "Active",
  "Complete",
  "Archived",
];

export const seedExecutionActions: MaximillionExecutionAction[] = [
  {
    id: "action-equinox-culver",
    title: "Contact Equinox Culver City",
    category: "FitHaven local sponsor",
    priorityScore: 91,
    estimatedRevenueImpact: "$2,500-$7,500",
    effortEstimate: "Medium",
    dueDate: "This week",
    status: "Suggested",
    rationale:
      "FitHaven can package wellness content, transformation challenges, and local recovery stories for a premium gym buyer.",
    nextStep:
      "Ask for the general manager or partnerships lead and pitch a 30-day FitHaven local partner pilot.",
  },
  {
    id: "action-super-bowl-package",
    title: "Pitch SportsHaven Super Bowl package",
    category: "SportsHaven sponsorship",
    priorityScore: 96,
    estimatedRevenueImpact: "$7,500-$25,000",
    effortEstimate: "High",
    dueDate: "Next 48 hours",
    status: "Approved",
    rationale:
      "SportsHaven seasonal inventory becomes easier to price when the offer has watch-party, video, social, and newsletter deliverables.",
    nextStep:
      "Build one package with three price tiers and send it to sports bars, beverage brands, and recovery products.",
  },
  {
    id: "action-shannon-person",
    title: "Reconnect with Shannon Person",
    category: "Relationship follow-up",
    priorityScore: 84,
    estimatedRevenueImpact: "$1,500-$10,000",
    effortEstimate: "Low",
    dueDate: "Today",
    status: "Suggested",
    rationale:
      "Warm relationship motion can unlock intros faster than cold prospecting if the ask is specific.",
    nextStep:
      "Send a short reconnect note and ask who is buying local sponsor or media partnerships this quarter.",
  },
  {
    id: "action-cannabis-local",
    title: "Reach out to local cannabis brands",
    category: "CannaHaven sponsor lane",
    priorityScore: 88,
    estimatedRevenueImpact: "$3,000-$15,000",
    effortEstimate: "Medium",
    dueDate: "Before 4/20 pre-sell window",
    status: "Suggested",
    rationale:
      "CannaHaven can lead with compliant culture, education, and lifestyle sponsorship packages without making fake regulatory promises.",
    nextStep:
      "Create a compliant sponsor list and lead with event recap, newsletter, and creator-safe content inventory.",
  },
];

export const relationshipGraphEntities: RelationshipGraphEntity[] = [
  {
    id: "trent",
    label: "Trent Clark",
    type: "Person",
    note: "Founder, editorial architect, relationship driver.",
  },
  {
    id: "adrian-swish",
    label: "Adrian Swish",
    type: "Person",
    note: "Music, creator, and artist-access relationship lane.",
  },
  {
    id: "shannon-person",
    label: "Shannon Person",
    type: "Person",
    note: "Warm relationship to reconnect around sponsor and local market intros.",
  },
  {
    id: "sports-bars-la",
    label: "LA Sports Bars",
    type: "Company",
    note: "Local SportsHaven Super Bowl and NBA Finals sponsor targets.",
  },
  {
    id: "fithaven",
    label: "FitHaven",
    type: "Brand",
    note: "Fitness, recovery, habit systems, and wellness sponsor lane.",
  },
  {
    id: "cannahaven",
    label: "CannaHaven",
    type: "Brand",
    note: "Cannabis culture, compliant education, and lifestyle partnerships.",
  },
  {
    id: "culver-city",
    label: "Culver City",
    type: "City",
    note: "Local market for gyms, studios, venues, and creator-friendly brands.",
  },
  {
    id: "super-bowl",
    label: "Super Bowl",
    type: "Event",
    note: "High-intent sports sponsorship and watch-party packaging moment.",
  },
];

export const relationshipGraphConnections: RelationshipGraphConnection[] = [
  {
    id: "trent-adrian",
    from: "trent",
    to: "adrian-swish",
    labels: ["media", "talent", "high value"],
    strengthScore: 82,
    lastInteraction: "Relationship seed from Maximillion memory",
    recommendedNextAction:
      "Send a respectful intro around artist access, sponsor packages, and event coverage.",
  },
  {
    id: "trent-shannon",
    from: "trent",
    to: "shannon-person",
    labels: ["friend", "warm lead", "business"],
    strengthScore: 76,
    lastInteraction: "Needs manual update",
    recommendedNextAction:
      "Reconnect with a direct ask for two buyers or venues worth meeting.",
  },
  {
    id: "trent-culver",
    from: "trent",
    to: "culver-city",
    labels: ["business", "warm lead"],
    strengthScore: 71,
    lastInteraction: "Local lead scout prompt",
    recommendedNextAction:
      "Run a Culver City gym and recovery studio outreach block for FitHaven.",
  },
  {
    id: "fithaven-culver",
    from: "fithaven",
    to: "culver-city",
    labels: ["sponsor", "business"],
    strengthScore: 88,
    lastInteraction: "V4 scout lane",
    recommendedNextAction:
      "Package FitHaven local activation inventory before contacting studios.",
  },
  {
    id: "sportshaven-super-bowl",
    from: "sports-bars-la",
    to: "super-bowl",
    labels: ["sponsor", "high value"],
    strengthScore: 92,
    lastInteraction: "Seasonal calendar signal",
    recommendedNextAction:
      "Pitch a three-tier watch-party and video sponsorship package.",
  },
  {
    id: "canna-local",
    from: "cannahaven",
    to: "culver-city",
    labels: ["cold lead", "sponsor"],
    strengthScore: 63,
    lastInteraction: "Compliance-sensitive opportunity lane",
    recommendedNextAction:
      "Build a compliant local cannabis partner list before outreach.",
  },
];

export const scoredOpportunities: ScoredOpportunity[] = [
  {
    id: "score-super-bowl",
    title: "SportsHaven Super Bowl sponsor package",
    category: "Seasonal sponsorship",
    estimatedRevenue: "$7,500-$25,000",
    recommendedAction:
      "Approve package build, then send to sports bars, beverage brands, and recovery products.",
    factors: {
      revenuePotential: 94,
      difficulty: 58,
      brandAlignment: 92,
      timeSensitivity: 96,
      strategicValue: 88,
      relationshipProximity: 64,
    },
  },
  {
    id: "score-fithaven-culver",
    title: "FitHaven Culver City gym partner sprint",
    category: "Local partner sprint",
    estimatedRevenue: "$2,500-$12,500",
    recommendedAction:
      "Contact five gyms or recovery studios with one pilot offer and a simple reporting promise.",
    factors: {
      revenuePotential: 76,
      difficulty: 42,
      brandAlignment: 91,
      timeSensitivity: 74,
      strategicValue: 82,
      relationshipProximity: 72,
    },
  },
  {
    id: "score-cannahaven-420",
    title: "CannaHaven 4/20 compliant sponsor lane",
    category: "Cultural sponsorship",
    estimatedRevenue: "$3,000-$18,000",
    recommendedAction:
      "Draft compliant sponsor language and prioritize education, events, and lifestyle-safe inventory.",
    factors: {
      revenuePotential: 84,
      difficulty: 68,
      brandAlignment: 87,
      timeSensitivity: 90,
      strategicValue: 80,
      relationshipProximity: 52,
    },
  },
  {
    id: "score-founder-speaking",
    title: "Founder speaking and media interview route",
    category: "Offline money",
    estimatedRevenue: "$1,500-$20,000",
    recommendedAction:
      "Build a founder one-sheet covering culture, media, AI publishing, and HMG's ecosystem thesis.",
    factors: {
      revenuePotential: 80,
      difficulty: 50,
      brandAlignment: 89,
      timeSensitivity: 68,
      strategicValue: 94,
      relationshipProximity: 70,
    },
  },
];

export const podcastBrainSeed: PodcastBrainInput[] = [
  {
    id: "podcast-media-sales",
    title: "Manual note: media sales packaging",
    inputType: "Manual summary",
    sourcePlaceholder: "No file or feed parsed",
    manualSummary:
      "Strong media businesses turn audience attention into repeatable packages: show, prove, price, follow up.",
    keyLessons: [
      "A sales deck needs one next ask, not every possible capability.",
      "Packages are easier to buy than custom strategy conversations.",
      "Founder stories help when they are tied to buyer outcomes.",
    ],
    actionIdeas: [
      "Create a one-page SportsHaven sponsorship offer.",
      "Turn FitHaven local content into a repeatable studio pilot.",
    ],
    revenueOpportunities: [
      "Direct-sold video sponsorship",
      "Newsletter placement",
      "Founder interview series sponsor",
    ],
    founderNotes: [
      "Use the executive voice: clear, warm, and proof-driven.",
      "Do not let podcast inspiration replace follow-up discipline.",
    ],
    hmgImplications: [
      "Every content insight should end with a buyer category.",
      "Podcast notes can become action queue items later.",
    ],
  },
];

export const offlineMoneyOpportunities: OfflineMoneyOpportunity[] = [
  {
    id: "offline-speaking-ai-media",
    category: "Speaking opportunities",
    title: "AI media ecosystem talk",
    estimatedRevenue: "$2,500-$15,000",
    effort: "Medium",
    bestFitBrands: ["HMG", "HipHopHaven", "AI / AEO"],
    whyItWorks:
      "Trent can speak from founder, editorial, and product architecture experience without overclaiming outcomes.",
    nextAction:
      "Draft a founder speaker one-sheet and send it to universities, creator conferences, and media events.",
  },
  {
    id: "offline-festival-panel",
    category: "Event appearances",
    title: "Festival media panel or live interview desk",
    estimatedRevenue: "$5,000-$25,000",
    effort: "High",
    bestFitBrands: ["MusicHaven", "HipHopHaven", "RapHaven"],
    whyItWorks:
      "Festival moments need media coverage, creator access, interviews, and sponsor-friendly recaps.",
    nextAction:
      "Build a festival partner one-pager with interview, recap, and sponsor deliverables.",
  },
  {
    id: "offline-gym-pop-up",
    category: "Sponsor activations",
    title: "FitHaven local challenge pop-up",
    estimatedRevenue: "$3,000-$12,000",
    effort: "Medium",
    bestFitBrands: ["FitHaven", "SportsHaven"],
    whyItWorks:
      "Local gyms and recovery studios can buy lightweight activations when deliverables are clear.",
    nextAction:
      "Pitch one gym, one recovery product, and one creator partner as a bundled pilot.",
  },
  {
    id: "offline-la-networking",
    category: "Local networking",
    title: "LA sponsor breakfast circuit",
    estimatedRevenue: "$1,500-$10,000",
    effort: "Low",
    bestFitBrands: ["HMG", "SportsHaven", "CannaHaven"],
    whyItWorks:
      "Warm, in-person buyer conversations can shorten trust-building for local sponsor packages.",
    nextAction:
      "Pick three local venues and ask for owner, GM, or partnerships introductions.",
  },
  {
    id: "offline-university",
    category: "University opportunities",
    title: "Culture, media, and entrepreneurship guest lecture",
    estimatedRevenue: "$1,000-$7,500",
    effort: "Medium",
    bestFitBrands: ["HipHopHaven", "MusicHaven", "HMG"],
    whyItWorks:
      "Universities buy credible founder/operator perspectives when the topic is timely and practical.",
    nextAction:
      "Package a 45-minute talk plus workshop and target communications, business, and music programs.",
  },
  {
    id: "offline-consulting",
    category: "Consulting",
    title: "Media monetization audit",
    estimatedRevenue: "$2,500-$20,000",
    effort: "Medium",
    bestFitBrands: ["HMG"],
    whyItWorks:
      "HMG's own buildout can become a consulting proof point for creators and small media companies.",
    nextAction:
      "Define a fixed-scope audit: inventory, sponsorship packaging, content lanes, and 30-day action plan.",
  },
];

export function calculateOpportunityScore(factors: OpportunityScoreFactors) {
  return clampScore(
    factors.revenuePotential * 0.22 +
      (100 - factors.difficulty) * 0.16 +
      factors.brandAlignment * 0.18 +
      factors.timeSensitivity * 0.14 +
      factors.strategicValue * 0.18 +
      factors.relationshipProximity * 0.12,
  );
}

export function getScoreLabel(score: number) {
  if (score >= 86) return "Attack now";
  if (score >= 74) return "Strong move";
  if (score >= 62) return "Package first";
  return "Hold for later";
}

export function generateActionQueue(leads: SalesLead[]) {
  if (!leads.length) return seedExecutionActions;
  const leadActions = leads.slice(0, 4).map((lead, index) => ({
    id: `action-lead-${lead.id}`,
    title: `Move ${lead.company} to next commitment`,
    category: lead.revenueType.replaceAll("_", " "),
    priorityScore: clampScore(72 + Math.min(lead.estimatedValue / 1000, 22) - index * 4),
    estimatedRevenueImpact: `$${Math.max(500, Math.round(lead.estimatedValue * 0.25)).toLocaleString()}-$${lead.estimatedValue.toLocaleString()}`,
    effortEstimate: lead.priority === "urgent" ? "High" : lead.priority === "high" ? "Medium" : "Low",
    dueDate: lead.nextFollowUpAt || "This week",
    status: lead.stage === "deck_sent" ? "Active" : "Suggested",
    rationale:
      "Existing pipeline leads should be converted into the next clear buyer action before adding more motion.",
    nextStep:
      lead.stage === "deck_sent"
        ? "Follow up with a tighter offer and one clear CTA."
        : "Confirm buyer, budget lane, and the next meeting or package review.",
  })) satisfies MaximillionExecutionAction[];

  return [...leadActions, ...seedExecutionActions].slice(0, 8);
}

export function readExecutionActions(leads: SalesLead[]) {
  if (typeof window === "undefined") return generateActionQueue(leads);
  try {
    const raw = window.localStorage.getItem(ACTION_STORAGE_KEY);
    if (!raw) return generateActionQueue(leads);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return generateActionQueue(leads);
    return parsed
      .filter((item): item is MaximillionExecutionAction =>
        Boolean(
          item &&
            typeof item.id === "string" &&
            typeof item.title === "string" &&
            executionStatuses.includes(item.status),
        ),
      )
      .slice(0, 40);
  } catch {
    return generateActionQueue(leads);
  }
}

export function writeExecutionActions(actions: MaximillionExecutionAction[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTION_STORAGE_KEY, JSON.stringify(actions.slice(0, 40)));
  } catch {
    /* ignore local action persistence failures */
  }
}

export function buildFounderWarRoom(leads: SalesLead[]): FounderWarRoomState {
  const activeLeads = leads.filter(
    (lead) => lead.stage !== "closed_won" && lead.stage !== "closed_lost",
  );
  return {
    todayPriorities: [
      dailyMoneyTasks[0]?.nextAction ?? "Price one sponsor package and ask for the meeting.",
      "Approve one action queue item and move it to Active.",
      "Convert one relationship into a specific buyer intro.",
    ],
    moneyOpportunities: [
      dailyMoneyTasks[0]?.title ?? "SportsHaven sponsor sprint",
      autopilotItems[0]?.title ?? "Local partner sprint",
      revenueCalendarV2[0]?.moment ?? "Seasonal sponsor package",
    ],
    followups: activeLeads.length
      ? activeLeads.slice(0, 3).map((lead) => `${lead.company}: ${lead.nextFollowUpAt || "set follow-up date"}`)
      : morningMoneyReport.followUps.slice(0, 3),
    meetings: morningMoneyReport.calendarSuggestions.slice(0, 3),
    revenueAlerts: [
      "Do not let advice sit unapproved. Pick one revenue action and assign a due date.",
      "Buyer objections need package value, measurement, and one next ask.",
      "Local opportunities should be moved into the CRM only when there is a named buyer lane.",
    ],
    brandOpportunities: [
      "FitHaven: local gyms, recovery studios, and summer challenge sponsors.",
      "SportsHaven: Super Bowl, NBA Finals, watch parties, and beverage sponsors.",
      "CannaHaven: compliant education, lifestyle events, and 4/20 sponsor pre-sell.",
    ],
    founderEnergyLevel: activeLeads.length >= 3 ? "Locked In" : "High",
    roadblocks: [
      "No fake live research: all V8 recommendations are local deterministic outputs.",
      "Need tighter rate cards before pitching larger direct-sold campaigns.",
      "Follow-up history needs manual updates until CRM sync is connected.",
    ],
  };
}

export function generatePodcastBrainOutput(input: string): PodcastBrainInput {
  const normalized = input.toLowerCase();
  const sports = normalized.includes("sport") || normalized.includes("super bowl");
  const music = normalized.includes("music") || normalized.includes("artist") || normalized.includes("hip hop");
  const fitness = normalized.includes("fitness") || normalized.includes("gym") || normalized.includes("health");
  const title = input.trim() || "Manual revenue lesson";

  return {
    id: `podcast-local-${Date.now().toString(36)}`,
    title,
    inputType: normalized.includes("http") ? "URL placeholder" : "Manual summary",
    sourcePlaceholder: normalized.includes("http")
      ? "URL saved as placeholder only. No fetch or parsing ran."
      : "Manual local note. No audio/video parser ran.",
    manualSummary:
      "Maximillion read this as a manual business lesson and converted it into operator notes.",
    keyLessons: [
      sports
        ? "Sports moments monetize best when the package is tied to a calendar deadline."
        : music
          ? "Music opportunities need access, authenticity, and sponsor-safe recap value."
          : fitness
            ? "Fitness buyers respond to clear transformation, accountability, and local proof."
            : "The insight needs to become a priced package, a buyer list, and a follow-up action.",
      "Do not confuse inspiration with execution.",
      "The next ask should be small enough for a buyer to answer quickly.",
    ],
    actionIdeas: [
      sports
        ? "Draft a SportsHaven sponsor package with one premium and one pilot tier."
        : "Turn this into one action queue item with a due date.",
      "Save one founder note and one outreach angle.",
    ],
    revenueOpportunities: [
      music ? "artist interview sponsorship" : "direct-sold content sponsorship",
      fitness ? "local gym challenge partner" : "newsletter or podcast sponsor",
      "consulting or speaking follow-up",
    ],
    founderNotes: [
      "Keep the insight practical, not performative.",
      "Ask: what can be sold, who buys it, and what happens next?",
    ],
    hmgImplications: [
      "Podcast and video notes can become action-center tasks later.",
      "Future ingestion can route into summaries, charts, and CRM actions after safe parsing is built.",
    ],
  };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
