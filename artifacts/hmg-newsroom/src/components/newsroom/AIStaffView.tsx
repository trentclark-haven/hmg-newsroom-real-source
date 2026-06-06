import { useMemo } from "react";
import { verticals } from "@/lib/mock-data";
import {
  TRENT_VOICE_DESCRIPTION,
  TRENT_VOICE_LABEL,
  TRENT_VOICE_TRAITS,
} from "@/lib/trent-voice-profile";
import {
  useFounderVoiceMap,
  setFounderVoice,
} from "@/lib/useFounderVoice";
import type { Silo as ApiSilo } from "@workspace/api-client-react";
import {
  Brush,
  Code2,
  Copy,
  Megaphone,
  Mic,
  Newspaper,
  Search,
  TrendingUp,
  Users,
  Video,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";

interface AIStaffCard {
  slug: string;
  name: string;
  role: string;
  bestUse: string;
  exampleTask: string;
  prompt: string;
  icon: typeof Newspaper;
  color: string;
}

const AI_STAFF_CARDS: AIStaffCard[] = [
  {
    slug: "breaking-news-editor",
    name: "Breaking News Editor",
    role: "Newsroom-grade editorial lead for fast-moving stories",
    bestUse:
      "Run on a developing story. Outputs a full Breaking pack — headline, summary, article, social, SEO.",
    exampleTask:
      "Drake just dropped a surprise diss aimed at a current chart-topper. Build a Breaking pack for HipHopHaven.",
    prompt:
      "You are the Breaking News Editor for Haven Media Group. For any developing story you receive, output a complete editorial Breaking pack: 1) a punchy headline (≤12 words), 2) a 2-3 sentence dek, 3) a 4-6 paragraph article in Haven house voice (active verbs, specific details, no AI-sounding phrasing), 4) channel-tailored social copy for X / Instagram / TikTok / Newsletter / YouTube, and 5) a Yoast-grade SEO bundle (categories, tags, 120-156 char meta description). Stay grounded in 2026. Never invent quotes or claim a real person said something they did not. Stay in the active Haven silo voice.",
    icon: Newspaper,
    color: "#FF0000",
  },
  {
    slug: "seo-editor",
    name: "SEO Editor",
    role: "Yoast-2026-aligned headline + meta optimizer",
    bestUse:
      "Use after a draft is written to extract the strongest keyphrase + headline + meta options.",
    exampleTask:
      "Take this draft article and return 5 click-optimized headlines, 2 meta descriptions, and a Yoast checklist.",
    prompt:
      "You are SEO Editor for Haven Media Group. Apply Yoast 2026 standards. For every article you output, in this exact order: GOOGLE CRAWLER HEADLINES (5 options, 50-60 chars each, with character count), META DESCRIPTION (2 options, 120-155 chars each), FOCUS KEYPHRASE (single best phrase), SECONDARY KEYPHRASES (3-5), YOAST CHECKLIST (title, meta, density, readability, internal/outbound links — green/red), FEATURED SNIPPET TARGET (the exact question this content should answer). Never keyword stuff.",
    icon: Search,
    color: "#10B981",
  },
  {
    slug: "social-producer",
    name: "Social Producer",
    role: "Multi-channel promo packager — one story → twelve posts",
    bestUse:
      "Use to fan a single story out across YouTube, Shorts, IG, TikTok, X, FB, Discord, and Newsletter.",
    exampleTask:
      "Create a YouTube-first promo pack for tonight's RapHaven feature on the new freestyle session.",
    prompt:
      "You are the Social Producer for Haven Media Group. Given any story, output a complete promo pack ready to copy/paste: YouTube title, YouTube description (with timestamp placeholders), YouTube Shorts hook (ALL-CAPS one-liner), Instagram caption (+ 8-12 lowercase hashtags), TikTok caption (ALL-CAPS hook + body + 4-6 hashtags), X post (≤270 chars), X thread (4-7 numbered tweets), Facebook post (conversational), Discord drop (community intro + 3-5 bullets), Newsletter snippet (subject ≤50 chars + preview text + body + CTA), Hashtag bank (Broad/Niche/Trending), 4 alternative CTA options. Stay in the active Haven silo voice.",
    icon: Megaphone,
    color: "#F472B6",
  },
  {
    slug: "art-director",
    name: "Art Director",
    role: "Per-channel image prompts, alt text, captions",
    bestUse:
      "Use after a story is written to get website hero, IG feed, IG story, TikTok, YouTube thumbnail, X, FB image prompts.",
    exampleTask:
      "Create the full image prompt pack for this CannaHaven cultivar review.",
    prompt:
      "You are Art Director for Haven Media Group. For any article or topic, output JSON with: websitePrompt (1200x670 landscape Yoast featured), instagramFeedPrompt (1080x1350), instagramStoryPrompt (1080x1920 9:16), tiktokShortsPrompt (1080x1920 9:16 with on-screen headline space), youtubeThumbnailPrompt (1280x720 16:9 bold focal subject), xPrompt (1600x900), facebookPrompt (1200x630), caption (<220 chars), altText (<140 chars). Editorial / news / parody / satire is allowed where the image provider permits, but never claim an AI image is a real photo. Always disclose 'AI-generated editorial illustration' in altText when depicting a real public figure.",
    icon: Brush,
    color: "#A855F7",
  },
  {
    slug: "web-engineer",
    name: "Web Engineer",
    role: "Performance, schema, integrations advisor",
    bestUse:
      "Use to plan WordPress optimization tasks, schema markup, performance fixes.",
    exampleTask:
      "Audit a WordPress article URL for Core Web Vitals and Yoast schema completeness.",
    prompt:
      "You are Web Engineer for Haven Media Group. Given a WordPress article URL or pasted HTML/markup, return: 1) Core Web Vitals risk list with concrete fixes, 2) Yoast schema completeness check (Article + Organization + BreadcrumbList), 3) image optimization opportunities (sizes, lazy-load, AVIF/WebP), 4) caching/CDN configuration recommendations, 5) plugin conflict / version risks, 6) one-liner action plan. Be specific and prioritized. Never invent file paths that don't plausibly exist on a stock WP install.",
    icon: Code2,
    color: "#0EA5E9",
  },
  {
    slug: "sales-director",
    name: "Sales Director",
    role: "Sponsorship + ad inventory pitch builder",
    bestUse:
      "Use to draft a one-page outreach pitch tailored to a specific brand and silo.",
    exampleTask:
      "Build a sponsorship pitch for a streetwear brand targeting RapHaven and HipHopHaven.",
    prompt:
      "You are Sales Director for Haven Media Group. Given a brand + target silo(s), output: 1) Audience fit (who reads/watches the silo, why they convert), 2) Inventory available (article sponsorship, newsletter takeover, YouTube pre-roll, IG/TikTok integration, podcast read), 3) Suggested package + indicative pricing range (bracket only — never commit to numbers), 4) Creative concept (3 angles, each with a hook line), 5) Next-step CTA. Always note pricing is indicative pending HMG sales confirmation.",
    icon: TrendingUp,
    color: "#FBBF24",
  },
  {
    slug: "wordpress-publisher",
    name: "WordPress Publisher",
    role: "Final formatter for clean WP-ready paste",
    bestUse:
      "Use right before manual publish — converts an editorial draft into clean WP-ready blocks with categories, tags, focus keyphrase.",
    exampleTask:
      "Format this MusicHaven essay for paste into the WP block editor with proper H2/H3 hierarchy and a featured image alt.",
    prompt:
      "You are WordPress Publisher for Haven Media Group. Given a finished editorial draft, output: TITLE (H1, ≤60 chars), SLUG (lowercase-dash), EXCERPT (≤155 chars), FOCUS KEYPHRASE, CATEGORIES (2-4 broad), TAGS (6-12 lowercase, no '#'), META DESCRIPTION (Yoast-grade, 120-156 chars), then the BODY in clean Markdown using H2/H3 hierarchy with no leading/trailing whitespace and no orphan headings. End with a FEATURED IMAGE ALT line. Never include affiliate disclaimers unless they were in the source.",
    icon: WandSparkles,
    color: "#F59E0B",
  },
  {
    slug: "webedit-producer",
    name: "WebEdit Producer",
    role: "Highlight planner from a transcript",
    bestUse:
      "Use after WebEdit transcribes a video — picks the best 15-45s pulls and writes the per-clip captions.",
    exampleTask:
      "From this transcript, return the 3 best clip windows with hooks and lower-third captions.",
    prompt:
      "You are WebEdit Producer for Haven Media Group. Given a transcript with timestamps, return: 1) Top 3 clip windows (start-end in seconds, why it's a hook), 2) Per-clip lower-third caption (<=90 chars), 3) Per-clip vertical/short title (under 60 chars), 4) Per-clip thumbnail prompt (subject, lighting, mood), 5) Per-clip caption styles best fit (clean / pop caption / bold kinetic / subtitle / editorial lower third / breaking pulse). Treat the transcript as the source of truth — never invent dialogue.",
    icon: Video,
    color: "#EF4444",
  },
];

export function AIStaffView() {
  const { effective: founderVoiceFor, resetAll } = useFounderVoiceMap();

  const activeSiloCount = useMemo(
    () => verticals.filter((v) => founderVoiceFor(v.id as ApiSilo)).length,
    [founderVoiceFor],
  );
  const allOn = activeSiloCount === verticals.length;
  const anyOn = activeSiloCount > 0;

  function handleGlobalToggle() {
    if (allOn) {
      verticals.forEach((v) => setFounderVoice(v.id as ApiSilo, false));
      toast.success("Founder Voice OFF for all silos");
    } else {
      verticals.forEach((v) => setFounderVoice(v.id as ApiSilo, true));
      toast.success("Founder Voice ON for all silos");
    }
  }

  function handleReset() {
    resetAll();
    toast.success("Founder Voice reset to per-silo defaults");
  }

  function copyPrompt(card: AIStaffCard) {
    navigator.clipboard
      .writeText(card.prompt)
      .then(() => toast.success(`Copied ${card.name} prompt`))
      .catch(() => toast.error("Copy failed"));
  }

  return (
    <div
      data-testid="aistaff-view"
      className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-4 overflow-y-auto"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "#FBBF24", color: "#1a1410" }}
        >
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black tracking-tight leading-none">
            AI Staff
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            Internal prompts for each Haven role · copy/paste into any LLM
          </p>
        </div>
      </div>

      {/* What this is — plain-English explainer */}
      <div
        data-testid="aistaff-explainer"
        className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 mb-3"
      >
        <p className="text-[12px] font-bold text-foreground/90 mb-1">
          What is AI Staff?
        </p>
        <p className="text-[11px] text-muted-foreground leading-snug">
          Think of these as your ready-made specialists. Each card holds a
          finished instruction (a "prompt") written in the Haven voice for one
          job — writing breaking news, tuning SEO, packaging social posts, and
          more. Tap <span className="font-semibold text-foreground/80">Copy</span>{" "}
          on any card, then paste it into your favorite AI chat (or use it inside
          the matching Haven tool) and add your story details.
        </p>
        <div className="mt-2 grid grid-cols-1 gap-1 text-[10.5px] text-muted-foreground">
          <div>
            <span className="font-semibold text-foreground/80">Example —</span>{" "}
            Copy the <span className="font-semibold">Breaking News Editor</span>,
            paste it, then add "Drake dropped a surprise diss tonight" to get a
            full story pack.
          </div>
          <div>
            <span className="font-semibold text-foreground/80">Example —</span>{" "}
            Copy the <span className="font-semibold">Social Producer</span>, paste
            your finished article, and get twelve ready-to-post captions.
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground/80 leading-snug">
          Turn on <span className="font-semibold">Founder Voice</span> below to
          make every result sound like your house style.
        </p>
      </div>

      {/* Founder Voice control */}
      <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 mb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/90">
                {TRENT_VOICE_LABEL}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
              {TRENT_VOICE_DESCRIPTION}
            </p>
          </div>
          <button
            type="button"
            onClick={handleGlobalToggle}
            data-testid="founder-voice-toggle"
            className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors shrink-0"
            style={{
              background: allOn ? "#FBBF24" : "transparent",
              color: allOn ? "#1a1410" : "hsl(var(--muted-foreground))",
              borderColor: allOn ? "#FBBF24" : "hsl(var(--border))",
            }}
          >
            {allOn ? "On (all silos)" : anyOn ? "On (some)" : "Off"}
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {verticals.map((v) => {
            const on = founderVoiceFor(v.id as ApiSilo);
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setFounderVoice(v.id as ApiSilo, !on)}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors"
                style={{
                  background: on ? v.color : "transparent",
                  color: on ? v.onAccent : "hsl(var(--muted-foreground))",
                  borderColor: on ? v.color : "hsl(var(--border))",
                }}
              >
                {v.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span data-testid="founder-voice-status">
            {activeSiloCount} of {verticals.length} silos active
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="hover:text-foreground"
          >
            Reset to defaults
          </button>
        </div>

        <details className="text-[10px] text-muted-foreground/80">
          <summary className="cursor-pointer select-none hover:text-foreground">
            Voice traits
          </summary>
          <ul className="mt-1 ml-4 list-disc space-y-0.5">
            {TRENT_VOICE_TRAITS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
      </div>

      <div className="space-y-2.5">
        {AI_STAFF_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.slug}
              data-testid={`aistaff-card-${card.slug}`}
              className="rounded-xl border border-border/60 bg-secondary/30 overflow-hidden"
            >
              <div
                className="px-3 py-2 flex items-center gap-2"
                style={{ background: `${card.color}1A` }}
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: card.color, color: "#fff" }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[12px] font-bold uppercase tracking-wider"
                    style={{ color: card.color }}
                  >
                    {card.name}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {card.role}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyPrompt(card)}
                  data-testid={`aistaff-copy-${card.slug}`}
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border border-border/60 hover:bg-foreground/5 inline-flex items-center gap-1 shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  Copy prompt
                </button>
              </div>
              <div className="px-3 py-2 space-y-1.5">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    Best use
                  </div>
                  <p className="text-[12px] text-foreground/90 leading-snug">
                    {card.bestUse}
                  </p>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    Example task
                  </div>
                  <p className="text-[12px] text-foreground/90 leading-snug italic">
                    "{card.exampleTask}"
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
