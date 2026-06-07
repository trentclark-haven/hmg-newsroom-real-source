/**
 * Max CRO War Room — Final Overdrive Pass
 *
 * Max is: CRO / Founder OS, revenue operator, sponsor/partnership thinker,
 * relationship strategist, content-to-revenue translator, Founder OS companion.
 *
 * Max is NOT: article editor, graphics tool, WebEdit, Social Factory, ARTBOT,
 * fake CRM, fake email, fake outreach, fake sponsor database, generic startup bro.
 *
 * Truth labels: Local Max Intelligence | Founder Review Required |
 *   No Outreach Sent | No CRM Connected | No Fake Deal Status |
 *   Future Relationship Database Hook Pending | Future Old Soldier/Ollama Hook Pending
 */
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  BookMarked,
  Brain,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardCopy,
  DollarSign,
  Eye,
  FileText,
  HelpCircle,
  Inbox,
  Package,
  Plus,
  RefreshCw,
  Save,
  Send,
  ShieldAlert,
  Star,
  Tag,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { useMaxCROInbox } from "@/lib/useMaxCROInbox";
import { hasRevenueSignal, detectRevenueSignals, buildCROBriefText } from "@/lib/hmg/haven-ai/maxCROEngine";
import type { MaxCROBrief, CROStatus } from "@/lib/hmg/haven-ai/maxCROEngine";
import { computeRevenueScore, scoreLabelBg } from "@/lib/hmg/haven-ai/maxRevenueScoring";
import { generateDailyBrief, buildDailyBriefText } from "@/lib/hmg/haven-ai/maxDailyBrief";
import { generateContentPackage, buildPackageText, ALL_PACKAGE_TYPES } from "@/lib/hmg/haven-ai/maxContentPackages";
import type { ContentPackageType } from "@/lib/hmg/haven-ai/maxContentPackages";
import { SPONSOR_CATEGORIES, getCategoriesForText } from "@/lib/hmg/haven-ai/maxSponsorCategories";
import {
  runJudgment, runDealLawyerLens, runBuffettFilter, generateMaxQuestions, runFounderCommand,
  type MaxJudgment, type DealLawyerReview, type DealFlag, type BuffettFilter as BuffettFilterResult,
  type MaxQuestion, type FounderCommand,
} from "@/lib/hmg/haven-ai/maxJudgmentEngine";
import {
  translateContentToMoney, buildContentToMoneyText, ALL_INPUT_TYPES, type ContentInputType,
} from "@/lib/hmg/haven-ai/maxContentToMoney";
import {
  useFounderContext, type ContextQualityLabel,
} from "@/lib/hmg/haven-ai/maxFounderContext";
import {
  useMaxFollowUpTracker, buildFollowUpBriefText, type FollowUpStatus, type RelationshipType,
} from "@/lib/useMaxFollowUpTracker";
import { recordOutput } from "@/lib/useOutputHistory";
import { getMaxOpener, getMaxChasePhrase } from "@/lib/hmg/haven-ai/maxVoiceEngine";
import { verticals } from "@/lib/mock-data";

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<CROStatus, string> = {
  "Revenue Review Needed": "bg-amber-500/15 border-amber-400/50 text-amber-700 dark:text-amber-300",
  "Max Review Drafted": "bg-emerald-500/15 border-emerald-400/50 text-emerald-700 dark:text-emerald-300",
  "Founder Review Required": "bg-sky-500/15 border-sky-400/50 text-sky-700 dark:text-sky-300",
  "Saved to Output History": "bg-indigo-500/15 border-indigo-400/50 text-indigo-700 dark:text-indigo-300",
  "Relationship Follow-Up Needed": "bg-violet-500/15 border-violet-400/50 text-violet-700 dark:text-violet-300",
  "Ignore / No Money Move": "bg-secondary border-border text-muted-foreground",
};

const STATUS_ICONS: Record<CROStatus, React.ElementType> = {
  "Revenue Review Needed": AlertTriangle,
  "Max Review Drafted": CheckCircle2,
  "Founder Review Required": Eye,
  "Saved to Output History": Save,
  "Relationship Follow-Up Needed": UserCheck,
  "Ignore / No Money Move": XCircle,
};

const DECISION_COLORS: Record<MaxJudgment["decision"], string> = {
  Chase: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-400/40",
  Watch: "text-amber-600 dark:text-amber-300 bg-amber-500/15 border-amber-400/40",
  Package: "text-sky-600 dark:text-sky-400 bg-sky-500/15 border-sky-400/40",
  "Relationship First": "text-violet-600 dark:text-violet-400 bg-violet-500/15 border-violet-400/40",
  Delegate: "text-orange-600 dark:text-orange-400 bg-orange-500/15 border-orange-400/40",
  "Save for Later": "text-slate-600 dark:text-slate-300 bg-slate-500/15 border-slate-400/40",
  Ignore: "text-muted-foreground bg-secondary border-border",
};

const RISK_COLORS: Record<DealLawyerReview["riskLevel"], string> = {
  Low: "text-emerald-600 dark:text-emerald-400",
  Medium: "text-amber-600 dark:text-amber-400",
  High: "text-orange-600 dark:text-orange-400",
  Flag: "text-destructive",
};

const SEVERITY_COLORS: Record<DealFlag["severity"], string> = {
  Low: "border-sky-400/30 bg-sky-500/[0.05] text-sky-600 dark:text-sky-400",
  Medium: "border-amber-400/30 bg-amber-500/[0.05] text-amber-600 dark:text-amber-400",
  High: "border-orange-400/30 bg-orange-500/[0.05] text-orange-600 dark:text-orange-400",
  Critical: "border-destructive/30 bg-destructive/[0.05] text-destructive",
};

const BUFFETT_VERDICT_COLORS: Record<BuffettFilterResult["verdict"], string> = {
  Compound: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-400/40",
  Package: "text-sky-600 dark:text-sky-400 bg-sky-500/15 border-sky-400/40",
  Wait: "text-amber-600 dark:text-amber-300 bg-amber-500/15 border-amber-400/40",
  Avoid: "text-orange-600 dark:text-orange-400 bg-orange-500/15 border-orange-400/40",
  Noise: "text-muted-foreground bg-secondary border-border",
};

const QUALITY_COLORS: Record<ContextQualityLabel, string> = {
  Empty: "text-muted-foreground border-border/50 bg-secondary/30",
  Basic: "text-amber-600 dark:text-amber-400 border-amber-400/30 bg-amber-500/[0.06]",
  Useful: "text-sky-600 dark:text-sky-400 border-sky-400/30 bg-sky-500/[0.06]",
  Strong: "text-emerald-600 dark:text-emerald-400 border-emerald-400/30 bg-emerald-500/[0.06]",
  Sharp: "text-emerald-400 dark:text-emerald-300 border-emerald-300/40 bg-emerald-400/[0.08]",
};

const SILO_OPTIONS = [
  { id: "hmg", name: "HMG Master Brand" },
  ...verticals.map((v) => ({ id: v.id, name: v.name })),
];

const RELATIONSHIP_TYPES: RelationshipType[] = [
  "Manager", "Publicist", "Agent", "Brand Contact", "Venue Contact",
  "Event Organizer", "Artist / Talent", "Sponsor Contact", "Media Partner",
  "Local Business", "Consultant", "Other",
];

type WarRoomTab =
  | "quick"
  | "intake"
  | "inbox"
  | "priority"
  | "commands"
  | "content"
  | "followups"
  | "sponsors"
  | "offline"
  | "ignore"
  | "founder"
  | "context";

// ──────────────────────────────────────────────────────────────────────────────
// Shared primitives
// ──────────────────────────────────────────────────────────────────────────────

function TruthBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border border-border/60 bg-secondary/60 text-muted-foreground">
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: CROStatus }) {
  const Icon = STATUS_ICONS[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function ScoreBadge({ score }: { score: MaxCROBrief["score"] }) {
  if (!score) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${scoreLabelBg(score.label)}`}>
      <TrendingUp className="w-3 h-3" />
      {score.moneyMoveScore}/100 · {score.label}
    </span>
  );
}

function ConfidencePill({ confidence }: { confidence: number }) {
  const color = confidence >= 70 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-400/30"
    : confidence >= 50 ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-400/30"
    : "text-muted-foreground bg-secondary border-border";
  return (
    <span className={`inline-flex items-center text-[9px] font-black px-2 py-0.5 rounded-full border ${color}`}>
      {confidence}% confidence
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Judgment Panel — upgraded
// ──────────────────────────────────────────────────────────────────────────────

function JudgmentPanel({ item }: { item: MaxCROBrief }) {
  const judgment = useMemo(
    () => runJudgment(item.sourceText, item.signals, item.score?.moneyMoveScore ?? 0),
    [item.sourceText, item.signals, item.score],
  );
  const [showDetail, setShowDetail] = useState(false);

  const briefText = `MAX JUDGMENT — Local Max Intelligence\n\nDecision: ${judgment.decision}\nMoney Type: ${judgment.moneyType}\nFounder Effort: ${judgment.founderEffort}\nTiming: ${judgment.timing}\nConfidence: ${judgment.confidence}%\n\nWhy: ${judgment.why}\n\nUpside: ${judgment.upsideExplanation}\nDownside: ${judgment.downsideExplanation}\n\nFounder Next Move: ${judgment.founderNextMove}\n\nWhat Max Would Do: ${judgment.whatMaxWouldDo}\nWhat Max Would Not Do: ${judgment.whatMaxWouldNotDo}\n\nFounder Should Only Touch If: ${judgment.founderShouldOnlyTouchIf}${judgment.sportsRead ? `\n\nSports Read: ${judgment.sportsRead.analogy} — ${judgment.sportsRead.meaning}\nMoney Lesson: ${judgment.sportsRead.moneyLesson}\nFounder Action: ${judgment.sportsRead.founderAction}\nAvoid: ${judgment.sportsRead.whatToAvoid}` : ""}`;

  const copy = useCallback(() => {
    navigator.clipboard.writeText(briefText).then(() => toast.success("Judgment copied")).catch(() => toast.error("Copy failed"));
  }, [briefText]);

  const save = useCallback(() => {
    recordOutput({ silo: item.silo, siloName: item.siloName, kind: "max-judgment", prompt: item.sourceText.slice(0, 100), output: judgment });
    toast.success("Judgment saved");
  }, [item, judgment]);

  return (
    <div className="pt-2 border-t border-border/30 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Max Judgment</p>
          <ConfidencePill confidence={judgment.confidence} />
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 text-[9px] font-bold px-2 gap-1" onClick={copy}><ClipboardCopy className="w-3 h-3" />Copy</Button>
          <Button size="sm" variant="ghost" className="h-6 text-[9px] font-bold px-2 gap-1" onClick={save}><Save className="w-3 h-3" />Save</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {[
          { label: "Decision", value: judgment.decision },
          { label: "Money Type", value: judgment.moneyType },
          { label: "Effort", value: judgment.founderEffort },
          { label: "Timing", value: judgment.timing },
        ].map(({ label, value }) => (
          <div key={label} className={`rounded-lg border px-2 py-1.5 ${label === "Decision" ? DECISION_COLORS[judgment.decision] : "bg-card/50 border-border/40"}`}>
            <div className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="text-[10px] font-bold leading-snug mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border/30 bg-card/40 px-3 py-2 space-y-1.5">
        <p className="text-[11px] text-foreground/80 leading-relaxed"><strong className="text-[9px] font-black uppercase text-muted-foreground block mb-0.5">Why</strong>{judgment.why}</p>
        <p className="text-[11px] text-foreground/80 leading-relaxed"><strong className="text-[9px] font-black uppercase text-muted-foreground block mb-0.5">Founder Next Move</strong>{judgment.founderNextMove}</p>
      </div>

      <button type="button" onClick={() => setShowDetail((p) => !p)} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
        {showDetail ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {showDetail ? "Hide" : "Show"} full detail (upside/downside, sports read)
      </button>

      {showDetail && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.04] px-3 py-2">
              <p className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-0.5">Upside</p>
              <p className="text-[11px] text-foreground/70 leading-relaxed">{judgment.upsideExplanation}</p>
            </div>
            <div className="rounded-lg border border-orange-400/20 bg-orange-500/[0.04] px-3 py-2">
              <p className="text-[9px] font-black uppercase text-orange-600 dark:text-orange-400 mb-0.5">Downside</p>
              <p className="text-[11px] text-foreground/70 leading-relaxed">{judgment.downsideExplanation}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-lg border border-border/30 bg-card/40 px-3 py-2">
              <p className="text-[9px] font-black uppercase text-muted-foreground mb-0.5">What Would Make This Better</p>
              <p className="text-[11px] text-foreground/70 leading-relaxed">{judgment.whatWouldMakeItBetter}</p>
            </div>
            <div className="rounded-lg border border-border/30 bg-card/40 px-3 py-2">
              <p className="text-[9px] font-black uppercase text-destructive/60 mb-0.5">What Makes It Not Worth It</p>
              <p className="text-[11px] text-foreground/70 leading-relaxed">{judgment.whatWouldMakeItNotWorthIt}</p>
            </div>
          </div>
          <div className="rounded-lg border border-border/30 bg-card/40 px-3 py-2">
            <p className="text-[9px] font-black uppercase text-muted-foreground mb-0.5">What Max Would Do</p>
            <p className="text-[11px] text-foreground/70">{judgment.whatMaxWouldDo}</p>
          </div>
          <div className="rounded-lg border border-destructive/20 bg-destructive/[0.04] px-3 py-2">
            <p className="text-[9px] font-black uppercase text-destructive/70 mb-0.5">What Max Would Not Do</p>
            <p className="text-[11px] text-foreground/70">{judgment.whatMaxWouldNotDo}</p>
          </div>
          <div className="rounded-lg border border-border/30 bg-card/40 px-3 py-2">
            <p className="text-[9px] font-black uppercase text-muted-foreground mb-0.5">Founder Should Only Touch This If…</p>
            <p className="text-[11px] text-foreground/70">{judgment.founderShouldOnlyTouchIf}</p>
          </div>
          {judgment.sportsRead && (
            <div className="rounded-lg border border-sky-400/20 bg-sky-500/[0.04] px-3 py-2 space-y-1">
              <p className="text-[9px] font-black uppercase text-sky-600 dark:text-sky-400">Sports Read — {judgment.sportsRead.analogy} ({judgment.sportsRead.category})</p>
              <p className="text-[11px] text-foreground/70">{judgment.sportsRead.meaning}</p>
              <p className="text-[11px] text-foreground/80 font-semibold">Money Lesson: {judgment.sportsRead.moneyLesson}</p>
              <p className="text-[11px] text-foreground/80">→ {judgment.sportsRead.founderAction}</p>
              <p className="text-[10px] text-destructive/60">Avoid: {judgment.sportsRead.whatToAvoid}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        <TruthBadge label="Local Max Intelligence" />
        <TruthBadge label="No Fake Deal Status" />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Max Questions Panel
// ──────────────────────────────────────────────────────────────────────────────

function MaxQuestionsPanel({ item }: { item: MaxCROBrief }) {
  const judgment = useMemo(
    () => runJudgment(item.sourceText, item.signals, item.score?.moneyMoveScore ?? 0),
    [item.sourceText, item.signals, item.score],
  );
  const questions = useMemo(
    () => generateMaxQuestions(item.sourceText, judgment.moneyType, judgment),
    [item.sourceText, judgment],
  );
  const [answered, setAnswered] = useState<Set<number>>(new Set());

  const copy = useCallback(() => {
    const text = `MAX STRATEGY QUESTIONS — Local Max Intelligence\n\nSource: ${item.sourceText.slice(0, 80)}\n\n${questions.map((q, i) => `${i + 1}. [${q.category}] ${q.question}`).join("\n")}`;
    navigator.clipboard.writeText(text).then(() => toast.success("Questions copied")).catch(() => toast.error("Copy failed"));
  }, [item.sourceText, questions]);

  const save = useCallback(() => {
    recordOutput({ silo: item.silo, siloName: item.siloName, kind: "max-strategy-questions", prompt: item.sourceText.slice(0, 100), output: { questions, sourceText: item.sourceText } });
    toast.success("Questions saved");
  }, [item, questions]);

  const CATEGORY_COLORS: Record<MaxQuestion["category"], string> = {
    relationship: "text-violet-500",
    package: "text-sky-500",
    sponsor: "text-emerald-500",
    timing: "text-amber-500",
    audience: "text-indigo-500",
    founder: "text-foreground/50",
  };

  return (
    <div className="pt-2 border-t border-border/30 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Max Asks — Strategy Questions</p>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 text-[9px] font-bold px-2 gap-1" onClick={copy}><ClipboardCopy className="w-3 h-3" />Copy</Button>
          <Button size="sm" variant="ghost" className="h-6 text-[9px] font-bold px-2 gap-1" onClick={save}><Save className="w-3 h-3" />Save</Button>
        </div>
      </div>
      <div className="space-y-1.5">
        {questions.map((q, i) => (
          <button key={i} type="button" onClick={() => setAnswered((prev) => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; })}
            className={`w-full text-left flex items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors ${answered.has(i) ? "border-emerald-400/30 bg-emerald-500/[0.06]" : "border-border/40 bg-card/40 hover:bg-card"}`}>
            <span className={`text-[9px] font-black pt-0.5 shrink-0 ${CATEGORY_COLORS[q.category]}`}>{String(i + 1).padStart(2, "0")}</span>
            <p className={`text-[11px] leading-relaxed flex-1 ${answered.has(i) ? "line-through text-muted-foreground" : "text-foreground/80"}`}>{q.question}</p>
            {answered.has(i) && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />}
          </button>
        ))}
      </div>
      <p className="text-[9px] text-muted-foreground/60">Tap to mark answered. Manual answer only — no fake AI response.</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Deal Lawyer Panel — upgraded (DealFlag objects)
// ──────────────────────────────────────────────────────────────────────────────

function DealLawyerPanel({ item }: { item: MaxCROBrief }) {
  const judgment = useMemo(
    () => runJudgment(item.sourceText, item.signals, item.score?.moneyMoveScore ?? 0),
    [item.sourceText, item.signals, item.score],
  );
  const review = useMemo(
    () => runDealLawyerLens(item.sourceText, judgment.moneyType),
    [item.sourceText, judgment.moneyType],
  );
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);

  const copy = useCallback(() => {
    const flagLines = review.flags.length > 0
      ? review.flags.map((f) => `• [${f.severity}] ${f.type}: ${f.whyItMatters}`).join("\n")
      : "• No major risk flags detected.";
    const text = `MAX DEAL LAWYER LENS — Business Risk Review (Not Legal Advice)\n\nRisk Level: ${review.riskLevel}\n\nFlags:\n${flagLines}\n\nCleaner Version: ${review.cleanerVersion}\n\nSafer Pitch Angle: ${review.saferPitchAngle}\n\nDo Not Say: ${review.doNotSayThis}\n\nHuman Review If: ${review.humanReviewIf}\n\nVerdict: ${review.verdict}`;
    navigator.clipboard.writeText(text).then(() => toast.success("Risk review copied")).catch(() => toast.error("Copy failed"));
  }, [review]);

  const save = useCallback(() => {
    recordOutput({ silo: item.silo, siloName: item.siloName, kind: "max-risk-review", prompt: item.sourceText.slice(0, 100), output: review });
    toast.success("Risk review saved");
  }, [item, review]);

  return (
    <div className="pt-2 border-t border-border/30 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Deal Lawyer Lens</p>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${RISK_COLORS[review.riskLevel]} bg-secondary/30 border-border/40`}>{review.riskLevel}</span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 text-[9px] font-bold px-2 gap-1" onClick={copy}><ClipboardCopy className="w-3 h-3" />Copy</Button>
          <Button size="sm" variant="ghost" className="h-6 text-[9px] font-bold px-2 gap-1" onClick={save}><Save className="w-3 h-3" />Save</Button>
        </div>
      </div>

      <p className="text-[9px] text-destructive/60 font-bold uppercase tracking-wide">Business risk review — not legal advice.</p>

      {review.flags.length === 0 ? (
        <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/[0.04] px-3 py-2">
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">No major risk flags detected.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[9px] font-black uppercase text-muted-foreground">Risk Flags ({review.flags.length})</p>
          {review.flags.map((f) => (
            <button key={f.type} type="button" onClick={() => setExpandedFlag((p) => p === f.type ? null : f.type)}
              className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${SEVERITY_COLORS[f.severity]}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span className="text-[11px] font-bold">{f.type}</span>
                  <span className="text-[9px] font-black uppercase">[{f.severity}]</span>
                </div>
                {expandedFlag === f.type ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
              </div>
              {expandedFlag === f.type && (
                <div className="mt-2 space-y-1.5 text-[10px] text-foreground/70 leading-relaxed border-t border-border/20 pt-2">
                  <p><strong>Why it matters:</strong> {f.whyItMatters}</p>
                  <p><strong>How to make safer:</strong> {f.howToMakeSafer}</p>
                  <p><strong>Founder review note:</strong> {f.founderReviewNote}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        {[
          { label: "Cleaner Version", body: review.cleanerVersion },
          { label: "Safer Pitch Angle", body: review.saferPitchAngle },
          { label: "Do Not Say This", body: review.doNotSayThis },
          { label: "Human Review If", body: review.humanReviewIf },
        ].map(({ label, body }) => (
          <div key={label} className="rounded-lg border border-border/30 bg-card/40 px-3 py-2">
            <p className="text-[9px] font-black uppercase text-muted-foreground mb-0.5">{label}</p>
            <p className="text-[11px] text-foreground/70 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Buffett / Moolah Panel — upgraded (10 checks, Moolah Path)
// ──────────────────────────────────────────────────────────────────────────────

function BuffettPanel({ item }: { item: MaxCROBrief }) {
  const judgment = useMemo(
    () => runJudgment(item.sourceText, item.signals, item.score?.moneyMoveScore ?? 0),
    [item.sourceText, item.signals, item.score],
  );
  const filter = useMemo(
    () => runBuffettFilter(item.sourceText, judgment.moneyType, item.score?.moneyMoveScore ?? 0),
    [item.sourceText, judgment.moneyType, item.score],
  );
  const [showMoolah, setShowMoolah] = useState(false);

  const copy = useCallback(() => {
    const text = `MAX BUFFETT + MOOLAH FILTER — Local Max Intelligence\n\nVerdict: ${filter.verdict}\n${filter.verdictExplanation}\n\nMoolah Path:\n• Fastest: ${filter.moolahPath.fastestMonetization}\n• Cleanest Package: ${filter.moolahPath.cleanestPackagePath}\n• Relationship Moat: ${filter.moolahPath.relationshipMoatPath}\n• Reason Not to Chase: ${filter.moolahPath.reasonNotToChase}`;
    navigator.clipboard.writeText(text).then(() => toast.success("Buffett filter copied")).catch(() => toast.error("Copy failed"));
  }, [filter]);

  const save = useCallback(() => {
    recordOutput({ silo: item.silo, siloName: item.siloName, kind: "max-buffett-filter", prompt: item.sourceText.slice(0, 100), output: filter });
    toast.success("Buffett filter saved");
  }, [item, filter]);

  const checks: Array<{ label: string; value: boolean; invert?: boolean }> = [
    { label: "Compounds Equity", value: filter.compoundsEquity },
    { label: "Repeatable", value: filter.isRepeatable },
    { label: "Simple to Sell", value: filter.isSimpleEnoughToSell },
    { label: "Relationship Moat", value: filter.buildsRelationshipMoat },
    { label: "Low Drama", value: filter.isLowDrama },
    { label: "Future Deal Flow", value: filter.createsFutureDealFlow },
    { label: "Protects Founder Time", value: filter.protectsFounderTime },
    { label: "Just Hype", value: filter.isJustHype, invert: true },
    { label: "Matters in 30 Days", value: filter.stillMatterIn30Days },
    { label: "Durable Package", value: filter.canBecomeDurablePackage },
  ];

  return (
    <div className="pt-2 border-t border-border/30 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-500" />
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Buffett + Moolah Filter</p>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${BUFFETT_VERDICT_COLORS[filter.verdict]}`}>{filter.verdict}</span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 text-[9px] font-bold px-2 gap-1" onClick={copy}><ClipboardCopy className="w-3 h-3" />Copy</Button>
          <Button size="sm" variant="ghost" className="h-6 text-[9px] font-bold px-2 gap-1" onClick={save}><Save className="w-3 h-3" />Save</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {checks.map(({ label, value, invert }) => {
          const good = invert ? !value : value;
          return (
            <div key={label} className={`rounded-lg border px-2 py-1.5 text-center ${good ? "border-emerald-400/30 bg-emerald-500/[0.06]" : "border-border/40 bg-card/40"}`}>
              <div className={`text-[9px] font-black ${good ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>{value ? "✓" : "✗"}</div>
              <div className="text-[9px] font-bold text-muted-foreground mt-0.5 leading-tight">{label}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-amber-400/20 bg-amber-500/[0.04] px-3 py-2 space-y-1">
        <p className="text-[11px] font-semibold text-foreground/80 leading-relaxed">{filter.verdictExplanation}</p>
        <p className="text-[11px] text-foreground/60 italic">{filter.founderNote}</p>
      </div>

      <button type="button" onClick={() => setShowMoolah((p) => !p)} className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
        {showMoolah ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {showMoolah ? "Hide" : "Show"} Moolah Path
      </button>

      {showMoolah && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-500/[0.04] px-3 py-2 space-y-2">
          <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Moolah Path — Local Max Intelligence</p>
          {[
            { label: "Fastest Monetization", body: filter.moolahPath.fastestMonetization },
            { label: "Cleanest Package Path", body: filter.moolahPath.cleanestPackagePath },
            { label: "Relationship Moat Path", body: filter.moolahPath.relationshipMoatPath },
            { label: "Long-Term Brand Equity Path", body: filter.moolahPath.longTermBrandEquityPath },
            { label: "Reason Not to Chase", body: filter.moolahPath.reasonNotToChase },
          ].map(({ label, body }) => (
            <div key={label}>
              <p className="text-[9px] font-black uppercase text-muted-foreground mb-0.5">{label}</p>
              <p className="text-[11px] text-foreground/70 leading-relaxed">{body}</p>
            </div>
          ))}
          <div className="flex flex-wrap gap-1 pt-1">
            {["No Fake Revenue Projections", "No Fake Dollar Estimates"].map((t) => <TruthBadge key={t} label={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// CRO Review (8-section collapse)
// ──────────────────────────────────────────────────────────────────────────────

function CROReviewPanel({ item }: { item: MaxCROBrief }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (!item.review) return null;
  const r = item.review;
  const sections = [
    { id: "sponsor", icon: Briefcase, title: "1. Sponsor Angle", body: r.sponsorAngle },
    { id: "relationship", icon: UserCheck, title: "2. Relationship Follow-Up", body: r.relationshipFollowUp },
    { id: "content", icon: FileText, title: "3. Content-to-Revenue Move", body: r.contentToRevenue },
    { id: "brand", icon: TrendingUp, title: "4. Brand Partnership Idea", body: r.brandPartnership },
    { id: "offline", icon: DollarSign, title: "5. Offline Money Play", body: r.offlineMoneyPlay },
    { id: "ignore", icon: XCircle, title: "6. What To Ignore", body: r.whatToIgnore },
    { id: "founder", icon: Zap, title: "7. Founder Next Move", body: r.founderNextMove },
    { id: "risk", icon: AlertTriangle, title: "8. Risk / Reputation Note", body: r.riskReputationNote },
  ];
  return (
    <div className="space-y-1 pt-2 border-t border-border/30">
      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">Max CRO Review — Local Max Intelligence</p>
      {sections.map((s) => {
        const Icon = s.icon;
        const open = expanded === s.id;
        return (
          <button key={s.id} type="button" onClick={() => setExpanded(open ? null : s.id)} className="w-full text-left p-2.5 rounded-lg border border-border/40 bg-card/50 hover:bg-card transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wide truncate">{s.title}</span>
              </div>
              {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            </div>
            {open && <p className="text-[12px] text-foreground/90 leading-relaxed mt-2 pl-5">{s.body}</p>}
          </button>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Package Builder
// ──────────────────────────────────────────────────────────────────────────────

function PackageBuilder({ item }: { item: MaxCROBrief }) {
  const [selectedType, setSelectedType] = useState<ContentPackageType>("sponsored-article");
  const [pkg, setPkg] = useState<ReturnType<typeof generateContentPackage> | null>(null);

  const generate = useCallback(() => {
    const p = generateContentPackage({ sourceId: item.id, sourceText: item.sourceText, silo: item.silo, packageType: selectedType });
    setPkg(p);
  }, [item, selectedType]);

  return (
    <div className="pt-2 border-t border-border/30">
      <p className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-2">Content Package Builder</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as ContentPackageType)} className="h-7 text-[10px] font-bold px-2 rounded-md border border-border bg-card text-foreground">
          {ALL_PACKAGE_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
        </select>
        <Button size="sm" className="h-7 text-[10px] font-bold uppercase gap-1 bg-sky-600 hover:bg-sky-700 text-white" onClick={generate}><Package className="w-3 h-3" />Generate</Button>
        {pkg && (
          <>
            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={() => { navigator.clipboard.writeText(buildPackageText(pkg)).then(() => toast.success("Copied")); }}><ClipboardCopy className="w-3 h-3" />Copy</Button>
            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={() => { recordOutput({ silo: item.silo, siloName: item.siloName, kind: "max-revenue-package", prompt: item.sourceText.slice(0, 100), output: pkg }); toast.success("Package saved"); }}><Save className="w-3 h-3" />Save</Button>
          </>
        )}
      </div>
      {pkg && (
        <div className="rounded-lg border border-sky-400/30 bg-sky-500/[0.04] p-3 space-y-1.5 text-[11px]">
          <p className="font-black text-sky-600 dark:text-sky-400">{pkg.packageName}</p>
          <p><strong>What gets made:</strong> <span className="text-foreground/70">{pkg.whatGetsMade}</span></p>
          <p><strong>Who it helps:</strong> <span className="text-foreground/70">{pkg.whoItHelps}</span></p>
          <p><strong>Why a sponsor cares:</strong> <span className="text-foreground/70">{pkg.whySponsorCares}</span></p>
          <p><strong>Founder work:</strong> <span className="text-foreground/70">{pkg.founderWorkRequired}</span></p>
          <div className="rounded border border-sky-400/20 bg-sky-500/[0.06] p-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-sky-600 dark:text-sky-400 mb-1">Copy Pitch Starter</p>
            <p className="italic text-foreground/80">{pkg.copyPitchStarter}</p>
          </div>
          <p className="text-[10px] text-destructive/70"><strong>Avoid:</strong> {pkg.whatToAvoid}</p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Quick Read Card — upgraded (confidence, risk, what not to do, save)
// ──────────────────────────────────────────────────────────────────────────────

function QuickReadCard({ item, onSendToMax, onSetStatus }: { item: MaxCROBrief; onSendToMax: (id: string) => void; onSetStatus: (id: string, s: CROStatus) => void }) {
  const judgment = useMemo(
    () => runJudgment(item.sourceText, item.signals, item.score?.moneyMoveScore ?? 0),
    [item.sourceText, item.signals, item.score],
  );
  const dealReview = useMemo(
    () => runDealLawyerLens(item.sourceText, judgment.moneyType),
    [item.sourceText, judgment.moneyType],
  );

  const briefText = `QUICK READ — Max Local Intelligence\n\nDecision: ${judgment.decision}\nMoney Type: ${judgment.moneyType}\nEffort: ${judgment.founderEffort}\nTiming: ${judgment.timing}\nConfidence: ${judgment.confidence}%\nRisk: ${dealReview.riskLevel}\n\nWhy: ${judgment.why}\n\nNext Move: ${judgment.founderNextMove}\n\nWhat Not To Do: ${judgment.whatMaxWouldNotDo}`;

  const copy = useCallback(() => {
    navigator.clipboard.writeText(briefText).then(() => toast.success("Quick read copied"));
  }, [briefText]);

  const save = useCallback(() => {
    recordOutput({ silo: item.silo, siloName: item.siloName, kind: "max-quick-read", prompt: item.sourceText.slice(0, 100), output: { judgment, riskLevel: dealReview.riskLevel, sourceText: item.sourceText } });
    toast.success("Quick read saved to Output History");
  }, [item, judgment, dealReview.riskLevel]);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[12px] font-bold leading-snug text-foreground flex-1 line-clamp-2">{item.sourceText}</p>
        <span className={`shrink-0 text-[11px] font-black px-2 py-1 rounded-lg border ${DECISION_COLORS[judgment.decision]}`}>{judgment.decision}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
        {[
          { label: "Money Type", value: judgment.moneyType },
          { label: "Effort", value: judgment.founderEffort },
          { label: "Timing", value: judgment.timing },
          { label: "Risk", value: dealReview.riskLevel },
        ].map(({ label, value }) => (
          <div key={label} className="rounded border border-border/30 bg-card/40 px-2 py-1.5">
            <p className="text-[8px] font-black uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`text-[9.5px] font-bold leading-tight mt-0.5 ${label === "Risk" ? RISK_COLORS[dealReview.riskLevel] : "text-foreground/80"}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <ConfidencePill confidence={judgment.confidence} />
        {item.score && <ScoreBadge score={item.score} />}
      </div>

      <p className="text-[11px] text-foreground/70 leading-snug mb-1.5">{judgment.why}</p>

      <div className="rounded border border-destructive/20 bg-destructive/[0.03] px-2 py-1.5 mb-2">
        <p className="text-[9px] font-black uppercase text-destructive/60 mb-0.5">What Not To Do</p>
        <p className="text-[10.5px] text-foreground/70 leading-snug">{judgment.whatMaxWouldNotDo}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {item.status === "Revenue Review Needed" && (
          <Button size="sm" className="h-7 text-[10px] font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onSendToMax(item.id)}><Send className="w-3 h-3" />Send to Max</Button>
        )}
        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={copy}><ClipboardCopy className="w-3 h-3" />Copy Read</Button>
        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={save}><Save className="w-3 h-3" />Save Read</Button>
        {judgment.decision === "Package" && (
          <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1 text-sky-700 dark:text-sky-400" onClick={() => onSetStatus(item.id, "Founder Review Required")}><Package className="w-3 h-3" />Into Package</Button>
        )}
        {judgment.decision === "Relationship First" && (
          <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1 text-violet-700 dark:text-violet-400" onClick={() => onSetStatus(item.id, "Relationship Follow-Up Needed")}><UserCheck className="w-3 h-3" />Add Follow-Up</Button>
        )}
        {judgment.decision === "Ignore" && item.status !== "Ignore / No Money Move" && (
          <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1 text-muted-foreground" onClick={() => onSetStatus(item.id, "Ignore / No Money Move")}><XCircle className="w-3 h-3" />Mark Ignore</Button>
        )}
        {judgment.decision === "Chase" && item.status !== "Founder Review Required" && (
          <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1 text-sky-700 dark:text-sky-400" onClick={() => onSetStatus(item.id, "Founder Review Required")}><Eye className="w-3 h-3" />Founder Review</Button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main CRO Item Card
// ──────────────────────────────────────────────────────────────────────────────

function CROItemCard({
  item, onSendToMax, onSetStatus, onRemove, showPackage = false,
}: {
  item: MaxCROBrief; onSendToMax: (id: string) => void;
  onSetStatus: (id: string, s: CROStatus) => void; onRemove: (id: string) => void; showPackage?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<"review" | "judgment" | "questions" | "deal" | "buffett" | "package" | null>(null);
  const toggle = (panel: typeof activePanel) => setActivePanel((p) => p === panel ? null : panel);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(buildCROBriefText(item)).then(() => toast.success("Brief copied")).catch(() => toast.error("Copy failed"));
  }, [item]);

  const saveToHistory = useCallback(() => {
    recordOutput({ silo: item.silo, siloName: item.siloName, kind: "max-cro-brief", prompt: item.sourceText.slice(0, 100), output: item });
    onSetStatus(item.id, "Saved to Output History");
    toast.success("Saved to Output History");
  }, [item, onSetStatus]);

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold leading-snug text-foreground line-clamp-2">{item.sourceText}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{item.siloName} · {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <button type="button" onClick={() => setExpanded((p) => !p)} className="shrink-0 p-1 rounded hover:bg-muted/40">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          <StatusBadge status={item.status} />
          {item.score && <ScoreBadge score={item.score} />}
        </div>

        {item.signals.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.signals.slice(0, 5).map((s) => (
              <span key={s} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">{s}</span>
            ))}
            {item.signals.length > 5 && <span className="text-[9px] text-muted-foreground">+{item.signals.length - 5}</span>}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-2">
          {item.status === "Revenue Review Needed" && (
            <Button size="sm" className="h-7 text-[10px] font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onSendToMax(item.id)}><Send className="w-3 h-3" />Send to Max</Button>
          )}
          {item.review && (
            <>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={copy}><ClipboardCopy className="w-3 h-3" />Copy Brief</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={saveToHistory}><Save className="w-3 h-3" />Save</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={() => onSetStatus(item.id, "Founder Review Required")}><Eye className="w-3 h-3" />Founder Review</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={() => onSetStatus(item.id, "Relationship Follow-Up Needed")}><UserCheck className="w-3 h-3" />Follow-Up</Button>
            </>
          )}
          {item.status !== "Ignore / No Money Move" && (
            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1 text-muted-foreground" onClick={() => onSetStatus(item.id, "Ignore / No Money Move")}><XCircle className="w-3 h-3" />Ignore</Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-[10px] text-destructive/70 hover:text-destructive" onClick={() => onRemove(item.id)}><Trash2 className="w-3 h-3" /></Button>
        </div>

        {item.review && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-border/20">
            {[
              { key: "review" as const, icon: Zap, label: "CRO Review" },
              { key: "judgment" as const, icon: Brain, label: "Judgment" },
              { key: "questions" as const, icon: HelpCircle, label: "Max Asks" },
              { key: "deal" as const, icon: ShieldAlert, label: "Deal Lens" },
              { key: "buffett" as const, icon: Star, label: "Buffett" },
              ...(showPackage ? [{ key: "package" as const, icon: Package, label: "Package" }] : []),
            ].map(({ key, icon: Icon, label }) => (
              <button key={key} type="button" onClick={() => toggle(key)}
                className={`flex items-center gap-1 h-6 px-2 rounded text-[9px] font-bold uppercase tracking-wide transition-colors ${activePanel === key ? "bg-emerald-600 text-white" : "border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}>
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>
        )}

        {item.review && activePanel === "review" && expanded && <CROReviewPanel item={item} />}
        {item.review && activePanel === "review" && !expanded && (
          <div className="pt-2 border-t border-border/30">
            <button type="button" onClick={() => setExpanded(true)} className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Expand to see full CRO review →</button>
          </div>
        )}
        {item.review && activePanel === "judgment" && <JudgmentPanel item={item} />}
        {item.review && activePanel === "questions" && <MaxQuestionsPanel item={item} />}
        {item.review && activePanel === "deal" && <DealLawyerPanel item={item} />}
        {item.review && activePanel === "buffett" && <BuffettPanel item={item} />}
        {item.review && activePanel === "package" && showPackage && <PackageBuilder item={item} />}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Follow-Up Card
// ──────────────────────────────────────────────────────────────────────────────

function FollowUpCard({ item, onSetStatus, onRemove }: { item: ReturnType<typeof useMaxFollowUpTracker>["items"][0]; onSetStatus: (id: string, s: FollowUpStatus) => void; onRemove: (id: string) => void }) {
  const copy = useCallback(() => {
    navigator.clipboard.writeText(buildFollowUpBriefText(item)).then(() => toast.success("Copied")).catch(() => toast.error("Copy failed"));
  }, [item]);

  const save = useCallback(() => {
    recordOutput({ silo: "hmg", siloName: "HMG Master Brand", kind: "max-follow-up", prompt: `${item.personOrCompany} — ${item.reasonForFollowUp}`.slice(0, 100), output: item });
    toast.success("Saved to Output History");
  }, [item]);

  const STATUS_COLOR: Record<FollowUpStatus, string> = {
    "Needs Follow-Up": "bg-amber-500/15 border-amber-400/50 text-amber-700 dark:text-amber-300",
    "Founder Review": "bg-sky-500/15 border-sky-400/50 text-sky-700 dark:text-sky-300",
    "Follow-Up Done Manually": "bg-emerald-500/15 border-emerald-400/50 text-emerald-700 dark:text-emerald-300",
    "Waiting": "bg-violet-500/15 border-violet-400/50 text-violet-700 dark:text-violet-300",
    "Ignore": "bg-secondary border-border text-muted-foreground",
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-foreground">{item.personOrCompany}</p>
          <p className="text-[10px] text-muted-foreground">{item.relationshipType}</p>
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_COLOR[item.status]}`}>{item.status}</span>
      </div>
      <p className="text-[11px] text-foreground/80 leading-snug mb-1">{item.reasonForFollowUp}</p>
      {item.suggestedMessageAngle && <p className="text-[11px] text-muted-foreground italic mb-1.5">"{item.suggestedMessageAngle}"</p>}
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={copy}><ClipboardCopy className="w-3 h-3" />Copy</Button>
        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={save}><Save className="w-3 h-3" />Save</Button>
        {item.status !== "Follow-Up Done Manually" && <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1 text-emerald-700 dark:text-emerald-400" onClick={() => onSetStatus(item.id, "Follow-Up Done Manually")}><CheckCircle2 className="w-3 h-3" />Done Manually</Button>}
        {item.status !== "Waiting" && <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1 text-violet-700 dark:text-violet-400" onClick={() => onSetStatus(item.id, "Waiting")}><Circle className="w-3 h-3" />Waiting</Button>}
        {item.status !== "Ignore" && <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1 text-muted-foreground" onClick={() => onSetStatus(item.id, "Ignore")}><XCircle className="w-3 h-3" />Ignore</Button>}
        <Button size="sm" variant="ghost" className="h-7 text-[10px] text-destructive/70" onClick={() => onRemove(item.id)}><Trash2 className="w-3 h-3" /></Button>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {["Manual Follow-Up Only", "No Email Sent", "No CRM Connected"].map((t) => <TruthBadge key={t} label={t} />)}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Add Follow-Up Form
// ──────────────────────────────────────────────────────────────────────────────

function AddFollowUpForm({ onAdd }: { onAdd: () => void }) {
  const { add } = useMaxFollowUpTracker();
  const [open, setOpen] = useState(false);
  const [person, setPerson] = useState("");
  const [relType, setRelType] = useState<RelationshipType>("Manager");
  const [reason, setReason] = useState("");
  const [angle, setAngle] = useState("");

  const submit = useCallback(() => {
    if (!person.trim() || !reason.trim()) { toast.error("Name and reason required"); return; }
    add({ personOrCompany: person.trim(), relationshipType: relType, reasonForFollowUp: reason.trim(), suggestedMessageAngle: angle.trim(), status: "Needs Follow-Up", relatedSourceOrContent: "", notes: "" });
    setPerson(""); setReason(""); setAngle(""); setOpen(false); onAdd();
    toast.success("Follow-up logged — manual action required");
  }, [add, person, relType, reason, angle, onAdd]);

  if (!open) {
    return <Button size="sm" className="h-8 text-[10px] font-bold uppercase gap-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5" />Add Follow-Up</Button>;
  }

  return (
    <div className="rounded-xl border border-violet-400/30 bg-violet-500/[0.05] p-4 space-y-3">
      <p className="text-[11px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">Log Relationship Follow-Up</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-muted-foreground">Person / Company *</label>
          <input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Name or company" className="w-full h-8 text-[12px] px-2.5 rounded-md border border-border bg-card text-foreground" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-muted-foreground">Relationship Type</label>
          <select value={relType} onChange={(e) => setRelType(e.target.value as RelationshipType)} className="w-full h-8 text-[12px] px-2.5 rounded-md border border-border bg-card text-foreground">
            {RELATIONSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase text-muted-foreground">Reason *</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why does this contact matter for revenue?" className="w-full h-8 text-[12px] px-2.5 rounded-md border border-border bg-card text-foreground" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase text-muted-foreground">Message Angle</label>
        <input value={angle} onChange={(e) => setAngle(e.target.value)} placeholder="How to frame the outreach" className="w-full h-8 text-[12px] px-2.5 rounded-md border border-border bg-card text-foreground" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-8 text-[10px] font-bold uppercase gap-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={submit}><Save className="w-3 h-3" />Log Follow-Up</Button>
        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Daily Executive Money Brief — upgraded
// ──────────────────────────────────────────────────────────────────────────────

function DailyExecutiveBriefPanel({ items }: { items: MaxCROBrief[] }) {
  const [brief, setBrief] = useState<ReturnType<typeof generateDailyBrief> | null>(null);
  const [generated, setGenerated] = useState(false);
  const [marked, setMarked] = useState(false);

  const topItem = useMemo(
    () => [...items.filter((i) => i.review)].sort((a, b) => (b.score?.moneyMoveScore ?? 0) - (a.score?.moneyMoveScore ?? 0))[0],
    [items],
  );

  const topJudgment = useMemo(
    () => topItem ? runJudgment(topItem.sourceText, topItem.signals, topItem.score?.moneyMoveScore ?? 0) : null,
    [topItem],
  );

  const generate = useCallback(() => { setBrief(generateDailyBrief(items)); setGenerated(true); }, [items]);

  const copy = useCallback(() => {
    if (!brief) return;
    const extraSections = topJudgment ? `\nONE MOVE BEFORE LUNCH\n${topJudgment.founderEffort === "5-Minute Move" || topJudgment.founderEffort === "15-Minute Move" ? topJudgment.founderNextMove : "Review the top priority source. Draft the brief. 30 minutes max."}\n\nONE MOVE BEFORE EOD\n${topJudgment.decision === "Ignore" ? "Mark the ignore items and clean the inbox." : `Follow up on ${topJudgment.decision === "Relationship First" ? "the warm relationship play" : "the top-scored source"}. No half-measures.`}` : "";
    navigator.clipboard.writeText(buildDailyBriefText(brief) + extraSections).then(() => toast.success("Executive brief copied")).catch(() => toast.error("Copy failed"));
  }, [brief, topJudgment]);

  const save = useCallback(() => {
    if (!brief) return;
    recordOutput({ silo: "hmg", siloName: "HMG Master Brand", kind: "max-executive-money-brief", prompt: brief.date, output: brief });
    toast.success("Executive brief saved");
  }, [brief]);

  const openingRead = useMemo(() => {
    if (!items.length) return "The inbox is empty. Submit sources to Max.";
    const priority = items.filter((i) => ["Max Review Drafted", "Founder Review Required"].includes(i.status)).length;
    const seed = new Date().toDateString();
    return priority > 0
      ? `${getMaxOpener("executive-calm", seed)} ${priority} priority move${priority === 1 ? "" : "s"} in the inbox. ${getMaxChasePhrase(seed)}`
      : `${getMaxOpener("founder-reality", seed)} The inbox has ${items.length} item${items.length === 1 ? "" : "s"}. No priority moves yet — run sources through Max.`;
  }, [items]);

  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <p className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Max Daily Executive Money Brief</p>
        </div>
        <div className="flex gap-1.5">
          {generated && !marked && <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={() => setMarked(true)}><CheckCircle2 className="w-3 h-3" />Mark Reviewed</Button>}
          {generated && (
            <>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={copy}><ClipboardCopy className="w-3 h-3" />Copy</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={save}><Save className="w-3 h-3" />Save</Button>
            </>
          )}
          <Button size="sm" className="h-7 text-[10px] font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={generate}><RefreshCw className="w-3 h-3" />{generated ? "Refresh" : "Generate Brief"}</Button>
        </div>
      </div>

      {/* Opening read */}
      <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2.5 mb-3">
        <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-1">Max Opening Read</p>
        <p className="text-[12px] font-semibold text-foreground/90 leading-relaxed">{openingRead}</p>
        {marked && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">✓ Marked Reviewed</p>}
      </div>

      {!brief && (
        <p className="text-[12px] text-muted-foreground">
          {items.length === 0 ? "Submit sources to Max first." : `${items.length} source${items.length === 1 ? "" : "s"} in inbox. Generate your executive brief.`}
        </p>
      )}

      {brief && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Total", value: brief.totalItems },
              { label: "Priority", value: brief.priorityCount },
              { label: "Follow-Ups", value: brief.followUpCount },
              { label: "Ignored", value: brief.ignoreCount },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2 text-center">
                <div className="text-lg font-black text-emerald-400">{value}</div>
                <div className="text-[9px] font-bold uppercase text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {[
            { title: "Today's Money Signal", body: brief.bestSponsorAngle, icon: TrendingUp },
            { title: "Best Opportunity", body: brief.bestSponsorAngle, icon: Briefcase },
            { title: "Best Relationship Play", body: brief.bestRelationshipFollowUp, icon: UserCheck },
            { title: "Best Package Idea", body: brief.bestContentToRevenue, icon: Package },
            { title: "Best Content-to-Money Move", body: brief.bestContentToRevenue, icon: FileText },
            { title: "Best Offline Play", body: brief.bestOfflineMoneyPlay, icon: DollarSign },
            { title: "What to Ignore Today", body: brief.whatToIgnoreToday, icon: XCircle },
            { title: "Founder Time Protection", body: brief.founderNextMove, icon: Eye },
            { title: "Deal Lawyer Warning", body: brief.riskWarning, icon: AlertTriangle },
            { title: "Founder Next Move", body: brief.founderNextMove, icon: Zap },
          ].map(({ title, body, icon: Icon }) => (
            <div key={title} className="flex items-start gap-2 rounded-lg border border-border/30 bg-card/50 px-3 py-2.5">
              <Icon className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{title}</p>
                <p className="text-[12px] text-foreground/80 leading-relaxed mt-0.5">{body}</p>
              </div>
            </div>
          ))}

          {/* One move before lunch / EOD */}
          {topJudgment && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-lg border border-sky-400/20 bg-sky-500/[0.04] px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-sky-600 dark:text-sky-400 mb-1">One Move Before Lunch</p>
                <p className="text-[12px] text-foreground/80 leading-relaxed">{topJudgment.founderEffort === "5-Minute Move" || topJudgment.founderEffort === "15-Minute Move" ? topJudgment.founderNextMove : "Review the top source. Flag it. Set the follow-up."}</p>
              </div>
              <div className="rounded-lg border border-violet-400/20 bg-violet-500/[0.04] px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-violet-600 dark:text-violet-400 mb-1">One Move Before EOD</p>
                <p className="text-[12px] text-foreground/80 leading-relaxed">{topJudgment.decision === "Ignore" ? "Mark the ignore items. Clean the inbox. Protect tomorrow's bandwidth." : topJudgment.decision === "Relationship First" ? "Send the editorial link to the warm contact. That's the relationship move." : `Follow up on the top-scored source. Decision: ${topJudgment.decision}. Don't let it sit.`}</p>
              </div>
            </div>
          )}

          {/* Sports read if applicable */}
          {topJudgment?.sportsRead && (
            <div className="rounded-lg border border-sky-400/20 bg-sky-500/[0.04] px-3 py-2.5">
              <p className="text-[10px] font-black uppercase text-sky-600 dark:text-sky-400 mb-1">Sports Read — {topJudgment.sportsRead.analogy}</p>
              <p className="text-[11px] text-foreground/70">{topJudgment.sportsRead.meaning}</p>
              <p className="text-[11px] font-semibold text-foreground/80 mt-1">Money Lesson: {topJudgment.sportsRead.moneyLesson}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {["Local Max Intelligence", "No Outreach Sent", "No CRM Connected", "Manual Follow-Up Only"].map((t) => <TruthBadge key={t} label={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Founder Commands Tab — 18 commands
// ──────────────────────────────────────────────────────────────────────────────

const ALL_FOUNDER_COMMANDS: Array<{ id: FounderCommand; label: string; description: string }> = [
  { id: "is-this-money-or-noise", label: "Is this money or noise?", description: "Max gives you the honest money/noise read on the top source." },
  { id: "whats-the-sponsor-angle", label: "What's the sponsor angle?", description: "Max surfaces the cleanest sponsor fit from your inbox." },
  { id: "what-should-i-ignore", label: "What should I ignore?", description: "Max tells you what to stop wasting time on." },
  { id: "whats-the-relationship-play", label: "What's the relationship play?", description: "Max identifies the best relationship move in your inbox." },
  { id: "turn-this-into-a-package", label: "Turn this into a package.", description: "Max builds the package structure for the top source." },
  { id: "give-me-the-quick-read", label: "Give me the quick read.", description: "Decision + money type + effort + next move. Mobile-friendly." },
  { id: "what-would-max-do", label: "What would Max do?", description: "Max tells you exactly what move to make." },
  { id: "what-would-max-not-do", label: "What would Max not do?", description: "Max tells you what to avoid." },
  { id: "give-me-the-buffett-read", label: "Give me the Buffett read.", description: "Is this durable? Repeatable? Does it compound?" },
  { id: "give-me-the-deal-lawyer-read", label: "Give me the deal-lawyer read.", description: "Business risk review. Not legal advice." },
  { id: "protect-my-time", label: "Protect my time.", description: "Max tells you what effort this actually requires and when to say no." },
  { id: "make-this-mobile-simple", label: "Make this mobile-simple.", description: "Max gives you the one-line answer for a quick mobile read." },
  { id: "turn-into-weekly-franchise", label: "Turn this into a weekly franchise.", description: "Max builds the franchise structure from the top source." },
  { id: "whats-the-cleanest-moolah-path", label: "What's the cleanest moolah path?", description: "Max maps the fastest, cleanest monetization path." },
  { id: "what-goes-to-webedit", label: "What goes to WebEdit?", description: "Max tells you what content deserves a clip or edit pass." },
  { id: "what-goes-to-social-factory", label: "What goes to Social Factory?", description: "Max identifies the best social amplification angles." },
  { id: "what-should-become-wp-article", label: "What should become a WordPress article?", description: "Max tells you what editorial content earns the publish." },
  { id: "what-should-max-save-for-later", label: "What should Max save for later?", description: "Max identifies what's worth logging but not chasing today." },
];

function FounderCommandsTab({ items }: { items: MaxCROBrief[] }) {
  const [selectedCommand, setSelectedCommand] = useState<FounderCommand | null>(null);
  const [selectedItem, setSelectedItem] = useState<string>("top");
  const [output, setOutput] = useState<string>("");

  const reviewedItems = items.filter((i) => i.review !== null);
  const targetItem = useMemo(() => {
    if (selectedItem === "top") {
      return reviewedItems.sort((a, b) => (b.score?.moneyMoveScore ?? 0) - (a.score?.moneyMoveScore ?? 0))[0] ?? null;
    }
    return reviewedItems.find((i) => i.id === selectedItem) ?? null;
  }, [reviewedItems, selectedItem]);

  const run = useCallback(() => {
    if (!selectedCommand || !targetItem) { toast.error("Select a command and make sure there's a reviewed source"); return; }
    const judgment = runJudgment(targetItem.sourceText, targetItem.signals, targetItem.score?.moneyMoveScore ?? 0);
    const result = runFounderCommand(selectedCommand, judgment, targetItem.sourceText.slice(0, 40));
    setOutput(result);
  }, [selectedCommand, targetItem]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => toast.success("Copied")).catch(() => toast.error("Copy failed"));
  }, [output]);

  const save = useCallback(() => {
    if (!output || !targetItem) return;
    recordOutput({ silo: targetItem.silo, siloName: targetItem.siloName, kind: "max-founder-command", prompt: selectedCommand ?? "command", output: { command: selectedCommand, result: output, sourceText: targetItem.sourceText } });
    toast.success("Command saved to Output History");
  }, [output, targetItem, selectedCommand]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/40 bg-card/30 px-3 py-2.5">
        <p className="text-[11px] text-foreground/70 leading-relaxed">Choose a command. Max runs it against your top source (or the one you select). No model calls. Local intelligence only.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Source</label>
        <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} className="w-full h-9 text-[12px] px-2.5 rounded-lg border border-input bg-card text-foreground">
          <option value="top">Top-scored source (default)</option>
          {reviewedItems.map((i) => <option key={i.id} value={i.id}>{i.sourceText.slice(0, 60)}{i.sourceText.length > 60 ? "…" : ""}</option>)}
        </select>
        {reviewedItems.length === 0 && <p className="text-[10px] text-amber-600 dark:text-amber-400">No reviewed sources yet. Send sources through Max first.</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ALL_FOUNDER_COMMANDS.map(({ id, label, description }) => (
          <button key={id} type="button" onClick={() => setSelectedCommand(id)}
            className={`text-left rounded-lg border p-3 transition-colors ${selectedCommand === id ? "border-emerald-400/50 bg-emerald-500/10" : "border-border/50 bg-card/50 hover:bg-card"}`}>
            <p className="text-[11.5px] font-bold text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-snug">{description}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={run} disabled={!selectedCommand || !targetItem} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold">
          <Zap className="w-4 h-4" />Run Command
        </Button>
        {output && (
          <>
            <Button size="sm" variant="outline" className="h-9 text-[10px] font-bold gap-1" onClick={copy}><ClipboardCopy className="w-3 h-3" />Copy</Button>
            <Button size="sm" variant="outline" className="h-9 text-[10px] font-bold gap-1" onClick={save}><Save className="w-3 h-3" />Save</Button>
          </>
        )}
      </div>

      {output && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/[0.05] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Max Says — Local Max Intelligence</p>
          </div>
          <p className="text-[13px] text-foreground/90 leading-relaxed">{output}</p>
          <div className="flex flex-wrap gap-1 mt-3">
            {["Local Max Intelligence", "No Fake AI Response", "Founder Review Required"].map((t) => <TruthBadge key={t} label={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Content → Money Tab — upgraded (13 types, all new fields)
// ──────────────────────────────────────────────────────────────────────────────

function ContentToMoneyTab() {
  const [inputText, setInputText] = useState("");
  const [inputType, setInputType] = useState<ContentInputType>("breaking-story");
  const [result, setResult] = useState<ReturnType<typeof translateContentToMoney> | null>(null);

  const translate = useCallback(() => {
    if (!inputText.trim()) { toast.error("Paste a content idea first"); return; }
    setResult(translateContentToMoney(inputText.trim(), inputType));
  }, [inputText, inputType]);

  const copy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(buildContentToMoneyText(result)).then(() => toast.success("Copied")).catch(() => toast.error("Copy failed"));
  }, [result]);

  const save = useCallback(() => {
    if (!result) return;
    recordOutput({ silo: "hmg", siloName: "HMG Master Brand", kind: "max-content-to-money", prompt: result.whatTheContentIs.slice(0, 100), output: result });
    toast.success("Saved to Output History");
  }, [result]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/40 bg-card/30 px-3 py-2.5">
        <p className="text-[11px] text-foreground/70 leading-relaxed">Paste any content idea. Max tells you the money move, sponsor angle, package structure, and routing for 13 content types.</p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Content Type</label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_INPUT_TYPES.map(({ type, label }) => (
              <button key={type} type="button" onClick={() => setInputType(type)}
                className={`h-8 px-3 text-[10px] font-bold uppercase tracking-wide rounded-lg border transition-colors ${inputType === type ? "bg-emerald-600 text-white border-emerald-600" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">Content Idea or Source</label>
          <Textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste an article idea, source note, social post, video concept, interview angle, or event idea." className="min-h-[80px] text-[13px] resize-y" />
        </div>

        <Button onClick={translate} disabled={!inputText.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold">
          <TrendingUp className="w-4 h-4" />Turn Content Into Money
        </Button>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Max Content-to-Money — {result.inputTypeName}</p>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={copy}><ClipboardCopy className="w-3 h-3" />Copy</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={save}><Save className="w-3 h-3" />Save</Button>
            </div>
          </div>

          {result.warningFlags.length > 0 && (
            <div className="space-y-1.5">
              {result.warningFlags.map((f) => (
                <div key={f} className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-500/[0.05] px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-snug">{f}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mb-1">
            <span className="text-[9px] font-bold text-muted-foreground">Verticals:</span>
            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{result.primaryVertical}</span>
            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground">{result.secondaryVertical}</span>
          </div>

          <div className="space-y-2">
            {[
              { label: "What the Content Is", body: result.whatTheContentIs },
              { label: "Who the Audience Is", body: result.whoTheAudienceIs },
              { label: "Sponsor Type", body: `${result.sponsorType} (Category: ${result.sponsorCategory})` },
              { label: "Package Idea", body: result.packageIdea },
              { label: "Asset to Create", body: result.assetToCreate },
              { label: "Clip / Social Angle", body: result.clipSocialAngle },
              { label: "WP / Newsletter Angle", body: result.wpNewsletterAngle },
              { label: "Relationship Angle", body: result.relationshipAngle },
              { label: "Follow-Up Angle", body: result.followUpAngle },
              { label: "Risk Note", body: result.riskNote },
              { label: "What Not to Sell", body: result.whatNotToSell },
            ].map(({ label, body }) => (
              <div key={label} className="rounded-lg border border-border/30 bg-card/50 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-0.5">{label}</p>
                <p className="text-[12px] text-foreground/80 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-sky-400/25 bg-sky-500/[0.05] px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wide text-sky-600 dark:text-sky-400 mb-1">One-Line Pitch Starter</p>
            <p className="text-[13px] font-bold text-foreground/90 italic">"{result.oneLinePitchStarter}"</p>
          </div>

          <div className="flex flex-wrap gap-1">
            {["Local Max Intelligence", "No Outreach Sent", "No CRM Connected"].map((t) => <TruthBadge key={t} label={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Founder Context Tab — upgraded (12 areas, 5 labels, copy fill-in prompts)
// ──────────────────────────────────────────────────────────────────────────────

function FounderContextTab() {
  const { context, quality, update, addToList, removeFromList, reset } = useFounderContext();
  const [newItem, setNewItem] = useState<Record<string, string>>({});
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  const qs = QUALITY_COLORS[quality.label];

  return (
    <div className="space-y-4">
      {/* Context Quality Panel */}
      <div className={`rounded-xl border p-4 space-y-3 ${qs}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Max Context Quality</p>
            <p className={`text-xl font-black ${qs}`}>{quality.label}</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-black ${qs}`}>{quality.score}/{quality.maxScore}</p>
            <p className="text-[9px] text-muted-foreground font-bold uppercase">Score</p>
          </div>
        </div>

        {quality.overallCopyPrompt && (
          <div className="rounded-lg border border-border/30 bg-card/40 px-3 py-2">
            <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Max Needs</p>
            <p className="text-[11px] text-foreground/70 leading-relaxed">{quality.overallCopyPrompt}</p>
          </div>
        )}

        <div>
          <p className="text-[9px] font-black uppercase text-muted-foreground mb-1.5">Context Areas ({quality.areas.filter((a) => a.filled).length}/{quality.areas.length} filled)</p>
          <div className="space-y-1">
            {quality.areas.map((area) => (
              <button key={area.id} type="button" onClick={() => setExpandedArea((p) => p === area.id ? null : area.id)}
                className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${area.filled ? "border-emerald-400/25 bg-emerald-500/[0.04]" : "border-border/30 bg-card/30 hover:bg-card/60"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${area.filled ? "text-emerald-500" : "text-muted-foreground/40"}`}>{area.filled ? "✓" : "○"}</span>
                    <span className="text-[11px] font-bold">{area.label}</span>
                    <span className="text-[9px] text-muted-foreground">({area.weight}pts)</span>
                  </div>
                  {expandedArea === area.id ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                </div>
                {expandedArea === area.id && (
                  <div className="mt-2 space-y-1.5 border-t border-border/20 pt-2 text-[10px] text-foreground/70">
                    {area.filled ? (
                      <p className="text-emerald-600 dark:text-emerald-400">{area.whatMaxKnows}</p>
                    ) : (
                      <>
                        <p><strong>What Max needs:</strong> {area.whatMaxNeeds}</p>
                        <p><strong>Why it matters:</strong> {area.whyItMatters}</p>
                        {area.howToImprove && <p><strong>How to improve:</strong> {area.howToImprove}</p>}
                        {area.copyFillPrompt && (
                          <div className="rounded border border-amber-400/25 bg-amber-500/[0.06] px-2 py-1.5 mt-1">
                            <p className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 mb-0.5">Copy Fill-In Prompt</p>
                            <p className="italic text-foreground/60">{area.copyFillPrompt}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/60">Founder context is stored locally. No CRM or cloud sync connected yet.</p>

      {/* List fields */}
      {[
        { label: "Preferred Sponsor Categories", field: "preferredSponsorCategories" as const, placeholder: "e.g. music-tech, streetwear, local-LA" },
        { label: "No-Go Categories", field: "noGoCategories" as const, placeholder: "e.g. payday loans, political campaigns" },
        { label: "Vertical Priorities", field: "verticalPriorities" as const, placeholder: "e.g. HipHopHaven, MusicHaven" },
        { label: "Content Franchise Ideas", field: "contentFranchiseIdeas" as const, placeholder: "e.g. Weekly artist spotlight series" },
        { label: "Past Wins", field: "pastWins" as const, placeholder: "e.g. Music-tech sponsor deal for DX" },
        { label: "Ignore List", field: "ignoredCategories" as const, placeholder: "e.g. gossip-only drama stories" },
      ].map(({ label, field, placeholder }) => (
        <div key={field} className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wide text-foreground/80">{label}</p>
          {(context[field] as string[]).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(context[field] as string[]).map((val) => (
                <span key={val} className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-border bg-secondary text-foreground/70">
                  {val}
                  <button type="button" onClick={() => removeFromList(field, val)} className="text-muted-foreground hover:text-destructive ml-0.5">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={newItem[field] ?? ""}
              onChange={(e) => setNewItem((p) => ({ ...p, [field]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter" && (newItem[field] ?? "").trim()) { addToList(field, newItem[field]!); setNewItem((p) => ({ ...p, [field]: "" })); }}}
              placeholder={placeholder}
              className="flex-1 h-8 text-[12px] px-2.5 rounded-md border border-border bg-card text-foreground"
            />
            <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold" onClick={() => { if ((newItem[field] ?? "").trim()) { addToList(field, newItem[field]!); setNewItem((p) => ({ ...p, [field]: "" })); }}}>Add</Button>
          </div>
        </div>
      ))}

      {/* Text fields */}
      {[
        { label: "Money Philosophy", field: "moneyPhilosophy" as const, placeholder: "e.g. Relationship money over cold pitch. Package over one-off.", rows: 2 },
        { label: "Pricing Notes", field: "pricingNotes" as const, placeholder: "e.g. Minimum $500 for sponsored articles. Retainer minimum $2k/month.", rows: 2 },
        { label: "Preferred Deal Style", field: "preferredDealStyle" as const, placeholder: "e.g. Retainer preferred. Project deals ok.", rows: 1 },
        { label: "Relationship Notes", field: "relationshipNotes" as const, placeholder: "e.g. Warm lanes with hip-hop publicists from prior editorial coverage.", rows: 2 },
        { label: "Reputation Rules", field: "reputationRules" as const, placeholder: "e.g. No beef content without editorial purpose. No outing.", rows: 2 },
        { label: "Time Protection Rules", field: "timeProtectionRules" as const, placeholder: "e.g. Cold outreach should be filtered before reaching Founder.", rows: 1 },
        { label: "Repeated Work to Avoid", field: "repeatedWorkToAvoid" as const, placeholder: "e.g. Re-briefing the same sponsor category every month.", rows: 1 },
        { label: "Founder Review Style", field: "founderReviewStyle" as const, placeholder: "e.g. Top 3 bullets. Mobile-ready. Decision point clear.", rows: 1 },
        { label: "Voice Preferences", field: "voicePreferences" as const, placeholder: "e.g. Direct, executive, AAVE welcome, no corporate fluff", rows: 1 },
      ].map(({ label, field, rows }) => (
        <div key={field} className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-wide text-foreground/80">{label}</p>
          {rows > 1 ? (
            <Textarea value={(context[field] as string) ?? ""} onChange={(e) => update({ [field]: e.target.value })} placeholder="" className={`min-h-[${rows * 32}px] text-[12px] resize-none`} />
          ) : (
            <input value={(context[field] as string) ?? ""} onChange={(e) => update({ [field]: e.target.value })} className="w-full h-8 text-[12px] px-2.5 rounded-md border border-border bg-card text-foreground" />
          )}
        </div>
      ))}

      <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { if (confirm("Reset Founder Context to defaults?")) reset(); }}>
        Reset to Defaults
      </Button>

      <div className="flex flex-wrap gap-1">
        {["Local Storage Only", "No CRM Connected", "No Cloud Sync"].map((t) => <TruthBadge key={t} label={t} />)}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Memory Status Panel
// ──────────────────────────────────────────────────────────────────────────────

function MemoryStatusPanel() {
  const { quality } = useFounderContext();
  const BORDER: Record<ContextQualityLabel, string> = {
    Empty: "border-amber-500/25 bg-amber-500/[0.04]",
    Basic: "border-amber-500/25 bg-amber-500/[0.04]",
    Useful: "border-sky-500/25 bg-sky-500/[0.04]",
    Strong: "border-emerald-500/25 bg-emerald-500/[0.04]",
    Sharp: "border-emerald-400/30 bg-emerald-400/[0.06]",
  };
  const ICON_COLOR: Record<ContextQualityLabel, string> = {
    Empty: "text-amber-400", Basic: "text-amber-400", Useful: "text-sky-400",
    Strong: "text-emerald-400", Sharp: "text-emerald-300",
  };

  return (
    <div className={`rounded-xl border p-3 flex items-start gap-3 ${BORDER[quality.label]}`}>
      <Brain className={`w-4 h-4 shrink-0 mt-0.5 ${ICON_COLOR[quality.label]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wider mb-0.5 text-foreground/80">Max Context — {quality.label} ({quality.score}/{quality.maxScore})</p>
        <p className="text-[11px] text-foreground/60 leading-relaxed">
          {quality.label === "Sharp" ? "Max has sharp Founder context. Recommendations are precise and founder-native."
            : quality.label === "Strong" ? "Strong context loaded. Max recommendations are solid."
            : quality.label === "Useful" ? "Decent context. Add pricing and relationship notes to sharpen Max further."
            : "Max context is thin. Open Founder Context tab to add sponsor prefs, no-go categories, and pricing notes."}
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sponsor Category Browser
// ──────────────────────────────────────────────────────────────────────────────

function SponsorCategoryBrowser({ items }: { items: MaxCROBrief[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const suggested = useMemo(() => {
    if (!items.length) return SPONSOR_CATEGORIES.slice(0, 6);
    const matched = getCategoriesForText(items.map((i) => i.sourceText).join(" "));
    return matched.length > 0 ? matched : SPONSOR_CATEGORIES.slice(0, 6);
  }, [items]);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">{items.length > 0 ? "Sponsor categories matched to your current inbox." : "Submit sources to Max first for personalized matches."}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggested.map((c) => (
          <button key={c.id} type="button" onClick={() => setSelected(selected === c.id ? null : c.id)} className="text-left rounded-lg border border-border/50 bg-card/50 hover:bg-card p-3 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Tag className="w-3 h-3 text-sky-500 shrink-0" />
                <span className="text-[11.5px] font-bold">{c.name}</span>
              </div>
              {selected === c.id ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-1 line-clamp-1">{c.bestVerticals.join(", ")}</p>
            {selected === c.id && (
              <div className="mt-2 space-y-1.5 border-t border-border/30 pt-2 text-[11px]">
                <p><strong>Pitch Angle:</strong> <span className="text-foreground/70">{c.pitchAngle}</span></p>
                <p><strong>Content Fit:</strong> <span className="text-foreground/70">{c.contentFit}</span></p>
                <p><strong className="text-amber-600">Risk:</strong> <span className="text-foreground/70">{c.riskNotes}</span></p>
                <p><strong className="text-destructive/70">Avoid saying:</strong> <span className="text-foreground/70">{c.whatNotToSay}</span></p>
                <div className="flex gap-1 mt-1">{["No Real Contacts", "Local Max Intelligence"].map((t) => <TruthBadge key={t} label={t} />)}</div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// War Room Tab Config
// ──────────────────────────────────────────────────────────────────────────────

const WAR_ROOM_TABS: { id: WarRoomTab; label: string; icon: React.ElementType }[] = [
  { id: "quick", label: "Quick Read", icon: Zap },
  { id: "intake", label: "Source Intake", icon: Send },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "priority", label: "Priority", icon: TrendingUp },
  { id: "commands", label: "Max Cmds", icon: Brain },
  { id: "content", label: "Content → $", icon: DollarSign },
  { id: "followups", label: "Follow-Ups", icon: UserCheck },
  { id: "sponsors", label: "Sponsors", icon: Tag },
  { id: "offline", label: "Offline", icon: DollarSign },
  { id: "ignore", label: "Ignore", icon: XCircle },
  { id: "founder", label: "Founder Review", icon: Eye },
  { id: "context", label: "Founder Context", icon: BookMarked },
];

// ──────────────────────────────────────────────────────────────────────────────
// Main View
// ──────────────────────────────────────────────────────────────────────────────

export function MaxCROInboxView() {
  const { items, submit, runMax, setStatus, remove } = useMaxCROInbox();
  const followUpTracker = useMaxFollowUpTracker();
  const [tab, setTab] = useState<WarRoomTab>("quick");
  const [sourceText, setSourceText] = useState("");
  const [silo, setSilo] = useState("hmg");
  const [founderNote, setFounderNote] = useState("");
  const [revenuePreview, setRevenuePreview] = useState<string[]>([]);

  const siloName = SILO_OPTIONS.find((s) => s.id === silo)?.name ?? "HMG Master Brand";

  const reviewed = useMemo(() => items.filter((i) => i.review !== null), [items]);
  const priorityItems = useMemo(
    () => reviewed.filter((i) => (i.score?.moneyMoveScore ?? 0) >= 50 || ["Max Review Drafted", "Founder Review Required"].includes(i.status)),
    [reviewed],
  );
  const followUpItems = useMemo(() => items.filter((i) => i.status === "Relationship Follow-Up Needed"), [items]);
  const ignoreItems = useMemo(() => items.filter((i) => i.status === "Ignore / No Money Move"), [items]);
  const founderItems = useMemo(() => items.filter((i) => i.status === "Founder Review Required"), [items]);
  const offlineItems = useMemo(
    () => reviewed.filter((i) => i.review?.offlineMoneyPlay && i.status !== "Ignore / No Money Move"),
    [reviewed],
  );

  const tabCounts: Partial<Record<WarRoomTab, number>> = {
    quick: items.length,
    inbox: items.length,
    priority: priorityItems.length,
    followups: followUpTracker.needsFollowUp.length + followUpItems.length,
    offline: offlineItems.length,
    ignore: ignoreItems.length,
    founder: founderItems.length,
  };

  const handleSourceChange = useCallback((text: string) => {
    setSourceText(text);
    setRevenuePreview(text.length > 20 ? detectRevenueSignals(text) : []);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!sourceText.trim()) { toast.error("Paste a source or tip first"); return; }
    const item = submit({ sourceText: sourceText.trim(), silo, siloName, founderNote });
    if (item) {
      if (hasRevenueSignal(item.sourceText)) {
        toast.success("Revenue signals detected — routed to Max");
        setTab("inbox");
      } else {
        toast.info("No revenue signal — logged as No Money Move");
        setTab("ignore");
      }
    }
    setSourceText(""); setFounderNote(""); setRevenuePreview([]);
  }, [sourceText, silo, siloName, founderNote, submit]);

  const handleSendToMax = useCallback((id: string) => { runMax(id); toast.success("Max review complete"); }, [runMax]);

  const renderTabContent = () => {
    switch (tab) {
      case "quick":
        return (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/40 bg-card/30 px-3 py-2">
              <p className="text-[11px] text-foreground/70">Quick reads — decision, confidence, risk, what not to do. Mobile-first. One tap to act.</p>
            </div>
            {items.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-border/50">
                <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] font-bold text-muted-foreground">No sources in Max yet</p>
                <Button size="sm" variant="outline" className="mt-3 gap-1 text-[10px] font-bold uppercase" onClick={() => setTab("intake")}><Send className="w-3 h-3" />Go to Source Intake</Button>
              </div>
            ) : (
              items.map((item) => <QuickReadCard key={item.id} item={item} onSendToMax={handleSendToMax} onSetStatus={setStatus} />)
            )}
          </div>
        );

      case "intake":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Source or Tip</label>
              <Textarea value={sourceText} onChange={(e) => handleSourceChange(e.target.value)} placeholder="Paste a source, tip, article excerpt, social post, event notice, or any text that could contain a revenue signal." className="min-h-[100px] text-[13px] resize-y" />
              {revenuePreview.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Revenue signals:</span>
                  {revenuePreview.map((s) => <span key={s} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-700 dark:text-emerald-300">{s}</span>)}
                </div>
              )}
              {sourceText.length > 20 && revenuePreview.length === 0 && <p className="text-[10px] text-muted-foreground/70">No revenue signals — will log as No Money Move.</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Brand / Silo</label>
                <select value={silo} onChange={(e) => setSilo(e.target.value)} className="w-full h-9 text-[12px] px-2.5 rounded-lg border border-input bg-card text-foreground">
                  {SILO_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Founder Note</label>
                <input value={founderNote} onChange={(e) => setFounderNote(e.target.value)} placeholder="Any context Max should know" className="w-full h-9 text-[12px] px-2.5 rounded-lg border border-input bg-card text-foreground" />
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={!sourceText.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold"><Send className="w-4 h-4" />Submit to Max</Button>
            <MemoryStatusPanel />
          </div>
        );

      case "inbox":
        return (
          <div className="space-y-3">
            <DailyExecutiveBriefPanel items={items} />
            {items.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-border/50">
                <Inbox className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] font-bold text-muted-foreground">Revenue Inbox is empty</p>
                <Button size="sm" variant="outline" className="mt-3 gap-1 text-[10px] font-bold uppercase" onClick={() => setTab("intake")}><Send className="w-3 h-3" />Go to Source Intake</Button>
              </div>
            ) : (
              items.map((item) => <CROItemCard key={item.id} item={item} onSendToMax={handleSendToMax} onSetStatus={setStatus} onRemove={remove} showPackage />)
            )}
          </div>
        );

      case "priority":
        return (
          <div className="space-y-3">
            {priorityItems.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-border/50">
                <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] font-bold text-muted-foreground">No priority moves yet</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Send sources through Max to surface high-score opportunities.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/[0.04] px-3 py-2">
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">Score ≥ 50 or flagged as priority. Founder review before any action.</p>
                </div>
                {priorityItems.map((item) => <CROItemCard key={item.id} item={item} onSendToMax={handleSendToMax} onSetStatus={setStatus} onRemove={remove} showPackage />)}
              </>
            )}
          </div>
        );

      case "commands":
        return <FounderCommandsTab items={items} />;

      case "content":
        return <ContentToMoneyTab />;

      case "followups":
        return (
          <div className="space-y-3">
            <AddFollowUpForm onAdd={() => toast.success("Follow-up logged")} />
            {followUpTracker.needsFollowUp.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 mb-2">Needs Follow-Up ({followUpTracker.needsFollowUp.length})</p>
                <div className="space-y-2">{followUpTracker.needsFollowUp.map((i) => <FollowUpCard key={i.id} item={i} onSetStatus={followUpTracker.setStatus} onRemove={followUpTracker.remove} />)}</div>
              </div>
            )}
            {followUpItems.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 mb-2">From Revenue Inbox ({followUpItems.length})</p>
                <div className="space-y-2">{followUpItems.map((i) => <CROItemCard key={i.id} item={i} onSendToMax={handleSendToMax} onSetStatus={setStatus} onRemove={remove} />)}</div>
              </div>
            )}
            {followUpTracker.items.length === 0 && followUpItems.length === 0 && (
              <div className="text-center py-10 rounded-xl border border-dashed border-border/50">
                <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] font-bold text-muted-foreground">No follow-ups logged yet</p>
              </div>
            )}
            <div className="flex flex-wrap gap-1 pt-2">{["Manual Follow-Up Only", "No Email Sent", "No CRM Connected"].map((t) => <TruthBadge key={t} label={t} />)}</div>
          </div>
        );

      case "sponsors":
        return <SponsorCategoryBrowser items={items} />;

      case "offline":
        return (
          <div className="space-y-3">
            {offlineItems.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-border/50">
                <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] font-bold text-muted-foreground">No offline money plays yet</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-amber-400/25 bg-amber-500/[0.04] px-3 py-2">
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">Events, interviews, venue activations, consulting, panels, pop-ups, merch.</p>
                </div>
                {offlineItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/50 bg-card p-3">
                    <p className="text-[12px] font-bold leading-snug mb-1">{item.sourceText}</p>
                    <p className="text-[10px] text-muted-foreground mb-2">{item.siloName}</p>
                    {item.review && (
                      <div className="rounded-lg border border-amber-400/20 bg-amber-500/[0.04] px-3 py-2 mb-2">
                        <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 mb-1">Offline Money Play</p>
                        <p className="text-[12px] text-foreground/80 leading-relaxed">{item.review.offlineMoneyPlay}</p>
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={() => { navigator.clipboard.writeText(item.review?.offlineMoneyPlay ?? "").then(() => toast.success("Copied")); }}><ClipboardCopy className="w-3 h-3" />Copy</Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1" onClick={() => setStatus(item.id, "Founder Review Required")}><Eye className="w-3 h-3" />Founder Review</Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        );

      case "ignore":
        return (
          <div className="space-y-3">
            {ignoreItems.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-border/50">
                <XCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] font-bold text-muted-foreground">Nothing marked as ignore</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-border/40 bg-secondary/30 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground font-semibold">Ignore the noise here. Don't revisit unless the situation changes materially.</p>
                </div>
                {ignoreItems.map((item) => <CROItemCard key={item.id} item={item} onSendToMax={handleSendToMax} onSetStatus={setStatus} onRemove={remove} />)}
              </>
            )}
          </div>
        );

      case "founder":
        return (
          <div className="space-y-3">
            {founderItems.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-border/50">
                <Eye className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] font-bold text-muted-foreground">No items pending Founder Review</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-sky-400/25 bg-sky-500/[0.04] px-3 py-2">
                  <p className="text-[11px] text-sky-700 dark:text-sky-300 font-semibold">Founder decision required. High upside. No action before Founder sign-off.</p>
                </div>
                {founderItems.map((item) => <CROItemCard key={item.id} item={item} onSendToMax={handleSendToMax} onSetStatus={setStatus} onRemove={remove} showPackage />)}
              </>
            )}
          </div>
        );

      case "context":
        return <FounderContextTab />;

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 lg:px-6 py-5 gap-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Maximillion · Black Money Brain / Founder OS</span>
          <h1 className="text-xl font-black leading-tight">Max CRO War Room</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Source Intake → Revenue Signal → Judgment → Moolah Path → Founder Action</p>
        </div>
      </div>

      {/* Max Is / Is Not */}
      <div className="rounded-xl border border-border/50 bg-card/30 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">Max Is / Max Is Not</p>
        <div className="flex flex-wrap gap-1.5">
          {["✓ CRO / Revenue Operator", "✓ Founder OS Companion", "✓ Black Money Brain", "✓ Relationship Strategist", "✓ Content-to-Revenue Translator", "✓ Moolah Path Scout"].map((t) => (
            <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">{t}</span>
          ))}
          {["✗ No fake CRM", "✗ No fake email", "✗ No fake deals", "✗ No fake AI chat", "✗ No fake outreach"].map((t) => (
            <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border text-muted-foreground">{t}</span>
          ))}
        </div>
      </div>

      {/* Truth labels */}
      <div className="flex flex-wrap gap-1.5">
        {["Local Max Intelligence", "Founder Review Required", "No Outreach Sent", "No CRM Connected", "No Fake Deal Status", "Future Old Soldier/Ollama Hook Pending"].map((t) => <TruthBadge key={t} label={t} />)}
      </div>

      {/* Tab Bar */}
      <div className="flex overflow-x-auto gap-0.5 rounded-xl border border-border/50 bg-secondary/30 p-1 shrink-0 scrollbar-none">
        {WAR_ROOM_TABS.map(({ id, label, icon: Icon }) => {
          const count = tabCounts[id];
          return (
            <button key={id} type="button" onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors shrink-0 ${tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"}`}>
              <Icon className="w-3 h-3" />
              {label}
              {count !== undefined && count > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${tab === id ? "bg-emerald-600 text-white" : "bg-secondary text-muted-foreground"}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1">{renderTabContent()}</div>
    </div>
  );
}
