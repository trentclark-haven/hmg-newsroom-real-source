import type {
  LeadPriority,
  RevenueType,
  SalesLead,
  SalesLeadInput,
} from "@/lib/sales";
import type { HavenAIResponse } from "@/lib/hmg/haven-ai";
import {
  eventRevenuePlays,
  formatCurrency,
  generateMaximillionBrief,
  mockOpportunities,
  mockReportOutputs,
  sponsorTargets,
} from "@/components/newsroom/sales/mockMaximillionData";
import { dailyMoneyTasks } from "@/components/newsroom/sales/mockMaximillionV3Data";
import {
  autopilotItems,
  introDrafts,
  relationshipProfiles,
  revenueCalendarV2,
  runLocalLeadScoutEngine,
  type LocalLeadScoutResult,
} from "@/components/newsroom/sales/mockMaximillionV4Data";
import {
  founderBriefings,
  getStrategicConfidenceAverage,
  getStrategicConfidenceLabel,
  havenStrategicTheses,
  strategicConfidenceScores,
} from "@/components/newsroom/sales/mockMaximillionV5Data";

export type MaximillionChatIntent =
  | "daily_money"
  | "local_leads"
  | "sponsor_ideas"
  | "event_ideas"
  | "introduce_contact"
  | "founder_brief"
  | "brand_thesis"
  | "sales_report"
  | "unknown";

export type MaximillionSuggestedActionKind =
  | "lead"
  | "task"
  | "event"
  | "memory"
  | "copy"
  | "module";

export interface MaximillionSuggestedAction {
  id: string;
  label: string;
  kind: MaximillionSuggestedActionKind;
  payload: string;
}

export interface MaximillionChatResponse {
  intent: MaximillionChatIntent;
  confidence: number;
  message: string;
  suggestedActions: MaximillionSuggestedAction[];
  relatedModule: string;
  canCreateLead: boolean;
  canCreateTask: boolean;
  canCreateEventIdea: boolean;
  leadInput?: SalesLeadInput;
  taskNote?: string;
  eventIdea?: string;
  memoryNote?: string;
  outreachDraft?: string;
}

export interface MaximillionChatMessage {
  id: string;
  role: "trent" | "maximillion";
  content: string;
  createdAt: string;
  intent?: MaximillionChatIntent;
  pinned?: boolean;
  response?: MaximillionChatResponse;
  /** True when this reply's prose came from the live AI lane (not the local engine). */
  aiLane?: boolean;
  /** Provider that produced the prose: "openai" for the AI lane, "local-template" otherwise. */
  provider?: string;
  /** Rich Haven AI Engine output (sections, copy packets, lane status). */
  haven?: HavenAIResponse;
}

export interface MaximillionChatContext {
  leads?: SalesLead[];
}

export const maximillionStarterPrompts = [
  "Max, what should I chase for money today?",
  "Find me FitHaven gym leads near Culver City.",
  "Give me SportsHaven Super Bowl sponsor ideas.",
  "Introduce yourself to Adrian Swish.",
  "Turn this expense note into a report.",
  "What's the highest upside Haven brand today?",
];

const localModeLead =
  "Browser-Only Mode: I am using HMG's deterministic Maximillion data right now, not live web browsing or a provider call.";

export function generateMaximillionChatResponse(
  input: string,
  context: MaximillionChatContext = {},
): MaximillionChatResponse {
  const normalized = normalize(input);
  const intent = detectIntent(normalized);

  switch (intent) {
    case "daily_money":
      return buildDailyMoneyResponse(context.leads ?? []);
    case "local_leads":
      return buildLocalLeadResponse(input);
    case "sponsor_ideas":
      return buildSponsorIdeasResponse(normalized);
    case "event_ideas":
      return buildEventIdeasResponse(normalized);
    case "introduce_contact":
      return buildIntroduceContactResponse(normalized);
    case "founder_brief":
      return buildFounderBriefResponse();
    case "brand_thesis":
      return buildBrandThesisResponse();
    case "sales_report":
      return buildSalesReportResponse(normalized);
    default:
      return buildUnknownResponse();
  }
}

function detectIntent(normalized: string): MaximillionChatIntent {
  if (
    hasAny(normalized, [
      "money today",
      "chase for money",
      "what should i chase",
      "today's money",
      "today money",
      "quick wins",
      "calls to make",
      "money ideas",
      "give me money",
      "morning money",
      "morning report",
    ])
  ) {
    return "daily_money";
  }

  if (
    hasAny(normalized, [
      "culver",
      "gym",
      "gyms",
      "fitness leads",
      "fithaven",
      "cannabis brands around la",
      "local leads",
      "near me",
      "near culver",
      "speaking opportunities",
      "keynote",
      "hip hop brands",
      "hip-hop brands",
      "where should i stop",
      "opportunities nearby",
      "nearby opportunities",
    ])
  ) {
    return "local_leads";
  }

  if (
    hasAny(normalized, [
      "sponsor",
      "sponsorship",
      "advertiser",
      "super bowl",
      "sports bars",
      "podcast sponsors",
    ])
  ) {
    return "sponsor_ideas";
  }

  if (
    hasAny(normalized, [
      "event idea",
      "event ideas",
      "festival",
      "calendar",
      "rolling loud",
      "coachella",
      "stagecoach",
      "420",
    ])
  ) {
    return "event_ideas";
  }

  if (
    hasAny(normalized, [
      "adrian",
      "introduce yourself",
      "intro",
      "introduction",
      "meet ",
      "relationship",
      "reconnect",
      "who should i reconnect",
    ])
  ) {
    return "introduce_contact";
  }

  if (
    hasAny(normalized, [
      "founder brief",
      "morning founder",
      "weekly founder",
      "quarterly",
      "brief me",
      "trent brief",
    ])
  ) {
    return "founder_brief";
  }

  if (
    hasAny(normalized, [
      "highest upside",
      "haven brand",
      "brand thesis",
      "which brand",
      "strategic thesis",
      "upside haven",
    ])
  ) {
    return "brand_thesis";
  }

  if (
    hasAny(normalized, [
      "expense",
      "report",
      "sales report",
      "deal memo",
      "forecast",
      "deck summary",
      "call prep",
    ])
  ) {
    return "sales_report";
  }

  return "unknown";
}

function buildDailyMoneyResponse(leads: SalesLead[]): MaximillionChatResponse {
  const brief = generateMaximillionBrief(leads);
  const topTasks = dailyMoneyTasks.slice(0, 3);
  const autopilot = autopilotItems.slice(0, 2);
  const activeValue = leads
    .filter((lead) => lead.stage !== "closed_won" && lead.stage !== "closed_lost")
    .reduce((sum, lead) => sum + lead.estimatedValue, 0);

  const taskLines = topTasks
    .map(
      (task) =>
        `- ${titleCase(task.priority)}: ${task.title} (${task.estimatedRevenueImpact}). ${task.nextAction}`,
    )
    .join("\n");
  const autopilotLine = autopilot
    .map((item) => `${item.title}: ${item.action}`)
    .join(" ");

  const message = [
    localModeLead,
    "",
    `Trent, today's cleanest move is to convert attention into a priced package. ${brief.bestNextMove}`,
    activeValue
      ? `Visible active pipeline is ${formatCurrency(activeValue)}. Protect the follow-up cadence and keep the buyer focused on one CTA.`
      : "Pipeline is not showing priced active value yet, so the first win is to create qualified, priced opportunities.",
    "",
    "Today's money stack:",
    taskLines,
    "",
    `Rate-card thinking: ${brief.rateCardThinking}`,
    `Next-best ask: ${brief.nextBestAsk}`,
    `Operator note: ${autopilotLine}`,
  ].join("\n");

  return {
    intent: "daily_money",
    confidence: 0.92,
    message,
    suggestedActions: [
      action("task-daily", "Create follow-up list", "task", topTasks[0].nextAction),
      action("module-today", "Open Today's Money", "module", "#maximillion-todays-money"),
      action("memory-daily", "Save brief to memory", "memory", brief.founderNote),
    ],
    relatedModule: "Today's Money",
    canCreateLead: false,
    canCreateTask: true,
    canCreateEventIdea: false,
    taskNote: `${topTasks[0].title}: ${topTasks[0].nextAction}`,
    memoryNote: brief.founderNote,
  };
}

function buildLocalLeadResponse(input: string): MaximillionChatResponse {
  const run = runLocalLeadScoutEngine(input);
  const best = run.results[0];
  const nextTwo = run.results.slice(0, 3);
  const leadLines = nextTwo
    .map(
      (lead, index) =>
        `${index + 1}. ${lead.leadName} - ${lead.category}, ${lead.revenueEstimate}, urgency ${lead.urgencyScore}/100. ${lead.reasoningSummary}`,
    )
    .join("\n");

  const leadInput = best ? scoutResultToLeadInput(best) : undefined;
  const message = [
    localModeLead,
    "",
    `I read that as: ${run.interpretedIntent}. No live map or internet scan is running yet; this is the local scout model using HMG seed intelligence.`,
    "",
    leadLines,
    "",
    best
      ? `Best first move: ${best.leadName}. FitHaven compatibility is ${best.compatibility.FitHaven}/100, SportsHaven is ${best.compatibility.SportsHaven}/100, and the estimated deal value is ${best.estimatedDealValue}.`
      : "Best first move: add one local prospect manually, then let Maximillion score it against HMG verticals.",
    "Suggested outreach angle: offer a 30-day sponsor pilot with one content drop, one social recap, and one clear reporting note.",
  ].join("\n");

  return {
    intent: "local_leads",
    confidence: 0.9,
    message,
    suggestedActions: [
      action("lead-scout", "Add best lead to pipeline", "lead", best?.leadName ?? "Local lead"),
      action("task-scout", "Create local follow-up", "task", best?.reasoningSummary ?? run.sourceNotice),
      action("module-scout", "Open Lead Intelligence", "module", "#maximillion-lead-intelligence"),
    ],
    relatedModule: "Lead Intelligence Center",
    canCreateLead: Boolean(leadInput),
    canCreateTask: true,
    canCreateEventIdea: false,
    leadInput,
    taskNote: best
      ? `Follow up with ${best.leadName}: pitch a 30-day local partner pilot.`
      : "Add a local prospect and score it against HMG brand fit.",
    memoryNote: best
      ? `${best.leadName} local scout result: ${best.reasoningSummary}`
      : run.sourceNotice,
  };
}

function buildSponsorIdeasResponse(normalized: string): MaximillionChatResponse {
  const sportsFocused = hasAny(normalized, ["sports", "super bowl", "sportshaven"]);
  const topOpportunity =
    mockOpportunities.find((opportunity) =>
      sportsFocused ? opportunity.id.includes("sports") : opportunity.category === "youtube_video",
    ) ?? mockOpportunities[0];
  const targets = sponsorTargets.slice(0, 4);
  const targetLines = targets
    .map(
      (target) =>
        `- ${target.companyOrCategory}: fit ${target.fitScore}/100. ${target.nextAction}`,
    )
    .join("\n");

  const leadInput: SalesLeadInput = {
    company: targets[0].companyOrCategory,
    contactName: "",
    contactTitle: "Partnerships / brand marketing lead",
    email: "",
    phone: "",
    website: "",
    stage: "lead",
    priority: "high",
    estimatedValue: 10000,
    revenueType: sportsFocused ? "event_sponsorship" : "social_sponsorship",
    brandFit: topOpportunity.whyItMatters,
    source: "Maximillion chat local sponsor ideas",
    tags: ["maximillion", "sponsor", ...targets[0].havenBrands.map((brand) => brand.toLowerCase())],
    notes: [
      topOpportunity.suggestedPlay,
      `Suggested pitch: ${targets[0].suggestedPitch}`,
      `Next action: ${targets[0].nextAction}`,
    ].join("\n"),
    nextFollowUpAt: "",
    owner: "Trent",
    contact: "",
    category: targets[0].companyOrCategory,
    interestedSilos: targets[0].havenBrands.map((brand) => brand.toLowerCase()),
    proposedSpend: topOpportunity.estimatedValueRange,
    nextFollowUp: "",
  };

  const message = [
    localModeLead,
    "",
    `Sponsor angle: ${topOpportunity.title} (${topOpportunity.estimatedValueRange}). ${topOpportunity.whyItMatters}`,
    "",
    targetLines,
    "",
    `Package value: ${topOpportunity.suggestedPlay}`,
    "Buyer objection to expect: measurement. Answer with deliverables, reporting cadence, usage rights, and a short pilot window.",
    `Next-best ask: ${topOpportunity.nextAction}`,
  ].join("\n");

  return {
    intent: "sponsor_ideas",
    confidence: 0.88,
    message,
    suggestedActions: [
      action("lead-sponsor", "Add sponsor bucket", "lead", targets[0].companyOrCategory),
      action("task-sponsor", "Create sponsor outreach", "task", topOpportunity.nextAction),
      action("copy-sponsor", "Copy pitch angle", "copy", targets[0].suggestedPitch),
    ],
    relatedModule: "Opportunity Radar",
    canCreateLead: true,
    canCreateTask: true,
    canCreateEventIdea: false,
    leadInput,
    taskNote: topOpportunity.nextAction,
    memoryNote: `${topOpportunity.title}: ${topOpportunity.suggestedPlay}`,
    outreachDraft: targets[0].suggestedPitch,
  };
}

function buildEventIdeasResponse(normalized: string): MaximillionChatResponse {
  const event =
    revenueCalendarV2.find((item) => normalized.includes(item.id.replaceAll("-", " "))) ??
    revenueCalendarV2.find((item) =>
      item.moment.toLowerCase().split(" ").some((word) => normalized.includes(word)),
    ) ??
    revenueCalendarV2[0];
  const legacyEvent =
    eventRevenuePlays.find((play) =>
      event.moment.toLowerCase().includes(play.eventName.toLowerCase().split(" ")[0]),
    ) ?? eventRevenuePlays[0];

  const message = [
    localModeLead,
    "",
    `${event.moment} is the calendar lane. Projected local draft range: ${event.projectedRevenue}.`,
    `Potential sponsors: ${event.potentialSponsors.join(", ")}.`,
    `Content ideas: ${event.contentIdeas.join(", ")}.`,
    `Ad package opportunity: ${legacyEvent.activationIdeas.join(", ")}.`,
    `Suggested meetings: ${event.suggestedMeetings.join(", ")}.`,
    "",
    `Next action: ${event.actionChecklist[0]}, then ${event.actionChecklist[1]}.`,
  ].join("\n");

  return {
    intent: "event_ideas",
    confidence: 0.86,
    message,
    suggestedActions: [
      action("event-add", "Add event idea", "event", `${event.moment}: ${event.actionChecklist[0]}`),
      action("task-event", "Create event checklist", "task", event.actionChecklist.join("; ")),
      action("module-event", "Open Revenue Calendar", "module", "#maximillion-deep-intel"),
    ],
    relatedModule: "Revenue Calendar Intelligence",
    canCreateLead: false,
    canCreateTask: true,
    canCreateEventIdea: true,
    eventIdea: `${event.moment}: ${event.contentIdeas[0]} with ${event.potentialSponsors[0]} sponsor angle.`,
    taskNote: event.actionChecklist.join("; "),
    memoryNote: `${event.moment} revenue lane: ${event.projectedRevenue}.`,
  };
}

function buildIntroduceContactResponse(normalized: string): MaximillionChatResponse {
  const adrian = relationshipProfiles.find((profile) =>
    normalized.includes("adrian") ? profile.id === "adrian-swish" : profile.id !== "trent",
  );
  const draft = introDrafts.find((item) => item.type === "Initial outreach") ?? introDrafts[0];
  const contactName = adrian?.name ?? "the contact";
  const contactFit =
    adrian?.potentialHmgRelevance ??
    "Potential partner for HMG relationship, sponsor, and event strategy.";
  const message = [
    localModeLead,
    "",
    `Intro position for ${contactName}: lead with respect, clarity, and business relevance. Keep it warm, pro-Black, and direct without forcing slang.`,
    `HMG relevance: ${contactFit}`,
    "",
    "Draft:",
    `What's good ${contactName.split(" ")[0]} - quick intro. I'm Trent from Haven Media Group. We're building culture-first media lanes across music, sports, fitness, cannabis, and AI-enabled publishing. I think there may be a clean fit around artist access, sponsor packages, and event moments. Worth a quick 15-minute conversation next week?`,
    "",
    `Max note: ${draft.nextStep}`,
  ].join("\n");

  return {
    intent: "introduce_contact",
    confidence: 0.84,
    message,
    suggestedActions: [
      action("copy-intro", "Copy outreach draft", "copy", message),
      action("memory-intro", "Save relationship note", "memory", contactFit),
      action("task-intro", "Create intro follow-up", "task", draft.nextStep),
    ],
    relatedModule: "Relationship Memory",
    canCreateLead: false,
    canCreateTask: true,
    canCreateEventIdea: false,
    taskNote: `Follow up on ${contactName} intro: ${draft.nextStep}`,
    memoryNote: `${contactName}: ${contactFit}`,
    outreachDraft: message,
  };
}

function buildFounderBriefResponse(): MaximillionChatResponse {
  const brief = founderBriefings[0];
  const message = [
    localModeLead,
    "",
    `${brief.title}: Maximillion is aggressively supportive of Trent, but not a hype machine.`,
    "",
    `Wins: ${brief.wins.slice(0, 2).join(" ")}`,
    `Risks: ${brief.risks.slice(0, 2).join(" ")}`,
    `Opportunities: ${brief.opportunities.slice(0, 2).join(" ")}`,
    `Resource gaps: ${brief.resourceGaps.slice(0, 2).join(" ")}`,
    "",
    `High-leverage action: ${brief.highLeverageActions[0]}`,
  ].join("\n");

  return {
    intent: "founder_brief",
    confidence: 0.86,
    message,
    suggestedActions: [
      action("memory-founder", "Save founder brief", "memory", message),
      action("task-founder", "Create leverage action", "task", brief.highLeverageActions[0]),
      action("module-founder", "Open Founder DNA", "module", "#maximillion-deep-intel"),
    ],
    relatedModule: "Founder DNA Engine",
    canCreateLead: false,
    canCreateTask: true,
    canCreateEventIdea: false,
    taskNote: brief.highLeverageActions[0],
    memoryNote: `${brief.title}: ${brief.highLeverageActions[0]}`,
  };
}

function buildBrandThesisResponse(): MaximillionChatResponse {
  const ranked = strategicConfidenceScores
    .map((score) => ({
      score,
      average: getStrategicConfidenceAverage(score),
      thesis: havenStrategicTheses.find((item) => item.id === score.brandId),
    }))
    .sort((a, b) => b.average - a.average);
  const top = ranked[0];
  const topThesis = top.thesis ?? havenStrategicTheses[0];
  const nextTwo = ranked.slice(0, 3);
  const rankedLines = nextTwo
    .map(
      (item, index) =>
        `${index + 1}. ${item.thesis?.brand ?? item.score.brandId}: ${item.average}/100 - ${getStrategicConfidenceLabel(item.score)}.`,
    )
    .join("\n");

  const message = [
    localModeLead,
    "",
    `Highest-upside brand today: ${topThesis.brand}. This is not a guarantee; it is the strongest evidence-weighted lane in the local model.`,
    topThesis.currentThesis,
    "",
    rankedLines,
    "",
    `Why it matters: ${top.score.reasons.slice(0, 2).join(" ")}`,
    `Risk to respect: ${top.score.keyRisks[0]}`,
    `Suggested action: ${top.score.suggestedActions[0]}`,
  ].join("\n");

  return {
    intent: "brand_thesis",
    confidence: 0.89,
    message,
    suggestedActions: [
      action("memory-thesis", "Save thesis note", "memory", message),
      action("task-thesis", "Create brand action", "task", top.score.suggestedActions[0]),
      action("module-thesis", "Open Founder DNA", "module", "#maximillion-deep-intel"),
    ],
    relatedModule: "Haven Thesis Engine",
    canCreateLead: false,
    canCreateTask: true,
    canCreateEventIdea: false,
    taskNote: top.score.suggestedActions[0],
    memoryNote: `${topThesis.brand}: ${topThesis.currentThesis}`,
  };
}

function buildSalesReportResponse(normalized: string): MaximillionChatResponse {
  const report =
    mockReportOutputs.find((item) =>
      normalized.includes(item.reportType.replaceAll("-", " ")),
    ) ??
    (normalized.includes("expense")
      ? mockReportOutputs.find((item) => item.reportType === "expense-breakdown")
      : undefined) ??
    mockReportOutputs.find((item) => item.reportType === "weekly-sales-report") ??
    mockReportOutputs[0];

  const bulletLines = report.bullets.map((bullet) => `- ${bullet}`).join("\n");
  const message = [
    localModeLead,
    "",
    `${report.title}: ${report.summary}`,
    "",
    bulletLines,
    "",
    "Document note: this is a local draft report scaffold. No file parsing, accounting review, legal review, or provider reasoning is active.",
  ].join("\n");

  return {
    intent: "sales_report",
    confidence: 0.82,
    message,
    suggestedActions: [
      action("copy-report", "Copy report", "copy", message),
      action("task-report", "Create report follow-up", "task", report.bullets[0]),
      action("module-report", "Open Revenue Docs", "module", "#maximillion-deep-intel"),
    ],
    relatedModule: "Revenue Docs & Reports",
    canCreateLead: false,
    canCreateTask: true,
    canCreateEventIdea: false,
    taskNote: report.bullets[0],
    memoryNote: `${report.title}: ${report.summary}`,
    outreachDraft: message,
  };
}

function buildUnknownResponse(): MaximillionChatResponse {
  const message = [
    localModeLead,
    "",
    "I can help locally with daily money priorities, Culver City or LA lead scouting examples, sponsor ideas, event plays, Adrian Swish-style intros, founder briefs, brand thesis calls, and local draft sales reports.",
    "Give me a direct revenue ask and I will turn it into the next move. For example: 'Max, find FitHaven leads near Culver City' or 'Give me SportsHaven Super Bowl sponsor ideas.'",
  ].join("\n");

  return {
    intent: "unknown",
    confidence: 0.46,
    message,
    suggestedActions: [
      action("module-default", "Open More Intelligence", "module", "#maximillion-deep-intel"),
      action("task-default", "Create revenue question", "task", "Ask Maximillion for a specific revenue lane."),
    ],
    relatedModule: "Maximillion Chat Console",
    canCreateLead: false,
    canCreateTask: true,
    canCreateEventIdea: false,
    taskNote: "Ask Maximillion for a specific revenue lane.",
    memoryNote: "Unknown chat intent. User needs a sharper revenue command.",
  };
}

function scoutResultToLeadInput(lead: LocalLeadScoutResult): SalesLeadInput {
  const interestedSilos = Object.entries(lead.compatibility)
    .filter(([, score]) => score >= 70)
    .map(([brand]) => brand.toLowerCase());

  return {
    company: lead.leadName,
    contactName: "",
    contactTitle: "Owner / partnerships lead",
    email: "",
    phone: "",
    website: lead.website,
    stage: "lead",
    priority: priorityFromUrgency(lead.urgencyScore),
    estimatedValue: parseMoney(lead.estimatedDealValue),
    revenueType: revenueTypeFromLead(lead),
    brandFit: lead.reasoningSummary,
    source: `Maximillion chat - ${lead.sourceTag}`,
    tags: [
      "maximillion",
      "local-scout",
      lead.category.toLowerCase(),
      ...interestedSilos,
    ],
    notes: [
      `Address: ${lead.address}`,
      `Revenue estimate: ${lead.revenueEstimate}`,
      `Sponsor probability: ${lead.sponsorProbability}/100`,
      `FitHaven compatibility: ${lead.compatibility.FitHaven}/100`,
      `SportsHaven compatibility: ${lead.compatibility.SportsHaven}/100`,
      `MusicHaven compatibility: ${lead.compatibility.MusicHaven}/100`,
      `CannaHaven compatibility: ${lead.compatibility.CannaHaven}/100`,
      `Relationship potential: ${lead.relationshipPotentialScore}/100`,
      `Urgency: ${lead.urgencyScore}/100`,
      lead.reasoningSummary,
    ].join("\n"),
    nextFollowUpAt: "",
    owner: "Trent",
    contact: "",
    category: lead.category,
    interestedSilos,
    proposedSpend: lead.revenueEstimate,
    nextFollowUp: "",
  };
}

function revenueTypeFromLead(lead: LocalLeadScoutResult): RevenueType {
  const text = `${lead.category} ${lead.reasoningSummary}`.toLowerCase();
  if (hasAny(text, ["speaking", "conference"])) return "speaking";
  if (hasAny(text, ["event", "watch-party", "festival"])) return "event_sponsorship";
  if (hasAny(text, ["youtube", "podcast", "video"])) return "youtube_video";
  if (hasAny(text, ["affiliate", "product"])) return "affiliate";
  if (hasAny(text, ["partnership", "collab"])) return "partnership";
  return "social_sponsorship";
}

function priorityFromUrgency(score: number): LeadPriority {
  if (score >= 92) return "urgent";
  if (score >= 78) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function parseMoney(value: string) {
  const match = value.match(/[\d,.]+/);
  if (!match) return 0;
  const parsed = Number(match[0].replace(/,/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function normalize(input: string) {
  return input.trim().toLowerCase();
}

function hasAny(input: string, keywords: string[]) {
  return keywords.some((keyword) => input.includes(keyword));
}

function titleCase(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function action(
  id: string,
  label: string,
  kind: MaximillionSuggestedActionKind,
  payload: string,
): MaximillionSuggestedAction {
  return { id, label, kind, payload };
}
