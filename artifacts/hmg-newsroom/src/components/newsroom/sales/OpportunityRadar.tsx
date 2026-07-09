import { useMemo, useState } from "react";
import {
  mockOpportunities,
  opportunityCategories,
  sponsorTargets,
  type OpportunityCategory,
} from "@/components/newsroom/sales/mockMaximillionData";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Radar, Target } from "lucide-react";

export function OpportunityRadar() {
  const [selected, setSelected] = useState<OpportunityCategory | "all">("all");
  const opportunities = useMemo(
    () =>
      selected === "all"
        ? mockOpportunities
        : mockOpportunities.filter((opportunity) => opportunity.category === selected),
    [selected],
  );

  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-emerald-300">
              <Radar className="w-4 h-4" />
              <h3 className="text-sm font-black">Opportunity Radar</h3>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Sponsor, advertiser, event, and media revenue lanes.
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {opportunities.length} active plays
          </span>
        </div>

        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          <Button
            type="button"
            size="sm"
            variant={selected === "all" ? "default" : "outline"}
            onClick={() => setSelected("all")}
            className="h-8 text-[11px] shrink-0"
          >
            All
          </Button>
          {opportunityCategories.map((category) => (
            <Button
              key={category.id}
              type="button"
              size="sm"
              variant={selected === category.id ? "default" : "outline"}
              onClick={() => setSelected(category.id)}
              className="h-8 text-[11px] shrink-0"
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {opportunities.map((opportunity) => (
          <div
            key={opportunity.id}
            className="rounded-lg border border-border/55 bg-secondary/35 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-[13px] font-black leading-snug">
                  {opportunity.title}
                </h4>
                <p className="text-[10px] uppercase tracking-wider text-emerald-300 mt-1">
                  {opportunity.estimatedValueRange} potential
                </p>
              </div>
              <FitScore value={opportunity.fitScore} />
            </div>
            <BrandPills brands={opportunity.relevantBrands} />
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {opportunity.whyItMatters}
            </p>
            <div className="mt-2 rounded-md bg-emerald-400/[0.06] border border-emerald-400/10 p-2">
              <div className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-200">
                Suggested play
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-foreground/85">
                {opportunity.suggestedPlay}
              </p>
            </div>
            <div className="mt-2 flex items-start gap-1.5 text-[11px] text-foreground/80">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
              <span>{opportunity.nextAction}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-sky-300/20 bg-secondary/35 p-3">
        <div className="flex items-center gap-2 text-sky-700 dark:text-sky-200">
          <Target className="w-4 h-4" />
          <h3 className="text-sm font-black">Sponsor Intelligence</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Mock target cards for the first Maximillion sponsor database.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {sponsorTargets.map((target) => (
            <div
              key={target.id}
              className="rounded-lg border border-border/50 bg-secondary/30 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-[12px] font-black leading-snug">
                  {target.companyOrCategory}
                </h4>
                <FitScore value={target.fitScore} tone="sky" />
              </div>
              <BrandPills brands={target.havenBrands} tone="sky" />
              <p className="mt-2 text-[11px] leading-relaxed text-foreground/82">
                {target.suggestedPitch}
              </p>
              <div className="mt-2 text-[11px] leading-relaxed text-sky-700 dark:text-sky-100/85">
                <span className="font-bold">Next action:</span> {target.nextAction}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FitScore({
  value,
  tone = "emerald",
}: {
  value: number;
  tone?: "emerald" | "sky";
}) {
  const color =
    tone === "emerald"
      ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200"
      : "border-sky-300/25 bg-sky-400/10 text-sky-700 dark:text-sky-100";

  return (
    <span
      className={`rounded-md border px-2 py-1 text-[10px] font-black ${color}`}
    >
      {value}
    </span>
  );
}

function BrandPills({
  brands,
  tone = "emerald",
}: {
  brands: string[];
  tone?: "emerald" | "sky";
}) {
  const color =
    tone === "emerald"
      ? "border-emerald-300/20 text-emerald-700 dark:text-emerald-100"
      : "border-sky-300/20 text-sky-700 dark:text-sky-100";

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {brands.map((brand) => (
        <span
          key={brand}
          className={`rounded-full border bg-foreground/[0.03] px-2 py-0.5 text-[10px] ${color}`}
        >
          {brand}
        </span>
      ))}
    </div>
  );
}
