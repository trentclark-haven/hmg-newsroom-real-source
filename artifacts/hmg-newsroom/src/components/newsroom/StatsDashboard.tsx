import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { verticals } from "@/lib/mock-data";
import {
  aggregateBySilo,
  startOfDay,
  startOfWeek,
  useUsageStats,
} from "@/lib/useUsageStats";
import { BarChart3, Send, Sparkles, Trash2, Zap } from "lucide-react";

interface StatsDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Range = "today" | "week" | "all";

export function StatsDashboard({ open, onOpenChange }: StatsDashboardProps) {
  const { events, clearAll } = useUsageStats();
  const [range, setRange] = useState<Range>("week");

  const sinceTs = useMemo(() => {
    if (range === "today") return startOfDay();
    if (range === "week") return startOfWeek();
    return 0;
  }, [range]);

  const siloIds = verticals.map((v) => v.id);
  const stats = useMemo(
    () => aggregateBySilo(events, sinceTs, siloIds),
    [events, sinceTs, siloIds],
  );

  const totals = stats.reduce(
    (acc, s) => ({
      generated: acc.generated + s.generated,
      drafts: acc.drafts + s.drafts,
      published: acc.published + s.published,
    }),
    { generated: 0, drafts: 0, published: 0 },
  );

  const maxTotal = Math.max(1, ...stats.map((s) => s.total));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 bg-background border-border/40 flex flex-col"
      >
        <SheetHeader className="px-4 py-3 border-b border-border/40 space-y-0">
          <SheetTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Editorial Desk Stats
          </SheetTitle>
          <SheetDescription className="text-xs">
            How many packages each Haven is creating.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pt-3 pb-2 flex items-center gap-1.5">
          {(["today", "week", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "today" ? "Today" : r === "week" ? "This Week" : "All Time"}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="px-4 grid grid-cols-3 gap-2">
          <SummaryCard
            label="Created"
            value={totals.generated}
            icon={<Sparkles className="w-3.5 h-3.5" />}
            tone="text-blue-400"
          />
          <SummaryCard
            label="Drafts"
            value={totals.drafts}
            icon={<Send className="w-3.5 h-3.5" />}
            tone="text-amber-400"
          />
          <SummaryCard
            label="Manual"
            value={totals.published}
            icon={<Zap className="w-3.5 h-3.5" />}
            tone="text-emerald-400"
          />
        </div>

        {/* Per-silo breakdown */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-1">
            By Haven
          </div>
          {stats.map((s) => {
            const v = verticals.find((x) => x.id === s.silo)!;
            const widthPct = Math.round((s.total / maxTotal) * 100);
            return (
              <div
                key={s.silo}
                className="rounded-lg border border-border/50 bg-secondary/20 p-2.5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-6 rounded-full"
                      style={{ background: v.accentBg }}
                    />
                    <span className="text-sm font-semibold">{v.name}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {s.total}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${widthPct}%`,
                      background: v.accentBg,
                      opacity: s.total > 0 ? 1 : 0,
                    }}
                  />
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/90 font-mono pt-0.5">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    {s.generated} gen
                  </span>
                  <span className="flex items-center gap-1">
                    <Send className="w-2.5 h-2.5" />
                    {s.drafts} draft
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400/80">
                    <Zap className="w-2.5 h-2.5" />
                    {s.published} live
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-border/40 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/70">
            Stats stored on this device.
          </span>
          {events.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Clear all newsroom stats?")) clearAll();
              }}
              className="text-[11px] text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-secondary/30 p-2.5 space-y-0.5">
      <div className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${tone}`}>
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
