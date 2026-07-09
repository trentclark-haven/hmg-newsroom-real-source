/**
 * OPERATION ARRRUGGA — celebration toast.
 *
 * Subscribes to <CinematicProvider>'s active awooga slot and renders a
 * single tasteful toast at the top-center of the viewport. Auto-dismisses
 * after 1.6s. Layers above the page but never above modals or the
 * StageRibbon. Mounted once at the App root.
 *
 * Why not piggyback on sonner? Sonner toasts queue and stack; an awooga
 * is a one-shot, can-be-replaced event ("Frame locked." beats stale
 * "Story found." if both fire within 1s of each other).
 */

import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useCinematic } from "./CinematicProvider";
import { STAGE_DEFS } from "./cinematicPhases";

const DISPLAY_MS = 1_600;

export function AwoogaToast() {
  const cine = useCinematic();
  const evt = cine.awooga;

  useEffect(() => {
    if (!evt) return;
    const id = evt.id;
    const t = setTimeout(() => cine.consumeAwooga(id), DISPLAY_MS);
    return () => clearTimeout(t);
    // re-arm whenever the awooga id changes
  }, [evt?.id, cine]);

  if (!evt) return null;

  const def = evt.stage ? STAGE_DEFS[evt.stage] : null;
  const color = def?.color ?? "#FFFFFF";
  const icon = def?.icon ?? "✨";

  return (
    <div
      data-testid="arrugga-awooga-toast"
      data-stage={evt.stage ?? "neutral"}
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-14 -translate-x-1/2 z-50"
    >
      <div
        className="arrugga-burst inline-flex items-center gap-2 rounded-full border bg-secondary/85 backdrop-blur-md px-4 py-2"
        style={{
          borderColor: `${color}AA`,
          // Glow is a filter, not a shadow box, so it composites on the
          // GPU and never widens the layout box of the toast.
          filter: `drop-shadow(0 0 12px ${color}88) drop-shadow(0 4px 18px rgba(0,0,0,0.65))`,
        }}
      >
        <span
          aria-hidden
          className="text-base select-none"
          style={{ color }}
        >
          {icon}
        </span>
        <span
          className="text-sm font-black tracking-wide arrugga-shimmer-text"
          style={{ color }}
        >
          {evt.message}
        </span>
        <Sparkles className="w-3.5 h-3.5" style={{ color }} aria-hidden />
      </div>
    </div>
  );
}
