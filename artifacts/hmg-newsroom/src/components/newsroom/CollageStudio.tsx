import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Image as ImageIcon,
  Layers,
  LayoutTemplate,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { recordAudit } from "@/lib/auditLog";
import { formatBytes } from "@/lib/mediaLimits";
import { useMediaLibrary } from "@/lib/useMediaLibrary";
import { CopyButton } from "@/components/hmg/CopyButton";
import {
  IMAGE_ACCEPTED_TYPES,
  createPreviewAsset,
  readImageDimensions,
  revokePreviewAsset,
  validateImageFile,
} from "@/lib/hmg/performance/mediaReadiness";
import {
  generateHmgVisualPacket,
  getBrandVoiceProfile as getIntelligenceBrandVoiceProfile,
} from "@/lib/hmg/intelligence";
import {
  EXPORT_SIZES,
  sizeById,
  type ExportSize,
} from "./artbotTemplates";
import {
  COLLAGE_LAYOUTS,
  collageLayoutById,
  defaultLayoutForBrand,
  EMPTY_OVERLAY,
  layoutsForImageCount,
  resolveSlots,
  type CollageAsset,
  type CollageLayout,
  type CollageOverlay,
} from "@/lib/hmg/collage/collageLayouts";

interface CollageStudioProps {
  silo: string;
  siloName: string;
  brand: { color: string; on: string };
  logo?: string;
}

const PREVIEW_MAX_WIDTH = 360;
const PREVIEW_MAX_HEIGHT = 480;
const MAX_TRAY_ASSETS = 6;
const COLLAGE_OBJECT_URL_OWNER = "collage-studio";

function uid(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Multi-image collage builder for HMG brands. Operator uploads 1–6 assets,
 * picks a layout, edits headline / subheadline / credit, then exports a real
 * PNG at the chosen pixel canvas (via html2canvas). No fake creation and no
 * external handoff — the composition the operator sees IS the export.
 */
export function CollageStudio({ silo, siloName, brand, logo }: CollageStudioProps) {
  const [assets, setAssets] = useState<CollageAsset[]>([]);
  const [layoutId, setLayoutId] = useState<string>(defaultLayoutForBrand(silo));
  const [overlay, setOverlay] = useState<CollageOverlay>(EMPTY_OVERLAY);
  const [exportSizeId, setExportSizeId] = useState<string>(EXPORT_SIZES[0].id);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const assetsRef = useRef<CollageAsset[]>([]);
  const mediaLibrary = useMediaLibrary();

  // If the operator switches brands the default layout updates only when no
  // explicit choice has been made yet.
  useEffect(() => {
    setLayoutId((current) => current || defaultLayoutForBrand(silo));
  }, [silo]);

  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  useEffect(
    () => () => {
      assetsRef.current.forEach((asset) =>
        revokePreviewAsset({ objectUrl: asset.objectUrl ?? asset.src, src: asset.src }),
      );
    },
    [],
  );

  const layout = collageLayoutById(layoutId);
  const exportSize = sizeById(exportSizeId);
  const intelligenceBrand = useMemo(
    () => getIntelligenceBrandVoiceProfile(silo),
    [silo],
  );
  const availableLayouts = useMemo(
    () => layoutsForImageCount(Math.max(assets.length, 1)),
    [assets.length],
  );
  const largeAssetCount = useMemo(
    () => assets.filter((asset) => asset.readiness === "large").length,
    [assets],
  );
  const totalAssetBytes = useMemo(
    () => assets.reduce((sum, asset) => sum + (asset.size ?? 0), 0),
    [assets],
  );
  const readinessSummary = assets.length
    ? `${assets.length}/${MAX_TRAY_ASSETS} staged · ${formatBytes(totalAssetBytes)}${largeAssetCount ? ` · ${largeAssetCount} large` : ""}`
    : `Accepts ${IMAGE_ACCEPTED_TYPES.map((type) => type.replace("image/", "").toUpperCase()).join(", ")}`;
  const hmgVisualPacket = useMemo(
    () =>
      generateHmgVisualPacket({
        topic: overlay.headline || `${siloName} visual output`,
        brand: intelligenceBrand,
        headline: overlay.headline,
        imageCount: assets.length,
        currentLayout: layout.label,
        outputSize: exportSize.label,
      }),
    [assets.length, exportSize.label, intelligenceBrand, layout.label, overlay.headline, siloName],
  );

  /** Convert tray slots based on the current layout. */
  const slots = useMemo(() => resolveSlots(layout, assets), [layout, assets]);

  /** Honest readiness flag — render hint when nothing is staged yet. */
  const isReady = slots.some((s) => s != null) || overlay.headline.trim().length > 0;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    const incoming: CollageAsset[] = [];
    const room = MAX_TRAY_ASSETS - assets.length;
    if (room <= 0) {
      toast.message(`Tray limit reached (${MAX_TRAY_ASSETS} images).`);
      return;
    }
    if (fileList.length > room) {
      toast.message(`Adding the first ${room} image${room === 1 ? "" : "s"} that fit the tray.`);
    }
    for (let i = 0; i < fileList.length && incoming.length < room; i += 1) {
      const file = fileList[i];
      const validation = validateImageFile(file);
      if (!validation.ok) {
        toast.error(`${file.name}: ${validation.detail}`);
        continue;
      }
      const preview = createPreviewAsset(file, COLLAGE_OBJECT_URL_OWNER);
      const asset: CollageAsset = {
        id: preview.id || uid(),
        src: preview.src,
        objectUrl: preview.objectUrl,
        filename: preview.name,
        size: preview.size,
        type: preview.type,
        readiness: preview.readiness.level,
        readinessLabel: preview.readiness.label,
        readinessDetail: preview.readiness.detail,
      };
      incoming.push(asset);
      if (validation.level === "large") {
        toast.message(`${file.name}: ${validation.detail}`);
      }
      readImageDimensions(preview.src)
        .then((dimensions) => {
          setAssets((prev) =>
            prev.map((item) => (item.id === asset.id ? { ...item, dimensions } : item)),
          );
        })
        .catch(() => undefined);
    }
    if (incoming.length === 0) return;
    setAssets((prev) => [...prev, ...incoming].slice(0, MAX_TRAY_ASSETS));
    toast.success(
      `${incoming.length} image${incoming.length === 1 ? "" : "s"} added to tray`,
    );
  }

  function removeAsset(id: string) {
    setAssets((prev) => {
      const asset = prev.find((a) => a.id === id);
      if (asset) {
        revokePreviewAsset({ objectUrl: asset.objectUrl ?? asset.src, src: asset.src });
      }
      return prev.filter((a) => a.id !== id);
    });
  }

  function moveAsset(id: string, dir: -1 | 1) {
    setAssets((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      const tmp = next[idx];
      next[idx] = next[target];
      next[target] = tmp;
      return next;
    });
  }

  function clearTray() {
    setAssets((prev) => {
      prev.forEach((asset) =>
        revokePreviewAsset({ objectUrl: asset.objectUrl ?? asset.src, src: asset.src }),
      );
      return [];
    });
    setOverlay(EMPTY_OVERLAY);
    toast.message("Tray cleared");
  }

  async function exportPng(format: "png" | "jpg") {
    const node = stageRef.current;
    if (!node) return;
    if (!isReady) {
      toast.error("Add at least one image or a headline before exporting.");
      return;
    }
    setExporting(true);
    try {
      const canvas = await html2canvas(node, {
        backgroundColor: format === "jpg" ? "#000000" : null,
        useCORS: true,
        scale: 2,
      });
      const dataUrl = canvas.toDataURL(
        format === "png" ? "image/png" : "image/jpeg",
        format === "png" ? undefined : 0.92,
      );
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `hmg-${silo}-collage-${Date.now()}.${format}`;
      a.click();
      recordAudit(
        "image-generated",
        silo,
        `Collage export ${exportSize.label} · ${layout.label} · ${assets.length} asset(s)`,
      );
      toast.success(`Downloading ${format.toUpperCase()}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      toast.error(`Could not export — ${msg.slice(0, 80)}`);
    } finally {
      setExporting(false);
    }
  }

  function saveToMediaLibrary() {
    if (!isReady) {
      toast.error("Nothing to save yet — add an image or headline first.");
      return;
    }
    mediaLibrary.add({
      name: overlay.headline.trim() || `${siloName} collage`,
      type: "image",
      silo,
      intendedUse: `Collage · ${layout.label} · ${exportSize.label}`,
    });
    toast.success("Saved to Media Library");
  }

  function copyRecipe() {
    const lines = [
      `HMG Collage Receipt — ${new Date().toISOString()}`,
      "",
      `Brand: ${siloName}`,
      `Layout: ${layout.label}`,
      `Export size: ${exportSize.label} (${exportSize.purpose})`,
      `Images: ${assets.length}`,
      ...assets.map((a, i) => `  [${i + 1}] ${a.filename ?? "untitled"}`),
      "",
      "Overlay:",
      `  Headline: ${overlay.headline || "(none)"}`,
      `  Subheadline: ${overlay.subheadline || "(none)"}`,
      `  Credit: ${overlay.credit || "(none)"}`,
    ];
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => toast.success("Collage recipe copied"))
      .catch(() => toast.error("Copy failed"));
  }

  return (
    <div className="space-y-3" data-testid="collage-studio">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center"
          style={{ background: brand.color, color: brand.on }}
        >
          <LayoutTemplate className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-black tracking-tight leading-none">
            Create Graphic
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Drop up to {MAX_TRAY_ASSETS} images, pick a layout, write the
            headline. What you see is the export.
          </p>
        </div>
      </div>

      {/* Tray + Upload */}
      <div
        className="rounded-xl border p-2.5"
        style={{ borderColor: `${brand.color}55`, background: `${brand.color}08` }}
        data-testid="collage-tray-block"
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Image Tray ({assets.length}/{MAX_TRAY_ASSETS})
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/80">
              {readinessSummary}
            </p>
          </div>
          {assets.length > 0 && (
            <button
              type="button"
              onClick={clearTray}
              data-testid="collage-clear-tray"
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
          data-testid="collage-upload-input"
          aria-label="Upload images to collage tray"
        />
        {assets.length === 0 ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            data-testid="collage-upload-empty"
            className="w-full rounded-lg border border-dashed border-border/60 bg-background/40 px-3 py-6 text-center text-[12px] font-semibold text-muted-foreground hover:border-foreground/50 hover:text-foreground transition-colors"
          >
            <Upload className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            Upload up to {MAX_TRAY_ASSETS} images · JPG, PNG, WebP, or GIF
          </button>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {assets.map((asset, i) => (
                <div
                  key={asset.id}
                  data-testid={`collage-tray-asset-${i}`}
                  className="relative rounded-md overflow-hidden border border-border/60 bg-background/60"
                >
                  <img
                    src={asset.src}
                    alt=""
                    className="w-full aspect-square object-cover"
                  />
                  <span className="absolute top-0.5 left-0.5 rounded bg-black/60 text-white text-[9px] font-bold px-1 py-0.5">
                    {i + 1}
                  </span>
                  <span
                    className={`absolute top-0.5 right-0.5 rounded px-1 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                      asset.readiness === "large"
                        ? "bg-amber-500/85 text-black"
                        : "bg-emerald-500/80 text-black"
                    }`}
                  >
                    {asset.readinessLabel ?? "Ready"}
                  </span>
                  <div className="absolute bottom-0 inset-x-0 flex items-stretch text-white text-[9px] bg-black/55 backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => moveAsset(asset.id, -1)}
                      disabled={i === 0}
                      data-testid={`collage-asset-up-${i}`}
                      className="flex-1 py-1 hover:bg-white/15 disabled:opacity-30"
                      aria-label={`Move asset ${i + 1} earlier`}
                    >
                      <ArrowUp className="w-3 h-3 mx-auto" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveAsset(asset.id, 1)}
                      disabled={i === assets.length - 1}
                      data-testid={`collage-asset-down-${i}`}
                      className="flex-1 py-1 hover:bg-white/15 disabled:opacity-30"
                      aria-label={`Move asset ${i + 1} later`}
                    >
                      <ArrowDown className="w-3 h-3 mx-auto" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeAsset(asset.id)}
                      data-testid={`collage-asset-remove-${i}`}
                      className="flex-1 py-1 hover:bg-white/15"
                      aria-label={`Remove asset ${i + 1}`}
                    >
                      <X className="w-3 h-3 mx-auto" />
                    </button>
                  </div>
                  <p className="sr-only">
                    {asset.filename} · {asset.size ? formatBytes(asset.size) : "size pending"}
                    {asset.dimensions ? ` · ${asset.dimensions.width} by ${asset.dimensions.height}` : ""}
                  </p>
                </div>
              ))}
              {assets.length < MAX_TRAY_ASSETS && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  data-testid="collage-upload-more"
                  className="rounded-md border border-dashed border-border/60 bg-background/30 text-muted-foreground hover:text-foreground hover:border-foreground/40 aspect-square flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                >
                  <Upload className="w-4 h-4" />
                  Add
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Layout picker */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          Layout ({availableLayouts.length} available for {assets.length || "0"} image{assets.length === 1 ? "" : "s"})
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {COLLAGE_LAYOUTS.map((l) => {
            const enabled = (assets.length || 1) >= l.minImages;
            const active = layoutId === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => enabled && setLayoutId(l.id)}
                disabled={!enabled}
                data-testid={`collage-layout-${l.id}`}
                title={`${l.label} — ${l.blurb} (needs ${l.minImages} image${l.minImages === 1 ? "" : "s"})`}
                className={`text-left rounded-lg border p-2 transition-colors ${
                  active
                    ? "border-transparent text-foreground"
                    : enabled
                      ? "border-border/60 text-foreground/80 hover:border-foreground/40"
                      : "border-border/30 text-muted-foreground/60 cursor-not-allowed"
                }`}
                style={active ? { background: brand.color, color: brand.on } : undefined}
              >
                <p className="text-[11px] font-black uppercase tracking-tight">
                  {l.short}
                </p>
                <p
                  className={`text-[9px] mt-0.5 leading-snug ${
                    active ? "opacity-90" : "text-muted-foreground"
                  }`}
                >
                  {l.minImages === l.maxImages
                    ? `${l.minImages} img`
                    : `${l.minImages}–${l.maxImages} img`}
                  {" · "}
                  {l.bestFor[0]}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overlay text */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Headline / Subheadline / Credit
        </p>
        <Input
          value={overlay.headline}
          onChange={(e) => setOverlay((o) => ({ ...o, headline: e.target.value }))}
          placeholder="Headline overlay (e.g. NEW SINGLE OUT NOW)"
          className="bg-secondary/60 border-border text-sm h-9"
          data-testid="collage-headline"
        />
        <Input
          value={overlay.subheadline}
          onChange={(e) => setOverlay((o) => ({ ...o, subheadline: e.target.value }))}
          placeholder="Subheadline (optional)"
          className="bg-secondary/60 border-border text-[12px] h-8"
          data-testid="collage-subheadline"
        />
        <Input
          value={overlay.credit}
          onChange={(e) => setOverlay((o) => ({ ...o, credit: e.target.value }))}
          placeholder="Source / credit (optional)"
          className="bg-secondary/60 border-border text-[11px] h-8"
          data-testid="collage-credit"
        />
      </div>

      <section className="rounded-xl border border-border/60 bg-secondary/20 p-3">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">
              HMG Visual Engine
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Local visual direction for layout, crop, lower-third, and export readiness.
            </p>
          </div>
          <CopyButton
            textToCopy={hmgVisualPacket.copyablePacket}
            label="Copy Visual Packet"
            successMessage="HMG Visual Direction Packet copied"
            className="h-8 text-[11px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Layout", value: hmgVisualPacket.recommendedLayout },
            { label: "Output", value: hmgVisualPacket.recommendedOutputSize },
            { label: "Images", value: String(hmgVisualPacket.imageCountRecommendation) },
            { label: "Overlay", value: hmgVisualPacket.headlineOverlayRecommendation },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border/50 bg-background/30 p-2">
              <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-1 truncate text-[11px] font-bold text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <p className="rounded-lg border border-border/50 bg-background/30 p-2 text-[11px] leading-snug text-muted-foreground">
            <strong className="text-foreground">Crop/focus:</strong>{" "}
            {hmgVisualPacket.cropFocusGuidance}
          </p>
          <p className="rounded-lg border border-border/50 bg-background/30 p-2 text-[11px] leading-snug text-muted-foreground">
            <strong className="text-foreground">Lower-third:</strong>{" "}
            {hmgVisualPacket.lowerThirdGuidance}
          </p>
        </div>
        {(hmgVisualPacket.platformFitWarning || hmgVisualPacket.genericLookWarning) && (
          <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] leading-snug text-amber-200">
            {hmgVisualPacket.platformFitWarning ?? hmgVisualPacket.genericLookWarning}
          </div>
        )}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-border/50 bg-background/30 p-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Brand visual rules
            </p>
            <ul className="mt-1 space-y-1">
              {hmgVisualPacket.brandVisualRules.slice(0, 3).map((rule) => (
                <li key={rule} className="text-[11px] leading-snug text-muted-foreground">
                  - {rule}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/30 p-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Graphic quality checklist
            </p>
            <ul className="mt-1 space-y-1">
              {hmgVisualPacket.graphicQualityChecklist.slice(0, 3).map((rule) => (
                <li key={rule} className="text-[11px] leading-snug text-muted-foreground">
                  - {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Export size */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          Output size
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {EXPORT_SIZES.map((s) => {
            const active = exportSizeId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setExportSizeId(s.id)}
                data-testid={`collage-size-${s.id}`}
                className={`text-left rounded-lg border p-2 ${
                  active
                    ? "border-transparent"
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/40"
                }`}
                style={active ? { background: brand.color, color: brand.on } : undefined}
              >
                <p className="text-[11px] font-black tracking-tight">{s.label}</p>
                <p
                  className={`text-[9px] mt-0.5 ${
                    active ? "opacity-90" : "text-muted-foreground"
                  }`}
                >
                  {s.purpose}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <CollagePreview
        ref={stageRef}
        layout={layout}
        slots={slots}
        overlay={overlay}
        brand={brand}
        siloName={siloName}
        logo={logo}
        exportSize={exportSize}
      />

      {/* Action bar */}
      <div className="rounded-xl border border-border/60 bg-secondary/20 p-2.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          Export readiness
        </p>
        <div className="mt-1.5 grid grid-cols-1 gap-1 text-[11px] text-muted-foreground sm:grid-cols-3">
          <span className={assets.length ? "text-emerald-300" : ""}>
            {assets.length ? "Ready" : "Needs image"} · source image
          </span>
          <span className={overlay.headline.trim() ? "text-emerald-300" : ""}>
            {overlay.headline.trim() ? "Ready" : "Optional"} · headline
          </span>
          <span className={largeAssetCount ? "text-amber-300" : "text-emerald-300"}>
            {largeAssetCount ? "Large assets staged" : "Preview light"} · browser load
          </span>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          onClick={() => exportPng("png")}
          disabled={!isReady || exporting}
          data-testid="collage-export-png"
          className="h-9 text-[12px]"
          style={{ background: brand.color, color: brand.on }}
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          {exporting ? "Exporting..." : "Export PNG"}
        </Button>
        <Button
          type="button"
          onClick={() => exportPng("jpg")}
          disabled={!isReady || exporting}
          data-testid="collage-export-jpg"
          variant="outline"
          className="h-9 text-[12px]"
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          Export JPG
        </Button>
        <Button
          type="button"
          onClick={saveToMediaLibrary}
          disabled={!isReady}
          data-testid="collage-save-media"
          variant="outline"
          className="h-9 text-[12px]"
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          Save to Media Library
        </Button>
        <Button
          type="button"
          onClick={copyRecipe}
          data-testid="collage-copy-recipe"
          variant="outline"
          className="h-9 text-[12px]"
        >
          <Layers className="w-3.5 h-3.5 mr-1" />
          Copy Visual Packet
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Publish Blocked from WebArt — export the file and attach it manually
        in WordPress or Save to Media Library.
      </p>
    </div>
  );
}

interface CollagePreviewProps {
  layout: CollageLayout;
  slots: Array<CollageAsset | null>;
  overlay: CollageOverlay;
  brand: { color: string; on: string };
  siloName: string;
  logo?: string;
  exportSize: ExportSize;
}

const CollagePreview = forwardRef<HTMLDivElement, CollagePreviewProps>(
  function CollagePreview(
    { layout, slots, overlay, brand, siloName, logo, exportSize },
    ref,
  ) {
    const aspect = exportSize.width / exportSize.height;
    // Preview is bounded by both width and height so tall stories don't blow
    // out the panel.
    const previewWidth =
      aspect >= 1
        ? PREVIEW_MAX_WIDTH
        : Math.min(PREVIEW_MAX_WIDTH, PREVIEW_MAX_HEIGHT * aspect);
    const previewHeight = previewWidth / aspect;

    const headerBand = layout.headerBand;
    const headerFrac = layout.headerFrac;
    const isLowerThird = headerBand === "lower-third";

    return (
      <div className="rounded-xl border border-border/60 bg-card/30 p-3" data-testid="collage-preview-block">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Preview · {layout.label} · {exportSize.label}
          </p>
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: `${brand.color}22`, color: brand.color }}
          >
            {siloName}
          </span>
        </div>
        <div className="flex justify-center">
          <div
            ref={ref}
            data-testid="collage-stage"
            className="relative overflow-hidden"
            style={{
              width: previewWidth,
              height: previewHeight,
              background: "#000",
            }}
          >
            {/* Layout for News Card has a side panel rather than full image */}
            {layout.id === "news-card" ? (
              <NewsCardStage
                slots={slots}
                overlay={overlay}
                brand={brand}
                siloName={siloName}
                logo={logo}
              />
            ) : (
              <>
                {layout.slots.map((slot, i) => {
                  const asset = slots[i];
                  const style: React.CSSProperties = {
                    position: "absolute",
                    left: `${slot.x * 100}%`,
                    top: `${slot.y * 100}%`,
                    width: `${slot.w * 100}%`,
                    height: `${slot.h * 100}%`,
                  };
                  return (
                    <div
                      key={i}
                      style={style}
                      className="overflow-hidden bg-secondary/30 border border-white/5"
                      data-testid={`collage-slot-${i}`}
                    >
                      {asset ? (
                        <img
                          src={asset.src}
                          alt=""
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40 text-[10px] font-bold uppercase tracking-wider">
                          <ImageIcon className="w-4 h-4 mr-1" /> Empty slot
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Brand header band */}
                {headerBand !== "none" && (
                  <HeaderBandView
                    layout={layout}
                    overlay={overlay}
                    brand={brand}
                    siloName={siloName}
                    logo={logo}
                    isLowerThird={isLowerThird}
                    headerFrac={headerFrac}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  },
);

function HeaderBandView({
  layout,
  overlay,
  brand,
  siloName,
  logo,
  isLowerThird,
  headerFrac,
}: {
  layout: CollageLayout;
  overlay: CollageOverlay;
  brand: { color: string; on: string };
  siloName: string;
  logo?: string;
  isLowerThird: boolean;
  headerFrac: number;
}) {
  const top = layout.headerBand === "top" ? 0 : undefined;
  const bottom =
    layout.headerBand === "bottom" || isLowerThird ? 0 : undefined;
  const style: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    top,
    bottom,
    height: `${headerFrac * 100}%`,
    background: isLowerThird
      ? "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.0))"
      : brand.color,
    color: isLowerThird ? "#ffffff" : brand.on,
    padding: "2.5%",
    display: "flex",
    flexDirection: "column",
    justifyContent: isLowerThird ? "flex-end" : "center",
  };
  const showCredit = overlay.credit.trim().length > 0;
  return (
    <div style={style} data-testid="collage-header-band">
      <div className="flex items-center gap-2">
        {logo && (
          <img
            src={logo}
            alt=""
            className="h-3 w-auto opacity-90"
            crossOrigin="anonymous"
          />
        )}
        <span
          className="font-black uppercase tracking-tight leading-tight truncate"
          style={{ fontSize: "min(3.6vw, 28px)", letterSpacing: "-0.01em" }}
        >
          {overlay.headline || siloName.toUpperCase()}
        </span>
      </div>
      {overlay.subheadline.trim() && (
        <span
          className="font-semibold uppercase tracking-wide truncate opacity-90 mt-1"
          style={{ fontSize: "min(2vw, 14px)" }}
        >
          {overlay.subheadline}
        </span>
      )}
      {showCredit && (
        <span
          className="font-semibold uppercase tracking-widest opacity-75 mt-0.5"
          style={{ fontSize: "min(1.6vw, 11px)" }}
        >
          {overlay.credit}
        </span>
      )}
    </div>
  );
}

function NewsCardStage({
  slots,
  overlay,
  brand,
  siloName,
  logo,
}: {
  slots: Array<CollageAsset | null>;
  overlay: CollageOverlay;
  brand: { color: string; on: string };
  siloName: string;
  logo?: string;
}) {
  const asset = slots[0];
  return (
    <div className="flex w-full h-full">
      <div className="w-[56%] bg-secondary/30 relative overflow-hidden">
        {asset ? (
          <img
            src={asset.src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40 text-[10px] font-bold uppercase tracking-wider">
            <ImageIcon className="w-4 h-4 mr-1" /> Empty slot
          </div>
        )}
      </div>
      <div
        className="w-[44%] p-[3%] flex flex-col justify-between"
        style={{ background: brand.color, color: brand.on }}
      >
        <div className="flex items-center gap-2">
          {logo && (
            <img
              src={logo}
              alt=""
              className="h-3 w-auto opacity-95"
              crossOrigin="anonymous"
            />
          )}
          <span
            className="text-[10px] font-black uppercase tracking-[0.2em] opacity-95"
          >
            {siloName}
          </span>
        </div>
        <div>
          <p
            className="font-black uppercase tracking-tight leading-tight"
            style={{ fontSize: "min(4vw, 26px)" }}
          >
            {overlay.headline || "Headline goes here"}
          </p>
          {overlay.subheadline.trim() && (
            <p
              className="font-semibold uppercase tracking-wide leading-snug mt-1.5 opacity-90"
              style={{ fontSize: "min(2.2vw, 14px)" }}
            >
              {overlay.subheadline}
            </p>
          )}
        </div>
        {overlay.credit.trim() && (
          <span
            className="font-bold uppercase tracking-widest opacity-80"
            style={{ fontSize: "min(1.8vw, 11px)" }}
          >
            {overlay.credit}
          </span>
        )}
      </div>
    </div>
  );
}
