import { useMemo } from "react";
import {
  ArrowRight,
  Brush,
  FileText,
  ImageUp,
  Megaphone,
  Newspaper,
  ReceiptText,
  Scissors,
  Sparkles,
} from "lucide-react";
import { useOutputHistory, type OutputHistoryEntry } from "@/lib/useOutputHistory";
import { useMediaLibrary, type MediaEntry } from "@/lib/useMediaLibrary";

interface MissionControlCockpitProps {
  /** Jump to a top-level newsroom view (passed through from Home). */
  onOpenAction?: (view: string) => void;
}

interface ActionTile {
  view: string;
  label: string;
  blurb: string;
  icon: typeof Newspaper;
  accent: string;
}

const ACTION_TILES: ActionTile[] = [
  {
    view: "newsroom",
    label: "Create New Article",
    blurb: "Open Editorial Desk on a blank brief.",
    icon: Newspaper,
    accent: "#D9D9D9",
  },
  {
    view: "medialibrary",
    label: "Upload Media",
    blurb: "Save a file note in the Media Library.",
    icon: ImageUp,
    accent: "#38BDF8",
  },
  {
    view: "newsroom",
    label: "Review Agent Drafts",
    blurb: "Open Editorial Desk and review draft work.",
    icon: FileText,
    accent: "#60A5FA",
  },
  {
    view: "artbot",
    label: "Open WebArt",
    blurb: "Upload assets and create the graphic.",
    icon: Brush,
    accent: "#A855F7",
  },
  {
    view: "cutmaster",
    label: "Open WebEdit",
    blurb: "Plan clips, captions, and thumbnail text.",
    icon: Scissors,
    accent: "#EF4444",
  },
  {
    view: "socialfactory",
    label: "Open Social Factory",
    blurb: "Turn finished assets into platform posts.",
    icon: Megaphone,
    accent: "#F472B6",
  },
];

function draftLabel(entry: OutputHistoryEntry | undefined) {
  if (!entry) return "Nothing in progress.";
  const prompt = entry.prompt.replace(/\s+/g, " ").trim();
  return prompt || `${entry.siloName ?? entry.silo} article draft`;
}

function receiptLabel(item: OutputHistoryEntry | MediaEntry | undefined) {
  if (!item) return "No saved outputs yet.";
  if ("kind" in item) {
    const type =
      item.kind === "quick"
        ? "Article Draft"
        : item.kind === "pack"
          ? "WordPress Draft"
          : "Social Output";
    return `${item.siloName ?? item.silo} · ${type}`;
  }
  return `${item.silo} · ${item.type} · ${item.intendedUse}`;
}

function dateLabel(ts: number | undefined) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString();
}

export function MissionControlCockpit({ onOpenAction }: MissionControlCockpitProps) {
  const { entries: history } = useOutputHistory();
  const { entries: media } = useMediaLibrary();

  const latestDraft = useMemo(
    () => history.find((h) => h.kind === "quick" || h.kind === "pack"),
    [history],
  );

  const latestReceipt = useMemo(() => {
    const merged: Array<OutputHistoryEntry | MediaEntry> = [
      ...history.slice(0, 8),
      ...media.slice(0, 8),
    ];
    return merged.sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [history, media]);

  return (
    <section
      className="rounded-2xl border border-border/60 bg-card/45 p-3"
      data-testid="mission-control-cockpit"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">
            <Sparkles className="h-3.5 w-3.5" />
            What's next
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            Create, edit, preview, copy, and export from the right desk.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenAction?.("medialibrary")}
          className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:border-foreground/40 hover:text-foreground sm:inline-flex"
        >
          Open Output History
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-2 lg:grid-cols-3"
        data-testid="cockpit-quick-actions"
      >
        {ACTION_TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.label}
              type="button"
              onClick={() => onOpenAction?.(tile.view)}
              data-testid={`cockpit-action-${tile.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="group min-h-[104px] rounded-2xl border border-border/60 bg-secondary/20 p-3 text-left transition-colors hover:border-foreground/35 hover:bg-secondary/35"
            >
              <span
                className="mb-3 grid h-8 w-8 place-items-center rounded-xl"
                style={{ background: `${tile.accent}22`, color: tile.accent }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="block text-[11px] font-black uppercase leading-tight tracking-[0.08em] text-foreground">
                {tile.label}
              </span>
              <span className="mt-1 block text-[10px] leading-snug text-muted-foreground">
                {tile.blurb}
              </span>
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
                Open
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => onOpenAction?.("newsroom")}
          className="rounded-2xl border border-border/60 bg-background/35 p-3 text-left transition-colors hover:border-foreground/35"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Edit Latest Draft
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-black leading-tight text-foreground">
            {draftLabel(latestDraft)}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {latestDraft
              ? `${latestDraft.siloName ?? latestDraft.silo} · ${dateLabel(latestDraft.createdAt)}`
              : "Create New Story to fill this."}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onOpenAction?.("medialibrary")}
          className="rounded-2xl border border-border/60 bg-background/35 p-3 text-left transition-colors hover:border-foreground/35"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Recent Output / Receipt
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-black leading-tight text-foreground">
            {receiptLabel(latestReceipt)}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            {latestReceipt ? dateLabel(latestReceipt.createdAt) : "Save an output and it lands here."}
            <ArrowRight className="h-3 w-3" />
          </p>
        </button>
      </div>
    </section>
  );
}
