import type {
  MaximillionVoicePermissionState,
  MaximillionVoiceSupport,
} from "@/components/newsroom/sales/voice/maximillionVoiceTypes";

export interface BrowserSpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: ((event: { error?: string; message?: string }) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
}

interface BrowserSpeechRecognitionEvent {
  resultIndex: number;
  results: BrowserSpeechRecognitionResultList;
}

interface BrowserSpeechRecognitionResultList {
  length: number;
  [index: number]: BrowserSpeechRecognitionAlternativeList;
}

interface BrowserSpeechRecognitionAlternativeList {
  isFinal: boolean;
  length: number;
  [index: number]: {
    transcript: string;
    confidence?: number;
  };
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
}

export function getBrowserVoiceSupport(): MaximillionVoiceSupport {
  if (typeof window === "undefined") {
    return {
      hasWindow: false,
      secureContext: false,
      microphone: false,
      speechRecognition: false,
      speechRecognitionName: null,
      speechSynthesis: false,
      canListen: false,
      canSpeak: false,
      unsupportedReason: "Browser APIs are unavailable during server rendering.",
    };
  }

  const recognition = getSpeechRecognitionConstructor();
  const microphone = Boolean(navigator.mediaDevices?.getUserMedia);
  const speechSynthesis = "speechSynthesis" in window && Boolean(window.speechSynthesis);
  const secureContext =
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const speechRecognition = Boolean(recognition);
  const canListen = microphone && speechRecognition && secureContext;
  const unsupportedReason = getUnsupportedReason({
    microphone,
    speechRecognition,
    secureContext,
  });

  return {
    hasWindow: true,
    secureContext,
    microphone,
    speechRecognition,
    speechRecognitionName: recognition?.name ?? null,
    speechSynthesis,
    canListen,
    canSpeak: speechSynthesis,
    unsupportedReason,
  };
}

export function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return null;
  const recognitionWindow = window as SpeechRecognitionWindow;
  return (
    recognitionWindow.SpeechRecognition ??
    recognitionWindow.webkitSpeechRecognition ??
    null
  );
}

export async function requestBrowserMicrophonePermission(): Promise<MaximillionVoicePermissionState> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return "unsupported";
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    for (const track of stream.getTracks()) track.stop();
    return "granted";
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return "denied";
    }
    return "error";
  }
}

export function createBrowserSpeechRecognition({
  onResult,
  onError,
  onEnd,
}: {
  onResult: (result: BrowserSpeechRecognitionResult) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}) {
  const Recognition = getSpeechRecognitionConstructor();
  if (!Recognition) return null;

  const recognition = new Recognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const result = extractSpeechRecognitionResult(event);
    if (result.transcript) onResult(result);
  };
  recognition.onerror = (event) => {
    onError(event.error || event.message || "Browser speech recognition failed.");
  };
  recognition.onend = onEnd;
  return recognition;
}

export function speakWithBrowserSpeech({
  text,
  onStart,
  onEnd,
  onError,
}: {
  text: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onError?.("Browser text-to-speech is unavailable.");
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96;
  utterance.pitch = 0.92;
  utterance.volume = 1;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (event) => {
    onError?.(event.error || "Browser speech playback failed.");
  };
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopBrowserSpeech() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function extractSpeechRecognitionResult(
  event: BrowserSpeechRecognitionEvent,
): BrowserSpeechRecognitionResult {
  let transcript = "";
  let isFinal = false;

  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    transcript += result[0]?.transcript ?? "";
    isFinal = isFinal || result.isFinal;
  }

  return {
    transcript: transcript.trim(),
    isFinal,
  };
}

function getUnsupportedReason({
  microphone,
  speechRecognition,
  secureContext,
}: {
  microphone: boolean;
  speechRecognition: boolean;
  secureContext: boolean;
}) {
  if (!secureContext) return "Browser voice needs localhost or HTTPS.";
  if (!microphone) return "This browser does not expose microphone capture.";
  if (!speechRecognition) {
    return "This browser does not expose speech recognition. Use the typed command fallback.";
  }
  return null;
}
