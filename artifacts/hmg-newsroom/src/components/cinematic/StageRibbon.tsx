/**
 * OPERATION ARRRUGGA — persistent CUT → CREATE → DISTRIBUTE strip.
 *
 * Mission-control style timeline that lives at the top of the app.
 * Hidden until the first phase has been begun in this session, then
 * stays mounted with a thin profile (h-9). Renders zero DOM cost
 * before activation so it does not affect the home-page first paint.
 */

import { useEffect, useState } from "react";
import { useCinematic } from "./CinematicProvider";
import { STAGES, STAGE_DEFS, type Stage } from "./cinematicPhases";

function fmtElapsed(ms: number): string {
  if (ms < 0) return "0s";
  if (ms < 1_000) return `${ms}ms`;
  const sec = ms / 1_000;
  if (sec < 60) return `${sec.toFixed(sec < 10 ? 1 : 0)}s`;
  const mm = Math.floor(sec / 60);
  const ss = Math.floor(sec % 60);
  return `${mm}m${ss.toString().padStart(2, "0")}s`;
}

function StageDot({
  stage,
  active,
  recent,
}: {
  stage: Stage;
  active: boolean;
  recent: { durationMs: number; status: "success" | "failure" } | null;
}) {
  const def = STAGE_DEFS[stage];
  const color = def.color;
  const labelClass = active
    ? "text-foreground arrugga-shimmer-text font-black"
    : recent?.status === "success"
      ? "text-foreground/80 font-bold"
      : recent?.status === "failure"
        ? "text-red-300/90 font-bold"
        : "text-muted-foreground/70 font-semibold";
  return (
    <div
      data-testid={`arrugga-stage-${stage}`}
      data-active={active ? "true" : "false"}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider transition-colors"
      style={{
        background: active ? `${color}1F` : "transparent",
        border: `1px solid ${active ? color : "hsl(var(--border) / 0.5)"}`,
        color: active ? color : undefined,
      }}
    >
      <span
        aria-hidden
        className={active ? "arrugga-pulse" : ""}
        style={{ color }}
      >
        {def.icon}
      </span>
      <span className={labelClass}>{def.label}</span>
      {recent && !active ? (
        <span
          className="text-[9px] opacity-70"
          title={`Last ${stage} run`}
        >
          · {fmtElapsed(recent.durationMs)}
        </span>
      ) : null}
    </div>
  );
}

export function StageRibbon() {
  const cine = useCinematic();
  const [tick, setTick] = useState(0);

  // Re-render once a second while a phase is in flight so the elapsed
  // counter stays live. Stops automatically when nothing is running so
  // we don't spin React for nothing.
  useEffect(() => {
    if (!cine.current) return;
    const i = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(i);
  }, [cine.current?.id]);
  void tick;

  // Hidden entirely until first activity in the session. This keeps the
  // home page visually identical to v1.6 for users who have not yet
  // touched any cross-system surface.
  const everUsed =
    cine.current !== null ||
    cine.history.length > 0 ||
    cine.totalAssets > 0 ||
    cine.cacheHits > 0;
  if (!everUsed) return null;

  const elapsedMs = cine.current ? Date.now() - cine.current.startedAt : 0;
  const lastByStage: Partial<Record<Stage, PhaseRow>> = {};
  for (const h of cine.history) {
    lastByStage[h.stage] = { durationMs: h.durationMs, status: h.status };
  }

  return (
    // Fixed-bottom overlay: the ribbon NEVER affects document flow, so
    // its appearance/disappearance triggers zero layout shift on the
    // page below. This satisfies the "no layout jumps" success criterion
    // even on first activation.
    <div
      data-testid="arrugga-stage-ribbon"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-secondary/80 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {cine.current ? (
        <div
          aria-hidden
          className="arrugga-ribbon-bar h-[2px] w-full"
          style={{ color: STAGE_DEFS[cine.current.stage].color }}
        />
      ) : null}
      <div
        className={
          "mx-auto max-w-[1400px] px-3 py-1.5 flex items-center gap-2 flex-wrap text-[10px]"
        }
      >
        <span
          className="font-black tracking-[0.2em] text-foreground/70"
          aria-label="cross-system pipeline"
        >
          PIPELINE
        </span>
        {STAGES.map((s, i) => (
          <span key={s} className="inline-flex items-center gap-2">
            <StageDot
              stage={s}
              active={cine.current?.stage === s}
              recent={lastByStage[s] ?? null}
            />
            {i < STAGES.length - 1 ? (
              <span aria-hidden className="text-muted-foreground/40">→</span>
            ) : null}
          </span>
        ))}
        <span className="ml-auto inline-flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          {cine.current ? (
            <span
              className="rounded-full border border-border/60 bg-secondary/40 px-2 py-0.5 font-bold"
              style={{ color: STAGE_DEFS[cine.current.stage].color }}
              data-testid="arrugga-active-elapsed"
            >
              {STAGE_DEFS[cine.current.stage].label} · {fmtElapsed(elapsedMs)}
            </span>
          ) : null}
          <span
            className="rounded-full border border-border/60 bg-secondary/30 px-2 py-0.5"
            title="Total assets produced this session"
            data-testid="arrugga-asset-count"
          >
            {cine.totalAssets} asset{cine.totalAssets === 1 ? "" : "s"}
          </span>
          {cine.cacheHits > 0 ? (
            <span
              className="rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 px-2 py-0.5 font-bold"
              title="Cache hits this session"
              data-testid="arrugga-cache-hits"
            >
              {cine.cacheHits} cache hit{cine.cacheHits === 1 ? "" : "s"}
            </span>
          ) : null}
          {cine.failures > 0 ? (
            <span
              className="rounded-full border border-red-500/40 bg-red-500/10 text-red-300 px-2 py-0.5 font-bold"
              title="Failed runs this session"
              data-testid="arrugga-failure-count"
            >
              {cine.failures} fail
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

interface PhaseRow {
  durationMs: number;
  status: "success" | "failure";
}
