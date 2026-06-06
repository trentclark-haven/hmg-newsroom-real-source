import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  derivePresenceState,
  presenceModeOptions,
  type MaximillionPresenceMode,
  type MaximillionPresenceState,
} from "@/components/newsroom/sales/mockMaximillionV7Data";
import { Clock, Radar, Sparkles } from "lucide-react";

interface MaximillionPresenceCenterProps {
  chatActivityCount: number;
  activeSurface: "chat" | "voice" | "car" | "night" | "memory";
  onPresenceChange: (presence: MaximillionPresenceState) => void;
  onManualModeChange: (mode: MaximillionPresenceMode) => void;
}

export function MaximillionPresenceCenter({
  chatActivityCount,
  activeSurface,
  onPresenceChange,
  onManualModeChange,
}: MaximillionPresenceCenterProps) {
  const [now, setNow] = useState(() => new Date());
  const [manualMode, setManualMode] = useState<MaximillionPresenceMode | null>(
    null,
  );
  const presence = useMemo(() => {
    const derived = derivePresenceState({ now, chatActivityCount, activeSurface });
    if (!manualMode) return derived;
    const option = presenceModeOptions.find((item) => item.id === manualMode);
    return {
      ...derived,
      mode: manualMode,
      label: option?.label ?? derived.label,
      status: option?.label ?? derived.status,
      reason: option?.description ?? derived.reason,
    };
  }, [activeSurface, chatActivityCount, manualMode, now]);

  useEffect(() => {
    onPresenceChange(presence);
  }, [onPresenceChange, presence]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="rounded-lg border border-sky-300/20 bg-secondary/35 p-3 overflow-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sky-700 dark:text-sky-100">
            <Radar className="h-4 w-4" />
            <h3 className="text-sm font-black">Executive Presence Mode</h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Local status rotates from time of day, chat activity, active module,
            and calendar season. No autonomous work is being claimed.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-sky-200/15 bg-sky-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-100">
          <Clock className="h-3.5 w-3.5" />
          {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-emerald-300/15 bg-emerald-400/[0.08] p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
              Current status
            </div>
            <div className="mt-1 text-base font-black leading-tight text-foreground">
              {presence.status}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              {presence.reason}
            </p>
          </div>
          <span
            className={`relative mt-1 flex h-3 w-3 shrink-0 ${
              presence.intensity === "high" ? "scale-125" : ""
            }`}
            aria-hidden="true"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-300" />
          </span>
        </div>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {presenceModeOptions.map((mode) => (
          <Button
            key={mode.id}
            type="button"
            size="sm"
            variant={presence.mode === mode.id ? "default" : "outline"}
            onClick={() => {
              setManualMode(mode.id);
              onManualModeChange(mode.id);
            }}
            className="h-10 shrink-0 px-3 text-[11px]"
            title={mode.description}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {mode.label}
          </Button>
        ))}
      </div>

      <div className="mt-3 rounded-md border border-border/40 bg-secondary/25 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
        Calendar season: {presence.calendarSignal}
      </div>
    </section>
  );
}
