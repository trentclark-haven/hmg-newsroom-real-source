import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  offlineMoneyOpportunities,
  type OfflineMoneyOpportunity,
} from "@/components/newsroom/sales/mockMaximillionV8Data";
import { Handshake, MapPinned, Mic2, Radio, School, Users } from "lucide-react";

type OfflineCategory = OfflineMoneyOpportunity["category"];

const categoryIcons: Record<OfflineCategory, typeof Mic2> = {
  "Speaking opportunities": Mic2,
  "Event appearances": Radio,
  "Sponsor activations": Handshake,
  "Local networking": MapPinned,
  "University opportunities": School,
  "Brand partnerships": Handshake,
  Consulting: Users,
  "Media interviews": Mic2,
};

const effortTone = {
  Low: "border-emerald-300/20 bg-emerald-400/10 text-emerald-700 dark:text-emerald-100",
  Medium: "border-amber-300/20 bg-amber-300/10 text-amber-700 dark:text-amber-100",
  High: "border-red-300/20 bg-red-400/10 text-red-700 dark:text-red-100",
};

export function MaximillionOfflineMoney() {
  const categories = useMemo(
    () => Array.from(new Set(offlineMoneyOpportunities.map((item) => item.category))),
    [],
  );
  const [selected, setSelected] = useState<OfflineCategory | "All">("All");
  const visible = offlineMoneyOpportunities.filter(
    (item) => selected === "All" || item.category === selected,
  );

  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3 overflow-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-emerald-300">
            <MapPinned className="h-4 w-4" />
            <h3 className="text-sm font-black">Maximillion Offline Money</h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Offsite money engine for speaking, appearances, activations,
            networking, universities, partnerships, consulting, and interviews.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
          Offline revenue
        </span>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {(["All", ...categories] as Array<OfflineCategory | "All">).map((category) => (
          <Button
            key={category}
            type="button"
            size="sm"
            variant={selected === category ? "default" : "outline"}
            onClick={() => setSelected(category)}
            className="h-10 shrink-0 px-3 text-[11px]"
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 xl:grid-cols-2">
        {visible.map((opportunity) => {
          const Icon = categoryIcons[opportunity.category];
          return (
            <article
              key={opportunity.id}
              className="rounded-lg border border-border/45 bg-secondary/30 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-100">
                    <Icon className="h-4 w-4 shrink-0" />
                    <h4 className="text-[13px] font-black leading-snug text-foreground">
                      {opportunity.title}
                    </h4>
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {opportunity.category} · {opportunity.estimatedRevenue}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-black ${effortTone[opportunity.effort]}`}
                >
                  {opportunity.effort}
                </span>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-foreground/82">
                {opportunity.whyItWorks}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {opportunity.bestFitBrands.map((brand) => (
                  <span
                    key={brand}
                    className="rounded-full border border-sky-300/20 bg-sky-400/[0.06] px-2 py-1 text-[10px] font-bold text-sky-700 dark:text-sky-100"
                  >
                    {brand}
                  </span>
                ))}
              </div>
              <div className="mt-3 rounded-md border border-emerald-300/15 bg-emerald-400/[0.07] p-2 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-50/86">
                Next: {opportunity.nextAction}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
