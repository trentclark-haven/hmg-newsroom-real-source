/**
 * Local operator identity. Lightweight stand-in for full auth — lets the
 * audit log, assignments, approvals, and publish attempts attribute work to a
 * named human even before SSO ships. Local-only; never sent to the server.
 */

import { useCallback, useEffect, useState } from "react";
import { safeGet, safeSet, safeRemove } from "./safeStorage";

const STORAGE_KEY = "hmg-operator-profile-v1";
const CHANGED_EVENT = "hmg-operator-profile-changed";

export const OPERATOR_ROLES = [
  "founder",
  "editor",
  "writer",
  "producer",
  "sales",
  "developer",
] as const;
export type OperatorRole = (typeof OPERATOR_ROLES)[number];

export interface OperatorProfile {
  name: string;
  role: OperatorRole;
  initials: string;
}

function defaultProfile(): OperatorProfile {
  return { name: "", role: "founder", initials: "" };
}

function deriveInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("").slice(0, 4);
}

function read(): OperatorProfile {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) return defaultProfile();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultProfile();
    const p = parsed as Partial<OperatorProfile>;
    const name = typeof p.name === "string" ? p.name.slice(0, 48) : "";
    const role: OperatorRole = (OPERATOR_ROLES as readonly string[]).includes(
      String(p.role),
    )
      ? (p.role as OperatorRole)
      : "founder";
    const initials =
      typeof p.initials === "string" && p.initials.length > 0
        ? p.initials.slice(0, 4).toUpperCase()
        : deriveInitials(name);
    return { name, role, initials };
  } catch {
    return defaultProfile();
  }
}

function write(profile: OperatorProfile): void {
  const ok = safeSet(STORAGE_KEY, JSON.stringify(profile));
  if (ok) {
    try {
      window.dispatchEvent(new Event(CHANGED_EVENT));
    } catch {
      /* ignore */
    }
  }
}

/**
 * Module-level read for non-React call sites (audit recorder, ledger). Returns
 * empty initials if no profile is set; callers must tolerate that.
 */
export function getOperatorInitials(): string {
  return read().initials;
}

export function getOperatorProfile(): OperatorProfile {
  return read();
}

export function clearOperatorProfile(): void {
  safeRemove(STORAGE_KEY);
  try {
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export function useOperatorProfile() {
  const [profile, setProfileState] = useState<OperatorProfile>(() => read());
  useEffect(() => {
    const handler = () => setProfileState(read());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const setProfile = useCallback((next: Partial<OperatorProfile>) => {
    const current = read();
    const merged: OperatorProfile = {
      name: (next.name ?? current.name).slice(0, 48),
      role: (next.role ?? current.role) as OperatorRole,
      initials:
        next.initials != null
          ? next.initials.slice(0, 4).toUpperCase()
          : deriveInitials(next.name ?? current.name),
    };
    write(merged);
  }, []);

  const clear = useCallback(() => {
    clearOperatorProfile();
  }, []);

  return { profile, setProfile, clear };
}

export const OPERATOR_PROFILE_DERIVE_INITIALS = deriveInitials;
