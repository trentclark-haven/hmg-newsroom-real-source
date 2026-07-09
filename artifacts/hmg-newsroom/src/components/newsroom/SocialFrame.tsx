import { useRef } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { FRAME_GEOMETRY, LOGO_ANCHOR, LOGO_OCCUPANCY } from "@/lib/brandFrames";
import { FrameLabels } from "./QualityBadge";
import type { QualityLabelDef } from "./artbotConfig";

export type FramePlatform =
  | "website"
  | "instagram-feed"
  | "instagram-story"
  | "tiktok"
  | "youtube-short"
  | "youtube-thumbnail"
  | "x"
  | "facebook";

export type FrameStyle = "border" | "solid";

interface FrameSpec {
  id: FramePlatform;
  label: string;
  shortLabel: string;
  ratio: string;
  pxWidth: number;
  pxHeight: number;
  thumbMaxWidth: number;
  isPortrait: boolean;
}

export const FRAMES: Record<FramePlatform, FrameSpec> = {
  website: {
    id: "website",
    label: "Website hero · 1200×670",
    shortLabel: "Website",
    ratio: "1200 / 670",
    pxWidth: 1200,
    pxHeight: 670,
    thumbMaxWidth: 360,
    isPortrait: false,
  },
  "instagram-feed": {
    id: "instagram-feed",
    label: "Instagram feed · 1080×1350",
    shortLabel: "IG feed",
    ratio: "1080 / 1350",
    pxWidth: 1080,
    pxHeight: 1350,
    thumbMaxWidth: 280,
    isPortrait: true,
  },
  "instagram-story": {
    id: "instagram-story",
    label: "Instagram story · 1080×1920",
    shortLabel: "IG story",
    ratio: "9 / 16",
    pxWidth: 1080,
    pxHeight: 1920,
    thumbMaxWidth: 240,
    isPortrait: true,
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok · 1080×1920",
    shortLabel: "TikTok",
    ratio: "9 / 16",
    pxWidth: 1080,
    pxHeight: 1920,
    thumbMaxWidth: 240,
    isPortrait: true,
  },
  "youtube-short": {
    id: "youtube-short",
    label: "YouTube Short · 1080×1920",
    shortLabel: "YT Short",
    ratio: "9 / 16",
    pxWidth: 1080,
    pxHeight: 1920,
    thumbMaxWidth: 240,
    isPortrait: true,
  },
  "youtube-thumbnail": {
    id: "youtube-thumbnail",
    label: "YouTube thumbnail · 1280×720",
    shortLabel: "YT thumb",
    ratio: "16 / 9",
    pxWidth: 1280,
    pxHeight: 720,
    thumbMaxWidth: 360,
    isPortrait: false,
  },
  x: {
    id: "x",
    label: "X / Twitter · 1600×900",
    shortLabel: "X",
    ratio: "16 / 9",
    pxWidth: 1600,
    pxHeight: 900,
    thumbMaxWidth: 360,
    isPortrait: false,
  },
  facebook: {
    id: "facebook",
    label: "Facebook · 1200×630",
    shortLabel: "Facebook",
    ratio: "1200 / 630",
    pxWidth: 1200,
    pxHeight: 630,
    thumbMaxWidth: 360,
    isPortrait: false,
  },
};

export const FRAME_PLATFORMS: FramePlatform[] = [
  "website",
  "instagram-feed",
  "instagram-story",
  "tiktok",
  "youtube-short",
  "youtube-thumbnail",
  "x",
  "facebook",
];

interface SocialFrameProps {
  platform: FramePlatform;
  style: FrameStyle;
  image: string;
  headline: string;
  brand: { color: string; on: string };
  siloName: string;
  filenamePrefix: string;
  /** Provenance/quality labels composited into the exported frame. */
  qualityLabels?: QualityLabelDef[];
  /** When true the AI-illustration disclosure is rendered into the exported frame. */
  showAiBadge?: boolean;
  /** When set, replaces the default headline-only caption position with a custom caption. */
  caption?: string;
  /** Optional brand logo rendered into proof/export frames. */
  logo?: string;
  /** Optional preview max width override used by proof pages. */
  maxWidth?: number;
  /** Legacy proof mode shows the old larger logo footprint. */
  logoMode?: "legacy" | "v2";
}

export function SocialFrame({
  platform,
  style,
  image,
  headline,
  brand,
  siloName,
  filenamePrefix,
  qualityLabels = [],
  showAiBadge = false,
  caption,
  logo,
  maxWidth,
  logoMode = "v2",
}: SocialFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const spec = FRAMES[platform];

  async function handleDownload() {
    if (!ref.current) return;
    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((nextBlob) => {
          if (nextBlob) resolve(nextBlob);
          else reject(new Error("png-blob-empty"));
        }, "image/png");
      });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${filenamePrefix}-${platform}-${style}.png`;
      link.href = href;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (err) {
      console.error("html2canvas export failed", err);
      toast.error("Frame export failed. Try regenerating the image.");
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/90">
            {spec.label}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-wider"
            style={{ color: brand.color }}
          >
            {style === "border" ? "Border style" : "Solid style"} · {siloName}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          data-testid={`artbot-export-${platform}`}
          data-testid-legacy={`frame-dl-${platform}-${style}`}
          className="h-7 text-[11px]"
        >
          <Download className="w-3 h-3 mr-1" />
          PNG
        </Button>
      </div>

      <div className="p-3 bg-secondary/40 flex items-center justify-center">
        <div
          ref={ref}
          className="relative overflow-hidden w-full"
          style={{
            aspectRatio: spec.ratio,
            maxWidth: maxWidth ?? spec.thumbMaxWidth,
            background: style === "solid" ? brand.color : "#0a0a0a",
          }}
        >
          {style === "border" ? (
            <BorderStyle
              image={image}
              headline={headline}
              brand={brand}
              qualityLabels={qualityLabels}
              showAiBadge={showAiBadge}
              caption={caption}
              platform={platform}
              logo={logo}
              logoMode={logoMode}
              siloName={siloName}
            />
          ) : (
            <SolidStyle
              image={image}
              headline={headline}
              brand={brand}
              qualityLabels={qualityLabels}
              showAiBadge={showAiBadge}
              caption={caption}
              platform={platform}
              logo={logo}
              logoMode={logoMode}
              siloName={siloName}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface InnerProps {
  image: string;
  headline: string;
  brand: { color: string; on: string };
  qualityLabels: QualityLabelDef[];
  showAiBadge: boolean;
  caption?: string;
  platform: FramePlatform;
  logo?: string;
  logoMode: "legacy" | "v2";
  siloName: string;
}

function AiBadge() {
  return (
    <div
      className="absolute right-[3%] top-[3%] text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded z-20"
      style={{
        background: "rgba(0,0,0,0.55)",
        color: "#ffffff",
        backdropFilter: "blur(4px)",
      }}
    >
      AI illustration
    </div>
  );
}

function LogoMark({
  platform,
  logo,
  logoMode,
}: {
  platform: FramePlatform;
  logo?: string;
  logoMode: "legacy" | "v2";
}) {
  if (!logo) return null;
  const widthPct =
    logoMode === "legacy" ? 18 : Math.round(LOGO_OCCUPANCY[platform] * 100);
  return (
    <img
      src={logo}
      alt=""
      className="absolute z-20 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
      crossOrigin="anonymous"
      style={{
        width: `${widthPct}%`,
        right: `${LOGO_ANCHOR.x * 100}%`,
        bottom: `${LOGO_ANCHOR.y * 100}%`,
        maxHeight: "18%",
      }}
    />
  );
}

function BrandWordmark({
  brand,
  logo,
  siloName,
}: {
  brand: { color: string; on: string };
  logo?: string;
  siloName: string;
}) {
  return (
    <div
      className="absolute z-20 left-[3%] bottom-[3%] flex items-center gap-1.5 rounded-sm px-1.5 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
      style={{
        background: brand.color,
        color: brand.on,
        maxWidth: "66%",
      }}
    >
      {logo && (
        <img
          src={logo}
          alt=""
          className="h-[10px] w-auto object-contain"
          crossOrigin="anonymous"
        />
      )}
      <span className="truncate text-[8px] font-black uppercase leading-none">
        {siloName}
      </span>
    </div>
  );
}

function BorderStyle({
  image,
  headline,
  brand,
  qualityLabels,
  showAiBadge,
  caption,
  platform,
  logo,
  logoMode,
  siloName,
}: InnerProps) {
  const borderPad = `${FRAME_GEOMETRY.borderWidthPct * 100}%`;
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        background: brand.color,
        padding: borderPad,
        gap: borderPad,
      }}
    >
      <div
        className="flex-1 overflow-hidden relative rounded-[2px]"
        style={{ background: "#0a0a0a" }}
      >
        <img
          src={image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        <FrameLabels defs={qualityLabels} />
        {showAiBadge && <AiBadge />}
        <BrandWordmark brand={brand} logo={logo} siloName={siloName} />
      </div>
      {(headline || caption) && (
        <div
          className="text-center font-black uppercase tracking-tight leading-tight flex items-center justify-center"
          style={{
            color: "#ffffff",
            flex: `0 0 ${FRAME_GEOMETRY.captionMinPct * 100}%`,
            background: "rgba(0,0,0,0.88)",
            borderTop: `2px solid ${brand.color}`,
            padding: "3%",
            fontSize: "clamp(11px, 4.4cqw, 28px)",
            containerType: "inline-size",
          }}
        >
          {caption ? caption : headline}
        </div>
      )}
      <LogoMark platform={platform} logo={logo} logoMode={logoMode} />
    </div>
  );
}

function SolidStyle({
  image,
  headline,
  brand,
  qualityLabels,
  showAiBadge,
  caption,
  platform,
  logo,
  logoMode,
  siloName,
}: InnerProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ background: brand.color, padding: "6%" }}
    >
      <div
        className="overflow-hidden relative"
        style={{
          flex: "0 0 62%",
          background: "#0a0a0a",
        }}
      >
        <img
          src={image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        <FrameLabels defs={qualityLabels} />
        {showAiBadge && <AiBadge />}
        <BrandWordmark brand={brand} logo={logo} siloName={siloName} />
      </div>
      <div
        className="flex-1 flex items-center justify-center text-center"
        style={{
          paddingTop: "5%",
          containerType: "inline-size",
        }}
      >
        <span
          className="font-black uppercase tracking-tight leading-[1.05]"
          style={{
            color: "#ffffff",
            fontSize: "clamp(13px, 6cqw, 38px)",
          }}
        >
          {caption || headline || "YOUR HEADLINE HERE"}
        </span>
      </div>
      <LogoMark platform={platform} logo={logo} logoMode={logoMode} />
    </div>
  );
}
