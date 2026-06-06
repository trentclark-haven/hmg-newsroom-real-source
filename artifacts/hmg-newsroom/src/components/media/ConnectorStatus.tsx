import { CONNECTOR_STATE_META, getConnectors } from "./connectors";

/**
 * Honest connector status board. Shows exactly what is live, what is browser-only,
 * what is ready to configure and what is reserved for later — no fake "connected".
 */
export function ConnectorStatus() {
  const connectors = getConnectors();
  return (
    <div className="space-y-2" data-testid="media-connector-status">
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        What is actually connected right now. Cloud sources are honest slots — they
        wire in cleanly once configured. No fake browsing, no fake sign-in.
      </p>
      <div className="space-y-1.5">
        {connectors.map((c) => {
          const meta = CONNECTOR_STATE_META[c.state];
          return (
            <div
              key={c.id}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-background/40 px-3 py-2"
              data-testid={`connector-row-${c.id}`}
            >
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{ background: meta.dot }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-foreground">{c.label}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${meta.tone}`}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{c.blurb}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
