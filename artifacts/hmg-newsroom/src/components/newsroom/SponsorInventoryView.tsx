import { useMemo, useState } from "react";
import {
  SPONSOR_SLOTS,
  SPONSOR_SLOT_LABELS,
  isExpired,
  isExpiringSoon,
  useSponsors,
  type Sponsor,
  type SponsorSlot,
} from "@/lib/sponsors";
import { recordAudit } from "@/lib/auditLog";
import { verticals } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Briefcase,
  CalendarClock,
  CircleSlash,
  Edit3,
  ExternalLink,
  MousePointerClick,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = {
  name: "",
  logoUrl: "",
  websiteUrl: "",
  slot: SPONSOR_SLOTS[0] as SponsorSlot,
  silo: "hmg",
  active: true,
  startDate: "",
  endDate: "",
  notes: "",
};

export function SponsorInventoryView() {
  const { sponsors, add, update, remove } = useSponsors();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const grouped = useMemo(() => {
    const map: Record<SponsorSlot, Sponsor[]> = Object.fromEntries(
      SPONSOR_SLOTS.map((s) => [s, [] as Sponsor[]]),
    ) as Record<SponsorSlot, Sponsor[]>;
    for (const s of sponsors) {
      if (map[s.slot]) map[s.slot].push(s);
    }
    return map;
  }, [sponsors]);

  const expiringSoon = sponsors.filter((s) => isExpiringSoon(s));
  const expired = sponsors.filter((s) => isExpired(s));

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(s: Sponsor) {
    setEditing(s);
    setForm({
      name: s.name,
      logoUrl: s.logoUrl,
      websiteUrl: s.websiteUrl,
      slot: s.slot,
      silo: s.silo,
      active: s.active,
      startDate: s.startDate,
      endDate: s.endDate,
      notes: s.notes,
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error("Sponsor name is required.");
      return;
    }
    if (editing) {
      update(editing.id, form);
      recordAudit("sponsor-updated", form.silo, `Updated sponsor "${form.name}" (${form.slot})`);
      toast.success("Sponsor updated");
    } else {
      const created = add(form);
      recordAudit("sponsor-updated", form.silo, `Added sponsor "${created.name}" (${created.slot})`);
      toast.success("Sponsor added");
    }
    setOpen(false);
  }

  function handleDelete(s: Sponsor) {
    if (!window.confirm(`Delete sponsor "${s.name}"?`)) return;
    remove(s.id);
    recordAudit("sponsor-updated", s.silo, `Removed sponsor "${s.name}"`);
    toast.success("Sponsor removed");
  }

  return (
    <div
      data-testid="sponsor-inventory"
      className="rounded-xl border border-border/60 bg-secondary/30 p-3 mb-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Sponsor Inventory
          </span>
          <span className="text-[10px] text-muted-foreground ml-1">
            {sponsors.filter((s) => s.active).length} active · {sponsors.length} total
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={openNew}
          data-testid="sponsor-add-btn"
          className="h-8 text-[11px]"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add sponsor
        </Button>
      </div>

      {(expiringSoon.length > 0 || expired.length > 0) && (
        <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1.5 mb-2 flex items-center gap-2">
          <CalendarClock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <p className="text-[11px] text-amber-700 dark:text-amber-200">
            {expired.length > 0 && (
              <span className="font-bold">{expired.length} expired</span>
            )}
            {expired.length > 0 && expiringSoon.length > 0 && " · "}
            {expiringSoon.length > 0 && (
              <span>{expiringSoon.length} expiring within 14 days</span>
            )}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {SPONSOR_SLOTS.map((slot) => {
          const list = grouped[slot];
          return (
            <div
              key={slot}
              data-testid={`sponsor-slot-${slot}`}
              className="rounded-md border border-border/40 bg-secondary/40"
            >
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
                  {SPONSOR_SLOT_LABELS[slot]}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {list.length === 0 ? "empty" : `${list.length} filled`}
                </span>
              </div>
              {list.length === 0 ? (
                <div className="px-2 py-1.5 text-[11px] text-muted-foreground/70 italic flex items-center gap-1.5">
                  <CircleSlash className="w-3 h-3" />
                  No sponsor assigned to this slot
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {list.map((s) => (
                    <SponsorRow
                      key={s.id}
                      sponsor={s}
                      onEdit={() => openEdit(s)}
                      onDelete={() => handleDelete(s)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-background border-border/60">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editing ? "Edit sponsor" : "Add sponsor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
            <FormRow label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-9"
              />
            </FormRow>
            <FormRow label="Logo URL">
              <Input
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                className="h-9"
                placeholder="https://…/logo.png"
              />
            </FormRow>
            <FormRow label="Website URL">
              <Input
                value={form.websiteUrl}
                onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                className="h-9"
                placeholder="https://sponsor.com"
              />
            </FormRow>
            <div className="grid grid-cols-2 gap-2">
              <FormRow label="Slot">
                <select
                  value={form.slot}
                  onChange={(e) =>
                    setForm({ ...form, slot: e.target.value as SponsorSlot })
                  }
                  className="h-9 w-full rounded-md border border-border/60 bg-secondary/40 px-2 text-[12px]"
                >
                  {SPONSOR_SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {SPONSOR_SLOT_LABELS[s]}
                    </option>
                  ))}
                </select>
              </FormRow>
              <FormRow label="Silo">
                <select
                  value={form.silo}
                  onChange={(e) => setForm({ ...form, silo: e.target.value })}
                  className="h-9 w-full rounded-md border border-border/60 bg-secondary/40 px-2 text-[12px]"
                >
                  {verticals.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                  <option value="all">All silos</option>
                </select>
              </FormRow>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormRow label="Start date">
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="h-9"
                />
              </FormRow>
              <FormRow label="End date">
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="h-9"
                />
              </FormRow>
            </div>
            <FormRow label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="min-h-[60px] text-[12px]"
              />
            </FormRow>
            <label className="flex items-center gap-2 text-[12px] text-foreground/90">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Active
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} data-testid="sponsor-save-btn">
              {editing ? "Save changes" : "Add sponsor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SponsorRow({
  sponsor: s,
  onEdit,
  onDelete,
}: {
  sponsor: Sponsor;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const expired = isExpired(s);
  const expiring = isExpiringSoon(s);

  return (
    <div
      data-testid={`sponsor-card-${s.id}`}
      className="px-2 py-2 flex items-center gap-2"
    >
      <div className="w-8 h-8 rounded-md bg-secondary/60 border border-border/40 flex items-center justify-center overflow-hidden shrink-0">
        {s.logoUrl ? (
          <img
            src={s.logoUrl}
            alt={s.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold text-foreground/90 truncate">
            {s.name}
          </span>
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
              s.active
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                : "bg-muted/40 text-muted-foreground border-border/40"
            }`}
          >
            {s.active ? "active" : "inactive"}
          </span>
          {expired && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-red-500/15 text-red-300 border-red-500/40">
              expired
            </span>
          )}
          {!expired && expiring && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-amber-500/15 text-amber-300 border-amber-500/40">
              expiring
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground mt-0.5">
          {s.silo && <span>silo: {s.silo}</span>}
          {s.endDate && <span>ends {s.endDate}</span>}
          <span className="inline-flex items-center gap-0.5">
            <Eye className="w-2.5 h-2.5" /> {s.impressions}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <MousePointerClick className="w-2.5 h-2.5" /> {s.clicks}
          </span>
          {s.websiteUrl && (
            <a
              href={s.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-emerald-300/80 hover:text-emerald-700 dark:text-emerald-200"
            >
              <ExternalLink className="w-2.5 h-2.5" /> site
            </a>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit sponsor"
        className="p-1.5 rounded hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
      >
        <Edit3 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete sponsor"
        className="p-1.5 rounded hover:bg-foreground/5 text-muted-foreground hover:text-red-300"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
