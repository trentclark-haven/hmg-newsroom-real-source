/**
 * OutputHistoryView — full-page Output History surface.
 *
 * Replaces the old OutputHistory.tsx sheet panel with a dedicated full view
 * that lists every saved output, supports brand + content-type filtering,
 * search, per-entry actions (reopen, copy, continue in another desk), and
 * a JSON export of the entire history.
 */

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/hmg/CopyButton";
import {
  useOutputHistory,
  type OutputHistoryEntry,
} from "@/lib/useOutputHistory";
import { verticals } from "@/lib/mock-data";
import {
  ArrowRight,
  Brush,
  Captions,
  Download,
  FileText,
  Film,
  History,
  ImageIcon,
  Megaphone,
  Newspaper,
  RotateCcw,
  Scissors,
  Search,
  Send,
  Sparkles,
  Wand2,
  X as XIcon,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type KindFilter = "all" | OutputHistoryEntry["kind"];

interface ContentPill {
  id: KindFilter;
  label: string;
}

const CONTENT_PILLS: ContentPill[] = [
  { id: "all", label: "All" },
  { id: "specialist", label: "Article" },
  { id: "pack", label: "Breaking" },
  { id: "quick", label: "Social" },
  { id: "wordpress-draft", label: "WordPress Draft" },
  { id: "cut-note", label: "Cut Note" },
  { id: "edit-brief", label: "Edit Brief" },
  { id: "caption-plan", label: "Caption Plan" },
  { id: "thumbnail-brief", label: "Thumbnail Brief" },
  { id: "social-video-draft", label: "Social Video Draft" },
];

const KIND_LABEL: Record<OutputHistoryEntry["kind"], string> = {
  quick: "Social",
  pack: "Breaking",
  specialist: "Article",
  "wordpress-draft": "WordPress Draft",
  "cut-note": "Cut Note",
  "social-video-draft": "Social Video Draft",
  "caption-plan": "Caption Plan",
  "thumbnail-brief": "Thumbnail Brief",
  "edit-brief": "Edit Brief",
};

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

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Serialize an OutputHistoryEntry's output object into a readable,
 * labeled text format. Falls back to pretty-printed JSON for unknown
 * shapes so nothing is ever lost.
 */
function entryToText(entry: OutputHistoryEntry): string {
  const out = (entry.output ?? {}) as Record<string, unknown>;

  const title =
    (out.title as string) ??
    (out.headline as string) ??
    entry.prompt ??
    "Untitled output";

  if (entry.kind === "specialist" || entry.kind === "quick") {
    return typeof out.content === "string"
      ? out.content
      : JSON.stringify(out, null, 2);
  }

  if (entry.kind === "wordpress-draft") {
    const tags = Array.isArray(out.tags)
      ? (out.tags as string[]).join(", ")
      : "";
    return [
      `WordPress Draft — ${title}`,
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
      `# ${out.headline ?? title}`,
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
    const segments = Array.isArray(out.segments)
      ? (out.segments as Array<Record<string, unknown>>)
      : [];
    return [
      `Cut Notes — ${title}`,
      `Goal: ${out.goal ?? ""}`,
      `Platform: ${out.platform ?? ""}`,
      `Hook: ${out.hookText ?? ""}`,
      `Caption Style: ${out.captionStyle ?? ""}`,
      `Transcript: ${out.transcriptSummary ?? ""}`,
      ``,
      `SEGMENTS:`,
      ...segments.map(
        (s) =>
          `  ${String(s.label ?? "")} [${String(s.role ?? "")}]: ${String(s.start ?? "")}s–${String(s.end ?? "")}s — ${String(s.note ?? "")}`,
      ),
    ].join("\n");
  }

  if (entry.kind === "edit-brief") {
    return [
      `Edit Brief — ${title}`,
      ``,
      String(out.editBrief ?? JSON.stringify(out, null, 2)),
    ].join("\n");
  }

  if (entry.kind === "caption-plan") {
    return [
      `Caption Plan — ${title}`,
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
      `Thumbnail Brief — ${title}`,
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
      `Social Video Draft — ${title}`,
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

/** Derive a human-readable title for an entry from its output/prompt. */
function entryTitle(entry: OutputHistoryEntry): string {
  const out = (entry.output ?? {}) as Record<string, unknown>;
  return (
    (out.title as string) ??
    (out.headline as string) ??
    entry.prompt ??
    "Untitled output"
  );
}

/** Saved-state label — describes where/how the entry was saved. */
function savedStateLabel(entry: OutputHistoryEntry): string {
  switch (entry.kind) {
    case "wordpress-draft":
      return "Saved as WP Draft";
    case "cut-note":
      return "Saved as Cut Note";
    case "edit-brief":
      return "Saved as Edit Brief";
    case "caption-plan":
      return "Saved as Caption Plan";
    case "thumbnail-brief":
      return "Saved as Thumbnail Brief";
    case "social-video-draft":
      return "Saved as Social Video Draft";
    case "pack":
      return "Saved as Breaking Pack";
    case "quick":
      return "Saved as Quick Output";
    case "specialist":
    default:
      return "Saved as Article";
  }
}

/** Download the full history as a JSON file. */
function exportAllJSON(entries: OutputHistoryEntry[]): void {
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
    toast.success(`${entries.length} entries exported as JSON`);
  } catch {
    toast.error("Export failed");
  }
}

/* ------------------------------------------------------------------ */
/* Entry row                                                           */
/* ------------------------------------------------------------------ */

interface EntryRowProps {
  entry: OutputHistoryEntry;
  onSelectView?: (view: string) => void;
}

function EntryRow({ entry, onSelectView }: EntryRowProps) {
  const out = (entry.output ?? {}) as Record<string, unknown>;
  const meta = verticals.find((v) => v.id === entry.silo);
  const Icon = KIND_ICON[entry.kind] ?? Sparkles;
  const accent = meta?.color ?? "currentColor";

  const text = useMemo(() => entryToText(entry), [entry]);
  const title = entryTitle(entry);
  const stateLabel = savedStateLabel(entry);
  const timestamp = new Date(entry.createdAt).toLocaleString();

  const reopenDraft = () => {
    navigator.clipboard
      .writeText(text)
      .then(() =>
        toast.success("Draft reopened", {
          description: "Content copied to clipboard — paste into any desk.",
        }),
      )
      .catch(() => toast.error("Could not copy to clipboard"));
  };

  return (
    <div className="rounded-lg border border-border/60 bg-secondary/20 p-4 space-y-3">
      {/* Header: brand + type + timestamp */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 shrink-0" style={{ color: accent }} />
          <span
            className="text-xs font-bold uppercase tracking-wider truncate"
            style={{ color: accent }}
          >
            {entry.siloName}
          </span>
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-wider px-2 py-0"
          >
            {KIND_LABEL[entry.kind] ?? entry.kind}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">
          {timestamp}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-foreground line-clamp-2">
        {title}
      </p>

      {/* Saved-state label + prompt */}
      <div className="space-y-1">
        <p className="text-[11px] text-muted-foreground/80">{stateLabel}</p>
        {entry.prompt && entry.prompt !== title && (
          <p className="text-xs text-foreground/60 line-clamp-2 italic">
            {entry.prompt}
          </p>
        )}
      </div>

      {/* Content preview */}
      <p className="text-xs text-foreground/70 line-clamp-3 whitespace-pre-wrap">
        {text.slice(0, 280)}
        {text.length > 280 ? "…" : ""}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={reopenDraft}
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Reopen draft
        </Button>

        <CopyButton
          textToCopy={text}
          label="Copy content"
          successMessage="Entry content copied"
          className="h-8 px-2 text-xs"
        />

        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={() => onSelectView?.("newsroom")}
        >
          <Newspaper className="w-3.5 h-3.5 mr-1" />
          Editorial
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={() => onSelectView?.("artbot")}
        >
          <Brush className="w-3.5 h-3.5 mr-1" />
          WebArt
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={() => onSelectView?.("cutmaster")}
        >
          <Film className="w-3.5 h-3.5 mr-1" />
          WebEdit
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={() => onSelectView?.("socialfactory")}
        >
          <Megaphone className="w-3.5 h-3.5 mr-1" />
          Social Factory
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs"
          onClick={() => onSelectView?.("wp-draft-history")}
        >
          <FileText className="w-3.5 h-3.5 mr-1" />
          WordPress
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main view                                                           */
/* ------------------------------------------------------------------ */

export function OutputHistoryView({
  onSelectView,
}: {
  onSelectView?: (view: string) => void;
}) {
  const { entries } = useOutputHistory();
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [search, setSearch] = useState("");

  const searchLower = search.toLowerCase().trim();

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (brandFilter !== "all" && entry.silo !== brandFilter) return false;
      if (kindFilter !== "all" && entry.kind !== kindFilter) return false;
      if (!searchLower) return true;

      const out = (entry.output ?? {}) as Record<string, unknown>;
      const haystack = [
        entry.prompt,
        entry.siloName,
        entry.kind,
        String(out.title ?? ""),
        String(out.headline ?? ""),
        typeof out.content === "string" ? out.content : "",
        String(out.excerpt ?? ""),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchLower);
    });
  }, [entries, brandFilter, kindFilter, searchLower]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <h1 className="text-lg font-bold">Output History</h1>
            <span className="text-xs text-muted-foreground">
              {entries.length} saved locally
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => exportAllJSON(entries)}
            disabled={entries.length === 0}
          >
            <Download className="w-3.5 h-3.5" />
            Export all as JSON
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 space-y-3 border-b border-border/40 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search outputs by title, prompt, brand, or content…"
            className="w-full h-9 pl-8 pr-8 text-sm bg-muted/30 border border-border/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Brand filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
            Brand
          </span>
          <FilterPill
            active={brandFilter === "all"}
            onClick={() => setBrandFilter("all")}
          >
            All
          </FilterPill>
          {verticals.map((v) => (
            <FilterPill
              key={v.id}
              active={brandFilter === v.id}
              onClick={() => setBrandFilter(v.id)}
              color={v.color}
            >
              {v.name}
            </FilterPill>
          ))}
        </div>

        {/* Content type pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
            Type
          </span>
          {CONTENT_PILLS.map((pill) => (
            <FilterPill
              key={pill.id}
              active={kindFilter === pill.id}
              onClick={() => setKindFilter(pill.id)}
            >
              {pill.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {entries.length === 0 ? (
          <EmptyState
            icon={History}
            title="No saved outputs yet"
            subtitle="Create content in any desk to start filling your history. Everything is saved locally on this device."
            actions={[
              { label: "Editorial", icon: Newspaper, view: "newsroom" },
              { label: "WebArt", icon: Brush, view: "artbot" },
              { label: "WebEdit", icon: Film, view: "cutmaster" },
              { label: "Social Factory", icon: Megaphone, view: "socialfactory" },
            ]}
            onSelectView={onSelectView}
          />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No outputs match your filters
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setBrandFilter("all");
                setKindFilter("all");
              }}
              className="mt-2 text-xs text-sky-400 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {entries.length}
            </p>
            {filtered.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                onSelectView={onSelectView}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                        */
/* ------------------------------------------------------------------ */

function FilterPill({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[11px] font-semibold rounded-full px-2.5 py-1 border transition-colors ${
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-transparent text-muted-foreground border-border/50 hover:text-foreground hover:border-foreground/40"
      }`}
      style={
        active && color
          ? { backgroundColor: color, borderColor: color, color: "#fff" }
          : undefined
      }
    >
      {children}
    </button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actions,
  onSelectView,
}: {
  icon: typeof History;
  title: string;
  subtitle: string;
  actions?: { label: string; icon: typeof Newspaper; view: string }[];
  onSelectView?: (view: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/60 mt-1 max-w-sm">
        {subtitle}
      </p>
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mt-6">
          {actions.map((a) => (
            <Button
              key={a.label}
              size="sm"
              variant="outline"
              className="text-xs h-8 gap-1.5"
              onClick={() => onSelectView?.(a.view)}
            >
              <a.icon className="w-3.5 h-3.5" />
              {a.label}
              <ArrowRight className="w-3 h-3 opacity-50" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
