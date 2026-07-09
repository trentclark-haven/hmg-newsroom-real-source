/**
 * ARTBOT Deterministic Editorial Engine
 *
 * All outputs are deterministic — no fake AI, no fake providers.
 * ARTBOT is: editorial/content assistant, source checklist, headline help,
 * draft cleanup, WordPress prep, caption help.
 *
 * ARTBOT does NOT touch images, graphics, or Max's revenue territory.
 */

export interface HeadlineVariant {
  style: "direct" | "question" | "listicle" | "dramatic" | "seo";
  headline: string;
  wordCount: number;
  seoScore: "strong" | "ok" | "weak";
}

export interface SourceCheckResult {
  passed: boolean;
  flags: string[];
  recommendations: string[];
}

export interface GossipCheckResult {
  passed: boolean;
  flaggedPhrases: string[];
  suggestions: string[];
}

export interface ArticleStructureSuggestion {
  hed: string;
  dek: string;
  lede: string;
  bodyStructure: string[];
  kicker: string;
}

export interface SEOMetaStarter {
  titleTag: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  readabilityNote: string;
}

export interface WPExcerptResult {
  excerpt: string;
  charCount: number;
  withinLimit: boolean;
}

export interface SocialCaptionStarter {
  platform: "x" | "instagram" | "tiktok";
  caption: string;
  charCount: number;
  hashtags: string[];
}

export interface ARTBOTMemoryReadiness {
  founderVoiceCount: number;
  oldArticleCount: number;
  editorialRuleCount: number;
  wordpressRuleCount: number;
  socialExampleCount: number;
  totalItems: number;
  localStatus: "empty" | "minimal" | "building" | "strong";
  recommendations: string[];
}

const GOSSIP_PHRASES = [
  "sources say",
  "reportedly",
  "allegedly",
  "rumored to",
  "insiders claim",
  "word is",
  "heard that",
  "buzz is",
  "whispers",
  "according to an unnamed",
  "anonymous source",
  "close to the situation",
  "people familiar",
];

const SOURCE_RED_FLAGS = [
  "twitter says",
  "instagram post",
  "tiktok video",
  "facebook post",
  "someone tweeted",
  "viral post",
  "fans are saying",
  "comments section",
];

const SEO_WEAK_WORDS = [
  "very",
  "really",
  "amazing",
  "incredible",
  "shocking",
  "unbelievable",
  "you won't believe",
  "mind-blowing",
];

export function generateHeadlineVariants(topic: string, brand: string): HeadlineVariant[] {
  if (!topic.trim()) return [];

  const clean = topic.trim().replace(/[.!?]+$/, "");
  const words = clean.split(/\s+/).slice(0, 6).join(" ");

  return [
    {
      style: "direct",
      headline: clean,
      wordCount: clean.split(/\s+/).length,
      seoScore: clean.split(/\s+/).length >= 6 && clean.split(/\s+/).length <= 12 ? "strong" : "ok",
    },
    {
      style: "question",
      headline: `Is ${words} Changing the Game for ${brand}?`,
      wordCount: words.split(/\s+/).length + 6,
      seoScore: "ok",
    },
    {
      style: "dramatic",
      headline: `${clean}: What It Really Means`,
      wordCount: clean.split(/\s+/).length + 4,
      seoScore: "ok",
    },
    {
      style: "seo",
      headline: `${words}: A Complete Breakdown`,
      wordCount: words.split(/\s+/).length + 4,
      seoScore: "strong",
    },
    {
      style: "listicle",
      headline: `5 Things You Need to Know About ${words}`,
      wordCount: words.split(/\s+/).length + 7,
      seoScore: "strong",
    },
  ];
}

export function runSourceChecklist(articleText: string): SourceCheckResult {
  const lower = articleText.toLowerCase();
  const flags: string[] = [];
  const recommendations: string[] = [];

  for (const flag of SOURCE_RED_FLAGS) {
    if (lower.includes(flag)) {
      flags.push(`"${flag}" — needs a verified source`);
    }
  }

  if (lower.includes("http") || lower.includes("www.")) {
    recommendations.push("Good: external link detected — verify it goes to a primary source");
  } else if (articleText.length > 200) {
    recommendations.push("No external links found — add at least one primary source URL");
  }

  if (articleText.length > 100 && !lower.match(/\b(said|stated|confirmed|announced|according to)\b/)) {
    recommendations.push('No attribution verb found — add "said," "confirmed," or "according to [source]"');
  }

  return {
    passed: flags.length === 0,
    flags,
    recommendations: recommendations.length > 0 ? recommendations : ["Sources look clean — verify all claims are attributable"],
  };
}

export function runGossipCheck(articleText: string): GossipCheckResult {
  const lower = articleText.toLowerCase();
  const flaggedPhrases: string[] = [];
  const suggestions: string[] = [];

  for (const phrase of GOSSIP_PHRASES) {
    if (lower.includes(phrase)) {
      flaggedPhrases.push(`"${phrase}"`);
    }
  }

  if (flaggedPhrases.length > 0) {
    suggestions.push("Replace unverified language with confirmed attribution or cut the claim");
    suggestions.push('Use "confirmed," "announced," or "stated in [source]" instead');
    suggestions.push("If you cannot verify it, do not publish it — HMG editorial standard");
  }

  return {
    passed: flaggedPhrases.length === 0,
    flaggedPhrases,
    suggestions: flaggedPhrases.length === 0
      ? ["No gossip language detected — editorial check passed"]
      : suggestions,
  };
}

export function suggestArticleStructure(topic: string): ArticleStructureSuggestion {
  const clean = topic.trim() || "this story";
  return {
    hed: `[Headline: Direct, 6–12 words, includes the key subject of ${clean}]`,
    dek: `[Sub-headline: 15–25 words explaining what happened and why it matters]`,
    lede: `[First paragraph: The most newsworthy fact up front — who, what, when, where in 2–3 sentences]`,
    bodyStructure: [
      "[Graph 2: Second most important fact or context]",
      "[Graph 3: Background / why this matters]",
      "[Graph 4: Quote or confirmation from primary source]",
      "[Graph 5: Additional context, data, or reaction]",
      "[Graph 6+: Background, history, related coverage]",
    ],
    kicker: `[Final line: A forward-looking statement or the bottom line on ${clean}]`,
  };
}

export function generateSEOMeta(headline: string, brand: string): SEOMetaStarter {
  const trimmed = headline.trim();
  const titleTag = trimmed.length <= 60 ? trimmed : trimmed.slice(0, 57) + "...";
  const brandName = brand.replace(/haven$/i, " Haven").replace(/hmg/i, "HMG");

  const seoBanned = SEO_WEAK_WORDS.some((w) => trimmed.toLowerCase().includes(w));

  return {
    titleTag: `${titleTag} | ${brandName}`,
    metaDescription: `${trimmed}. Get the full story, analysis, and updates from ${brandName}. Stay informed with the latest coverage.`,
    focusKeyword: trimmed.split(/\s+/).slice(0, 3).join(" ").toLowerCase(),
    secondaryKeywords: [
      brand.toLowerCase(),
      trimmed.split(/\s+/).slice(0, 2).join(" ").toLowerCase(),
      "news",
      "update",
    ],
    readabilityNote: seoBanned
      ? "⚠ Headline contains weak SEO language — consider a direct, factual headline"
      : "✓ Headline reads clean for SEO",
  };
}

export function generateWPExcerpt(articleText: string): WPExcerptResult {
  const clean = articleText.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const sentences = clean.split(/[.!?]+/).filter(Boolean);
  let excerpt = "";

  for (const sentence of sentences) {
    const candidate = (excerpt + " " + sentence.trim()).trim();
    if (candidate.length <= 155) {
      excerpt = candidate;
    } else {
      break;
    }
  }

  if (!excerpt && clean.length > 0) {
    excerpt = clean.slice(0, 152) + "...";
  }

  return {
    excerpt: excerpt || "Add article content to generate an excerpt.",
    charCount: excerpt.length,
    withinLimit: excerpt.length <= 155,
  };
}

export function generateSocialCaptions(headline: string, brand: string): SocialCaptionStarter[] {
  const clean = headline.trim();
  const brandTag = `#${brand.replace(/\s+/g, "")}`;

  return [
    {
      platform: "x",
      caption: `${clean} — read more on ${brand.replace(/haven/i, " Haven").replace(/hmg/i, "HMG")}`,
      charCount: clean.length + brand.length + 20,
      hashtags: [brandTag, "#breaking", "#news"],
    },
    {
      platform: "instagram",
      caption: `📰 ${clean}\n\nFull story at the link in bio.\n\n${brandTag} #news #media`,
      charCount: clean.length + 40,
      hashtags: [brandTag, "#news", "#media", "#editorial"],
    },
    {
      platform: "tiktok",
      caption: `${clean} 👀 ${brandTag} #news #fyp #viral`,
      charCount: clean.length + 30,
      hashtags: [brandTag, "#news", "#fyp", "#viral"],
    },
  ];
}

export function getARTBOTMemoryReadiness(memoryItems: { type: string }[]): ARTBOTMemoryReadiness {
  const founderVoiceCount = memoryItems.filter((i) => i.type === "founder-voice").length;
  const oldArticleCount = memoryItems.filter((i) => i.type === "old-article").length;
  const editorialRuleCount = memoryItems.filter((i) => i.type === "editorial-rule").length;
  const wordpressRuleCount = memoryItems.filter((i) => i.type === "wordpress-rule").length;
  const socialExampleCount = memoryItems.filter((i) => i.type === "social-example").length;
  const totalItems = founderVoiceCount + oldArticleCount + editorialRuleCount + wordpressRuleCount + socialExampleCount;

  const recommendations: string[] = [];
  if (founderVoiceCount < 2) recommendations.push("Add 2+ Founder Voice samples to strengthen voice scoring");
  if (editorialRuleCount < 1) recommendations.push("Add editorial rules to anchor ARTBOT's source and tone checks");
  if (wordpressRuleCount < 1) recommendations.push("Add WordPress rules to unlock WP-specific formatting suggestions");
  if (oldArticleCount < 3) recommendations.push("Add old articles to build editorial reference corpus");
  if (socialExampleCount < 2) recommendations.push("Add social examples to strengthen caption suggestions");

  const localStatus =
    totalItems === 0 ? "empty"
    : totalItems < 5 ? "minimal"
    : totalItems < 15 ? "building"
    : "strong";

  return {
    founderVoiceCount,
    oldArticleCount,
    editorialRuleCount,
    wordpressRuleCount,
    socialExampleCount,
    totalItems,
    localStatus,
    recommendations,
  };
}
