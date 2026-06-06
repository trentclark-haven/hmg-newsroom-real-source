import React from "react";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export interface NextAction {
  id: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  hint?: string;
  blockedReason?: string;
}

interface NextActionBarProps {
  actions: NextAction[];
  title?: string;
  className?: string;
}

/**
 * Reusable action bar rendered near an output. Renders only the actions the
 * caller passes in — each module decides which actions are real. Buttons wrap,
 * are themed (no white tabs), and disabled actions show their blockedReason
 * inline. This component performs no network calls and never fakes success.
 */
export function NextActionBar({ actions, title, className = "" }: NextActionBarProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-border/60 bg-card/40 p-3 ${className}`}
      data-testid="next-action-bar"
    >
      {title && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          {title}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const isDisabled = action.disabled === true;
          return (
            <div key={action.id} className="flex flex-col gap-1">
              <Button
                type="button"
                variant={isDisabled ? "secondary" : "default"}
                size="sm"
                disabled={isDisabled}
                onClick={action.onClick}
                title={action.hint}
                className="h-8 text-[11px]"
                data-testid={`next-action-${action.id}`}
              >
                {action.label}
              </Button>
              {isDisabled && action.blockedReason && (
                <span className="inline-flex items-start gap-1 text-[10px] leading-tight text-muted-foreground max-w-[200px]">
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  {action.blockedReason}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
