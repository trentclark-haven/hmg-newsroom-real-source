import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Database,
  Upload,
  Globe,
  Rss,
  Activity,
  RefreshCw,
  Trash2,
  RotateCcw,
  Copy,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { HMG_BRAND_ORDER, hmgBrandKnowledge } from "@/lib/hmg/haven-ai";
import type { BrandId } from "@/lib/hmg/brandVoiceProfiles";
import {
  CORPUS_SOURCE_TYPES,
  CORPUS_RELIABILITY_LEVELS,
  RELIABILITY_LABELS,
  SOURCE_TYPE_LABELS,
  CORPUS_MAX_TEXT_CHARS,
  importCorpusSource,
  fetchCorpusUrl,
  fetchCorpusRss,
  getCorpusHealth,
  previewChunks,
  type CorpusSourceType,
  type CorpusReliability,
  type CorpusImportReceipt,
  type CorpusHealth,
  type FeedItem,
} from "@/lib/hmg/haven-ai/corpus";

const CORPUS_COLOR = "#14B8A6";
const API_BASE = `${import.meta.env.BASE_URL}api`;
const STORAGE_KEY = "hmg-corpus-intake-v1";

interface QuarantineEntry {
  id: string;
  at: number;
  title: string;
  reason: string;
  input: {
    title: string;
    text: string;
    sourceType: CorpusSourceType;
    brand: string;
    module: string;
    reliability: CorpusReliability;
    rightsNote: string;
    tags: string[];
    originalFilename?: string;
  };
}

interface ReceiptEntry extends CorpusImportReceipt {
  at: number;
}

interface PersistShape {
  receipts: ReceiptEntry[];
  quarantine: QuarantineEntry[];
}

function loadPersist(): PersistShape {
  if (typeof window === "undefined") return { receipts: [], quarantine: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { receipts: [], quarantine: [] };
    const parsed = JSON.parse(raw) as Partial<PersistShape>;
    return {
      receipts: Array.isArray(parsed.receipts) ? parsed.receipts.slice(0, 30) : [],
      quarantine: Array.isArray(parsed.quarantine) ? parsed.quarantine.slice(0, 30) : [],
    };
  } catch {
    return { receipts: [], quarantine: [] };
  }
}

function fileExtType(name: string): CorpusSourceType {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "md" || ext === "markdown") return "md";
  if (ext === "csv") return "csv";
  if (ext === "json") return "json";
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "txt") return "txt";
  return "paste";
}

function brandLabel(id: string): string {
  return hmgBrandKnowledge[id as BrandId]?.name ?? id;
}

const INTAKE_PRESETS: {
  id: string;
  label: string;
  sourceType: CorpusSourceType;
  reliability: CorpusReliability;
  rightsNote: string;
}[] = [
  { id: "notes", label: "Founder notes", sourceType: "paste", reliability: "verified", rightsNote: "Owned — internal Haven note" },
  { id: "release", label: "Press release", sourceType: "paste", reliability: "trusted", rightsNote: "Public press release" },
  { id: "transcript", label: "Transcript", sourceType: "paste", reliability: "trusted", rightsNote: "Owned recording transcript" },
  { id: "reference", label: "Public reference", sourceType: "paste", reliability: "unverified", rightsNote: "Public reference — verify before quoting" },
];

function Section({
  icon: Icon,
  title,
  subtitle,
  defaultOpen = true,
  testId,
  children,
}: {
  icon: typeof Database;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  testId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid={`${testId}-toggle`}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-foreground/[0.03] transition-colors"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${CORPUS_COLOR}1A`, color: CORPUS_COLOR }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold uppercase tracking-wide">{title}</div>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground/60" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
        )}
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border transition-colors ${
        active
          ? "bg-teal-500/20 border-teal-400/60 text-teal-700 dark:text-teal-200"
          : "bg-transparent border-border/60 text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function CorpusView() {
  const initial = useRef(loadPersist());
  // Form state
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [sourceType, setSourceType] = useState<CorpusSourceType>("paste");
  const [brand, setBrand] = useState<string>("master");
  const [moduleName, setModuleName] = useState("");
  const [reliability, setReliability] = useState<CorpusReliability>("verified");
  const [rightsNote, setRightsNote] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [originalFilename, setOriginalFilename] = useState<string | undefined>(undefined);
  const [ingesting, setIngesting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Intake state
  const [urlInput, setUrlInput] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [rssInput, setRssInput] = useState("");
  const [rssBusy, setRssBusy] = useState(false);
  const [rssError, setRssError] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedTitle, setFeedTitle] = useState("");

  // Health + logs
  const [health, setHealth] = useState<CorpusHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthBusy, setHealthBusy] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptEntry[]>(initial.current.receipts);
  const [quarantine, setQuarantine] = useState<QuarantineEntry[]>(initial.current.quarantine);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ receipts, quarantine }));
    } catch {
      /* ignore quota */
    }
  }, [receipts, quarantine]);

  const tags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 24),
    [tagsInput],
  );

  const chunkPreview = useMemo(() => (showPreview ? previewChunks(text) : []), [showPreview, text]);
  const overCap = text.length > CORPUS_MAX_TEXT_CHARS;

  const refreshHealth = useCallback(async () => {
    setHealthBusy(true);
    setHealthError(null);
    const res = await getCorpusHealth(API_BASE);
    if (res.ok) setHealth(res);
    else {
      setHealth(null);
      setHealthError(res.error);
    }
    setHealthBusy(false);
  }, []);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  function resetForm() {
    setTitle("");
    setText("");
    setSourceType("paste");
    setRightsNote("");
    setTagsInput("");
    setOriginalFilename(undefined);
    setShowPreview(false);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error("File is over 8 MB — paste the relevant text instead.");
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const content = String(reader.result ?? "");
          setText(content);
          setOriginalFilename(file.name);
          setSourceType(fileExtType(file.name));
          if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""));
          toast.success(`Loaded ${file.name} (${content.length.toLocaleString()} chars)`);
        };
        reader.onerror = () => toast.error("Could not read that file.");
        reader.readAsText(file);
      }
    }
    // Reset so re-selecting the same file fires change again.
    e.target.value = "";
  }

  async function handleIngest() {
    const trimmedTitle = title.trim();
    const trimmedText = text.trim();
    const trimmedModule = moduleName.trim();
    if (!trimmedTitle) {
      toast.error("Add a title for this source.");
      return;
    }
    if (!trimmedText) {
      toast.error("Add some text (paste, upload, or fetch).");
      return;
    }
    if (!trimmedModule) {
      toast.error("Add a module (e.g. founder-notes, artist-bios).");
      return;
    }
    if (overCap) {
      toast.error(`Text exceeds the ${CORPUS_MAX_TEXT_CHARS.toLocaleString()} char cap — split it up.`);
      return;
    }

    setIngesting(true);
    const input = {
      title: trimmedTitle,
      text: trimmedText,
      sourceType,
      brand,
      module: trimmedModule,
      reliability,
      rightsNote: rightsNote.trim() || undefined,
      tags,
      originalFilename,
    };
    const res = await importCorpusSource(API_BASE, input);
    setIngesting(false);

    if (res.ok) {
      setReceipts((prev) => [{ ...res, at: Date.now() }, ...prev].slice(0, 30));
      if (res.duplicate) {
        toast.message(`Already in corpus — "${res.title}" (no new chunks)`);
      } else if (res.status === "empty") {
        toast.warning(`Indexed but empty — "${res.title}" produced no chunks.`);
      } else {
        toast.success(`Ingested "${res.title}" — ${res.chunkCount} chunks`);
        resetForm();
      }
      void refreshHealth();
    } else {
      const entry: QuarantineEntry = {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        at: Date.now(),
        title: trimmedTitle,
        reason: res.error,
        input: {
          title: trimmedTitle,
          text: trimmedText,
          sourceType,
          brand,
          module: trimmedModule,
          reliability,
          rightsNote: rightsNote.trim(),
          tags,
          originalFilename,
        },
      };
      setQuarantine((prev) => [entry, ...prev].slice(0, 30));
      toast.error(`Ingest failed — saved to quarantine for retry.`);
    }
  }

  async function retryQuarantine(entry: QuarantineEntry) {
    const res = await importCorpusSource(API_BASE, entry.input);
    if (res.ok) {
      setQuarantine((prev) => prev.filter((q) => q.id !== entry.id));
      setReceipts((prev) => [{ ...res, at: Date.now() }, ...prev].slice(0, 30));
      toast.success(`Retry succeeded — "${res.title}"`);
      void refreshHealth();
    } else {
      setQuarantine((prev) =>
        prev.map((q) => (q.id === entry.id ? { ...q, reason: res.error, at: Date.now() } : q)),
      );
      toast.error(`Still failing: ${res.error}`);
    }
  }

  function loadIntoForm(opts: { title: string; text: string; sourceType: CorpusSourceType; rightsNote?: string }) {
    setTitle(opts.title.slice(0, 200));
    setText(opts.text);
    setSourceType(opts.sourceType);
    if (opts.rightsNote) setRightsNote(opts.rightsNote);
    setOriginalFilename(undefined);
    toast.success("Loaded into the source form — review rights & tags, then ingest.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleFetchUrl() {
    const u = urlInput.trim();
    if (!u) return;
    setUrlBusy(true);
    setUrlError(null);
    const res = await fetchCorpusUrl(API_BASE, u);
    setUrlBusy(false);
    if (res.ok) {
      loadIntoForm({
        title: res.title,
        text: res.text,
        sourceType: "url",
        rightsNote: `Public web page — ${res.finalUrl}`,
      });
      toast.success(`Fetched "${res.title}" (${res.charCount.toLocaleString()} chars)`);
    } else {
      setUrlError(res.error);
    }
  }

  async function handleFetchRss() {
    const u = rssInput.trim();
    if (!u) return;
    setRssBusy(true);
    setRssError(null);
    setFeedItems([]);
    const res = await fetchCorpusRss(API_BASE, u);
    setRssBusy(false);
    if (res.ok) {
      setFeedItems(res.items);
      setFeedTitle(res.feedTitle);
      toast.success(`${res.count} item(s) from "${res.feedTitle}"`);
    } else {
      setRssError(res.error);
    }
  }

  function copy(label: string, value: string) {
    navigator.clipboard.writeText(value).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Copy failed"),
    );
  }

  const stats = health?.stats;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" data-testid="corpus-view">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" style={{ color: CORPUS_COLOR }} />
          <h2 className="text-lg font-black tracking-tight">Haven Knowledge Corpus</h2>
        </div>
        <p className="text-[12px] text-muted-foreground">
          Feed Haven's owned intelligence — paste, upload, or fetch public sources. Everything is
          chunked and indexed on the server. No paid provider, no scraping tricks: a fetch either
          really works or tells you to paste instead.
        </p>
      </div>

      {/* Health dashboard */}
      <Section
        icon={Activity}
        title="Corpus Health"
        subtitle="Live index stats from the server"
        testId="corpus-health"
      >
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void refreshHealth()}
            disabled={healthBusy}
            data-testid="corpus-health-refresh"
            className="h-8 gap-1.5 text-[11px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthBusy ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {stats?.lastIngestedAt && (
            <span className="text-[10px] text-muted-foreground">
              Last ingest {new Date(stats.lastIngestedAt).toLocaleString()}
            </span>
          )}
        </div>

        {healthError && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{healthError}</span>
          </div>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-testid="corpus-stats-grid">
              {[
                { k: "Sources", v: stats.sources },
                { k: "Chunks", v: stats.chunks },
                { k: "Total chars", v: stats.totalChars.toLocaleString() },
                { k: "Quarantined", v: stats.quarantined },
              ].map((s) => (
                <div key={s.k} className="rounded-xl border border-border/50 bg-background/40 px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.k}</div>
                  <div className="text-lg font-black tabular-nums">{s.v}</div>
                </div>
              ))}
            </div>
            {Object.keys(stats.byBrand).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(stats.byBrand)
                  .sort((a, b) => b[1] - a[1])
                  .map(([b, n]) => (
                    <span
                      key={b}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-foreground/[0.06] text-muted-foreground"
                    >
                      {brandLabel(b)} · {n}
                    </span>
                  ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 text-[11px]"
                onClick={() => copy("Corpus stats", JSON.stringify(stats, null, 2))}
                data-testid="corpus-copy-stats"
              >
                <Copy className="w-3.5 h-3.5" /> Copy stats JSON
              </Button>
              {health?.notes && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1.5 text-[11px]"
                  onClick={() => copy("Capability note", health.notes)}
                >
                  <Copy className="w-3.5 h-3.5" /> Copy capability note
                </Button>
              )}
            </div>
          </>
        )}

        <div className="flex items-start gap-2 rounded-lg border border-teal-400/30 bg-teal-500/[0.07] px-3 py-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: CORPUS_COLOR }} />
          <span>
            <strong className="text-foreground">Scale &amp; safety:</strong> the corpus is built to grow
            toward 50&nbsp;GB+ of indexed text on the server/database — but raw source dumps are{" "}
            <strong className="text-foreground">never committed to the repo</strong>. Ingest here; the
            text lives in the database, not in version control.
          </span>
        </div>
      </Section>

      {/* Source packet form */}
      <Section
        icon={Layers}
        title="Add a Source"
        subtitle="Paste or upload, tag, preview, ingest"
        testId="corpus-form"
      >
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Drake 2024 timeline — verified"
            maxLength={200}
            data-testid="corpus-title"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Source text</Label>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] ${overCap ? "text-red-500 font-bold" : "text-muted-foreground"}`}>
                {text.length.toLocaleString()} / {CORPUS_MAX_TEXT_CHARS.toLocaleString()}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.md,.markdown,.csv,.json,.html,.htm,text/plain,text/markdown,text/csv,application/json,text/html"
                className="hidden"
                onChange={handleFile}
                data-testid="corpus-file-input"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-[11px]"
                onClick={() => fileRef.current?.click()}
                data-testid="corpus-upload"
              >
                <Upload className="w-3.5 h-3.5" /> Upload
              </Button>
            </div>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste notes, transcript, article text, CSV/JSON… or upload a file, or fetch a public URL below."
            className="min-h-[140px] font-mono text-[12px]"
            data-testid="corpus-text"
          />
          {originalFilename && (
            <p className="text-[10px] text-muted-foreground">From file: {originalFilename}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Source type</Label>
          <div className="flex flex-wrap gap-1.5">
            {CORPUS_SOURCE_TYPES.map((t) => (
              <Chip key={t} active={sourceType === t} onClick={() => setSourceType(t)} testId={`corpus-type-${t}`}>
                {SOURCE_TYPE_LABELS[t]}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Brand silo</Label>
          <div className="flex flex-wrap gap-1.5">
            {HMG_BRAND_ORDER.map((b) => (
              <Chip key={b} active={brand === b} onClick={() => setBrand(b)} testId={`corpus-brand-${b}`}>
                {brandLabel(b)}
              </Chip>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Module</Label>
            <Input
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              placeholder="founder-notes, artist-bios…"
              data-testid="corpus-module"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Rights / provenance</Label>
            <Input
              value={rightsNote}
              onChange={(e) => setRightsNote(e.target.value)}
              placeholder="Owned, public, licensed…"
              data-testid="corpus-rights"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Reliability</Label>
          <div className="flex flex-wrap gap-1.5">
            {CORPUS_RELIABILITY_LEVELS.map((r) => (
              <Chip key={r} active={reliability === r} onClick={() => setReliability(r)} testId={`corpus-reliability-${r}`}>
                {RELIABILITY_LABELS[r]}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Tags (comma-separated)</Label>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="drake, beef, timeline"
            data-testid="corpus-tags"
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/[0.06] text-muted-foreground">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-[11px]"
            onClick={() => setShowPreview((p) => !p)}
            data-testid="corpus-preview-toggle"
          >
            <Layers className="w-3.5 h-3.5" />
            {showPreview ? "Hide" : "Preview"} chunks
          </Button>
          <Button
            onClick={() => void handleIngest()}
            disabled={ingesting || overCap}
            data-testid="corpus-ingest"
            className="gap-1.5"
            style={{ background: CORPUS_COLOR, color: "#04211e" }}
          >
            <Database className="w-4 h-4" />
            {ingesting ? "Ingesting…" : "Ingest to corpus"}
          </Button>
        </div>

        {showPreview && (
          <div className="rounded-lg border border-border/50 bg-background/40 p-3 space-y-2" data-testid="corpus-preview">
            <p className="text-[11px] text-muted-foreground">
              ~{chunkPreview.length} chunk(s) estimated (≈1,200 chars each). The server is the source
              of truth — the receipt shows the real count.
            </p>
            {chunkPreview.slice(0, 3).map((c) => (
              <div key={c.index} className="rounded border border-border/40 bg-secondary/30 p-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Chunk {c.index + 1} · {c.charCount} chars
                </div>
                <p className="text-[11px] line-clamp-3 whitespace-pre-wrap">{c.content.slice(0, 220)}…</p>
              </div>
            ))}
            {chunkPreview.length > 3 && (
              <p className="text-[10px] text-muted-foreground">+{chunkPreview.length - 3} more…</p>
            )}
          </div>
        )}
      </Section>

      {/* Free / public intake */}
      <Section
        icon={Globe}
        title="Free / Public Intake"
        subtitle="Paste presets · public URL · RSS — all free, no credits"
        testId="corpus-intake"
        defaultOpen={false}
      >
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Quick paste presets</Label>
          <div className="flex flex-wrap gap-1.5">
            {INTAKE_PRESETS.map((p) => (
              <Chip
                key={p.id}
                active={false}
                testId={`corpus-preset-${p.id}`}
                onClick={() => {
                  setSourceType(p.sourceType);
                  setReliability(p.reliability);
                  setRightsNote(p.rightsNote);
                  toast.message(`Preset: ${p.label} — paste your text in the form above.`);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                {p.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* URL fetch */}
        <div className="rounded-lg border border-border/50 bg-background/40 p-3 space-y-2">
          <div className="flex items-center gap-2 text-[12px] font-bold">
            <Globe className="w-4 h-4" style={{ color: CORPUS_COLOR }} /> Public web page
          </div>
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/article"
              data-testid="corpus-url-input"
              onKeyDown={(e) => e.key === "Enter" && void handleFetchUrl()}
            />
            <Button onClick={() => void handleFetchUrl()} disabled={urlBusy || !urlInput.trim()} data-testid="corpus-url-fetch">
              {urlBusy ? "Fetching…" : "Fetch"}
            </Button>
          </div>
          {urlError && (
            <div className="flex items-start gap-2 rounded border border-amber-400/40 bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-700 dark:text-amber-200" data-testid="corpus-url-error">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{urlError} — paste the text manually into the form above instead.</span>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            The server fetches the page directly (private/internal addresses are blocked). On success
            the text loads into the form for you to review rights and ingest.
          </p>
        </div>

        {/* RSS fetch */}
        <div className="rounded-lg border border-border/50 bg-background/40 p-3 space-y-2">
          <div className="flex items-center gap-2 text-[12px] font-bold">
            <Rss className="w-4 h-4" style={{ color: CORPUS_COLOR }} /> RSS / Atom feed
          </div>
          <div className="flex gap-2">
            <Input
              value={rssInput}
              onChange={(e) => setRssInput(e.target.value)}
              placeholder="https://example.com/feed.xml"
              data-testid="corpus-rss-input"
              onKeyDown={(e) => e.key === "Enter" && void handleFetchRss()}
            />
            <Button onClick={() => void handleFetchRss()} disabled={rssBusy || !rssInput.trim()} data-testid="corpus-rss-fetch">
              {rssBusy ? "Fetching…" : "Fetch"}
            </Button>
          </div>
          {rssError && (
            <div className="flex items-start gap-2 rounded border border-amber-400/40 bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-700 dark:text-amber-200" data-testid="corpus-rss-error">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{rssError}</span>
            </div>
          )}
          {feedItems.length > 0 && (
            <div className="space-y-2" data-testid="corpus-rss-items">
              <p className="text-[11px] text-muted-foreground">
                {feedItems.length} item(s) from <strong className="text-foreground">{feedTitle}</strong>
              </p>
              {feedItems.slice(0, 12).map((item, i) => (
                <div key={`${item.link}-${i}`} className="rounded border border-border/40 bg-secondary/30 p-2 space-y-1">
                  <div className="text-[12px] font-semibold line-clamp-2">{item.title || "(untitled)"}</div>
                  {item.excerpt && <p className="text-[11px] text-muted-foreground line-clamp-2">{item.excerpt}</p>}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] gap-1"
                    data-testid={`corpus-rss-load-${i}`}
                    onClick={() =>
                      loadIntoForm({
                        title: item.title || feedTitle,
                        text: [item.title, item.excerpt, item.link].filter(Boolean).join("\n\n"),
                        sourceType: "rss",
                        rightsNote: `Public RSS item — ${item.link || feedTitle}`,
                      })
                    }
                  >
                    Load into form
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Quarantine */}
      {quarantine.length > 0 && (
        <Section
          icon={AlertTriangle}
          title={`Quarantine (${quarantine.length})`}
          subtitle="Failed ingests — retry or discard"
          testId="corpus-quarantine"
          defaultOpen={false}
        >
          {quarantine.map((q) => (
            <div key={q.id} className="rounded-lg border border-amber-400/40 bg-amber-500/[0.06] p-3 space-y-2" data-testid="corpus-quarantine-item">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold truncate">{q.title}</div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-200">{q.reason}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {brandLabel(q.input.brand)} · {q.input.module} · {new Date(q.at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => void retryQuarantine(q)} data-testid="corpus-quarantine-retry">
                  <RotateCcw className="w-3.5 h-3.5" /> Retry
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1.5 text-[11px] text-muted-foreground"
                  onClick={() => setQuarantine((prev) => prev.filter((x) => x.id !== q.id))}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Discard
                </Button>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Receipts */}
      {receipts.length > 0 && (
        <Section
          icon={CheckCircle2}
          title={`Recent Ingests (${receipts.length})`}
          subtitle="Server receipts — newest first"
          testId="corpus-receipts"
          defaultOpen={false}
        >
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-[11px] text-muted-foreground"
              onClick={() => setReceipts([])}
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear log
            </Button>
          </div>
          {receipts.map((r) => (
            <div key={`${r.sourceId}-${r.at}`} className="rounded-lg border border-border/50 bg-background/40 p-3 space-y-1" data-testid="corpus-receipt-item">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: CORPUS_COLOR }} />
                <span className="text-[12px] font-semibold truncate flex-1">{r.title}</span>
                {r.duplicate && (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-200">
                    Duplicate
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {brandLabel(r.brand)} · {r.module} · {r.chunkCount} chunks · {r.charCount.toLocaleString()} chars ·{" "}
                {r.citationLabel}
              </p>
              {r.warnings.length > 0 && (
                <p className="text-[10px] text-amber-700 dark:text-amber-300">⚠ {r.warnings.join("; ")}</p>
              )}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}
