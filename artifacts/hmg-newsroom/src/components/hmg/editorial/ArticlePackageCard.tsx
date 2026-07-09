import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Type,
  FileText,
  ListChecks,
  Calendar,
  ShieldAlert,
  Search,
  Megaphone,
  ClipboardCheck,
  ArrowRight,
  Download,
  Send,
  Image as ImageIcon,
  Save,
  CheckCircle,
  Gauge,
} from "lucide-react";
import type {
  ArticleStrength,
  EditorialArticlePackage,
  StrengthSignal,
} from "@/lib/hmg/editorial";
import {
  buildWordpressPackage,
  packageToCopyableText,
} from "@/lib/hmg/editorial";
import { FastPublishPrep } from "./FastPublishPrep";
import { WPMemoryHook } from "@/components/newsroom/WPMemoryHook";
import { recordWordPressDraft } from "@/lib/useOutputHistory";

interface ArticlePackageCardProps {
  pkg: EditorialArticlePackage;
  accent: string;
  onAccent: string;
  strength?: ArticleStrength | null;
  onSendToArtBot?: (pkg: EditorialArticlePackage) => void;
  onSendToSocialFactory?: (pkg: EditorialArticlePackage) => void;
  onSaveDraft?: (pkg: EditorialArticlePackage) => void;
  onCreateReceipt?: (pkg: EditorialArticlePackage) => void;
}

const BAND_TOKEN: Record<StrengthSignal["band"], { dot: string; text: string }> = {
  strong: { dot: "bg-emerald-400", text: "text-emerald-400" },
  fair: { dot: "bg-amber-400", text: "text-amber-300" },
  weak: { dot: "bg-rose-400", text: "text-rose-300" },
};

function StrengthBlock({
  strength,
  accent,
}: {
  strength: ArticleStrength;
  accent: string;
}) {
  const headlineToken = BAND_TOKEN[strength.band];
  return (
    <div className="border-b border-border/40" data-testid="article-strength-block">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/40">
        <div
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: accent }}
        >
          <Gauge className="w-3.5 h-3.5" />
          Article Strength
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${headlineToken.dot}`} />
          <span
            className={`text-[11px] font-bold uppercase tracking-wider ${headlineToken.text}`}
            data-testid="article-strength-score"
          >
            {strength.score} · {strength.band}
          </span>
        </div>
      </div>
      <ul className="p-3 space-y-1.5">
        {strength.signals.map((s) => {
          const t = BAND_TOKEN[s.band];
          return (
            <li
              key={s.id}
              className="flex items-start gap-2 text-[13px] leading-snug"
              data-testid={`article-strength-${s.id}`}
            >
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} />
              <span className="flex-1">
                <span className="font-semibold mr-1">{s.label}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider mr-2 ${t.text}`}>
                  {s.band}
                </span>
                <span className="text-foreground/75">{s.detail}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="px-3 pb-3 text-[12px] text-foreground/80 italic">
        {strength.recommendation}
      </p>
    </div>
  );
}

function copyText(text: string, label: string) {
  if (typeof navigator === "undefined") return;
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error(`Failed to copy ${label.toLowerCase()}`));
}

function downloadFile(filename: string, body: string, mime: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob([body], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`${filename} downloaded`);
}

function ArticleBody({
  text,
  accent,
}: {
  text: string;
  accent: string;
}) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className="text-[15px] leading-relaxed text-foreground/90"
          style={i === 0 ? { borderLeft: `2px solid ${accent}`, paddingLeft: "10px" } : undefined}
        >
          {p}
        </p>
      ))}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  accent,
  rightSlot,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/40">
      <div
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
        style={{ color: accent }}
      >
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      {rightSlot}
    </div>
  );
}

function CopyChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-foreground/5"
    >
      <Copy className="w-3 h-3" />
      {label}
    </button>
  );
}

export function ArticlePackageCard({
  pkg,
  accent,
  onAccent,
  strength,
  onSendToArtBot,
  onSendToSocialFactory,
  onSaveDraft,
  onCreateReceipt,
}: ArticlePackageCardProps) {
  const [savedFlag, setSavedFlag] = useState(false);

  const exportWordPress = () => {
    const wp = buildWordpressPackage(pkg);
    downloadFile(
      `${wp.slug || "article"}-wordpress-draft.json`,
      JSON.stringify(wp, null, 2),
      "application/json",
    );
    recordWordPressDraft({
      silo: pkg.brand,
      siloName: pkg.brandName,
      prompt: pkg.headline,
      output: {
        title: pkg.headline,
        slug: wp.slug,
        excerpt: pkg.wordpressExcerpt,
        seoTitle: pkg.seoTitle,
        seoDescription: pkg.seoDescription,
        tags: pkg.suggestedTags,
        status: "draft",
        exportedAt: new Date().toISOString(),
      },
    });
    toast.success("WordPress draft saved to Output History.");
  };
  const copyWordPressHtml = () => {
    const wp = buildWordpressPackage(pkg);
    copyText(wp.contentHtml, "WordPress HTML");
  };
  const copyExcerpt = () => copyText(pkg.wordpressExcerpt, "Excerpt");
  const copySeo = () =>
    copyText(
      `Title: ${pkg.seoTitle}\nDescription: ${pkg.seoDescription}\nTags: ${pkg.suggestedTags.join(", ")}`,
      "SEO",
    );
  const copyArticle = () => copyText(pkg.articleBody, "Article");
  const copyHeadline = () => copyText(pkg.headline, "Headline");
  const copyAllAsText = () => copyText(packageToCopyableText(pkg), "Full article");
  const copySocialCaption = () => copyText(pkg.socialCaption, "Social caption");

  const saveDraft = () => {
    if (onSaveDraft) onSaveDraft(pkg);
    setSavedFlag(true);
    toast.success("Draft saved to Publish Prep");
  };

  const sendArtBot = () => {
    if (onSendToArtBot) onSendToArtBot(pkg);
    toast.success("Ready for WebArt");
  };

  const sendSocialFactory = () => {
    if (onSendToSocialFactory) onSendToSocialFactory(pkg);
    toast.success("Sent to Social Factory");
  };

  const createReceipt = () => {
    if (onCreateReceipt) {
      onCreateReceipt(pkg);
    } else {
      const receipt = {
        id: pkg.id,
        brand: pkg.brandName,
        articleType: pkg.articleType,
        headline: pkg.headline,
        createdAt: pkg.createdAt,
        verificationNotes: pkg.verificationNotes,
        whatNotToClaim: pkg.whatNotToClaim,
      };
      downloadFile(
        `${pkg.id}-editorial-receipt.json`,
        JSON.stringify(receipt, null, 2),
        "application/json",
      );
    }
  };

  return (
    <div
      className="rounded-xl border bg-card/40 overflow-hidden shadow-sm"
      style={{ borderColor: `${accent}55` }}
      data-testid="article-package-card"
    >
      {/* Output action bar — Primary + Secondary, grouped */}
      <div
        className="px-3 py-2.5 border-b border-border/40 space-y-2"
        style={{ background: `${accent}10` }}
        data-testid="article-output-action-bar"
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: accent, color: onAccent }}
          >
            <CheckCircle className="w-3 h-3" />
            {pkg.brandName} · {pkg.articleType}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Created {new Date(pkg.createdAt).toLocaleString()}
          </span>
        </div>
        {/* Primary row */}
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            onClick={copyArticle}
            className="h-9 text-[12px] font-bold rounded-full"
            style={{ background: accent, color: onAccent }}
            data-testid="copy-article"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Copy Article
          </Button>
          <Button
            size="sm"
            onClick={exportWordPress}
            className="h-9 text-[12px] font-bold rounded-full"
            style={{ background: accent, color: onAccent }}
            data-testid="export-wp-package"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export WordPress Draft
          </Button>
        </div>
        {/* Secondary row */}
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={copyHeadline} data-testid="copy-headline">
            <Type className="w-3 h-3 mr-1" />
            Copy Headline
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={copySeo} data-testid="copy-seo-btn">
            <Copy className="w-3 h-3 mr-1" />
            Copy SEO
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={saveDraft} data-testid="save-draft">
            <Save className="w-3 h-3 mr-1" />
            Save Draft
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={sendArtBot} data-testid="send-artbot">
            <ImageIcon className="w-3 h-3 mr-1" />
            Open WebArt
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={sendSocialFactory} data-testid="send-social-factory">
            <Send className="w-3 h-3 mr-1" />
            Open Social Factory
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={createReceipt} data-testid="create-receipt">
            <Download className="w-3 h-3 mr-1" />
            Create Receipt
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-[11px] text-muted-foreground hover:text-foreground" onClick={copyAllAsText} data-testid="copy-all">
            <Copy className="w-3 h-3 mr-1" />
            Copy Full Article
          </Button>
        </div>
      </div>

      {strength && <StrengthBlock strength={strength} accent={accent} />}

      {/* Headline + alternates */}
      <div className="p-3 space-y-2 border-b border-border/40" data-testid="article-headline-block">
        <h2 className="text-xl font-black leading-tight text-foreground">{pkg.headline}</h2>
        <p className="text-sm leading-relaxed text-foreground/70 italic">{pkg.dek}</p>
        {pkg.alternateHeadlines.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Alternate Headlines
            </div>
            {pkg.alternateHeadlines.map((alt, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-background/40 px-2 py-1.5"
              >
                <span className="text-[13px] text-foreground/85 leading-snug flex-1">{alt}</span>
                <CopyChip label="Copy" onClick={() => copyText(alt, `Alternate ${i + 1}`)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Article body */}
      <div className="border-b border-border/40">
        <SectionHeader icon={FileText} title="Article Body" accent={accent} rightSlot={<CopyChip label="Copy" onClick={copyArticle} />} />
        <div className="p-3" data-testid="article-body">
          <ArticleBody text={pkg.articleBody} accent={accent} />
        </div>
      </div>

      {/* Key Facts */}
      {pkg.keyFacts.length > 0 && (
        <div className="border-b border-border/40">
          <SectionHeader
            icon={ListChecks}
            title="Key Facts"
            accent={accent}
            rightSlot={
              <CopyChip
                label="Copy"
                onClick={() => copyText(pkg.keyFacts.map((f) => `• ${f}`).join("\n"), "Key facts")}
              />
            }
          />
          <ul className="p-3 space-y-1.5" data-testid="article-keyfacts">
            {pkg.keyFacts.map((fact, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/90 leading-relaxed">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />
                <span className="flex-1">{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timeline */}
      {pkg.timelineDates.length > 0 && (
        <div className="border-b border-border/40">
          <SectionHeader
            icon={Calendar}
            title="Timeline / Dates"
            accent={accent}
            rightSlot={
              <CopyChip
                label="Copy"
                onClick={() => copyText(pkg.timelineDates.map((t) => `• ${t}`).join("\n"), "Timeline")}
              />
            }
          />
          <ul className="p-3 space-y-1.5" data-testid="article-timeline">
            {pkg.timelineDates.map((t, i) => (
              <li key={i} className="text-sm text-foreground/85 leading-snug">{t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Verification Notes */}
      <div className="border-b border-border/40">
        <SectionHeader icon={ShieldAlert} title="Verification Notes" accent={accent} />
        <ul className="p-3 space-y-1.5" data-testid="article-verification">
          {pkg.verificationNotes.map((v, i) => (
            <li key={i} className="text-[13px] text-amber-200/90 leading-snug">{v}</li>
          ))}
        </ul>
      </div>

      {/* What Not To Claim */}
      <div className="border-b border-border/40">
        <SectionHeader icon={ShieldAlert} title="What Not To Claim" accent={accent} />
        <ul className="p-3 space-y-1.5" data-testid="article-warnings">
          {pkg.whatNotToClaim.map((w, i) => (
            <li key={i} className="text-[13px] text-foreground/85 leading-snug">— {w}</li>
          ))}
        </ul>
      </div>

      {/* SEO */}
      <div className="border-b border-border/40">
        <SectionHeader
          icon={Search}
          title="SEO"
          accent={accent}
          rightSlot={<CopyChip label="Copy" onClick={copySeo} />}
        />
        <div className="p-3 space-y-1.5 text-[13px]" data-testid="article-seo">
          <p>
            <span className="text-muted-foreground">Title:</span> {pkg.seoTitle}
          </p>
          <p>
            <span className="text-muted-foreground">Description:</span> {pkg.seoDescription}
          </p>
          <p>
            <span className="text-muted-foreground">Tags:</span> {pkg.suggestedTags.join(", ")}
          </p>
        </div>
      </div>

      {/* Social */}
      <div className="border-b border-border/40">
        <SectionHeader
          icon={Megaphone}
          title="Social Caption"
          accent={accent}
          rightSlot={<CopyChip label="Copy" onClick={copySocialCaption} />}
        />
        <div className="p-3 space-y-2 text-[13px]" data-testid="article-social">
          <p>{pkg.socialCaption}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border border-border/40 bg-background/40 p-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">X / Twitter</p>
              <p className="whitespace-pre-wrap">{pkg.xPost}</p>
            </div>
            <div className="rounded-md border border-border/40 bg-background/40 p-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Instagram</p>
              <p className="whitespace-pre-wrap">{pkg.instagramCaption}</p>
            </div>
            <div className="rounded-md border border-border/40 bg-background/40 p-2 sm:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">YouTube Description</p>
              <p className="whitespace-pre-wrap">{pkg.youtubeDescription}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fast Publish Prep — one-hand WordPress send */}
      <div className="p-3 border-b border-border/40">
        <FastPublishPrep pkg={pkg} accent={accent} onAccent={onAccent} />
      </div>

      {/* WordPress Post Builder */}
      <div className="border-b border-border/40">
        <SectionHeader icon={FileText} title="WordPress Post Builder" accent={accent} />
        <div className="p-3 space-y-2 text-[13px]" data-testid="article-wordpress">
          <p>
            <span className="text-muted-foreground">Excerpt:</span> {pkg.wordpressExcerpt}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={exportWordPress} data-testid="export-wp-package">
              <Download className="w-3 h-3 mr-1" />
              Export WordPress Draft
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={copyWordPressHtml} data-testid="copy-wp-html">
              <Copy className="w-3 h-3 mr-1" />
              Copy WordPress HTML
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={copyExcerpt} data-testid="copy-excerpt">
              <Copy className="w-3 h-3 mr-1" />
              Copy Excerpt
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={copySeo} data-testid="copy-seo-btn">
              <Copy className="w-3 h-3 mr-1" />
              Copy SEO
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/80 leading-snug" data-testid="wp-blocked-note">
            No live WordPress publish from this app. Use Export WordPress Draft to create a clean
            draft for manual WordPress transfer.
          </p>

          {/* Memory Hook — reads Founder KB locally */}
          <WPMemoryHook
            brand={pkg.brand}
            brandName={pkg.brandName}
            headline={pkg.headline}
            seoTitle={pkg.seoTitle}
            seoDescription={pkg.seoDescription}
            wordpressExcerpt={pkg.wordpressExcerpt}
            suggestedTags={pkg.suggestedTags}
            accent={accent}
          />
        </div>
      </div>

      {/* Publish Checklist */}
      <div className="border-b border-border/40">
        <SectionHeader icon={ClipboardCheck} title="Publish Checklist" accent={accent} />
        <ul className="p-3 space-y-1.5" data-testid="article-checklist">
          {pkg.publishChecklist.map((c, i) => (
            <li key={i} className="flex gap-2 text-[13px] text-foreground/85 leading-snug">
              <ClipboardCheck className="mt-0.5 w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
              <span className="flex-1">{c}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Next Actions */}
      <div className="border-b border-border/40">
        <SectionHeader icon={ArrowRight} title="Next Actions" accent={accent} />
        <ul className="p-3 space-y-1.5" data-testid="article-next-actions">
          {pkg.nextActions.map((n, i) => (
            <li key={i} className="text-[13px] text-foreground/85 leading-snug">→ {n}</li>
          ))}
        </ul>
      </div>

      {savedFlag && (
        <div className="px-3 py-2 text-[11px] text-emerald-300 inline-flex items-center gap-1.5 border-t border-border/40">
          <CheckCircle className="w-3 h-3" />
          Draft saved to Publish Prep.
        </div>
      )}
    </div>
  );
}
