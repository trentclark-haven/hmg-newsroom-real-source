import { FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { SalesLead, SalesLeadInput } from "@/lib/sales";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  generateMaximillionChatResponse,
  maximillionStarterPrompts,
  type MaximillionChatMessage,
  type MaximillionSuggestedAction,
} from "@/components/newsroom/sales/maximillionChatEngine";
import {
  runHavenAIEngine,
  createCorpusRetriever,
  createOllamaCaller,
  useZeroPaidSettings,
  havenMissions,
  HMG_BRAND_ORDER,
  hmgBrandKnowledge,
  type HavenMissionMode,
  type HavenProviderPayload,
  type HavenProviderResult,
} from "@/lib/hmg/haven-ai";
import type { BrandId } from "@/lib/hmg/brandVoiceProfiles";
import {
  appendConversationalMemory,
  readConversationalMemory,
  updateConversationalMemoryFromChat,
  type ConversationalMemory,
} from "@/components/newsroom/sales/mockMaximillionV7Data";
import {
  CalendarPlus,
  Clipboard,
  ExternalLink,
  ListChecks,
  Pin,
  PlusCircle,
  Save,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface MaximillionChatConsoleProps {
  leads: SalesLead[];
  onAddLead: (input: SalesLeadInput, sourceLabel: string) => void;
  queuedPrompt?: { id: string; prompt: string } | null;
  onActivity?: (messageCount: number) => void;
  onMemoryUpdated?: (memory: ConversationalMemory) => void;
}

const CHAT_STORAGE_KEY = "hmg-maximillion-chat-v1";
const TASK_STORAGE_KEY = "hmg-maximillion-chat-tasks-v1";
const EVENT_STORAGE_KEY = "hmg-maximillion-chat-event-ideas-v1";
const MEMORY_STORAGE_KEY = "hmg-maximillion-chat-memory-v1";
const LOCAL_SAVE_MESSAGE = "Saved locally. CRM sync remains provider-optional.";

const API_BASE = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");

const MISSION_OPTIONS: { value: HavenMissionMode; label: string }[] =
  Object.values(havenMissions).map((mission) => ({
    value: mission.id,
    label: mission.label,
  }));

function buildLeadsSummary(leads: SalesLead[]): string {
  return leads
    .slice(0, 12)
    .map(
      (lead) =>
        `${lead.company} — ${lead.stage}, ${lead.priority} priority, est ${lead.estimatedValue}`,
    )
    .join("\n");
}

/**
 * Connected-service caller injected into the Haven AI Engine. It is the ONLY path
 * to a real provider: it hits the secure server proxy and returns a result only
 * when the server confirms a real provider answered. Otherwise it returns null
 * and the engine answers from the local brain. No keys are read client-side.
 */
async function callMaximillionProvider(
  payload: HavenProviderPayload,
): Promise<HavenProviderResult | null> {
  try {
    const res = await fetch(`${API_BASE}/maximillion/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: payload.prompt,
        mode: payload.mission,
        brand: payload.brand,
        leadsSummary: payload.leadsSummary,
        history: payload.history,
        systemHint: payload.systemHint,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      message?: string;
      provider?: string;
    };
    if (
      data?.provider === "openai" &&
      typeof data.message === "string" &&
      data.message.trim()
    ) {
      return { provider: "openai", message: data.message.trim() };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Zero-paid corpus retriever injected into the Haven AI Engine. It hits the
 * owned-intelligence server lane (Postgres full-text search) and grounds the
 * answer on real founder-ingested passages with citations. Returns null on any
 * failure so the engine degrades to an ungrounded answer — never faked sources.
 */
const retrieveCorpus = createCorpusRetriever(API_BASE);

/**
 * Zero-paid local-model lane (Ollama / remote). Tried before any paid provider.
 * Returns null when unavailable so the engine falls back to the local brain.
 */
const callLocalModel = createOllamaCaller(API_BASE);

export function MaximillionChatConsole({
  leads,
  onAddLead,
  queuedPrompt,
  onActivity,
  onMemoryUpdated,
}: MaximillionChatConsoleProps) {
  const [messages, setMessages] = useState<MaximillionChatMessage[]>(() =>
    readMessages(),
  );
  const [memory, setMemory] = useState<ConversationalMemory>(() =>
    readConversationalMemory(),
  );
  const [input, setInput] = useState("");
  const [mission, setMission] = useState<HavenMissionMode>("auto");
  const [brand, setBrand] = useState<BrandId>("master");
  const { settings: zeroPaid } = useZeroPaidSettings();
  const [sending, setSending] = useState(false);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const requestSeq = useRef(0);
  const aiLaneActive = useMemo(
    () => messages.some((message) => message.aiLane),
    [messages],
  );
  const lastQueuedPromptId = useRef<string | null>(null);
  const pinnedCount = useMemo(
    () => messages.filter((message) => message.pinned).length,
    [messages],
  );

  useEffect(() => {
    writeMessages(messages);
  }, [messages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  useEffect(() => {
    onActivity?.(messages.length);
  }, [messages.length, onActivity]);

  useEffect(() => {
    if (!queuedPrompt || queuedPrompt.id === lastQueuedPromptId.current) return;
    lastQueuedPromptId.current = queuedPrompt.id;
    sendPrompt(queuedPrompt.prompt);
  }, [queuedPrompt]);

  function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendPrompt(input);
  }

  async function sendPrompt(prompt: string) {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || sending) return;

    // Each send claims a sequence id. Clearing/restarting the chat bumps the
    // sequence, so a reply still in flight when the user clears is discarded
    // instead of being appended to a fresh thread.
    const myRequest = ++requestSeq.current;

    const history = messages
      .slice(-8)
      .map((message) => ({
        role: (message.role === "trent" ? "user" : "assistant") as
          | "user"
          | "assistant",
        content: message.content,
      }));

    const trentMessage: MaximillionChatMessage = {
      id: createMessageId("trent"),
      role: "trent",
      content: cleanPrompt,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, trentMessage].slice(-80));
    setInput("");
    setSending(true);

    try {
      // The local chat engine always runs: it owns the structured action chips
      // (leads/tasks/events) and feeds conversational memory.
      const response = generateMaximillionChatResponse(cleanPrompt, { leads });
      const nextMemory = updateConversationalMemoryFromChat(
        cleanPrompt,
        response,
      );
      setMemory(nextMemory);
      onMemoryUpdated?.(nextMemory);

      // The Haven AI Engine produces the rich, mission-aware answer. It always
      // runs its local brain and only layers a provider in when one truly
      // answers through the injected caller — never faked.
      const haven = await runHavenAIEngine({
        message: cleanPrompt,
        mission,
        brand,
        module: "maximillion-chat",
        leadsSummary: buildLeadsSummary(leads),
        history,
        callProvider: callMaximillionProvider,
        callLocalModel: zeroPaid.ollamaEnabled ? callLocalModel : undefined,
        enablePaidProvider: zeroPaid.paidEnabled,
        retrieveCorpus,
      });

      // Discard a stale reply if the chat was cleared/restarted mid-flight.
      if (requestSeq.current !== myRequest) return;

      const maxMessage: MaximillionChatMessage = {
        id: createMessageId("max"),
        role: "maximillion",
        content: haven.message,
        createdAt: new Date().toISOString(),
        intent: response.intent,
        response,
        aiLane: haven.lane !== "local",
        provider: haven.providerUsed,
        haven,
      };
      setMessages((current) => [...current, maxMessage].slice(-80));
    } finally {
      if (requestSeq.current === myRequest) setSending(false);
    }
  }

  function copyConversation() {
    const transcript = messages
      .map((message) => {
        const who = message.role === "trent" ? "Trent" : "Maximillion";
        const tag =
          message.role === "maximillion"
            ? message.aiLane
              ? " [AI Lane]"
              : " [Local]"
            : "";
        return `${who}${tag}:\n${message.content}`;
      })
      .join("\n\n");
    copyText(transcript, "Conversation copied");
  }

  function clearConversation() {
    // Invalidate any in-flight AI-lane request so its reply is not appended to
    // the fresh thread, and release the sending lock.
    requestSeq.current += 1;
    setSending(false);
    setMessages([createWelcomeMessage()]);
    toast.success("Maximillion conversation cleared");
  }

  function togglePinned(messageId: string) {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, pinned: !message.pinned } : message,
      ),
    );
  }

  function copyText(text: string, success = "Copied") {
    if (!navigator.clipboard) {
      toast.error("Clipboard is unavailable in this browser.");
      return;
    }
    void navigator.clipboard
      .writeText(text)
      .then(() => toast.success(success))
      .catch(() => toast.error("Could not copy"));
  }

  function saveLocal(storageKey: string, payload: string) {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      const current = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(current) ? current : [];
      window.localStorage.setItem(
        storageKey,
        JSON.stringify([
          {
            id: `max-action-${Date.now().toString(36)}`,
            payload,
            createdAt: new Date().toISOString(),
          },
          ...list,
        ]),
      );
      const nextMemory = appendConversationalMemory(
        storageKey === TASK_STORAGE_KEY
          ? "followUps"
          : storageKey === EVENT_STORAGE_KEY
            ? "unfinishedIdeas"
            : "conversationSummaries",
        payload,
      );
      setMemory(nextMemory);
      onMemoryUpdated?.(nextMemory);
      toast.success(LOCAL_SAVE_MESSAGE);
    } catch {
      toast.error("Could not save locally.");
    }
  }

  function createTask(message: MaximillionChatMessage) {
    saveLocal(TASK_STORAGE_KEY, message.response?.taskNote ?? message.content);
  }

  function createEventIdea(message: MaximillionChatMessage) {
    saveLocal(EVENT_STORAGE_KEY, message.response?.eventIdea ?? message.content);
  }

  function saveMemory(message: MaximillionChatMessage) {
    saveLocal(MEMORY_STORAGE_KEY, message.response?.memoryNote ?? message.content);
  }

  function addLead(message: MaximillionChatMessage) {
    if (message.response?.leadInput) {
      onAddLead(message.response.leadInput, "Maximillion chat");
      const nextMemory = appendConversationalMemory(
        "savedOpportunities",
        message.response.leadInput.company,
      );
      setMemory(nextMemory);
      onMemoryUpdated?.(nextMemory);
      return;
    }
    saveLocal(MEMORY_STORAGE_KEY, message.content);
  }

  function openModule(target: string) {
    const element = document.querySelector<HTMLElement>(target);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      toast.success("Relevant Maximillion module opened");
      return;
    }
    toast.message("Module area is available in More Maximillion Intelligence.");
  }

  function handleSuggestedAction(
    message: MaximillionChatMessage,
    action: MaximillionSuggestedAction,
  ) {
    switch (action.kind) {
      case "lead":
        addLead(message);
        break;
      case "task":
        saveLocal(TASK_STORAGE_KEY, action.payload);
        break;
      case "event":
        saveLocal(EVENT_STORAGE_KEY, action.payload);
        break;
      case "memory":
        saveLocal(MEMORY_STORAGE_KEY, action.payload);
        break;
      case "copy":
        copyText(action.payload, "Draft copied");
        break;
      case "module":
        openModule(action.payload);
        break;
      default:
        saveMemory(message);
    }
  }

  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3 sm:p-4 overflow-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            <h3 className="text-sm font-black tracking-tight">
              Haven AI Engine — Maximillion
            </h3>
            <span
              className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100"
              data-testid="maximillion-engine-status"
            >
              Haven AI Engine Active
            </span>
            <span
              className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                aiLaneActive
                  ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-700 dark:text-emerald-100"
                  : "border-border/45 bg-secondary/30 text-muted-foreground"
              }`}
              data-testid="maximillion-lane-status"
            >
              {aiLaneActive ? "Hybrid Mode" : "Local Brain Active"}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Maximillion's internal brain. It always answers from the Haven local
            intelligence lane; when a provider is connected it layers provider
            reasoning on top (Hybrid). Every reply is labeled honestly. History
            saves locally.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border/45 bg-secondary/30 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {pinnedCount} pinned
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={copyConversation}
            className="h-10 px-2 text-[11px] bg-secondary/30"
            aria-label="Copy full Maximillion conversation"
            data-testid="maximillion-copy-conversation"
          >
            <Clipboard className="h-3.5 w-3.5" />
            Copy
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={clearConversation}
            className="h-10 px-2 text-[11px] bg-secondary/30"
            aria-label="Clear Maximillion conversation"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          Mission
        </span>
        {MISSION_OPTIONS.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            onClick={() => setMission(option.value)}
            className={`h-9 shrink-0 px-2.5 text-[10px] ${
              mission === option.value
                ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-700 dark:text-emerald-100"
                : "bg-secondary/25"
            }`}
            aria-pressed={mission === option.value}
            data-testid={`maximillion-mission-${option.value}`}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          Brand
        </span>
        {HMG_BRAND_ORDER.map((brandId) => (
          <Button
            key={brandId}
            type="button"
            variant="outline"
            onClick={() => setBrand(brandId)}
            className={`h-9 shrink-0 px-2.5 text-[10px] ${
              brand === brandId
                ? "border-sky-300/40 bg-sky-400/15 text-sky-700 dark:text-sky-100"
                : "bg-secondary/25"
            }`}
            aria-pressed={brand === brandId}
            data-testid={`maximillion-brand-${brandId}`}
          >
            {hmgBrandKnowledge[brandId].name}
          </Button>
        ))}
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {maximillionStarterPrompts.map((prompt) => (
          <Button
            key={prompt}
            type="button"
            variant="outline"
            onClick={() => sendPrompt(prompt)}
            className="h-10 shrink-0 px-3 text-[11px] bg-secondary/25"
          >
            {prompt}
          </Button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <MemoryMiniCard label="Last topics" rows={memory.lastTopics} />
        <MemoryMiniCard label="Follow-ups" rows={memory.followUps} />
        <MemoryMiniCard label="Contacts" rows={memory.importantContacts} />
      </div>

      <div className="mt-3 rounded-lg border border-border/45 bg-secondary/25">
        <div
          className="max-h-[420px] space-y-3 overflow-y-auto p-2.5 sm:p-3"
          aria-live="polite"
        >
          {messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              onPin={() => togglePinned(message.id)}
              onCopy={() => copyText(message.content, "Reply copied")}
              onCopyText={(text, label) => copyText(text, label)}
              onTask={() => createTask(message)}
              onLead={() => addLead(message)}
              onEventIdea={() => createEventIdea(message)}
              onMemory={() => saveMemory(message)}
              onSuggestedAction={(action) => handleSuggestedAction(message, action)}
            />
          ))}
          <div ref={messageEndRef} />
        </div>

        <form
          onSubmit={submitPrompt}
          className="border-t border-border/45 p-2.5 sm:p-3"
        >
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Max for money moves, lead ideas, sponsor angles, event plays, or founder strategy..."
              className="min-h-[52px] resize-none bg-secondary/30 text-[12px] leading-relaxed"
              aria-label="Message Maximillion"
            />
            <Button
              type="submit"
              disabled={sending}
              className="h-11 min-w-[96px] text-[12px] bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-60"
              aria-label="Send message to Maximillion"
              data-testid="maximillion-send"
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "Thinking" : "Send"}
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
            <span className="rounded-full border border-border/40 bg-secondary/25 px-2 py-1">
              {leads.length} CRM leads visible
            </span>
            <span className="rounded-full border border-border/40 bg-black/25 px-2 py-1">
              Browser Voice available when supported; provider adapters inactive
            </span>
          </div>
        </form>
      </div>
    </section>
  );
}

function MemoryMiniCard({ label, rows }: { label: string; rows: string[] }) {
  return (
    <div className="rounded-md border border-border/40 bg-secondary/25 p-2 min-w-0">
      <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
        Memory: {label}
      </div>
      <div className="mt-1 truncate text-[11px] text-foreground/80">
        {rows[0] || "Waiting for context"}
      </div>
    </div>
  );
}

function ChatMessageBubble({
  message,
  onPin,
  onCopy,
  onCopyText,
  onTask,
  onLead,
  onEventIdea,
  onMemory,
  onSuggestedAction,
}: {
  message: MaximillionChatMessage;
  onPin: () => void;
  onCopy: () => void;
  onCopyText: (text: string, label: string) => void;
  onTask: () => void;
  onLead: () => void;
  onEventIdea: () => void;
  onMemory: () => void;
  onSuggestedAction: (action: MaximillionSuggestedAction) => void;
}) {
  const isMax = message.role === "maximillion";
  const response = message.response;
  const haven = message.haven;

  return (
    <article className={`flex ${isMax ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-full rounded-lg border p-3 sm:max-w-[88%] ${
          isMax
            ? "border-emerald-300/20 bg-emerald-400/[0.08]"
            : "border-sky-200/20 bg-sky-300/[0.08]"
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
            {isMax ? "Maximillion" : "Trent"}
          </span>
          {isMax && (
            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider ${
                message.aiLane
                  ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-700 dark:text-emerald-100"
                  : "border-border/40 bg-secondary/25 text-muted-foreground"
              }`}
            >
              {message.aiLane ? "AI Lane" : "Local"}
            </span>
          )}
          {response && (
            <>
              <span className="rounded-full border border-border/40 bg-secondary/25 px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                {response.intent.replaceAll("_", " ")}
              </span>
              <span className="rounded-full border border-border/40 bg-secondary/25 px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                {Math.round(response.confidence * 100)}% confidence
              </span>
            </>
          )}
          {message.pinned && (
            <span className="rounded-full border border-amber-200/30 bg-amber-300/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-100">
              Pinned
            </span>
          )}
        </div>

        <p className="mt-2 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-foreground/88">
          {message.content}
        </p>

        {isMax && haven && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
                {haven.laneLabel}
              </span>
              <span className="rounded-full border border-sky-300/30 bg-sky-400/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-sky-700 dark:text-sky-100">
                {haven.brandName}
              </span>
              <span className="rounded-full border border-border/40 bg-secondary/25 px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                {haven.missionLabel}
              </span>
              <span className="rounded-full border border-border/40 bg-secondary/25 px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                {haven.confidence} confidence
              </span>
            </div>

            {haven.sections.length > 0 && (
              <div className="space-y-2">
                {haven.sections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-md border border-border/40 bg-secondary/20 p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-foreground/80">
                        {section.title}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onCopyText(section.body, `${section.title} copied`)
                        }
                        className="shrink-0 text-[9px] uppercase tracking-wider text-emerald-700 hover:underline dark:text-emerald-200"
                        aria-label={`Copy ${section.title}`}
                      >
                        Copy
                      </button>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-foreground/80">
                      {section.body}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {haven.nextActions.length > 0 && (
              <div className="rounded-md border border-emerald-300/20 bg-emerald-400/[0.06] p-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-foreground/80">
                  Next actions
                </div>
                <ul className="mt-1 space-y-0.5">
                  {haven.nextActions.map((action, index) => (
                    <li
                      key={index}
                      className="text-[11px] leading-relaxed text-foreground/80"
                    >
                      • {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(haven.copyPackets.length > 0 || haven.exportPacket) && (
              <div className="flex flex-wrap gap-1.5">
                {haven.copyPackets.map((packet) => (
                  <Button
                    key={packet.id}
                    type="button"
                    variant="outline"
                    onClick={() =>
                      onCopyText(packet.content, `${packet.label} copied`)
                    }
                    className="h-9 px-2.5 text-[10px] bg-secondary/25"
                    aria-label={`Copy ${packet.label}`}
                  >
                    <Clipboard className="h-3.5 w-3.5" />
                    {packet.label}
                  </Button>
                ))}
                {haven.exportPacket && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      onCopyText(haven.exportPacket, "Full reply copied")
                    }
                    className="h-9 px-2.5 text-[10px] border-emerald-300/40 bg-emerald-400/15 text-emerald-700 dark:text-emerald-100"
                    aria-label="Copy full Maximillion reply"
                  >
                    <Clipboard className="h-3.5 w-3.5" />
                    Copy Full Reply
                  </Button>
                )}
              </div>
            )}

            {haven.followUps.length > 0 && (
              <div className="text-[10px] leading-relaxed text-muted-foreground">
                Maximillion can also: {haven.followUps.join("  ·  ")}
              </div>
            )}
          </div>
        )}

        {isMax && response && response.suggestedActions.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {response.suggestedActions.map((action) => (
              <Button
                key={action.id}
                type="button"
                variant="outline"
                onClick={() => onSuggestedAction(action)}
                className="h-10 min-w-0 justify-start px-2 text-[10px] bg-secondary/25"
                aria-label={`${action.label} from Maximillion reply`}
              >
                {iconForAction(action.kind)}
                <span className="truncate">{action.label}</span>
              </Button>
            ))}
          </div>
        )}

        {isMax && (
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionChip label={message.pinned ? "Unpin" : "Pin"} onClick={onPin} icon={<Pin className="h-3.5 w-3.5" />} />
            <ActionChip label="Copy" onClick={onCopy} icon={<Clipboard className="h-3.5 w-3.5" />} />
            {response?.canCreateTask && (
              <ActionChip label="Task" onClick={onTask} icon={<ListChecks className="h-3.5 w-3.5" />} />
            )}
            {response?.canCreateLead && (
              <ActionChip label="Lead" onClick={onLead} icon={<PlusCircle className="h-3.5 w-3.5" />} />
            )}
            {response?.canCreateEventIdea && (
              <ActionChip label="Event" onClick={onEventIdea} icon={<CalendarPlus className="h-3.5 w-3.5" />} />
            )}
            <ActionChip label="Memory" onClick={onMemory} icon={<Save className="h-3.5 w-3.5" />} />
            {response?.outreachDraft && (
              <ActionChip
                label="Draft"
                onClick={() => {
                  if (!navigator.clipboard) {
                    toast.error("Clipboard is unavailable in this browser.");
                    return;
                  }
                  void navigator.clipboard
                    .writeText(response.outreachDraft ?? "")
                    .then(() => toast.success("Outreach draft copied"))
                    .catch(() => toast.error("Could not copy draft"));
                }}
                icon={<Clipboard className="h-3.5 w-3.5" />}
              />
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function ActionChip({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="h-10 min-w-[76px] px-2 text-[10px] bg-secondary/25"
      aria-label={`${label} Maximillion reply`}
    >
      {icon}
      {label}
    </Button>
  );
}

function iconForAction(kind: MaximillionSuggestedAction["kind"]) {
  switch (kind) {
    case "lead":
      return <PlusCircle className="h-3.5 w-3.5 shrink-0" />;
    case "task":
      return <ListChecks className="h-3.5 w-3.5 shrink-0" />;
    case "event":
      return <CalendarPlus className="h-3.5 w-3.5 shrink-0" />;
    case "memory":
      return <Save className="h-3.5 w-3.5 shrink-0" />;
    case "copy":
      return <Clipboard className="h-3.5 w-3.5 shrink-0" />;
    case "module":
      return <ExternalLink className="h-3.5 w-3.5 shrink-0" />;
    default:
      return <Sparkles className="h-3.5 w-3.5 shrink-0" />;
  }
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createWelcomeMessage(): MaximillionChatMessage {
  return {
    id: createMessageId("max"),
    role: "maximillion",
    content:
      "Haven AI Engine online. I'm Maximillion — HMG's revenue and operations strategist. Pick a mission and a brand, then ask me for a sponsorship play, a sales email, a follow-up sequence, an objection handler, a founder briefing, or an LA market move. I run on the Haven local brain right now and layer in a provider automatically when one is connected.",
    createdAt: new Date().toISOString(),
    intent: "unknown",
  };
}

function readMessages(): MaximillionChatMessage[] {
  if (typeof window === "undefined") return [createWelcomeMessage()];
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [createWelcomeMessage()];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return [createWelcomeMessage()];
    return parsed
      .filter((message): message is MaximillionChatMessage =>
        Boolean(
          message &&
            typeof message === "object" &&
            typeof message.id === "string" &&
            (message.role === "trent" || message.role === "maximillion") &&
            typeof message.content === "string",
        ),
      )
      .slice(-80);
  } catch {
    return [createWelcomeMessage()];
  }
}

function writeMessages(messages: MaximillionChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* ignore local history write failures */
  }
}
