import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hmg-assignments-v1";
const CHANGED_EVENT = "hmg-assignments-changed";
const MAX_ENTRIES = 500;

export const TEAM_MEMBERS = [
  "Marshall",
  "Darry",
  "Kris",
  "Dana",
  "Anna",
] as const;

export type TeamMember = (typeof TEAM_MEMBERS)[number] | string;

export const ASSIGNMENT_STATUSES = [
  "backlog",
  "in-progress",
  "review",
  "approved",
  "blocked",
  "done",
] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  backlog: "Backlog",
  "in-progress": "In Progress",
  review: "Review",
  approved: "Approved",
  blocked: "Blocked",
  done: "Done",
};

export const ASSIGNMENT_STATUS_COLORS: Record<AssignmentStatus, string> = {
  backlog: "#94a3b8",
  "in-progress": "#38bdf8",
  review: "#f59e0b",
  approved: "#a855f7",
  blocked: "#ef4444",
  done: "#10b981",
};

export const ASSIGNMENT_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type AssignmentPriority = (typeof ASSIGNMENT_PRIORITIES)[number];

export interface Assignment {
  id: string;
  title: string;
  silo: string;
  priority: AssignmentPriority;
  assignedTo: TeamMember;
  dueDate: string;
  notes: string;
  attachmentName: string;
  status: AssignmentStatus;
  createdAt: number;
  updatedAt: number;
}

export type AssignmentInput = Omit<
  Assignment,
  "id" | "createdAt" | "updatedAt"
>;

function read(): Assignment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Assignment[]) : [];
  } catch {
    return [];
  }
}

function write(entries: Assignment[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

function makeId() {
  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>(() => read());

  useEffect(() => {
    const handler = () => setAssignments(read());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const add = useCallback((input: AssignmentInput): Assignment => {
    const now = Date.now();
    const next: Assignment = {
      ...input,
      id: makeId(),
      createdAt: now,
      updatedAt: now,
    };
    const list = [next, ...read()].slice(0, MAX_ENTRIES);
    write(list);
    return next;
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<AssignmentInput>) => {
      const list = read().map((a) =>
        a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a,
      );
      write(list);
    },
    [],
  );

  const setStatus = useCallback((id: string, status: AssignmentStatus) => {
    const list = read().map((a) =>
      a.id === id ? { ...a, status, updatedAt: Date.now() } : a,
    );
    write(list);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((a) => a.id !== id));
  }, []);

  return { assignments, add, update, setStatus, remove };
}
