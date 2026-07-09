import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hmg-approvals-v1";
const CHANGED_EVENT = "hmg-approvals-changed";
const MAX_ENTRIES = 500;

export const APPROVAL_STATES = [
  "draft",
  "awaiting-review",
  "approved",
  "published",
  "rejected",
] as const;

export type ApprovalState = (typeof APPROVAL_STATES)[number];

export const APPROVAL_STATE_LABELS: Record<ApprovalState, string> = {
  draft: "Draft",
  "awaiting-review": "Awaiting Review",
  approved: "Approved",
  published: "Ready for Manual Publish",
  rejected: "Rejected",
};

export const APPROVAL_STATE_COLORS: Record<ApprovalState, string> = {
  draft: "#94a3b8",
  "awaiting-review": "#f59e0b",
  approved: "#10b981",
  published: "#38bdf8",
  rejected: "#ef4444",
};

export interface ApprovalRecord {
  id: string;
  articleId: string;
  silo: string;
  title: string;
  state: ApprovalState;
  reviewNotes: string;
  approvedBy: string;
  approvedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

function read(): ApprovalRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ApprovalRecord[]) : [];
  } catch {
    return [];
  }
}

function write(entries: ApprovalRecord[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

function makeId() {
  return `apv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Stable per-article id derived from silo + slug/title. Pure function so
 * other components can compute the same id without storing it. Including the
 * silo prevents two different silos with the same slug from colliding.
 */
export function articleKey(silo: string, seed: string): string {
  const siloPart = silo.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "unknown";
  const cleaned = seed.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const seedPart = cleaned ? cleaned.slice(0, 64) : "empty";
  return `art-${siloPart}-${seedPart}`;
}

export function useApprovals() {
  const [records, setRecords] = useState<ApprovalRecord[]>(() => read());

  useEffect(() => {
    const handler = () => setRecords(read());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const findByArticle = useCallback(
    (articleId: string): ApprovalRecord | undefined =>
      read().find((r) => r.articleId === articleId),
    [],
  );

  const submitForReview = useCallback(
    (articleId: string, silo: string, title: string): ApprovalRecord => {
      const list = read();
      const existing = list.find((r) => r.articleId === articleId);
      const now = Date.now();
      if (existing) {
        const next = list.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                state: "awaiting-review" as ApprovalState,
                title,
                silo,
                updatedAt: now,
              }
            : r,
        );
        write(next);
        return next.find((r) => r.id === existing.id)!;
      }
      const created: ApprovalRecord = {
        id: makeId(),
        articleId,
        silo,
        title,
        state: "awaiting-review",
        reviewNotes: "",
        approvedBy: "",
        approvedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      const next = [created, ...list].slice(0, MAX_ENTRIES);
      write(next);
      return created;
    },
    [],
  );

  const approve = useCallback(
    (articleId: string, approvedBy: string, reviewNotes = "") => {
      const now = Date.now();
      const list = read().map((r) =>
        r.articleId === articleId
          ? {
              ...r,
              state: "approved" as ApprovalState,
              approvedBy,
              approvedAt: now,
              reviewNotes: reviewNotes || r.reviewNotes,
              updatedAt: now,
            }
          : r,
      );
      write(list);
    },
    [],
  );

  const reject = useCallback((articleId: string, reviewNotes = "") => {
    const now = Date.now();
    const list = read().map((r) =>
      r.articleId === articleId
        ? {
            ...r,
            state: "rejected" as ApprovalState,
            reviewNotes,
            updatedAt: now,
          }
        : r,
    );
    write(list);
  }, []);

  const markPublished = useCallback((articleId: string) => {
    const now = Date.now();
    const list = read().map((r) =>
      r.articleId === articleId
        ? { ...r, state: "published" as ApprovalState, updatedAt: now }
        : r,
    );
    write(list);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((r) => r.id !== id));
  }, []);

  return {
    records,
    findByArticle,
    submitForReview,
    approve,
    reject,
    markPublished,
    remove,
  };
}
