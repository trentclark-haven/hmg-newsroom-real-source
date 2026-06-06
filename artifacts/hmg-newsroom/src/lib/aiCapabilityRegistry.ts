/**
 * HMG AI Capability Registry
 * Source of truth for what AI tasks exist, what their current readiness is,
 * and what provider/backend they need.
 *
 * Design rules:
 * - Never claim a capability is live if it is not
 * - local-ready means deterministic/memory-backed only — no external calls
 * - provider-needed means the task needs an AI provider to be useful
 * - backend-needed means a server-side worker is required
 * - Never fake spinners, never claim browsing is active
 */

export type ProviderStatus =
  | "local-ready"
  | "memory-backed"
  | "provider-needed"
  | "backend-needed"
  | "blocked"
  | "future-hook";

export type AIProvider =
  | "local-deterministic"
  | "openai"
  | "anthropic"
  | "gemini"
  | "ollama"
  | "hmg-custom"
  | "transcription-provider"
  | "image-provider"
  | "wordpress-backend"
  | "none";

export interface AIProviderEntry {
  id: AIProvider;
  name: string;
  description: string;
  status: "active" | "staged" | "future";
  honest: string;
}

export const AI_PROVIDERS: AIProviderEntry[] = [
  {
    id: "local-deterministic",
    name: "Local Deterministic",
    description: "Pattern-based, rule-based, memory-backed outputs. No external calls.",
    status: "active",
    honest: "Runs entirely in the browser. No AI provider needed.",
  },
  {
    id: "openai",
    name: "OpenAI (GPT-4o / GPT-4)",
    description: "Full LLM rewrite, voice, vision, advanced generation.",
    status: "staged",
    honest: "API contract ready. Needs API key + backend proxy to activate.",
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude 3.5)",
    description: "Long-form editorial, safe content, nuanced voice.",
    status: "staged",
    honest: "API contract ready. Needs API key + backend proxy to activate.",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Multimodal, search-grounded generation.",
    status: "staged",
    honest: "API contract ready. Needs API key + backend proxy to activate.",
  },
  {
    id: "ollama",
    name: "Ollama / Local Model",
    description: "Self-hosted LLM on localhost. Privacy-first.",
    status: "staged",
    honest: "Detection logic present. Requires Ollama running at localhost:11434.",
  },
  {
    id: "hmg-custom",
    name: "HMG Custom Model",
    description: "Fine-tuned Haven Media Group editorial + revenue model.",
    status: "future",
    honest: "Not built yet. Future roadmap item.",
  },
  {
    id: "transcription-provider",
    name: "Transcription Provider (Whisper / Deepgram)",
    description: "Audio/video transcription for CutMaster and editorial.",
    status: "staged",
    honest: "API contract ready. Needs provider key + backend worker.",
  },
  {
    id: "image-provider",
    name: "Image Provider (DALL-E / Midjourney / Flux)",
    description: "AI image generation for WebArt + social visuals.",
    status: "staged",
    honest: "API contract ready. Needs provider key + backend proxy.",
  },
  {
    id: "wordpress-backend",
    name: "WordPress Backend Connector",
    description: "Live post creation, media upload, category sync.",
    status: "staged",
    honest: "Manual publish handoff ready. Live REST connector needs WP credentials.",
  },
];

export type AITaskId =
  | "draft-article"
  | "rewrite-founder-voice"
  | "headline-variants"
  | "source-checklist"
  | "no-gossip-check"
  | "seo-meta"
  | "social-variants"
  | "image-brief"
  | "cut-note-generation"
  | "max-money-move"
  | "relationship-followup"
  | "opportunity-scoring"
  | "memory-summarization"
  | "old-article-ingestion"
  | "article-structure"
  | "wp-excerpt"
  | "social-caption-starter"
  | "wp-publish-handoff"
  | "media-readiness-check"
  | "brand-voice-check";

export interface AITaskEntry {
  id: AITaskId;
  name: string;
  category: "editorial" | "revenue" | "visual" | "distribution" | "memory" | "wordpress";
  description: string;
  status: ProviderStatus;
  providers: AIProvider[];
  desk: "ARTBOT" | "Max" | "WebArt" | "WebEdit" | "Social" | "WordPress" | "System";
  honestLabel: string;
}

export const AI_TASKS: AITaskEntry[] = [
  {
    id: "headline-variants",
    name: "Headline Variants",
    category: "editorial",
    description: "Generate 5 headline options with tone variations.",
    status: "local-ready",
    providers: ["local-deterministic"],
    desk: "ARTBOT",
    honestLabel: "Local editorial helper — deterministic templates",
  },
  {
    id: "source-checklist",
    name: "Source Checklist",
    category: "editorial",
    description: "Check article sources against HMG standards.",
    status: "local-ready",
    providers: ["local-deterministic"],
    desk: "ARTBOT",
    honestLabel: "Local rules engine — memory-backed if memory exists",
  },
  {
    id: "no-gossip-check",
    name: "No-Gossip Check",
    category: "editorial",
    description: "Flag phrases that read as unverified gossip.",
    status: "local-ready",
    providers: ["local-deterministic"],
    desk: "ARTBOT",
    honestLabel: "Local pattern match — no AI provider needed",
  },
  {
    id: "brand-voice-check",
    name: "Founder Voice Check",
    category: "editorial",
    description: "Score draft against Founder Voice memory.",
    status: "memory-backed",
    providers: ["local-deterministic"],
    desk: "ARTBOT",
    honestLabel: "Memory-backed — stronger with more voice memory saved",
  },
  {
    id: "article-structure",
    name: "Article Structure Suggestion",
    category: "editorial",
    description: "Suggest hed / dek / lede / body / kicker structure.",
    status: "local-ready",
    providers: ["local-deterministic"],
    desk: "ARTBOT",
    honestLabel: "Local template helper",
  },
  {
    id: "wp-excerpt",
    name: "WordPress Excerpt Starter",
    category: "wordpress",
    description: "Draft a 155-character WP excerpt from article content.",
    status: "local-ready",
    providers: ["local-deterministic"],
    desk: "WordPress",
    honestLabel: "Local trim + format — no AI needed",
  },
  {
    id: "seo-meta",
    name: "SEO Meta Starter",
    category: "editorial",
    description: "Draft title tag, meta description, and focus keywords.",
    status: "local-ready",
    providers: ["local-deterministic"],
    desk: "ARTBOT",
    honestLabel: "Local SEO template helper",
  },
  {
    id: "social-caption-starter",
    name: "Social Caption Starter",
    category: "distribution",
    description: "Draft captions for X, Instagram, TikTok from article.",
    status: "local-ready",
    providers: ["local-deterministic"],
    desk: "Social",
    honestLabel: "Local caption formatter",
  },
  {
    id: "draft-article",
    name: "Full Article Draft",
    category: "editorial",
    description: "Write a full article draft from a brief.",
    status: "provider-needed",
    providers: ["openai", "anthropic", "gemini", "ollama"],
    desk: "ARTBOT",
    honestLabel: "Needs AI provider — local stub returns 501",
  },
  {
    id: "rewrite-founder-voice",
    name: "Rewrite in Founder Voice",
    category: "editorial",
    description: "Full AI rewrite of draft in Founder Voice style.",
    status: "provider-needed",
    providers: ["openai", "anthropic", "ollama"],
    desk: "ARTBOT",
    honestLabel: "Needs AI provider — memory context ready when provider connects",
  },
  {
    id: "social-variants",
    name: "Social Variants (Full AI)",
    category: "distribution",
    description: "Multi-platform AI-generated social posts.",
    status: "provider-needed",
    providers: ["openai", "anthropic", "gemini"],
    desk: "Social",
    honestLabel: "Needs AI provider for full variants",
  },
  {
    id: "image-brief",
    name: "Image Brief / WebArt Prompt",
    category: "visual",
    description: "Generate detailed image prompt for WebArt desk.",
    status: "local-ready",
    providers: ["local-deterministic"],
    desk: "WebArt",
    honestLabel: "Local template composer — image generation needs provider",
  },
  {
    id: "cut-note-generation",
    name: "Cut Note Generation",
    category: "visual",
    description: "Generate cut notes / edit plan from media metadata.",
    status: "local-ready",
    providers: ["local-deterministic"],
    desk: "WebEdit",
    honestLabel: "Local cut note helper — full transcription needs provider",
  },
  {
    id: "max-money-move",
    name: "Today's Money Move",
    category: "revenue",
    description: "Max's deterministic revenue action recommendation.",
    status: "memory-backed",
    providers: ["local-deterministic"],
    desk: "Max",
    honestLabel: "Memory-backed scoring — stronger with relationship + revenue notes",
  },
  {
    id: "relationship-followup",
    name: "Relationship Follow-Up",
    category: "revenue",
    description: "Surface next best relationship action from Max memory.",
    status: "memory-backed",
    providers: ["local-deterministic"],
    desk: "Max",
    honestLabel: "Memory-backed — requires relationship notes to be saved",
  },
  {
    id: "opportunity-scoring",
    name: "Opportunity Score",
    category: "revenue",
    description: "Score opportunities by warmth, fit, urgency, leverage.",
    status: "memory-backed",
    providers: ["local-deterministic"],
    desk: "Max",
    honestLabel: "Deterministic scoring formula — no AI provider needed",
  },
  {
    id: "memory-summarization",
    name: "Memory Summarization",
    category: "memory",
    description: "Summarize and compress existing memory items.",
    status: "provider-needed",
    providers: ["openai", "anthropic", "ollama"],
    desk: "System",
    honestLabel: "Full summarization needs AI — local preview available",
  },
  {
    id: "old-article-ingestion",
    name: "Old Article Ingestion",
    category: "memory",
    description: "Parse old articles into brand voice + editorial memory.",
    status: "local-ready",
    providers: ["local-deterministic"],
    desk: "System",
    honestLabel: "Local text parser — AI extraction needs provider",
  },
  {
    id: "wp-publish-handoff",
    name: "WordPress Publish Handoff",
    category: "wordpress",
    description: "Prepare and hand off draft to WordPress manually.",
    status: "local-ready",
    providers: ["wordpress-backend"],
    desk: "WordPress",
    honestLabel: "Manual handoff ready — live auto-publish needs WP credentials",
  },
  {
    id: "media-readiness-check",
    name: "Media Readiness Check",
    category: "visual",
    description: "Check file type, size, dimensions before upload.",
    status: "local-ready",
    providers: ["local-deterministic"],
    desk: "WebArt",
    honestLabel: "Local file validation — no provider needed",
  },
];

export function getTasksByStatus(status: ProviderStatus): AITaskEntry[] {
  return AI_TASKS.filter((t) => t.status === status);
}

export function getTasksByDesk(desk: AITaskEntry["desk"]): AITaskEntry[] {
  return AI_TASKS.filter((t) => t.desk === desk);
}

export function getTasksByCategory(category: AITaskEntry["category"]): AITaskEntry[] {
  return AI_TASKS.filter((t) => t.category === category);
}

export function getCapabilitySummary() {
  const local = AI_TASKS.filter((t) => t.status === "local-ready" || t.status === "memory-backed").length;
  const needsProvider = AI_TASKS.filter((t) => t.status === "provider-needed").length;
  const needsBackend = AI_TASKS.filter((t) => t.status === "backend-needed").length;
  const future = AI_TASKS.filter((t) => t.status === "future-hook").length;
  return { total: AI_TASKS.length, local, needsProvider, needsBackend, future };
}
