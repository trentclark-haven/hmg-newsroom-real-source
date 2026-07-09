import { buildBrandRules } from "./brandRules.ts";
import type {
  ArticleType,
  EditorialArticlePackage,
  EditorialEngineInput,
  ParsedResearchNotes,
} from "./types.ts";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function pickSubject(notes: ParsedResearchNotes): string {
  if (notes.storyTitle) return notes.storyTitle;
  if (notes.what) return notes.what;
  if (notes.who[0]) return notes.who[0];
  return "this developing story";
}

function buildHeadline(
  type: ArticleType,
  subject: string,
  brandName: string,
  notes: ParsedResearchNotes,
): string {
  const lead = notes.who[0] ?? "";
  switch (type) {
    case "news":
      return lead
        ? `${lead}: ${truncate(subject, 80)}`
        : truncate(subject, 100);
    case "feature":
      return `Inside ${truncate(subject, 80)}`;
    case "review":
      return `${truncate(subject, 80)} — A ${brandName} Review`;
    case "analysis":
      return `What ${truncate(subject, 70)} Actually Means`;
    case "explainer":
      return `${truncate(subject, 80)}, Explained`;
    case "interview-recap":
      return `${lead || truncate(subject, 60)} Goes On The Record`;
    case "list":
      return `${truncate(subject, 70)}: What To Know Right Now`;
    case "opinion":
      return `${brandName} Take: ${truncate(subject, 70)}`;
    default:
      return truncate(subject, 100);
  }
}

function buildAlternateHeadlines(
  base: string,
  subject: string,
  brandName: string,
  notes: ParsedResearchNotes,
): string[] {
  const second =
    notes.who[1] ??
    notes.timeline[0]?.replace(/^[-•]?\s*/, "").split("—")[0].trim();
  const out = [
    `Why ${truncate(subject, 70)} Matters For ${brandName}`,
    `${truncate(subject, 70)}: The Verified Read`,
    second ? `${second} And The ${truncate(subject, 60)} Story` : "",
    `${brandName} On ${truncate(subject, 70)}`,
  ].filter((h) => h && h !== base);
  return Array.from(new Set(out)).slice(0, 3);
}

function buildDek(
  subject: string,
  brandName: string,
  notes: ParsedResearchNotes,
): string {
  const angle = notes.angle ? ` ${notes.angle.split(/(?<=[.!?])\s+/)[0]}` : "";
  const factCount = notes.verifiedFacts.length;
  const qualifier =
    factCount >= 3
      ? "with the verified context, key dates, and what still needs confirmation."
      : "with the available context and a clear note about what still needs confirmation.";
  return truncate(
    `${brandName} reads ${subject} ${qualifier}${angle}`.trim(),
    320,
  );
}

function buildBody(
  notes: ParsedResearchNotes,
  brandName: string,
  type: ArticleType,
): string {
  const rules = buildBrandRules(brandName);
  const subject = pickSubject(notes);
  const paragraphs: string[] = [];

  // Lede — brand-voiced framing, anchored to what+who if available.
  const lede = notes.what
    ? `${rules.ledeFraming(subject)} The available reporting points to ${notes.what}`
    : rules.ledeFraming(subject);
  paragraphs.push(lede.trim());

  // Who paragraph
  if (notes.who.length > 0) {
    const people = notes.who.slice(0, 4).join(", ");
    paragraphs.push(
      `At the center of the story: ${people}. Those names anchor the reporting and are what the desk will keep verifying as the story develops.`,
    );
  }

  // Timeline paragraph
  if (notes.timeline.length > 0) {
    const beats = notes.timeline.slice(0, 4).join("; ");
    paragraphs.push(
      `The timeline as the desk has it so far: ${beats}. Each beat is treated as confirmed only when the source notes support it.`,
    );
  }

  // Facts paragraph — actually USE the facts, don't fabricate.
  if (notes.verifiedFacts.length > 0) {
    const facts = notes.verifiedFacts.slice(0, 4);
    const stitched = facts
      .map((f) => f.replace(/[.;]$/, ""))
      .join(". ");
    paragraphs.push(
      `Working from the verified material on hand: ${stitched}. Those are the load-bearing details for this draft.`,
    );
  }

  // Context paragraph
  paragraphs.push(rules.contextLine(subject));

  // Quote — only if real quote present in notes
  if (notes.quotes.length > 0) {
    const q = notes.quotes[0];
    paragraphs.push(
      `${q.attribution} put it on the record this way: "${q.text}" — quoted exactly as it appears in the source material.`,
    );
  }

  // Angle paragraph
  if (notes.angle) {
    paragraphs.push(
      `The ${brandName} angle is specific: ${notes.angle.split(/(?<=[.!?])\s+/).slice(0, 3).join(" ")}`,
    );
  }

  // Type-specific extra paragraph
  if (type === "analysis" || type === "explainer") {
    paragraphs.push(
      `What it actually means: this story changes the picture if the verified beats hold up. The desk will not stretch the read past what the notes support.`,
    );
  } else if (type === "review") {
    paragraphs.push(
      `The verdict here is shaped by what the source material can stand behind — the rest stays out of the review until it can be confirmed.`,
    );
  } else if (type === "interview-recap") {
    paragraphs.push(
      `The interview takeaways above are pulled directly from the transcript. Anything not quoted is summarized, not invented.`,
    );
  }

  // Closer
  paragraphs.push(rules.closer(subject));

  return paragraphs.filter(Boolean).join("\n\n");
}

function buildKeyFacts(notes: ParsedResearchNotes): string[] {
  const out: string[] = [];
  for (const f of notes.verifiedFacts) {
    if (out.length >= 8) break;
    out.push(f);
  }
  for (const t of notes.timeline) {
    if (out.length >= 10) break;
    out.push(t);
  }
  return out;
}

function buildVerificationNotes(notes: ParsedResearchNotes): string[] {
  const out: string[] = [];
  const factCount = notes.verifiedFacts.length;
  const quoteCount = notes.quotes.length;
  const linkCount = notes.sourceLinks.length;
  const timelineCount = notes.timeline.length;
  out.push(
    `Created from ${factCount} verified fact line${factCount === 1 ? "" : "s"}, ${quoteCount} quote${quoteCount === 1 ? "" : "s"}, ${timelineCount} timeline beat${timelineCount === 1 ? "" : "s"}, and ${linkCount} source link${linkCount === 1 ? "" : "s"}.`,
  );
  if (factCount < 3) {
    out.push(
      "Source material is thin. Add more verified facts before this post is Ready for Manual Publish.",
    );
  }
  if (quoteCount === 0) {
    out.push(
      "No quotes in source notes. Do not invent quotes. Reach for a direct statement before manual publish if a quote is needed.",
    );
  }
  if (linkCount === 0) {
    out.push(
      "No source links recorded. Add at least one source URL before manual publish for editorial accountability.",
    );
  }
  if (notes.who.length === 0) {
    out.push(
      "No clear subjects detected in the notes. Add named people, brands, or teams to anchor the reporting.",
    );
  }
  return out;
}

function buildWhatNotToClaim(notes: ParsedResearchNotes, brandName: string): string[] {
  const rules = buildBrandRules(brandName);
  const merged = [...notes.whatNotToClaim, ...rules.doNotClaim];
  return Array.from(new Set(merged)).slice(0, 8);
}

function buildSeo(
  headline: string,
  subject: string,
  brandName: string,
  type: ArticleType,
  notes: ParsedResearchNotes,
): { title: string; description: string; tags: string[] } {
  const title = truncate(`${headline} | ${brandName}`, 65);
  const description = truncate(
    `${brandName} ${type === "review" ? "reviews" : type === "analysis" ? "analyzes" : "covers"} ${subject} with the verified context, key facts, and what still needs confirmation.`,
    160,
  );
  const rules = buildBrandRules(brandName);
  const tagSeed = [
    brandName,
    ...notes.who.slice(0, 3),
    ...rules.hashtagSeed.map((h) => h.replace(/^#/, "")),
  ];
  const tags = Array.from(new Set(tagSeed.filter(Boolean))).slice(0, 8);
  return { title, description, tags };
}

function buildSocial(
  subject: string,
  brandName: string,
  notes: ParsedResearchNotes,
): { social: string; x: string; ig: string; yt: string; excerpt: string } {
  const rules = buildBrandRules(brandName);
  const opener = rules.socialOpener(subject);
  const hashtagLine = rules.hashtagSeed.slice(0, 3).join(" ");
  return {
    social: truncate(`${opener} The verified read, key facts, and timeline are in this one. ${hashtagLine}`, 280),
    x: truncate(`${opener} The verified context + key beats in one read. ${hashtagLine}`, 260),
    ig: truncate(
      `${opener}\n\n${truncate(subject, 200)}\n\nFull breakdown — verified facts, timeline, and what still needs confirmation — is published on ${brandName}.\n\n${hashtagLine}`,
      2100,
    ),
    yt: truncate(
      `${brandName} breaks down ${subject}. In this video we cover the verified facts, the timeline, the key names, and what still needs confirmation. ${hashtagLine}`,
      4000,
    ),
    excerpt: truncate(
      `${brandName}'s read on ${subject}: verified context, key facts, and what still needs confirmation — in one clean piece.`,
      240,
    ),
  };
}

function buildPublishChecklist(notes: ParsedResearchNotes): string[] {
  const checks: string[] = [
    "Headline, dek, and lede match.",
    "All quotes are present in the source notes (no invented quotes).",
    "All key facts trace back to a verified source line.",
    "Verification notes reviewed; thin sections addressed.",
    "What-Not-To-Claim list scanned against the article body.",
    "SEO title under 65 characters, description under 160.",
    "Tags reviewed for brand fit.",
  ];
  if (notes.sourceLinks.length > 0) {
    checks.push("Source links inserted into the article body or footer.");
  } else {
    checks.push("Add at least one named source link before this post is Ready for Manual Publish.");
  }
  if (notes.quotes.length > 0) {
    checks.push("Confirm attribution wording for the highlighted quote.");
  }
  return checks;
}

function buildNextActions(brandName: string, notes: ParsedResearchNotes): string[] {
  const out: string[] = [
    `Open WebArt and create the ${brandName} hero image.`,
    "Open Social Factory and create the platform-tuned posts.",
    "Save Draft for editorial review.",
    "Export the WordPress draft or copy the WP HTML.",
  ];
  if (notes.timeline.length > 0) {
    out.push("Confirm every timeline date with a primary source before manual publish.");
  }
  return out;
}

export function generateEditorialArticle(
  input: EditorialEngineInput,
): EditorialArticlePackage {
  const { brand, articleType, tone, role, notes } = input;
  const rules = buildBrandRules(brand);
  const brandName = rules.profile.name;
  const subject = pickSubject(notes);
  const headline = buildHeadline(articleType, subject, brandName, notes);
  const alternateHeadlines = buildAlternateHeadlines(headline, subject, brandName, notes);
  const dek = buildDek(subject, brandName, notes);
  const articleBody = buildBody(notes, brandName, articleType);
  const keyFacts = buildKeyFacts(notes);
  const verificationNotes = buildVerificationNotes(notes);
  const whatNotToClaim = buildWhatNotToClaim(notes, brandName);
  const seo = buildSeo(headline, subject, brandName, articleType, notes);
  const social = buildSocial(subject, brandName, notes);
  const publishChecklist = buildPublishChecklist(notes);
  const nextActions = buildNextActions(brandName, notes);
  const sourceNotesUsed = [
    ...notes.verifiedFacts.slice(0, 6),
    ...notes.timeline.slice(0, 4),
    ...notes.quotes.slice(0, 3).map((q) => `"${q.text}" — ${q.attribution}`),
    ...notes.sourceLinks.map((l) => `${l.label}: ${l.url}`),
  ];

  return {
    id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    brand,
    brandName,
    articleType,
    tone,
    role,
    headline,
    alternateHeadlines,
    dek,
    articleBody,
    keyFacts,
    timelineDates: notes.timeline,
    sourceNotesUsed,
    verificationNotes,
    whatNotToClaim,
    seoTitle: seo.title,
    seoDescription: seo.description,
    suggestedTags: seo.tags,
    socialCaption: social.social,
    xPost: social.x,
    instagramCaption: social.ig,
    youtubeDescription: social.yt,
    wordpressExcerpt: social.excerpt,
    publishChecklist,
    nextActions,
    createdAt: new Date().toISOString(),
  };
}

export { slugify, truncate };
