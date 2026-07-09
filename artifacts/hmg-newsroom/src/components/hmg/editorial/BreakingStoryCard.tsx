import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Copy,
  AlertTriangle,
  Twitter,
  Instagram,
  Bell,
  ArrowRight,
  ShieldAlert,
  FileText,
} from "lucide-react";
import type { BreakingStoryPackage } from "@/lib/hmg/editorial";

interface BreakingStoryCardProps {
  pkg: BreakingStoryPackage;
  accent: string;
  onAccent: string;
}

function copyText(text: string, label: string) {
  if (typeof navigator === "undefined") return;
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error(`Failed to copy ${label.toLowerCase()}`));
}

function Field({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-md border border-border/40 bg-background/40 p-2">
      <div className="flex items-center justify-between mb-1">
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
          style={{ color: accent }}
        >
          <Icon className="w-3 h-3" />
          {label}
        </span>
        <button
          type="button"
          onClick={() => copyText(value, label)}
          className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-foreground/5"
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
      </div>
      <p className="text-[13px] whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}

export function BreakingStoryCard({ pkg, accent, onAccent }: BreakingStoryCardProps) {
  return (
    <div
      className="rounded-xl border bg-card/40 overflow-hidden shadow-sm"
      style={{ borderColor: `${accent}55` }}
      data-testid="breaking-story-card"
    >
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/40"
        style={{ background: `${accent}10` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: accent, color: onAccent }}
          >
            <AlertTriangle className="w-3 h-3" />
            {pkg.brandName} · Breaking Story
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px]"
          onClick={() =>
            copyText(
              [
                pkg.headline,
                "",
                pkg.alertSummary,
                "",
                pkg.webPost,
                "",
                `X: ${pkg.xPost}`,
                `IG: ${pkg.instagramCaption}`,
                `Push: ${pkg.pushAlert}`,
              ].join("\n"),
              "Breaking pack",
            )
          }
        >
          <Copy className="w-3 h-3 mr-1" />
          Copy Full
        </Button>
      </div>

      <div className="p-3 space-y-2">
        <h2 className="text-xl font-black leading-tight text-foreground">{pkg.headline}</h2>
        <p className="text-sm text-muted-foreground italic">{pkg.alertSummary}</p>

        <Field icon={FileText} label="Web Post" value={pkg.webPost} accent={accent} />

        <div className="grid gap-2 sm:grid-cols-2">
          <Field icon={Twitter} label="X / Twitter" value={pkg.xPost} accent={accent} />
          <Field icon={Instagram} label="Instagram" value={pkg.instagramCaption} accent={accent} />
          <Field icon={Bell} label="Push Alert" value={pkg.pushAlert} accent={accent} />
        </div>

        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1 inline-flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            Verification
          </p>
          <ul className="space-y-1">
            {pkg.verificationNotes.map((v, i) => (
              <li key={i} className="text-[12px] text-amber-100/90 leading-snug">— {v}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-border/40 bg-background/40 p-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 inline-flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            Next Actions
          </p>
          <ul className="space-y-1">
            {pkg.nextActions.map((n, i) => (
              <li key={i} className="text-[12px] text-foreground/85 leading-snug">→ {n}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
