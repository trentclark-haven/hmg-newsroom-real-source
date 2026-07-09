import test from "node:test";
import assert from "node:assert/strict";
import { buildGroundedPrompt } from "../corpus/groundPrompt.ts";
import type {
  HavenCorpusContext,
  HavenCorpusRetriever,
} from "../corpus/types";

const BASE = "Write a short editorial about the local festival.";

function citation(label: string) {
  return {
    sourceId: "s1",
    title: "Festival recap",
    citationLabel: label,
    reliability: "verified",
    brand: "master",
    sourceType: "paste",
    score: 0.9,
    reasons: ["matches: festival"],
    excerpt: "The festival drew record crowds downtown.",
  };
}

test("no retriever returns base prompt and no corpus use", async () => {
  const r = await buildGroundedPrompt(undefined, { query: "festival" }, BASE);
  assert.equal(r.usedCorpus, false);
  assert.equal(r.prompt, BASE);
  assert.deepEqual(r.citations, []);
});

test("empty query returns base prompt untouched", async () => {
  const retriever: HavenCorpusRetriever = async () => {
    throw new Error("should not be called");
  };
  const r = await buildGroundedPrompt(retriever, { query: "   " }, BASE);
  assert.equal(r.usedCorpus, false);
  assert.equal(r.prompt, BASE);
});

test("corpus match prepends grounding block and surfaces citations", async () => {
  const ctx: HavenCorpusContext = {
    usedCorpus: true,
    note: "Grounded on 1 corpus passage(s).",
    contextText: "[1] Festival recap (reliability: verified)\nRecord crowds.",
    citations: [citation("Festival recap (note)")],
  };
  const retriever: HavenCorpusRetriever = async () => ctx;
  const r = await buildGroundedPrompt(retriever, { query: "festival" }, BASE);
  assert.equal(r.usedCorpus, true);
  assert.ok(r.prompt.includes("HAVEN CORPUS GROUNDING"));
  assert.ok(r.prompt.endsWith(BASE));
  assert.equal(r.citations.length, 1);
});

test("retriever throwing degrades honestly to base knowledge", async () => {
  const retriever: HavenCorpusRetriever = async () => {
    throw new Error("network down");
  };
  const r = await buildGroundedPrompt(retriever, { query: "festival" }, BASE);
  assert.equal(r.usedCorpus, false);
  assert.equal(r.prompt, BASE);
  assert.match(r.note, /unavailable/i);
});

test("no matches returns honest empty note without grounding", async () => {
  const ctx: HavenCorpusContext = {
    usedCorpus: false,
    note: "No corpus matches yet.",
    contextText: "",
    citations: [],
  };
  const retriever: HavenCorpusRetriever = async () => ctx;
  const r = await buildGroundedPrompt(retriever, { query: "festival" }, BASE);
  assert.equal(r.usedCorpus, false);
  assert.equal(r.prompt, BASE);
  assert.match(r.note, /no corpus matches/i);
});
