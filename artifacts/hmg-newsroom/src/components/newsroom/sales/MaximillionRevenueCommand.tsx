import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SalesLead, SalesLeadInput } from "@/lib/sales";
import { Button } from "@/components/ui/button";
import {
  generateMaximillionChatResponse,
  type MaximillionChatResponse,
} from "@/components/newsroom/sales/maximillionChatEngine";
import {
  formatCurrency,
  mockOpportunities,
} from "@/components/newsroom/sales/mockMaximillionData";
import { relationshipProfiles } from "@/components/newsroom/sales/mockMaximillionV4Data";
import {
  UniversalMediaSource,
  type MediaAction,
  type MediaActionId,
} from "@/components/media/UniversalMediaSource";
import type { MediaItem } from "@/components/media/mediaItem";
import {
  BadgeCheck,
  CircleDollarSign,
  Copy,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  Radio,
  Send,
  X as XIcon,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  Waves,
} from "lucide-react";

const MAXIMILLION_MEDIA_ACTIONS: MediaAction[] = [
  { id: "sponsor-angle", label: "Create Sponsor Angle", primary: true },
  { id: "attach-lead", label: "Attach to Command" },
];

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

type VoicePersona = "Executive" | "Calm" | "Hype" | "Broadcaster";

interface TranscriptLine {
  id: string;
  role: "trent" | "maximillion";
  text: string;
  state: VoiceState | "input";
  ts: string;
}

interface MaximillionRevenueCommandProps {
  leads: SalesLead[];
  onNewLead: () => void;
  onAddLead: (input: SalesLeadInput, sourceLabel: string) => void;
}

interface MinimalSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionResultLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

type SpeechRecognitionCtor = new () => MinimalSpeechRecognition;

const personaVoice: Record<VoicePersona, { rate: number; pitch: number }> = {
  Executive: { rate: 1, pitch: 0.92 },
  Calm: { rate: 0.92, pitch: 0.85 },
  Hype: { rate: 1.12, pitch: 1.1 },
  Broadcaster: { rate: 1.04, pitch: 1 },
};

const quickPrompts: Array<{ id: string; label: string; query: string }> = [
  { id: "money", label: "Money Moves Queue", query: "Max, what should I chase for money today?" },
  { id: "next", label: "Next Best Action", query: "Give me my next best action for money today." },
  { id: "sponsor", label: "Sponsor Opportunity", query: "Give me SportsHaven Super Bowl sponsor ideas." },
  { id: "pitch", label: "Pitch Angle Generator", query: "Give me a sponsor pitch angle for a podcast advertiser." },
  { id: "objection", label: "Sales Objection Response", query: "Give me a sponsor and handle the measurement objection." },
  { id: "partnership", label: "Brand Partnership", query: "Which Haven brand has the highest upside today?" },
  { id: "followup", label: "Follow-up Strategy", query: "What follow-ups and calls should I make today?" },
  { id: "brief", label: "Founder Sales Brief", query: "Brief me with a founder revenue brief." },
];

function spokenSummary(message: string): string {
  const lines = message
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith("Local Mode:"));
  const joined = lines.slice(0, 3).join(". ");
  return joined.length > 260 ? `${joined.slice(0, 257)}…` : joined;
}

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function MaximillionRevenueCommand({
  leads,
  onNewLead,
  onAddLead,
}: MaximillionRevenueCommandProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [persona, setPersona] = useState<VoicePersona>("Executive");
  const [muted, setMuted] = useState(false);
  const [input, setInput] = useState("");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [lastResponse, setLastResponse] = useState<MaximillionChatResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<MediaItem[]>([]);

  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const speakWatchdogRef = useRef<number | null>(null);
  const pendingQueryRef = useRef<number | null>(null);
  const queryTokenRef = useRef(0);
  const mutedRef = useRef(muted);
  const personaRef = useRef(persona);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => {
    personaRef.current = persona;
  }, [persona]);

  const speechSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const recognitionCtor: SpeechRecognitionCtor | null = useMemo(() => {
    if (typeof window === "undefined") return null;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }, []);
  const recognitionSupported = Boolean(recognitionCtor);

  const clearWatchdog = useCallback(() => {
    if (speakWatchdogRef.current !== null) {
      window.clearTimeout(speakWatchdogRef.current);
      speakWatchdogRef.current = null;
    }
  }, []);

  const cancelPendingQuery = useCallback(() => {
    // Invalidate any in-flight response so a stale callback cannot land.
    queryTokenRef.current += 1;
    if (pendingQueryRef.current !== null) {
      window.clearTimeout(pendingQueryRef.current);
      pendingQueryRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    clearWatchdog();
    if (speechSupported) window.speechSynthesis.cancel();
  }, [clearWatchdog, speechSupported]);

  useEffect(() => {
    return () => {
      if (speakWatchdogRef.current !== null) {
        window.clearTimeout(speakWatchdogRef.current);
      }
      if (pendingQueryRef.current !== null) {
        window.clearTimeout(pendingQueryRef.current);
      }
      if (speechSupported) window.speechSynthesis.cancel();
      recognitionRef.current?.stop();
    };
  }, [speechSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!speechSupported || mutedRef.current || !text) {
        setVoiceState("idle");
        return;
      }
      window.speechSynthesis.cancel();
      clearWatchdog();
      setVoiceState("speaking");
      const utterance = new SpeechSynthesisUtterance(text);
      const tuned = personaVoice[personaRef.current];
      utterance.rate = tuned.rate;
      utterance.pitch = tuned.pitch;
      utterance.onstart = () => setVoiceState("speaking");
      utterance.onend = () => {
        clearWatchdog();
        setVoiceState("idle");
      };
      utterance.onerror = () => {
        clearWatchdog();
        setVoiceState("idle");
      };
      window.speechSynthesis.speak(utterance);
      // Watchdog: some browsers (and headless envs) never fire speech events.
      const estimatedMs = Math.min(16000, 1800 + text.length * 70);
      speakWatchdogRef.current = window.setTimeout(() => {
        setVoiceState("idle");
        speakWatchdogRef.current = null;
      }, estimatedMs);
    },
    [clearWatchdog, speechSupported],
  );

  const runQuery = useCallback(
    (raw: string) => {
      const query = raw.trim();
      if (!query) return;
      const stamp = Date.now().toString(36);
      setInput("");
      setTranscript((current) =>
        [
          {
            id: `trent-${stamp}`,
            role: "trent" as const,
            text: query,
            state: "input" as const,
            ts: nowLabel(),
          },
          ...current,
        ].slice(0, 8),
      );
      setVoiceState("thinking");

      const token = (queryTokenRef.current += 1);
      pendingQueryRef.current = window.setTimeout(() => {
        pendingQueryRef.current = null;
        // Bail if Stop/Clear/unmount or a newer query invalidated this run.
        if (token !== queryTokenRef.current) return;
        const response = generateMaximillionChatResponse(query, { leads });
        setLastResponse(response);
        setTranscript((current) =>
          [
            {
              id: `max-${stamp}`,
              role: "maximillion" as const,
              text: response.message,
              state: "speaking" as const,
              ts: nowLabel(),
            },
            ...current,
          ].slice(0, 8),
        );
        if (speechSupported && !mutedRef.current) {
          speak(spokenSummary(response.message));
        } else {
          setVoiceState("idle");
        }
      }, 420);
    },
    [leads, speak, speechSupported],
  );

  const handleMediaPick = useCallback(
    (item: MediaItem, action: MediaActionId) => {
      setAttachedMedia((prev) =>
        prev.some((p) => p.id === item.id) ? prev : [...prev, item],
      );
      if (action === "sponsor-angle") {
        runQuery(
          `Give me a sponsor pitch angle inspired by this media asset: "${item.title}"${
            item.sourceUrl ? ` (${item.sourceUrl})` : ""
          }. Tie it to a Haven brand and a measurable advertiser outcome.`,
        );
      }
    },
    [runQuery],
  );

  const startListening = useCallback(() => {
    if (!recognitionCtor) return;
    try {
      const recognition = new recognitionCtor();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        const heard = event.results?.[0]?.[0]?.transcript ?? "";
        if (heard) runQuery(heard);
      };
      recognition.onerror = () => setVoiceState("idle");
      recognition.onend = () =>
        setVoiceState((prev) => (prev === "listening" ? "idle" : prev));
      recognitionRef.current = recognition;
      setVoiceState("listening");
      recognition.start();
    } catch {
      setVoiceState("idle");
    }
  }, [recognitionCtor, runQuery]);

  const stopAll = useCallback(() => {
    cancelPendingQuery();
    stopSpeaking();
    recognitionRef.current?.stop();
    setVoiceState("idle");
  }, [cancelPendingQuery, stopSpeaking]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      if (next) stopSpeaking();
      return next;
    });
  }, [stopSpeaking]);

  const clearAll = useCallback(() => {
    cancelPendingQuery();
    stopSpeaking();
    recognitionRef.current?.stop();
    setTranscript([]);
    setLastResponse(null);
    setVoiceState("idle");
  }, [cancelPendingQuery, stopSpeaking]);

  const handleCopy = useCallback(async () => {
    if (!lastResponse) return;
    try {
      await navigator.clipboard.writeText(lastResponse.message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [lastResponse]);

  const handleAddSuggestedLead = useCallback(() => {
    if (lastResponse?.leadInput) {
      onAddLead(lastResponse.leadInput, "Maximillion Voice Command");
    } else {
      onNewLead();
    }
  }, [lastResponse, onAddLead, onNewLead]);

  const activeValue = useMemo(
    () =>
      leads
        .filter((lead) => lead.stage !== "closed_won" && lead.stage !== "closed_lost")
        .reduce((sum, lead) => sum + lead.estimatedValue, 0),
    [leads],
  );

  const kpis = [
    { label: "Active Pipeline", value: formatCurrency(activeValue) },
    { label: "Live Leads", value: String(leads.length) },
    { label: "Opportunities", value: String(mockOpportunities.length) },
    { label: "Relationships", value: String(relationshipProfiles.length) },
  ];

  return (
    <section
      data-testid="maximillion-revenue-command"
      className="relative overflow-hidden rounded-2xl border border-amber-200/20 bg-[#05070d] shadow-[0_30px_90px_-40px_rgba(0,0,0,0.95)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_15%_0%,rgba(232,210,166,0.16),transparent_42%),radial-gradient(120%_120%_at_95%_10%,rgba(56,128,255,0.18),transparent_45%),linear-gradient(160deg,rgba(8,12,22,0.2),rgba(2,4,9,0.95))]" />

      <div className="relative p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-8 xl:gap-10">
          {/* IDENTITY + AVATAR */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-200/90">
                Haven Media Group
              </span>
            </div>

            <div className="flex items-center gap-5">
              <CommanderAvatar state={voiceState} />
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-black leading-[0.95] tracking-tight text-white">
                  MAXIMILLION
                </h1>
                <p className="mt-1.5 text-[13px] font-bold uppercase tracking-[0.26em] text-amber-200/90">
                  Revenue Command
                </p>
                <p className="mt-3 max-w-md text-[12px] leading-relaxed text-slate-300/80">
                  Pitch ideas, sponsor leads, follow-ups, and founder briefs —
                  all in one revenue partner.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <StatusChip icon={ShieldCheck} label="Always On" />
              <StatusChip
                icon={Sparkles}
                label="Ready"
              />
              <StatusChip
                icon={speechSupported ? Volume2 : VolumeX}
                label={speechSupported ? "Voice ready on this device" : "Typed mode"}
                tone={speechSupported ? "ok" : "muted"}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2"
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {kpi.label}
                  </div>
                  <div className="mt-0.5 text-sm font-black text-white">
                    {kpi.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={onNewLead}
                data-testid="maximillion-add-lead"
                className="h-11 flex-1 bg-gradient-to-r from-amber-300 to-amber-200 text-[12px] font-black text-black hover:from-amber-200 hover:to-amber-100"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Revenue Lead
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => runQuery("Brief me with a founder revenue brief.")}
                data-testid="maximillion-quick-brief"
                className="h-11 flex-1 border-sky-300/30 bg-sky-500/10 text-[12px] font-bold text-sky-100 hover:bg-sky-500/20"
              >
                <CircleDollarSign className="mr-1 h-4 w-4" />
                Founder Brief
              </Button>
            </div>
          </div>

          {/* VOICE COMMAND CENTER */}
          <div
            data-testid="maximillion-voice-command"
            className="rounded-2xl border border-sky-300/15 bg-black/40 p-3 sm:p-4 backdrop-blur"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sky-100">
                <Radio className="h-4 w-4" />
                <h2 className="text-[13px] font-black tracking-tight">
                  Voice Command
                </h2>
              </div>
              <span
                data-testid="maximillion-avatar-state"
                className="rounded-full border border-amber-200/25 bg-amber-200/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-amber-100"
              >
                {voiceState}
              </span>
            </div>

            {/* CONTROL ROW */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button
                type="button"
                onClick={recognitionSupported ? startListening : undefined}
                disabled={!recognitionSupported || voiceState === "listening"}
                data-testid="maximillion-voice-listen"
                title={
                  recognitionSupported
                    ? "Speak to Maximillion"
                    : "Speech-to-text not supported in this browser — use typed command"
                }
                className="h-11 bg-sky-500 text-[11px] font-bold text-white hover:bg-sky-400 disabled:opacity-40"
              >
                <Mic className="mr-1 h-4 w-4" />
                {voiceState === "listening" ? "Listening…" : "Speak"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={toggleMute}
                data-testid="maximillion-voice-mute"
                className="h-11 border-white/12 bg-white/[0.03] text-[11px] font-bold text-slate-100"
              >
                {muted ? <MicOff className="mr-1 h-4 w-4" /> : <Volume2 className="mr-1 h-4 w-4" />}
                {muted ? "Muted" : "Voice On"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={stopAll}
                data-testid="maximillion-voice-stop"
                className="h-11 border-white/12 bg-white/[0.03] text-[11px] font-bold text-slate-100"
              >
                <Square className="mr-1 h-4 w-4" />
                Stop
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearAll}
                data-testid="maximillion-voice-clear"
                className="h-11 border-white/12 bg-white/[0.03] text-[11px] font-bold text-slate-100"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Clear
              </Button>
            </div>

            {/* VISUALIZER */}
            <div className="mt-3 flex h-12 items-end justify-center gap-1 rounded-xl border border-white/8 bg-black/30 px-3">
              {[14, 26, 38, 22, 32, 18, 30, 24, 36, 20].map((h, i) => (
                <span
                  key={`${h}-${i}`}
                  className={`w-1.5 rounded-full ${
                    voiceState === "speaking"
                      ? "bg-emerald-300/80 animate-pulse"
                      : voiceState === "listening"
                        ? "bg-sky-300/80 animate-pulse"
                        : voiceState === "thinking"
                          ? "bg-amber-200/70 animate-pulse"
                          : "bg-white/15"
                  }`}
                  style={{ height: voiceState === "idle" ? 6 : h }}
                />
              ))}
            </div>

            {/* PERSONA */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Waves className="h-3 w-3" /> Voice
              </span>
              {(Object.keys(personaVoice) as VoicePersona[]).map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={persona === item ? "default" : "outline"}
                  onClick={() => setPersona(item)}
                  className="h-8 px-2.5 text-[10px]"
                  data-testid={`maximillion-voice-persona-${item.toLowerCase()}`}
                >
                  {item}
                </Button>
              ))}
            </div>

            {/* INPUT */}
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                runQuery(input);
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                data-testid="maximillion-voice-input"
                placeholder="Type a money command — Max answers and speaks…"
                className="h-11 min-w-0 flex-1 rounded-xl border border-white/12 bg-black/40 px-3 text-[12px] text-white placeholder:text-slate-500 outline-none focus:border-sky-300/40"
              />
              <Button
                type="submit"
                data-testid="maximillion-voice-send"
                className="h-11 bg-emerald-500 px-4 text-[12px] font-black text-white hover:bg-emerald-400"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>

            {/* QUICK PROMPTS */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => runQuery(prompt.query)}
                  data-testid={`maximillion-voice-prompt-${prompt.id}`}
                  className="rounded-full border border-amber-200/20 bg-amber-200/[0.06] px-2.5 py-1 text-[10px] font-bold text-amber-100/90 transition hover:bg-amber-200/15"
                >
                  {prompt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={onNewLead}
                data-testid="maximillion-voice-prompt-intake"
                className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black text-emerald-100 transition hover:bg-emerald-400/20"
              >
                Lead Capture Bay
              </button>
              <button
                type="button"
                onClick={() => setMediaOpen(true)}
                data-testid="maximillion-add-media"
                className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/25 bg-sky-400/10 px-2.5 py-1 text-[10px] font-black text-sky-100 transition hover:bg-sky-400/20"
              >
                <Paperclip className="h-3 w-3" />
                Attach Media
              </button>
            </div>

            {attachedMedia.length > 0 && (
              <div
                className="mt-2 flex flex-wrap gap-1.5"
                data-testid="maximillion-attached-media"
              >
                {attachedMedia.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-black/40 px-2.5 py-1 text-[10px] font-bold text-slate-100"
                  >
                    <Paperclip className="h-3 w-3 text-slate-400" />
                    <span className="max-w-[140px] truncate">{m.title}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachedMedia((prev) => prev.filter((p) => p.id !== m.id))
                      }
                      aria-label="Remove media"
                      className="text-slate-400 hover:text-white"
                    >
                      <XIcon className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* RESPONSE */}
            <div
              data-testid="maximillion-voice-response"
              className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-white/8 bg-black/30 p-3"
            >
              {transcript.length === 0 ? (
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Maximillion is standing by. Tap a command, speak, or type —
                  he answers and speaks the move out loud (voice depends on
                  your device).
                </p>
              ) : (
                <div className="space-y-2">
                  {transcript.map((line) => (
                    <div
                      key={line.id}
                      className={`rounded-lg border p-2.5 ${
                        line.role === "maximillion"
                          ? "border-amber-200/15 bg-amber-200/[0.04]"
                          : "border-sky-300/15 bg-sky-500/[0.05]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        <span className="flex items-center gap-1">
                          {line.role === "maximillion" ? (
                            <CircleDollarSign className="h-3 w-3 text-amber-200" />
                          ) : (
                            <Mic className="h-3 w-3 text-sky-300" />
                          )}
                          {line.role === "maximillion" ? "Maximillion" : "Trent"}
                        </span>
                        <span>{line.ts}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-100/90">
                        {line.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RESPONSE ACTIONS */}
            {lastResponse && (
              <div className="mt-2 flex flex-wrap gap-2">
                {lastResponse.canCreateLead && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddSuggestedLead}
                    data-testid="maximillion-voice-add-lead"
                    className="h-9 bg-emerald-500 px-3 text-[11px] font-bold text-white hover:bg-emerald-400"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add suggested lead
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  data-testid="maximillion-voice-copy"
                  className="h-9 border-white/12 bg-white/[0.03] px-3 text-[11px] font-bold text-slate-100"
                >
                  {copied ? (
                    <BadgeCheck className="mr-1 h-3.5 w-3.5 text-emerald-300" />
                  ) : (
                    <Copy className="mr-1 h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy answer"}
                </Button>
                <span className="self-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {lastResponse.relatedModule}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <UniversalMediaSource
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        context="maximillion"
        brand={{ color: "#34d399", on: "#04210f" }}
        actions={MAXIMILLION_MEDIA_ACTIONS}
        onPick={handleMediaPick}
        accept="all"
        title="Attach Media to Maximillion"
      />
    </section>
  );
}

function CommanderAvatar({ state }: { state: VoiceState }) {
  const ring =
    state === "speaking"
      ? "border-emerald-300/70 shadow-[0_0_36px_-4px_rgba(16,185,129,0.55)]"
      : state === "listening"
        ? "border-sky-300/70 shadow-[0_0_36px_-4px_rgba(56,189,248,0.55)]"
        : state === "thinking"
          ? "border-amber-200/70 shadow-[0_0_30px_-6px_rgba(232,210,166,0.5)]"
          : "border-amber-200/40 shadow-[0_0_28px_-10px_rgba(232,210,166,0.4)]";

  return (
    <div className="relative shrink-0">
      <div
        className={`relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-amber-100/30 via-[#0c1222] to-[#05070d] ${ring} ${
          state !== "idle" ? "animate-pulse" : ""
        }`}
      >
        <span className="absolute inset-1.5 rounded-xl border border-amber-200/15" />
        <span className="relative font-black text-3xl leading-none text-amber-100 [text-shadow:0_1px_0_rgba(0,0,0,0.4)]">
          M
        </span>
        <span
          className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#05070d] ${
            state === "idle" ? "bg-amber-300" : "bg-emerald-400"
          }`}
        />
      </div>
    </div>
  );
}

function StatusChip({
  icon: Icon,
  label,
  tone = "ok",
}: {
  icon: typeof ShieldCheck;
  label: string;
  tone?: "ok" | "muted";
}) {
  return (
    <span
      className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${
        tone === "ok"
          ? "border-amber-200/20 bg-amber-200/[0.06] text-amber-100/90"
          : "border-white/10 bg-white/[0.03] text-slate-400"
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
