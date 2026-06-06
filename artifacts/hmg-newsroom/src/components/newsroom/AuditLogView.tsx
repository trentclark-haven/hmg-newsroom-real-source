import { useMemo, useState } from "react";
import {
  AUDIT_ACTION_LABELS,
  useAuditLog,
  type AuditAction,
} from "@/lib/auditLog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollText, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ACTION_TONE: Record<string, string> = {
  "publish-success": "text-emerald-300 bg-emerald-500/15 border-emerald-500/40",
  "publish-failure": "text-red-300 bg-red-500/15 border-red-500/40",
  "publish-attempt": "text-sky-300 bg-sky-500/15 border-sky-500/40",
  "wp-credentials-updated": "text-amber-300 bg-amber-500/15 border-amber-500/40",
  "image-generated": "text-violet-300 bg-violet-500/15 border-violet-500/40",
  "clip-packaged": "text-pink-300 bg-pink-500/15 border-pink-500/40",
  "article-created": "text-foreground/80 bg-foreground/5 border-border/40",
  "article-edited": "text-foreground/80 bg-foreground/5 border-border/40",
  "sponsor-updated": "text-amber-300 bg-amber-500/15 border-amber-500/40",
  "assignment-updated": "text-violet-300 bg-violet-500/15 border-violet-500/40",
  "sales-updated": "text-emerald-300 bg-emerald-500/15 border-emerald-500/40",
  "approval-updated": "text-sky-300 bg-sky-500/15 border-sky-500/40",
};

export function AuditLogView() {
  const { entries, clear } = useAuditLog();
  const [filter, setFilter] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return entries.filter((e) => {
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (!q) return true;
      return (
        e.summary.toLowerCase().includes(q) ||
        e.silo.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q)
      );
    });
  }, [entries, filter, actionFilter]);

  function handleClear() {
    if (
      !window.confirm(
        `Delete all ${entries.length} audit log entries? This cannot be undone.`,
      )
    )
      return;
    clear();
    toast.success("Audit log cleared");
  }

  return (
    <div
      data-testid="auditlog-view"
      className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-4 overflow-y-auto"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-500 text-foreground">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight leading-none">
              Audit Log
            </h2>
            <p className="text-[11px] text-muted-foreground mt-1">
              {entries.length} entries · last 500 retained · secrets redacted
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={entries.length === 0}
          className="h-9 text-[11px]"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Input
          placeholder="Filter…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-9 max-w-[200px]"
          aria-label="Filter audit log"
        />
        <select
          value={actionFilter}
          onChange={(e) =>
            setActionFilter(e.target.value as AuditAction | "all")
          }
          className="h-9 rounded-md border border-border/60 bg-secondary/40 px-2 text-[12px]"
          aria-label="Filter by action"
        >
          <option value="all">All actions</option>
          {Object.entries(AUDIT_ACTION_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border/60 bg-secondary/30 divide-y divide-border/30">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-muted-foreground italic">
            No audit entries match the current filter.
          </p>
        ) : (
          filtered.map((e, idx) => {
            const tone =
              ACTION_TONE[e.action] ??
              "text-foreground/80 bg-foreground/5 border-border/40";
            return (
              <div
                key={e.id}
                data-testid={`auditlog-row-${idx}`}
                className="px-3 py-2 flex items-start gap-2"
              >
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border whitespace-nowrap ${tone}`}
                >
                  {AUDIT_ACTION_LABELS[e.action] ?? e.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-foreground/90 break-words">
                    {e.summary}
                  </p>
                  <div className="text-[10px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-2">
                    <span>{new Date(e.ts).toLocaleString()}</span>
                    {e.silo && <span>silo: {e.silo}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
