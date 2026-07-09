import { useCallback, useEffect, useState } from "react";
import type { View } from "@/components/newsroom/MenuOverlay";

const STORAGE_KEY = "hmg-role-preset-v1";
const CHANGED_EVENT = "hmg-role-preset-changed";

export const ROLES = [
  "founder",
  "editor",
  "writer",
  "sales",
  "video",
  "developer",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  founder: "Founder",
  editor: "Editor",
  writer: "Writer",
  sales: "Sales",
  video: "Video",
  developer: "Developer",
};

/**
 * Per-role ordering preference. Items NOT listed here will render after the
 * preset block, in their original MENU_ITEMS order. This means no menu items
 * are ever hidden — only re-prioritised.
 */
export const ROLE_PRESETS: Record<Role, View[]> = {
  founder: [
    "commandcenter",
    "newsroom",
    "auditlog",
    "sales",
    "assignments",
    "wpconnections",
  ],
  editor: [
    "newsroom",
    "assignments",
    "auditlog",
    "medialibrary",
    "commandcenter",
  ],
  writer: [
    "newsroom",
    "seomaster",
    "aistaff",
    "medialibrary",
  ],
  sales: [
    "sales",
    "commandcenter",
    "assignments",
    "auditlog",
  ],
  video: [
    "cutmaster",
    "clipbrand",
    "stationscheduler",
    "artbot",
    "medialibrary",
    "newsroom",
  ],
  developer: [
    "commandcenter",
    "auditlog",
    "wpconnections",
    "newsroom",
  ],
};

function read(): Role {
  if (typeof window === "undefined") return "founder";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && (ROLES as readonly string[]).includes(raw)) return raw as Role;
  } catch {
    /* ignore */
  }
  return "founder";
}

function write(role: Role) {
  try {
    window.localStorage.setItem(STORAGE_KEY, role);
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export function useRolePreset() {
  const [role, setRoleState] = useState<Role>(() => read());

  useEffect(() => {
    const handler = () => setRoleState(read());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const setRole = useCallback((next: Role) => {
    write(next);
  }, []);

  return { role, setRole };
}

/**
 * Pure helper: given the master list of menu views (in their canonical order),
 * return them ordered for the chosen role. Items in the preset come first in
 * preset order; remaining items keep their original order.
 */
export function orderForRole<T extends { id: View }>(
  items: readonly T[],
  role: Role,
): T[] {
  const preset = ROLE_PRESETS[role];
  const byId = new Map(items.map((it) => [it.id, it]));
  const out: T[] = [];
  const seen = new Set<View>();
  for (const id of preset) {
    const it = byId.get(id);
    if (it) {
      out.push(it);
      seen.add(id);
    }
  }
  for (const it of items) {
    if (!seen.has(it.id)) out.push(it);
  }
  return out;
}
