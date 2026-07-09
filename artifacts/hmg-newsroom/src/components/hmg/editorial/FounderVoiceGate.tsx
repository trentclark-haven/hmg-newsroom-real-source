import { useState } from "react";
import { CircleCheck as CheckCircle2, Circle, ShieldCheck, Lock, Mic, CircleAlert as AlertCircle } from "lucide-react";

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
}

const GATE_ITEMS: GateItem[] = [
  {
    id: "cultural",
    label: "Cultural fluency reads true",
    detail: "Not surface-level. The references, slang, and context match how {silo} actually talks.",
  },
  {
    id: "no-ai",
    label: "No generic AI phrasing",
    detail: "No 'in conclusion', 'delve', 'it's worth noting', or other AI tells.",
  },
  {
    id: "first-line",
    label: "Strong first sentence",
    detail: "Hooks immediately. No throat-clearing or generic setup.",
  },
  {
    id: "facts",
    label: "Facts preserved exactly",
    detail: "Every number, name, and date matches the source notes. Nothing invented.",
  },
  {
    id: "no-fake-slang",
    label: "No fake slang or stereotypes",
    detail: "No forced/performative language. If the voice doesn't fit, rewrite — don't fake it.",
  },
  {
    id: "silo-fit",
    label: "Tone matches the brand",
    detail: "Reads like {silo}, not Trent-bot copy-paste applied to every silo.",
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

  const toggle = (id: string) => {
    setState((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      writeState(storageKey, next);
      return next;
    });
  };

  const completed = GATE_ITEMS.filter((i) => state[i.id]).length;
  const allPassed = completed === GATE_ITEMS.length;

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
            className="w-8 h-8 rounded-xl flex items-center justify-center"
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
                : "Pass all 6 checks to unlock WordPress / Export"}
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
            {completed}/{GATE_ITEMS.length}
          </span>
        </div>
      </div>

      {/* Gate items — premium checklist */}
      {!passed && (
        <>
          <div className="space-y-1.5 mb-3">
            {GATE_ITEMS.map((item) => {
              const done = Boolean(state[item.id]);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
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
                    <span
                      className={`block text-[12px] font-bold ${
                        done ? "text-foreground/50 line-through" : "text-foreground/90"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="block text-[10px] text-muted-foreground/70 leading-snug mt-0.5">
                      {item.detail.replace("{silo}", siloName)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Unlock button — only enabled when all items are checked */}
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
                Check all {GATE_ITEMS.length} to unlock
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

      {/* Passed state — compact confirmation */}
      {passed && (
        <div className="flex items-center gap-2 py-1">
          <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: brandColor }} />
          <p className="text-[12px] font-semibold" style={{ color: brandColor }}>
            All {GATE_ITEMS.length} checks passed. Export unlocked.
          </p>
        </div>
      )}
    </div>
  );
}
