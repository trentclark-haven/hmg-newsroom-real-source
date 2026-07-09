import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  calculateOpportunityScore,
  getScoreLabel,
  scoredOpportunities,
  type OpportunityScoreFactors,
} from "@/components/newsroom/sales/mockMaximillionV8Data";
import { BarChart3, Gauge, Target, TimerReset } from "lucide-react";

const factorLabels: Array<[keyof OpportunityScoreFactors, string]> = [
  ["revenuePotential", "Revenue potential"],
  ["difficulty", "Difficulty"],
  ["brandAlignment", "Brand alignment"],
  ["timeSensitivity", "Time sensitivity"],
  ["strategicValue", "Strategic value"],
  ["relationshipProximity", "Relationship proximity"],
];

export function MaximillionOpportunityScorer() {
  const [selectedId, setSelectedId] = useState(scoredOpportunities[0].id);
  const selected =
    scoredOpportunities.find((opportunity) => opportunity.id === selectedId) ??
    scoredOpportunities[0];
  const score = useMemo(
    () => calculateOpportunityScore(selected.factors),
    [selected],
  );
  const scoreLabel = getScoreLabel(score);

  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3 overflow-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-emerald-300">
            <BarChart3 className="h-4 w-4" />
            <h3 className="text-sm font-black">Maximillion Opportunity Scorer</h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Deterministic local scoring across revenue, difficulty, fit,
            urgency, strategy, and relationship proximity.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
          Score 0-100
        </span>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {scoredOpportunities.map((opportunity) => (
          <Button
            key={opportunity.id}
            type="button"
            size="sm"
            variant={selected.id === opportunity.id ? "default" : "outline"}
            onClick={() => setSelectedId(opportunity.id)}
            className="h-10 shrink-0 px-3 text-[11px]"
          >
            {opportunity.title}
          </Button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/[0.07] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-[14px] font-black leading-tight text-foreground">
                {selected.title}
              </h4>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                {selected.category} · {selected.estimatedRevenue}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-3xl font-black leading-none text-emerald-700 dark:text-emerald-100">
                {score}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100/75">
                {scoreLabel}
              </div>
            </div>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full border border-emerald-200/15 bg-secondary/35">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-md border border-border/40 bg-secondary/25 p-2 text-[11px] leading-relaxed text-foreground/82">
            <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
            {selected.recommendedAction}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {factorLabels.map(([key, label]) => {
            const value = selected.factors[key];
            const displayedValue = key === "difficulty" ? `${value}/100 harder` : `${value}/100`;
            return (
              <div
                key={key}
                className="rounded-lg border border-border/45 bg-secondary/30 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-foreground">
                    {key === "difficulty" ? (
                      <TimerReset className="h-3.5 w-3.5 text-amber-700 dark:text-amber-200" />
                    ) : (
                      <Gauge className="h-3.5 w-3.5 text-emerald-300" />
                    )}
                    {label}
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground">
                    {displayedValue}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary/40">
                  <div
                    className={`h-full rounded-full ${
                      key === "difficulty" ? "bg-amber-300" : "bg-emerald-400"
                    }`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
