import type { MaximillionVoiceAdapter } from "@/components/newsroom/sales/voice/maximillionVoiceTypes";

export const maximillionVoiceAdapters: MaximillionVoiceAdapter[] = [
  {
    id: "browser-voice",
    label: "Browser Voice",
    providerKind: "browser",
    status: "active",
    description:
      "Uses browser microphone, speech recognition when available, and browser text-to-speech without provider keys.",
    requiresConfiguration: false,
  },
  {
    id: "openai-voice",
    label: "OpenAI Voice",
    providerKind: "provider",
    status: "optional_disabled",
    description:
      "Provider-optional voice adapter slot. Requires explicit future configuration before use.",
    requiresConfiguration: true,
  },
  {
    id: "elevenlabs-voice",
    label: "ElevenLabs Voice",
    providerKind: "provider",
    status: "optional_disabled",
    description:
      "Provider-optional speech adapter slot. Requires explicit future configuration before use.",
    requiresConfiguration: true,
  },
  {
    id: "custom-provider-voice",
    label: "Custom Voice Provider",
    providerKind: "provider",
    status: "optional_disabled",
    description:
      "Portable adapter slot for approved voice systems without locking Maximillion to one vendor.",
    requiresConfiguration: true,
  },
];
