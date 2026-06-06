import {
  Copy,
  Globe,
  Image as ImageIcon,
  Instagram,
  Mail,
  Tag,
  Twitter,
  Video,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import type {
  GenerateResponse,
  PackResponse,
} from "@workspace/api-client-react";
import type { Brand, Platform, Role, Tone } from "./types";

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "managing_editor", label: "Editor" },
  { value: "staff_writer", label: "Writer" },
];

export const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "viral", label: "Viral" },
  { value: "excited", label: "Excited" },
  { value: "fiery", label: "Fiery" },
];

export const PLATFORM_OPTIONS: {
  value: Platform;
  label: string;
  icon: typeof Globe;
}[] = [
  { value: "website", label: "Website", icon: Globe },
  { value: "x", label: "X", icon: Twitter },
  { value: "instagram", label: "IG", icon: Instagram },
  { value: "tiktok", label: "TikTok", icon: Video },
  { value: "newsletter", label: "Newsletter", icon: Mail },
  { value: "youtube", label: "YouTube", icon: Youtube },
];

export function platformLabel(p: Platform): string {
  return PLATFORM_OPTIONS.find((o) => o.value === p)?.label ?? p;
}

export function copyText(
  text: string,
  brand: { bg: string; on: string; label: string },
) {
  if (!text) return;
  navigator.clipboard
    .writeText(text)
    .then(() =>
      toast.success(`Copied ${brand.label}`, {
        style: { background: brand.bg, color: brand.on, border: "none" },
        icon: <Copy className="w-4 h-4" style={{ color: brand.on }} />,
      }),
    )
    .catch(() => toast.error("Failed to copy."));
}

export function packToMarkdown(p: PackResponse): string {
  return [
    `# ${p.headline}`,
    ``,
    `_${p.summary}_`,
    ``,
    `## Article`,
    ``,
    p.article,
    ``,
    `## X / Twitter`,
    ``,
    p.social.x,
    ``,
    `## Instagram`,
    ``,
    p.social.instagram,
    ``,
    `## TikTok`,
    ``,
    p.social.tiktok,
    ``,
    `## Newsletter`,
    ``,
    p.social.newsletter,
    ``,
    `## YouTube`,
    ``,
    p.social.youtube,
    ``,
    `## SEO`,
    ``,
    `**Meta Description:** ${p.seo.metaDescription}`,
    ``,
    `**Categories:** ${p.seo.categories.join(", ")}`,
    ``,
    `**Tags:** ${(p.seo.tags ?? []).map((t) => `#${t}`).join(" ")}`,
    ``,
    `## Image Prompts`,
    ``,
    ...p.imagePrompts.map((img, i) => `${i + 1}. ${img}`),
    ``,
  ].join("\n");
}

export function quickToMarkdown(
  q: GenerateResponse,
  platform: Platform,
): string {
  return [
    `# ${platformLabel(platform)} Content`,
    ``,
    q.content,
    ``,
    `## SEO`,
    ``,
    `**Meta Description:** ${q.seo.metaDescription}`,
    ``,
    `**Categories:** ${q.seo.categories.join(", ")}`,
    ``,
    `**Tags:** ${(q.seo.tags ?? []).map((t) => `#${t}`).join(" ")}`,
    ``,
    `## Image Prompts`,
    ``,
    ...q.imagePrompts.map((img, i) => `${i + 1}. ${img}`),
    ``,
  ].join("\n");
}

export function deriveQuickTitle(
  promptText: string,
  content: string,
): string {
  const trimmedPrompt = promptText.trim();
  if (trimmedPrompt) return trimmedPrompt.slice(0, 200);
  const firstLine = content
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  return (firstLine ?? "Untitled").replace(/^#+\s*/, "").slice(0, 200);
}

interface PillGroupProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  brand: Brand;
}

export function PillGroup({
  label,
  options,
  value,
  onChange,
  disabled,
  brand,
}: PillGroupProps) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-12 shrink-0 mt-2">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-secondary/60 border border-border">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              disabled={disabled}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all disabled:opacity-50 whitespace-nowrap"
              style={{
                background: active ? brand.bg : "transparent",
                color: active ? brand.on : "hsl(var(--muted-foreground))",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface PlatformGroupProps {
  value: Platform;
  onChange: (v: Platform) => void;
  disabled: boolean;
  brand: Brand;
}

export function PlatformGroup({
  value,
  onChange,
  disabled,
  brand,
}: PlatformGroupProps) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-12 shrink-0 mt-2">
        Format
      </span>
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-secondary/60 border border-border">
        {PLATFORM_OPTIONS.map(({ value: v, label, icon: Icon }) => {
          const active = value === v;
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              disabled={disabled}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all disabled:opacity-50 whitespace-nowrap inline-flex items-center gap-1.5"
              style={{
                background: active ? brand.bg : "transparent",
                color: active ? brand.on : "hsl(var(--muted-foreground))",
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  text: string;
  brand: Brand;
  mono?: boolean;
}

export function Section({ title, icon, text, brand, mono }: SectionProps) {
  if (!text?.trim()) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/40">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <div
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: brand.color }}
        >
          {icon}
          {title}
        </div>
        <button
          onClick={() => copyText(text, { ...brand, label: title })}
          className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-foreground/5"
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
      </div>
      <p
        className={`p-3 text-sm whitespace-pre-wrap text-foreground/90 ${mono ? "font-mono text-xs leading-relaxed" : "leading-relaxed"}`}
      >
        {text}
      </p>
    </div>
  );
}

export function SeoSection({
  seo,
  brand,
}: {
  seo: { categories: string[]; tags: string[]; metaDescription: string };
  brand: Brand;
}) {
  if (!seo.categories.length && !seo.tags.length && !seo.metaDescription)
    return null;
  const flatText = [
    seo.metaDescription ? `Meta Description: ${seo.metaDescription}` : "",
    seo.categories.length
      ? `Categories: ${seo.categories.join(", ")}`
      : "",
    seo.tags.length
      ? `Tags: ${seo.tags.map((t) => `#${t}`).join(" ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  const metaLen = seo.metaDescription.length;
  const metaStatus =
    metaLen === 0
      ? "muted"
      : metaLen < 120 || metaLen > 156
        ? "warn"
        : "ok";
  const metaStatusColor =
    metaStatus === "ok"
      ? "text-emerald-400"
      : metaStatus === "warn"
        ? "text-amber-400"
        : "text-muted-foreground";
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/40">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <div
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: brand.color }}
        >
          <Tag className="w-3.5 h-3.5" />
          SEO
        </div>
        <button
          onClick={() => copyText(flatText, { ...brand, label: "SEO" })}
          className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-foreground/5"
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
      </div>
      <div className="p-3 space-y-3">
        {seo.metaDescription && (
          <div className="rounded-md border border-border/40 bg-secondary/60">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/30">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                Yoast Meta Description
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono ${metaStatusColor}`}>
                  {metaLen}/156
                </span>
                <button
                  onClick={() =>
                    copyText(seo.metaDescription, {
                      ...brand,
                      label: "Meta description",
                    })
                  }
                  className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-foreground/5"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
            </div>
            <p className="px-2.5 py-2 text-[13px] leading-snug text-foreground/90">
              {seo.metaDescription}
            </p>
          </div>
        )}
        {seo.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {seo.categories.map((c) => (
              <span
                key={c}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: brand.bg, color: brand.on }}
              >
                {c}
              </span>
            ))}
          </div>
        )}
        {seo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {seo.tags.map((t) => (
              <span
                key={t}
                className="text-[11px] text-foreground/70 px-1.5 py-0.5 rounded bg-foreground/5"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ImagePromptSection({
  prompts,
  brand,
}: {
  prompts: string[];
  brand: Brand;
}) {
  if (!prompts.length) return null;
  const flatText = prompts.map((p, i) => `${i + 1}. ${p}`).join("\n\n");
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/40">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <div
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: brand.color }}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Image Prompts
        </div>
        <button
          onClick={() =>
            copyText(flatText, { ...brand, label: "image prompts" })
          }
          className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-foreground/5"
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
      </div>
      <div className="p-3 space-y-2">
        {prompts.map((p, i) => (
          <div
            key={i}
            className="text-sm text-foreground/90 flex gap-2 group/item"
          >
            <span className="text-xs text-muted-foreground/60 w-5 shrink-0 pt-0.5">
              {i + 1}.
            </span>
            <span className="flex-1">{p}</span>
            <button
              onClick={() =>
                copyText(p, {
                  ...brand,
                  label: `image prompt ${i + 1}`,
                })
              }
              className="opacity-0 group-hover/item:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1"
              aria-label={`Copy image prompt ${i + 1}`}
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
