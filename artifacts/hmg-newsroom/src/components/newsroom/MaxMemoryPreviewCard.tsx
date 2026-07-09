/**
 * Max Memory Preview Card — Task 4
 *
 * Shows Max revenue / relationship / sales memory counts
 * and a deterministic suggested next move.
 * No fake AI. No fake outreach. No fake browsing.
 * Local-only, honest.
 */

import { useSyncExternalStore } from "react";
import {
  ArrowRight,
  Brain,
  HardDrive,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  getAllItems,
  subscribeMemoryStore,
} from "@/lib/hmg/memory/founderKnowledgeBase";
import { getMaxMemorySummary } from "@/lib/hmg/memory/maximillionMemory";

const MAX_COLOR = "#10B981";

function getSuggestedNextMove(summary: ReturnType<typeof getMaxMemorySummary>): string {
  if (!summary.hasRevenueNotes && !summary.hasSalesNotes) {
    return "Add one revenue note";
  }
  if (!summary.hasRelationshipNotes && !summary.hasContacts) {
    return "Add one relationship note";
  }
  if (!summary.hasSalesNotes) {
    return "Add one sales note";
  }
  if (!summary.hasBio) {
    return "Add a resume or bio note";
  }
  if (!summary.hasPitchDeck) {
    return "Add one pitch note";
  }
  return "Ready for local revenue review";
}

interface MaxMemoryPreviewCardProps {
  compact?: boolean;
}

export function MaxMemoryPreviewCard({ compact }: MaxMemoryPreviewCardProps) {
  useSyncExternalStore(subscribeMemoryStore, getAllItems, getAllItems);

  const summary = getMaxMemorySummary();
  const suggestedMove = getSuggestedNextMove(summary);
  const isReady = suggestedMove === "Ready for local revenue review";

  const counts = [
    { label: "Revenue Notes", value: summary.hasRevenueNotes },
    { label: "Relationship Notes", value: summary.hasRelationshipNotes },
    { label: "Sales Notes", value: summary.hasSalesNotes },
    { label: "Contact / CSV", value: summary.hasContacts },
  ];

  const allItems = getAllItems();
  const maxItems = allItems.filter((i) =>
    ["revenue-max-note", "sales-note", "relationship-note", "contact-csv", "pitch-deck", "resume-bio"].includes(i.type)
  );
  const revenueCount = allItems.filter((i) => i.type === "revenue-max-note").length;
  const relCount = allItems.filter((i) => i.type === "relationship-note").length;
  const salesCount = allItems.filter((i) => i.type === "sales-note").length;
  const contactCount = allItems.filter((i) => i.type === "contact-csv").length;

  const lastUpdated = summary.totalItems > 0
    ? maxItems.length > 0
      ? new Date(Math.max(...maxItems.map((i) => i.lastModified))).toLocaleDateString()
      : null
    : null;

  if (compact) {
    return (
      <div
        className="rounded-xl border px-3 py-2.5 flex items-center gap-3"
        style={{ borderColor: `${MAX_COLOR}30`, background: `${MAX_COLOR}08` }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${MAX_COLOR}1A`, color: MAX_COLOR }}
        >
          <TrendingUp className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: MAX_COLOR }}>
            Max Memory
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {maxItems.length} items · {suggestedMove}
          </p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: `${MAX_COLOR}30`, background: `${MAX_COLOR}06` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: `${MAX_COLOR}20` }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${MAX_COLOR}1A`, color: MAX_COLOR }}
        >
          <TrendingUp className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black uppercase tracking-wide" style={{ color: MAX_COLOR }}>
            Max Memory Preview
          </p>
          <p className="text-[10px] text-muted-foreground">
            CRO / Founder OS / revenue / relationship intelligence
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <HardDrive className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Local only</span>
        </div>
      </div>

      {/* Counts grid */}
      <div className="grid grid-cols-2 gap-2 px-4 py-3">
        <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Revenue Notes</p>
          <p className="text-xl font-black tabular-nums" style={{ color: MAX_COLOR }}>{revenueCount}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Relationship Notes</p>
          <p className="text-xl font-black tabular-nums" style={{ color: MAX_COLOR }}>{relCount}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Sales Notes</p>
          <p className="text-xl font-black tabular-nums" style={{ color: MAX_COLOR }}>{salesCount}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Contact / CSV</p>
          <p className="text-xl font-black tabular-nums" style={{ color: MAX_COLOR }}>{contactCount}</p>
        </div>
      </div>

      {lastUpdated && (
        <div className="px-4 pb-1 text-[10px] text-muted-foreground">
          Last Max memory update: {lastUpdated}
        </div>
      )}

      {/* Suggested move */}
      <div className="px-4 py-3 mx-4 mb-4 rounded-xl border" style={{ borderColor: `${MAX_COLOR}30`, background: `${MAX_COLOR}0D` }}>
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 shrink-0" style={{ color: MAX_COLOR }} />
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: MAX_COLOR }}>
            Suggested Next Move
          </p>
        </div>
        <p
          className="text-sm font-bold mt-1"
          style={{ color: isReady ? MAX_COLOR : "inherit" }}
        >
          {suggestedMove}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Deterministic recommendation — no fake AI — no fake outreach
        </p>
      </div>

      {/* Identity confirmation */}
      <div className="px-4 pb-3 flex items-center gap-1.5">
        <Users className="w-3 h-3 text-muted-foreground/60" />
        <p className="text-[10px] text-muted-foreground">
          Max = CRO / Founder OS / revenue / relationship / opportunity intelligence
        </p>
      </div>
    </div>
  );
}
