import { avatarFutureHooks } from "@/components/newsroom/sales/mockMaximillionV3Data";
import {
  Bot,
  Mic2,
  RadioTower,
  ScanFace,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export function MaximillionAvatarPrep() {
  return (
    <section className="rounded-lg border border-sky-200/20 bg-black/40 p-3 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sky-100">
            <Bot className="w-4 h-4" />
            <h3 className="text-sm font-black">Maximillion Avatar Module</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Browser Voice now operates through local browser APIs where
            supported. Visual generation remains provider-optional.
          </p>
        </div>
        <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-100">
          Avatar prep
        </span>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="rounded-lg border border-sky-200/15 bg-[linear-gradient(145deg,rgba(125,211,252,0.16),rgba(226,232,240,0.08),rgba(15,23,42,0.8))] p-4">
          <div className="mx-auto w-28 h-28 rounded-full border border-sky-100/25 bg-slate-950/80 flex items-center justify-center shadow-[0_0_40px_rgba(125,211,252,0.18)]">
            <div className="w-20 h-20 rounded-full border border-slate-200/20 bg-slate-900 flex items-center justify-center">
              <ScanFace className="w-9 h-9 text-sky-100" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <StatusPill icon={Mic2} label="Browser Voice active" />
            <StatusPill icon={Sparkles} label="Prompt pack local" />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {avatarFutureHooks.map((hook) => (
            <div
              key={hook.id}
              className="rounded-lg border border-border/45 bg-black/30 p-3"
            >
              <div className="flex items-center gap-2 text-[11px] font-black text-sky-100">
                <RadioTower className="w-3.5 h-3.5" />
                {hook.label}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                {hook.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatusPill({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="rounded-md border border-sky-200/15 bg-black/25 p-2 text-center">
      <Icon className="w-4 h-4 mx-auto text-sky-100" />
      <div className="mt-1 text-[10px] leading-tight text-sky-50/80">
        {label}
      </div>
    </div>
  );
}
