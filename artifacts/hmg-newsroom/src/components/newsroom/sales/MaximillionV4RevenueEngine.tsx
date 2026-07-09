import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  autopilotItems,
  documentBrainPipelines,
  futureRevenueHooksV4,
  leadProviderAdapters,
  leadScoutExamples,
  moneyPlaybookLessons,
  personalityModesV4,
  relationshipGraphEdges,
  relationshipGraphNodes,
  relationshipProfiles,
  revenueCalendarV2,
  runLocalLeadScoutEngine,
  type LocalLeadScoutResult,
} from "@/components/newsroom/sales/mockMaximillionV4Data";
import {
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CircleDollarSign,
  FileText,
  Lock,
  MapPinned,
  Network,
  Search,
  Settings2,
  Upload,
  Users,
  Zap,
} from "lucide-react";

type EngineTab =
  | "scout"
  | "relationships"
  | "playbook"
  | "autopilot"
  | "calendar"
  | "docs"
  | "personality";

const tabs: Array<{ id: EngineTab; label: string; icon: typeof Search }> = [
  { id: "scout", label: "Lead Scout", icon: Search },
  { id: "relationships", label: "Relationships", icon: Network },
  { id: "playbook", label: "Playbook", icon: BookOpen },
  { id: "autopilot", label: "Autopilot", icon: Zap },
  { id: "calendar", label: "Calendar 2.0", icon: CalendarDays },
  { id: "docs", label: "Doc Brain", icon: FileText },
  { id: "personality", label: "Modes", icon: Settings2 },
];

const defaultScoutQuery = "I'm home all day - find Culver City gyms for FitHaven.";

export function MaximillionV4RevenueEngine() {
  const [activeTab, setActiveTab] = useState<EngineTab>("scout");
  const [query, setQuery] = useState(defaultScoutQuery);
  const [selectedProfile, setSelectedProfile] = useState(relationshipProfiles[1]?.id ?? "trent");
  const scoutRun = useMemo(() => runLocalLeadScoutEngine(query), [query]);
  const profile =
    relationshipProfiles.find((item) => item.id === selectedProfile) ??
    relationshipProfiles[0];

  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-emerald-300">
            <BrainCircuit className="w-4 h-4" />
            <h3 className="text-sm font-black">
              Maximillion V4 Ultra Diamond Titanium Engine
            </h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Local deterministic engines for lead discovery, relationship memory,
            playbooks, calendar strategy, documents, and executive modes.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
          No live AI or internet calls
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
        {activeTab === "scout" && (
          <LeadScoutPanel query={query} setQuery={setQuery} scoutRun={scoutRun} />
        )}
        {activeTab === "relationships" && (
          <RelationshipPanel
            selectedProfile={selectedProfile}
            setSelectedProfile={setSelectedProfile}
            profile={profile}
          />
        )}
        {activeTab === "playbook" && <MoneyPlaybookPanel />}
        {activeTab === "autopilot" && <AutopilotPanel />}
        {activeTab === "calendar" && <RevenueCalendarV2Panel />}
        {activeTab === "docs" && <DocumentBrainPanel />}
        {activeTab === "personality" && <PersonalityAndHooksPanel />}
      </div>
    </section>
  );
}

function LeadScoutPanel({
  query,
  setQuery,
  scoutRun,
}: {
  query: string;
  setQuery: (value: string) => void;
  scoutRun: ReturnType<typeof runLocalLeadScoutEngine>;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/45 bg-secondary/30 p-3">
        <div className="flex items-center gap-2 text-emerald-300">
          <MapPinned className="w-4 h-4" />
          <h4 className="text-[13px] font-black">LocalLeadScoutEngine</h4>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Enter founder shorthand. Maximillion interprets intent and scores
          mock leads locally without claiming live web or map results.
        </p>
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mt-3 min-h-[76px] w-full rounded-md border border-border/60 bg-secondary/40 p-2 text-[12px] leading-relaxed outline-none focus:border-emerald-300/50"
          aria-label="Local lead scout command"
        />
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {leadScoutExamples.map((example) => (
            <Button
              key={example}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setQuery(example)}
              className="h-10 shrink-0 text-[11px]"
            >
              {example.split(" ").slice(0, 4).join(" ")}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-emerald-300/15 bg-emerald-400/[0.04] p-3">
        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-200">
          Interpreted intent
        </div>
        <div className="mt-1 text-[12px] leading-relaxed text-foreground">
          {scoutRun.interpretedIntent}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          {scoutRun.sourceNotice}
        </p>
      </div>

      <div className="grid gap-2 xl:grid-cols-2">
        {scoutRun.results.map((lead) => (
          <ScoutLeadCard key={lead.id} lead={lead} />
        ))}
      </div>

      <AdapterPanel />
    </div>
  );
}

function ScoutLeadCard({ lead }: { lead: LocalLeadScoutResult }) {
  const scores = [
    ["FitHaven", lead.compatibility.FitHaven],
    ["SportsHaven", lead.compatibility.SportsHaven],
    ["MusicHaven", lead.compatibility.MusicHaven],
    ["CannaHaven", lead.compatibility.CannaHaven],
    ["Relationship", lead.relationshipPotentialScore],
    ["Urgency", lead.urgencyScore],
  ];

  return (
    <article className="rounded-lg border border-border/45 bg-secondary/30 p-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-[13px] font-black leading-snug">{lead.leadName}</h4>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {lead.category} · {lead.estimatedDealValue}
          </p>
        </div>
        <span className="w-fit rounded-md border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-100">
          Sponsor {lead.sponsorProbability}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <InfoBlock label="Address" value={lead.address} />
        <InfoBlock label="Website" value={lead.website} />
        <InfoBlock label="Revenue estimate" value={lead.revenueEstimate} />
        <InfoBlock label="Lead source tag" value={lead.sourceTag} />
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {scores.map(([label, score]) => (
          <div
            key={label}
            className="rounded-md border border-border/35 bg-secondary/25 p-2"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className="mt-1 text-[13px] font-black text-foreground">
              {score}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-foreground/82">
        {lead.reasoningSummary}
      </p>
    </article>
  );
}

function AdapterPanel() {
  return (
    <section className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex items-center gap-2 text-foreground">
        <Lock className="w-4 h-4" />
        <h4 className="text-[13px] font-black">LeadProviderAdapter Layer</h4>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        These are provider-neutral future hooks only. Nothing here is active.
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {leadProviderAdapters.map((adapter) => (
          <div
            key={adapter.id}
            className="rounded-lg border border-border/45 bg-secondary/30 p-3 opacity-80"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-[12px] font-black">{adapter.label}</div>
              <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {adapter.note}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {adapter.supportedInputs.map((input) => (
                <span
                  key={input}
                  className="rounded-full border border-border/40 px-2 py-0.5 text-[10px] text-foreground/75"
                >
                  {input}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RelationshipPanel({
  selectedProfile,
  setSelectedProfile,
  profile,
}: {
  selectedProfile: string;
  setSelectedProfile: (id: string) => void;
  profile: typeof relationshipProfiles[number];
}) {
  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-border/45 bg-secondary/30 p-3">
        <div className="flex items-center gap-2 text-emerald-300">
          <Users className="w-4 h-4" />
          <h4 className="text-[13px] font-black">
            Maximillion Relationship Memory Engine
          </h4>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Mock storage schema for people, roles, traits, opportunities, trust,
          relationship strength, and revenue relevance. Upload parsing comes later.
        </p>
        <div className="mt-3 rounded-lg border border-dashed border-border/60 bg-secondary/25 p-3">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            <Upload className="w-3.5 h-3.5" />
            Bio / doc / profile dropzone placeholder
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-foreground/75">
            Future document intake will map notes into the relationship profile
            fields. No file parsing is active in V4.
          </p>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-border/45 bg-secondary/30 p-3">
          <h4 className="text-[13px] font-black">Relationship Graph</h4>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {relationshipGraphNodes.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() =>
                  relationshipProfiles.some((profileItem) => profileItem.id === node.id) &&
                  setSelectedProfile(node.id)
                }
                className={`min-h-16 rounded-lg border p-2 text-left ${
                  node.id === selectedProfile
                    ? "border-emerald-300/40 bg-emerald-400/10"
                    : "border-border/45 bg-secondary/25"
                }`}
              >
                <div className="text-[11px] font-black leading-snug">
                  {node.label}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {node.type}
                </div>
                {node.score && (
                  <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-200">
                    Score {node.score}
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            {relationshipGraphEdges.map((edge) => (
              <div
                key={`${edge.from}-${edge.to}`}
                className="rounded-md border border-border/35 bg-secondary/20 p-2 text-[11px] text-muted-foreground"
              >
                {edge.from} to {edge.to}: {edge.label}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border/45 bg-secondary/30 p-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <h4 className="text-[14px] font-black">{profile.name}</h4>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {profile.role} · {profile.industry}
              </p>
            </div>
            <span className="w-fit rounded-md border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-100">
              Revenue {profile.revenueOpportunityScore}
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <ScorePill label="Trust" value={profile.trustScore} />
            <ScorePill label="Relationship" value={profile.relationshipScore} />
            <ScorePill label="Revenue" value={profile.revenueOpportunityScore} />
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <InfoBlock label="Skills" value={profile.skills.join(", ")} />
            <InfoBlock label="Traits" value={profile.personalityTraits.join(", ")} />
            <InfoBlock label="Interests" value={profile.interests.join(", ")} />
            <InfoBlock label="Mutual contacts" value={profile.mutualContacts.join(", ") || "Pending"} />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-foreground/82">
            {profile.potentialHmgRelevance}
          </p>
          <div className="mt-3 space-y-1.5">
            {profile.suggestedOpportunities.map((item) => (
              <div
                key={item}
                className="rounded-md border border-emerald-300/15 bg-emerald-400/[0.04] p-2 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-50/82"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MoneyPlaybookPanel() {
  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-border/45 bg-secondary/30 p-3">
        <div className="flex items-center gap-2 text-emerald-300">
          <BookOpen className="w-4 h-4" />
          <h4 className="text-[13px] font-black">
            If I would&apos;ve known this...
          </h4>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Executive lessons translated into HMG revenue actions.
        </p>
      </div>
      <div className="grid gap-2 xl:grid-cols-2">
        {moneyPlaybookLessons.map((lesson) => (
          <article
            key={lesson.id}
            className="rounded-lg border border-border/45 bg-secondary/30 p-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {lesson.category}
                </div>
                <h4 className="mt-1 text-[13px] font-black leading-snug">
                  {lesson.quickLesson}
                </h4>
              </div>
              <span className="w-fit rounded-md border border-sky-300/20 bg-sky-400/10 px-2 py-1 text-[10px] font-black text-sky-700 dark:text-sky-100">
                {lesson.difficulty}
              </span>
            </div>
            <InfoBlock label="Action item" value={lesson.actionItem} />
            <InfoBlock label="How HMG applies it" value={lesson.hmgApplication} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ScoreText label="Revenue impact" value={lesson.potentialRevenueImpact} />
              <ScoreText label="Time" value={lesson.timeEstimate} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AutopilotPanel() {
  return (
    <section className="rounded-lg border border-border/45 bg-secondary/30 p-3">
      <div className="flex items-center gap-2 text-emerald-300">
        <Zap className="w-4 h-4" />
        <h4 className="text-[13px] font-black">Today&apos;s Money Autopilot</h4>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        Local command list only. No background automation or fake outreach.
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {autopilotItems.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-border/45 bg-secondary/25 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {item.lane}
                </div>
                <h4 className="mt-1 text-[13px] font-black leading-snug">
                  {item.title}
                </h4>
              </div>
              <span className="rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-100">
                {item.priority}
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-foreground/82">
              {item.action}
            </p>
            <div className="mt-2 text-[11px] font-black text-emerald-700 dark:text-emerald-200">
              {item.revenueRange}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RevenueCalendarV2Panel() {
  return (
    <section className="space-y-2">
      {revenueCalendarV2.map((item) => (
        <article
          key={item.id}
          className="rounded-lg border border-border/45 bg-secondary/30 p-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div>
              <h4 className="text-[13px] font-black">{item.moment}</h4>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {item.timing}
              </p>
            </div>
            <span className="w-fit rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[11px] font-black text-emerald-700 dark:text-emerald-100">
              {item.projectedRevenue}
            </span>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <InfoBlock label="Potential sponsors" value={item.potentialSponsors.join(", ")} />
            <InfoBlock label="Content ideas" value={item.contentIdeas.join(", ")} />
            <InfoBlock label="Lead opportunities" value={item.leadOpportunities.join(", ")} />
            <InfoBlock label="Suggested meetings" value={item.suggestedMeetings.join(", ")} />
          </div>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {item.actionChecklist.map((action) => (
              <div
                key={action}
                className="rounded-md border border-emerald-300/15 bg-emerald-400/[0.04] p-2 text-[11px] text-foreground/82"
              >
                {action}
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function DocumentBrainPanel() {
  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-dashed border-border/60 bg-secondary/30 p-4">
        <div className="flex items-center gap-2 text-emerald-300">
          <Upload className="w-4 h-4" />
          <h4 className="text-[13px] font-black">Executive Document Brain</h4>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Upload architecture for expenses, sales sheets, CSVs, PDFs,
          spreadsheets, decks, meeting notes, emails, reports, mock invoices,
          and mock contracts. No real parsing is active.
        </p>
      </div>
      <div className="grid gap-2 lg:grid-cols-3">
        {documentBrainPipelines.map((pipeline) => (
          <article
            key={pipeline.id}
            className="rounded-lg border border-border/45 bg-secondary/30 p-3"
          >
            <h4 className="text-[13px] font-black">{pipeline.inputType}</h4>
            <InfoBlock label="Accepts" value={pipeline.accepts.join(", ")} />
            <InfoBlock label="Creates" value={pipeline.outputs.join(", ")} />
            <p className="mt-3 text-[11px] leading-relaxed text-amber-700 dark:text-amber-100/85">
              {pipeline.riskNote}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {pipeline.futureHook}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PersonalityAndHooksPanel() {
  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-emerald-300/15 bg-emerald-400/[0.04] p-3">
        <h4 className="text-[13px] font-black text-emerald-700 dark:text-emerald-100">
          Personality System
        </h4>
        <p className="mt-2 text-[11px] leading-relaxed text-foreground/82">
          Maximillion is cool, confident, wise, sports savvy, hip-hop literate,
          and AAVE capable without overusing slang or performing a stereotype.
          The default voice stays executive, useful, and composed.
        </p>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {personalityModesV4.map((mode) => (
          <article
            key={mode.id}
            className="rounded-lg border border-border/45 bg-secondary/30 p-3"
          >
            <h4 className="text-[13px] font-black">{mode.label}</h4>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {mode.profile}
            </p>
            <p className="mt-3 rounded-md border border-emerald-300/15 bg-emerald-400/[0.04] p-2 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-50/86">
              {mode.sampleLine}
            </p>
          </article>
        ))}
      </div>

      <section className="rounded-lg border border-border bg-secondary/30 p-3">
        <div className="flex items-center gap-2 text-foreground">
          <Lock className="w-4 h-4" />
          <h4 className="text-[13px] font-black">Future Hooks Only</h4>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {futureRevenueHooksV4.map((hook) => (
            <div
              key={hook.id}
              className="rounded-lg border border-border/45 bg-secondary/30 p-3 opacity-80"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-[12px] font-black">{hook.label}</div>
                <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {hook.note}
              </p>
            </div>
          ))}
        </div>
      </section>
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

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-emerald-300/15 bg-emerald-400/[0.04] p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-[13px] font-black text-emerald-700 dark:text-emerald-100">
        {value}
      </div>
    </div>
  );
}

function ScoreText({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/35 bg-secondary/25 p-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <CircleDollarSign className="w-3 h-3" />
        {label}
      </div>
      <div className="mt-1 text-[11px] font-black text-emerald-700 dark:text-emerald-100">
        {value}
      </div>
    </div>
  );
}
