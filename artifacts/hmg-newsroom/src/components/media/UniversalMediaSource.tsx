import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  X,
  Upload,
  ClipboardPaste,
  Youtube,
  Link2,
  HardDrive,
  Library,
  Palette,
  Activity,
  Save,
  Trash2,
} from "lucide-react";
import { verticals } from "@/lib/mock-data";
import {
  classifyUrl,
  fileToMediaItem,
  formatBytes,
  makeMediaItem,
  previewSrc,
  RIGHTS_OPTIONS,
  useMediaBank,
  youtubeId,
  youtubeThumb,
  type MediaItem,
  type MediaKind,
  type RightsStatus,
} from "./mediaItem";
import { RightsBadge } from "./RightsBadge";
import { ConnectorStatus } from "./ConnectorStatus";
import { clipboardSupported } from "./connectors";

export type MediaActionId =
  | "main-image"
  | "overlay"
  | "attach-source"
  | "send-artbot"
  | "use-video"
  | "use-transcript"
  | "attach-lead"
  | "sponsor-angle";

export interface MediaAction {
  id: MediaActionId;
  label: string;
  icon?: ReactNode;
  primary?: boolean;
}

type TabId =
  | "upload"
  | "paste"
  | "youtube"
  | "link"
  | "drive"
  | "bank"
  | "brand"
  | "status";

interface TabDef {
  id: TabId;
  label: string;
  icon: ReactNode;
}

const ALL_TABS: TabDef[] = [
  { id: "upload", label: "Upload", icon: <Upload className="w-3.5 h-3.5" /> },
  { id: "paste", label: "Screenshot", icon: <ClipboardPaste className="w-3.5 h-3.5" /> },
  { id: "youtube", label: "YouTube", icon: <Youtube className="w-3.5 h-3.5" /> },
  { id: "link", label: "Link", icon: <Link2 className="w-3.5 h-3.5" /> },
  { id: "bank", label: "Saved Bank", icon: <Library className="w-3.5 h-3.5" /> },
  { id: "brand", label: "Brand", icon: <Palette className="w-3.5 h-3.5" /> },
  { id: "drive", label: "Drive", icon: <HardDrive className="w-3.5 h-3.5" /> },
  { id: "status", label: "Status", icon: <Activity className="w-3.5 h-3.5" /> },
];

export interface UniversalMediaSourceProps {
  open: boolean;
  onClose: () => void;
  context: "artbot" | "cutmaster" | "editorial" | "maximillion";
  brand: { id?: string; color: string; on: string };
  actions: MediaAction[];
  onPick: (item: MediaItem, action: MediaActionId) => void;
  /** Restrict the upload picker. */
  accept?: "image" | "video" | "av" | "media" | "all";
  /**
   * When provided, a locally-picked file is handed back raw (e.g. WebEdit's
   * transcribe pipeline) instead of being turned into a session MediaItem.
   */
  onLocalFile?: (file: File) => void;
  title?: string;
}

function acceptAttr(accept: UniversalMediaSourceProps["accept"]): string {
  switch (accept) {
    case "image":
      return "image/*";
    case "video":
      return "video/*";
    case "av":
      return "video/*,audio/*";
    case "media":
      return "video/*,audio/*,image/*";
    default:
      return "image/*,video/*,audio/*";
  }
}

export function UniversalMediaSource({
  open,
  onClose,
  context,
  brand,
  actions,
  onPick,
  accept = "all",
  onLocalFile,
  title,
}: UniversalMediaSourceProps) {
  const bank = useMediaBank();
  const [tab, setTab] = useState<TabId>("upload");
  const [staged, setStaged] = useState<MediaItem | null>(null);
  const [ytUrl, setYtUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [rights, setRights] = useState<RightsStatus>("user-supplied");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pasteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setStaged(null);
      setYtUrl("");
      setLinkUrl("");
      setDriveUrl("");
      setBusy(false);
      setTab("upload");
    }
  }, [open]);

  useEffect(() => {
    if (staged) setRights(staged.rightsStatus);
  }, [staged]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const bankItems = useMemo(() => {
    return bank.items.filter((it) => {
      if (context === "artbot") return it.canUseInArtBot;
      if (context === "cutmaster") return it.canUseInCutMaster;
      if (context === "editorial") return it.canUseInEditorial;
      return it.canUseInMaximillion;
    });
  }, [bank.items, context]);

  const brandAssets = useMemo<MediaItem[]>(() => {
    return verticals.map((v) =>
      makeMediaItem({
        id: `brand_${v.id}`,
        mediaType: "image",
        sourceType: "brand_asset",
        title: `${v.name} logo`,
        dataUrl: v.logo,
        brand: v.id,
        rightsStatus: "brand-asset",
        tags: ["brand", v.id],
      }),
    );
  }, []);

  if (!open) return null;

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (onLocalFile) {
      onLocalFile(file);
      onClose();
      return;
    }
    setBusy(true);
    try {
      const item = await fileToMediaItem(file, { brand: brand.id });
      setStaged(item);
    } catch {
      toast.error("Could not read that file.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePaste() {
    if (!clipboardSupported()) {
      toast.error("This browser blocks clipboard image reads — use Upload.");
      return;
    }
    setBusy(true);
    try {
      const clipItems = await navigator.clipboard.read();
      for (const ci of clipItems) {
        const type = ci.types.find((t) => t.startsWith("image/"));
        if (type) {
          const blob = await ci.getType(type);
          const file = new File([blob], `screenshot-${Date.now()}.png`, { type });
          const item = await fileToMediaItem(file, { brand: brand.id });
          setStaged({
            ...item,
            sourceType: "clipboard",
            title: "Pasted screenshot",
            rightsStatus: "screenshot-reference",
          });
          setBusy(false);
          return;
        }
      }
      toast.message("No image found in the clipboard.");
    } catch {
      toast.error("Clipboard read failed — try Upload instead.");
    } finally {
      setBusy(false);
    }
  }

  function handleYoutube() {
    const id = youtubeId(ytUrl);
    if (!id) {
      toast.error("That doesn't look like a YouTube URL.");
      return;
    }
    setStaged(
      makeMediaItem({
        mediaType: "video",
        sourceType: "youtube",
        title: "YouTube source",
        sourceUrl: ytUrl.trim(),
        youtubeId: id,
        thumbUrl: youtubeThumb(id),
        rightsStatus: "needs-clearance",
        tags: ["youtube"],
        brand: brand.id,
      }),
    );
  }

  function handleLink() {
    const url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Enter a full URL starting with http(s)://");
      return;
    }
    const kind = classifyUrl(url);
    const id = youtubeId(url);
    setStaged(
      makeMediaItem({
        mediaType: kind,
        sourceType: id ? "youtube" : "url",
        title: kind === "image" ? "Linked image" : "Linked source",
        sourceUrl: url,
        youtubeId: id ?? undefined,
        thumbUrl: id ? youtubeThumb(id) : kind === "image" ? url : undefined,
        rightsStatus: "needs-clearance",
        tags: ["link"],
        brand: brand.id,
      }),
    );
  }

  function handleDriveLink() {
    const url = driveUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Paste a full Google Drive share link.");
      return;
    }
    setStaged(
      makeMediaItem({
        mediaType: "document",
        sourceType: "google_drive",
        title: "Google Drive link",
        sourceUrl: url,
        rightsStatus: "needs-clearance",
        usageNotes: "Link reference only — file access requires a configured connector.",
        tags: ["drive", "link"],
        brand: brand.id,
      }),
    );
  }

  function commitAction(action: MediaActionId) {
    if (!staged) return;
    const finalItem = { ...staged, rightsStatus: rights };
    onPick(finalItem, action);
    onClose();
  }

  function saveToBank() {
    if (!staged) return;
    bank.add({ ...staged, rightsStatus: rights, sourceType: staged.sourceType });
    toast.success("Saved to Media Bank — reusable in every module.");
  }

  const visibleTabs = useMemo<TabDef[]>(() => {
    if (context === "cutmaster") {
      // Video-first ordering: uploads, YouTube/link, saved media, then the
      // Screenshot path demoted to a thumbnail/cover option (not video intake).
      const order: TabId[] = [
        "upload",
        "youtube",
        "link",
        "bank",
        "drive",
        "paste",
        "brand",
        "status",
      ];
      return order
        .map((id) => ALL_TABS.find((t) => t.id === id))
        .filter((t): t is TabDef => Boolean(t))
        .map((t) =>
          t.id === "paste"
            ? { ...t, label: "Thumbnail / Cover Image" }
            : t,
        );
    }
    return ALL_TABS;
  }, [context]);
  const preview = staged ? previewSrc(staged) : undefined;

  const modal = (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-secondary/70 backdrop-blur-sm p-0 sm:p-4"
      data-testid="universal-media-source"
      onClick={onClose}
    >
      <div
        className="flex w-full sm:max-w-3xl max-h-[92vh] flex-col rounded-t-2xl sm:rounded-2xl border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground truncate">
              {title ?? "Add Media"}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              One media pipeline — save once, reuse everywhere.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            data-testid="media-close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2">
          {visibleTabs.map((t) => {
            const activeTab = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                data-testid={`media-tab-${t.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors"
                style={{
                  background: activeTab ? brand.color : "transparent",
                  color: activeTab ? brand.on : "hsl(var(--muted-foreground))",
                  border: activeTab ? "none" : "1px solid hsl(var(--border))",
                }}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {tab === "upload" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                data-testid="media-upload-trigger"
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/40 px-4 py-8 text-center hover:border-foreground/40 disabled:opacity-50"
              >
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">
                  {busy ? "Reading file…" : "Choose a file"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {onLocalFile
                    ? "Video / audio for transcription"
                    : accept === "image"
                      ? "Images only"
                      : "Image, video or audio"}
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={acceptAttr(accept)}
                onChange={handleFilePick}
                className="hidden"
              />
            </div>
          )}

          {tab === "paste" && (
            <div className="space-y-3" ref={pasteRef}>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                {context === "cutmaster"
                  ? "Paste a thumbnail, cover image or overlay still from your clipboard. This is for the clip's cover art — not video intake."
                  : "Paste a screenshot of an X post, comment, DM or receipt to use as a source reference."}{" "}
                {clipboardSupported() ? "" : "This browser blocks clipboard image reads — use Upload."}
              </p>
              <button
                type="button"
                onClick={handlePaste}
                disabled={busy || !clipboardSupported()}
                data-testid="media-paste-trigger"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold disabled:opacity-50"
                style={{ background: brand.color, color: brand.on }}
              >
                <ClipboardPaste className="w-4 h-4" />
                Paste from clipboard
              </button>
            </div>
          )}

          {tab === "youtube" && (
            <div className="space-y-3">
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Paste a YouTube URL to pull its thumbnail and keep it as a source.
                Transcription runs through the server ingest inside WebEdit.
              </p>
              <div className="flex gap-2">
                <input
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=…"
                  data-testid="media-youtube-input"
                  className="flex-1 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={handleYoutube}
                  className="rounded-lg px-4 py-2 text-[12px] font-bold"
                  style={{ background: brand.color, color: brand.on }}
                >
                  Load
                </button>
              </div>
            </div>
          )}

          {tab === "link" && (
            <div className="space-y-3">
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Paste any link — article, image, video or social post — to keep as a
                source reference for the story.
              </p>
              <div className="flex gap-2">
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://…"
                  data-testid="media-link-input"
                  className="flex-1 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={handleLink}
                  className="rounded-lg px-4 py-2 text-[12px] font-bold"
                  style={{ background: brand.color, color: brand.on }}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {tab === "drive" && (
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <HardDrive className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
                  <div className="text-[12px] text-amber-700 dark:text-amber-100/90 leading-relaxed">
                    <strong className="text-amber-700 dark:text-amber-200">Google Drive — ready to configure.</strong>{" "}
                    Live browsing and sign-in aren't wired yet, so we won't fake them.
                    You can still drop a Drive share link below as a source reference, or
                    use Local Upload (active now).
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-border bg-background/40 px-4 py-2 text-[12px] font-bold text-muted-foreground"
              >
                Connect Google Drive (configuration required)
              </button>
              <div className="flex gap-2">
                <input
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="Paste a Drive share link…"
                  data-testid="media-drive-input"
                  className="flex-1 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60"
                />
                <button
                  type="button"
                  onClick={handleDriveLink}
                  className="rounded-lg px-4 py-2 text-[12px] font-bold"
                  style={{ background: brand.color, color: brand.on }}
                >
                  Add link
                </button>
              </div>
            </div>
          )}

          {tab === "bank" && (
            <div className="space-y-2">
              {bankItems.length === 0 ? (
                <p className="text-[12px] text-muted-foreground py-6 text-center">
                  No saved assets yet. Save anything from any module and it shows up here.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {bankItems.map((it) => {
                    const src = previewSrc(it);
                    return (
                      <div key={it.id} className="group relative">
                        <button
                          type="button"
                          onClick={() => setStaged(it)}
                          data-testid={`media-bank-item-${it.id}`}
                          className="block w-full overflow-hidden rounded-lg border border-border bg-background/40 text-left hover:border-foreground/40"
                        >
                          <div className="aspect-square w-full bg-secondary/30 flex items-center justify-center overflow-hidden">
                            {src ? (
                              <img src={src} alt={it.title} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-[9px] uppercase tracking-wider text-muted-foreground px-1 text-center">
                                {it.mediaType}
                              </span>
                            )}
                          </div>
                          <div className="px-1.5 py-1">
                            <p className="truncate text-[10px] font-semibold text-foreground">
                              {it.title}
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => bank.remove(it.id)}
                          className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "brand" && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {brandAssets.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setStaged(it)}
                  data-testid={`media-brand-item-${it.brand}`}
                  className="block overflow-hidden rounded-lg border border-border bg-background/40 text-left hover:border-foreground/40"
                >
                  <div className="aspect-square w-full bg-secondary/30 flex items-center justify-center p-2">
                    {it.dataUrl ? (
                      <img src={it.dataUrl} alt={it.title} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-[9px] text-muted-foreground">{it.title}</span>
                    )}
                  </div>
                  <div className="px-1.5 py-1">
                    <p className="truncate text-[10px] font-semibold text-foreground">{it.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {tab === "status" && <ConnectorStatus />}
        </div>

        {/* Staging panel */}
        {staged && (
          <div className="border-t border-border bg-background/60 px-4 py-3" data-testid="media-staging">
            <div className="flex gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary/30 flex items-center justify-center">
                {preview ? (
                  <img src={preview} alt={staged.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    {staged.mediaType}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    value={staged.title}
                    onChange={(e) => setStaged({ ...staged, title: e.target.value })}
                    className="min-w-0 flex-1 rounded border border-border bg-background/60 px-2 py-1 text-[12px] font-semibold text-foreground"
                    data-testid="media-staged-title"
                  />
                  <RightsBadge status={rights} />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="uppercase tracking-wider">{staged.sourceType.replace("_", " ")}</span>
                  {staged.sizeBytes ? <span>· {formatBytes(staged.sizeBytes)}</span> : null}
                  {staged.width ? <span>· {staged.width}×{staged.height}</span> : null}
                </div>
                <select
                  value={rights}
                  onChange={(e) => setRights(e.target.value as RightsStatus)}
                  data-testid="media-rights-select"
                  className="w-full rounded border border-border bg-background/60 px-2 py-1 text-[11px] text-foreground"
                >
                  {RIGHTS_OPTIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => commitAction(a.id)}
                  data-testid={`media-action-${a.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold"
                  style={
                    a.primary
                      ? { background: brand.color, color: brand.on }
                      : { border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }
                  }
                >
                  {a.icon}
                  {a.label}
                </button>
              ))}
              <button
                type="button"
                onClick={saveToBank}
                data-testid="media-action-save-bank"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[12px] font-bold text-foreground hover:bg-muted"
              >
                <Save className="w-3.5 h-3.5" />
                Save to Bank
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
