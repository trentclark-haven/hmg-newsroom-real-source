import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLaneStatuses,
  routeThroughProvider,
  HAVEN_LANES,
} from "../providerRouter.ts";
import type { HavenProviderCaller } from "../types";

test("paid lane is OFF by default", () => {
  const lanes = buildLaneStatuses({
    corpusReady: true,
    ollamaHealth: "config-needed",
    ollamaEnabled: true,
    paidEnabled: false,
  });
  const paid = lanes.find((l) => l.id === "paid");
  assert.ok(paid);
  assert.equal(paid.health, "off");
});

test("paid lane available when enabled but not active", () => {
  const lanes = buildLaneStatuses({
    corpusReady: true,
    ollamaHealth: "config-needed",
    ollamaEnabled: true,
    paidEnabled: true,
    activeLane: "local-corpus",
  });
  const paid = lanes.find((l) => l.id === "paid");
  assert.equal(paid?.health, "available");
});

test("ollama health maps config-needed/blocked/remote-ready when enabled", () => {
  const cfg = buildLaneStatuses({
    corpusReady: true,
    ollamaHealth: "config-needed",
    ollamaEnabled: true,
    paidEnabled: false,
  });
  assert.equal(cfg.find((l) => l.id === "ollama")?.health, "config-needed");

  const blocked = buildLaneStatuses({
    corpusReady: true,
    ollamaHealth: "blocked",
    ollamaEnabled: true,
    paidEnabled: false,
  });
  assert.equal(blocked.find((l) => l.id === "ollama")?.health, "blocked");

  const ready = buildLaneStatuses({
    corpusReady: true,
    ollamaHealth: "remote-ready",
    ollamaEnabled: true,
    paidEnabled: false,
    activeLane: "ollama",
  });
  assert.equal(ready.find((l) => l.id === "ollama")?.health, "active");
});

test("ollama lane reports OFF when disabled even if remote is reachable", () => {
  const lanes = buildLaneStatuses({
    corpusReady: true,
    ollamaHealth: "remote-ready",
    ollamaEnabled: false,
    paidEnabled: false,
  });
  const ollama = lanes.find((l) => l.id === "ollama");
  assert.equal(ollama?.health, "off");
  assert.match(ollama?.note ?? "", /OFF/);
});

test("local-corpus lane is active when it answered", () => {
  const lanes = buildLaneStatuses({
    corpusReady: true,
    ollamaHealth: "config-needed",
    ollamaEnabled: true,
    paidEnabled: false,
    activeLane: "local-corpus",
  });
  assert.equal(lanes.find((l) => l.id === "local-corpus")?.health, "active");
});

test("lanes returned in priority order", () => {
  const lanes = buildLaneStatuses({
    corpusReady: false,
    ollamaHealth: "unknown",
    ollamaEnabled: false,
    paidEnabled: false,
  });
  assert.deepEqual(
    lanes.map((l) => l.id),
    HAVEN_LANES.map((l) => l.id),
  );
});

test("routeThroughProvider returns null without a caller (blocked fallback)", async () => {
  const r = await routeThroughProvider({ messages: [], systemPrompt: "" } as never);
  assert.equal(r, null);
});

test("routeThroughProvider returns null when caller throws", async () => {
  const caller: HavenProviderCaller = async () => {
    throw new Error("provider down");
  };
  const r = await routeThroughProvider({ messages: [], systemPrompt: "" } as never, caller);
  assert.equal(r, null);
});

test("routeThroughProvider returns a real answer when caller responds", async () => {
  const caller: HavenProviderCaller = async () => ({
    message: "hello from the local model",
    provider: "ollama",
  } as never);
  const r = await routeThroughProvider({ messages: [], systemPrompt: "" } as never, caller);
  assert.ok(r);
  assert.equal(r.message, "hello from the local model");
});

test("routeThroughProvider rejects empty provider messages", async () => {
  const caller: HavenProviderCaller = async () => ({ message: "   " } as never);
  const r = await routeThroughProvider({ messages: [], systemPrompt: "" } as never, caller);
  assert.equal(r, null);
});
