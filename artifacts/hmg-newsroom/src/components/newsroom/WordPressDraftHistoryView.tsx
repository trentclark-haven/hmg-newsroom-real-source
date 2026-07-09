/**
 * WordPress Draft History View — Task 2
 *
 * Shows all saved WordPress draft outputs as clean formatted cards.
 * No live publish. No fake connection. Local-only, honest.
 * No "package" language anywhere in this file.
 */

import { useState, useSyncExternalStore } from "react";
import {
  BookMarked,
  CheckCircle2,
  ClipboardCopy,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Filter,
  HardDrive,
  Megaphone,
  Search,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useOutputHistory, type OutputHistoryEntry } from "@/lib/useOutputHistory";

type WPDraftOutput = {
  title?: string;
  slug?: string;
  excerpt?: string;
  categories?: string[];
  tags?: string[];
  hasFeaturedImage?: boolean;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  bodyHtml?: string;
  body?: string;
  status?: string;
  exportedAt?: string;
  brand?: string;
  site?: string;
  sourceNotes?: string;
  wordpressSlug?: string;
  wordpressExcerpt?: string;
  suggestedTags?: string[];
  headline?: string;
};

function getWPOutput(entry: OutputHistoryEntry): WPDraftOutput {
  return (entry.output ?? {}) as WPDraftOutput;
}

function getDraftStatus(out: WPDraftOutput): {
  label: string;
  color: string;
} {
  const raw = (out.status ?? "draft").toLowerCase();
  if (raw.includes("ready")) return { label: "Ready for Manual Publish", color: "#10B981" };
  if (raw.includes("blocked")) return { label: "Publish Blocked", color: "#EF4444" };
  return { label: "Draft", color: "#F59E0B" };
}

function copyField(value: string | undefined, label: string) {
  if (!value) {
    toast.error(`${label} is empty`);
    return;
  }
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error("Copy failed"));
}

function buildAllWPFields(out: WPDraftOutput, entry: OutputHistoryEntry): string {
  const tags = [
    ...(out.tags ?? []),
    ...(out.suggestedTags ?? []),
  ]
    .filter(Boolean)
    .join(", ");

  return [
    `=== WordPress Draft Fields ===`,
    `Generated: ${new Date(entry.createdAt).toLocaleString()}`,
    `Status: Local draft only — No live WordPress publish`,
    ``,
    `--- CORE FIELDS ---`,
    `Title: ${out.title ?? out.headline ?? ""}`,
    `Slug: ${out.slug ?? out.wordpressSlug ?? ""}`,
    `Excerpt: ${out.excerpt ?? out.wordpressExcerpt ?? ""}`,
    `Status: draft`,
    ``,
    `--- SEO FIELDS ---`,
    `SEO Title: ${out.seoTitle ?? ""}`,
    `SEO Meta Description: ${out.seoDescription ?? ""}`,
    ``,
    `--- TAXONOMY ---`,
    `Tags: ${tags}`,
    `Categories: ${(out.categories ?? []).join(", ")}`,
    ``,
    `--- MEDIA ---`,
    `Featured Image: ${out.hasFeaturedImage || out.featuredImage ? "Attached" : "Required — min 1200×628px — credit in alt text"}`,
    ``,
    out.brand || out.site ? `Brand/Site: ${out.brand ?? out.site}` : "",
    out.sourceNotes ? `Source Notes: ${out.sourceNotes}` : "",
    ``,
    `--- MANUAL PUBLISH CHECKLIST ---`,
    `[ ] Title set and under 60 chars`,
    `[ ] Slug is lowercase, hyphenated, no dates`,
    `[ ] Excerpt under 160 chars, ends with period`,
    `[ ] Featured image attached (min 1200×628px), alt text credited`,
    `[ ] SEO title set (50–60 chars, includes primary keyword)`,
    `[ ] SEO meta description set (150–160 chars, natural language)`,
    `[ ] Tags entered — max 10, all lowercase, hyphenated`,
    `[ ] Category selected from approved brand categories only`,
    `[ ] Author byline verified before manual publish`,
    `[ ] Status set to Draft — no live push from this app`,
    ``,
    `Local draft only. No live WordPress publish from this app.`,
    `Ready for manual WordPress transfer.`,
  ]
    .filter((l) => l !== undefined)
    .join("\n")
    .trim();
}

function buildSEOFields(out: WPDraftOutput): string {
  return [
    `=== SEO Fields ===`,
    `SEO Title: ${out.seoTitle ?? ""}`,
    `SEO Meta Description: ${out.seoDescription ?? ""}`,
    `Focus Keyphrase: (set manually in Yoast)`,
    ``,
    `Yoast checklist:`,
    `[ ] SEO title length OK (50-60 chars)`,
    `[ ] Meta description length OK (150-160 chars)`,
    `[ ] Keyphrase in first paragraph`,
    `[ ] Internal links added`,
    `[ ] External source links verified`,
  ].join("\n");
}

function buildTagsCategories(out: WPDraftOutput): string {
  const tags = [
    ...(out.tags ?? []),
    ...(out.suggestedTags ?? []),
  ]
    .filter(Boolean)
    .join(", ");
  return [
    `=== Tags & Categories ===`,
    `Tags: ${tags}`,
    `Categories: ${(out.categories ?? []).join(", ")}`,
    ``,
    `Rules:`,
    `- Max 10 tags`,
    `- All lowercase, hyphenated (e.g. hip-hop, not Hip Hop)`,
    `- Use only approved categories — no free-form categories`,
  ].join("\n");
}

function exportJSON(entry: OutputHistoryEntry) {
  const blob = new Blob([JSON.stringify(entry.output, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = getWPOutput(entry).slug ?? getWPOutput(entry).wordpressSlug ?? "draft";
  a.href = url;
  a.download = `wp-draft-${slug}-${new Date(entry.createdAt).toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("JSON exported");
}

function exportHTML(entry: OutputHistoryEntry) {
  const out = getWPOutput(entry);
  const bodyContent = out.bodyHtml ?? out.body ?? "";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${out.title ?? out.headline ?? "WordPress Draft"}</title>
</head>
<body>
<h1>${out.title ?? out.headline ?? ""}</h1>
<p><strong>Slug:</strong> ${out.slug ?? out.wordpressSlug ?? ""}</p>
<p><strong>Excerpt:</strong> ${out.excerpt ?? out.wordpressExcerpt ?? ""}</p>
<p><strong>SEO Title:</strong> ${out.seoTitle ?? ""}</p>
<p><strong>SEO Meta:</strong> ${out.seoDescription ?? ""}</p>
<p><strong>Tags:</strong> ${[...(out.tags ?? []), ...(out.suggestedTags ?? [])].join(", ")}</p>
<p><strong>Categories:</strong> ${(out.categories ?? []).join(", ")}</p>
<hr />
<div class="body-content">${bodyContent}</div>
<hr />
<p><em>Local draft only. No live WordPress publish. Saved: ${new Date(entry.createdAt).toLocaleString()}</em></p>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const slug = out.slug ?? out.wordpressSlug ?? "draft";
  a.href = url;
  a.download = `wp-draft-${slug}-${new Date(entry.createdAt).toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("HTML exported");
}

interface WPDraftCardProps {
  entry: OutputHistoryEntry;
  onRemove: (id: string) => void;
  onSendToSocialFactory?: () => void;
}

function WPDraftCard({ entry, onRemove }: WPDraftCardProps) {
  const out = getWPOutput(entry);
  const [expanded, setExpanded] = useState(false);
  const { label: statusLabel, color: statusColor } = getDraftStatus(out);

  const title = out.title ?? out.headline ?? entry.prompt ?? "Untitled Draft";
  const slug = out.slug ?? out.wordpressSlug ?? "";
  const excerpt = out.excerpt ?? out.wordpressExcerpt ?? "";
  const tags = [...(out.tags ?? []), ...(out.suggestedTags ?? [])];
  const categories = out.categories ?? [];
  const bodyContent = out.bodyHtml ?? out.body ?? "";
  const brand = out.brand ?? out.site ?? entry.siloName ?? "";
  const sourceNotes = out.sourceNotes ?? "";
  const allFields = buildAllWPFields(out, entry);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge
                variant="outline"
                className="text-[9px] uppercase tracking-wider px-1.5 py-0 font-bold"
                style={{ borderColor: `${statusColor}66`, color: statusColor }}
              >
                {statusLabel}
              </Badge>
              {brand && (
                <Badge variant="outline" className="text-[9px] uppercase tracking-wider px-1.5 py-0">
                  {brand}
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">
                {new Date(entry.createdAt).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
              {title}
            </h3>
            {slug && (
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                /{slug}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              onRemove(entry.id);
              toast.success("Draft removed from history");
            }}
            className="text-muted-foreground hover:text-red-400 transition-colors p-1 shrink-0"
            aria-label="Remove draft"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {excerpt && (
          <p className="text-[12px] text-foreground/70 mt-2 italic line-clamp-2">
            {excerpt}
          </p>
        )}
      </div>

      {/* Meta grid */}
      <div className="px-4 py-3 space-y-2 border-b border-border/20">
        <div className="grid grid-cols-2 gap-2">
          {out.seoTitle && (
            <div className="bg-secondary/30 rounded-lg px-2.5 py-2">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">SEO Title</p>
              <p className="text-[11px] text-foreground mt-0.5 line-clamp-1">{out.seoTitle}</p>
            </div>
          )}
          {out.seoDescription && (
            <div className="bg-secondary/30 rounded-lg px-2.5 py-2">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">SEO Meta</p>
              <p className="text-[11px] text-foreground mt-0.5 line-clamp-1">{out.seoDescription}</p>
            </div>
          )}
        </div>

        {tags.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Tags</p>
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 8).map((t, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full"
                >
                  {t}
                </span>
              ))}
              {tags.length > 8 && (
                <span className="text-[10px] text-muted-foreground">+{tags.length - 8}</span>
              )}
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Categories</p>
            <div className="flex flex-wrap gap-1">
              {categories.map((c, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            {out.hasFeaturedImage || out.featuredImage ? (
              <CheckCircle2 className="w-3 h-3 text-green-500" />
            ) : (
              <XCircle className="w-3 h-3 text-amber-500" />
            )}
            Featured Image
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            Local-only — no live publish
          </span>
        </div>

        {sourceNotes && (
          <p className="text-[11px] text-muted-foreground italic border-l-2 border-border/60 pl-2">
            Source: {sourceNotes}
          </p>
        )}
      </div>

      {/* Body preview */}
      {bodyContent && (
        <div className="px-4 py-3 border-b border-border/20">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            Body HTML Preview {expanded ? "▲" : "▼"}
          </button>
          {expanded && (
            <div
              className="text-[11px] text-foreground/70 bg-secondary/20 rounded-lg p-2 max-h-40 overflow-y-auto font-mono leading-relaxed"
              dangerouslySetInnerHTML={{ __html: bodyContent.slice(0, 2000) }}
            />
          )}
        </div>
      )}

      {/* Copy action row 1 */}
      <div className="px-3 py-2.5 flex flex-wrap gap-1 border-b border-border/20">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px] gap-1"
          onClick={() => copyField(title, "Title")}
        >
          <Copy className="w-3 h-3" /> Title
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px] gap-1"
          onClick={() => copyField(slug, "Slug")}
        >
          <Copy className="w-3 h-3" /> Slug
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px] gap-1"
          onClick={() => copyField(excerpt, "Excerpt")}
        >
          <Copy className="w-3 h-3" /> Excerpt
        </Button>
        {bodyContent && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[10px] gap-1"
            onClick={() => copyField(bodyContent, "Body HTML")}
          >
            <Code2 className="w-3 h-3" /> Body HTML
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px] gap-1"
          onClick={() => copyField(tags.join(", "), "Tags")}
        >
          <Tag className="w-3 h-3" /> Tags
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px] gap-1"
          onClick={() => copyField(categories.join(", "), "Categories")}
        >
          <Tag className="w-3 h-3" /> Categories
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px] gap-1"
          onClick={() => copyField(buildSEOFields(out), "SEO Fields")}
        >
          <Search className="w-3 h-3" /> SEO Fields
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px] gap-1 font-semibold text-primary"
          onClick={() => copyField(allFields, "All WordPress Fields")}
        >
          <ClipboardCopy className="w-3 h-3" /> Copy All
        </Button>
      </div>

      {/* Export / secondary row */}
      <div className="px-3 py-2.5 flex flex-wrap gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px] gap-1"
          onClick={() => copyField(buildTagsCategories(out), "Tags & Categories")}
        >
          <Copy className="w-3 h-3" /> Copy Tags/Categories
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px] gap-1"
          onClick={() => exportJSON(entry)}
        >
          <Download className="w-3 h-3" /> Export JSON
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px] gap-1"
          onClick={() => exportHTML(entry)}
        >
          <Download className="w-3 h-3" /> Export HTML
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px] gap-1 text-pink-500 hover:text-pink-600"
          onClick={() => toast.info("Open Social Factory and use the draft title as the story input.")}
        >
          <Megaphone className="w-3 h-3" /> Send to Social Factory
        </Button>
      </div>
    </div>
  );
}

interface WordPressDraftHistoryViewProps {
  onNavigate?: (view: string) => void;
}

export function WordPressDraftHistoryView({ onNavigate }: WordPressDraftHistoryViewProps) {
  const { entries, remove } = useOutputHistory();
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");

  const drafts = entries.filter((e) => e.kind === "wordpress-draft");

  const brands = Array.from(
    new Set(
      drafts.map((d) => {
        const out = getWPOutput(d);
        return out.brand ?? out.site ?? d.siloName ?? "";
      }).filter(Boolean)
    )
  );

  const filtered = drafts.filter((d) => {
    const out = getWPOutput(d);
    const title = (out.title ?? out.headline ?? d.prompt ?? "").toLowerCase();
    const slug = (out.slug ?? out.wordpressSlug ?? "").toLowerCase();
    const brand = (out.brand ?? out.site ?? d.siloName ?? "").toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = !q || title.includes(q) || slug.includes(q) || brand.includes(q);
    const bf = brandFilter.toLowerCase();
    const matchesBrand = brandFilter === "all" || brand === bf;
    return matchesSearch && matchesBrand;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden hmg-paper-page">
      {/* Banner */}
      <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-center gap-3">
        <HardDrive className="w-4 h-4 text-amber-500 shrink-0" />
        <div className="text-[11px] text-amber-700 dark:text-amber-400">
          <span className="font-bold">Local-only storage.</span>{" "}
          WordPress drafts are saved on this device only. No live WordPress publish from this app.
          Copy fields manually into your WordPress editor.
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drafts by title, slug, brand..."
            className="pl-8 h-9 text-[12px]"
          />
        </div>
        {brands.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {["all", ...brands].map((b) => (
              <button
                key={b}
                onClick={() => setBrandFilter(b)}
                className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border transition-colors ${
                  brandFilter === b
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-400"
                    : "bg-transparent border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {b === "all" ? "All Brands" : b}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats row */}
      {drafts.length > 0 && (
        <div className="flex items-center gap-3 mb-4 text-[11px] text-muted-foreground">
          <span>
            <strong className="text-foreground">{drafts.length}</strong> draft{drafts.length !== 1 ? "s" : ""} saved
          </span>
          <span>·</span>
          <span>
            <strong className="text-foreground">{filtered.length}</strong> shown
          </span>
          {drafts.length > 0 && (
            <>
              <span>·</span>
              <span>
                Newest: {new Date(drafts[0].createdAt).toLocaleDateString()}
              </span>
            </>
          )}
        </div>
      )}

      {/* Draft list */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">
              {drafts.length === 0
                ? "No WordPress drafts saved yet"
                : "No drafts match your search"}
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-1 max-w-xs">
              {drafts.length === 0
                ? "Create an article in the Editorial Desk and use the WordPress Post Builder to save your first draft."
                : "Try a different search term or clear the brand filter."}
            </p>
            {drafts.length === 0 && onNavigate && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4 text-[11px]"
                onClick={() => onNavigate("newsroom")}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Open Editorial Desk
              </Button>
            )}
          </div>
        ) : (
          filtered.map((entry) => (
            <WPDraftCard
              key={entry.id}
              entry={entry}
              onRemove={remove}
              onSendToSocialFactory={() => onNavigate?.("socialfactory")}
            />
          ))
        )}
      </div>
    </div>
  );
}
