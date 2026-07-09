import {
  culturalFluencyNotes,
  executiveBrainNotes,
} from "@/components/newsroom/sales/mockMaximillionData";
import { personalityModes } from "@/components/newsroom/sales/mockMaximillionV3Data";
import { BadgeCheck, Brain, MessageSquareText, Radio, Scale } from "lucide-react";

export function MaximillionProfilePanel() {
  return (
    <section className="rounded-lg border border-emerald-400/20 bg-secondary/35 p-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-emerald-300">
            <Brain className="w-4 h-4" />
            <h3 className="text-sm font-black">Maximillion Profile</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Personality, cultural fluency, and media-business operating rules.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-100">
          Profile settings
        </span>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <div className="rounded-lg border border-border/45 bg-secondary/30 p-3">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-200">
            <MessageSquareText className="w-3.5 h-3.5" />
            AAVE / Cultural Fluency Engine
          </div>
          <div className="mt-2 space-y-2">
            {culturalFluencyNotes.map((note) => (
              <ProfileNote key={note.id} title={note.title} body={note.body} />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border/45 bg-secondary/30 p-3">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-100">
            <Scale className="w-3.5 h-3.5" />
            Media Business Executive Brain
          </div>
          <div className="mt-2 space-y-2">
            {executiveBrainNotes.map((note) => (
              <ProfileNote key={note.id} title={note.title} body={note.body} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-border/45 bg-secondary/30 p-3">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-200">
          <Radio className="w-3.5 h-3.5" />
          Personality modes
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {personalityModes.map((mode) => (
            <div
              key={mode.id}
              className="rounded-md border border-border/35 bg-secondary/25 p-2"
            >
              <div className="text-[11px] font-black text-foreground">
                {mode.label}
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                {mode.description}
              </p>
              <p className="mt-2 text-[10px] leading-relaxed text-emerald-700 dark:text-emerald-50/80">
                {mode.sample}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border/35 bg-secondary/25 p-2">
      <BadgeCheck className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] font-black text-foreground">{title}</div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
    </div>
  );
}
