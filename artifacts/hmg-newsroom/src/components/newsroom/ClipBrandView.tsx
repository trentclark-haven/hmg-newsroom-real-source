import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCutmasterTranscribe,
  useGenerateSpecialist,
  type Silo as ApiSilo,
} from "@workspace/api-client-react";
import { verticals } from "@/lib/mock-data";
import { SiloPicker } from "./SiloPicker";
import { useFounderVoice } from "@/lib/useFounderVoice";
import { recordOutput } from "@/lib/useOutputHistory";
import { recordUsage } from "@/lib/useUsageStats";
import { recordAudit } from "@/lib/auditLog";
import { recordSafeModeBlock, useSafeMode } from "@/lib/safeMode";
import { hasDraft, useDraft } from "@/lib/useDraft";
import {
  MEDIA_LIMITS,
  formatBytes,
  uploadLimitLabel,
} from "@/lib/mediaLimits";
import {
  AlertTriangle,
  Copy,
  Eraser,
  Film,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

interface ClipBrandDraft {
  silo: ApiSilo;
  headline: string;
}

const CLIPBRAND_DRAFT_KEY = "hmg-clipbrand-draft-v1";

// Use the canonical media-limits config — never hardcode byte literals here.
const MAX_BYTES = MEDIA_LIMITS.videoMaxBytes;

interface TranscribeWord {
  word: string;
  start: number;
  end: number;
}

interface TranscribeData {
  text: string;
  duration: number;
  language: string;
  words: TranscribeWord[];
  segments: { id: number; start: number; end: number; text: string }[];
  suggestedClips: {
    id: string;
    start: number;
    end: number;
    text: string;
    hookScore: number;
  }[];
  timingMode?: "exact" | "estimated";
}

function readError(err: unknown): string {
  const e = err as {
    data?: { error?: string } | null;
    message?: string;
  };
  if (e?.data && typeof e.data === "object" && typeof e.data.error === "string") {
    return e.data.error;
  }
  return typeof e?.message === "string" ? e.message : "Transcription failed.";
}

function buildPrompt(args: {
  transcript: string;
  headline: string;
  founderVoice: boolean;
  estimatedTiming: boolean;
}) {
  const lines: string[] = [];
  if (args.headline.trim()) {
    lines.push(`Working headline: ${args.headline.trim()}`);
  }
  if (args.estimatedTiming) {
    lines.push(
      "Note: Transcript timestamps are ESTIMATED (not exact). When suggesting a clip window, treat times as approximate.",
    );
  }
  if (args.founderVoice) {
    lines.push(
      "Founder Voice (Trent Clark Mode) is ON for this silo. Apply the Haven editorial voice informed by Trent Clark's journalism style.",
    );
  }
  lines.push("");
  lines.push("Transcript:");
  lines.push(args.transcript.trim());
  return lines.join("\n");
}

export function ClipBrandView() {
  const [draft, setDraft, clearDraft] = useDraft<ClipBrandDraft>(
    CLIPBRAND_DRAFT_KEY,
    {
      silo: verticals[0].id as ApiSilo,
      headline: "",
    },
  );
  const silo = draft.silo;
  const headline = draft.headline;
  const setSilo = (v: ApiSilo) => setDraft((p) => ({ ...p, silo: v }));
  const setHeadline = (v: string) => setDraft((p) => ({ ...p, headline: v }));
  const [draftSaved, setDraftSaved] = useState<boolean>(() =>
    hasDraft(CLIPBRAND_DRAFT_KEY),
  );
  useEffect(() => {
    const i = setInterval(
      () => setDraftSaved(hasDraft(CLIPBRAND_DRAFT_KEY)),
      800,
    );
    return () => clearInterval(i);
  }, []);

  const [transcript, setTranscript] = useState<TranscribeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [packageOutput, setPackageOutput] = useState<string | null>(null);
  const [founderVoice] = useFounderVoice(silo);
  const fileRef = useRef<HTMLInputElement>(null);
  const transcribe = useCutmasterTranscribe();
  const specialist = useGenerateSpecialist();

  const { enabled: safeMode } = useSafeMode();
  const v = verticals.find((x) => x.id === silo)!;
  const brandColor = v.color;
  const isUploading = transcribe.isPending;
  const isPackaging = specialist.isPending;
  const estimatedTiming = transcript?.timingMode === "estimated";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (safeMode) {
      recordSafeModeBlock("media-upload", "ClipBrandView/upload");
      toast.error("Safe Mode is on — media uploads disabled.");
      e.target.value = "";
      return;
    }
    setError(null);
    setPackageOutput(null);
    setTranscript(null);
    if (file.size > MAX_BYTES) {
      const msg = `File too large. Max ${formatBytes(MAX_BYTES)} per upload.`;
      setError(msg);
      toast.error(msg);
      return;
    }
    try {
      const data = (await transcribe.mutateAsync({
        data: { silo, file: file as unknown as string },
      })) as unknown as TranscribeData;
      if (!data.text || !data.text.trim()) {
        const msg =
          "AI transcription returned an empty result. Try a clearer source.";
        setError(msg);
        toast.error(msg);
        return;
      }
      setTranscript(data);
      toast.success(
        `Transcribed · ${data.words.length} words · ${data.suggestedClips.length} clips`,
      );
    } catch (err) {
      const msg = readError(err);
      setError(msg);
      toast.error(msg);
    }
  }

  async function handleRunPackage() {
    if (!transcript || !transcript.text.trim()) {
      toast.error("Upload a clip first to get a transcript.");
      return;
    }
    if (safeMode) {
      recordSafeModeBlock("ai-call", "ClipBrandView/package");
      toast.error("Safe Mode is on — AI calls disabled.");
      return;
    }
    setPackageOutput(null);
    try {
      const data = await specialist.mutateAsync({
        data: {
          specialist: "clipbrand",
          silo,
          prompt: buildPrompt({
            transcript: transcript.text,
            headline,
            founderVoice,
            estimatedTiming: Boolean(estimatedTiming),
          }),
        },
      });
      const content = data.content ?? "";
      setPackageOutput(content);
      recordUsage(silo, "specialist");
      recordOutput({
        silo,
        siloName: v.name,
        kind: "specialist",
        prompt: headline || transcript.text.slice(0, 200),
        specialist: "clipbrand",
        output: { content, headline },
      });
      toast.success("Clip output ready");
      recordAudit(
        "clip-packaged",
        silo,
        `Clip+Brand output (transcript ${transcript.text.length}c, headline ${headline.length}c)`,
      );
    } catch {
      toast.error("Clip + Brand failed to create an output.");
    }
  }

  function copyPackage() {
    if (!packageOutput) return;
    navigator.clipboard
      .writeText(packageOutput)
      .then(() => toast.success("Copied output"))
      .catch(() => toast.error("Copy failed"));
  }

  return (
    <div
      data-testid="clipbrand-view"
      className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-4 overflow-y-auto"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "#6366F1", color: "#fff" }}
        >
          <Film className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black tracking-tight leading-none">
            Clip + Brand
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            Upload a clip → auto transcript → ready-to-paste packaging assets
          </p>
        </div>
      </div>

      <SiloPicker value={silo} onChange={setSilo} />

      <input
        ref={fileRef}
        type="file"
        accept="video/*,audio/*"
        onChange={handleFile}
        className="hidden"
        aria-label="Upload clip for Clip + Brand transcription"
      />

      {draftSaved && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              clearDraft();
              setDraftSaved(false);
              toast.message("Draft cleared");
            }}
            data-testid="clipbrand-clear-draft"
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-border"
          >
            <Eraser className="w-3.5 h-3.5" />
            Clear draft
          </button>
        </div>
      )}

      <div className="mt-3 space-y-2">
        <Input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Optional working headline"
          data-testid="clipbrand-headline"
          className="bg-secondary/40 border-border text-sm h-10"
        />

        {safeMode && (
          <p
            data-testid="clipbrand-safe-mode-note"
            className="text-[11px] text-amber-300"
          >
            Safe Mode is on — media uploads & AI calls disabled.
          </p>
        )}
        <Button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading || safeMode}
          data-testid="clipbrand-upload-btn"
          className="w-full rounded-full font-semibold h-11"
          style={{ background: "#6366F1", color: "#fff" }}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Transcribing audio…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload clip (Supports large uploads)
            </>
          )}
        </Button>

        <p className="text-[10px] text-muted-foreground/70">
          MP4 / MOV / WebM / MP3 / WAV / M4A · {uploadLimitLabel()} Audio
          extracted server-side.
        </p>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12px] text-red-700 dark:text-red-200 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="font-bold">Transcription failed</div>
            <div className="break-words">{error}</div>
          </div>
        </div>
      )}

      {transcript && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/90">
              Transcript
            </span>
            {estimatedTiming && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40">
                <AlertTriangle className="w-3 h-3" />
                Estimated timing
              </span>
            )}
          </div>
          <div
            data-testid="clipbrand-transcript"
            className="rounded-md border border-border/60 bg-secondary/30 p-3 max-h-44 overflow-y-auto text-[13px] leading-relaxed text-foreground/85 whitespace-pre-wrap"
          >
            {transcript.text}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {Math.round(transcript.duration)}s · {transcript.words.length} words ·{" "}
            {transcript.suggestedClips.length} suggested clips
          </div>

          <Button
            type="button"
            onClick={handleRunPackage}
            disabled={isPackaging || safeMode}
            data-testid="clipbrand-run"
            className="w-full rounded-full font-semibold h-11"
            style={{ background: "#6366F1", color: "#fff" }}
          >
            {isPackaging ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating output...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run Clip + Brand
              </>
            )}
          </Button>

          {founderVoice && (
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: brandColor }}
            >
              Founder Voice ON for {v.name}
            </p>
          )}
        </div>
      )}

      {packageOutput && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Output
            </h3>
            <button
              onClick={copyPackage}
              className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
          <pre
            data-testid="clipbrand-package-output"
            className="rounded-xl border border-border/50 bg-secondary/20 p-3 text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed font-sans overflow-auto"
          >
            {packageOutput}
          </pre>
        </div>
      )}
    </div>
  );
}
