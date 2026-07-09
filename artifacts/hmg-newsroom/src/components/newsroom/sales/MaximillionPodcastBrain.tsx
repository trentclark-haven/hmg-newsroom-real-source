import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  generatePodcastBrainOutput,
  podcastBrainSeed,
  type PodcastBrainInput,
} from "@/components/newsroom/sales/mockMaximillionV8Data";
import { FileText, Link2, Lightbulb, Podcast, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function MaximillionPodcastBrain() {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [reports, setReports] = useState<PodcastBrainInput[]>(podcastBrainSeed);

  function generateReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = [title, notes].filter(Boolean).join(" - ");
    if (!input.trim()) {
      toast.error("Add a podcast title, URL placeholder, or manual summary first.");
      return;
    }
    setReports((current) => [generatePodcastBrainOutput(input), ...current].slice(0, 5));
    setTitle("");
    setNotes("");
    toast.success("Podcast Brain report generated locally");
  }

  return (
    <section className="rounded-lg border border-violet-300/20 bg-secondary/35 p-3 overflow-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-100">
            <Podcast className="h-4 w-4" />
            <h3 className="text-sm font-black">Maximillion Podcast Brain</h3>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Podcast and video ingestion architecture for titles, manual notes,
            summaries, and URL placeholders. No file parsing or external fetch.
          </p>
        </div>
        <span className="rounded-full border border-violet-200/20 bg-violet-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-100">
          Local input only
        </span>
      </div>

      <form onSubmit={generateReport} className="mt-3 rounded-lg border border-border/45 bg-secondary/30 p-3">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_160px]">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-10 bg-secondary/40 text-[12px]"
            placeholder="Podcast/video title or URL placeholder"
            aria-label="Podcast Brain title or URL placeholder"
          />
          <Button type="submit" className="h-10 text-[11px] bg-violet-500 text-white hover:bg-violet-400">
            <Sparkles className="h-3.5 w-3.5" />
            Generate local report
          </Button>
        </div>
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="mt-2 min-h-[76px] resize-none bg-secondary/40 text-[12px]"
          placeholder="Manual summary, key idea, quote notes, or Trent shorthand..."
          aria-label="Podcast Brain manual notes"
        />
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-secondary/25 px-2 py-1">
            <FileText className="h-3 w-3" />
            Manual summaries
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-secondary/25 px-2 py-1">
            <Link2 className="h-3 w-3" />
            URL placeholders only
          </span>
        </div>
      </form>

      <div className="mt-3 grid gap-2 xl:grid-cols-2">
        {reports.map((report) => (
          <article
            key={report.id}
            className="rounded-lg border border-border/45 bg-secondary/30 p-3 min-w-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-[13px] font-black leading-snug text-foreground">
                  {report.title}
                </h4>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {report.inputType} · {report.sourcePlaceholder}
                </p>
              </div>
              <Lightbulb className="h-4 w-4 shrink-0 text-violet-700 dark:text-violet-200" />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-foreground/82">
              {report.manualSummary}
            </p>
            <OutputGrid report={report} />
          </article>
        ))}
      </div>
    </section>
  );
}

function OutputGrid({ report }: { report: PodcastBrainInput }) {
  const groups = [
    ["Key lessons", report.keyLessons],
    ["Action ideas", report.actionIdeas],
    ["Revenue opportunities", report.revenueOpportunities],
    ["Founder notes", report.founderNotes],
    ["HMG implications", report.hmgImplications],
  ];

  return (
    <div className="mt-3 grid gap-2 md:grid-cols-2">
      {groups.map(([label, rows]) => (
        <div
          key={label as string}
          className="rounded-md border border-border/40 bg-secondary/25 p-2"
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            {label as string}
          </div>
          <div className="mt-1 space-y-1">
            {(rows as string[]).slice(0, 3).map((row) => (
              <div key={row} className="text-[11px] leading-relaxed text-foreground/82">
                {row}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
