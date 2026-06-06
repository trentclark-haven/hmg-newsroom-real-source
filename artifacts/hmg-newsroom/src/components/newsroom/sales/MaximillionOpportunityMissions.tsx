import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  festivalArtistOpportunities,
  globalScoutRegions,
  globalMarketOpportunities,
  introDrafts,
  morningMoneyReport,
  missionCommandExamples,
  missionStateLabels,
  opportunityMissions,
  workCycles,
  type OpportunityMission,
} from "@/components/newsroom/sales/mockMaximillionV4Data";
import {
  CalendarClock,
  FileText,
  Globe2,
  MailPlus,
  Moon,
  RadioTower,
  Sparkles,
  Target,
} from "lucide-react";

type MissionTab =
  | "missions"
  | "markets"
  | "festivals"
  | "drafts"
  | "cycles"
  | "morning";

const tabs: Array<{ id: MissionTab; label: string; icon: typeof Target }> = [
  { id: "missions", label: "Missions", icon: Target },
  { id: "markets", label: "Markets", icon: Globe2 },
  { id: "festivals", label: "Festivals", icon: Sparkles },
  { id: "drafts", label: "Drafts", icon: MailPlus },
  { id: "cycles", label: "Work Cycles", icon: Moon },
  { id: "morning", label: "Morning Report", icon: CalendarClock },
];

const stateTone: Record<OpportunityMission["state"], string> = {
  Queued: "border-border bg-slate-300/10 text-foreground",
  Running: "border-sky-300/20 bg-sky-400/10 text-sky-700 dark:text-sky-100",
  Paused: "border-amber-300/20 bg-amber-300/10 text-amber-700 dark:text-amber-100",
  "Needs Review": "border-emerald-300/20 bg-emerald-400/10 text-emerald-700 dark:text-emerald-100",
  Completed: "border-teal-300/20 bg-teal-400/10 text-teal-700 dark:text-teal-100",
  Archived: "border-border bg-zinc-300/10 text-foreground",
};

export function MaximillionOpportunityMissions() {
  const [activeTab, setActiveTab] = useState<MissionTab>("missions");

  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-emerald-300">
            <RadioTower className="w-4 h-4" />
            <h3 className="text-sm font-black">
              Maximillion V4.5 Global Revenue Hunter
            </h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Opportunity mission architecture for global markets, festivals,
            intros, work cycles, and morning money reports. No background task
            or live crawler is active.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
          Architecture preview
        </span>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              type="button"
              size="sm"
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className="h-10 shrink-0 px-3 text-[11px]"
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      <div className="mt-3">
        {activeTab === "missions" && <MissionPanel />}
        {activeTab === "markets" && <GlobalMarketPanel />}
        {activeTab === "festivals" && <FestivalPanel />}
        {activeTab === "drafts" && <IntroDraftPanel />}
        {activeTab === "cycles" && <WorkCyclePanel />}
        {activeTab === "morning" && <MorningReportPanel />}
      </div>
    </section>
  );
}

function MissionPanel() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-300/15 bg-amber-300/[0.06] p-3">
        <div className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-100">
          Important
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-amber-700 dark:text-amber-50/85">
          Mission states model how Maximillion will organize long-running work.
          They do not imply autonomous background scanning in this build.
        </p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {missionCommandExamples.map((command) => (
          <span
            key={command}
            className="shrink-0 rounded-full border border-border/45 bg-secondary/30 px-3 py-2 text-[11px] text-foreground/82"
          >
            {command}
          </span>
        ))}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {missionStateLabels.map((state) => (
          <span
            key={state}
            className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-black ${
              stateTone[state]
            }`}
          >
            {state}
          </span>
        ))}
      </div>
      <div className="grid gap-2 xl:grid-cols-3">
        {opportunityMissions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} />
        ))}
      </div>
    </div>
  );
}

function MissionCard({ mission }: { mission: OpportunityMission }) {
  return (
    <article className="rounded-lg border border-border/45 bg-secondary/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-[13px] font-black leading-snug">
            {mission.missionName}
          </h4>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {mission.priority} priority · {mission.estimatedValue}
          </p>
        </div>
        <span
          className={`w-fit rounded-md border px-2 py-1 text-[10px] font-black ${
            stateTone[mission.state]
          }`}
        >
          {mission.state}
        </span>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-foreground/82">
        {mission.goal}
      </p>

      <div className="mt-3 h-2 rounded-full bg-foreground/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${mission.completionPercentage}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{mission.completionPercentage}% modeled</span>
        <span>Confidence {mission.confidenceScore}</span>
      </div>

      <div className="mt-3 grid gap-2">
        <InfoBlock label="Regions" value={mission.regions.join(", ")} />
        <InfoBlock label="Categories" value={mission.categories.join(", ")} />
        <InfoBlock label="Opportunities discovered" value={String(mission.opportunitiesDiscovered)} />
        <InfoBlock label="Time elapsed" value={mission.timeElapsed} />
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        {mission.notes}
      </p>
    </article>
  );
}

function GlobalMarketPanel() {
  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-border/45 bg-secondary/30 p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Global scout regions
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {globalScoutRegions.map((region) => (
            <span
              key={region}
              className="rounded-full border border-border/45 bg-secondary/25 px-2 py-1 text-[10px] text-foreground/82"
            >
              {region}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-2 xl:grid-cols-3">
        {globalMarketOpportunities.map((market) => (
          <article
            key={market.id}
            className="rounded-lg border border-border/45 bg-secondary/30 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-[13px] font-black">{market.region}</h4>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {market.market}
                </p>
              </div>
              <span className="rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-100">
                {market.relevanceScore}
              </span>
            </div>
            <InfoBlock label="Industry" value={market.industry} />
            <InfoBlock label="Event" value={market.event} />
            <InfoBlock label="Artists" value={market.artists.join(", ")} />
            <InfoBlock label="Brands" value={market.brands.join(", ")} />
            <InfoBlock label="Festivals" value={market.festivals.join(", ")} />
            <div className="mt-3 text-[11px] font-black text-emerald-700 dark:text-emerald-200">
              {market.estimatedOpportunityValue}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-foreground/82">
              {market.summary}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FestivalPanel() {
  return (
    <section className="grid gap-2 xl:grid-cols-2">
      {festivalArtistOpportunities.map((festival) => (
        <article
          key={festival.id}
          className="rounded-lg border border-border/45 bg-secondary/30 p-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <h4 className="text-[13px] font-black">{festival.name}</h4>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {festival.country} · {festival.timing}
              </p>
            </div>
            <span className="w-fit rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-100">
              HMG {festival.hmgCompatibilityScore}
            </span>
          </div>
          <InfoBlock label="Audience" value={festival.estimatedAudience} />
          <InfoBlock label="Sponsor opportunities" value={festival.sponsorOpportunities.join(", ")} />
          <InfoBlock label="Media opportunities" value={festival.mediaOpportunities.join(", ")} />
          <InfoBlock label="Artist opportunities" value={festival.artistOpportunities.join(", ")} />
          <InfoBlock label="Interview opportunities" value={festival.interviewOpportunities.join(", ")} />
        </article>
      ))}
    </section>
  );
}

function IntroDraftPanel() {
  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-border/45 bg-secondary/30 p-3">
        <div className="flex items-center gap-2 text-emerald-300">
          <FileText className="w-4 h-4" />
          <h4 className="text-[13px] font-black">Intro + Outreach Engine</h4>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Draft only. Maximillion does not send email, messages, or calendar
          invites in this build.
        </p>
      </div>
      <div className="grid gap-2 xl:grid-cols-2">
        {introDrafts.map((draft) => (
          <article
            key={draft.id}
            className="rounded-lg border border-border/45 bg-secondary/30 p-3"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {draft.type}
            </div>
            <h4 className="mt-1 text-[13px] font-black">{draft.subject}</h4>
            <p className="mt-3 rounded-md border border-emerald-300/15 bg-emerald-400/[0.04] p-2 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-50/86">
              {draft.draft}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {draft.nextStep}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function WorkCyclePanel() {
  return (
    <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {workCycles.map((cycle) => (
        <article
          key={cycle.id}
          className="rounded-lg border border-border/45 bg-secondary/30 p-3"
        >
          <h4 className="text-[13px] font-black">{cycle.label}</h4>
          <p className="mt-2 text-[11px] leading-relaxed text-foreground/82">
            {cycle.operatingStyle}
          </p>
          <InfoBlock label="Best for" value={cycle.bestFor} />
          <InfoBlock label="Output" value={cycle.output} />
        </article>
      ))}
    </section>
  );
}

function MorningReportPanel() {
  const sections = [
    ["What Maximillion found", morningMoneyReport.found],
    ["High value opportunities", morningMoneyReport.highValueOpportunities],
    ["Urgent opportunities", morningMoneyReport.urgentOpportunities],
    ["Follow ups", morningMoneyReport.followUps],
    ["New contacts", morningMoneyReport.newContacts],
    ["Calendar suggestions", morningMoneyReport.calendarSuggestions],
    ["Recommended next actions", morningMoneyReport.recommendedNextActions],
  ];

  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-emerald-300/15 bg-emerald-400/[0.04] p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Potential revenue
        </div>
        <div className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-100">
          {morningMoneyReport.potentialRevenue}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {sections.map(([label, values]) => (
          <div
            key={label as string}
            className="rounded-lg border border-border/45 bg-secondary/30 p-3"
          >
            <h4 className="text-[13px] font-black">{label as string}</h4>
            <div className="mt-2 space-y-1.5">
              {(values as string[]).map((value) => (
                <div
                  key={value}
                  className="rounded-md border border-border/35 bg-secondary/25 p-2 text-[11px] leading-relaxed text-foreground/82"
                >
                  {value}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 rounded-md border border-border/35 bg-secondary/25 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 break-words text-[11px] leading-relaxed text-foreground/82">
        {value}
      </div>
    </div>
  );
}
