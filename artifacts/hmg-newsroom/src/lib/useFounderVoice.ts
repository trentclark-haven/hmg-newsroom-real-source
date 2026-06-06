import { useCallback, useEffect, useState } from "react";
import type { Silo } from "@workspace/api-client-react";
import { FOUNDER_VOICE_DEFAULTS } from "./trent-voice-profile";

const STORAGE_KEY = "hmg-founder-voice-v1";
const CHANGED_EVENT = "hmg-founder-voice-changed";

type FounderVoiceMap = Partial<Record<Silo, boolean>>;

function read(): FounderVoiceMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as FounderVoiceMap)
      : {};
  } catch {
    return {};
  }
}

function write(map: FounderVoiceMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    // localStorage quota / disabled — ignore.
  }
}

/** Read the effective founder-voice flag for a silo, falling back to the per-silo default. */
export function getFounderVoice(silo: Silo): boolean {
  const map = read();
  if (silo in map && typeof map[silo] === "boolean") {
    return map[silo] as boolean;
  }
  return FOUNDER_VOICE_DEFAULTS[silo] ?? false;
}

export function setFounderVoice(silo: Silo, enabled: boolean) {
  const map = read();
  map[silo] = enabled;
  write(map);
}

export function useFounderVoice(
  silo: Silo,
): [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => getFounderVoice(silo));
  useEffect(() => {
    setEnabled(getFounderVoice(silo));
    const handler = () => setEnabled(getFounderVoice(silo));
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [silo]);
  const update = useCallback(
    (next: boolean) => {
      setFounderVoice(silo, next);
      setEnabled(next);
    },
    [silo],
  );
  return [enabled, update];
}

/**
 * Hook that exposes the full per-silo founder-voice map plus an updater.
 * Used by the AI Staff view to render a per-silo toggle grid.
 */
export function useFounderVoiceMap(): {
  map: FounderVoiceMap;
  effective: (silo: Silo) => boolean;
  set: (silo: Silo, enabled: boolean) => void;
  resetAll: () => void;
} {
  const [map, setMap] = useState<FounderVoiceMap>(() => read());
  useEffect(() => {
    const handler = () => setMap(read());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return {
    map,
    effective: (silo: Silo) => {
      if (silo in map && typeof map[silo] === "boolean") {
        return map[silo] as boolean;
      }
      return FOUNDER_VOICE_DEFAULTS[silo] ?? false;
    },
    set: (silo: Silo, enabled: boolean) => {
      setFounderVoice(silo, enabled);
    },
    resetAll: () => {
      write({});
    },
  };
}
