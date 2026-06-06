import test from "node:test";
import assert from "node:assert/strict";
import { runHavenAIEngine } from "../HavenAIEngine.ts";
import type {
  HavenProviderCaller,
  HavenProviderResult,
} from "../types.ts";

const localCaller = (msg: string): HavenProviderCaller => async () =>
  ({ provider: "ollama", message: msg }) satisfies HavenProviderResult;

const paidCaller = (msg: string): HavenProviderCaller => async () =>
  ({ provider: "openai", message: msg }) satisfies HavenProviderResult;

const nullCaller: HavenProviderCaller = async () => null;

test("paid lane stays OFF by default even when a paid caller is supplied", async () => {
  let paidCalled = false;
  const res = await runHavenAIEngine({
    message: "draft a quick promo line",
    callProvider: async (p) => {
      paidCalled = true;
      return paidCaller("PAID PROSE")(p);
    },
    // enablePaidProvider omitted → must default OFF
  });
  assert.equal(paidCalled, false, "paid caller must not run when not enabled");
  assert.equal(res.lane, "local");
  assert.equal(res.providerUsed, "local-brain");
});

test("local-model (Ollama) lane is tried before the paid lane", async () => {
  let paidCalled = false;
  const res = await runHavenAIEngine({
    message: "draft a quick promo line",
    callLocalModel: localCaller("OLLAMA PROSE"),
    enablePaidProvider: true,
    callProvider: async (p) => {
      paidCalled = true;
      return paidCaller("PAID PROSE")(p);
    },
  });
  assert.equal(res.lane, "hybrid");
  assert.equal(res.providerUsed, "ollama");
  assert.equal(res.message.trim(), "OLLAMA PROSE");
  assert.equal(paidCalled, false, "paid lane must not run once local model answers");
});

test("paid lane only engages when enabled and local model declines", async () => {
  const res = await runHavenAIEngine({
    message: "draft a quick promo line",
    callLocalModel: nullCaller,
    enablePaidProvider: true,
    callProvider: paidCaller("PAID PROSE"),
  });
  assert.equal(res.lane, "hybrid");
  assert.equal(res.providerUsed, "openai");
  assert.equal(res.message.trim(), "PAID PROSE");
});

test("falls back to local brain when every lane declines", async () => {
  const res = await runHavenAIEngine({
    message: "draft a quick promo line",
    callLocalModel: nullCaller,
    enablePaidProvider: true,
    callProvider: nullCaller,
  });
  assert.equal(res.lane, "local");
  assert.equal(res.providerUsed, "local-brain");
  assert.ok(res.message.length > 0, "local brain always produces an answer");
});

test("corpus citations surface independently of which lane wrote the prose", async () => {
  const res = await runHavenAIEngine({
    message: "what is our coverage policy",
    callLocalModel: localCaller("OLLAMA PROSE"),
    enablePaidProvider: false,
    retrieveCorpus: async () => ({
      usedCorpus: true,
      note: "1 corpus match.",
      contextText: "Coverage policy: verify before publishing.",
      citations: [
        {
          sourceId: "src-1",
          title: "Editorial Handbook",
          citationLabel: "Editorial Handbook p.3",
          reliability: "verified",
          brand: "master",
          sourceType: "txt",
          score: 0.92,
          reasons: ["keyword match"],
          excerpt: "Verify before publishing.",
        },
      ],
    }),
  });
  assert.equal(res.providerUsed, "ollama");
  const corpusSection = res.sections.find((s) => s.id === "corpus-sources");
  assert.ok(corpusSection, "corpus citations section must be present when grounded");
  assert.match(corpusSection.body, /Editorial Handbook/);
});
