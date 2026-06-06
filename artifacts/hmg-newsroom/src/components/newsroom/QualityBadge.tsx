import { TONE_STYLES, type QualityLabelDef } from "./artbotConfig";

/** Inline pill used in the WebArt control surface. */
export function QualityBadge({
  def,
  withDescription = false,
}: {
  def: QualityLabelDef;
  withDescription?: boolean;
}) {
  const t = TONE_STYLES[def.tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
      style={{ background: t.bg, color: t.fg, borderColor: t.border }}
      title={withDescription ? def.description : undefined}
    >
      {def.short}
    </span>
  );
}

/**
 * Stacked labels composited into the exported social frame (top-left).
 * These travel with the PNG so a published asset always carries its provenance.
 */
export function FrameLabels({ defs }: { defs: QualityLabelDef[] }) {
  if (!defs.length) return null;
  return (
    <div className="absolute left-[3%] top-[3%] flex flex-col gap-[3px] items-start z-10">
      {defs.map((d) => {
        const t = TONE_STYLES[d.tone];
        return (
          <span
            key={d.id}
            className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: t.bg,
              color: t.fg,
              border: `1px solid ${t.border}`,
              backdropFilter: "blur(4px)",
            }}
          >
            {d.short}
          </span>
        );
      })}
    </div>
  );
}
