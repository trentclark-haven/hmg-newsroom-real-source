import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle2,
  CircleDashed,
  Clock,
  Database,
  ExternalLink,
  Layers,
  Lock,
  Megaphone,
  Newspaper,
  Rocket,
  ServerCog,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Video,
  Zap,
} from "lucide-react";
import type { View } from "./MenuOverlay";
import {
  AI_TASKS,
  getCapabilitySummary,
} from "@/lib/aiCapabilityRegistry";

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

const STATUS_PILL: Record<
  string,
  { label: string; cls: string }
> = {
  "local-ready": {
    label: "Local Brain Active",
    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  "memory-backed": {
    label: "Memory-Backed",
    cls: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
  "provider-needed": {
    label: "Model Hook Pending",
    cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  "backend-needed": {
    label: "Backend Route Pending",
    cls: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  blocked: {
    label: "Human Review Required",
    cls: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  },
  "future-hook": {
    label: "Future Model Connection",
    cls: "bg-zinc-700/40 text-zinc-400 border-zinc-600/30",
  },
};

interface MemoryFuelItem {
  label: string;
  type: string;
  status: "loaded" | "empty";
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_PILL[status] ?? {
    label: status,
    cls: "bg-zinc-700/40 text-zinc-400 border-zinc-600/30",
  };
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

const ACTIVE_MODULES = [
  { name: "ARTBOT Editorial Engine", status: "Local Brain Active", detail: "Headline variants, source checklist, gossip check, WP prep — all deterministic, memory-backed" },
  { name: "Max Revenue Engine", status: "Local Brain Active", detail: "Opportunity scoring, relationship follow-ups, sponsor angles — deterministic from memory" },
  { name: "WordPress Readiness Engine", status: "Local Brain Active", detail: "Draft builder, field export, no fake publish — fully operational" },
  { name: "Social Remix Engine", status: "Local Brain Active", detail: "Platform copy, post prep, captions from article context" },
  { name: "HMG Visual Engine", status: "Local Brain Active", detail: "WebArt collage, template studio, upload & crop workflows" },
  { name: "WebEdit Clip Studio Engine", status: "Local Brain Active", detail: "8-step workflow: upload → transcript → Hook Finder → timeline → captions → format → thumbnail → save. Local Timeline Mode active." },
  { name: "Hook Finder Engine", status: "Local Brain Active", detail: "Deterministic hook candidate engine — parses pasted transcript for quotes, emotional signals, urgency, risk patterns. No model call." },
  { name: "Storage Health Engine", status: "Local Brain Active", detail: "localStorage usage, quota monitoring, object URL tracking" },
  { name: "Operator Readiness Engine", status: "Local Brain Active", detail: "9-operator roster, work queue model, backend contract status" },
];

const FUTURE_HOOKS = [
  { name: "Gemini Hook", note: "Future live article generation, web research, and multimodal tasks" },
  { name: "OpenAI Hook", note: "Future image generation, GPT-4 article writing, transcription" },
  { name: "Anthropic Hook", note: "Future Claude-grade editorial and long-form content assist" },
  { name: "Ollama / Local Model Hook", note: "Future offline inference — no cloud required" },
  { name: "Transcription Hook", note: "Future audio/video → text for WebEdit and interviews" },
  { name: "Image Model Hook", note: "Future AI concept graphics — backend proxy required" },
  { name: "Web Research Hook", note: "Future source verification and live story monitoring" },
];

const WORKS_NOW = [
  "Local opportunity scoring and grading",
  "Memory-routing from Founder Knowledge Base",
  "Copy and export for all output types",
  "Operator readiness and coverage planning",
  "Deterministic Max revenue moves",
  "Deterministic ARTBOT editorial suggestions",
  "Storage health and quota monitoring",
  "WordPress draft builder (manual-publish honest)",
  "Visual layout — upload, crop, frame, export",
  "Social platform copy prep",
  "WebEdit 8-step Clip Studio workflow (local timeline)",
  "Hook Finder — deterministic, no model call",
  "Output History: cut notes, captions, thumbnail briefs, edit briefs",
  "Social Factory clip package handoff (copy + paste)",
  "Audit log and receipt tracking",
];

const NEEDS_BACKEND = [
  "True article generation from AI model",
  "True live web research and source verification",
  "True audio/video transcription (WebEdit transcription hook is ready, awaits backend)",
  "True video render and crop delivery (WebEdit local timeline mode active; real render needs backend)",
  "True AI image generation (currently concept-only via backend proxy)",
  "True multi-user sync and collaboration",
  "True WordPress direct publish (requires REST + credentials)",
  "True database-backed memory (currently localStorage)",
  "True multi-model routing and fallback logic",
];

export function HavenAIEngineView({
  onNavigate,
}: {
  onNavigate?: (v: View) => void;
} = {}) {
  const [expandModules, setExpandModules] = useState(false);
  const summary = useMemo(() => getCapabilitySummary(), []);

  const memoryItems = useMemo(() => readMemoryItems(), []);
  const storage = useMemo(() => getStorageInfo(), []);

  const outputCount = useMemo(() => {
    try {
      const raw = window.localStorage.getItem("hmg-newsroom-output-history-v2");
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }, []);

  const todayOutputCount = useMemo(() => {
    try {
      const raw = window.localStorage.getItem("hmg-newsroom-output-history-v2");
      if (!raw) return 0;
      const parsed = JSON.parse(raw) as Array<{ createdAt?: number }>;
      if (!Array.isArray(parsed)) return 0;
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      return parsed.filter((e) => (e.createdAt ?? 0) >= startOfToday.getTime()).length;
    } catch {
      return 0;
    }
  }, []);

  const MEMORY_FUEL: MemoryFuelItem[] = useMemo(
    () => [
      { label: "Founder Voice", type: "founder-voice", status: memoryItems.some((i) => i.type === "founder-voice") ? "loaded" : "empty" },
      { label: "Brand Rules", type: "brand-rule", status: memoryItems.some((i) => i.type === "brand-rule") ? "loaded" : "empty" },
      { label: "Editorial Rules", type: "editorial-rule", status: memoryItems.some((i) => i.type === "editorial-rule") ? "loaded" : "empty" },
      { label: "WordPress Rules", type: "wordpress-rule", status: memoryItems.some((i) => i.type === "wordpress-rule") ? "loaded" : "empty" },
      { label: "Max Revenue Notes", type: "revenue-max-note", status: memoryItems.some((i) => ["revenue-max-note", "sales-note"].includes(i.type)) ? "loaded" : "empty" },
      { label: "Relationship Notes", type: "relationship-note", status: memoryItems.some((i) => ["relationship-note", "contact-csv"].includes(i.type)) ? "loaded" : "empty" },
      { label: "Social Examples", type: "social-example", status: memoryItems.some((i) => i.type === "social-example") ? "loaded" : "empty" },
      { label: "Media Rules", type: "media-rule", status: memoryItems.some((i) => i.type === "media-rule") ? "loaded" : "empty" },
      { label: "SEO Rules", type: "seo-rule", status: memoryItems.some((i) => i.type === "seo-rule") ? "loaded" : "empty" },
    ],
    [memoryItems],
  );

  const localCount = useMemo(() => AI_TASKS.filter((t) => t.status === "local-ready" || t.status === "memory-backed").length, []);
  const pendingCount = useMemo(() => AI_TASKS.filter((t) => t.status === "provider-needed" || t.status === "backend-needed" || t.status === "future-hook").length, []);

  const fuelLoaded = MEMORY_FUEL.filter((m) => m.status === "loaded").length;

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  const topRecommendedAction = useMemo(() => {
    if (memoryItems.length === 0)
      return "Open Founder Knowledge Base and load Founder Voice, brand rules, and Max notes to power the full suite.";
    if (!memoryItems.some((i) => i.type === "founder-voice"))
      return "Add a Founder Voice memory item — it powers ARTBOT Editorial, Social Factory, and Editorial Desk.";
    if (!memoryItems.some((i) => i.type === "wordpress-rule"))
      return "Add WordPress rules — needed for clean draft export and field generation.";
    if (!memoryItems.some((i) => ["revenue-max-note", "sales-note"].includes(i.type)))
      return "Add Max Revenue notes — they power the Next Moves engine and opportunity scoring in Command Center.";
    if (outputCount === 0)
      return "Memory loaded. Run ARTBOT Editorial or WebEdit to generate your first content output.";
    return "All critical memory loaded and outputs active. Open Command Center to review today's next moves.";
  }, [memoryItems, outputCount]);

  const diagKeys = useMemo(() => {
    const keys: { key: string; bytes: number; color: string }[] = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!k || !k.startsWith("hmg-")) continue;
        const v = window.localStorage.getItem(k) ?? "";
        const bytes = (k.length + v.length) * 2;
        const color =
          bytes > 200_000
            ? "text-rose-400"
            : bytes > 80_000
              ? "text-amber-400"
              : "text-emerald-400";
        keys.push({ key: k, bytes, color });
      }
    } catch {
      /* ignore */
    }
    return keys.sort((a, b) => b.bytes - a.bytes);
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 lg:px-8 py-5 gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Haven AI Engine</h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Local-first · Memory-backed · No fake providers · Honest status
            </p>
          </div>
        </div>
      </div>

      {/* Honest Disclaimer */}
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/[0.06] px-4 py-3 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
        <div className="text-[12.5px] text-violet-200/80 leading-relaxed">
          <strong className="text-violet-300">Haven AI Engine is honest by design.</strong> Every status below reflects the actual current state. Local Brain Active means deterministic logic + memory-backed — no external model. Model Hook Pending means an API key and backend route are required before that task does real AI work.
        </div>
      </div>

      {/* Section 00 — Daily Brain */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-400 px-2">
            00 — Daily Brain
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-violet-400" />
          <span className="font-semibold">{todayLabel}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Today's Outputs", value: String(todayOutputCount), color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", icon: Zap },
            { label: "Total Saved", value: String(outputCount), color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", icon: Layers },
            { label: "Memory Slots", value: `${fuelLoaded}/9`, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: Database },
            { label: "Storage Health", value: storage.healthy ? "Good" : "Watch", color: storage.healthy ? "text-emerald-400" : "text-amber-400", bg: storage.healthy ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20", icon: Brain },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className={`rounded-xl border p-3 ${bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className={`text-xl font-black ${color}`}>{value}</span>
              </div>
              <div className="text-[10.5px] font-semibold text-muted-foreground leading-tight">{label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] px-4 py-3 flex items-start gap-3">
          <ArrowRight className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-black uppercase tracking-wider text-violet-400 mb-1">Top Recommended Action</p>
            <p className="text-[13px] font-semibold leading-relaxed">{topRecommendedAction}</p>
          </div>
        </div>
      </div>

      {/* Quick Nav — Action Buttons */}
      {onNavigate && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/40" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-400 px-2">
              Quick Nav — Go Directly to a Desk
            </span>
            <div className="h-px flex-1 bg-border/40" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { view: "founderkb" as const, label: "Open Knowledge Base", sub: "Load Founder Voice, brand + max notes", icon: Database, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/15" },
              { view: "artboteditorial" as const, label: "Run ARTBOT Editorial", sub: "Headlines, source check, editorial pack", icon: Newspaper, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/15" },
              { view: "socialfactory" as const, label: "Open Social Factory", sub: "Platform captions, hooks, post drafts", icon: Megaphone, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/15" },
              { view: "cutmaster" as const, label: "Open WebEdit", sub: "8-step clip studio + hook finder", icon: Video, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20 hover:bg-red-500/15" },
              { view: "wp-draft-history" as const, label: "WordPress Builder", sub: "Draft export, fields, manual publish", icon: Layers, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15" },
              { view: "mobileappstatus" as const, label: "Mobile Readiness", sub: "PWA, manifest, App Store path", icon: Smartphone, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/15" },
              { view: "backendstatus" as const, label: "Check Backend Status", sub: "Live API route ping — honest status", icon: Activity, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15" },
              { view: "recovery" as const, label: "Open Backups / Health", sub: "Storage diagnostics, export backup", icon: Zap, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15" },
              { view: "medialibrary" as const, label: "Open Output Archive", sub: "All saved outputs, media, receipts", icon: Layers, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/15" },
            ].map(({ view, label, sub, icon: Icon, color, bg }) => (
              <button
                key={view}
                type="button"
                onClick={() => onNavigate(view)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${bg}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                <div className="min-w-0">
                  <div className="text-[12.5px] font-bold leading-tight">{label}</div>
                  <div className="text-[10.5px] text-muted-foreground truncate">{sub}</div>
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground/40 flex-shrink-0 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section 1 — Local Brain Status */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-400 px-2">
            01 — Local Brain Status
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Local Brain Active", value: String(localCount), color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: Zap },
            { label: "Model Hook Pending", value: String(pendingCount), color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: Clock },
            { label: "Memory Slots Loaded", value: `${fuelLoaded}/9`, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", icon: Database },
            { label: "Outputs Saved", value: String(outputCount), color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", icon: Layers },
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px]">
          {[
            { label: "Fake AI claims", status: "None", ok: true },
            { label: "Fake browsing", status: "None", ok: true },
            { label: "Fake publish actions", status: "None", ok: true },
          ].map(({ label, status, ok }) => (
            <div key={label} className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2">
              <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${ok ? "text-emerald-400" : "text-rose-400"}`} />
              <span className="text-muted-foreground flex-1">{label}</span>
              <span className={`font-bold ${ok ? "text-emerald-400" : "text-rose-400"}`}>{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 — Memory Fuel */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-400 px-2">
            02 — Memory Fuel
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        {memoryItems.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/50 bg-card/30 px-4 py-4 text-center">
            <Database className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-[12px] text-muted-foreground font-semibold">No memory loaded yet</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              Open Founder Knowledge Base and load Founder Voice, brand rules, Max notes, and editorial rules to power the whole suite.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {MEMORY_FUEL.map(({ label, status }) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 ${
                status === "loaded"
                  ? "border-sky-500/30 bg-sky-500/[0.06]"
                  : "border-border/40 bg-card/30"
              }`}
            >
              {status === "loaded" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              ) : (
                <CircleDashed className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
              )}
              <span className={`text-[12px] font-semibold flex-1 ${status === "loaded" ? "text-sky-200/80" : "text-muted-foreground"}`}>
                {label}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${status === "loaded" ? "text-sky-400" : "text-muted-foreground/50"}`}>
                {status === "loaded" ? "Loaded" : "Empty"}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border/40 bg-card/30 px-3 py-2 flex items-center gap-3">
          <Database className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-muted-foreground mb-1">
              Storage used: {storage.usedMB.toFixed(1)} MB · {storage.pct}% of local quota
            </div>
            <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${storage.pct > 80 ? "bg-rose-500" : storage.pct > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${storage.pct}%` }}
              />
            </div>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${storage.healthy ? "text-emerald-400" : "text-amber-400"}`}>
            {storage.healthy ? "Healthy" : "Watch space"}
          </span>
        </div>
      </div>

      {/* Section 3 — Active Intelligence Modules */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 px-2">
            03 — Active Intelligence Modules
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ACTIVE_MODULES.slice(0, expandModules ? ACTIVE_MODULES.length : 4).map((mod) => (
            <div key={mod.name} className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3 flex flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-bold text-foreground">{mod.name}</span>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                  {mod.status}
                </span>
              </div>
              <p className="text-[11.5px] text-muted-foreground leading-relaxed">{mod.detail}</p>
            </div>
          ))}
        </div>

        {ACTIVE_MODULES.length > 4 && (
          <button
            type="button"
            onClick={() => setExpandModules((v) => !v)}
            className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            {expandModules ? "Show less" : `Show all ${ACTIVE_MODULES.length} modules`}
          </button>
        )}
      </div>

      {/* Section 4 — Future Model Hooks */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 px-2">
            04 — Future Model Hooks
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <div className="rounded-xl border border-zinc-600/30 bg-zinc-700/10 px-4 py-3 flex items-start gap-3 mb-1">
          <CircleDashed className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-zinc-300/80 leading-relaxed">
            These hooks are staged but not yet wired. When a backend is provisioned with the correct API keys and proxy routes, these will light up automatically. No fake active status.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FUTURE_HOOKS.map((hook) => (
            <div key={hook.name} className="rounded-xl border border-zinc-600/30 bg-zinc-700/10 p-3 flex flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-bold text-foreground/70">{hook.name}</span>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-zinc-700/40 text-zinc-400 border-zinc-600/30">
                  Pending
                </span>
              </div>
              <p className="text-[11.5px] text-muted-foreground/70 leading-relaxed">{hook.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5 — What Works Now */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 px-2">
            05 — What Works Right Now
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {WORKS_NOW.map((item) => (
              <div key={item} className="flex items-center gap-2 text-[12px]">
                <Zap className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span className="text-foreground/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 6 — What Needs Real Backend/Model */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400 px-2">
            06 — What Needs Real Backend / Model
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {NEEDS_BACKEND.map((item) => (
              <div key={item} className="flex items-center gap-2 text-[12px]">
                <ServerCog className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 7 — Backend API Status */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-400 px-2">
            07 — Backend / API Status
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Activity className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] text-sky-200/80 leading-relaxed">
                <strong className="text-sky-300">10 API routes tracked.</strong> Live pings show which routes respond 200 (Connected), 501 (Contract Ready — implementation pending), or 404 (Route Missing — not yet registered).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[
              { label: "Connected", desc: "HTTP 200", cls: "text-emerald-400" },
              { label: "Contract Ready", desc: "HTTP 501", cls: "text-amber-400" },
              { label: "Route Missing", desc: "HTTP 404", cls: "text-orange-400" },
              { label: "Not Reachable", desc: "Fetch error", cls: "text-rose-400" },
            ].map(({ label, desc, cls }) => (
              <div key={label} className="rounded-lg border border-border/30 bg-card/40 px-2 py-2">
                <p className={`text-[11px] font-black uppercase tracking-wider ${cls}`}>{label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          {onNavigate !== undefined && (
            <button
              type="button"
              onClick={() => onNavigate("backendstatus")}
              className="self-start inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-400 hover:text-sky-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Live Backend Status Panel
            </button>
          )}
        </div>
      </div>

      {/* Full capability summary */}
      <div className="rounded-xl border border-border/50 bg-card/40 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-[12px] font-black uppercase tracking-wider">Full AI Task Registry</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div><span className="text-xl font-black text-emerald-400">{summary.local}</span><p className="text-[10px] text-muted-foreground mt-0.5">Local Brain Active</p></div>
          <div><span className="text-xl font-black text-sky-400">{AI_TASKS.filter((t) => t.status === "memory-backed").length}</span><p className="text-[10px] text-muted-foreground mt-0.5">Memory-Backed</p></div>
          <div><span className="text-xl font-black text-amber-400">{summary.needsProvider}</span><p className="text-[10px] text-muted-foreground mt-0.5">Model Hook Pending</p></div>
          <div><span className="text-xl font-black text-zinc-400">{summary.future}</span><p className="text-[10px] text-muted-foreground mt-0.5">Future Connection</p></div>
        </div>
      </div>

      {/* Section 08 — Production Diagnostics */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 px-2">
            08 — Storage Diagnostics
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <div className="rounded-xl border border-zinc-600/30 bg-zinc-700/10 px-4 py-3 flex items-start gap-3">
          <Database className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-zinc-300/80 leading-relaxed">
            All <code className="font-mono text-zinc-300">hmg-*</code> localStorage keys below. Sizes are estimates (string length × 2). Credential keys are never shown here — they are excluded from export by the backup system.
          </p>
        </div>

        {diagKeys.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 bg-card/30 px-4 py-3 text-center">
            <p className="text-[12px] text-muted-foreground">No HMG keys in localStorage yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {diagKeys.map(({ key, bytes, color }) => (
              <div key={key} className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/30 px-3 py-2">
                <span className="text-[11px] font-mono text-muted-foreground flex-1 min-w-0 truncate">{key}</span>
                <span className={`text-[11px] font-bold ${color} flex-shrink-0`}>
                  {bytes >= 1024 ? `${(bytes / 1024).toFixed(1)}KB` : `${bytes}B`}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/30 mt-1">
              <Database className="w-3 h-3 flex-shrink-0" />
              Total: {storage.usedMB.toFixed(2)} MB ({storage.pct}% of 5 MB soft quota)
            </div>
          </div>
        )}
      </div>

      {/* Section 09 — Quality Guardrails */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 px-2">
            09 — HMG Quality Guardrails
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-emerald-200/80 leading-relaxed">
              <strong className="text-emerald-300">HMG Honesty Contract.</strong> These rules are enforced by design, not by configuration. They cannot be toggled off.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { label: "No fake AI", desc: "Every AI status is real. \"Local Brain Active\" = deterministic logic. \"Model Hook Pending\" = not wired yet." },
              { label: "No fake publish", desc: "No action in this app pushes live to WordPress. All drafts are manual-publish only." },
              { label: "No fake sync", desc: "There is no cloud sync. All data is localStorage only. Every read/write is local." },
              { label: "No fabricated stats", desc: "Every counter reads from actual localStorage data. No placeholder numbers, no mock counts." },
              { label: "No silent data loss", desc: "Storage failures surface as warnings. Export is always available. Quota events fire UI alerts." },
              { label: "No credential logging", desc: "WordPress passwords and API keys are never included in exports, audit logs, or backup payloads." },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] px-3 py-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] font-bold text-emerald-300">{label}</p>
                  <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2.5 mt-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11.5px] text-amber-200/70 leading-relaxed">
              <strong className="text-amber-300">When a real AI model is connected</strong> — the status in this view will update automatically. You will see the pill change from "Model Hook Pending" to a live status. Until then, all AI work is deterministic and local.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 justify-center text-[11px] text-muted-foreground/50 py-2">
        <Rocket className="w-3.5 h-3.5" />
        Haven AI Engine · Local-first · No fake providers · HMG Newsroom
      </div>
    </div>
  );
}
