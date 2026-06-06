import { useState } from "react";
import { Loader2, Sparkles, Copy, Check, Wand2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  useGenerateSpecialist,
  type Silo as ApiSilo,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  TRENT_OVERRIDE_TOGGLES,
  TRENT_OVERRIDE_LIMITS,
  buildOverrideUserPrompt,
  hasOverrideInstruction,
  useTrentOverridePrefs,
  type TrentOverrideToggleId,
} from "@/lib/trentOverride";
import { useSafeMode, recordSafeModeBlock } from "@/lib/safeMode";
import { recordAudit } from "@/lib/auditLog";
import { copyText } from "./TabContent/shared";

interface TrentOverridePanelProps {
  /** The text to revise (article body, social post, etc). */
  original: string;
  /** Silo for prompt context + audit metadata. */
  silo: ApiSilo;
  /** Brand colors for visual consistency. */
  brand: { bg: string; on: string; color: string };
  /**
   * Test ID prefix for the panel + its children. Defaults to "trent-override"
   * but callers should pass a unique prefix when multiple panels render in
   * the same view (e.g. "trent-override-quick", "trent-override-pack").
   */
  testIdPrefix?: string;
  /** Optional human label for the kind of draft being revised (for audit). */
  fieldLabel?: string;
  /**
   * Optional callback when the user clicks "Use this revision". Parents that
   * want to mutate their result state can wire this up; otherwise the panel
   * still allows copying the revised text.
   */
  onApply?: (revised: string) => void;
}

export function TrentOverridePanel({
  original,
  silo,
  brand,
  testIdPrefix = "trent-override",
  fieldLabel = "draft",
  onApply,
}: TrentOverridePanelProps) {
  const { prefs, toggle, setCustom, reset } = useTrentOverridePrefs();
  const mutation = useGenerateSpecialist();
  const { enabled: safeMode } = useSafeMode();

  const [revised, setRevised] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const isPending = mutation.isPending;
  const hasInstruction = hasOverrideInstruction(prefs);
  const trimmedOriginal = original.trim();
  // Note: safeMode is intentionally NOT in `canRevise` so a programmatic
  // invocation (e.g. keyboard shortcut wiring) still trips the audit below
  // instead of silently no-op'ing. The button disables itself on safeMode
  // for UX; the handler is the source of truth for the audit + toast.
  const canRevise =
    !isPending && hasInstruction && trimmedOriginal.length > 0;
  const buttonDisabled = !canRevise || safeMode;

  async function runOverride() {
    if (safeMode) {
      recordSafeModeBlock("ai-call", `TrentOverridePanel/${silo}`);
      toast.error("Safe Mode is on — AI calls disabled.");
      return;
    }
    if (!canRevise) return;
    try {
      const userPrompt = buildOverrideUserPrompt({
        toggles: prefs.toggles,
        custom: prefs.custom,
        original: trimmedOriginal,
      });
      const data = await mutation.mutateAsync({
        data: {
          specialist: "trentoverride",
          silo,
          prompt: userPrompt,
        },
      });
      const text = (data.content ?? "").trim();
      if (!text) {
        toast.error("Override returned empty — try fewer toggles.");
        return;
      }
      setRevised(text);
      recordAudit(
        "article-edited",
        silo,
        `Trent Override: ${prefs.toggles.length} toggle(s)${
          prefs.custom.trim() ? " + custom" : ""
        } on ${fieldLabel}`,
      );
      toast.success("Override applied — review the before/after.");
    } catch {
      toast.error("Override failed. Try again or pick fewer toggles.");
    }
  }

  function handleApply() {
    if (!revised || !onApply) return;
    onApply(revised);
    toast.success("Revision applied to output.");
  }

  function handleCustom(v: string) {
    setCustom(v);
  }

  function handleResetRevision() {
    setRevised(null);
  }

  const customRemaining =
    TRENT_OVERRIDE_LIMITS.MAX_CUSTOM_LEN - prefs.custom.length;
  const customNearLimit = customRemaining <= 60;

  return (
    <div
      data-testid={`${testIdPrefix}-panel`}
      className="rounded-xl border border-border/60 bg-secondary/30 p-3 sm:p-4 space-y-3"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid={`${testIdPrefix}-toggle-open`}
        className="w-full flex items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Wand2 className="w-4 h-4" style={{ color: brand.color }} />
          <span className="text-sm font-semibold">Trent Override</span>
          {prefs.toggles.length > 0 && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{
                background: brand.bg,
                color: brand.on,
              }}
            >
              {prefs.toggles.length}
            </span>
          )}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <>
          <p className="text-[11px] text-muted-foreground/80">
            Revise this {fieldLabel} with one or more toggles. Custom
            instructions override toggles.
          </p>

          {/* Toggle chips */}
          <div className="flex flex-wrap gap-1.5">
            {TRENT_OVERRIDE_TOGGLES.map((t) => {
              const active = prefs.toggles.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id as TrentOverrideToggleId)}
                  data-testid={`${testIdPrefix}-toggle-${t.id}`}
                  aria-pressed={active}
                  title={t.hint}
                  className="text-[11px] font-semibold inline-flex items-center px-2.5 py-1 rounded-full border transition-colors"
                  style={{
                    background: active ? brand.bg : "transparent",
                    color: active ? brand.on : "hsl(var(--muted-foreground))",
                    borderColor: active ? brand.color : "hsl(var(--border))",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Custom instruction */}
          <div className="space-y-1">
            <label
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              htmlFor={`${testIdPrefix}-custom`}
            >
              Custom instruction (optional)
            </label>
            <Textarea
              id={`${testIdPrefix}-custom`}
              data-testid={`${testIdPrefix}-custom`}
              value={prefs.custom}
              onChange={(e) => handleCustom(e.target.value)}
              placeholder="e.g. Open with a question. Drop the second paragraph."
              maxLength={TRENT_OVERRIDE_LIMITS.MAX_CUSTOM_LEN}
              className="min-h-[64px] text-sm bg-secondary/40 border-border resize-none rounded-lg"
            />
            <div className="flex items-center justify-between text-[10px]">
              <span
                className={
                  customNearLimit
                    ? "text-amber-300"
                    : "text-muted-foreground/60"
                }
              >
                {customRemaining} characters left
              </span>
              {(prefs.toggles.length > 0 || prefs.custom.length > 0) && (
                <button
                  type="button"
                  onClick={reset}
                  data-testid={`${testIdPrefix}-clear-prefs`}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear toggles
                </button>
              )}
            </div>
          </div>

          {safeMode && (
            <p
              data-testid={`${testIdPrefix}-safe-mode-note`}
              className="text-[11px] text-amber-300"
            >
              Safe Mode is on — AI calls disabled.
            </p>
          )}

          {!hasInstruction && !safeMode && (
            <p className="text-[11px] text-muted-foreground/60">
              Pick at least one toggle or add a custom instruction.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={runOverride}
              disabled={buttonDisabled}
              data-testid={`${testIdPrefix}-run`}
              className="rounded-full font-semibold h-9 px-4"
              style={{
                background: buttonDisabled
                  ? "hsl(var(--muted))"
                  : brand.bg,
                color: buttonDisabled
                  ? "hsl(var(--muted-foreground))"
                  : brand.on,
              }}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Revising…
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Run Override
                </>
              )}
            </Button>

            {revised && (
              <Button
                type="button"
                variant="outline"
                onClick={handleResetRevision}
                data-testid={`${testIdPrefix}-reset`}
                className="rounded-full h-9 px-3 text-xs"
              >
                Discard revision
              </Button>
            )}
          </div>

          {/* Before / After preview */}
          {revised && (
            <div
              data-testid={`${testIdPrefix}-preview`}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1"
            >
              <DiffPane
                title="Before"
                text={trimmedOriginal}
                brand={brand}
                tone="muted"
                copyLabel="original"
                testId={`${testIdPrefix}-before`}
              />
              <DiffPane
                title="After"
                text={revised}
                brand={brand}
                tone="brand"
                copyLabel="revised"
                testId={`${testIdPrefix}-after`}
              />
              {onApply && (
                <div className="sm:col-span-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={handleApply}
                    data-testid={`${testIdPrefix}-apply`}
                    className="rounded-full h-9 px-4 font-semibold"
                    style={{
                      background: brand.bg,
                      color: brand.on,
                    }}
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Use this revision
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface DiffPaneProps {
  title: string;
  text: string;
  brand: { bg: string; on: string; color: string };
  tone: "muted" | "brand";
  copyLabel: string;
  testId: string;
}

function DiffPane({ title, text, brand, tone, copyLabel, testId }: DiffPaneProps) {
  const isBrand = tone === "brand";
  return (
    <div
      data-testid={testId}
      className="rounded-lg border bg-secondary/30 p-3 space-y-2"
      style={{
        borderColor: isBrand ? brand.color : "hsl(var(--border))",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: isBrand ? brand.color : undefined }}
        >
          {title}
        </span>
        <button
          type="button"
          onClick={() =>
            copyText(text, { bg: brand.bg, on: brand.on, label: copyLabel })
          }
          data-testid={`${testId}-copy`}
          className="text-[10px] font-semibold inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
      </div>
      <pre className="text-[12px] leading-relaxed whitespace-pre-wrap break-words font-sans max-h-72 overflow-y-auto">
        {text}
      </pre>
    </div>
  );
}
