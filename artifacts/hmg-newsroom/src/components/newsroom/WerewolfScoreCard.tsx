import { useEffect, useState } from "react";
import { computeWerewolfScore, type WerewolfBand } from "@/lib/werewolfScore";

const BAND_STYLE: Record<
  WerewolfBand,
  { dot: string; ring: string; label: string; copy: string }
> = {
  "Full Moon": {
    dot: "bg-emerald-400",
    ring: "ring-emerald-400/40",
    label: "Full Moon",
    copy: "Apex throughput. Create safely.",
  },
  Alpha: {
    dot: "bg-emerald-300",
    ring: "ring-emerald-300/40",
    label: "Alpha",
    copy: "Strong. Headroom for everything.",
  },
  Hunting: {
    dot: "bg-amber-300",
    ring: "ring-amber-300/40",
    label: "Hunting",
    copy: "Healthy. Watch latency.",
  },
  Awake: {
    dot: "bg-orange-400",
    ring: "ring-orange-400/40",
    label: "Awake",
    copy: "Slowing. Throttling started.",
  },
  Sleeping: {
    dot: "bg-rose-500",
    ring: "ring-rose-500/40",
    label: "Sleeping",
    copy: "Cold / pressured. Defer heavy work.",
  },
};

export function WerewolfScoreCard() {
  const [snapshot, setSnapshot] = useState(() => computeWerewolfScore());

  useEffect(() => {
    const id = window.setInterval(() => {
      setSnapshot(computeWerewolfScore());
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const band = BAND_STYLE[snapshot.band];
  return (
    <section
      data-testid="commandcenter-werewolf-card"
      className="rounded-2xl border border-border bg-secondary/40 p-4 mb-3"
    >
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            data-testid="werewolf-band-dot"
            className={`inline-block w-2.5 h-2.5 rounded-full ring-2 ${band.dot} ${band.ring}`}
          />
          <h3 className="text-sm font-semibold tracking-tight">
            Werewolf Score
          </h3>
        </div>
        <span
          data-testid="werewolf-band-label"
          className="text-[11px] uppercase tracking-wider text-muted-foreground"
        >
          {band.label}
        </span>
      </header>

      <div className="flex items-baseline gap-3 mb-3">
        <div
          data-testid="werewolf-score-value"
          className="text-4xl font-semibold tabular-nums leading-none"
        >
          {snapshot.score}
        </div>
        <div className="text-xs text-muted-foreground">/ 100</div>
      </div>

      <p
        data-testid="werewolf-score-hint"
        className="text-xs text-muted-foreground mb-3"
      >
        {band.copy} {snapshot.hint}
      </p>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground tabular-nums">
        {(
          [
            ["queueHealth", "queue"],
            ["breakerHealth", "breakers"],
            ["latencyHealth", "ai latency"],
            ["cacheHealth", "cache"],
            ["retryHealth", "retries"],
            ["storageHealth", "storage"],
            ["memoryHealth", "memory"],
            ["backpressureHealth", "backpressure"],
          ] as const
        ).map(([key, label]) => {
          const v = snapshot.components[key];
          const tone =
            v >= 80
              ? "text-emerald-300"
              : v >= 55
                ? "text-amber-300"
                : v >= 30
                  ? "text-orange-400"
                  : "text-rose-400";
          return (
            <li
              key={key}
              data-testid={`werewolf-component-${key}`}
              className="flex items-center justify-between"
            >
              <span>{label}</span>
              <span className={tone}>{v}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
