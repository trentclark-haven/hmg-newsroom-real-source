import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(here, "..", "..", "..");

function read(rel: string): string {
  return readFileSync(path.join(srcRoot, rel), "utf8");
}

// Founder corrective review: packet / brand / mode tab rows must use a
// wrapping pill layout (Option A) so no tab is ever clipped off the right
// edge on desktop or mobile. These structural assertions fail if anyone
// reintroduces a clipping horizontal row (overflow-x-auto + w-max + nowrap
// container) on the shared tab components. Live pixel-measurement proof is
// done separately via Playwright against the public URL.

test("SiloPicker brand rail wraps and does not clip", () => {
  const src = read("components/newsroom/SiloPicker.tsx");
  assert.match(src, /flex flex-wrap/, "brand rail must use flex flex-wrap");
  assert.doesNotMatch(
    src,
    /overflow-x-auto/,
    "brand rail must not use overflow-x-auto (clips right edge)",
  );
  assert.doesNotMatch(
    src,
    /w-max/,
    "brand rail must not use w-max (forces single non-wrapping row)",
  );
});

test("Editorial Role/Tone/Format pill rows wrap and do not clip", () => {
  const src = read("components/newsroom/TabContent/shared.tsx");
  // Both PillGroup (Role/Tone) and PlatformGroup (Format) containers.
  const wrapContainers = src.match(
    /flex flex-wrap items-center gap-1 p-1 rounded-2xl/g,
  );
  assert.ok(
    wrapContainers && wrapContainers.length >= 2,
    "Role/Tone and Format pill containers must both use a wrapping layout",
  );
  assert.doesNotMatch(
    src,
    /overflow-x-auto/,
    "Editorial pill rows must not use overflow-x-auto (clips right edge)",
  );
});

test("Editorial brand tab strip wraps and does not clip", () => {
  const src = read("pages/Home.tsx");
  assert.match(
    src,
    /rounded-2xl flex flex-wrap w-full/,
    "Editorial brand TabsList must use flex flex-wrap w-full",
  );
  assert.doesNotMatch(
    src,
    /overflow-x-auto hide-scrollbar scroll-smooth/,
    "Editorial brand strip wrapper must not use the clipping overflow row",
  );
});

test("JetFire Research & Story Context mode tabs wrap", () => {
  const src = read("components/hmg/JetFirePanel.tsx");
  assert.match(
    src,
    /flex flex-wrap gap-1\.5/,
    "JetFire mode tabs must wrap",
  );
  assert.doesNotMatch(
    src,
    /overflow-x-auto/,
    "JetFire mode tabs must not use overflow-x-auto",
  );
});

test("Source Intake tabs wrap", () => {
  const src = read("components/hmg/SourcePacketPanel.tsx");
  assert.match(
    src,
    /flex flex-wrap gap-2/,
    "Source Intake tabs must wrap",
  );
  assert.doesNotMatch(
    src,
    /overflow-x-auto/,
    "Source Intake tabs must not use overflow-x-auto",
  );
});
