import { useEffect, useMemo, useState } from "react";
import type { SalesLead } from "@/lib/sales";
import { Button } from "@/components/ui/button";
import {
  executionStatuses,
  generateActionQueue,
  readExecutionActions,
  writeExecutionActions,
  type ExecutionActionStatus,
  type MaximillionExecutionAction,
} from "@/components/newsroom/sales/mockMaximillionV8Data";
import { CheckCircle2, CircleDollarSign, ClipboardCheck, Gauge, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface MaximillionActionCenterProps {
  leads: SalesLead[];
}

const statusTone: Record<ExecutionActionStatus, string> = {
  Suggested: "border-sky-300/25 bg-sky-400/10 text-sky-700 dark:text-sky-100",
  Approved: "border-emerald-300/25 bg-emerald-400/10 text-emerald-700 dark:text-emerald-100",
  Active: "border-amber-300/25 bg-amber-300/10 text-amber-700 dark:text-amber-100",
  Complete: "border-violet-300/25 bg-violet-400/10 text-violet-700 dark:text-violet-100",
  Archived: "border-border bg-slate-300/10 text-foreground",
};

const nextStatus: Record<ExecutionActionStatus, ExecutionActionStatus> = {
  Suggested: "Approved",
  Approved: "Active",
  Active: "Complete",
  Complete: "Archived",
  Archived: "Suggested",
};

export function MaximillionActionCenter({ leads }: MaximillionActionCenterProps) {
  const [actions, setActions] = useState<MaximillionExecutionAction[]>(() =>
    readExecutionActions(leads),
  );
  const [filter, setFilter] = useState<ExecutionActionStatus | "All">("All");
  const visibleActions = useMemo(
    () =>
      actions
        .filter((action) => filter === "All" || action.status === filter)
        .sort((a, b) => b.priorityScore - a.priorityScore),
    [actions, filter],
  );
  const activeImpact = useMemo(
    () =>
      actions
        .filter((action) => action.status !== "Archived")
        .slice(0, 4)
        .map((action) => action.estimatedRevenueImpact)
        .join(" + "),
    [actions],
  );

  useEffect(() => {
    writeExecutionActions(actions);
  }, [actions]);

  function moveAction(actionId: string) {
    setActions((current) =>
      current.map((action) =>
        action.id === actionId ? { ...action, status: nextStatus[action.status] } : action,
      ),
    );
    toast.success("Action status updated locally");
  }

  function resetQueue() {
    setActions(generateActionQueue(leads));
    toast.success("Action queue refreshed from local Maximillion logic");
  }

  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3 overflow-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-emerald-300">
            <ClipboardCheck className="h-4 w-4" />
            <h3 className="text-sm font-black">Maximillion Action Center</h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Converts advice into an executable local action queue. Nothing is
            sent, scheduled, or synced externally yet.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
            Operator mode
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={resetQueue}
            className="h-10 text-[11px] bg-secondary/25"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Refresh local queue
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <Metric label="Queued actions" value={`${actions.length}`} />
        <Metric label="Active / approved" value={`${actions.filter((action) => action.status === "Active" || action.status === "Approved").length}`} />
        <Metric label="Near-term impact" value={activeImpact || "$0 queued"} />
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {(["All", ...executionStatuses] as Array<ExecutionActionStatus | "All">).map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={filter === status ? "default" : "outline"}
            onClick={() => setFilter(status)}
            className="h-10 shrink-0 px-3 text-[11px]"
          >
            {status}
          </Button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 xl:grid-cols-2">
        {visibleActions.map((action) => (
          <article
            key={action.id}
            className="rounded-lg border border-border/45 bg-secondary/30 p-3 min-w-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-[13px] font-black leading-snug text-foreground">
                  {action.title}
                </h4>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {action.category} · due {action.dueDate}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-black ${statusTone[action.status]}`}
              >
                {action.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <InfoPill icon={Gauge} label="Priority" value={`${action.priorityScore}/100`} />
              <InfoPill icon={CircleDollarSign} label="Impact" value={action.estimatedRevenueImpact} />
              <InfoPill icon={CheckCircle2} label="Effort" value={action.effortEstimate} />
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-foreground/82">
              {action.rationale}
            </p>
            <div className="mt-2 rounded-md border border-emerald-300/15 bg-emerald-400/[0.07] p-2 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-50/88">
              Next: {action.nextStep}
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => moveAction(action.id)}
              className="mt-3 h-10 w-full text-[11px] bg-emerald-500 text-white hover:bg-emerald-400 sm:w-auto"
            >
              Move to {nextStatus[action.status]}
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-secondary/25 p-2.5">
      <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 truncate text-[12px] font-black text-foreground">
        {value}
      </div>
    </div>
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border/35 bg-secondary/25 p-2 min-w-0">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3 shrink-0" />
        {label}
      </div>
      <div className="mt-1 truncate text-[11px] font-black text-foreground">
        {value}
      </div>
    </div>
  );
}
