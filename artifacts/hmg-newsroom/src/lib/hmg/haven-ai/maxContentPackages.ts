/**
 * Max Content Package Builder — deterministic sales package generator.
 *
 * Turns a content idea into a structured sales package description.
 * No fake rate cards. No fake revenue numbers. No fake sponsor contacts.
 * All packages are editorial frameworks the Founder pitches manually.
 *
 * Truth: Local CRO Review | Founder Review Required | No Outreach Sent
 */

export type ContentPackageType =
  | "sponsored-article"
  | "social-clip"
  | "interview"
  | "event-coverage"
  | "local-business-spotlight"
  | "founder-commentary"
  | "multi-vertical-campaign"
  | "webedit-social-bundle"
  | "wordpress-newsletter-bundle"
  | "vertical-package";

export interface ContentPackage {
  id: string;
  createdAt: number;
  sourceId: string;
  packageType: ContentPackageType;
  packageName: string;
  whatGetsMade: string;
  whoItHelps: string;
  whySponsorCares: string;
  deliverables: string[];
  founderWorkRequired: string;
  riskNotes: string;
  copyPitchStarter: string;
  whatToAvoid: string;
}

const PACKAGE_META: Record<
  ContentPackageType,
  { name: string; whyLabel: string; deliverableBase: string[] }
> = {
  "sponsored-article": {
    name: "Sponsored Article Package",
    whyLabel: "editorial credibility",
    deliverableBase: ["1 full article (500–1,200 words)", "SEO-optimized WordPress draft", "2–3 social caption variants", "1 thumbnail concept"],
  },
  "social-clip": {
    name: "Social Clip Package",
    whyLabel: "social distribution",
    deliverableBase: ["1 short-form video concept (30–90 sec)", "3 platform caption variants (IG / TikTok / X)", "1 thumbnail brief", "Hook + CTA copy"],
  },
  "interview": {
    name: "Interview Package",
    whyLabel: "exclusive access and audience trust",
    deliverableBase: ["1 sit-down interview piece", "Clip plan (3–5 pull quotes)", "Social distribution package", "Behind-the-scenes content brief"],
  },
  "event-coverage": {
    name: "Event Coverage Package",
    whyLabel: "live moment capture and post-event reach",
    deliverableBase: ["Pre-event preview piece", "Live coverage brief", "Post-event recap article", "Social recap package (3 platforms)", "Photo/video brief"],
  },
  "local-business-spotlight": {
    name: "Local Business Spotlight",
    whyLabel: "community reach and authentic placement",
    deliverableBase: ["1 business profile article", "1 founder/owner interview excerpt", "Social announcement set", "WordPress publish plan"],
  },
  "founder-commentary": {
    name: "Founder Commentary Package",
    whyLabel: "thought leadership and Founder voice amplification",
    deliverableBase: ["1 Founder op-ed or commentary piece", "Social clip concept", "Newsletter intro", "LinkedIn/X variant"],
  },
  "multi-vertical-campaign": {
    name: "Multi-Vertical Campaign",
    whyLabel: "cross-audience reach across HMG's 7 verticals",
    deliverableBase: ["7 vertical-specific content angles", "Cross-brand distribution plan", "Unified social campaign brief", "Output History tracking"],
  },
  "webedit-social-bundle": {
    name: "WebEdit + Social Factory Bundle",
    whyLabel: "video-first content with social distribution built in",
    deliverableBase: ["WebEdit cut plan", "Hook Finder pass", "3 clip concepts", "Social caption plan (all platforms)", "Thumbnail brief"],
  },
  "wordpress-newsletter-bundle": {
    name: "WordPress + Newsletter Bundle",
    whyLabel: "owned-channel distribution — no platform dependency",
    deliverableBase: ["WordPress article draft (publish-ready)", "Newsletter introduction", "Email CTA copy", "Social announcement brief"],
  },
  "vertical-package": {
    name: "Vertical Brand Package",
    whyLabel: "dedicated audience ownership within one HMG vertical",
    deliverableBase: ["Vertical-specific editorial plan", "Sponsor placement brief", "Content calendar (4 pieces)", "Distribution summary"],
  },
};

function pickPackageType(sourceText: string): ContentPackageType {
  const t = sourceText.toLowerCase();
  if (/(interview|sit.down|exclusive|one.on.one|q&a)/.test(t)) return "interview";
  if (/(event|concert|festival|show|live|activation|pop.up|panel)/.test(t)) return "event-coverage";
  if (/(local|restaurant|shop|store|neighborhood|city|community)/.test(t)) return "local-business-spotlight";
  if (/(video|clip|reel|tiktok|short|youtube|stream)/.test(t)) return "social-clip";
  if (/(newsletter|email|wordpress|article|draft|publish)/.test(t)) return "wordpress-newsletter-bundle";
  if (/(multi|campaign|cross|all brand|all vertical)/.test(t)) return "multi-vertical-campaign";
  if (/(founder|commentary|op.ed|opinion|take|perspective)/.test(t)) return "founder-commentary";
  return "sponsored-article";
}

function buildWhoItHelps(sourceText: string): string {
  const t = sourceText.toLowerCase();
  if (/(sponsor|brand|advertiser)/.test(t))
    return "Brands looking for credible editorial placement in HMG's audience — not banner ads.";
  if (/(local|community|neighborhood)/.test(t))
    return "Local businesses that want community reach through trusted media coverage, not social ads.";
  if (/(artist|musician|rapper|athlete)/.test(t))
    return "Talent and their management seeking authentic media coverage with distribution built in.";
  return "Any brand or partner who wants editorial credibility with HMG's engaged audience.";
}

function buildWhySponsorCares(text: string, whyLabel: string): string {
  return `Sponsors care about ${whyLabel}. This package delivers a documented content output — not a promise. The Founder controls the creative. The sponsor gets verified editorial placement with an honest audience.`;
}

function buildFounderWork(type: ContentPackageType): string {
  const map: Record<ContentPackageType, string> = {
    "sponsored-article": "Write or supervise the article. Confirm sponsor tone requirements. Publish manually via WordPress.",
    "social-clip": "Plan the clip. Record or source the footage. Run through WebEdit cut plan. Post manually per platform.",
    "interview": "Confirm the interview. Record or transcribe. Write the piece. Build the clip plan. Coordinate publish.",
    "event-coverage": "Secure media access. Attend or assign. Write recap. Execute social plan. 3–5 hours total.",
    "local-business-spotlight": "Visit or call the business. Write the profile. Coordinate publish. 2–3 hours.",
    "founder-commentary": "Write the commentary. Review for brand alignment. Distribute across owned channels. 1–2 hours.",
    "multi-vertical-campaign": "High effort. Coordinate across all 7 verticals. Requires planning session and team alignment.",
    "webedit-social-bundle": "Run the full WebEdit workflow. Export clips. Execute Social Factory plan. 2–4 hours.",
    "wordpress-newsletter-bundle": "Write, format, and publish to WordPress. Draft newsletter. Send manually. 2–3 hours.",
    "vertical-package": "Plan the vertical editorial calendar. Coordinate content across 4 pieces. 1 planning session.",
  };
  return map[type];
}

function buildCopyStarter(sourceText: string, packageName: string): string {
  const truncated = sourceText.length > 80 ? `${sourceText.slice(0, 77)}...` : sourceText;
  return `Hi — I run Haven Media Group, a 7-brand digital media operation covering hip-hop, music, sports, fitness, and cannabis. I'm putting together a ${packageName} around: "${truncated}". I think there's a clean fit for your brand here. Happy to walk you through it — no rate card, just a conversation. [Founder Name]`;
}

export function generateContentPackage(opts: {
  sourceId: string;
  sourceText: string;
  silo?: string;
  packageType?: ContentPackageType;
}): ContentPackage {
  const type = opts.packageType ?? pickPackageType(opts.sourceText);
  const meta = PACKAGE_META[type];
  const pkg: ContentPackage = {
    id: `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    sourceId: opts.sourceId,
    packageType: type,
    packageName: meta.name,
    whatGetsMade: meta.deliverableBase.join(" · "),
    whoItHelps: buildWhoItHelps(opts.sourceText),
    whySponsorCares: buildWhySponsorCares(opts.sourceText, meta.whyLabel),
    deliverables: meta.deliverableBase,
    founderWorkRequired: buildFounderWork(type),
    riskNotes: "Do not promise deliverables before confirming capacity. Do not sign a deal without Founder legal review. No rate card until you know what you can actually produce.",
    copyPitchStarter: buildCopyStarter(opts.sourceText, meta.name),
    whatToAvoid: "Don't lead with price. Don't promise exclusivity you can't maintain. Don't pitch brands you have no relationship with via cold DM. Don't fake metrics.",
  };
  return pkg;
}

export function buildPackageText(pkg: ContentPackage): string {
  return [
    `MAX REVENUE PACKAGE — ${pkg.packageName.toUpperCase()}`,
    `Generated: ${new Date(pkg.createdAt).toLocaleString()}`,
    ``,
    `WHAT GETS MADE`,
    pkg.whatGetsMade,
    ``,
    `DELIVERABLES`,
    ...pkg.deliverables.map((d) => `  - ${d}`),
    ``,
    `WHO IT HELPS`,
    pkg.whoItHelps,
    ``,
    `WHY A SPONSOR CARES`,
    pkg.whySponsorCares,
    ``,
    `FOUNDER WORK REQUIRED`,
    pkg.founderWorkRequired,
    ``,
    `COPY PITCH STARTER`,
    pkg.copyPitchStarter,
    ``,
    `WHAT TO AVOID`,
    pkg.whatToAvoid,
    ``,
    `RISK NOTES`,
    pkg.riskNotes,
    ``,
    `--- TRUTH LABELS ---`,
    `Local CRO Review | Founder Review Required | No Outreach Sent | No CRM Connected`,
  ].join("\n");
}

export const ALL_PACKAGE_TYPES: { type: ContentPackageType; label: string }[] = Object.entries(
  PACKAGE_META,
).map(([type, meta]) => ({ type: type as ContentPackageType, label: meta.name }));
