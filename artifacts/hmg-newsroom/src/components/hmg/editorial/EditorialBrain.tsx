import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  AlertTriangle,
  Megaphone,
  PenTool,
  Sparkles,
} from "lucide-react";
import { verticals } from "@/lib/mock-data";
import { getBrandVoiceProfile } from "@/lib/hmg/brandVoiceProfiles";
import {
  RESEARCH_SECTIONS,
  computeArticleStrength,
  factsAsNotesText,
  generateBreakingStory,
  generateEditorialArticle,
  generateSocialPosts,
  listSavedFacts,
  parseResearchNotes,
  type ArticleRole,
  type ArticleStrength,
  type ArticleTone,
  type ArticleType,
  type BreakingStoryPackage,
  type EditorialArticlePackage,
  type ResearchSection,
  type SocialPostsPackage,
} from "@/lib/hmg/editorial";
import { ResearchIntake } from "./ResearchIntake";
import { ArticlePackageCard } from "./ArticlePackageCard";
import { BreakingStoryCard } from "./BreakingStoryCard";
import { SocialPostsCard } from "./SocialPostsCard";
import { SavedFactsPanel } from "./SavedFactsPanel";
import { CopyButton } from "@/components/hmg/CopyButton";
import {
  chooseBlueprint,
  formatArticleQualityReceipt,
  formatBrandVoicePacket,
  formatFounderVoicePacket,
  generateSeoPacket,
  getBrandVoiceProfile as getIntelligenceBrandVoiceProfile,
  scoreArticleDraft,
  type BrandVoiceProfile as IntelligenceBrandVoiceProfile,
  type QualityScoreResult,
  type SeoPacket,
} from "@/lib/hmg/intelligence";

export type EditorialMode = "article" | "breaking" | "social";

interface EditorialBrainProps {
  brandId: string;
  modes?: EditorialMode[];
  defaultMode?: EditorialMode;
  title?: string;
  className?: string;
  /** Honest external status the parent may pass through. */
  liveWebOn?: boolean;
  corpusReady?: boolean;
}

const MODE_LABELS: Record<EditorialMode, { tab: string; build: string; icon: React.ComponentType<{ className?: string }> }> = {
  article: { tab: "Article Draft", build: "Create Article Draft", icon: FileText },
  breaking: { tab: "Breaking Story", build: "Create Breaking Story", icon: AlertTriangle },
  social: { tab: "Social Posts", build: "Create Social Posts", icon: Megaphone },
};

const ARTICLE_TYPE_OPTIONS: { id: ArticleType; label: string }[] = [
  { id: "news", label: "News" },
  { id: "feature", label: "Feature" },
  { id: "review", label: "Review" },
  { id: "analysis", label: "Analysis" },
  { id: "explainer", label: "Explainer" },
  { id: "interview-recap", label: "Interview Recap" },
  { id: "list", label: "List" },
  { id: "opinion", label: "Opinion" },
];

const TONE_OPTIONS: { id: ArticleTone; label: string }[] = [
  { id: "neutral", label: "Neutral" },
  { id: "sharp", label: "Sharp" },
  { id: "celebratory", label: "Celebratory" },
  { id: "critical", label: "Critical" },
  { id: "investigative", label: "Investigative" },
  { id: "explanatory", label: "Explanatory" },
];

const ROLE_OPTIONS: { id: ArticleRole; label: string }[] = [
  { id: "managing-editor", label: "Managing Editor" },
  { id: "staff-writer", label: "Staff Writer" },
  { id: "senior-critic", label: "Senior Critic" },
  { id: "beat-reporter", label: "Beat Reporter" },
  { id: "columnist", label: "Columnist" },
];

function freshSections(): ResearchSection[] {
  return RESEARCH_SECTIONS.map((s) => ({ ...s, text: "" }));
}

export function EditorialBrain({
  brandId,
  modes = ["article", "breaking", "social"],
  defaultMode,
  title = "Editorial Desk",
  className = "",
  liveWebOn = false,
  corpusReady = false,
}: EditorialBrainProps) {
  const available = modes.length > 0 ? modes : (["article"] as EditorialMode[]);
  const [mode, setMode] = useState<EditorialMode>(
    defaultMode && available.includes(defaultMode) ? defaultMode : available[0],
  );
  const [sections, setSections] = useState<ResearchSection[]>(freshSections);
  const [articleType, setArticleType] = useState<ArticleType>("feature");
  const [tone, setTone] = useState<ArticleTone>("neutral");
  const [role, setRole] = useState<ArticleRole>("managing-editor");
  const [selectedFactIds, setSelectedFactIds] = useState<string[]>([]);
  const [articlePkg, setArticlePkg] = useState<EditorialArticlePackage | null>(null);
  const [strength, setStrength] = useState<ArticleStrength | null>(null);
  const [breakingPkg, setBreakingPkg] = useState<BreakingStoryPackage | null>(null);
  const [socialPkg, setSocialPkg] = useState<SocialPostsPackage | null>(null);

  const brand = verticals.find((v) => v.id === brandId);
  const profile = getBrandVoiceProfile(brandId);
  const intelligenceProfile = useMemo(
    () => getIntelligenceBrandVoiceProfile(brandId),
    [brandId],
  );
  const accent = brand?.color ?? "#0EA5E9";
  const onAccent = brand?.onAccent ?? "#ffffff";

  const filledCount = sections.filter((s) => s.text.trim().length > 0).length;

  const toggleFact = (id: string) =>
    setSelectedFactIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const buildNotes = () => {
    const allFacts = listSavedFacts(brandId);
    const usedFacts = allFacts.filter((f) => selectedFactIds.includes(f.id));
    const factsText = usedFacts.length ? factsAsNotesText(usedFacts) : "";

    const merged = sections.map((s) => {
      if (s.id === "evergreenFacts" && factsText) {
        const existing = s.text.trim();
        return {
          ...s,
          text: existing ? `${existing}\n${factsText}` : factsText,
        };
      }
      return s;
    });
    return parseResearchNotes(merged);
  };

  const handleBuildArticle = () => {
    const notes = buildNotes();
    const pkg = generateEditorialArticle({
      brand: brandId,
      articleType,
      tone,
      role,
      notes,
    });
    setArticlePkg(pkg);
    setStrength(computeArticleStrength(notes));
    setBreakingPkg(null);
    setSocialPkg(null);
  };

  const handleBuildBreaking = () => {
    const notes = buildNotes();
    const pkg = generateBreakingStory(brandId, notes);
    setBreakingPkg(pkg);
    setArticlePkg(null);
    setStrength(null);
    setSocialPkg(null);
  };

  const handleBuildSocial = () => {
    const notes = buildNotes();
    const pkg = generateSocialPosts(brandId, notes);
    setSocialPkg(pkg);
    setArticlePkg(null);
    setStrength(null);
    setBreakingPkg(null);
  };

  const handleBuild = () => {
    if (filledCount === 0) return;
    if (mode === "article") handleBuildArticle();
    else if (mode === "breaking") handleBuildBreaking();
    else handleBuildSocial();
  };

  const buildLabel = MODE_LABELS[mode].build;
  const ModeIcon = MODE_LABELS[mode].icon;

  return (
    <div
      className={`rounded-2xl border bg-card/40 p-4 space-y-4 ${className}`}
      style={{ borderColor: `${accent}55` }}
      data-testid="editorial-brain"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {brand?.logo ? (
            <img
              src={brand.logo}
              alt={`${profile.name} logo`}
              className="h-10 w-10 rounded-md object-contain bg-background/40 p-1 border border-border/40"
              data-testid="editorial-brain-brand-logo"
            />
          ) : (
            <span
              className="inline-flex items-center justify-center h-10 w-10 rounded-md"
              style={{ background: accent, color: onAccent }}
            >
              <PenTool className="w-5 h-5" />
            </span>
          )}
          <div>
            <h3 className="text-base font-black tracking-tight">{title}</h3>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {profile.name} · {profile.toneLabel} · article draft desk
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5" data-testid="editorial-mode-tabs">
          {available.map((m) => {
            const isActive = mode === m;
            const Icon = MODE_LABELS[m].icon;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                data-testid={`editorial-mode-${m}`}
                className={`h-8 px-3 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border transition-colors inline-flex items-center gap-1.5 ${
                  isActive
                    ? "border-transparent"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
                style={isActive ? { background: accent, color: onAccent } : undefined}
              >
                <Icon className="w-3 h-3" />
                {MODE_LABELS[m].tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Article type / tone / role — only when article mode */}
      {mode === "article" && (
        <div className="grid gap-2 sm:grid-cols-3" data-testid="editorial-article-options">
          <Selector
            label="Article Type"
            value={articleType}
            options={ARTICLE_TYPE_OPTIONS}
            onChange={(v) => setArticleType(v as ArticleType)}
            accent={accent}
            onAccent={onAccent}
            testId="article-type-select"
          />
          <Selector
            label="Tone"
            value={tone}
            options={TONE_OPTIONS}
            onChange={(v) => setTone(v as ArticleTone)}
            accent={accent}
            onAccent={onAccent}
            testId="article-tone-select"
          />
          <Selector
            label="Role"
            value={role}
            options={ROLE_OPTIONS}
            onChange={(v) => setRole(v as ArticleRole)}
            accent={accent}
            onAccent={onAccent}
            testId="article-role-select"
          />
        </div>
      )}

      {/* Research Intake */}
      <ResearchIntake
        sections={sections}
        onChange={setSections}
        accent={accent}
        onAccent={onAccent}
        liveWebOn={liveWebOn}
        corpusReady={corpusReady}
      />

      {/* Saved Facts */}
      <SavedFactsPanel
        brand={brandId}
        accent={accent}
        onAccent={onAccent}
        selectedIds={selectedFactIds}
        onToggleSelect={toggleFact}
      />

      {/* Create button */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={handleBuild}
          disabled={filledCount === 0}
          className="h-11 px-5 font-bold rounded-full"
          style={
            filledCount > 0
              ? { background: accent, color: onAccent }
              : undefined
          }
          data-testid="editorial-build-button"
        >
          <ModeIcon className="w-4 h-4 mr-1.5" />
          {buildLabel}
        </Button>
        {filledCount === 0 ? (
          <p className="text-[11px] text-muted-foreground italic">
            Paste your research above and the create button lights up.
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {filledCount} research section{filledCount === 1 ? "" : "s"} ready · {selectedFactIds.length} saved facts attached
          </p>
        )}
      </div>

      {/* Output */}
      {articlePkg && (
        <>
          <ArticleIntelligencePanel
            pkg={articlePkg}
            brand={intelligenceProfile}
          />
          <ArticlePackageCard pkg={articlePkg} accent={accent} onAccent={onAccent} strength={strength} />
        </>
      )}
      {breakingPkg && (
        <BreakingStoryCard pkg={breakingPkg} accent={accent} onAccent={onAccent} />
      )}
      {socialPkg && (
        <SocialPostsCard pkg={socialPkg} accent={accent} onAccent={onAccent} />
      )}
    </div>
  );
}

function Selector<T extends string>({
  label,
  value,
  options,
  onChange,
  accent,
  onAccent,
  testId,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  accent: string;
  onAccent: string;
  testId?: string;
}) {
  return (
    <div data-testid={testId}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => {
          const isActive = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className={`h-7 px-2.5 rounded-full text-[10px] font-semibold border transition-colors ${
                isActive
                  ? "border-transparent"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
              style={isActive ? { background: accent, color: onAccent } : undefined}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ArticleIntelligencePanel({
  pkg,
  brand,
}: {
  pkg: EditorialArticlePackage;
  brand: IntelligenceBrandVoiceProfile;
}) {
  const blueprint = useMemo(
    () => chooseBlueprint(pkg.brand, `${pkg.headline} ${pkg.articleBody}`),
    [pkg.articleBody, pkg.brand, pkg.headline],
  );
  const seoPacket: SeoPacket = useMemo(
    () => generateSeoPacket(pkg.headline, pkg.headline, brand),
    [brand, pkg.headline],
  );
  const quality: QualityScoreResult = useMemo(
    () =>
      scoreArticleDraft({
        headline: pkg.headline,
        body: pkg.articleBody,
        brand,
        hasSeoPack: Boolean(pkg.seoTitle && pkg.seoDescription),
        hasSocialPack: Boolean(pkg.socialCaption || pkg.xPost || pkg.instagramCaption),
        hasVisualDirection: false,
        sourceCount: pkg.sourceNotesUsed.length,
      }),
    [brand, pkg],
  );
  const receipt = formatArticleQualityReceipt(quality);
  return (
    <section
      className="rounded-2xl border border-border/60 bg-secondary/25 p-3"
      data-testid="editorial-intelligence-scoring"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">
            Intelligence Scoring
          </p>
          <h4 className="mt-1 text-sm font-black text-foreground">
            Article Quality Receipt
          </h4>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Local deterministic scoring. No outside provider call needed.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <CopyButton
            textToCopy={formatFounderVoicePacket()}
            label="Founder Voice"
            successMessage="Founder Voice Packet copied"
            className="h-8 text-[11px]"
          />
          <CopyButton
            textToCopy={formatBrandVoicePacket(brand)}
            label="Brand Voice"
            successMessage="Brand Voice Packet copied"
            className="h-8 text-[11px]"
          />
          <CopyButton
            textToCopy={receipt}
            label="Quality Receipt"
            successMessage="Article Quality Receipt copied"
            className="h-8 text-[11px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        {[
          { label: "Quality", value: `${quality.score}/100` },
          { label: "Founder Fit", value: `${quality.founderVoiceFit}/100` },
          { label: "Brand Fit", value: `${quality.brandFit}/100` },
          { label: "Claim Risk", value: `${quality.unsupportedClaimRisk}/100` },
          { label: "No-Gossip", value: quality.noGossipCheck },
          { label: "SEO", value: `${quality.seoReadiness}/100` },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border/50 bg-background/30 p-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 truncate text-[12px] font-black text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border/50 bg-background/30 p-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Top 3 fixes
          </p>
          <ul className="mt-1 space-y-1">
            {(quality.topFixes.length ? quality.topFixes : ["No major fixes flagged."]).map((fix) => (
              <li key={fix} className="text-[11px] leading-snug text-muted-foreground">
                - {fix}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border/50 bg-background/30 p-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Recommended next action
          </p>
          <p className="mt-1 text-[11px] leading-snug text-foreground">
            {quality.recommendedNextAction}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-background/30 p-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Blueprint / SEO
          </p>
          <p className="mt-1 text-[11px] font-bold text-foreground">
            {blueprint.name}
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
            {seoPacket.slug} · {seoPacket.readiness}/100 SEO readiness
          </p>
        </div>
      </div>
    </section>
  );
}
