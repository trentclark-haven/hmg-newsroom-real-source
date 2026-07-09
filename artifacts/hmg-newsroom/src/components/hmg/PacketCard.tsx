import React from "react";
import { CopyButton } from "./CopyButton";
import { BrandBadge } from "./BrandBadge";

interface PacketCardProps {
  title: string;
  brandId?: string;
  badgeTone?: boolean;
  children: React.ReactNode;
  copyText?: string;
  copyLabel?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function PacketCard({
  title,
  brandId,
  badgeTone = true,
  children,
  copyText,
  copyLabel = "Copy Content",
  className = "",
  actions,
}: PacketCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col ${className}`}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-bold tracking-wide uppercase">{title}</h3>
          {brandId && <BrandBadge brandId={brandId} showTone={badgeTone} />}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {copyText && (
            <CopyButton
              textToCopy={copyText}
              label={copyLabel}
              variant="secondary"
              size="sm"
              className="h-8 text-[11px]"
            />
          )}
        </div>
      </div>
      <div className="p-4 flex-1 overflow-auto bg-background/50 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}
