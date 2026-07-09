/**
 * WP Proof Packages — six manually-curated WordPress-ready drafts.
 *
 * These are honest proof-of-concept packages for manual copy/paste publish.
 * No live publish, no fake REST calls. Operators copy these fields directly
 * into the WordPress classic/block editor.
 *
 * Body blocks are typed as BodyBlock[] — plain paragraphs, headings, and lists.
 * bodyToHtml() and bodyToPlain() render them for different export targets.
 */

export interface BodyBlock {
  type: "p" | "h2" | "ul";
  text?: string;
  items?: string[];
}

export interface WpProofPackage {
  silo: string;
  siloName: string;
  brandColor: string;
  headline: string;
  dek: string;
  slug: string;
  seoTitle: string;
  seoMeta: string;
  category: string;
  tags: string[];
  imageAlt: string;
  socialCaption: string;
  body: BodyBlock[];
}

/** Convert body blocks to basic HTML for the WordPress classic editor. */
export function bodyToHtml(blocks: BodyBlock[]): string {
  return blocks
    .map((b) => {
      if (b.type === "h2") return `<h2>${b.text ?? ""}</h2>`;
      if (b.type === "ul") {
        const items = (b.items ?? []).map((i) => `<li>${i}</li>`).join("\n");
        return `<ul>\n${items}\n</ul>`;
      }
      return `<p>${b.text ?? ""}</p>`;
    })
    .join("\n");
}

/** Convert body blocks to plain text for copy-paste into WordPress. */
export function bodyToPlain(blocks: BodyBlock[]): string {
  return blocks
    .map((b) => {
      if (b.type === "h2") return `\n## ${b.text ?? ""}\n`;
      if (b.type === "ul") return (b.items ?? []).map((i) => `• ${i}`).join("\n");
      return b.text ?? "";
    })
    .join("\n\n")
    .trim();
}

/** Convert a full package to markdown for clipboard export. */
export function packageToMarkdown(pkg: WpProofPackage): string {
  const lines: string[] = [
    `# ${pkg.headline}`,
    ``,
    `_${pkg.dek}_`,
    ``,
    `**Slug:** ${pkg.slug}`,
    `**SEO Title:** ${pkg.seoTitle}`,
    `**SEO Meta:** ${pkg.seoMeta}`,
    `**Category:** ${pkg.category}`,
    `**Tags:** ${pkg.tags.join(", ")}`,
    `**Image Alt:** ${pkg.imageAlt}`,
    `**Social Caption:** ${pkg.socialCaption}`,
    ``,
    `---`,
    ``,
    bodyToPlain(pkg.body),
  ];
  return lines.join("\n");
}

/** Look up a single proof package by silo string. Returns null if not found. */
export function getProofPackage(silo: string): WpProofPackage | null {
  return WP_PROOF_PACKAGES.find((p) => p.silo === silo) ?? null;
}

export const WP_PROOF_PACKAGES: WpProofPackage[] = [
  {
    silo: "hiphophaven",
    siloName: "Hip Hop Haven",
    brandColor: "#F59E0B",
    headline: "Hip Hop Haven: The Culture, The Sound, The Movement",
    dek: "Everything that defines the Hip Hop Haven brand — what we cover, why we cover it, and what the community expects from us.",
    slug: "hip-hop-haven-brand-intro",
    seoTitle: "Hip Hop Haven | Culture, Music & Movement | HMG",
    seoMeta: "Hip Hop Haven is HMG's home for hip hop culture, music news, and community coverage. Real stories, real voices.",
    category: "Brand",
    tags: ["hip hop", "culture", "HMG", "music", "community"],
    imageAlt: "Hip Hop Haven featured image — culture and music",
    socialCaption: "Hip Hop Haven is live. The culture deserves better coverage. We deliver it.",
    body: [
      { type: "h2", text: "What Hip Hop Haven Covers" },
      { type: "p", text: "Hip Hop Haven is Haven Media Group's dedicated vertical for hip hop culture, music, and community. We cover releases, movements, business, and the stories the mainstream glosses over." },
      { type: "h2", text: "Our Editorial Standard" },
      { type: "p", text: "Every piece goes through the HMG editorial process — source verification, brand voice check, and SEO prep before it goes live." },
      { type: "ul", items: ["Original reporting — no copy-paste aggregation", "Founder-voice editorial on every piece", "Community-first perspective"] },
    ],
  },
  {
    silo: "raphaven",
    siloName: "Rap Haven",
    brandColor: "#EF4444",
    headline: "Rap Haven: Where the Bars Live",
    dek: "Deep rap coverage — lyrics, culture, beef, business, and the stories that define the genre right now.",
    slug: "rap-haven-brand-intro",
    seoTitle: "Rap Haven | Deep Rap Coverage | HMG",
    seoMeta: "Rap Haven covers rap music, culture, and business from the streets to the boardroom. HMG's dedicated rap vertical.",
    category: "Brand",
    tags: ["rap", "hip hop", "lyrics", "culture", "HMG"],
    imageAlt: "Rap Haven — where the bars live",
    socialCaption: "Rap Haven. No hype, just bars.",
    body: [
      { type: "h2", text: "Rap Haven's Mission" },
      { type: "p", text: "Rap Haven is Haven Media Group's dedicated rap vertical. We go deeper than streaming numbers — covering lyricism, culture, artist business, and community impact." },
      { type: "h2", text: "Coverage Areas" },
      { type: "ul", items: ["New releases and album deep-dives", "Beef and cultural commentary", "Business moves and label deals", "Underground and independent scene"] },
    ],
  },
  {
    silo: "musichaven",
    siloName: "Music Haven",
    brandColor: "#A855F7",
    headline: "Music Haven: All Genres, All Cultures, One Platform",
    dek: "Music Haven is HMG's broadest musical vertical — covering R&B, pop, and everything in between.",
    slug: "music-haven-brand-intro",
    seoTitle: "Music Haven | All Genres, All Cultures | HMG",
    seoMeta: "Music Haven covers R&B, pop, and cross-genre music culture for the HMG community.",
    category: "Brand",
    tags: ["music", "R&B", "pop", "culture", "HMG"],
    imageAlt: "Music Haven — all genres, all cultures",
    socialCaption: "Music Haven covers every sound that matters.",
    body: [
      { type: "h2", text: "What Music Haven Covers" },
      { type: "p", text: "Music Haven is the broadest vertical in the HMG suite. From R&B to pop crossovers, we cover the music and the culture behind it." },
      { type: "ul", items: ["Album reviews and new releases", "Artist profiles and interviews", "Cross-genre cultural moments", "Business and streaming data stories"] },
    ],
  },
  {
    silo: "sportshaven",
    siloName: "Sports Haven",
    brandColor: "#0EA5E9",
    headline: "Sports Haven: Game, Culture, Business",
    dek: "Sports Haven covers the games, the athletes, and the business moves that define professional and amateur sports.",
    slug: "sports-haven-brand-intro",
    seoTitle: "Sports Haven | Game, Culture & Business | HMG",
    seoMeta: "Sports Haven is HMG's sports vertical — covering games, athletes, culture, and business for sports fans who want the full story.",
    category: "Brand",
    tags: ["sports", "NBA", "NFL", "culture", "HMG"],
    imageAlt: "Sports Haven — game, culture, business",
    socialCaption: "Sports Haven. Not just the score. The whole story.",
    body: [
      { type: "h2", text: "Sports Haven Coverage" },
      { type: "p", text: "Sports Haven goes beyond box scores. We cover athlete culture, team business moves, social impact, and the sports moments that drive conversation." },
      { type: "ul", items: ["Game analysis and highlights", "Athlete business and brand deals", "Cultural crossover moments", "Betting and analytics intel"] },
    ],
  },
  {
    silo: "fithaven",
    siloName: "Fit Haven",
    brandColor: "#22C55E",
    headline: "Fit Haven: Movement, Mindset, Community",
    dek: "Fit Haven is HMG's health and fitness vertical — real training, real nutrition, and real community for people who move.",
    slug: "fit-haven-brand-intro",
    seoTitle: "Fit Haven | Movement, Mindset & Community | HMG",
    seoMeta: "Fit Haven covers fitness, nutrition, mental wellness, and athletic culture for the HMG community.",
    category: "Brand",
    tags: ["fitness", "health", "nutrition", "wellness", "HMG"],
    imageAlt: "Fit Haven — movement, mindset, community",
    socialCaption: "Fit Haven. Move different.",
    body: [
      { type: "h2", text: "What Fit Haven Covers" },
      { type: "p", text: "Fit Haven is the HMG vertical for fitness culture, training content, nutrition coverage, and athletic community stories." },
      { type: "ul", items: ["Training and workout content", "Nutrition and recovery", "Mental wellness and mindset", "Athlete and community profiles"] },
    ],
  },
  {
    silo: "cannahaven",
    siloName: "Canna Haven",
    brandColor: "#10B981",
    headline: "Canna Haven: Culture, Commerce, Community",
    dek: "Canna Haven is HMG's cannabis vertical — covering culture, business, policy, and community from an informed, honest perspective.",
    slug: "canna-haven-brand-intro",
    seoTitle: "Canna Haven | Culture, Commerce & Community | HMG",
    seoMeta: "Canna Haven covers cannabis culture, business, policy, and community for the HMG audience. Real reporting, real perspective.",
    category: "Brand",
    tags: ["cannabis", "culture", "business", "policy", "HMG"],
    imageAlt: "Canna Haven — culture, commerce, community",
    socialCaption: "Canna Haven. Informed coverage for a growing culture.",
    body: [
      { type: "h2", text: "Canna Haven Coverage Areas" },
      { type: "p", text: "Canna Haven is HMG's cannabis vertical. We cover the culture, the business moves, policy changes, and community stories that define the industry." },
      { type: "ul", items: ["Cannabis culture and lifestyle", "Business and investment stories", "Policy and legal developments", "Community and social impact"] },
    ],
  },
];
