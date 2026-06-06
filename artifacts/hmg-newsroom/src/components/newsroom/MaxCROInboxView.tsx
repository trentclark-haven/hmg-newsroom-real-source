/**
 * Max CRO Inbox — Source Intake → Max CRO Intelligence routing panel.
 *
 * Max is: CRO, Founder OS strategist, revenue operator, sponsor/partnership thinker,
 * relationship follow-up tracker, offline money scout, content-to-revenue strategist.
 *
 * Max is NOT: article editor, graphics tool, WebEdit, Social Factory, ARTBOT,
 * fake CRM, fake email sender, fake outreach tool.
 *
 * Truth labels on all output:
 *   Local CRO Review | Founder Review Required | No Outreach Sent |
 *   No CRM Connected | Future Relationship Database Hook Pending
 */
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardCopy,
  DollarSign,
  Eye,
  FileText,
  Inbox,
  Save,
  Send,
  Trash2,
  TrendingUp,
  UserCheck,
  XCircle,
  Zap,
} from "lucide-react";
import { useMaxCROInbox } from "@/lib/useMaxCROInbox";
import { hasRevenueSignal, detectRevenueSignals, buildCROBriefText } from "@/lib/hmg/haven-ai/maxCROEngine";
import type { MaxCROBrief, CROStatus } from "@/lib/hmg/haven-ai/maxCROEngine";
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

function TruthBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border border-border/60 bg-secondary/60 text-muted-foreground">
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: CROStatus }) {
  const Icon = STATUS_ICONS[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}
    >
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function SignalChips({ signals }: { signals: string[] }) {
  if (!signals.length)
    return <span className="text-[10px] text-muted-foreground">No revenue signals detected</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {signals.map((s) => (
        <span
          key={s}
          className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30"
        >
          {s}
        </span>
      ))}
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
    <div className="space-y-1.5 pt-3 border-t border-border/30">
      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-2">
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
                <span className="text-[11px] font-bold uppercase tracking-wide truncate">
                  {s.title}
                </span>
              </div>
              {open ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
            </div>
            {open && (
              <p className="text-[12px] text-foreground/90 leading-relaxed mt-2 pl-5">
                {s.body}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

function CROItemCard({
  item,
  onSendToMax,
  onSetStatus,
  onCopy,
  onSaveToHistory,
  onRemove,
}: {
  item: MaxCROBrief;
  onSendToMax: (id: string) => void;
  onSetStatus: (id: string, status: CROStatus) => void;
  onCopy: (item: MaxCROBrief) => void;
  onSaveToHistory: (item: MaxCROBrief) => void;
  onRemove: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(item.status === "Revenue Review Needed");

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="p-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold leading-snug text-foreground line-clamp-2">
              {item.sourceText}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {item.siloName} · {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="shrink-0 p-1 rounded hover:bg-muted/40 transition-colors"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Status + signals */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <StatusBadge status={item.status} />
        </div>
        <SignalChips signals={item.signals} />

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {item.status === "Revenue Review Needed" && (
            <Button
              size="sm"
              className="h-7 text-[10px] font-bold uppercase tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              onClick={() => onSendToMax(item.id)}
            >
              <Send className="w-3 h-3" />
              Send to Max
            </Button>
          )}
          {item.review && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1"
                onClick={() => onCopy(item)}
              >
                <ClipboardCopy className="w-3 h-3" />
                Copy Brief
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1"
                onClick={() => onSaveToHistory(item)}
              >
                <Save className="w-3 h-3" />
                Save to History
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1"
                onClick={() => onSetStatus(item.id, "Founder Review Required")}
              >
                <Eye className="w-3 h-3" />
                Flag: Founder Review
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1"
                onClick={() => onSetStatus(item.id, "Relationship Follow-Up Needed")}
              >
                <UserCheck className="w-3 h-3" />
                Mark Follow-Up
              </Button>
            </>
          )}
          {item.status !== "Ignore / No Money Move" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1 text-muted-foreground"
              onClick={() => onSetStatus(item.id, "Ignore / No Money Move")}
            >
              <XCircle className="w-3 h-3" />
              Mark Ignore
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] font-bold uppercase tracking-wide gap-1 text-destructive/70 hover:text-destructive"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        {/* CRO Review */}
        {expanded && item.review && <CROReviewPanel item={item} />}
      </div>
    </div>
  );
}

const SILO_OPTIONS = [
  { id: "hmg", name: "HMG Master Brand" },
  ...verticals.map((v) => ({ id: v.id, name: v.name })),
];

type InboxTab = "intake" | "inbox" | "followups" | "founderqueue";

export function MaxCROInboxView() {
  const { items, submit, runMax, setStatus, remove } = useMaxCROInbox();

  const [tab, setTab] = useState<InboxTab>("inbox");
  const [sourceText, setSourceText] = useState("");
  const [silo, setSilo] = useState("hmg");
  const [founderNote, setFounderNote] = useState("");
  const [revenuePreview, setRevenuePreview] = useState<string[]>([]);

  const siloName = SILO_OPTIONS.find((s) => s.id === silo)?.name ?? "HMG Master Brand";

  const handleSourceChange = (val: string) => {
    setSourceText(val);
    setRevenuePreview(val.trim() ? detectRevenueSignals(val) : []);
  };

  const handleSubmit = () => {
    if (!sourceText.trim()) {
      toast.error("Enter a source or story idea first.");
      return;
    }
    const result = submit({ sourceText: sourceText.trim(), silo, siloName, founderNote });
    if (result) {
      const isRevenue = hasRevenueSignal(sourceText);
      toast.success(
        isRevenue
          ? "Revenue signal detected — routed to Max CRO Inbox"
          : "Source logged — no revenue signal detected",
      );
      setSourceText("");
      setFounderNote("");
      setRevenuePreview([]);
      if (isRevenue) setTab("inbox");
    }
  };

  const handleSendToMax = (id: string) => {
    const result = runMax(id);
    if (result) toast.success("Max CRO Review drafted — Local Brain Active");
  };

  const handleCopy = (item: MaxCROBrief) => {
    const text = buildCROBriefText(item);
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Max Revenue Brief copied"))
      .catch(() => toast.error("Copy failed"));
  };

  const handleSaveToHistory = (item: MaxCROBrief) => {
    if (!item.review) {
      toast.error("Send to Max first to generate a review.");
      return;
    }
    recordOutput({
      silo: item.silo,
      siloName: item.siloName,
      kind: "max-cro-brief" as never,
      prompt: item.sourceText,
      output: item,
    });
    setStatus(item.id, "Saved to Output History");
    toast.success("Saved to Output History");
  };

  const handleSetStatus = (id: string, status: CROStatus) => {
    setStatus(id, status);
    toast.success(`Status → ${status}`);
  };

  const inboxItems = useMemo(
    () =>
      items.filter(
        (i) =>
          i.status === "Revenue Review Needed" ||
          i.status === "Max Review Drafted" ||
          i.status === "Saved to Output History",
      ),
    [items],
  );

  const followUpItems = useMemo(
    () => items.filter((i) => i.status === "Relationship Follow-Up Needed"),
    [items],
  );

  const founderQueueItems = useMemo(
    () => items.filter((i) => i.status === "Founder Review Required"),
    [items],
  );

  const TABS: { id: InboxTab; label: string; count?: number }[] = [
    { id: "intake", label: "Source Intake" },
    { id: "inbox", label: "Max Inbox", count: inboxItems.length },
    { id: "followups", label: "Follow-Ups", count: followUpItems.length },
    { id: "founderqueue", label: "Founder Queue", count: founderQueueItems.length },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-4 lg:px-8 py-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">
              Maximillion · CRO Intelligence
            </p>
            <h2 className="text-xl font-black leading-tight">Max CRO Inbox</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Source Intake → Revenue Signal Detection → Max CRO Review → Founder Action
            </p>
          </div>
        </div>

        {/* Max role clarity */}
        <div className="mt-3 p-3 rounded-xl border border-border/40 bg-secondary/30">
          <p className="text-[11px] font-bold uppercase tracking-wide text-foreground/70 mb-1.5">
            Max is / Max is not
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              "✓ CRO / Revenue Operator",
              "✓ Sponsor & Partnership Thinker",
              "✓ Relationship Follow-Up Tracker",
              "✓ Content-to-Revenue Strategist",
              "✓ Offline Money Scout",
            ].map((s) => (
              <span key={s} className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                {s}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {[
              "✗ Not an article editor",
              "✗ Not WebEdit or ARTBOT",
              "✗ Not a fake CRM",
              "✗ No fake email/outreach",
              "✗ No fake deal status",
            ].map((s) => (
              <span key={s} className="text-[10px] font-bold text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Truth labels */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            "Local CRO Review",
            "Founder Review Required",
            "No Outreach Sent",
            "No CRM Connected",
            "Future Relationship Database Hook Pending",
          ].map((l) => (
            <TruthBadge key={l} label={l} />
          ))}
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 mb-4 border-b border-border/40 pb-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wide border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] font-black">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* SOURCE INTAKE TAB */}
        {tab === "intake" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-border/50 bg-card space-y-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                Source Intake → Max CRO Router
              </p>
              <p className="text-[12px] text-muted-foreground">
                Paste a source, tip, story idea, contact note, or opportunity. Max will
                detect revenue signals and route it automatically.
              </p>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground block mb-1">
                  Source / Story Idea / Opportunity
                </label>
                <Textarea
                  value={sourceText}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  placeholder="e.g. Rapper X has a new album dropping next month. His manager reached out about a potential interview. They also mentioned wanting a sponsor for the release event."
                  rows={4}
                  className="text-[13px] resize-none"
                />
              </div>

              {revenuePreview.length > 0 && (
                <div className="p-2.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 mb-1">
                    Revenue Signals Detected
                  </p>
                  <SignalChips signals={revenuePreview} />
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-1.5">
                    This will be routed to Max as "Revenue Review Needed"
                  </p>
                </div>
              )}

              {sourceText.trim() && !hasRevenueSignal(sourceText) && (
                <div className="p-2.5 rounded-lg border border-border/40 bg-secondary/40">
                  <p className="text-[10px] text-muted-foreground">
                    No revenue signals detected — will be logged as "Ignore / No Money Move". You can still submit for the record.
                  </p>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground block mb-1">
                  Brand / Vertical
                </label>
                <select
                  value={silo}
                  onChange={(e) => setSilo(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-[13px] font-medium text-foreground"
                >
                  {SILO_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground block mb-1">
                  Founder Note (optional context for Max)
                </label>
                <Textarea
                  value={founderNote}
                  onChange={(e) => setFounderNote(e.target.value)}
                  placeholder="e.g. I know the manager from the event last spring. We have a warm intro."
                  rows={2}
                  className="text-[13px] resize-none"
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wide text-[11px] gap-2"
              >
                <Inbox className="w-4 h-4" />
                Submit to Max CRO Inbox
              </Button>
            </div>

            {/* Max lane clarity */}
            <div className="p-4 rounded-xl border border-border/40 bg-secondary/20 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-foreground/60">
                What Max does with this
              </p>
              {[
                { icon: Briefcase, label: "Finds the sponsor angle" },
                { icon: UserCheck, label: "Identifies relationship follow-up needs" },
                { icon: FileText, label: "Maps content-to-revenue opportunities" },
                { icon: TrendingUp, label: "Suggests brand partnership ideas" },
                { icon: DollarSign, label: "Spots offline money plays" },
                { icon: XCircle, label: "Flags what to ignore" },
                { icon: Zap, label: "Gives Founder one clear next move" },
                { icon: AlertTriangle, label: "Notes risk / reputation concerns" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[12px] text-foreground/80">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INBOX TAB */}
        {tab === "inbox" && (
          <div className="space-y-3">
            {inboxItems.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Max Inbox is empty"
                hint='Submit a source from the "Source Intake" tab — revenue signals route here automatically.'
                action={{ label: "Go to Source Intake", onClick: () => setTab("intake") }}
              />
            ) : (
              inboxItems.map((item) => (
                <CROItemCard
                  key={item.id}
                  item={item}
                  onSendToMax={handleSendToMax}
                  onSetStatus={handleSetStatus}
                  onCopy={handleCopy}
                  onSaveToHistory={handleSaveToHistory}
                  onRemove={remove}
                />
              ))
            )}
          </div>
        )}

        {/* FOLLOW-UPS TAB */}
        {tab === "followups" && (
          <div className="space-y-3">
            {followUpItems.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="No follow-ups queued"
                hint='Mark a Max review as "Relationship Follow-Up Needed" to queue it here.'
                action={{ label: "Go to Inbox", onClick: () => setTab("inbox") }}
              />
            ) : (
              followUpItems.map((item) => (
                <CROItemCard
                  key={item.id}
                  item={item}
                  onSendToMax={handleSendToMax}
                  onSetStatus={handleSetStatus}
                  onCopy={handleCopy}
                  onSaveToHistory={handleSaveToHistory}
                  onRemove={remove}
                />
              ))
            )}
          </div>
        )}

        {/* FOUNDER QUEUE TAB */}
        {tab === "founderqueue" && (
          <div className="space-y-3">
            {founderQueueItems.length === 0 ? (
              <EmptyState
                icon={Eye}
                title="Founder Queue is empty"
                hint='Flag a Max review as "Founder Review Required" to queue it here for your decision.'
                action={{ label: "Go to Inbox", onClick: () => setTab("inbox") }}
              />
            ) : (
              founderQueueItems.map((item) => (
                <CROItemCard
                  key={item.id}
                  item={item}
                  onSendToMax={handleSendToMax}
                  onSetStatus={handleSetStatus}
                  onCopy={handleCopy}
                  onSaveToHistory={handleSaveToHistory}
                  onRemove={remove}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: React.ElementType;
  title: string;
  hint: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-[13px] font-bold text-foreground/70">{title}</p>
      <p className="text-[12px] text-muted-foreground mt-1 max-w-xs">{hint}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-3 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-emerald-600 hover:text-emerald-500 transition-colors"
        >
          {action.label}
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
