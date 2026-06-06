/**
 * OPERATION ARRRUGGA — branded phase panel.
 *
 * Replaces a generic "Loading…" with a stage-themed panel that cycles
 * through meaningful progress phrases every 1.4s. Designed to be
 * dropped inline inside any view that has a long-running async
 * operation. Returns null when not pending so callers can render it
 * unconditionally.
 *
 *   <PhasePanel stage="create" active={isLoading} headline="Creating" />
 */

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { STAGE_DEFS, phraseForTick, type Stage } from "./cinematicPhases";

export interface PhasePanelProps {
  stage: Stage;
  active: boolean;
  /** Optional override for the cycling progress lines (e.g. live SSE). */
  hud?: string | null;
  /** Optional headline shown above the cycling phrase. */
  headline?: string | null;
  /** Compact variant for inline buttons / chips. */
  compact?: boolean;
  /** Custom test id suffix. */
  testId?: string;
}

const TICK_MS = 1_400;

export function PhasePanel({
  stage,
  active,
  hud,
  headline,
  compact,
  testId,
}: PhasePanelProps) {
  const [tick, setTick] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!active) return;
    const t0 = Date.now();
    setElapsedMs(0);
    const phraseI = setInterval(() => setTick((t) => t + 1), TICK_MS);
    const elapsedI = setInterval(() => setElapsedMs(Date.now() - t0), 250);
    return () => {
      clearInterval(phraseI);
      clearInterval(elapsedI);
    };
  }, [active]);

  const def = STAGE_DEFS[stage];
  const phrase = useMemo(
    () => hud ?? phraseForTick(stage, tick),
    [hud, stage, tick],
  );

  if (!active) return null;

  const showElapsed = elapsedMs >= 2_000; // never advertise sub-2s waits

  if (compact) {
    return (
      <span
        data-testid={testId ?? `arrugga-phase-compact-${stage}`}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium"
        style={{ color: def.color }}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="arrugga-shimmer-text font-bold">{phrase}</span>
        {showElapsed ? (
          <span className="text-muted-foreground/70 text-[10px]">
            · {(elapsedMs / 1000).toFixed(1)}s
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <div
      data-testid={testId ?? `arrugga-phase-panel-${stage}`}
      className="rounded-xl border bg-secondary/40 backdrop-blur-md px-4 py-3 flex items-center gap-3"
      style={{ borderColor: `${def.color}55` }}
    >
      <span
        aria-hidden
        className="arrugga-pulse text-2xl select-none"
        style={{ color: def.color }}
      >
        {def.icon}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="text-[10px] uppercase tracking-[0.2em] font-black"
          style={{ color: def.color }}
        >
          {def.label} · {headline ?? def.hero}
        </div>
        <div
          key={phrase}
          className="text-sm font-semibold mt-0.5 arrugga-headline-sweep arrugga-shimmer-text"
          style={{ color: def.color }}
        >
          {phrase}…
        </div>
      </div>
      <div className="text-right shrink-0">
        <Loader2
          className="w-4 h-4 animate-spin inline-block"
          style={{ color: def.color }}
        />
        {showElapsed ? (
          <div className="text-[10px] mt-1 text-muted-foreground tabular-nums">
            {(elapsedMs / 1000).toFixed(1)}s
          </div>
        ) : null}
      </div>
    </div>
  );
}
