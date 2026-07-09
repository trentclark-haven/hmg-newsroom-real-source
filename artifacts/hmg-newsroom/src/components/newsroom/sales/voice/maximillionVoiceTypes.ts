import type { SalesLead } from "@/lib/sales";
import type { MaximillionChatResponse } from "@/components/newsroom/sales/maximillionChatEngine";

export type MaximillionVoiceProviderKind = "browser" | "provider";

export type MaximillionVoiceStatus =
  | "idle"
  | "requesting_permission"
  | "listening"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "muted"
  | "unsupported"
  | "error";

export type MaximillionVoicePermissionState =
  | "unknown"
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported"
  | "error";

export type MaximillionVoiceTranscriptSource = "speech" | "typed" | "system";

export interface MaximillionVoiceSupport {
  hasWindow: boolean;
  secureContext: boolean;
  microphone: boolean;
  speechRecognition: boolean;
  speechRecognitionName: string | null;
  speechSynthesis: boolean;
  canListen: boolean;
  canSpeak: boolean;
  unsupportedReason: string | null;
}

export interface MaximillionVoiceTranscriptEntry {
  id: string;
  speaker: "Trent" | "Maximillion" | "System";
  text: string;
  status: MaximillionVoiceStatus;
  source: MaximillionVoiceTranscriptSource;
  createdAt: string;
  response?: MaximillionChatResponse;
}

export interface MaximillionVoiceRuntimeSnapshot {
  status: MaximillionVoiceStatus;
  label: string;
  detail: string;
  muted: boolean;
  support: MaximillionVoiceSupport;
  permission: MaximillionVoicePermissionState;
  lastUserCommand: string | null;
  lastMaxResponse: string | null;
}

export interface MaximillionVoiceHookOptions {
  leads: SalesLead[];
  onSnapshotChange?: (snapshot: MaximillionVoiceRuntimeSnapshot) => void;
}

export interface MaximillionVoiceAdapter {
  id: string;
  label: string;
  providerKind: MaximillionVoiceProviderKind;
  status: "active" | "optional_disabled";
  description: string;
  requiresConfiguration: boolean;
}

export const maximillionVoiceStatusLabels: Record<MaximillionVoiceStatus, string> = {
  idle: "Ready",
  requesting_permission: "Requesting mic",
  listening: "Listening",
  transcribing: "Reading command",
  thinking: "Thinking",
  speaking: "Speaking",
  muted: "Muted",
  unsupported: "Browser unavailable",
  error: "Needs attention",
};
