import type { SalesLead } from "@/lib/sales";
import {
  formatCurrency,
  getRevenueSnapshot,
} from "@/components/newsroom/sales/mockMaximillionData";
import {
  Banknote,
  CalendarClock,
  Crosshair,
  Flame,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

interface RevenueSnapshotProps {
  leads: SalesLead[];
}

export function RevenueSnapshot({ leads }: RevenueSnapshotProps) {
  const snapshot = getRevenueSnapshot(leads);
  const cards: Array<{
    label: string;
    value: string;
    note: string;
    icon: LucideIcon;
  }> = [
    {
      label: "Pipeline value",
      value: formatCurrency(snapshot.pipelineValue),
      note: "Open forecast",
      icon: Banknote,
    },
    {
      label: "Active leads",
      value: String(snapshot.activeLeads),
      note: "In motion",
      icon: Users,
    },
    {
      label: "Hot opportunities",
      value: String(snapshot.hotOpportunities),
      note: "High priority",
      icon: Flame,
    },
    {
      label: "Meetings due",
      value: String(snapshot.meetingsDue),
      note: "Follow-ups today",
      icon: CalendarClock,
    },
    {
      label: "Sponsorship targets",
      value: String(snapshot.sponsorshipTargets),
      note: "Mock radar",
      icon: Target,
    },
    {
      label: "This month's revenue focus",
      value: snapshot.monthFocus,
      note: "Maximillion priority",
      icon: Crosshair,
    },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
      {cards.map((card) => {
        const Icon = card.icon;
        const isFocusCard = card.label === "This month's revenue focus";
        return (
          <div
            key={card.label}
            className={`rounded-lg border border-emerald-400/15 bg-secondary/35 p-3 min-h-[96px] sm:min-h-[112px] ${
              isFocusCard ? "col-span-2 md:col-span-1" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider leading-tight text-muted-foreground">
                {card.label}
              </span>
              <span className="w-7 h-7 rounded-md bg-emerald-400/10 text-emerald-300 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-3 text-base sm:text-lg font-black leading-tight text-foreground break-words">
              {card.value}
            </div>
            <div className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-200/70">
              {card.note}
            </div>
          </div>
        );
      })}
    </section>
  );
}
