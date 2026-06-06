import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList,
  Copy,
  Download,
  FileText,
  ListChecks,
  Mic,
  Save,
  Sparkles,
  Tag,
  Video,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { recordAudit } from "@/lib/auditLog";
import { useMediaLibrary } from "@/lib/useMediaLibrary";
import {
  buildCutPlan,
  clipGoalById,
  clipPlatformById,
  cutPlanToMarkdown,
  cutPlanToReceipt,
  CLIP_GOAL_PRESETS,
  CLIP_LENGTH_BUCKETS,
  CLIP_PLATFORM_PRESETS,
  type ClipGoalId,
  type ClipLengthBucketId,
  type ClipPlatformId,
  type CutPlan,
  type CutPlanInput,
} from "@/lib/hmg/cutmaster/cutPlanEngine";

interface CutPlanStudioProps {
  silo: string;
  siloName: string;
  brand: { color: string; on: string };
  /** Filenames already staged in the parent WebEdit intake tray. */
  stagedAssetFilenames?: string[];
}

/**
 * In-app cut-plan desk. The operator types the clip goal, brand, platform,
 * length, headline and speaker details; the engine produces a structured,
 * editor-ready packet (hooks, cut list with timing, lower-third, thumbnail,
 * caption pack, editor notes, export checklist, receipt).
 *
 * No video conversion happens here — the artifact is the cut PLAN. Real-world
 * editing is done in the operator's editor of choice. The Founder gets a real
 * deliverable instead of a blocked console.
 */
export function CutPlanStudio({
  silo,
  siloName,
  brand,
  stagedAssetFilenames = [],
}: CutPlanStudioProps) {
  const [topic, setTopic] = useState("");
  const [headline, setHeadline] = useState("");
  const [goal, setGoal] = useState<ClipGoalId>("hook-first-news");
  const [platform, setPlatform] = useState<ClipPlatformId>("tiktok");
  const [length, setLength] = useState<ClipLengthBucketId>("medium");
  const [notes, setNotes] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [speakerTitle, setSpeakerTitle] = useState("");
  const [source, setSource] = useState("");
  const [plan, setPlan] = useState<CutPlan | null>(null);
  const mediaLibrary = useMediaLibrary();

  const canBuild = topic.trim().length >= 4;
  const goalPreset = clipGoalById(goal);
  const platformPreset = clipPlatformById(platform);

  function build() {
    if (!canBuild) {
      toast.error("Add a clip topic (4+ chars) before building the plan.");
      return;
    }
    const input: CutPlanInput = {
      brand: silo,
      brandName: siloName,
      topic: topic.trim(),
      goal,
      platform,
      length,
      notes: notes.trim(),
      headline: headline.trim() || undefined,
      speakerName: speakerName.trim() || undefined,
      speakerTitle: speakerTitle.trim() || undefined,
      source: source.trim() || undefined,
      assetFilenames: stagedAssetFilenames,
    };
    const built = buildCutPlan(input);
    setPlan(built);
    recordAudit(
      "clip-packaged",
      silo,
      `Cut plan ready · ${goalPreset.label} · ${platformPreset.label} · ${built.totalLengthSec}s`,
    );
    toast.success("Cut plan ready");
  }

  function copyMarkdown() {
    if (!plan) return;
    navigator.clipboard
      .writeText(cutPlanToMarkdown(plan))
      .then(() => toast.success("Cut plan copied as Markdown"))
      .catch(() => toast.error("Copy failed"));
  }

  function downloadJson() {
    if (!plan) return;
    const blob = new Blob([JSON.stringify(plan, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cutplan-${plan.input.brand}-${plan.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Cut plan JSON downloaded");
  }

  function downloadMarkdown() {
    if (!plan) return;
    const blob = new Blob([cutPlanToMarkdown(plan)], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cutplan-${plan.input.brand}-${plan.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Cut plan Markdown downloaded");
  }

  function saveReceipt() {
    if (!plan) return;
    mediaLibrary.add({
      name: `Cut plan · ${plan.input.topic.slice(0, 48)}`,
      type: "video",
      silo,
      intendedUse: `Cut plan receipt — ${platformPreset.label} · ${plan.totalLengthSec}s`,
    });
    toast.success("Receipt saved to Media Library");
  }

  return (
    <div className="space-y-3" data-testid="cutplan-studio">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center"
          style={{ background: brand.color, color: brand.on }}
        >
          <ClipboardList className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-black tracking-tight leading-none">
            WebEdit Cut Plan
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Type the clip you want; create hooks, cut list, lower-third,
            thumbnail, caption pack, and export checklist your editor can use.
          </p>
        </div>
      </div>

      {/* Topic + headline */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Clip topic
        </p>
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What is this clip about? e.g. Drake surprise headline performance at Toronto Forum on Friday."
          className="min-h-[60px] bg-secondary/60 border-border text-sm"
          data-testid="cutplan-topic"
        />
        <Input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="On-screen headline (optional, e.g. SURPRISE TORONTO SHOW)"
          className="bg-secondary/60 border-border text-sm h-9"
          data-testid="cutplan-headline"
        />
      </div>

      {/* Goal / Platform / Length */}
      <div className="grid gap-2 sm:grid-cols-3">
        <Selector
          label="Goal"
          icon={Sparkles}
          value={goal}
          options={CLIP_GOAL_PRESETS.map((g) => ({ id: g.id, label: g.label, blurb: g.blurb }))}
          onChange={(v) => setGoal(v as ClipGoalId)}
          brand={brand}
          testId="cutplan-goal"
        />
        <Selector
          label="Platform"
          icon={Video}
          value={platform}
          options={CLIP_PLATFORM_PRESETS.map((p) => ({
            id: p.id,
            label: p.label,
            blurb: p.blurb,
          }))}
          onChange={(v) => setPlatform(v as ClipPlatformId)}
          brand={brand}
          testId="cutplan-platform"
        />
        <Selector
          label="Length"
          icon={Tag}
          value={length}
          options={CLIP_LENGTH_BUCKETS.map((b) => ({
            id: b.id,
            label: b.label,
            blurb: `${b.range[0]}–${b.range[1]} seconds`,
          }))}
          onChange={(v) => setLength(v as ClipLengthBucketId)}
          brand={brand}
          testId="cutplan-length"
        />
      </div>

      {/* Speaker + Source + Notes */}
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={speakerName}
          onChange={(e) => setSpeakerName(e.target.value)}
          placeholder="Speaker name (lower-third primary)"
          className="bg-secondary/60 border-border text-sm h-9"
          data-testid="cutplan-speaker-name"
        />
        <Input
          value={speakerTitle}
          onChange={(e) => setSpeakerTitle(e.target.value)}
          placeholder="Speaker title (lower-third secondary)"
          className="bg-secondary/60 border-border text-sm h-9"
          data-testid="cutplan-speaker-title"
        />
        <Input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Source / credit (e.g. OVO 20 livestream)"
          className="bg-secondary/60 border-border text-sm h-9"
          data-testid="cutplan-source"
        />
        <Input
          value={stagedAssetFilenames.length ? `${stagedAssetFilenames.length} asset(s) staged in tray` : "No assets staged yet"}
          readOnly
          disabled
          className="bg-secondary/40 border-border text-sm h-9 opacity-90"
          data-testid="cutplan-asset-readout"
        />
      </div>

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Editor brief / context (optional). What angle should the cut take?"
        className="min-h-[60px] bg-secondary/60 border-border text-sm"
        data-testid="cutplan-notes"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={build}
          disabled={!canBuild}
          data-testid="cutplan-build"
          className="h-10 font-bold text-[12px]"
          style={canBuild ? { background: brand.color, color: brand.on } : undefined}
        >
          <Wand2 className="w-3.5 h-3.5 mr-1.5" />
          Create Cut Plan
        </Button>
        {plan && (
          <span className="text-[11px] text-muted-foreground">
            Cut output ready · {plan.totalLengthSec}s · {plan.segments.length} beats · {plan.hooks.length} hooks
          </span>
        )}
      </div>

      {plan && <PlanOutput plan={plan} brand={brand} onCopyMd={copyMarkdown} onDownloadJson={downloadJson} onDownloadMd={downloadMarkdown} onSaveReceipt={saveReceipt} />}
    </div>
  );
}

function Selector({
  label,
  icon: Icon,
  value,
  options,
  onChange,
  brand,
  testId,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  options: Array<{ id: string; label: string; blurb: string }>;
  onChange: (id: string) => void;
  brand: { color: string; on: string };
  testId: string;
}) {
  return (
    <div data-testid={testId}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 inline-flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              title={opt.blurb}
              data-testid={`${testId}-${opt.id}`}
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors ${
                active
                  ? "border-transparent"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
              style={active ? { background: brand.color, color: brand.on } : undefined}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlanOutput({
  plan,
  brand,
  onCopyMd,
  onDownloadJson,
  onDownloadMd,
  onSaveReceipt,
}: {
  plan: CutPlan;
  brand: { color: string; on: string };
  onCopyMd: () => void;
  onDownloadJson: () => void;
  onDownloadMd: () => void;
  onSaveReceipt: () => void;
}) {
  const platform = clipPlatformById(plan.input.platform);
  const goal = clipGoalById(plan.input.goal);
  const runningTimes = useMemo(() => {
    const out: Array<{ start: number; end: number }> = [];
    let r = 0;
    for (const s of plan.segments) {
      const start = r;
      const end = r + s.durationSec;
      out.push({ start, end });
      r = end;
    }
    return out;
  }, [plan]);

  return (
    <div
      data-testid="cutplan-output"
      className="rounded-xl border bg-card/40 overflow-hidden"
      style={{ borderColor: `${brand.color}55` }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-border/40"
        style={{ background: `${brand.color}10` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: brand.color, color: brand.on }}
          >
            {plan.input.brandName} · {goal.label}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {platform.label} · {plan.totalLengthSec}s · {platform.aspect}
          </span>
        </div>
      </div>

      {/* Hooks */}
      <SectionHead icon={Mic} title="Hooks" />
      <ul className="px-3 pb-3 space-y-1.5" data-testid="cutplan-hooks">
        {plan.hooks.map((h, i) => (
          <li key={i} className="text-[13px] leading-snug text-foreground/90">
            <span className="text-muted-foreground mr-1.5">[{i + 1}]</span>
            {h}
          </li>
        ))}
      </ul>

      {/* Cut list */}
      <SectionHead icon={Video} title="Cut list" />
      <ul className="px-3 pb-3 space-y-1.5" data-testid="cutplan-segments">
        {plan.segments.map((s, i) => {
          const t = runningTimes[i];
          return (
            <li
              key={i}
              className="text-[13px] leading-snug flex gap-2"
              data-testid={`cutplan-segment-${i}`}
            >
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 h-fit"
                style={{ background: `${brand.color}20`, color: brand.color }}
              >
                {formatTime(t.start)}–{formatTime(t.end)}
              </span>
              <div>
                <span className="font-bold text-[12px] uppercase tracking-wider mr-2">
                  {s.label}
                </span>
                <span className="text-muted-foreground">{s.direction}</span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Lower-third + Thumbnail */}
      <div className="grid sm:grid-cols-2 gap-3 px-3 pb-3 pt-2 border-t border-border/40" data-testid="cutplan-third-thumb">
        <div>
          <SectionHeadInline icon={Tag} title="Lower-third" />
          <p className="text-[13px] leading-snug">
            <strong>{plan.lowerThird.primary}</strong>
          </p>
          <p className="text-[12px] text-muted-foreground">{plan.lowerThird.secondary}</p>
          <p className="text-[11px] text-muted-foreground/80 mt-1">{plan.lowerThird.credit}</p>
        </div>
        <div>
          <SectionHeadInline icon={FileText} title="Thumbnail" />
          <p
            className="text-[24px] font-black uppercase tracking-tight leading-none"
            style={{ color: brand.color }}
          >
            {plan.thumbnail.bigWord}
          </p>
          <p className="text-[12px] text-foreground/90 mt-1">{plan.thumbnail.tagline}</p>
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">{plan.thumbnail.credit}</p>
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">{plan.thumbnail.faceFocus}</p>
        </div>
      </div>

      {/* Caption pack */}
      <SectionHead icon={Sparkles} title="Caption pack" />
      <div className="px-3 pb-3 space-y-1" data-testid="cutplan-caption">
        <p className="text-[13px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1.5">Hook</span>
          {plan.caption.hook}
        </p>
        <p className="text-[13px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1.5">Body</span>
          {plan.caption.body}
        </p>
        <p className="text-[13px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1.5">CTA</span>
          {plan.caption.cta}
        </p>
        <p className="text-[13px] text-foreground/80">{plan.caption.hashtags.join(" ")}</p>
      </div>

      {/* Editor notes + Checklist */}
      <SectionHead icon={ListChecks} title="Editor notes" />
      <ul className="px-3 pb-3 space-y-1" data-testid="cutplan-editor-notes">
        {plan.editorNotes.map((n, i) => (
          <li key={i} className="text-[12px] leading-snug text-foreground/85">— {n}</li>
        ))}
      </ul>
      <SectionHead icon={ListChecks} title="Export checklist" />
      <ul className="px-3 pb-3 space-y-1" data-testid="cutplan-export-checklist">
        {plan.exportChecklist.map((n, i) => (
          <li key={i} className="text-[12px] leading-snug text-foreground/85">☐ {n}</li>
        ))}
      </ul>

      <SectionHead icon={ListChecks} title="Verification notes" />
      <ul className="px-3 pb-3 space-y-1" data-testid="cutplan-verification-notes">
        {plan.verificationNotes.map((n, i) => (
          <li key={i} className="text-[12px] leading-snug text-amber-200/90">! {n}</li>
        ))}
      </ul>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-3 border-t border-border/40">
        <Button type="button" size="sm" onClick={onCopyMd} data-testid="cutplan-copy-md" className="h-8 text-[11px]">
          <Copy className="w-3 h-3 mr-1" />
          Copy Cut Packet
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDownloadMd} data-testid="cutplan-download-md" className="h-8 text-[11px]">
          <Download className="w-3 h-3 mr-1" />
          Export .md
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDownloadJson} data-testid="cutplan-download-json" className="h-8 text-[11px]">
          <Download className="w-3 h-3 mr-1" />
          Export .json
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onSaveReceipt} data-testid="cutplan-save-receipt" className="h-8 text-[11px]">
          <Save className="w-3 h-3 mr-1" />
          Save Receipt
        </Button>
      </div>
    </div>
  );
}

function SectionHead({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="px-3 py-2 border-b border-border/40 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-full">
      <Icon className="w-3 h-3" />
      {title}
    </div>
  );
}

function SectionHeadInline({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
      <Icon className="w-3 h-3" /> {title}
    </p>
  );
}

function formatTime(sec: number): string {
  const mm = Math.floor(sec / 60).toString().padStart(2, "0");
  const ss = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

// Re-export so consumers can save receipts later if needed without importing engine.
export { cutPlanToReceipt };
