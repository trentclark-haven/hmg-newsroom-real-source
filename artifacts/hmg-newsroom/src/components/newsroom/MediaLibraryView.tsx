import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMediaLibrary, type MediaEntry } from "@/lib/useMediaLibrary";
import { useOutputHistory, type OutputHistoryEntry } from "@/lib/useOutputHistory";
import { verticals } from "@/lib/mock-data";
import {
  Copy,
  FileText,
  History,
  Image as ImageIcon,
  Plus,
  ReceiptText,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { recordSafeModeBlock, useSafeMode } from "@/lib/safeMode";

const TYPE_OPTIONS = ["image", "video", "audio", "doc", "other"];
const USE_OPTIONS = [
  "Featured image",
  "Inline image",
  "Social card",
  "Thumbnail",
  "B-roll",
  "Reference",
];

type VaultTab = "outputs" | "media" | "wordpress" | "receipts";

const TABS: Array<{ id: VaultTab; label: string }> = [
  { id: "outputs", label: "Saved Outputs" },
  { id: "media", label: "Media Library" },
  { id: "wordpress", label: "WordPress Drafts" },
  { id: "receipts", label: "Receipts / Logs" },
];

function copyText(label: string, text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`Copied ${label}.`))
    .catch(() => toast.error("Copy failed."));
}

function kindLabel(kind: OutputHistoryEntry["kind"]): string {
  if (kind === "quick") return "Article Draft";
  if (kind === "pack") return "Breaking Draft";
  if (kind === "wordpress-draft") return "WordPress Draft";
  return "Saved Output";
}

function formatReceipt(entry: OutputHistoryEntry) {
  const type = kindLabel(entry.kind);
  return [
    `Receipt: ${entry.id}`,
    `Brand: ${entry.siloName ?? entry.silo}`,
    `Type: ${type}`,
    `Created: ${new Date(entry.createdAt).toLocaleString()}`,
    `Prompt: ${entry.prompt}`,
    "",
    typeof entry.output === "string"
      ? entry.output
      : JSON.stringify(entry.output, null, 2),
  ].join("\n");
}

function ReceiptCard({ entry }: { entry: OutputHistoryEntry }) {
  const type = kindLabel(entry.kind);
  return (
    <article className="rounded-2xl border border-border/60 bg-secondary/25 p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Receipt · {entry.id.slice(0, 8)}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-black leading-tight text-foreground">
            {entry.prompt || type}
          </h3>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {entry.siloName ?? entry.silo} · {type} ·{" "}
            {new Date(entry.createdAt).toLocaleDateString()}
          </p>
        </div>
        <ReceiptText className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => copyText("receipt", formatReceipt(entry))}
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
        >
          <Copy className="h-3 w-3" />
          Copy
        </button>
        <button
          type="button"
          onClick={() => copyText("output", formatReceipt(entry))}
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
        >
          <FileText className="h-3 w-3" />
          Export Output
        </button>
      </div>
    </article>
  );
}

function MediaCard({
  entry,
  onRemove,
}: {
  entry: MediaEntry;
  onRemove: (entry: MediaEntry) => void;
}) {
  return (
    <article
      data-testid={`medialibrary-entry-${entry.id}`}
      className="rounded-2xl border border-border/60 bg-secondary/25 px-3 py-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-black text-foreground/95">
            {entry.name}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-2 text-[10px] text-muted-foreground">
            <span>{entry.type}</span>
            <span>·</span>
            <span>{entry.silo}</span>
            <span>·</span>
            <span>{entry.intendedUse}</span>
            <span>·</span>
            <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(entry)}
          aria-label={`Remove ${entry.name}`}
          className="rounded p-1 text-muted-foreground hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

export function MediaLibraryView() {
  const { entries: mediaEntries, add, remove, clear } = useMediaLibrary();
  const { entries: outputEntries } = useOutputHistory();
  const { enabled: safeMode } = useSafeMode();
  const [tab, setTab] = useState<VaultTab>("outputs");
  const [name, setName] = useState("");
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [silo, setSilo] = useState(verticals[0].id);
  const [intendedUse, setIntendedUse] = useState(USE_OPTIONS[0]);
  const [filter, setFilter] = useState("");

  const filteredMedia = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return mediaEntries;
    return mediaEntries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.silo.toLowerCase().includes(q) ||
        e.intendedUse.toLowerCase().includes(q),
    );
  }, [mediaEntries, filter]);

  const wordpressDrafts = useMemo(
    () => outputEntries.filter((entry) => entry.kind === "wordpress-draft" || entry.kind === "pack"),
    [outputEntries],
  );

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Give the media a short name first.");
      return;
    }
    if (safeMode) {
      recordSafeModeBlock("media-upload", "MediaLibraryView/add");
      toast.error("Safe Mode is on — media uploads disabled.");
      return;
    }
    add({ name: trimmed, type, silo, intendedUse });
    setName("");
    toast.success("Saved to Media Library.");
  }

  function handleRemove(entry: MediaEntry) {
    remove(entry.id);
    toast.message(`Removed "${entry.name}".`);
  }

  return (
    <div
      data-testid="medialibrary-view"
      className="hmg-paper-page"
    >
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: "#22D3EE", color: "#0b1416" }}
        >
          <History className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black leading-none tracking-tight">
            Output History
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Saved outputs, receipts, Media Library, and WordPress drafts in one shelf.
          </p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-1 rounded-2xl border border-border/70 bg-card/80 p-1 sm:grid-cols-4">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className="h-8 flex-1 rounded-full px-3 text-[11px] font-black uppercase tracking-wider transition-colors"
              style={
                active
                  ? { background: "#22D3EE", color: "#0b1416" }
                  : { color: "hsl(var(--muted-foreground))" }
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "outputs" && (
        <section className="space-y-2">
          {outputEntries.length ? (
            outputEntries.map((entry) => <ReceiptCard key={entry.id} entry={entry} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 px-3 py-8 text-center">
              <ReceiptText className="mx-auto h-7 w-7 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-black text-foreground">
                No saved outputs yet.
              </p>
              <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-muted-foreground">
                Finish a story, graphic, cut plan, or social post and the receipt lands here.
              </p>
            </div>
          )}
        </section>
      )}

      {tab === "wordpress" && (
        <section className="space-y-2">
          {wordpressDrafts.length ? (
            wordpressDrafts.map((entry) => <ReceiptCard key={entry.id} entry={entry} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 px-3 py-8 text-center">
              <FileText className="mx-auto h-7 w-7 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-black text-foreground">
                No WordPress drafts yet.
              </p>
              <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-muted-foreground">
                Create an article draft and choose Export WordPress Draft to fill this shelf.
              </p>
            </div>
          )}
        </section>
      )}

      {tab === "receipts" && (
        <section className="space-y-2">
          {outputEntries.length ? (
            outputEntries.map((entry) => <ReceiptCard key={`receipt-${entry.id}`} entry={entry} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 px-3 py-8 text-center">
              <ReceiptText className="mx-auto h-7 w-7 text-muted-foreground/40" />
              <p className="mt-2 text-sm font-black text-foreground">
                No receipts yet.
              </p>
              <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-muted-foreground">
                Receipts appear here after local saves, exports, and manual publish prep.
              </p>
            </div>
          )}
        </section>
      )}

      {tab === "media" && (
        <>
          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Add New Media
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Short name (e.g. trent-interview-cover.jpg)"
              className="bg-secondary/40 border-border text-sm h-10"
              data-testid="medialibrary-name"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                data-testid="medialibrary-type"
                aria-label="Media type"
                className="bg-secondary/40 border border-border rounded-md text-sm h-10 px-2"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={silo}
                onChange={(e) => setSilo(e.target.value)}
                data-testid="medialibrary-silo"
                aria-label="Silo"
                className="bg-secondary/40 border border-border rounded-md text-sm h-10 px-2"
              >
                {verticals.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <select
                value={intendedUse}
                onChange={(e) => setIntendedUse(e.target.value)}
                data-testid="medialibrary-use"
                aria-label="Intended use"
                className="bg-secondary/40 border border-border rounded-md text-sm h-10 px-2"
              >
                {USE_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            {safeMode && (
              <p
                data-testid="medialibrary-safe-mode-note"
                className="text-[11px] text-amber-300"
              >
                Safe Mode is on — media uploads disabled.
              </p>
            )}
            <Button
              type="button"
              onClick={handleAdd}
              disabled={safeMode}
              data-testid="medialibrary-add-btn"
              className="w-full h-10 rounded-full font-semibold disabled:opacity-50"
              style={{ background: "#22D3EE", color: "#0b1416" }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Save to Media Library
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name, brand, or use..."
              className="bg-secondary/40 border-border text-sm h-9"
              data-testid="medialibrary-filter"
              aria-label="Filter media library"
            />
            {mediaEntries.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (
                    window.confirm(
                      "Clear all media library entries? This cannot be undone.",
                    )
                  ) {
                    clear();
                    toast.message("Media Library cleared.");
                  }
                }}
                className="h-9 text-[11px]"
                data-testid="medialibrary-clear"
              >
                Clear all
              </Button>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {filteredMedia.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 px-3 py-8 text-center">
                <ImageIcon className="mx-auto h-7 w-7 text-muted-foreground/40" />
                <p className="mt-2 text-sm font-black text-foreground">
                  Media Library is empty.
                </p>
                <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-muted-foreground">
                  Save a graphic or add a media entry and it shows up here.
                </p>
              </div>
            ) : (
              filteredMedia.map((entry) => (
                <MediaCard key={entry.id} entry={entry} onRemove={handleRemove} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
