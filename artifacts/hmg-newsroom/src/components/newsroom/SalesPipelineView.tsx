import { useMemo, useState } from "react";
import {
  LEAD_PRIORITIES,
  LEAD_PRIORITY_LABELS,
  REVENUE_TYPES,
  REVENUE_TYPE_LABELS,
  SALES_STAGES,
  SALES_STAGE_COLORS,
  SALES_STAGE_LABELS,
  useSalesPipeline,
  type LeadPriority,
  type RevenueType,
  type SalesLead,
  type SalesLeadInput,
  type SalesStage,
} from "@/lib/sales";
import { verticals } from "@/lib/mock-data";
import { recordAudit } from "@/lib/auditLog";
import { MaximillionExecutiveDesk } from "@/components/newsroom/sales/MaximillionExecutiveDesk";
import { formatCurrency } from "@/components/newsroom/sales/mockMaximillionData";
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
  Banknote,
  Briefcase,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface LeadFormState {
  company: string;
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  website: string;
  brandFit: string;
  revenueType: RevenueType;
  estimatedValue: string;
  stage: SalesStage;
  priority: LeadPriority;
  notes: string;
  nextFollowUpAt: string;
  source: string;
  owner: string;
  tagsInput: string;
  interestedSilos: string[];
}

const EMPTY_FORM: LeadFormState = {
  company: "",
  contactName: "",
  contactTitle: "",
  email: "",
  phone: "",
  website: "",
  brandFit: "",
  revenueType: "social_sponsorship",
  estimatedValue: "",
  stage: "lead",
  priority: "medium",
  notes: "",
  nextFollowUpAt: "",
  source: "",
  owner: "Trent",
  tagsInput: "",
  interestedSilos: [],
};

const inputClass = "h-9 text-[12px]";
const selectClass =
  "h-9 w-full rounded-md border border-border/60 bg-secondary/40 px-2 text-[12px]";

export function SalesPipelineView() {
  const { leads, add, update, moveStage, remove } = useSalesPipeline();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SalesLead | null>(null);
  const [form, setForm] = useState<LeadFormState>(EMPTY_FORM);

  const byStage = useMemo(() => {
    const map: Record<SalesStage, SalesLead[]> = Object.fromEntries(
      SALES_STAGES.map((stage) => [stage, [] as SalesLead[]]),
    ) as Record<SalesStage, SalesLead[]>;
    for (const lead of leads) {
      if (map[lead.stage]) map[lead.stage].push(lead);
    }
    return map;
  }, [leads]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(lead: SalesLead) {
    setEditing(lead);
    setForm({
      company: lead.company,
      contactName: lead.contactName,
      contactTitle: lead.contactTitle,
      email: lead.email,
      phone: lead.phone,
      website: lead.website,
      brandFit: lead.brandFit,
      revenueType: lead.revenueType,
      estimatedValue: lead.estimatedValue ? String(lead.estimatedValue) : "",
      stage: lead.stage,
      priority: lead.priority,
      notes: lead.notes,
      nextFollowUpAt: lead.nextFollowUpAt,
      source: lead.source,
      owner: lead.owner,
      tagsInput: lead.tags.join(", "),
      interestedSilos: lead.interestedSilos,
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.company.trim()) {
      toast.error("Company is required.");
      return;
    }

    const input = buildLeadInput(form);
    if (editing) {
      update(editing.id, input);
      recordAudit(
        "sales-updated",
        input.interestedSilos?.[0] ?? "hmg",
        `Updated lead "${input.company}" -> ${SALES_STAGE_LABELS[input.stage]}`,
      );
      toast.success("Lead updated");
    } else {
      const created = add(input);
      recordAudit(
        "sales-updated",
        created.interestedSilos[0] ?? "hmg",
        `Added lead "${created.company}" (${SALES_STAGE_LABELS[created.stage]})`,
      );
      toast.success("Lead added");
    }
    setOpen(false);
  }

  function handleAddSuggestedLead(
    input: SalesLeadInput,
    sourceLabel: string,
  ) {
    const created = add(input);
    recordAudit(
      "sales-updated",
      created.interestedSilos[0] ?? "hmg",
      `Added Maximillion suggested lead "${created.company}" from ${sourceLabel}`,
    );
    toast.success(`${created.company} added to pipeline`);
  }

  function handleDelete(lead: SalesLead) {
    if (!window.confirm(`Delete lead "${lead.company}"?`)) return;
    remove(lead.id);
    recordAudit(
      "sales-updated",
      lead.interestedSilos[0] ?? "hmg",
      `Removed lead "${lead.company}"`,
    );
    toast.success("Lead removed");
  }

  function shiftStage(lead: SalesLead, dir: 1 | -1) {
    const idx = SALES_STAGES.indexOf(lead.stage);
    const next = SALES_STAGES[idx + dir];
    if (!next) return;
    moveStage(lead.id, next);
    recordAudit(
      "sales-updated",
      lead.interestedSilos[0] ?? "hmg",
      `Moved "${lead.company}" to ${SALES_STAGE_LABELS[next]}`,
    );
  }

  function toggleSilo(silo: string) {
    setForm((current) => {
      const has = current.interestedSilos.includes(silo);
      return {
        ...current,
        interestedSilos: has
          ? current.interestedSilos.filter((item) => item !== silo)
          : [...current.interestedSilos, silo],
      };
    });
  }

  return (
    <div
      data-testid="sales-view"
      className="flex-1 flex flex-col min-h-0 px-3 sm:px-4 pt-3 pb-4 overflow-y-auto"
    >
      <MaximillionExecutiveDesk className="mb-3" />

      <section
        id="maximillion-crm-board"
        className="mt-3 rounded-lg border border-border/60 bg-secondary/30 p-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-300" />
              <h2 className="text-sm font-black tracking-tight">
                Pipeline Board
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {leads.length} leads · {byStage.closed_won.length} won · six CRM stages preserved
            </p>
          </div>
          <Button
            size="sm"
            onClick={openNew}
            data-testid="sales-add-btn"
            className="h-10 text-[11px]"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> New lead
          </Button>
        </div>

        <div className="grid gap-2 xl:grid-cols-3">
          {SALES_STAGES.map((stage) => {
            const list = byStage[stage];
            const color = SALES_STAGE_COLORS[stage];
            return (
              <div
                key={stage}
                data-testid={`sales-stage-${stage.replaceAll("_", "-")}`}
                className="rounded-lg border border-border/60 bg-secondary/30 overflow-hidden min-w-0"
              >
                <div
                  className="px-3 py-2 flex items-center justify-between"
                  style={{ background: `${color}1A` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: color }}
                    />
                    <span
                      className="text-[12px] font-bold uppercase tracking-wider truncate"
                      style={{ color }}
                    >
                      {SALES_STAGE_LABELS[stage]}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {list.length}
                  </span>
                </div>
                {list.length === 0 ? (
                  <p className="px-3 py-3 text-[11px] text-muted-foreground/70 italic">
                    No leads in this stage
                  </p>
                ) : (
                  <div className="divide-y divide-border/30">
                    {list.map((lead) => (
                      <SalesCard
                        key={lead.id}
                        lead={lead}
                        onEdit={() => openEdit(lead)}
                        onDelete={() => handleDelete(lead)}
                        onShift={(dir) => shiftStage(lead, dir)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl bg-background border-border/60">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editing ? "Edit revenue lead" : "New revenue lead"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[74vh] overflow-y-auto pr-1">
            <div className="grid gap-2 sm:grid-cols-3">
              <Row label="Company">
                <Input
                  value={form.company}
                  onChange={(event) =>
                    setForm({ ...form, company: event.target.value })
                  }
                  className={inputClass}
                />
              </Row>
              <Row label="Contact name">
                <Input
                  value={form.contactName}
                  onChange={(event) =>
                    setForm({ ...form, contactName: event.target.value })
                  }
                  className={inputClass}
                />
              </Row>
              <Row label="Contact title">
                <Input
                  value={form.contactTitle}
                  onChange={(event) =>
                    setForm({ ...form, contactTitle: event.target.value })
                  }
                  className={inputClass}
                />
              </Row>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Row label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  className={inputClass}
                />
              </Row>
              <Row label="Phone">
                <Input
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  className={inputClass}
                />
              </Row>
              <Row label="Website">
                <Input
                  type="url"
                  value={form.website}
                  onChange={(event) =>
                    setForm({ ...form, website: event.target.value })
                  }
                  className={inputClass}
                  placeholder="https://"
                />
              </Row>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Row label="Revenue type">
                <select
                  value={form.revenueType}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      revenueType: event.target.value as RevenueType,
                    })
                  }
                  className={selectClass}
                >
                  {REVENUE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {REVENUE_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Estimated value">
                <Input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form.estimatedValue}
                  onChange={(event) =>
                    setForm({ ...form, estimatedValue: event.target.value })
                  }
                  className={inputClass}
                  placeholder="25000"
                />
              </Row>
              <Row label="Priority">
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      priority: event.target.value as LeadPriority,
                    })
                  }
                  className={selectClass}
                >
                  {LEAD_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {LEAD_PRIORITY_LABELS[priority]}
                    </option>
                  ))}
                </select>
              </Row>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Row label="Stage">
                <select
                  value={form.stage}
                  onChange={(event) =>
                    setForm({ ...form, stage: event.target.value as SalesStage })
                  }
                  className={selectClass}
                >
                  {SALES_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {SALES_STAGE_LABELS[stage]}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Next follow-up date">
                <Input
                  type="date"
                  value={form.nextFollowUpAt}
                  onChange={(event) =>
                    setForm({ ...form, nextFollowUpAt: event.target.value })
                  }
                  className={inputClass}
                />
              </Row>
              <Row label="Source">
                <Input
                  value={form.source}
                  onChange={(event) =>
                    setForm({ ...form, source: event.target.value })
                  }
                  className={inputClass}
                  placeholder="referral, event, outbound"
                />
              </Row>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Row label="Owner">
                <Input
                  value={form.owner}
                  onChange={(event) =>
                    setForm({ ...form, owner: event.target.value })
                  }
                  className={inputClass}
                />
              </Row>
              <Row label="Tags">
                <Input
                  value={form.tagsInput}
                  onChange={(event) =>
                    setForm({ ...form, tagsInput: event.target.value })
                  }
                  className={inputClass}
                  placeholder="sports, beverage, LA"
                />
              </Row>
            </div>

            <Row label="Brand fit">
              <Textarea
                value={form.brandFit}
                onChange={(event) =>
                  setForm({ ...form, brandFit: event.target.value })
                }
                className="min-h-[64px] text-[12px]"
                placeholder="Why this company fits HMG, SportsHaven, CannaHaven, MusicHaven..."
              />
            </Row>

            <Row label="Haven brands">
              <div className="flex flex-wrap gap-1.5">
                {verticals.map((vertical) => {
                  const on = form.interestedSilos.includes(vertical.id);
                  return (
                    <button
                      key={vertical.id}
                      type="button"
                      onClick={() => toggleSilo(vertical.id)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
                        on
                          ? "border-transparent text-foreground"
                          : "border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                      style={on ? { background: vertical.color } : undefined}
                    >
                      {vertical.name}
                    </button>
                  );
                })}
              </div>
            </Row>

            <Row label="Notes">
              <Textarea
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
                className="min-h-[72px] text-[12px]"
              />
            </Row>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} data-testid="sales-save-btn">
              {editing ? "Save" : "Add lead"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1 min-w-0">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SalesCard({
  lead,
  onEdit,
  onDelete,
  onShift,
}: {
  lead: SalesLead;
  onEdit: () => void;
  onDelete: () => void;
  onShift: (dir: 1 | -1) => void;
}) {
  const idx = SALES_STAGES.indexOf(lead.stage);
  return (
    <div
      data-testid={`sales-card-${lead.id}`}
      className="px-3 py-2.5 flex items-start gap-2"
    >
      <Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] font-bold truncate max-w-full">
            {lead.company}
          </span>
          {lead.estimatedValue > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300">
              <Banknote className="w-3 h-3" />
              {formatCurrency(lead.estimatedValue)}
            </span>
          )}
          {lead.priority !== "medium" && (
            <span className="rounded-full border border-amber-300/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-200">
              {LEAD_PRIORITY_LABELS[lead.priority]}
            </span>
          )}
        </div>

        <div className="text-[10px] text-muted-foreground truncate mt-0.5">
          {[lead.contactName, lead.contactTitle, lead.email].filter(Boolean).join(" · ") ||
            "No contact recorded"}
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/15 bg-emerald-400/[0.04] px-2 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-100">
            <Tag className="w-3 h-3" />
            {REVENUE_TYPE_LABELS[lead.revenueType]}
          </span>
          {lead.nextFollowUpAt && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/15 bg-amber-300/[0.04] px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-100">
              <CalendarClock className="w-3 h-3" />
              {lead.nextFollowUpAt}
            </span>
          )}
        </div>
        {lead.notes && (
          <p className="mt-1.5 text-[10px] leading-relaxed text-foreground/70 line-clamp-2">
            {lead.notes}
          </p>
        )}
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => onShift(-1)}
          disabled={idx === 0}
          aria-label="Move stage back"
          className="min-h-10 min-w-10 p-1.5 rounded hover:bg-foreground/5 disabled:opacity-30"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onShift(1)}
          disabled={idx === SALES_STAGES.length - 1}
          aria-label="Move stage forward"
          className="min-h-10 min-w-10 p-1.5 rounded hover:bg-foreground/5 disabled:opacity-30"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit lead"
          className="min-h-10 min-w-10 p-1.5 rounded hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete lead"
          className="min-h-10 min-w-10 p-1.5 rounded hover:bg-foreground/5 text-muted-foreground hover:text-red-300"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function buildLeadInput(form: LeadFormState): SalesLeadInput {
  const estimatedValue = parseEstimatedValue(form.estimatedValue);
  const tagList = form.tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const tags = Array.from(new Set([...tagList, ...form.interestedSilos]));
  const brandFit =
    form.brandFit.trim() ||
    form.interestedSilos
      .map((id) => verticals.find((vertical) => vertical.id === id)?.name)
      .filter(Boolean)
      .join(", ");

  return {
    company: form.company.trim(),
    contactName: form.contactName.trim(),
    contactTitle: form.contactTitle.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    website: form.website.trim(),
    stage: form.stage,
    priority: form.priority,
    estimatedValue,
    revenueType: form.revenueType,
    brandFit,
    source: form.source.trim(),
    tags,
    notes: form.notes.trim(),
    nextFollowUpAt: form.nextFollowUpAt,
    owner: form.owner.trim() || "Trent",
    contact: form.contactName.trim(),
    category: brandFit || REVENUE_TYPE_LABELS[form.revenueType],
    interestedSilos: form.interestedSilos,
    proposedSpend: estimatedValue ? formatCurrency(estimatedValue) : "",
    nextFollowUp: form.nextFollowUpAt,
  };
}

function parseEstimatedValue(value: string): number {
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
}
