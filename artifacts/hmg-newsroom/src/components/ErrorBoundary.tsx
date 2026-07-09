import React from "react";
import { AlertTriangle, RotateCcw, Home, Activity } from "lucide-react";
import {
  recordModuleError,
  clearModuleError,
  type ModuleId,
} from "@/lib/hmg/recoveryCenter";

interface ErrorBoundaryProps {
  /** Health bucket this boundary reports under in the Recovery Center. */
  moduleId: ModuleId;
  /** Human-friendly name shown in the fallback card. */
  moduleName: string;
  /** Optional: navigate home / out of the broken view. */
  onReset?: () => void;
  /** Optional: jump to the System Health view. */
  onOpenHealth?: () => void;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * App-wide crash shield. Any render error inside is caught, recorded to the
 * Recovery Center registry (secret-scrubbed), and replaced with a calm,
   * plain-English fallback offering Retry and Back to Editorial Desk — never a white
 * screen. Retrying simply re-mounts the children.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error): void {
    recordModuleError(this.props.moduleId, error);
  }

  private handleRetry = (): void => {
    clearModuleError(this.props.moduleId);
    this.setState({ error: null });
  };

  private handleReset = (): void => {
    clearModuleError(this.props.moduleId);
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div
        className="flex-1 flex items-center justify-center p-6"
        data-testid="module-error-fallback"
      >
        <div className="w-full max-w-sm rounded-2xl border border-amber-500/40 bg-amber-500/[0.06] p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold tracking-tight">
            {this.props.moduleName} hit a snag
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            This panel stopped responding, but the rest of the app is fine and
            your saved drafts are untouched. Try again, or head back to
            Editorial Desk.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={this.handleRetry}
              data-testid="module-error-retry"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-bold text-background transition-opacity hover:opacity-90"
            >
              <RotateCcw className="h-4 w-4" />
              Try again
            </button>
            {this.props.onReset && (
              <button
                type="button"
                onClick={this.handleReset}
                data-testid="module-error-home"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-4 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-foreground/5"
              >
                <Home className="h-4 w-4" />
                Back to Editorial Desk
              </button>
            )}
            {this.props.onOpenHealth && (
              <button
                type="button"
                onClick={() => {
                  this.handleReset();
                  this.props.onOpenHealth?.();
                }}
                data-testid="module-error-health"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <Activity className="h-3.5 w-3.5" />
                Open System Health
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
