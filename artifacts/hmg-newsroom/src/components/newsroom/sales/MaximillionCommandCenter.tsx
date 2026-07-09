import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { SalesLead, SalesLeadInput } from "@/lib/sales";
import { Button } from "@/components/ui/button";
import { EventRevenueCalendar } from "@/components/newsroom/sales/EventRevenueCalendar";
import { FounderMemoryCenter } from "@/components/newsroom/sales/FounderMemoryCenter";
import { HavenMoneyMachine } from "@/components/newsroom/sales/HavenMoneyMachine";
import { LeadIntelligenceCenter } from "@/components/newsroom/sales/LeadIntelligenceCenter";
import { LocalLeadScoutPrep } from "@/components/newsroom/sales/LocalLeadScoutPrep";
import { MaximillionAdvisor } from "@/components/newsroom/sales/MaximillionAdvisor";
import { MaximillionAvatar } from "@/components/newsroom/sales/MaximillionAvatar";
import { MaximillionAvatarPrep } from "@/components/newsroom/sales/MaximillionAvatarPrep";
import { MaximillionCarMode } from "@/components/newsroom/sales/MaximillionCarMode";
import { MaximillionChatConsole } from "@/components/newsroom/sales/MaximillionChatConsole";
import { MaximillionExecutiveMemory } from "@/components/newsroom/sales/MaximillionExecutiveMemory";
import { MaximillionHUD } from "@/components/newsroom/sales/MaximillionHUD";
import { MaximillionPresenceCenter } from "@/components/newsroom/sales/MaximillionPresenceCenter";
import { MaximillionProfilePanel } from "@/components/newsroom/sales/MaximillionProfilePanel";
import { MaximillionRevenueCommand } from "@/components/newsroom/sales/MaximillionRevenueCommand";
import { NightShiftCenter } from "@/components/newsroom/sales/NightShiftCenter";
import { OpportunityRadar } from "@/components/newsroom/sales/OpportunityRadar";
import { RevenueCalendarIntelligence } from "@/components/newsroom/sales/RevenueCalendarIntelligence";
import { RevenueSnapshot } from "@/components/newsroom/sales/RevenueSnapshot";
import { RevenueDocsReports } from "@/components/newsroom/sales/RevenueDocsReports";
import { SalesGlossary } from "@/components/newsroom/sales/SalesGlossary";
import { TodaysMoney } from "@/components/newsroom/sales/TodaysMoney";
import { VoiceModeCenter } from "@/components/newsroom/sales/VoiceModeCenter";
import {
  buildMaximillionMemory,
  formatCurrency,
  futureModules,
  generateMaximillionBrief,
  getDueFollowUps,
  providerHooks,
} from "@/components/newsroom/sales/mockMaximillionData";
import {
  derivePresenceState,
  presenceModeOptions,
  type MaximillionPresenceMode,
  type MaximillionPresenceState,
} from "@/components/newsroom/sales/mockMaximillionV7Data";
import type {
  MaximillionVoiceRuntimeSnapshot,
  MaximillionVoiceStatus,
} from "@/components/newsroom/sales/voice/maximillionVoiceTypes";
import {
  BarChart3,
  BookOpen,
  Bot,
  Briefcase,
  CalendarClock,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Handshake,
  Lock,
  Mic,
  Moon,
  Network,
  Podcast,
  Plus,
  RadioTower,
  ReceiptText,
  ShieldCheck,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";

interface MaximillionCommandCenterProps {
  leads: SalesLead[];
  onNewLead: () => void;
  onAddLead: (input: SalesLeadInput, sourceLabel: string) => void;
}

type DeepSection = "strategy" | "calendar" | "docs" | "memory";
type V4Section = DeepSection | "founder" | "v4" | "missions";
type PresenceSurface = "chat" | "voice" | "car" | "night" | "memory";
type V8Section = "actions" | "war-room" | "scorer" | "offline" | "graph" | "podcast";

const MaximillionFounderThesisEngine = lazy(() =>
  import("@/components/newsroom/sales/MaximillionFounderThesisEngine").then((module) => ({
    default: module.MaximillionFounderThesisEngine,
  })),
);

const MaximillionV4RevenueEngine = lazy(() =>
  import("@/components/newsroom/sales/MaximillionV4RevenueEngine").then((module) => ({
    default: module.MaximillionV4RevenueEngine,
  })),
);

const MaximillionOpportunityMissions = lazy(() =>
  import("@/components/newsroom/sales/MaximillionOpportunityMissions").then((module) => ({
    default: module.MaximillionOpportunityMissions,
  })),
);

const MaximillionActionCenter = lazy(() =>
  import("@/components/newsroom/sales/MaximillionActionCenter").then((module) => ({
    default: module.MaximillionActionCenter,
  })),
);

const MaximillionFounderWarRoom = lazy(() =>
  import("@/components/newsroom/sales/MaximillionFounderWarRoom").then((module) => ({
    default: module.MaximillionFounderWarRoom,
  })),
);

const MaximillionOpportunityScorer = lazy(() =>
  import("@/components/newsroom/sales/MaximillionOpportunityScorer").then((module) => ({
    default: module.MaximillionOpportunityScorer,
  })),
);

const MaximillionOfflineMoney = lazy(() =>
  import("@/components/newsroom/sales/MaximillionOfflineMoney").then((module) => ({
    default: module.MaximillionOfflineMoney,
  })),
);

const MaximillionRelationshipGraph = lazy(() =>
  import("@/components/newsroom/sales/MaximillionRelationshipGraph").then((module) => ({
    default: module.MaximillionRelationshipGraph,
  })),
);

const MaximillionPodcastBrain = lazy(() =>
  import("@/components/newsroom/sales/MaximillionPodcastBrain").then((module) => ({
    default: module.MaximillionPodcastBrain,
  })),
);

const deepSections: Array<{ id: V4Section; label: string }> = [
  { id: "strategy", label: "Strategy" },
  { id: "founder", label: "Founder DNA" },
  { id: "v4", label: "V4 Engines" },
  { id: "missions", label: "Missions" },
  { id: "calendar", label: "Calendar" },
  { id: "docs", label: "Docs" },
  { id: "memory", label: "Memory" },
];

const executionSections: Array<{ id: V8Section; label: string; icon: typeof Bot }> = [
  { id: "actions", label: "Actions", icon: CheckCircle2 },
  { id: "war-room", label: "War Room", icon: ShieldCheck },
  { id: "scorer", label: "Scorer", icon: BarChart3 },
  { id: "offline", label: "Offline Money", icon: Handshake },
  { id: "graph", label: "Graph", icon: Network },
  { id: "podcast", label: "Podcast Brain", icon: Podcast },
];

type MaxTab = "command" | "money" | "leads" | "followups" | "brief" | "execution";

const MAX_TABS: Array<{
  id: MaxTab;
  label: string;
  hint: string;
  icon: typeof Bot;
}> = [
  { id: "command", label: "Command", hint: "Talk · ask · voice", icon: Mic },
  { id: "money", label: "Money Moves", hint: "Today · pipeline value", icon: CircleDollarSign },
  { id: "leads", label: "Leads", hint: "Discovery · intelligence", icon: Target },
  { id: "followups", label: "Follow-Ups", hint: "Due · upcoming outreach", icon: CalendarClock },
  { id: "brief", label: "Founder Brief", hint: "Strategy · DNA · memory", icon: RadioTower },
  { id: "execution", label: "Receipts", hint: "Reports · actions · proof", icon: ReceiptText },
];

function MaximillionTabBar({
  active,
  onSelect,
}: {
  active: MaxTab;
  onSelect: (tab: MaxTab) => void;
}) {
  const current = MAX_TABS.find((tab) => tab.id === active);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function moveFocus(index: number) {
    const wrapped = (index + MAX_TABS.length) % MAX_TABS.length;
    onSelect(MAX_TABS[wrapped].id);
    tabRefs.current[wrapped]?.focus();
  }

  function handleKeyDown(event: ReactKeyboardEvent, index: number) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveFocus(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveFocus(index - 1);
        break;
      case "Home":
        event.preventDefault();
        moveFocus(0);
        break;
      case "End":
        event.preventDefault();
        moveFocus(MAX_TABS.length - 1);
        break;
      default:
        break;
    }
  }

  return (
    <div
      className="sticky top-0 z-30 -mx-1 rounded-2xl bg-background/95 px-1 pb-2 pt-1 backdrop-blur-md"
      data-testid="maximillion-tabbar"
    >
      <div
        role="tablist"
        aria-label="Maximillion sections"
        aria-orientation="horizontal"
        className="flex flex-wrap gap-2 rounded-2xl border border-border/60 bg-secondary/60 p-1.5 shadow-lg shadow-black/20"
      >
        {MAX_TABS.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`maximillion-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`maximillion-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              data-testid={`maximillion-tab-${tab.id}`}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`relative flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold tracking-tight transition-colors flex-1 sm:flex-none ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="maximillion-tab-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
      {current && (
        <p className="mt-1.5 px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          {current.hint}
        </p>
      )}
    </div>
  );
}

export function MaximillionCommandCenter({
  leads,
  onNewLead,
  onAddLead,
}: MaximillionCommandCenterProps) {
  const brief = useMemo(() => generateMaximillionBrief(leads), [leads]);
  const memory = useMemo(() => buildMaximillionMemory(leads), [leads]);

  const [activeTab, setActiveTab] = useState<MaxTab>("command");
  const [visited, setVisited] = useState<Set<MaxTab>>(
    () => new Set<MaxTab>(["command"]),
  );

  function selectTab(tab: MaxTab) {
    setActiveTab(tab);
    setVisited((current) => {
      if (current.has(tab)) return current;
      const next = new Set(current);
      next.add(tab);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <MaximillionRevenueCommand
        leads={leads}
        onNewLead={onNewLead}
        onAddLead={onAddLead}
      />

      <MaximillionTabBar active={activeTab} onSelect={selectTab} />

      {visited.has("command") && (
        <div
          role="tabpanel"
          id="maximillion-panel-command"
          aria-labelledby="maximillion-tab-command"
          hidden={activeTab !== "command"}
          className="space-y-3"
        >
          <TalkToMaximillion leads={leads} onAddLead={onAddLead} />
        </div>
      )}

      {visited.has("money") && (
        <div
          role="tabpanel"
          id="maximillion-panel-money"
          aria-labelledby="maximillion-tab-money"
          hidden={activeTab !== "money"}
          className="space-y-3"
        >
          <TodaysMoney />
          <RevenueSnapshot leads={leads} />
        </div>
      )}

      {visited.has("leads") && (
        <div
          role="tabpanel"
          id="maximillion-panel-leads"
          aria-labelledby="maximillion-tab-leads"
          hidden={activeTab !== "leads"}
          className="space-y-3"
        >
          <LeadIntelligenceCenter onAddLead={onAddLead} />
          <QuickActions onNewLead={onNewLead} onJump={selectTab} />
        </div>
      )}

      {visited.has("followups") && (
        <div
          role="tabpanel"
          id="maximillion-panel-followups"
          aria-labelledby="maximillion-tab-followups"
          hidden={activeTab !== "followups"}
          className="space-y-3"
        >
          <FollowUpsPanel leads={leads} />
        </div>
      )}

      {visited.has("brief") && (
        <div
          role="tabpanel"
          id="maximillion-panel-brief"
          aria-labelledby="maximillion-tab-brief"
          hidden={activeTab !== "brief"}
          className="space-y-3"
        >
          <DeepIntelligencePanel leads={leads} brief={brief} memory={memory} />
        </div>
      )}

      {visited.has("execution") && (
        <div
          role="tabpanel"
          id="maximillion-panel-execution"
          aria-labelledby="maximillion-tab-execution"
          hidden={activeTab !== "execution"}
          className="space-y-3"
        >
          <ReceiptsPanel leads={leads} />
        </div>
      )}
    </div>
  );
}

function FollowUpsPanel({ leads }: { leads: SalesLead[] }) {
  return (
    <section
      id="maximillion-followups"
      className="rounded-lg border border-emerald-400/20 bg-secondary/40 p-3"
    >
      <div className="flex items-center gap-2 text-emerald-300">
        <CalendarClock className="h-4 w-4" />
        <h2 className="text-sm font-black tracking-tight">Follow-Ups</h2>
      </div>
      <p className="mt-1 mb-3 text-[11px] leading-relaxed text-muted-foreground">
        Who's due and who's coming up — work this list top to bottom to keep
        every deal moving.
      </p>
      <OutreachQueue leads={leads} />
    </section>
  );
}

function ReceiptsPanel({ leads }: { leads: SalesLead[] }) {
  return (
    <section
      id="maximillion-receipts"
      className="space-y-3"
    >
      <div className="rounded-lg border border-amber-300/20 bg-secondary/40 p-3">
        <div className="flex items-center gap-2 text-amber-300">
          <ReceiptText className="h-4 w-4" />
          <h2 className="text-sm font-black tracking-tight">Receipts</h2>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Proof and paperwork — reports, documents, and the execution tools that
          turn approved moves into closed money.
        </p>
      </div>
      <RevenueDocsReports />
      <RevenueExecutionLayer leads={leads} />
    </section>
  );
}

function TalkToMaximillion({
  leads,
  onAddLead,
}: {
  leads: SalesLead[];
  onAddLead: (input: SalesLeadInput, sourceLabel: string) => void;
}) {
  const [chatActivityCount, setChatActivityCount] = useState(0);
  const [activeSurface, setActiveSurface] = useState<PresenceSurface>("chat");
  const [presence, setPresence] = useState<MaximillionPresenceState>(() =>
    derivePresenceState(),
  );
  const [voiceSnapshot, setVoiceSnapshot] =
    useState<MaximillionVoiceRuntimeSnapshot | null>(null);
  const [queuedPrompt, setQueuedPrompt] = useState<{
    id: string;
    prompt: string;
  } | null>(null);

  function queuePrompt(prompt: string) {
    setQueuedPrompt({
      id: `presence-prompt-${Date.now().toString(36)}`,
      prompt,
    });
    setActiveSurface("chat");
  }

  function handleManualPresenceMode(mode: MaximillionPresenceMode) {
    const option = presenceModeOptions.find((item) => item.id === mode);
    setPresence((current) => ({
      ...current,
      mode,
      label: option?.label ?? current.label,
      status: option?.label ?? current.status,
      reason: option?.description ?? current.reason,
    }));
  }

  const handleVoiceStateChange = useCallback(
    (snapshot: MaximillionVoiceRuntimeSnapshot) => {
      setVoiceSnapshot(snapshot);
      setPresence((current) => ({
        ...current,
        mode: voicePresenceMode(snapshot.status),
        label: `Browser Voice: ${snapshot.label}`,
        status: snapshot.detail,
        reason:
          "Maximillion avatar state is following browser voice and local command activity.",
        intensity: voicePresenceIntensity(snapshot.status),
      }));
    },
    [],
  );

  const surfaceTabs: Array<{
    id: PresenceSurface;
    label: string;
    icon: typeof Bot;
  }> = [
    { id: "car", label: "Car Mode", icon: Car },
    { id: "night", label: "Night Shift", icon: Moon },
    { id: "memory", label: "Founder Memory", icon: BookOpen },
  ];

  return (
    <section
      id="maximillion-talk"
      aria-labelledby="maximillion-talk-heading"
      className="space-y-3"
    >
      <div className="rounded-lg border border-sky-300/20 bg-secondary/40 p-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-100">
              <Bot className="w-4 h-4 shrink-0" />
              <h2
                id="maximillion-talk-heading"
                className="text-sm font-black tracking-tight"
              >
                Talk to Maximillion
              </h2>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Local response engine, command shortcuts, and chat-to-action
              workflow.
            </p>
          </div>
          <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
            Browser-Only Active
          </span>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <MaximillionHUD leads={leads} presence={presence} />
        <MaximillionPresenceCenter
          chatActivityCount={chatActivityCount}
          activeSurface={activeSurface}
          onPresenceChange={setPresence}
          onManualModeChange={handleManualPresenceMode}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(280px,0.92fr)_minmax(0,1.08fr)]">
        <MaximillionAvatar presence={presence} voiceSnapshot={voiceSnapshot} />
        <MaximillionChatConsole
          leads={leads}
          onAddLead={onAddLead}
          queuedPrompt={queuedPrompt}
          onActivity={setChatActivityCount}
        />
      </div>

      <section
        className="rounded-lg border border-sky-300/20 bg-secondary/40 p-3"
        data-testid="maximillion-presence-layers"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-black">Executive Presence Layers</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Browser Voice, car mode, night-shift queue, and founder memory.
              Browser/local operating layer.
            </p>
          </div>
          <span className="rounded-full border border-sky-200/20 bg-sky-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-100">
            V7 Onyx
          </span>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {surfaceTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                type="button"
                size="sm"
                variant={activeSurface === tab.id ? "default" : "outline"}
                onClick={() => setActiveSurface(tab.id)}
                className="h-10 shrink-0 px-3 text-[11px]"
                data-testid={`maximillion-presence-layer-${tab.id}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </Button>
            );
          })}
        </div>
        <div className="mt-3">
          {activeSurface === "voice" && (
            <VoiceModeCenter
              leads={leads}
              onVoiceStateChange={handleVoiceStateChange}
              onVoiceActivity={() => setChatActivityCount((current) => current + 1)}
            />
          )}
          {activeSurface === "car" && <MaximillionCarMode onPrompt={queuePrompt} />}
          {activeSurface === "night" && <NightShiftCenter />}
          {activeSurface === "memory" && <FounderMemoryCenter />}
          {activeSurface === "chat" && (
            <div className="rounded-lg border border-border/45 bg-secondary/35 p-3 text-[11px] leading-relaxed text-muted-foreground">
              Chat is active above. Choose Voice, Car Mode, Night Shift, or
              Founder Memory to open a focused presence layer.
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function voicePresenceMode(
  status: MaximillionVoiceStatus,
): MaximillionPresenceMode {
  switch (status) {
    case "listening":
    case "transcribing":
      return "focused";
    case "thinking":
      return "strategizing";
    case "speaking":
      return "meeting_mode";
    case "unsupported":
    case "error":
      return "idle";
    default:
      return "focused";
  }
}

function voicePresenceIntensity(status: MaximillionVoiceStatus) {
  switch (status) {
    case "listening":
    case "thinking":
    case "speaking":
      return "high";
    case "transcribing":
    case "requesting_permission":
      return "medium";
    default:
      return "low";
  }
}

function RevenueExecutionLayer({ leads }: { leads: SalesLead[] }) {
  const [activeSection, setActiveSection] = useState<V8Section>("actions");

  return (
    <section
      id="maximillion-execution-layer"
      className="rounded-lg border border-emerald-400/20 bg-secondary/40 p-3"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            <h2 className="text-sm font-black tracking-tight">
              Revenue Execution Layer
            </h2>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            V8 moves Maximillion from advice into approved actions, scoring,
            relationships, offline money, and founder execution.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
          V8 operator
        </span>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {executionSections.map((section) => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              type="button"
              size="sm"
              variant={activeSection === section.id ? "default" : "outline"}
              onClick={() => setActiveSection(section.id)}
              className="h-10 shrink-0 px-3 text-[11px]"
              data-testid={`maximillion-v8-${section.id}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {section.label}
            </Button>
          );
        })}
      </div>

      <div className="mt-3">
        <Suspense fallback={<LazyPanelFallback label="Loading revenue execution" />}>
          {activeSection === "actions" && <MaximillionActionCenter leads={leads} />}
          {activeSection === "war-room" && <MaximillionFounderWarRoom leads={leads} />}
          {activeSection === "scorer" && <MaximillionOpportunityScorer />}
          {activeSection === "offline" && <MaximillionOfflineMoney />}
          {activeSection === "graph" && <MaximillionRelationshipGraph />}
          {activeSection === "podcast" && <MaximillionPodcastBrain />}
        </Suspense>
      </div>
    </section>
  );
}

function QuickActions({
  onNewLead,
  onJump,
}: {
  onNewLead: () => void;
  onJump: (tab: MaxTab) => void;
}) {
  return (
    <section className="rounded-lg border border-emerald-400/15 bg-secondary/40 p-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button
          type="button"
          onClick={onNewLead}
          className="h-10 min-w-0 px-2 text-[11px] bg-emerald-500 text-white hover:bg-emerald-400"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">New lead</span>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 min-w-0 px-2 text-[11px] bg-secondary/30"
        >
          <a href="#maximillion-lead-intelligence">
            <Target className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Lead intel</span>
          </a>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 min-w-0 px-2 text-[11px] bg-secondary/30"
        >
          <a href="#maximillion-crm-board">
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">CRM stages</span>
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onJump("brief")}
          className="h-10 min-w-0 px-2 text-[11px] bg-secondary/30"
        >
          <RadioTower className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">More intel</span>
        </Button>
      </div>
    </section>
  );
}

function DeepIntelligencePanel({
  leads,
  brief,
  memory,
}: {
  leads: SalesLead[];
  brief: ReturnType<typeof generateMaximillionBrief>;
  memory: ReturnType<typeof buildMaximillionMemory>;
}) {
  const [activeSection, setActiveSection] = useState<V4Section>("strategy");

  return (
    <section
      id="maximillion-deep-intel"
      className="rounded-lg border border-emerald-400/20 bg-secondary/40 p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-emerald-300">
            <RadioTower className="w-4 h-4 shrink-0" />
            <h2 className="text-sm font-black tracking-tight">
              More Maximillion Intelligence
            </h2>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Advisor, founder DNA, V4 engines, missions, calendar, docs, memory,
            avatar, and glossary modules.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
          Open
        </span>
      </div>

      <div className="mt-3 space-y-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {deepSections.map((section) => (
              <Button
                key={section.id}
                type="button"
                size="sm"
                variant={activeSection === section.id ? "default" : "outline"}
                onClick={() => setActiveSection(section.id)}
                className="h-10 shrink-0 px-3 text-[11px]"
              >
                {section.label}
              </Button>
            ))}
          </div>

          {activeSection === "strategy" && (
            <>
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
                <MaximillionAdvisor brief={brief} />
                <div className="space-y-3">
                  <OutreachQueue leads={leads} />
                  <SystemStatus />
                </div>
              </div>
              <MaximillionProfilePanel />
              <OpportunityRadar />
            </>
          )}

          {activeSection === "founder" && (
            <Suspense fallback={<LazyPanelFallback label="Loading Founder DNA" />}>
              <MaximillionFounderThesisEngine />
            </Suspense>
          )}

          {activeSection === "v4" && (
            <Suspense fallback={<LazyPanelFallback label="Loading V4 engines" />}>
              <MaximillionV4RevenueEngine />
            </Suspense>
          )}

          {activeSection === "missions" && (
            <Suspense fallback={<LazyPanelFallback label="Loading opportunity missions" />}>
              <MaximillionOpportunityMissions />
            </Suspense>
          )}

          {activeSection === "calendar" && (
            <>
              <RevenueCalendarIntelligence />
              <EventRevenueCalendar />
            </>
          )}

          {activeSection === "docs" && (
            <>
              <HavenMoneyMachine />
            </>
          )}

          {activeSection === "memory" && (
            <>
              <LocalLeadScoutPrep />
              <div className="grid gap-3 xl:grid-cols-[minmax(320px,0.7fr)_minmax(0,1.3fr)]">
                <MemoryLayer memory={memory} />
                <ComingNext />
              </div>
              <MaximillionExecutiveMemory />
              <MaximillionAvatarPrep />
              <SalesGlossary />
            </>
          )}
      </div>
    </section>
  );
}

function LazyPanelFallback({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border/45 bg-secondary/40 p-4 text-[11px] leading-relaxed text-muted-foreground">
      {label}...
    </div>
  );
}

function OutreachQueue({ leads }: { leads: SalesLead[] }) {
  const due = getDueFollowUps(leads);
  const upcoming = leads
    .filter((lead) => lead.nextFollowUpAt && !due.some((item) => item.id === lead.id))
    .sort((a, b) => a.nextFollowUpAt.localeCompare(b.nextFollowUpAt))
    .slice(0, 6 - due.length);
  const queue = [...due, ...upcoming].slice(0, 6);
  const emptyTasks = [
    "Add 10 sponsor targets across SportsHaven and CannaHaven.",
    "Build a one-page NBA Finals sponsor inventory sheet with package value and buyer objections.",
    "Draft a video rate card for pre-roll, mid-roll, host reads, and short-form packages.",
  ];

  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-300">
          <CalendarClock className="w-4 h-4" />
          <h3 className="text-sm font-black">Outreach Queue</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {queue.length ? `${queue.length} queued` : "Starter plays"}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {queue.length ? (
          queue.map((lead) => (
            <div
              key={lead.id}
              className="rounded-md border border-border/45 bg-secondary/40 p-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[12px] font-black truncate">
                    {lead.company}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {lead.contactName || lead.contactTitle || lead.email || "No contact yet"}
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-200 shrink-0">
                  {lead.nextFollowUpAt}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-foreground/75">
                Ask for the next commitment on a {formatCurrency(lead.estimatedValue)} opportunity.
              </div>
            </div>
          ))
        ) : (
          emptyTasks.map((task) => (
            <div
              key={task}
              className="flex items-start gap-2 rounded-md border border-border/45 bg-secondary/40 p-2.5 text-[11px] leading-relaxed text-foreground/82"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
              <span>{task}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function SystemStatus() {
  return (
    <section className="rounded-lg border border-sky-200/20 bg-secondary/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sky-700 dark:text-sky-100">
          <Bot className="w-4 h-4" />
          <h3 className="text-sm font-black">Revenue Status</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-sky-700 dark:text-sky-100/70">
          Always on
        </span>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-sky-700 dark:text-sky-50/78">
        Maximillion is running as a browser-first revenue OS:
        conversational strategy, avatar presence, proactive tasks, lead
        scoring, seasonal planning, document/report drafting, memory objects,
        Browser Voice, and provider-agnostic adapter slots. No live crawler,
        email, calendar, map, generated avatar media, or provider AI call is active.
      </p>
    </section>
  );
}

function MemoryLayer({
  memory,
}: {
  memory: ReturnType<typeof buildMaximillionMemory>;
}) {
  const rows = [
    ["Remembered leads", `${memory.rememberedLeads.length}`],
    ["Past outreach", memory.pastOutreach[0]],
    ["Win/loss reasons", memory.winLossReasons[0]],
    ["Follow-up reminders", memory.followUpReminders[0]],
    ["Brand fit history", memory.brandFitHistory.slice(0, 4).join(", ")],
    ["Event ideas", memory.eventIdeas.slice(0, 4).join(", ")],
    ["Revenue notes", memory.revenueNotes[0]],
  ];

  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/50 p-3">
      <div className="flex items-center gap-2 text-emerald-300">
        <RadioTower className="w-4 h-4" />
        <h3 className="text-sm font-black">Maximillion Memory Layer</h3>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        Browser-only memory shaped for optional database or provider adapters.
      </p>
      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-border/45 bg-secondary/40 p-2.5"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className="mt-1 text-[11px] leading-relaxed text-foreground/84">
              {value || "Pending"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComingNext() {
  return (
    <section className="rounded-lg border border-border bg-secondary/50 p-3">
      <div className="flex items-center gap-2 text-foreground">
        <Lock className="w-4 h-4" />
        <h3 className="text-sm font-black">Provider-Optional Modules</h3>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        Modular adapter slots. They remain inactive until Trent explicitly configures them.
      </p>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {futureModules.map((module) => (
          <button
            key={module.id}
            type="button"
            disabled
            className="text-left rounded-lg border border-border/45 bg-secondary/40 p-2.5 opacity-75"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[12px] font-black text-foreground">
                {module.label}
              </span>
              <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {module.note}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-border bg-slate-200/[0.04] p-3">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-foreground">
          <ShieldCheck className="w-3.5 h-3.5" />
          Provider-neutral hooks
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {providerHooks.map((hook) => (
            <div
              key={hook.id}
              className="rounded-md border border-border/40 bg-secondary/35 p-2"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-black text-foreground">
                <CircleDollarSign className="w-3.5 h-3.5 text-emerald-300" />
                {hook.label}
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                {hook.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
