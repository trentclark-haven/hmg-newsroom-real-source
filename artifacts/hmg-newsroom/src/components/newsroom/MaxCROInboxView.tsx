/**
 * Max CRO War Room — Full Revenue Intelligence Dashboard.
 *
 * Max is: CRO / Founder OS, revenue operator, sponsor/partnership thinker,
 * relationship follow-up tracker, offline money scout, content-to-revenue strategist.
 *
 * Max is NOT: article editor, graphics tool, WebEdit, Social Factory, ARTBOT,
 * fake CRM, fake email sender, fake outreach tool, fake AI.
 *
 * Truth labels on all output:
 *   Local CRO Review | Founder Review Required | No Outreach Sent |
 *   No CRM Connected | Manual Follow-Up Only | Future Relationship Database Hook Pending
 */
import React, { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowRight,
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
  Inbox,
  Lock,
  Megaphone,
  Package,
  Plus,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { useMaxCROInbox } from "@/lib/useMaxCROInbox";
import {
  hasRevenueSignal,
  detectRevenueSignals,
  buildCROBriefText,
} from "@/lib/hmg/haven-ai/maxCROEngine";
import type { MaxCROBrief, CROStatus } from "@/lib/hmg/haven-ai/maxCROEngine";
import { computeRevenueScore, scoreLabelBg } from "@/lib/hmg/haven-ai/maxRevenueScoring";
import type { RevenueScoreLabel } from "@/lib/hmg/haven-ai/maxRevenueScoring";
import { generateDailyBrief, buildDailyBriefText } from "@/lib/hmg/haven-ai/maxDailyBrief";
import {
  generateContentPackage,
  buildPackageText,
  ALL_PACKAGE_TYPES,
} from "@/lib/hmg/haven-ai/maxContentPackages";
import type { ContentPackageType } from "@/lib/hmg/haven-ai/maxContentPackages";
import {
  SPONSOR_CATEGORIES,
  getCategoriesForText,
} from "@/lib/hmg/haven-ai/maxSponsorCategories";
import {
  useMaxFollowUpTracker,
  buildFollowUpBriefText,
  type FollowUpStatus,
  type RelationshipType,
} from "@/lib/useMaxFollowUpTracker";
import { recordOutput } from "@/lib/useOutputHistory";
import { verticals } from "@/lib/mock-data";

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
  | "intake"
  | "inbox"
  | "priority"
  | "followups"
  | "sponsors"
  | "offline"
  | "ignore"
  | "founder";

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

function ScoreBreakdown({ score }: { score: MaxCROBrief["score"] }) {
  if (!score) return null;
  return (
    <div className="pt-2 space-y-1.5">
      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
        Revenue Score Breakdown — Local Brain
      </p>
      <p className="text-[12px] text-foreground/80 leading-relaxed">{score.breakdown}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
        {score.dimensions.map((d) => (
          <div key={d.name} className="flex items-start gap-2 rounded-lg border border-border/30 bg-card/40 px-2.5 py-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-foreground/80">{d.name}</span>
                <span className={`text-[11px] font-black ${d.score >= 7 ? "text-emerald-500" : d.score >= 5 ? "text-amber-500" : "text-muted-foreground"}`}>{d.score}/10</span>
              </div>
              <p className="text-[10px] text-muted-foreground/80 leading-snug mt-0.5">{d.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
        Max CRO Review — Local Brain Active
      </p>
      {sections.map((s) => {
        const Icon = s.icon;
        const open = expanded === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setExpanded(open ? null : s.id)}
            className="w-full text-left p-2.5 rounded-lg border border-border/40 bg-card/50 hover:bg-card transition-colors"
          >
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

function PackageBuilder({
  item,
  onSave,
}: {
  item: MaxCROBrief;
  onSave: (pkg: ReturnType<typeof generateContentPackage>) => void;
}) {
  const [selectedType, setSelectedType] = useState<ContentPackageType>("sponsored-article");
  const [pkg, setPkg] = useState<ReturnType<typeof generateContentPackage> | null>(null);
  const [open, setOpen] = useState(false);

  const generate = useCallback(() => {
    const p = generateContentPackage({ sourceId: item.id, sourceText: item.sourceText, silo: item.silo, packageType: selectedType });
    setPkg(p);
    setOpen(true);
  }, [item, selectedType]);

  const copy = useCallback(() => {
    if (!pkg) return;
    navigator.clipboard.writeText(buildPackageText(pkg)).then(() => toast.success("Package copied")).catch(() => toast.error("Copy failed"));
  }, [pkg]);

  return (
    <div className="pt-2 border-t border-border/30">
      <p className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-2">Content Package Builder</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as ContentPackageType)}
          className="h-7 text-[10px] font-bold uppercase tracking-wide px-2 rounded-md border border-border bg-card text-foreground"
        >
          {ALL_PACKAGE_TYPES.map((t) => (
            <option key={t.type} value={t.type}>{t.label}</option>
          ))}
        </select>
        <Button size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1 bg-sky-600 hover:bg-sky-700 text-white" onClick={generate}>
          <Package className="w-3 h-3" />
          Generate Package
        </Button>
        {pkg && (
          <>
            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1" onClick={copy}>
              <ClipboardCopy className="w-3 h-3" />
              Copy Package
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1"
              onClick={() => {
                onSave(pkg);
                recordOutput({ silo: item.silo, siloName: item.siloName, kind: "max-revenue-package", prompt: item.sourceText.slice(0, 100), output: pkg });
                toast.success("Package saved to Output History");
              }}
            >
              <Save className="w-3 h-3" />
              Save Package
            </Button>
          </>
        )}
      </div>
      {open && pkg && (
        <div className="rounded-lg border border-sky-400/30 bg-sky-500/[0.04] p-3 space-y-1.5">
          <p className="text-[11px] font-black text-sky-600 dark:text-sky-400">{pkg.packageName}</p>
          <p className="text-[11px] text-foreground/80 leading-relaxed"><strong>What gets made:</strong> {pkg.whatGetsMade}</p>
          <p className="text-[11px] text-foreground/80 leading-relaxed"><strong>Who it helps:</strong> {pkg.whoItHelps}</p>
          <p className="text-[11px] text-foreground/80 leading-relaxed"><strong>Why a sponsor cares:</strong> {pkg.whySponsorCares}</p>
          <p className="text-[11px] text-foreground/80 leading-relaxed"><strong>Founder work:</strong> {pkg.founderWorkRequired}</p>
          <div className="rounded border border-sky-400/20 bg-sky-500/[0.06] p-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-sky-600 dark:text-sky-400 mb-1">Copy Pitch Starter</p>
            <p className="text-[11px] text-foreground/80 leading-relaxed italic">{pkg.copyPitchStarter}</p>
          </div>
          <p className="text-[10px] text-destructive/70 leading-snug"><strong>Avoid:</strong> {pkg.whatToAvoid}</p>
          <div className="flex flex-wrap gap-1 pt-1">
            {["Local CRO Review", "No Outreach Sent", "No CRM Connected"].map((t) => <TruthBadge key={t} label={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function CROItemCard({
  item,
  onSendToMax,
  onSetStatus,
  onRemove,
  showPackage = false,
}: {
  item: MaxCROBrief;
  onSendToMax: (id: string) => void;
  onSetStatus: (id: string, status: CROStatus) => void;
  onRemove: (id: string) => void;
  showPackage?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [savedPkg, setSavedPkg] = useState<ReturnType<typeof generateContentPackage> | null>(null);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(buildCROBriefText(item))
      .then(() => toast.success("Brief copied"))
      .catch(() => toast.error("Copy failed"));
  }, [item]);

  const saveToHistory = useCallback(() => {
    recordOutput({
      silo: item.silo,
      siloName: item.siloName,
      kind: "max-cro-brief",
      prompt: item.sourceText.slice(0, 100),
      output: item,
    });
    onSetStatus(item.id, "Saved to Output History");
    toast.success("Saved to Output History");
  }, [item, onSetStatus]);

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold leading-snug text-foreground line-clamp-2">{item.sourceText}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {item.siloName} · {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
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
            {item.signals.slice(0, 6).map((s) => (
              <span key={s} className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">{s}</span>
            ))}
            {item.signals.length > 6 && <span className="text-[9px] text-muted-foreground">+{item.signals.length - 6} more</span>}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mt-2">
          {item.status === "Revenue Review Needed" && (
            <Button size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => onSendToMax(item.id)}>
              <Send className="w-3 h-3" />
              Send to Max
            </Button>
          )}
          {item.review && (
            <>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1" onClick={copy}>
                <ClipboardCopy className="w-3 h-3" />
                Copy Brief
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1" onClick={saveToHistory}>
                <Save className="w-3 h-3" />
                Save
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1" onClick={() => onSetStatus(item.id, "Founder Review Required")}>
                <Eye className="w-3 h-3" />
                Founder Review
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1" onClick={() => onSetStatus(item.id, "Relationship Follow-Up Needed")}>
                <UserCheck className="w-3 h-3" />
                Mark Follow-Up
              </Button>
              {item.score && (
                <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1 text-muted-foreground" onClick={() => setShowScore((p) => !p)}>
                  <Zap className="w-3 h-3" />
                  {showScore ? "Hide Score" : "Score Details"}
                </Button>
              )}
            </>
          )}
          {item.status !== "Ignore / No Money Move" && (
            <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1 text-muted-foreground" onClick={() => onSetStatus(item.id, "Ignore / No Money Move")}>
              <XCircle className="w-3 h-3" />
              Ignore
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-[10px] text-destructive/70 hover:text-destructive gap-1" onClick={() => onRemove(item.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        {showScore && <ScoreBreakdown score={item.score} />}
        {expanded && item.review && <CROReviewPanel item={item} />}
        {expanded && item.review && showPackage && (
          <PackageBuilder item={item} onSave={(p) => setSavedPkg(p)} />
        )}
        {savedPkg && (
          <p className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold mt-1.5">✓ Package generated: {savedPkg.packageName}</p>
        )}
      </div>
    </div>
  );
}

function FollowUpCard({
  item,
  onSetStatus,
  onRemove,
}: {
  item: ReturnType<typeof useMaxFollowUpTracker>["items"][0];
  onSetStatus: (id: string, status: FollowUpStatus) => void;
  onRemove: (id: string) => void;
}) {
  const copy = useCallback(() => {
    navigator.clipboard.writeText(buildFollowUpBriefText(item))
      .then(() => toast.success("Follow-up brief copied"))
      .catch(() => toast.error("Copy failed"));
  }, [item]);

  const saveToHistory = useCallback(() => {
    recordOutput({
      silo: "hmg",
      siloName: "HMG Master Brand",
      kind: "max-follow-up",
      prompt: `${item.personOrCompany} — ${item.reasonForFollowUp}`.slice(0, 100),
      output: item,
    });
    toast.success("Follow-up saved to Output History");
  }, [item]);

  const STATUS_COLORS_FU: Record<FollowUpStatus, string> = {
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
        <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_COLORS_FU[item.status]}`}>
          {item.status}
        </span>
      </div>
      <p className="text-[11px] text-foreground/80 leading-snug mb-1">{item.reasonForFollowUp}</p>
      {item.suggestedMessageAngle && (
        <p className="text-[11px] text-muted-foreground leading-snug italic mb-1.5">"{item.suggestedMessageAngle}"</p>
      )}
      <div className="flex flex-wrap gap-1 mb-2">
        {["Manual Follow-Up Only", "No Email Sent", "No CRM Connected"].map((t) => <TruthBadge key={t} label={t} />)}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1" onClick={copy}>
          <ClipboardCopy className="w-3 h-3" />
          Copy Brief
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1" onClick={saveToHistory}>
          <Save className="w-3 h-3" />
          Save
        </Button>
        {item.status !== "Follow-Up Done Manually" && (
          <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1 text-emerald-700 dark:text-emerald-400" onClick={() => onSetStatus(item.id, "Follow-Up Done Manually")}>
            <CheckCircle2 className="w-3 h-3" />
            Mark Done Manually
          </Button>
        )}
        {item.status !== "Waiting" && (
          <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1 text-violet-700 dark:text-violet-400" onClick={() => onSetStatus(item.id, "Waiting")}>
            <Circle className="w-3 h-3" />
            Mark Waiting
          </Button>
        )}
        {item.status !== "Ignore" && (
          <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1 text-muted-foreground" onClick={() => onSetStatus(item.id, "Ignore")}>
            <XCircle className="w-3 h-3" />
            Ignore
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-7 text-[10px] text-destructive/70 hover:text-destructive" onClick={() => onRemove(item.id)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function AddFollowUpForm({ onAdd }: { onAdd: () => void }) {
  const { add } = useMaxFollowUpTracker();
  const [open, setOpen] = useState(false);
  const [person, setPerson] = useState("");
  const [relType, setRelType] = useState<RelationshipType>("Manager");
  const [reason, setReason] = useState("");
  const [source, setSource] = useState("");
  const [angle, setAngle] = useState("");
  const [notes, setNotes] = useState("");

  const submit = useCallback(() => {
    if (!person.trim() || !reason.trim()) { toast.error("Name and reason are required"); return; }
    add({
      personOrCompany: person.trim(),
      relationshipType: relType,
      reasonForFollowUp: reason.trim(),
      relatedSourceOrContent: source.trim(),
      suggestedMessageAngle: angle.trim(),
      status: "Needs Follow-Up",
      notes: notes.trim(),
    });
    setPerson(""); setReason(""); setSource(""); setAngle(""); setNotes("");
    setOpen(false);
    onAdd();
    toast.success("Follow-up logged — manual action required");
  }, [add, person, relType, reason, source, angle, notes, onAdd]);

  if (!open) {
    return (
      <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wide gap-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setOpen(true)}>
        <Plus className="w-3.5 h-3.5" />
        Add Follow-Up
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-violet-400/30 bg-violet-500/[0.05] p-4 space-y-3">
      <p className="text-[11px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">Log Relationship Follow-Up</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Person / Company *</label>
          <input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Name or company" className="w-full h-8 text-[12px] px-2.5 rounded-md border border-border bg-card text-foreground" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Relationship Type</label>
          <select value={relType} onChange={(e) => setRelType(e.target.value as RelationshipType)} className="w-full h-8 text-[12px] px-2.5 rounded-md border border-border bg-card text-foreground">
            {RELATIONSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Reason for Follow-Up *</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why does this person/company matter for revenue?" className="w-full h-8 text-[12px] px-2.5 rounded-md border border-border bg-card text-foreground" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Related Source / Content</label>
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="What story, event, or source connects to this?" className="w-full h-8 text-[12px] px-2.5 rounded-md border border-border bg-card text-foreground" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Suggested Message Angle</label>
        <input value={angle} onChange={(e) => setAngle(e.target.value)} placeholder="How to frame the outreach — editorial first, revenue second" className="w-full h-8 text-[12px] px-2.5 rounded-md border border-border bg-card text-foreground" />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Notes</label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else Max should know" className="w-full h-8 text-[12px] px-2.5 rounded-md border border-border bg-card text-foreground" />
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wide gap-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={submit}>
          <Save className="w-3 h-3" />
          Log Follow-Up
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-wide" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {["Manual Follow-Up Only", "No Email Sent", "No CRM Connected"].map((t) => <TruthBadge key={t} label={t} />)}
      </div>
    </div>
  );
}

function DailyBriefPanel({ items }: { items: MaxCROBrief[] }) {
  const [brief, setBrief] = useState<ReturnType<typeof generateDailyBrief> | null>(null);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(() => {
    const b = generateDailyBrief(items);
    setBrief(b);
    setGenerated(true);
  }, [items]);

  const copy = useCallback(() => {
    if (!brief) return;
    navigator.clipboard.writeText(buildDailyBriefText(brief))
      .then(() => toast.success("Daily Money Brief copied"))
      .catch(() => toast.error("Copy failed"));
  }, [brief]);

  const save = useCallback(() => {
    if (!brief) return;
    recordOutput({
      silo: "hmg",
      siloName: "HMG Master Brand",
      kind: "max-daily-money-brief",
      prompt: brief.date,
      output: brief,
    });
    toast.success("Daily Money Brief saved to Output History");
  }, [brief]);

  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <p className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Max Daily Money Brief</p>
        </div>
        <div className="flex gap-1.5">
          {generated && (
            <>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1" onClick={copy}>
                <ClipboardCopy className="w-3 h-3" />
                Copy
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1" onClick={save}>
                <Save className="w-3 h-3" />
                Save
              </Button>
            </>
          )}
          <Button size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={generate}>
            <RefreshCw className="w-3 h-3" />
            {generated ? "Regenerate" : "Generate Brief"}
          </Button>
        </div>
      </div>

      {!brief && (
        <p className="text-[12px] text-muted-foreground">
          {items.length === 0
            ? "Submit sources to Max first. The brief summarizes your current inbox."
            : `${items.length} source${items.length === 1 ? "" : "s"} in inbox. Generate your daily brief.`}
        </p>
      )}

      {brief && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Total Items", value: brief.totalItems },
              { label: "Priority Moves", value: brief.priorityCount },
              { label: "Follow-Ups", value: brief.followUpCount },
              { label: "Ignored", value: brief.ignoreCount },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-2 text-center">
                <div className="text-lg font-black text-emerald-400">{value}</div>
                <div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {[
            { title: "Best Sponsor Angle", body: brief.bestSponsorAngle, icon: Briefcase },
            { title: "Best Relationship Follow-Up", body: brief.bestRelationshipFollowUp, icon: UserCheck },
            { title: "Best Content-to-Revenue Move", body: brief.bestContentToRevenue, icon: FileText },
            { title: "Best Offline Money Play", body: brief.bestOfflineMoneyPlay, icon: DollarSign },
            { title: "What to Ignore Today", body: brief.whatToIgnoreToday, icon: XCircle },
            { title: "Founder Next Move", body: brief.founderNextMove, icon: Zap },
            { title: "Risk / Reputation Warning", body: brief.riskWarning, icon: AlertTriangle },
          ].map(({ title, body, icon: Icon }) => (
            <div key={title} className="flex items-start gap-2 rounded-lg border border-border/30 bg-card/50 px-3 py-2.5">
              <Icon className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{title}</p>
                <p className="text-[12px] text-foreground/80 leading-relaxed mt-0.5">{body}</p>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-1">
            {["Local CRO Review", "No Outreach Sent", "No CRM Connected", "Manual Follow-Up Only"].map((t) => <TruthBadge key={t} label={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryStatusPanel() {
  const [hasMemory, setHasMemory] = useState<boolean | null>(null);
  const [memoryItems, setMemoryItems] = useState<{ type: string; title?: string }[]>([]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("hmg-founder-knowledge-base-v1");
      if (!raw) { setHasMemory(false); return; }
      const parsed = JSON.parse(raw) as { items?: typeof memoryItems };
      const items = Array.isArray(parsed?.items) ? parsed.items : [];
      const relevant = items.filter((i) => ["revenue-max-note", "sales-note", "relationship-note", "contact-csv", "pitch-deck", "resume-bio"].includes(i.type));
      setHasMemory(relevant.length > 0);
      setMemoryItems(relevant);
    } catch { setHasMemory(false); }
  }, []);

  if (hasMemory === null) return null;

  return (
    <div className={`rounded-xl border p-3 flex items-start gap-3 ${hasMemory ? "border-emerald-500/25 bg-emerald-500/[0.04]" : "border-amber-500/25 bg-amber-500/[0.04]"}`}>
      <Brain className={`w-4 h-4 flex-shrink-0 mt-0.5 ${hasMemory ? "text-emerald-400" : "text-amber-400"}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-black uppercase tracking-wider mb-1 ${hasMemory ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
          Max Memory — {hasMemory ? "Notes Loaded" : "Not Loaded Yet"}
        </p>
        <p className="text-[12px] text-foreground/70 leading-relaxed">
          {hasMemory
            ? `${memoryItems.length} revenue-relevant note${memoryItems.length === 1 ? "" : "s"} loaded from Founder Knowledge Base. Max uses these to sharpen scoring and recommendations.`
            : "Max memory not loaded yet. Add founder revenue notes, relationship notes, or sales notes to the Founder Knowledge Base to sharpen recommendations."}
        </p>
        {hasMemory && memoryItems.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {memoryItems.slice(0, 5).map((i, idx) => (
              <span key={idx} className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {i.type}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SponsorCategoryBrowser({ items }: { items: MaxCROBrief[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  const suggested = useMemo(() => {
    if (!items.length) return SPONSOR_CATEGORIES.slice(0, 6);
    const allText = items.map((i) => i.sourceText).join(" ");
    const matched = getCategoriesForText(allText);
    return matched.length > 0 ? matched : SPONSOR_CATEGORIES.slice(0, 6);
  }, [items]);

  const cat = SPONSOR_CATEGORIES.find((c) => c.id === selected);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">
        {items.length > 0
          ? "Sponsor categories matched to your current inbox. Expand any to see pitch angle and risk notes."
          : "Sponsor category map. Submit sources to Max first for personalized matches."}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggested.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelected(selected === c.id ? null : c.id)}
            className="text-left rounded-lg border border-border/50 bg-card/50 hover:bg-card p-3 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Tag className="w-3 h-3 text-sky-500 flex-shrink-0" />
                <span className="text-[11.5px] font-bold">{c.name}</span>
              </div>
              {selected === c.id ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-1 line-clamp-2">{c.bestVerticals.join(", ")}</p>
            {selected === c.id && (
              <div className="mt-2 space-y-1.5 border-t border-border/30 pt-2">
                <p className="text-[11px] leading-relaxed"><strong className="text-foreground/80">Content Fit:</strong> <span className="text-foreground/70">{c.contentFit}</span></p>
                <p className="text-[11px] leading-relaxed"><strong className="text-foreground/80">Pitch Angle:</strong> <span className="text-foreground/70">{c.pitchAngle}</span></p>
                <p className="text-[11px] leading-relaxed"><strong className="text-amber-600">Risk Notes:</strong> <span className="text-foreground/70">{c.riskNotes}</span></p>
                <p className="text-[11px] leading-relaxed"><strong className="text-destructive/70">What Not to Say:</strong> <span className="text-foreground/70">{c.whatNotToSay}</span></p>
                <div className="flex gap-1 mt-1">
                  {["No Real Contacts", "No Outreach Sent", "Local CRO Review"].map((t) => <TruthBadge key={t} label={t} />)}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      {items.length === 0 && (
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="text-[10px] text-sky-600 dark:text-sky-400 underline"
        >
          View all {SPONSOR_CATEGORIES.length} sponsor categories
        </button>
      )}
    </div>
  );
}

const WAR_ROOM_TABS: { id: WarRoomTab; label: string; icon: React.ElementType }[] = [
  { id: "intake", label: "Source Intake", icon: Send },
  { id: "inbox", label: "Revenue Inbox", icon: Inbox },
  { id: "priority", label: "Priority Moves", icon: TrendingUp },
  { id: "followups", label: "Follow-Ups", icon: UserCheck },
  { id: "sponsors", label: "Sponsor Angles", icon: Tag },
  { id: "offline", label: "Offline Plays", icon: DollarSign },
  { id: "ignore", label: "Ignore", icon: XCircle },
  { id: "founder", label: "Founder Review", icon: Eye },
];

export function MaxCROInboxView() {
  const { items, submit, runMax, setStatus, remove } = useMaxCROInbox();
  const followUpTracker = useMaxFollowUpTracker();
  const [tab, setTab] = useState<WarRoomTab>("inbox");
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
    inbox: items.length,
    priority: priorityItems.length,
    followups: followUpTracker.needsFollowUp.length,
    offline: offlineItems.length,
    ignore: ignoreItems.length,
    founder: founderItems.length,
  };

  const handleSourceChange = useCallback(
    (text: string) => {
      setSourceText(text);
      if (text.length > 20) {
        const sigs = detectRevenueSignals(text);
        setRevenuePreview(sigs);
      } else {
        setRevenuePreview([]);
      }
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    if (!sourceText.trim()) { toast.error("Paste a source or tip first"); return; }
    const item = submit({ sourceText: sourceText.trim(), silo, siloName, founderNote });
    if (item) {
      if (hasRevenueSignal(item.sourceText)) {
        toast.success("Revenue signals detected — source routed to Max");
        setTab("inbox");
      } else {
        toast.info("No revenue signal detected — logged as No Money Move");
        setTab("ignore");
      }
    }
    setSourceText("");
    setFounderNote("");
    setRevenuePreview([]);
  }, [sourceText, silo, siloName, founderNote, submit]);

  const handleSendToMax = useCallback(
    (id: string) => {
      runMax(id);
      toast.success("Max review complete — score and brief ready");
    },
    [runMax],
  );

  const renderTabContent = () => {
    switch (tab) {
      case "intake":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Source or Tip</label>
              <Textarea
                value={sourceText}
                onChange={(e) => handleSourceChange(e.target.value)}
                placeholder="Paste a source, tip, article excerpt, social post, event notice, or any text that could contain a revenue signal. Max will analyze it and route it to the right lane."
                className="min-h-[100px] text-[13px] resize-y"
              />
              {revenuePreview.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Revenue signals detected:</span>
                  {revenuePreview.map((s) => (
                    <span key={s} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-700 dark:text-emerald-300">{s}</span>
                  ))}
                </div>
              )}
              {sourceText.length > 20 && revenuePreview.length === 0 && (
                <p className="text-[10px] text-muted-foreground/70">No revenue signals detected yet — will be logged as No Money Move.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Brand / Silo</label>
                <select value={silo} onChange={(e) => setSilo(e.target.value)} className="w-full h-9 text-[12px] px-2.5 rounded-lg border border-input bg-card text-foreground">
                  {SILO_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Founder Note (optional)</label>
                <input
                  value={founderNote}
                  onChange={(e) => setFounderNote(e.target.value)}
                  placeholder="Any context Max should know"
                  className="w-full h-9 text-[12px] px-2.5 rounded-lg border border-input bg-card text-foreground"
                />
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={!sourceText.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold">
              <Send className="w-4 h-4" />
              Submit to Max
            </Button>

            <MemoryStatusPanel />
          </div>
        );

      case "inbox":
        return (
          <div className="space-y-3">
            <DailyBriefPanel items={items} />
            {items.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-border/50">
                <Inbox className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] font-bold text-muted-foreground">Revenue Inbox is empty</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Submit a source from the Source Intake tab.</p>
                <Button size="sm" variant="outline" className="mt-3 gap-1 text-[10px] font-bold uppercase tracking-wide" onClick={() => setTab("intake")}>
                  <Send className="w-3 h-3" />
                  Go to Source Intake
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <CROItemCard key={item.id} item={item} onSendToMax={handleSendToMax} onSetStatus={setStatus} onRemove={remove} showPackage />
              ))
            )}
          </div>
        );

      case "priority":
        return (
          <div className="space-y-3">
            {priorityItems.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-border/50">
                <TrendingUp className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] font-bold text-muted-foreground">No priority money moves yet</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Send sources through Max to surface high-score opportunities.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/[0.04] px-3 py-2">
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold leading-relaxed">
                    These are worth your time. Score ≥ 50 or flagged by Max. Founder review before any outreach.
                  </p>
                </div>
                {priorityItems.map((item) => (
                  <CROItemCard key={item.id} item={item} onSendToMax={handleSendToMax} onSetStatus={setStatus} onRemove={remove} showPackage />
                ))}
              </>
            )}
          </div>
        );

      case "followups":
        return (
          <div className="space-y-3">
            <AddFollowUpForm onAdd={() => toast.success("Follow-up logged")} />
            {followUpTracker.needsFollowUp.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2">Needs Follow-Up ({followUpTracker.needsFollowUp.length})</p>
                <div className="space-y-2">
                  {followUpTracker.needsFollowUp.map((i) => <FollowUpCard key={i.id} item={i} onSetStatus={followUpTracker.setStatus} onRemove={followUpTracker.remove} />)}
                </div>
              </div>
            )}
            {followUpTracker.founderReview.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-2">Founder Review ({followUpTracker.founderReview.length})</p>
                <div className="space-y-2">
                  {followUpTracker.founderReview.map((i) => <FollowUpCard key={i.id} item={i} onSetStatus={followUpTracker.setStatus} onRemove={followUpTracker.remove} />)}
                </div>
              </div>
            )}
            {followUpTracker.waiting.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2">Waiting ({followUpTracker.waiting.length})</p>
                <div className="space-y-2">
                  {followUpTracker.waiting.map((i) => <FollowUpCard key={i.id} item={i} onSetStatus={followUpTracker.setStatus} onRemove={followUpTracker.remove} />)}
                </div>
              </div>
            )}
            {followUpItems.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2">From Revenue Inbox ({followUpItems.length})</p>
                <div className="space-y-2">
                  {followUpItems.map((i) => <CROItemCard key={i.id} item={i} onSendToMax={handleSendToMax} onSetStatus={setStatus} onRemove={remove} />)}
                </div>
              </div>
            )}
            {followUpTracker.items.length === 0 && followUpItems.length === 0 && (
              <div className="text-center py-10 rounded-xl border border-dashed border-border/50">
                <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] font-bold text-muted-foreground">No follow-ups logged yet</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Add a relationship follow-up above. Manual only — no CRM, no email sent.</p>
              </div>
            )}
            <div className="flex flex-wrap gap-1 pt-2">
              {["Manual Follow-Up Only", "No Email Sent", "No CRM Connected"].map((t) => <TruthBadge key={t} label={t} />)}
            </div>
          </div>
        );

      case "sponsors":
        return (
          <div className="space-y-3">
            <SponsorCategoryBrowser items={items} />
          </div>
        );

      case "offline":
        return (
          <div className="space-y-3">
            {offlineItems.length === 0 ? (
              <div className="text-center py-10 rounded-xl border border-dashed border-border/50">
                <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] font-bold text-muted-foreground">No offline money plays yet</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">Submit event, interview, or venue sources to surface offline plays.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-amber-400/25 bg-amber-500/[0.04] px-3 py-2">
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold leading-relaxed">
                    Offline plays: events, interviews, local sponsorships, live activations, consulting, media packages, merch, panels, pop-ups.
                  </p>
                </div>
                {offlineItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border/50 bg-card p-3">
                    <p className="text-[12px] font-bold leading-snug mb-1">{item.sourceText}</p>
                    <p className="text-[10px] text-muted-foreground mb-2">{item.siloName}</p>
                    {item.review && (
                      <div className="rounded-lg border border-amber-400/20 bg-amber-500/[0.04] px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-1">Offline Money Play</p>
                        <p className="text-[12px] text-foreground/80 leading-relaxed">{item.review.offlineMoneyPlay}</p>
                      </div>
                    )}
                    {item.score && <div className="mt-2"><ScoreBadge score={item.score} /></div>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1" onClick={() => { navigator.clipboard.writeText(item.review?.offlineMoneyPlay ?? "").then(() => toast.success("Copied")); }}>
                        <ClipboardCopy className="w-3 h-3" />
                        Copy Play
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1" onClick={() => setStatus(item.id, "Founder Review Required")}>
                        <Eye className="w-3 h-3" />
                        Flag: Founder Review
                      </Button>
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
                  <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed">
                    Ignore the noise here. Don't revisit unless the situation changes significantly.
                  </p>
                </div>
                {ignoreItems.map((item) => (
                  <CROItemCard key={item.id} item={item} onSendToMax={handleSendToMax} onSetStatus={setStatus} onRemove={remove} />
                ))}
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
                <p className="text-[11px] text-muted-foreground/70 mt-1">Flag items from the Revenue Inbox for Founder review.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-sky-400/25 bg-sky-500/[0.04] px-3 py-2">
                  <p className="text-[11px] text-sky-700 dark:text-sky-300 font-semibold leading-relaxed">
                    High upside, but Founder review first. These items require your decision before any action is taken.
                  </p>
                </div>
                {founderItems.map((item) => (
                  <CROItemCard key={item.id} item={item} onSendToMax={handleSendToMax} onSetStatus={setStatus} onRemove={remove} showPackage />
                ))}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 lg:px-6 py-5 gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                Maximillion · CRO Intelligence
              </span>
            </div>
            <h1 className="text-xl font-black leading-tight">Max CRO War Room</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Source Intake → Revenue Signal Detection → Max CRO Review → Founder Action
            </p>
          </div>
        </div>
      </div>

      {/* Max Is / Max Is Not */}
      <div className="rounded-xl border border-border/50 bg-card/30 px-4 py-3 flex flex-col gap-2">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Max Is / Max Is Not</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            "✓ CRO / Revenue Operator",
            "✓ Sponsor & Partnership Thinker",
            "✓ Relationship Follow-Up Tracker",
            "✓ Content-to-Revenue Strategist",
            "✓ Offline Money Scout",
          ].map((t) => (
            <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">{t}</span>
          ))}
          {[
            "✗ Not an article editor",
            "✗ Not WebEdit or ARTBOT",
            "✗ Not a fake CRM",
            "✗ No fake email/outreach",
            "✗ No fake deal status",
          ].map((t) => (
            <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border text-muted-foreground">{t}</span>
          ))}
        </div>
      </div>

      {/* Truth Labels */}
      <div className="flex flex-wrap gap-1.5">
        {["Local CRO Review", "Founder Review Required", "No Outreach Sent", "No CRM Connected", "Manual Follow-Up Only", "Future Relationship Database Hook Pending"].map((t) => (
          <TruthBadge key={t} label={t} />
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex overflow-x-auto gap-0.5 rounded-xl border border-border/50 bg-secondary/30 p-1 shrink-0">
        {WAR_ROOM_TABS.map(({ id, label, icon: Icon }) => {
          const count = tabCounts[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors ${
                tab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
              {count !== undefined && count > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${tab === id ? "bg-emerald-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                  {count}
                </span>
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
