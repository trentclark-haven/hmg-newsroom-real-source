import type { MaximillionBrief } from "@/components/newsroom/sales/mockMaximillionData";
import { BadgeDollarSign, Sparkles } from "lucide-react";

interface MaximillionAdvisorProps {
  brief: MaximillionBrief;
}

const briefRows = [
  ["Today’s Money Brief", "todayFocus"],
  ["Best next move", "bestNextMove"],
  ["Lead to chase", "hotLead"],
  ["Event opportunity", "eventPlay"],
  ["Sponsor angle", "sponsorAngle"],
  ["Package value", "packageValue"],
  ["Rate-card thinking", "rateCardThinking"],
  ["Buyer objection", "buyerObjection"],
  ["Next-best ask", "nextBestAsk"],
] as const;

export function MaximillionAdvisor({ brief }: MaximillionAdvisorProps) {
  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/40 overflow-hidden">
      <div className="px-3 py-3 border-b border-emerald-400/10 bg-emerald-400/[0.06] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-md bg-emerald-400/15 text-emerald-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-black leading-tight">
              Maximillion Advisor
            </h3>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Local mock intelligence
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-200 border border-emerald-300/20 rounded-full px-2 py-1">
          No AI credits
        </span>
      </div>

      <div className="p-3 space-y-2">
        {briefRows.map(([label, key]) => (
          <div
            key={key}
            className="rounded-md border border-border/45 bg-secondary/35 p-2.5"
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-300">
              <BadgeDollarSign className="w-3.5 h-3.5" />
              {label}
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-foreground/88">
              {brief[key]}
            </p>
          </div>
        ))}
        <div className="rounded-md border border-amber-300/20 bg-amber-300/[0.06] p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-200">
            Risk watch
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-foreground/85">
            {brief.riskWarning}
          </p>
        </div>
        <div className="rounded-md border border-sky-300/20 bg-sky-300/[0.06] p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-sky-700 dark:text-sky-200">
            Founder note
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-foreground/85">
            {brief.founderNote}
          </p>
        </div>
      </div>
    </section>
  );
}
