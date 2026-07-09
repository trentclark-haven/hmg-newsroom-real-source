import React from "react";

export type PublishingStatusValue =
  | "Ready"
  | "Blocked"
  | "Pull Receiver"
  | "Manual Only"
  | "Connected"
  | "Not Connected"
  | "Requires Setup"
  | "Unsupported";

export interface PublishingChannelStatus {
  channel: string;
  status: PublishingStatusValue;
}

interface PublishingStatusProps {
  channels: PublishingChannelStatus[];
  title?: string;
  className?: string;
}

const STATUS_STYLES: Record<PublishingStatusValue, string> = {
  Ready: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  Connected: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  "Pull Receiver": "bg-sky-500/15 text-sky-500 border-sky-500/30",
  "Manual Only": "bg-amber-500/15 text-amber-500 border-amber-500/30",
  "Requires Setup": "bg-amber-500/15 text-amber-500 border-amber-500/30",
  Blocked: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  "Not Connected": "bg-muted text-muted-foreground border-border/60",
  Unsupported: "bg-muted text-muted-foreground border-border/60",
};

const STATUS_LINES: Record<PublishingStatusValue, string> = {
  Ready: "Ready for Manual Publish.",
  Connected: "Connected and ready.",
  "Pull Receiver": "WordPress draft is ready for pull receiver pickup.",
  "Manual Only": "Copy or export, then post by hand.",
  "Requires Setup": "Needs setup before you can use it.",
  Blocked: "Publish Blocked — use Export.",
  "Not Connected": "Not connected — copy or export to post manually.",
  Unsupported: "Not supported for this channel.",
};

/**
 * Honest manual publish status panel. The caller supplies truthful statuses per
 * channel — this component never assumes or fakes a "Connected" state. Each row
 * shows the channel name, a colored status pill, and a short plain-English line.
 */
export function PublishingStatus({ channels, title, className = "" }: PublishingStatusProps) {
  if (!channels || channels.length === 0) return null;

  return (
    <div
      className={`rounded-xl border border-border/60 bg-card p-4 shadow-sm ${className}`}
      data-testid="publishing-status"
    >
      {title && (
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3">{title}</h3>
      )}
      <div className="flex flex-col gap-2">
        {channels.map((c) => (
          <div
            key={c.channel}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{c.channel}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {STATUS_LINES[c.status]}
              </p>
            </div>
            <span
              className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLES[c.status]}`}
            >
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
