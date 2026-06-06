/**
 * useMaxFollowUpTracker — local relationship follow-up tracking for Max.
 *
 * Storage key: hmg-newsroom-max-followup-tracker-v1
 * No email sent. No CRM connected. Manual follow-up only.
 *
 * Truth: Manual Follow-Up Only | No Email Sent | No CRM Connected
 */
import { useCallback, useEffect, useState } from "react";
import { safeGetJSON, safeSetJSON } from "./safeStorage";

const STORAGE_KEY = "hmg-newsroom-max-followup-tracker-v1";
const MAX_ITEMS = 100;

export type FollowUpStatus =
  | "Needs Follow-Up"
  | "Founder Review"
  | "Follow-Up Done Manually"
  | "Waiting"
  | "Ignore";

export type RelationshipType =
  | "Manager"
  | "Publicist"
  | "Agent"
  | "Brand Contact"
  | "Venue Contact"
  | "Event Organizer"
  | "Artist / Talent"
  | "Sponsor Contact"
  | "Media Partner"
  | "Local Business"
  | "Consultant"
  | "Other";

export interface FollowUpItem {
  id: string;
  createdAt: number;
  updatedAt: number;
  personOrCompany: string;
  relationshipType: RelationshipType;
  reasonForFollowUp: string;
  relatedSourceOrContent: string;
  suggestedMessageAngle: string;
  status: FollowUpStatus;
  notes: string;
}

export type FollowUpInput = Omit<FollowUpItem, "id" | "createdAt" | "updatedAt">;

function readStore(): FollowUpItem[] {
  return safeGetJSON<FollowUpItem[]>(
    STORAGE_KEY,
    (raw): raw is FollowUpItem[] => Array.isArray(raw),
    [],
  );
}

function writeStore(items: FollowUpItem[]) {
  safeSetJSON(STORAGE_KEY, items.slice(0, MAX_ITEMS));
}

let listeners = new Set<(items: FollowUpItem[]) => void>();

function notifyAll(items: FollowUpItem[]) {
  listeners.forEach((cb) => cb(items));
}

export function addFollowUp(input: FollowUpInput): FollowUpItem {
  const item: FollowUpItem = {
    ...input,
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `fu-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const list = readStore();
  list.unshift(item);
  writeStore(list);
  notifyAll(readStore());
  return item;
}

export function updateFollowUpStatus(id: string, status: FollowUpStatus, notes?: string): void {
  const list = readStore();
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return;
  list[idx] = {
    ...list[idx],
    status,
    notes: notes !== undefined ? notes : list[idx].notes,
    updatedAt: Date.now(),
  };
  writeStore(list);
  notifyAll(readStore());
}

export function updateFollowUpNotes(id: string, notes: string): void {
  const list = readStore();
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], notes, updatedAt: Date.now() };
  writeStore(list);
  notifyAll(readStore());
}

export function removeFollowUp(id: string): void {
  const list = readStore().filter((i) => i.id !== id);
  writeStore(list);
  notifyAll(list);
}

export function buildFollowUpBriefText(item: FollowUpItem): string {
  return [
    `MAX FOLLOW-UP BRIEF`,
    `Generated: ${new Date().toLocaleString()}`,
    ``,
    `Person / Company: ${item.personOrCompany}`,
    `Relationship Type: ${item.relationshipType}`,
    `Reason for Follow-Up: ${item.reasonForFollowUp}`,
    `Related Source/Content: ${item.relatedSourceOrContent || "—"}`,
    ``,
    `SUGGESTED MESSAGE ANGLE`,
    item.suggestedMessageAngle,
    ``,
    `Status: ${item.status}`,
    `Notes: ${item.notes || "—"}`,
    ``,
    `--- TRUTH LABELS ---`,
    `Manual Follow-Up Only | No Email Sent | No CRM Connected | Founder Review Required`,
  ].join("\n");
}

export function useMaxFollowUpTracker() {
  const [items, setItems] = useState<FollowUpItem[]>(() => readStore());

  useEffect(() => {
    const listener = (next: FollowUpItem[]) => setItems(next);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const add = useCallback((input: FollowUpInput) => addFollowUp(input), []);
  const setStatus = useCallback(
    (id: string, status: FollowUpStatus, notes?: string) =>
      updateFollowUpStatus(id, status, notes),
    [],
  );
  const updateNotes = useCallback(
    (id: string, notes: string) => updateFollowUpNotes(id, notes),
    [],
  );
  const remove = useCallback((id: string) => removeFollowUp(id), []);

  const needsFollowUp = items.filter((i) => i.status === "Needs Follow-Up");
  const founderReview = items.filter((i) => i.status === "Founder Review");
  const waiting = items.filter((i) => i.status === "Waiting");
  const done = items.filter((i) => i.status === "Follow-Up Done Manually");

  return { items, add, setStatus, updateNotes, remove, needsFollowUp, founderReview, waiting, done };
}
