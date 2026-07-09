/**
 * Mobile lifecycle gate. When the page is hidden / frozen / backgrounded,
 * pause registered timers and polls so we don't burn CPU on locked phones.
 * Resume cleanly on visibilitychange → visible.
 */

import { recordAudit } from "./auditLog";

export type LifecyclePhase = "active" | "inactive";

interface PauseHandlers {
  onPause: () => void;
  onResume: () => void;
}

const handlers = new Set<PauseHandlers>();
let currentPhase: LifecyclePhase = "active";
let lastTransitionAt = Date.now();
let installed = false;

function transition(next: LifecyclePhase) {
  if (next === currentPhase) return;
  currentPhase = next;
  lastTransitionAt = Date.now();
  if (next === "inactive") {
    for (const h of handlers) {
      try {
        h.onPause();
      } catch {
        /* ignore */
      }
    }
    try {
      recordAudit("app-backgrounded", "system", "tab hidden / frozen");
    } catch {
      /* ignore */
    }
  } else {
    for (const h of handlers) {
      try {
        h.onResume();
      } catch {
        /* ignore */
      }
    }
    try {
      recordAudit("app-resumed", "system", "tab visible / resumed");
    } catch {
      /* ignore */
    }
  }
}

export function installMobileLifecycle(): () => void {
  if (typeof document === "undefined") return () => undefined;
  if (installed) return () => undefined;
  installed = true;
  const onVis = () => transition(document.hidden ? "inactive" : "active");
  const onFreeze = () => transition("inactive");
  const onResumeEvt = () => transition("active");
  const onPageHide = () => transition("inactive");
  document.addEventListener("visibilitychange", onVis);
  document.addEventListener("freeze", onFreeze as EventListener);
  document.addEventListener("resume", onResumeEvt as EventListener);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onResumeEvt);
  return () => {
    installed = false;
    document.removeEventListener("visibilitychange", onVis);
    document.removeEventListener("freeze", onFreeze as EventListener);
    document.removeEventListener("resume", onResumeEvt as EventListener);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onResumeEvt);
  };
}

export function registerLifecycleHandlers(h: PauseHandlers): () => void {
  handlers.add(h);
  return () => {
    handlers.delete(h);
  };
}

export function getLifecyclePhase(): LifecyclePhase {
  return currentPhase;
}

export function getLastTransitionAt(): number {
  return lastTransitionAt;
}

export function isAppActive(): boolean {
  return currentPhase === "active";
}
