import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Brain,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  Download,
  FileText,
  Filter,
  HardDrive,
  Loader2,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookMarked,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  type MemoryItem,
  type MemoryType,
  MEMORY_TYPE_LABELS,
  ALL_MEMORY_TYPES,
  ROUTED_SYSTEM_LABELS,
  getMemoryHealth,
  getAllItems,
  addMemoryItemAndNotify,
  deleteMemoryItemAndNotify,
  clearAllMemoryAndNotify,
  togglePin,
  importItems,
  subscribeMemoryStore,
  notifyMemoryStoreListeners,
  exportAllMemoryJSON,
  exportMaxMemoryJSON,
  exportEditorialMemoryJSON,
  exportFilteredMemoryJSON,
  buildMemorySummaryText,
  buildRoutingSummaryText,
  downloadJSON,
  getRoutingDescription,
  importFile,
  importJSON,
  importCSV,
  getMaxMemorySummary,
  buildMaxDeterministicPreviews,
  MAX_MEMORY_STATUS_LABELS,
  getEditorialMemorySummary,
  buildARTBOTStarterActions,
  seedFounderVoiceSample,
  seedWordPressRuleSample,
  seedMaxRevenueSample,
  seedBrandRuleSample,
} from "@/lib/hmg/memory/founderKnowledgeBase";
import { estimateUsage } from "@/lib/safeStorage";

const KB_COLOR = "#6366F1";
const MAX_COLOR = "#10B981";
const ARTBOT_COLOR = "#0EA5E9";

// ── Shared UI helpers ──────────────────────────────────────────────────────────

function Chip({
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
      className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border transition-colors ${
        active
          ? "border-indigo-400/60 text-indigo-700 dark:text-indigo-200"
          : "bg-transparent border-border/60 text-muted-foreground hover:text-foreground"
      }`}
      style={active && color ? { background: `${color}22`, borderColor: `${color}88`, color } : undefined}
    >
      {children}
    </button>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  color,
  defaultOpen,
  testId,
  children,
  badge,
}: {
  icon: typeof Database;
  title: string;
  subtitle?: string;
  color?: string;
  defaultOpen?: boolean;
  testId: string;
  children: React.ReactNode;
  badge?: number | string;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const c = color ?? KB_COLOR;
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
          style={{ background: `${c}1A`, color: c }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold uppercase tracking-wide">{title}</span>
            {badge !== undefined && badge !== 0 && (
              <span
                className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: `${c}22`, color: c }}
              >
                {badge}
              </span>
            )}
          </div>
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

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  color?: string;
  icon?: typeof Database;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/40 px-3 py-2.5 flex flex-col gap-1">
      {Icon && (
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" style={{ color: color ?? KB_COLOR }} />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
      )}
      {!Icon && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>}
      <div className="text-xl font-black tabular-nums" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}

function HonestBadge({ status }: { status: string }) {
  const isOk = status === "deterministic-recommendation" || status === "local-memory-saved";
  return (
    <span
      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
        isOk
          ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-border/40 bg-secondary/40 text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

function RoutingPills({ systems }: { systems: MemoryItem["routedSystems"] }) {
  if (!systems || systems.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {systems.map((s) => (
        <span
          key={s}
          className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-600 dark:text-indigo-300"
        >
          {ROUTED_SYSTEM_LABELS[s] ?? s}
        </span>
      ))}
    </div>
  );
}

// ── Memory item card ──────────────────────────────────────────────────────────

function MemoryCard({
  item,
  onDelete,
  onPin,
  onCopy,
}: {
  item: MemoryItem;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onCopy: (text: string, label: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dateStr = new Date(item.dateAdded).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={`rounded-xl border bg-background/60 p-3 space-y-2 transition-all ${
        item.pinned ? "border-amber-400/40 shadow-sm" : "border-border/40"
      }`}
      data-testid={`memory-card-${item.id}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {item.pinned && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />}
            <span className="text-[13px] font-bold leading-snug">{item.title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-400/30">
              {MEMORY_TYPE_LABELS[item.type] ?? item.type}
            </span>
            {item.brand && item.brand !== "master" && (
              <span className="text-[10px] text-muted-foreground">{item.brand}</span>
            )}
            <span className="text-[10px] text-muted-foreground">{dateStr}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onPin(item.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
            title={item.pinned ? "Unpin" : "Pin"}
          >
            {item.pinned ? (
              <PinOff className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Pin className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onCopy(item.content, item.title)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
            title="Copy content"
          >
            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {confirmDelete ? (
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="h-7 px-2 rounded-lg flex items-center gap-1 bg-red-500/20 border border-red-400/40 text-red-600 dark:text-red-300 text-[10px] font-bold uppercase tracking-wide hover:bg-red-500/30 transition-colors"
            >
              Confirm
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              onBlur={() => setConfirmDelete(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
            </button>
          )}
        </div>
      </div>

      {item.preview && (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 font-mono">
          {item.preview}
        </p>
      )}

      <RoutingPills systems={item.routedSystems} />

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 8).map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-foreground/[0.06] text-muted-foreground border border-border/30"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {item.notes && (
        <p className="text-[10px] text-muted-foreground italic">{item.notes.slice(0, 100)}</p>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function FounderKnowledgeBaseView() {
  // Store subscription
  const [storeVersion, setStoreVersion] = useState(0);
  useEffect(() => {
    return subscribeMemoryStore(() => setStoreVersion((v) => v + 1));
  }, []);

  const allItems = useMemo(() => {
    void storeVersion; // reactive
    return getAllItems();
  }, [storeVersion]);

  const health = useMemo(() => {
    void storeVersion;
    return getMemoryHealth();
  }, [storeVersion]);

  const maxSummary = useMemo(() => {
    void storeVersion;
    return getMaxMemorySummary();
  }, [storeVersion]);

  const editorialSummary = useMemo(() => {
    void storeVersion;
    return getEditorialMemorySummary();
  }, [storeVersion]);

  const maxPreviews = useMemo(() => buildMaxDeterministicPreviews(), [storeVersion]);
  const artbotActions = useMemo(() => buildARTBOTStarterActions(), [storeVersion]);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formType, setFormType] = useState<MemoryType>("founder-voice");
  const [formBrand, setFormBrand] = useState("master");
  const [formTags, setFormTags] = useState("");
  const [formSource, setFormSource] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<MemoryType | "all">("all");

  // Import state
  const [importJson, setImportJson] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);

  // Clear confirmation
  const [confirmClear, setConfirmClear] = useState(false);

  const brandOptions = ["master", "hiphop", "rap", "music", "sports", "fit", "canna"];
  const brandLabels: Record<string, string> = {
    master: "HMG Master",
    hiphop: "HipHopHaven",
    rap: "RapHaven",
    music: "MusicHaven",
    sports: "SportsHaven",
    fit: "FitHaven",
    canna: "CannaHaven",
  };

  const tags = useMemo(
    () =>
      formTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 20),
    [formTags],
  );

  const filteredItems = useMemo(() => {
    let items = [...allItems];
    if (filterType !== "all") items = items.filter((i) => i.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.content.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q)) ||
          i.notes.toLowerCase().includes(q),
      );
    }
    // Pinned first
    return [...items.filter((i) => i.pinned), ...items.filter((i) => !i.pinned)];
  }, [allItems, filterType, searchQuery]);

  function resetForm() {
    setFormTitle("");
    setFormContent("");
    setFormTags("");
    setFormSource("");
    setFormNotes("");
  }

  function handleSave() {
    if (!formTitle.trim()) {
      toast.error("Add a title for this memory.");
      return;
    }
    if (!formContent.trim()) {
      toast.error("Add some content (paste, type, or upload).");
      return;
    }
    setSaving(true);
    try {
      const item = addMemoryItemAndNotify({
        title: formTitle.trim(),
        content: formContent.trim(),
        type: formType,
        brand: formBrand,
        tags,
        source: formSource.trim(),
        notes: formNotes.trim(),
        pinned: false,
      });
      toast.success(`Memory saved: "${item.title}" → ${getRoutingDescription(formType)}`);
      resetForm();
    } catch {
      toast.error("Failed to save memory. Check storage.");
    }
    setSaving(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const result = await importFile(file, formType);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const first = result.items[0];
    if (first?.content) setFormContent(String(first.content));
    if (first?.title && !formTitle.trim()) setFormTitle(String(first.title).slice(0, 160));
    if (first?.tags && Array.isArray(first.tags)) setFormTags((first.tags as string[]).join(", "));
    toast.success(`Loaded from ${file.name} — ${result.count} item(s). Review and save.`);
  }

  function handleDelete(id: string) {
    deleteMemoryItemAndNotify(id);
    toast.success("Memory deleted.");
  }

  function handlePin(id: string) {
    togglePin(id);
    notifyMemoryStoreListeners();
    toast.success("Pin toggled.");
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`"${label}" copied`),
      () => toast.error("Copy failed"),
    );
  }

  function handleCopyText(text: string, label: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error("Copy failed"),
    );
  }

  function handleClearAll() {
    clearAllMemoryAndNotify();
    setConfirmClear(false);
    toast.success("All memory cleared.");
  }

  async function handleImportJSON() {
    if (!importJson.trim()) {
      toast.error("Paste JSON to import.");
      return;
    }
    setImportBusy(true);
    const result = importJSON(importJson.trim());
    if (!result.ok) {
      toast.error(result.error);
      setImportBusy(false);
      return;
    }
    const count = importItems(result.items as MemoryItem[]);
    notifyMemoryStoreListeners();
    toast.success(`Imported ${count} new item(s).`);
    setImportJson("");
    setShowImportPanel(false);
    setImportBusy(false);
  }

  async function handleImportCSVFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const text = await file.text();
    const result = importCSV(text);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const count = importItems(result.items as MemoryItem[]);
    notifyMemoryStoreListeners();
    toast.success(`Imported ${count} contact(s) from CSV → Max / Relationship Graph.`);
  }

  const csvRef = useRef<HTMLInputElement>(null);

  const storageStatus = estimateUsage();
  const storageLabel =
    storageStatus.status === "ok"
      ? "Storage OK"
      : storageStatus.status === "warning"
        ? "Storage Warning"
        : storageStatus.status === "critical"
          ? "Storage Critical"
          : "Storage Full";

  const lastUpdatedStr = health.lastUpdated
    ? new Date(health.lastUpdated).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Never";

  const healthLabel =
    health.overall === "strong"
      ? "Memory Health: Strong"
      : health.overall === "empty"
        ? "No Memory Loaded"
        : `Needs: ${health.missing.join(", ")}`;

  const healthColor =
    health.overall === "strong"
      ? "#10B981"
      : health.overall === "empty"
        ? "#94A3B8"
        : "#F59E0B";

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      data-testid="founder-knowledge-base-view"
    >
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BookMarked className="w-5 h-5" style={{ color: KB_COLOR }} />
          <h2 className="text-lg font-black tracking-tight">Founder Knowledge Base</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-600 dark:text-indigo-300">
            Local Only
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground max-w-2xl">
          Load HMG DNA into the app — Founder Voice, brand rules, WordPress rules, Max notes,
          relationship data, editorial examples, and more. All stored locally. No fake cloud sync.
          No live AI. Honest local intelligence foundation.
        </p>
      </div>

      {/* Memory Health + Quick Stats */}
      <Section
        icon={Sparkles}
        title="Memory Health"
        subtitle={healthLabel}
        color={healthColor}
        defaultOpen={true}
        testId="kb-health"
        badge={health.totalItems}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="Total Items" value={health.totalItems} icon={Database} color={KB_COLOR} />
          <StatCard
            label="Founder Voice"
            value={health.byType?.["founder-voice"] ?? 0}
            icon={BookOpen}
            color={health.byType?.["founder-voice"] ? "#10B981" : "#94A3B8"}
          />
          <StatCard
            label="Brand Rules"
            value={health.byType?.["brand-rule"] ?? 0}
            icon={Shield}
            color={health.byType?.["brand-rule"] ? "#6366F1" : "#94A3B8"}
          />
          <StatCard
            label="WP Rules"
            value={health.byType?.["wordpress-rule"] ?? 0}
            icon={FileText}
            color={health.byType?.["wordpress-rule"] ? "#F59E0B" : "#94A3B8"}
          />
          <StatCard
            label="Max Notes"
            value={(health.byType?.["revenue-max-note"] ?? 0) + (health.byType?.["sales-note"] ?? 0)}
            icon={TrendingUp}
            color={MAX_COLOR}
          />
          <StatCard
            label="Relationships"
            value={(health.byType?.["relationship-note"] ?? 0) + (health.byType?.["contact-csv"] ?? 0)}
            icon={Users}
            color="#F472B6"
          />
          <StatCard
            label="Social Examples"
            value={health.byType?.["social-example"] ?? 0}
            icon={Zap}
            color="#FBBF24"
          />
          <StatCard
            label="Visual Rules"
            value={(health.byType?.["webart-visual-rule"] ?? 0) + (health.byType?.["webedit-clip-rule"] ?? 0)}
            icon={Star}
            color="#A855F7"
          />
        </div>

        {/* Compact Max + ARTBOT Memory Status Strip */}
        {(() => {
          const maxSummary = getMaxMemorySummary();
          const editorialSummary = getEditorialMemorySummary();
          const maxStatus = maxSummary.localStatus === "local-memory-saved"
            ? "Memory saved · Local only"
            : "No memory yet";
          const editorialStatus = editorialSummary.localStatus === "local-memory-saved"
            ? "Memory saved · Local only"
            : "No memory yet";
          return (
            <div className="grid grid-cols-2 gap-2">
              {/* Max strip */}
              <div
                className="rounded-xl border px-3 py-2 flex items-start gap-2"
                style={{ borderColor: `${MAX_COLOR}30`, background: `${MAX_COLOR}08` }}
              >
                <TrendingUp className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: MAX_COLOR }} />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: MAX_COLOR }}>
                    Max Memory
                  </div>
                  <div className="text-[11px] font-semibold mt-0.5 text-foreground/90">
                    {maxSummary.totalItems} item{maxSummary.totalItems !== 1 ? "s" : ""}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {maxSummary.totalItems === 0
                      ? "Add revenue or sales notes to activate"
                      : maxStatus}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: "#94A3B8" }}>
                    CRO · Revenue · Relationships only
                  </div>
                </div>
              </div>
              {/* ARTBOT strip */}
              <div
                className="rounded-xl border px-3 py-2 flex items-start gap-2"
                style={{ borderColor: `${ARTBOT_COLOR}30`, background: `${ARTBOT_COLOR}08` }}
              >
                <Brain className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: ARTBOT_COLOR }} />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: ARTBOT_COLOR }}>
                    Editorial Memory
                  </div>
                  <div className="text-[11px] font-semibold mt-0.5 text-foreground/90">
                    {editorialSummary.totalItems} item{editorialSummary.totalItems !== 1 ? "s" : ""}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {editorialSummary.totalItems === 0
                      ? "Add founder voice or articles to activate"
                      : editorialStatus}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: "#94A3B8" }}>
                    Voice · Brand · Editorial only
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Last Updated</div>
            <div className="text-sm font-bold mt-0.5">{lastUpdatedStr}</div>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Local Storage</div>
            <div
              className="text-sm font-bold mt-0.5"
              style={{
                color:
                  storageStatus.status === "ok"
                    ? "#10B981"
                    : storageStatus.status === "warning"
                      ? "#F59E0B"
                      : "#EF4444",
              }}
            >
              {storageLabel} ({Math.round(storageStatus.pct * 100)}%)
            </div>
          </div>
        </div>

        {health.recommended.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Recommended Next Memory to Add
            </p>
            {health.recommended.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-500/[0.07] px-3 py-2 text-[11px] text-muted-foreground"
              >
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                {r}
              </div>
            ))}
          </div>
        )}

        {health.overall === "strong" && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/[0.07] px-3 py-2 text-[11px] text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
            Memory is well-loaded. All major knowledge types are present.
          </div>
        )}

        {/* Quick seed buttons — always visible */}
        <div className="pt-1 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Quick Seeds — Add Sample Memory
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[11px] gap-1.5"
              onClick={() => {
                seedFounderVoiceSample();
                toast.success("Founder Voice sample added.");
              }}
              data-testid="kb-seed-founder-voice"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Founder Voice Sample
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[11px] gap-1.5"
              onClick={() => {
                seedWordPressRuleSample();
                toast.success("WordPress Rule sample added.");
              }}
              data-testid="kb-seed-wp-rule"
            >
              <Plus className="w-3.5 h-3.5" />
              Add WordPress Rule Sample
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[11px] gap-1.5"
              onClick={() => {
                seedBrandRuleSample();
                toast.success("Brand Rule sample added.");
              }}
              data-testid="kb-seed-brand-rule"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Brand Rule Sample
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-[11px] gap-1.5"
              onClick={() => {
                seedMaxRevenueSample();
                toast.success("Max Revenue Note sample added.");
              }}
              data-testid="kb-seed-max-revenue"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Max Revenue Note Sample
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Seeds add sample entries. Replace content with your actual rules, voice, and notes.
            Max Revenue Note is for Max (CRO/revenue strategy) only — not for WordPress styling.
          </p>
        </div>
      </Section>

      {/* Add Memory Form */}
      <Section
        icon={Plus}
        title="Add Memory"
        subtitle="Paste, type, or upload — then save to the knowledge base"
        color={KB_COLOR}
        defaultOpen={true}
        testId="kb-add"
      >
        {/* Memory Type */}
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Memory Type</Label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_MEMORY_TYPES.map((t) => (
              <Chip
                key={t}
                active={formType === t}
                onClick={() => setFormType(t)}
                color={KB_COLOR}
              >
                {MEMORY_TYPE_LABELS[t]}
              </Chip>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {getRoutingDescription(formType)}
          </p>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Memory Title</Label>
          <Input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="e.g. HMG Founder Voice — Q2 2026"
            maxLength={160}
            data-testid="kb-title"
          />
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Content</Label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{formContent.length.toLocaleString()} chars</span>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.md,.markdown,.json,.csv,text/plain,text/markdown,application/json,text/csv"
                className="hidden"
                onChange={handleFileUpload}
                data-testid="kb-file-input"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-[11px]"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-3 h-3" /> Upload File
              </Button>
            </div>
          </div>
          <Textarea
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            placeholder="Paste founder voice sample, brand rules, article text, sales notes, relationship notes, WordPress rules, or any HMG intelligence…"
            className="min-h-[120px] font-mono text-[12px]"
            data-testid="kb-content"
          />
        </div>

        {/* Brand + Source */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Brand</Label>
            <div className="flex flex-wrap gap-1">
              {brandOptions.map((b) => (
                <Chip
                  key={b}
                  active={formBrand === b}
                  onClick={() => setFormBrand(b)}
                  color={KB_COLOR}
                >
                  {brandLabels[b] ?? b}
                </Chip>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Source</Label>
            <Input
              value={formSource}
              onChange={(e) => setFormSource(e.target.value)}
              placeholder="e.g. Founder notes, interview, document"
              data-testid="kb-source"
            />
          </div>
        </div>

        {/* Tags + Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Tags (comma-separated)</Label>
            <Input
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="voice, tone, editorial, brand"
              data-testid="kb-tags"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Internal Notes</Label>
            <Input
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Context about this memory…"
              data-testid="kb-notes"
            />
          </div>
        </div>

        {/* Where this memory can be used */}
        {formType && (
          <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/[0.06] px-3 py-2 text-[11px] text-indigo-700 dark:text-indigo-300">
            <strong>Where this memory can be used:</strong> {getRoutingDescription(formType)}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !formTitle.trim() || !formContent.trim()}
            className="h-9 gap-1.5 text-[12px] font-bold"
            style={{ background: KB_COLOR, color: "#fff" }}
            data-testid="kb-save"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Save Memory
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={resetForm}
            className="h-9 gap-1.5 text-[11px]"
          >
            <X className="w-3 h-3" /> Clear Form
          </Button>
        </div>
      </Section>

      {/* Max Memory Lane */}
      <Section
        icon={TrendingUp}
        title="Max / Revenue Memory Lane"
        subtitle={`${maxSummary.totalItems} revenue + founder items loaded — Maximillion CRO layer`}
        color={MAX_COLOR}
        defaultOpen={maxSummary.totalItems > 0}
        testId="kb-max-lane"
        badge={maxSummary.totalItems}
      >
        {maxSummary.totalItems === 0 ? (
          <div className="rounded-xl border border-border/40 bg-background/40 px-4 py-6 text-center space-y-2">
            <TrendingUp className="w-8 h-8 mx-auto" style={{ color: MAX_COLOR }} />
            <p className="text-[13px] font-bold">No Max Memory Loaded</p>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Add Resume / Bio, Pitch Deck, Sales Notes, Relationship Notes, Revenue Notes, or
              Contact CSV to activate Max intelligence.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: "Bio / Resume", val: maxSummary.hasBio },
                { label: "Pitch Deck", val: maxSummary.hasPitchDeck },
                { label: "Sales Notes", val: maxSummary.hasSalesNotes },
                { label: "Relationships", val: maxSummary.hasRelationshipNotes },
                { label: "Contacts", val: maxSummary.hasContacts },
                { label: "Revenue Notes", val: maxSummary.hasRevenueNotes },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border/40 bg-background/40 px-3 py-2 flex items-center gap-2"
                >
                  {item.val ? (
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                  ) : (
                    <div className="w-3.5 h-3.5 flex-shrink-0 rounded-full border-2 border-border/60" />
                  )}
                  <span className="text-[11px] font-semibold">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Max Deterministic Previews
              </p>
              {maxPreviews.map((preview) => (
                <div
                  key={preview.label}
                  className="rounded-xl border border-border/40 bg-background/40 px-3 py-2.5 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: MAX_COLOR }}>
                      {preview.label}
                    </span>
                    <HonestBadge status={preview.honestStatus} />
                  </div>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{preview.value}</p>
                  <button
                    type="button"
                    onClick={() => handleCopyText(preview.value, preview.label)}
                    className="text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1 transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Copy prompt
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/[0.07] px-3 py-2 text-[10px] text-muted-foreground">
              <strong className="text-foreground">Honest status:</strong> Local memory saved.
              Deterministic recommendations only. No live outreach. No fake browsing. No fake autonomy.
              Provider hook pending for future AI integration.
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-[11px]"
                onClick={() => {
                  const json = exportMaxMemoryJSON();
                  downloadJSON(json, `hmg-max-memory-${Date.now()}.json`);
                  toast.success("Max memory exported.");
                }}
              >
                <Download className="w-3.5 h-3.5" /> Export Max Memory JSON
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1.5 text-[11px]"
                onClick={() => handleCopyText(buildMemorySummaryText(), "Memory summary")}
              >
                <Copy className="w-3.5 h-3.5" /> Copy Max Summary
              </Button>
            </div>
          </>
        )}
      </Section>

      {/* ARTBOT Editorial Memory Lane */}
      <Section
        icon={Brain}
        title="Editorial Memory Lane"
        subtitle={`${editorialSummary.totalItems} editorial + voice items — content assistant starters`}
        color={ARTBOT_COLOR}
        defaultOpen={editorialSummary.totalItems > 0}
        testId="kb-artbot-lane"
        badge={editorialSummary.totalItems}
      >
        {editorialSummary.totalItems === 0 ? (
          <div className="rounded-xl border border-border/40 bg-background/40 px-4 py-6 text-center space-y-2">
            <Brain className="w-8 h-8 mx-auto" style={{ color: ARTBOT_COLOR }} />
            <p className="text-[13px] font-bold">No Editorial Memory Loaded</p>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Add Founder Voice, Brand Rules, Editorial Rules, Old Articles, or Social Examples to
              activate editorial content starters.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: "Founder Voice", val: editorialSummary.hasFounderVoice },
                { label: "Old Articles", val: editorialSummary.hasOldArticles },
                { label: "Brand Rules", val: editorialSummary.hasBrandRules },
                { label: "Editorial Rules", val: editorialSummary.hasEditorialRules },
                { label: "Social Examples", val: editorialSummary.hasSocialExamples },
                { label: "WordPress Rules", val: editorialSummary.hasWordPressRules },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border/40 bg-background/40 px-3 py-2 flex items-center gap-2"
                >
                  {item.val ? (
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-sky-500" />
                  ) : (
                    <div className="w-3.5 h-3.5 flex-shrink-0 rounded-full border-2 border-border/60" />
                  )}
                  <span className="text-[11px] font-semibold">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Editorial Starter Actions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {artbotActions.map((action) => (
                  <div
                    key={action.label}
                    className="rounded-xl border border-border/40 bg-background/40 px-3 py-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold" style={{ color: ARTBOT_COLOR }}>
                        {action.label}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                          action.honestStatus === "deterministic-starter"
                            ? "border-sky-400/40 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                            : "border-border/40 bg-secondary/40 text-muted-foreground"
                        }`}
                      >
                        {action.honestStatus === "deterministic-starter" ? "Ready" : "Needs Data"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{action.prompt}</p>
                    <button
                      type="button"
                      onClick={() => handleCopyText(action.prompt, action.label)}
                      className="text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1 transition-colors"
                    >
                      <Copy className="w-3 h-3" /> Copy starter
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-sky-400/30 bg-sky-500/[0.07] px-3 py-2 text-[10px] text-muted-foreground">
              <strong className="text-foreground">Honest status:</strong> Editorial Analysis is a content
              assistant. These are deterministic prompt starters based on your loaded memory — not
              AI-generated content. Copy any starter into your article workflow.
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-[11px]"
              onClick={() => {
                const json = exportEditorialMemoryJSON();
                downloadJSON(json, `hmg-editorial-memory-${Date.now()}.json`);
                toast.success("Editorial memory exported.");
              }}
            >
              <Download className="w-3.5 h-3.5" /> Export Editorial Memory JSON
            </Button>
          </>
        )}
      </Section>

      {/* Memory Library */}
      <Section
        icon={Database}
        title="Memory Library"
        subtitle={`${allItems.length} total items saved — search, filter, manage`}
        color={KB_COLOR}
        defaultOpen={allItems.length > 0}
        testId="kb-library"
        badge={allItems.length}
      >
        {allItems.length === 0 ? (
          <div className="rounded-xl border border-border/40 bg-background/40 px-4 py-8 text-center space-y-2">
            <Database className="w-8 h-8 mx-auto text-muted-foreground/40" />
            <p className="text-[13px] font-bold text-muted-foreground">No memory loaded yet</p>
            <p className="text-[11px] text-muted-foreground">Use the Add Memory form above to load your first knowledge item.</p>
          </div>
        ) : (
          <>
            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search memory…"
                  className="pl-8 h-8 text-[12px]"
                  data-testid="kb-search"
                />
              </div>
              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as MemoryType | "all")}
                  className="h-8 rounded-md border border-border/60 bg-background text-[12px] px-2 pr-6 text-foreground"
                  data-testid="kb-filter"
                >
                  <option value="all">All Types</option>
                  {ALL_MEMORY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {MEMORY_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-4">No items match your search.</p>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <MemoryCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    onPin={handlePin}
                    onCopy={handleCopy}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </Section>

      {/* Import / Export */}
      <Section
        icon={Upload}
        title="Import / Export"
        subtitle="Bring in JSON, CSV contacts, or export your full knowledge base"
        color={KB_COLOR}
        defaultOpen={false}
        testId="kb-importexport"
      >
        {/* Import JSON */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Import Memory JSON</Label>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px]"
              onClick={() => setShowImportPanel((v) => !v)}
            >
              {showImportPanel ? "Close" : "Open"}
            </Button>
          </div>
          {showImportPanel && (
            <div className="space-y-2">
              <Textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste exported HMG memory JSON here…"
                className="min-h-[100px] font-mono text-[11px]"
                data-testid="kb-import-json"
              />
              <Button
                size="sm"
                onClick={handleImportJSON}
                disabled={importBusy || !importJson.trim()}
                className="h-8 gap-1.5 text-[11px]"
                style={{ background: KB_COLOR, color: "#fff" }}
                data-testid="kb-import-json-btn"
              >
                {importBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Import JSON
              </Button>
            </div>
          )}
        </div>

        {/* Import CSV */}
        <div className="space-y-1.5">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Import Contact CSV → Max / Relationship Graph
          </Label>
          <p className="text-[10px] text-muted-foreground">
            Columns: name, email, company, role, notes, tags (header row required)
          </p>
          <input
            ref={csvRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportCSVFile}
            data-testid="kb-csv-input"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-[11px]"
            onClick={() => csvRef.current?.click()}
            data-testid="kb-import-csv-btn"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Contact CSV
          </Button>
        </div>

        {/* Export section */}
        <div className="space-y-1.5 pt-2 border-t border-border/30">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Export</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-[11px]"
              onClick={() => {
                const json = exportAllMemoryJSON();
                downloadJSON(json, `hmg-memory-all-${Date.now()}.json`);
                toast.success("All memory exported.");
              }}
              data-testid="kb-export-all"
            >
              <Download className="w-3.5 h-3.5" /> Export All Memory JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-[11px]"
              onClick={() => {
                const json = exportMaxMemoryJSON();
                downloadJSON(json, `hmg-max-memory-${Date.now()}.json`);
                toast.success("Max memory exported.");
              }}
            >
              <Download className="w-3.5 h-3.5" /> Export Max Memory
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-[11px]"
              onClick={() => {
                const json = exportEditorialMemoryJSON();
                downloadJSON(json, `hmg-editorial-memory-${Date.now()}.json`);
                toast.success("Editorial memory exported.");
              }}
            >
              <Download className="w-3.5 h-3.5" /> Export Editorial Memory
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-[11px]"
              onClick={() => handleCopyText(buildMemorySummaryText(), "Memory summary")}
            >
              <Copy className="w-3.5 h-3.5" /> Copy Memory Summary
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 text-[11px]"
              onClick={() => handleCopyText(buildRoutingSummaryText(), "Routing summary")}
            >
              <Copy className="w-3.5 h-3.5" /> Copy Routing Summary
            </Button>
          </div>
        </div>

        {/* Clear All */}
        {allItems.length > 0 && (
          <div className="pt-3 border-t border-border/30 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Danger Zone
            </p>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                  Delete all {allItems.length} memory items? This cannot be undone.
                </span>
                <Button
                  size="sm"
                  className="h-7 gap-1 text-[11px] bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleClearAll}
                  data-testid="kb-clear-confirm"
                >
                  Yes, Clear All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px]"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-[11px] border-red-400/40 text-red-600 hover:bg-red-500/10"
                onClick={() => setConfirmClear(true)}
                data-testid="kb-clear-btn"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All Memory
              </Button>
            )}
          </div>
        )}
      </Section>

      {/* Local Status Footer */}
      <div className="flex items-start gap-2 rounded-lg border border-indigo-400/30 bg-indigo-500/[0.06] px-3 py-2 text-[11px] text-muted-foreground">
        <HardDrive className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: KB_COLOR }} />
        <span>
          <strong className="text-foreground">Local-only storage.</strong> All memory is saved
          in this browser's localStorage. No cloud sync. No server. Export regularly to preserve
          your knowledge base. Future provider hooks are placeholders — no fake connection is
          ever made.
        </span>
      </div>
    </div>
  );
}
