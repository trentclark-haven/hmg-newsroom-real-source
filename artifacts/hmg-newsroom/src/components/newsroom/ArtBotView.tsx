import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  useGenerateImage,
  useGenerateImagePromptPack,
  type Silo as ApiSilo,
} from "@workspace/api-client-react";
import { hasDraft, useDraft } from "@/lib/useDraft";
import {
  AlertTriangle,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Eraser,
  FileText,
  Image as ImageIcon,
  Images,
  ImageUp,
  LayoutTemplate,
  Loader2,
  Upload,
  Shield,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { verticals } from "@/lib/mock-data";
import { recordAudit } from "@/lib/auditLog";
import { recordSafeModeBlock, useSafeMode } from "@/lib/safeMode";
import { formatBytes } from "@/lib/mediaLimits";
import {
  enqueue,
  isAlreadyRunning,
  dedupeKeyOf,
  DuplicateJobError,
} from "@/lib/requestQueue";
import { runThroughBreaker, CircuitOpenError } from "@/lib/circuitBreaker";
import { startJob, completeJob } from "@/lib/jobLedger";
import { getOperatorInitials } from "@/lib/operatorProfile";
import { SiloPicker } from "./SiloPicker";
import { SourcePacketPanel } from "@/components/hmg/SourcePacketPanel";
import { NextActionBar, type NextAction } from "@/components/hmg/NextActionBar";
import { useMediaLibrary } from "@/lib/useMediaLibrary";
import {
  AI_USE_CHIPS,
  QUALITY_LABELS,
  UPLOAD_LABEL_CHOICES,
  buildImageBrief,
  detectLikenessRisk,
  enforceConceptOnly,
  labelsForAsset,
  type AssetSource,
  type ImageBrief,
  type QualityLabelId,
} from "./artbotConfig";
import { QualityBadge } from "./QualityBadge";
import { Library } from "lucide-react";
import {
  UniversalMediaSource,
  type MediaAction,
  type MediaActionId,
} from "@/components/media/UniversalMediaSource";
import type { MediaItem } from "@/components/media/mediaItem";
import {
  IMAGE_ACCEPTED_TYPES,
  createPreviewAsset,
  readImageDimensions,
  revokePreviewAsset,
  validateImageFile,
} from "@/lib/hmg/performance/mediaReadiness";

const ImageCropper = lazy(() =>
  import("./ImageCropper").then((m) => ({ default: m.ImageCropper }))
);
const OfficialSourceGuide = lazy(() =>
  import("./OfficialSourceGuide").then((m) => ({ default: m.OfficialSourceGuide }))
);
const TemplateStudio = lazy(() =>
  import("./TemplateStudio").then((m) => ({ default: m.TemplateStudio }))
);
const CollageStudio = lazy(() =>
  import("./CollageStudio").then((m) => ({ default: m.CollageStudio }))
);

const ARTBOT_MEDIA_ACTIONS: MediaAction[] = [
  { id: "main-image", label: "Use as Main Image", primary: true },
  { id: "overlay", label: "Use as Overlay" },
];

type CaptionMode = "auto" | "manual";

interface PromptPack {
  websitePrompt: string;
  instagramFeedPrompt: string;
  instagramStoryPrompt: string;
  tiktokShortsPrompt: string;
  youtubeThumbnailPrompt: string;
  xPrompt: string;
  facebookPrompt: string;
  caption: string;
  altText: string;
}

interface ApiErrorLike {
  data?: { error?: string; code?: string } | null;
  message?: string;
  status?: number;
}

function readError(err: unknown): { message: string; code?: string } {
  const e = err as ApiErrorLike;
  const dataError =
    e?.data && typeof e.data === "object"
      ? (e.data as { error?: string; code?: string })
      : null;
  const message =
    dataError?.error ||
    (typeof e?.message === "string" ? e.message : "Image generation failed.");
  return { message, code: dataError?.code };
}

const PROMPT_PACK_LABELS: Array<{
  key: keyof Omit<PromptPack, "caption" | "altText">;
  label: string;
}> = [
  { key: "websitePrompt", label: "Website hero · 1200×670" },
  { key: "instagramFeedPrompt", label: "Instagram feed · 1080×1350" },
  { key: "instagramStoryPrompt", label: "Instagram story · 1080×1920" },
  { key: "tiktokShortsPrompt", label: "TikTok / YT Shorts · 1080×1920" },
  { key: "youtubeThumbnailPrompt", label: "YouTube thumbnail · 1280×720" },
  { key: "xPrompt", label: "X · 1600×900" },
  { key: "facebookPrompt", label: "Facebook · 1200×630" },
];

interface ArtBotDraft {
  silo: ApiSilo;
  prompt: string;
  headline: string;
  subheadline?: string;
  credit?: string;
  watermarkPlacement?: WatermarkPlacement;
  layoutPreset?: LayoutPresetId;
  brandTemplate?: BrandTemplateId;
}

const ARTBOT_DRAFT_KEY = "hmg-artbot-draft-v1";
const ARTBOT_PROMPT_MAX_CHARS = 4000;

type LayoutPresetId =
  | "website-hero"
  | "article-featured"
  | "ig-square"
  | "ig-story"
  | "social-landscape"
  | "youtube-thumb"
  | "breaking-card";

const ARTBOT_LAYOUT_PRESETS: Array<{
  id: LayoutPresetId;
  label: string;
  size: string;
  ratio: string;
  use: string;
}> = [
  {
    id: "website-hero",
    label: "Website hero collage",
    size: "1600x900",
    ratio: "16 / 9",
    use: "Homepage and story lead",
  },
  {
    id: "article-featured",
    label: "Article featured image",
    size: "1200x675",
    ratio: "16 / 9",
    use: "WordPress feature",
  },
  { id: "ig-square", label: "IG square", size: "1080x1080", ratio: "1 / 1", use: "Feed post" },
  { id: "ig-story", label: "IG story", size: "1080x1920", ratio: "9 / 16", use: "Story frame" },
  {
    id: "social-landscape",
    label: "X/Facebook landscape",
    size: "1200x630",
    ratio: "1.91 / 1",
    use: "Social link card",
  },
  {
    id: "youtube-thumb",
    label: "YouTube thumbnail",
    size: "1280x720",
    ratio: "16 / 9",
    use: "Video thumbnail",
  },
  {
    id: "breaking-card",
    label: "Breaking-news card",
    size: "1080x1350",
    ratio: "4 / 5",
    use: "Urgent feed card",
  },
];

type BrandTemplateId = "steel" | "breaking" | "culture" | "clean";

const ARTBOT_BRAND_TEMPLATES: Array<{
  id: BrandTemplateId;
  label: string;
  description: string;
}> = [
  { id: "steel", label: "Steel premium", description: "Dark gloss, silver frame, clean authority" },
  { id: "breaking", label: "Breaking strip", description: "Loud top bar, urgent lower third" },
  { id: "culture", label: "Culture collage", description: "Layered photos, bold pull quote energy" },
  { id: "clean", label: "Clean feature", description: "Editorial image first, restrained labels" },
];

type WatermarkPlacement = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "none";

const WATERMARK_OPTIONS: Array<{ id: WatermarkPlacement; label: string }> = [
  { id: "bottom-right", label: "Bottom right" },
  { id: "bottom-left", label: "Bottom left" },
  { id: "top-right", label: "Top right" },
  { id: "top-left", label: "Top left" },
  { id: "none", label: "No logo" },
];

interface ArtbotTrayAsset {
  id: string;
  name: string;
  size: number;
  type: string;
  src: string;
  objectUrl: string;
  dimensions?: { width: number; height: number };
  readiness: "ready" | "large" | "blocked";
  readinessLabel: string;
  readinessDetail: string;
}

const ARTBOT_OBJECT_URL_OWNER = "artbot-builder";
const MAX_ARTBOT_TRAY_ASSETS = 10;

export function ArtBotView() {
  const [draft, setDraft, clearDraft] = useDraft<ArtBotDraft>(
    ARTBOT_DRAFT_KEY,
    {
      silo: verticals[0].id as ApiSilo,
      prompt: "",
      headline: "",
      subheadline: "",
      credit: "",
      watermarkPlacement: "bottom-right",
      layoutPreset: "website-hero",
      brandTemplate: "steel",
    },
  );
  const silo = draft.silo;
  const prompt = draft.prompt;
  const headline = draft.headline;
  const subheadline = draft.subheadline ?? "";
  const credit = draft.credit ?? "";
  const watermarkPlacement = draft.watermarkPlacement ?? "bottom-right";
  const layoutPreset = draft.layoutPreset ?? "website-hero";
  const brandTemplate = draft.brandTemplate ?? "steel";
  const setSilo = (v: ApiSilo) => setDraft((p) => ({ ...p, silo: v }));
  const setPrompt = (v: string) => setDraft((p) => ({ ...p, prompt: v }));
  const setHeadline = (v: string) => setDraft((p) => ({ ...p, headline: v }));
  const setSubheadline = (v: string) =>
    setDraft((p) => ({ ...p, subheadline: v }));
  const setCredit = (v: string) => setDraft((p) => ({ ...p, credit: v }));
  const setWatermarkPlacement = (v: WatermarkPlacement) =>
    setDraft((p) => ({ ...p, watermarkPlacement: v }));
  const setLayoutPreset = (v: LayoutPresetId) =>
    setDraft((p) => ({ ...p, layoutPreset: v }));
  const setBrandTemplate = (v: BrandTemplateId) =>
    setDraft((p) => ({ ...p, brandTemplate: v }));
  const [draftSaved, setDraftSaved] = useState<boolean>(() =>
    hasDraft(ARTBOT_DRAFT_KEY),
  );
  useEffect(() => {
    const i = setInterval(
      () => setDraftSaved(hasDraft(ARTBOT_DRAFT_KEY)),
      800,
    );
    return () => clearInterval(i);
  }, []);

  const [assetSource, setAssetSource] = useState<AssetSource>("upload");
  const [image, setImage] = useState<string | null>(null);
  const [imageOrigin, setImageOrigin] = useState<"upload" | "ai" | null>(null);
  const [uploadLabel, setUploadLabel] = useState<QualityLabelId>("editorial-ready");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [captionMode, setCaptionMode] = useState<CaptionMode>("auto");
  const [manualCaption, setManualCaption] = useState("");
  const [errorDetail, setErrorDetail] = useState<{
    message: string;
    code?: string;
  } | null>(null);
  const [promptPack, setPromptPack] = useState<PromptPack | null>(null);
  const [storyNotesOpen, setStoryNotesOpen] = useState(false);
  const [imageBrief, setImageBrief] = useState<ImageBrief | null>(null);
  const [briefEmpty, setBriefEmpty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const trayFileRef = useRef<HTMLInputElement>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [assetTray, setAssetTray] = useState<ArtbotTrayAsset[]>([]);
  const assetTrayRef = useRef<ArtbotTrayAsset[]>([]);
  const cropObjectUrlRef = useRef<string | null>(null);
  const overlayInjector = useRef<((dataUrl: string) => void) | null>(null);
  const mutation = useGenerateImage();
  const packMutation = useGenerateImagePromptPack();
  const { enabled: safeMode } = useSafeMode();
  const mediaLibrary = useMediaLibrary();

  const v = verticals.find((x) => x.id === silo)!;
  const qualityLabels = labelsForAsset(imageOrigin, uploadLabel);
  const selectedLayout =
    ARTBOT_LAYOUT_PRESETS.find((preset) => preset.id === layoutPreset) ??
    ARTBOT_LAYOUT_PRESETS[0];
  const activeTemplate =
    ARTBOT_BRAND_TEMPLATES.find((template) => template.id === brandTemplate) ??
    ARTBOT_BRAND_TEMPLATES[0];
  const previewImage = image ?? assetTray[0]?.src ?? null;
  const totalTrayBytes = useMemo(
    () => assetTray.reduce((sum, asset) => sum + asset.size, 0),
    [assetTray],
  );
  const largeTrayAssets = useMemo(
    () => assetTray.filter((asset) => asset.readiness === "large").length,
    [assetTray],
  );
  const trayReadinessLabel = assetTray.length
    ? `${assetTray.length}/${MAX_ARTBOT_TRAY_ASSETS} staged · ${formatBytes(totalTrayBytes)}${largeTrayAssets ? ` · ${largeTrayAssets} large` : ""}`
    : `Accepts ${IMAGE_ACCEPTED_TYPES.map((type) => type.replace("image/", "").toUpperCase()).join(", ")}`;

  useEffect(() => {
    assetTrayRef.current = assetTray;
  }, [assetTray]);

  useEffect(
    () => () => {
      assetTrayRef.current.forEach(revokePreviewAsset);
      revokePreviewAsset({ objectUrl: cropObjectUrlRef.current ?? "", src: cropObjectUrlRef.current ?? "" });
    },
    [],
  );

  function appendChip(chipPrompt: string) {
    setPrompt((prompt ? `${prompt.trim()} ` : "") + chipPrompt);
  }

  function handleMediaPick(item: MediaItem, action: MediaActionId) {
    const src = item.dataUrl || item.localObjectUrl || item.thumbUrl;
    if (!src) {
      toast.error("This asset has no usable image yet — re-select the file.");
      return;
    }
    if (action === "main-image") {
      setImage(src);
      setImageOrigin("upload");
      setAssetSource("upload");
      toast.success("Set as main image");
    } else if (action === "overlay") {
      overlayInjector.current?.(src);
    }
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (safeMode) {
      recordSafeModeBlock("media-upload", "ArtBotView/upload");
      toast.error("Safe Mode is on — media uploads disabled.");
      return;
    }
    const validation = validateImageFile(file);
    if (!validation.ok) {
      toast.error(validation.detail);
      return;
    }
    if (validation.level === "large") {
      toast.message(validation.detail);
    }
    revokePreviewAsset({ objectUrl: cropObjectUrlRef.current ?? "", src: cropObjectUrlRef.current ?? "" });
    const preview = createPreviewAsset(file, ARTBOT_OBJECT_URL_OWNER);
    cropObjectUrlRef.current = preview.objectUrl;
    setCropSrc(preview.src);
  }

  function handleTrayUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    if (safeMode) {
      recordSafeModeBlock("media-upload", "ArtBotView/asset-tray-upload");
      toast.error("Safe Mode is on — media uploads disabled.");
      return;
    }
    const room = MAX_ARTBOT_TRAY_ASSETS - assetTray.length;
    if (room <= 0) {
      toast.message(`Tray limit reached (${MAX_ARTBOT_TRAY_ASSETS} images).`);
      return;
    }
    if (files.length > room) {
      toast.message(`Adding the first ${room} image${room === 1 ? "" : "s"} that fit the tray.`);
    }
    const accepted: ArtbotTrayAsset[] = [];
    for (const file of files) {
      if (accepted.length >= room) break;
      const validation = validateImageFile(file);
      if (!validation.ok) {
        toast.error(`${file.name}: ${validation.detail}`);
        continue;
      }
      const preview = createPreviewAsset(file, ARTBOT_OBJECT_URL_OWNER);
      const asset: ArtbotTrayAsset = {
        id: preview.id,
        name: preview.name,
        size: preview.size,
        type: preview.type,
        src: preview.src,
        objectUrl: preview.objectUrl,
        readiness: preview.readiness.level,
        readinessLabel: preview.readiness.label,
        readinessDetail: preview.readiness.detail,
      };
      accepted.push(asset);
      if (validation.level === "large") {
        toast.message(`${file.name}: ${validation.detail}`);
      }
      readImageDimensions(preview.src)
        .then((dimensions) => {
          setAssetTray((prev) =>
            prev.map((item) => (item.id === asset.id ? { ...item, dimensions } : item)),
          );
        })
        .catch(() => undefined);
    }

    if (!accepted.length) {
      toast.error("Choose image assets for the tray.");
      return;
    }

    setAssetTray((prev) => [...prev, ...accepted].slice(0, MAX_ARTBOT_TRAY_ASSETS));
    toast.success(`${accepted.length} asset${accepted.length === 1 ? "" : "s"} added to WebArt tray`);
  }

  function clearAssetTray() {
    const selectedTraySrcs = new Set(assetTrayRef.current.map((asset) => asset.src));
    if (image && selectedTraySrcs.has(image)) {
      setImage(null);
      setImageOrigin(null);
    }
    setAssetTray((prev) => {
      prev.forEach(revokePreviewAsset);
      return [];
    });
    toast.message("Asset tray cleared");
  }

  function cancelCrop() {
    revokePreviewAsset({ objectUrl: cropObjectUrlRef.current ?? "", src: cropObjectUrlRef.current ?? "" });
    cropObjectUrlRef.current = null;
    setCropSrc(null);
  }

  function handleCropApply(croppedDataUrl: string) {
    setImage(croppedDataUrl);
    setImageOrigin("upload");
    setErrorDetail(null);
    setPromptPack(null);
    cancelCrop();
    if (captionMode === "auto" && !headline.trim() && prompt.trim()) {
      setHeadline(prompt.trim().split(/\s+/).slice(0, 6).join(" ").toUpperCase());
    }
    recordAudit(
      "image-generated",
      silo,
      `Uploaded editorial asset (${QUALITY_LABELS[uploadLabel].short})`,
    );
    toast.success("Asset cropped and ready to frame");
  }

  async function runPromptPackFallback() {
    try {
      const data = await packMutation.mutateAsync({
        data: {
          prompt: prompt.trim(),
          headline: headline || undefined,
          silo,
        },
      });
      setPromptPack(data as unknown as PromptPack);
      toast.success("Prompt pack ready — paste these into your image tool.");
    } catch (err) {
      const detail = readError(err);
      toast.error(`Prompt pack also failed: ${detail.message}`);
    }
  }

  async function handleGenerate() {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      toast.error("Add a concept prompt for WebArt.");
      return;
    }
    if (cleanPrompt.length > ARTBOT_PROMPT_MAX_CHARS) {
      const detail = {
        message: `Prompt too large. Keep WebArt prompts under ${ARTBOT_PROMPT_MAX_CHARS.toLocaleString()} characters so the request stays below payload limits.`,
        code: "prompt_too_large",
      };
      setErrorDetail(detail);
      toast.error(detail.message);
      return;
    }
    if (safeMode) {
      recordSafeModeBlock("ai-call", "ArtBotView/generate");
      toast.error("Safe Mode is on — AI calls disabled.");
      return;
    }
    // Concept-only lock: never let AI fabricate a real public figure.
    if (detectLikenessRisk(cleanPrompt)) {
      const detail = {
        message:
          "This prompt asks for a real-person likeness. AI is concept-only — use Upload & crop with an official-source frame for real artists, athletes or public figures.",
        code: "likeness_blocked",
      };
      setErrorDetail(detail);
      toast.error("Real-person likeness blocked — use Upload & crop instead.");
      return;
    }
    const dedupeKey = dedupeKeyOf("image", silo, cleanPrompt);
    if (isAlreadyRunning({ kind: "image-ai", dedupeKey })) {
      toast.message("Already running");
      return;
    }
    setErrorDetail(null);
    setPromptPack(null);
    const jobId = startJob({
      kind: "image-ai",
      silo,
      summary: `Image gen 1024x1024 (prompt ${cleanPrompt.length}c)`,
      operator: getOperatorInitials() || null,
    });
    try {
      const data = (await enqueue({ kind: "image-ai", dedupeKey }, () =>
        runThroughBreaker("ai-image", () =>
          mutation.mutateAsync({
            data: { silo, prompt: enforceConceptOnly(cleanPrompt), size: "1024x1024" },
          }),
        ),
      )) as unknown as { image: string };
      setImage(data.image);
      setImageOrigin("ai");
      if (captionMode === "auto" && !headline.trim()) {
        const words = cleanPrompt.split(/\s+/).slice(0, 6).join(" ");
        setHeadline(words.toUpperCase());
      }
      toast.success("Concept graphic ready");
      recordAudit(
        "image-generated",
        silo,
        `AI concept 1024x1024 (prompt ${cleanPrompt.length}c)`,
      );
      completeJob(jobId, { status: "success" });
    } catch (err) {
      completeJob(jobId, { status: "failure", error: err });
      if (err instanceof DuplicateJobError) {
        toast.message("Already running");
        return;
      }
      if (err instanceof CircuitOpenError) {
        const detail = {
          message:
            "Image generation is cooling down after repeated failures. Try again shortly.",
          code: "circuit_open",
        };
        setErrorDetail(detail);
        toast.error(detail.message);
        void runPromptPackFallback();
        return;
      }
      const detail = readError(err);
      setErrorDetail(detail);
      toast.error(detail.message);
      // Always try the prompt-pack fallback so the editor still walks away with
      // something usable for an external image tool.
      void runPromptPackFallback();
    }
  }

  function handleImageBrief(content: string) {
    const brief = buildImageBrief(content, v.name, v.color);
    if (!brief) {
      setImageBrief(null);
      setBriefEmpty(true);
      toast.message("Add a few notes first — there is nothing to build a brief from yet.");
      return;
    }
    setImageBrief(brief);
    setBriefEmpty(false);
    if (captionMode === "auto" && !headline.trim() && brief.headlineOptions[0]) {
      setHeadline(brief.headlineOptions[0]);
    }
    toast.success("Image brief ready");
  }

  const overlayCaption =
    captionMode === "manual" ? manualCaption.toUpperCase() : undefined;
  const captionText = (overlayCaption || headline || "").trim();
  const isLoading = mutation.isPending;

  function downloadImage(format: "png" | "jpg") {
    if (!image) return;
    const fileBase = `hmg-${silo}-image-${Date.now()}`;
    if (format === "png") {
      const a = document.createElement("a");
      a.href = image;
      a.download = `${fileBase}.png`;
      a.click();
      toast.success("Downloading PNG");
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        toast.error("Could not render JPG — try PNG.");
        return;
      }
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/jpeg", 0.92);
      a.download = `${fileBase}.jpg`;
      a.click();
      toast.success("Downloading JPG");
    };
    img.onerror = () => toast.error("Could not load image for JPG export.");
    img.src = image;
  }

  function copyCaption() {
    if (!captionText) {
      toast.error("No caption yet — add a headline or caption first.");
      return;
    }
    navigator.clipboard
      .writeText(captionText)
      .then(() => toast.success("Caption copied"))
      .catch(() => toast.error("Copy failed"));
  }

  function saveToMediaLibrary() {
    if (!image) return;
    mediaLibrary.add({
      name: captionText || `${v.name} image`,
      type: "image",
      silo,
      intendedUse: imageOrigin === "ai" ? "AI concept image" : "Editorial image",
    });
    recordAudit("image-generated", silo, "Saved image to Media Library");
    toast.success("Saved to Media Library");
  }

  function createGraphicFromTray() {
    const firstAsset = assetTray[0];
    if (!firstAsset) {
      trayFileRef.current?.click();
      return;
    }
    setImage(firstAsset.src);
    setImageOrigin("upload");
    setAssetSource("upload");
    toast.success("Graphic preview ready");
  }

  function copyVisualPacket() {
    const packet = [
      "HMG Visual Direction Kit",
      `Brand: ${v.name}`,
      `Format: ${selectedLayout.label}`,
      `Size: ${selectedLayout.size}`,
      `Template: ${activeTemplate.label}`,
      `Assets: ${assetTray.length}`,
      `Headline: ${headline || "(add headline overlay)"}`,
      `Subheadline: ${subheadline || "(optional)"}`,
      `Credit: ${credit || "(add source / credit line)"}`,
      `Watermark: ${watermarkPlacement}`,
      `Readiness: ${headline ? "Ready for preview" : "Needs headline"}`,
    ].join("\n");

    navigator.clipboard
      .writeText(packet)
      .then(() => toast.success("Visual kit copied"))
      .catch(() => toast.error("Copy failed"));
  }

  const imageActions: NextAction[] = [
    { id: "download-png", label: "Download PNG", onClick: () => downloadImage("png") },
    { id: "download-jpg", label: "Download JPG", onClick: () => downloadImage("jpg") },
    {
      id: "copy-caption",
      label: "Copy Caption",
      onClick: copyCaption,
      disabled: !captionText,
      blockedReason: !captionText ? "Add a headline or caption first." : undefined,
    },
    {
      id: "export-all-sizes",
      label: "Export All Sizes",
      disabled: true,
      blockedReason:
        "Pick your sizes in the Preview & Export panel below, then export each one.",
    },
    { id: "save-media", label: "Save to Media Library", onClick: saveToMediaLibrary },
    {
      id: "send-social",
      label: "Open Social Factory",
      disabled: true,
      blockedReason:
        "Cross-desk handoff is not connected yet — export the visual output, then open Social Factory.",
    },
    {
      id: "send-wordpress",
      label: "Export WordPress Featured Image",
      disabled: true,
      blockedReason:
        "Publish Blocked here — export the image and set it as the featured image in WordPress.",
    },
  ];

  return (
    <div className="hmg-studio-mode flex-1 flex flex-col min-h-0 px-4 pt-3 pb-4 overflow-y-auto bg-background text-foreground">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "#A855F7", color: "#fff" }}
        >
          <ImageUp className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-black tracking-tight leading-none">
            WebArt
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            Start with your image, frame it on brand, and export every size you
            need.
          </p>
        </div>
      </div>

      {/* 1. Brand selector */}
      <div
        data-testid="artbot-brand-rail"
        className="mb-3 rounded-xl border p-2.5"
        style={{ borderColor: `${v.color}55`, background: `${v.color}12` }}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Brand
          </p>
          <span
            data-testid="artbot-current-brand"
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0"
            style={{ background: v.color, color: v.onAccent }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            {v.name}
          </span>
        </div>
        <SiloPicker value={silo} onChange={setSilo} />
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Frames &amp; exports follow{" "}
          <span className="font-bold" style={{ color: v.color }}>
            {v.name}
          </span>{" "}
          styling.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]" data-testid="artbot-builder-shell">
        <section className="rounded-2xl border border-border/60 bg-card/45 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4" style={{ color: v.color }} />
              <div>
          <h3 className="text-[12px] font-black uppercase tracking-wider text-foreground">
                  WebArt Flow
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Upload assets, choose canvas, arrange, preview, and export.
                </p>
              </div>
            </div>
            <span
              className="rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider"
              style={{ background: v.color, color: v.onAccent }}
            >
              {selectedLayout.size}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Brand template
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {ARTBOT_BRAND_TEMPLATES.map((template) => {
                  const active = brandTemplate === template.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setBrandTemplate(template.id)}
                      className={`rounded-xl border px-2.5 py-2 text-left transition-all ${
                        active
                          ? "border-transparent"
                          : "border-border/60 bg-secondary/20 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      }`}
                      style={active ? { background: v.accentBg || v.color, color: v.onAccent } : undefined}
                    >
                      <span className="block text-[11px] font-black uppercase tracking-tight">
                        {template.label}
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-tight opacity-80">
                        {template.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Layout presets
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {ARTBOT_LAYOUT_PRESETS.map((preset) => {
                  const active = layoutPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setLayoutPreset(preset.id)}
                      data-testid={`artbot-layout-${preset.id}`}
                      className={`rounded-xl border px-2.5 py-2 text-left transition-all ${
                        active
                          ? "border-transparent"
                          : "border-border/60 bg-secondary/20 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      }`}
                      style={active ? { background: `${v.color}22`, borderColor: `${v.color}88` } : undefined}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black uppercase tracking-tight text-foreground">
                          {preset.label}
                        </span>
                        <span className="shrink-0 text-[10px] font-bold text-muted-foreground">
                          {preset.size}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">
                        {preset.use}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Overlay fields
              </p>
              <div className="grid gap-2">
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Headline overlay"
                  className="h-10 bg-secondary/60 border-border text-sm"
                  data-testid="artbot-headline"
                />
                <Input
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="Subheadline"
                  className="h-10 bg-secondary/60 border-border text-sm"
                  data-testid="artbot-subheadline"
                />
                <Input
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  placeholder="Credit / source line"
                  className="h-10 bg-secondary/60 border-border text-sm"
                  data-testid="artbot-credit"
                />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Watermark / logo placement
              </p>
              <div className="flex flex-wrap gap-1.5">
                {WATERMARK_OPTIONS.map((option) => {
                  const active = watermarkPlacement === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setWatermarkPlacement(option.id)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all ${
                        active
                          ? "border-transparent"
                          : "border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                      style={active ? { background: v.color, color: v.onAccent } : undefined}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/45 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Images className="h-4 w-4" style={{ color: v.color }} />
              <div>
                <h3 className="text-[12px] font-black uppercase tracking-wider text-foreground">
                  Asset tray
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  Multi-upload staging for collage, cover, and overlay assets.
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/80">
                  {trayReadinessLabel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {assetTray.length ? (
                <button
                  type="button"
                  onClick={clearAssetTray}
                  className="inline-flex h-8 items-center rounded-full border border-border/60 px-3 text-[11px] font-bold text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                >
                  Clear
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => trayFileRef.current?.click()}
                disabled={safeMode || assetTray.length >= MAX_ARTBOT_TRAY_ASSETS}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/60 px-3 text-[11px] font-bold text-foreground hover:border-foreground/40 disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </div>
          <input
            ref={trayFileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleTrayUpload}
            className="hidden"
            data-testid="artbot-tray-upload"
            aria-label="Upload multiple WebArt assets"
          />

          {assetTray.length ? (
            <div className="grid grid-cols-3 gap-2">
              {assetTray.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    setImage(asset.src);
                    setImageOrigin("upload");
                    setAssetSource("upload");
                    toast.success("Asset loaded into preview");
                  }}
                  className="group overflow-hidden rounded-xl border border-border/60 bg-secondary/20 text-left"
                  title={`${asset.name} (${formatBytes(asset.size)}) · ${asset.readinessDetail}`}
                >
                  <div className="relative">
                    <img src={asset.src} alt="" className="aspect-square w-full object-cover transition-transform group-hover:scale-105" />
                    <span
                      className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                        asset.readiness === "large"
                          ? "bg-amber-400 text-black"
                          : "bg-emerald-400 text-black"
                      }`}
                    >
                      {asset.readinessLabel}
                    </span>
                  </div>
                  <span className="block truncate px-1.5 py-1 text-[9px] font-semibold text-muted-foreground">
                    {asset.name}
                  </span>
                  <span className="block truncate px-1.5 pb-1 text-[8px] text-muted-foreground/75">
                    {formatBytes(asset.size)}
                    {asset.dimensions ? ` · ${asset.dimensions.width}x${asset.dimensions.height}` : ""}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => trayFileRef.current?.click()}
              disabled={safeMode}
              className="grid min-h-[112px] w-full place-items-center rounded-xl border border-dashed border-border/70 bg-secondary/20 px-3 text-center disabled:opacity-50"
            >
              <span>
                <Images className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <span className="mt-2 block text-[12px] font-bold text-foreground">
                  Add multiple photos, frames, logos, or texture assets
                </span>
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  Local preview only until you export. JPG, PNG, WebP, or GIF.
                </span>
              </span>
            </button>
          )}

          <div className="mt-3 rounded-xl border border-border/60 bg-black/20 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Preview canvas
              </p>
              <span className="text-[10px] text-muted-foreground">
                {activeTemplate.label}
              </span>
            </div>
            <div
              className="relative mx-auto w-full max-w-[380px] overflow-hidden rounded-xl border border-white/10 bg-neutral-950"
              style={{ aspectRatio: selectedLayout.ratio }}
            >
              {previewImage ? (
                <img src={previewImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
                  <ImageIcon className="h-10 w-10 text-white/20" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3">
                <span
                  className="mb-2 inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider"
                  style={{ background: v.color, color: v.onAccent }}
                >
                  {selectedLayout.label}
                </span>
                <p className="text-xl font-black uppercase leading-none text-white drop-shadow">
                  {headline || "Headline overlay"}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] font-semibold text-white/80">
                  {subheadline || "Subheadline and context line"}
                </p>
                {credit && (
                  <p className="mt-2 text-[9px] font-semibold uppercase tracking-wider text-white/60">
                    {credit}
                  </p>
                )}
              </div>
              {watermarkPlacement !== "none" && (
                <div
                  className={`absolute rounded-lg bg-black/60 px-2 py-1 text-[10px] font-black text-white ${
                    watermarkPlacement === "top-left"
                      ? "left-2 top-2"
                      : watermarkPlacement === "top-right"
                        ? "right-2 top-2"
                        : watermarkPlacement === "bottom-left"
                          ? "left-2 bottom-2"
                          : "right-2 bottom-2"
                  }`}
                >
                  {v.logo ? <img src={v.logo} alt="" className="h-4 w-4 object-contain" /> : "HMG"}
                </div>
              )}
            </div>

            <div className="mt-3 rounded-lg border border-border/50 bg-secondary/20 p-2">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" />
                Export panel
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] text-muted-foreground">
                <span>Format: {selectedLayout.label}</span>
                <span>Size: {selectedLayout.size}</span>
                <span>Template: {activeTemplate.label}</span>
                <span>Assets: {assetTray.length}</span>
                <span>Headline: {headline ? "ready" : "needed"}</span>
                <span>Credit: {credit ? "ready" : "optional"}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={createGraphicFromTray}
                disabled={safeMode}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-[12px] font-black uppercase tracking-wider disabled:opacity-50 sm:flex-none"
                style={{ background: v.color, color: v.onAccent }}
                data-testid="artbot-create-graphic-from-tray"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {assetTray.length ? "Create Graphic" : "Upload Assets"}
              </button>
              <button
                type="button"
                onClick={copyVisualPacket}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border/60 px-4 text-[12px] font-bold text-foreground/90 hover:border-foreground/40"
              >
                Copy Visual Packet
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-3 rounded-2xl border border-border/60 bg-card/45 p-3">
        <Suspense fallback={<div className="flex items-center justify-center h-32 text-muted-foreground text-xs">Loading studio…</div>}>
          <CollageStudio
            silo={silo}
            siloName={v.name}
            brand={{ color: v.color, on: v.onAccent }}
            logo={v.logo}
          />
        </Suspense>
      </section>

      {/* 2. Image source selector — Upload Image is primary; AI Idea is secondary */}
      <div className="mt-1" data-testid="artbot-image-source-block">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          Image source
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAssetSource("upload")}
            data-testid="artbot-source-upload"
            className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
              assetSource === "upload"
                ? "border-transparent"
                : "border-border/60 hover:border-border"
            }`}
            style={
              assetSource === "upload"
                ? { background: v.color, color: v.onAccent }
                : undefined
            }
          >
            <span className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-tight">
              <BadgeCheck className="w-4 h-4" />
              Upload Image
            </span>
            <span
              className={`block text-[10px] mt-0.5 ${
                assetSource === "upload" ? "opacity-90" : "text-muted-foreground"
              }`}
            >
              Official frame or licensed photo · recommended
            </span>
          </button>
          <button
            type="button"
            onClick={() => setAssetSource("ai")}
            data-testid="artbot-source-ai"
            className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
              assetSource === "ai"
                ? "border-transparent"
                : "border-border/60 hover:border-border"
            }`}
            style={
              assetSource === "ai"
                ? { background: v.color, color: v.onAccent }
                : undefined
            }
          >
            <span className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-tight">
              <Sparkles className="w-4 h-4" />
              Create Concept Graphic
            </span>
            <span
              className={`block text-[10px] mt-0.5 ${
                assetSource === "ai" ? "opacity-90" : "text-muted-foreground"
              }`}
            >
              Concept art only · never real people
            </span>
          </button>
        </div>
      </div>

      {draftSaved && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => {
              clearDraft();
              setDraftSaved(false);
              toast.message("Draft cleared");
            }}
            data-testid="artbot-clear-draft"
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-border"
          >
            <Eraser className="w-3.5 h-3.5" />
            Clear draft
          </button>
        </div>
      )}

      {/* ---- UPLOAD SOURCE ---- */}
      {assetSource === "upload" && (
        <div className="mt-3 space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            data-testid="artbot-upload-media"
            aria-label="Upload editorial asset"
          />
          <Button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={safeMode}
            className="w-full h-11 font-bold rounded-xl"
            style={{ background: v.color, color: v.onAccent }}
            data-testid="artbot-upload-trigger"
          >
            <ImageUp className="w-4 h-4 mr-2" />
            Upload official frame or licensed photo
          </Button>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Quality label (baked into every export)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {UPLOAD_LABEL_CHOICES.map((id) => {
                const def = QUALITY_LABELS[id];
                const active = uploadLabel === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setUploadLabel(id)}
                    data-testid={`artbot-label-${id}`}
                    title={def.description}
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all ${
                      active
                        ? "border-transparent text-foreground"
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                    style={active ? { background: v.color, color: v.onAccent } : undefined}
                  >
                    {def.short}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {QUALITY_LABELS[uploadLabel].description}
            </p>
          </div>

          <Suspense fallback={<div className="flex items-center justify-center h-16 text-muted-foreground text-xs">Loading guide…</div>}>
            <OfficialSourceGuide />
          </Suspense>
        </div>
      )}

      {/* ---- AI CONCEPT SOURCE ---- */}
      {assetSource === "ai" && (
        <div className="mt-3 space-y-3">
          <div
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5"
            data-testid="artbot-ai-notice"
          >
            <div className="flex items-start gap-1.5">
              <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-300" />
              <div className="text-[11px] text-amber-700 dark:text-amber-100/90 leading-relaxed">
                <strong className="text-amber-700 dark:text-amber-200">Concept art only.</strong>{" "}
                Use AI for backgrounds, textures and abstract concepts — never to
                depict a real artist, athlete or public figure. Every AI export is
                labeled <em>AI concept only</em> and <em>Not celebrity-verified</em>.
                For real people, switch to Upload &amp; crop.
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Concept starters
            </p>
            <div className="flex flex-wrap gap-1.5">
              {AI_USE_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => appendChip(chip.prompt)}
                  data-testid={`artbot-chip-${chip.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Describe a concept for ${v.name} (no real people)...`}
            maxLength={ARTBOT_PROMPT_MAX_CHARS}
            disabled={isLoading}
            className="min-h-[90px] resize-none bg-secondary/60 border-border text-sm"
            data-testid="artbot-prompt"
          />
          <div className="text-[10px] text-muted-foreground text-right">
            {prompt.trim().length.toLocaleString()}/{ARTBOT_PROMPT_MAX_CHARS.toLocaleString()}
          </div>

          {safeMode && (
            <p
              data-testid="artbot-safe-mode-note"
              className="text-[11px] text-amber-300"
            >
              Safe Mode is on — AI calls disabled.
            </p>
          )}

          <Button
            onClick={handleGenerate}
            disabled={
              isLoading ||
              !prompt.trim() ||
              prompt.trim().length > ARTBOT_PROMPT_MAX_CHARS ||
              safeMode
            }
            className="w-full h-10 font-bold rounded-full"
            style={{ background: "#A855F7", color: "#fff" }}
            data-testid="artbot-generate"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                        Create concept graphic
              </>
            )}
          </Button>

          {errorDetail && (
            <div
              data-testid="artbot-error-detail"
              className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-700 dark:text-red-200 leading-relaxed"
            >
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div className="min-w-0">
                          <div className="font-bold">Image creation returned an error</div>
                  <div className="break-words">{errorDetail.message}</div>
                  {errorDetail.code && (
                    <div className="text-[10px] uppercase tracking-wider text-red-300 mt-0.5">
                      code: {errorDetail.code}
                    </div>
                  )}
                  <div className="text-[10px] text-red-300/80 mt-0.5">
                    Falling back to the Article Photo Prompt Pack — paste those into
                    your image tool of choice.
                  </div>
                </div>
              </div>
            </div>
          )}

          {packMutation.isPending && (
            <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating image prompt pack...
            </div>
          )}

          {promptPack && (
            <div
              className="rounded-xl border border-border/60 bg-secondary/30 p-3 space-y-2"
              data-testid="artbot-prompt-pack"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/90">
                <ImageIcon className="w-3.5 h-3.5" />
                        Article Photo Direction Packet
              </div>
              <p className="text-[10px] text-muted-foreground">
                        AI concept-only directions · copy into your image tool
              </p>
              {PROMPT_PACK_LABELS.map(({ key, label }) => {
                const value = promptPack[key];
                if (!value) return null;
                return (
                  <PromptPackRow
                    key={key}
                    label={label}
                    value={value}
                    onCopy={() => {
                      navigator.clipboard
                        .writeText(value)
                        .then(() => toast.success(`Copied ${label}`))
                        .catch(() => toast.error("Copy failed"));
                    }}
                  />
                );
              })}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <PromptPackRow
                  label="Caption"
                  value={promptPack.caption}
                  onCopy={() =>
                    navigator.clipboard.writeText(promptPack.caption).then(
                      () => toast.success("Copied caption"),
                      () => toast.error("Copy failed"),
                    )
                  }
                />
                <PromptPackRow
                  label="Alt text"
                  value={promptPack.altText}
                  onCopy={() =>
                    navigator.clipboard.writeText(promptPack.altText).then(
                      () => toast.success("Copied alt text"),
                      () => toast.error("Copy failed"),
                    )
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Caption mode */}
      <div className="mt-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          Caption
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCaptionMode("auto")}
            data-testid="artbot-caption-auto"
            className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-all ${
              captionMode === "auto"
                ? "border-transparent text-foreground"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
            style={
              captionMode === "auto"
                ? { background: v.accentBg || v.color, color: v.onAccent }
                : undefined
            }
          >
            Auto
          </button>
          <button
            type="button"
            onClick={() => setCaptionMode("manual")}
            data-testid="artbot-caption-manual"
            className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-all ${
              captionMode === "manual"
                ? "border-transparent text-foreground"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
            style={
              captionMode === "manual"
                ? { background: v.accentBg || v.color, color: v.onAccent }
                : undefined
            }
          >
            Manual
          </button>
        </div>
        {captionMode === "manual" && (
          <Input
            value={manualCaption}
            onChange={(e) => setManualCaption(e.target.value)}
            placeholder="Caption text (overrides headline on frames)"
            className="bg-secondary/60 border-border text-sm h-9 mt-1.5"
          />
        )}
      </div>

      {/* ---- VISUAL BRIEF (collapsed, secondary) ---- */}
      <div className="mt-4 rounded-xl border border-border/60 bg-card/30">
        <button
          type="button"
          onClick={() => setStoryNotesOpen((o) => !o)}
          data-testid="artbot-story-notes-toggle"
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        >
          <span className="inline-flex items-center gap-2 text-[12px] font-bold">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Visual Brief
            <span className="text-[10px] font-normal text-muted-foreground">
              (optional — create a quick image brief)
            </span>
          </span>
          {storyNotesOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {storyNotesOpen && (
          <div className="px-3 pb-3 space-y-3">
            <SourcePacketPanel
              brandId={silo}
              heading="Visual Brief"
              actionLabel="Create Image Brief"
              onPacketReady={(packet) => handleImageBrief(packet.content)}
            />

            {briefEmpty && !imageBrief && (
              <p
                data-testid="artbot-brief-empty"
                className="text-[12px] text-muted-foreground"
              >
                No usable notes yet. Paste a sentence or two about the story
                above, then choose Create Image Brief.
              </p>
            )}

            {imageBrief && (
              <div
                data-testid="artbot-image-brief"
                className="rounded-xl border border-border/60 bg-secondary/30 p-3 space-y-3"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/90">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Image Brief
                </div>

                <BriefList label="Headline options" items={imageBrief.headlineOptions} />
                <BriefList label="Caption options" items={imageBrief.captionOptions} />
                <BriefLine label="Alt text" value={imageBrief.altText} />
                <BriefLine label="Source note" value={imageBrief.sourceNote} />
                <BriefLine
                  label="Suggested visual treatment"
                  value={imageBrief.visualTreatment}
                />
                <BriefLine
                  label="Brand color direction"
                  value={imageBrief.brandColorDirection}
                />
                <BriefList label="Output sizes needed" items={imageBrief.outputSizes} />
                <BriefList label="Export checklist" items={imageBrief.exportChecklist} ordered />

                <button
                  type="button"
                  onClick={() => {
                    const text = formatBriefForCopy(imageBrief);
                    navigator.clipboard
                      .writeText(text)
                      .then(() => toast.success("Image brief copied"))
                      .catch(() => toast.error("Copy failed"));
                  }}
                  data-testid="artbot-copy-brief"
                  className="text-[11px] font-bold uppercase tracking-wider rounded-full border border-border/60 px-3 py-1 text-foreground/80 hover:text-foreground"
                >
                  Copy full brief
                </button>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground/80 leading-snug" data-testid="artbot-editorial-jump">
                      Need the full article draft? Open <strong className="text-foreground/80">Editorial Desk</strong> from the menu — WebArt stays focused on the graphic.
            </p>
          </div>
        )}
      </div>

      {/* ---- OUTPUT ---- */}
      {image && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Source asset
              </p>
              <div className="flex flex-wrap gap-1 justify-end">
                {qualityLabels.map((def) => (
                  <QualityBadge key={def.id} def={def} withDescription />
                ))}
              </div>
            </div>
            <img
              src={image}
              alt=""
              className="w-full max-w-[280px] mx-auto rounded-md"
              data-testid="artbot-source-image"
            />
            <p className="text-[10px] text-muted-foreground/80 text-center mt-1.5">
              {imageOrigin === "ai"
                ? "AI concept — add the AI disclosure and never present as a real person."
                : "Credit the original source channel in your published caption."}
            </p>
          </div>

          <NextActionBar title="Next actions" actions={imageActions} />

          <Suspense fallback={<div className="flex items-center justify-center h-32 text-muted-foreground text-xs">Loading template studio…</div>}>
            <TemplateStudio
              silo={silo}
              image={image}
              headline={overlayCaption || headline}
              brand={{ color: v.color, on: v.onAccent }}
              siloName={v.name}
              logo={v.logo}
              qualityLabels={qualityLabels}
              onRestoreHeadline={setHeadline}
              registerImageInjector={(fn) => {
                overlayInjector.current = fn;
              }}
            />
          </Suspense>
        </div>
      )}

      {cropSrc && (
        <Suspense fallback={<div className="flex items-center justify-center h-32 text-muted-foreground text-xs">Loading crop tool…</div>}>
          <ImageCropper
            image={cropSrc}
            brandColor={v.color}
            onCancel={cancelCrop}
            onApply={handleCropApply}
          />
        </Suspense>
      )}

      <UniversalMediaSource
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        context="artbot"
        brand={{ id: v.id, color: v.color, on: v.onAccent }}
        actions={ARTBOT_MEDIA_ACTIONS}
        onPick={handleMediaPick}
        accept="image"
      />
    </div>
  );
}

function PromptPackRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-md border border-border/40 bg-secondary/40 p-2">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <button
          onClick={onCopy}
          className="text-[10px] font-bold uppercase tracking-wider text-foreground/70 hover:text-foreground"
        >
          Copy
        </button>
      </div>
      <p className="text-[12px] text-foreground/85 leading-snug whitespace-pre-wrap break-words">
        {value}
      </p>
    </div>
  );
}

function BriefLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </p>
      <p className="text-[12px] text-foreground/85 leading-snug whitespace-pre-wrap break-words">
        {value}
      </p>
    </div>
  );
}

function BriefList({
  label,
  items,
  ordered,
}: {
  label: string;
  items: string[];
  ordered?: boolean;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li
            key={`${label}-${i}`}
            className="text-[12px] text-foreground/85 leading-snug break-words flex gap-1.5"
          >
            <span className="text-muted-foreground shrink-0">
              {ordered ? `${i + 1}.` : "•"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatBriefForCopy(brief: ImageBrief): string {
  const lines: string[] = [];
  lines.push("IMAGE BRIEF");
  lines.push("");
  lines.push("Headline options:");
  brief.headlineOptions.forEach((h) => lines.push(`- ${h}`));
  lines.push("");
  lines.push("Caption options:");
  brief.captionOptions.forEach((c) => lines.push(`- ${c}`));
  lines.push("");
  lines.push(`Alt text: ${brief.altText}`);
  lines.push("");
  lines.push(`Source note: ${brief.sourceNote}`);
  lines.push("");
  lines.push(`Suggested visual treatment: ${brief.visualTreatment}`);
  lines.push("");
  lines.push(`Brand color direction: ${brief.brandColorDirection}`);
  lines.push("");
  lines.push("Output sizes needed:");
  brief.outputSizes.forEach((s) => lines.push(`- ${s}`));
  lines.push("");
  lines.push("Export checklist:");
  brief.exportChecklist.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  return lines.join("\n");
}
