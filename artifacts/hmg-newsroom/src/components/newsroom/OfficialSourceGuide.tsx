import { useState } from "react";
import { BadgeCheck, ChevronDown, ListChecks } from "lucide-react";
import {
  OFFICIAL_SOURCES,
  SCREENGRAB_STEPS,
} from "./artbotConfig";

export function OfficialSourceGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid="artbot-official-guide-toggle"
        className="w-full flex items-center justify-between px-3 py-2.5"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/90">
          <BadgeCheck className="w-3.5 h-3.5" />
          Official-source screengrab guide
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3" data-testid="artbot-official-guide">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            For celebrity, artist, athlete and music coverage, use a real frame
            from an <strong className="text-foreground/90">official source</strong> —
            never an AI-generated person.
          </p>

          <div className="space-y-1.5">
            {OFFICIAL_SOURCES.map((s) => (
              <div
                key={s.name}
                className="rounded-md border border-border/40 bg-secondary/30 px-2.5 py-1.5"
              >
                <div className="text-[11px] font-bold text-foreground/90">
                  {s.name}
                </div>
                <div className="text-[10px] text-muted-foreground leading-snug">
                  {s.how}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground/80 mb-1">
              <ListChecks className="w-3.5 h-3.5" />
              How to capture
            </div>
            <ol className="list-decimal list-inside space-y-0.5">
              {SCREENGRAB_STEPS.map((step, i) => (
                <li
                  key={i}
                  className="text-[10px] text-muted-foreground leading-snug"
                >
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
