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
    detail: "Every fact in the draft traces back to a named source or verified note. No unnamed 'insiders' without context.",
    why: "Unverified sources create legal exposure and credibility risk. If you can't name it, flag it.",
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
    detail: `Reads like ${"{silo}"}, not generic copy. The tone, references, and cultural fluency fit the vertical.`,
    why: "Each Haven brand has its own DNA. A hip-hop voice in a fitness article feels wrong, and vice versa.",
    icon: Mic,
  },
  {
    id: "social-package-ready",
    label: "Social package is ready",
    detail: "Social posts are written, platform-appropriate, and match the article's tone and facts.",
    why: "Social is where the article lives or dies. If the posts aren't ready, the package isn't done.",
    icon: Megaphone,
  },
  {
    id: "export-package-clean",
    label: "WordPress / export package is clean",
    detail: "The export has a title, body, excerpt, categories, and tags. No placeholder text or broken formatting.",
    why: "A messy export means manual cleanup in WordPress, which costs time and invites errors.",
    icon: Globe,
  },
  {
    id: "cultural-fluency",
    label: "Cultural fluency reads true",
    detail: "References, slang, and context match how the community actually talks. Not surface-level or performative.",
    why: "Readers can tell when a writer doesn't know the culture. One fake reference loses them forever.",
    icon: Eye,
  },
  {
    id: "no-generic-ai-phrasing",
    label: "No generic AI phrasing",
    detail: "No 'in conclusion', 'delve', 'it's worth noting', or other AI tells. The writing sounds human.",
    why: "AI tells signal lazy work. Readers and editors catch them instantly, and they undercut everything else.",
    icon: PenLine,
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

      {/* Progress bar */}
      {!passed && (
        <div className="mb-3 h-1.5 rounded-full bg-muted/30 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: allPassed ? brandColor : "rgb(245 158 11)",
            }}
          />
        </div>
      )}

      {/* Gate items — premium checklist with expandable why-this-matters */}
      {!passed && (
        <>
          <div className="space-y-1 mb-3">
            {GATE_ITEMS.map((item) => {
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
                    className="w-full flex items-start gap-2.5 text-left py-1.5 px-2 rounded-lg hover:bg-foreground/5 transition-colors"
                  >
                    {done ? (
                      <CheckCircle2
                        className="w-4 h-4 mt-0.5 shrink-0"
                        style={{ color: brandColor }}
                      />
                    ) : (
                      <Circle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground/40" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <ItemIcon className={`w-3 h-3 shrink-0 ${done ? "text-foreground/40" : "text-muted-foreground/60"}`} />
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

          <p className="text-[9px] text-muted-foreground/40 text-center mb-2">
            Double-tap any check to see why it matters
          </p>

          {/* Unlock button */}
          <button
            type="button"
            onClick={onPass}
            disabled={!allPassed}
            data-testid="founder-voice-gate-unlock"
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
