/**
 * HMG Operator Roster — Multi-User Readiness Layer
 *
 * Defines the Operator model, Work Item model, and local simulation.
 * This is honest: single-device local mode only.
 * No fake live users. No fake sync. Backend contract is clearly staged.
 *
 * When a real backend ships, replace safeGetJSON/safeSetJSON with API calls.
 */

import { safeGetJSON, safeSetJSON } from "@/lib/safeStorage";

export const OPERATOR_ROLES_V2 = [
  "founder",
  "editor",
  "visual-operator",
  "clip-operator",
  "social-operator",
  "revenue-operator",
  "admin",
  "trainee",
  "reviewer",
] as const;

export type OperatorRoleV2 = (typeof OPERATOR_ROLES_V2)[number];

export const ROLE_LABELS_V2: Record<OperatorRoleV2, string> = {
  founder: "Founder",
  editor: "Editor",
  "visual-operator": "Visual Operator",
  "clip-operator": "Clip Operator",
  "social-operator": "Social Operator",
  "revenue-operator": "Revenue Operator",
  admin: "Admin",
  trainee: "Trainee",
  reviewer: "Reviewer",
};

export const ROLE_DESKS: Record<OperatorRoleV2, string[]> = {
  founder: ["Command Center", "Ask Max", "ARTBOT", "WebArt", "Founder KB"],
  editor: ["Editorial Desk", "ARTBOT", "WordPress Builder", "SEO Master"],
  "visual-operator": ["WebArt", "Clip+Brand", "Media Library"],
  "clip-operator": ["WebEdit", "Clip+Brand", "Media Library"],
  "social-operator": ["Social Factory", "Output History"],
  "revenue-operator": ["Ask Max", "Sales Pipeline", "Founder KB"],
  admin: ["All desks"],
  trainee: ["Editorial Desk"],
  reviewer: ["Output History", "Assignments"],
};

export type Silo =
  | "hmg"
  | "hiphophaven"
  | "raphaven"
  | "musichaven"
  | "sportshaven"
  | "fithaven"
  | "cannahaven";

export type OperatorStatus = "active" | "idle" | "away" | "offline";

export interface Operator {
  id: string;
  name: string;
  initials: string;
  role: OperatorRoleV2;
  assignedBrand: Silo | "all";
  activeDesk: string;
  status: OperatorStatus;
  lastActivity: number;
  permissionsTier: 1 | 2 | 3 | 4;
}

export type WorkItemType =
  | "article"
  | "visual"
  | "cut-note"
  | "social"
  | "wordpress-draft"
  | "revenue-note"
  | "memory-item";

export type WorkItemStatus =
  | "draft"
  | "needs-review"
  | "ready"
  | "blocked"
  | "saved"
  | "exported"
  | "archived";

export interface WorkItem {
  id: string;
  type: WorkItemType;
  brand: Silo;
  title: string;
  status: WorkItemStatus;
  ownerId: string;
  reviewerId: string | null;
  createdAt: number;
  updatedAt: number;
  source: string;
  outputRefs: string[];
}

const ROSTER_KEY = "hmg-operator-roster-v1";
const WORK_ITEMS_KEY = "hmg-work-items-v1";

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function isValidRoster(raw: unknown): raw is Operator[] {
  return Array.isArray(raw);
}

function isValidWorkItems(raw: unknown): raw is WorkItem[] {
  return Array.isArray(raw);
}

export const SAMPLE_OPERATORS: Operator[] = [
  {
    id: "op_founder",
    name: "Founder",
    initials: "F",
    role: "founder",
    assignedBrand: "all",
    activeDesk: "Command Center",
    status: "active",
    lastActivity: Date.now(),
    permissionsTier: 4,
  },
  {
    id: "op_editor_hip",
    name: "Hip-Hop Editor",
    initials: "HH",
    role: "editor",
    assignedBrand: "hiphophaven",
    activeDesk: "Editorial Desk",
    status: "idle",
    lastActivity: Date.now() - 1000 * 60 * 15,
    permissionsTier: 3,
  },
  {
    id: "op_visual_1",
    name: "Visual Lead",
    initials: "VL",
    role: "visual-operator",
    assignedBrand: "all",
    activeDesk: "WebArt",
    status: "idle",
    lastActivity: Date.now() - 1000 * 60 * 30,
    permissionsTier: 2,
  },
  {
    id: "op_social_1",
    name: "Social Operator",
    initials: "SO",
    role: "social-operator",
    assignedBrand: "sportshaven",
    activeDesk: "Social Factory",
    status: "offline",
    lastActivity: Date.now() - 1000 * 60 * 60 * 2,
    permissionsTier: 2,
  },
  {
    id: "op_revenue_1",
    name: "Revenue Operator",
    initials: "RO",
    role: "revenue-operator",
    assignedBrand: "all",
    activeDesk: "Ask Max",
    status: "offline",
    lastActivity: Date.now() - 1000 * 60 * 60 * 4,
    permissionsTier: 3,
  },
  {
    id: "op_clip_1",
    name: "Clip Operator",
    initials: "CO",
    role: "clip-operator",
    assignedBrand: "musichaven",
    activeDesk: "WebEdit",
    status: "offline",
    lastActivity: Date.now() - 1000 * 60 * 60 * 8,
    permissionsTier: 2,
  },
  {
    id: "op_trainee_1",
    name: "Editorial Trainee",
    initials: "ET",
    role: "trainee",
    assignedBrand: "raphaven",
    activeDesk: "Editorial Desk",
    status: "offline",
    lastActivity: Date.now() - 1000 * 60 * 60 * 24,
    permissionsTier: 1,
  },
  {
    id: "op_reviewer_1",
    name: "Content Reviewer",
    initials: "CR",
    role: "reviewer",
    assignedBrand: "all",
    activeDesk: "Output History",
    status: "offline",
    lastActivity: Date.now() - 1000 * 60 * 60 * 48,
    permissionsTier: 1,
  },
  {
    id: "op_editor_sports",
    name: "Sports Editor",
    initials: "SE",
    role: "editor",
    assignedBrand: "sportshaven",
    activeDesk: "Editorial Desk",
    status: "offline",
    lastActivity: Date.now() - 1000 * 60 * 60 * 72,
    permissionsTier: 3,
  },
];

export function readRoster(): Operator[] {
  const saved = safeGetJSON<Operator[]>(ROSTER_KEY, isValidRoster, []);
  if (saved.length === 0) return SAMPLE_OPERATORS;
  return saved;
}

export function writeRoster(roster: Operator[]): void {
  safeSetJSON(ROSTER_KEY, roster);
}

export function readWorkItems(): WorkItem[] {
  return safeGetJSON<WorkItem[]>(WORK_ITEMS_KEY, isValidWorkItems, []);
}

export function writeWorkItems(items: WorkItem[]): void {
  safeSetJSON(WORK_ITEMS_KEY, items);
}

export function addWorkItem(
  input: Omit<WorkItem, "id" | "createdAt" | "updatedAt">,
): WorkItem {
  const items = readWorkItems();
  const now = Date.now();
  const item: WorkItem = {
    ...input,
    id: generateId("wi"),
    createdAt: now,
    updatedAt: now,
  };
  writeWorkItems([item, ...items].slice(0, 500));
  return item;
}

export function updateWorkItemStatus(id: string, status: WorkItemStatus): boolean {
  const items = readWorkItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  items[idx] = { ...items[idx], status, updatedAt: Date.now() };
  writeWorkItems(items);
  return true;
}

export function getWorkItemStats() {
  const items = readWorkItems();
  return {
    total: items.length,
    byStatus: {
      draft: items.filter((i) => i.status === "draft").length,
      "needs-review": items.filter((i) => i.status === "needs-review").length,
      ready: items.filter((i) => i.status === "ready").length,
      blocked: items.filter((i) => i.status === "blocked").length,
      saved: items.filter((i) => i.status === "saved").length,
      exported: items.filter((i) => i.status === "exported").length,
      archived: items.filter((i) => i.status === "archived").length,
    },
    byType: {
      article: items.filter((i) => i.type === "article").length,
      visual: items.filter((i) => i.type === "visual").length,
      "cut-note": items.filter((i) => i.type === "cut-note").length,
      social: items.filter((i) => i.type === "social").length,
      "wordpress-draft": items.filter((i) => i.type === "wordpress-draft").length,
      "revenue-note": items.filter((i) => i.type === "revenue-note").length,
      "memory-item": items.filter((i) => i.type === "memory-item").length,
    },
  };
}

export const FUTURE_BACKEND_CONTRACTS = [
  {
    feature: "Queue Items",
    description: "Shared work queue visible to all operators",
    contract: "POST /api/queue/items",
    readiness: "api-contract-ready",
  },
  {
    feature: "Work Assignments",
    description: "Assign work items to operators by role + brand",
    contract: "PATCH /api/queue/items/:id/assign",
    readiness: "api-contract-ready",
  },
  {
    feature: "Edit Locking",
    description: "Prevent two operators from editing the same item",
    contract: "POST /api/queue/items/:id/lock",
    readiness: "architecture-staged",
  },
  {
    feature: "Review Status",
    description: "Mark items as reviewed, approved, or blocked",
    contract: "PATCH /api/queue/items/:id/review",
    readiness: "api-contract-ready",
  },
  {
    feature: "Comments",
    description: "Per-item threaded notes between operators",
    contract: "POST /api/queue/items/:id/comments",
    readiness: "future",
  },
  {
    feature: "Activity Log",
    description: "Real-time feed of who did what across the newsroom",
    contract: "GET /api/activity",
    readiness: "api-contract-ready",
  },
  {
    feature: "Conflict Detection",
    description: "Alert if two operators touch the same draft",
    contract: "GET /api/queue/conflicts",
    readiness: "architecture-staged",
  },
  {
    feature: "Live Multiplayer Sync",
    description: "Real-time collaborative editing",
    contract: "WebSocket /ws/sync",
    readiness: "future",
  },
];
