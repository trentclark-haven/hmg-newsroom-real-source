import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PublishPayload } from "@/lib/publishPayload";
import type { PublishTargetId } from "@/lib/publishTargets";
import { CheckCircle2, Send } from "lucide-react";

interface PackagePreviewProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  payload: PublishPayload | null;
  effectiveBody: string;
  slug: string;
  target: PublishTargetId;
  status: "draft" | "publish";
  siloName: string;
  featuredMediaUrl?: string;
  brand: { bg: string; on: string; color: string };
  onConfirm: () => void;
  isPublishing: boolean;
}

const TARGET_LABELS: Record<PublishTargetId, string> = {
  wordpress: "WordPress",
  "public-app": "Public App",
  both: "WordPress + Public App",
};

function preview(text: string, max = 480) {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export function PackagePreview({
  open,
  onOpenChange,
  payload,
  effectiveBody,
  slug,
  target,
  status,
  siloName,
  featuredMediaUrl,
  brand,
  onConfirm,
  isPublishing,
}: PackagePreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="publish-preview-modal"
        className="max-w-lg max-h-[85vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-black tracking-tight">
            WordPress post preview
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Review every field before this post is marked ready for {TARGET_LABELS[target]}.
          </DialogDescription>
        </DialogHeader>

        {!payload ? (
          <p className="text-sm text-muted-foreground italic">
            No payload available — create an article draft first.
          </p>
        ) : (
          <div className="space-y-3 text-[13px]">
            {featuredMediaUrl && (
              <div>
                <PreviewLabel>Featured image</PreviewLabel>
                <img
                  src={featuredMediaUrl}
                  alt=""
                  className="rounded-md border border-border/60 max-h-40 object-cover"
                />
              </div>
            )}

            <div>
              <PreviewLabel>Headline</PreviewLabel>
              <div className="font-semibold text-foreground/95">
                {payload.title || (
                  <span className="italic text-amber-400">missing</span>
                )}
              </div>
            </div>

            {payload.excerpt && (
              <div>
                <PreviewLabel>Excerpt / summary</PreviewLabel>
                <p className="text-foreground/85 leading-relaxed">
                  {payload.excerpt}
                </p>
              </div>
            )}

            <div>
              <PreviewLabel>Body preview</PreviewLabel>
              <pre className="text-[12px] text-foreground/85 whitespace-pre-wrap font-sans rounded-md border border-border/40 bg-secondary/30 p-2 max-h-40 overflow-y-auto">
                {preview(effectiveBody) || "(empty)"}
              </pre>
              <div className="text-[10px] text-muted-foreground mt-1">
                {effectiveBody.length} chars total
              </div>
            </div>

            {payload.metaDescription && (
              <div>
                <PreviewLabel>SEO meta description</PreviewLabel>
                <p className="text-foreground/85 text-[12px] leading-relaxed">
                  {payload.metaDescription}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <PreviewLabel>Categories ({payload.categories.length})</PreviewLabel>
                <ChipRow values={payload.categories} brand={brand} />
              </div>
              <div>
                <PreviewLabel>Tags ({payload.tags.length})</PreviewLabel>
                <ChipRow values={payload.tags} brand={brand} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <PreviewLabel>Slug</PreviewLabel>
                <code className="text-[11px] text-foreground/90 break-all">
                  {slug || "(auto)"}
                </code>
              </div>
              <div>
                <PreviewLabel>Silo</PreviewLabel>
                <span className="text-foreground/95">{siloName}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <PreviewLabel>Target</PreviewLabel>
                <span className="text-foreground/95">
                  {TARGET_LABELS[target]}
                </span>
              </div>
              <div>
                <PreviewLabel>Status</PreviewLabel>
                <span
                  className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-flex items-center gap-1"
                  style={{ background: brand.bg, color: brand.on }}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {status === "publish" ? "Ready for Manual Publish" : "Save Draft"}
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={!payload || isPublishing}
            data-testid="publish-preview-confirm"
            style={{ background: brand.bg, color: brand.on }}
          >
            <Send className="w-4 h-4 mr-1.5" />
            {isPublishing ? "Saving…" : "Confirm Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
      {children}
    </div>
  );
}

function ChipRow({
  values,
  brand,
}: {
  values: string[];
  brand: { bg: string; on: string; color: string };
}) {
  if (!values.length) {
    return <span className="text-[11px] text-muted-foreground italic">none</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {values.map((v) => (
        <span
          key={v}
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
          style={{ borderColor: brand.color, color: brand.color }}
        >
          {v}
        </span>
      ))}
    </div>
  );
}
