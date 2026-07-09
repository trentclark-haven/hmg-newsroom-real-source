import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Silo as ApiSilo } from "@workspace/api-client-react";
import { hasDraft, useDraft } from "@/lib/useDraft";
import {
  AlertTriangle,
  Camera,
  Captions,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Clock,
  Copy,
  Eraser,
  FileText,
  FileVideo,
  Flag,
  Image as ImageIcon,
  ImageUp,
  LayoutGrid,
  Library,
  ListChecks,
  Loader2,
  MessageSquare,
  Megaphone,
  PenLine,
  Play,
  Plus,
  Rocket,
  Scissors,
  Send,
  ShieldCheck,
  Sparkles,
  Type,
  Upload,
  Video,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { verticals } from "@/lib/mock-data";
import { SiloPicker } from "./SiloPicker";
import { NextActionBar, type NextAction } from "@/components/hmg/NextActionBar";
import { CaptionOverlay } from "./CaptionOverlay";
import {
  SocialFrame,
  FRAMES,
  FRAME_PLATFORMS,
  type FramePlatform,
  type FrameStyle,
} from "./SocialFrame";
import {
  BRAND_FRAME_PRESETS,
  QUALITY_LABELS,
  UPLOAD_LABEL_CHOICES,
  labelsForAsset,
  type QualityLabelId,
} from "./artbotConfig";
import { QualityBadge } from "./QualityBadge";
const ImageCropper = lazy(() =>
  import("./ImageCropper").then((m) => ({ default: m.ImageCropper }))
);
const OfficialSourceGuide = lazy(() =>
  import("./OfficialSourceGuide").then((m) => ({ default: m.OfficialSourceGuide }))
);
import { recordAudit } from "@/lib/auditLog";
import { recordSafeModeBlock, useSafeMode } from "@/lib/safeMode";
import {
  UniversalMediaSource,
  type MediaAction,
} from "@/components/media/UniversalMediaSource";
import { CutPlanStudio } from "./CutPlanStudio";
import {
  MEDIA_LIMITS,
  formatBytes,
  maxBytesForMime,
  uploadLimitLabel,
} from "@/lib/mediaLimits";
import {
  buildProcessingQueue,
  createPreviewAsset,
  revokePreviewAsset,
  validateEditAssetFile,
  validateImageFile,
} from "@/lib/hmg/performance/mediaReadiness";
import { acquireObjectUrl, releaseObjectUrl } from "@/lib/memoryPool";
import {
  TranscribePipelineError,
  transcribeWithProgress,
  type TranscribePhaseEvent,
} from "@/lib/transcribeWithProgress";
import {
  enqueue,
  isAlreadyRunning,
  dedupeKeyOf,
  DuplicateJobError,
} from "@/lib/requestQueue";
import { runThroughBreaker, CircuitOpenError } from "@/lib/circuitBreaker";
import { startJob, completeJob } from "@/lib/jobLedger";
import { getOperatorInitials } from "@/lib/operatorProfile";
import { captureSnapshot } from "@/lib/recoverySnapshots";
import {
  recordCutNote,
  recordEditBrief,
  recordCaptionPlan,
  recordThumbnailBrief,
  recordSocialVideoDraft,
} from "@/lib/useOutputHistory";
import { runHookFinder, type HookFinderResult } from "@/lib/hmg/webedit/hookFinder";
import type { SegmentRole } from "@/lib/hmg/webedit/types";

const CUTMASTER_MEDIA_ACTIONS: MediaAction[] = [];

interface TranscribeWord {
  word: string;
  start: number;
  end: number;
}

interface SuggestedClip {
  id: string;
  start: number;
  end: number;
  text: string;
  hookScore: number;
}

interface TranscribeData {
  text: string;
  duration: number;
  language: string;
  words: TranscribeWord[];
  segments: { id: number; start: number; end: number; text: string }[];
  suggestedClips: SuggestedClip[];
  timingMode?: "word" | "segment" | "estimated" | "exact";
}

const PLATFORM_FRAMES: Array<{
  id: "instagram" | "tiktok" | "youtube" | "youtube-short" | "x";
  label: string;
  ratio: string;
  size: string;
}> = [
  { id: "instagram", label: "IG", ratio: "1 / 1", size: "1080×1080" },
  { id: "tiktok", label: "TikTok", ratio: "9 / 16", size: "1080×1920" },
  { id: "youtube", label: "YT", ratio: "16 / 9", size: "1920×1080" },
  { id: "youtube-short", label: "YT Short", ratio: "9 / 16", size: "1080×1920" },
  { id: "x", label: "X", ratio: "16 / 9", size: "1280×720" },
];

const EXTENDED_PLATFORM_FORMATS = [
  { id: "916", label: "9:16", hint: "TikTok / Reels / Shorts" },
  { id: "11", label: "1:1", hint: "Instagram Feed" },
  { id: "169", label: "16:9", hint: "YouTube / Website embed" },
  { id: "45", label: "4:5", hint: "Instagram Portrait" },
  { id: "yt-short", label: "YouTube Shorts", hint: "9:16 · 60s max" },
  { id: "tiktok", label: "TikTok", hint: "9:16 · full-bleed vertical" },
  { id: "reels", label: "Reels", hint: "9:16 · 90s max" },
  { id: "x-video", label: "X Video", hint: "16:9 or 1:1" },
  { id: "web-embed", label: "Website Embed", hint: "16:9 preferred" },
];

const COVER_DEFAULT_FORMATS: FramePlatform[] = [
  "youtube-thumbnail",
  "instagram-feed",
  "instagram-story",
  "x",
];

type CaptionStyleId =
  | "clean"
  | "pop"
  | "kinetic"
  | "subtitle"
  | "editorial"
  | "breaking";

const CAPTION_STYLES: Array<{
  id: CaptionStyleId;
  label: string;
  description: string;
}> = [
  { id: "clean", label: "Clean", description: "White single-line caption, current word in brand color" },
  { id: "pop", label: "Pop Caption", description: "Yellow ALL-CAPS, hard black drop shadow" },
  { id: "kinetic", label: "Bold Kinetic", description: "Brand-color block highlight bouncing per word" },
  { id: "subtitle", label: "Subtitle", description: "Discreet white .srt-style subtitles, no highlight" },
  { id: "editorial", label: "Editorial Lower Third", description: "Anchor-style lower-third bar with name + headline" },
  { id: "breaking", label: "Breaking Pulse", description: "Red pulsing banner with all-caps headline crawl" },
];

function normalizeCaptionStyle(id: string | undefined): CaptionStyleId {
  if (id === "clean" || id === "pop" || id === "kinetic" || id === "subtitle" || id === "editorial" || id === "breaking") {
    return id;
  }
  return "clean";
}

type ClipGoalId = "viral-hook" | "headline-recap" | "quote-pull" | "reaction" | "evergreen";

const CLIP_GOALS: Array<{ id: ClipGoalId; label: string; description: string }> = [
  { id: "viral-hook", label: "Viral hook", description: "Fast open, one sharp payoff" },
  { id: "headline-recap", label: "Headline recap", description: "Clean summary for busy scrollers" },
  { id: "quote-pull", label: "Quote pull", description: "Build around the strongest line" },
  { id: "reaction", label: "Reaction bait", description: "Prompt comments without muddying facts" },
  { id: "evergreen", label: "Evergreen explainer", description: "Useful context that can repost later" },
];

interface CutAsset {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  readiness: "ready" | "large" | "blocked";
  readinessLabel: string;
  readinessDetail: string;
}

interface ClipSegmentRow {
  id: string;
  label: string;
  start: string;
  end: string;
  role: SegmentRole;
  note: string;
  riskFlag: string;
}

interface ApiErrorLike {
  data?: { error?: string; code?: string } | null;
  message?: string;
  status?: number;
}

function readError(err: unknown): { message: string; code?: string } {
  if (err instanceof TranscribePipelineError) {
    return { message: err.message, code: err.code };
  }
  const e = err as ApiErrorLike;
  const dataError = e?.data && typeof e.data === "object" ? (e.data as { error?: string; code?: string }) : null;
  const message = dataError?.error || (typeof e?.message === "string" ? e.message : "Transcription failed.");
  return { message, code: dataError?.code };
}

function describeTranscribePhase(event: TranscribePhaseEvent): string {
  switch (event.phase) {
    case "uploading": return `Uploading ${formatBytes(event.uploadedBytes)} of ${formatBytes(event.totalBytes)}`;
    case "resuming": return `Resuming upload: ${event.alreadyUploadedChunks}/${event.totalChunks} chunks already received`;
    case "session": return event.resumed ? "Reattached to previous upload session" : "Upload session created";
    case "chunk_retry": return `Retrying chunk ${event.chunkIndex + 1} (attempt ${event.attempt + 1}/${event.maxAttempts})`;
    case "chunk_acked": return `Chunk ${event.chunkIndex + 1}/${event.totalChunks} received`;
    case "finalizing": return "Finalizing upload";
    case "ready": return "Upload ready for transcription";
    case "extracting": return "Extracting audio";
    case "compressing": return `Compressing audio (${formatBytes(event.bytes)})`;
    case "chunking": return `Preparing ${event.totalChunks} audio chunks`;
    case "transcribing": return `Transcribing chunk ${event.chunkIndex + 1}/${event.totalChunks}`;
    case "stitching": return "Stitching transcript";
    case "interrupted": return event.message;
  }
}

function formatTime(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function downloadTextFile(filename: string, content: string, type: string) {
  try {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

function srtTime(s: number) {
  const ms = Math.round((s - Math.floor(s)) * 1000);
  const total = Math.floor(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

function clipToSrt(clip: SuggestedClip, words: TranscribeWord[]) {
  const inClip = words.filter((w) => w.start >= clip.start && w.end <= clip.end + 0.05);
  if (!inClip.length) {
    return `1\n${srtTime(clip.start)} --> ${srtTime(clip.end)}\n${clip.text}\n`;
  }
  const lines: { start: number; end: number; text: string }[] = [];
  for (let i = 0; i < inClip.length; i += 5) {
    const chunk = inClip.slice(i, i + 5);
    lines.push({ start: chunk[0].start, end: chunk[chunk.length - 1].end, text: chunk.map((w) => w.word.trim()).join(" ") });
  }
  return lines.map((l, i) => `${i + 1}\n${srtTime(l.start)} --> ${srtTime(l.end)}\n${l.text}\n`).join("\n");
}

function synthFromManual(text: string): TranscribeData {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const duration = Math.max(1, tokens.length / 3);
  const perWord = tokens.length ? duration / tokens.length : 0;
  const words: TranscribeWord[] = tokens.map((t, i) => ({ word: t, start: i * perWord, end: (i + 1) * perWord }));
  const segments: { id: number; start: number; end: number; text: string }[] = [];
  const segSize = 12;
  for (let i = 0; i < words.length; i += segSize) {
    const chunk = words.slice(i, i + segSize);
    if (!chunk.length) continue;
    segments.push({ id: segments.length, start: chunk[0].start, end: chunk[chunk.length - 1].end, text: chunk.map((w) => w.word).join(" ") });
  }
  const suggestedClips: SuggestedClip[] = [];
  let bucket: typeof segments = [];
  let bucketStart = segments[0]?.start ?? 0;
  for (const seg of segments) {
    bucket.push(seg);
    if (seg.end - bucketStart >= 30) {
      const clipText = bucket.map((s) => s.text.trim()).join(" ").replace(/\s+/g, " ");
      suggestedClips.push({ id: `clip-${suggestedClips.length + 1}`, start: bucketStart, end: seg.end, text: clipText, hookScore: Math.min(1, clipText.length / 400) });
      bucket = [];
      bucketStart = seg.end;
    }
  }
  if (bucket.length) {
    const last = bucket[bucket.length - 1];
    const clipText = bucket.map((s) => s.text.trim()).join(" ").replace(/\s+/g, " ");
    suggestedClips.push({ id: `clip-${suggestedClips.length + 1}`, start: bucketStart, end: last.end, text: clipText, hookScore: Math.min(1, clipText.length / 400) });
  }
  return { text, duration, language: "en", words, segments, suggestedClips, timingMode: "estimated" };
}

interface CutMasterDraft {
  silo: ApiSilo;
  webeditTitle: string;
  manualText: string;
  transcriptNotes: string;
  doNotUseMarkers: string;
  riskNotes: string;
  sourceNoteField: string;
  trimStart: string;
  trimEnd: string;
  platformFrame: (typeof PLATFORM_FRAMES)[number]["id"];
  captionStyle: (typeof CAPTION_STYLES)[number]["id"];
  captionPlatformNotes: string;
  pinnedComment: string;
  accessibilityNote: string;
  selectedFormats: string[];
  clipGoal?: ClipGoalId;
  hookText?: string;
  captionPackAngle?: string;
  lowerThirdName?: string;
  lowerThirdContext?: string;
  thumbnailText?: string;
  thumbnailSubheadline?: string;
  thumbnailFrameNote?: string;
  thumbnailLogoPlacement?: string;
  thumbnailWebArtHandoff?: string;
  sourceArticlePackage?: string;
}

const CUTMASTER_DRAFT_KEY = "hmg-cutmaster-draft-v2";
const CUTMASTER_ACTIVE_VIDEO_OWNER = "cutmaster-active-video";
const CUTMASTER_COVER_OWNER = "cutmaster-cover-crop";
const MAX_CUT_ASSETS = 8;

const DEFAULT_SEGMENTS: ClipSegmentRow[] = [
  { id: "hook", label: "Hook", start: "0", end: "8", role: "hook", note: "Open with the strongest visual or quote.", riskFlag: "" },
  { id: "context", label: "Context", start: "8", end: "22", role: "context", note: "Add the one detail viewers need.", riskFlag: "" },
  { id: "payoff", label: "Payoff", start: "22", end: "35", role: "payoff", note: "Close with comment bait or next step.", riskFlag: "" },
];

const ROLE_COLORS: Record<SegmentRole, string> = {
  hook: "#EF4444",
  context: "#3B82F6",
  payoff: "#10B981",
  cta: "#F59E0B",
};

const ROLE_LABELS: Record<SegmentRole, string> = {
  hook: "Hook",
  context: "Context",
  payoff: "Payoff",
  cta: "CTA",
};

function TruthChip({ label, status }: { label: string; status: "local" | "pending" | "review" }) {
  const cls = {
    local: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    review: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  }[status];
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

function StepHeader({ n, icon: Icon, title, hint, color }: { n: string; icon: React.ElementType; title: string; hint: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-[11px] font-black" style={{ borderColor: color, color }}>
        {n}
      </div>
      <Icon className="w-4 h-4 shrink-0" style={{ color }} />
      <div>
        <h3 className="text-[12px] font-black uppercase tracking-wider text-foreground">{title}</h3>
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

export function CutMasterView() {
  const [draft, setDraft, clearDraft] = useDraft<CutMasterDraft>(CUTMASTER_DRAFT_KEY, {
    silo: verticals[0].id as ApiSilo,
    webeditTitle: "",
    manualText: "",
    transcriptNotes: "",
    doNotUseMarkers: "",
    riskNotes: "",
    sourceNoteField: "",
    trimStart: "",
    trimEnd: "",
    platformFrame: "tiktok",
    captionStyle: "clean",
    captionPlatformNotes: "",
    pinnedComment: "",
    accessibilityNote: "",
    selectedFormats: ["916", "11"],
    clipGoal: "viral-hook",
    hookText: "",
    captionPackAngle: "",
    lowerThirdName: "",
    lowerThirdContext: "",
    thumbnailText: "",
    thumbnailSubheadline: "",
    thumbnailFrameNote: "",
    thumbnailLogoPlacement: "",
    thumbnailWebArtHandoff: "",
    sourceArticlePackage: "",
  });

  const silo = draft.silo;
  const webeditTitle = draft.webeditTitle ?? "";
  const manualText = draft.manualText;
  const transcriptNotes = draft.transcriptNotes ?? "";
  const doNotUseMarkers = draft.doNotUseMarkers ?? "";
  const riskNotes = draft.riskNotes ?? "";
  const sourceNoteField = draft.sourceNoteField ?? "";
  const trimStart = draft.trimStart;
  const trimEnd = draft.trimEnd;
  const platformFrame = draft.platformFrame;
  const captionStyle = normalizeCaptionStyle(draft.captionStyle);
  const captionPlatformNotes = draft.captionPlatformNotes ?? "";
  const pinnedComment = draft.pinnedComment ?? "";
  const accessibilityNote = draft.accessibilityNote ?? "";
  const selectedFormats = draft.selectedFormats ?? ["916", "11"];
  const clipGoal = draft.clipGoal ?? "viral-hook";
  const hookText = draft.hookText ?? "";
  const captionPackAngle = draft.captionPackAngle ?? "";
  const lowerThirdName = draft.lowerThirdName ?? "";
  const lowerThirdContext = draft.lowerThirdContext ?? "";
  const thumbnailText = draft.thumbnailText ?? "";
  const thumbnailSubheadline = draft.thumbnailSubheadline ?? "";
  const thumbnailFrameNote = draft.thumbnailFrameNote ?? "";
  const thumbnailLogoPlacement = draft.thumbnailLogoPlacement ?? "";
  const thumbnailWebArtHandoff = draft.thumbnailWebArtHandoff ?? "";
  const sourceArticlePackage = draft.sourceArticlePackage ?? "";

  const setSilo = (v: ApiSilo) => setDraft((p) => ({ ...p, silo: v }));
  const setWebeditTitle = (v: string) => setDraft((p) => ({ ...p, webeditTitle: v }));
  const setManualText = (v: string) => setDraft((p) => ({ ...p, manualText: v }));
  const setTranscriptNotes = (v: string) => setDraft((p) => ({ ...p, transcriptNotes: v }));
  const setDoNotUseMarkers = (v: string) => setDraft((p) => ({ ...p, doNotUseMarkers: v }));
  const setRiskNotes = (v: string) => setDraft((p) => ({ ...p, riskNotes: v }));
  const setSourceNoteField = (v: string) => setDraft((p) => ({ ...p, sourceNoteField: v }));
  const setTrimStart = (v: string) => setDraft((p) => ({ ...p, trimStart: v }));
  const setTrimEnd = (v: string) => setDraft((p) => ({ ...p, trimEnd: v }));
  const setPlatformFrame = (v: (typeof PLATFORM_FRAMES)[number]["id"]) => setDraft((p) => ({ ...p, platformFrame: v }));
  const setCaptionStyle = (v: (typeof CAPTION_STYLES)[number]["id"]) => setDraft((p) => ({ ...p, captionStyle: v }));
  const setCaptionPlatformNotes = (v: string) => setDraft((p) => ({ ...p, captionPlatformNotes: v }));
  const setPinnedComment = (v: string) => setDraft((p) => ({ ...p, pinnedComment: v }));
  const setAccessibilityNote = (v: string) => setDraft((p) => ({ ...p, accessibilityNote: v }));
  const setClipGoal = (v: ClipGoalId) => setDraft((p) => ({ ...p, clipGoal: v }));
  const setHookText = (v: string) => setDraft((p) => ({ ...p, hookText: v }));
  const setCaptionPackAngle = (v: string) => setDraft((p) => ({ ...p, captionPackAngle: v }));
  const setLowerThirdName = (v: string) => setDraft((p) => ({ ...p, lowerThirdName: v }));
  const setLowerThirdContext = (v: string) => setDraft((p) => ({ ...p, lowerThirdContext: v }));
  const setThumbnailText = (v: string) => setDraft((p) => ({ ...p, thumbnailText: v }));
  const setThumbnailSubheadline = (v: string) => setDraft((p) => ({ ...p, thumbnailSubheadline: v }));
  const setThumbnailFrameNote = (v: string) => setDraft((p) => ({ ...p, thumbnailFrameNote: v }));
  const setThumbnailLogoPlacement = (v: string) => setDraft((p) => ({ ...p, thumbnailLogoPlacement: v }));
  const setThumbnailWebArtHandoff = (v: string) => setDraft((p) => ({ ...p, thumbnailWebArtHandoff: v }));
  const setSourceArticlePackage = (v: string) => setDraft((p) => ({ ...p, sourceArticlePackage: v }));
  const toggleFormat = (id: string) =>
    setDraft((p) => ({
      ...p,
      selectedFormats: (p.selectedFormats ?? []).includes(id)
        ? (p.selectedFormats ?? []).filter((f) => f !== id)
        : [...(p.selectedFormats ?? []), id],
    }));

  const [draftSaved, setDraftSaved] = useState<boolean>(() => hasDraft(CUTMASTER_DRAFT_KEY));
  useEffect(() => {
    const i = setInterval(() => setDraftSaved(hasDraft(CUTMASTER_DRAFT_KEY)), 800);
    return () => clearInterval(i);
  }, []);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscribeData | null>(null);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<{ message: string; code?: string } | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [showTech, setShowTech] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeStatus, setTranscribeStatus] = useState<string | null>(null);
  const [transcribeProgress, setTranscribeProgress] = useState<{ uploadedBytes: number; totalBytes: number } | null>(null);
  const [cutAssets, setCutAssets] = useState<CutAsset[]>([]);
  const [segments, setSegments] = useState<ClipSegmentRow[]>(DEFAULT_SEGMENTS);

  // Hook finder state
  const [hookFinderResult, setHookFinderResult] = useState<HookFinderResult | null>(null);
  const [hookFinderRan, setHookFinderRan] = useState(false);
  const [showHookFinder, setShowHookFinder] = useState(false);

  // UI collapse state for steps
  const [step2Open, setStep2Open] = useState(true);
  const [step3Open, setStep3Open] = useState(false);
  const [step4Open, setStep4Open] = useState(true);
  const [step5Open, setStep5Open] = useState(false);
  const [step6Open, setStep6Open] = useState(false);
  const [step7Open, setStep7Open] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const trayFileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const transcribeAbortRef = useRef<AbortController | null>(null);
  const coverCropObjectUrlRef = useRef<string | null>(null);

  const { enabled: safeMode } = useSafeMode();
  const v = verticals.find((x) => x.id === silo)!;
  const brandColor = useMemo(() => v.color, [v]);
  const brandBg = useMemo(() => v.accentBg || v.color, [v]);

  // Cover frame / thumbnail
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverCropSrc, setCoverCropSrc] = useState<string | null>(null);
  const [coverOrigin, setCoverOrigin] = useState<"upload" | "ai">("upload");
  const [coverLabel, setCoverLabel] = useState<QualityLabelId>("official-source");
  const [coverStyle, setCoverStyle] = useState<FrameStyle>("solid");
  const [coverFormats, setCoverFormats] = useState<FramePlatform[]>(COVER_DEFAULT_FORMATS);
  const [coverHeadline, setCoverHeadline] = useState("");
  const coverFileRef = useRef<HTMLInputElement>(null);
  const coverQualityLabels = labelsForAsset(coverImage ? coverOrigin : null, coverLabel);

  const processingQueue = useMemo(() => buildProcessingQueue(cutAssets), [cutAssets]);
  const heavyAssetCount = useMemo(() => cutAssets.filter((a) => a.readiness === "large").length, [cutAssets]);
  const cutAssetBytes = useMemo(() => cutAssets.reduce((sum, a) => sum + a.size, 0), [cutAssets]);
  const cutAssetSummary = cutAssets.length
    ? `${cutAssets.length}/${MAX_CUT_ASSETS} staged · ${formatBytes(cutAssetBytes)}${heavyAssetCount ? ` · ${heavyAssetCount} large` : ""}`
    : "Accepts video, audio, and image assets";

  function toggleCoverFormat(f: FramePlatform) {
    setCoverFormats((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  }

  function applyCoverPreset() {
    setCoverFormats(BRAND_FRAME_PRESETS[silo] ?? COVER_DEFAULT_FORMATS);
    toast.message(`${v.name} frame preset applied`);
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video || !videoUrl) { toast.error("Load a video first."); return; }
    const w = video.videoWidth, h = video.videoHeight;
    if (!w || !h) { toast.error("Frame not ready — play then pause on a sharp frame."); return; }
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { toast.error("Could not capture this frame."); return; }
    try {
      ctx.drawImage(video, 0, 0, w, h);
      setCoverOrigin("upload");
      if (coverLabel === "internal-placeholder") setCoverLabel("official-source");
      revokePreviewAsset({ objectUrl: coverCropObjectUrlRef.current ?? "", src: coverCropObjectUrlRef.current ?? "" });
      coverCropObjectUrlRef.current = null;
      setCoverCropSrc(canvas.toDataURL("image/png"));
      toast.success("Frame captured — crop and set as thumbnail");
    } catch { toast.error("Could not capture this frame."); }
  }

  function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (safeMode) { recordSafeModeBlock("media-upload", "CutMasterView/cover-upload"); toast.error("Safe Mode is on — media uploads disabled."); return; }
    const validation = validateImageFile(file);
    if (!validation.ok) { toast.error(validation.detail); return; }
    if (validation.level === "large") toast.message(validation.detail);
    revokePreviewAsset({ objectUrl: coverCropObjectUrlRef.current ?? "", src: coverCropObjectUrlRef.current ?? "" });
    const preview = createPreviewAsset(file, CUTMASTER_COVER_OWNER);
    coverCropObjectUrlRef.current = preview.objectUrl;
    setCoverCropSrc(preview.src);
  }

  function cancelCoverCrop() {
    revokePreviewAsset({ objectUrl: coverCropObjectUrlRef.current ?? "", src: coverCropObjectUrlRef.current ?? "" });
    coverCropObjectUrlRef.current = null;
    setCoverCropSrc(null);
  }

  function handleCoverCropApply(croppedDataUrl: string) {
    setCoverImage(croppedDataUrl);
    cancelCoverCrop();
    recordAudit("clip-packaged", silo, `Cover frame (${coverOrigin === "ai" ? QUALITY_LABELS["ai-concept"].short : QUALITY_LABELS[coverLabel].short})`);
    toast.success("Thumbnail frame cropped and ready");
  }

  useEffect(() => { return () => { if (videoUrl) releaseObjectUrl(videoUrl); }; }, [videoUrl]);
  useEffect(() => {
    return () => {
      transcribeAbortRef.current?.abort();
      revokePreviewAsset({ objectUrl: coverCropObjectUrlRef.current ?? "", src: coverCropObjectUrlRef.current ?? "" });
    };
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (transcribing) { toast.message("Transcription already running"); return; }
    const validation = validateEditAssetFile(file);
    if (!validation.ok || file.type.startsWith("image/")) {
      toast.error(file.type.startsWith("image/") ? "Images can be staged for planning, but choose video or audio to transcribe." : validation.detail);
      return;
    }
    await transcribeFile(file);
  }

  function handleTrayFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    if (safeMode) { recordSafeModeBlock("media-upload", "CutMasterView/asset-tray"); toast.error("Safe Mode is on — media uploads disabled."); return; }
    const room = MAX_CUT_ASSETS - cutAssets.length;
    if (room <= 0) { toast.message(`Tray limit reached (${MAX_CUT_ASSETS} assets).`); return; }
    if (files.length > room) toast.message(`Adding the first ${room} asset${room === 1 ? "" : "s"} that fit.`);
    const accepted: CutAsset[] = [];
    for (const file of files) {
      if (accepted.length >= room) break;
      const validation = validateEditAssetFile(file);
      if (!validation.ok) { toast.error(`${file.name}: ${validation.detail}`); continue; }
      if (validation.level === "large") toast.message(`${file.name}: ${validation.detail}`);
      accepted.push({
        id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name, size: file.size, type: file.type || "media", file,
        readiness: validation.level, readinessLabel: validation.label, readinessDetail: validation.detail,
      });
    }
    if (!accepted.length) { toast.error("Choose video, audio, or image assets for WebEdit."); return; }
    setCutAssets((prev) => [...prev, ...accepted].slice(0, MAX_CUT_ASSETS));
    toast.success(`${accepted.length} asset${accepted.length === 1 ? "" : "s"} added to WebEdit`);
  }

  async function transcribeFile(file: File) {
    if (transcribing) { toast.message("Transcription already running"); return; }
    if (safeMode) { recordSafeModeBlock("media-upload", "CutMasterView/transcribe"); toast.error("Safe Mode is on — media uploads & AI calls disabled."); return; }
    setErrorDetail(null); setTranscribeStatus(null); setTranscribeProgress(null);
    const validation = validateEditAssetFile(file);
    if (!validation.ok || file.type.startsWith("image/")) {
      const detail = { message: file.type.startsWith("image/") ? "Choose video or audio to transcribe." : validation.detail, code: "unsupported_media" };
      setErrorDetail(detail); toast.error(detail.message); return;
    }
    const maxBytes = maxBytesForMime(file.type);
    if (file.size > maxBytes) {
      const detail = { message: `File too large. Max ${formatBytes(maxBytes)} for ${file.type.startsWith("audio/") ? "audio" : "video"} uploads.`, code: "too_large" };
      setErrorDetail(detail); toast.error(detail.message); return;
    }
    if (videoUrl) releaseObjectUrl(videoUrl);
    const nextVideoUrl = acquireObjectUrl(file, CUTMASTER_ACTIVE_VIDEO_OWNER);
    setVideoUrl(nextVideoUrl); setTranscript(null);
    const dedupeKey = dedupeKeyOf("transcribe", file.name, file.size, file.lastModified ?? 0);
    if (isAlreadyRunning({ kind: "transcribe", dedupeKey })) { toast.message("Already running"); return; }
    captureSnapshot({ reason: "media-upload", silo, label: `Transcribe ${file.name.slice(0, 40)}`, meta: { size: file.size, type: file.type || "unknown" } });
    const jobId = startJob({ kind: "transcribe", silo, summary: `Transcribe ${formatBytes(file.size)}`, operator: getOperatorInitials() || null });
    const controller = new AbortController();
    transcribeAbortRef.current = controller;
    setTranscribing(true);
    try {
      const data = (await enqueue({ kind: "transcribe", dedupeKey }, () =>
        runThroughBreaker("ai-transcribe", () =>
          transcribeWithProgress(file, {
            signal: controller.signal,
            onPhase: (event) => {
              setTranscribeStatus(describeTranscribePhase(event));
              if (event.phase === "uploading") setTranscribeProgress({ uploadedBytes: event.uploadedBytes, totalBytes: event.totalBytes });
              else if (event.phase === "resuming") setTranscribeProgress({ uploadedBytes: event.alreadyUploadedBytes, totalBytes: event.totalBytes });
            },
          }),
        ),
      )) as TranscribeData;
      if (!data.text || !data.text.trim()) {
        const detail = { message: "Transcription returned empty. Try a clearer audio source or paste a manual transcript.", code: "empty_transcript" };
        setErrorDetail(detail); setShowManual(true); toast.error(detail.message);
        completeJob(jobId, { status: "failure", error: { code: "empty_transcript" } }); return;
      }
      setTranscript(data); setTranscribeStatus(null); setTranscribeProgress(null);
      toast.success(`Transcribed ${formatTime(data.duration)} · ${data.suggestedClips.length} clips suggested`);
      recordAudit("clip-packaged", silo, `Transcribed ${formatTime(data.duration)} · ${data.suggestedClips.length} suggested clips`);
      completeJob(jobId, { status: "success" });
    } catch (err) {
      completeJob(jobId, { status: "failure", error: err });
      if (err instanceof DuplicateJobError) { toast.message("Already running"); return; }
      if (err instanceof CircuitOpenError) {
        const detail = { message: "Transcription is cooling down after repeated failures. Try again shortly.", code: "circuit_open" };
        setErrorDetail(detail); setShowManual(true); toast.error(detail.message); return;
      }
      const detail = readError(err);
      setErrorDetail(detail); setShowManual(true); toast.error(detail.message);
    } finally { setTranscribing(false); transcribeAbortRef.current = null; }
  }

  function cancelTranscription() {
    transcribeAbortRef.current?.abort();
    setTranscribeStatus("Canceling transcription");
  }

  function applyManualTranscript() {
    const trimmed = manualText.trim();
    if (!trimmed) { toast.error("Paste a transcript first."); return; }
    const synthesized = synthFromManual(trimmed);
    setTranscript(synthesized); setErrorDetail(null);
    toast.success(`Manual transcript loaded · ${synthesized.suggestedClips.length} clips suggested`);
  }

  function findHooks() {
    const text = (transcript?.text || manualText).trim();
    if (!text) { toast.error("Add a transcript first — paste it in Step 2 or upload a file."); return; }
    const result = runHookFinder({
      transcript: text,
      notes: transcriptNotes,
      topic: webeditTitle,
      platform: platformFrame,
      brand: v.name,
      doNotUseText: doNotUseMarkers,
    });
    setHookFinderResult(result);
    setHookFinderRan(true);
    setShowHookFinder(true);
    setStep3Open(true);
    toast.success(`Hook Finder found ${result.candidates.length} candidates from your transcript`);
  }

  function useHookCandidate(text: string) {
    setHookText(text);
    toast.success("Hook applied — visible in Step 4 Timeline Builder");
  }

  function jumpTo(t: number, clipId?: string) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = t;
    void video.play();
    if (clipId) setActiveClipId(clipId);
  }

  function copySrt(clip: SuggestedClip) {
    if (!transcript) return;
    const srt = clipToSrt(clip, transcript.words);
    navigator.clipboard.writeText(srt)
      .then(() => toast.success(`Copied SRT for ${formatTime(clip.start)}–${formatTime(clip.end)}`))
      .catch(() => toast.error("Copy failed"));
  }

  function previewSegment() {
    const video = videoRef.current;
    if (!video) return;
    const start = parseFloat(trimStart), end = parseFloat(trimEnd);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) { toast.error("Enter a valid trim start and end (seconds)."); return; }
    video.currentTime = start;
    void video.play();
    const stopAt = setTimeout(() => video.pause(), Math.max(0, (end - start) * 1000));
    const cancel = () => { clearTimeout(stopAt); video.removeEventListener("seeking", cancel); video.removeEventListener("pause", cancel); };
    video.addEventListener("seeking", cancel, { once: true });
    video.addEventListener("pause", cancel, { once: true });
  }

  function updateSegment(id: string, patch: Partial<ClipSegmentRow>) {
    setSegments((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addSegment() {
    const newId = `seg-${Date.now()}`;
    setSegments((prev) => [...prev, { id: newId, label: "Segment", start: "", end: "", role: "context", note: "", riskFlag: "" }]);
  }

  function removeSegment(id: string) {
    setSegments((prev) => prev.filter((r) => r.id !== id));
  }

  function buildEditBriefText(): string {
    const segLines = segments.map((r) => `  ${r.label} [${ROLE_LABELS[r.role]}]: ${r.start}s–${r.end}s — ${r.note}${r.riskFlag ? ` ⚠ ${r.riskFlag}` : ""}`).join("\n");
    const lines = [
      `WebEdit — Edit Brief`,
      `Title: ${webeditTitle || "(untitled)"}`,
      `Brand: ${v.name}`,
      `Goal: ${CLIP_GOALS.find((g) => g.id === clipGoal)?.label ?? clipGoal}`,
      `Platform: ${platformFrame}`,
      ``,
      `HOOK:`,
      hookText || "(not set)",
      ``,
      `TIMELINE:`,
      segLines,
      ``,
      `CAPTION STYLE: ${CAPTION_STYLES.find((s) => s.id === captionStyle)?.label ?? captionStyle}`,
      `CAPTION ANGLE: ${captionPackAngle || "(not set)"}`,
      `LOWER THIRD: ${lowerThirdName} / ${lowerThirdContext}`,
      `PLATFORM NOTES: ${captionPlatformNotes || "(not set)"}`,
      `PINNED COMMENT: ${pinnedComment || "(not set)"}`,
      ``,
      `THUMBNAIL:`,
      `  Headline: ${thumbnailText || "(not set)"}`,
      `  Subheadline: ${thumbnailSubheadline || "(not set)"}`,
      `  Frame note: ${thumbnailFrameNote || "(not set)"}`,
      `  Logo placement: ${thumbnailLogoPlacement || "(not set)"}`,
      coverImage ? "  Cover frame: captured/uploaded" : "  Cover frame: not yet captured",
      ``,
      `TRIM: ${trimStart || "0"}s – ${trimEnd || "?"}s`,
      `TRANSCRIPT: ${transcript ? `${formatTime(transcript.duration)} · ${transcript.words.length} words` : "manual/pending"}`,
      ``,
      ...(doNotUseMarkers.trim() ? [`DO NOT USE: ${doNotUseMarkers.replace(/\n/g, " · ")}`] : []),
      ...(riskNotes.trim() ? [`RISK NOTES: ${riskNotes.replace(/\n/g, " · ")}`] : []),
      ...(sourceNoteField.trim() ? [`SOURCE: ${sourceNoteField}`] : []),
      ``,
      ...(hookFinderResult ? [
        `HOOK FINDER INTELLIGENCE:`,
        `  Suggested caption style: ${hookFinderResult.captionStyleSuggestion}`,
        `  Format recommendation: ${hookFinderResult.formatRecommendation}`,
        `  Headline overlay: ${hookFinderResult.headlineOverlaySuggestion}`,
        ...(hookFinderResult.quoteHeavy ? ["  Quote-heavy transcript detected"] : []),
        ...(hookFinderResult.doNotUseFound.length ? [`  Do Not Use found: "${hookFinderResult.doNotUseFound.slice(0, 3).join('", "')}"`, "  REVIEW BEFORE PUBLISHING"] : []),
        ``,
      ] : []),
      `Haven AI: Local Timeline Mode — Render Backend Pending`,
      `Generated: ${new Date().toISOString()}`,
    ];
    return lines.join("\n");
  }

  function buildCutPlanJson(): string {
    const start = parseFloat(trimStart), end = parseFloat(trimEnd);
    const clips = transcript
      ? transcript.suggestedClips.map((c) => ({ id: c.id, start: c.start, end: c.end, hookScore: c.hookScore, caption: c.text }))
      : segments.map((row) => ({ id: row.id, label: row.label, role: row.role, start: row.start, end: row.end, note: row.note, riskFlag: row.riskFlag }));
    const plan = {
      version: 2,
      silo,
      title: webeditTitle || "(untitled)",
      brand: { name: v.name, color: v.color, accentBg: v.accentBg, logoPresent: Boolean(v.logo) },
      platformFrame,
      captionStyle,
      captionsEnabled: captionsOn,
      clipGoal,
      hookText,
      captionPackAngle,
      captionPlatformNotes,
      pinnedComment,
      lowerThird: { name: lowerThirdName, context: lowerThirdContext },
      thumbnail: { text: thumbnailText, subheadline: thumbnailSubheadline, frameNote: thumbnailFrameNote, logoPlacement: thumbnailLogoPlacement },
      stagedAssets: cutAssets.map((a) => ({ name: a.name, type: a.type, size: a.size })),
      durationSeconds: transcript?.duration ?? null,
      manualTrim: Number.isFinite(start) && Number.isFinite(end) && end > start ? { start, end } : null,
      clips,
      havenAI: { localTimelineMode: true, transcriptionPending: !transcript?.timingMode || transcript.timingMode === "estimated", renderBackendPending: true },
      generator: "HMG Newsroom · WebEdit Clip Studio",
    };
    return JSON.stringify(plan, null, 2);
  }

  function copyCutPlan() {
    navigator.clipboard.writeText(buildCutPlanJson())
      .then(() => toast.success("Edit brief JSON copied"))
      .catch(() => toast.error("Copy failed"));
  }

  function copyEditBrief() {
    navigator.clipboard.writeText(buildEditBriefText())
      .then(() => toast.success("Edit brief copied"))
      .catch(() => toast.error("Copy failed"));
  }

  function downloadCutPlan() {
    const ok = downloadTextFile(`webedit-${silo}-edit-brief.json`, buildCutPlanJson(), "application/json");
    toast[ok ? "success" : "error"](ok ? "Edit brief downloaded" : "Download failed");
  }

  function exportCaptions() {
    if (!transcript || transcript.suggestedClips.length === 0) { toast.error("Add a transcript first."); return; }
    const srt = transcript.suggestedClips.map((c) => clipToSrt(c, transcript.words)).join("\n");
    const ok = downloadTextFile(`webedit-${silo}-captions.srt`, srt, "text/plain");
    toast[ok ? "success" : "error"](ok ? "Captions exported (.srt)" : "Download failed");
  }

  function copyCaptionPack() {
    const content = transcript?.suggestedClips.length
      ? transcript.suggestedClips.map((c, i) => `Clip ${i + 1} (${formatTime(c.start)}–${formatTime(c.end)}):\n${c.text}`).join("\n\n")
      : segments.map((r) => `${r.label} [${ROLE_LABELS[r.role]}]: ${r.note}`).join("\n\n");
    if (!content.trim()) { toast.error("Add a transcript or timeline notes first."); return; }
    navigator.clipboard.writeText(content).then(() => toast.success("Caption plan copied")).catch(() => toast.error("Copy failed"));
  }

  function downloadTranscript() {
    if (!transcript?.text.trim()) { toast.error("Add a transcript first."); return; }
    const ok = downloadTextFile(`webedit-${silo}-transcript.txt`, transcript.text, "text/plain");
    toast[ok ? "success" : "error"](ok ? "Transcript downloaded" : "Download failed");
  }

  function saveToOutputHistory(kind: "cut-note" | "social-video-draft" | "caption-plan" | "thumbnail-brief" | "edit-brief") {
    const title = webeditTitle || `${v.name} WebEdit`;
    const siloName = v.name;

    if (!webeditTitle.trim() && (kind === "edit-brief" || kind === "social-video-draft")) {
      toast.error("Add a clip title first — enter it in the Brand section above.", { duration: 4500 });
      return;
    }
    if (kind === "social-video-draft" && !hookText.trim()) {
      toast.error("Set a hook line before saving a Social Video Draft — use Step 3 Hook Finder or type it in Step 4.", { duration: 4500 });
      return;
    }
    if (kind === "cut-note") {
      const hasContent = segments.some((s) => s.note.trim() || s.start || s.end) || Boolean(transcript);
      if (!hasContent) {
        toast.error("Build a timeline first — fill in at least one segment note in Step 4.", { duration: 4500 });
        return;
      }
    }
    if (kind === "caption-plan") {
      const hasCaptionDetail = captionPackAngle.trim() || lowerThirdName.trim() || pinnedComment.trim() || captionPlatformNotes.trim();
      if (!hasCaptionDetail) {
        toast.error("Add at least one caption detail (angle, lower third, or pinned comment) before saving.", { duration: 4500 });
        return;
      }
    }

    if (kind === "edit-brief") {
      recordEditBrief({ silo, siloName, prompt: title, output: { title, editBrief: buildEditBriefText(), json: buildCutPlanJson(), platform: platformFrame, goal: clipGoal } });
      toast.success("Edit brief saved to Output History");
    } else if (kind === "cut-note") {
      recordCutNote({ silo, siloName, prompt: title, output: { title, hookText, segments, captionStyle, platform: platformFrame, goal: clipGoal, transcriptSummary: transcript ? `${formatTime(transcript.duration)} · ${transcript.suggestedClips.length} clips` : "manual" } });
      toast.success("Cut notes saved to Output History");
    } else if (kind === "caption-plan") {
      recordCaptionPlan({ silo, siloName, prompt: title, output: { title, captionStyle: CAPTION_STYLES.find((s) => s.id === captionStyle)?.label, captionPackAngle, lowerThirdName, lowerThirdContext, pinnedComment, captionPlatformNotes, accessibilityNote } });
      toast.success("Caption plan saved to Output History");
    } else if (kind === "thumbnail-brief") {
      recordThumbnailBrief({ silo, siloName, prompt: title, output: { title, thumbnailText, thumbnailSubheadline, thumbnailFrameNote, thumbnailLogoPlacement, coverImageReady: Boolean(coverImage), havenAINote: "Real render requires backend — this is a manual-edit brief" } });
      toast.success("Thumbnail brief saved to Output History");
    } else if (kind === "social-video-draft") {
      const clipPackage = buildEditBriefText().slice(0, 1200);
      recordSocialVideoDraft({ silo, siloName, prompt: title, output: { title, clipPackageText: clipPackage, hookText, captionStyle, platform: platformFrame, pinnedComment, captionPlatformNotes } });
      toast.success("Social video draft saved to Output History");
    }
  }

  function buildClipPackageForSocialFactory(): string {
    return [
      `WEBEDIT CLIP PACKAGE — ${v.name}`,
      `Title: ${webeditTitle || "(untitled)"}`,
      `Goal: ${CLIP_GOALS.find((g) => g.id === clipGoal)?.label ?? clipGoal}`,
      `Hook: ${hookText || "(set hook in WebEdit)"}`,
      `Platform: ${platformFrame}`,
      `Caption style: ${CAPTION_STYLES.find((s) => s.id === captionStyle)?.label}`,
      `Caption angle: ${captionPackAngle || "(not set)"}`,
      `Pinned comment: ${pinnedComment || "(not set)"}`,
      `Transcript: ${transcript ? `${formatTime(transcript.duration)} · local timeline` : "manual notes"}`,
    ].join("\n");
  }

  function copyClipPackageForSocialFactory() {
    navigator.clipboard.writeText(buildClipPackageForSocialFactory())
      .then(() => toast.success("Clip package copied — paste into Social Factory › From WebEdit"))
      .catch(() => toast.error("Copy failed"));
  }

  const showCaptions = captionsOn && transcript && transcript.words.length > 0 && captionStyle !== "subtitle";

  const webeditReadiness = useMemo(() => {
    if (!videoUrl && !manualText.trim()) return "empty";
    if (!transcript && !manualText.trim()) return "media_uploaded";
    if (!hookText.trim()) return "transcript_added";
    if (segments.every((s) => !s.start && !s.end)) return "hooks_selected";
    if (!thumbnailText.trim() && !coverImage) return "timeline_built";
    return "ready_for_manual_edit";
  }, [videoUrl, manualText, transcript, hookText, segments, thumbnailText, coverImage]);

  const readinessLabel: Record<string, string> = {
    empty: "Needs Video",
    media_uploaded: "Media Loaded",
    transcript_added: "Transcript Added",
    hooks_selected: "Hooks Selected",
    timeline_built: "Timeline Built",
    caption_ready: "Caption Ready",
    thumbnail_ready: "Thumbnail Ready",
    ready_for_manual_edit: "Ready for Manual Edit",
  };

  return (
    <div className="hmg-studio-mode flex-1 flex flex-col min-h-0 px-3 pt-3 pb-6 overflow-y-auto bg-background text-foreground gap-3">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#EF4444", color: "#fff" }}>
          <Video className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-black tracking-tight leading-none">WebEdit</h2>
            <span className="text-[11px] font-bold text-muted-foreground">· Clip Studio</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${webeditReadiness === "ready_for_manual_edit" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}>
              {readinessLabel[webeditReadiness] ?? webeditReadiness}
            </span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            <TruthChip label="Local Timeline" status="local" />
            <TruthChip label="Memory-Backed" status="local" />
            <TruthChip label="Live Transcription: Server Required" status="pending" />
            <TruthChip label="Final Render: Server Required" status="pending" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
            Haven AI prepares your edit plan locally. Live transcription and final render require your media server.
          </p>
        </div>
      </div>

      {/* Brand Rail */}
      <div className="rounded-xl border p-2.5" style={{ borderColor: `${v.color}55`, background: `${v.color}12` }}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Brand</p>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0" style={{ background: v.color, color: v.onAccent }}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            {v.name}
          </span>
        </div>
        <SiloPicker value={silo} onChange={setSilo} />
        <Input
          value={webeditTitle}
          onChange={(e) => setWebeditTitle(e.target.value)}
          placeholder="Clip title (e.g. FULL INTERVIEW: Mayor on the Record)"
          className="mt-2 h-9 bg-secondary/60 border-border text-sm"
        />
      </div>

      {/* ─── STEP 1: Upload / Intake ─── */}
      <section className="rounded-2xl border border-border/60 bg-card/45 p-3">
        <StepHeader n="1" icon={FileVideo} title="Upload Video" hint="Stage source clips, upload audio, or add a source URL" color={brandColor} />

        <input ref={fileRef} type="file" accept="video/*,audio/*" onChange={handleFile} className="hidden" aria-label="Upload video or audio file" />
        <input ref={trayFileRef} type="file" accept="video/*,audio/*,image/*" multiple onChange={handleTrayFiles} className="hidden" aria-label="Upload multiple assets" />

        <div className="space-y-2">
          {/* Asset tray */}
          {cutAssets.length > 0 ? (
            <div className="space-y-1.5">
              {cutAssets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-secondary/25 p-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-bold">{asset.name}</p>
                    <p className="text-[10px] text-muted-foreground">{asset.type || "media"} · {formatBytes(asset.size)} · {asset.readinessLabel}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${asset.readiness === "large" ? "bg-amber-400/20 text-amber-300" : "bg-emerald-400/15 text-emerald-300"}`}>
                      {asset.type.startsWith("image/") ? "Plan" : "Ready"}
                    </span>
                    <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled={transcribing || asset.type.startsWith("image/")} onClick={() => void transcribeFile(asset.file)}>
                      Load
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <button type="button" onClick={() => trayFileRef.current?.click()} disabled={safeMode} className="grid min-h-[100px] w-full place-items-center rounded-xl border border-dashed border-border/70 bg-secondary/20 px-3 text-center disabled:opacity-50">
              <span>
                <FileVideo className="mx-auto h-7 w-7 text-muted-foreground/40" />
                <span className="mt-2 block text-[12px] font-bold">Add source videos, voice notes, or interview audio</span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">Select audio or video to transcribe; images stay in the plan</span>
              </span>
            </button>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => trayFileRef.current?.click()} disabled={safeMode || cutAssets.length >= MAX_CUT_ASSETS}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Add Assets
            </Button>
            <button type="button" onClick={() => setMediaOpen(true)} disabled={safeMode} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/60 px-3 text-[11px] font-bold hover:border-foreground/40 disabled:opacity-50">
              <Library className="w-3.5 h-3.5" />
              Upload Video
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground/80">
            Local preview only · Object URLs are not stored · {uploadLimitLabel()}
          </p>

          {cutAssets.length > 0 && processingQueue.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-background/30 p-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Upload readiness — {processingQueue.length} staged</p>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {processingQueue.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border/40 bg-secondary/20 px-2 py-1">
                    <p className="truncate text-[10px] font-bold">{item.filename}</p>
                    <p className="text-[9px] text-muted-foreground">{item.stage} · {item.readiness} · {formatBytes(item.size)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Video player */}
        {!videoUrl && !safeMode && (
          <button onClick={() => fileRef.current?.click()} disabled={transcribing} className="mt-3 w-full rounded-2xl border-2 border-dashed border-border/60 hover:border-foreground/40 transition-colors px-4 py-8 text-center disabled:opacity-50">
            <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
            <div className="mt-2 text-sm font-bold uppercase tracking-wide">Drop a video</div>
            <p className="text-[11px] text-muted-foreground mt-1">MP4 / MOV / WebM / MP3 / WAV · {uploadLimitLabel()}</p>
          </button>
        )}
        {!videoUrl && safeMode && (
          <p className="mt-3 text-[11px] text-amber-300">Safe Mode is on — media uploads and AI calls disabled.</p>
        )}

        {videoUrl && (
          <div className="mt-3 space-y-2">
            <div className="relative rounded-xl overflow-hidden bg-secondary" style={{ aspectRatio: "16 / 9" }}>
              <video ref={videoRef} src={videoUrl} controls playsInline className="absolute inset-0 w-full h-full" />
              {showCaptions && (
                <CaptionOverlay videoRef={videoRef} words={transcript!.words} brandColor={brandColor} />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => fileRef.current?.click()} variant="outline" size="sm" disabled={transcribing || safeMode}>
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Replace
              </Button>
              {transcribing && (
                <>
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {transcribeStatus ?? "Starting transcription"}
                  </span>
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={cancelTranscription}>Cancel</Button>
                </>
              )}
              {transcript && <span className="text-[11px] text-muted-foreground">{formatTime(transcript.duration)} · {transcript.words.length} words · {transcript.language}</span>}
            </div>
            {transcribing && transcribeProgress && (
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, Math.min(100, (transcribeProgress.uploadedBytes / Math.max(1, transcribeProgress.totalBytes)) * 100))}%`, background: brandBg }} />
              </div>
            )}
          </div>
        )}

        {errorDetail && (
          <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold">Transcription failed</div>
                <div>{errorDetail.message}</div>
                <div className="text-[10px] text-red-300/80 mt-0.5">Paste a manual transcript in Step 2 to keep moving.</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── STEP 2: Transcript / Notes ─── */}
      <section className="rounded-2xl border border-border/60 bg-card/45 p-3">
        <button type="button" onClick={() => setStep2Open((v) => !v)} className="w-full flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-[11px] font-black" style={{ borderColor: brandColor, color: brandColor }}>2</div>
            <PenLine className="w-4 h-4 shrink-0" style={{ color: brandColor }} />
            <div className="text-left">
              <h3 className="text-[12px] font-black uppercase tracking-wider">Add Transcript</h3>
              <p className="text-[10px] text-muted-foreground">Paste transcript, add notes, flag risks, name sources</p>
            </div>
          </div>
          {step2Open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {step2Open && (
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Transcript</label>
              <Textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Paste full transcript here. Haven AI will parse it for hook suggestions."
                className="min-h-[100px] resize-none bg-secondary/60 border-border text-sm"
              />
              {manualText.trim() && (
                <Button type="button" size="sm" onClick={applyManualTranscript} className="mt-1.5 h-8 text-[11px]" style={{ background: brandBg, color: v.onAccent }}>
                  Use This Transcript
                </Button>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Notes</label>
              <Textarea
                value={transcriptNotes}
                onChange={(e) => setTranscriptNotes(e.target.value)}
                placeholder="Speaker names, important quotes, context, or background..."
                className="min-h-[60px] resize-none bg-secondary/60 border-border text-sm"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Do Not Use</label>
                <Textarea
                  value={doNotUseMarkers}
                  onChange={(e) => setDoNotUseMarkers(e.target.value)}
                  placeholder="Lines or moments to exclude..."
                  className="min-h-[52px] resize-none bg-secondary/60 border-border text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Risk Notes</label>
                <Textarea
                  value={riskNotes}
                  onChange={(e) => setRiskNotes(e.target.value)}
                  placeholder="Legal, safety, or editorial concerns..."
                  className="min-h-[52px] resize-none bg-secondary/60 border-border text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Source Note</label>
              <Input
                value={sourceNoteField}
                onChange={(e) => setSourceNoteField(e.target.value)}
                placeholder="Source name, publication, interview date, or attribution..."
                className="h-9 bg-secondary/60 border-border text-sm"
              />
            </div>

            <details className="rounded-xl border border-border/60 bg-secondary/20 p-3">
              <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Source Article Draft <span className="ml-2 text-[10px] normal-case font-normal">optional context from Editorial Desk</span>
              </summary>
              <Textarea
                value={sourceArticlePackage}
                onChange={(e) => setSourceArticlePackage(e.target.value)}
                placeholder="Paste a compact article draft, headline, or source note."
                className="mt-2 min-h-[76px] resize-none bg-secondary/60 border-border text-sm"
              />
            </details>
          </div>
        )}
      </section>

      {/* ─── STEP 3: Hook Finder ─── */}
      <section className="rounded-2xl border border-border/60 bg-card/45 p-3">
        <button type="button" onClick={() => setStep3Open((v) => !v)} className="w-full flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-[11px] font-black" style={{ borderColor: brandColor, color: brandColor }}>3</div>
            <Sparkles className="w-4 h-4 shrink-0" style={{ color: brandColor }} />
            <div className="text-left">
              <h3 className="text-[12px] font-black uppercase tracking-wider">Find Hooks</h3>
              <p className="text-[10px] text-muted-foreground">Deterministic — from your pasted transcript, no fake AI</p>
            </div>
          </div>
          {step3Open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {step3Open && (
          <div className="space-y-3">
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] px-3 py-2.5 flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-violet-300/80 leading-relaxed">
                Hook Finder parses your pasted transcript for strong quotes, emotional language, urgency signals, and risk patterns. No model scoring. No automatic transcription. No external analysis.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={findHooks} className="h-9 text-[11px] min-w-[44px] min-h-[44px]" style={{ background: brandBg, color: v.onAccent }}>
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Find Hooks
              </Button>
              {hookFinderRan && hookFinderResult && (
                <span className="text-[11px] text-muted-foreground self-center">
                  {hookFinderResult.candidates.length} candidates · ~{hookFinderResult.estimatedDurationSec}s
                </span>
              )}
            </div>

            {hookFinderRan && hookFinderResult && showHookFinder && (
              <div className="space-y-3">
                {/* Candidates */}
                <div className="space-y-2">
                  {hookFinderResult.candidates.slice(0, 6).map((c) => (
                    <div key={c.id} className="rounded-xl border border-border/60 bg-secondary/25 p-2.5 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${c.confidence === "high" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : c.confidence === "medium" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-zinc-700/40 text-zinc-400 border-zinc-600/30"}`}>
                          {c.label}
                        </span>
                        {c.type === "risk-warning" && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                        {c.type === "needs-verification" && <Flag className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      {c.type !== "risk-warning" && c.type !== "needs-verification" && c.type !== "founder-note" && (
                        <p className="text-[12px] text-foreground/90 leading-snug">{c.text}</p>
                      )}
                      {(c.type === "risk-warning" || c.type === "needs-verification" || c.type === "founder-note") && (
                        <p className="text-[11px] text-muted-foreground italic leading-snug">{c.text}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground leading-snug">{c.note}</p>
                      {c.type !== "risk-warning" && c.type !== "needs-verification" && c.type !== "founder-note" && (
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => useHookCandidate(c.text)}>
                          Use as Hook
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {hookFinderResult.riskNotes.length > 0 && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.06] px-3 py-2.5">
                    <p className="text-[11px] font-bold text-rose-400 mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Risk Language Detected
                    </p>
                    {hookFinderResult.riskNotes.map((note, i) => (
                      <p key={i} className="text-[11px] text-rose-300/80 leading-snug">{note}</p>
                    ))}
                  </div>
                )}

                {hookFinderResult.verificationNotes.length > 0 && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] px-3 py-2">
                    {hookFinderResult.verificationNotes.map((note, i) => (
                      <p key={i} className="text-[11px] text-amber-300/80 leading-snug">{note}</p>
                    ))}
                  </div>
                )}

                {/* Intelligence recommendations */}
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-2.5 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Clip Intelligence
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Suggested caption style</p>
                      <p className="text-[11px] text-foreground/90 font-bold capitalize">{hookFinderResult.captionStyleSuggestion}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Format recommendation</p>
                      <p className="text-[11px] text-foreground/90">{hookFinderResult.formatRecommendation}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Headline overlay suggestion</p>
                      <p className="text-[11px] text-foreground/90 font-bold">{hookFinderResult.headlineOverlaySuggestion}</p>
                    </div>
                    {hookFinderResult.quoteHeavy && (
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-violet-300 font-bold">Quote-heavy transcript — use a direct quote as your hook for maximum authority.</span>
                      </div>
                    )}
                  </div>
                  {hookFinderResult.doNotUseFound.length > 0 && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/[0.06] px-2 py-1.5">
                      <p className="text-[10px] font-bold text-rose-400 mb-0.5">Do Not Use markers found in transcript:</p>
                      <p className="text-[11px] text-rose-300/80">"{hookFinderResult.doNotUseFound.slice(0, 3).join('", "')}"</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Avoid selecting any candidate that includes these lines.</p>
                    </div>
                  )}
                  {hookFinderResult.controversyAngle && !hookFinderResult.controversyAngle.startsWith("No controversy") && (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Controversy angle</p>
                      <p className="text-[11px] text-foreground/80 line-clamp-2">{hookFinderResult.controversyAngle}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {hookText.trim() && (
              <div className="rounded-xl border border-border/60 bg-secondary/20 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Selected Hook</p>
                <p className="text-[12px] text-foreground/90 leading-snug">{hookText}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── STEP 4: Timeline Builder ─── */}
      <section className="rounded-2xl border border-border/60 bg-card/45 p-3">
        <button type="button" onClick={() => setStep4Open((v) => !v)} className="w-full flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-[11px] font-black" style={{ borderColor: brandColor, color: brandColor }}>4</div>
            <ListChecks className="w-4 h-4 shrink-0" style={{ color: brandColor }} />
            <div className="text-left">
              <h3 className="text-[12px] font-black uppercase tracking-wider">Build Timeline</h3>
              <p className="text-[10px] text-muted-foreground">Segments, roles, timing, and risk flags</p>
            </div>
          </div>
          {step4Open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {step4Open && (
          <div className="space-y-3">
            {/* Hook text input */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Hook Line</label>
              <Textarea
                value={hookText}
                onChange={(e) => setHookText(e.target.value)}
                placeholder="What stops the scroll in the first 2 seconds? (Use Step 3 to find it)"
                className="min-h-[64px] resize-none bg-secondary/60 border-border text-sm"
              />
            </div>

            {/* Clip Goal */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Clip Goal</label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {CLIP_GOALS.map((goal) => {
                  const active = clipGoal === goal.id;
                  return (
                    <button key={goal.id} type="button" onClick={() => setClipGoal(goal.id)}
                      className={`rounded-xl border px-2.5 py-2 text-left transition-all ${active ? "border-transparent" : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground"}`}
                      style={active ? { background: brandBg, color: v.onAccent } : undefined}>
                      <span className="block text-[11px] font-black uppercase tracking-tight">{goal.label}</span>
                      <span className="mt-0.5 block text-[10px] leading-tight opacity-80">{goal.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Segment rows */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Segments</label>
                <Button type="button" size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={addSegment}>
                  <Plus className="w-3 h-3" />
                  Add Segment
                </Button>
              </div>

              <div className="space-y-2">
                {segments.map((row) => (
                  <div key={row.id} className="rounded-xl border border-border/60 bg-secondary/25 p-2.5 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: ROLE_COLORS[row.role] }} />
                      <Input
                        value={row.label}
                        onChange={(e) => updateSegment(row.id, { label: e.target.value })}
                        className="h-7 w-28 bg-secondary/60 border-border text-xs font-bold"
                        placeholder="Label"
                      />
                      <div className="flex gap-1 flex-wrap">
                        {(["hook", "context", "payoff", "cta"] as SegmentRole[]).map((r) => (
                          <button key={r} type="button" onClick={() => updateSegment(row.id, { role: r })}
                            className={`h-6 px-2 rounded-full text-[10px] font-bold border transition-all ${row.role === r ? "border-transparent text-white" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
                            style={row.role === r ? { background: ROLE_COLORS[r] } : undefined}>
                            {ROLE_LABELS[r]}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={() => removeSegment(row.id)} className="ml-auto text-[10px] text-muted-foreground hover:text-rose-400 transition-colors" aria-label="Remove segment">×</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Start (sec)</label>
                        <Input value={row.start} onChange={(e) => updateSegment(row.id, { start: e.target.value })} className="mt-1 h-8 bg-secondary/60 border-border text-xs" placeholder="0" />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">End (sec)</label>
                        <Input value={row.end} onChange={(e) => updateSegment(row.id, { end: e.target.value })} className="mt-1 h-8 bg-secondary/60 border-border text-xs" placeholder="8" />
                      </div>
                    </div>
                    <Input
                      value={row.note}
                      onChange={(e) => updateSegment(row.id, { note: e.target.value })}
                      className="h-8 bg-secondary/60 border-border text-xs"
                      placeholder="Edit note..."
                    />
                    <Input
                      value={row.riskFlag}
                      onChange={(e) => updateSegment(row.id, { riskFlag: e.target.value })}
                      className="h-8 bg-secondary/60 border-border text-xs"
                      placeholder="Risk flag (optional)"
                    />
                    {row.start && row.end && (
                      <p className="text-[10px] text-muted-foreground">
                        Est. duration: ~{Math.max(0, parseFloat(row.end) - parseFloat(row.start)).toFixed(1)}s
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual timeline bar */}
            <div className="rounded-xl border border-border/60 bg-black/10 p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">
                <Scissors className="h-3.5 w-3.5" />
                Local Timeline Mode
              </div>
              <div className="flex h-8 overflow-hidden rounded-full border border-border/60 bg-secondary/30">
                {(transcript?.segments.slice(0, 8) ?? segments).map((segment, index, arr) => (
                  <button
                    key={"id" in segment ? segment.id : `${index}`}
                    type="button"
                    className="min-w-[36px] border-r border-background/40 text-[9px] font-black uppercase tracking-wider text-white last:border-r-0"
                    style={{ width: `${100 / Math.max(1, arr.length)}%`, background: index % 2 === 0 ? brandColor : "#111827" }}
                    title={"text" in segment ? segment.text : `${(segment as ClipSegmentRow).label}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground/70">Local timeline — no render. Use trim points and segment notes for your editor.</p>
            </div>

            {/* Trim controls */}
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-2.5 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" />
                Choose Clip Length
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Start (sec)</label>
                  <Input type="number" step="0.1" min="0" value={trimStart} onChange={(e) => setTrimStart(e.target.value)} placeholder="0" className="bg-secondary/60 border-border text-sm h-8 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">End (sec)</label>
                  <Input type="number" step="0.1" min="0" value={trimEnd} onChange={(e) => setTrimEnd(e.target.value)} placeholder="30" className="bg-secondary/60 border-border text-sm h-8 mt-1" />
                </div>
              </div>
              {videoUrl && (
                <Button type="button" size="sm" variant="outline" onClick={previewSegment} className="h-8 text-[11px]">
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Preview Cut Notes
                </Button>
              )}
            </div>

            {/* CutPlanStudio */}
            <CutPlanStudio silo={silo} siloName={v.name} brand={{ color: v.color, on: v.onAccent }} stagedAssetFilenames={cutAssets.map((a) => a.name)} />

            {/* Suggested clips from transcript */}
            {transcript && transcript.suggestedClips.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Suggested Clips · sorted by hook score</p>
                {transcript.suggestedClips.map((c) => {
                  const isActive = c.id === activeClipId;
                  return (
                    <div key={c.id} className={`rounded-xl border bg-secondary/40 p-3 transition-colors ${isActive ? "border-transparent" : "border-border/60 hover:border-foreground/30"}`}
                      style={isActive ? { borderColor: brandColor, boxShadow: `0 0 0 1px ${brandColor}` } : undefined}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                          <span style={{ color: brandColor }}>{formatTime(c.start)} – {formatTime(c.end)}</span>
                          <span className="text-muted-foreground">· hook {(c.hookScore * 100).toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {videoUrl && (
                            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => jumpTo(c.start, c.id)}>
                              <Play className="w-3 h-3 mr-1" />
                              Play
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => copySrt(c)}>
                            <Copy className="w-3 h-3 mr-1" />
                            SRT
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-[11px]"
                            onClick={() => { setTrimStart(c.start.toFixed(1)); setTrimEnd(c.end.toFixed(1)); toast.success("Trim controls populated from clip"); }}>
                            <Scissors className="w-3 h-3 mr-1" />
                            Use
                          </Button>
                        </div>
                      </div>
                      <p className="text-[12px] text-foreground/90 leading-relaxed line-clamp-3">{c.text}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {transcript && (
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Full Transcript</p>
                <p className="text-[12px] text-foreground/85 leading-relaxed whitespace-pre-wrap">{transcript.text}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ─── STEP 5: Caption Studio ─── */}
      <section className="rounded-2xl border border-border/60 bg-card/45 p-3">
        <button type="button" onClick={() => setStep5Open((v) => !v)} className="w-full flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-[11px] font-black" style={{ borderColor: brandColor, color: brandColor }}>5</div>
            <Captions className="w-4 h-4 shrink-0" style={{ color: brandColor }} />
            <div className="text-left">
              <h3 className="text-[12px] font-black uppercase tracking-wider">Caption Style</h3>
              <p className="text-[10px] text-muted-foreground">Lower thirds, headline overlay, platform caption notes</p>
            </div>
          </div>
          {step5Open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {step5Open && (
          <div className="space-y-3">
            {/* Caption toggle */}
            <div className="flex items-center justify-between rounded-md border border-border/60 bg-secondary/30 px-3 py-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider">Captions Overlay</p>
                <p className="text-[10px] text-muted-foreground">Preview on video (requires transcript)</p>
              </div>
              <button type="button" onClick={() => setCaptionsOn((v) => !v)}
                className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-all ${captionsOn ? "border-transparent" : "border-border/60 text-muted-foreground"}`}
                style={captionsOn ? { background: brandBg, color: v.onAccent } : undefined}>
                {captionsOn ? "On" : "Off"}
              </button>
            </div>

            {/* Caption style presets */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Caption Style Presets</label>
              <div className="grid grid-cols-2 gap-1.5">
                {CAPTION_STYLES.map((s) => {
                  const active = captionStyle === s.id;
                  return (
                    <button key={s.id} type="button" onClick={() => setCaptionStyle(s.id)}
                      className={`text-left rounded-xl border px-2.5 py-2 transition-all ${active ? "border-transparent" : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground"}`}
                      style={active ? { background: brandBg, color: v.onAccent } : undefined}>
                      <div className="text-[11px] font-bold uppercase tracking-wider">{s.label}</div>
                      <div className="text-[10px] opacity-80 leading-tight">{s.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lower Third */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Lower Third</label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input value={lowerThirdName} onChange={(e) => setLowerThirdName(e.target.value)} placeholder="Name / label line" className="h-9 bg-secondary/60 border-border text-sm" />
                <Input value={lowerThirdContext} onChange={(e) => setLowerThirdContext(e.target.value)} placeholder="Context / title line" className="h-9 bg-secondary/60 border-border text-sm" />
              </div>
            </div>

            {/* Caption pack angle */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Headline Overlay / Caption Angle</label>
              <Textarea
                value={captionPackAngle}
                onChange={(e) => setCaptionPackAngle(e.target.value)}
                placeholder="What should every platform caption push? (e.g. 'Mayor breaks silence on...')"
                className="min-h-[60px] resize-none bg-secondary/60 border-border text-sm"
              />
            </div>

            {/* Platform caption notes */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Platform Caption Notes</label>
              <Textarea
                value={captionPlatformNotes}
                onChange={(e) => setCaptionPlatformNotes(e.target.value)}
                placeholder="TikTok: add text overlay. IG: tag 3 accounts. X: quote the hook. YouTube: SEO title..."
                className="min-h-[60px] resize-none bg-secondary/60 border-border text-sm"
              />
            </div>

            {/* Pinned comment */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                <MessageSquare className="inline w-3 h-3 mr-1" />
                Pinned Comment Starter
              </label>
              <Textarea
                value={pinnedComment}
                onChange={(e) => setPinnedComment(e.target.value)}
                placeholder="Write the pinned comment that keeps the thread on topic..."
                className="min-h-[52px] resize-none bg-secondary/60 border-border text-sm"
              />
            </div>

            {/* Accessibility */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Accessibility Note</label>
              <Input
                value={accessibilityNote}
                onChange={(e) => setAccessibilityNote(e.target.value)}
                placeholder="Alt text or caption accessibility note..."
                className="h-9 bg-secondary/60 border-border text-sm"
              />
            </div>
          </div>
        )}
      </section>

      {/* ─── STEP 6: Crop / Format ─── */}
      <section className="rounded-2xl border border-border/60 bg-card/45 p-3">
        <button type="button" onClick={() => setStep6Open((v) => !v)} className="w-full flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-[11px] font-black" style={{ borderColor: brandColor, color: brandColor }}>6</div>
            <LayoutGrid className="w-4 h-4 shrink-0" style={{ color: brandColor }} />
            <div className="text-left">
              <h3 className="text-[12px] font-black uppercase tracking-wider">Crop Format</h3>
              <p className="text-[10px] text-muted-foreground">Platform dimensions, aspect ratios, and delivery format</p>
            </div>
          </div>
          {step6Open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {step6Open && (
          <div className="space-y-3">
            {/* Extended format selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Target Formats</label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {EXTENDED_PLATFORM_FORMATS.map((fmt) => {
                  const active = selectedFormats.includes(fmt.id);
                  return (
                    <button key={fmt.id} type="button" onClick={() => toggleFormat(fmt.id)}
                      className={`rounded-xl border px-3 py-2 text-left transition-all ${active ? "border-transparent" : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground"}`}
                      style={active ? { background: brandBg, color: v.onAccent } : undefined}>
                      <div className="text-[11px] font-black uppercase tracking-tight">{fmt.label}</div>
                      <div className="text-[10px] opacity-80 leading-tight">{fmt.hint}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Classic platform frame for preview */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Preview Frame</label>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORM_FRAMES.map((p) => {
                  const active = platformFrame === p.id;
                  return (
                    <button key={p.id} type="button" onClick={() => setPlatformFrame(p.id)} title={p.size}
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full border transition-all ${active ? "border-transparent" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
                      style={active ? { background: brandBg, color: v.onAccent } : undefined}>
                      {p.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Preview frame only — final crop in your editor.</p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-[11px] text-amber-300/80">
              <Clock className="inline w-3.5 h-3.5 mr-1.5" />
              <strong>Crop notes saved.</strong> Final format delivery requires your editor or media server.
            </div>
          </div>
        )}
      </section>

      {/* ─── STEP 7: Thumbnail / Cover Frame ─── */}
      <section className="rounded-2xl border border-border/60 bg-card/45 p-3">
        <button type="button" onClick={() => setStep7Open((v) => !v)} className="w-full flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-[11px] font-black" style={{ borderColor: brandColor, color: brandColor }}>7</div>
            <ImageUp className="w-4 h-4 shrink-0" style={{ color: brandColor }} />
            <div className="text-left">
              <h3 className="text-[12px] font-black uppercase tracking-wider">Thumbnail Frame</h3>
              <p className="text-[10px] text-muted-foreground">Capture frame, upload still, add headline, handoff to WebArt</p>
            </div>
          </div>
          {step7Open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {step7Open && (
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Real people → capture the actual video frame or upload an official / licensed still. AI people are never used as celebrity thumbnails — make concept backgrounds in WebArt (labeled <em>AI concept only</em>).
            </p>

            <input ref={coverFileRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" aria-label="Upload cover frame image" />

            {coverCropSrc && (
              <Suspense fallback={<div className="flex items-center justify-center h-32 text-muted-foreground text-xs">Loading crop tool…</div>}>
                <ImageCropper
                  image={coverCropSrc}
                  brandColor={brandColor}
                  onApply={handleCoverCropApply}
                  onCancel={cancelCoverCrop}
                />
              </Suspense>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" size="sm" variant="outline" onClick={captureFrame} disabled={!videoUrl} className="h-10 text-[11px] min-h-[44px]">
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                Capture Frame
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => coverFileRef.current?.click()} disabled={safeMode} className="h-10 text-[11px] min-h-[44px]">
                <ImageUp className="w-3.5 h-3.5 mr-1.5" />
                Upload Still
              </Button>
            </div>

            <div className="grid gap-2">
              <Input value={thumbnailText} onChange={(e) => setThumbnailText(e.target.value)} placeholder="Thumbnail headline (e.g. FULL INTERVIEW)" className="h-9 bg-secondary/60 border-border text-sm" />
              <Input value={thumbnailSubheadline} onChange={(e) => setThumbnailSubheadline(e.target.value)} placeholder="Subheadline (optional)" className="h-9 bg-secondary/60 border-border text-sm" />
              <Input value={thumbnailLogoPlacement} onChange={(e) => setThumbnailLogoPlacement(e.target.value)} placeholder="Logo placement (e.g. top-right, bottom-left)" className="h-9 bg-secondary/60 border-border text-sm" />
              <Input value={thumbnailFrameNote} onChange={(e) => setThumbnailFrameNote(e.target.value)} placeholder="Frame / image note for editor" className="h-9 bg-secondary/60 border-border text-sm" />
              <Textarea value={thumbnailWebArtHandoff} onChange={(e) => setThumbnailWebArtHandoff(e.target.value)} placeholder="WebArt handoff note: what to build in WebArt if no real photo is available..." className="min-h-[60px] resize-none bg-secondary/60 border-border text-sm" />
            </div>

            {/* Quality label */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Image Quality Label</p>
              <div className="flex flex-wrap gap-1.5">
                {UPLOAD_LABEL_CHOICES.map((id) => {
                  const def = QUALITY_LABELS[id];
                  const active = coverOrigin === "upload" && coverLabel === id;
                  return (
                    <button key={id} type="button" onClick={() => { setCoverOrigin("upload"); setCoverLabel(id); }} title={def.description}
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all ${active ? "border-transparent" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
                      style={active ? { background: brandColor, color: v.onAccent } : undefined}>
                      {def.short}
                    </button>
                  );
                })}
                <button type="button" onClick={() => setCoverOrigin("ai")} title={QUALITY_LABELS["ai-concept"].description}
                  className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all ${coverOrigin === "ai" ? "border-transparent" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
                  style={coverOrigin === "ai" ? { background: brandColor, color: v.onAccent } : undefined}>
                  {QUALITY_LABELS["ai-concept"].short}
                </button>
              </div>
            </div>

            <Suspense fallback={<div className="flex items-center justify-center h-16 text-muted-foreground text-xs">Loading guide…</div>}>
              <OfficialSourceGuide />
            </Suspense>

            {/* Cover image preview */}
            {coverImage ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Thumbnail Frame</p>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {coverQualityLabels.map((def) => <QualityBadge key={def.id} def={def} withDescription />)}
                    </div>
                  </div>
                  <Input value={coverHeadline} onChange={(e) => setCoverHeadline(e.target.value)} placeholder="Cover headline (e.g. FULL INTERVIEW)" className="bg-secondary/60 border-border text-sm h-9 mb-2" />
                  <img src={coverImage} alt="" className="w-full max-w-[280px] mx-auto rounded-md" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Outputs</p>
                    <button type="button" onClick={applyCoverPreset} className="text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 text-foreground/70 hover:text-foreground">
                      <LayoutGrid className="w-3 h-3" />
                      {v.name} preset
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FRAME_PLATFORMS.map((p) => {
                      const active = coverFormats.includes(p);
                      return (
                        <button key={p} type="button" onClick={() => toggleCoverFormat(p)}
                          className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all ${active ? "border-transparent" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
                          style={active ? { background: brandColor, color: v.onAccent } : undefined}>
                          {FRAMES[p].shortLabel}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Frame style:</span>
                    {(["border", "solid"] as FrameStyle[]).map((s) => {
                      const active = coverStyle === s;
                      return (
                        <button key={s} type="button" onClick={() => setCoverStyle(s)}
                          className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${active ? "border-transparent" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
                          style={active ? { background: brandColor, color: v.onAccent } : undefined}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {coverFormats.map((p) => (
                    <SocialFrame key={p} platform={p} style={coverStyle} image={coverImage} headline={coverHeadline} brand={{ color: v.color, on: v.onAccent }} siloName={v.name} filenamePrefix={`webedit-${v.id}`} qualityLabels={coverQualityLabels} logo={v.logo} />
                  ))}
                  {!coverFormats.length && <p className="text-[11px] text-muted-foreground italic">Select at least one target output above.</p>}
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground/80 inline-flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Capture a frame or upload a still to build branded covers.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ─── STEP 8: Save / Export ─── */}
      <section className="rounded-2xl border border-border/60 bg-card/45 p-3">
        <StepHeader n="8" icon={Rocket} title="Save Cut Notes" hint="Save to Output History, copy briefs, send to Social Factory" color={brandColor} />

        <div className="space-y-3">
          {/* Production receipt */}
          <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
            {[
              { label: "Goal", value: CLIP_GOALS.find((g) => g.id === clipGoal)?.label ?? "Set" },
              { label: "Assets", value: String(cutAssets.length + (videoUrl ? 1 : 0)) },
              { label: "Format", value: PLATFORM_FRAMES.find((p) => p.id === platformFrame)?.label ?? platformFrame },
              { label: "Captions", value: CAPTION_STYLES.find((s) => s.id === captionStyle)?.label ?? captionStyle },
              { label: "Hook", value: hookText ? "Ready" : "Needed" },
              { label: "Lower Third", value: lowerThirdName || lowerThirdContext ? "Ready" : "Optional" },
              { label: "Thumbnail", value: thumbnailText || coverImage ? "Ready" : "Needed" },
              { label: "Transcript", value: transcript ? "Ready" : "Manual/empty" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/50 bg-secondary/25 p-2">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-1 truncate font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Readiness checks */}
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            {[
              { icon: Type, label: "Hook line", done: Boolean(hookText.trim()) },
              { icon: Captions, label: "Captions angle", done: Boolean(captionPackAngle.trim() || transcript) },
              { icon: ImageIcon, label: "Thumbnail plan", done: Boolean(thumbnailText.trim() || coverImage) },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${item.done ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-border/40 bg-secondary/20"}`}>
                  {item.done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />}
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${item.done ? "text-emerald-400" : "text-muted-foreground"}`} />
                  <span className={`text-[11px] font-bold ${item.done ? "text-emerald-300" : "text-muted-foreground"}`}>{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Next action guidance */}
          {webeditReadiness !== "ready_for_manual_edit" ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">Before saving</p>
              {webeditReadiness === "empty" && <p className="text-[12px] text-foreground/70">Upload a video or paste a transcript to start building your clip.</p>}
              {webeditReadiness === "media_uploaded" && <p className="text-[12px] text-foreground/70">Paste or upload a transcript in Step 2 so Hook Finder has content to work with.</p>}
              {webeditReadiness === "transcript_added" && <p className="text-[12px] text-foreground/70">Run Hook Finder in Step 3 to pick your opening line before saving.</p>}
              {webeditReadiness === "hooks_selected" && <p className="text-[12px] text-foreground/70">Add timeline segment notes in Step 4 to complete your cut plan.</p>}
              {webeditReadiness === "timeline_built" && <p className="text-[12px] text-foreground/70">Add a thumbnail headline or capture a frame in Step 7 before saving.</p>}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-3 py-2">
              <p className="text-[11px] font-bold text-emerald-300">Ready — save your Social Video Draft or Edit Brief below to lock it into Output History.</p>
            </div>
          )}

          {/* Save to Output History */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Save to Output History</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => saveToOutputHistory("edit-brief")} className="h-10 text-[11px] min-h-[44px]" style={{ background: brandBg, color: v.onAccent }}>
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Save Edit Brief
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => saveToOutputHistory("cut-note")} className="h-10 text-[11px] min-h-[44px]">
                <ListChecks className="w-3.5 h-3.5 mr-1.5" />
                Save Cut Notes
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => saveToOutputHistory("caption-plan")} className="h-10 text-[11px] min-h-[44px]">
                <Captions className="w-3.5 h-3.5 mr-1.5" />
                Save Caption Plan
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => saveToOutputHistory("thumbnail-brief")} className="h-10 text-[11px] min-h-[44px]">
                <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                Save Thumbnail Brief
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => saveToOutputHistory("social-video-draft")} className="h-10 text-[11px] min-h-[44px]">
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Save Social Video Draft
              </Button>
            </div>
          </div>

          {/* Copy actions */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Copy & Export</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={copyEditBrief} className="h-9 text-[11px]">
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy Editor Brief
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={copyCaptionPack} className="h-9 text-[11px]">
                <Captions className="w-3.5 h-3.5 mr-1.5" />
                Copy Caption Plan
              </Button>
              {transcript && (
                <>
                  <Button type="button" size="sm" variant="outline" onClick={exportCaptions} className="h-9 text-[11px]">
                    Export Captions (.srt)
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={downloadTranscript} className="h-9 text-[11px]">
                    Export Transcript
                  </Button>
                </>
              )}
              <Button type="button" size="sm" variant="outline" onClick={copyCutPlan} className="h-9 text-[11px]">
                <ClipboardCopy className="w-3.5 h-3.5 mr-1.5" />
                Copy Full JSON
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={downloadCutPlan} className="h-9 text-[11px]">
                Export Edit Brief
              </Button>
            </div>
          </div>

          {/* Send to Social Factory */}
          <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" style={{ color: brandColor }} />
              <p className="text-[11px] font-bold uppercase tracking-wider">Send to Social Factory</p>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">
              Copy your clip notes below and paste into Social Factory › From WebEdit to build your post.
            </p>
            <Button type="button" size="sm" variant="outline" onClick={copyClipPackageForSocialFactory} className="h-9 text-[11px]">
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy Clip Package
            </Button>
          </div>
        </div>

        {/* Technical details */}
        <div className="mt-3 rounded-xl border border-border/60 bg-secondary/30 p-3 space-y-2">
          <button type="button" onClick={() => setShowTech((t) => !t)} className="w-full flex items-center justify-between text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider">Technical details</span>
            <span className="text-[10px] text-muted-foreground">{showTech ? "hide" : "show"}</span>
          </button>
          {showTech && (
            <ul className="text-[10px] text-muted-foreground leading-relaxed list-disc pl-4 space-y-1">
              <li>Transcription runs on the server. If it can not return text, paste your own transcript to keep working.</li>
              <li>{transcript?.timingMode === "estimated" ? "Current word timing is estimated from transcript length." : "When exact word timing is not reported, WebEdit estimates from transcript length."}</li>
              <li>Upload limit: {uploadLimitLabel()}. Cover images up to {formatBytes(MEDIA_LIMITS.imageMaxBytes)}.</li>
              <li>Edit briefs export as JSON; captions export as standard .srt.</li>
              <li>Haven AI: Local Timeline Mode active. Hook Finder is deterministic — no model call required.</li>
            </ul>
          )}
        </div>
      </section>

      {/* Draft clear */}
      {draftSaved && (
        <div className="flex justify-end">
          <button type="button" onClick={() => { clearDraft(); setDraftSaved(false); toast.message("Draft cleared"); }}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-border">
            <Eraser className="w-3.5 h-3.5" />
            Clear draft
          </button>
        </div>
      )}

      <UniversalMediaSource open={mediaOpen} onClose={() => setMediaOpen(false)} context="cutmaster" brand={{ id: silo, color: v.color, on: v.onAccent }} actions={CUTMASTER_MEDIA_ACTIONS} onPick={() => {}} accept="av" onLocalFile={(file) => { void transcribeFile(file); }} title="Add Media to WebEdit" />
    </div>
  );
}
