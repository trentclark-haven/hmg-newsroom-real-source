/**
 * SessionRecapView — T3 Supplemental Pass
 * Today's session summary: outputs created, memory state, next actions, full archive link.
 * 100% local — reads localStorage. No fake AI, no fake sync, no fake backend.
 */

import { useMemo } from "react";
import {
  Archive,
  Brain,
  Calendar,
  CheckCircle2,
  CircleDashed,
  Database,
  ExternalLink,
  FileText,
  Layers,
  Megaphone,
  Newspaper,
  Scissors,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { View } from "./MenuOverlay";
import { buildMemoryActionSummary } from "@/lib/hmg/memory/memoryActionRouter";

function readMemoryItems(): { type: string }[] {
  try {
    const raw = window.localStorage.getItem("hmg-founder-knowledge-base-v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: { type: string }[] };
    return Array.isArray(parsed?.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

interface OutputEntry {
  id: string;
  kind: string;
  silo?: string;
  siloName?: string;
  createdAt?: number;
  prompt?: string;
}

function readOutputHistory(): OutputEntry[] {
  try {
    const raw = window.localStorage.getItem("hmg-newsroom-output-history-v2");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OutputEntry[]) : [];
  } catch {
    return [];
  }
}

function getStorageInfo(): { usedMB: number; pct: number; healthy: boolean } {
  try {
    let bytes = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      bytes += (window.localStorage.getItem(key) ?? "").length * 2;
    }
    const usedMB = bytes / 1024 / 1024;
    const pct = Math.min(100, Math.round((usedMB / 5) * 100));
    return { usedMB, pct, healthy: usedMB < 4 };
  } catch {
    return { usedMB: 0, pct: 0, healthy: true };
  }
}

const KIND_LABELS: Record<string, { label: string; icon: typeof Newspaper; color: string }> = {
  "quick": { label: "Quick Outputs", icon: Zap, color: "text-sky-400" },
  "pack": { label: "Content Packs", icon: Layers, color: "text-violet-400" },
  "specialist": { label: "Specialist Outputs", icon: Brain, color: "text-violet-400" },
  "wordpress-draft": { label: "WP Drafts", icon: FileText, color: "text-amber-400" },
  "cut-note": { label: "Cut Notes", icon: Scissors, color: "text-red-400" },
  "social-video-draft": { label: "Social Video Drafts", icon: Megaphone, color: "text-pink-400" },
  "caption-plan": { label: "Caption Plans", icon: Megaphone, color: "text-pink-400" },
  "thumbnail-brief": { label: "Thumbnail Briefs", icon: Newspaper, color: "text-orange-400" },
  "edit-brief": { label: "Edit Briefs", icon: Scissors, color: "text-red-400" },
};

export function SessionRecapView({
  onNavigate,
}: {
  onNavigate?: (v: View) => void;
} = {}) {
  const memoryItems = useMemo(() => readMemoryItems(), []);
  const allOutputs = useMemo(() => readOutputHistory(), []);
  const storage = useMemo(() => getStorageInfo(), []);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const todayOutputs = useMemo(
    () => allOutputs.filter((e) => (e.createdAt ?? 0) >= todayStart),
    [allOutputs, todayStart],
  );

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const kindBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of todayOutputs) {
      counts[e.kind] = (counts[e.kind] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [todayOutputs]);

  const memorySummary = useMemo(
    () => buildMemoryActionSummary(memoryItems),
    [memoryItems],
  );

  const MEMORY_FUEL_TYPES = [
    { label: "Founder Voice", types: ["founder-voice"] },
    { label: "Brand Rules", types: ["brand-rule"] },
    { label: "Editorial Rules", types: ["editorial-rule"] },
    { label: "WordPress Rules", types: ["wordpress-rule"] },
    { label: "Max Revenue", types: ["revenue-max-note", "sales-note"] },
    { label: "Relationships", types: ["relationship-note", "contact-csv"] },
  ];

  const fuelRows = MEMORY_FUEL_TYPES.map(({ label, types }) => ({
    label,
    loaded: memoryItems.some((i) => types.includes(i.type)),
  }));

  const fuelLoaded = fuelRows.filter((r) => r.loaded).length;

  const nextActions = useMemo(() => {
    const actions: { label: string; hint: string; view: View; priority: "critical" | "high" | "normal" }[] = [];

    if (memoryItems.length === 0) {
      actions.push({
        label: "Load Founder Knowledge Base",
        hint: "Founder Voice, brand rules, and Max notes are all missing.",
        view: "founderkb",
        priority: "critical",
      });
    }
    if (!memoryItems.some((i) => i.type === "founder-voice")) {
      actions.push({
        label: "Add Founder Voice",
        hint: "Editorial Desk, Editorial Analysis, and Social Factory all need voice context.",
        view: "founderkb",
        priority: "critical",
      });
    }
    if (!memoryItems.some((i) => i.type === "wordpress-rule")) {
      actions.push({
        label: "Add WordPress Rules",
        hint: "Draft export uses fallback rules without this.",
        view: "founderkb",
        priority: "high",
      });
    }
    if (!memoryItems.some((i) => ["revenue-max-note", "sales-note"].includes(i.type))) {
      actions.push({
        label: "Add Max Revenue Notes",
        hint: "Next Moves engine has no revenue context.",
        view: "founderkb",
        priority: "high",
      });
    }
    if (allOutputs.length === 0) {
      actions.push({
        label: "Run Editorial Analysis",
        hint: "No saved outputs yet — generate your first content pack.",
        view: "artboteditorial",
        priority: "high",
      });
    }
    if (allOutputs.length > 0 && !allOutputs.some((e) => e.kind === "wordpress-draft")) {
      actions.push({
        label: "Build a WordPress Draft",
        hint: "You have outputs but no WP drafts. Use Editorial Desk or WP Draft History.",
        view: "wp-draft-history",
        priority: "normal",
      });
    }
    if (allOutputs.length > 0) {
      actions.push({
        label: "Open Command Center",
        hint: "Review next moves, brand mission, and today's queue.",
        view: "commandcenter",
        priority: "normal",
      });
    }

    return actions.slice(0, 5);
  }, [memoryItems, allOutputs]);

  const priorityColor: Record<string, string> = {
    critical: "text-rose-400 border-rose-500/30 bg-rose-500/[0.06]",
    high: "text-amber-400 border-amber-500/30 bg-amber-500/[0.06]",
    normal: "text-sky-400 border-sky-500/30 bg-sky-500/[0.06]",
  };

  const priorityDot: Record<string, string> = {
    critical: "bg-rose-400",
    high: "bg-amber-400",
    normal: "bg-sky-400",
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 lg:px-8 py-5 gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Archive className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Session Recap</h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              {todayLabel} · Local · No cloud sync
            </p>
          </div>
        </div>
      </div>

      {/* Honest Notice */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/[0.06] px-4 py-3 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-indigo-200/80 leading-relaxed">
          <strong className="text-indigo-300">Honest recap only.</strong> Everything shown is read directly from localStorage — no cloud, no sync, no fabricated stats. Only outputs you generated in this browser session are counted.
        </p>
      </div>

      {/* Today's Counters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400 px-2">
            01 — Today's Session
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Outputs Today", value: String(todayOutputs.length), color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20", icon: Zap },
            { label: "Total Saved", value: String(allOutputs.length), color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", icon: Layers },
            { label: "Memory Slots", value: `${fuelLoaded}/6`, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: Database },
            { label: "Storage", value: `${storage.usedMB.toFixed(1)}MB`, color: storage.healthy ? "text-emerald-400" : "text-amber-400", bg: storage.healthy ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20", icon: Brain },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className={`rounded-xl border p-3.5 ${bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className={`text-2xl font-black ${color}`}>{value}</span>
              </div>
              <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* Today's output breakdown */}
        {todayOutputs.length > 0 ? (
          <div className="rounded-xl border border-border/40 bg-card/40 p-4 flex flex-col gap-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-1">Breakdown by type</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {kindBreakdown.map(([kind, count]) => {
                const cfg = KIND_LABELS[kind] ?? { label: kind, icon: FileText, color: "text-muted-foreground" };
                const Icon = cfg.icon;
                return (
                  <div key={kind} className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/30 px-3 py-2">
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${cfg.color}`} />
                    <span className="text-[12px] font-semibold flex-1 min-w-0 truncate">{cfg.label}</span>
                    <span className={`text-[13px] font-black ${cfg.color}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/50 bg-card/30 px-4 py-4 text-center">
            <Calendar className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-[12px] text-muted-foreground font-semibold">No outputs generated today</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              Run Editorial Analysis, WebEdit, or Social Factory to start building outputs.
            </p>
          </div>
        )}
      </div>

      {/* Memory Fuel State */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-400 px-2">
            02 — Memory Fuel
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {fuelRows.map(({ label, loaded }) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${
                loaded
                  ? "border-sky-500/30 bg-sky-500/[0.06]"
                  : "border-border/40 bg-card/30"
              }`}
            >
              {loaded ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              ) : (
                <CircleDashed className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
              )}
              <span className={`text-[12px] font-semibold flex-1 ${loaded ? "text-sky-200/80" : "text-muted-foreground"}`}>
                {label}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${loaded ? "text-sky-400" : "text-muted-foreground/50"}`}>
                {loaded ? "Loaded" : "Empty"}
              </span>
            </div>
          ))}
        </div>

        {memorySummary.missingImpact.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 flex flex-col gap-1.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-0.5">Memory gaps affecting output quality</p>
            {memorySummary.missingImpact.map((impact) => (
              <div key={impact} className="flex items-start gap-2 text-[12px] text-amber-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                {impact}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next Actions */}
      {nextActions.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/40" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 px-2">
              03 — Recommended Next Actions
            </span>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="flex flex-col gap-2">
            {nextActions.map((action, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-3 flex items-center gap-3 ${priorityColor[action.priority]}`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot[action.priority]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold leading-tight">{action.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{action.hint}</p>
                </div>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate(action.view)}
                    className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-bold hover:opacity-80 transition-opacity"
                  >
                    Go
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Nav */}
      {onNavigate && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/40" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400 px-2">
              04 — Go to a Desk
            </span>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { view: "commandcenter" as const, label: "Command Center", icon: Layers, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/15" },
              { view: "founderkb" as const, label: "Load Memory", icon: Database, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/15" },
              { view: "artboteditorial" as const, label: "ARTBOT Editorial", icon: Newspaper, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/15" },
              { view: "medialibrary" as const, label: "Output History", icon: Archive, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/15" },
              { view: "wp-draft-history" as const, label: "WP Draft History", icon: FileText, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15" },
              { view: "socialfactory" as const, label: "Social Factory", icon: Megaphone, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/15" },
            ].map(({ view, label, icon: Icon, color, bg }) => (
              <button
                key={view}
                type="button"
                onClick={() => onNavigate(view)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${bg}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                <span className="text-[12.5px] font-bold flex-1 min-w-0 truncate">{label}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground/40 flex-shrink-0 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 justify-center text-[11px] text-muted-foreground/50 py-2">
        <Archive className="w-3.5 h-3.5" />
        Session Recap · Local-first · No cloud sync · HMG Newsroom
      </div>
    </div>
  );
}
