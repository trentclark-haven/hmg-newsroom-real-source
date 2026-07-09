import { useState } from "react";
import { CheckCircle2, Circle, Mic } from "lucide-react";

interface FounderVoiceCheckProps {
  brandColor: string;
  siloName: string;
  /** Optional storage key so check state can persist per-silo / per-mode. */
  storageKey?: string;
  /**
   * Optional suffix appended to the data-testid (e.g. silo + mode), so that
   * multiple instances rendered under `forceMount` tabs don't collide.
   */
  instanceId?: string;
}

const CHECKLIST_ITEMS: { id: string; label: string }[] = [
  { id: "cultural", label: "Cultural fluency reads true (not surface-level)" },
  { id: "no-ai", label: "No generic AI phrasing (no 'in conclusion', no 'delve')" },
  { id: "first-line", label: "Strong first sentence — hooks immediately" },
  { id: "facts", label: "Facts preserved exactly as in the source" },
  { id: "no-fake-slang", label: "No fake/forced slang or stereotypes" },
  { id: "silo-fit", label: "Tone matches the silo (not Trent-bot copy-paste)" },
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

export function FounderVoiceCheck({
  brandColor,
  siloName,
  storageKey,
  instanceId,
}: FounderVoiceCheckProps) {
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

  const completed = CHECKLIST_ITEMS.filter((i) => state[i.id]).length;
  const baseTestId = instanceId
    ? `founder-voice-check-${instanceId}`
    : "founder-voice-check";

  return (
    <div
      data-testid={baseTestId}
      className="rounded-lg border border-border/60 bg-secondary/30 p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5" style={{ color: brandColor }} />
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: brandColor }}
          >
            Founder Voice Quality Check
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {completed}/{CHECKLIST_ITEMS.length}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground/80 mb-2">
        Quick gut-check before pasting into {siloName}. Cancels generic AI tone.
      </p>
      <div className="space-y-1">
        {CHECKLIST_ITEMS.map((item) => {
          const done = Boolean(state[item.id]);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              data-testid={`${baseTestId}-${item.id}`}
              aria-pressed={done}
              className="w-full flex items-start gap-2 text-left text-[12px] py-1 px-1 rounded hover:bg-foreground/5 transition-colors"
            >
              {done ? (
                <CheckCircle2
                  className="w-3.5 h-3.5 mt-0.5 shrink-0"
                  style={{ color: brandColor }}
                />
              ) : (
                <Circle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
              )}
              <span
                className={
                  done ? "text-foreground/60 line-through" : "text-foreground/90"
                }
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
