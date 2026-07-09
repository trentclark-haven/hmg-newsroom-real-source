import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Copy, Megaphone } from "lucide-react";
import { socialPackToText, type SocialPostsPackage } from "@/lib/hmg/editorial";

interface SocialPostsCardProps {
  pkg: SocialPostsPackage;
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

export function SocialPostsCard({ pkg, accent, onAccent }: SocialPostsCardProps) {
  return (
    <div
      className="rounded-xl border bg-card/40 overflow-hidden shadow-sm"
      style={{ borderColor: `${accent}55` }}
      data-testid="social-posts-card"
    >
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/40"
        style={{ background: `${accent}10` }}
      >
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: accent, color: onAccent }}
        >
          <Megaphone className="w-3 h-3" />
          {pkg.brandName} · Social Posts
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px]"
          onClick={() => copyText(socialPackToText(pkg), "Social pack")}
          data-testid="copy-social-pack"
        >
          <Copy className="w-3 h-3 mr-1" />
          Copy Full Pack
        </Button>
      </div>
      <div className="p-3 space-y-2">
        {pkg.pieces.map((piece) => {
          const full = [piece.hook, piece.body, piece.cta, piece.hashtags]
            .filter((v) => v && v.trim().length > 0)
            .join("\n");
          return (
            <div
              key={piece.id}
              className="rounded-md border border-border/40 bg-background/40 p-2"
              data-testid={`social-piece-${piece.id}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {piece.platform}
                </span>
                <button
                  type="button"
                  onClick={() => copyText(full, piece.platform)}
                  className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-foreground/5"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <p className="text-[13px] font-semibold leading-snug">{piece.hook}</p>
              <p className="text-[13px] text-foreground/80 leading-snug whitespace-pre-wrap">
                {piece.body}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {piece.cta}
                {piece.hashtags ? ` · ${piece.hashtags}` : ""}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
