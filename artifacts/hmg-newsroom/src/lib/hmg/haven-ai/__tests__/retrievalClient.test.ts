import test from "node:test";
import assert from "node:assert/strict";
import { createCorpusRetriever } from "../corpus/retrievalClient.ts";
import type { CorpusSearchResponseDTO } from "../corpus/types";

function mockFetch(response: CorpusSearchResponseDTO, ok = true) {
  return async () =>
    ({
      ok,
      json: async () => response,
    }) as unknown as Response;
}

const origFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = origFetch;
});

test("maps server hits into citations and grounded context", async () => {
  globalThis.fetch = mockFetch({
    usedCorpus: true,
    note: "Grounded on 1 passage.",
    hits: [
      {
        sourceId: "s1",
        content: "Record crowds attended the downtown festival this weekend.",
        title: "Festival recap",
        citationLabel: "Festival recap (note)",
        reliability: "verified",
        brand: "master",
        sourceType: "paste",
        score: 0.91,
        reasons: ["matches: festival"],
      },
    ],
  }) as typeof fetch;

  const retrieve = createCorpusRetriever("http://x/api");
  const ctx = await retrieve({ query: "festival" });
  assert.ok(ctx);
  assert.equal(ctx.usedCorpus, true);
  assert.equal(ctx.citations.length, 1);
  assert.equal(ctx.citations[0].sourceId, "s1");
  assert.ok(ctx.contextText.includes("[1]"));
});

test("empty query short-circuits without fetching", async () => {
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return { ok: true, json: async () => ({}) } as unknown as Response;
  }) as typeof fetch;
  const retrieve = createCorpusRetriever("http://x/api");
  const ctx = await retrieve({ query: "  " });
  assert.equal(ctx, null);
  assert.equal(called, false);
});

test("usedCorpus stays false when server returns no hits", async () => {
  globalThis.fetch = mockFetch({ usedCorpus: false, hits: [] }) as typeof fetch;
  const retrieve = createCorpusRetriever("http://x/api");
  const ctx = await retrieve({ query: "festival" });
  assert.ok(ctx);
  assert.equal(ctx.usedCorpus, false);
  assert.equal(ctx.contextText, "");
  assert.deepEqual(ctx.citations, []);
});

test("network failure resolves to null (never fabricates)", async () => {
  globalThis.fetch = (async () => {
    throw new Error("offline");
  }) as typeof fetch;
  const retrieve = createCorpusRetriever("http://x/api");
  const ctx = await retrieve({ query: "festival" });
  assert.equal(ctx, null);
});

test("non-ok HTTP status resolves to null", async () => {
  globalThis.fetch = mockFetch({ usedCorpus: true, hits: [] }, false) as typeof fetch;
  const retrieve = createCorpusRetriever("http://x/api");
  const ctx = await retrieve({ query: "festival" });
  assert.equal(ctx, null);
});

test("skips malformed hits missing content", async () => {
  globalThis.fetch = mockFetch({
    usedCorpus: true,
    hits: [{ sourceId: "s1" }, { sourceId: "s2", content: "real passage text" }],
  }) as typeof fetch;
  const retrieve = createCorpusRetriever("http://x/api");
  const ctx = await retrieve({ query: "festival" });
  assert.ok(ctx);
  assert.equal(ctx.citations.length, 1);
  assert.equal(ctx.citations[0].sourceId, "s2");
});
