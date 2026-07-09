/**
 * Output History — Task 7 upgrade
 *
 * Tabs: Saved Outputs | WordPress Drafts | Media Library | Receipts / Logs
 * Quick-action empty states guide the user to the right desk.
 * No "package" language.
 */

import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useOutputHistory,
  type OutputHistoryEntry,
} from "@/lib/useOutputHistory";
import { verticals } from "@/lib/mock-data";
import {
  BookMarked,
  Brush,
  Captions,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Film,
  History,
  ImageIcon,
  Megaphone,
  Newspaper,
  Scissors,
  ScrollText,
  Search,
  Send,
  Sparkles,
  Trash2,
  Wand2,
  X as XIcon,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useMediaLibrary } from "@/lib/useMediaLibrary";
import { useAuditLog } from "@/lib/auditLog";

type Tab = "outputs" | "wordpress" | "media" | "receipts";

interface OutputHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (view: string) => void;
}

function entryToText(entry: OutputHistoryEntry): string {
  const out = entry.output as Record<string, unknown>;
  if (entry.kind === "specialist") {
    return typeof out.content === "string" ? out.content : JSON.stringify(out, null, 2);
  }
  if (entry.kind === "quick") {
    return typeof out.content === "string" ? out.content : JSON.stringify(out, null, 2);
  }
  if (entry.kind === "wordpress-draft") {
    const tags = Array.isArray(out.tags) ? (out.tags as string[]).join(", ") : "";
    return [
      `WordPress Draft — ${out.title ?? entry.prompt}`,
      ``,
      `Slug: ${out.slug ?? ""}`,
      `Excerpt: ${out.excerpt ?? ""}`,
      `SEO Title: ${out.seoTitle ?? ""}`,
      `SEO Meta: ${out.seoDescription ?? ""}`,
      `Tags: ${tags}`,
      `Status: ${out.status ?? "draft"} — local only, no live publish`,
      `Exported: ${out.exportedAt ?? new Date(entry.createdAt).toISOString()}`,
    ].join("\n");
  }
  if (entry.kind === "pack") {
    const social = (out.social as Record<string, unknown>) ?? {};
    return [
      `# ${out.headline ?? ""}`,
      ``,
      `_${out.summary ?? ""}_`,
      ``,
      `## Article`,
      ``,
      String(out.article ?? ""),
      ``,
      `## X`,
      ``,
      String(social.x ?? ""),
      ``,
      `## Instagram`,
      ``,
      String(social.instagram ?? ""),
      ``,
      `## TikTok`,
      ``,
      String(social.tiktok ?? ""),
      ``,
      `## Newsletter`,
      ``,
      String(social.newsletter ?? ""),
      ``,
      `## YouTube`,
      ``,
      String(social.youtube ?? ""),
    ].join("\n");
  }
  if (entry.kind === "cut-note") {
    const segments = Array.isArray(out.segments) ? out.segments as Array<Record<string, unknown>> : [];
    return [
      `Cut Notes — ${out.title ?? entry.prompt}`,
      `Goal: ${out.goal ?? ""}`,
      `Platform: ${out.platform ?? ""}`,
      `Hook: ${out.hookText ?? ""}`,
      `Caption Style: ${out.captionStyle ?? ""}`,
      `Transcript: ${out.transcriptSummary ?? ""}`,
      ``,
      `SEGMENTS:`,
      ...segments.map((s) => `  ${String(s.label ?? "")} [${String(s.role ?? "")}]: ${String(s.start ?? "")}s–${String(s.end ?? "")}s — ${String(s.note ?? "")}`),
    ].join("\n");
  }
  if (entry.kind === "edit-brief") {
    return [
      `Edit Brief — ${out.title ?? entry.prompt}`,
      ``,
      String(out.editBrief ?? JSON.stringify(out, null, 2)),
    ].join("\n");
  }
  if (entry.kind === "caption-plan") {
    return [
      `Caption Plan — ${out.title ?? entry.prompt}`,
      `Style: ${out.captionStyle ?? ""}`,
      `Angle: ${out.captionPackAngle ?? ""}`,
      `Lower Third: ${out.lowerThirdName ?? ""} / ${out.lowerThirdContext ?? ""}`,
      `Platform Notes: ${out.captionPlatformNotes ?? ""}`,
      `Pinned Comment: ${out.pinnedComment ?? ""}`,
      `Accessibility: ${out.accessibilityNote ?? ""}`,
    ].join("\n");
  }
  if (entry.kind === "thumbnail-brief") {
    return [
      `Thumbnail Brief — ${out.title ?? entry.prompt}`,
      `Headline: ${out.thumbnailText ?? ""}`,
      `Subheadline: ${out.thumbnailSubheadline ?? ""}`,
      `Frame Note: ${out.thumbnailFrameNote ?? ""}`,
      `Logo Placement: ${out.thumbnailLogoPlacement ?? ""}`,
      `Cover Frame: ${out.coverImageReady ? "Captured/Uploaded" : "Not yet captured"}`,
      `Haven AI Note: ${out.havenAINote ?? ""}`,
    ].join("\n");
  }
  if (entry.kind === "social-video-draft") {
    return [
      `Social Video Draft — ${out.title ?? entry.prompt}`,
      `Platform: ${out.platform ?? ""}`,
      `Hook: ${out.hookText ?? ""}`,
      `Caption Style: ${out.captionStyle ?? ""}`,
      `Pinned Comment: ${out.pinnedComment ?? ""}`,
      `Platform Notes: ${out.captionPlatformNotes ?? ""}`,
      ``,
      String(out.clipPackageText ?? ""),
    ].join("\n");
  }
  return JSON.stringify(out, null, 2);
}

function downloadEntry(entry: OutputHistoryEntry) {
  const text = [
    `# ${entry.siloName}`,
    ``,
    `_${entry.kind} · ${new Date(entry.createdAt).toLocaleString()}_`,
    `**Prompt:** ${entry.prompt}`,
    ``,
    `---`,
    ``,
    entryToText(entry),
  ].join("\n");
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date(entry.createdAt).toISOString().slice(0, 16).replace(/[:T]/g, "-");
  link.href = url;
  link.download = `${entry.silo}-${entry.kind}-${stamp}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const KIND_ICON: Record<OutputHistoryEntry["kind"], typeof Sparkles> = {
  quick: Sparkles,
  pack: Zap,
  specialist: Wand2,
  "wordpress-draft": FileText,
  "cut-note": Scissors,
  "social-video-draft": Send,
  "caption-plan": Captions,
  "thumbnail-brief": ImageIcon,
  "edit-brief": Film,
};

const KIND_LABEL: Record<OutputHistoryEntry["kind"], string> = {
  quick: "Quick",
  pack: "Breaking",
  specialist: "Specialist",
  "wordpress-draft": "WP Draft",
  "cut-note": "Cut Notes",
  "social-video-draft": "Social Video",
  "caption-plan": "Captions",
  "thumbnail-brief": "Thumbnail",
  "edit-brief": "Edit Brief",
};

function EntryCard({
  entry,
  onRemove,
}: {
  entry: OutputHistoryEntry;
  onRemove: (id: string) => void;
}) {
  const meta = verticals.find((v) => v.id === entry.silo);
  const Icon = KIND_ICON[entry.kind] ?? Sparkles;
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: meta?.color ?? "currentColor" }}
          />
          <span
            className="text-[11px] font-bold uppercase tracking-wider truncate"
            style={{ color: meta?.color ?? "currentColor" }}
          >
            {entry.siloName}
          </span>
          <Badge
            variant="outline"
            className="text-[9px] uppercase tracking-wider px-1.5 py-0"
          >
            {KIND_LABEL[entry.kind] ?? entry.specialist ?? entry.platform ?? entry.kind}
          </Badge>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">
          {new Date(entry.createdAt).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
      <p className="text-xs text-foreground/80 line-clamp-2 italic">{entry.prompt}</p>
      <p className="text-xs text-foreground/60 line-clamp-3">
        {entryToText(entry).slice(0, 240)}
        {entryToText(entry).length > 240 ? "…" : ""}
      </p>
      <div className="flex items-center flex-wrap gap-1.5 pt-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px]"
          onClick={() => {
            navigator.clipboard
              .writeText(entryToText(entry))
              .then(() => toast.success("Copied"))
              .catch(() => toast.error("Copy failed"));
          }}
        >
          <Copy className="w-3 h-3 mr-1" />
          Copy
        </Button>
        {(["edit-brief", "cut-note", "social-video-draft", "caption-plan", "thumbnail-brief"] as Array<OutputHistoryEntry["kind"]>).includes(entry.kind) && (
          <>
            {(entry.kind === "edit-brief" || entry.kind === "cut-note") && (() => {
              const o = entry.output as Record<string, unknown>;
              const txt = String(o.editBrief ?? o.clipPackageText ?? "").trim();
              return txt ? (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => navigator.clipboard.writeText(txt).then(() => toast.success("Edit brief copied")).catch(() => toast.error("Copy failed"))}>
                  <Copy className="w-3 h-3 mr-1" />Brief
                </Button>
              ) : null;
            })()}
            {(entry.kind === "caption-plan" || entry.kind === "social-video-draft") && (() => {
              const o = entry.output as Record<string, unknown>;
              const parts = [
                o.captionStyle ? `Style: ${String(o.captionStyle)}` : "",
                o.captionPackAngle ? `Angle: ${String(o.captionPackAngle)}` : "",
                o.lowerThirdName ? `Lower third: ${String(o.lowerThirdName)}${o.lowerThirdContext ? ` / ${String(o.lowerThirdContext)}` : ""}` : "",
                o.pinnedComment ? `Pinned comment: ${String(o.pinnedComment)}` : "",
                o.captionPlatformNotes ? `Platform notes: ${String(o.captionPlatformNotes)}` : "",
              ].filter(Boolean);
              return parts.length ? (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => navigator.clipboard.writeText(parts.join("\n")).then(() => toast.success("Caption plan copied")).catch(() => toast.error("Copy failed"))}>
                  <Copy className="w-3 h-3 mr-1" />Captions
                </Button>
              ) : null;
            })()}
            {entry.kind === "thumbnail-brief" && (() => {
              const o = entry.output as Record<string, unknown>;
              const parts = [
                o.thumbnailText ? `Headline: ${String(o.thumbnailText)}` : "",
                o.thumbnailSubheadline ? `Subheadline: ${String(o.thumbnailSubheadline)}` : "",
                o.thumbnailFrameNote ? `Frame: ${String(o.thumbnailFrameNote)}` : "",
                o.thumbnailLogoPlacement ? `Logo: ${String(o.thumbnailLogoPlacement)}` : "",
              ].filter(Boolean);
              return parts.length ? (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => navigator.clipboard.writeText(parts.join("\n")).then(() => toast.success("Thumbnail brief copied")).catch(() => toast.error("Copy failed"))}>
                  <Copy className="w-3 h-3 mr-1" />Thumbnail
                </Button>
              ) : null;
            })()}
          </>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px]"
          onClick={() => downloadEntry(entry)}
        >
          <Download className="w-3 h-3 mr-1" />
          Download
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px] ml-auto text-muted-foreground hover:text-red-400"
          onClick={() => onRemove(entry.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function WPDraftMinCard({
  entry,
  onRemove,
}: {
  entry: OutputHistoryEntry;
  onRemove: (id: string) => void;
}) {
  const out = entry.output as Record<string, unknown>;
  const title = (out.title ?? out.headline ?? entry.prompt ?? "Untitled") as string;
  const slug = (out.slug ?? out.wordpressSlug ?? "") as string;
  const excerpt = (out.excerpt ?? out.wordpressExcerpt ?? "") as string;
  const seoTitle = (out.seoTitle ?? "") as string;
  const tags: string[] = Array.isArray(out.tags)
    ? (out.tags as string[])
    : Array.isArray(out.suggestedTags)
    ? (out.suggestedTags as string[])
    : [];

  function cp(value: string, label: string) {
    if (!value) {
      toast.error(`${label} is empty`);
      return;
    }
    navigator.clipboard
      .writeText(value)
      .then(() => toast.success(`${label} copied`))
      .catch(() => toast.error("Copy failed"));
  }

  return (
    <div className="rounded-lg border border-border/60 bg-secondary/20 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">
            WordPress Draft
          </span>
          <Badge variant="outline" className="text-[9px] uppercase tracking-wider px-1.5 py-0">
            {entry.siloName}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground shrink-0">
            {new Date(entry.createdAt).toLocaleDateString([], {
              month: "short",
              day: "numeric",
            })}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400"
            onClick={() => onRemove(entry.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <p className="text-xs font-semibold text-foreground line-clamp-1">{title}</p>
      {slug && <p className="text-[10px] font-mono text-muted-foreground">/{slug}</p>}
      {excerpt && (
        <p className="text-[11px] text-foreground/60 italic line-clamp-2">{excerpt}</p>
      )}
      <div className="flex flex-wrap gap-1 pt-1">
        <Button
          size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] gap-1"
          onClick={() => cp(title, "Title")}
        >
          <Copy className="w-2.5 h-2.5" /> Title
        </Button>
        <Button
          size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] gap-1"
          onClick={() => cp(slug, "Slug")}
        >
          <Copy className="w-2.5 h-2.5" /> Slug
        </Button>
        <Button
          size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] gap-1"
          onClick={() => cp(excerpt, "Excerpt")}
        >
          <Copy className="w-2.5 h-2.5" /> Excerpt
        </Button>
        {seoTitle && (
          <Button
            size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] gap-1"
            onClick={() => cp(seoTitle, "SEO Title")}
          >
            <Copy className="w-2.5 h-2.5" /> SEO
          </Button>
        )}
        {tags.length > 0 && (
          <Button
            size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] gap-1"
            onClick={() => cp(tags.join(", "), "Tags")}
          >
            <Copy className="w-2.5 h-2.5" /> Tags
          </Button>
        )}
        <Button
          size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] gap-1"
          onClick={() => downloadEntry(entry)}
        >
          <Download className="w-2.5 h-2.5" /> DL
        </Button>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  icon: typeof History;
  title: string;
  subtitle: string;
  actions?: { label: string; icon: typeof Newspaper; onClick: () => void }[];
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      <p className="text-[11px] text-muted-foreground/60 mt-1 max-w-xs">{subtitle}</p>
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center mt-4">
          {actions.map((a) => (
            <Button
              key={a.label}
              size="sm"
              variant="outline"
              className="text-[11px] h-8 gap-1.5"
              onClick={a.onClick}
            >
              <a.icon className="w-3 h-3" />
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

function exportAllHistoryJSON(
  entries: OutputHistoryEntry[],
  onSuccess: () => void,
) {
  try {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hmg-output-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onSuccess();
  } catch {
    /* ignore */
  }
}

export function OutputHistory({ open, onOpenChange, onNavigate }: OutputHistoryProps) {
  const { entries, remove, clear } = useOutputHistory();
  const { entries: mediaEntries } = useMediaLibrary();
  const { entries: auditEntries } = useAuditLog();
  const [tab, setTab] = useState<Tab>("outputs");
  const [search, setSearch] = useState("");

  const nav = (view: string) => {
    onOpenChange(false);
    onNavigate?.(view);
  };

  const nonWpEntries = entries.filter((e) => e.kind !== "wordpress-draft");
  const wpDrafts = entries.filter((e) => e.kind === "wordpress-draft");

  const searchLower = search.toLowerCase().trim();

  const filteredOutputs = useMemo(() => {
    if (!searchLower) return nonWpEntries;
    return nonWpEntries.filter(
      (e) =>
        e.prompt.toLowerCase().includes(searchLower) ||
        e.siloName.toLowerCase().includes(searchLower) ||
        e.kind.toLowerCase().includes(searchLower) ||
        (typeof (e.output as Record<string, unknown>)?.content === "string" &&
          String((e.output as Record<string, unknown>).content)
            .toLowerCase()
            .includes(searchLower)),
    );
  }, [nonWpEntries, searchLower]);

  const filteredWpDrafts = useMemo(() => {
    if (!searchLower) return wpDrafts;
    return wpDrafts.filter((e) => {
      const out = e.output as Record<string, unknown>;
      return (
        e.prompt.toLowerCase().includes(searchLower) ||
        String(out?.title ?? "").toLowerCase().includes(searchLower) ||
        String(out?.excerpt ?? "").toLowerCase().includes(searchLower) ||
        e.siloName.toLowerCase().includes(searchLower)
      );
    });
  }, [wpDrafts, searchLower]);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "outputs", label: "Saved Outputs", count: nonWpEntries.length },
    { id: "wordpress", label: "WP Drafts", count: wpDrafts.length },
    { id: "media", label: "Media", count: mediaEntries.length },
    { id: "receipts", label: "Receipts", count: auditEntries.length },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/40">
          <SheetTitle className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Output History
          </SheetTitle>
          <SheetDescription>
            {entries.length} of 50 saved locally on this device only.
          </SheetDescription>
        </SheetHeader>

        {/* Tab strip */}
        <div className="flex items-center gap-0 px-1 pt-2 border-b border-border/40 overflow-x-auto shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1 text-[9px] bg-foreground/10 text-foreground/60 rounded-full px-1 py-0.5">
                  {t.count}
                </span>
              )}
            </button>
          ))}
          {entries.length > 0 && (
            <button
              onClick={() => {
                clear();
                toast.success("History cleared.");
              }}
              className="ml-auto text-[10px] text-muted-foreground hover:text-red-400 inline-flex items-center gap-1 px-3 shrink-0"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* Search bar + export-all */}
        {entries.length > 0 && (tab === "outputs" || tab === "wordpress") && (
          <div className="px-5 pt-3 pb-1 flex items-center gap-2 border-b border-border/20">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search outputs…"
                className="w-full h-7 pl-7 pr-6 text-[11px] bg-muted/30 border border-border/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground/30"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                exportAllHistoryJSON(entries, () =>
                  toast.success(`${entries.length} entries exported as JSON`),
                )
              }
              className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground border border-border/40 rounded-lg px-2 py-1"
              title="Export all output history as JSON"
            >
              <Download className="w-3 h-3" />
              Export All
            </button>
          </div>
        )}

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {/* ── Saved Outputs ── */}
          {tab === "outputs" && (
            nonWpEntries.length === 0 ? (
              <EmptyState
                icon={History}
                title="No saved outputs yet"
                subtitle="Create content in any desk to start filling your history."
                actions={[
                  { label: "Create Article", icon: Newspaper, onClick: () => nav("newsroom") },
                  { label: "WebArt", icon: Brush, onClick: () => nav("artbot") },
                  { label: "WebEdit", icon: Film, onClick: () => nav("cutmaster") },
                  { label: "Social Factory", icon: Megaphone, onClick: () => nav("socialfactory") },
                  { label: "Founder KB", icon: BookMarked, onClick: () => nav("founderkb") },
                ]}
              />
            ) : filteredOutputs.length === 0 ? (
              <div className="py-8 text-center">
                <Search className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[12px] text-muted-foreground">No outputs match "{search}"</p>
                <button type="button" onClick={() => setSearch("")} className="mt-2 text-[11px] text-sky-400 hover:underline">
                  Clear search
                </button>
              </div>
            ) : (
              filteredOutputs.map((entry) => (
                <EntryCard key={entry.id} entry={entry} onRemove={remove} />
              ))
            )
          )}

          {/* ── WordPress Drafts ── */}
          {tab === "wordpress" && (
            <>
              {wpDrafts.length > 0 && (
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground">
                    {searchLower
                      ? `${filteredWpDrafts.length} of ${wpDrafts.length} drafts match`
                      : `${wpDrafts.length} draft${wpDrafts.length !== 1 ? "s" : ""} — local only, no live publish`}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px] text-primary"
                    onClick={() => nav("wp-draft-history")}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Full View
                  </Button>
                </div>
              )}
              {wpDrafts.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No WordPress drafts saved yet"
                  subtitle="Build an article in the Editorial Desk and use the WordPress Post Builder to save your first draft."
                  actions={[
                    { label: "Create Article", icon: Newspaper, onClick: () => nav("newsroom") },
                    { label: "WP Draft History", icon: FileText, onClick: () => nav("wp-draft-history") },
                  ]}
                />
              ) : filteredWpDrafts.length === 0 ? (
                <div className="py-8 text-center">
                  <Search className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-[12px] text-muted-foreground">No drafts match "{search}"</p>
                  <button type="button" onClick={() => setSearch("")} className="mt-2 text-[11px] text-sky-400 hover:underline">
                    Clear search
                  </button>
                </div>
              ) : (
                filteredWpDrafts.map((entry) => (
                  <WPDraftMinCard key={entry.id} entry={entry} onRemove={remove} />
                ))
              )}
            </>
          )}

          {/* ── Media Library ── */}
          {tab === "media" && (
            mediaEntries.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="No media saved yet"
                subtitle="Upload or generate images in WebArt or WebEdit to populate the media library."
                actions={[
                  { label: "Open WebArt", icon: Brush, onClick: () => nav("artbot") },
                  { label: "Open WebEdit", icon: Film, onClick: () => nav("cutmaster") },
                ]}
              />
            ) : (
              <div className="space-y-2">
                {mediaEntries.slice(0, 30).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold truncate">{item.name}</span>
                      <span className="text-[9px] text-muted-foreground shrink-0 uppercase tracking-wider">
                        {item.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                      <span>{item.silo}</span>
                      {item.intendedUse && <span>· {item.intendedUse}</span>}
                      <span className="ml-auto">
                        {new Date(item.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Receipts / Logs ── */}
          {tab === "receipts" && (
            auditEntries.length === 0 ? (
              <EmptyState
                icon={ScrollText}
                title="No receipts yet"
                subtitle="Every local action creates a receipt. Use any desk to start logging activity."
                actions={[
                  { label: "Open Receipt Log", icon: ScrollText, onClick: () => nav("auditlog") },
                ]}
              />
            ) : (
              <div className="space-y-2">
                {auditEntries.slice(0, 30).map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-border/40 bg-secondary/10 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {log.action}
                      </span>
                      <span className="text-[9px] text-muted-foreground shrink-0">
                        {new Date(log.ts).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {log.summary && (
                      <p className="text-[11px] text-foreground/70 mt-0.5 line-clamp-2">
                        {log.summary}
                      </p>
                    )}
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-[11px] mt-1"
                  onClick={() => nav("auditlog")}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Open Full Receipt Log
                </Button>
              </div>
            )
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
