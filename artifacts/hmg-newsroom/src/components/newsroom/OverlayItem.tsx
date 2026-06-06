import {
  memo,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react";
import { ImageUp } from "lucide-react";
import { fontStack, overlayDef, type Overlay } from "./artbotOverlays";

interface OverlayItemProps {
  overlay: Overlay;
  selected: boolean;
  /** True while exporting — hides all editing chrome from the PNG. */
  exporting: boolean;
  /** Active silo brand — drives brand-coloured overlay treatments. */
  brand: { color: string; on: string };
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<Overlay>) => void;
  /** Image overlays request an upload when their body is tapped. */
  onRequestImage: (id: string) => void;
}

const MIN_FRAC = 0.08;

/**
 * Memoized so dragging or resizing one overlay only re-renders that overlay —
 * not every sibling — even though a drag fires a patch on every pointer move.
 * Requires the parent to pass stable (useCallback) onSelect/onChange/onRequestImage.
 */
export const OverlayItem = memo(function OverlayItem({
  overlay,
  selected,
  exporting,
  brand,
  onSelect,
  onChange,
  onRequestImage,
}: OverlayItemProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    mode: "move" | "resize";
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const def = overlayDef(overlay.type);

  function beginDrag(e: ReactPointerEvent, mode: "move" | "resize") {
    e.preventDefault();
    e.stopPropagation();
    onSelect(overlay.id);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragState.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origX: overlay.x,
      origY: overlay.y,
      origW: overlay.w,
      origH: overlay.h,
    };
  }

  function onMove(e: ReactPointerEvent) {
    const st = dragState.current;
    if (!st) return;
    // Geometry is relative to the overlay's positioning parent (the image
    // area), not the full stage — so vertical math stays correct regardless
    // of whether a top/bottom header band is present.
    const parent = rootRef.current?.offsetParent as HTMLElement | null;
    const rect = parent?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const dxFrac = (e.clientX - st.startX) / rect.width;
    const dyFrac = (e.clientY - st.startY) / rect.height;
    if (st.mode === "move") {
      const x = Math.min(Math.max(0, st.origX + dxFrac), 1 - st.origW);
      const y = Math.min(Math.max(0, st.origY + dyFrac), 1 - st.origH);
      onChange(overlay.id, { x, y });
    } else {
      const w = Math.min(Math.max(MIN_FRAC, st.origW + dxFrac), 1 - st.origX);
      const h = Math.min(Math.max(MIN_FRAC, st.origH + dyFrac), 1 - st.origY);
      onChange(overlay.id, { w, h });
    }
  }

  function endDrag(e: ReactPointerEvent) {
    dragState.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  if (overlay.hidden && !selected) {
    // hidden overlays are not rendered (and never exported)
    return null;
  }

  const showChrome = selected && !exporting;

  return (
    <div
      ref={rootRef}
      data-testid={`artbot-overlay-${overlay.type}`}
      onPointerDown={(e) => beginDrag(e, "move")}
      onPointerMove={onMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{
        position: "absolute",
        left: `${overlay.x * 100}%`,
        top: `${overlay.y * 100}%`,
        width: `${overlay.w * 100}%`,
        height: `${overlay.h * 100}%`,
        zIndex: 20 + overlay.z,
        cursor: "move",
        touchAction: "none",
        opacity: overlay.hidden ? 0.35 : 1,
        outline: showChrome ? "2px solid rgba(255,255,255,0.95)" : "none",
        outlineOffset: "2px",
        boxShadow: showChrome ? "0 0 0 4px rgba(0,0,0,0.35)" : undefined,
      }}
    >
      <div style={{ width: "100%", height: "100%", containerType: "inline-size" }}>
        <OverlayContent
          overlay={overlay}
          def={def}
          brand={brand}
          onRequestImage={() => onRequestImage(overlay.id)}
        />
      </div>

      {showChrome && (
        <div
          data-testid="artbot-overlay-resize"
          onPointerDown={(e) => beginDrag(e, "resize")}
          onPointerMove={onMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{
            position: "absolute",
            right: -7,
            bottom: -7,
            width: 16,
            height: 16,
            borderRadius: 4,
            background: "#fff",
            border: "2px solid #0a0a0a",
            cursor: "nwse-resize",
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
});

function OverlayContent({
  overlay,
  def,
  brand,
  onRequestImage,
}: {
  overlay: Overlay;
  def: ReturnType<typeof overlayDef>;
  brand: { color: string; on: string };
  onRequestImage: () => void;
}) {
  if (def.medium === "image") {
    if (!overlay.image) {
      return (
        <button
          type="button"
          onClick={onRequestImage}
          data-testid="artbot-overlay-add-image"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "6cqw",
            border: "2px dashed rgba(255,255,255,0.7)",
            borderRadius: "4cqw",
            background: "rgba(10,10,10,0.55)",
            color: "#fff",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            fontSize: "6cqw",
          }}
        >
          <ImageUp style={{ width: "14cqw", height: "14cqw" }} />
          {def.short}
        </button>
      );
    }
    return (
      <div
        onDoubleClick={onRequestImage}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "3cqw",
          overflow: "hidden",
          boxShadow: "0 6cqw 18cqw rgba(0,0,0,0.45)",
          background: "#000",
        }}
      >
        <img
          src={overlay.image}
          alt=""
          crossOrigin="anonymous"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  let card: ReactElement | null;
  switch (overlay.type) {
    case "x-post":
      card = <TweetCard overlay={overlay} />;
      break;
    case "comment":
      card = <CommentCard overlay={overlay} />;
      break;
    case "text-message":
      card = <TextMessageCard overlay={overlay} />;
      break;
    case "quote-card":
      card = <QuoteCard overlay={overlay} />;
      break;
    case "article-snippet":
      card = <ArticleSnippetCard overlay={overlay} />;
      break;
    case "breaking-badge":
      card = <BreakingBadge overlay={overlay} brand={brand} />;
      break;
    case "lower-third":
      card = <LowerThird overlay={overlay} brand={brand} />;
      break;
    case "source-label":
      card = <SourceLabel overlay={overlay} />;
      break;
    case "stat-chip":
      card = <StatChip overlay={overlay} brand={brand} />;
      break;
    case "logo-bug":
      card = <LogoBug overlay={overlay} brand={brand} />;
      break;
    default:
      card = null;
  }
  if (!card) return null;
  // Wrap text cards so the chosen font cascades into every nested element.
  return (
    <div style={{ width: "100%", height: "100%", fontFamily: fontStack(overlay.font) }}>
      {card}
    </div>
  );
}

const cardShadow = "0 6cqw 20cqw rgba(0,0,0,0.4)";

function TweetCard({ overlay }: { overlay: Overlay }) {
  const initial = (overlay.title || "X").trim().charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fff",
        borderRadius: "5cqw",
        boxShadow: cardShadow,
        padding: "6cqw",
        display: "flex",
        flexDirection: "column",
        gap: "3cqw",
        color: "#0f1419",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "4cqw" }}>
        <div
          style={{
            width: "14cqw",
            height: "14cqw",
            borderRadius: "50%",
            background: "#1d9bf0",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: "8cqw",
            flex: "0 0 auto",
          }}
        >
          {initial}
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span style={{ fontWeight: 800, fontSize: "6.5cqw", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {overlay.title || "Display Name"}
          </span>
          <span style={{ color: "#536471", fontSize: "5.5cqw", lineHeight: 1.1 }}>
            {overlay.subtitle || "@handle"}
          </span>
        </div>
      </div>
      <div style={{ fontSize: "6.5cqw", lineHeight: 1.3, fontWeight: 500, overflow: "hidden" }}>
        {overlay.body}
      </div>
    </div>
  );
}

function CommentCard({ overlay }: { overlay: Overlay }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fff",
        borderRadius: "5cqw",
        boxShadow: cardShadow,
        padding: "5cqw 6cqw",
        color: "#111",
        display: "flex",
        alignItems: "flex-start",
        gap: "3cqw",
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: "6cqw", lineHeight: 1.35 }}>
        <strong style={{ fontWeight: 800 }}>{overlay.title || "username"} </strong>
        {overlay.body}
      </span>
    </div>
  );
}

function TextMessageCard({ overlay }: { overlay: Overlay }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "92%",
          background: "#e5e5ea",
          color: "#000",
          borderRadius: "9cqw",
          padding: "4.5cqw 6cqw",
          fontSize: "6cqw",
          lineHeight: 1.3,
          boxShadow: cardShadow,
        }}
      >
        {overlay.body}
      </div>
    </div>
  );
}

function QuoteCard({ overlay }: { overlay: Overlay }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "rgba(10,10,10,0.82)",
        borderRadius: "4cqw",
        boxShadow: cardShadow,
        padding: "6cqw 7cqw",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "3cqw",
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: "9cqw", fontWeight: 900, lineHeight: 1.2 }}>
        “{overlay.body}”
      </span>
      <span style={{ fontSize: "5.5cqw", color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
        {overlay.subtitle || "— Source"}
      </span>
    </div>
  );
}

function ArticleSnippetCard({ overlay }: { overlay: Overlay }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fff",
        borderRadius: "4cqw",
        boxShadow: cardShadow,
        padding: "6cqw",
        color: "#111",
        display: "flex",
        flexDirection: "column",
        gap: "2.5cqw",
        overflow: "hidden",
      }}
    >
      {overlay.title && (
        <span
          style={{
            fontSize: "4.5cqw",
            fontWeight: 900,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#b91c1c",
          }}
        >
          {overlay.title}
        </span>
      )}
      <span style={{ fontSize: "7.5cqw", fontWeight: 900, lineHeight: 1.15 }}>
        {overlay.subtitle || "Headline goes here"}
      </span>
      <span style={{ fontSize: "5.5cqw", lineHeight: 1.35, color: "#333" }}>
        {overlay.body}
      </span>
    </div>
  );
}

function BreakingBadge({ overlay, brand }: { overlay: Overlay; brand: { color: string; on: string } }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: brand.color,
        color: brand.on,
        borderRadius: "2.5cqw",
        boxShadow: cardShadow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2cqw 4cqw",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontSize: "11cqw",
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          lineHeight: 1,
          textAlign: "center",
        }}
      >
        {overlay.title || "BREAKING"}
      </span>
    </div>
  );
}

function LowerThird({ overlay, brand }: { overlay: Overlay; brand: { color: string; on: string } }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow: cardShadow,
        borderRadius: "1.5cqw",
      }}
    >
      <div
        style={{
          background: brand.color,
          color: brand.on,
          padding: "3cqw 5cqw",
          fontSize: "8cqw",
          fontWeight: 900,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {overlay.title || "Name Here"}
      </div>
      <div
        style={{
          background: "rgba(10,10,10,0.9)",
          color: "#fff",
          padding: "2.5cqw 5cqw",
          fontSize: "5cqw",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {overlay.subtitle || "Role / handle"}
      </div>
    </div>
  );
}

function SourceLabel({ overlay }: { overlay: Overlay }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          background: "rgba(10,10,10,0.78)",
          color: "#fff",
          borderRadius: "10cqw",
          padding: "2.5cqw 5cqw",
          fontSize: "5cqw",
          fontWeight: 800,
          letterSpacing: "0.03em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
        }}
      >
        {overlay.body || "Source: @handle"}
      </span>
    </div>
  );
}

function StatChip({ overlay, brand }: { overlay: Overlay; brand: { color: string; on: string } }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "rgba(10,10,10,0.85)",
        borderRadius: "4cqw",
        boxShadow: cardShadow,
        border: `0.8cqw solid ${brand.color}`,
        padding: "4cqw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1cqw",
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: "16cqw", fontWeight: 900, lineHeight: 1, color: brand.color }}>
        {overlay.title || "100K"}
      </span>
      <span
        style={{
          fontSize: "5cqw",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "#fff",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {overlay.body || "streams in 24h"}
      </span>
    </div>
  );
}

function LogoBug({ overlay, brand }: { overlay: Overlay; brand: { color: string; on: string } }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          background: brand.color,
          color: brand.on,
          borderRadius: "10cqw",
          padding: "2.5cqw 5cqw",
          fontSize: "5.5cqw",
          fontWeight: 900,
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
          boxShadow: cardShadow,
        }}
      >
        {overlay.body || "@yourbrand"}
      </span>
    </div>
  );
}
