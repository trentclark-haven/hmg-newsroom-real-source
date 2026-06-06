import { eventRevenuePlays } from "@/components/newsroom/sales/mockMaximillionData";
import { CalendarDays, CircleDollarSign } from "lucide-react";

export function EventRevenueCalendar() {
  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-emerald-300">
          <CalendarDays className="w-4 h-4" />
          <h3 className="text-sm font-black">Event Revenue Calendar</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Mock money moments
        </span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {eventRevenuePlays.map((event) => (
          <div
            key={event.id}
            className="rounded-lg border border-border/50 bg-secondary/30 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-[12px] font-black leading-snug">
                  {event.eventName}
                </h4>
                <p className="text-[10px] uppercase tracking-wider text-emerald-300 mt-1">
                  {event.seasonOrDate}
                </p>
              </div>
              <div className="rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-100 shrink-0">
                {event.estimatedRevenueRange}
              </div>
            </div>

            <PillList items={event.relevantBrands} />

            <div className="mt-2 space-y-2">
              <InfoBlock label="Sponsor targets" items={event.sponsorTargets} />
              <InfoBlock label="Revenue plays" items={event.activationIdeas} />
            </div>

            <div className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-foreground/82">
              <CircleDollarSign className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
              <span>{event.nextAction}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PillList({ items }: { items: string[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
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

function InfoBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-md border border-border/45 bg-secondary/25 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-foreground/82">
        {items.join(", ")}
      </p>
    </div>
  );
}
