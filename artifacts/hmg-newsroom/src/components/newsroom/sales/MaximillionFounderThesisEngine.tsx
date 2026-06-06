import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  founderBriefings,
  founderProfileEngine,
  getStrategicConfidenceAverage,
  getStrategicConfidenceLabel,
  havenStrategicTheses,
  maximillionOperatingDoctrine,
  strategicConfidenceScores,
  type FounderBriefing,
  type HavenStrategicThesis,
  type StrategicConfidenceScore,
} from "@/components/newsroom/sales/mockMaximillionV5Data";
import {
  AlertTriangle,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  Crosshair,
  Lightbulb,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";

type V5Tab = "founder" | "thesis" | "confidence" | "briefings" | "doctrine";

const tabs: Array<{ id: V5Tab; label: string; icon: typeof UserRound }> = [
  { id: "founder", label: "Founder DNA", icon: UserRound },
  { id: "thesis", label: "Haven Thesis", icon: Compass },
  { id: "confidence", label: "Confidence", icon: TrendingUp },
  { id: "briefings", label: "Briefings", icon: BriefcaseBusiness },
  { id: "doctrine", label: "Doctrine", icon: ShieldCheck },
];

export function MaximillionFounderThesisEngine() {
  const [activeTab, setActiveTab] = useState<V5Tab>("founder");

  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-emerald-300">
            <BrainCircuit className="w-4 h-4" />
            <h3 className="text-sm font-black">
              Maximillion V5 Founder DNA + Haven Thesis Engine
            </h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Strategic context layer for Trent Clark, Haven Media Group, brand
            theses, confidence scoring, and founder briefings. Optimistic,
            evidence-driven, and built to challenge weak assumptions.
          </p>
        </div>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-100">
          No hype guarantees
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
        {activeTab === "founder" && <FounderDnaPanel />}
        {activeTab === "thesis" && <HavenThesisPanel />}
        {activeTab === "confidence" && <ConfidencePanel />}
        {activeTab === "briefings" && <BriefingsPanel />}
        {activeTab === "doctrine" && <DoctrinePanel />}
      </div>
    </section>
  );
}

function FounderDnaPanel() {
  const founder = founderProfileEngine;

  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-emerald-300/15 bg-emerald-400/[0.04] p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Founder
        </div>
        <h4 className="mt-1 text-lg font-black text-emerald-700 dark:text-emerald-100">
          {founder.founder}
        </h4>
        <p className="mt-2 text-[11px] leading-relaxed text-foreground/82">
          {founder.personalMission}
        </p>
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        <ListCard title="Professional Background" items={founder.professionalBackground} />
        <ListCard title="Former Media / Editorial Experience" items={founder.formerMediaEditorialExperience} />
        <ListCard title="Leadership Style" items={founder.leadershipStyle} />
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        <ListCard title="Creative Strengths" items={founder.creativeStrengths} />
        <ListCard title="Relationship Strengths" items={founder.relationshipStrengths} />
        <ListCard title="Operational Strengths" items={founder.operationalStrengths} />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <InfoPanel title="Risk Tolerance" value={founder.riskTolerance} />
        <InfoPanel
          title="Preferred Communication"
          value={founder.preferredCommunicationStyle.join(", ")}
        />
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        {founder.capabilityCategories.map((category) => (
          <article
            key={category.lane}
            className="rounded-lg border border-border/45 bg-secondary/30 p-3"
          >
            <h4 className="text-[13px] font-black text-foreground">
              {category.lane}
            </h4>
            <MiniList label="Strengths" items={category.strengths} />
            <MiniList label="Support needed" items={category.supportNeeded} />
            <MiniList label="Automate" items={category.automationCandidates} />
          </article>
        ))}
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <ListCard title="Weaknesses / Blind Spots" items={founder.weaknessesAndBlindSpots} tone="amber" />
        <ListCard title="Areas Needing Support" items={founder.areasNeedingSupport} tone="sky" />
        <ListCard title="System Automation Priorities" items={founder.systemAutomationPriorities} tone="emerald" />
      </div>
    </section>
  );
}

function HavenThesisPanel() {
  return (
    <section className="grid gap-2 xl:grid-cols-2">
      {havenStrategicTheses.map((thesis) => (
        <ThesisCard key={thesis.id} thesis={thesis} />
      ))}
    </section>
  );
}

function ThesisCard({ thesis }: { thesis: HavenStrategicThesis }) {
  return (
    <article className="rounded-lg border border-border/45 bg-secondary/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-[14px] font-black">{thesis.brand}</h4>
          <p className="mt-2 text-[11px] leading-relaxed text-foreground/82">
            {thesis.currentThesis}
          </p>
        </div>
        <Target className="w-4 h-4 text-emerald-300 shrink-0" />
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <MiniList label="Potential strengths" items={thesis.potentialStrengths} />
        <MiniList label="Potential risks" items={thesis.potentialRisks} tone="amber" />
      </div>
      <MiniList label="Strategic leverage points" items={thesis.strategicLeveragePoints} />
      <MiniList label="Next evidence to collect" items={thesis.nextEvidenceToCollect} tone="sky" />
    </article>
  );
}

function ConfidencePanel() {
  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-amber-300/15 bg-amber-300/[0.06] p-3">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-100">
          <AlertTriangle className="w-4 h-4" />
          <h4 className="text-[13px] font-black">Strategic Confidence Model</h4>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-50/85">
          Maximillion reads these brands as high-upside possibilities, not
          guaranteed outcomes. Confidence moves with evidence, execution,
          audience proof, capital needs, and competitive pressure.
        </p>
      </div>
      <div className="grid gap-2 xl:grid-cols-2">
        {strategicConfidenceScores.map((score) => (
          <ConfidenceCard key={score.brandId} score={score} />
        ))}
      </div>
    </section>
  );
}

function ConfidenceCard({ score }: { score: StrategicConfidenceScore }) {
  const thesis = havenStrategicTheses.find((item) => item.id === score.brandId);
  const confidence = getStrategicConfidenceAverage(score);
  const label = getStrategicConfidenceLabel(score);
  const metrics = [
    ["Vision", score.visionScore],
    ["Market", score.marketOpportunity],
    ["Execution", score.executionReadiness],
    ["Audience", score.audiencePotential],
    ["Monetization", score.monetizationPotential],
    ["Op risk", score.operationalRisk],
    ["Capital", score.capitalIntensity],
    ["Competition", score.competitivePressure],
  ];

  return (
    <article className="rounded-lg border border-border/45 bg-secondary/30 p-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <h4 className="text-[14px] font-black">
            {thesis?.brand ?? score.brandId}
          </h4>
          <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
        </div>
        <span className="w-fit rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[12px] font-black text-emerald-700 dark:text-emerald-100">
          {confidence}/100
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${confidence}%` }}
        />
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-foreground/82">
        {score.potentialUpsideRange}
      </p>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {metrics.map(([metric, value]) => (
          <div
            key={metric}
            className="rounded-md border border-border/35 bg-secondary/25 p-2"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {metric}
            </div>
            <div className="mt-1 text-[13px] font-black text-foreground">
              {value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <MiniList label="Reasons" items={score.reasons} />
        <MiniList label="Key risks" items={score.keyRisks} tone="amber" />
        <MiniList label="Suggested actions" items={score.suggestedActions} tone="emerald" />
      </div>
    </article>
  );
}

function BriefingsPanel() {
  return (
    <section className="grid gap-2 xl:grid-cols-3">
      {founderBriefings.map((briefing) => (
        <BriefingCard key={briefing.id} briefing={briefing} />
      ))}
    </section>
  );
}

function BriefingCard({ briefing }: { briefing: FounderBriefing }) {
  return (
    <article className="rounded-lg border border-border/45 bg-secondary/30 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-[13px] font-black">{briefing.title}</h4>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {briefing.cadence}
          </p>
        </div>
        <Crosshair className="w-4 h-4 text-emerald-300 shrink-0" />
      </div>
      <MiniList label="Wins" items={briefing.wins} />
      <MiniList label="Risks" items={briefing.risks} tone="amber" />
      <MiniList label="Opportunities" items={briefing.opportunities} />
      <MiniList label="Resource gaps" items={briefing.resourceGaps} tone="sky" />
      <MiniList label="High leverage actions" items={briefing.highLeverageActions} tone="emerald" />
    </article>
  );
}

function DoctrinePanel() {
  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-emerald-300/15 bg-emerald-400/[0.04] p-3">
        <div className="flex items-center gap-2 text-emerald-300">
          <ShieldCheck className="w-4 h-4" />
          <h4 className="text-[13px] font-black">
            Executive Partner, Not Yes-Man
          </h4>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-foreground/82">
          Maximillion should support Trent aggressively, but challenge
          assumptions when evidence, focus, capital, or execution readiness is
          weak.
        </p>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {maximillionOperatingDoctrine.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-border/45 bg-secondary/30 p-3"
          >
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[13px] font-black">{item.title}</h4>
                <p className="mt-2 text-[11px] leading-relaxed text-foreground/82">
                  {item.principle}
                </p>
                <p className="mt-2 rounded-md border border-border/35 bg-secondary/25 p-2 text-[11px] leading-relaxed text-muted-foreground">
                  {item.howMaximillionActs}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ListCard({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "amber" | "sky" | "emerald";
}) {
  return (
    <article className="rounded-lg border border-border/45 bg-secondary/30 p-3">
      <h4 className="text-[13px] font-black">{title}</h4>
      <MiniList label="" items={items} tone={tone} compact />
    </article>
  );
}

function MiniList({
  label,
  items,
  tone = "default",
  compact = false,
}: {
  label: string;
  items: string[];
  tone?: "default" | "amber" | "sky" | "emerald";
  compact?: boolean;
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-300/15 bg-amber-300/[0.05] text-amber-700 dark:text-amber-50/86"
      : tone === "sky"
        ? "border-sky-300/15 bg-sky-400/[0.05] text-sky-700 dark:text-sky-50/86"
        : tone === "emerald"
          ? "border-emerald-300/15 bg-emerald-400/[0.05] text-emerald-700 dark:text-emerald-50/86"
          : "border-border/35 bg-secondary/25 text-foreground/82";

  return (
    <div className={compact ? "mt-2 space-y-1.5" : "mt-3 space-y-1.5"}>
      {label && (
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      )}
      {items.map((item) => (
        <div
          key={item}
          className={`rounded-md border p-2 text-[11px] leading-relaxed ${toneClass}`}
        >
          <div className="flex items-start gap-1.5">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
            <span>{item}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoPanel({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-lg border border-border/45 bg-secondary/30 p-3">
      <h4 className="text-[13px] font-black">{title}</h4>
      <p className="mt-2 text-[11px] leading-relaxed text-foreground/82">
        {value}
      </p>
    </article>
  );
}
