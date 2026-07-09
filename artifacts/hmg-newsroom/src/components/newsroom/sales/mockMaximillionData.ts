import {
  REVENUE_TYPE_LABELS,
  SALES_STAGES,
  type RevenueType,
  type SalesLead,
  type SalesStage,
} from "@/lib/sales";

export type OpportunityCategory =
  | "website_ads"
  | "google_ads"
  | "youtube_video"
  | "social_sponsorships"
  | "events"
  | "speaking"
  | "print_publishing"
  | "cannabis"
  | "sports"
  | "fitness_wellness"
  | "music_hiphop"
  | "ai_aeo";

export interface OpportunityCategoryOption {
  id: OpportunityCategory;
  label: string;
}

export interface Opportunity {
  id: string;
  title: string;
  category: OpportunityCategory;
  fitScore: number;
  estimatedValueRange: string;
  relevantBrands: string[];
  whyItMatters: string;
  suggestedPlay: string;
  nextAction: string;
  status: "ready" | "research" | "warm" | "packaging";
}

export interface EventRevenuePlay {
  id: string;
  eventName: string;
  seasonOrDate: string;
  relevantBrands: string[];
  sponsorTargets: string[];
  activationIdeas: string[];
  estimatedRevenueRange: string;
  nextAction: string;
}

export interface MaximillionBrief {
  todayFocus: string;
  bestNextMove: string;
  hotLead: string;
  eventPlay: string;
  sponsorAngle: string;
  packageValue: string;
  rateCardThinking: string;
  buyerObjection: string;
  nextBestAsk: string;
  riskWarning: string;
  founderNote: string;
}

export interface SponsorTarget {
  id: string;
  companyOrCategory: string;
  fitScore: number;
  havenBrands: string[];
  suggestedPitch: string;
  nextAction: string;
}

export interface MaximillionMemory {
  rememberedLeads: Array<{
    id: string;
    company: string;
    stage: SalesStage;
    estimatedValue: number;
  }>;
  pastOutreach: string[];
  winLossReasons: string[];
  followUpReminders: string[];
  brandFitHistory: string[];
  eventIdeas: string[];
  revenueNotes: string[];
}

export interface FutureModule {
  id: string;
  label: string;
  status: "coming_next";
  note: string;
}

export interface ProviderHook {
  id: string;
  label: string;
  status: "provider_hook_only";
  note: string;
}

export interface MaximillionProfileNote {
  id: string;
  title: string;
  body: string;
}

export interface DocumentTypeOption {
  id: string;
  label: string;
}

export interface ReportTypeOption {
  id: string;
  label: string;
}

export interface MockReportOutput {
  id: string;
  reportType: string;
  title: string;
  summary: string;
  bullets: string[];
  table?: Array<Record<string, string>>;
}

export interface ChartMockCard {
  id: string;
  title: string;
  description: string;
  dataPoints: Array<{ label: string; value: string }>;
  deckAction: string;
}

export interface LeadScoutMode {
  id: string;
  title: string;
  status: "coming_next";
  example: string;
  nextAction: string;
}

export const culturalFluencyNotes: MaximillionProfileNote[] = [
  {
    id: "comprehension",
    title: "AAVE and cultural comprehension",
    body:
      "Maximillion is designed to understand AAVE, Black cultural language, hip-hop/media slang, and founder shorthand at an expert level.",
  },
  {
    id: "restraint",
    title: "Executive restraint",
    body:
      "He defaults to polished executive language, never forces slang, and never performs stereotypes. Cultural fluency shows up only when the context naturally calls for it.",
  },
  {
    id: "warmth",
    title: "Pro-Black business confidence",
    body:
      "The tone should feel like a smart Black media executive: warm, respectful, strategically sharp, and clear about the money.",
  },
];

export const executiveBrainNotes: MaximillionProfileNote[] = [
  {
    id: "contract-awareness",
    title: "Contract and deal awareness",
    body:
      "Harvard attorney-level caution around usage rights, deliverables, exclusivity, cancellation language, payment timing, and approval windows.",
  },
  {
    id: "revenue-strategy",
    title: "Revenue strategy",
    body:
      "Harvard MBA-level packaging instincts across rate cards, margin, buyer objections, next-best ask, forecast quality, and direct-sold campaign value.",
  },
  {
    id: "media-executive",
    title: "Media executive operating system",
    body:
      "TV/film, Fox-style media business instincts, Conde Nast publishing literacy, and Saatchi & Saatchi agency-side advertising fluency.",
  },
  {
    id: "inventory",
    title: "Inventory intelligence",
    body:
      "Understands sponsorship packaging, branded content, licensing, banner inventory, pre-roll, mid-roll, rate cards, sales decks, and offline revenue.",
  },
];

export const opportunityCategories: OpportunityCategoryOption[] = [
  { id: "website_ads", label: "Website Ads" },
  { id: "google_ads", label: "Google Ads" },
  { id: "youtube_video", label: "YouTube / Video" },
  { id: "social_sponsorships", label: "Social Sponsorships" },
  { id: "events", label: "Events" },
  { id: "speaking", label: "Speaking" },
  { id: "print_publishing", label: "Print / Publishing" },
  { id: "cannabis", label: "Cannabis" },
  { id: "sports", label: "Sports" },
  { id: "fitness_wellness", label: "Fitness / Wellness" },
  { id: "music_hiphop", label: "Music / Hip-Hop" },
  { id: "ai_aeo", label: "AI / AEO" },
];

export const mockOpportunities: Opportunity[] = [
  {
    id: "opp-sports-super-bowl",
    title: "SportsHaven Super Bowl sponsor stack",
    category: "sports",
    fitScore: 96,
    estimatedValueRange: "$25k-$80k",
    relevantBrands: ["SportsHaven", "HMG", "YouTube"],
    whyItMatters:
      "High-intent sports attention gives HMG a clean package across articles, shorts, newsletter placements, and local LA watch-party coverage.",
    suggestedPlay:
      "Bundle a 3-week content run with sponsor reads, local venue integrations, social cutdowns, and a rate-card anchor so buyers understand the package value.",
    nextAction:
      "Build a 1-page inventory sheet for sports bars, beverage brands, recovery products, and athlete-adjacent creators, then ask for a 15-minute package review.",
    status: "ready",
  },
  {
    id: "opp-canna-420",
    title: "CannaHaven 4/20 culture package",
    category: "cannabis",
    fitScore: 94,
    estimatedValueRange: "$15k-$60k",
    relevantBrands: ["CannaHaven", "HipHopHaven", "HMG"],
    whyItMatters:
      "Cannabis brands need premium culture-safe inventory that does not feel generic or over-polished.",
    suggestedPlay:
      "Offer sponsored guides, event recaps, product storytelling, compliant social amplification, and clear usage-rights language.",
    nextAction:
      "Create a prospect list of lifestyle papers, rosin brands, rolling accessories, lounges, and cannabis-friendly venues.",
    status: "warm",
  },
  {
    id: "opp-video-pre-roll",
    title: "YouTube and video player advertiser lane",
    category: "youtube_video",
    fitScore: 91,
    estimatedValueRange: "$10k-$45k",
    relevantBrands: ["SportsHaven", "HipHopHaven", "RapHaven", "MusicHaven"],
    whyItMatters:
      "Video inventory lets HMG sell sight, sound, and host-read trust instead of static impressions only.",
    suggestedPlay:
      "Package pre-roll, mid-roll, branded cold opens, post clips, buyer-safe reporting, and a direct-sold CPM floor.",
    nextAction:
      "Draft a video rate card with starter, growth, and takeover tiers.",
    status: "packaging",
  },
  {
    id: "opp-social-creator",
    title: "Creator-led social sponsorships",
    category: "social_sponsorships",
    fitScore: 89,
    estimatedValueRange: "$7.5k-$35k",
    relevantBrands: ["HipHopHaven", "RapHaven", "FitHaven"],
    whyItMatters:
      "Brands buying culture need creator-native distribution more than another polished banner.",
    suggestedPlay:
      "Sell weekly sponsor drops across Reels, TikTok-style edits, YouTube Shorts, and story frames.",
    nextAction:
      "Lead with fashion, beverage, creator tools, and music-tech targets.",
    status: "ready",
  },
  {
    id: "opp-events-la",
    title: "Local LA event revenue lane",
    category: "events",
    fitScore: 88,
    estimatedValueRange: "$12k-$50k",
    relevantBrands: ["HMG", "MusicHaven", "SportsHaven"],
    whyItMatters:
      "HMG can convert LA proximity into sponsor access, venue partnerships, VIP recap content, and invite-only media moments.",
    suggestedPlay:
      "Build a repeatable event kit: preview, on-site content, recap, sponsor thank-you posts, and newsletter placement.",
    nextAction:
      "Pitch two venues and three beverage partners with a monthly activation calendar.",
    status: "research",
  },
  {
    id: "opp-ai-aeo",
    title: "AI and AEO sponsor education series",
    category: "ai_aeo",
    fitScore: 84,
    estimatedValueRange: "$8k-$30k",
    relevantBrands: ["HMG", "AI / AEO"],
    whyItMatters:
      "Search behavior is moving toward answer engines, and brands need plain-English authority around discoverability.",
    suggestedPlay:
      "Sell an explainers series, webinar, and sponsor-backed optimization checklist.",
    nextAction:
      "Prospect AI tools, creator software, analytics platforms, and podcast intelligence companies.",
    status: "packaging",
  },
  {
    id: "opp-speaking",
    title: "Founder speaking and media strategy offers",
    category: "speaking",
    fitScore: 82,
    estimatedValueRange: "$5k-$25k",
    relevantBrands: ["HMG", "MusicHaven", "SportsHaven"],
    whyItMatters:
      "Trent can sell earned authority around media, culture, AI publishing, and independent brand building.",
    suggestedPlay:
      "Package keynotes, fireside chats, and private sponsor salons.",
    nextAction:
      "Create a one-sheet for agencies, creator conferences, and university media programs.",
    status: "research",
  },
  {
    id: "opp-print-publishing",
    title: "Premium print and publishing sponsor edition",
    category: "print_publishing",
    fitScore: 78,
    estimatedValueRange: "$10k-$40k",
    relevantBrands: ["MusicHaven", "HipHopHaven", "HMG"],
    whyItMatters:
      "A limited print product gives sponsors a collectible placement and HMG a premium cultural artifact.",
    suggestedPlay:
      "Sell category exclusivity, founder letter placement, and digital companion inventory.",
    nextAction:
      "Mock a 12-page sponsor edition table of contents and rate ladder.",
    status: "packaging",
  },
];

export const eventRevenuePlays: EventRevenuePlay[] = [
  {
    id: "event-super-bowl",
    eventName: "Super Bowl",
    seasonOrDate: "February",
    relevantBrands: ["SportsHaven", "HMG", "YouTube"],
    sponsorTargets: ["sports bars", "beverage brands", "delivery apps", "recovery products"],
    activationIdeas: ["watch-party guide", "prediction clips", "sponsor read packages"],
    estimatedRevenueRange: "$25k-$80k",
    nextAction: "Lock a SportsHaven inventory sheet by mid-January.",
  },
  {
    id: "event-nba-finals",
    eventName: "NBA Finals",
    seasonOrDate: "June",
    relevantBrands: ["SportsHaven", "RapHaven", "FitHaven"],
    sponsorTargets: ["sports bars", "athlete recovery brands", "beverage brands"],
    activationIdeas: ["game-night previews", "player lifestyle angles", "postgame shorts"],
    estimatedRevenueRange: "$18k-$65k",
    nextAction: "Start with LA sports bars and recovery/fitness brands.",
  },
  {
    id: "event-grammy-season",
    eventName: "Grammy season",
    seasonOrDate: "January-February",
    relevantBrands: ["MusicHaven", "HipHopHaven", "RapHaven"],
    sponsorTargets: ["music tech", "fashion", "beverage", "creator tools"],
    activationIdeas: ["nomination guides", "red carpet recaps", "playlist sponsor blocks"],
    estimatedRevenueRange: "$15k-$55k",
    nextAction: "Build a Grammy-week sponsor menu for music and fashion buyers.",
  },
  {
    id: "event-stagecoach",
    eventName: "Stagecoach",
    seasonOrDate: "April",
    relevantBrands: ["MusicHaven", "FitHaven", "HMG"],
    sponsorTargets: ["apparel", "beverage", "travel", "wellness"],
    activationIdeas: ["festival prep", "artist spotlights", "desert recovery guide"],
    estimatedRevenueRange: "$10k-$35k",
    nextAction: "Prospect apparel, hydration, and wellness brands.",
  },
  {
    id: "event-coachella",
    eventName: "Coachella",
    seasonOrDate: "April",
    relevantBrands: ["MusicHaven", "HipHopHaven", "FitHaven"],
    sponsorTargets: ["fashion", "beauty", "music tech", "creator tools"],
    activationIdeas: ["fit checks", "artist previews", "creator field reports"],
    estimatedRevenueRange: "$20k-$70k",
    nextAction: "Package a two-week Coachella social and editorial run.",
  },
  {
    id: "event-sxsw",
    eventName: "SXSW",
    seasonOrDate: "March",
    relevantBrands: ["MusicHaven", "AI / AEO", "HMG"],
    sponsorTargets: ["AI tools", "music tech", "podcast sponsors", "creator platforms"],
    activationIdeas: ["founder dispatches", "trend briefings", "sponsor-backed panels"],
    estimatedRevenueRange: "$12k-$45k",
    nextAction: "Pitch AI and music-tech companies on a culture plus tech series.",
  },
  {
    id: "event-420",
    eventName: "4/20 / CannaHaven opportunities",
    seasonOrDate: "April 20",
    relevantBrands: ["CannaHaven", "HipHopHaven", "MusicHaven"],
    sponsorTargets: ["cannabis lifestyle", "rolling accessories", "lounges", "delivery"],
    activationIdeas: ["gift guide", "culture recap", "artist and cannabis crossover"],
    estimatedRevenueRange: "$15k-$60k",
    nextAction: "Open with compliant lifestyle sponsors and cannabis-adjacent venues.",
  },
  {
    id: "event-olympics",
    eventName: "Olympics",
    seasonOrDate: "Summer/Winter cycle",
    relevantBrands: ["SportsHaven", "FitHaven", "HMG"],
    sponsorTargets: ["fitness brands", "recovery tech", "sports nutrition", "wearables"],
    activationIdeas: ["athlete routines", "medal tracker content", "wellness explainers"],
    estimatedRevenueRange: "$20k-$75k",
    nextAction: "Create a FitHaven recovery and performance package.",
  },
  {
    id: "event-wrestlemania",
    eventName: "WrestleMania",
    seasonOrDate: "Spring",
    relevantBrands: ["SportsHaven", "RapHaven", "HMG"],
    sponsorTargets: ["sports bars", "gaming", "beverage", "streetwear"],
    activationIdeas: ["match previews", "culture crossover clips", "watch-party kits"],
    estimatedRevenueRange: "$12k-$40k",
    nextAction: "Build a sports-entertainment sponsor angle for venues and drinks.",
  },
  {
    id: "event-bet-awards",
    eventName: "BET Awards",
    seasonOrDate: "June",
    relevantBrands: ["HipHopHaven", "RapHaven", "MusicHaven"],
    sponsorTargets: ["fashion", "beauty", "beverage", "music tech"],
    activationIdeas: ["red carpet fit checks", "winner predictions", "after-party recaps"],
    estimatedRevenueRange: "$15k-$55k",
    nextAction: "Pitch fashion and beverage sponsors with a culture-first media kit.",
  },
  {
    id: "event-rolling-loud",
    eventName: "Rolling Loud",
    seasonOrDate: "Festival season",
    relevantBrands: ["HipHopHaven", "RapHaven", "CannaHaven"],
    sponsorTargets: ["streetwear", "cannabis lifestyle", "creator tools", "beverage"],
    activationIdeas: ["artist previews", "mosh-pit recaps", "sponsor social drops"],
    estimatedRevenueRange: "$18k-$70k",
    nextAction: "Turn artist coverage into a streetwear and beverage sponsor bundle.",
  },
  {
    id: "event-complexcon",
    eventName: "ComplexCon",
    seasonOrDate: "Fall",
    relevantBrands: ["HipHopHaven", "RapHaven", "MusicHaven"],
    sponsorTargets: ["fashion", "sneakers", "creator tools", "music tech"],
    activationIdeas: ["drop guides", "creator interviews", "brand booth recaps"],
    estimatedRevenueRange: "$15k-$50k",
    nextAction: "Prospect fashion and creator-tech brands with booth recap inventory.",
  },
  {
    id: "event-local-la",
    eventName: "Local LA events",
    seasonOrDate: "Monthly",
    relevantBrands: ["HMG", "MusicHaven", "SportsHaven", "CannaHaven"],
    sponsorTargets: ["venues", "sports bars", "local beverage", "wellness studios"],
    activationIdeas: ["event calendars", "neighborhood guides", "sponsor hosted nights"],
    estimatedRevenueRange: "$5k-$25k",
    nextAction: "Build a monthly LA sponsor calendar with venue and beverage packages.",
  },
];

export const sponsorTargets: SponsorTarget[] = [
  {
    id: "sponsor-fashion-nova-style",
    companyOrCategory: "Fashion Nova style social sponsorship bucket",
    fitScore: 92,
    havenBrands: ["HipHopHaven", "RapHaven", "MusicHaven"],
    suggestedPitch:
      "Culture-first fit checks, artist style recaps, and weekly social placements with measurable creator distribution.",
    nextAction: "Send a fashion sponsorship menu with social, video, and event add-ons.",
  },
  {
    id: "sponsor-slapwoods",
    companyOrCategory: "Slapwoods / cannabis lifestyle bucket",
    fitScore: 90,
    havenBrands: ["CannaHaven", "HipHopHaven"],
    suggestedPitch:
      "Premium cannabis culture storytelling without turning the brand into a generic product post.",
    nextAction: "Lead with 4/20 and Rolling Loud inventory.",
  },
  {
    id: "sponsor-beverage",
    companyOrCategory: "Beverage brands",
    fitScore: 88,
    havenBrands: ["SportsHaven", "MusicHaven", "HMG"],
    suggestedPitch:
      "Game-night, festival, and studio-session content packages built around moments people already gather for.",
    nextAction: "Prospect local LA beverage teams and national challenger brands.",
  },
  {
    id: "sponsor-recovery",
    companyOrCategory: "Gyms/recovery brands",
    fitScore: 87,
    havenBrands: ["FitHaven", "SportsHaven"],
    suggestedPitch:
      "Performance, recovery, and longevity content with SportsHaven context and FitHaven credibility.",
    nextAction: "Offer NBA Finals and Olympics training/recovery packages.",
  },
  {
    id: "sponsor-la-venues",
    companyOrCategory: "Local LA event venues",
    fitScore: 85,
    havenBrands: ["HMG", "MusicHaven", "CannaHaven"],
    suggestedPitch:
      "A recurring media partner package for previews, event coverage, and post-event social proof.",
    nextAction: "Build a three-venue outreach list and pitch a monthly content trade plus cash sponsor option.",
  },
  {
    id: "sponsor-sports-bars",
    companyOrCategory: "Sports bars",
    fitScore: 84,
    havenBrands: ["SportsHaven", "HMG"],
    suggestedPitch:
      "Turn big games into owned local attention with watch-party guides, branded previews, and recap clips.",
    nextAction: "Start with LA bars for NBA Finals and Super Bowl packages.",
  },
  {
    id: "sponsor-music-tech",
    companyOrCategory: "Music tech companies",
    fitScore: 83,
    havenBrands: ["MusicHaven", "HipHopHaven"],
    suggestedPitch:
      "Artist tools, production software, and fan platforms can buy credible education inside music coverage.",
    nextAction: "Pitch a sponsor-backed producer toolkit series.",
  },
  {
    id: "sponsor-creator-tools",
    companyOrCategory: "Creator tools",
    fitScore: 82,
    havenBrands: ["HMG", "YouTube", "HipHopHaven"],
    suggestedPitch:
      "Creator workflow content tied to social growth, content production, and independent media monetization.",
    nextAction: "Package newsletter, video, and social inventory into a creator stack offer.",
  },
  {
    id: "sponsor-ai-tools",
    companyOrCategory: "AI tools",
    fitScore: 81,
    havenBrands: ["HMG", "AI / AEO"],
    suggestedPitch:
      "Plain-English AI adoption content for creators, publishers, and culture operators.",
    nextAction: "Draft a provider-neutral AI/AEO education package.",
  },
  {
    id: "sponsor-podcasts",
    companyOrCategory: "Podcast sponsors",
    fitScore: 80,
    havenBrands: ["HMG", "SportsHaven", "MusicHaven"],
    suggestedPitch:
      "Host-read trust, recap clips, and editorial companion posts give podcast buyers more surface area.",
    nextAction: "Create a pilot podcast sponsor offer with three inventory levels.",
  },
  {
    id: "sponsor-video-advertisers",
    companyOrCategory: "YouTube/video player advertisers",
    fitScore: 79,
    havenBrands: ["SportsHaven", "HipHopHaven", "RapHaven"],
    suggestedPitch:
      "Video-first placements with pre-roll, mid-roll, shorts cutdowns, and simple performance reporting.",
    nextAction: "Draft the video rate card and a sample monthly report.",
  },
];

export const futureModules: FutureModule[] = [
  {
    id: "claude-document-reasoning",
    label: "Claude document reasoning",
    status: "coming_next",
    note: "Provider-optional document reasoning adapter. Inactive until configured.",
  },
  {
    id: "perplexity-lead-research",
    label: "Perplexity lead research",
    status: "coming_next",
    note: "Provider-optional sourced prospect research adapter. Inactive until configured.",
  },
  {
    id: "google-maps-places",
    label: "Google Maps / Places",
    status: "coming_next",
    note: "Provider-optional places/proximity adapter. Inactive until configured.",
  },
  {
    id: "gmail",
    label: "Gmail",
    status: "coming_next",
    note: "Provider-optional inbox and draft workflow. Inactive until configured.",
  },
  {
    id: "calendar",
    label: "Calendar",
    status: "coming_next",
    note: "Provider-optional scheduling and meeting-prep adapter. Inactive until configured.",
  },
  {
    id: "voice-activation",
    label: "Browser Voice",
    status: "coming_next",
    note: "Browser voice works where supported; provider voice remains optional.",
  },
  {
    id: "crm-export",
    label: "CRM export",
    status: "coming_next",
    note: "Provider-optional CSV and CRM handoff adapter. Inactive until configured.",
  },
  {
    id: "chart-builder",
    label: "Chart builder",
    status: "coming_next",
    note: "Provider-optional chart and presentation artifact adapter. Inactive until configured.",
  },
];

export const providerHooks: ProviderHook[] = [
  {
    id: "claude",
    label: "Claude",
    status: "provider_hook_only",
    note: "Optional document reasoning adapter. Browser/local mode does not require it.",
  },
  {
    id: "gemini",
    label: "Gemini",
    status: "provider_hook_only",
    note: "Optional multimodal adapter. Browser/local mode does not require it.",
  },
  {
    id: "perplexity",
    label: "Perplexity",
    status: "provider_hook_only",
    note: "Optional sourced research adapter. Browser/local mode does not require it.",
  },
  {
    id: "ollama",
    label: "Ollama",
    status: "provider_hook_only",
    note: "Optional local model adapter slot.",
  },
];

export const documentTypeOptions: DocumentTypeOption[] = [
  { id: "sales-doc", label: "Sales docs" },
  { id: "expenses", label: "Expenses" },
  { id: "sponsorship-list", label: "Sponsorship lists" },
  { id: "rate-card", label: "Rate cards" },
  { id: "csv", label: "CSV" },
  { id: "pdf", label: "PDF" },
  { id: "xlsx", label: "XLSX" },
  { id: "txt", label: "TXT" },
  { id: "notes", label: "Notes" },
  { id: "spreadsheet", label: "Spreadsheets" },
  { id: "chart", label: "Charts / graphs" },
  { id: "deck-notes", label: "Deck notes" },
  { id: "call-notes", label: "Call notes" },
  { id: "email-draft", label: "Email drafts" },
];

export const reportTypeOptions: ReportTypeOption[] = [
  { id: "sales-call-brief", label: "Sales call brief" },
  { id: "sponsor-pitch-summary", label: "Sponsor pitch summary" },
  { id: "revenue-forecast", label: "Revenue forecast" },
  { id: "expense-breakdown", label: "Expense breakdown" },
  { id: "deal-memo", label: "Deal memo" },
  { id: "weekly-sales-report", label: "Weekly sales report" },
  { id: "event-budget-report", label: "Event budget report" },
  { id: "presentation-chart-pack", label: "Presentation chart pack" },
  { id: "investor-ad-buyer-overview", label: "Investor/ad buyer overview" },
];

export const mockReportOutputs: MockReportOutput[] = [
  {
    id: "sales-call-brief",
    reportType: "sales-call-brief",
    title: "Mock Sales Call Brief",
    summary:
      "Lead with package value, clarify the buyer's success metric, and close with one next-best ask: a 20-minute review of the starter sponsorship tier.",
    bullets: [
      "Opening position: HMG can package audience trust, content velocity, and culture context into direct-sold inventory.",
      "Buyer objection to expect: unclear attribution. Response: define deliverables, reporting cadence, and a pilot success marker.",
      "Contract watch: usage rights, cancellation timing, category exclusivity, and payment schedule.",
    ],
  },
  {
    id: "sponsor-pitch-summary",
    reportType: "sponsor-pitch-summary",
    title: "Mock Sponsor Pitch Summary",
    summary:
      "Package SportsHaven and FitHaven into a local performance-and-recovery offer for gyms, sports bars, and beverage buyers.",
    bullets: [
      "Rate-card anchor: starter social package, growth video package, premium event activation.",
      "Sponsor-fit reasoning: local buyers need repeatable attention around games, wellness routines, and weekend plans.",
      "Next-best ask: approve a 30-day pilot with two content drops and one recap report.",
    ],
  },
  {
    id: "revenue-forecast",
    reportType: "revenue-forecast",
    title: "Mock Revenue Forecast",
    summary:
      "Forecast is strongest when direct-sold packages carry clear inventory, follow-up dates, and a named buyer objection.",
    bullets: [
      "Weighted pipeline: prioritize Deck Sent and Negotiating leads before adding custom creative scope.",
      "Upside path: attach event inventory to every sponsor conversation before the buyer asks for a discount.",
      "Risk: unpriced leads distort forecast quality. Add estimated value before the next review.",
    ],
    table: [
      { lane: "Sports packages", value: "$80k", confidence: "High" },
      { lane: "Video sponsorship", value: "$45k", confidence: "Medium" },
      { lane: "Local events", value: "$30k", confidence: "Medium" },
    ],
  },
  {
    id: "expense-breakdown",
    reportType: "expense-breakdown",
    title: "Mock Expense Breakdown",
    summary:
      "Keep event spend tied to revenue-producing deliverables: capture, editing, venue, paid boost, and sponsor reporting.",
    bullets: [
      "Cut or sponsor any cost that does not improve content quality, buyer confidence, or distribution.",
      "Separate fixed production costs from optional amplification so package margins stay visible.",
      "Next-best ask: request sponsor approval on the activation budget before final creative expansion.",
    ],
    table: [
      { item: "Creator capture", budget: "$2,500", note: "Core deliverable" },
      { item: "Post-production", budget: "$1,750", note: "Core deliverable" },
      { item: "Paid boost", budget: "$1,000", note: "Optional" },
    ],
  },
  {
    id: "deal-memo",
    reportType: "deal-memo",
    title: "Mock Deal Memo",
    summary:
      "Deal memo should define the buyer, campaign promise, inventory, approval path, and payment terms before HMG starts custom production.",
    bullets: [
      "Inventory: banner, sponsored article, short-form video, newsletter, event recap, and social amplification.",
      "Legal lens: usage rights, category exclusivity, FTC/sponsor disclosure, kill fees, and approval deadlines.",
      "Next-best ask: send a one-page scope with price, timeline, and signature-ready terms.",
    ],
  },
  {
    id: "weekly-sales-report",
    reportType: "weekly-sales-report",
    title: "Mock Weekly Sales Report",
    summary:
      "This week should be judged by priced pipeline movement, follow-up discipline, and buyer commitments rather than raw lead count.",
    bullets: [
      "Move at least one Deck Sent lead to Negotiating with a narrower package and one CTA.",
      "Add five local-market targets for FitHaven, SportsHaven, and CannaHaven.",
      "Prepare one rate-card update with direct-sold video and sponsorship inventory.",
    ],
  },
  {
    id: "event-budget-report",
    reportType: "event-budget-report",
    title: "Mock Event Budget Report",
    summary:
      "Budget the event as a sponsor product, not a vanity activation: every dollar needs a deliverable or a relationship outcome.",
    bullets: [
      "Revenue lanes: venue partner, beverage sponsor, video sponsor, recap sponsor, and newsletter sponsor.",
      "Expense guardrail: keep production and venue costs below 35% of committed sponsor revenue.",
      "Next-best ask: secure a sponsor deposit before locking premium production spend.",
    ],
    table: [
      { line: "Venue", estimate: "$3,000", sponsorTie: "Local partner" },
      { line: "Capture team", estimate: "$2,500", sponsorTie: "Recap content" },
      { line: "Editing", estimate: "$1,500", sponsorTie: "Shorts package" },
    ],
  },
  {
    id: "presentation-chart-pack",
    reportType: "presentation-chart-pack",
    title: "Mock Presentation Chart Pack",
    summary:
      "A future deck export should turn pipeline, expenses, sponsor targets, and event budget into boardroom-ready visuals.",
    bullets: [
      "Chart 1: pipeline by stage and weighted value.",
      "Chart 2: sponsor target fit score by HMG brand.",
      "Chart 3: event budget versus committed sponsor revenue.",
    ],
  },
  {
    id: "investor-ad-buyer-overview",
    reportType: "investor-ad-buyer-overview",
    title: "Mock Investor / Ad Buyer Overview",
    summary:
      "Position HMG as a culture media company with direct-sold inventory, event access, founder credibility, and scalable sponsor packages.",
    bullets: [
      "Buyer promise: premium cultural attention with clearer context than programmatic media.",
      "Growth path: rate cards, event packages, video inventory, licensing, and local-market sponsorships.",
      "Next-best ask: book a package review and align on the buyer's first campaign objective.",
    ],
  },
];

export const chartMockCards: ChartMockCard[] = [
  {
    id: "revenue-summary",
    title: "Simple revenue summary",
    description: "Mock breakdown of pipeline, event, video, and sponsor lanes.",
    dataPoints: [
      { label: "Pipeline", value: "$125k" },
      { label: "Events", value: "$55k" },
      { label: "Video", value: "$45k" },
    ],
    deckAction: "Send to deck placeholder",
  },
  {
    id: "expense-summary",
    title: "Expense summary",
    description: "Mock operating view for production and activation costs.",
    dataPoints: [
      { label: "Production", value: "$8.5k" },
      { label: "Venue", value: "$3k" },
      { label: "Paid boost", value: "$1k" },
    ],
    deckAction: "Send to deck placeholder",
  },
  {
    id: "sponsor-table",
    title: "Sponsor target table",
    description: "Mock table for sponsor fit, category, and next action.",
    dataPoints: [
      { label: "Fashion", value: "92 fit" },
      { label: "Cannabis", value: "90 fit" },
      { label: "Recovery", value: "87 fit" },
    ],
    deckAction: "Send to deck placeholder",
  },
  {
    id: "pipeline-chart",
    title: "Pipeline chart placeholder",
    description: "Mock stage chart for lead, deck sent, negotiating, and won.",
    dataPoints: [
      { label: "Lead", value: "8" },
      { label: "Deck", value: "3" },
      { label: "Negotiating", value: "2" },
    ],
    deckAction: "Send to deck placeholder",
  },
  {
    id: "event-budget",
    title: "Event budget table",
    description: "Mock event budget tied to sponsor revenue lanes.",
    dataPoints: [
      { label: "Capture", value: "$2.5k" },
      { label: "Editing", value: "$1.5k" },
      { label: "Sponsor target", value: "$15k" },
    ],
    deckAction: "Send to deck placeholder",
  },
  {
    id: "pitch-talking-points",
    title: "Pitch talking points",
    description: "Mock executive bullets for the next buyer conversation.",
    dataPoints: [
      { label: "Value", value: "Audience trust" },
      { label: "Ask", value: "30-day pilot" },
      { label: "Close", value: "Package review" },
    ],
    deckAction: "Send to deck placeholder",
  },
];

export const leadScoutModes: LeadScoutMode[] = [
  {
    id: "local-lead-scout",
    title: "Local Lead Scout",
    status: "coming_next",
    example:
      "Culver City gym / FitHaven example: recovery studio with trainers, local athlete traffic, and clean sponsor fit for performance content.",
    nextAction:
      "Future Google Maps / Places and Perplexity research can rank local prospects by proximity, category, and HMG brand fit.",
  },
  {
    id: "introduce-max",
    title: "Introduce Max",
    status: "coming_next",
    example:
      "Adrian Swish introduction example: warm connector note positioning HMG as a culture media platform with SportsHaven and video sponsor inventory.",
    nextAction:
      "Future Gmail and relationship-memory hooks can draft intro language while keeping Trent's voice and approval in control.",
  },
  {
    id: "relationship-memory",
    title: "Relationship Memory",
    status: "coming_next",
    example:
      "Pro-Black greeting tone sample: respectful, warm, direct, and business-first without forcing slang or performing culture.",
    nextAction:
      "Future CRM export and calendar context can remember past outreach, mutual contacts, buyer objections, and follow-up promises.",
  },
];

export const salesGlossary = [
  {
    term: "AE",
    label: "Account Executive",
    definition: "Owns qualified opportunities, runs sales conversations, and closes revenue.",
  },
  {
    term: "BDR",
    label: "Business Development Representative",
    definition: "Creates new business opportunities through prospecting and outbound outreach.",
  },
  {
    term: "SDR",
    label: "Sales Development Representative",
    definition: "Qualifies inbound or outbound leads before handing them to an AE.",
  },
  {
    term: "AM",
    label: "Account Manager",
    definition: "Manages active customer relationships, renewals, retention, and expansion.",
  },
  {
    term: "MQL",
    label: "Marketing Qualified Lead",
    definition: "A lead showing enough engagement to deserve sales review.",
  },
  {
    term: "SQL",
    label: "Sales Qualified Lead",
    definition: "A lead sales has validated as a real potential buyer.",
  },
  {
    term: "CRM",
    label: "Customer Relationship Management",
    definition: "The system of record for leads, deals, contacts, notes, and follow-ups.",
  },
  {
    term: "ICP",
    label: "Ideal Customer Profile",
    definition: "The exact type of buyer HMG should prioritize because fit and revenue odds are highest.",
  },
  {
    term: "ARR",
    label: "Annual Recurring Revenue",
    definition: "Revenue expected to repeat every year from active contracts or subscriptions.",
  },
  {
    term: "MRR",
    label: "Monthly Recurring Revenue",
    definition: "Revenue expected to repeat every month.",
  },
  {
    term: "CAC",
    label: "Customer Acquisition Cost",
    definition: "The cost to win a new customer, including marketing and sales effort.",
  },
  {
    term: "LTV / CLV",
    label: "Lifetime Value",
    definition: "The total revenue or margin expected from a customer over the relationship.",
  },
  {
    term: "ACV",
    label: "Annual Contract Value",
    definition: "The average revenue value of a contract over one year.",
  },
  {
    term: "BANT",
    label: "Budget, Authority, Need, Timeline",
    definition: "A qualification framework for deciding whether a lead can become a real deal.",
  },
  {
    term: "CHAMP",
    label: "Challenges, Authority, Money, Prioritization",
    definition: "A qualification framework that starts with the buyer's problem before budget.",
  },
  {
    term: "ABC",
    label: "Always Be Closing",
    definition: "Keep each conversation moving toward a clear next commitment.",
  },
  {
    term: "FAB",
    label: "Features, Advantages, Benefits",
    definition: "Translate what HMG offers into why it matters to the buyer.",
  },
];

export function generateMaximillionBrief(
  leads: SalesLead[],
  date = new Date(),
): MaximillionBrief {
  const activeLeads = leads.filter(
    (lead) => lead.stage !== "closed_won" && lead.stage !== "closed_lost",
  );
  const highestValueLead = [...activeLeads].sort(
    (a, b) => b.estimatedValue - a.estimatedValue,
  )[0];
  const deckSentLead = activeLeads.find((lead) => lead.stage === "deck_sent");
  const dueLead = getDueFollowUps(activeLeads, date)[0];
  const upcomingEvent = getSeasonalEvent(date);
  const sponsorTarget = sponsorTargets[0];
  const emptyStages = SALES_STAGES.filter(
    (stage) => !leads.some((lead) => lead.stage === stage),
  );

  if (!leads.length) {
    return {
      todayFocus:
        "Pipeline is empty. First move: add 10 sponsor targets tied to SportsHaven and CannaHaven event inventory.",
      bestNextMove:
        "Start with local LA sports bars, beverage brands, recovery/fitness products, and athlete-adjacent creators.",
      hotLead:
        "No hot lead yet. Seed the board with one sports, one cannabis, one fashion, and one video sponsor target.",
      eventPlay: `${upcomingEvent.eventName}: ${upcomingEvent.nextAction}`,
      sponsorAngle: `${sponsorTarget.companyOrCategory}: ${sponsorTarget.suggestedPitch}`,
      packageValue:
        "Build the first package like a media executive: deliverables, audience promise, reporting, usage rights, and a clean starter price.",
      rateCardThinking:
        "Anchor with three tiers: starter social, growth video, and premium event activation. The buyer needs a menu before they need a custom idea.",
      buyerObjection:
        "Expect the first objection to be measurement. Answer with simple deliverables, reporting cadence, and a pilot success metric.",
      nextBestAsk:
        "Ask for a 20-minute sponsorship inventory review, not a vague coffee chat.",
      riskWarning:
        "No recorded pipeline means no forecast. Put qualified prospects into Lead and Contacted today.",
      founderNote:
        "Trent, the cleanest move is to turn HMG attention into inventory. Start narrow, price clearly, and give every sponsor one confident CTA.",
    };
  }

  return {
    todayFocus: `Visible pipeline is ${formatCurrency(
      activeLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0),
    )}. Keep the board moving toward closed revenue, not polite maybes.`,
    bestNextMove: deckSentLead
      ? `Deck is out to ${deckSentLead.company}. Follow up within 48 hours with a tighter offer and one clear CTA.`
      : dueLead
        ? `Follow up with ${dueLead.company} today. The ask should be specific, priced, and easy to accept.`
        : `Package ${upcomingEvent.eventName} inventory and attach it to the highest-fit sponsor lane.`,
    hotLead: highestValueLead
      ? `${highestValueLead.company} is the lead to chase at ${formatCurrency(
          highestValueLead.estimatedValue,
        )}. Tie the pitch to ${REVENUE_TYPE_LABELS[highestValueLead.revenueType]}.`
      : "No active lead is priced yet. Add estimated value so the next move is obvious.",
    eventPlay: `${upcomingEvent.eventName}: ${upcomingEvent.nextAction}`,
    sponsorAngle: `${sponsorTarget.companyOrCategory}: ${sponsorTarget.nextAction}`,
    packageValue: highestValueLead
      ? `${highestValueLead.company} needs to see why the package is worth ${formatCurrency(
          highestValueLead.estimatedValue,
        )}: defined inventory, clear reporting, and sponsor-fit logic tied to HMG's audience.`
      : "Package value improves when every offer shows inventory, rights, reporting, and one buyer outcome.",
    rateCardThinking:
      "Use the rate card as the anchor: banner inventory, pre-roll/mid-roll, branded content, newsletter, social, event recap, and licensing add-ons.",
    buyerObjection: dueLead
      ? `${dueLead.company} may slow-roll on budget or attribution. Keep the response executive: pilot scope, success metric, payment timing, and approval path.`
      : "Most buyer objections will be budget, attribution, timing, or internal approval. Answer with a smaller pilot, not a smaller vision.",
    nextBestAsk: deckSentLead
      ? `Ask ${deckSentLead.company} for a specific package decision window and one blocker by end of week.`
      : "Ask for the next concrete commitment: package review, decision maker intro, or approval to price the pilot.",
    riskWarning: emptyStages.length
      ? `Empty stage watch: ${emptyStages
          .map((stage) => stageLabel(stage))
          .join(", ")}. A healthy revenue board needs motion across the funnel.`
      : "Pipeline coverage looks balanced. Now protect follow-up discipline and offer clarity.",
    founderNote:
      "Trent, today’s cleanest move is SportsHaven sponsorship inventory around tentpole sports content. Keep the pitch crisp, priced, and close to buyer outcomes.",
  };
}

export function buildMaximillionMemory(leads: SalesLead[]): MaximillionMemory {
  const rememberedLeads = leads.slice(0, 12).map((lead) => ({
    id: lead.id,
    company: lead.company,
    stage: lead.stage,
    estimatedValue: lead.estimatedValue,
  }));
  const won = leads.filter((lead) => lead.stage === "closed_won");
  const lost = leads.filter((lead) => lead.stage === "closed_lost");
  const followUps = leads
    .filter((lead) => lead.nextFollowUpAt)
    .slice(0, 6)
    .map((lead) => `${lead.company}: ${lead.nextFollowUpAt}`);
  const brandFits = Array.from(
    new Set(leads.flatMap((lead) => [lead.brandFit, ...lead.tags]).filter(Boolean)),
  ).slice(0, 8);

  return {
    rememberedLeads,
    pastOutreach: leads.length
      ? leads.slice(0, 5).map((lead) => `${lead.company}: ${stageLabel(lead.stage)}`)
      : ["No outreach history yet."],
    winLossReasons: [
      won.length
        ? `${won.length} won lead(s): strongest path is clear package, clear CTA.`
        : "Won reasons pending first closed deal.",
      lost.length
        ? `${lost.length} lost lead(s): review pricing, timing, and brand fit.`
        : "Loss reasons pending closed-lost notes.",
    ],
    followUpReminders: followUps.length
      ? followUps
      : ["Add next follow-up dates so Maximillion can protect the calendar."],
    brandFitHistory: brandFits.length
      ? brandFits
      : ["SportsHaven, CannaHaven, HipHopHaven, FitHaven"],
    eventIdeas: eventRevenuePlays.slice(0, 5).map((event) => event.eventName),
    revenueNotes: [
      "Prioritize sponsor packages with clear deliverables and a single buyer CTA.",
      "Push prospects from interest to a priced pilot before custom work expands.",
      "Use tentpole events to create urgency without discounting the media value.",
    ],
  };
}

export function getRevenueSnapshot(leads: SalesLead[], date = new Date()) {
  const activeLeads = leads.filter(
    (lead) => lead.stage !== "closed_won" && lead.stage !== "closed_lost",
  );
  const pipelineValue = activeLeads.reduce(
    (sum, lead) => sum + lead.estimatedValue,
    0,
  );
  const hotOpportunities = activeLeads.filter(
    (lead) => lead.priority === "high" || lead.priority === "urgent",
  ).length;

  return {
    pipelineValue,
    activeLeads: activeLeads.length,
    hotOpportunities,
    meetingsDue: getDueFollowUps(activeLeads, date).length,
    sponsorshipTargets: sponsorTargets.length,
    monthFocus: getMonthFocus(date),
  };
}

export function getDueFollowUps(leads: SalesLead[], date = new Date()) {
  const today = toIsoDate(date);
  return leads
    .filter((lead) => lead.nextFollowUpAt && lead.nextFollowUpAt <= today)
    .sort((a, b) => a.nextFollowUpAt.localeCompare(b.nextFollowUpAt));
}

export function getSeasonalEvent(date = new Date()): EventRevenuePlay {
  const month = date.getMonth();
  const eventIdByMonth: Record<number, string> = {
    0: "event-grammy-season",
    1: "event-super-bowl",
    2: "event-sxsw",
    3: "event-420",
    4: "event-nba-finals",
    5: "event-bet-awards",
    6: "event-olympics",
    7: "event-local-la",
    8: "event-rolling-loud",
    9: "event-complexcon",
    10: "event-grammy-season",
    11: "event-super-bowl",
  };
  return (
    eventRevenuePlays.find((event) => event.id === eventIdByMonth[month]) ??
    eventRevenuePlays[0]
  );
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function revenueTypeToCategory(type: RevenueType): OpportunityCategory {
  const map: Record<RevenueType, OpportunityCategory> = {
    website_ads: "website_ads",
    google_ads: "google_ads",
    youtube_video: "youtube_video",
    social_sponsorship: "social_sponsorships",
    event_sponsorship: "events",
    print: "print_publishing",
    speaking: "speaking",
    affiliate: "website_ads",
    ai_aeo: "ai_aeo",
    partnership: "events",
  };
  return map[type];
}

function getMonthFocus(date: Date): string {
  const event = getSeasonalEvent(date);
  return `${event.eventName} sponsor inventory`;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function stageLabel(stage: SalesStage): string {
  return stage
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
