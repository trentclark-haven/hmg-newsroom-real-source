/**
 * ARTBOT Memory Preview Card — Task 5
 *
 * Shows ARTBOT editorial memory counts and a deterministic
 * suggested next move.
 * No fake ARTBOT provider connection.
 * No fake AI. Local-only, honest.
 */

import { useSyncExternalStore } from "react";
import {
  ArrowRight,
  Feather,
  FileText,
  HardDrive,
  Newspaper,
  Sparkles,
} from "lucide-react";
import {
  getAllItems,
  subscribeMemoryStore,
} from "@/lib/hmg/memory/founderKnowledgeBase";
import { getEditorialMemorySummary } from "@/lib/hmg/memory/editorialMemory";

const ARTBOT_COLOR = "#0EA5E9";

function getSuggestedNextMove(summary: ReturnType<typeof getEditorialMemorySummary>): string {
  if (!summary.hasFounderVoice) return "Add Founder Voice sample";
  if (!summary.hasOldArticles) return "Add old article";
  if (!summary.hasWordPressRules) return "Add WordPress rule";
  if (!summary.hasBrandRules) return "Add brand rule";
  if (!summary.hasEditorialRules) return "Add editorial rule";
  if (!summary.hasSocialExamples) return "Add social example";
  return "Ready for local editorial help";
}

interface ARTBOTMemoryPreviewCardProps {
  compact?: boolean;
}

export function ARTBOTMemoryPreviewCard({ compact }: ARTBOTMemoryPreviewCardProps) {
  useSyncExternalStore(subscribeMemoryStore, getAllItems, getAllItems);

  const summary = getEditorialMemorySummary();
  const suggestedMove = getSuggestedNextMove(summary);
  const isReady = suggestedMove === "Ready for local editorial help";

  const allItems = getAllItems();

  const founderVoiceCount = allItems.filter((i) => i.type === "founder-voice").length;
  const oldArticleCount = allItems.filter((i) => i.type === "old-article").length;
  const editorialRuleCount = allItems.filter((i) => i.type === "editorial-rule").length;
  const socialExampleCount = allItems.filter((i) => i.type === "social-example").length;
  const wpRuleCount = allItems.filter((i) => i.type === "wordpress-rule").length;
  const brandRuleCount = allItems.filter((i) => i.type === "brand-rule").length;

  const editorialItems = allItems.filter((i) =>
    ["founder-voice", "old-article", "editorial-rule", "social-example", "wordpress-rule", "brand-rule", "artbot-content-note"].includes(i.type)
  );

  const lastUpdated =
    editorialItems.length > 0
      ? new Date(Math.max(...editorialItems.map((i) => i.lastModified))).toLocaleDateString()
      : null;

  if (compact) {
    return (
      <div
        className="rounded-xl border px-3 py-2.5 flex items-center gap-3"
        style={{ borderColor: `${ARTBOT_COLOR}30`, background: `${ARTBOT_COLOR}08` }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${ARTBOT_COLOR}1A`, color: ARTBOT_COLOR }}
        >
          <Feather className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: ARTBOT_COLOR }}>
            ARTBOT Memory
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {summary.totalItems} items · {suggestedMove}
          </p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: `${ARTBOT_COLOR}30`, background: `${ARTBOT_COLOR}06` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: `${ARTBOT_COLOR}20` }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${ARTBOT_COLOR}1A`, color: ARTBOT_COLOR }}
        >
          <Feather className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black uppercase tracking-wide" style={{ color: ARTBOT_COLOR }}>
            ARTBOT Memory Preview
          </p>
          <p className="text-[10px] text-muted-foreground">
            Editorial / content assistant memory — local only
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <HardDrive className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Local only</span>
        </div>
      </div>

      {/* Counts grid */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        <div className="rounded-lg border border-border/40 bg-background/40 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Founder Voice</p>
          <p className="text-lg font-black tabular-nums" style={{ color: ARTBOT_COLOR }}>{founderVoiceCount}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Old Articles</p>
          <p className="text-lg font-black tabular-nums" style={{ color: ARTBOT_COLOR }}>{oldArticleCount}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Editorial Rules</p>
          <p className="text-lg font-black tabular-nums" style={{ color: ARTBOT_COLOR }}>{editorialRuleCount}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Social Examples</p>
          <p className="text-lg font-black tabular-nums" style={{ color: ARTBOT_COLOR }}>{socialExampleCount}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">WordPress Rules</p>
          <p className="text-lg font-black tabular-nums" style={{ color: ARTBOT_COLOR }}>{wpRuleCount}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Brand Rules</p>
          <p className="text-lg font-black tabular-nums" style={{ color: ARTBOT_COLOR }}>{brandRuleCount}</p>
        </div>
      </div>

      {lastUpdated && (
        <div className="px-4 pb-1 text-[10px] text-muted-foreground">
          Last ARTBOT memory update: {lastUpdated}
        </div>
      )}

      {/* Suggested move */}
      <div className="px-4 py-3 mx-4 mb-4 rounded-xl border" style={{ borderColor: `${ARTBOT_COLOR}30`, background: `${ARTBOT_COLOR}0D` }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: ARTBOT_COLOR }} />
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ARTBOT_COLOR }}>
            Suggested Next Move
          </p>
        </div>
        <p
          className="text-sm font-bold mt-1"
          style={{ color: isReady ? ARTBOT_COLOR : "inherit" }}
        >
          {suggestedMove}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Deterministic — no fake ARTBOT provider connection — no fake AI
        </p>
      </div>

      {/* Identity confirmation */}
      <div className="px-4 pb-3 flex items-center gap-1.5">
        <Newspaper className="w-3 h-3 text-muted-foreground/60" />
        <p className="text-[10px] text-muted-foreground">
          ARTBOT = editorial / content assistant. Not graphics. Not WebArt.
        </p>
      </div>
    </div>
  );
}
