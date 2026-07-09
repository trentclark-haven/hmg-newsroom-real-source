import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RESEARCH_SECTIONS,
  parseResearchNotes,
  splitPasteTemplate,
} from "@/lib/hmg/editorial/researchNotes.ts";
import { generateEditorialArticle } from "@/lib/hmg/editorial/articleEngine.ts";
import { generateBreakingStory } from "@/lib/hmg/editorial/breakingEngine.ts";
import { generateSocialPosts } from "@/lib/hmg/editorial/socialEngine.ts";
import { computeArticleStrength } from "@/lib/hmg/editorial/strengthScore.ts";
import {
  buildWordpressPackage,
  packageToCopyableText,
} from "@/lib/hmg/editorial/wordpressExport.ts";
import type {
  ResearchSection,
  ResearchSectionId,
} from "@/lib/hmg/editorial/types.ts";

function sections(
  values: Partial<Record<ResearchSectionId, string>>,
): ResearchSection[] {
  return RESEARCH_SECTIONS.map((s) => ({ ...s, text: values[s.id] ?? "" }));
}

// --- 6 brand sample inputs ------------------------------------------------

const HIPHOP = sections({
  founderNotes:
    "New album dropped from a flagship Brooklyn artist. The rollout was three months. The intent is to put it next to the long arc of New York hip-hop.",
  notebookLM:
    "The artist released their fourth studio album on March 14, 2026. Three singles preceded the album. Production credits include two new in-house collaborators.",
  timeline:
    "Mar 14, 2026 — album released\nMar 17, 2026 — visualizer dropped\nMar 22, 2026 — tour announced",
  evergreenFacts:
    "Artist signed to independent label in 2019. Prior album reached #2 on the chart. Founded their own imprint in 2022.",
  quotes:
    '"This is my fourth album but it feels like the first one I actually trusted myself to make." — Artist Name, press release',
  sourceLinks: "Variety — https://variety.com/example\nOfficial label site — https://label.example.com",
  brandAngle:
    "Frame this as a cultural moment for New York hip-hop, not a chart story.",
  whatNotToClaim:
    "Do not name guest features that have not been officially confirmed.\nDo not assert label budget figures.",
});

const RAP = sections({
  founderNotes:
    "Two coastal rappers traded back-to-back releases this week. Audience is calling it a leaderboard moment.",
  timeline:
    "Mar 10, 2026 — west coast EP drop\nMar 12, 2026 — east coast single response\nMar 15, 2026 — both go top 5",
  evergreenFacts:
    "West coast artist signed in 2017. East coast artist has three platinum singles. Both have collaborated previously.",
  brandAngle: "Treat as a competitive rap moment, not a beef.",
  whatNotToClaim:
    "Do not call this a diss without a direct confirmation.\nDo not assign winner before week 2 numbers post.",
});

const MUSIC = sections({
  founderNotes:
    "Veteran indie singer-songwriter released a 9-track studio album recorded over 18 months.",
  notebookLM:
    "Long-arc career analysis. Earlier albums were maximalist; this one strips back the arrangement.",
  evergreenFacts:
    "Career started in 2009. Six prior studio albums. Won a major critics circle award in 2018.",
  quotes:
    '"I stopped trying to be heard over the noise and started writing toward silence." — Singer Name, longform interview',
  brandAngle:
    "Read this as craft and patience, not chart performance.",
});

const SPORTS = sections({
  founderNotes:
    "Veteran point guard scored a season-high 38 points in a playoff seeding game.",
  timeline:
    "Mar 28, 2026 — 38-point game\nMar 30, 2026 — clinched playoff seed\nApr 02, 2026 — playoff opener",
  evergreenFacts:
    "Player drafted in 2014. Averaging 22 points this season. Team currently sits 3rd in the conference.",
  quotes:
    '"We don\'t get to control the seeding — we control how locked in we are tonight." — Player Name, postgame',
  brandAngle:
    "Stakes-first read on the conference race.",
  whatNotToClaim: "Do not speculate on contract extension.",
});

const CANNA = sections({
  founderNotes:
    "A boutique California cannabis brand launched a small-batch live rosin line targeting the legacy market.",
  notebookLM:
    "Cannabis business angle. Cultivar is a heritage cut. Pricing is a premium positioning move.",
  evergreenFacts:
    "Brand founded in 2020. Operates a Tier-1 retail license. Distribution covers three counties.",
  brandAngle:
    "Adult business + culture coverage. No medical claims.",
});

const FIT = sections({
  founderNotes:
    "A new study on Zone 2 cardio for office workers points to sub-45-minute weekly sessions producing measurable HRV improvements.",
  evergreenFacts:
    "Zone 2 is the steady aerobic effort tier. HRV is heart rate variability — a recovery indicator.",
  brandAngle:
    "Practical training takeaway, not a research summary.",
  whatNotToClaim:
    "Do not present this as medical advice.\nDo not promise specific weight-loss outcomes.",
});

// --- Parse smoke ----------------------------------------------------------

test("parseResearchNotes extracts who/timeline/quotes/links/facts", () => {
  const notes = parseResearchNotes(HIPHOP);
  assert.ok(notes.storyTitle.length > 0, "story title derived");
  assert.ok(notes.who.length > 0, "names extracted");
  assert.ok(notes.timeline.length >= 3, "timeline beats extracted");
  assert.ok(
    notes.verifiedFacts.length >= 3,
    `expected ≥3 facts, got ${notes.verifiedFacts.length}`,
  );
  assert.ok(notes.quotes.length >= 1, "quote extracted with attribution");
  assert.equal(notes.quotes[0].attribution.includes("Artist Name"), true);
  assert.ok(notes.sourceLinks.length >= 2, "links extracted");
  assert.ok(notes.whatNotToClaim.length >= 2, "what-not-to-claim lines kept");
});

test("splitPasteTemplate routes labeled sections", () => {
  const raw = `STORY NOTES:
Album dropped today.

TIMELINE:
Mar 14, 2026 — album dropped

QUOTES:
"Real one." — Artist Name

WHAT NOT TO CLAIM:
Do not name producer.`;
  const out = splitPasteTemplate(raw);
  assert.ok(out.founderNotes?.includes("Album dropped today"));
  assert.ok(out.timeline?.includes("Mar 14, 2026"));
  assert.ok(out.quotes?.includes("Real one"));
  assert.ok(out.whatNotToClaim?.includes("Do not name producer"));
});

// --- Article engine for all 6 brands -------------------------------------

const SAMPLES: { brand: string; secs: ResearchSection[]; brandName: string }[] = [
  { brand: "hiphophaven", secs: HIPHOP, brandName: "HipHopHaven" },
  { brand: "raphaven", secs: RAP, brandName: "RapHaven" },
  { brand: "musichaven", secs: MUSIC, brandName: "MusicHaven" },
  { brand: "sportshaven", secs: SPORTS, brandName: "SportsHaven" },
  { brand: "cannahaven", secs: CANNA, brandName: "CannaHaven" },
  { brand: "fithaven", secs: FIT, brandName: "FitHaven" },
];

for (const sample of SAMPLES) {
  test(`generateEditorialArticle produces a real article for ${sample.brandName}`, () => {
    const notes = parseResearchNotes(sample.secs);
    const pkg = generateEditorialArticle({
      brand: sample.brand,
      articleType: "feature",
      tone: "neutral",
      role: "managing-editor",
      notes,
    });
    assert.equal(pkg.brand, sample.brand);
    assert.equal(pkg.brandName, sample.brandName);
    assert.ok(pkg.headline.length >= 8, "headline non-trivial");
    assert.ok(pkg.dek.length >= 20, "dek non-trivial");
    assert.ok(
      pkg.articleBody.split(/\n{2,}/).length >= 4,
      "article body has at least 4 paragraphs",
    );
    assert.ok(
      pkg.articleBody.includes(sample.brandName),
      "brand name surfaces in article body",
    );
    assert.ok(pkg.keyFacts.length > 0, "key facts populated");
    assert.ok(pkg.verificationNotes.length > 0, "verification notes populated");
    assert.ok(pkg.whatNotToClaim.length > 0, "what-not-to-claim populated");
    assert.ok(pkg.seoTitle.length > 0 && pkg.seoTitle.length <= 65, "SEO title sized");
    assert.ok(
      pkg.seoDescription.length > 0 && pkg.seoDescription.length <= 160,
      "SEO description sized",
    );
    assert.ok(pkg.suggestedTags.length > 0, "tags suggested");
    assert.ok(pkg.publishChecklist.length > 0, "publish checklist generated");
    assert.ok(pkg.nextActions.length > 0, "next actions generated");
    // Honest: no invented placeholder phrasing.
    assert.equal(
      /\[insert (here|name)\]/i.test(pkg.articleBody),
      false,
      "article body must not contain bracketed placeholders",
    );
  });
}

test("article body actually folds in source-note content", () => {
  const notes = parseResearchNotes(HIPHOP);
  const pkg = generateEditorialArticle({
    brand: "hiphophaven",
    articleType: "feature",
    tone: "neutral",
    role: "managing-editor",
    notes,
  });
  // The lede or facts paragraph should reference timeline beats / fact content.
  const includesTimeline =
    pkg.articleBody.includes("Mar 14, 2026") ||
    pkg.timelineDates.some((t) => t.includes("Mar 14"));
  assert.equal(includesTimeline, true, "timeline date carried into output");
  // Quote should appear quoted verbatim if present.
  assert.ok(
    pkg.articleBody.includes("fourth album"),
    "quote text appears in body verbatim",
  );
});

test("thin notes produce a verification warning but still draft", () => {
  const sparse = sections({ founderNotes: "Something happened today." });
  const notes = parseResearchNotes(sparse);
  const pkg = generateEditorialArticle({
    brand: "musichaven",
    articleType: "news",
    tone: "neutral",
    role: "staff-writer",
    notes,
  });
  assert.ok(pkg.articleBody.length > 50, "still produces a body");
  assert.ok(
    pkg.verificationNotes.some((v) => /thin|verify|add at least/i.test(v)),
    "verification notes warn about thin source material",
  );
});

test("generateBreakingStory produces alert pack", () => {
  const notes = parseResearchNotes(SPORTS);
  const pkg = generateBreakingStory("sportshaven", notes);
  assert.ok(pkg.headline.startsWith("BREAKING:"));
  assert.ok(pkg.webPost.length > 50);
  assert.ok(pkg.xPost.length > 0);
  assert.ok(pkg.instagramCaption.length > 0);
  assert.ok(pkg.pushAlert.length > 0);
  assert.ok(pkg.verificationNotes.length >= 1);
});

test("generateSocialPosts produces a multi-platform pack", () => {
  const notes = parseResearchNotes(RAP);
  const pack = generateSocialPosts("raphaven", notes);
  const ids = pack.pieces.map((p) => p.id);
  for (const required of [
    "x-single",
    "x-thread",
    "ig-feed",
    "ig-story",
    "tiktok",
    "newsletter",
    "youtube-short",
    "youtube-long",
    "discord",
  ]) {
    assert.ok(ids.includes(required), `social pack includes ${required}`);
  }
});

test("buildWordpressPackage returns slug, html, excerpt, and pull-receiver payload", () => {
  const notes = parseResearchNotes(CANNA);
  const pkg = generateEditorialArticle({
    brand: "cannahaven",
    articleType: "feature",
    tone: "neutral",
    role: "managing-editor",
    notes,
  });
  const wp = buildWordpressPackage(pkg);
  assert.ok(wp.slug.length > 0);
  assert.ok(wp.contentHtml.includes("<p>"));
  assert.equal(wp.status, "draft");
  const payload = wp.pullReceiverPayload as Record<string, unknown>;
  assert.equal(payload.brand, "cannahaven");
  assert.equal(payload.status, "draft");
  assert.ok(Array.isArray(payload.verificationNotes));
  assert.ok(Array.isArray(payload.tags));
});

test("computeArticleStrength scores thin notes as weak with a recommendation", () => {
  const sparse = sections({ founderNotes: "Something happened today." });
  const notes = parseResearchNotes(sparse);
  const strength = computeArticleStrength(notes);
  assert.equal(strength.band, "weak");
  assert.ok(strength.score < 50, `score should be low, got ${strength.score}`);
  assert.ok(
    strength.signals.some((s) => s.id === "sourceDepth" && s.band === "weak"),
    "sourceDepth flagged as weak",
  );
  assert.ok(
    strength.recommendation.length > 0,
    "recommendation populated",
  );
});

test("computeArticleStrength scores well-sourced notes as strong", () => {
  const notes = parseResearchNotes(HIPHOP);
  // HIPHOP has timeline + 1 quote + 2 links + evergreen facts + brand angle
  const enriched: typeof HIPHOP = HIPHOP.map((s) =>
    s.id === "evergreenFacts"
      ? {
          ...s,
          text:
            s.text +
            "\nFact 4. Concrete fact line.\nFact 5. Second concrete fact line.",
        }
      : s,
  );
  const enrichedNotes = parseResearchNotes(enriched);
  const strength = computeArticleStrength(enrichedNotes);
  assert.notEqual(strength.band, "weak", "rich notes should not be weak");
  assert.ok(
    strength.signals.find((s) => s.id === "sourceLinks")?.band !== "weak",
    "links present should not be weak",
  );
});

test("packageToCopyableText is non-empty and includes all sections", () => {
  const notes = parseResearchNotes(FIT);
  const pkg = generateEditorialArticle({
    brand: "fithaven",
    articleType: "explainer",
    tone: "explanatory",
    role: "staff-writer",
    notes,
  });
  const text = packageToCopyableText(pkg);
  assert.match(text, /HEADLINE:/);
  assert.match(text, /ARTICLE BODY:/);
  assert.match(text, /VERIFICATION NOTES:/);
  assert.match(text, /WHAT NOT TO CLAIM:/);
  assert.match(text, /SEO TITLE:/);
  assert.match(text, /PUBLISH CHECKLIST:/);
});
