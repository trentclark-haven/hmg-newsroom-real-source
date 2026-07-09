import { recordAudit } from "./auditLog";
import type { Sponsor } from "./sponsors";
import type { SalesLead } from "./sales";
import type { Assignment } from "./assignments";

/**
 * Sample data writes go directly to localStorage so demos appear without
 * needing the user to be on a particular view. Every demo entry has
 * `__demo: true` so `clearDemoData()` only removes demo rows.
 *
 * Storage keys are NOT changed — we read/write the same lists the live hooks
 * use, then dispatch the matching change events so the React hooks pick up
 * the new rows immediately.
 */

const SPONSOR_KEY = "hmg-sponsors-v1";
const SPONSOR_CHANGED = "hmg-sponsors-changed";
const SALES_KEY = "hmg-sales-v1";
const SALES_CHANGED = "hmg-sales-changed";
const ASSIGNMENT_KEY = "hmg-assignments-v1";
const ASSIGNMENT_CHANGED = "hmg-assignments-changed";

const DEMO_FLAG = "__demo" as const;

interface DemoTagged {
  [DEMO_FLAG]?: true;
}

type DemoSponsor = Sponsor & DemoTagged;
type DemoSalesLead = SalesLead & DemoTagged;
type DemoAssignment = Assignment & DemoTagged;

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[], changedEvent: string) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new Event(changedEvent));
  } catch {
    /* ignore */
  }
}

function makeId(prefix: string) {
  return `${prefix}-demo-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

export function loadDemoSponsor() {
  const list = readList<DemoSponsor>(SPONSOR_KEY);
  const now = Date.now();
  const demo: DemoSponsor = {
    id: makeId("spon"),
    name: "Demo Sponsor — Sample Brewery",
    logoUrl: "",
    websiteUrl: "https://example.com",
    slot: "sidebar-card",
    silo: "hiphophaven",
    active: true,
    startDate: todayIso(),
    endDate: plusDaysIso(30),
    notes: "Demo entry. Click Clear demo data to remove.",
    impressions: 0,
    clicks: 0,
    createdAt: now,
    updatedAt: now,
    [DEMO_FLAG]: true,
  };
  writeList<DemoSponsor>(SPONSOR_KEY, [demo, ...list], SPONSOR_CHANGED);
  recordAudit("sponsor-updated", "system", "Loaded demo sponsor");
}

export function loadDemoSalesLead() {
  const list = readList<DemoSalesLead>(SALES_KEY);
  const now = Date.now();
  const demo: DemoSalesLead = {
    id: makeId("lead"),
    company: "Demo Lead — Coastal Coffee Co.",
    contactName: "Demo Contact",
    contactTitle: "Partnerships Lead",
    contact: "Demo Contact",
    email: "demo@example.com",
    phone: "",
    website: "https://example.com",
    stage: "lead",
    priority: "medium",
    estimatedValue: 1500,
    revenueType: "social_sponsorship",
    brandFit: "MusicHaven local food and beverage sponsor fit",
    source: "demo",
    tags: ["musichaven", "f-and-b"],
    nextFollowUpAt: plusDaysIso(7),
    owner: "Trent",
    category: "F&B",
    interestedSilos: ["musichaven"],
    proposedSpend: "$1,500/mo",
    notes: "Demo lead — clear with the demo button.",
    nextFollowUp: plusDaysIso(7),
    createdAt: now,
    updatedAt: now,
    [DEMO_FLAG]: true,
  };
  writeList<DemoSalesLead>(SALES_KEY, [demo, ...list], SALES_CHANGED);
  recordAudit("sales-updated", "system", "Loaded demo sales lead");
}

export function loadDemoAssignment() {
  const list = readList<DemoAssignment>(ASSIGNMENT_KEY);
  const now = Date.now();
  const demo: DemoAssignment = {
    id: makeId("task"),
    title: "Demo task — Draft NIL recap",
    silo: "sportshaven",
    priority: "medium",
    assignedTo: "Marshall",
    dueDate: plusDaysIso(3),
    notes: "Demo assignment — clear with the demo button.",
    attachmentName: "",
    status: "in-progress",
    createdAt: now,
    updatedAt: now,
    [DEMO_FLAG]: true,
  };
  writeList<DemoAssignment>(ASSIGNMENT_KEY, [demo, ...list], ASSIGNMENT_CHANGED);
  recordAudit("assignment-updated", "system", "Loaded demo assignment");
}

function isDemo(row: unknown): row is DemoTagged {
  return Boolean(
    row && typeof row === "object" && (row as DemoTagged)[DEMO_FLAG] === true,
  );
}

export function clearDemoData(): {
  sponsors: number;
  sales: number;
  assignments: number;
} {
  const sponsors = readList<DemoSponsor>(SPONSOR_KEY);
  const sales = readList<DemoSalesLead>(SALES_KEY);
  const assignments = readList<DemoAssignment>(ASSIGNMENT_KEY);

  const sponsorsKept = sponsors.filter((r) => !isDemo(r));
  const salesKept = sales.filter((r) => !isDemo(r));
  const assignmentsKept = assignments.filter((r) => !isDemo(r));

  const removed = {
    sponsors: sponsors.length - sponsorsKept.length,
    sales: sales.length - salesKept.length,
    assignments: assignments.length - assignmentsKept.length,
  };

  if (removed.sponsors > 0) {
    writeList<DemoSponsor>(SPONSOR_KEY, sponsorsKept, SPONSOR_CHANGED);
  }
  if (removed.sales > 0) {
    writeList<DemoSalesLead>(SALES_KEY, salesKept, SALES_CHANGED);
  }
  if (removed.assignments > 0) {
    writeList<DemoAssignment>(ASSIGNMENT_KEY, assignmentsKept, ASSIGNMENT_CHANGED);
  }

  recordAudit(
    "sample-data-cleared",
    "system",
    `Cleared demos (sponsors ${removed.sponsors}, sales ${removed.sales}, assignments ${removed.assignments})`,
  );

  return removed;
}
