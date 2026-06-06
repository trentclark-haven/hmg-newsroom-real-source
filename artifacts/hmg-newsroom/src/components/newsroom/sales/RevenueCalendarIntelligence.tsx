import { revenueCalendarMoments } from "@/components/newsroom/sales/mockMaximillionV3Data";
import { CalendarRange, Lightbulb, MapPinned } from "lucide-react";

export function RevenueCalendarIntelligence() {
  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-300">
            <CalendarRange className="w-4 h-4" />
            <h3 className="text-sm font-black">
              Revenue Calendar Intelligence
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Seasonal money engine for sports, music, cannabis, wellness,
            holidays, awards, and local activation windows.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
          Calendar-aware mock
        </span>
      </div>

      <div className="mt-3 grid gap-2 xl:grid-cols-2">
        {revenueCalendarMoments.map((moment) => (
          <div
            key={moment.id}
            className="rounded-lg border border-border/50 bg-secondary/30 p-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <h4 className="text-[13px] font-black leading-snug">
                  {moment.name}
                </h4>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-emerald-300">
                  {moment.season}
                </p>
              </div>
              <PillList items={moment.relevantBrands} />
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <InfoBlock label="Sponsorship ideas" items={moment.sponsorshipIdeas} />
              <InfoBlock label="Event ideas" items={moment.eventIdeas} />
              <InfoBlock label="Content ideas" items={moment.contentIdeas} />
              <InfoBlock
                label="Ad package opportunities"
                items={moment.adPackageOpportunities}
              />
              <InfoBlock
                label="Affiliate opportunities"
                items={moment.affiliateOpportunities}
              />
              <InfoBlock
                label="Local activation opportunities"
                items={moment.localActivationOpportunities}
                icon="map"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PillList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-emerald-300/15 bg-emerald-400/[0.05] px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-100"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function InfoBlock({
  label,
  items,
  icon,
}: {
  label: string;
  items: string[];
  icon?: "map";
}) {
  const Icon = icon === "map" ? MapPinned : Lightbulb;

  return (
    <div className="rounded-md border border-border/40 bg-secondary/25 p-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="w-3 h-3 text-emerald-300" />
        {label}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-foreground/82">
        {items.join(", ")}
      </p>
    </div>
  );
}
