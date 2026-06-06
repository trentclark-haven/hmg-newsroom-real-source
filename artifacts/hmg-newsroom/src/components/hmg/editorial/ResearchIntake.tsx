import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  FileText,
  ChevronDown,
  ChevronRight,
  Globe,
  Brain,
  ClipboardPaste,
  HelpCircle,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  PASTE_TEMPLATE,
  RESEARCH_GROUPS,
  RESEARCH_SECTIONS,
  splitPasteTemplate,
  type ResearchGroup,
  type ResearchSection,
} from "@/lib/hmg/editorial";

interface ResearchIntakeProps {
  sections: ResearchSection[];
  onChange: (sections: ResearchSection[]) => void;
  accent: string;
  onAccent: string;
  liveWebOn?: boolean;
  corpusReady?: boolean;
}

type SourceTone = "ready" | "needsAttention" | "off";

interface SourceRow {
  id: "pasted" | "memory" | "liveWeb" | "notebookLM";
  label: string;
  state: SourceTone;
  detail: string;
}

function StatusDot({ tone }: { tone: SourceTone }) {
  const cls =
    tone === "ready"
      ? "bg-emerald-400"
      : tone === "needsAttention"
        ? "bg-amber-400"
        : "bg-zinc-500";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls}`} />;
}

export function ResearchIntake({
  sections,
  onChange,
  accent,
  onAccent,
  liveWebOn = false,
  corpusReady = false,
}: ResearchIntakeProps) {
  const filledSectionIds = useMemo(
    () => new Set(sections.filter((s) => s.text.trim().length > 0).map((s) => s.id)),
    [sections],
  );
  const filledCount = filledSectionIds.size;

  const firstId = sections[0]?.id ?? RESEARCH_SECTIONS[0].id;
  const [activeId, setActiveId] = useState<ResearchSection["id"]>(firstId);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  const sectionById = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s])),
    [sections],
  );
  const active = sectionById[activeId] ?? sections[0];

  const updateSection = (id: ResearchSection["id"], text: string) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, text } : s)));
  };

  const applyBulkParse = () => {
    const parsed = splitPasteTemplate(bulkText);
    const next = sections.map((s) => {
      const v = parsed[s.id];
      if (v == null) return s;
      const existing = s.text.trim();
      const incoming = v.trim();
      if (!incoming) return s;
      return {
        ...s,
        text: existing ? `${existing}\n${incoming}` : incoming,
      };
    });
    onChange(next);
    setBulkText("");
    setBulkOpen(false);
  };

  const clearAll = () => onChange(sections.map((s) => ({ ...s, text: "" })));

  const openNotebookLM = () => {
    if (typeof window !== "undefined") {
      window.open("https://notebooklm.google.com/", "_blank", "noopener,noreferrer");
    }
  };

  const pasteFromClipboardTo = async (id: ResearchSection["id"]) => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      onChange(
        sections.map((s) =>
          s.id === id
            ? { ...s, text: s.text.trim() ? `${s.text.trim()}\n\n${text.trim()}` : text.trim() }
            : s,
        ),
      );
      setActiveId(id);
    } catch {
      // Clipboard read can fail (perm / iframe). Surface no error.
    }
  };

  // Honest research-source row
  const sourceRows: SourceRow[] = [
    {
      id: "pasted",
      label: "Pasted Notes",
      state: filledCount > 0 ? "ready" : "off",
      detail:
        filledCount > 0
          ? `${filledCount} of ${sections.length} fields filled`
          : "Paste at least one field to begin",
    },
    {
      id: "memory",
      label: "HMG Memory",
      state: corpusReady ? "ready" : "needsAttention",
      detail: corpusReady
        ? "Brand rules, saved facts, and prior research available"
        : "Sign in to use saved brand rules, facts, and timelines",
    },
    {
      id: "liveWeb",
      label: "Live Web",
      state: liveWebOn ? "ready" : "off",
      detail: liveWebOn
        ? "Connected — used automatically when building"
        : "Not connected. Building from pasted notes and HMG Memory.",
    },
    {
      id: "notebookLM",
      label: "NotebookLM",
      state: filledSectionIds.has("notebookLM") ? "ready" : "off",
      detail: filledSectionIds.has("notebookLM")
        ? "Notes captured"
        : "Paste NotebookLM notes anytime",
    },
  ];

  return (
    <div
      className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-4"
      data-testid="research-intake"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-black tracking-tight">Research Notes</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug max-w-md">
            Paste research from NotebookLM, Gemini, Google, YouTube, interviews, or your own notes. The desk uses every line.
          </p>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
          style={{ background: accent, color: onAccent }}
          data-testid="research-intake-status"
        >
          {filledCount} / {sections.length} filled
        </span>
      </div>

      {/* Research Sources — honest status row */}
      <div
        className="rounded-xl border border-border/40 bg-background/40 p-3"
        data-testid="research-sources-row"
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Research Sources
        </p>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {sourceRows.map((r) => (
            <li
              key={r.id}
              className="flex items-start gap-1.5 text-[12px] leading-snug"
              data-testid={`research-source-${r.id}`}
            >
              <span className="mt-1.5 shrink-0">
                <StatusDot tone={r.state} />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">
                  {r.label}{" "}
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {r.state === "ready"
                      ? "Ready"
                      : r.state === "needsAttention"
                        ? "Needs sign-in"
                        : r.id === "liveWeb"
                          ? "Not connected"
                          : "Not yet"}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground/85">{r.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* NotebookLM helper bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-[11px]"
          onClick={openNotebookLM}
          data-testid="research-open-notebooklm"
        >
          <Brain className="w-3 h-3 mr-1" />
          Open NotebookLM
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-[11px]"
          onClick={() => pasteFromClipboardTo("notebookLM")}
          data-testid="research-paste-notebooklm"
        >
          <ClipboardPaste className="w-3 h-3 mr-1" />
          Paste NotebookLM Notes
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-[11px]"
          onClick={() => pasteFromClipboardTo("geminiResearch")}
          data-testid="research-paste-gemini"
        >
          <ClipboardPaste className="w-3 h-3 mr-1" />
          Paste Gemini / Google Notes
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 text-[11px]"
          onClick={() => pasteFromClipboardTo("youtubeTranscript")}
          data-testid="research-paste-yt"
        >
          <ClipboardPaste className="w-3 h-3 mr-1" />
          Paste Video / Interview Notes
        </Button>
      </div>

      {/* Grouped section pickers */}
      <div className="space-y-3" data-testid="research-groups">
        {RESEARCH_GROUPS.map((group) => (
          <GroupBlock
            key={group.id}
            group={group}
            sections={sections}
            activeId={activeId}
            filled={filledSectionIds}
            accent={accent}
            onAccent={onAccent}
            onPick={setActiveId}
          />
        ))}
      </div>

      {/* Active textarea */}
      {active && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[12px] font-semibold text-foreground/90">
              {active.label}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {filledSectionIds.has(active.id) ? "Captured" : "Empty"}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">{active.helper}</p>
          <Textarea
            data-testid={`research-input-${active.id}`}
            value={active.text}
            onChange={(e) => updateSection(active.id, e.target.value)}
            placeholder={active.placeholder}
            className="min-h-[160px] text-sm leading-relaxed resize-vertical bg-background/50 focus:bg-background"
          />
        </div>
      )}

      {/* Tools row */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-[11px]"
          onClick={() => setBulkOpen((v) => !v)}
          data-testid="research-bulk-toggle"
        >
          {bulkOpen ? (
            <ChevronDown className="w-3 h-3 mr-1" />
          ) : (
            <ChevronRight className="w-3 h-3 mr-1" />
          )}
          Paste full briefing
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-[11px]"
          onClick={() => setGuideOpen((v) => !v)}
          data-testid="research-help-toggle"
        >
          <HelpCircle className="w-3 h-3 mr-1" />
          {guideOpen ? "Hide" : "What should I paste?"}
        </Button>
        {filledCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={clearAll}
            data-testid="research-clear"
          >
            Clear all
          </Button>
        )}
      </div>

      {bulkOpen && (
        <div
          className="space-y-2 rounded-lg border border-dashed border-border/60 bg-background/40 p-3"
          data-testid="research-bulk-area"
        >
          <p className="text-[11px] text-muted-foreground leading-snug">
            Paste the full structured briefing here. Labeled lines (STORY NOTES / TIMELINE / VERIFIED FACTS / QUOTES / CONTEXT / ANGLE / WHAT NOT TO CLAIM / SOURCES) route into the right fields automatically.
          </p>
          <Textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={PASTE_TEMPLATE}
            className="min-h-[220px] text-sm font-mono leading-relaxed resize-vertical bg-background/60"
            data-testid="research-bulk-input"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={applyBulkParse}
              disabled={!bulkText.trim()}
              style={
                bulkText.trim() ? { background: accent, color: onAccent } : undefined
              }
              data-testid="research-bulk-apply"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Route into fields
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setBulkText(PASTE_TEMPLATE)}
              data-testid="research-bulk-fill-template"
            >
              Fill with template
            </Button>
          </div>
        </div>
      )}

      {guideOpen && (
        <div
          className="rounded-lg border border-border/40 bg-background/40 p-3 space-y-2"
          data-testid="research-help"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            What should I paste?
          </p>
          <ul className="text-[12px] text-foreground/85 leading-relaxed space-y-1 list-disc pl-5">
            <li>A short summary of what happened (1–3 sentences).</li>
            <li>The names involved — people, brands, teams, places.</li>
            <li>Timeline beats with absolute dates.</li>
            <li>Confirmed facts. The desk folds them into the body.</li>
            <li>Direct quotes with attribution — never invented.</li>
            <li>Links / sources, one per line.</li>
            <li>NotebookLM, Google/Gemini, and YouTube notes.</li>
            <li>The brand angle you want the desk to take.</li>
            <li>The claims you do NOT want in the article.</li>
          </ul>
          <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap bg-background/60 rounded-md border border-border/40 p-2 font-mono">
{PASTE_TEMPLATE}
          </pre>
        </div>
      )}
    </div>
  );
}

function GroupBlock({
  group,
  sections,
  activeId,
  filled,
  accent,
  onAccent,
  onPick,
}: {
  group: ResearchGroup;
  sections: ResearchSection[];
  activeId: ResearchSection["id"];
  filled: Set<string>;
  accent: string;
  onAccent: string;
  onPick: (id: ResearchSection["id"]) => void;
}) {
  const localSections = group.sectionIds
    .map((id) => sections.find((s) => s.id === id))
    .filter((s): s is ResearchSection => Boolean(s));

  return (
    <div
      className="rounded-xl border border-border/40 bg-background/30 p-3"
      data-testid={`research-group-${group.id}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/85">
        {group.label}
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
        {group.helper}
      </p>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {localSections.map((s) => {
          const isActive = s.id === activeId;
          const isFilled = filled.has(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onPick(s.id)}
              data-testid={`research-tab-${s.id}`}
              className={`h-7 px-3 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-colors inline-flex items-center gap-1.5 ${
                isActive
                  ? "border-transparent"
                  : isFilled
                    ? "border-emerald-500/40 text-foreground"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
              style={isActive ? { background: accent, color: onAccent } : undefined}
            >
              {isFilled ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Circle className="w-3 h-3" />
              )}
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
