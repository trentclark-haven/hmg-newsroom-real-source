import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Database, ChevronDown, ChevronRight, ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import {
  SAVED_FACT_KINDS,
  addSavedFact,
  listSavedFacts,
  removeSavedFact,
  type SavedFact,
  type SavedFactKind,
  type TrustLevel,
} from "@/lib/hmg/editorial";

interface SavedFactsPanelProps {
  brand: string;
  accent: string;
  onAccent: string;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}

export function SavedFactsPanel({
  brand,
  accent,
  onAccent,
  selectedIds,
  onToggleSelect,
}: SavedFactsPanelProps) {
  const [facts, setFacts] = useState<SavedFact[]>([]);
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<SavedFactKind>("person");
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");
  const [topic, setTopic] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [trust, setTrust] = useState<TrustLevel>("reported");

  useEffect(() => {
    setFacts(listSavedFacts(brand));
  }, [brand]);

  const refresh = () => setFacts(listSavedFacts(brand));

  const handleAdd = () => {
    if (!label.trim()) return;
    addSavedFact({
      kind,
      label: label.trim(),
      detail: detail.trim(),
      tags: [],
      brand,
      topic: topic.trim() || undefined,
      sourceName: sourceName.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      trust,
      summary: detail.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    setLabel("");
    setDetail("");
    setTopic("");
    setSourceName("");
    setSourceUrl("");
    setTrust("reported");
    setAdding(false);
    refresh();
  };

  const handleRemove = (id: string) => {
    removeSavedFact(id);
    refresh();
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/40" data-testid="saved-facts-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 p-3 hover:bg-foreground/5 rounded-t-xl transition-colors"
        data-testid="saved-facts-toggle"
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" style={{ color: accent }} />
          <h3 className="text-sm font-bold tracking-tight">Saved Facts</h3>
          <span className="text-[10px] text-muted-foreground">
            {facts.length} saved · {selectedIds.length} selected
          </span>
        </div>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          <p className="text-[11px] text-muted-foreground leading-snug">
            Reusable facts the desk should remember — people, brands, dates, claims to avoid. Selected facts fold into the next article draft.
          </p>

          {facts.length > 0 && (
            <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1" data-testid="saved-facts-list">
              {facts.map((f) => {
                const selected = selectedIds.includes(f.id);
                const kindLabel = SAVED_FACT_KINDS.find((k) => k.id === f.kind)?.label ?? f.kind;
                return (
                  <li
                    key={f.id}
                    className="flex items-start gap-2 rounded-md border border-border/40 bg-background/40 p-2"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(f.id)}
                      className="mt-1"
                      aria-label={`Use ${f.label}`}
                      data-testid={`saved-fact-toggle-${f.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{ background: `${accent}22`, color: accent }}
                        >
                          {kindLabel}
                        </span>
                        {f.trust && (
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${
                              f.trust === "verified"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : f.trust === "reported"
                                  ? "bg-sky-500/15 text-sky-300"
                                  : "bg-amber-500/15 text-amber-300"
                            }`}
                            data-testid={`saved-fact-trust-${f.id}`}
                          >
                            {f.trust === "verified" ? (
                              <ShieldCheck className="w-2.5 h-2.5" />
                            ) : f.trust === "reported" ? (
                              <Shield className="w-2.5 h-2.5" />
                            ) : (
                              <ShieldAlert className="w-2.5 h-2.5" />
                            )}
                            {f.trust}
                          </span>
                        )}
                        {f.topic && (
                          <span className="text-[10px] text-muted-foreground italic">{f.topic}</span>
                        )}
                        <p className="text-[13px] font-semibold truncate flex-1 min-w-0">{f.label}</p>
                      </div>
                      {f.detail && (
                        <p className="text-[12px] text-muted-foreground leading-snug mt-0.5">{f.detail}</p>
                      )}
                      {(f.sourceName || f.sourceUrl) && (
                        <p className="text-[10px] text-muted-foreground/80 leading-snug mt-0.5">
                          {f.sourceName ?? "source"}
                          {f.sourceUrl ? ` · ${f.sourceUrl}` : ""}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-red-400 p-1"
                      onClick={() => handleRemove(f.id)}
                      aria-label="Remove fact"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {adding ? (
            <div className="rounded-md border border-dashed border-border/60 bg-background/40 p-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {SAVED_FACT_KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    className={`h-7 px-2.5 rounded-full text-[10px] font-semibold border transition-colors ${
                      kind === k.id
                        ? "border-transparent"
                        : "border-border/60 text-muted-foreground"
                    }`}
                    style={kind === k.id ? { background: accent, color: onAccent } : undefined}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Label (name, brand, date, claim to avoid)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                data-testid="saved-fact-label"
              />
              <Textarea
                placeholder="Detail (optional context the desk should remember)"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className="min-h-[80px] text-sm"
                data-testid="saved-fact-detail"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Topic (e.g. album rollout)"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  data-testid="saved-fact-topic"
                />
                <Input
                  placeholder="Source name (e.g. Variety)"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  data-testid="saved-fact-source-name"
                />
              </div>
              <Input
                placeholder="Source URL (optional)"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                data-testid="saved-fact-source-url"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Trust level
                </span>
                {(["verified", "reported", "unconfirmed"] as TrustLevel[]).map((t) => {
                  const isActive = trust === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTrust(t)}
                      data-testid={`saved-fact-trust-pick-${t}`}
                      className={`h-7 px-2 rounded-full text-[10px] font-semibold border ${
                        isActive
                          ? "border-transparent"
                          : "border-border/60 text-muted-foreground"
                      }`}
                      style={isActive ? { background: accent, color: onAccent } : undefined}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!label.trim()}
                  style={label.trim() ? { background: accent, color: onAccent } : undefined}
                  className="h-8 text-[11px]"
                  data-testid="saved-fact-save"
                >
                  Save fact
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAdding(false);
                    setLabel("");
                    setDetail("");
                  }}
                  className="h-8 text-[11px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAdding(true)}
              className="h-8 text-[11px]"
              data-testid="saved-facts-add"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add a saved fact
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
