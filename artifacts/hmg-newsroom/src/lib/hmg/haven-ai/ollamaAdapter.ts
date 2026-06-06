import type { HavenProviderCaller } from "@/lib/hmg/haven-ai/types";

/**
 * Ollama / local-model client adapter.
 *
 * The browser never talks to Ollama directly — it goes through the server
 * override (/api/ollama/*), which holds the trusted OLLAMA_URL and proxies the
 * request. This adapter is the engine's "local model" lane: honest by design,
 * it returns null whenever no real local-model answer came back so the engine
 * falls back to the corpus + local brain. It never fabricates a model reply.
 */

export type OllamaStatus = "remote-ready" | "config-needed" | "blocked" | "no-models";

export interface OllamaDiagnostics {
  ok: boolean;
  status: OllamaStatus;
  configured: boolean;
  endpointConfigured: boolean;
  modelConfigured: boolean;
  model: string | null;
  models: string[];
  blockedInHostedRuntime: boolean;
  note: string;
  setupPath: string;
  reason?: string;
  /**
   * True only when the diagnostics fetch itself failed (network error, timeout,
   * non-OK response, or malformed payload) — i.e. we never got an honest answer
   * from the server. Distinct from a successful response that reports the remote
   * model as `blocked`. The Control Center uses this to surface an unambiguous
   * "couldn't reach the check" error instead of implying a real remote status.
   */
  unreachable?: boolean;
}

const DIAGNOSTICS_TIMEOUT_MS = 8_000;
const GENERATE_TIMEOUT_MS = 62_000;

function base(apiBase: string): string {
  return apiBase.replace(/\/+$/, "");
}

/** Honest, never-throwing diagnostics fetch for the Control Center. */
export async function fetchOllamaDiagnostics(apiBase: string): Promise<OllamaDiagnostics> {
  const fallback: OllamaDiagnostics = {
    ok: false,
    status: "blocked",
    configured: false,
    endpointConfigured: false,
    modelConfigured: false,
    model: null,
    models: [],
    blockedInHostedRuntime: false,
    note: "Could not reach the Ollama diagnostics endpoint.",
    setupPath: "docs/haven-ai/ollama-guide.md",
    unreachable: true,
  };
  try {
    const res = await fetch(`${base(apiBase)}/ollama/diagnostics`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(DIAGNOSTICS_TIMEOUT_MS),
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as Partial<OllamaDiagnostics>;
    if (!data || typeof data !== "object" || typeof data.status !== "string") return fallback;
    return {
      ok: Boolean(data.ok),
      status: data.status as OllamaStatus,
      configured: Boolean(data.configured),
      endpointConfigured: Boolean(data.endpointConfigured),
      modelConfigured: Boolean(data.modelConfigured),
      model: typeof data.model === "string" ? data.model : null,
      models: Array.isArray(data.models)
        ? data.models.filter((m): m is string => typeof m === "string")
        : [],
      blockedInHostedRuntime: Boolean(data.blockedInHostedRuntime),
      note: typeof data.note === "string" ? data.note : "",
      setupPath: typeof data.setupPath === "string" ? data.setupPath : fallback.setupPath,
      reason: typeof data.reason === "string" ? data.reason : undefined,
    };
  } catch {
    return fallback;
  }
}

interface OllamaGenerateDTO {
  ok?: boolean;
  provider?: string;
  model?: string;
  message?: string;
}

/**
 * Build the local-model (Ollama) provider caller bound to the API base. Returns
 * null on any failure / unconfigured lane so the engine degrades to the local
 * brain rather than inventing a local-model answer.
 */
export function createOllamaCaller(apiBase: string): HavenProviderCaller {
  const b = base(apiBase);
  return async (payload) => {
    if (!payload.prompt || !payload.prompt.trim()) return null;
    try {
      const res = await fetch(`${b}/ollama/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: payload.prompt,
          system: payload.systemHint || undefined,
        }),
        signal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as OllamaGenerateDTO;
      if (data && data.ok && typeof data.message === "string" && data.message.trim()) {
        return { provider: "ollama", message: data.message.trim() };
      }
      return null;
    } catch {
      return null;
    }
  };
}
