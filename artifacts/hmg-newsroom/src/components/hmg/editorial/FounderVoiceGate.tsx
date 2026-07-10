import { useState } from "react";
import {
  CircleCheck as CheckCircle2,
  Circle,
  ShieldCheck,
  Lock,
  Mic,
  CircleAlert as AlertCircle,
  Eye,
  FileCheck,
  Megaphone,
  Globe,
  PenLine,
  Newspaper,
  Link2,
  Sparkles,
  ChevronDown,
} from "lucide-react";

interface FounderVoiceGateProps {
  brandColor: string;
  onAccent: string;
  siloName: string;
  storageKey?: string;
  onPass: () => void;
  passed: boolean;
  /** Optional article quality score to show alongside the gate. */
  qualityScore?: number;
}

export type GateStatus =
  | "ready-for-founder-review"
  | "ready-for-wordpress"
  | "needs-verification"
  | "needs-safer-headline"
  | "needs-source-credit"
  | "social-not-ready"
  | "visual-handoff-missing"
  | "no-unsupported-claims";

interface GateItem {
  id: string;
  label: string;
  detail: string;
  why: string;
  icon: typeof ShieldCheck;
}

const GATE_ITEMS: GateItem[] = [
  {
    id: "source-confirmed",
    label: "Source is confirmed",
    detail: "Every fact in the draft traces back to a named source or verified note. No unnamed insiders without context.",
    why: "Unverified sources create legal exposure and credibility risk. If you cannot name it, flag it.",
    icon: FileCheck,
  },
  {
    id: "no-unsupported-claims",
    label: "No unsupported claims",
    detail: "Numbers, dates, names, and quotes all match the source notes. Nothing was invented or embellished.",
    why: "One wrong number destroys trust in the entire piece. Check every claim against your notes.",
    icon: ShieldCheck,
  },
  {
    id: "headline-strong-not-reckless",
    label: "Headline is strong but not reckless",
    detail: "The headline grabs attention without overstating, misleading, or creating legal exposure.",
    why: "A reckless headline can trigger a takedown, a lawsuit, or a credibility hit that lasts for years.",
    icon: PenLine,
  },
  {
    id: "voice-matches-brand",
    label: "Voice matches the brand",
    detail: "Reads like {silo}, not generic copy. The tone, references, and cultural fluency fit the vertical.",
    why: "Each Haven brand has its own DNA. A hip-hop voice in a fitness article feels wrong, and vice versa.",
    icon: Mic,
  },
  {
    id: "source-links-attached",
    label: "Source links are attached",
    detail: "At least one source URL is included so readers and editors can trace claims back to origin.",
    why: "A story with no links is a story with no trail. If the link is missing, the package is not done.",
    icon: Link2,
  },
  {
    id: "social-package-ready",
    label: "Social package is ready",
    detail: "Social posts are written, platform-appropriate, and match the article tone and facts.",
    why: "Social is where the article lives or dies. If the posts are not ready, the package is not done.",
    icon: Megaphone,
  },
  {
    id: "visual-handoff-ready",
    label: "Visual / edit handoff is ready",
    detail: "WebArt brief or WebEdit cut notes are prepared so the visual team can move without guessing.",
    why: "A text-only package forces the visual team to improvise. A brief takes five minutes and saves hours.",
    icon: Newspaper,
  },
  {
    id: "export-package-clean",
    label: "WordPress export package is clean",
    detail: "The export has a title, body, excerpt, categories, and tags. No placeholder text or broken formatting.",
    why: "A messy export means manual cleanup in WordPress, which costs time and invites errors.",
    icon: Globe,
  },
  {
    id: "cultural-fluency",
    label: "Cultural fluency reads true",
    detail: "References, slang, and context match how the community actually talks. Not surface-level or performative.",
    why: "Readers can tell when a writer does not know the culture. One fake reference loses them forever.",
    icon: Eye,
  },
  {
    id: "no-generic-ai-phrasing",
    label: "No generic AI phrasing",
    detail: "No 'in conclusion', 'delve', 'it is worth noting', or other AI tells. The writing sounds human.",
    why: "AI tells signal lazy work. Readers and editors catch them instantly, and they undercut everything else.",
    icon: Sparkles,
  },
];

function readState(key?: string): Record<string, boolean> {
  if (!key || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, boolean>)
      : {};
  } catch {
    return {};
  }
}

function writeState(key: string | undefined, state: Record<string, boolean>) {
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function gateStatus(
  completed: number,
  total: number,
  hasOutput: boolean,
  hasSocial: boolean,
  hasVisual: boolean,
): GateStatus {
  if (completed === total) return "ready-for-wordpress";
  if (completed >= total - 2 && hasOutput) return "ready-for-founder-review";
  if (!hasSocial) return "social-not-ready";
  if (!hasVisual) return "visual-handoff-missing";
  if (completed < 4) return "needs-verification";
  return "needs-source-credit";
}

const STATUS_LABELS: Record<GateStatus, { label: string; detail: string; color: string }> = {
  "ready-for-wordpress": {
    label: "Ready for WordPress Draft",
    detail: "All quality checks passed. Export unlocked.",
    color: "rgb(16 185 129)",
  },
  "ready-for-founder-review": {
    label: "Ready for Founder Review",
    detail: "Nearly complete. Founder can review and clear the final checks.",
    color: "rgb(14 165 233)",
  },
  "needs-verification": {
    label: "Needs More Verification",
    detail: "Source coverage is too thin. Add confirmed facts before exporting.",
    color: "rgb(244 63 94)",
  },
  "needs-safer-headline": {
    label: "Needs Safer Headline",
    detail: "The headline may overstate or create legal exposure. Rephrase before export.",
    color: "rgb(245 158 11)",
  },
  "needs-source-credit": {
    label: "Needs Source / Credit",
    detail: "Missing source links or credit attribution. Add before export.",
    color: "rgb(245 158 11)",
  },
  "social-not-ready": {
    label: "Social Package Not Ready",
    detail: "Social posts are not generated or reviewed. Complete the social package first.",
    color: "rgb(168 85 247)",
  },
  "visual-handoff-missing": {
    label: "Visual / Edit Handoff Missing",
    detail: "No WebArt brief or WebEdit cut notes prepared. Add a visual handoff before export.",
    color: "rgb(168 85 247)",
  },
  "no-unsupported-claims": {
    label: "No Unsupported Claims",
    detail: "One or more claims lack source confirmation. Verify or remove before export.",
    color: "rgb(244 63 94)",
  },
};

export function FounderVoiceGate({
  brandColor,
  onAccent,
  siloName,
  storageKey,
  onPass,
  passed,
  qualityScore,
}: FounderVoiceGateProps) {
  const [state, setState] = useState<Record<string, boolean>>(() =>
    readState(storageKey),
  );
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showAllChecks, setShowAllChecks] = useState(false);

  const toggle = (id: string) => {
    setState((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      writeState(storageKey, next);
      return next;
    });
  };

  const completed = GATE_ITEMS.filter((i) => state[i.id]).length;
  const total = GATE_ITEMS.length;
  const allPassed = completed === total;
  const progressPct = Math.round((completed / total) * 100);

  const visibleItems = showAllChecks ? GATE_ITEMS : GATE_ITEMS.slice(0, 6);
  const hiddenCount = total - visibleItems.length;

  return (
    <div
      data-testid="founder-voice-gate"
      className="rounded-2xl border-2 p-4 transition-all"
      style={{
        borderColor: passed ? `${brandColor}80` : "rgb(229 231 235 / 0.2)",
        background: passed ? `${brandColor}08` : "rgb(128 128 128 / 0.05)",
      }}
    >
      {/* Gate header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{ background: passed ? brandColor : "rgb(128 128 128 / 0.2)" }}
          >
            {passed ? (
              <ShieldCheck className="w-4 h-4" style={{ color: onAccent }} />
            ) : (
              <Mic className="w-4 h-4" style={{ color: brandColor }} />
            )}
          </div>
          <div>
            <p
              className="text-[12px] font-black uppercase tracking-wider"
              style={{ color: passed ? brandColor : "rgb(128 128 128 / 0.8)" }}
            >
              {passed ? "Quality Gate Passed" : "Founder Voice Quality Gate"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {passed
                ? "Article cleared for export"
                : `Pass all ${total} checks to unlock WordPress / Export`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {qualityScore !== undefined && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
              style={{
                background: qualityScore >= 70 ? "rgb(16 185 129 / 0.15)" : "rgb(245 158 11 / 0.15)",
                color: qualityScore >= 70 ? "rgb(52 211 153)" : "rgb(251 191 36)",
              }}
            >
              Score {qualityScore}
            </span>
          )}
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: allPassed ? brandColor : "rgb(128 128 128 / 0.6)" }}
          >
            {completed}/{total}
          </span>
        </div>
      </div>

      {/* Progress bar with score */}
      {!passed && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Gate Progress
            </span>
            <span
              className="text-[10px] font-black"
              style={{ color: allPassed ? brandColor : "rgb(245 158 11)" }}
            >
              {progressPct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: allPassed ? brandColor : "rgb(245 158 11)",
              }}
            />
          </div>
        </div>
      )}

      {/* Gate items — premium checklist with expandable why-this-matters */}
      {!passed && (
        <>
          <div className="space-y-1 mb-3">
            {visibleItems.map((item) => {
              const done = Boolean(state[item.id]);
              const isExpanded = expandedItem === item.id;
              const ItemIcon = item.icon;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    onDoubleClick={() => setExpandedItem(isExpanded ? null : item.id)}
                    data-testid={`founder-voice-gate-${item.id}`}
                    aria-pressed={done}
                    aria-label={`${item.label}: ${done ? "checked" : "unchecked"}. Double-tap to see why this matters.`}
                    className="w-full flex items-start gap-2.5 text-left py-1.5 px-2 rounded-lg hover:bg-foreground/5 transition-colors"
                  >
                    {done ? (
                      <CheckCircle2
                        className="w-4 h-4 mt-0.5 shrink-0"
                        style={{ color: brandColor }}
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/40" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <ItemIcon className={`w-3 h-3 shrink-0 ${done ? "text-foreground/40" : "text-muted-foreground/60"}`} aria-hidden="true" />
                        <span
                          className={`text-[12px] font-bold ${done ? "text-foreground/50 line-through" : "text-foreground/90"}`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <span className="block text-[10px] text-muted-foreground/70 leading-snug mt-0.5">
                        {item.detail.replace("{silo}", siloName)}
                      </span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="ml-7 mb-1.5 rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2">
                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">
                        Why this matters
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-snug">
                        {item.why}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {hiddenCount > 0 && !showAllChecks && (
            <button
              type="button"
              onClick={() => setShowAllChecks(true)}
              className="w-full text-center text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors py-1.5 mb-2 flex items-center justify-center gap-1"
              aria-label={`Show ${hiddenCount} more quality checks`}
            >
              <ChevronDown className="w-3 h-3" />
              Show {hiddenCount} more checks
            </button>
          )}

          <p className="text-[9px] text-muted-foreground/40 text-center mb-2">
            Double-tap any check to see why it matters
          </p>

          {/* Unlock button */}
          <button
            type="button"
            onClick={onPass}
            disabled={!allPassed}
            data-testid="founder-voice-gate-unlock"
            aria-label={allPassed ? "Unlock export — all quality checks passed" : `Check all ${total} items to unlock export`}
            className="w-full h-10 rounded-full font-black text-[12px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            style={
              allPassed
                ? { background: brandColor, color: onAccent }
                : {
                    background: "rgb(128 128 128 / 0.15)",
                    color: "rgb(128 128 128 / 0.5)",
                    cursor: "not-allowed",
                  }
            }
          >
            {allPassed ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                Unlock Export
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Check all {total} to unlock
              </>
            )}
          </button>

          {!allPassed && (
            <p className="text-[10px] text-muted-foreground/60 text-center mt-2 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Export is locked until every check passes. This is a quality gate, not a formality.
            </p>
          )}
        </>
      )}

      {/* Passed state — premium confirmation */}
      {passed && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 py-1">
            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: brandColor }} />
            <p className="text-[12px] font-semibold" style={{ color: brandColor }}>
              All {total} checks passed. Export unlocked.
            </p>
          </div>
          <div
            className="rounded-lg border p-2.5 text-center"
            style={{ borderColor: `${brandColor}30`, background: `${brandColor}05` }}
          >
            <Eye className="w-5 h-5 mx-auto mb-1" style={{ color: brandColor }} />
            <p className="text-[11px] font-bold" style={{ color: brandColor }}>
              Ready for Founder Review
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              All quality checks passed. The founder can review and publish with confidence.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
