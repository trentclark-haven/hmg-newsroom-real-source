import { Button } from "@/components/ui/button";
import {
  carModeActions,
  carModePrompts,
} from "@/components/newsroom/sales/mockMaximillionV7Data";
import {
  Briefcase,
  CalendarDays,
  Car,
  DollarSign,
  MapPin,
  Mic,
  Network,
} from "lucide-react";

interface MaximillionCarModeProps {
  onPrompt: (prompt: string) => void;
}

export function MaximillionCarMode({ onPrompt }: MaximillionCarModeProps) {
  const iconMap = [MapPin, DollarSign, CalendarDays, Briefcase, Network, Mic, Car];

  return (
    <section className="rounded-lg border border-sky-300/20 bg-secondary/35 p-3 overflow-hidden">
      <div className="rounded-lg border border-sky-200/15 bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(14,165,233,0.14),rgba(16,185,129,0.08))] p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-100">
              <Car className="h-4 w-4" />
              <h3 className="text-sm font-black">Maximillion Car Mode</h3>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-sky-700 dark:text-sky-50/78">
              Passenger-seat executive mode: large touch targets, minimal UI,
              and voice-first prompts. No location tracking or live nearby scan
              is active.
            </p>
          </div>
          <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
            Local Prompt Mode
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {carModeActions.map((action, index) => {
            const Icon = iconMap[index % iconMap.length];
            return (
              <Button
                key={action.id}
                type="button"
                onClick={() => onPrompt(action.prompt)}
                className="h-16 justify-start gap-3 rounded-lg bg-sky-500/18 px-3 text-left text-[12px] hover:bg-sky-500/25"
                variant="outline"
                aria-label={`${action.label} car mode prompt`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-sky-200/20 bg-secondary/30 text-sky-700 dark:text-sky-100">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 font-black leading-tight">
                  {action.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {carModePrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPrompt(prompt)}
            className="min-h-12 rounded-lg border border-border/45 bg-secondary/30 p-3 text-left text-[12px] leading-relaxed text-foreground/84 transition-colors hover:border-sky-200/30 hover:bg-sky-300/[0.06]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </section>
  );
}
