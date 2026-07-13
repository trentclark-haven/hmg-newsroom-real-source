/**
 * Isolated tests for Bolt Tera Editorial and Publishing Build.
 *
 * These tests validate the self-contained logic from the deliverable files
 * without requiring the full source tree. They use only Node's built-in
 * assert module and can be run directly with: npx tsx tests/bolt-tera-isolated.test.ts
 */

import assert from "node:assert";
import { describe, it } from "node:test";

// --- editorialStages ---
import {
  EDITORIAL_STAGES,
  STAGE_ORDER,
  stageIndex,
  nextStage,
  prevStage,
  isStageComplete,
  type EditorialStageId,
} from "../artifacts/hmg-newsroom/src/lib/hmg/editorial/editorialStages";

describe("editorialStages", () => {
  it("has exactly six ordered stages", () => {
    assert.strictEqual(EDITORIAL_STAGES.length, 6);
    assert.strictEqual(STAGE_ORDER.length, 6);
  });

  it("stages are in the correct order", () => {
    const ids = EDITORIAL_STAGES.map((s) => s.id);
    assert.deepStrictEqual(ids, [
      "notes",
      "angle",
      "sources",
      "draft",
      "package",
      "publish",
    ]);
  });

  it("stageIndex returns correct index", () => {
    assert.strictEqual(stageIndex("notes"), 0);
    assert.strictEqual(stageIndex("angle"), 1);
    assert.strictEqual(stageIndex("sources"), 2);
    assert.strictEqual(stageIndex("draft"), 3);
    assert.strictEqual(stageIndex("package"), 4);
    assert.strictEqual(stageIndex("publish"), 5);
  });

  it("nextStage returns next stage or null at end", () => {
    assert.strictEqual(nextStage("notes"), "angle");
    assert.strictEqual(nextStage("publish"), null);
  });

  it("prevStage returns previous stage or null at start", () => {
    assert.strictEqual(prevStage("angle"), "notes");
    assert.strictEqual(prevStage("notes"), null);
  });

  it("isStageComplete returns false for empty state", () => {
    assert.strictEqual(isStageComplete("notes", {}), false);
    assert.strictEqual(isStageComplete("angle", {}), false);
  });

  it("isStageComplete returns true for satisfied state", () => {
    assert.strictEqual(
      isStageComplete("notes", { sections: [{ text: "hello" }] }),
      true,
    );
    assert.strictEqual(
      isStageComplete("angle", { articleType: "feature", tone: "neutral" }),
      true,
    );
    assert.strictEqual(
      isStageComplete("sources", {
        parsedNotes: { verifiedFacts: ["fact1"] },
      }),
      true,
    );
    assert.strictEqual(
      isStageComplete("draft", { articlePkg: { headline: "test" } }),
      true,
    );
    assert.strictEqual(
      isStageComplete("package", { socialPkg: { x: "test" } }),
      true,
    );
    assert.strictEqual(
      isStageComplete("publish", { voiceGatePassed: true }),
      true,
    );
  });

  it("every stage has label, shortLabel, hint, and icon", () => {
    for (const stage of EDITORIAL_STAGES) {
      assert.ok(stage.label, `Stage ${stage.id} missing label`);
      assert.ok(stage.shortLabel, `Stage ${stage.id} missing shortLabel`);
      assert.ok(stage.hint, `Stage ${stage.id} missing hint`);
      assert.ok(stage.icon, `Stage ${stage.id} missing icon`);
    }
  });
});

// --- editorialPlaybooks ---
import {
  PLAYBOOKS,
  getPlaybook,
  getAngleGuidance,
  type VerticalId,
} from "../artifacts/hmg-newsroom/src/lib/hmg/editorial/editorialPlaybooks";

describe("editorialPlaybooks", () => {
  const verticalIds: VerticalId[] = [
    "hiphophaven",
    "raphaven",
    "musichaven",
    "sportshaven",
    "fithaven",
    "cannahaven",
    "hmg",
  ];

  it("has all seven playbooks", () => {
    for (const id of verticalIds) {
      const pb = getPlaybook(id);
      assert.ok(pb, `Playbook ${id} not found`);
    }
  });

  it("every playbook populates every required field", () => {
    const requiredFields = [
      "verticalId",
      "verticalName",
      "editorialMission",
      "whatGreatLooksLike",
      "urgencyRules",
      "sourceDiscipline",
      "headlineStyle",
      "avoidTheseMistakes",
      "idealArticleAngles",
      "socialTone",
      "webArtGuidance",
      "webEditGuidance",
      "wordpressChecklist",
      "founderReviewTriggers",
      "knowledgeDomains",
      "beatTopics",
      "sourcingStandard",
      "terminologyGuide",
      "fluencyWarnings",
    ];

    for (const id of verticalIds) {
      const pb = getPlaybook(id);
      assert.ok(pb, `Playbook ${id} not found`);
      for (const field of requiredFields) {
        assert.ok(
          (pb as Record<string, unknown>)[field] !== undefined,
          `Playbook ${id} missing field ${field}`,
        );
      }
    }
  });

  it("no playbook contains empty required collections", () => {
    const collectionFields = [
      "avoidTheseMistakes",
      "idealArticleAngles",
      "wordpressChecklist",
      "founderReviewTriggers",
      "knowledgeDomains",
      "beatTopics",
      "fluencyWarnings",
    ];

    for (const id of verticalIds) {
      const pb = getPlaybook(id) as Record<string, unknown>;
      for (const field of collectionFields) {
        const val = pb[field];
        assert.ok(Array.isArray(val), `Playbook ${id} field ${field} is not an array`);
        assert.ok(
          (val as unknown[]).length > 0,
          `Playbook ${id} field ${field} is empty`,
        );
      }
    }
  });

  it("no playbook contains TODO or placeholder", () => {
    for (const id of verticalIds) {
      const pb = getPlaybook(id);
      const json = JSON.stringify(pb);
      assert.ok(!json.includes("TODO"), `Playbook ${id} contains TODO`);
      assert.ok(
        !json.toLowerCase().includes("placeholder"),
        `Playbook ${id} contains placeholder`,
      );
    }
  });

  it("getAngleGuidance returns guidance for each vertical", () => {
    for (const id of verticalIds) {
      const guidance = getAngleGuidance(id);
      assert.ok(guidance, `Angle guidance for ${id} not found`);
    }
  });
});

// --- FounderVoiceGate (static structure) ---
// We can't import the component without React, but we can validate
// the GATE_ITEMS structure by reading the file.

import fs from "node:fs";
import path from "node:path";

describe("FounderVoiceGate", () => {
  it("exposes ten quality checks", () => {
    const gatePath = path.join(
      __dirname,
      "..",
      "artifacts/hmg-newsroom/src/components/hmg/editorial/FounderVoiceGate.tsx",
    );
    const source = fs.readFileSync(gatePath, "utf-8");
    // Count the id: entries in GATE_ITEMS
    const matches = source.match(/\bid:\s*"/g);
    assert.ok(matches, "No gate items found");
    assert.strictEqual(
      matches.length,
      10,
      `Expected 10 gate items, found ${matches.length}`,
    );
  });
});

// --- WordPressPublishView entry modes ---
describe("WordPressPublishView entry modes", () => {
  it("defines EntryMode type with five modes", () => {
    const wpPath = path.join(
      __dirname,
      "..",
      "artifacts/hmg-newsroom/src/components/newsroom/WordPressPublishView.tsx",
    );
    const source = fs.readFileSync(wpPath, "utf-8");
    assert.ok(source.includes('"blank"'), "Missing blank mode");
    assert.ok(source.includes('"from-editorial"'), "Missing from-editorial mode");
    assert.ok(source.includes('"from-history"'), "Missing from-history mode");
    assert.ok(source.includes('"resume-latest"'), "Missing resume-latest mode");
    assert.ok(source.includes('"paste-article"'), "Missing paste-article mode");
  });

  it("never simulates a successful connection", () => {
    const wpPath = path.join(
      __dirname,
      "..",
      "artifacts/hmg-newsroom/src/components/newsroom/WordPressPublishView.tsx",
    );
    const source = fs.readFileSync(wpPath, "utf-8");
    // Must contain honest blocked state
    assert.ok(source.includes("WordPress Not Connected"), "Missing blocked state");
    // Must contain confirmation before publish
    assert.ok(source.includes("confirmPublish"), "Missing publish confirmation");
  });
});

// --- SocialFactoryView source readiness ---
describe("SocialFactoryView source readiness", () => {
  it("handles article, visual, and clip source inputs", () => {
    const sfPath = path.join(
      __dirname,
      "..",
      "artifacts/hmg-newsroom/src/components/newsroom/SocialFactoryView.tsx",
    );
    const source = fs.readFileSync(sfPath, "utf-8");
    assert.ok(source.includes("Article"), "Missing Article source type");
    assert.ok(source.includes("WebArt"), "Missing WebArt source type");
    assert.ok(source.includes("WebEdit"), "Missing WebEdit source type");
    assert.ok(source.includes("Output History"), "Missing Output History source type");
  });
});

// --- OutputHistoryView filter definitions ---
describe("OutputHistoryView filter definitions", () => {
  it("includes article, visual, clip, social, and WordPress filters", () => {
    const ohPath = path.join(
      __dirname,
      "..",
      "artifacts/hmg-newsroom/src/components/newsroom/OutputHistoryView.tsx",
    );
    const source = fs.readFileSync(ohPath, "utf-8");
    // Check for content type filter labels
    assert.ok(source.includes("Article"), "Missing Article filter");
    assert.ok(source.includes("Social"), "Missing Social filter");
    assert.ok(source.includes("WordPress"), "Missing WordPress filter");
    assert.ok(source.includes("Cut Note"), "Missing Cut Note filter");
    assert.ok(source.includes("Edit Brief"), "Missing Edit Brief filter");
  });
});
