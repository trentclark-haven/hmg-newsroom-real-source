import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Clock,
  Database,
  Globe,
  Lock,
  Radio,
  Shield,
  Users,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import {
  SAMPLE_OPERATORS,
  ROLE_LABELS_V2,
  ROLE_DESKS,
  FUTURE_BACKEND_CONTRACTS,
  type Operator,
  type OperatorStatus,
} from "@/lib/operatorRoster";

const STATUS_COLORS: Record<OperatorStatus, { dot: string; label: string }> = {
  active: { dot: "bg-emerald-400", label: "Active" },
  idle: { dot: "bg-amber-400", label: "Idle" },
  away: { dot: "bg-orange-400", label: "Away" },
  offline: { dot: "bg-zinc-500", label: "Offline" },
};

const CONTRACT_COLORS: Record<string, string> = {
  "api-contract-ready": "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  "architecture-staged": "text-amber-400 border-amber-500/30 bg-amber-500/10",
  future: "text-zinc-400 border-zinc-600/30 bg-zinc-700/20",
};

const CONTRACT_LABELS: Record<string, string> = {
  "api-contract-ready": "Contract Ready",
  "architecture-staged": "Architecture Staged",
  future: "Future Roadmap",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function OperatorCard({ op }: { op: Operator }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_COLORS[op.status];

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center flex-shrink-0 text-[13px] font-black">
          {op.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-bold">{op.name}</span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {ROLE_LABELS_V2[op.role]}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
            <span className="text-[11px] text-muted-foreground">{statusCfg.label}</span>
            <span className="text-[10px] text-muted-foreground/60">·</span>
            <span className="text-[11px] text-muted-foreground">{op.activeDesk}</span>
            <span className="text-[10px] text-muted-foreground/60">·</span>
            <span className="text-[11px] text-muted-foreground/60">{timeAgo(op.lastActivity)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex gap-0.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-3 rounded-sm ${i < op.permissionsTier ? "bg-sky-400" : "bg-border/60"}`}
              />
            ))}
          </div>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-3.5 pb-3.5 border-t border-border/30 pt-3 space-y-2">
          <div className="flex flex-wrap gap-2 text-[11.5px]">
            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Brand:</span>
              <span className="font-bold">{op.assignedBrand === "all" ? "All Silos" : op.assignedBrand}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Tier {op.permissionsTier} permissions</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
              Authorized Desks
            </div>
            <div className="flex flex-wrap gap-1">
              {ROLE_DESKS[op.role].map((desk) => (
                <span
                  key={desk}
                  className="text-[10.5px] px-2 py-0.5 rounded-full bg-muted/50 border border-border/40 text-muted-foreground"
                >
                  {desk}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function OperatorReadinessView() {
  const [tab, setTab] = useState<"roster" | "workqueue" | "contracts" | "roledetail">("roster");

  const onlineCount = useMemo(
    () => SAMPLE_OPERATORS.filter((o) => o.status === "active" || o.status === "idle").length,
    [],
  );

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 lg:px-8 py-5 gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center">
            <Users className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">Operator Readiness</h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Multi-user architecture · Local simulation mode
            </p>
          </div>
        </div>
      </div>

      {/* Honest Mode Banner */}
      <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.06] px-4 py-3 flex items-start gap-3">
        <Radio className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[12.5px] text-sky-200/80 leading-relaxed">
            <strong className="text-sky-300">Local operator simulation.</strong> This shows how 9 operators would map into the HMG Newsroom system. No live multiplayer. No fake sync. Backend collaboration contract is fully staged and ready to wire when a server is provisioned.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/50 bg-card/60 p-3.5">
          <div className="text-2xl font-black text-foreground">{SAMPLE_OPERATORS.length}</div>
          <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">Operator Slots</div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3.5">
          <div className="text-2xl font-black text-emerald-400">{onlineCount}</div>
          <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">Active / Idle</div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/60 p-3.5">
          <div className="text-2xl font-black text-amber-400">
            {FUTURE_BACKEND_CONTRACTS.filter((c) => c.readiness === "api-contract-ready").length}
          </div>
          <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">Contracts Ready</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-xl border border-border/20 flex-wrap sm:flex-nowrap">
        {([
          { id: "roster", label: "Operator Roster", icon: Users },
          { id: "workqueue", label: "Work Queue Model", icon: Zap },
          { id: "contracts", label: "Backend Contracts", icon: Globe },
          { id: "roledetail", label: "Role Detail", icon: BookOpen },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] font-bold transition-all ${
              tab === id
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Roster */}
      {tab === "roster" && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <span>9 Operator Slots · Single Device Local Mode</span>
          </div>
          {SAMPLE_OPERATORS.map((op) => (
            <OperatorCard key={op.id} op={op} />
          ))}
          <div className="rounded-xl border border-dashed border-border/50 p-4 text-center">
            <WifiOff className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-[12px] text-muted-foreground/60">
              Live multi-user mode requires backend sync.{" "}
              <span className="text-sky-400 font-semibold">Backend contract ready to wire.</span>
            </p>
          </div>
        </div>
      )}

      {/* Tab: Work Queue */}
      {tab === "workqueue" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border/50 bg-card/40 p-4">
            <div className="text-[12px] font-black uppercase tracking-wider mb-3">Work Item Model</div>
            <div className="space-y-2">
              {[
                { field: "id", type: "string", note: "Unique work item identifier" },
                { field: "type", type: "article | visual | cut-note | social | wordpress-draft | revenue-note | memory-item", note: "Content type" },
                { field: "brand", type: "Silo enum", note: "Which vertical this belongs to" },
                { field: "title", type: "string", note: "Short description" },
                { field: "status", type: "draft → needs-review → ready → blocked → saved → exported → archived", note: "Workflow state" },
                { field: "ownerId", type: "string", note: "Operator ID of creator" },
                { field: "reviewerId", type: "string | null", note: "Operator assigned to review" },
                { field: "createdAt / updatedAt", type: "number (timestamp)", note: "Audit timestamps" },
                { field: "outputRefs", type: "string[]", note: "Links to saved outputs" },
              ].map((f) => (
                <div key={f.field} className="flex gap-3 text-[12px] py-1.5 border-b border-border/20 last:border-0">
                  <span className="font-mono font-bold text-sky-400 flex-shrink-0 w-24 truncate">{f.field}</span>
                  <span className="text-muted-foreground flex-1 min-w-0 truncate">{f.type}</span>
                  <span className="text-muted-foreground/60 text-[11px] flex-shrink-0 hidden sm:inline">{f.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-[12.5px] text-amber-200/80">
              <strong className="text-amber-300">Work queue is local-only.</strong> Items are stored in localStorage. When a backend is wired, this maps directly to a server queue with locking, review status, conflict detection, and real-time assignment.
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card/40 p-4">
            <div className="text-[12px] font-black uppercase tracking-wider mb-3">Status Flow</div>
            <div className="flex items-center gap-1.5 flex-wrap text-[11.5px]">
              {["draft", "needs-review", "ready", "blocked", "saved", "exported", "archived"].map((s, i, arr) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-muted/50 border border-border/40 font-mono font-semibold">
                    {s}
                  </span>
                  {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Backend Contracts */}
      {tab === "contracts" && (
        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Collaboration Contract · Ready to Wire · No Live Backend Yet
          </div>
          {FUTURE_BACKEND_CONTRACTS.map((c) => (
            <div key={c.feature} className="rounded-xl border border-border/50 bg-card/60 p-3.5 flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13.5px] font-bold">{c.feature}</div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{c.description}</p>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    CONTRACT_COLORS[c.readiness] ?? "text-zinc-400 border-zinc-600/30 bg-zinc-700/20"
                  }`}
                >
                  {CONTRACT_LABELS[c.readiness] ?? c.readiness}
                </span>
              </div>
              <code className="text-[11px] font-mono text-sky-400/80 bg-muted/30 px-2.5 py-1 rounded-lg">
                {c.contract}
              </code>
            </div>
          ))}

          <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.06] px-4 py-3 flex items-start gap-3 mt-1">
            <Wifi className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <div className="text-[12.5px] text-sky-200/80">
              <strong className="text-sky-300">Collaboration contract is ready.</strong> Wire a real backend to any of these endpoints and the frontend immediately maps to real multi-user data. No fake claims, no fake sync until then.
            </div>
          </div>
        </div>
      )}

      {/* Tab: Role Detail */}
      {tab === "roledetail" && (
        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            9 Operator Roles · Lanes, Risks & Backend Needs · Local Simulation
          </div>
          {[
            {
              role: "founder" as const,
              lane: "Full-spectrum editorial, revenue, and system oversight. Sets brand direction. Approves final outputs.",
              risks: ["Single point of failure without delegation", "Bottleneck on all final decisions"],
              backendNeeds: ["Real-time activity feed", "Cross-operator approval queue"],
              localNote: "All Founder desks are fully operational in local mode. Memory-backed decisions work now.",
            },
            {
              role: "editor" as const,
              lane: "Article writing, headline variants, SEO prep, WordPress draft prep. Runs Editorial Desk and ARTBOT.",
              risks: ["No AI model = deterministic output only", "WordPress publish requires manual copy-paste"],
              backendNeeds: ["AI model API for live article generation", "WordPress REST credentials"],
              localNote: "ARTBOT and WordPress draft builder both work in local mode. No fake publish.",
            },
            {
              role: "visual-operator" as const,
              lane: "WebArt, collage, graphics, media library. Handles all visual asset production.",
              risks: ["No AI image generation without backend", "Concept-only without image model hook"],
              backendNeeds: ["Image generation backend proxy", "Media storage CDN"],
              localNote: "Upload, crop, frame, and export work locally. AI concept graphics need backend.",
            },
            {
              role: "clip-operator" as const,
              lane: "WebEdit 8-step clip studio: upload → transcript → Hook Finder → timeline → captions → format → thumbnail → save.",
              risks: ["Transcription is a paste-in hook; no live audio-to-text", "Video render needs backend"],
              backendNeeds: ["Transcription API (Whisper or similar)", "Video render + delivery backend"],
              localNote: "Local Timeline Mode is active. All clip notes, captions, and briefs save locally.",
            },
            {
              role: "social-operator" as const,
              lane: "Social Factory platform copy, campaign packs, output distribution.",
              risks: ["No live post scheduling or auto-publish", "Platform API hooks are placeholders"],
              backendNeeds: ["Social platform API credentials (Meta, X, TikTok)", "Post scheduling service"],
              localNote: "All social copy generation and CSV export work in local mode.",
            },
            {
              role: "revenue-operator" as const,
              lane: "Ask Max, Sales Pipeline, sponsor relationships, revenue notes.",
              risks: ["Max is deterministic — no live deal data", "CRM is localStorage only"],
              backendNeeds: ["Real CRM backend", "Revenue event tracking API"],
              localNote: "Max revenue intelligence and opportunity scoring are fully local.",
            },
            {
              role: "admin" as const,
              lane: "All desks access. System setup, WP connections, audit log, receipts.",
              risks: ["Full access = high-privilege role, needs backend auth when multi-user is live"],
              backendNeeds: ["Role-based access control (RBAC)", "Server-side audit logging"],
              localNote: "Admin access is local only — no real permission enforcement until backend is wired.",
            },
            {
              role: "trainee" as const,
              lane: "Editorial Desk only. Produces drafts for editor review.",
              risks: ["No review queue until backend is live", "Outputs saved locally but not routed to reviewer"],
              backendNeeds: ["Work queue with review routing", "Reviewer notification system"],
              localNote: "Can write and save outputs. Review routing is manual in local mode.",
            },
            {
              role: "reviewer" as const,
              lane: "Output History and Assignments. Reviews and approves work before publication.",
              risks: ["No live notification of pending reviews", "Approval is a local flag only"],
              backendNeeds: ["Review queue API", "Push notification system"],
              localNote: "Can view and copy outputs. Formal approval routing needs backend.",
            },
          ].map((rd) => (
            <div key={rd.role} className="rounded-xl border border-border/50 bg-card/60 p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-[13.5px] font-bold">{ROLE_LABELS_V2[rd.role]}</span>
                  <span className="ml-2 text-[10px] text-muted-foreground font-mono">#{rd.role}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {ROLE_DESKS[rd.role].map((desk) => (
                    <span key={desk} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 border border-border/40 text-muted-foreground">
                      {desk}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[12px] text-muted-foreground/80 leading-relaxed">{rd.lane}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1">Production Risks</div>
                  <div className="space-y-0.5">
                    {rd.risks.map((r) => (
                      <div key={r} className="flex items-start gap-1.5 text-[11px] text-muted-foreground/70">
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-sky-400 mb-1">Backend Needs</div>
                  <div className="space-y-0.5">
                    {rd.backendNeeds.map((n) => (
                      <div key={n} className="flex items-start gap-1.5 text-[11px] text-muted-foreground/70">
                        <CircleDashed className="w-2.5 h-2.5 text-sky-400 flex-shrink-0 mt-0.5" />
                        <span>{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-[11px] border-t border-border/20 pt-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground/70">{rd.localNote}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-[11px] text-muted-foreground/50 py-2">
        Operator Readiness · Local Simulation · Backend Contract Ready · HMG Newsroom
      </div>
    </div>
  );
}
