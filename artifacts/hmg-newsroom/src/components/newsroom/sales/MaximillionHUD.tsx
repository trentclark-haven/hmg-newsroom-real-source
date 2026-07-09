import type { SalesLead } from "@/lib/sales";
import {
  buildHudMetrics,
  type MaximillionPresenceState,
} from "@/components/newsroom/sales/mockMaximillionV7Data";
import {
  Activity,
  Briefcase,
  CalendarClock,
  CircleDollarSign,
  Crosshair,
  Network,
  RadioTower,
  Users,
} from "lucide-react";

interface MaximillionHUDProps {
  leads: SalesLead[];
  presence: MaximillionPresenceState;
}

export function MaximillionHUD({ leads, presence }: MaximillionHUDProps) {
  const metrics = buildHudMetrics(leads.length);
  const cards = [
    {
      label: "Opportunities",
      value: String(metrics.revenueOpportunityCount),
      icon: CircleDollarSign,
    },
    { label: "Relationships", value: String(metrics.relationshipCount), icon: Network },
    { label: "Leads", value: String(metrics.leadCount), icon: Briefcase },
    { label: "Meetings", value: String(metrics.meetingCount), icon: CalendarClock },
    { label: "Missions", value: String(metrics.missionCount), icon: RadioTower },
  ];

  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3 overflow-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-emerald-300">
            <Activity className="h-4 w-4" />
            <h3 className="text-sm font-black">Executive HUD</h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {metrics.todaysFocus} · {metrics.estimatedOpportunityRange}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
            {metrics.priorityLevel}
          </span>
          <span className="rounded-full border border-sky-200/20 bg-sky-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-100">
            {presence.label}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-md border border-border/40 bg-secondary/25 p-2.5 min-w-0"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </span>
                <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
              </div>
              <div className="mt-2 text-lg font-black leading-none text-foreground">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-md border border-sky-200/15 bg-sky-300/[0.06] p-2.5">
        <div className="flex items-start gap-2">
          <Crosshair className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-700 dark:text-sky-100" />
          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-100">
              Mood / status
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-sky-700 dark:text-sky-50/82">
              {presence.status} · {presence.reason}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
