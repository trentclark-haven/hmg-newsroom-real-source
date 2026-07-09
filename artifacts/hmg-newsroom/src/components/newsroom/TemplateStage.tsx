import { forwardRef } from "react";
import { FrameLabels } from "./QualityBadge";
import type { QualityLabelDef } from "./artbotConfig";
import type {
  TemplateFamily,
  ExportSize,
  FrameStyle,
  FrameAccentColor,
} from "./artbotTemplates";
import { OverlayItem } from "./OverlayItem";
import type { Overlay } from "./artbotOverlays";

interface TemplateStageProps {
  size: ExportSize;
  family: TemplateFamily;
  frameStyle: FrameStyle;
  image: string;
  headline: string;
  brand: { color: string; on: string };
  siloName: string;
  logo?: string;
  qualityLabels: QualityLabelDef[];
  overlays: Overlay[];
  selectedId: string | null;
  exporting: boolean;
  /** When true (and not exporting) draws safe-area + center guides over the image. */
  showGuides?: boolean;
  /** Preview width in CSS px the scaled canvas should fit within. */
  previewMaxWidth: number;
  onSelectOverlay: (id: string) => void;
  onChangeOverlay: (id: string, patch: Partial<Overlay>) => void;
  onRequestOverlayImage: (id: string) => void;
  onBackgroundClick: () => void;
}

/**
 * The fixed-pixel composition canvas. The inner node is rendered at the exact
 * export size and visually scaled down via a CSS transform on the wrapper, so
 * html2canvas captures the inner node at full resolution while the operator
 * sees a fit-to-width preview. All geometry is fractional / container-relative.
 */
export const TemplateStage = forwardRef<HTMLDivElement, TemplateStageProps>(
  function TemplateStage(
    {
      size,
      family,
      frameStyle,
      image,
      headline,
      brand,
      siloName,
      logo,
      qualityLabels,
      overlays,
      selectedId,
      exporting,
      showGuides,
      previewMaxWidth,
      onSelectOverlay,
      onChangeOverlay,
      onRequestOverlayImage,
      onBackgroundClick,
    },
    ref,
  ) {
    const scale = Math.min(1, previewMaxWidth / size.width);
    const headerBg = family.backdrop === "brand" ? brand.color : "#ffffff";
    const headerColor = "#000000";
    const headerHeightPct = size.headerFrac * 100;
    const headerOnTop = family.position === "top";

    // ---- premium frame-style treatment (sized in px from the export width so
    // it renders identically at every canvas size) ----
    const resolveAccent = (c: FrameAccentColor): string =>
      c === "brand" ? brand.color : c === "white" ? "#ffffff" : "#000000";
    const borderPx = (frameStyle.borderPct / 100) * size.width;
    const mattePx = (frameStyle.mattePct / 100) * size.width;
    const accentPx = (frameStyle.accentPct / 100) * size.width;
    const borderColor = resolveAccent(frameStyle.borderColor);
    const matteColor = resolveAccent(frameStyle.matteColor);
    const accentColor = resolveAccent(frameStyle.accentColor);
    const cornerColor = resolveAccent(frameStyle.cornerColor);

    const scrimGradient =
      frameStyle.scrim === "bottom"
        ? "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 42%)"
        : frameStyle.scrim === "top"
          ? "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 42%)"
          : frameStyle.scrim === "full"
            ? "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.55) 100%)"
            : null;

    const headerBand = (
      <div
        style={{
          height: `${headerHeightPct}%`,
          width: "100%",
          background: headerBg,
          color: headerColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 6%",
          containerType: "inline-size",
          flex: "0 0 auto",
        }}
      >
        <span
          style={{
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            lineHeight: 1.05,
            textAlign: "center",
            fontSize: "6.5cqw",
            color: headerColor,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {headline || "YOUR HEADLINE HERE"}
        </span>
      </div>
    );

    return (
      <div
        style={{
          width: size.width * scale,
          height: size.height * scale,
          overflow: "hidden",
          flex: "0 0 auto",
        }}
      >
        <div
          ref={ref}
          data-testid="artbot-template-stage"
          onPointerDown={onBackgroundClick}
          style={{
            width: size.width,
            height: size.height,
            boxSizing: "border-box",
            border: borderPx > 0 ? `${borderPx}px solid ${borderColor}` : undefined,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "relative",
            background: "#0a0a0a",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {headerOnTop && headerBand}

          {/* Image area (fills remaining space). Overlays + labels live here. */}
          <div
            style={{
              position: "relative",
              flex: "1 1 auto",
              overflow: "hidden",
              background: mattePx > 0 ? matteColor : "#0a0a0a",
            }}
          >
            <img
              src={image}
              alt=""
              crossOrigin="anonymous"
              style={{
                position: "absolute",
                inset: mattePx,
                width: `calc(100% - ${mattePx * 2}px)`,
                height: `calc(100% - ${mattePx * 2}px)`,
                objectFit: "cover",
              }}
            />
            {scrimGradient && (
              <div
                aria-hidden
                style={{ position: "absolute", inset: mattePx, background: scrimGradient, zIndex: 10 }}
              />
            )}
            {frameStyle.accentEdge !== "none" && accentPx > 0 && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  background: accentColor,
                  zIndex: 13,
                  ...(frameStyle.accentEdge === "bottom"
                    ? { left: 0, right: 0, bottom: 0, height: accentPx }
                    : frameStyle.accentEdge === "top"
                      ? { left: 0, right: 0, top: 0, height: accentPx }
                      : frameStyle.accentEdge === "left"
                        ? { top: 0, bottom: 0, left: 0, width: accentPx }
                        : { top: 0, bottom: 0, right: 0, width: accentPx }),
                }}
              />
            )}
            {frameStyle.cornerFlash && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: -size.width * 0.16,
                  left: -size.width * 0.16,
                  width: size.width * 0.32,
                  height: size.width * 0.32,
                  background: cornerColor,
                  transform: "rotate(45deg)",
                  zIndex: 13,
                }}
              />
            )}
            <FrameLabels defs={qualityLabels} />
            {logo && (
              <div
                style={{
                  position: "absolute",
                  right: "3%",
                  top: "3%",
                  width: "20%",
                  padding: "1.4%",
                  borderRadius: 6,
                  background: "rgba(0,0,0,0.42)",
                  zIndex: 12,
                }}
              >
                <img
                  src={logo}
                  alt=""
                  crossOrigin="anonymous"
                  style={{ width: "100%", height: "auto", objectFit: "contain", display: "block" }}
                />
              </div>
            )}

            {showGuides && !exporting && (
              <div
                data-testid="artbot-safe-guides"
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 19,
                  pointerEvents: "none",
                }}
              >
                {/* Safe-area frame (5% inset) */}
                <div
                  style={{
                    position: "absolute",
                    inset: "5%",
                    border: "1.5px dashed rgba(255,255,255,0.55)",
                    borderRadius: 2,
                  }}
                />
                {/* Vertical center line */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: "rgba(255,255,255,0.35)",
                  }}
                />
                {/* Horizontal center line */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    right: 0,
                    height: 1,
                    background: "rgba(255,255,255,0.35)",
                  }}
                />
              </div>
            )}

            {overlays.map((ov) => (
              <OverlayItem
                key={ov.id}
                overlay={ov}
                selected={ov.id === selectedId}
                exporting={exporting}
                brand={brand}
                onSelect={onSelectOverlay}
                onChange={onChangeOverlay}
                onRequestImage={onRequestOverlayImage}
              />
            ))}
          </div>

          {!headerOnTop && headerBand}
        </div>
      </div>
    );
  },
);
