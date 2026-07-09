import test from "node:test";
import assert from "node:assert/strict";
import {
  OLLAMA_UNREACHABLE_MSG,
  applyOllamaToggle,
  applyPaidToggle,
  deriveOllamaError,
  isLaneChecking,
  runCorpusRecheck,
  runFullRefresh,
  runOllamaRecheck,
  shouldShowOllamaRetry,
} from "../controlCenterState.ts";
import type {
  CorpusHealthResult,
  OllamaDiagnostics,
} from "../index.ts";

function reachableDiag(
  overrides: Partial<OllamaDiagnostics> = {},
): OllamaDiagnostics {
  return {
    ok: true,
    status: "remote-ready",
    configured: true,
    endpointConfigured: true,
    modelConfigured: true,
    model: "llama3",
    models: ["llama3"],
    blockedInHostedRuntime: false,
    note: "Remote model reachable.",
    setupPath: "docs/haven-ai/ollama-guide.md",
    ...overrides,
  };
}

function unreachableDiag(): OllamaDiagnostics {
  return reachableDiag({
    ok: false,
    status: "blocked",
    configured: false,
    endpointConfigured: false,
    modelConfigured: false,
    model: null,
    models: [],
    note: "Could not reach the Ollama diagnostics endpoint.",
    unreachable: true,
  });
}

const okCorpus: CorpusHealthResult = {
  ok: true,
  stats: {
    sources: 1,
    chunks: 3,
    totalChars: 100,
    quarantined: 0,
    byBrand: {},
    byModule: {},
    bySourceType: {},
    byReliability: {},
    lastIngestedAt: null,
  },
  capabilities: {
    retrieval: "fts",
    ranking: "bm25",
    embeddings: false,
    paidProvider: false,
    ingestTypes: [],
  },
  notes: "",
};

const failedCorpus: CorpusHealthResult = {
  ok: false,
  error: "Network error reaching the corpus server.",
  code: "network",
};

test("retry appears on a failed Ollama lane when not mid-check", () => {
  assert.equal(
    shouldShowOllamaRetry({
      laneId: "ollama",
      ollamaError: OLLAMA_UNREACHABLE_MSG,
      checking: false,
    }),
    true,
  );
});

test("retry is hidden during the CHECKING state", () => {
  assert.equal(
    shouldShowOllamaRetry({
      laneId: "ollama",
      ollamaError: OLLAMA_UNREACHABLE_MSG,
      checking: true,
    }),
    false,
  );
});

test("retry is hidden when the Ollama lane has no error", () => {
  assert.equal(
    shouldShowOllamaRetry({
      laneId: "ollama",
      ollamaError: null,
      checking: false,
    }),
    false,
  );
});

test("retry never renders on a non-Ollama lane", () => {
  assert.equal(
    shouldShowOllamaRetry({
      laneId: "local-corpus",
      ollamaError: OLLAMA_UNREACHABLE_MSG,
      checking: false,
    }),
    false,
  );
});

test("isLaneChecking only flags the two live lanes while loading", () => {
  assert.equal(isLaneChecking("ollama", true), true);
  assert.equal(isLaneChecking("local-corpus", true), true);
  assert.equal(isLaneChecking("ollama", false), false);
  assert.equal(isLaneChecking("paid", true), false);
});

test("deriveOllamaError surfaces only on an unreachable check", () => {
  assert.equal(deriveOllamaError(unreachableDiag()), OLLAMA_UNREACHABLE_MSG);
  assert.equal(deriveOllamaError(reachableDiag()), null);
  // A reachable-but-blocked status is a real answer, not an unreachable check.
  assert.equal(deriveOllamaError(reachableDiag({ status: "blocked" })), null);
});

test("retry re-runs ONLY the Ollama check and clears the error on success", async () => {
  let diagCalls = 0;
  let corpusCalls = 0;
  const fetchDiagnostics = async () => {
    diagCalls += 1;
    return reachableDiag();
  };
  // Present but must never be touched by the targeted Ollama retry.
  const fetchCorpus = async () => {
    corpusCalls += 1;
    return okCorpus;
  };
  void fetchCorpus;

  const next = await runOllamaRecheck({
    fetchDiagnostics,
    prev: { ollama: unreachableDiag(), ollamaError: OLLAMA_UNREACHABLE_MSG },
  });

  assert.equal(diagCalls, 1);
  assert.equal(corpusCalls, 0);
  assert.equal(next.ollamaError, null);
  assert.equal(next.ollama?.status, "remote-ready");
});

test("retry keeps the error note when the check is still unreachable", async () => {
  const next = await runOllamaRecheck({
    fetchDiagnostics: async () => unreachableDiag(),
    prev: { ollama: null, ollamaError: OLLAMA_UNREACHABLE_MSG },
  });
  assert.equal(next.ollamaError, OLLAMA_UNREACHABLE_MSG);
});

test("enabling the Ollama lane fires a single Ollama-only re-check", () => {
  let ollamaRechecks = 0;
  let corpusRechecks = 0;
  applyOllamaToggle({
    enabling: true,
    recheckOllama: () => {
      ollamaRechecks += 1;
    },
    recheckCorpus: () => {
      corpusRechecks += 1;
    },
  });
  assert.equal(ollamaRechecks, 1);
  assert.equal(corpusRechecks, 0);
});

test("disabling the Ollama lane fires no re-check", () => {
  let ollamaRechecks = 0;
  let corpusRechecks = 0;
  applyOllamaToggle({
    enabling: false,
    recheckOllama: () => {
      ollamaRechecks += 1;
    },
    recheckCorpus: () => {
      corpusRechecks += 1;
    },
  });
  assert.equal(ollamaRechecks, 0);
  assert.equal(corpusRechecks, 0);
});

test("enabling the paid accelerator fires no lane re-check", () => {
  let ollamaRechecks = 0;
  let corpusRechecks = 0;
  applyPaidToggle({
    enabling: true,
    recheckOllama: () => {
      ollamaRechecks += 1;
    },
    recheckCorpus: () => {
      corpusRechecks += 1;
    },
  });
  assert.equal(ollamaRechecks, 0);
  assert.equal(corpusRechecks, 0);
});

test("disabling the paid accelerator fires no lane re-check", () => {
  let ollamaRechecks = 0;
  let corpusRechecks = 0;
  applyPaidToggle({
    enabling: false,
    recheckOllama: () => {
      ollamaRechecks += 1;
    },
    recheckCorpus: () => {
      corpusRechecks += 1;
    },
  });
  assert.equal(ollamaRechecks, 0);
  assert.equal(corpusRechecks, 0);
});

test("corpus retry re-runs ONLY the corpus check and clears the failure on success", async () => {
  let corpusCalls = 0;
  const next = await runCorpusRecheck({
    fetchCorpus: async () => {
      corpusCalls += 1;
      return okCorpus;
    },
    prev: { corpus: failedCorpus },
  });

  assert.equal(corpusCalls, 1);
  assert.equal(next.corpus?.ok, true);
});

test("corpus retry keeps the error when the check is still failing", async () => {
  const next = await runCorpusRecheck({
    fetchCorpus: async () => failedCorpus,
    prev: { corpus: null },
  });
  assert.equal(next.corpus?.ok, false);
  assert.equal(
    next.corpus?.ok === false ? next.corpus.error : null,
    "Network error reaching the corpus server.",
  );
});

test("corpus retry runs independently of the Ollama lane", async () => {
  let corpusCalls = 0;
  let diagCalls = 0;
  // An Ollama fetch is present but must never be touched by the corpus retry.
  const fetchDiagnostics = async () => {
    diagCalls += 1;
    return reachableDiag();
  };
  void fetchDiagnostics;

  const next = await runCorpusRecheck({
    fetchCorpus: async () => {
      corpusCalls += 1;
      return okCorpus;
    },
    prev: { corpus: failedCorpus },
  });

  assert.equal(corpusCalls, 1);
  assert.equal(diagCalls, 0);
  assert.equal(next.corpus?.ok, true);
  // The returned shape carries no Ollama fields — corpus lane only.
  assert.equal("ollama" in next, false);
  assert.equal("ollamaError" in next, false);
});

test("full refresh re-checks both lanes (contrast with the targeted retry)", async () => {
  let diagCalls = 0;
  let corpusCalls = 0;
  const next = await runFullRefresh({
    fetchDiagnostics: async () => {
      diagCalls += 1;
      return reachableDiag();
    },
    fetchCorpus: async () => {
      corpusCalls += 1;
      return okCorpus;
    },
    prev: { ollama: null, corpus: null, ollamaError: null },
  });
  assert.equal(diagCalls, 1);
  assert.equal(corpusCalls, 1);
  assert.equal(next.ollamaError, null);
  assert.equal(next.corpus?.ok, true);
});

// --- AI Lane Diagnostics -----------------------------------------------------

import {
  buildLaneDiagnostics,
  isCorpusUnauthorized,
} from "../controlCenterState.ts";
import { buildLaneStatuses } from "../providerRouter.ts";

const unauthorizedCorpus: CorpusHealthResult = {
  ok: false,
  error: "Sign in as Founder/Admin to manage the corpus.",
  code: "unauthorized",
  status: 401,
};

function lanesFor(args: {
  corpus: CorpusHealthResult | null;
  ollama: OllamaDiagnostics | null;
  ollamaEnabled: boolean;
  paidEnabled: boolean;
}) {
  const corpusReady = args.corpus?.ok === true && args.corpus.stats.chunks > 0;
  return buildLaneStatuses({
    corpusReady,
    ollamaHealth: args.ollama?.status ?? "unknown",
    ollamaEnabled: args.ollamaEnabled,
    paidEnabled: args.paidEnabled,
    activeLane: null,
  });
}

function diag(args: {
  corpus: CorpusHealthResult | null;
  ollama: OllamaDiagnostics | null;
  ollamaEnabled: boolean;
  paidEnabled: boolean;
}) {
  return buildLaneDiagnostics({ lanes: lanesFor(args), ...args });
}

test("isCorpusUnauthorized detects 401/403 and code, not other errors", () => {
  assert.equal(isCorpusUnauthorized(unauthorizedCorpus), true);
  assert.equal(isCorpusUnauthorized({ ok: false, error: "x", status: 403 }), true);
  assert.equal(isCorpusUnauthorized(failedCorpus), false);
  assert.equal(isCorpusUnauthorized(okCorpus), false);
  assert.equal(isCorpusUnauthorized(null), false);
});

test("unauthorized corpus is BLOCKED with a sign-in founder action and local fallback", () => {
  const rows = diag({
    corpus: unauthorizedCorpus,
    ollama: null,
    ollamaEnabled: false,
    paidEnabled: false,
  });
  const corpus = rows.find((r) => r.id === "local-corpus");
  assert.ok(corpus);
  assert.equal(corpus.truth, "BLOCKED");
  assert.match(corpus.founderAction, /Sign in/i);
  assert.match(corpus.fallback, /local brain/i);
  assert.equal(corpus.canRetry, true);
});

test("indexed corpus is LOCAL ONLY", () => {
  const rows = diag({
    corpus: okCorpus,
    ollama: null,
    ollamaEnabled: false,
    paidEnabled: false,
  });
  const corpus = rows.find((r) => r.id === "local-corpus");
  assert.equal(corpus?.truth, "LOCAL ONLY");
});

test("disabled Ollama lane reads OFF (a properly disabled optional lane)", () => {
  const rows = diag({
    corpus: okCorpus,
    ollama: null,
    ollamaEnabled: false,
    paidEnabled: false,
  });
  const ollama = rows.find((r) => r.id === "ollama");
  assert.equal(ollama?.truth, "OFF");
  assert.match(ollama?.unlock ?? "", /toggle ON/i);
  assert.equal(ollama?.canRetry, false);
});

test("enabled but config-needed Ollama is BLOCKED pointing at OLLAMA_URL", () => {
  const rows = diag({
    corpus: okCorpus,
    ollama: reachableDiag({ status: "config-needed", configured: false }),
    ollamaEnabled: true,
    paidEnabled: false,
  });
  const ollama = rows.find((r) => r.id === "ollama");
  assert.equal(ollama?.truth, "BLOCKED");
  assert.match(ollama?.unlock ?? "", /OLLAMA_URL/);
});

test("unreachable Ollama probe is BLOCKED and retryable", () => {
  const rows = diag({
    corpus: okCorpus,
    ollama: unreachableDiag(),
    ollamaEnabled: true,
    paidEnabled: false,
  });
  const ollama = rows.find((r) => r.id === "ollama");
  assert.equal(ollama?.truth, "BLOCKED");
  assert.equal(ollama?.canRetry, true);
});

test("remote-ready enabled Ollama is LOCAL ONLY", () => {
  const rows = diag({
    corpus: okCorpus,
    ollama: reachableDiag(),
    ollamaEnabled: true,
    paidEnabled: false,
  });
  const ollama = rows.find((r) => r.id === "ollama");
  assert.equal(ollama?.truth, "LOCAL ONLY");
});

test("paid provider OFF by default with no founder action, never retryable", () => {
  const rows = diag({
    corpus: okCorpus,
    ollama: null,
    ollamaEnabled: false,
    paidEnabled: false,
  });
  const paid = rows.find((r) => r.id === "paid");
  assert.equal(paid?.truth, "PAID OFF");
  assert.equal(paid?.canRetry, false);
  assert.match(paid?.why ?? "", /zero hidden paid calls/i);
});

test("paid provider enabled becomes REAL but corpus still answers first", () => {
  const rows = diag({
    corpus: okCorpus,
    ollama: null,
    ollamaEnabled: false,
    paidEnabled: true,
  });
  const paid = rows.find((r) => r.id === "paid");
  assert.equal(paid?.truth, "REAL");
  assert.match(paid?.fallback ?? "", /first/i);
});

test("diagnostics always returns exactly the three router lanes", () => {
  const rows = diag({
    corpus: null,
    ollama: null,
    ollamaEnabled: false,
    paidEnabled: false,
  });
  assert.deepEqual(
    rows.map((r) => r.id),
    ["local-corpus", "ollama", "paid"],
  );
});
