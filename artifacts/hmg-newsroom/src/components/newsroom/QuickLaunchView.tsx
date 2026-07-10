import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Newspaper,
  Brush,
  Film,
  Megaphone,
  FileText,
  CirclePlay as PlayCircle,
  ArrowRight,
  CircleCheck as CheckCircle2,
  CircleAlert as AlertCircle,
  Clock,
  Zap,
  Eye,
  Image as ImageIcon,
  Scissors,
  Globe,
  ChevronRight,
} from "lucide-react";
import { verticals } from "@/lib/mock-data";
import { useOutputHistory } from "@/lib/useOutputHistory";
import type { View } from "./MenuOverlay";

interface QuickLaunchViewProps {
  onSelectView: (view: View) => void;
  onOpenEditorial: (verticalId: string) => void;
}

const KIND_TO_VIEW: Record<string, View> = {
  quick: "newsroom",
  pack: "newsroom",
  specialist: "newsroom",
  "wordpress-draft": "wp-draft-history",
  "cut-note": "cutmaster",
  "edit-brief": "cutmaster",
  "social-video-draft": "cutmaster",
  "caption-plan": "cutmaster",
  "thumbnail-brief": "cutmaster",
};

type TileStatus =
  | "ready"
  | "needs-setup"
  | "saved-draft"
  | "needs-media"
  | "review-first"
  | "blocked";

function statusBadge(status: TileStatus) {
  switch (status) {
    case "ready":
      return { label: "Ready", icon: CheckCircle2, cls: "text-emerald-500 dark:text-emerald-400" };
    case "needs-setup":
      return { label: "Needs Setup", icon: AlertCircle, cls: "text-amber-500 dark:text-amber-400" };
    case "saved-draft":
      return { label: "Saved Draft", icon: Clock, cls: "text-sky-500 dark:text-sky-400" };
    case "needs-media":
      return { label: "Needs Media", icon: ImageIcon, cls: "text-orange-500 dark:text-orange-400" };
    case "review-first":
      return { label: "Review First", icon: Eye, cls: "text-violet-500 dark:text-violet-400" };
    case "blocked":
      return { label: "Blocked", icon: AlertCircle, cls: "text-rose-500 dark:text-rose-400" };
  }
}

const FAST_LANE_STEPS = [
  { label: "Notes", icon: FileText },
  { label: "Draft", icon: Newspaper },
  { label: "Visual", icon: ImageIcon },
  { label: "Clip", icon: Scissors },
  { label: "Social", icon: Megaphone },
  { label: "WordPress", icon: Globe },
];

export function QuickLaunchView({
  onSelectView,
  onOpenEditorial,
}: QuickLaunchViewProps) {
  const { entries } = useOutputHistory();
  const lastDraft = entries[0];

  const lastDraftLabel = useMemo(() => {
    if (!lastDraft) return null;
    const out = lastDraft.output as Record<string, unknown>;
    const title =
      (out.title as string) ??
      (out.headline as string) ??
      lastDraft.prompt ??
      "Untitled";
    return String(title).slice(0, 60);
  }, [lastDraft]);

  const lastDraftTime = useMemo(() => {
    if (!lastDraft?.createdAt) return null;
    try {
      return new Date(lastDraft.createdAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  }, [lastDraft]);

  const lastDraftBrand = useMemo(() => {
    if (!lastDraft?.siloName) return null;
    return lastDraft.siloName;
  }, [lastDraft]);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 lg:px-8 py-4 max-w-4xl mx-auto w-full">
      {/* Hero line */}
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
          What are we shipping right now?
        </h2>
        <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
          Pick a brand to start writing, or choose a desk below. Everything saves automatically — resume any time.
        </p>
      </div>

      {/* Brand selector */}
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">
          Haven Brands
        </p>
        <div className="flex flex-wrap gap-2">
          {verticals.map((v) => (
            <button
              key={v.id}
              onClick={() => onOpenEditorial(v.id)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-border/50 bg-card/60 hover:bg-card hover:border-border transition-all hover:scale-[1.02] active:scale-95"
              aria-label={`Open ${v.name} Editorial Desk`}
            >
              {v.logo ? (
                <img
                  src={v.logo}
                  alt=""
                  className="w-5 h-5 object-contain"
                />
              ) : (
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: v.color }}
                />
              )}
              <span className="text-xs font-semibold">{v.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fast Lane strip — post-from-anywhere path */}
      <div
        className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 rounded-xl border border-border/30 bg-card/30 px-3 py-2.5"
        data-testid="quicklaunch-fast-lane"
        aria-label="Field publishing path"
      >
        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 shrink-0 mr-1">
          Fast Lane
        </span>
        {FAST_LANE_STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center gap-1.5 shrink-0">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground/70">
                <Icon className="w-3 h-3" />
                {step.label}
              </span>
              {idx < FAST_LANE_STEPS.length - 1 && (
                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/30" />
              )}
            </div>
          );
        })}
      </div>

      {/* Primary tiles — Breaking + Article */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <PrimaryTile
          icon={Flame}
          title="Breaking News"
          subtitle="Jump straight into the Editorial Desk with breaking-story mode ready."
          color="#EF4444"
          status="ready"
          helper="Unlocks the full Editorial Desk flow"
          onClick={() => onOpenEditorial(verticals[0].id)}
        />
        <PrimaryTile
          icon={Newspaper}
          title="Article Draft"
          subtitle="Open the Editorial Desk to write a new article from your notes."
          color="#3B82F6"
          status="ready"
          helper="Start with notes, end with a publish-ready draft"
          onClick={() => onOpenEditorial(verticals[0].id)}
        />
      </div>

      {/* Secondary tiles — responsive grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <SecondaryTile
          icon={Brush}
          title="WebArt"
          subtitle="Create brand graphics and images."
          color="#F97316"
          status="ready"
          helper="Pair visuals with your article"
          onClick={() => onSelectView("artbot")}
        />
        <SecondaryTile
          icon={Film}
          title="WebEdit"
          subtitle="Plan edits, write cut notes, prep video."
          color="#8B5CF6"
          status="ready"
          helper="Turn footage into a cut plan"
          onClick={() => onSelectView("cutmaster")}
        />
        <SecondaryTile
          icon={Megaphone}
          title="Social Pack"
          subtitle="Build multi-platform social posts from one prompt."
          color="#10B981"
          status="ready"
          helper="Generate after your draft is ready"
          onClick={() => onSelectView("socialfactory")}
        />
        <SecondaryTile
          icon={FileText}
          title="WordPress Draft"
          subtitle="Build and save a WordPress-ready draft."
          color="#F59E0B"
          status={lastDraft ? "saved-draft" : "needs-setup"}
          helper={lastDraft ? "Last draft saved — resume or export" : "Connect WordPress to enable publishing"}
          onClick={() => onSelectView("wp-draft-history")}
        />
      </div>

      {/* Resume Last Draft */}
      <ResumeTile
        label={lastDraftLabel}
        time={lastDraftTime}
        brand={lastDraftBrand}
        onClick={() => {
          if (!lastDraft) {
            onSelectView("newsroom");
            return;
          }
          const target = KIND_TO_VIEW[lastDraft.kind] ?? "newsroom";
          onSelectView(target);
        }}
      />

      {/* Footer hint */}
      <p className="text-[10px] text-muted-foreground/50 text-center mt-4 leading-snug">
        Haven Media Group · Field-publishing cockpit · Save any time, resume any time
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: TileStatus }) {
  const badge = statusBadge(status);
  const Icon = badge.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${badge.cls}`}
    >
      <Icon className="w-3 h-3" />
      {badge.label}
    </span>
  );
}

function PrimaryTile({
  icon: Icon,
  title,
  subtitle,
  color,
  status,
  helper,
  onClick,
}: {
  icon: typeof Flame;
  title: string;
  subtitle: string;
  color: string;
  status: TileStatus;
  helper: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative flex flex-col items-start gap-2 p-4 rounded-2xl border border-border/50 bg-card/70 text-left hover:border-border transition-all overflow-hidden group"
      aria-label={title}
    >
      <div
        className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
        style={{ background: color }}
      />
      <div className="relative flex items-center justify-between w-full">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color, color: "#ffffff" }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <StatusPill status={status} />
      </div>
      <h3 className="relative text-sm font-bold">{title}</h3>
      <p className="relative text-[11px] text-muted-foreground leading-snug">
        {subtitle}
      </p>
      <p className="relative text-[10px] text-muted-foreground/50 leading-snug flex items-center gap-1">
        <ChevronRight className="w-3 h-3" style={{ color }} />
        {helper}
      </p>
    </motion.button>
  );
}

function SecondaryTile({
  icon: Icon,
  title,
  subtitle,
  color,
  status,
  helper,
  onClick,
}: {
  icon: typeof Flame;
  title: string;
  subtitle: string;
  color: string;
  status: TileStatus;
  helper: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative flex flex-col items-start gap-2 p-3.5 rounded-2xl border border-border/50 bg-card/70 text-left hover:border-border transition-all overflow-hidden group"
      aria-label={title}
    >
      <div
        className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
        style={{ background: color }}
      />
      <div className="relative flex items-center justify-between w-full">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color, color: "#ffffff" }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <StatusPill status={status} />
      </div>
      <h3 className="relative text-[13px] font-bold leading-tight">{title}</h3>
      <p className="relative text-[10px] text-muted-foreground leading-snug">
        {subtitle}
      </p>
      <p className="relative text-[9px] text-muted-foreground/50 leading-snug">
        {helper}
      </p>
    </motion.button>
  );
}

function ResumeTile({
  label,
  time,
  brand,
  onClick,
}: {
  label: string | null;
  time: string | null;
  brand: string | null;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-all text-left w-full"
      aria-label="Resume last draft"
    >
      <PlayCircle className="w-6 h-6 text-sky-500 shrink-0" />
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold">Resume Last Draft</h3>
        <p className="text-[11px] text-muted-foreground truncate">
          {label
            ? `Continue: ${label}${brand ? ` · ${brand}` : ""}${time ? ` · ${time}` : ""}`
            : "No recent draft — start fresh in the Editorial Desk"}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </motion.button>
  );
}
