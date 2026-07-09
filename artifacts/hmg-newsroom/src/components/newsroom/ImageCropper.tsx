import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCw, X } from "lucide-react";
import { toast } from "sonner";
import { getCroppedImg, type PixelCrop } from "./cropImage";
import { ASPECT_PRESETS } from "./artbotConfig";

interface ImageCropperProps {
  image: string;
  initialAspect?: number;
  brandColor: string;
  onCancel: () => void;
  onApply: (croppedDataUrl: string) => void;
}

interface NaturalSize {
  width: number;
  height: number;
}

export function ImageCropper({
  image,
  initialAspect = 1,
  brandColor,
  onCancel,
  onApply,
}: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(initialAspect);
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) {
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.onerror = () => {
      if (!cancelled) toast.error("Could not load image for cropping.");
    };
    img.src = image;
    return () => {
      cancelled = true;
    };
  }, [image]);

  const cropPixels = useMemo<PixelCrop | null>(() => {
    if (!naturalSize) return null;
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const swapsAxes = normalizedRotation === 90 || normalizedRotation === 270;
    const canvasWidth = swapsAxes ? naturalSize.height : naturalSize.width;
    const canvasHeight = swapsAxes ? naturalSize.width : naturalSize.height;

    let width = canvasWidth;
    let height = width / aspect;
    if (height > canvasHeight) {
      height = canvasHeight;
      width = height * aspect;
    }

    const safeZoom = Math.max(1, zoom);
    width /= safeZoom;
    height /= safeZoom;

    return {
      x: Math.max(0, (canvasWidth - width) / 2),
      y: Math.max(0, (canvasHeight - height) / 2),
      width,
      height,
    };
  }, [aspect, naturalSize, rotation, zoom]);

  async function handleApply() {
    if (!cropPixels) {
      toast.error("Image is still loading.");
      return;
    }
    setWorking(true);
    try {
      const dataUrl = await getCroppedImg(image, cropPixels, rotation);
      onApply(dataUrl);
    } catch {
      toast.error("Crop failed — try a different image.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-secondary/90 backdrop-blur-sm"
      data-testid="artbot-cropper"
      role="dialog"
      aria-label="Crop editor"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <span className="text-sm font-black uppercase tracking-tight">
          Crop &amp; frame asset
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close crop editor"
          className="p-1.5 rounded-full hover:bg-foreground/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-black px-4 py-4 flex items-center justify-center">
        <div
          className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-white/15 bg-black"
          style={{ aspectRatio: aspect }}
        >
          <img
            src={image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: "center",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.45)" }}
          />
        </div>
      </div>

      <div className="px-4 py-3 border-t border-border/40 space-y-3 bg-background">
        <p className="text-[10px] text-muted-foreground">
          Lightweight center-crop mode: choose an aspect, zoom, and rotate. Fine
          drag positioning is unavailable until the optional crop package is
          installed.
        </p>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Aspect lock
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ASPECT_PRESETS.map((a) => {
              const active = Math.abs(a.value - aspect) < 0.001;
              return (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => setAspect(a.value)}
                  data-testid={`crop-aspect-${a.label}`}
                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all ${
                    active
                      ? "border-transparent text-foreground"
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                  style={active ? { background: brandColor } : undefined}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-12">
            Zoom
          </span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-current"
            style={{ color: brandColor }}
            aria-label="Zoom"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="h-8 text-[11px]"
            aria-label="Rotate 90 degrees"
          >
            <RotateCw className="w-3.5 h-3.5 mr-1" />
            Rotate
          </Button>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={working || !cropPixels}
            data-testid="crop-apply"
            className="h-9 font-bold"
            style={{ background: brandColor, color: "#fff" }}
          >
            {working ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cropping...
              </>
            ) : (
              "Use cropped asset"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
