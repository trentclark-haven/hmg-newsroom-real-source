import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  generateMaximillionChatResponse,
  type MaximillionChatResponse,
} from "@/components/newsroom/sales/maximillionChatEngine";
import {
  createBrowserSpeechRecognition,
  getBrowserVoiceSupport,
  requestBrowserMicrophonePermission,
  speakWithBrowserSpeech,
  stopBrowserSpeech,
  type BrowserSpeechRecognition,
} from "@/components/newsroom/sales/voice/browserVoiceAdapter";
import {
  maximillionVoiceStatusLabels,
  type MaximillionVoiceHookOptions,
  type MaximillionVoicePermissionState,
  type MaximillionVoiceRuntimeSnapshot,
  type MaximillionVoiceStatus,
  type MaximillionVoiceTranscriptEntry,
  type MaximillionVoiceTranscriptSource,
} from "@/components/newsroom/sales/voice/maximillionVoiceTypes";

const MAX_TRANSCRIPT_LINES = 18;

export function useMaximillionVoice({
  leads,
  onSnapshotChange,
}: MaximillionVoiceHookOptions) {
  const [support, setSupport] = useState(() => getBrowserVoiceSupport());
  const [status, setStatus] = useState<MaximillionVoiceStatus>("idle");
  const [permission, setPermission] =
    useState<MaximillionVoicePermissionState>("unknown");
  const [muted, setMuted] = useState(false);
  const [speechOutputEnabled, setSpeechOutputEnabled] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [lastUserCommand, setLastUserCommand] = useState<string | null>(null);
  const [lastMaxResponse, setLastMaxResponse] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<MaximillionVoiceTranscriptEntry[]>(
    () => [
      createTranscriptEntry({
        speaker: "System",
        text: "Browser Voice is ready to use local browser APIs when this browser supports them. Provider adapters are optional and disabled.",
        status: "idle",
        source: "system",
      }),
    ],
  );
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");

  const snapshot = useMemo<MaximillionVoiceRuntimeSnapshot>(
    () => ({
      status,
      label: maximillionVoiceStatusLabels[status],
      detail: statusDetail(status, support, permission),
      muted,
      support,
      permission,
      lastUserCommand,
      lastMaxResponse,
    }),
    [lastMaxResponse, lastUserCommand, muted, permission, status, support],
  );

  useEffect(() => {
    onSnapshotChange?.(snapshot);
  }, [onSnapshotChange, snapshot]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      stopBrowserSpeech();
    };
  }, []);

  const addTranscriptEntry = useCallback(
    (entry: Omit<MaximillionVoiceTranscriptEntry, "id" | "createdAt">) => {
      setTranscript((current) =>
        [createTranscriptEntry(entry), ...current].slice(0, MAX_TRANSCRIPT_LINES),
      );
    },
    [],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setInterimTranscript("");
    setStatus((current) => (current === "listening" ? "idle" : current));
  }, []);

  const stopSpeaking = useCallback(() => {
    stopBrowserSpeech();
    setStatus((current) => (current === "speaking" ? "idle" : current));
  }, []);

  const speakResponse = useCallback(
    (message: string) => {
      if (!speechOutputEnabled || muted) {
        setStatus(muted ? "muted" : "idle");
        return;
      }

      if (!support.speechSynthesis) {
        addTranscriptEntry({
          speaker: "System",
          text: "Browser text-to-speech is unavailable here. Maximillion's response remains readable on screen.",
          status: "unsupported",
          source: "system",
        });
        setStatus("idle");
        return;
      }

      const started = speakWithBrowserSpeech({
        text: message,
        onStart: () => setStatus("speaking"),
        onEnd: () => setStatus("idle"),
        onError: (errorMessage) => {
          addTranscriptEntry({
            speaker: "System",
            text: errorMessage,
            status: "error",
            source: "system",
          });
          setStatus("error");
        },
      });

      if (!started) setStatus("idle");
    },
    [addTranscriptEntry, muted, speechOutputEnabled, support.speechSynthesis],
  );

  const runCommand = useCallback(
    (command: string, source: MaximillionVoiceTranscriptSource) => {
      const cleanCommand = command.trim();
      if (!cleanCommand) return null;

      stopListening();
      setStatus("transcribing");
      setLastUserCommand(cleanCommand);
      addTranscriptEntry({
        speaker: "Trent",
        text: cleanCommand,
        status: "transcribing",
        source,
      });

      setStatus("thinking");
      const response: MaximillionChatResponse = generateMaximillionChatResponse(
        cleanCommand,
        { leads },
      );
      setLastMaxResponse(response.message);
      addTranscriptEntry({
        speaker: "Maximillion",
        text: response.message,
        status: "thinking",
        source: "system",
        response,
      });
      speakResponse(response.message);
      return response;
    },
    [addTranscriptEntry, leads, speakResponse, stopListening],
  );

  const startListening = useCallback(async () => {
    const latestSupport = getBrowserVoiceSupport();
    setSupport(latestSupport);
    finalTranscriptRef.current = "";
    setInterimTranscript("");

    if (!latestSupport.canListen) {
      setStatus("unsupported");
      setPermission(latestSupport.microphone ? "prompt" : "unsupported");
      addTranscriptEntry({
        speaker: "System",
        text:
          latestSupport.unsupportedReason ??
          "Browser voice recognition is unavailable here. Use the typed command fallback.",
        status: "unsupported",
        source: "system",
      });
      return;
    }

    setStatus("requesting_permission");
    const nextPermission = await requestBrowserMicrophonePermission();
    setPermission(nextPermission);

    if (nextPermission !== "granted") {
      setStatus(nextPermission === "denied" ? "error" : "unsupported");
      addTranscriptEntry({
        speaker: "System",
        text:
          nextPermission === "denied"
            ? "Microphone permission was denied. You can still use the typed voice command box."
            : "Microphone capture is unavailable in this browser. Use typed voice command fallback.",
        status: nextPermission === "denied" ? "error" : "unsupported",
        source: "system",
      });
      return;
    }

    const recognition = createBrowserSpeechRecognition({
      onResult: ({ transcript: spokenText, isFinal }) => {
        setInterimTranscript(spokenText);
        if (!isFinal || finalTranscriptRef.current) return;
        finalTranscriptRef.current = spokenText;
        setInterimTranscript("");
        runCommand(spokenText, "speech");
      },
      onError: (errorMessage) => {
        setStatus("error");
        addTranscriptEntry({
          speaker: "System",
          text: `Browser speech recognition error: ${errorMessage}. Typed fallback remains available.`,
          status: "error",
          source: "system",
        });
      },
      onEnd: () => {
        recognitionRef.current = null;
        setStatus((current) => (current === "listening" ? "idle" : current));
      },
    });

    if (!recognition) {
      setStatus("unsupported");
      addTranscriptEntry({
        speaker: "System",
        text: "Speech recognition is unavailable in this browser. Use typed voice command fallback.",
        status: "unsupported",
        source: "system",
      });
      return;
    }

    recognitionRef.current = recognition;
    setStatus("listening");
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setStatus("error");
      addTranscriptEntry({
        speaker: "System",
        text: "Browser speech recognition could not start. Use typed voice command fallback.",
        status: "error",
        source: "system",
      });
    }
  }, [addTranscriptEntry, runCommand]);

  const toggleMute = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      if (next) {
        stopBrowserSpeech();
        setStatus("muted");
      } else {
        setStatus("idle");
      }
      return next;
    });
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript([
      createTranscriptEntry({
        speaker: "System",
        text: "Transcript cleared. Browser Voice remains available for the next local command.",
        status: "idle",
        source: "system",
      }),
    ]);
    setInterimTranscript("");
    setLastUserCommand(null);
    setLastMaxResponse(null);
    setStatus("idle");
  }, []);

  const refreshSupport = useCallback(() => {
    const latestSupport = getBrowserVoiceSupport();
    setSupport(latestSupport);
    addTranscriptEntry({
      speaker: "System",
      text: latestSupport.unsupportedReason
        ? `Support check: ${latestSupport.unsupportedReason}`
        : "Support check: browser microphone, speech recognition, and speechSynthesis paths are available.",
      status: latestSupport.canListen ? "idle" : "unsupported",
      source: "system",
    });
  }, [addTranscriptEntry]);

  return {
    support,
    status,
    statusLabel: maximillionVoiceStatusLabels[status],
    statusDetail: statusDetail(status, support, permission),
    permission,
    muted,
    speechOutputEnabled,
    interimTranscript,
    transcript,
    lastUserCommand,
    lastMaxResponse,
    snapshot,
    startListening,
    stopListening,
    runCommand,
    toggleMute,
    setSpeechOutputEnabled,
    stopSpeaking,
    clearTranscript,
    refreshSupport,
  };
}

function createTranscriptEntry(
  entry: Omit<MaximillionVoiceTranscriptEntry, "id" | "createdAt">,
): MaximillionVoiceTranscriptEntry {
  return {
    ...entry,
    id: `max-voice-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function statusDetail(
  status: MaximillionVoiceStatus,
  support: ReturnType<typeof getBrowserVoiceSupport>,
  permission: MaximillionVoicePermissionState,
) {
  if (status === "unsupported") {
    return support.unsupportedReason ?? "Browser Voice is unavailable here.";
  }
  if (status === "requesting_permission") {
    return "Requesting microphone access from the browser.";
  }
  if (status === "listening") {
    return "Listening through the browser microphone.";
  }
  if (status === "thinking") {
    return "Routing command through Maximillion's local response engine.";
  }
  if (status === "speaking") {
    return "Speaking with browser speechSynthesis.";
  }
  if (status === "muted") {
    return "Speech output is muted. Responses still render on screen.";
  }
  if (status === "error") {
    return permission === "denied"
      ? "Microphone permission was denied."
      : "Browser Voice hit a local runtime error.";
  }
  if (support.canListen && support.canSpeak) {
    return "Browser Voice is available with no provider key.";
  }
  return support.unsupportedReason ?? "Typed voice command fallback is available.";
}
