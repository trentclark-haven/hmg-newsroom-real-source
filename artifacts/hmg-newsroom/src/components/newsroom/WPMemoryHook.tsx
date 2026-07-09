/**
 * WPMemoryHook — WordPress Post Builder memory integration.
 *
 * Reads the Founder Knowledge Base (localStorage-only) and surfaces
 * relevant memory items for the current WordPress draft.
 *
 * No fake AI. No fake publish. No fake cloud. Honest local intelligence only.
 */

import { useState, useSyncExternalStore } from "react";
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  HardDrive,
  Search,
  Shield,
  Tag,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getAllItems,
  subscribeMemoryStore,
  type MemoryItem,
} from "@/lib/hmg/memory/founderKnowledgeBase";

const WP_RELEVANT_TYPES = [
  "founder-voice",
  "old-article",
  "brand-rule",
  "editorial-rule",
  "wordpress-rule",
  "social-example",
] as const;

const WP_CHECKLIST = [
  "Title set and under 60 chars",
  "Slug is lowercase, hyphenated, no dates",
  "Excerpt under 160 chars, ends with period",
  "Featured image attached (min 1200×628px), alt text credited",
  "SEO title set (50–60 chars, includes primary keyword)",
  "SEO meta description set (150–160 chars, natural language)",
  "Tags entered — max 10, all lowercase, hyphenated",
  "Category selected from approved brand categories only",
  "Author byline verified before manual publish",
  "Status set to Draft — no live push from this app",
  "Source/credit lines in body copy",
  "Verification notes reviewed — no unverified claims",
];

type MemorySection = {
  label: string;
  items: MemoryItem[];
  icon: typeof Brain;
  color: string;
};

function copyText(text: string, label: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error("Copy failed"));
}

function buildWPFieldSummary(
  pkg: { headline: string; seoTitle: string; seoDescription: string; wordpressExcerpt: string; suggestedTags: string[]; brand: string; },
  wpItems: MemoryItem[],
): string {
  const wpRule = wpItems.find((i) => i.type === "wordpress-rule");
  const brandRule = wpItems.find((i) => i.type === "brand-rule");

  return [
    `=== WordPress Draft Field Summary ===`,
    `Brand: ${pkg.brand}`,
    ``,
    `TITLE: ${pkg.headline}`,
    ``,
    `EXCERPT: ${pkg.wordpressExcerpt}`,
    ``,
    `TAGS: ${pkg.suggestedTags.join(", ")}`,
    ``,
    wpRule ? `WORDPRESS RULES FROM MEMORY:\n${wpRule.content}` : ``,
    ``,
    brandRule ? `BRAND RULES FROM MEMORY:\n${brandRule.content}` : ``,
    ``,
    `STATUS NOTE: Local draft only. No live WordPress publish from this app.`,
    `Ready for manual WordPress transfer.`,
  ]
    .filter((l) => l !== undefined)
    .join("\n")
    .trim();
}

function buildSEOFields(pkg: {
  headline: string;
  seoTitle: string;
  seoDescription: string;
  suggestedTags: string[];
}): string {
  return [
    `=== SEO Fields ===`,
    `SEO Title: ${pkg.seoTitle}`,
    `SEO Meta Description: ${pkg.seoDescription}`,
    `Focus Keyphrase: (set manually in Yoast)`,
    `Tags: ${pkg.suggestedTags.join(", ")}`,
    ``,
    `Yoast checklist:`,
    `[ ] SEO title length OK (50-60 chars)`,
    `[ ] Meta description length OK (150-160 chars)`,
    `[ ] Keyphrase in first paragraph`,
    `[ ] Internal links added`,
    `[ ] External source links verified`,
  ].join("\n");
}

function buildTagsCategories(pkg: { suggestedTags: string[]; brand: string }): string {
  return [
    `=== Tags & Categories ===`,
    `Tags: ${pkg.suggestedTags.join(", ")}`,
    ``,
    `Category: (set from approved brand category list for ${pkg.brand})`,
    ``,
    `Rules:`,
    `- Max 10 tags`,
    `- All lowercase, hyphenated (e.g. hip-hop, not Hip Hop)`,
    `- Use only approved categories — no free-form categories`,
  ].join("\n");
}

function buildFullDraftFields(
  pkg: { headline: string; seoTitle: string; seoDescription: string; wordpressExcerpt: string; suggestedTags: string[]; brand: string; wordpressSlug?: string; },
  wpItems: MemoryItem[],
): string {
  const wpRule = wpItems.find((i) => i.type === "wordpress-rule");
  const brandRule = wpItems.find((i) => i.type === "brand-rule");
  const founderVoice = wpItems.find((i) => i.type === "founder-voice");
  const editorialRule = wpItems.find((i) => i.type === "editorial-rule");

  return [
    `=== Full WordPress Draft Field Set ===`,
    `Generated: ${new Date().toLocaleString()}`,
    `Status: Local draft only — No live WordPress publish`,
    ``,
    `--- CORE FIELDS ---`,
    `Title: ${pkg.headline}`,
    `Slug: ${pkg.wordpressSlug || pkg.headline.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    `Excerpt: ${pkg.wordpressExcerpt}`,
    `Status: draft`,
    ``,
    `--- SEO FIELDS ---`,
    `SEO Title: ${pkg.seoTitle}`,
    `SEO Meta: ${pkg.seoDescription}`,
    ``,
    `--- TAXONOMY ---`,
    `Tags: ${pkg.suggestedTags.join(", ")}`,
    `Category: (select from ${pkg.brand} approved list)`,
    ``,
    `--- MEDIA ---`,
    `Featured Image: required — min 1200×628px — credit in alt text`,
    ``,
    `--- MEMORY CONTEXT FROM KNOWLEDGE BASE ---`,
    wpRule ? `WordPress Rules:\n${wpRule.content}` : `WordPress Rules: none loaded`,
    ``,
    brandRule ? `Brand Rules:\n${brandRule.content}` : `Brand Rules: none loaded`,
    ``,
    founderVoice ? `Founder Voice:\n${founderVoice.content.slice(0, 400)}...` : `Founder Voice: none loaded`,
    ``,
    editorialRule ? `Editorial Rules:\n${editorialRule.content}` : ``,
    ``,
    `--- READY FOR MANUAL PUBLISH CHECKLIST ---`,
    ...WP_CHECKLIST.map((c) => `[ ] ${c}`),
    ``,
    `Local memory available — No live WordPress publish — Ready for manual WordPress transfer`,
    `Provider hook: pending — no fake connection made`,
  ]
    .filter((l) => l !== undefined)
    .join("\n")
    .trim();
}

interface WPMemoryHookProps {
  brand: string;
  brandName: string;
  headline: string;
  seoTitle: string;
  seoDescription: string;
  wordpressExcerpt: string;
  suggestedTags: string[];
  accent: string;
}

export function WPMemoryHook({
  brand,
  brandName,
  headline,
  seoTitle,
  seoDescription,
  wordpressExcerpt,
  suggestedTags,
  accent,
}: WPMemoryHookProps) {
  const [open, setOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);

  const allItems = useSyncExternalStore(
    subscribeMemoryStore,
    getAllItems,
    getAllItems,
  );

  const wpItems = allItems.filter((item) =>
    WP_RELEVANT_TYPES.includes(item.type as (typeof WP_RELEVANT_TYPES)[number]),
  );

  const sections: MemorySection[] = [
    {
      label: "Founder Voice",
      items: wpItems.filter((i) => i.type === "founder-voice"),
      icon: Brain,
      color: "#6366F1",
    },
    {
      label: "WordPress Rules",
      items: wpItems.filter((i) => i.type === "wordpress-rule"),
      icon: FileText,
      color: "#F59E0B",
    },
    {
      label: "Brand Rules",
      items: wpItems.filter((i) => i.type === "brand-rule"),
      icon: Shield,
      color: "#6366F1",
    },
    {
      label: "Editorial Rules",
      items: wpItems.filter((i) => i.type === "editorial-rule"),
      icon: Search,
      color: "#10B981",
    },
    {
      label: "Social Examples",
      items: wpItems.filter((i) => i.type === "social-example"),
      icon: Zap,
      color: "#FBBF24",
    },
  ].filter((s) => s.items.length > 0);

  const pkg = { headline, seoTitle, seoDescription, wordpressExcerpt, suggestedTags, brand: brandName };
  const wpSlug = headline.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="border-t border-border/30 mt-2 pt-2">
      {/* Trigger bar */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-1 py-1.5 rounded hover:bg-foreground/5 transition-colors group"
        data-testid="wp-memory-hook-toggle"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Brain className="w-3.5 h-3.5 shrink-0" style={{ color: "#6366F1" }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#6366F1" }}>
            Memory for this draft
          </span>
          {/* Compact type indicators */}
          {(() => {
            const hasVoice = wpItems.some((i) => i.type === "founder-voice");
            const hasWP = wpItems.some((i) => i.type === "wordpress-rule");
            const hasBrand = wpItems.some((i) => i.type === "brand-rule");
            const chips: { label: string; ok: boolean }[] = [
              { label: "Voice", ok: hasVoice },
              { label: "WP Rules", ok: hasWP },
              { label: "Brand", ok: hasBrand },
            ];
            return chips.map(({ label, ok }) => (
              <span
                key={label}
                className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                style={
                  ok
                    ? { background: "#10B98120", color: "#10B981", border: "1px solid #10B98140" }
                    : { background: "#94A3B820", color: "#94A3B8", border: "1px solid #94A3B840" }
                }
              >
                {ok ? "✓" : "○"} {label}
              </span>
            ));
          })()}
          {wpItems.length === 0 && (
            <span className="text-[10px] text-muted-foreground">— no KB memory loaded</span>
          )}
        </div>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="mt-2 space-y-3" data-testid="wp-memory-hook-panel">

          {/* Status bar */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-indigo-500/[0.06] border border-indigo-400/20 text-[10px] text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              Local memory available
            </span>
            <span className="text-border/60">·</span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              No live WordPress publish
            </span>
            <span className="text-border/60">·</span>
            <span>Ready for manual WordPress transfer</span>
            <span className="text-border/60">·</span>
            <span className="text-muted-foreground/60">Provider hook pending</span>
          </div>

          {/* Copy action buttons */}
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[11px] gap-1"
              onClick={() => copyText(buildWPFieldSummary(pkg, wpItems), "WordPress Field Summary")}
              data-testid="wp-copy-field-summary"
            >
              <Copy className="w-3 h-3" />
              Copy WordPress Field Summary
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[11px] gap-1"
              onClick={() => copyText(buildSEOFields(pkg), "SEO Fields")}
              data-testid="wp-copy-seo-fields"
            >
              <Copy className="w-3 h-3" />
              Copy SEO Fields
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[11px] gap-1"
              onClick={() => copyText(buildTagsCategories(pkg), "Tags/Categories")}
              data-testid="wp-copy-tags"
            >
              <Tag className="w-3 h-3" />
              Copy Tags/Categories
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[11px] gap-1"
              onClick={() =>
                copyText(
                  buildFullDraftFields({ ...pkg, wordpressSlug: wpSlug }, wpItems),
                  "Full WordPress Draft Fields",
                )
              }
              data-testid="wp-copy-full-draft"
            >
              <Copy className="w-3 h-3" />
              Copy Full WordPress Draft Fields
            </Button>
          </div>

          {/* Memory sections */}
          {sections.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Knowledge Base — WP-Relevant Memory
              </p>
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.label} className="rounded-lg border border-border/40 bg-secondary/20">
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b border-border/30"
                      style={{ color: section.color }}
                    >
                      <Icon className="w-3 h-3" />
                      {section.label} ({section.items.length})
                    </div>
                    <div className="p-2 space-y-1.5">
                      {section.items.map((item) => (
                        <div key={item.id} className="rounded border border-border/30 bg-background/30 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold text-foreground/90 truncate">
                              {item.title}
                            </p>
                            <button
                              type="button"
                              onClick={() => copyText(item.content, item.title)}
                              className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-foreground/5 shrink-0"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </button>
                          </div>
                          <p className="text-[11px] text-foreground/60 mt-1 line-clamp-3 whitespace-pre-line">
                            {item.content.slice(0, 280)}
                            {item.content.length > 280 ? "…" : ""}
                          </p>
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.tags.slice(0, 5).map((t) => (
                                <span
                                  key={t}
                                  className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-foreground/5 text-muted-foreground"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/50 px-3 py-4 text-center">
              <Brain className="w-6 h-6 mx-auto mb-2 text-muted-foreground/30" style={{ color: "#6366F1" }} />
              <p className="text-[11px] font-semibold text-foreground/70">
                No WordPress-relevant memory loaded yet.
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Open Founder Knowledge Base → add Founder Voice, WordPress Rules, or Brand Rules
                to see memory-backed guidance here.
              </p>
            </div>
          )}

          {/* Suggestion lines derived from memory */}
          {wpItems.length > 0 && (
            <div className="rounded-lg border border-border/40 bg-secondary/10 p-2.5 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Draft Field Suggestions — from KB
              </p>
              <div className="space-y-1 text-[11px] text-foreground/80">
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0 w-32">Title guidance:</span>
                  <span>
                    {wpItems.find((i) => i.type === "founder-voice")
                      ? "Apply Founder Voice style — factual, punchy, no clickbait"
                      : "Factual headline, under 60 chars — add Founder Voice to KB for brand style"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0 w-32">Slug:</span>
                  <span className="font-mono text-[10px] break-all">{wpSlug}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0 w-32">Excerpt style:</span>
                  <span>
                    {wpItems.find((i) => i.type === "wordpress-rule")
                      ? "Under 160 chars, no spoilers, ends with period — per WordPress Rules"
                      : "Under 160 chars, end with period — add WordPress Rules to KB for site-specific style"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0 w-32">Body HTML:</span>
                  <span>
                    {"<p> tags only — no inline styles — keep headings at H2/H3 level"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0 w-32">Categories:</span>
                  <span>
                    {wpItems.find((i) => i.type === "brand-rule")
                      ? "Use approved brand categories only — per Brand Rules"
                      : "Use approved brand categories — add Brand Rules to KB for site-specific list"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0 w-32">Tags:</span>
                  <span>Max 10, lowercase, hyphenated — {suggestedTags.length} suggested from article</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0 w-32">Featured image:</span>
                  <span>Required — min 1200×628px — include credit in alt text</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0 w-32">SEO title:</span>
                  <span>{seoTitle ? `${seoTitle.length} chars — ${seoTitle.length <= 60 ? "✓ OK" : "⚠ trim to under 60"}` : "Not set"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0 w-32">SEO meta:</span>
                  <span>{seoDescription ? `${seoDescription.length} chars — ${seoDescription.length <= 160 ? "✓ OK" : "⚠ trim to under 160"}` : "Not set"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0 w-32">Source credit:</span>
                  <span>
                    {wpItems.find((i) => i.type === "editorial-rule")
                      ? "Credit sources per Editorial Rules — per KB"
                      : "Include source credits in body copy"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ready for Manual Publish Checklist */}
          <div className="rounded-lg border border-border/40 bg-secondary/10">
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              onClick={() => setChecklistOpen((v) => !v)}
              data-testid="wp-checklist-toggle"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                Ready for Manual Publish Checklist
              </span>
              {checklistOpen ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
            {checklistOpen && (
              <ul className="px-2.5 pb-2.5 space-y-1">
                {WP_CHECKLIST.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-foreground/80">
                    <span className="mt-0.5 h-3 w-3 shrink-0 rounded-sm border border-border/60" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Honest footer */}
          <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-muted/30 text-[10px] text-muted-foreground">
            <HardDrive className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "#6366F1" }} />
            <span>
              <strong className="text-foreground">Local memory available</strong> · No live WordPress publish · Ready for manual WordPress transfer · Provider hook pending — no fake connection is ever made.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
