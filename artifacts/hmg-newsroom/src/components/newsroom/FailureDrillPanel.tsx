import { useState } from "react";
import {
  AlertTriangle,
  Bug,
  Power,
  WifiOff,
  Zap,
  Image as ImageIcon,
  Mic,
  Cloud,
  HardDrive,
  FileWarning,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDebugMode } from "@/lib/debugMode";
import { startJob, completeJob } from "@/lib/jobLedger";
import { recordAudit } from "@/lib/auditLog";
import {
  estimateUsage,
  safeSet,
  safeGetJSON,
  safeRemove,
  SAFE_STORAGE_QUOTA_EVENT,
} from "@/lib/safeStorage";
import { captureSnapshot } from "@/lib/recoverySnapshots";
import { getOperatorInitials } from "@/lib/operatorProfile";

type DrillId =
  | "ai-timeout"
  | "ai-429"
  | "ai-500"
  | "image-failure"
  | "transcription-failure"
  | "wp-401"
  | "wp-500"
  | "storage-quota"
  | "malformed-import"
  | "offline-mode";

interface DrillSpec {
  id: DrillId;
  label: string;
  Icon: typeof Bug;
  run: () => string; // returns success message
}

function fakeFailJob(
  kind:
    | "text-ai"
    | "image-ai"
    | "transcribe"
    | "wp-publish",
  errorCode: string,
  summary: string,
): void {
  const op = getOperatorInitials() || null;
  const id = startJob({
    kind,
    silo: "drill",
    summary: `[DRILL] ${summary}`,
    operator: op,
  });
  // Tiny delay so the running→failure transition is visible in the ledger.
  window.setTimeout(() => {
    completeJob(id, {
      status: "failure",
      error: { code: errorCode, name: errorCode },
    });
  }, 250);
}

const DRILLS: DrillSpec[] = [
  {
    id: "ai-timeout",
    label: "AI timeout",
    Icon: Zap,
    run: () => {
      fakeFailJob("text-ai", "ai_timeout", "Drill: AI request timed out");
      recordAudit("safe-mode-blocked", "drill", "[DRILL] AI timeout");
      return "Simulated AI timeout — ledger entry recorded as failure.";
    },
  },
  {
    id: "ai-429",
    label: "AI 429 (rate limit)",
    Icon: AlertTriangle,
    run: () => {
      fakeFailJob("text-ai", "rate_limited", "Drill: AI rate-limited");
      recordAudit("safe-mode-blocked", "drill", "[DRILL] AI 429");
      return "Simulated AI rate-limit — UI shows safe error, draft preserved.";
    },
  },
  {
    id: "ai-500",
    label: "AI 500",
    Icon: AlertTriangle,
    run: () => {
      fakeFailJob("text-ai", "upstream_error", "Drill: AI upstream 500");
      recordAudit("safe-mode-blocked", "drill", "[DRILL] AI 500");
      return "Simulated AI 500 — recovery snapshot logic stays armed.";
    },
  },
  {
    id: "image-failure",
    label: "Image failure",
    Icon: ImageIcon,
    run: () => {
      fakeFailJob("image-ai", "image_failed", "Drill: image generation failed");
      recordAudit("safe-mode-blocked", "drill", "[DRILL] image failure");
      return "Simulated image failure — retry remains safe.";
    },
  },
  {
    id: "transcription-failure",
    label: "Transcribe failure",
    Icon: Mic,
    run: () => {
      fakeFailJob("transcribe", "transcribe_failed", "Drill: transcription failed");
      recordAudit("safe-mode-blocked", "drill", "[DRILL] transcribe failure");
      return "Simulated transcription failure — file is dropped, draft kept.";
    },
  },
  {
    id: "wp-401",
    label: "WordPress 401",
    Icon: Cloud,
    run: () => {
      fakeFailJob("wp-publish", "unauthorized", "Drill: WP 401");
      recordAudit("publish-failure", "drill", "[DRILL] WP 401 unauthorized");
      return "Simulated WP 401 — operator must update credentials.";
    },
  },
  {
    id: "wp-500",
    label: "WordPress 500",
    Icon: Cloud,
    run: () => {
      // Snapshot first to mirror real publish flow guarantees.
      try {
        captureSnapshot({
          reason: "publish",
          silo: "drill",
          label: "[DRILL] pre-publish snapshot",
        });
      } catch {
        /* ignore */
      }
      fakeFailJob("wp-publish", "upstream_rejected", "Drill: WP 500");
      recordAudit("publish-failure", "drill", "[DRILL] WP 500 upstream");
      return "Simulated WP 500 — snapshot + audit recorded, draft retained.";
    },
  },
  {
    id: "storage-quota",
    label: "Storage quota warning",
    Icon: HardDrive,
    run: () => {
      const r = estimateUsage();
      try {
        window.dispatchEvent(
          new CustomEvent(SAFE_STORAGE_QUOTA_EVENT, { detail: r }),
        );
      } catch {
        /* ignore */
      }
      recordAudit("safe-mode-blocked", "drill", "[DRILL] storage quota event");
      return "Storage quota event dispatched — banner should appear.";
    },
  },
  {
    id: "malformed-import",
    label: "Malformed import",
    Icon: FileWarning,
    run: () => {
      const probeKey = "hmg-drill-malformed-v1";
      try {
        // Write deliberately malformed JSON, then read through safeGetJSON
        // which will quarantine + return fallback. No real data touched.
        safeSet(probeKey, "{not-valid-json");
        const result = safeGetJSON<unknown[]>(
          probeKey,
          (x): x is unknown[] => Array.isArray(x),
          [],
        );
        // Cleanup any stragglers (safeGetJSON already removes the key on
        // quarantine, but be belt-and-braces).
        safeRemove(probeKey);
        recordAudit(
          "import-skipped-invalid-key",
          "drill",
          "[DRILL] malformed payload quarantined",
        );
        return `Malformed payload quarantined; fallback returned (${Array.isArray(result) ? result.length : "?"} items).`;
      } catch {
        return "Drill failed to write probe — storage may be unavailable.";
      }
    },
  },
  {
    id: "offline-mode",
    label: "Offline mode pulse",
    Icon: WifiOff,
    run: () => {
      // Dispatch a transient offline → online sequence so the network banner
      // surfaces without actually disconnecting the user.
      try {
        window.dispatchEvent(new Event("offline"));
        window.setTimeout(() => {
          try {
            window.dispatchEvent(new Event("online"));
          } catch {
            /* ignore */
          }
        }, 2500);
      } catch {
        /* ignore */
      }
      recordAudit("safe-mode-blocked", "drill", "[DRILL] offline pulse");
      return "Offline pulse fired — banner should flash for ~2.5s.";
    },
  },
];

export function FailureDrillPanel() {
  const { enabled, toggle } = useDebugMode();
  const [lastResult, setLastResult] = useState<string | null>(null);

  return (
    <div
      data-testid="failure-drill-panel"
      className="rounded-xl border border-border/60 bg-secondary/30 p-3 mb-3"
    >
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Bug className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Failure drills
          </span>
          {enabled && (
            <span
              data-testid="debug-mode-on-pill"
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border bg-amber-500/15 text-amber-300 border-amber-500/40"
            >
              Debug ON
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={toggle}
          data-testid="debug-mode-toggle"
          className="text-[10px] font-semibold inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border hover:border-foreground/40 text-muted-foreground hover:text-foreground"
        >
          {enabled ? (
            <ToggleRight className="w-3.5 h-3.5" />
          ) : (
            <ToggleLeft className="w-3.5 h-3.5" />
          )}
          {enabled ? "Debug ON" : "Debug OFF"}
        </button>
      </div>

      {!enabled ? (
        <p className="text-[11px] text-muted-foreground leading-snug inline-flex items-start gap-1.5">
          <Power className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Toggle Debug Mode on to expose failure simulations. Every drill is
          metadata-only and never touches credentials, real publish targets,
          or upstream APIs.
        </p>
      ) : (
        <>
          <p className="text-[11px] text-muted-foreground mb-2 leading-snug">
            Each drill records a metadata-only ledger + audit entry and exercises
            the matching UI path. Drafts and saved settings are never modified.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {DRILLS.map((d) => (
              <Button
                key={d.id}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  try {
                    const msg = d.run();
                    setLastResult(msg);
                    toast.message(d.label, { description: msg });
                  } catch {
                    setLastResult("Drill failed to run.");
                    toast.error("Drill failed to run.");
                  }
                }}
                data-testid={`failure-drill-${d.id}`}
                className="h-9 text-[11px] justify-start"
              >
                <d.Icon className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span className="truncate">{d.label}</span>
              </Button>
            ))}
          </div>
          {lastResult && (
            <div
              data-testid="failure-drill-last-result"
              className="mt-2 text-[10px] text-muted-foreground/90 leading-snug border-l-2 border-amber-500/40 pl-2"
            >
              {lastResult}
            </div>
          )}
        </>
      )}
    </div>
  );
}
