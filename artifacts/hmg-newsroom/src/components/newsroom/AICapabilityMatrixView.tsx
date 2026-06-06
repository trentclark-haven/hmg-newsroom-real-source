import { useMemo, useState } from "react";
import {
  Brain,
  CheckCircle2,
  CircleDashed,
  Cpu,
  Database,
  Lock,
  ServerCog,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  AI_PROVIDERS,
  AI_TASKS,
  getCapabilitySummary,
  type AITaskEntry,
  type ProviderStatus,
} from "@/lib/aiCapabilityRegistry";

const STATUS_CONFIG: Record<
  ProviderStatus,
  { label: string; color: string; icon: typeof CheckCircle2; badge: string }
> = {
  "local-ready": {
    label: "Local Brain Active",
    color: "text-emerald-400",
    icon: Zap,
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  "memory-backed": {
    label: "Memory-Backed",
    color: "text-sky-400",
    icon: Database,
    badge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
  "provider-needed": {
    label: "Model Hook Pending",
    color: "text-amber-400",
    icon: Cpu,
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  "backend-needed": {
    label: "Backend Route Pending",
    color: "text-orange-400",
    icon: ServerCog,
    badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  blocked: {
    label: "Human Review Required",
    color: "text-rose-400",
    icon: Lock,
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
  "future-hook": {
    label: "Future Model Connection",
    color: "text-zinc-400",
    icon: CircleDashed,
    badge: "bg-zinc-700/40 text-zinc-400 border-zinc-600/30",
  },
};

const CATEGORY_LABELS: Record<AITaskEntry["category"], string> = {
  editorial: "Editorial",
  revenue: "Revenue / Max",
  visual: "Visual / Media",
  distribution: "Distribution",
  memory: "Memory",
  wordpress: "WordPress",
};

const DESK_COLORS: Record<AITaskEntry["desk"], string> = {
  ARTBOT: "#A855F7",
  Max: "#F59E0B",
  WebArt: "#3B82F6",
  WebEdit: "#EF4444",
  Social: "#EC4899",
  WordPress: "#0EA5E9",
  System: "#6B7280",
};

function TaskCard({ task }: { task: AITaskEntry }) {
  const cfg = STATUS_CONFIG[task.status];
  const Icon = cfg.icon;
  const deskColor = DESK_COLORS[task.desk];

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-3.5 flex flex-col gap-2 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
            style={{ background: deskColor }}
          />
          <span className="text-[13px] font-semibold text-foreground leading-snug">
            {task.name}
          </span>
        </div>
        <span
          className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.badge} flex items-center gap-1`}
        >
          <Icon className="w-3 h-3" />
          {cfg.label}
        </span>
      </div>
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        {task.description}
      </p>
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
          {task.desk}
        </span>
        <span className="text-[10.5px] italic text-muted-foreground/70">
          {task.honestLabel}
        </span>
      </div>
    </div>
  );
}

export function AICapabilityMatrixView() {
  const [filterStatus, setFilterStatus] = useState<ProviderStatus | "all">("all");
  const [filterDesk, setFilterDesk] = useState<AITaskEntry["desk"] | "all">("all");

  const summary = useMemo(() => getCapabilitySummary(), []);

  const filteredTasks = useMemo(() => {
    return AI_TASKS.filter((t) => {
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterDesk !== "all" && t.desk !== filterDesk) return false;
      return true;
    });
  }, [filterStatus, filterDesk]);

  const tasksByCategory = useMemo(() => {
    const grouped: Record<string, AITaskEntry[]> = {};
    for (const task of filteredTasks) {
      if (!grouped[task.category]) grouped[task.category] = [];
      grouped[task.category].push(task);
    }
    return grouped;
  }, [filteredTasks]);

  const activeProviders = AI_PROVIDERS.filter((p) => p.status === "active");
  const stagedProviders = AI_PROVIDERS.filter((p) => p.status === "staged");

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 lg:px-8 py-5 gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">Haven AI Engine</h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Full task registry · Honest status · No fake providers · Local-first
            </p>
          </div>
        </div>
      </div>

      {/* Honest Disclaimer */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-amber-200/80 leading-relaxed">
          <strong className="text-amber-300">Haven AI Engine is honest by design.</strong> Every status below reflects the actual current state. "Local Brain Active" means deterministic / memory-backed — no external model. "Model Hook Pending" means an API key and backend proxy are required before that task does real AI work.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Local Brain Active", value: summary.local, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Model Hook Pending", value: summary.needsProvider, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Backend Route Pending", value: summary.needsBackend, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
          { label: "Future Model Connection", value: summary.future, color: "text-zinc-400", bg: "bg-zinc-700/20 border-zinc-600/20" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3.5 ${s.bg}`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Provider Registry */}
      <div className="rounded-xl border border-border/60 bg-card/40 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ServerCog className="w-4 h-4 text-muted-foreground" />
          <span className="text-[12px] font-black uppercase tracking-wider">Haven Engine Registry</span>
        </div>
        <div className="space-y-2">
          {activeProviders.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-[13px] font-semibold">{p.name}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider flex-shrink-0">
                Active
              </span>
            </div>
          ))}
          {stagedProviders.map((p) => (
            <div key={p.id} className="flex items-start gap-2 py-1.5">
              <CircleDashed className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold">{p.name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold uppercase tracking-wider flex-shrink-0">
                    Staged
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{p.honest}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(["all", "local-ready", "memory-backed", "provider-needed", "backend-needed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
                filterStatus === s
                  ? "bg-foreground text-background border-transparent"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All Statuses" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "ARTBOT", "Max", "WebArt", "WebEdit", "Social", "WordPress", "System"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setFilterDesk(d)}
              className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
                filterDesk === d
                  ? "bg-foreground text-background border-transparent"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {d === "all" ? "All Desks" : d}
            </button>
          ))}
        </div>
      </div>

      {/* Task Matrix by Category */}
      {Object.entries(tasksByCategory).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No tasks match the current filters.
        </div>
      ) : (
        Object.entries(tasksByCategory).map(([category, tasks]) => (
          <div key={category} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">
                {CATEGORY_LABELS[category as AITaskEntry["category"]] ?? category}
              </span>
              <div className="h-px flex-1 bg-border/40" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Footer */}
      <div className="text-center text-[11px] text-muted-foreground/50 py-2">
        Haven AI Engine · Full Task Registry · Local-first · No fake providers · HMG Newsroom
      </div>
    </div>
  );
}
