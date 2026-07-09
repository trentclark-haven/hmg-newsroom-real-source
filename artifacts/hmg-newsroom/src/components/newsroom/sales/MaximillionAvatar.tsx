import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  maximillionAvatarPrompts,
  maximillionFutureProviderHooks,
  maximillionPersonalityModes,
  type MaximillionPersonalityModeId,
} from "@/components/newsroom/sales/maximillionAvatarPrompts";
import {
  getAvatarPresenceStyle,
  type MaximillionPresenceState,
} from "@/components/newsroom/sales/mockMaximillionV7Data";
import type { MaximillionVoiceRuntimeSnapshot } from "@/components/newsroom/sales/voice/maximillionVoiceTypes";
import {
  BadgeCheck,
  Clipboard,
  Lock,
  Mic,
  Sparkles,
  UserRound,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";

interface MaximillionAvatarProps {
  presence?: MaximillionPresenceState;
  voiceSnapshot?: MaximillionVoiceRuntimeSnapshot | null;
}

export function MaximillionAvatar({
  presence,
  voiceSnapshot,
}: MaximillionAvatarProps) {
  const [activeMode, setActiveMode] =
    useState<MaximillionPersonalityModeId>("founder");
  const [promptPackOpen, setPromptPackOpen] = useState(false);
  const selectedMode = useMemo(
    () =>
      maximillionPersonalityModes.find((mode) => mode.id === activeMode) ??
      maximillionPersonalityModes[0],
    [activeMode],
  );
  const presenceStyle = useMemo(
    () => getAvatarPresenceStyle(presence?.mode ?? "focused"),
    [presence?.mode],
  );
  const voiceState = getVoiceAvatarState(voiceSnapshot);

  function copyPrompt(prompt: string) {
    if (!navigator.clipboard) {
      toast.error("Clipboard is unavailable in this browser.");
      return;
    }
    void navigator.clipboard
      .writeText(prompt)
      .then(() => toast.success("Avatar prompt copied"))
      .catch(() => toast.error("Could not copy prompt"));
  }

  return (
    <section className="rounded-lg border border-sky-300/20 bg-black/35 p-3 sm:p-4 overflow-hidden">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.92fr)_minmax(260px,1.08fr)]">
        <div
          className={`rounded-lg border border-sky-200/15 p-3 min-w-0 ${presenceStyle.shell}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-100">
                  Browser-Only
                </span>
                <span className="rounded-full border border-sky-200/20 bg-sky-300/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-sky-100">
                  {voiceState.badge}
                </span>
                {presence && (
                  <span className="rounded-full border border-sky-200/20 bg-black/30 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-sky-100">
                    {presence.label}
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-xl font-black tracking-tight text-white">
                Maximillion™
              </h3>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-100/75">
                Chief Revenue Executive
              </p>
            </div>
            <span
              className={`relative mt-1 flex h-3 w-3 shrink-0 ${
                presence?.intensity === "high" || voiceState.active ? "scale-125" : ""
              }`}
              aria-hidden="true"
            >
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                  voiceState.active ? "bg-sky-300" : "bg-emerald-300"
                }`}
              />
              <span className={`relative inline-flex h-3 w-3 rounded-full ${voiceState.dot}`} />
            </span>
          </div>

          <div className="mt-4 flex min-h-[160px] items-center justify-center rounded-lg border border-sky-200/15 bg-black/35 p-4">
            <div
              className={`relative flex h-32 w-32 items-center justify-center rounded-full border border-sky-200/25 ${presenceStyle.frame} ${voiceState.ring}`}
            >
              <div className="absolute inset-3 rounded-full border border-sky-100/10" />
              <UserRound className="h-14 w-14 text-sky-100" />
              <div className="absolute bottom-3 rounded-full border border-emerald-300/25 bg-black/70 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-100">
                MAX
              </div>
            </div>
          </div>

          <p className="mt-3 text-[12px] leading-relaxed text-sky-50/82">
            Responsive avatar presence for Maximillion: a cool, polished Black
            revenue executive with icy silver-blue command-room energy. Visual
            generation is provider-optional; this card responds to browser voice
            and local command activity now.
          </p>
          <div className="mt-2 rounded-md border border-sky-200/15 bg-black/30 p-2 text-[10px] leading-relaxed text-sky-50/78">
            Visual state: {presenceStyle.label} · {voiceState.detail}
            {presence ? ` · ${presence.status}` : ""}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex min-h-10 items-center gap-2 rounded-md border border-sky-200/15 bg-black/30 px-2 text-[11px] text-sky-50/82">
              <Mic className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{voiceState.actionLabel}</span>
            </div>
            <div className="flex min-h-10 items-center gap-2 rounded-md border border-sky-200/15 bg-black/30 px-2 text-[11px] text-sky-50/82">
              {voiceSnapshot?.muted ? (
                <VolumeX className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">
                {voiceSnapshot?.muted ? "Speech muted" : "Browser speech output"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 min-w-0">
          <div className="rounded-lg border border-sky-200/15 bg-black/30 p-3">
            <div className="flex items-center gap-2 text-sky-100">
              <Sparkles className="h-4 w-4" />
              <h4 className="text-sm font-black">Personality Mode</h4>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              {selectedMode.description}
            </p>
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
              {maximillionPersonalityModes.map((mode) => (
                <Button
                  key={mode.id}
                  type="button"
                  size="sm"
                  variant={mode.id === activeMode ? "default" : "outline"}
                  onClick={() => setActiveMode(mode.id)}
                  className="h-10 shrink-0 px-3 text-[11px]"
                  aria-pressed={mode.id === activeMode}
                >
                  {mode.label}
                </Button>
              ))}
            </div>
            <div className="mt-3 rounded-md border border-emerald-300/15 bg-emerald-400/10 p-2.5 text-[12px] leading-relaxed text-emerald-50/90">
              {presence?.status ?? selectedMode.statusLine}
            </div>
          </div>

          <div className="rounded-lg border border-border/45 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sky-100">
                  <BadgeCheck className="h-4 w-4" />
                  <h4 className="text-sm font-black">Provider-Agnostic Options</h4>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Browser/local paths work without keys; provider adapters stay
                  inactive until explicitly configured.
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {maximillionFutureProviderHooks.map((hook) => (
                <div
                  key={hook.id}
                  className="rounded-md border border-border/40 bg-black/25 p-2 min-w-0"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-foreground">
                    {hook.status === "active_local" ? (
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate">{hook.label}</span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                    {hook.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-sky-200/15 bg-black/30 p-3">
            <button
              type="button"
              onClick={() => setPromptPackOpen((current) => !current)}
              className="flex min-h-10 w-full items-center justify-between gap-2 text-left"
              aria-expanded={promptPackOpen}
            >
              <div className="min-w-0">
                <div className="text-sm font-black text-sky-100">
                  Avatar Prompt Pack
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Original character prompts for approved visual production.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-sky-200/15 bg-sky-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-100">
                {promptPackOpen ? "Hide" : "Open"}
              </span>
            </button>

            {promptPackOpen && (
              <div className="mt-3 grid gap-2">
                {maximillionAvatarPrompts.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-border/40 bg-black/25 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[12px] font-black text-foreground">
                          {item.label}
                        </div>
                        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                          {item.usage}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => copyPrompt(item.prompt)}
                        className="h-10 shrink-0 px-2 text-[10px] bg-black/30"
                        aria-label={`Copy ${item.label} avatar prompt`}
                      >
                        <Clipboard className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function getVoiceAvatarState(snapshot?: MaximillionVoiceRuntimeSnapshot | null) {
  if (!snapshot) {
    return {
      badge: "Browser Voice",
      detail: "voice status waiting",
      actionLabel: "Browser voice ready",
      dot: "bg-emerald-300",
      ring: "",
      active: false,
    };
  }

  switch (snapshot.status) {
    case "listening":
      return {
        badge: "Listening",
        detail: "listening through browser microphone",
        actionLabel: "Listening now",
        dot: "bg-sky-300",
        ring: "shadow-[0_0_58px_rgba(56,189,248,0.32)]",
        active: true,
      };
    case "thinking":
    case "transcribing":
      return {
        badge: snapshot.label,
        detail: "routing command through local Max logic",
        actionLabel: "Processing command",
        dot: "bg-amber-300",
        ring: "shadow-[0_0_58px_rgba(251,191,36,0.22)]",
        active: true,
      };
    case "speaking":
      return {
        badge: "Speaking",
        detail: "speaking with browser speechSynthesis",
        actionLabel: "Speaking reply",
        dot: "bg-emerald-300",
        ring: "shadow-[0_0_60px_rgba(16,185,129,0.28)]",
        active: true,
      };
    case "muted":
      return {
        badge: "Muted",
        detail: "speech output muted",
        actionLabel: "Voice muted",
        dot: "bg-slate-300",
        ring: "opacity-90",
        active: false,
      };
    case "unsupported":
    case "error":
      return {
        badge: snapshot.label,
        detail: snapshot.detail,
        actionLabel: "Typed fallback active",
        dot: "bg-rose-300",
        ring: "shadow-[0_0_44px_rgba(251,113,133,0.18)]",
        active: false,
      };
    default:
      return {
        badge: snapshot.label,
        detail: snapshot.detail,
        actionLabel: snapshot.support.canListen ? "Browser voice ready" : "Typed fallback active",
        dot: "bg-emerald-300",
        ring: "",
        active: false,
      };
  }
}
