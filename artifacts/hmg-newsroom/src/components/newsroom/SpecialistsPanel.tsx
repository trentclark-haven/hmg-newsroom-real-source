import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useGenerateSpecialist,
  type Specialist as ApiSpecialist,
  type Silo as ApiSilo,
} from "@workspace/api-client-react";
import {
  Brush,
  Copy,
  ImagePlus,
  Loader2,
  Search,
  Video,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { recordOutput } from "@/lib/useOutputHistory";
import { recordUsage } from "@/lib/useUsageStats";
import { useFounderVoice } from "@/lib/useFounderVoice";
import { MEDIA_LIMITS, formatBytes } from "@/lib/mediaLimits";

interface SpecialistsPanelProps {
  silo: ApiSilo;
  siloName: string;
  brand: { bg: string; on: string; color: string };
}

type SpecialistOption = {
  value: ApiSpecialist;
  label: string;
  icon: typeof Brush;
  color: string;
  desc: string;
};

const SPECIALISTS: SpecialistOption[] = [
  {
    value: "artbot",
    label: "WebArt Notes",
    icon: Brush,
    color: "#A855F7",
    desc: "Visual prompt + edit notes",
  },
  {
    value: "cutmaster",
    label: "WebEdit",
    icon: Video,
    color: "#EF4444",
    desc: "Video script, B-roll, edit notes, and platform output",
  },
  {
    value: "seomaster",
    label: "SEO Master",
    icon: Search,
    color: "#10B981",
    desc: "5 headlines, meta options, Yoast checklist",
  },
];

export function SpecialistsPanel({ silo, siloName, brand }: SpecialistsPanelProps) {
  const [open, setOpen] = useState(false);
  const [specialist, setSpecialist] = useState<ApiSpecialist>("artbot");
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [output, setOutput] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const mutation = useGenerateSpecialist();
  const [founderVoice] = useFounderVoice(silo);

  const active = SPECIALISTS.find((s) => s.value === specialist) ?? SPECIALISTS[0];

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MEDIA_LIMITS.imageMaxBytes) {
      toast.error(`Image must be under ${formatBytes(MEDIA_LIMITS.imageMaxBytes)}.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(typeof ev.target?.result === "string" ? ev.target.result : null);
    };
    reader.readAsDataURL(file);
  }

  async function handleRun() {
    if (!prompt.trim()) {
      toast.error("Add notes for the assistant.");
      return;
    }
    setOutput("");
    try {
      const finalPrompt = founderVoice
        ? `Founder Voice (Trent Clark Mode) is ON for this silo. Apply the Haven editorial voice informed by Trent Clark's journalism style.\n\n${prompt}`
        : prompt;
      const data = await mutation.mutateAsync({
        data: {
          specialist,
          silo,
          prompt: finalPrompt,
          image: image ?? undefined,
        },
      });
      setOutput(data.content ?? "");
      recordOutput({
        silo,
        siloName,
        kind: "specialist",
        prompt,
        specialist,
        output: data,
      });
      recordUsage(silo, "specialist");
    } catch {
      toast.error("Assistant draft failed.");
    }
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard
      .writeText(output)
      .then(() => toast.success(`Copied ${active.label} output`))
      .catch(() => toast.error("Copy failed"));
  }

  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 border-b border-border/40 hover:bg-foreground/5 transition-colors"
      >
        <div
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: brand.color }}
        >
          <Wand2 className="w-3.5 h-3.5" />
          Desk Assistants
        </div>
        <span className="text-[10px] text-muted-foreground">
          {open ? "Hide" : "WebArt Notes · WebEdit · SEO Master"}
        </span>
      </button>

      {open && (
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {SPECIALISTS.map((opt) => {
              const Icon = opt.icon;
              const active = specialist === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSpecialist(opt.value)}
                  className={`text-[11px] font-semibold px-2 py-2 rounded-md border transition-all flex flex-col items-center gap-1 ${
                    active
                      ? "border-transparent text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  }`}
                  style={
                    active
                      ? { background: opt.color, color: "#fff" }
                      : undefined
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground italic px-1">
            {active.desc}
          </p>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Tell ${active.label} what you need...`}
            disabled={mutation.isPending}
            className="min-h-[80px] resize-none bg-secondary/40 border-border text-sm"
          />

          {/* Image attach */}
          <div className="flex items-center gap-2">
            {image ? (
              <div className="relative inline-block">
                <img
                  src={image}
                  alt="Reference"
                  className="h-12 w-12 object-cover rounded-md border border-border"
                />
                <button
                  onClick={() => {
                    setImage(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute -top-1.5 -right-1.5 bg-background border border-border rounded-full p-0.5"
                  aria-label="Remove image"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={mutation.isPending}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-2 py-1 rounded border border-dashed border-border hover:border-foreground/40 transition-colors"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                Attach reference image
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="hidden"
            />
            <Button
              onClick={handleRun}
              disabled={mutation.isPending || !prompt.trim()}
              size="sm"
              className="ml-auto h-8 text-[12px] font-semibold rounded-full"
              style={{ background: active.color, color: "#fff" }}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Wand2 className="w-3 h-3 mr-1.5" />
                  Run {active.label}
                </>
              )}
            </Button>
          </div>

          {output && (
            <div className="rounded-md border border-border/40 bg-secondary/40">
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/30">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {active.label} output
                </span>
                <button
                  onClick={handleCopy}
                  className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-foreground/5"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <pre className="px-2.5 py-2 text-[12px] leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans">
                {output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
