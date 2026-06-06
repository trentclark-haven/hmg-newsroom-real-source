import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Copy,
  FileText,
  ArrowRight,
  Volume2,
  HelpCircle,
  Sparkles,
  Users,
  CalendarClock,
  ReceiptText,
  DollarSign,
  Briefcase,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Save,
} from "lucide-react";
import { getBrandKnowledge } from "@/lib/hmg/haven-ai/hmgKnowledgeBase";
import { getMission } from "@/lib/hmg/haven-ai/maximillionPersonality";
import { runLocalBrain, type LocalBrainOutput } from "@/lib/hmg/haven-ai/localBrain";
import type { HavenMissionMode } from "@/lib/hmg/haven-ai/types";

type DeskTab =
  | "ask"
  | "moneyIdeas"
  | "leads"
  | "followUps"
  | "founderBrief"
  | "receipts";

const TABS: { id: DeskTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "ask", label: "Ask Max", icon: Sparkles },
  { id: "moneyIdeas", label: "Money Ideas", icon: DollarSign },
  { id: "leads", label: "Leads", icon: Users },
  { id: "followUps", label: "Follow-Ups", icon: CalendarClock },
  { id: "founderBrief", label: "Founder Brief", icon: Briefcase },
  { id: "receipts", label: "Receipts", icon: ReceiptText },
];

const TAB_MISSION: Record<DeskTab, HavenMissionMode> = {
  ask: "auto",
  moneyIdeas: "sales",
  leads: "sales",
  followUps: "follow_up",
  founderBrief: "founder_briefing",
  receipts: "founder_briefing",
};

interface PrimaryShortcut {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  mission: HavenMissionMode;
  prefill: string;
}

const PRIMARY_SHORTCUTS: PrimaryShortcut[] = [
  {
    id: "sponsor-angle",
    label: "Find Sponsor Angle",
    icon: Briefcase,
    mission: "sponsorship",
    prefill: "Find a sponsor angle for: ",
  },
  {
    id: "draft-pitch",
    label: "Draft Pitch",
    icon: FileText,
    mission: "sales",
    prefill: "Draft a pitch for: ",
  },
  {
    id: "build-followup",
    label: "Build Follow-Up",
    icon: CalendarClock,
    mission: "follow_up",
    prefill: "Build a respectful follow-up sequence for: ",
  },
  {
    id: "founder-brief",
    label: "Create Founder Brief",
    icon: Sparkles,
    mission: "founder_briefing",
    prefill: "Brief me on: ",
  },
  {
    id: "save-lead",
    label: "Save Lead",
    icon: Save,
    mission: "sales",
    prefill: "Save this lead: ",
  },
];

interface DeskReceipt {
  id: string;
  tab: DeskTab;
  prompt: string;
  answer: LocalBrainOutput;
  createdAt: string;
}

function speak(text: string, lang = "en-US") {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) {
    toast.message("Voice isn't available on this device.");
    return;
  }
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 1;
  utter.pitch = 0.95;
  const voices = synth.getVoices();
  const candidate = voices.find(
    (v) => /en/i.test(v.lang) && /(daniel|alex|fred|google us english|en-us)/i.test(v.name),
  );
  if (candidate) utter.voice = candidate;
  synth.speak(utter);
}

function MaxMonogram({ size = 60 }: { size?: number }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-center font-black tracking-tight shadow-lg ring-1 ring-white/10"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #0a0f1a 0%, #1e293b 60%, #475569 100%)",
        color: "#f8fafc",
        fontSize: size * 0.38,
      }}
      aria-label="Maximillion"
      data-testid="max-monogram"
    >
      M
    </div>
  );
}

export function MaximillionExecutiveDesk({ className = "" }: { className?: string }) {
  const [tab, setTab] = useState<DeskTab>("ask");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState<LocalBrainOutput | null>(null);
  const [receipts, setReceipts] = useState<DeskReceipt[]>([]);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [techOpen, setTechOpen] = useState(false);

  const brand = useMemo(() => getBrandKnowledge("master"), []);
  const missionDef = useMemo(
    () => getMission(TAB_MISSION[tab]),
    [tab],
  );

  const ask = (override?: { message?: string; mission?: HavenMissionMode }) => {
    const m = (override?.message ?? prompt).trim();
    if (!m) return;
    const mission = override?.mission ?? TAB_MISSION[tab];
    const def = override?.mission ? getMission(override.mission) : missionDef;
    const out = runLocalBrain({
      message: m,
      mission,
      missionDef: def,
      brand,
      context: {
        summary: "Executive desk — pipeline visibility not pre-loaded.",
        systemHint: "",
        recentTopics: [],
      },
    });
    setAnswer(out);
    const receipt: DeskReceipt = {
      id: `rcpt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tab,
      prompt: m,
      answer: out,
      createdAt: new Date().toISOString(),
    };
    setReceipts((prev) => [receipt, ...prev].slice(0, 30));
  };

  const runShortcut = (s: PrimaryShortcut) => {
    if (s.id === "save-lead") {
      const text = prompt.trim();
      if (!text) {
        toast.message("Type the lead first, then tap Save Lead.");
        return;
      }
      ask({ message: text, mission: "sales" });
      toast.success("Lead saved to receipts");
      return;
    }
    const seed = (prompt.trim() || "this opportunity").replace(/^.*:\s*/, "");
    const next = `${s.prefill}${seed}`;
    setPrompt(next);
    ask({ message: next, mission: s.mission });
  };

  const copyPitch = () => {
    if (!answer) return;
    const text = [
      answer.message,
      "",
      ...answer.sections.map((s) => `## ${s.title}\n${s.body}`),
      "",
      "Next moves:",
      ...answer.nextActions.map((a) => `- ${a}`),
    ].join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Pitch copied"))
      .catch(() => toast.error("Copy failed"));
  };

  const saveLead = () => {
    if (!answer) {
      toast.message("Ask Max first, then save the answer as a lead.");
      return;
    }
    const lead: DeskReceipt = {
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tab: "leads",
      prompt: prompt || "(no prompt)",
      answer,
      createdAt: new Date().toISOString(),
    };
    setReceipts((prev) => [lead, ...prev].slice(0, 30));
    toast.success("Saved to leads");
  };

  const addFollowUp = () => {
    if (!answer) {
      toast.message("Ask Max first, then add a follow-up.");
      return;
    }
    const f: DeskReceipt = {
      id: `fu-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tab: "followUps",
      prompt: prompt || "(no prompt)",
      answer,
      createdAt: new Date().toISOString(),
    };
    setReceipts((prev) => [f, ...prev].slice(0, 30));
    toast.success("Follow-up added");
  };

  const exportBrief = () => {
    if (!answer) {
      toast.message("Ask Max first, then export the brief.");
      return;
    }
    const blob = new Blob([JSON.stringify(answer, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `max-brief-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Brief exported");
  };

  const createReceipt = () => {
    if (!answer) {
      toast.message("Ask Max first.");
      return;
    }
    const text = [
      `MAXIMILLION RECEIPT — ${new Date().toLocaleString()}`,
      `Tab: ${TABS.find((t) => t.id === tab)?.label}`,
      `Ask: ${prompt}`,
      "",
      answer.message,
      "",
      ...answer.sections.map((s) => `${s.title}: ${s.body}`),
      "",
      `Next moves: ${answer.nextActions.join(" | ")}`,
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `max-receipt-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Receipt created");
  };

  const exportReceipts = () => {
    if (receipts.length === 0) {
      toast.message("No receipts yet.");
      return;
    }
    const blob = new Blob([JSON.stringify(receipts, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `max-receipts-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Receipts exported");
  };

  const inputPlaceholder = "Ask Max what money move to make next…";

  return (
    <section
      className={`rounded-2xl border border-border/60 bg-card/40 shadow-sm ${className}`}
      data-testid="max-executive-desk"
    >
      {/* Premium header */}
      <div className="flex items-start justify-between gap-3 p-5 border-b border-border/40">
        <div className="flex items-center gap-4">
          <MaxMonogram />
          <div>
            <h2
              className="text-2xl font-black tracking-tight leading-none"
              data-testid="max-title"
            >
              MAXIMILLION
            </h2>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground mt-1"
              data-testid="max-rank"
            >
              Revenue Partner
            </p>
            <p
              className="text-[13px] text-foreground/85 mt-1.5 leading-snug max-w-md"
              data-testid="max-subtitle"
            >
              Pitch ideas, sponsor leads, follow-ups, and founder briefs.
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-[11px]"
          onClick={() => setVoiceOpen((v) => !v)}
          data-testid="max-voice-toggle"
        >
          <Volume2 className="w-3 h-3 mr-1" />
          Voice
        </Button>
      </div>

      {/* Simple tabs */}
      <div
        className="flex flex-wrap gap-1.5 px-5 pt-3 pb-2 border-b border-border/30"
        data-testid="max-desk-tabs"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              data-testid={`max-tab-${t.id}`}
              className={`h-8 px-3 inline-flex items-center gap-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-colors ${
                isActive
                  ? "bg-foreground text-background border-transparent"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3 h-3" />
              {t.label}
            </button>
          );
        })}
      </div>

      {voiceOpen && (
        <div
          className="mx-5 mt-3 rounded-md border border-border/40 bg-background/40 p-2.5 text-[11px] text-muted-foreground leading-snug"
          data-testid="max-voice-note"
        >
          Voice depends on your device. Max's written voice stays executive.
        </div>
      )}

      {tab !== "receipts" && (
        <div className="p-5 space-y-4">
          {/* One main input */}
          <div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={inputPlaceholder}
              className="min-h-[120px] text-[15px] leading-relaxed bg-background/40 border-border/40 focus-visible:ring-1 focus-visible:ring-foreground/30"
              data-testid="max-prompt"
            />
          </div>

          {/* Big primary actions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" data-testid="max-shortcuts">
            {PRIMARY_SHORTCUTS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => runShortcut(s)}
                  data-testid={`max-shortcut-${s.id}`}
                  className="h-12 rounded-xl border border-border/50 bg-background/40 hover:bg-foreground/5 hover:border-foreground/30 transition-colors text-[13px] font-bold inline-flex items-center justify-center gap-2 px-3"
                >
                  <Icon className="w-4 h-4" />
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Ask Max primary button */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              onClick={() => ask()}
              disabled={!prompt.trim()}
              className="h-12 px-6 font-bold rounded-full bg-foreground text-background text-[14px]"
              data-testid="max-ask-btn"
            >
              <Send className="w-4 h-4 mr-2" />
              Ask Max
            </Button>
            {!answer && (
              <p className="text-[12px] text-muted-foreground inline-flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Type your question, then tap Ask Max or any shortcut above.
              </p>
            )}
          </div>

          {answer && (
            <div
              className="rounded-xl border border-border/40 bg-background/40 p-4 space-y-3 shadow-sm"
              data-testid="max-answer"
            >
              <p className="text-[14px] leading-relaxed text-foreground/95">{answer.message}</p>
              <div className="space-y-2">
                {answer.sections.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-md border border-border/30 bg-card/40 p-2.5"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 inline-flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {s.title}
                    </p>
                    <p className="text-[13px] whitespace-pre-wrap leading-snug">{s.body}</p>
                  </div>
                ))}
              </div>
              {answer.nextActions.length > 0 && (
                <div className="rounded-md border border-border/30 bg-card/40 p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 inline-flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    Next moves
                  </p>
                  <ul className="space-y-1">
                    {answer.nextActions.map((a, i) => (
                      <li key={i} className="text-[13px] text-foreground/85 leading-snug">
                        → {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Output action bar — grouped */}
              <div
                className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/30"
                data-testid="max-output-action-bar"
              >
                <Button
                  size="sm"
                  onClick={copyPitch}
                  className="h-9 text-[12px] font-bold rounded-full bg-foreground text-background"
                  data-testid="max-copy-pitch"
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy Pitch
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveLead}
                  className="h-9 text-[11px]"
                  data-testid="max-save-lead"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save Lead
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addFollowUp}
                  className="h-9 text-[11px]"
                  data-testid="max-add-followup"
                >
                  <CalendarClock className="w-3 h-3 mr-1" />
                  Add Follow-Up
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportBrief}
                  className="h-9 text-[11px]"
                  data-testid="max-export-brief"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Export Brief
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={createReceipt}
                  className="h-9 text-[11px]"
                  data-testid="max-create-receipt"
                >
                  <ReceiptText className="w-3 h-3 mr-1" />
                  Create Receipt
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => speak(answer.message)}
                  className="h-9 text-[11px]"
                  data-testid="max-speak"
                >
                  <Volume2 className="w-3 h-3 mr-1" />
                  Speak
                </Button>
              </div>
            </div>
          )}

          {/* Tabs with copy chips from local brain (no extra clutter) */}
          {answer && answer.copyPackets.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {answer.copyPackets.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    navigator.clipboard
                      .writeText(p.content)
                      .then(() => toast.success(`${p.label} copied`))
                      .catch(() => toast.error("Copy failed"))
                  }
                  data-testid={`max-copy-${p.id}`}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {p.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "receipts" && (
        <div className="p-5 space-y-3" data-testid="max-receipts">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-muted-foreground">
              {receipts.length} answer{receipts.length === 1 ? "" : "s"} saved in this session.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[11px]"
              onClick={exportReceipts}
              data-testid="max-export-receipts"
            >
              Export receipts
            </Button>
          </div>
          {receipts.length === 0 && (
            <p className="text-[13px] text-muted-foreground italic">
              No receipts yet. Each Ask Max answer is automatically saved here.
            </p>
          )}
          <ul className="space-y-2">
            {receipts.map((r) => (
              <li
                key={r.id}
                className="rounded-md border border-border/40 bg-background/40 p-2.5"
                data-testid={`max-receipt-${r.id}`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {TABS.find((t) => t.id === r.tab)?.label ?? r.tab} · {new Date(r.createdAt).toLocaleString()}
                </p>
                <p className="text-[13px] mt-0.5">{r.prompt}</p>
                <p className="text-[12px] text-muted-foreground mt-1 italic">
                  {r.answer.message.slice(0, 160)}
                  {r.answer.message.length > 160 ? "…" : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Technical Details — collapsed */}
      <div className="border-t border-border/40" data-testid="max-technical-details">
        <button
          type="button"
          onClick={() => setTechOpen((v) => !v)}
          className="w-full px-5 py-2.5 flex items-center justify-between hover:bg-foreground/5"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
            {techOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Technical Details
          </span>
          {!techOpen && (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </button>
        {techOpen && (
          <div className="px-5 pb-4 text-[11px] text-muted-foreground space-y-1 leading-snug">
            <p>Max runs on the local writing brain — no paid API keys are required to ask or to draft.</p>
            <p>Voice support varies by device; the written voice stays consistent.</p>
            <p>Saved Leads, Follow-Ups, and Receipts live in this session until exported.</p>
          </div>
        )}
      </div>
    </section>
  );
}
