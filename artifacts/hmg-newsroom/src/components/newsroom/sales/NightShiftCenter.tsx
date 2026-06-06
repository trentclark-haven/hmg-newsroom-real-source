import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  buildNightShiftQueue,
} from "@/components/newsroom/sales/mockMaximillionV7Data";
import {
  globalMarketOpportunities,
  morningMoneyReport,
} from "@/components/newsroom/sales/mockMaximillionV4Data";
import { Globe2, Moon, Sunrise } from "lucide-react";

const nightShiftRegions = [
  "Europe",
  "Asia",
  "Australia",
  "South America",
  "Africa",
];

export function NightShiftCenter() {
  const [region, setRegion] = useState(nightShiftRegions[0]);
  const queue = useMemo(() => buildNightShiftQueue(region), [region]);
  const regionalOpportunity = globalMarketOpportunities.find(
    (item) => item.region === region,
  );

  return (
    <section className="rounded-lg border border-blue-300/20 bg-secondary/35 p-3 overflow-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-100">
            <Moon className="h-4 w-4" />
            <h3 className="text-sm font-black">Night Shift Center</h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Late-night opportunity strategy mode. This creates a local morning
            queue preview only; it does not browse, run in the background, or
            claim autonomous execution.
          </p>
        </div>
        <span className="rounded-full border border-blue-200/20 bg-blue-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-100">
          Mock queue preview
        </span>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {nightShiftRegions.map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={region === item ? "default" : "outline"}
            onClick={() => setRegion(item)}
            className="h-10 shrink-0 px-3 text-[11px]"
          >
            {item}
          </Button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="rounded-lg border border-blue-200/15 bg-blue-300/[0.06] p-3">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-100">
            <Globe2 className="h-4 w-4" />
            <h4 className="text-[13px] font-black">{queue.region} Focus</h4>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-blue-700 dark:text-blue-50/84">
            {queue.focus}
          </p>
          <div className="mt-3 rounded-md border border-blue-200/15 bg-secondary/25 p-2 text-[11px] text-blue-700 dark:text-blue-50/80">
            Estimated opportunity range: {queue.estimatedRange}
          </div>
          {regionalOpportunity && (
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Market: {regionalOpportunity.market} · Industry:{" "}
              {regionalOpportunity.industry}
            </p>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <QueueBlock title="Markets to review" rows={queue.marketsToReview} />
          <QueueBlock title="Artists" rows={queue.artists} />
          <QueueBlock title="Festivals" rows={queue.festivals} />
          <QueueBlock title="Brands / sponsors" rows={[...queue.brands, ...queue.sponsors]} />
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-emerald-300/15 bg-emerald-400/[0.07] p-3">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-100">
          <Sunrise className="h-4 w-4" />
          <h4 className="text-[13px] font-black">Morning Queue Preview</h4>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <QueueBlock title="What Max found" rows={morningMoneyReport.found} />
          <QueueBlock title="Meeting ideas" rows={queue.meetingIdeas} />
          <QueueBlock
            title="Next actions"
            rows={morningMoneyReport.recommendedNextActions}
          />
        </div>
      </div>
    </section>
  );
}

function QueueBlock({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="rounded-md border border-border/40 bg-secondary/25 p-2.5">
      <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="mt-2 space-y-1.5">
        {rows.slice(0, 5).map((row, index) => (
          <div
            key={`${title}-${row}-${index}`}
            className="text-[11px] leading-relaxed text-foreground/82"
          >
            {row}
          </div>
        ))}
      </div>
    </div>
  );
}
