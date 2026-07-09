import type { MaximillionChatResponse } from "@/components/newsroom/sales/maximillionChatEngine";
import {
  autopilotItems,
  festivalArtistOpportunities,
  globalMarketOpportunities,
  morningMoneyReport,
  opportunityMissions,
  relationshipProfiles,
  revenueCalendarV2,
} from "@/components/newsroom/sales/mockMaximillionV4Data";
import { dailyMoneyTasks } from "@/components/newsroom/sales/mockMaximillionV3Data";

export type MaximillionPresenceMode =
  | "idle"
  | "focused"
  | "researching"
  | "strategizing"
  | "morning_briefing"
  | "night_shift"
  | "meeting_mode"
  | "global_hunter"
  | "founder_priority";

export type VoiceModeState =
  | "idle"
  | "listening"
  | "transcribing"
  | "thinking"
  | "speaking";

export type VoicePersonalitySetting =
  | "Calm"
  | "Executive"
  | "High Energy"
  | "Sports Broadcaster"
  | "Founder"
  | "Night Shift";

export type FounderMemoryCategory =
  | "Business"
  | "Editorial"
  | "Relationships"
  | "Opportunities"
  | "Personal"
  | "Operations";

export interface MaximillionPresenceState {
  mode: MaximillionPresenceMode;
  label: string;
  status: string;
  reason: string;
  calendarSignal: string;
  intensity: "low" | "medium" | "high";
}

export interface PresenceModeOption {
  id: MaximillionPresenceMode;
  label: string;
  description: string;
}

export interface VoiceTranscriptLine {
  id: string;
  speaker: "Trent" | "Maximillion";
  text: string;
  status: VoiceModeState;
  createdAt: string;
}

export interface FounderMemoryEntry {
  id: string;
  category: FounderMemoryCategory;
  title: string;
  note: string;
  kind: "manual" | "lesson" | "mistake" | "win" | "idea" | "voice-placeholder" | "document-placeholder";
  createdAt: string;
}

export interface ConversationalMemory {
  lastTopics: string[];
  followUps: string[];
  importantContacts: string[];
  unfinishedIdeas: string[];
  savedOpportunities: string[];
  founderPreferences: string[];
  conversationSummaries: string[];
  updatedAt: string;
}

export interface NightShiftRegionQueue {
  region: string;
  focus: string;
  marketsToReview: string[];
  artists: string[];
  festivals: string[];
  brands: string[];
  sponsors: string[];
  meetingIdeas: string[];
  estimatedRange: string;
}

export const CONVERSATIONAL_MEMORY_KEY = "hmg-maximillion-conversation-memory-v1";
export const FOUNDER_MEMORY_KEY = "hmg-maximillion-founder-memory-v1";

export const presenceModeOptions: PresenceModeOption[] = [
  {
    id: "idle",
    label: "Idle",
    description: "Ready, calm, and waiting for Trent's next revenue command.",
  },
  {
    id: "focused",
    label: "Focused",
    description: "Compressing the day into a smaller set of high-value moves.",
  },
  {
    id: "researching",
    label: "Researching",
    description: "Reviewing browser-only opportunities and provider-neutral research adapters.",
  },
  {
    id: "strategizing",
    label: "Strategizing",
    description: "Turning leads, calendar moments, and sponsor categories into packages.",
  },
  {
    id: "morning_briefing",
    label: "Morning Briefing",
    description: "Preparing a founder-ready readout for today's money.",
  },
  {
    id: "night_shift",
    label: "Night Shift",
    description: "Planning overseas opportunity queues while US markets are quiet.",
  },
  {
    id: "meeting_mode",
    label: "Meeting Mode",
    description: "Tightening talking points, objections, and the next-best ask.",
  },
  {
    id: "global_hunter",
    label: "Global Hunter",
    description: "Mapping international music, festival, and sponsor lanes locally.",
  },
  {
    id: "founder_priority",
    label: "Founder Priority",
    description: "Protecting Trent's focus from low-quality motion.",
  },
];

export const voicePersonalitySettings: VoicePersonalitySetting[] = [
  "Calm",
  "Executive",
  "High Energy",
  "Sports Broadcaster",
  "Founder",
  "Night Shift",
];

export const founderMemoryCategories: FounderMemoryCategory[] = [
  "Business",
  "Editorial",
  "Relationships",
  "Opportunities",
  "Personal",
  "Operations",
];

export const carModePrompts = [
  "Max, where should I stop today?",
  "Max, what opportunities are nearby?",
  "Max, who should I reconnect with?",
  "Max, give me money ideas.",
];

export const carModeActions = [
  { id: "find-leads", label: "Find leads", prompt: "Max, where should I stop today?" },
  { id: "money-ideas", label: "Money ideas", prompt: "Max, give me money ideas." },
  { id: "events", label: "Events", prompt: "Max, what event opportunities should I watch?" },
  { id: "sponsor-ideas", label: "Sponsor ideas", prompt: "Max, give me SportsHaven sponsor ideas." },
  { id: "founder-briefing", label: "Founder briefing", prompt: "Max, give me a founder brief." },
  { id: "meeting-prep", label: "Meeting prep", prompt: "Max, prep me for a sponsor meeting." },
  { id: "morning-report", label: "Morning report", prompt: "Max, give me a morning money report." },
];

export const voiceFutureHooks = [
  "Browser microphone",
  "Browser speech recognition",
  "Browser speechSynthesis",
];

export const founderMemorySeed: FounderMemoryEntry[] = [
  {
    id: "founder-lesson-package-first",
    category: "Business",
    title: "Package before prospect volume",
    note:
      "A buyer list only matters when the offer has a clear package, price range, next ask, and objection response.",
    kind: "lesson",
    createdAt: "Seed memory",
  },
  {
    id: "founder-win-v6-chat",
    category: "Operations",
    title: "Maximillion chat became usable",
    note:
      "The revenue OS now supports local chat, action buttons, avatar presence, and deterministic intelligence without provider lock-in.",
    kind: "win",
    createdAt: "Seed memory",
  },
  {
    id: "founder-idea-car-mode",
    category: "Opportunities",
    title: "Passenger-seat revenue mode",
    note:
      "When Trent is moving around LA, Maximillion should compress the UI into voice-first prompts and local opportunity reminders.",
    kind: "idea",
    createdAt: "Seed memory",
  },
];

export function derivePresenceState({
  now = new Date(),
  chatActivityCount = 0,
  activeSurface = "chat",
}: {
  now?: Date;
  chatActivityCount?: number;
  activeSurface?: "chat" | "voice" | "car" | "night" | "memory";
} = {}): MaximillionPresenceState {
  const hour = now.getHours();
  const calendarSignal = getCalendarSignal(now);

  if (activeSurface === "car") {
    return makePresence(
      "meeting_mode",
      "Passenger-seat revenue mode",
      "Ready for large-touch commands and quick money prompts.",
      calendarSignal,
      "high",
    );
  }

  if (activeSurface === "voice") {
    return makePresence(
      "focused",
      "Browser Voice ready",
      "Browser microphone, speech recognition, and speechSynthesis are used when supported.",
      calendarSignal,
      "medium",
    );
  }

  if (activeSurface === "night" || hour >= 22 || hour < 5) {
    return makePresence(
      "night_shift",
      "Reviewing overseas opportunity lanes",
      "Focusing on Europe, Asia, Australia, South America, and Africa for a morning queue preview.",
      calendarSignal,
      "medium",
    );
  }

  if (hour >= 5 && hour < 11) {
    return makePresence(
      "morning_briefing",
      "Preparing morning brief",
      "Prioritizing today's focus, quick wins, follow-ups, and founder leverage.",
      calendarSignal,
      "high",
    );
  }

  if (chatActivityCount >= 6) {
    return makePresence(
      "strategizing",
      "Strategizing from the active conversation",
      "Recent chat activity is shaping follow-ups, contacts, and unfinished ideas.",
      calendarSignal,
      "high",
    );
  }

  if (chatActivityCount >= 2) {
    return makePresence(
      "focused",
      "Monitoring founder priorities",
      "Keeping the conversation pointed toward qualified revenue motion.",
      calendarSignal,
      "medium",
    );
  }

  const statusPool = [
    "Watching sponsorship lanes",
    "Reviewing seasonal opportunities",
    "Scanning local lead opportunities",
    "Waiting for next play",
  ];
  const status = statusPool[(hour + calendarSignal.length) % statusPool.length];
  return makePresence(
    status.includes("Scanning") ? "researching" : "idle",
    status,
    `Calendar signal: ${calendarSignal}. Local deterministic presence only.`,
    calendarSignal,
    "low",
  );
}

export function getAvatarPresenceStyle(mode: MaximillionPresenceMode) {
  switch (mode) {
    case "night_shift":
      return {
        shell:
          "bg-[radial-gradient(circle_at_50%_0%,rgba(30,64,175,0.34),rgba(15,23,42,0.72)_50%,rgba(0,0,0,0.84))]",
        frame:
          "bg-[linear-gradient(135deg,rgba(2,6,23,0.98),rgba(59,130,246,0.22),rgba(14,165,233,0.1))] shadow-[0_0_46px_rgba(59,130,246,0.2)]",
        label: "Night Shift glow",
      };
    case "meeting_mode":
      return {
        shell:
          "bg-[radial-gradient(circle_at_50%_0%,rgba(148,163,184,0.28),rgba(15,23,42,0.68)_48%,rgba(0,0,0,0.82))]",
        frame:
          "bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(148,163,184,0.22),rgba(16,185,129,0.1))] shadow-[0_0_42px_rgba(148,163,184,0.18)]",
        label: "Executive office lighting",
      };
    case "global_hunter":
      return {
        shell:
          "bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.25),rgba(15,23,42,0.7)_50%,rgba(0,0,0,0.84))]",
        frame:
          "bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(20,184,166,0.2),rgba(56,189,248,0.12))] shadow-[0_0_42px_rgba(20,184,166,0.18)]",
        label: "World-map HUD energy",
      };
    case "founder_priority":
      return {
        shell:
          "bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.2),rgba(15,23,42,0.72)_50%,rgba(0,0,0,0.84))]",
        frame:
          "bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(245,158,11,0.14),rgba(16,185,129,0.12))] shadow-[0_0_42px_rgba(245,158,11,0.14)]",
        label: "Founder priority warmth",
      };
    default:
      return {
        shell:
          "bg-[radial-gradient(circle_at_50%_0%,rgba(125,211,252,0.24),rgba(15,23,42,0.62)_48%,rgba(0,0,0,0.78))]",
        frame:
          "bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(56,189,248,0.18),rgba(16,185,129,0.1))] shadow-[0_0_42px_rgba(56,189,248,0.18)]",
        label: "Revenue HUD energy",
      };
  }
}

export function buildNightShiftQueue(selectedRegion = "Europe"): NightShiftRegionQueue {
  const regionOpportunities = globalMarketOpportunities.filter(
    (item) => item.region === selectedRegion,
  );
  const fallback = globalMarketOpportunities.slice(0, 2);
  const opportunities = regionOpportunities.length ? regionOpportunities : fallback;
  const festivals = festivalArtistOpportunities
    .filter((festival) =>
      selectedRegion === "Europe"
        ? festival.country.includes("UK") || festival.country.includes("Europe")
        : festival.country.includes(selectedRegion) || festival.country.includes("global"),
    )
    .slice(0, 3);

  return {
    region: selectedRegion,
    focus: opportunities[0]?.summary ?? morningMoneyReport.found[0],
    marketsToReview: opportunities.map((item) => item.market),
    artists: opportunities.flatMap((item) => item.artists).slice(0, 5),
    festivals: [
      ...opportunities.flatMap((item) => item.festivals),
      ...festivals.map((item) => item.name),
    ].slice(0, 5),
    brands: opportunities.flatMap((item) => item.brands).slice(0, 5),
    sponsors: opportunities.flatMap((item) => item.brands).slice(0, 4),
    meetingIdeas: [
      "Festival partnership lead",
      "music tech brand buyer",
      "creator event producer",
      "diaspora culture sponsor",
    ],
    estimatedRange: opportunities[0]?.estimatedOpportunityValue ?? morningMoneyReport.potentialRevenue,
  };
}

export function getDefaultConversationalMemory(): ConversationalMemory {
  return {
    lastTopics: [],
    followUps: [],
    importantContacts: ["Adrian Swish"],
    unfinishedIdeas: [],
    savedOpportunities: [],
    founderPreferences: [
      "Default to polished executive language.",
      "Use cultural fluency naturally and never perform stereotypes.",
      "Challenge assumptions without becoming negative.",
    ],
    conversationSummaries: [],
    updatedAt: new Date().toISOString(),
  };
}

export function readConversationalMemory(): ConversationalMemory {
  if (typeof window === "undefined") return getDefaultConversationalMemory();
  try {
    const raw = window.localStorage.getItem(CONVERSATIONAL_MEMORY_KEY);
    if (!raw) return getDefaultConversationalMemory();
    const parsed = JSON.parse(raw) as Partial<ConversationalMemory>;
    return {
      ...getDefaultConversationalMemory(),
      ...parsed,
      lastTopics: cleanList(parsed.lastTopics),
      followUps: cleanList(parsed.followUps),
      importantContacts: cleanList(parsed.importantContacts),
      unfinishedIdeas: cleanList(parsed.unfinishedIdeas),
      savedOpportunities: cleanList(parsed.savedOpportunities),
      founderPreferences: cleanList(parsed.founderPreferences),
      conversationSummaries: cleanList(parsed.conversationSummaries),
    };
  } catch {
    return getDefaultConversationalMemory();
  }
}

export function writeConversationalMemory(memory: ConversationalMemory) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONVERSATIONAL_MEMORY_KEY, JSON.stringify(memory));
  } catch {
    /* ignore local persistence failures */
  }
}

export function updateConversationalMemoryFromChat(
  prompt: string,
  response: MaximillionChatResponse,
) {
  const memory = readConversationalMemory();
  const topic = response.relatedModule || response.intent.replaceAll("_", " ");
  const contact = prompt.toLowerCase().includes("adrian") ? "Adrian Swish" : "";
  const nextMemory: ConversationalMemory = {
    lastTopics: addUnique([topic, response.intent.replaceAll("_", " ")], memory.lastTopics),
    followUps: addUnique([response.taskNote].filter(Boolean) as string[], memory.followUps),
    importantContacts: contact
      ? addUnique([contact], memory.importantContacts)
      : memory.importantContacts,
    unfinishedIdeas: addUnique(
      [response.eventIdea, response.memoryNote].filter(Boolean) as string[],
      memory.unfinishedIdeas,
    ),
    savedOpportunities: addUnique(
      [response.leadInput?.company].filter(Boolean) as string[],
      memory.savedOpportunities,
    ),
    founderPreferences: memory.founderPreferences,
    conversationSummaries: addUnique(
      [`${response.intent.replaceAll("_", " ")}: ${response.relatedModule}`],
      memory.conversationSummaries,
    ),
    updatedAt: new Date().toISOString(),
  };
  writeConversationalMemory(nextMemory);
  return nextMemory;
}

export function appendConversationalMemory(
  lane: keyof Pick<
    ConversationalMemory,
    "followUps" | "importantContacts" | "unfinishedIdeas" | "savedOpportunities" | "conversationSummaries"
  >,
  value: string,
) {
  const memory = readConversationalMemory();
  const next = {
    ...memory,
    [lane]: addUnique([value], memory[lane]),
    updatedAt: new Date().toISOString(),
  };
  writeConversationalMemory(next);
  return next;
}

export function readFounderMemoryEntries(): FounderMemoryEntry[] {
  if (typeof window === "undefined") return founderMemorySeed;
  try {
    const raw = window.localStorage.getItem(FOUNDER_MEMORY_KEY);
    if (!raw) return founderMemorySeed;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return founderMemorySeed;
    return parsed
      .filter((item): item is FounderMemoryEntry =>
        Boolean(
          item &&
            typeof item.id === "string" &&
            founderMemoryCategories.includes(item.category) &&
            typeof item.title === "string" &&
            typeof item.note === "string",
        ),
      )
      .slice(0, 80);
  } catch {
    return founderMemorySeed;
  }
}

export function writeFounderMemoryEntries(entries: FounderMemoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FOUNDER_MEMORY_KEY, JSON.stringify(entries.slice(0, 80)));
  } catch {
    /* ignore local persistence failures */
  }
}

export function buildHudMetrics(leadCount: number) {
  return {
    revenueOpportunityCount: revenueCalendarV2.length + autopilotItems.length,
    relationshipCount: relationshipProfiles.length,
    leadCount,
    meetingCount: morningMoneyReport.calendarSuggestions.length,
    missionCount: opportunityMissions.length,
    todaysFocus: dailyMoneyTasks[0]?.title ?? "Move one sponsor from idea to ask",
    priorityLevel: dailyMoneyTasks[0]?.priority ?? "critical",
    estimatedOpportunityRange: morningMoneyReport.potentialRevenue,
  };
}

function makePresence(
  mode: MaximillionPresenceMode,
  status: string,
  reason: string,
  calendarSignal: string,
  intensity: MaximillionPresenceState["intensity"],
): MaximillionPresenceState {
  const option = presenceModeOptions.find((item) => item.id === mode);
  return {
    mode,
    label: option?.label ?? "Focused",
    status,
    reason,
    calendarSignal,
    intensity,
  };
}

function getCalendarSignal(date: Date) {
  const month = date.getMonth();
  if (month <= 1) return "Super Bowl, Grammy season, and winter sponsor inventory";
  if (month === 2) return "March Madness and SXSW";
  if (month === 3) return "Coachella, Stagecoach, and 4/20";
  if (month <= 5) return "NBA Finals, BET Awards, and summer sponsor planning";
  if (month <= 7) return "Summer transformation and festival windows";
  if (month === 8) return "NFL season and back-to-school campaigns";
  if (month <= 10) return "Holiday campaign pre-sell window";
  return "Year-end sponsor renewals and holiday packages";
}

function cleanList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, 8)
    : [];
}

function addUnique(nextItems: string[], existing: string[]) {
  return [...nextItems, ...existing]
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index)
    .slice(0, 8);
}
