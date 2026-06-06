import test from "node:test";
import assert from "node:assert/strict";
import {
  scrubMessage,
  recordModuleError,
  getModuleError,
  clearModuleError,
  clearAllModuleErrors,
  computeOverallStatus,
  viewToModuleId,
  getModuleMeta,
  RECOVERY_MODULES,
} from "../../recoveryCenter.ts";

test("scrubMessage removes credential-shaped text", () => {
  const out = scrubMessage(
    "auth failed sk-ABCDEFGH12345678 Bearer abc.def.ghi password=hunter2",
  );
  assert.ok(!out.includes("sk-ABCDEFGH12345678"));
  assert.ok(!out.includes("hunter2"));
  assert.ok(!/Bearer\s+abc\.def\.ghi/.test(out));
  assert.ok(out.includes("sk-***"));
});

test("scrubMessage masks app-password style tokens", () => {
  const out = scrubMessage("login wp1234 ABCD efgh IJKL mnop done");
  assert.ok(out.includes("(app password)"));
});

test("scrubMessage caps length at 280 chars", () => {
  const out = scrubMessage("x".repeat(400));
  assert.ok(out.length <= 280);
  assert.ok(out.endsWith("…"));
});

test("record/clear lifecycle increments and clears", () => {
  clearAllModuleErrors();
  recordModuleError("artbot", new Error("boom"));
  let rec = getModuleError("artbot");
  assert.equal(rec?.count, 1);
  assert.equal(rec?.message, "boom");

  recordModuleError("artbot", new Error("boom again"));
  rec = getModuleError("artbot");
  assert.equal(rec?.count, 2);
  assert.equal(rec?.message, "boom again");

  clearModuleError("artbot");
  assert.equal(getModuleError("artbot"), undefined);
});

test("clearAllModuleErrors wipes every recorded error", () => {
  recordModuleError("cutmaster", "x");
  recordModuleError("corpus", "y");
  clearAllModuleErrors();
  assert.equal(getModuleError("cutmaster"), undefined);
  assert.equal(getModuleError("corpus"), undefined);
});

test("non-Error inputs are recorded honestly, never blank", () => {
  clearAllModuleErrors();
  recordModuleError("newsroom", undefined);
  assert.equal(getModuleError("newsroom")?.message, "Unexpected error");
  clearAllModuleErrors();
});

test("viewToModuleId maps views to health buckets", () => {
  assert.equal(viewToModuleId("wpconnections"), "wordpress");
  assert.equal(viewToModuleId("clipbrand"), "cutmaster");
  assert.equal(viewToModuleId("sales"), "maximillion");
  assert.equal(viewToModuleId("artbot"), "artbot");
  assert.equal(viewToModuleId("unknown-view"), "unknown-view");
});

test("computeOverallStatus only reports all-clear when truly healthy", () => {
  assert.equal(
    computeOverallStatus({ errorCount: 0, corpusReachable: true }).tone,
    "ok",
  );
  // Recorded module errors always win.
  assert.equal(
    computeOverallStatus({ errorCount: 2, corpusReachable: true }).tone,
    "warn",
  );
  // Corpus unreachable must NOT show "all systems operational".
  const degraded = computeOverallStatus({
    errorCount: 0,
    corpusReachable: false,
  });
  assert.equal(degraded.tone, "warn");
  assert.match(degraded.headline, /corpus/i);
  // Still-checking is neither all-clear nor a warning.
  assert.equal(
    computeOverallStatus({ errorCount: 0, corpusReachable: null }).tone,
    "checking",
  );
});

test("every curated module has name, blurb and a next fix", () => {
  for (const m of RECOVERY_MODULES) {
    assert.ok(m.name.length > 0);
    assert.ok(m.blurb.length > 0);
    assert.ok(m.nextFix.length > 0);
    assert.equal(getModuleMeta(m.id)?.id, m.id);
  }
});
