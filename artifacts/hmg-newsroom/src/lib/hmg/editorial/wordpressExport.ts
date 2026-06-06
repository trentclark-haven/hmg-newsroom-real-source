import { slugify } from "./articleEngine.ts";
import type { EditorialArticlePackage } from "./types.ts";

export interface WordpressPackage {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  contentMarkdown: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  status: "draft";
  pullReceiverPayload: Record<string, unknown>;
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildWordpressPackage(
  pkg: EditorialArticlePackage,
): WordpressPackage {
  const slug = slugify(pkg.headline);
  const paragraphs = pkg.articleBody.split(/\n{2,}/).filter(Boolean);
  const bodyHtml = paragraphs.map((p) => `<p>${htmlEscape(p)}</p>`).join("\n");
  const keyFactsHtml = pkg.keyFacts.length
    ? `<h3>Key Facts</h3>\n<ul>\n${pkg.keyFacts.map((f) => `  <li>${htmlEscape(f)}</li>`).join("\n")}\n</ul>`
    : "";
  const timelineHtml = pkg.timelineDates.length
    ? `<h3>Timeline</h3>\n<ul>\n${pkg.timelineDates.map((t) => `  <li>${htmlEscape(t)}</li>`).join("\n")}\n</ul>`
    : "";

  const contentHtml = [
    `<p><em>${htmlEscape(pkg.dek)}</em></p>`,
    bodyHtml,
    keyFactsHtml,
    timelineHtml,
  ]
    .filter(Boolean)
    .join("\n\n");

  const contentMarkdown = [
    `# ${pkg.headline}`,
    "",
    `_${pkg.dek}_`,
    "",
    pkg.articleBody,
    pkg.keyFacts.length
      ? `\n## Key Facts\n${pkg.keyFacts.map((f) => `- ${f}`).join("\n")}`
      : "",
    pkg.timelineDates.length
      ? `\n## Timeline\n${pkg.timelineDates.map((t) => `- ${t}`).join("\n")}`
      : "",
    `\n---\n_${pkg.brandName} · ${pkg.articleType} · draft · generated ${pkg.createdAt}_`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title: pkg.headline,
    slug,
    excerpt: pkg.wordpressExcerpt,
    contentHtml,
    contentMarkdown,
    seoTitle: pkg.seoTitle,
    seoDescription: pkg.seoDescription,
    tags: pkg.suggestedTags,
    status: "draft",
    pullReceiverPayload: {
      brand: pkg.brand,
      brandName: pkg.brandName,
      slug,
      title: pkg.headline,
      dek: pkg.dek,
      excerpt: pkg.wordpressExcerpt,
      contentHtml,
      seo: {
        title: pkg.seoTitle,
        description: pkg.seoDescription,
      },
      tags: pkg.suggestedTags,
      generatedAt: pkg.createdAt,
      verificationNotes: pkg.verificationNotes,
      whatNotToClaim: pkg.whatNotToClaim,
      status: "draft",
    },
  };
}

export function packageToCopyableText(pkg: EditorialArticlePackage): string {
  const lines: string[] = [];
  lines.push(`HEADLINE: ${pkg.headline}`);
  if (pkg.alternateHeadlines.length) {
    lines.push("", "ALTERNATE HEADLINES:");
    for (const h of pkg.alternateHeadlines) lines.push(`- ${h}`);
  }
  lines.push("", `DEK: ${pkg.dek}`);
  lines.push("", "ARTICLE BODY:", pkg.articleBody);
  if (pkg.keyFacts.length) {
    lines.push("", "KEY FACTS:");
    for (const f of pkg.keyFacts) lines.push(`- ${f}`);
  }
  if (pkg.timelineDates.length) {
    lines.push("", "TIMELINE:");
    for (const t of pkg.timelineDates) lines.push(`- ${t}`);
  }
  if (pkg.verificationNotes.length) {
    lines.push("", "VERIFICATION NOTES:");
    for (const v of pkg.verificationNotes) lines.push(`- ${v}`);
  }
  if (pkg.whatNotToClaim.length) {
    lines.push("", "WHAT NOT TO CLAIM:");
    for (const w of pkg.whatNotToClaim) lines.push(`- ${w}`);
  }
  lines.push("", `SEO TITLE: ${pkg.seoTitle}`);
  lines.push(`SEO DESCRIPTION: ${pkg.seoDescription}`);
  lines.push(`TAGS: ${pkg.suggestedTags.join(", ")}`);
  lines.push("", `SOCIAL CAPTION: ${pkg.socialCaption}`);
  lines.push(`X: ${pkg.xPost}`);
  lines.push(`INSTAGRAM: ${pkg.instagramCaption}`);
  lines.push(`YOUTUBE: ${pkg.youtubeDescription}`);
  lines.push(`WORDPRESS EXCERPT: ${pkg.wordpressExcerpt}`);
  if (pkg.publishChecklist.length) {
    lines.push("", "PUBLISH CHECKLIST:");
    for (const c of pkg.publishChecklist) lines.push(`- [ ] ${c}`);
  }
  if (pkg.nextActions.length) {
    lines.push("", "NEXT ACTIONS:");
    for (const a of pkg.nextActions) lines.push(`- ${a}`);
  }
  return lines.join("\n");
}
