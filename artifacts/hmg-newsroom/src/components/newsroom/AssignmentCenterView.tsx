import { useMemo, useState } from "react";
import {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_STATUS_COLORS,
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_PRIORITIES,
  TEAM_MEMBERS,
  useAssignments,
  type Assignment,
  type AssignmentPriority,
  type AssignmentStatus,
} from "@/lib/assignments";
import { verticals } from "@/lib/mock-data";
import { recordAudit } from "@/lib/auditLog";
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
  CheckSquare,
  ChevronRight,
  Edit3,
  Paperclip,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = {
  title: "",
  silo: "hmg",
  priority: "medium" as AssignmentPriority,
  assignedTo: TEAM_MEMBERS[0] as string,
  dueDate: "",
  notes: "",
  attachmentName: "",
  status: "backlog" as AssignmentStatus,
};

export function AssignmentCenterView() {
  const { assignments, add, update, setStatus, remove } = useAssignments();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const byStatus = useMemo(() => {
    const map: Record<AssignmentStatus, Assignment[]> = Object.fromEntries(
      ASSIGNMENT_STATUSES.map((s) => [s, [] as Assignment[]]),
    ) as Record<AssignmentStatus, Assignment[]>;
    for (const a of assignments) {
      if (map[a.status]) map[a.status].push(a);
    }
    return map;
  }, [assignments]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(a: Assignment) {
    setEditing(a);
    setForm({
      title: a.title,
      silo: a.silo,
      priority: a.priority,
      assignedTo: a.assignedTo,
      dueDate: a.dueDate,
      notes: a.notes,
      attachmentName: a.attachmentName,
      status: a.status,
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (editing) {
      update(editing.id, form);
      recordAudit(
        "assignment-updated",
        form.silo,
        `Updated task "${form.title}" → ${form.status} (${form.assignedTo})`,
      );
      toast.success("Task updated");
    } else {
      const created = add(form);
      recordAudit(
        "assignment-updated",
        form.silo,
        `Created task "${created.title}" → ${form.assignedTo}`,
      );
      toast.success("Task added");
    }
    setOpen(false);
  }

  function handleDelete(a: Assignment) {
    if (!window.confirm(`Delete task "${a.title}"?`)) return;
    remove(a.id);
    recordAudit(
      "assignment-updated",
      a.silo,
      `Removed task "${a.title}"`,
    );
    toast.success("Task removed");
  }

  function shiftStatus(a: Assignment) {
    const idx = ASSIGNMENT_STATUSES.indexOf(a.status);
    const next = ASSIGNMENT_STATUSES[idx + 1] ?? ASSIGNMENT_STATUSES[0];
    setStatus(a.id, next);
    recordAudit(
      "assignment-updated",
      a.silo,
      `Moved "${a.title}" to ${next}`,
    );
  }

  return (
    <div
      data-testid="assignments-view"
      className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-4 overflow-y-auto"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-500 text-white">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight leading-none">
              Assignment Center
            </h2>
            <p className="text-[11px] text-muted-foreground mt-1">
              Delegate to Marshall, Darry, Kris, Dana, Anna + contractors
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={openNew}
          data-testid="assignments-add-btn"
          className="h-9 text-[11px]"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> New task
        </Button>
      </div>

      <div className="space-y-2.5">
        {ASSIGNMENT_STATUSES.map((status) => {
          const list = byStatus[status];
          const color = ASSIGNMENT_STATUS_COLORS[status];
          return (
            <div
              key={status}
              data-testid={`assignment-status-${status}`}
              className="rounded-xl border border-border/60 bg-secondary/30 overflow-hidden"
            >
              <div
                className="px-3 py-2 flex items-center justify-between"
                style={{ background: `${color}1A` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: color }}
                  />
                  <span
                    className="text-[12px] font-bold uppercase tracking-wider"
                    style={{ color }}
                  >
                    {ASSIGNMENT_STATUS_LABELS[status]}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {list.length}
                </span>
              </div>
              {list.length === 0 ? (
                <p className="px-3 py-2 text-[11px] text-muted-foreground/70 italic">
                  No tasks
                </p>
              ) : (
                <div className="divide-y divide-border/30">
                  {list.map((a) => (
                    <AssignmentCard
                      key={a.id}
                      task={a}
                      onEdit={() => openEdit(a)}
                      onDelete={() => handleDelete(a)}
                      onShift={() => shiftStatus(a)}
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
              {editing ? "Edit task" : "New task"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
            <Row label="Title">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="h-9"
              />
            </Row>
            <div className="grid grid-cols-2 gap-2">
              <Row label="Silo">
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
                </select>
              </Row>
              <Row label="Priority">
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value as AssignmentPriority,
                    })
                  }
                  className="h-9 w-full rounded-md border border-border/60 bg-secondary/40 px-2 text-[12px] capitalize"
                >
                  {ASSIGNMENT_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Row>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Row label="Assigned to">
                <select
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({ ...form, assignedTo: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-border/60 bg-secondary/40 px-2 text-[12px]"
                >
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Due date">
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="h-9"
                />
              </Row>
            </div>
            <Row label="Status">
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as AssignmentStatus,
                  })
                }
                className="h-9 w-full rounded-md border border-border/60 bg-secondary/40 px-2 text-[12px]"
              >
                {ASSIGNMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ASSIGNMENT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Row>
            <Row label="Attachment (filename only — placeholder)">
              <Input
                value={form.attachmentName}
                onChange={(e) =>
                  setForm({ ...form, attachmentName: e.target.value })
                }
                className="h-9"
                placeholder="brief-v2.pdf"
              />
            </Row>
            <Row label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="min-h-[60px] text-[12px]"
              />
            </Row>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              data-testid="assignments-save-btn"
            >
              {editing ? "Save" : "Add task"}
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
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

const PRIORITY_TONE: Record<AssignmentPriority, string> = {
  low: "bg-muted/30 text-muted-foreground",
  medium: "bg-sky-500/15 text-sky-300",
  high: "bg-amber-500/15 text-amber-300",
  urgent: "bg-red-500/15 text-red-300",
};

function AssignmentCard({
  task: a,
  onEdit,
  onDelete,
  onShift,
}: {
  task: Assignment;
  onEdit: () => void;
  onDelete: () => void;
  onShift: () => void;
}) {
  return (
    <div
      data-testid={`assignment-card-${a.id}`}
      className="px-3 py-2 flex items-start gap-2"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] font-bold text-foreground/90">
            {a.title}
          </span>
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${PRIORITY_TONE[a.priority]}`}
          >
            {a.priority}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground mt-0.5">
          <span className="inline-flex items-center gap-1">
            <User className="w-2.5 h-2.5" />
            {a.assignedTo}
          </span>
          {a.silo && <span>silo: {a.silo}</span>}
          {a.dueDate && <span>due {a.dueDate}</span>}
          {a.attachmentName && (
            <span className="inline-flex items-center gap-0.5">
              <Paperclip className="w-2.5 h-2.5" /> {a.attachmentName}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onShift}
        aria-label="Advance status"
        className="p-1.5 rounded hover:bg-foreground/5"
        title="Advance to next status"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit task"
        className="p-1.5 rounded hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
      >
        <Edit3 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete task"
        className="p-1.5 rounded hover:bg-foreground/5 text-muted-foreground hover:text-red-300"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
