import { useCallback, useEffect, useState } from "react";
import type { Overlay } from "./artbotOverlays";

/**
 * WebArt Frame / Template Library.
 *
 * A "frame" is a reusable full layout SYSTEM — distinct from the overlay bank
 * (which stores individual reusable elements). Saving a frame captures the whole
 * visual composition style: brand silo, header family, premium frame style,
 * selected export sizes, headline and the overlay stack — but NOT the base
 * image. An operator builds a branded look once, then applies it onto any new
 * photo or story for a repeatable HMG social identity.
 */

export const FRAME_LIBRARY_KEY = "hmg-artbot-frame-library-v1";
const LIBRARY_MAX = 24;

/** An overlay as stored in a saved frame — geometry + content, no live id. */
export type SavedFrameOverlay = Omit<Overlay, "id">;

export interface SavedFrame {
  id: string;
  name: string;
  /** Brand silo the frame was built for (for label + accent mapping). */
  silo: string;
  familyId: string;
  frameStyleId: string;
  sizeIds: string[];
  headline: string;
  overlays: SavedFrameOverlay[];
  savedAt: number;
}

export interface SaveFrameInput {
  name: string;
  silo: string;
  familyId: string;
  frameStyleId: string;
  sizeIds: string[];
  headline: string;
  overlays: Overlay[];
}

let seq = 0;
function uid(): string {
  seq += 1;
  return `fr_${Date.now().toString(36)}_${seq.toString(36)}`;
}

function readLibrary(): SavedFrame[] {
  try {
    const raw = localStorage.getItem(FRAME_LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedFrame[]) : [];
  } catch {
    return [];
  }
}

function writeLibrary(items: SavedFrame[]): boolean {
  try {
    localStorage.setItem(FRAME_LIBRARY_KEY, JSON.stringify(items.slice(0, LIBRARY_MAX)));
    return true;
  } catch {
    // storage full / unavailable — non-fatal, caller is told it failed
    return false;
  }
}

/**
 * Persistent frame library (localStorage). Capped low because a frame can carry
 * overlay screenshots; storage-full is reported back so the UI can warn.
 */
export function useFrameLibrary() {
  const [items, setItems] = useState<SavedFrame[]>(() => readLibrary());

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === FRAME_LIBRARY_KEY) setItems(readLibrary());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const save = useCallback((input: SaveFrameInput): boolean => {
    const frame: SavedFrame = {
      id: uid(),
      name: input.name,
      silo: input.silo,
      familyId: input.familyId,
      frameStyleId: input.frameStyleId,
      sizeIds: [...input.sizeIds],
      headline: input.headline,
      overlays: input.overlays.map(({ id: _id, ...rest }) => rest),
      savedAt: Date.now(),
    };
    let ok = true;
    setItems((prev) => {
      const next = [frame, ...prev].slice(0, LIBRARY_MAX);
      ok = writeLibrary(next);
      return ok ? next : prev;
    });
    return ok;
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((f) => f.id !== id);
      writeLibrary(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    writeLibrary([]);
  }, []);

  return { items, save, remove, clear };
}

let overlaySeq = 0;
function overlayUid(): string {
  overlaySeq += 1;
  return `ov_${Date.now().toString(36)}_${overlaySeq.toString(36)}`;
}

/** Rebuild live overlays (with fresh ids) from a saved frame. */
export function instantiateFrameOverlays(frame: SavedFrame): Overlay[] {
  return frame.overlays.map((o) => ({ ...o, id: overlayUid() }));
}
