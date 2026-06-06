import test from "node:test";
import assert from "node:assert/strict";
import { isValidGlobalSilo } from "../globalSilo";

test("global silo validator allows all supported silos", () => {
  const silos = ["hmg", "hiphophaven", "raphaven", "musichaven", "sportshaven", "cannahaven", "fithaven"];
  for (const silo of silos) assert.equal(isValidGlobalSilo(silo), true);
});

test("global silo validator rejects unknown silo", () => {
  assert.equal(isValidGlobalSilo("not-a-silo"), false);
});
