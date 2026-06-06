import {
  CheckSquare,
  Copy,
  FileText,
  Instagram,
  Layers,
  ListChecks,
  Mail,
  Newspaper,
  PenTool,
  Sparkles,
  Twitter,
  Type,
  Video,
  Youtube,
} from "lucide-react";
import type { Silo as ApiSilo } from "@workspace/api-client-react";
import { SpecialistsPanel } from "../SpecialistsPanel";
import { PublishPanel } from "../PublishPanel";
import { TrentOverridePanel } from "../TrentOverridePanel";
import {
  ImagePromptSection,
  Section,
  SeoSection,
  copyText,
  deriveQuickTitle,
  platformLabel,
} from "./shared";
import type { Brand, Platform, QuickResult } from "./types";

interface QuickOutputProps {
  result: QuickResult;
  brand: Brand;
  silo: ApiSilo;
  siloName: string;
  promptText: string;
  /** Optional callback to mutate the displayed content (e.g. from Trent Override). */
  onUpdateContent?: (next: string) => void;
}

const SOCIAL_ROWS: {
  key: "x" | "instagram" | "tiktok" | "newsletter" | "youtube";
  label: string;
  icon: typeof Twitter;
}[] = [
  { key: "x", label: "X / Twitter", icon: Twitter },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "tiktok", label: "TikTok", icon: Video },
  { key: "newsletter", label: "Newsletter", icon: Mail },
  { key: "youtube", label: "YouTube", icon: Youtube },
];

type QuickData = QuickResult["data"] & {
  fallback?: boolean;
  notice?: string;
};

function buildFullPackage(
  data: QuickData,
  title: string,
  platform: Platform,
): string {
  const lines: string[] = [`# ${title}`];
  if (data.dek?.trim()) lines.push("", `_${data.dek.trim()}_`);
  if (data.altHeadlines?.length) {
    lines.push(
      "",
      "## Alternate Headlines",
      ...data.altHeadlines.map((h) => `- ${h}`),
    );
  }
  lines.push("", `## ${platformLabel(platform)}`, "", data.content);
  if (data.keyFacts?.length) {
    lines.push("", "## Key Facts", ...data.keyFacts.map((f) => `- ${f}`));
  }
  const social = data.social;
  if (social) {
    lines.push("", "## Social Pack");
    for (const { key, label } of SOCIAL_ROWS) {
      const val = social[key];
      if (val?.trim()) lines.push("", `### ${label}`, "", val.trim());
    }
  }
  lines.push(
    "",
    "## SEO",
    "",
    `**Meta description:** ${data.seo.metaDescription}`,
    `**Categories:** ${data.seo.categories.join(", ")}`,
    `**Tags:** ${(data.seo.tags ?? []).map((t) => `#${t}`).join(" ")}`,
  );
  return lines.join("\n");
}

/** Renders the long-form article body as a real draft document. */
function ArticleDraft({
  text,
  brand,
}: {
  text: string;
  brand: Brand;
}) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="space-y-3 rounded-lg border border-border/40 bg-gradient-to-b from-secondary/50 to-transparent p-4">
      {paragraphs.map((para, i) => {
        const isQuote = para.startsWith('"') || para.startsWith("“");
        if (isQuote) {
          return (
            <blockquote
              key={i}
              className="border-l-2 pl-3 text-sm italic leading-relaxed text-foreground/70"
              style={{ borderColor: brand.color }}
            >
              {para.replace(/^["“]|["”]$/g, "")}
            </blockquote>
          );
        }
        const labelMatch = para.match(/^([A-Z][^:]{2,28}):\s+([\s\S]+)$/);
        if (labelMatch) {
          return (
            <p
              key={i}
              className="text-[15px] leading-relaxed text-foreground/90"
            >
              <span className="font-bold" style={{ color: brand.color }}>
                {labelMatch[1]}:
              </span>{" "}
              {labelMatch[2]}
            </p>
          );
        }
        return (
          <p
            key={i}
            className={`text-foreground/90 leading-relaxed ${
              i === 0 ? "text-[15px] font-medium" : "text-[15px]"
            }`}
          >
            {para}
          </p>
        );
      })}
    </div>
  );
}

export function QuickOutput({
  result,
  brand,
  silo,
  siloName,
  promptText,
  onUpdateContent,
}: QuickOutputProps) {
  const data = result.data as QuickData;
  const title = data.headline?.trim() || deriveQuickTitle(promptText, data.content);
  const altHeadlines = data.altHeadlines ?? [];
  const keyFacts = data.keyFacts ?? [];
  const checklist = data.checklist ?? [];
  const social = data.social;
  const isLocal = Boolean(data.fallback);
  const isLongForm =
    result.platform === "website" || result.platform === "newsletter";

  const publishPayload = {
    title,
    content: data.content,
    excerpt: data.seo.metaDescription,
    metaDescription: data.seo.metaDescription,
    categories: data.seo.categories,
    tags: data.seo.tags ?? [],
  };

  return (
    <>
      {/* ENGINE HEADER */}
      <div
        data-testid="article-studio-engine"
        className="rounded-xl border bg-gradient-to-br from-secondary/40 to-transparent overflow-hidden"
        style={{ borderColor: `${brand.color}55` }}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
              style={{ background: brand.bg, color: brand.on }}
            >
              <PenTool className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-black tracking-tight leading-none text-foreground">
                Haven Writing Desk
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {siloName} · {platformLabel(result.platform)} draft
              </div>
            </div>
          </div>
          <span
            data-testid="article-studio-mode"
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0"
            style={
              isLocal
                ? {
                    background: "transparent",
                    color: brand.color,
                    border: `1px solid ${brand.color}66`,
                  }
                : { background: brand.bg, color: brand.on }
            }
          >
            <Sparkles className="h-2.5 w-2.5" />
            {isLocal ? "Haven Writing Desk" : "Live Writing Desk"}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-border/30 px-3 py-2">
          <button
            onClick={() => copyText(data.content, { ...brand, label: "article" })}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-foreground/80 hover:text-foreground hover:bg-foreground/5"
          >
            <FileText className="h-3 w-3" />
            Copy Article
          </button>
          <button
            onClick={() => copyText(title, { ...brand, label: "headline" })}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-foreground/80 hover:text-foreground hover:bg-foreground/5"
          >
            <Type className="h-3 w-3" />
            Copy Headline
          </button>
          <button
            onClick={() =>
              copyText(
                buildFullPackage(data, title, result.platform),
                { ...brand, label: "full article output" },
              )
            }
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: brand.bg, color: brand.on }}
          >
            <Layers className="h-3 w-3" />
            Copy Full Article
          </button>
        </div>
      </div>

      {/* HEADLINE STUDIO */}
      {data.headline?.trim() && (
        <div
          data-testid="article-studio-headline"
          className="rounded-xl border bg-secondary/40 overflow-hidden"
          style={{ borderColor: `${brand.color}55` }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
            <div
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
              style={{ color: brand.color }}
            >
              <Type className="w-3.5 h-3.5" />
              Recommended Headline
            </div>
            <button
              onClick={() =>
                copyText(data.headline ?? "", { ...brand, label: "headline" })
              }
              className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-foreground/5"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
          <div className="p-3 space-y-2">
            <h2 className="text-lg font-black leading-tight text-foreground">
              {data.headline}
            </h2>
            {data.dek?.trim() && (
              <p className="text-sm leading-relaxed text-foreground/70">
                {data.dek}
              </p>
            )}
            {altHeadlines.length > 0 && (
              <div className="pt-1 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  Alternative Headlines
                </div>
                {altHeadlines.map((alt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-secondary/40 px-2.5 py-1.5 group/alt"
                  >
                    <span className="text-[13px] text-foreground/85 leading-snug">
                      {alt}
                    </span>
                    <button
                      onClick={() =>
                        copyText(alt, { ...brand, label: `headline ${i + 1}` })
                      }
                      className="opacity-0 group-hover/alt:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1 shrink-0"
                      aria-label={`Copy alternative headline ${i + 1}`}
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN BODY */}
      {isLongForm ? (
        <div
          data-testid="article-studio-body"
          className="rounded-lg border border-border/60 bg-secondary/40"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
            <div
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
              style={{ color: brand.color }}
            >
              <Newspaper className="w-3.5 h-3.5" />
              Full Article
            </div>
            <button
              onClick={() =>
                copyText(data.content, { ...brand, label: "article" })
              }
              className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-foreground/5"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
          <div className="p-3">
            <ArticleDraft text={data.content} brand={brand} />
          </div>
        </div>
      ) : (
        <Section
          title={platformLabel(result.platform)}
          icon={<Newspaper className="w-3.5 h-3.5" />}
          text={data.content}
          brand={brand}
          mono={result.platform === "tiktok"}
        />
      )}

      {/* KEY FACTS PRESERVED */}
      {keyFacts.length > 0 && (
        <div
          data-testid="article-studio-keyfacts"
          className="rounded-lg border border-border/60 bg-secondary/40"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
            <div
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
              style={{ color: brand.color }}
            >
              <ListChecks className="w-3.5 h-3.5" />
              Key Facts Preserved
            </div>
            <button
              onClick={() =>
                copyText(keyFacts.map((f) => `• ${f}`).join("\n"), {
                  ...brand,
                  label: "key facts",
                })
              }
              className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-foreground/5"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
          <ul className="p-3 space-y-1.5">
            {keyFacts.map((fact, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm text-foreground/90 leading-relaxed"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: brand.color }}
                />
                <span className="flex-1">{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <TrentOverridePanel
        original={data.content}
        silo={silo}
        brand={brand}
        testIdPrefix="trent-override-quick"
        fieldLabel={platformLabel(result.platform).toLowerCase()}
        onApply={onUpdateContent}
      />

      {/* SOCIAL PACK */}
      {social && (
        <div
          data-testid="article-studio-social"
          className="rounded-lg border border-border/60 bg-secondary/40"
        >
          <div
            className="flex items-center justify-between px-3 py-2 border-b border-border/40"
            style={{ color: brand.color }}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Social Pack
            </span>
            <button
              onClick={() =>
                copyText(
                  SOCIAL_ROWS.map(({ key, label }) =>
                    social[key]?.trim()
                      ? `${label}:\n${social[key]}`
                      : "",
                  )
                    .filter(Boolean)
                    .join("\n\n"),
                  { ...brand, label: "social pack" },
                )
              }
              className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-foreground/5"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          </div>
          <div className="p-3 space-y-2">
            {SOCIAL_ROWS.map(({ key, label, icon: Icon }) => {
              const value = social[key];
              if (!value?.trim()) return null;
              return (
                <div
                  key={key}
                  className="rounded-md border border-border/40 bg-secondary/40 p-2.5"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <Icon className="w-3 h-3" />
                      {label}
                    </span>
                    <button
                      onClick={() => copyText(value, { ...brand, label })}
                      className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-foreground/5"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                  <p className="text-[13px] text-foreground/85 leading-snug whitespace-pre-wrap break-words">
                    {value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <SeoSection seo={{ ...data.seo, tags: data.seo.tags ?? [] }} brand={brand} />

      {/* FOUNDER VOICE GATE / PRE-PUBLISH CHECKLIST */}
      {checklist.length > 0 && (
        <div
          data-testid="article-studio-checklist"
          className="rounded-lg border bg-secondary/40"
          style={{ borderColor: `${brand.color}40` }}
        >
          <div
            className="flex items-center justify-between px-3 py-2 border-b border-border/40"
            style={{ color: brand.color }}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
              <CheckSquare className="w-3.5 h-3.5" />
              Pre-Publish Gate
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {checklist.length} checks
            </span>
          </div>
          <ul className="p-3 space-y-1.5">
            {checklist.map((item, i) => (
              <li
                key={i}
                className="flex gap-2 text-[13px] text-foreground/80 leading-relaxed"
              >
                <CheckSquare className="mt-0.5 w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ImagePromptSection prompts={data.imagePrompts} brand={brand} />
      <SpecialistsPanel silo={silo} siloName={siloName} brand={brand} />
      <PublishPanel
        silo={silo}
        siloName={siloName}
        payload={publishPayload}
        brand={brand}
      />
    </>
  );
}
