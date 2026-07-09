export type MaximillionPersonalityModeId =
  | "founder"
  | "harvard-mba"
  | "shark-tank"
  | "media-exec"
  | "sports-agent"
  | "festival-planner";

export interface MaximillionPersonalityMode {
  id: MaximillionPersonalityModeId;
  label: string;
  description: string;
  statusLine: string;
}

export interface MaximillionAvatarPrompt {
  id: string;
  label: string;
  usage: string;
  prompt: string;
}

export interface MaximillionFutureProviderHook {
  id: string;
  label: string;
  status: "active_local" | "provider_optional";
  note: string;
}

export const maximillionPersonalityModes: MaximillionPersonalityMode[] = [
  {
    id: "founder",
    label: "Founder Mode",
    description:
      "Direct, protective of Trent's time, focused on leverage, proof, and the next best ask.",
    statusLine: "Watching revenue lanes. Waiting for your next play.",
  },
  {
    id: "harvard-mba",
    label: "Harvard MBA Mode",
    description:
      "Structured around margin, package value, buyer segmentation, and execution discipline.",
    statusLine: "Pricing the package before the room starts negotiating.",
  },
  {
    id: "shark-tank",
    label: "Shark Tank Mode",
    description:
      "Fast pressure-test of offer clarity, proof, pricing, objections, and close probability.",
    statusLine: "Pressure-testing the deal until the value is clean.",
  },
  {
    id: "media-exec",
    label: "Media Executive Mode",
    description:
      "Sponsorship inventory, branded content, rate cards, and direct-sold media strategy.",
    statusLine: "Turning audience attention into sponsor-safe inventory.",
  },
  {
    id: "sports-agent",
    label: "Sports Agent Mode",
    description:
      "Deadline-aware relationship strategy for sports, athletes, venues, and tentpole moments.",
    statusLine: "The ball is moving. The next call needs a clear ask.",
  },
  {
    id: "festival-planner",
    label: "Festival Planner Mode",
    description:
      "Event, talent, sponsor, recap, and local activation strategy for culture moments.",
    statusLine: "Building the pre-event story, on-site moment, and recap value.",
  },
];

export const maximillionAvatarPrompts: MaximillionAvatarPrompt[] = [
  {
    id: "executive-portrait",
    label: "Executive portrait",
    usage: "Premium hero portrait for Maximillion profile surfaces.",
    prompt:
      "Original character portrait of Maximillion, a cool polished Black revenue executive for Haven Media Group, confident and wise, wearing a premium black suit with subtle performance techwear details, icy silver-blue accent lighting, cinematic media command room background, elegant HMG revenue HUD elements, sophisticated business presence, high-end editorial portrait quality, blue silver black premium palette, original design, no copyrighted character likeness, not over-logoed.",
  },
  {
    id: "revenue-command-room",
    label: "Revenue command room",
    usage: "Wide interface and deck background concept.",
    prompt:
      "Cinematic revenue intelligence command room for Haven Media Group, Maximillion standing near translucent revenue dashboards, sponsor pipeline maps, global market timelines, and media inventory charts, icy blue and silver light over deep black surfaces, premium entertainment executive atmosphere, LA media strategy energy, original futuristic business scene, sophisticated Black executive presence, tasteful HMG branding, no copyrighted character likeness.",
  },
  {
    id: "voice-assistant-bust",
    label: "Voice assistant bust",
    usage: "Speaking avatar and voice mode concept.",
    prompt:
      "Original speaking assistant bust of Maximillion, sophisticated Black chief revenue executive, calm confident expression, subtle animated-presence feel, blue silver rim lighting, polished suit collar with techwear texture, premium revenue HUD circle behind him, clean dark background for chatbot UI, cinematic portrait quality, no copyrighted character likeness, designed for future voice assistant use.",
  },
  {
    id: "mobile-chatbot-avatar",
    label: "Mobile chatbot avatar",
    usage: "Compact mobile app avatar icon.",
    prompt:
      "Compact mobile chatbot avatar icon for Maximillion, original Black executive character, confident eyes, clean silhouette, icy silver-blue glow, dark premium circular frame, small HMG revenue signal mark, readable at app icon size, luxury media technology style, no copyrighted character likeness, no busy background.",
  },
  {
    id: "full-body-strategist",
    label: "Full-body sales strategist",
    usage: "Full-body avatar and product concept art.",
    prompt:
      "Full-body original character concept of Maximillion, a stylish Black sales strategist and chief revenue executive, premium suit mixed with subtle performance techwear, standing in a media sales war room with sponsor decks, rate-card panels, and event calendars floating around him, confident composed posture, blue silver black palette, cinematic lighting, high-end business editorial quality, no copyrighted character likeness.",
  },
  {
    id: "night-shift-global-hunter",
    label: "Night-shift global hunter",
    usage: "Global Hunter and mission mode concept.",
    prompt:
      "Event and night-shift global hunter scene for Maximillion, original Black revenue executive reviewing Europe, Asia, Africa, Caribbean, and North America opportunity maps while Los Angeles sleeps, festival timelines, artist partnership cards, sponsorship targets, and morning money report panels in a futuristic HMG command room, icy blue silver lighting, premium cinematic quality, clearly styled as strategic planning, no copyrighted character likeness.",
  },
];

export const maximillionFutureProviderHooks: MaximillionFutureProviderHook[] = [
  {
    id: "local-mode",
    label: "Browser-Only Mode",
    status: "active_local",
    note: "Local browser memory and deterministic response logic work without provider keys.",
  },
  {
    id: "claude-reasoning",
    label: "Claude reasoning",
    status: "provider_optional",
    note: "Optional reasoning adapter slot. Inactive until explicitly configured.",
  },
  {
    id: "gemini-multimodal",
    label: "Gemini multimodal",
    status: "provider_optional",
    note: "Optional multimodal adapter slot. Inactive until explicitly configured.",
  },
  {
    id: "perplexity-live-web",
    label: "Perplexity live web scout",
    status: "provider_optional",
    note: "Optional sourced research adapter slot. No live web scanning is active.",
  },
  {
    id: "google-maps-leads",
    label: "Google Maps lead scout",
    status: "provider_optional",
    note: "Optional places/proximity adapter slot. Inactive until explicitly configured.",
  },
  {
    id: "gmail-calendar-actions",
    label: "Gmail / Calendar action mode",
    status: "provider_optional",
    note: "Optional scheduling, inbox, and follow-up adapter slot.",
  },
  {
    id: "voice-mode",
    label: "Browser Voice",
    status: "active_local",
    note: "Browser microphone, speech recognition, and speechSynthesis are used when supported.",
  },
  {
    id: "real-avatar-generation",
    label: "Visual generation adapter",
    status: "provider_optional",
    note: "Optional visual production adapter slot. Prompt pack remains local text.",
  },
];
