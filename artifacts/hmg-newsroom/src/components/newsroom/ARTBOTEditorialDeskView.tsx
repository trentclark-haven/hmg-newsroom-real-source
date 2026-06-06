import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { verticals } from "@/lib/mock-data";
import {
  generateHeadlineVariants,
  runSourceChecklist,
  runGossipCheck,
  suggestArticleStructure,
  generateSEOMeta,
  generateWPExcerpt,
  generateSocialCaptions,
  getARTBOTMemoryReadiness,
  type HeadlineVariant,
  type SourceCheckResult,
  type GossipCheckResult,
  type ArticleStructureSuggestion,
  type SEOMetaStarter,
  type WPExcerptResult,
  type SocialCaptionStarter,
  type ARTBOTMemoryReadiness,
} from "@/lib/artbotDeterministicEngine";

function readMemoryItems(): { type: string }[] {
  try {
    const raw = window.localStorage.getItem("hmg-founder-knowledge-base-v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: { type: string }[] };
    return Array.isArray(parsed?.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function copy(text: string, label: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error("Copy failed"));
}

interface ResultState {
  headlines: HeadlineVariant[];
  sourceCheck: SourceCheckResult;
  gossipCheck: GossipCheckResult;
  structure: ArticleStructureSuggestion;
  seo: SEOMetaStarter;
  excerpt: WPExcerptResult;
  captions: SocialCaptionStarter[];
}

function Section({
  title,
  icon: Icon,
  color,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: typeof Brain;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}22`, color }}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="flex-1 text-[13px] font-black uppercase tracking-wide">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-border/30">{children}</div>}
    </div>
  );
}

const SEO_SCORE_STYLE: Record<string, string> = {
  strong: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  ok: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  weak: "text-rose-400 border-rose-500/30 bg-rose-500/10",
};

const PLATFORM_LABEL: Record<string, string> = {
  x: "X (Twitter)",
  instagram: "Instagram",
  tiktok: "TikTok",
};

function MemoryStatusBar({ readiness }: { readiness: ARTBOTMemoryReadiness }) {
  const statusStyle =
    readiness.localStatus === "strong"
      ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300/80"
      : readiness.localStatus === "building"
        ? "border-sky-500/30 bg-sky-500/[0.06] text-sky-300/80"
        : readiness.localStatus === "minimal"
          ? "border-amber-500/30 bg-amber-500/[0.06] text-amber-300/80"
          : "border-border/40 bg-card/30 text-muted-foreground";

  const statusLabel =
    readiness.localStatus === "strong"
      ? "Memory Strong — ARTBOT fully fueled"
      : readiness.localStatus === "building"
        ? "Memory Building — add more items for stronger suggestions"
        : readiness.localStatus === "minimal"
          ? "Memory Minimal — outputs are generic without more memory items"
          : "Memory Empty — load Founder Knowledge Base to fuel ARTBOT";

  return (
    <div className={`rounded-xl border px-4 py-3 ${statusStyle}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-[12px] font-bold">{statusLabel}</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
          {readiness.totalItems} items
        </span>
      </div>
      {readiness.recommendations.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {readiness.recommendations.slice(0, 3).map((r) => (
            <li key={r} className="text-[11px] opacity-80 flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">→</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ARTBOTEditorialDeskView() {
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [brand, setBrand] = useState(verticals[0].id);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ResultState | null>(null);

  const brandName = useMemo(() => verticals.find((v) => v.id === brand)?.name ?? brand, [brand]);

  const memoryItems = useMemo(() => readMemoryItems(), []);
  const memoryReadiness = useMemo(() => getARTBOTMemoryReadiness(memoryItems), [memoryItems]);

  function runAnalysis() {
    if (!topic.trim()) {
      toast.error("Add a topic or headline to run ARTBOT analysis.");
      return;
    }
    setRunning(true);
    setTimeout(() => {
      const headlines = generateHeadlineVariants(topic, brandName);
      const sourceCheck = runSourceChecklist(draft || topic);
      const gossipCheck = runGossipCheck(draft || topic);
      const structure = suggestArticleStructure(topic);
      const seo = generateSEOMeta(headlines[0]?.headline ?? topic, brandName);
      const excerpt = generateWPExcerpt(draft || topic);
      const captions = generateSocialCaptions(headlines[0]?.headline ?? topic, brandName);
      setResults({ headlines, sourceCheck, gossipCheck, structure, seo, excerpt, captions });
      setRunning(false);
      toast.success("ARTBOT analysis complete");
    }, 300);
  }

  function reset() {
    setResults(null);
    setTopic("");
    setDraft("");
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 lg:px-8 py-5 gap-5">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">ARTBOT Editorial</h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              Article ideas · Headline variants · Draft review · Content structure
            </p>
          </div>
        </div>
      </div>

      {/* Honest notice */}
      <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.06] px-4 py-3 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-sky-200/80 leading-relaxed">
          <strong className="text-sky-300">ARTBOT does not browse, generate, or claim facts.</strong> All outputs are deterministic suggestions based on your inputs and local memory. ARTBOT helps you think — you verify, write, and publish.
        </p>
      </div>

      {/* Memory status */}
      <MemoryStatusBar readiness={memoryReadiness} />

      {/* Input form */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4 flex flex-col gap-4">
        <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Input</div>

        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-foreground/80">Topic or headline *</label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. New sports arena coming to Atlanta — impact on local scene"
            className="text-sm"
            maxLength={300}
          />
          <p className="text-[10px] text-muted-foreground">{topic.length}/300 · What's the story?</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-foreground/80">Draft body or notes (optional)</label>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste your draft or rough notes here — ARTBOT will check it for gossip language, source flags, and excerpt quality."
            rows={5}
            className="text-sm resize-none"
            maxLength={5000}
          />
          <p className="text-[10px] text-muted-foreground">{draft.length}/5000 · Used for source check, gossip check, and WP excerpt</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-foreground/80">Brand / Vertical</label>
          <div className="flex flex-wrap gap-1.5">
            {verticals.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setBrand(v.id)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${
                  brand === v.id
                    ? "bg-foreground text-background border-transparent"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button
            onClick={runAnalysis}
            disabled={running || !topic.trim()}
            className="flex items-center gap-2 flex-1 sm:flex-none"
          >
            {running ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {running ? "Running ARTBOT…" : "Run ARTBOT Analysis"}
          </Button>
          {results && (
            <button
              type="button"
              onClick={reset}
              className="text-[12px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/40" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-400 px-2">ARTBOT Results</span>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          {/* Headline Variants */}
          <Section title="Headline Variants" icon={FileText} color="#38BDF8">
            <div className="flex flex-col gap-2 mt-2">
              {results.headlines.map((h) => (
                <div key={h.style} className="flex items-start gap-2 rounded-lg border border-border/40 bg-card/30 p-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold leading-snug">{h.headline}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{h.style}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${SEO_SCORE_STYLE[h.seoScore]}`}>
                        SEO: {h.seoScore}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(h.headline, "Headline")}
                    className="shrink-0 p-1.5 rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ClipboardCopy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* Source Checklist */}
          <Section
            title={results.sourceCheck.passed ? "Source Check — Passed" : "Source Check — Issues Found"}
            icon={results.sourceCheck.passed ? CheckCircle2 : AlertTriangle}
            color={results.sourceCheck.passed ? "#4ADE80" : "#F59E0B"}
          >
            <div className="mt-2 space-y-2">
              {results.sourceCheck.flags.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-1.5">Source flags</p>
                  {results.sourceCheck.flags.map((f) => (
                    <p key={f} className="text-[12px] text-amber-200/80 flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />{f}</p>
                  ))}
                </div>
              )}
              {results.sourceCheck.recommendations.map((r) => (
                <p key={r} className="text-[12px] text-muted-foreground flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0 text-emerald-400" />
                  {r}
                </p>
              ))}
            </div>
          </Section>

          {/* Gossip Check */}
          <Section
            title={results.gossipCheck.passed ? "Gossip Check — Clean" : "Gossip Check — Review Needed"}
            icon={results.gossipCheck.passed ? BadgeCheck : ShieldAlert}
            color={results.gossipCheck.passed ? "#4ADE80" : "#EF4444"}
          >
            <div className="mt-2 space-y-2">
              {results.gossipCheck.flaggedPhrases.length > 0 && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/[0.06] p-3">
                  <p className="text-[11px] font-black uppercase tracking-wider text-rose-400 mb-1.5">Flagged language</p>
                  <div className="flex flex-wrap gap-1.5">
                    {results.gossipCheck.flaggedPhrases.map((p) => (
                      <span key={p} className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {results.gossipCheck.suggestions.map((s) => (
                <p key={s} className="text-[12px] text-muted-foreground flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">→</span>
                  {s}
                </p>
              ))}
            </div>
          </Section>

          {/* Article Structure */}
          <Section title="Article Structure" icon={BookOpen} color="#A855F7" defaultOpen={false}>
            <div className="mt-2 space-y-2 text-[12.5px]">
              <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">HED</span>
                <p className="mt-0.5 text-foreground/80">{results.structure.hed}</p>
              </div>
              <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">DEK</span>
                <p className="mt-0.5 text-foreground/80">{results.structure.dek}</p>
              </div>
              <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">LEDE</span>
                <p className="mt-0.5 text-foreground/80">{results.structure.lede}</p>
              </div>
              <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">BODY</span>
                <ul className="mt-1 space-y-1">
                  {results.structure.bodyStructure.map((b, i) => (
                    <li key={i} className="text-foreground/70 flex gap-1.5"><span className="text-muted-foreground/50">{i + 1}.</span>{b}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">KICKER</span>
                <p className="mt-0.5 text-foreground/80">{results.structure.kicker}</p>
              </div>
            </div>
          </Section>

          {/* SEO Starter */}
          <Section title="SEO Starter" icon={Search} color="#10B981" defaultOpen={false}>
            <div className="mt-2 space-y-2">
              {[
                { label: "Title Tag", value: results.seo.titleTag },
                { label: "Meta Description", value: results.seo.metaDescription },
                { label: "Focus Keyword", value: results.seo.focusKeyword },
                { label: "Secondary Keywords", value: results.seo.secondaryKeywords.join(", ") },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-2 rounded-lg border border-border/40 bg-card/30 p-2.5">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</span>
                    <p className="text-[12.5px] mt-0.5">{value}</p>
                  </div>
                  <button type="button" onClick={() => copy(value, label)} className="shrink-0 p-1.5 rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
                    <ClipboardCopy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground italic">{results.seo.readabilityNote}</p>
            </div>
          </Section>

          {/* WP Excerpt */}
          <Section title="WordPress Prep Notes" icon={Zap} color="#F59E0B" defaultOpen={false}>
            <div className="mt-2 space-y-3">
              <div className="rounded-lg border border-border/40 bg-card/30 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Excerpt ({results.excerpt.charCount}/155 chars)</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${results.excerpt.withinLimit ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-amber-500/30 text-amber-400 bg-amber-500/10"}`}>
                    {results.excerpt.withinLimit ? "Within limit" : "Over limit"}
                  </span>
                </div>
                <p className="text-[12.5px] text-foreground/80">{results.excerpt.excerpt}</p>
                <button type="button" onClick={() => copy(results.excerpt.excerpt, "Excerpt")} className="mt-2 text-[11px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
                  <ClipboardCopy className="w-3 h-3" />Copy excerpt
                </button>
              </div>
              <div className="rounded-lg border border-border/40 bg-card/30 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">What to verify before WP publish</p>
                {[
                  "Headline is factual and verified — not speculative",
                  "Every claim in the body has a named or attributed source",
                  "Featured image has proper rights/credit",
                  "SEO title tag is under 60 characters",
                  "Meta description is under 155 characters",
                  "Slug is URL-safe and keyword-rich",
                  "Categories and tags are set correctly",
                ].map((item) => (
                  <p key={item} className="text-[12px] text-muted-foreground flex items-start gap-1.5 mb-1">
                    <span className="shrink-0 mt-0.5">○</span>{item}
                  </p>
                ))}
              </div>
            </div>
          </Section>

          {/* Social Captions */}
          <Section title="Caption Starter" icon={ClipboardCopy} color="#EC4899" defaultOpen={false}>
            <div className="mt-2 space-y-2">
              {results.captions.map((c) => (
                <div key={c.platform} className="rounded-lg border border-border/40 bg-card/30 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider">{PLATFORM_LABEL[c.platform]}</span>
                    <span className="text-[10px] text-muted-foreground">{c.charCount} chars</span>
                  </div>
                  <p className="text-[12.5px] whitespace-pre-wrap text-foreground/80">{c.caption}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex flex-wrap gap-1 flex-1">
                      {c.hashtags.map((h) => (
                        <span key={h} className="text-[10px] text-sky-400 font-mono">{h}</span>
                      ))}
                    </div>
                    <button type="button" onClick={() => copy(c.caption, `${PLATFORM_LABEL[c.platform]} caption`)} className="shrink-0 p-1.5 rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
                      <ClipboardCopy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-[11px] text-muted-foreground/50 py-2">
        ARTBOT Editorial · Local-only · No fake providers · HMG Newsroom
      </div>
    </div>
  );
}
