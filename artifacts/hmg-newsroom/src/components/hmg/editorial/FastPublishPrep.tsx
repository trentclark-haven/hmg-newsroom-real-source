import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Copy,
  Download,
  Image as ImageIcon,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { verticals } from "@/lib/mock-data";
import {
  buildWordpressPackage,
  type EditorialArticlePackage,
} from "@/lib/hmg/editorial";

interface FastPublishPrepProps {
  pkg: EditorialArticlePackage;
  accent: string;
  onAccent: string;
}

type SendStatus =
  | { tone: "idle" }
  | { tone: "sending" }
  | { tone: "ok"; message: string }
  | { tone: "warn"; message: string }
  | { tone: "error"; message: string; reason: string };

function plainReasonForHttp(status: number, body: string): string {
  if (status === 401) return "WordPress login needs attention — check the username and application password.";
  if (status === 403) return "Application password rejected or the site is blocking the request — check capabilities and firewall.";
  if (status === 404) return "WordPress connection not found at this URL — confirm the site address.";
  if (status === 415) return "WordPress refused the payload — use the manual draft below.";
  if (status === 429) return "WordPress is rate-limiting — wait and retry.";
  if (status >= 500) return "WordPress server error — use the manual draft below.";
  if (status === 0) return "Network failed before the request reached WordPress.";
  return `WordPress responded ${status}${body ? ` — ${body.slice(0, 80)}` : ""}.`;
}

export function FastPublishPrep({ pkg, accent, onAccent }: FastPublishPrepProps) {
  const [brand, setBrand] = useState<string>(pkg.brand);
  const [headline, setHeadline] = useState(pkg.headline);
  const [excerpt, setExcerpt] = useState(pkg.wordpressExcerpt);
  const [tags, setTags] = useState<string>(pkg.suggestedTags.join(", "));
  const [category, setCategory] = useState<string>("Editorial");
  const [status, setStatus] = useState<SendStatus>({ tone: "idle" });
  const [open, setOpen] = useState(false);

  const wp = buildWordpressPackage({
    ...pkg,
    headline,
    wordpressExcerpt: excerpt,
    suggestedTags: tags.split(",").map((t) => t.trim()).filter(Boolean),
  });

  const send = async () => {
    setStatus({ tone: "sending" });
    try {
      const apiBase = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");
      const res = await fetch(`${apiBase}/wordpress/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          silo: brand,
          title: wp.title,
          excerpt: wp.excerpt,
          contentHtml: wp.contentHtml,
          tags: wp.tags,
          category,
        }),
      });
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { editUrl?: string };
        setStatus({
          tone: "ok",
          message: data.editUrl
            ? `Saved as draft. Edit in WordPress: ${data.editUrl}`
            : "Saved as draft in WordPress.",
        });
        toast.success("Draft saved to WordPress");
        return;
      }
      const body = await res.text().catch(() => "");
      setStatus({
        tone: "error",
        message: "Direct publish failed.",
        reason: plainReasonForHttp(res.status, body),
      });
    } catch (err) {
      setStatus({
        tone: "error",
        message: "Direct publish unavailable.",
        reason: err instanceof Error ? err.message : "Network error.",
      });
    }
  };

  const copyManualDraft = () => {
    navigator.clipboard
      .writeText(
        [
          `TITLE: ${wp.title}`,
          `EXCERPT: ${wp.excerpt}`,
          `CATEGORY: ${category}`,
          `TAGS: ${wp.tags.join(", ")}`,
          "",
          "--- HTML BODY ---",
          wp.contentHtml,
        ].join("\n"),
      )
      .then(() => toast.success("Manual draft copied"))
      .catch(() => toast.error("Copy failed"));
  };

  return (
    <div
      className="rounded-xl border bg-card/40"
      style={{ borderColor: `${accent}55` }}
      data-testid="fast-publish-prep"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border-b border-border/40 hover:bg-foreground/5 transition-colors"
        data-testid="fast-publish-toggle"
      >
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: accent }}
        >
          <Send className="w-3.5 h-3.5" />
          Fast Publish Prep
        </span>
        <span className="text-[10px] text-muted-foreground">{open ? "Hide" : "Open"}</span>
      </button>

      {open && (
        <div className="p-3 space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Brand / site</p>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background/50 px-2 text-sm"
                data-testid="fast-publish-brand"
              >
                {verticals.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Category</p>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9"
                data-testid="fast-publish-category"
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Headline</p>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="h-9"
              data-testid="fast-publish-headline"
            />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Excerpt</p>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="min-h-[70px] text-sm"
              data-testid="fast-publish-excerpt"
            />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Tags (comma separated)</p>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="h-9"
              data-testid="fast-publish-tags"
            />
          </div>

          {status.tone === "ok" && (
            <div
              className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[12px] text-emerald-300 inline-flex items-center gap-1.5"
              data-testid="fast-publish-status-ok"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {status.message}
            </div>
          )}
          {status.tone === "warn" && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-[12px] text-amber-300">
              {status.message}
            </div>
          )}
          {status.tone === "error" && (
            <div
              className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-[12px] text-rose-200 space-y-0.5"
              data-testid="fast-publish-status-error"
            >
              <div className="inline-flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                {status.message}
              </div>
              <p className="text-rose-100/80">Reason: {status.reason}</p>
              <p className="text-foreground/80">Use the manual draft buttons below — direct publish is unavailable.</p>
            </div>
          )}

          {/* Sticky one-hand action bar */}
          <div
            className="sticky bottom-0 pt-2 -mx-3 px-3 pb-2 bg-card/95 backdrop-blur border-t border-border/40 flex flex-wrap items-center gap-1.5"
            data-testid="fast-publish-action-bar"
          >
            <Button
              size="sm"
              onClick={send}
              disabled={status.tone === "sending"}
              className="h-9 px-4 font-bold rounded-full"
              style={{ background: accent, color: onAccent }}
              data-testid="fast-publish-send"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {status.tone === "sending" ? "Saving…" : "Save Draft to WordPress"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={copyManualDraft}
              className="h-9 text-[11px]"
              data-testid="fast-publish-copy-manual"
            >
              <Copy className="w-3.5 h-3.5 mr-1" />
              Copy Manual Draft
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const blob = new Blob([JSON.stringify(wp, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${wp.slug || "article"}-wp-draft.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("WordPress draft downloaded");
              }}
              className="h-9 text-[11px]"
              data-testid="fast-publish-download"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Export Draft
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground/85 leading-snug" data-testid="fast-publish-help">
            <ImageIcon className="w-3 h-3 inline mr-1" />
            Featured image: use WebArt to create the hero, then attach inside WordPress when the draft opens.
            Direct publish from the newsroom is held; use the Save Draft button or copy the manual draft.
          </p>
        </div>
      )}
    </div>
  );
}
