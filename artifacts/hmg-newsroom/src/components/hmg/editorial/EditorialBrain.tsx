import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, TriangleAlert as AlertTriangle, Megaphone, PenTool, Sparkles, ChevronRight, Check, Lock, StickyNote, Compass, Database, WandSparkles, Share2, Send, ShieldCheck, Save, RotateCcw, ArrowRight, ChevronDown, BookOpen, OctagonAlert as AlertOctagon, FileSearch, Hash, Palette, Scissors, Globe as GlobeIcon, Eye } from "lucide-react";
import { getPlaybook, getAngleGuidance, type AngleType } from "@/lib/hmg/editorial/editorialPlaybooks";
import { verticals } from "@/lib/mock-data";
import { getBrandVoiceProfile } from "@/lib/hmg/brandVoiceProfiles";
import { useDraft } from "@/lib/useDraft";
import {
  RESEARCH_SECTIONS,
  computeArticleStrength,
  factsAsNotesText,
  generateBreakingStory,
  generateEditorialArticle,
  generateSocialPosts,
  listSavedFacts,
  parseResearchNotes,
  type ArticleRole,
  type ArticleStrength,
  type ArticleTone,
  type ArticleType,
  type BreakingStoryPackage,
  type EditorialArticlePackage,
  type ResearchSection,
  type SocialPostsPackage,
} from "@/lib/hmg/editorial";
import { ResearchIntake } from "./ResearchIntake";
import { ArticlePackageCard } from "./ArticlePackageCard";
import { BreakingStoryCard } from "./BreakingStoryCard";
import { SocialPostsCard } from "./SocialPostsCard";
import { SavedFactsPanel } from "./SavedFactsPanel";
import { FounderVoiceGate } from "./FounderVoiceGate";
import { CopyButton } from "@/components/hmg/CopyButton";
import {
  chooseBlueprint,
  formatArticleQualityReceipt,
  formatBrandVoicePacket,
  formatFounderVoicePacket,
  generateSeoPacket,
  getBrandVoiceProfile as getIntelligenceBrandVoiceProfile,
  scoreArticleDraft,
  type BrandVoiceProfile as IntelligenceBrandVoiceProfile,
  type QualityScoreResult,
  type SeoPacket,
} from "@/lib/hmg/intelligence";

export type EditorialMode = "article" | "breaking" | "social";

interface EditorialBrainProps {
  brandId: string;
  modes?: EditorialMode[];
  defaultMode?: EditorialMode;
  title?: string;
  className?: string;
  liveWebOn?: boolean;
  corpusReady?: boolean;
}

const MODE_LABELS: Record<EditorialMode, { tab: string; build: string; icon: React.ComponentType<{ className?: string }> }> = {
  article: { tab: "Article Draft", build: "Generate Draft", icon: FileText },
  breaking: { tab: "Breaking Story", build: "Generate Breaking Story", icon: AlertTriangle },
  social: { tab: "Social Posts", build: "Generate Social Posts", icon: Megaphone },
};

const ARTICLE_TYPE_OPTIONS: { id: ArticleType; label: string }[] = [
  { id: "news", label: "News" },
  { id: "feature", label: "Feature" },
  { id: "review", label: "Review" },
  { id: "analysis", label: "Analysis" },
  { id: "explainer", label: "Explainer" },
  { id: "interview-recap", label: "Interview Recap" },
  { id: "list", label: "List" },
  { id: "opinion", label: "Opinion" },
];

const TONE_OPTIONS: { id: ArticleTone; label: string }[] = [
  { id: "neutral", label: "Neutral" },
  { id: "sharp", label: "Sharp" },
  { id: "celebratory", label: "Celebratory" },
  { id: "critical", label: "Critical" },
  { id: "investigative", label: "Investigative" },
  { id: "explanatory", label: "Explanatory" },
];

const ROLE_OPTIONS: { id: ArticleRole; label: string }[] = [
  { id: "managing-editor", label: "Managing Editor" },
  { id: "staff-writer", label: "Staff Writer" },
  { id: "senior-critic", label: "Senior Critic" },
  { id: "beat-reporter", label: "Beat Reporter" },
  { id: "columnist", label: "Columnist" },
];

const ARTICLE_TYPE_GUIDANCE: Record<ArticleType, string> = {
  news: "Who, what, when, where, why. Lead with the fact. One source minimum.",
  feature: "Find the human angle. Why does this matter now? Context and color.",
  review: "Clear verdict, specific evidence, fair criticism. No vague thumbs-up.",
  analysis: "Break down what it means, not just what happened. Show your work.",
  explainer: "Make the complex simple. If a new reader can't follow, rewrite.",
  "interview-recap": "Capture the voice. Best quotes first. Context around each answer.",
  list: "Each entry must earn its spot. Rank with reason, not just number.",
  opinion: "Strong stance, supported by evidence. No hedging — own the take.",
};

const EDITORIAL_DNA: Record<string, { what: string; great: string; caution: string }> = {
  hiphophaven: {
    what: "Elite hip-hop editorial judgment with historical depth.",
    great: "Great means: cultural context that earned its place, references that show real listening, and credibility that holds up to scrutiny.",
    caution: "Avoid: surface-level takes, recycled narratives, performative slang.",
  },
  raphaven: {
    what: "Sharp rap coverage with rankings, debates, and release urgency.",
    great: "Great means: clean arguments, real listening evidence, and the confidence to rank without fear.",
    caution: "Avoid: vague praise, listless recaps, fence-sitting on debates.",
  },
  musichaven: {
    what: "Broad music-programming instincts with rollout intelligence.",
    great: "Great means: spotting the rollout story, feeling the video-era energy, and finding artists before the crowd.",
    caution: "Avoid: genre tunnel vision, missing the visual rollout, late discovery.",
  },
  cannahaven: {
    what: "Cannabis culture literacy with strain, legal, and safety discipline.",
    great: "Great means: accurate strain info, legal context, safety-first language, and sources that hold up.",
    caution: "Avoid: unverified health claims, legal vagueness, uncredited sources.",
  },
  fithaven: {
    what: "Motivational fitness energy with wellness clarity and training sense.",
    great: "Great means: training that's safe and real, nutrition that's grounded, and motivation that doesn't condescend.",
    caution: "Avoid: unverified fitness claims, shame-based motivation, vague advice.",
  },
  sportshaven: {
    what: "Sports urgency with clean storytelling and what-matters-now clarity.",
    great: "Great means: the highlight leads, the context follows, and the reader knows what matters right now.",
    caution: "Avoid: stale angles, buried ledes, stat dumps without story.",
  },
  hmg: {
    what: "Fast entertainment-news instincts with source discipline and legal caution.",
    great: "Great means: fast but accurate, sourced but not gossip, clear about what's confirmed and what's not.",
    caution: "Avoid: unverified rumors, gossip slop, reckless legal exposure.",
  },
};

const SOURCE_DISCIPLINE_FIELDS = [
  { id: "confirmed", label: "What is confirmed?", placeholder: "Facts you can stand behind — verified, sourced, no hedging needed." },
  { id: "needs-verification", label: "What still needs verification?", placeholder: "Claims you're not sure about yet. Flag them so they don't slip into the draft." },
  { id: "safest-wording", label: "What is the safest wording?", placeholder: "If a claim is sensitive, how should it be phrased to avoid legal or credibility risk?" },
  { id: "source-attribution", label: "Who or what is the source?", placeholder: "Name the source. If anonymous, explain why. No unnamed 'insiders' without context." },
  { id: "rights-credit", label: "Rights / credit note", placeholder: "Photo credit, quote permission, copyright note. Don't skip this." },
];

type FlowStep = 1 | 2 | 3 | 4 | 5 | 6;

const STEPS: { id: FlowStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 1, label: "Notes", icon: StickyNote },
  { id: 2, label: "Angle", icon: Compass },
  { id: 3, label: "Sources", icon: Database },
  { id: 4, label: "Draft", icon: WandSparkles },
  { id: 5, label: "Package", icon: Share2 },
  { id: 6, label: "Publish", icon: Send },
];

function freshSections(): ResearchSection[] {
  return RESEARCH_SECTIONS.map((s) => ({ ...s, text: "" }));
}

type RailState = "empty" | "pending" | "ready" | "passed" | "weak" | "fair" | "strong" | "none";

function railColor(state: RailState): string {
  switch (state) {
    case "ready":
    case "passed":
    case "strong":
      return "#22C55E";
    case "fair":
      return "#F59E0B";
    case "weak":
    case "pending":
    case "empty":
    case "none":
      return "#94A3B8";
    default:
      return "#94A3B8";
  }
}

function ReadinessRail({
  draftState,
  sourceVerification,
  founderVoice,
  visualReadiness,
  clipReadiness,
  socialReadiness,
  wordpressReadiness,
  accent,
}: {
  draftState: RailState;
  sourceVerification: RailState;
  founderVoice: RailState;
  visualReadiness: RailState;
  clipReadiness: RailState;
  socialReadiness: RailState;
  wordpressReadiness: RailState;
  accent: string;
}) {
  const items = [
    { label: "Draft", state: draftState },
    { label: "Sources", state: sourceVerification },
    { label: "Voice", state: founderVoice },
    { label: "Visual", state: visualReadiness },
    { label: "Clip", state: clipReadiness },
    { label: "Social", state: socialReadiness },
    { label: "WP", state: wordpressReadiness },
  ];
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto pb-1 rounded-xl border border-border/30 bg-card/20 px-3 py-2"
      data-testid="readiness-rail"
      aria-label="Editorial readiness rail"
    >
      <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/50 shrink-0 mr-1">
        Ready
      </span>
      {items.map((item) => {
        const color = railColor(item.state);
        return (
          <span
            key={item.label}
            className="inline-flex items-center gap-1 shrink-0"
            title={`${item.label}: ${item.state}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: color }}
            />
            <span
              className="text-[10px] font-bold"
              style={{ color: item.state === "ready" || item.state === "passed" || item.state === "strong" ? color : "rgb(148 163 184 / 0.7)" }}
            >
              {item.label}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function HmgStandardPanel({
  brandId,
  brandName,
  accent,
  mode,
  articleType,
  strength,
  hasOutput,
  voiceGatePassed,
}: {
  brandId: string;
  brandName: string;
  accent: string;
  mode: string;
  articleType: ArticleType;
  strength: ArticleStrength | null;
  hasOutput: boolean;
  voiceGatePassed: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const playbook = useMemo(() => getPlaybook(brandId), [brandId]);
  const angleKey = useMemo<AngleType>(() => {
    if (mode === "breaking") return "breaking";
    if (mode === "social") return "article";
    const map: Partial<Record<ArticleType, AngleType>> = {
      news: "breaking",
      feature: "article",
      review: "review",
      analysis: "opinion",
      explainer: "explainer",
      "interview-recap": "interview",
      list: "ranking",
      opinion: "opinion",
    };
    return map[articleType] ?? "article";
  }, [mode, articleType]);
  const angle = useMemo(() => getAngleGuidance(angleKey), [angleKey]);

  const publishReady = strength?.band === "strong" && hasOutput && voiceGatePassed;
  const publishWarning = strength?.band === "weak" && hasOutput;
  const needsVerification = strength?.signals.some((s) => s.band === "weak") ?? false;

  return (
    <div
      className="rounded-xl border border-border/30 bg-card/30 overflow-hidden"
      data-testid="hmg-standard-panel"
    >
      {/* Header — collapsible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="hmg-standard-body"
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-foreground/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: accent }}>
            HMG Standard — {brandName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {publishReady && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              Ready
            </span>
          )}
          {publishWarning && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
              Blocked
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expanded ? "" : "-rotate-90"}`}
          />
        </div>
      </button>

      {expanded && (
        <div id="hmg-standard-body" className="px-3 pb-3 space-y-2.5">
          {/* Mission */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 mb-0.5">Mission</p>
            <p className="text-[11px] text-foreground/80 leading-snug">{playbook.editorialMission}</p>
          </div>

          {/* What great looks like */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 mb-0.5">What Great Looks Like</p>
            <p className="text-[11px] text-foreground/80 leading-snug">{playbook.whatGreatLooksLike}</p>
          </div>

          {/* Angle guidance */}
          <div className="rounded-lg bg-foreground/[0.03] border border-border/20 p-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 mb-1 flex items-center gap-1">
              <Compass className="w-3 h-3" /> Angle: {angleKey.replace("-", " ")}
            </p>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground leading-snug">
                <span className="font-bold text-foreground/70">Best for:</span> {angle.bestUseCase}
              </p>
              <p className="text-[10px] text-muted-foreground leading-snug">
                <span className="font-bold text-foreground/70">Source level:</span>{" "}
                <span className={angle.requiredSourceLevel === "confirmed" ? "text-emerald-600 dark:text-emerald-400" : angle.requiredSourceLevel === "unconfirmed" ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}>
                  {angle.requiredSourceLevel}
                </span>
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-snug flex items-start gap-1">
                <AlertOctagon className="w-3 h-3 mt-0.5 shrink-0" /> {angle.headlineWarning}
              </p>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 leading-snug">
                <span className="font-bold">Avoid:</span> {angle.whatToAvoid}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 leading-snug">
                <span className="font-bold">Unlocks publish:</span> {angle.whatUnlocksPublish}
              </p>
            </div>
          </div>

          {/* Source standard */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 mb-0.5 flex items-center gap-1">
              <FileSearch className="w-3 h-3" /> Source Standard
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">{playbook.sourceDiscipline}</p>
          </div>

          {/* Headline standard */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 mb-0.5 flex items-center gap-1">
              <PenTool className="w-3 h-3" /> Headline Standard
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">{playbook.headlineStyle}</p>
          </div>

          {/* Social handoff standard */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 mb-0.5 flex items-center gap-1">
              <Megaphone className="w-3 h-3" /> Social Handoff
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">{playbook.socialTone}</p>
          </div>

          {/* Visual handoff standard */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 mb-0.5 flex items-center gap-1">
                <Palette className="w-3 h-3" /> WebArt
              </p>
              <p className="text-[10px] text-muted-foreground leading-snug">{playbook.webArtGuidance}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 mb-0.5 flex items-center gap-1">
                <Scissors className="w-3 h-3" /> WebEdit
              </p>
              <p className="text-[10px] text-muted-foreground leading-snug">{playbook.webEditGuidance}</p>
            </div>
          </div>

          {/* Founder review triggers */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 mb-0.5 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Founder Review Triggers
            </p>
            <ul className="space-y-0.5">
              {playbook.founderReviewTriggers.map((trigger, i) => (
                <li key={i} className="text-[10px] text-muted-foreground leading-snug flex items-start gap-1">
                  <span className="text-amber-500 mt-0.5">•</span> {trigger}
                </li>
              ))}
            </ul>
          </div>

          {/* Publish-readiness warning */}
          {hasOutput && (
            <div
              className="rounded-lg border p-2 text-center"
              style={{
                borderColor: publishReady ? "rgb(16 185 129 / 0.3)" : publishWarning ? "rgb(244 63 94 / 0.3)" : "rgb(245 158 11 / 0.3)",
                background: publishReady ? "rgb(16 185 129 / 0.05)" : publishWarning ? "rgb(244 63 94 / 0.05)" : "rgb(245 158 11 / 0.05)",
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{
                  color: publishReady ? "rgb(16 185 129)" : publishWarning ? "rgb(244 63 94)" : "rgb(245 158 11)",
                }}
              >
                {publishReady
                  ? "Ready for WordPress Draft"
                  : publishWarning
                    ? "Needs More Verification"
                    : needsVerification
                      ? "Needs Source / Credit"
                      : "Social Package Not Ready"}
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug">
                {publishReady
                  ? "All quality checks passed. Export unlocked."
                  : publishWarning
                    ? "Source coverage is too thin. Add verified facts before exporting."
                    : "Resolve weak signals above before attempting export."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function EditorialBrain({
  brandId,
  modes = ["article", "breaking", "social"],
  defaultMode,
  title = "Editorial Desk",
  className = "",
  liveWebOn = false,
  corpusReady = false,
}: EditorialBrainProps) {
  const available = modes.length > 0 ? modes : (["article"] as EditorialMode[]);
  const [mode, setMode] = useState<EditorialMode>(
    defaultMode && available.includes(defaultMode) ? defaultMode : available[0],
  );
  const [sections, setSections] = useState<ResearchSection[]>(freshSections);
  const [articleType, setArticleType] = useState<ArticleType>("feature");
  const [tone, setTone] = useState<ArticleTone>("neutral");
  const [role, setRole] = useState<ArticleRole>("managing-editor");
  const [selectedFactIds, setSelectedFactIds] = useState<string[]>([]);
  const [articlePkg, setArticlePkg] = useState<EditorialArticlePackage | null>(null);
  const [strength, setStrength] = useState<ArticleStrength | null>(null);
  const [breakingPkg, setBreakingPkg] = useState<BreakingStoryPackage | null>(null);
  const [socialPkg, setSocialPkg] = useState<SocialPostsPackage | null>(null);
  const [voiceGatePassed, setVoiceGatePassed] = useState(false);
  const [activeStep, setActiveStep] = useState<FlowStep>(1);
  const [savedDraftTs, setSavedDraftTs] = useState<string | null>(null);

  const draftKey = `hmg-editorial-draft-${brandId}-${mode}`;
  const [draftState, setDraftState, clearDraft] = useDraft<{
    sections: ResearchSection[];
    articleType: ArticleType;
    tone: ArticleTone;
    role: ArticleRole;
    selectedFactIds: string[];
    activeStep: FlowStep;
  }>(draftKey, {
    sections: freshSections(),
    articleType: "feature",
    tone: "neutral",
    role: "managing-editor",
    selectedFactIds: [],
    activeStep: 1,
  });

  const hasSavedDraft = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(`hmg-newsroom-draft::${draftKey}`) !== null;
    } catch {
      return false;
    }
  }, [draftKey, savedDraftTs]);

  useEffect(() => {
    setSavedDraftTs(null);
  }, [brandId, mode]);

  const brand = verticals.find((v) => v.id === brandId);
  const profile = getBrandVoiceProfile(brandId);
  const intelligenceProfile = useMemo(
    () => getIntelligenceBrandVoiceProfile(brandId),
    [brandId],
  );
  const accent = brand?.color ?? "#0EA5E9";
  const onAccent = brand?.onAccent ?? "#ffffff";

  const filledCount = sections.filter((s) => s.text.trim().length > 0).length;

  const toggleFact = (id: string) =>
    setSelectedFactIds((prev) =>
      prev.includes(id) ? prev.filter((x2) => x2 !== id) : [...prev, id],
    );

  const handleSaveDraft = () => {
    setDraftState({
      sections,
      articleType,
      tone,
      role,
      selectedFactIds,
      activeStep,
    });
    setSavedDraftTs(new Date().toLocaleTimeString());
  };

  const handleRecoverDraft = () => {
    setSections(draftState.sections);
    setArticleType(draftState.articleType);
    setTone(draftState.tone);
    setRole(draftState.role);
    setSelectedFactIds(draftState.selectedFactIds);
    setActiveStep(draftState.activeStep);
  };

  const handleClearDraft = () => {
    clearDraft();
    setSavedDraftTs(null);
    setSections(freshSections());
    setArticleType("feature");
    setTone("neutral");
    setRole("managing-editor");
    setSelectedFactIds([]);
    setActiveStep(1);
  };

  const buildNotes = () => {
    const allFacts = listSavedFacts(brandId);
    const usedFacts = allFacts.filter((f) => selectedFactIds.includes(f.id));
    const factsText = usedFacts.length ? factsAsNotesText(usedFacts) : "";

    const merged = sections.map((s) => {
      if (s.id === "evergreenFacts" && factsText) {
        const existing = s.text.trim();
        return {
          ...s,
          text: existing ? `${existing}\n${factsText}` : factsText,
        };
      }
      return s;
    });
    return parseResearchNotes(merged);
  };

  const handleBuildArticle = () => {
    const notes = buildNotes();
    const pkg = generateEditorialArticle({
      brand: brandId,
      articleType,
      tone,
      role,
      notes,
    });
    setArticlePkg(pkg);
    setStrength(computeArticleStrength(notes));
    setBreakingPkg(null);
    setSocialPkg(null);
    setVoiceGatePassed(false);
    setActiveStep(4);
  };

  const handleBuildBreaking = () => {
    const notes = buildNotes();
    const pkg = generateBreakingStory(brandId, notes);
    setBreakingPkg(pkg);
    setArticlePkg(null);
    setStrength(null);
    setSocialPkg(null);
    setVoiceGatePassed(false);
    setActiveStep(4);
  };

  const handleBuildSocial = () => {
    const notes = buildNotes();
    const pkg = generateSocialPosts(brandId, notes);
    setSocialPkg(pkg);
    setArticlePkg(null);
    setStrength(null);
    setBreakingPkg(null);
    setVoiceGatePassed(false);
    setActiveStep(5);
  };

  const handleBuild = () => {
    if (filledCount === 0) return;
    if (mode === "article") handleBuildArticle();
    else if (mode === "breaking") handleBuildBreaking();
    else handleBuildSocial();
  };

  const handleGenerateSocialFromArticle = () => {
    if (!articlePkg) return;
    const notes = buildNotes();
    const pkg = generateSocialPosts(brandId, notes);
    setSocialPkg(pkg);
    setActiveStep(5);
  };

  const handleVoiceGatePass = () => {
    setVoiceGatePassed(true);
    setActiveStep(6);
  };

  const hasOutput = Boolean(articlePkg || breakingPkg || socialPkg);
  const buildLabel = MODE_LABELS[mode].build;
  const ModeIcon = MODE_LABELS[mode].icon;

  const stepUnlocked = (step: FlowStep): boolean => {
    if (step === 1) return true;
    if (step === 2) return filledCount > 0;
    if (step === 3) return filledCount > 0;
    if (step === 4) return filledCount > 0;
    if (step === 5) return hasOutput;
    if (step === 6) return hasOutput && voiceGatePassed;
    return false;
  };

  const stepBlockReason = (step: FlowStep): string | null => {
    if (step === 2 && filledCount === 0) return "Paste at least one research note to pick your angle.";
    if (step === 3 && filledCount === 0) return "Drop notes first, then attach saved facts.";
    if (step === 4 && filledCount === 0) return "Paste research notes above to unlock generation.";
    if (step === 5 && !hasOutput) return "Generate a draft first to build a social pack.";
    if (step === 6 && !hasOutput) return "Generate a draft first to unlock export.";
    if (step === 6 && !voiceGatePassed) return "Pass the Founder Voice Quality Gate to unlock export.";
    return null;
  };

  return (
    <div
      className={`rounded-2xl border bg-card/40 p-4 space-y-4 ${className}`}
      style={{ borderColor: `${accent}55` }}
      data-testid="editorial-brain"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {brand?.logo ? (
            <img
              src={brand.logo}
              alt={`${profile.name} logo`}
              className="h-10 w-10 rounded-md object-contain bg-background/40 p-1 border border-border/40"
              data-testid="editorial-brain-brand-logo"
            />
          ) : (
            <span
              className="inline-flex items-center justify-center h-10 w-10 rounded-md"
              style={{ background: accent, color: onAccent }}
            >
              <PenTool className="w-5 h-5" />
            </span>
          )}
          <div>
            <h3 className="text-base font-black tracking-tight">{title}</h3>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {profile.name} · {profile.toneLabel} · field-publishing flow
            </p>
          </div>
        </div>
        {/* Mode selector — compact, not equal-weight with flow steps */}
        <div className="flex flex-wrap gap-1" data-testid="editorial-mode-tabs">
          {available.map((m) => {
            const isActive = mode === m;
            const Icon = MODE_LABELS[m].icon;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setArticlePkg(null);
                  setBreakingPkg(null);
                  setSocialPkg(null);
                  setVoiceGatePassed(false);
                  setActiveStep(1);
                }}
                data-testid={`editorial-mode-${m}`}
                className={`h-7 px-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border transition-colors inline-flex items-center gap-1 ${
                  isActive
                    ? "border-transparent"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
                style={isActive ? { background: accent, color: onAccent } : undefined}
              >
                <Icon className="w-3 h-3" />
                {MODE_LABELS[m].tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save / Recover draft bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap" data-testid="editorial-draft-bar">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-[10px] font-bold uppercase tracking-wider rounded-full"
            onClick={handleSaveDraft}
            data-testid="editorial-save-draft"
          >
            <Save className="w-3 h-3 mr-1" />
            Save Draft
          </Button>
          {hasSavedDraft && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[10px] font-bold uppercase tracking-wider rounded-full"
                onClick={handleRecoverDraft}
                data-testid="editorial-recover-draft"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Recover
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] text-muted-foreground hover:text-rose-400"
                onClick={handleClearDraft}
                data-testid="editorial-clear-draft"
              >
                Clear
              </Button>
            </>
          )}
        </div>
        {savedDraftTs && (
          <span className="text-[9px] text-muted-foreground/60">
            Saved at {savedDraftTs}
          </span>
        )}
      </div>

      {/* Post-from-anywhere flow indicator */}
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 overflow-x-auto pb-0.5" data-testid="editorial-flow-path">
        <span>Notes</span>
        <ArrowRight className="w-2.5 h-2.5" />
        <span>Angle</span>
        <ArrowRight className="w-2.5 h-2.5" />
        <span>Sources</span>
        <ArrowRight className="w-2.5 h-2.5" />
        <span>Draft</span>
        <ArrowRight className="w-2.5 h-2.5" />
        <span>Package</span>
        <ArrowRight className="w-2.5 h-2.5" />
        <span>Publish</span>
      </div>

      {/* Step Progress Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1" data-testid="editorial-flow-steps">
        {STEPS.map((s, idx) => {
          const unlocked = stepUnlocked(s.id);
          const isActive = activeStep === s.id;
          const isComplete = s.id < activeStep || (s.id === 4 && hasOutput) || (s.id === 6 && voiceGatePassed);
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => unlocked && setActiveStep(s.id)}
                disabled={!unlocked}
                data-testid={`editorial-step-${s.id}`}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                  isActive
                    ? "text-white"
                    : unlocked
                      ? "text-foreground/80 hover:text-foreground"
                      : "text-muted-foreground/40 cursor-not-allowed"
                }`}
                style={isActive ? { background: accent, color: onAccent } : undefined}
              >
                {isComplete && !isActive ? (
                  <Check className="w-3 h-3" />
                ) : !unlocked ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  <Icon className="w-3 h-3" />
                )}
                <span>{s.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-muted-foreground/30 mx-0.5 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* HMG Standard — premium editorial intelligence panel */}
      <HmgStandardPanel
        brandId={brandId}
        brandName={brand?.name ?? "HMG"}
        accent={accent}
        mode={mode}
        articleType={articleType}
        strength={strength}
        hasOutput={hasOutput}
        voiceGatePassed={voiceGatePassed}
      />

      {/* Readiness Rail — compact, not a dashboard */}
      <ReadinessRail
        draftState={hasOutput ? "ready" : "empty"}
        sourceVerification={strength?.band ?? "none"}
        founderVoice={voiceGatePassed ? "passed" : "pending"}
        visualReadiness={articlePkg ? "ready" : "pending"}
        clipReadiness={articlePkg ? "ready" : "pending"}
        socialReadiness={socialPkg ? "ready" : "pending"}
        wordpressReadiness={voiceGatePassed && articlePkg ? "ready" : "pending"}
        accent={accent}
      />

      {/* Step Content — only render the active step */}
      {activeStep === 1 && (
        <ResearchIntake
          sections={sections}
          onChange={setSections}
          accent={accent}
          onAccent={onAccent}
          liveWebOn={liveWebOn}
          corpusReady={corpusReady}
        />
      )}

      {activeStep === 2 && (
        <div className="space-y-3" data-testid="editorial-angle-step">
          {mode === "article" && (
            <div className="grid gap-2 sm:grid-cols-3" data-testid="editorial-article-options">
              <Selector
                label="Article Type"
                value={articleType}
                options={ARTICLE_TYPE_OPTIONS}
                onChange={(v) => setArticleType(v as ArticleType)}
                accent={accent}
                onAccent={onAccent}
                testId="article-type-select"
              />
              <Selector
                label="Tone"
                value={tone}
                options={TONE_OPTIONS}
                onChange={(v) => setTone(v as ArticleTone)}
                accent={accent}
                onAccent={onAccent}
                testId="article-tone-select"
              />
              <Selector
                label="Role"
                value={role}
                options={ROLE_OPTIONS}
                onChange={(v) => setRole(v as ArticleRole)}
                accent={accent}
                onAccent={onAccent}
                testId="article-role-select"
              />
            </div>
          )}
          {mode !== "article" && (
            <div className="rounded-xl border border-border/40 bg-background/30 p-4 text-center">
              <p className="text-[13px] text-muted-foreground">
                {mode === "breaking"
                  ? "Breaking story mode — no angle config needed. Click Continue to add sources."
                  : "Social posts mode — no angle config needed. Click Continue to add sources."}
              </p>
            </div>
          )}
          <StepNav
            onBack={() => setActiveStep(1)}
            onNext={() => setActiveStep(3)}
            nextLabel="Continue to Sources"
            accent={accent}
            onAccent={onAccent}
          />
        </div>
      )}

      {activeStep === 3 && (
        <div className="space-y-3" data-testid="editorial-sources-step">
          {/* Source discipline fields */}
          <div
            className="rounded-xl border border-border/30 bg-card/30 p-3 space-y-2.5"
            data-testid="editorial-source-discipline"
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Source Discipline
            </p>
            {SOURCE_DISCIPLINE_FIELDS.map((field) => (
              <div key={field.id}>
                <label className="block text-[11px] font-bold text-foreground/80 mb-1">
                  {field.label}
                </label>
                <textarea
                  className="w-full rounded-lg border border-border/40 bg-background/50 px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:border-border transition-colors"
                  rows={2}
                  placeholder={field.placeholder}
                  data-testid={`source-discipline-${field.id}`}
                />
              </div>
            ))}
          </div>
          <SavedFactsPanel
            brand={brandId}
            accent={accent}
            onAccent={onAccent}
            selectedIds={selectedFactIds}
            onToggleSelect={toggleFact}
          />
          <StepNav
            onBack={() => setActiveStep(2)}
            onNext={() => setActiveStep(4)}
            nextLabel="Continue to Generate"
            accent={accent}
            onAccent={onAccent}
          />
        </div>
      )}

      {activeStep === 4 && (
        <div className="space-y-3" data-testid="editorial-generate-step">
          {/* Primary CTA — the only prominent button */}
          <div
            className="rounded-2xl border p-4 text-center space-y-3"
            style={{ borderColor: `${accent}40`, background: `${accent}08` }}
          >
            <div className="flex items-center justify-center gap-2">
              <span style={{ color: accent }} className="inline-flex">
                <ModeIcon className="w-5 h-5" />
              </span>
              <span className="text-sm font-black" style={{ color: accent }}>
                {buildLabel}
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground leading-snug max-w-sm mx-auto">
              {filledCount === 0
                ? "Paste research notes in Step 1 to unlock generation. The desk builds from what you provide — no invented facts."
                : `${filledCount} research section${filledCount === 1 ? "" : "s"} ready · ${selectedFactIds.length} saved fact${selectedFactIds.length === 1 ? "" : "s"} attached`}
            </p>
            <Button
              type="button"
              onClick={handleBuild}
              disabled={filledCount === 0}
              className="h-12 px-8 font-black rounded-full text-[14px]"
              style={
                filledCount > 0
                  ? { background: accent, color: onAccent }
                  : undefined
              }
              data-testid="editorial-build-button"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {buildLabel}
            </Button>
          </div>

          {/* Quality meter — pre-generation readiness assessment */}
          <div
            className="rounded-xl border border-border/30 bg-card/30 p-3"
            data-testid="editorial-quality-meter"
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">
              Quality Meter
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {[
                { label: "Notes Strength", value: Math.min(100, filledCount * 25), hint: filledCount === 0 ? "Add notes in Step 1" : `${filledCount} section${filledCount === 1 ? "" : "s"}` },
                { label: "Source Confidence", value: Math.min(100, selectedFactIds.length * 20), hint: selectedFactIds.length === 0 ? "Attach facts in Step 3" : `${selectedFactIds.length} fact${selectedFactIds.length === 1 ? "" : "s"}` },
                { label: "Brand Voice Fit", value: profile ? 50 : 0, hint: profile ? "Profile loaded" : "No profile" },
                { label: "Publish Readiness", value: hasOutput ? 75 : 0, hint: hasOutput ? "Draft generated" : "Not generated" },
                { label: "Social Readiness", value: socialPkg ? 80 : 0, hint: socialPkg ? "Social pack built" : "Not built" },
              ].map((metric) => (
                <div key={metric.label} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground/70">{metric.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${metric.value}%`,
                          background: metric.value >= 70 ? "rgb(16 185 129)" : metric.value >= 40 ? "rgb(245 158 11)" : "rgb(244 63 94)",
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground/50 w-16 truncate">{metric.hint}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Output — destination panel */}
          {hasOutput && (
            <div className="space-y-3" data-testid="editorial-output-region">
              <div
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: `${accent}12`, borderColor: `${accent}40` }}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: accent }} />
                  <span className="text-[12px] font-black uppercase tracking-wider" style={{ color: accent }}>
                    Article Output
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>

              {articlePkg && (
                <>
                  <ArticleIntelligencePanel
                    pkg={articlePkg}
                    brand={intelligenceProfile}
                  />
                  <ArticlePackageCard pkg={articlePkg} accent={accent} onAccent={onAccent} strength={strength} />
                </>
              )}
              {breakingPkg && (
                <BreakingStoryCard pkg={breakingPkg} accent={accent} onAccent={onAccent} />
              )}
              {socialPkg && (
                <SocialPostsCard pkg={socialPkg} accent={accent} onAccent={onAccent} />
              )}

              {/* Continue to Package — only for article mode */}
              {articlePkg && mode === "article" && (
                <Button
                  type="button"
                  onClick={handleGenerateSocialFromArticle}
                  className="h-10 px-5 font-bold rounded-full w-full"
                  style={{ background: accent, color: onAccent }}
                  data-testid="editorial-continue-social"
                >
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Continue to Package
                </Button>
              )}

              {/* Founder Voice Quality Gate — premium gate before export */}
              {articlePkg && (
                <FounderVoiceGate
                  brandColor={accent}
                  onAccent={onAccent}
                  siloName={profile.name}
                  storageKey={`hmg-voice-gate-${brandId}-${mode}`}
                  onPass={handleVoiceGatePass}
                  passed={voiceGatePassed}
                  qualityScore={strength?.score}
                />
              )}

              {/* Export step unlock */}
              {articlePkg && voiceGatePassed && (
                <Button
                  type="button"
                  onClick={() => setActiveStep(6)}
                  className="h-10 px-5 font-bold rounded-full w-full"
                  style={{ background: accent, color: onAccent }}
                  data-testid="editorial-continue-export"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  Continue to Export
                </Button>
              )}
            </div>
          )}

          {/* If no output yet, show helpful empty state + back nav */}
          {!hasOutput && (
            <div className="space-y-3">
              <div className="rounded-xl border border-dashed border-border/40 bg-background/20 p-4 text-center">
                <WandSparkles className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-[12px] text-muted-foreground leading-snug">
                  Your generated draft will appear here. Click the button above to build it from your notes and facts.
                </p>
              </div>
              <StepNav
                onBack={() => setActiveStep(3)}
                onNext={undefined}
                nextLabel={undefined}
                accent={accent}
                onAccent={onAccent}
              />
            </div>
          )}
        </div>
      )}

      {activeStep === 5 && (
        <div className="space-y-3" data-testid="editorial-package-step">
          {socialPkg ? (
            <>
              <SocialPostsCard pkg={socialPkg} accent={accent} onAccent={onAccent} />
              <StepNav
                onBack={() => setActiveStep(4)}
                onNext={() => setActiveStep(6)}
                nextLabel="Continue to Publish"
                accent={accent}
                onAccent={onAccent}
              />
            </>
          ) : (
            <div className="rounded-xl border border-border/40 bg-background/30 p-4 text-center space-y-2">
              <Megaphone className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-[13px] text-muted-foreground">
                {hasOutput
                  ? "Generate a social pack from your draft to continue."
                  : "Generate a draft first to build a social pack."}
              </p>
              {hasOutput && (
                <Button
                  type="button"
                  onClick={handleGenerateSocialFromArticle}
                  className="h-10 px-5 font-bold rounded-full"
                  style={{ background: accent, color: onAccent }}
                  data-testid="editorial-gen-social"
                >
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Generate Social Pack
                </Button>
              )}
              <StepNav
                onBack={() => setActiveStep(4)}
                onNext={undefined}
                nextLabel={undefined}
                accent={accent}
                onAccent={onAccent}
              />
            </div>
          )}
        </div>
      )}

      {activeStep === 6 && (
        <div className="space-y-3" data-testid="editorial-publish-step">
          {articlePkg && voiceGatePassed ? (
            <>
              <ArticlePackageCard pkg={articlePkg} accent={accent} onAccent={onAccent} strength={strength} />
              <div
                className="rounded-xl border p-3 text-center"
                style={{ borderColor: `${accent}40`, background: `${accent}08` }}
              >
                <ShieldCheck className="w-6 h-6 mx-auto mb-1" style={{ color: accent }} />
                <p className="text-[12px] font-bold" style={{ color: accent }}>
                  Quality Gate Passed
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Founder Voice check complete. Prepare your WordPress draft or copy to clipboard.
                </p>
              </div>
              {/* Handoff destinations */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Article Package", icon: FileText, ready: true },
                  { label: "Social Package", icon: Megaphone, ready: Boolean(socialPkg) },
                  { label: "WebArt Handoff", icon: Sparkles, ready: true },
                  { label: "WebEdit Handoff", icon: PenTool, ready: true },
                ].map((dest) => {
                  const Icon = dest.icon;
                  return (
                    <div
                      key={dest.label}
                      className={`rounded-lg border p-2.5 text-center ${dest.ready ? "border-border/40 bg-card/40" : "border-dashed border-border/30 bg-background/20"}`}
                    >
                      <Icon className={`w-4 h-4 mx-auto mb-1 ${dest.ready ? "" : "text-muted-foreground/30"}`} style={dest.ready ? { color: accent } : undefined} />
                      <p className={`text-[10px] font-bold ${dest.ready ? "text-foreground/80" : "text-muted-foreground/40"}`}>
                        {dest.label}
                      </p>
                      <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                        {dest.ready ? "Ready" : "Not built"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : articlePkg && !voiceGatePassed ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
              <ShieldCheck className="w-8 h-8 mx-auto text-amber-500/60" />
              <p className="text-[13px] font-bold text-amber-600 dark:text-amber-400 mt-2">
                Founder Review Needed
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
                Your draft is ready but hasn't passed the Founder Voice Quality Gate. Go back to Step 4, review the checklist, and unlock export.
              </p>
              <Button
                type="button"
                onClick={() => setActiveStep(4)}
                variant="outline"
                className="h-9 px-4 text-[12px] mt-3 rounded-full"
              >
                Back to Draft
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 bg-background/30 p-4 text-center">
              <Lock className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-[13px] text-muted-foreground mt-2">
                {stepBlockReason(6) ?? "Complete the previous steps to unlock export."}
              </p>
              <Button
                type="button"
                onClick={() => setActiveStep(4)}
                variant="outline"
                className="h-9 px-4 text-[12px] mt-3 rounded-full"
              >
                Back to Draft
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel,
  accent,
  onAccent,
}: {
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  accent: string;
  onAccent: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 pt-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 text-[12px] text-muted-foreground hover:text-foreground"
        onClick={onBack}
      >
        Back
      </Button>
      {onNext && nextLabel && (
        <Button
          type="button"
          size="sm"
          className="h-8 text-[12px] font-bold rounded-full"
          style={{ background: accent, color: onAccent }}
          onClick={onNext}
        >
          {nextLabel}
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      )}
    </div>
  );
}

function Selector<T extends string>({
  label,
  value,
  options,
  onChange,
  accent,
  onAccent,
  testId,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  accent: string;
  onAccent: string;
  testId?: string;
}) {
  return (
    <div data-testid={testId}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const isActive = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className={`h-7 px-2.5 rounded-full text-[10px] font-semibold border transition-colors ${
                isActive
                  ? "border-transparent"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
              style={isActive ? { background: accent, color: onAccent } : undefined}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ArticleIntelligencePanel({
  pkg,
  brand,
}: {
  pkg: EditorialArticlePackage;
  brand: IntelligenceBrandVoiceProfile;
}) {
  const blueprint = useMemo(
    () => chooseBlueprint(pkg.brand, `${pkg.headline} ${pkg.articleBody}`),
    [pkg.articleBody, pkg.brand, pkg.headline],
  );
  const seoPacket: SeoPacket = useMemo(
    () => generateSeoPacket(pkg.headline, pkg.headline, brand),
    [brand, pkg.headline],
  );
  const quality: QualityScoreResult = useMemo(
    () =>
      scoreArticleDraft({
        headline: pkg.headline,
        body: pkg.articleBody,
        brand,
        hasSeoPack: Boolean(pkg.seoTitle && pkg.seoDescription),
        hasSocialPack: Boolean(pkg.socialCaption || pkg.xPost || pkg.instagramCaption),
        hasVisualDirection: false,
        sourceCount: pkg.sourceNotesUsed.length,
      }),
    [brand, pkg],
  );
  const receipt = formatArticleQualityReceipt(quality);
  return (
    <section
      className="rounded-2xl border border-border/60 bg-secondary/25 p-3"
      data-testid="editorial-intelligence-scoring"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">
            Intelligence Scoring
          </p>
          <h4 className="mt-1 text-sm font-black text-foreground">
            Article Quality Receipt
          </h4>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Local scoring. No external calls needed.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <CopyButton
            textToCopy={formatFounderVoicePacket()}
            label="Founder Voice"
            successMessage="Founder Voice summary copied"
            className="h-8 text-[11px]"
          />
          <CopyButton
            textToCopy={formatBrandVoicePacket(brand)}
            label="Brand Voice"
            successMessage="Brand Voice summary copied"
            className="h-8 text-[11px]"
          />
          <CopyButton
            textToCopy={receipt}
            label="Quality Receipt"
            successMessage="Article Quality Receipt copied"
            className="h-8 text-[11px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        {[
          { label: "Quality", value: `${quality.score}/100` },
          { label: "Founder Fit", value: `${quality.founderVoiceFit}/100` },
          { label: "Brand Fit", value: `${quality.brandFit}/100` },
          { label: "Claim Risk", value: `${quality.unsupportedClaimRisk}/100` },
          { label: "No-Gossip", value: quality.noGossipCheck },
          { label: "SEO", value: `${quality.seoReadiness}/100` },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border/50 bg-background/30 p-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 truncate text-[12px] font-black text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-background/30 p-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Top 3 fixes
          </p>
          <ul className="mt-1 space-y-1">
            {(quality.topFixes.length ? quality.topFixes : ["No major fixes flagged."]).map((fix) => (
              <li key={fix} className="text-[11px] leading-snug text-muted-foreground">
                - {fix}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border/50 bg-background/30 p-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Recommended next action
          </p>
          <p className="mt-1 text-[11px] leading-snug text-foreground">
            {quality.recommendedNextAction}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-background/30 p-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Blueprint / SEO
          </p>
          <p className="mt-1 text-[11px] font-bold text-foreground">
            {blueprint.name}
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
            {seoPacket.slug} · {seoPacket.readiness}/100 SEO readiness
          </p>
        </div>
      </div>
    </section>
  );
}
