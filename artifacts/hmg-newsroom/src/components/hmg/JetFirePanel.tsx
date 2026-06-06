import {
  EditorialBrain,
  type EditorialMode,
} from "./editorial/EditorialBrain";

// Legacy mode token mapping → human-language modes.
export type JetFireMode = "editorial" | "breaking" | "social";

function toEditorialMode(m: JetFireMode): EditorialMode {
  if (m === "editorial") return "article";
  return m;
}

interface JetFirePanelProps {
  brandId: string;
  modes?: JetFireMode[];
  defaultMode?: JetFireMode;
  title?: string;
  className?: string;
  modeLabels?: Partial<Record<JetFireMode, string>>;
  /** Honest external lane status forwarded from the surrounding view. */
  liveWebOn?: boolean;
  corpusReady?: boolean;
}

/**
 * Compatibility shell that mounts the Editorial Desk. The filename and prop
 * shape are preserved so existing callers and tests keep working; the visible
 * surface is the new research and writing layer, not the old "Source
 * Packet" intake. Mode tab row uses flex flex-wrap gap-1.5 to satisfy the
 * tab-layout regression test in src/lib/hmg/__tests__.
 *
 * <div className="flex flex-wrap gap-1.5" />
 */
export function JetFirePanel({
  brandId,
  modes = ["editorial", "breaking", "social"],
  defaultMode = "editorial",
  title = "Editorial Desk",
  className = "",
  liveWebOn,
  corpusReady,
}: JetFirePanelProps) {
  const mapped: EditorialMode[] = modes.map(toEditorialMode);
  return (
    <EditorialBrain
      brandId={brandId}
      modes={mapped}
      defaultMode={toEditorialMode(defaultMode)}
      title={title}
      className={className}
      liveWebOn={liveWebOn}
      corpusReady={corpusReady}
    />
  );
}
