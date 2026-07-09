import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  CheckCircle2,
  Copy,
  Crosshair,
  Download,
  Eye,
  EyeOff,
  Layers,
  LayoutTemplate,
  Library,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { recordAudit } from "@/lib/auditLog";
import { MEDIA_LIMITS, formatBytes } from "@/lib/mediaLimits";
import type { QualityLabelDef } from "./artbotConfig";
import {
  EXPORT_SIZES,
  FRAME_STYLES,
  TEMPLATE_FAMILIES,
  TEMPLATE_STARTERS,
  familyById,
  frameStyleById,
  presetForSilo,
  sizeById,
  type ExportSize,
  type FrameAccentColor,
  type FrameStyle,
  type TemplateStarter,
} from "./artbotTemplates";
import {
  instantiateFrameOverlays,
  useFrameLibrary,
  type SavedFrame,
} from "./artbotFrames";
import {
  OVERLAY_FONTS,
  OVERLAY_TYPES,
  makeOverlay,
  overlayDef,
  overlayFromBank,
  useOverlayBank,
  type BankedOverlay,
  type Overlay,
  type OverlayFontId,
  type OverlayType,
} from "./artbotOverlays";
import { TemplateStage } from "./TemplateStage";

interface TemplateStudioProps {
  silo: string;
  image: string;
  headline: string;
  brand: { color: string; on: string };
  siloName: string;
  logo?: string;
  qualityLabels: QualityLabelDef[];
  /** Applying a saved frame can restore its headline into the parent editor. */
  onRestoreHeadline?: (headline: string) => void;
  /**
   * Lets a parent (e.g. WebArt's Universal Media Source) inject an image as a
   * live overlay. The parent receives an injector fn it can call with a data URL.
   */
  registerImageInjector?: (fn: (dataUrl: string) => void) => void;
}

const PREVIEW_MAX_WIDTH = 300;

function nextFrame(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

export function TemplateStudio({
  silo,
  image,
  headline,
  brand,
  siloName,
  logo,
  qualityLabels,
  onRestoreHeadline,
  registerImageInjector,
}: TemplateStudioProps) {
  const preset = presetForSilo(silo);
  const [familyId, setFamilyId] = useState<string>(preset.family);
  const [frameStyleId, setFrameStyleId] = useState<string>(preset.frame);
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>(preset.sizes);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGuides, setShowGuides] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSizeId, setExportSizeId] = useState<string | null>(null);
  const [frameName, setFrameName] = useState("");
  const [starterId, setStarterId] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<{
    count: number;
    fileName: string;
    dims: string;
    frameLabel: string;
    overlays: number;
    at: number;
  } | null>(null);

  const bank = useOverlayBank();
  const library = useFrameLibrary();
  const exportRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingImageId = useRef<string | null>(null);

  const family = familyById(familyId);
  const frameStyle = frameStyleById(frameStyleId);
  const previewSize = useMemo(
    () => sizeById(selectedSizeIds[0] ?? EXPORT_SIZES[0].id),
    [selectedSizeIds],
  );
  const selected = overlays.find((o) => o.id === selectedId) ?? null;
  const topZ = overlays.reduce((m, o) => Math.max(m, o.z), 0);

  function applyBrandPreset() {
    const p = presetForSilo(silo);
    setFamilyId(p.family);
    setFrameStyleId(p.frame);
    setSelectedSizeIds(p.sizes);
    setStarterId(null);
    toast.message(`${siloName} template preset applied`);
  }

  // One-click starter — bundles header family + frame style + sizes. Brand
  // colour/logo always come from the active silo, so a starter works everywhere.
  function applyStarter(s: TemplateStarter) {
    setFamilyId(s.family);
    setFrameStyleId(s.frame);
    setSelectedSizeIds(s.sizes.length ? [...s.sizes] : selectedSizeIds);
    setStarterId(s.id);
    toast.success(`${s.label} starter applied`);
  }

  // Apply a full saved frame onto the CURRENT image (frames are layouts, not photos).
  function applyFrame(frame: SavedFrame) {
    setFamilyId(frame.familyId);
    setFrameStyleId(frame.frameStyleId);
    setSelectedSizeIds(frame.sizeIds.length ? [...frame.sizeIds] : selectedSizeIds);
    setOverlays(instantiateFrameOverlays(frame));
    setSelectedId(null);
    if (frame.headline && onRestoreHeadline) onRestoreHeadline(frame.headline);
    toast.success(`Frame “${frame.name}” applied`);
  }

  function saveCurrentFrame() {
    const name = frameName.trim();
    if (!name) {
      toast.error("Name your frame first.");
      return;
    }
    const ok = library.save({
      name,
      silo,
      familyId,
      frameStyleId,
      sizeIds: selectedSizeIds,
      headline,
      overlays,
    });
    if (ok) {
      setFrameName("");
      toast.success(`Frame “${name}” saved to library`);
    } else {
      toast.error("Couldn't save frame — library storage is full.");
    }
  }

  function toggleSize(id: string) {
    setSelectedSizeIds((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((x) => x !== id)
          : prev
        : [...prev, id],
    );
  }

  // ---- overlay lifecycle ----
  function insertOverlay(type: OverlayType) {
    const ov = makeOverlay(type, topZ);
    setOverlays((prev) => [...prev, ov]);
    setSelectedId(ov.id);
    if (overlayDef(type).medium === "image") {
      pendingImageId.current = ov.id;
      fileRef.current?.click();
    }
  }

  /** Inject an already-loaded image (data URL) directly as an image overlay. */
  const injectImageOverlay = useCallback((dataUrl: string) => {
    setOverlays((prev) => {
      const tz = prev.reduce((m, o) => Math.max(m, o.z), 0);
      const ov = { ...makeOverlay("screengrab", tz), image: dataUrl };
      queueMicrotask(() => setSelectedId(ov.id));
      return [...prev, ov];
    });
    toast.message("Image added as overlay");
  }, []);

  useEffect(() => {
    registerImageInjector?.(injectImageOverlay);
  }, [registerImageInjector, injectImageOverlay]);

  // Memoized so OverlayItem (React.memo) doesn't re-render every sibling on each
  // pointer-move during a drag.
  const patchOverlay = useCallback((id: string, patch: Partial<Overlay>) => {
    setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  function removeOverlay(id: string) {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function duplicateOverlay(id: string) {
    const src = overlays.find((o) => o.id === id);
    if (!src) return;
    const copy = makeOverlay(src.type, topZ);
    copy.title = src.title;
    copy.subtitle = src.subtitle;
    copy.body = src.body;
    copy.image = src.image;
    copy.w = src.w;
    copy.h = src.h;
    copy.x = Math.min(0.9, src.x + 0.04);
    copy.y = Math.min(0.9, src.y + 0.04);
    setOverlays((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  }

  // Move an overlay one step forward/backward by swapping its z with the
  // adjacent neighbour in the stack — true stepwise reordering (no z drift).
  function layer(id: string, dir: "forward" | "backward") {
    setOverlays((prev) => {
      const sorted = [...prev].sort((a, b) => a.z - b.z);
      const idx = sorted.findIndex((o) => o.id === id);
      if (idx === -1) return prev;
      const swapIdx = dir === "forward" ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const me = sorted[idx];
      const other = sorted[swapIdx];
      return prev.map((o) => {
        if (o.id === me.id) return { ...o, z: other.z };
        if (o.id === other.id) return { ...o, z: me.z };
        return o;
      });
    });
  }

  // Snap the selected overlay to a position relative to the canvas / safe area.
  function alignSelected(action: AlignAction) {
    const o = selected;
    if (!o) return;
    const m = 0.05; // 5% safe-area margin
    switch (action) {
      case "left":
        patchOverlay(o.id, { x: m });
        break;
      case "hcenter":
        patchOverlay(o.id, { x: Math.max(0, (1 - o.w) / 2) });
        break;
      case "right":
        patchOverlay(o.id, { x: Math.max(0, 1 - m - o.w) });
        break;
      case "top":
        patchOverlay(o.id, { y: m });
        break;
      case "vmiddle":
        patchOverlay(o.id, { y: Math.max(0, (1 - o.h) / 2) });
        break;
      case "bottom":
        patchOverlay(o.id, { y: Math.max(0, 1 - m - o.h) });
        break;
      case "center":
        patchOverlay(o.id, {
          x: Math.max(0, (1 - o.w) / 2),
          y: Math.max(0, (1 - o.h) / 2),
        });
        break;
      case "fit": {
        const x = Math.min(Math.max(o.x, m), Math.max(m, 1 - m - o.w));
        const y = Math.min(Math.max(o.y, m), Math.max(m, 1 - m - o.h));
        patchOverlay(o.id, { x, y });
        break;
      }
    }
  }

  function clearOverlays() {
    if (!overlays.length) return;
    setOverlays([]);
    setSelectedId(null);
    toast.message("Overlays cleared");
  }

  const requestOverlayImage = useCallback((id: string) => {
    pendingImageId.current = id;
    fileRef.current?.click();
  }, []);

  function onOverlayFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const id = pendingImageId.current;
    pendingImageId.current = null;
    if (!file || !id) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Overlay must be an image.");
      return;
    }
    if (file.size > MEDIA_LIMITS.imageMaxBytes) {
      toast.error(`Image too large (${formatBytes(MEDIA_LIMITS.imageMaxBytes)} max).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        patchOverlay(id, { image: reader.result });
      }
    };
    reader.readAsDataURL(file);
  }

  function storeSelected() {
    if (!selected) return;
    bank.store(selected);
    toast.success("Overlay saved to bank");
  }

  function reuseBanked(b: BankedOverlay) {
    const ov = overlayFromBank(b, topZ);
    setOverlays((prev) => [...prev, ov]);
    setSelectedId(ov.id);
    toast.message("Overlay added from bank");
  }

  // ---- export ----
  // Haven-standard export filename: brand-slug-template-WxH-YYYY-MM-DD.png
  function exportFileName(size: ExportSize): string {
    const date = new Date().toISOString().slice(0, 10);
    return `${silo}-${frameStyle.id}-${size.width}x${size.height}-${date}.png`;
  }

  async function exportSize(sizeId: string): Promise<string | null> {
    const size = sizeById(sizeId);
    setSelectedId(null);
    setExportSizeId(sizeId);
    setExporting(true);
    await nextFrame();
    await nextFrame();
    const node = exportRef.current;
    if (!node) {
      toast.error(`Export failed (${size.label}) — render surface unavailable.`);
      return null;
    }
    try {
      const canvas = await html2canvas(node, {
        backgroundColor: null,
        scale: 1,
        width: size.width,
        height: size.height,
        windowWidth: size.width,
        windowHeight: size.height,
        useCORS: true,
        logging: false,
      });
      const fileName = exportFileName(size);
      const link = document.createElement("a");
      link.download = fileName;
      link.href = canvas.toDataURL("image/png");
      link.click();
      recordAudit(
        "image-generated",
        silo,
        `WebArt export ${family.short} / ${frameStyle.label} ${size.width}x${size.height} (${overlays.length} overlay${overlays.length === 1 ? "" : "s"})`,
      );
      return fileName;
    } catch (err) {
      console.error("template export failed", err);
      toast.error(`Export failed (${size.label}) — try a smaller image or fewer overlays.`);
      return null;
    }
  }

  function recordReceipt(files: { name: string; size: ExportSize }[]) {
    if (!files.length) return;
    const last = files[files.length - 1];
    setLastExport({
      count: files.length,
      fileName: last.name,
      dims: `${last.size.width}×${last.size.height}`,
      frameLabel: frameStyle.label,
      overlays: overlays.length,
      at: Date.now(),
    });
  }

  async function exportAll() {
    if (!selectedSizeIds.length) return;
    const done: { name: string; size: ExportSize }[] = [];
    for (const id of selectedSizeIds) {
      const name = await exportSize(id);
      if (name) done.push({ name, size: sizeById(id) });
    }
    setExporting(false);
    setExportSizeId(null);
    const total = selectedSizeIds.length;
    if (done.length === 0) {
      setLastExport(null);
      toast.error(`Export failed — 0 of ${total} rendered`);
      return;
    }
    recordReceipt(done);
    if (done.length === total) {
      toast.success(`Exported ${done.length} size${done.length === 1 ? "" : "s"}`);
    } else {
      toast.warning(`Exported ${done.length} of ${total} — ${total - done.length} failed`);
    }
  }

  async function exportSingle(sizeId: string) {
    const name = await exportSize(sizeId);
    setExporting(false);
    setExportSizeId(null);
    if (name) {
      recordReceipt([{ name, size: sizeById(sizeId) }]);
      toast.success("Exported PNG");
    }
  }

  const exportSize_ = exportSizeId ? sizeById(exportSizeId) : previewSize;

  return (
    <div
      className="rounded-xl border border-border/60 bg-secondary/30 p-3 space-y-3"
      data-testid="artbot-template-studio"
    >
      <div
        className="flex items-center gap-2 rounded-lg border px-2.5 py-2"
        style={{ borderColor: `${brand.color}55`, background: `${brand.color}12` }}
      >
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
          style={{ background: brand.color, color: brand.on }}
        >
          <Layers className="w-3.5 h-3.5" />
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-black tracking-tight leading-none text-foreground">
            Preview Graphic
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
            Edit the template, choose sizes, then export visual outputs
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onOverlayFile}
        className="hidden"
        data-testid="artbot-overlay-file"
        aria-label="Upload overlay image"
      />

      {/* Quick starts — one-click family + frame + sizes */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-3 h-3 text-muted-foreground" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Add New
          </p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {TEMPLATE_STARTERS.map((s) => {
            const active = starterId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => applyStarter(s)}
                data-testid={`artbot-starter-${s.id}`}
                title={s.blurb}
                className={`shrink-0 text-left rounded-lg border px-2.5 py-1.5 transition-all ${
                  active
                    ? "border-transparent"
                    : "border-border/60 hover:border-border"
                }`}
                style={
                  active
                    ? { background: `${brand.color}1f`, outline: `2px solid ${brand.color}` }
                    : undefined
                }
              >
                <div className="text-[11px] font-bold text-foreground leading-tight whitespace-nowrap">
                  {s.label}
                </div>
                <div className="text-[9px] text-muted-foreground whitespace-nowrap">
                  {s.blurb}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Template family */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Template family
          </p>
          <button
            type="button"
            onClick={applyBrandPreset}
            data-testid="artbot-template-preset"
            className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 hover:text-foreground"
          >
            {siloName} preset
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {TEMPLATE_FAMILIES.map((f) => {
            const active = familyId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFamilyId(f.id);
                  setStarterId(null);
                }}
                data-testid={`artbot-family-${f.id}`}
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all ${
                  active
                    ? "border-transparent text-foreground"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
                style={active ? { background: brand.color, color: brand.on } : undefined}
              >
                {f.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame style — the premium look layered over the family */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <LayoutTemplate className="w-3 h-3 text-muted-foreground" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Frame style
          </p>
          <span className="text-[10px] font-bold text-foreground/70 truncate">
            · {frameStyle.label}
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {FRAME_STYLES.map((fs) => {
            const active = frameStyleId === fs.id;
            return (
              <button
                key={fs.id}
                type="button"
                onClick={() => {
                  setFrameStyleId(fs.id);
                  setStarterId(null);
                }}
                data-testid={`artbot-framestyle-${fs.id}`}
                title={fs.vibe}
                className="shrink-0 flex flex-col items-center gap-1 rounded-lg p-1 transition-all"
                style={{
                  background: active ? `${brand.color}1f` : "transparent",
                  outline: active ? `2px solid ${brand.color}` : "1px solid transparent",
                }}
              >
                <FrameStyleSwatch fs={fs} brand={brand} />
                <span
                  className={`text-[9px] font-bold uppercase tracking-tight leading-none w-[52px] text-center ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {fs.short}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground/80 mt-0.5">{frameStyle.vibe}</p>
      </div>

      {/* Export sizes */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          Export sizes ({selectedSizeIds.length} selected)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EXPORT_SIZES.map((s) => {
            const active = selectedSizeIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSize(s.id)}
                data-testid={`artbot-size-${s.width}x${s.height}`}
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all ${
                  active
                    ? "border-transparent text-foreground"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
                style={active ? { background: brand.color, color: brand.on } : undefined}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Insert overlay */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          Insert overlay
        </p>
        <div className="flex flex-wrap gap-1.5">
          {OVERLAY_TYPES.map((d) => (
            <button
              key={d.type}
              type="button"
              onClick={() => insertOverlay(d.type)}
              data-testid={`artbot-insert-${d.type}`}
              title={d.hint}
              className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              {d.short}
            </button>
          ))}
        </div>
      </div>

      {/* Currently applied — at-a-glance state of the composition */}
      <div
        className="rounded-lg border px-2.5 py-2"
        style={{ borderColor: `${brand.color}40`, background: `${brand.color}0d` }}
        data-testid="artbot-currently-applied"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <CheckCircle2 className="w-3 h-3" style={{ color: brand.color }} />
          <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
            Currently applied
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Brand</span>
            <span className="font-bold text-foreground truncate">{siloName}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Header</span>
            <span className="font-bold text-foreground truncate">{family.short}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Frame</span>
            <span className="font-bold text-foreground truncate">{frameStyle.label}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Sizes</span>
            <span className="font-bold text-foreground">{selectedSizeIds.length}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Overlays</span>
            <span className="font-bold text-foreground">{overlays.length}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Export</span>
            <span className="font-bold text-foreground">PNG</span>
          </div>
        </div>
      </div>

      {/* Stage preview */}
      <div className="flex flex-col items-center gap-2 pt-1">
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Preview · {previewSize.label}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowGuides((v) => !v)}
              data-testid="artbot-toggle-guides"
              aria-pressed={showGuides}
              className="text-[10px] font-bold uppercase tracking-wider hover:text-foreground inline-flex items-center gap-1"
              style={{ color: showGuides ? brand.color : undefined }}
            >
              <Crosshair className="w-3 h-3" />
              Guides
            </button>
            {overlays.length > 0 && (
              <button
                type="button"
                onClick={clearOverlays}
                data-testid="artbot-clear-overlays"
                className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear overlays
              </button>
            )}
          </div>
        </div>
        <TemplateStage
          size={previewSize}
          family={family}
          frameStyle={frameStyle}
          image={image}
          headline={headline}
          brand={brand}
          siloName={siloName}
          logo={logo}
          qualityLabels={qualityLabels}
          overlays={overlays}
          selectedId={selectedId}
          exporting={false}
          showGuides={showGuides}
          previewMaxWidth={PREVIEW_MAX_WIDTH}
          onSelectOverlay={setSelectedId}
          onChangeOverlay={patchOverlay}
          onRequestOverlayImage={requestOverlayImage}
          onBackgroundClick={() => setSelectedId(null)}
        />
        <p className="text-[10px] text-muted-foreground text-center">
          Tap an overlay to select · drag to move · drag the corner to resize
        </p>
      </div>

      {/* Selected overlay editor */}
      {selected && (
        <SelectedOverlayEditor
          overlay={selected}
          brandColor={brand.color}
          brandOn={brand.on}
          onChange={(patch) => patchOverlay(selected.id, patch)}
          onDuplicate={() => duplicateOverlay(selected.id)}
          onRemove={() => removeOverlay(selected.id)}
          onAlign={alignSelected}
          onLayer={(dir) => layer(selected.id, dir)}
          onToggleHidden={() => patchOverlay(selected.id, { hidden: !selected.hidden })}
          onReplaceImage={() => requestOverlayImage(selected.id)}
          onStore={storeSelected}
        />
      )}

      {/* Layer panel — every overlay, top-to-bottom, with quick controls */}
      {overlays.length > 0 && (
        <LayerPanel
          overlays={overlays}
          selectedId={selectedId}
          brand={brand}
          onSelect={setSelectedId}
          onToggleHidden={(id) =>
            patchOverlay(id, { hidden: !overlays.find((o) => o.id === id)?.hidden })
          }
          onLayer={layer}
          onDuplicate={duplicateOverlay}
          onRemove={removeOverlay}
        />
      )}

      {/* Overlay bank */}
      <OverlayBankPanel
        items={bank.items}
        onReuse={reuseBanked}
        onRemove={bank.remove}
        onClear={bank.clear}
      />

      {/* Frame Library — full reusable layouts (family + style + sizes + overlays) */}
      <FrameLibraryPanel
        items={library.items}
        frameName={frameName}
        brand={brand}
        onNameChange={setFrameName}
        onSave={saveCurrentFrame}
        onApply={applyFrame}
        onRemove={library.remove}
        onClear={library.clear}
      />

      {/* Export list */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
	            Export Visual Output
          </p>
          <Button
            size="sm"
            onClick={exportAll}
            disabled={exporting || !selectedSizeIds.length}
            data-testid="artbot-export-all"
            className="h-7 text-[11px] font-bold"
            style={{ background: brand.color, color: brand.on }}
          >
            <Download className="w-3 h-3 mr-1" />
	            Export All ({selectedSizeIds.length})
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {selectedSizeIds.map((id) => {
            const s = sizeById(id);
            return (
              <div
                key={id}
                className="flex items-center justify-between rounded-md border border-border/40 bg-secondary/40 px-2.5 py-1.5"
              >
                <span className="text-[11px] font-bold text-foreground/85">{s.label}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportSingle(id)}
                  disabled={exporting}
                  data-testid={`artbot-export-size-${s.width}x${s.height}`}
                  className="h-6 text-[10px]"
                >
                  <Download className="w-3 h-3 mr-1" />
                  PNG
                </Button>
              </div>
            );
          })}
        </div>
        {exporting && (
          <p className="text-[10px] text-muted-foreground">Exporting visual output...</p>
        )}
        {!exporting && lastExport && (
          <div
            className="rounded-md border px-2.5 py-2 mt-1"
            style={{ borderColor: `${brand.color}45`, background: `${brand.color}10` }}
            data-testid="artbot-export-receipt"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3 h-3" style={{ color: brand.color }} />
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground/85">
	                Visual output exported · {lastExport.count} file{lastExport.count === 1 ? "" : "s"}
              </p>
            </div>
            <p className="text-[10px] font-mono text-foreground/80 break-all leading-snug">
              {lastExport.fileName}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {lastExport.dims} · {siloName} · {lastExport.frameLabel} ·{" "}
              {lastExport.overlays} overlay{lastExport.overlays === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>

      {/* Offscreen full-resolution stage used only for capture. */}
      {exporting && (
        <div
          aria-hidden
          style={{ position: "fixed", left: -100000, top: 0, pointerEvents: "none", opacity: 1 }}
        >
          <TemplateStage
            ref={exportRef}
            size={exportSize_}
            family={family}
            frameStyle={frameStyle}
            image={image}
            headline={headline}
            brand={brand}
            siloName={siloName}
            logo={logo}
            qualityLabels={qualityLabels}
            overlays={overlays}
            selectedId={null}
            exporting
            previewMaxWidth={exportSize_.width}
            onSelectOverlay={() => {}}
            onChangeOverlay={() => {}}
            onRequestOverlayImage={() => {}}
            onBackgroundClick={() => {}}
          />
        </div>
      )}
    </div>
  );
}

/**
 * A miniature live render of a frame style's treatment (border / matte / scrim /
 * edge accent / corner flash) so the operator can pick the look by sight. Token
 * sizes are floored to stay legible at thumbnail scale — representative, not
 * pixel-exact (the real export math lives in TemplateStage).
 */
function FrameStyleSwatch({
  fs,
  brand,
}: {
  fs: FrameStyle;
  brand: { color: string; on: string };
}) {
  const W = 44;
  const H = 56;
  const resolve = (c: FrameAccentColor) =>
    c === "brand" ? brand.color : c === "white" ? "#ffffff" : "#0a0a0a";
  const borderW = fs.borderPct > 0 ? Math.max(2, (fs.borderPct / 100) * W) : 0;
  const matteW = fs.mattePct > 0 ? Math.max(3, (fs.mattePct / 100) * W) : 0;
  const accentW = fs.accentEdge !== "none" && fs.accentPct > 0 ? Math.max(3, (fs.accentPct / 100) * W) : 0;
  const scrim =
    fs.scrim === "bottom"
      ? "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0) 55%)"
      : fs.scrim === "top"
        ? "linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0) 55%)"
        : fs.scrim === "full"
          ? "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.55))"
          : null;
  return (
    <div
      aria-hidden
      style={{
        width: W,
        height: H,
        boxSizing: "border-box",
        borderRadius: 4,
        overflow: "hidden",
        background: matteW > 0 ? resolve(fs.matteColor) : "#0a0a0a",
        border: borderW > 0 ? `${borderW}px solid ${resolve(fs.borderColor)}` : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          padding: matteW,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #44464d, #1c1d21)",
            overflow: "hidden",
          }}
        >
          {scrim && <div style={{ position: "absolute", inset: 0, background: scrim }} />}
          {accentW > 0 && (
            <div
              style={{
                position: "absolute",
                background: resolve(fs.accentColor),
                ...(fs.accentEdge === "bottom"
                  ? { left: 0, right: 0, bottom: 0, height: accentW }
                  : fs.accentEdge === "top"
                    ? { left: 0, right: 0, top: 0, height: accentW }
                    : fs.accentEdge === "left"
                      ? { top: 0, bottom: 0, left: 0, width: accentW }
                      : { top: 0, bottom: 0, right: 0, width: accentW }),
              }}
            />
          )}
          {fs.cornerFlash && (
            <div
              style={{
                position: "absolute",
                top: -W * 0.18,
                left: -W * 0.18,
                width: W * 0.36,
                height: W * 0.36,
                background: resolve(fs.cornerColor),
                transform: "rotate(45deg)",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function FrameLibraryPanel({
  items,
  frameName,
  brand,
  onNameChange,
  onSave,
  onApply,
  onRemove,
  onClear,
}: {
  items: SavedFrame[];
  frameName: string;
  brand: { color: string; on: string };
  onNameChange: (name: string) => void;
  onSave: () => void;
  onApply: (frame: SavedFrame) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div
      className="rounded-lg border border-border/60 bg-secondary/40 p-2.5 space-y-2"
      data-testid="artbot-frame-library"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/90 inline-flex items-center gap-1.5">
          <Library className="w-3.5 h-3.5" />
          Frame Library
          {items.length > 0 && (
            <span className="text-[10px] font-bold text-muted-foreground">({items.length})</span>
          )}
        </span>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            data-testid="artbot-frame-clear"
            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Save the whole look — family, frame style, sizes &amp; overlays — then apply it onto any new image.
      </p>

      <div className="flex items-center gap-1.5">
        <Input
          value={frameName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Name this frame…"
          maxLength={48}
          data-testid="artbot-frame-name"
          className="h-7 text-[12px]"
        />
        <Button
          size="sm"
          onClick={onSave}
          data-testid="artbot-frame-save"
          className="h-7 text-[11px] font-bold shrink-0"
          style={{ background: brand.color, color: brand.on }}
        >
          <Bookmark className="w-3 h-3 mr-1" />
          Save
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/70 inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          No saved frames yet — build a look and save it.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-1.5">
          {items.map((f) => (
            <div
              key={f.id}
              data-testid={`artbot-frame-item-${f.id}`}
              className="flex items-center justify-between rounded-md border border-border/40 bg-secondary/40 px-2.5 py-1.5 gap-2"
            >
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-foreground/90 truncate">{f.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {f.sizeIds.length} size{f.sizeIds.length === 1 ? "" : "s"} ·{" "}
                  {f.overlays.length} overlay{f.overlays.length === 1 ? "" : "s"}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApply(f)}
                  data-testid={`artbot-frame-apply-${f.id}`}
                  className="h-6 text-[10px]"
                >
                  Apply
                </Button>
                <IconBtn
                  label="Remove frame"
                  testid={`artbot-frame-remove-${f.id}`}
                  onClick={() => onRemove(f.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </IconBtn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type AlignAction =
  | "left"
  | "hcenter"
  | "right"
  | "top"
  | "vmiddle"
  | "bottom"
  | "center"
  | "fit";

function SelectedOverlayEditor({
  overlay,
  brandColor,
  brandOn,
  onChange,
  onAlign,
  onDuplicate,
  onRemove,
  onLayer,
  onToggleHidden,
  onReplaceImage,
  onStore,
}: {
  overlay: Overlay;
  brandColor: string;
  brandOn: string;
  onChange: (patch: Partial<Overlay>) => void;
  onAlign: (action: AlignAction) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onLayer: (dir: "forward" | "backward") => void;
  onToggleHidden: () => void;
  onReplaceImage: () => void;
  onStore: () => void;
}) {
  const def = overlayDef(overlay.type);
  return (
    <div
      className="rounded-lg border border-border/60 bg-secondary/40 p-2.5 space-y-2"
      data-testid="artbot-overlay-editor"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/90">
          {def.label}
        </span>
        <div className="flex items-center gap-1">
          <IconBtn label="Layer forward" testid="artbot-overlay-forward" onClick={() => onLayer("forward")}>
            <ArrowUp className="w-3.5 h-3.5" />
          </IconBtn>
          <IconBtn label="Layer backward" testid="artbot-overlay-backward" onClick={() => onLayer("backward")}>
            <ArrowDown className="w-3.5 h-3.5" />
          </IconBtn>
          <IconBtn label="Duplicate" testid="artbot-overlay-duplicate" onClick={onDuplicate}>
            <Copy className="w-3.5 h-3.5" />
          </IconBtn>
          <IconBtn
            label={overlay.hidden ? "Show" : "Hide"}
            testid="artbot-overlay-toggle"
            onClick={onToggleHidden}
          >
            {overlay.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </IconBtn>
          <IconBtn label="Save to bank" testid="artbot-overlay-store" onClick={onStore}>
            <Save className="w-3.5 h-3.5" />
          </IconBtn>
          <IconBtn label="Remove" testid="artbot-overlay-remove" onClick={onRemove}>
            <Trash2 className="w-3.5 h-3.5" />
          </IconBtn>
        </div>
      </div>

      {/* Align & position helpers — snap the selected overlay precisely */}
      <div className="flex flex-wrap items-center gap-1" data-testid="artbot-align-row">
        <AlignBtn label="Align left" testid="artbot-align-left" onClick={() => onAlign("left")}>
          L
        </AlignBtn>
        <AlignBtn label="Center horizontally" testid="artbot-align-hcenter" onClick={() => onAlign("hcenter")}>
          H
        </AlignBtn>
        <AlignBtn label="Align right" testid="artbot-align-right" onClick={() => onAlign("right")}>
          R
        </AlignBtn>
        <span className="mx-0.5 h-4 w-px bg-border/60" />
        <AlignBtn label="Align top" testid="artbot-align-top" onClick={() => onAlign("top")}>
          T
        </AlignBtn>
        <AlignBtn label="Center vertically" testid="artbot-align-vmiddle" onClick={() => onAlign("vmiddle")}>
          M
        </AlignBtn>
        <AlignBtn label="Align bottom" testid="artbot-align-bottom" onClick={() => onAlign("bottom")}>
          B
        </AlignBtn>
        <span className="mx-0.5 h-4 w-px bg-border/60" />
        <AlignBtn label="Center on canvas" testid="artbot-align-center" onClick={() => onAlign("center")}>
          ⊕
        </AlignBtn>
        <AlignBtn label="Snap inside safe area" testid="artbot-align-fit" onClick={() => onAlign("fit")}>
          Fit
        </AlignBtn>
      </div>

      {def.medium === "image" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReplaceImage}
          data-testid="artbot-overlay-replace-image"
          className="h-8 text-[11px] w-full"
        >
          {overlay.image ? "Replace screenshot" : "Add screenshot"}
        </Button>
      ) : (
        <div className="space-y-1.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Font
            </p>
            <div className="flex flex-wrap gap-1">
              {OVERLAY_FONTS.map((f) => {
                const active = (overlay.font ?? "grotesk") === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onChange({ font: f.id as OverlayFontId })}
                    data-testid={`artbot-overlay-font-${f.id}`}
                    style={{
                      fontFamily: f.stack,
                      ...(active ? { background: brandColor, color: brandOn } : {}),
                    }}
                    className={`text-[12px] px-2.5 py-1 rounded-full border transition-all ${
                      active
                        ? "border-transparent"
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
          {(overlay.type === "x-post" || overlay.type === "comment") && (
            <Input
              value={overlay.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={overlay.type === "x-post" ? "Display name" : "Username"}
              className="bg-secondary/60 border-border text-sm h-8"
              data-testid="artbot-overlay-title"
            />
          )}
          {overlay.type === "x-post" && (
            <Input
              value={overlay.subtitle}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              placeholder="@handle"
              className="bg-secondary/60 border-border text-sm h-8"
              data-testid="artbot-overlay-subtitle"
            />
          )}
          {overlay.type === "article-snippet" && (
            <>
              <Input
                value={overlay.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Kicker (e.g. EXCLUSIVE)"
                className="bg-secondary/60 border-border text-sm h-8"
                data-testid="artbot-overlay-title"
              />
              <Input
                value={overlay.subtitle}
                onChange={(e) => onChange({ subtitle: e.target.value })}
                placeholder="Headline"
                className="bg-secondary/60 border-border text-sm h-8"
                data-testid="artbot-overlay-subtitle"
              />
            </>
          )}
          {overlay.type === "quote-card" && (
            <Input
              value={overlay.subtitle}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              placeholder="— Attribution"
              className="bg-secondary/60 border-border text-sm h-8"
              data-testid="artbot-overlay-subtitle"
            />
          )}
          {(overlay.type === "breaking-badge" ||
            overlay.type === "lower-third" ||
            overlay.type === "stat-chip") && (
            <Input
              value={overlay.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={
                overlay.type === "breaking-badge"
                  ? "Badge text (e.g. BREAKING)"
                  : overlay.type === "stat-chip"
                    ? "Big number (e.g. 1.2M)"
                    : "Name / title"
              }
              className="bg-secondary/60 border-border text-sm h-8"
              data-testid="artbot-overlay-title"
            />
          )}
          {overlay.type === "lower-third" && (
            <Input
              value={overlay.subtitle}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              placeholder="Role / handle"
              className="bg-secondary/60 border-border text-sm h-8"
              data-testid="artbot-overlay-subtitle"
            />
          )}
          {overlay.type !== "breaking-badge" && overlay.type !== "lower-third" && (
            <Textarea
              value={overlay.body}
              onChange={(e) => onChange({ body: e.target.value })}
              placeholder={
                overlay.type === "stat-chip"
                  ? "Stat label (e.g. streams in 24h)"
                  : overlay.type === "source-label"
                    ? "Source / credit text"
                    : overlay.type === "logo-bug"
                      ? "Brand handle (e.g. @yourbrand)"
                      : "Body text"
              }
              className="min-h-[60px] resize-none bg-secondary/60 border-border text-sm"
              data-testid="artbot-overlay-body"
            />
          )}
        </div>
      )}
    </div>
  );
}

function AlignBtn({
  children,
  label,
  testid,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  testid: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-testid={testid}
      className="min-w-[26px] h-7 px-1.5 rounded-md border border-border/50 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:border-border"
    >
      {children}
    </button>
  );
}

function IconBtn({
  children,
  label,
  testid,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  testid: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-testid={testid}
      className="p-1.5 rounded-md border border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
    >
      {children}
    </button>
  );
}

function LayerPanel({
  overlays,
  selectedId,
  brand,
  onSelect,
  onToggleHidden,
  onLayer,
  onDuplicate,
  onRemove,
}: {
  overlays: Overlay[];
  selectedId: string | null;
  brand: { color: string; on: string };
  onSelect: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onLayer: (id: string, dir: "forward" | "backward") => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  // Top layer first (highest z), mirroring stacking order in the preview.
  const ordered = [...overlays].sort((a, b) => b.z - a.z);
  return (
    <div className="rounded-lg border border-border/50 bg-secondary/30 p-2.5" data-testid="artbot-layer-panel">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Layers className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Layers ({overlays.length})
        </span>
      </div>
      <div className="space-y-1">
        {ordered.map((o) => {
          const def = overlayDef(o.type);
          const label = o.title || o.body || def.short;
          const active = o.id === selectedId;
          return (
            <div
              key={o.id}
              data-testid={`artbot-layer-${o.id}`}
              className="flex items-center gap-1 rounded-md border px-1.5 py-1"
              style={
                active
                  ? { borderColor: brand.color, background: `${brand.color}1a` }
                  : { borderColor: "rgba(255,255,255,0.08)" }
              }
            >
              <button
                type="button"
                onClick={() => onSelect(o.id)}
                data-testid={`artbot-layer-select-${o.id}`}
                className="flex-1 min-w-0 text-left"
                title={label}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {def.short}
                </span>
                <span
                  className={`block text-[11px] truncate ${
                    o.hidden ? "text-muted-foreground/50 line-through" : "text-foreground"
                  }`}
                >
                  {label}
                </span>
              </button>
              <IconBtn label="Layer forward" testid={`artbot-layer-up-${o.id}`} onClick={() => onLayer(o.id, "forward")}>
                <ArrowUp className="w-3 h-3" />
              </IconBtn>
              <IconBtn label="Layer backward" testid={`artbot-layer-down-${o.id}`} onClick={() => onLayer(o.id, "backward")}>
                <ArrowDown className="w-3 h-3" />
              </IconBtn>
              <IconBtn
                label={o.hidden ? "Show" : "Hide"}
                testid={`artbot-layer-toggle-${o.id}`}
                onClick={() => onToggleHidden(o.id)}
              >
                {o.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </IconBtn>
              <IconBtn label="Duplicate" testid={`artbot-layer-dup-${o.id}`} onClick={() => onDuplicate(o.id)}>
                <Copy className="w-3 h-3" />
              </IconBtn>
              <IconBtn label="Remove" testid={`artbot-layer-remove-${o.id}`} onClick={() => onRemove(o.id)}>
                <Trash2 className="w-3 h-3" />
              </IconBtn>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OverlayBankPanel({
  items,
  onReuse,
  onRemove,
  onClear,
}: {
  items: BankedOverlay[];
  onReuse: (b: BankedOverlay) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-secondary/30 p-2.5" data-testid="artbot-overlay-bank">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Overlay bank ({items.length})
        </span>
        {items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            data-testid="artbot-bank-clear"
            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Clear bank
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-[10px] text-muted-foreground italic">
          Save an overlay to reuse it across compositions.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((b) => {
            const label = overlayDef(b.type).short;
            const hint = b.title || b.body || label;
            return (
              <div
                key={b.id}
                className="flex items-center gap-1 rounded-full border border-border/50 bg-secondary/40 pl-2.5 pr-1 py-0.5"
              >
                <button
                  type="button"
                  onClick={() => onReuse(b)}
                  data-testid={`artbot-bank-reuse-${b.type}`}
                  title={hint}
                  className="text-[10px] font-bold uppercase tracking-wider text-foreground/80 hover:text-foreground max-w-[120px] truncate"
                >
                  {label}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(b.id)}
                  aria-label="Remove from bank"
                  data-testid="artbot-bank-remove"
                  className="p-0.5 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
