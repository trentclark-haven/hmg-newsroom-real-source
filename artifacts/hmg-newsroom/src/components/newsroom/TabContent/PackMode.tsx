import {
  CheckCircle2,
  Instagram,
  Mail,
  Newspaper,
  RefreshCw,
  ShieldCheck,
  Twitter,
  Video,
  Youtube,
  XCircle,
  Zap,
  Loader2,
} from "lucide-react";
import type { Silo as ApiSilo } from "@workspace/api-client-react";
import { SpecialistsPanel } from "../SpecialistsPanel";
import { PublishPanel } from "../PublishPanel";
import { TrentOverridePanel } from "../TrentOverridePanel";
import { ImagePromptSection, Section, SeoSection } from "./shared";
import type { Brand, PackResult } from "./types";

interface PackOutputProps {
  result: PackResult;
  brand: Brand;
  silo: ApiSilo;
  siloName: string;
  /** Optional callback to mutate the displayed article (e.g. from Trent Override). */
  onUpdateArticle?: (next: string) => void;
  /** Per-section retry plumbing. Section currently being retried (or null). */
  retryingSection?: string | null;
  /** Triggered when the operator taps Retry on a failed section. */
  onRetrySection?: (sectionId: string) => void;
  /** Whether founder voice is on for this silo (drives the voice section status). */
  founderVoiceOn?: boolean;
}

type SectionStatus = "success" | "failed" | "n/a";

function statusFor(value: unknown): SectionStatus {
  if (typeof value === "string") return value.trim().length > 0 ? "success" : "failed";
  if (Array.isArray(value)) return value.length > 0 ? "success" : "failed";
  return "failed";
}

function StatusPill({
  status,
  sectionId,
}: {
  status: SectionStatus;
  sectionId: string;
}) {
  const cls =
    status === "success"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
      : status === "failed"
        ? "bg-red-500/15 text-red-300 border-red-500/40"
        : "bg-muted/20 text-muted-foreground border-border/40";
  const Icon =
    status === "success" ? CheckCircle2 : status === "failed" ? XCircle : ShieldCheck;
  const label = status === "n/a" ? "—" : status === "success" ? "ok" : "failed";
  return (
    <span
      data-testid={`pack-section-status-${sectionId}`}
      className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${cls}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

interface PackSectionProps {
  id: string;
  status: SectionStatus;
  retrying: boolean;
  canRetry: boolean;
  onRetry?: (id: string) => void;
  children: React.ReactNode;
}

function PackSection({
  id,
  status,
  retrying,
  canRetry,
  onRetry,
  children,
}: PackSectionProps) {
  return (
    <div
      data-testid={`pack-section-${id}`}
      className="space-y-1"
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <StatusPill status={status} sectionId={id} />
        {status === "failed" && canRetry && onRetry && (
          <button
            type="button"
            onClick={() => onRetry(id)}
            disabled={retrying}
            data-testid={`pack-section-retry-${id}`}
            className="text-[10px] font-semibold inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border hover:border-foreground/40 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            {retrying ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {retrying ? "Retrying…" : "Retry section"}
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function PackOutput({
  result,
  brand,
  silo,
  siloName,
  onUpdateArticle,
  retryingSection,
  onRetrySection,
  founderVoiceOn,
}: PackOutputProps) {
  const p = result.data;
  const publishPayload = {
    title: p.headline,
    content: p.article,
    excerpt: p.summary,
    metaDescription: p.seo.metaDescription,
    categories: p.seo.categories,
    tags: p.seo.tags ?? [],
  };

  const anySocial = [
    p.social.x,
    p.social.instagram,
    p.social.tiktok,
    p.social.newsletter,
    p.social.youtube,
  ].some((s) => typeof s === "string" && s.trim().length > 0);

  const sectionStatus: Record<string, SectionStatus> = {
    headlines: statusFor(p.headline),
    article: statusFor(p.article),
    seo: statusFor(p.seo.metaDescription),
    social: anySocial ? "success" : "failed",
    image: statusFor(p.imagePrompts),
    hashtags: statusFor(p.seo.tags),
    // Founder voice is a configurable check, not a generation output. Treat as
    // "success" when on (operator opted in), n/a otherwise. No retry button.
    voice: founderVoiceOn ? "success" : "n/a",
  };

  const canRetry = Boolean(onRetrySection);
  const isRetrying = (id: string) => retryingSection === id;

  return (
    <>
      <PackSection
        id="headlines"
        status={sectionStatus.headlines}
        retrying={isRetrying("headlines")}
        canRetry={canRetry}
        onRetry={onRetrySection}
      >
        <Section
          title="Headline"
          icon={<Zap className="w-3.5 h-3.5" />}
          text={p.headline}
          brand={brand}
        />
        <Section title="Summary" text={p.summary} brand={brand} />
      </PackSection>

      <PackSection
        id="article"
        status={sectionStatus.article}
        retrying={isRetrying("article")}
        canRetry={canRetry}
        onRetry={onRetrySection}
      >
        <Section
          title="Article"
          icon={<Newspaper className="w-3.5 h-3.5" />}
          text={p.article}
          brand={brand}
        />
        <TrentOverridePanel
          original={p.article}
          silo={silo}
          brand={brand}
          testIdPrefix="trent-override-pack"
          fieldLabel="article"
          onApply={onUpdateArticle}
        />
      </PackSection>

      <PackSection
        id="social"
        status={sectionStatus.social}
        retrying={isRetrying("social")}
        canRetry={canRetry}
        onRetry={onRetrySection}
      >
        <Section
          title="X / Twitter"
          icon={<Twitter className="w-3.5 h-3.5" />}
          text={p.social.x}
          brand={brand}
        />
        <Section
          title="Instagram"
          icon={<Instagram className="w-3.5 h-3.5" />}
          text={p.social.instagram}
          brand={brand}
        />
        <Section
          title="TikTok"
          icon={<Video className="w-3.5 h-3.5" />}
          text={p.social.tiktok}
          brand={brand}
          mono
        />
        <Section
          title="Newsletter"
          icon={<Mail className="w-3.5 h-3.5" />}
          text={p.social.newsletter}
          brand={brand}
        />
        <Section
          title="YouTube"
          icon={<Youtube className="w-3.5 h-3.5" />}
          text={p.social.youtube}
          brand={brand}
        />
      </PackSection>

      <PackSection
        id="seo"
        status={sectionStatus.seo}
        retrying={isRetrying("seo")}
        canRetry={canRetry}
        onRetry={onRetrySection}
      >
        <SeoSection seo={{ ...p.seo, tags: p.seo.tags ?? [] }} brand={brand} />
      </PackSection>

      <PackSection
        id="hashtags"
        status={sectionStatus.hashtags}
        retrying={isRetrying("hashtags")}
        canRetry={canRetry}
        onRetry={onRetrySection}
      >
        <Section
          title="Hashtags"
          text={
            p.seo.tags && p.seo.tags.length
              ? p.seo.tags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ")
              : ""
          }
          brand={brand}
        />
      </PackSection>

      <PackSection
        id="image"
        status={sectionStatus.image}
        retrying={isRetrying("image")}
        canRetry={canRetry}
        onRetry={onRetrySection}
      >
        <ImagePromptSection prompts={p.imagePrompts} brand={brand} />
      </PackSection>

      {/* Founder voice check is configurable, not retryable. Status pill only. */}
      <PackSection
        id="voice"
        status={sectionStatus.voice}
        retrying={false}
        canRetry={false}
      >
        <div className="text-[11px] text-muted-foreground px-1">
          {founderVoiceOn
            ? "Founder Voice is on — review the article above against Trent Clark voice rules."
            : "Founder Voice is off for this silo. Toggle in tab settings to enable."}
        </div>
      </PackSection>

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
