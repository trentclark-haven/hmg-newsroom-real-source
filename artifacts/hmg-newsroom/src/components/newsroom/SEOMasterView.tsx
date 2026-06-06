import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useGenerateSpecialist,
  type Silo as ApiSilo,
} from "@workspace/api-client-react";
import { BookOpen, Copy, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { verticals } from "@/lib/mock-data";
import { SiloPicker } from "./SiloPicker";
import { recordOutput } from "@/lib/useOutputHistory";
import { recordUsage } from "@/lib/useUsageStats";
import { useFounderVoice } from "@/lib/useFounderVoice";
import { recordSafeModeBlock, useSafeMode } from "@/lib/safeMode";
import {
  createCorpusRetriever,
  buildGroundedPrompt,
  type GroundedPromptResult,
} from "@/lib/hmg/haven-ai";
import { CorpusCitations } from "@/components/newsroom/CorpusCitations";

const SEO_API_BASE = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");

/**
 * Zero-paid corpus retriever for SEO Master related-stories grounding. Returns
 * null on any failure so generation degrades to ungrounded — never faked.
 */
const retrieveCorpus = createCorpusRetriever(SEO_API_BASE);

export function SEOMasterView() {
  const [silo, setSilo] = useState<ApiSilo>(verticals[0].id as ApiSilo);
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [useCorpus, setUseCorpus] = useState(true);
  const [grounding, setGrounding] = useState<GroundedPromptResult | null>(null);
  const mutation = useGenerateSpecialist();
  const [founderVoice] = useFounderVoice(silo);
  const { enabled: safeMode } = useSafeMode();

  const v = verticals.find((x) => x.id === silo)!;

  async function handleRun() {
    if (!prompt.trim()) {
      toast.error("Drop a topic or angle for SEO Master.");
      return;
    }
    if (safeMode) {
      recordSafeModeBlock("ai-call", "SEOMasterView/run");
      toast.error("Safe Mode is on — AI calls disabled.");
      return;
    }
    setOutput("");
    setGrounding(null);
    try {
      const voicedPrompt = founderVoice
        ? `Founder Voice (Trent Clark Mode) is ON for this silo. Apply the Haven editorial voice informed by Trent Clark's journalism style.\n\n${prompt}`
        : prompt;
      // Zero-paid corpus grounding for related-stories context (honest no-op
      // when nothing matches; never fabricates sources).
      const ground = useCorpus
        ? await buildGroundedPrompt(
            retrieveCorpus,
            { query: prompt, module: "seo-master", limit: 6 },
            voicedPrompt,
          )
        : null;
      setGrounding(ground);
      const finalPrompt = ground?.prompt ?? voicedPrompt;
      const data = await mutation.mutateAsync({
        data: { specialist: "seomaster", silo, prompt: finalPrompt },
      });
      setOutput(data.content ?? "");
      recordOutput({
        silo,
        siloName: v.name,
        kind: "specialist",
        prompt,
        specialist: "seomaster",
        output: data,
      });
      recordUsage(silo, "specialist");
    } catch {
      toast.error("SEO Master generation failed.");
    }
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard
      .writeText(output)
      .then(() => toast.success("Copied SEO output"))
      .catch(() => toast.error("Copy failed"));
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "#10B981", color: "#fff" }}
        >
          <Search className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-black tracking-tight leading-none">
            SEO Master
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            5 headlines · meta options · Yoast checklist · long-tail keywords
          </p>
        </div>
      </div>

      <SiloPicker value={silo} onChange={setSilo} />

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={() => setUseCorpus((value) => !value)}
          disabled={mutation.isPending}
          type="button"
          data-testid="seomaster-corpus-toggle"
          className="text-[11px] font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50"
          style={{
            background: useCorpus ? "#10B981" : "transparent",
            color: useCorpus ? "#fff" : "hsl(var(--muted-foreground))",
            borderColor: useCorpus ? "#10B981" : "hsl(var(--border))",
          }}
          title="Ground SEO output on your ingested Haven corpus (zero-paid)"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Corpus {useCorpus ? "ON" : "OFF"}
        </button>
      </div>

      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={`Topic, angle, or article draft for ${v.name}...`}
        disabled={mutation.isPending}
        className="min-h-[110px] resize-none bg-secondary/40 border-border text-sm mt-2"
        data-testid="seomaster-prompt"
      />

      {safeMode && (
        <p
          data-testid="seomaster-safe-mode-note"
          className="mt-3 text-[11px] text-amber-300"
        >
          Safe Mode is on — AI calls disabled.
        </p>
      )}

      <Button
        onClick={handleRun}
        disabled={mutation.isPending || !prompt.trim() || safeMode}
        className="mt-3 h-10 font-bold rounded-full"
        style={{ background: "#10B981", color: "#fff" }}
        data-testid="seomaster-run"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Optimizing...
          </>
        ) : (
          <>
            <Search className="w-4 h-4 mr-2" />
            Run SEO Master
          </>
        )}
      </Button>

      {output && (
        <div className="rounded-md border border-border/40 bg-secondary/40 mt-4">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              SEO Master output · {v.name}
            </span>
            <button
              onClick={handleCopy}
              className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-foreground/5"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
          <pre className="px-3 py-2 text-[12px] leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans">
            {output}
          </pre>
        </div>
      )}

      {grounding && (
        <CorpusCitations
          usedCorpus={grounding.usedCorpus}
          note={grounding.note}
          citations={grounding.citations}
          testIdPrefix="seomaster-corpus"
        />
      )}
    </div>
  );
}
