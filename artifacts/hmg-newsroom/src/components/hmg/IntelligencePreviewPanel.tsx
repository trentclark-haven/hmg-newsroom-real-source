import { BrainCircuit, CheckCircle2, ArrowRight, AlertTriangle } from "lucide-react";
import type { View } from "@/components/newsroom/MenuOverlay";
import { CopyButton } from "./CopyButton";
import {
  formatMemorySeedSummary,
  intelligenceExamples,
  memorySeed,
} from "@/lib/hmg/intelligence";

interface IntelligencePreviewPanelProps {
  todayMove: string;
  strongestBrand: string;
  weakestArea: string;
  recommendedTool: { label: string; view: View };
  onOpenTool?: (view: View) => void;
}

const STATUS_LABELS: Record<keyof typeof memorySeed.status, string> = {
  memorySeed: "Memory Seed",
  styleEngine: "Style Engine",
  hmgVisualEngine: "HMG Visual Engine",
  articleQuality: "Article Quality Engine",
};

export function IntelligencePreviewPanel({
  todayMove,
  strongestBrand,
  weakestArea,
  recommendedTool,
  onOpenTool,
}: IntelligencePreviewPanelProps) {
  const bestExample = intelligenceExamples.reduce((best, current) =>
    current.qualityScore.score > best.qualityScore.score ? current : best,
  );
  return (
    <section
      className="mt-4 rounded-2xl border border-border/60 bg-card/50 p-3"
      data-testid="commandcenter-intelligence-preview"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-sky-400" />
          <div>
            <h3 className="text-[12px] font-black uppercase tracking-wider text-foreground">
              Intelligence Preview
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Local draft and output guidance from the newsroom intelligence core.
            </p>
          </div>
        </div>
        <CopyButton
          textToCopy={formatMemorySeedSummary()}
          label="Copy Memory Seed"
          successMessage="Memory Seed Summary copied"
          className="h-8 text-[11px]"
        />
      </div>

      <div className="grid gap-2 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">
            Today's Best Intelligence Move
          </p>
          <p className="mt-1 text-sm font-bold leading-snug text-foreground">
            {todayMove}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { label: "Strongest Brand", value: strongestBrand, icon: CheckCircle2 },
              { label: "Weakest Area", value: weakestArea, icon: AlertTriangle },
              { label: "Example Score", value: `${bestExample.qualityScore.score}/100`, icon: BrainCircuit },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-border/50 bg-background/30 p-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    {item.label}
                  </div>
                  <p className="mt-1 truncate text-[12px] font-black text-foreground">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onOpenTool?.(recommendedTool.view)}
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border border-border/60 px-3 text-[11px] font-bold text-foreground hover:border-foreground/40"
          >
            Open {recommendedTool.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Local Readiness Status
          </p>
          <div className="mt-2 space-y-1.5">
            {Object.entries(memorySeed.status).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/30 px-2 py-1.5"
              >
                <span className="text-[11px] font-bold text-foreground">
                  {STATUS_LABELS[key as keyof typeof memorySeed.status]}
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
