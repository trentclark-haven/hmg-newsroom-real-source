import { FormEvent, useState } from "react";
import type { SalesLead } from "@/lib/sales";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { maximillionVoiceAdapters } from "@/components/newsroom/sales/voice/providerVoiceAdapter";
import { useMaximillionVoice } from "@/components/newsroom/sales/voice/useMaximillionVoice";
import type { MaximillionVoiceRuntimeSnapshot } from "@/components/newsroom/sales/voice/maximillionVoiceTypes";
import {
  BadgeCheck,
  Keyboard,
  Mic,
  MicOff,
  Radio,
  RefreshCcw,
  Send,
  Square,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";

interface VoiceModeCenterProps {
  leads: SalesLead[];
  onVoiceStateChange?: (snapshot: MaximillionVoiceRuntimeSnapshot) => void;
  onVoiceActivity?: () => void;
}

export function VoiceModeCenter({
  leads,
  onVoiceStateChange,
  onVoiceActivity,
}: VoiceModeCenterProps) {
  const [typedCommand, setTypedCommand] = useState("");
  const voice = useMaximillionVoice({
    leads,
    onSnapshotChange: onVoiceStateChange,
  });
  const isListening =
    voice.status === "listening" || voice.status === "requesting_permission";

  function submitTypedCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = voice.runCommand(typedCommand, "typed");
    if (response) {
      onVoiceActivity?.();
      setTypedCommand("");
    }
  }

  function toggleListening() {
    if (isListening) {
      voice.stopListening();
      return;
    }
    void voice.startListening().then(() => onVoiceActivity?.());
  }

  return (
    <section
      className="rounded-lg border border-sky-300/20 bg-black/35 p-3 overflow-hidden"
      data-testid="maximillion-voice-mode"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sky-100">
            <Radio className="h-4 w-4" />
            <h3 className="text-sm font-black">Browser Voice Center</h3>
            <span
              className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-100"
              data-testid="maximillion-voice-local-label"
            >
              No-key local fallback
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Browser-first voice uses local browser APIs when supported. Provider
            voice adapters are optional and disabled by default.
          </p>
        </div>
        <div
          className="rounded-full border border-sky-200/20 bg-sky-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-100"
          data-testid="maximillion-voice-status"
        >
          {voice.statusLabel}
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <div className="space-y-3 min-w-0">
          <div className="rounded-lg border border-sky-200/15 bg-black/30 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <SupportTile
                label="Microphone"
                value={voice.support.microphone ? "Available" : "Unavailable"}
                active={voice.support.microphone}
              />
              <SupportTile
                label="Speech recognition"
                value={
                  voice.support.speechRecognition
                    ? "Browser supported"
                    : "Typed fallback"
                }
                active={voice.support.speechRecognition}
              />
              <SupportTile
                label="Speech synthesis"
                value={voice.support.speechSynthesis ? "Can speak" : "Read only"}
                active={voice.support.speechSynthesis}
              />
              <SupportTile
                label="Mic permission"
                value={voice.permission}
                active={voice.permission === "granted"}
              />
            </div>

            <div className="mt-3 rounded-md border border-border/40 bg-black/25 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
              {voice.statusDetail}
            </div>

            {voice.interimTranscript && (
              <div className="mt-2 rounded-md border border-sky-200/20 bg-sky-300/10 p-2.5 text-[11px] leading-relaxed text-sky-50">
                Hearing: {voice.interimTranscript}
              </div>
            )}

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                onClick={toggleListening}
                className={`h-12 min-w-10 text-[12px] ${
                  isListening
                    ? "bg-rose-500 text-white hover:bg-rose-400"
                    : "bg-sky-500 text-white hover:bg-sky-400"
                }`}
                aria-label={
                  isListening
                    ? "Stop Maximillion browser listening"
                    : "Start Maximillion browser voice listening"
                }
                data-testid="maximillion-browser-voice-button"
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                {isListening ? "Stop listening" : "Start browser voice"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={voice.refreshSupport}
                className="h-12 min-w-10 bg-black/30 text-[12px]"
                aria-label="Refresh Maximillion browser voice support"
              >
                <RefreshCcw className="h-4 w-4" />
                Check support
              </Button>
            </div>
          </div>

          <form
            onSubmit={submitTypedCommand}
            className="rounded-lg border border-border/45 bg-black/30 p-3"
          >
            <div className="flex items-center gap-2 text-sky-100">
              <Keyboard className="h-4 w-4" />
              <h4 className="text-[13px] font-black">Typed Voice Fallback</h4>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Works in browsers without speech recognition. The command still
              runs through Maximillion&apos;s local response engine.
            </p>
            <Textarea
              value={typedCommand}
              onChange={(event) => setTypedCommand(event.target.value)}
              placeholder="Say it here if the browser cannot transcribe you..."
              className="mt-3 min-h-[74px] resize-none bg-black/35 text-[12px] leading-relaxed"
              data-testid="maximillion-voice-command-input"
              aria-label="Typed Maximillion voice command fallback"
            />
            <Button
              type="submit"
              className="mt-2 h-11 w-full bg-emerald-500 text-[12px] text-white hover:bg-emerald-400"
              data-testid="maximillion-voice-submit"
            >
              <Send className="h-3.5 w-3.5" />
              Send to Max
            </Button>
          </form>
        </div>

        <div className="space-y-3 min-w-0">
          <div className="rounded-lg border border-border/45 bg-black/30 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sky-100">
                  <Volume2 className="h-4 w-4" />
                  <h4 className="text-[13px] font-black">Speech Output</h4>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Browser speechSynthesis can read Max replies when available.
                </p>
              </div>
              <span className="rounded-full border border-border/45 bg-black/25 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Provider optional
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <Button
                type="button"
                variant="outline"
                onClick={voice.toggleMute}
                className="h-10 min-w-10 bg-black/30 text-[11px]"
                aria-label={voice.muted ? "Unmute Maximillion voice" : "Mute Maximillion voice"}
              >
                {voice.muted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                {voice.muted ? "Muted" : "Voice on"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => voice.setSpeechOutputEnabled((current) => !current)}
                className="h-10 min-w-10 bg-black/30 text-[11px]"
                aria-label="Toggle Maximillion browser speech output"
              >
                {voice.speechOutputEnabled ? "Auto speak" : "Read only"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={voice.stopSpeaking}
                className="h-10 min-w-10 bg-black/30 text-[11px]"
                aria-label="Stop Maximillion speech output"
              >
                <Square className="h-3.5 w-3.5" />
                Stop
              </Button>
            </div>
          </div>

          <div
            className="rounded-lg border border-border/45 bg-black/30 p-3"
            data-testid="maximillion-voice-transcript"
          >
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[13px] font-black">Voice Transcript</h4>
              <Button
                type="button"
                variant="outline"
                onClick={voice.clearTranscript}
                className="h-10 px-2 bg-black/30 text-[10px]"
                aria-label="Clear Maximillion voice transcript"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
            <div className="mt-2 max-h-[350px] space-y-2 overflow-y-auto pr-1">
              {voice.transcript.map((line) => (
                <div
                  key={line.id}
                  className="rounded-md border border-border/40 bg-black/25 p-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>{line.speaker}</span>
                    <span>{line.status.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-foreground/82">
                    {line.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border/45 bg-black/30 p-3">
            <h4 className="text-[13px] font-black">Provider-Agnostic Adapters</h4>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Browser Voice works locally. Provider adapters stay disabled until
              Trent explicitly configures them.
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {maximillionVoiceAdapters.map((adapter) => (
                <div
                  key={adapter.id}
                  className="rounded-md border border-border/40 bg-black/25 p-2"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-foreground">
                    <BadgeCheck
                      className={`h-3.5 w-3.5 shrink-0 ${
                        adapter.status === "active"
                          ? "text-emerald-300"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="truncate">{adapter.label}</span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                    {adapter.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SupportTile({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-2 ${
        active
          ? "border-emerald-300/20 bg-emerald-400/10"
          : "border-border/40 bg-black/25"
      }`}
    >
      <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 truncate text-[11px] font-bold text-foreground/86">
        {value}
      </div>
    </div>
  );
}
