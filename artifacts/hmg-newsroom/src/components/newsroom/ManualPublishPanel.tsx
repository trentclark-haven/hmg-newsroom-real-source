import { useState } from "react";
import {
  WP_PROOF_PACKAGES,
  bodyToHtml,
  bodyToPlain,
  packageToMarkdown,
  type WpProofPackage,
} from "./data/wpProofPackages";
import { WP_PROOF_IMAGES } from "./data/wpProofImages";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  Copy,
  FileCode2,
  FileJson,
  FileText,
  Image as ImageIcon,
  PackageOpen,
} from "lucide-react";
import { toast } from "sonner";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function copyText(text: string, label: string) {
  if (!text) {
    toast.error(`${label} is empty.`);
    return;
  }
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`Copied ${label}`))
    .catch(() => toast.error("Copy failed"));
}

/** Full standalone HTML document for a WordPress draft (post.html). */
function packageToHtmlDoc(pkg: WpProofPackage): string {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8" />',
    `<title>${pkg.seoTitle}</title>`,
    `<meta name="description" content="${pkg.seoMeta.replace(/"/g, "&quot;")}" />`,
    "</head>",
    "<body>",
    `<article>`,
    `<h1>${pkg.headline}</h1>`,
    `<p><em>${pkg.dek}</em></p>`,
    bodyToHtml(pkg.body),
    `</article>`,
    "</body>",
    "</html>",
  ].join("\n");
}

/** Publish-route-shaped JSON payload (DRAFT) for a WordPress draft (post.json). */
function packageToPublishJson(pkg: WpProofPackage): string {
  const payload = {
    silo: pkg.silo,
    title: pkg.headline,
    content: bodyToPlain(pkg.body),
    excerpt: pkg.dek,
    metaDescription: pkg.seoMeta,
    categories: [pkg.category],
    tags: pkg.tags,
    status: "draft",
    slug: pkg.slug,
    seoTitle: pkg.seoTitle,
    imageAlt: pkg.imageAlt,
    socialCaption: pkg.socialCaption,
    featuredImageFile: "featured-image.png",
  };
  return JSON.stringify(payload, null, 2);
}

async function downloadFeaturedImage(pkg: WpProofPackage) {
  const url = WP_PROOF_IMAGES[pkg.silo];
  if (!url) {
    toast.error("No image bundled for this silo");
    return;
  }
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    triggerDownload(blob, "featured-image.png");
    toast.success("Downloaded featured image");
  } catch {
    toast.error("Could not download image");
  }
}

interface PackageRowProps {
  pkg: WpProofPackage;
}

function PackageRow({ pkg }: PackageRowProps) {
  const [open, setOpen] = useState(false);
  const htmlBody = bodyToHtml(pkg.body);
  const imgUrl = WP_PROOF_IMAGES[pkg.silo];

  return (
    <div
      className="rounded-xl border border-border/60 bg-secondary/20 overflow-hidden"
      data-testid={`manualpublish-row-${pkg.silo}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        data-testid={`manualpublish-toggle-${pkg.silo}`}
        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-foreground/[0.03] transition-colors"
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: pkg.brandColor }}
        >
          <img
            src={imgUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[13px] font-bold uppercase tracking-wide"
              style={{ color: pkg.brandColor }}
            >
              {pkg.siloName}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-700/40 text-muted-foreground">
              draft ready
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {pkg.headline}
          </p>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/40 pt-3">
          {/* Featured image preview */}
          <div className="rounded-lg overflow-hidden border border-border/40">
            <img
              src={imgUrl}
              alt={pkg.imageAlt}
              className="w-full h-auto block"
              data-testid={`manualpublish-image-${pkg.silo}`}
            />
          </div>

          <Field
            silo={pkg.silo}
            name="title"
            label="Title"
            value={pkg.headline}
          />
          <Field
            silo={pkg.silo}
            name="slug"
            label="Slug"
            value={pkg.slug}
            mono
          />
          <Field
            silo={pkg.silo}
            name="excerpt"
            label="Excerpt / Dek"
            value={pkg.dek}
            multiline
          />
          <Field
            silo={pkg.silo}
            name="category"
            label="Category"
            value={pkg.category}
          />
          <Field
            silo={pkg.silo}
            name="tags"
            label="Tags"
            value={pkg.tags.join(", ")}
          />
          <Field
            silo={pkg.silo}
            name="seotitle"
            label="SEO Title"
            value={pkg.seoTitle}
          />
          <Field
            silo={pkg.silo}
            name="seometa"
            label="SEO Meta Description"
            value={pkg.seoMeta}
            multiline
          />
          <Field
            silo={pkg.silo}
            name="alt"
            label="Featured Image Alt"
            value={pkg.imageAlt}
            multiline
          />
          <Field
            silo={pkg.silo}
            name="social"
            label="Social Caption"
            value={pkg.socialCaption}
            multiline
          />
          <Field
            silo={pkg.silo}
            name="html"
            label="HTML Body"
            value={htmlBody}
            multiline
            mono
          />

          {/* Per-file downloads */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-[11px]"
              data-testid={`manualpublish-dl-html-${pkg.silo}`}
              onClick={() =>
                triggerDownload(
                  new Blob([packageToHtmlDoc(pkg)], { type: "text/html" }),
                  `${pkg.slug}.html`,
                )
              }
            >
              <FileCode2 className="w-3.5 h-3.5 mr-1" />
              post.html
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-[11px]"
              data-testid={`manualpublish-dl-md-${pkg.silo}`}
              onClick={() =>
                triggerDownload(
                  new Blob([packageToMarkdown(pkg)], { type: "text/markdown" }),
                  `${pkg.slug}.md`,
                )
              }
            >
              <FileText className="w-3.5 h-3.5 mr-1" />
              post.md
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-[11px]"
              data-testid={`manualpublish-dl-json-${pkg.silo}`}
              onClick={() =>
                triggerDownload(
                  new Blob([packageToPublishJson(pkg)], {
                    type: "application/json",
                  }),
                  `${pkg.slug}.json`,
                )
              }
            >
              <FileJson className="w-3.5 h-3.5 mr-1" />
              post.json
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-[11px]"
              data-testid={`manualpublish-dl-img-${pkg.silo}`}
              onClick={() => downloadFeaturedImage(pkg)}
            >
              <ImageIcon className="w-3.5 h-3.5 mr-1" />
              image.png
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface FieldProps {
  silo: string;
  name: string;
  label: string;
  value: string;
  multiline?: boolean;
  mono?: boolean;
}

function Field({ silo, name, label, value, multiline, mono }: FieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
          {label}
        </span>
        <button
          type="button"
          onClick={() => copyText(value, label)}
          data-testid={`manualpublish-copy-${name}-${silo}`}
          className="text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/60 hover:border-foreground/40 text-foreground/80"
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
      </div>
      <div
        data-testid={`manualpublish-value-${name}-${silo}`}
        className={`text-[12px] rounded-md border border-border/40 bg-secondary/30 px-2.5 py-1.5 text-foreground/90 ${
          multiline ? "whitespace-pre-wrap break-words" : "truncate"
        } ${mono ? "font-mono text-[11px]" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

export function ManualPublishPanel() {
  const [open, setOpen] = useState(false);

  function copyAll() {
    const all = WP_PROOF_PACKAGES.map(
      (p) =>
        `===== ${p.siloName} =====\n${packageToMarkdown(p)}\n\n----- HTML -----\n${bodyToHtml(
          p.body,
        )}`,
    ).join("\n\n\n");
    copyText(all, "all six drafts");
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-secondary/10 overflow-hidden mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        data-testid="manualpublish-panel-toggle"
        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-foreground/[0.03] transition-colors"
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "#F59E0B", color: "#1a1410" }}
        >
          <PackageOpen className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-black tracking-tight leading-none">
            Manual Publish Kit
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Six WordPress-ready drafts · copy fields or download
            files while REST publishing is blocked
          </p>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/40 pt-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-[11px]"
              data-testid="manualpublish-copy-all"
              onClick={copyAll}
            >
              <ClipboardCopy className="w-3.5 h-3.5 mr-1" />
              Copy all six
            </Button>
          </div>
          {WP_PROOF_PACKAGES.map((pkg) => (
            <PackageRow key={pkg.silo} pkg={pkg} />
          ))}
        </div>
      )}
    </div>
  );
}
