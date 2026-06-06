/**
 * Per-silo launch readiness score (0-100). Pure function — pass in the dependent
 * data so components can wire their own hooks without this lib reaching into
 * react state.
 */

export interface ReadinessInput {
  wpConnected: boolean;
  founderVoiceConfigured: boolean;
  sponsorSlotsAvailable: boolean;
  hasArticlePackage: boolean;
  seoFieldsPresent: boolean;
  publicAppOk: boolean;
  mediaLibraryItems: number;
}

export interface ReadinessItem {
  id: string;
  label: string;
  ok: boolean;
  weight: number;
}

export interface ReadinessResult {
  score: number;
  items: ReadinessItem[];
  band: "red" | "amber" | "green";
}

/**
 * Weights are tuned so a freshly-onboarded silo with WP creds + brand voice
 * already lands above 40 (visible green progress), and the remaining 60 comes
 * from inventory + content readiness. Total weight = 100.
 */
const WEIGHTS = {
  wp: 25,
  voice: 15,
  sponsors: 10,
  article: 20,
  seo: 10,
  publicApp: 10,
  media: 10,
} as const;

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const items: ReadinessItem[] = [
    {
      id: "wp",
      label: "WordPress connected",
      ok: input.wpConnected,
      weight: WEIGHTS.wp,
    },
    {
      id: "voice",
      label: "Brand voice configured",
      ok: input.founderVoiceConfigured,
      weight: WEIGHTS.voice,
    },
    {
      id: "sponsors",
      label: "Sponsor slots available",
      ok: input.sponsorSlotsAvailable,
      weight: WEIGHTS.sponsors,
    },
    {
      id: "article",
      label: "≥1 draft / article package",
      ok: input.hasArticlePackage,
      weight: WEIGHTS.article,
    },
    {
      id: "seo",
      label: "SEO fields present",
      ok: input.seoFieldsPresent,
      weight: WEIGHTS.seo,
    },
    {
      id: "publicApp",
      label: "Public App reachable",
      ok: input.publicAppOk,
      weight: WEIGHTS.publicApp,
    },
    {
      id: "media",
      label: "Media library has items",
      ok: input.mediaLibraryItems > 0,
      weight: WEIGHTS.media,
    },
  ];

  const score = items.reduce(
    (acc, it) => acc + (it.ok ? it.weight : 0),
    0,
  );

  const band: ReadinessResult["band"] =
    score >= 75 ? "green" : score >= 40 ? "amber" : "red";

  return { score, items, band };
}
