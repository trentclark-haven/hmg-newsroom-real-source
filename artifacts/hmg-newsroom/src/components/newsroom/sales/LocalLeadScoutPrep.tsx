import { leadScoutModes } from "@/components/newsroom/sales/mockMaximillionData";
import { Handshake, MapPinned, Network, Sparkles } from "lucide-react";

const modeIcons = {
  "local-lead-scout": MapPinned,
  "introduce-max": Handshake,
  "relationship-memory": Network,
};

export function LocalLeadScoutPrep() {
  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-300">
            <Sparkles className="w-4 h-4" />
            <h3 className="text-sm font-black">
              Local Lead Scout + Intro Mode Prep
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Relationship-aware placeholders for local prospecting, warm intros,
            and founder-context memory.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
          Coming Next
        </span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {leadScoutModes.map((mode) => {
          const Icon = modeIcons[mode.id as keyof typeof modeIcons] ?? Sparkles;
          return (
            <div
              key={mode.id}
              className="min-w-0 rounded-lg border border-border/45 bg-secondary/30 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-8 h-8 rounded-md bg-emerald-400/10 text-emerald-700 dark:text-emerald-200 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <h4 className="text-[12px] font-black leading-snug break-words">
                    {mode.title}
                  </h4>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Prep
                </span>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-foreground/82">
                {mode.example}
              </p>
              <div className="mt-2 rounded-md border border-emerald-300/15 bg-emerald-400/[0.04] p-2 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-50/82">
                {mode.nextAction}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
