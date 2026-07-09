import type { SalesLead } from "@/lib/sales";
import { buildFounderWarRoom } from "@/components/newsroom/sales/mockMaximillionV8Data";
import {
  AlertTriangle,
  BatteryCharging,
  CalendarClock,
  CircleDollarSign,
  Flag,
  ShieldCheck,
  Target,
} from "lucide-react";

interface MaximillionFounderWarRoomProps {
  leads: SalesLead[];
}

export function MaximillionFounderWarRoom({ leads }: MaximillionFounderWarRoomProps) {
  const warRoom = buildFounderWarRoom(leads);

  return (
    <section className="rounded-lg border border-amber-300/20 bg-secondary/35 p-3 overflow-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-100">
            <ShieldCheck className="h-4 w-4" />
            <h3 className="text-sm font-black">Maximillion Founder War Room</h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Daily founder command room for priorities, money, follow-ups,
            alerts, energy, and roadblocks. Local readout only.
          </p>
        </div>
        <span className="rounded-full border border-amber-200/20 bg-amber-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-100">
          Energy: {warRoom.founderEnergyLevel}
        </span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <WarRoomBlock
          title="Today's priorities"
          icon={Target}
          tone="emerald"
          rows={warRoom.todayPriorities}
        />
        <WarRoomBlock
          title="Money opportunities"
          icon={CircleDollarSign}
          tone="emerald"
          rows={warRoom.moneyOpportunities}
        />
        <WarRoomBlock
          title="Follow-ups"
          icon={CalendarClock}
          tone="sky"
          rows={warRoom.followups}
        />
        <WarRoomBlock
          title="Meetings"
          icon={Flag}
          tone="sky"
          rows={warRoom.meetings}
        />
      </div>

      <div className="mt-3 grid gap-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="rounded-lg border border-red-300/20 bg-red-400/[0.06] p-3">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-100">
            <AlertTriangle className="h-4 w-4" />
            <h4 className="text-[13px] font-black">Revenue Alerts</h4>
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {warRoom.revenueAlerts.map((alert) => (
              <div
                key={alert}
                className="rounded-md border border-red-200/15 bg-secondary/25 p-2 text-[11px] leading-relaxed text-red-700 dark:text-red-50/84"
              >
                {alert}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-amber-300/20 bg-amber-300/[0.07] p-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-100">
            <BatteryCharging className="h-4 w-4" />
            <h4 className="text-[13px] font-black">Founder Energy</h4>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-amber-700 dark:text-amber-50/86">
            {warRoom.founderEnergyLevel} means Max should keep the day focused:
            approve one action, protect the follow-up block, and skip low-value
            motion.
          </p>
          <div className="mt-3 space-y-2">
            {warRoom.roadblocks.map((roadblock) => (
              <div
                key={roadblock}
                className="rounded-md border border-border/40 bg-secondary/25 p-2 text-[11px] leading-relaxed text-foreground/82"
              >
                {roadblock}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-emerald-300/15 bg-emerald-400/[0.07] p-3">
        <h4 className="text-[13px] font-black text-emerald-700 dark:text-emerald-100">
          Brand opportunities
        </h4>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {warRoom.brandOpportunities.map((opportunity) => (
            <div
              key={opportunity}
              className="rounded-md border border-border/40 bg-secondary/25 p-2 text-[11px] leading-relaxed text-foreground/82"
            >
              {opportunity}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WarRoomBlock({
  title,
  icon: Icon,
  tone,
  rows,
}: {
  title: string;
  icon: typeof Target;
  tone: "emerald" | "sky";
  rows: string[];
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700 dark:text-emerald-100 border-emerald-300/20 bg-emerald-400/[0.07]"
      : "text-sky-700 dark:text-sky-100 border-sky-300/20 bg-sky-400/[0.07]";
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <h4 className="text-[12px] font-black">{title}</h4>
      </div>
      <div className="mt-2 space-y-1.5">
        {rows.slice(0, 3).map((row) => (
          <div key={row} className="text-[11px] leading-relaxed text-foreground/82">
            {row}
          </div>
        ))}
      </div>
    </div>
  );
}
