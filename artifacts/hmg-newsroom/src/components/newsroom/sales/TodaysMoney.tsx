import { dailyMoneyTasks } from "@/components/newsroom/sales/mockMaximillionV3Data";
import { AlarmClock, CircleDollarSign, ListChecks } from "lucide-react";

const priorityTone = {
  critical: "border-red-300/25 bg-red-400/10 text-red-700 dark:text-red-100",
  high: "border-amber-300/25 bg-amber-300/10 text-amber-700 dark:text-amber-100",
  medium: "border-sky-300/25 bg-sky-400/10 text-sky-700 dark:text-sky-100",
  low: "border-border bg-slate-300/10 text-foreground",
};

export function TodaysMoney() {
  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-300">
            <CircleDollarSign className="w-4 h-4" />
            <h3 className="text-sm font-black">Today&apos;s Money</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Maximillion&apos;s local daily revenue command list.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
          Proactive mock brief
        </span>
      </div>

      <div className="mt-3 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-5">
        {dailyMoneyTasks.map((task) => (
          <div
            key={task.id}
            className="min-w-[252px] snap-start rounded-lg border border-border/50 bg-secondary/30 p-3 sm:min-w-0"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={`rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                  priorityTone[task.priority]
                }`}
              >
                {task.priority}
              </span>
              <AlarmClock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </div>
            <h4 className="mt-3 text-[12px] font-black leading-snug">
              {task.title}
            </h4>
            <div className="mt-2 text-[11px] font-black text-emerald-700 dark:text-emerald-200">
              {task.estimatedRevenueImpact}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground line-clamp-2 sm:line-clamp-none">
              {task.rationale}
            </p>
            <div className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-foreground/82 line-clamp-2 sm:line-clamp-none">
              <ListChecks className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
              <span>{task.nextAction}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
