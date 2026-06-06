import { BookOpen, ShieldCheck } from "lucide-react";
import type { HavenCorpusCitation } from "@/lib/hmg/haven-ai";

/**
 * Shared, honest corpus-citation strip for the editorial modules. Renders the
 * founder-ingested passages that grounded a generation. When nothing matched it
 * shows the honest note (no faked sources). Each module passes its own test-id
 * prefix so the strips stay distinguishable.
 */

interface CorpusCitationsProps {
  usedCorpus: boolean;
  note: string;
  citations: HavenCorpusCitation[];
  testIdPrefix: string;
}

function reliabilityTone(reliability: string): string {
  const r = reliability.toLowerCase();
  if (r.includes("verified")) return "text-emerald-400 border-emerald-500/40";
  if (r.includes("trusted")) return "text-sky-400 border-sky-500/40";
  if (r.includes("user")) return "text-amber-400 border-amber-500/40";
  return "text-zinc-400 border-zinc-500/40";
}

export function CorpusCitations({
  usedCorpus,
  note,
  citations,
  testIdPrefix,
}: CorpusCitationsProps) {
  if (!usedCorpus) {
    return (
      <div
        data-testid={`${testIdPrefix}-empty`}
        className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-500"
      >
        {note || "No corpus matches — generated from base knowledge."}
      </div>
    );
  }

  return (
    <div
      data-testid={`${testIdPrefix}-list`}
      className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
        <BookOpen className="h-3.5 w-3.5" />
        Corpus sources ({citations.length})
      </div>
      <p className="mt-1 text-[11px] text-zinc-500">{note}</p>
      <ol className="mt-2 space-y-2">
        {citations.map((c, i) => (
          <li
            key={`${c.sourceId}-${i}`}
            data-testid={`${testIdPrefix}-item`}
            className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-500">[{i + 1}]</span>
              <span className="text-xs font-medium text-zinc-200">{c.citationLabel}</span>
              <span
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] ${reliabilityTone(
                  c.reliability,
                )}`}
              >
                <ShieldCheck className="h-3 w-3" />
                {c.reliability}
              </span>
            </div>
            <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-zinc-400">
              {c.excerpt}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
