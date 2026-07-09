import {
  LifeBuoy,
  Newspaper,
  Megaphone,
  Brush,
  Video,
  Image as ImageIcon,
  Settings as SettingsIcon,
  TrendingUp,
  Search,
  Film,
  Radio,
  Users,
  CheckSquare,
  LayoutDashboard,
  HeartPulse,
  ScrollText,
  Database,
  Brain,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

interface ToolHelp {
  icon: LucideIcon;
  color: string;
  name: string;
  what: string;
  use: string;
  when?: string;
  buttons?: string;
  output?: string;
  automatic?: string;
  manual?: string;
  errors?: string;
  recover?: string;
}

interface HelpSection {
  label: string;
  hint: string;
  tools: ToolHelp[];
}

const HELP_SECTIONS: HelpSection[] = [
  {
    label: "Front Office",
    hint: "What you'll use every day",
    tools: [
      {
        icon: Newspaper,
        color: "#D9D9D9",
        name: "Editorial Desk",
        what: "Your main writing desk for all seven brands.",
        use: "Pick a brand tab, drop in your notes or a link, and create a story draft. Use Quick for one brand or Multi-brand to write for several at once.",
        when: "Use it any time you want to turn raw notes, a link, or a tip into an article draft.",
        buttons:
          "Brand tabs pick the voice. Create Article Draft writes one story fast. Create Breaking Story writes the urgent draft. The story notes box is where you paste facts or a link.",
        output: "A full draft headline and article in the brand's voice that you can copy, preview, save as a draft, or export.",
        automatic: "The writing, headline, and brand tone are prepared for you.",
        manual: "Always read the draft before manual publish. Check names, dates, quotes, and facts.",
        errors:
          "\"Create failed\" or a timeout usually means the app was busy or your notes were too thin. Add a little more detail and try again.",
        recover: "Your notes are saved as you type, so press Create Article Draft again. If it keeps failing, open System Health and reset the tool.",
      },
      {
        icon: Brain,
        color: "#7C3AED",
        name: "Editorial Desk Intelligence",
        what: "Turns NotebookLM / Gemini / YouTube / Google research and your own notes into a real branded article.",
        use: "Open Editorial Desk and pick a brand. Paste research into the labeled tabs (Founder Notes, NotebookLM, Timeline, Quotes, etc.) or paste the full briefing and tap Route into tabs. Then tap Create Article Draft.",
        when: "Use it whenever your research lives somewhere else and you want it turned into a clean article with verification notes.",
        buttons:
          "Research tabs collect the source notes. Article Type / Tone / Role pick the shape. Create Article Draft writes the draft. Inside the output: Copy Article, Copy Headline, Copy Full Article, Export WordPress Draft, Save Draft, Open WebArt, and Open Social Factory.",
        output: "Headline + alternates, dek, body, key facts, timeline, verification notes, what-not-to-claim list, SEO, social captions, WordPress excerpt, manual publish checklist, next actions, and an Article Strength score.",
        automatic: "The desk reads each tab, picks the lede, folds your facts/timeline/quotes verbatim into the body, and scores the article's strength.",
        manual: "Add at least one verified fact and one source link before the post is ready for manual publish. Never invent quotes — paste real ones.",
        errors: "If the Create button is greyed out you need at least one filled tab. If the Article Strength is 'weak' it tells you exactly what to add.",
        recover: "Your tab content stays in the page. Add a source link or one more verified fact and tap Create Article Draft again.",
      },
      {
        icon: Megaphone,
        color: "#F472B6",
        name: "Social Factory",
        what: "Turns one story into a full set of social posts.",
        use: "Paste a story or headline and create ready-to-copy captions for every platform in one click.",
        when: "Use it after you have a story or headline and want posts for Instagram, TikTok, X, Facebook, and the rest.",
        buttons:
          "Paste your story in the notes box. Create Social Campaign creates the full set. Each finished post has its own Copy button, and Copy All Posts grabs everything at once.",
        output: "A set of clearly labeled, ready-to-copy captions — one card per platform — that you can preview, copy, or export.",
        automatic: "Writing and sizing each caption to the platform is prepared for you.",
        manual: "You post them yourself. The app does not log in to your social accounts, so copy each one and paste it into the platform. Double-check hashtags and links first.",
        errors: "\"Direct posting not connected\" is normal and honest — it means you copy or export instead of auto-posting.",
        recover: "If posts don't create, add more to your notes and try again, or copy what you have and finish by hand.",
      },
      {
        icon: Brush,
        color: "#A855F7",
        name: "WebArt",
        what: "Creates branded images sized for every social platform.",
        use: "Choose your brand, upload a real photo, create or edit a graphic, then export the framed versions for Instagram, Stories, X, and Facebook.",
        when: "Use it when a story or post needs a branded image and you want every size ready at once.",
        buttons:
          "Pick a brand, upload assets, choose your output sizes and a frame style, then add a headline. Export buttons save each size; the action bar can copy the visual direction packet or save to Media Library.",
        output: "Branded, correctly sized images ready to export, plus optional visual direction with headline, caption, and alt-text ideas.",
        automatic: "Framing, sizing, and brand styling are prepared for you.",
        manual: "Pick the photo and make sure you have the rights to use it. Review the final crop so nothing important is cut off.",
        errors: "If a destination button is greyed out it tells you why — for example WordPress manual publish is blocked, so use Export instead.",
        recover: "If a graphic won't create, upload a real photo, preview the crop, or export what you have and finish manually.",
      },
      {
        icon: Video,
        color: "#EF4444",
        name: "WebEdit",
        what: "Creates clip plans, captions, and web video outputs from your videos and audio.",
        use: "Upload a clip, pick your brand and caption style, then create a cut plan for shortform or longform use.",
        when: "Use it when you have a video or audio clip and want captions and a clip plan for social.",
        buttons:
          "Upload Video lets you upload a file or paste a YouTube link. You can add a transcript, choose a clip length and caption style, preview the cut notes, and then export captions or the cut plan.",
        output: "Captions you can export, a suggested cut plan, and a transcript you can download.",
        automatic: "Audio review, captions, and clip suggestions are prepared when the connected ingest path is available.",
        manual: "Read the captions for spelling and names — speech-to-text isn't perfect. The screenshot option is only for a cover or thumbnail, not for the video itself.",
        errors: "A transcribe error usually means the file was too long, the link was private, or the upload didn't finish. Try a shorter clip or a public link.",
        recover: "Re-upload the clip or paste the link again. If it still fails, export the transcript you have and fix captions by hand.",
      },
      {
        icon: ImageIcon,
        color: "#22D3EE",
        name: "Media Library",
        what: "A simple index of your media so you can find it later.",
        use: "Log the name, type, and intended use of an asset. It stores details only — not the files themselves.",
      },
      {
        icon: SettingsIcon,
        color: "#F59E0B",
        name: "WP Connections (Manual Publish Prep)",
        what: "Sets up and checks the link between each brand and its WordPress site.",
        use: "Enter and test your WordPress details for each brand once, then use it to prepare export-ready WordPress drafts.",
        when: "Use it the first time you set up a brand, and any time you want to export a finished story for a site.",
        buttons:
          "Enter the site address and login for a brand, then press Test to confirm it works. The status pill tells you the truth about whether the site is reachable.",
        output: "An honest connection status per brand and a Ready for Manual Publish draft you can preview or export.",
        automatic: "The WordPress draft is prepared for you.",
        manual: "You enter the site details and decide when the draft is ready for manual publish. Review the final story and image before it goes live.",
        errors:
          "If a site shows Blocked or Not Connected, the login may be wrong, the site may be down, or manual publish may be turned off for that site. In that case use Export WordPress Draft.",
        recover: "Re-check the address and login and Test again. If manual publish stays blocked, export the draft and upload it in WordPress yourself.",
      },
      {
        icon: TrendingUp,
        color: "#10B981",
        name: "Sales Desk (Maximillion)",
        what: "Your calm, executive revenue partner — tracks leads, deals, and follow-ups.",
        use: "Open it to see today's money moves, leads to chase, and what to do next to bring in sponsorship dollars.",
        when: "Use it daily to see what to chase, and any time you want advice on a deal or a follow-up.",
        buttons:
          "The top tabs switch between Command, Money Moves, Leads, Follow-Ups, Founder Brief, and Receipts. There is one command box where you ask a question and one answer area where the reply appears.",
        output: "A prioritized view of leads and follow-ups, plus written advice and next steps you can act on.",
        automatic: "Sorting leads, suggesting next moves, and drafting advice is automatic.",
        manual: "You make the calls and close the deals. Treat the advice as a starting point and confirm numbers before you commit.",
        errors:
          "If the answer area is empty or says it can only use saved knowledge, that just means no outside AI provider is connected — it is running on the built-in Haven brain.",
        recover: "Ask your question again with a bit more detail. Your leads and notes stay saved, so nothing is lost if you reload.",
      },
    ],
  },
  {
    label: "Growth",
    hint: "Tools that grow your reach",
    tools: [
      {
        icon: Search,
        color: "#10B981",
        name: "SEO Master",
        what: "Writes search-friendly headlines and checklists.",
        use: "Pick a brand and a topic to get headline options, meta descriptions, and a quick checklist before you publish.",
      },
      {
        icon: Film,
        color: "#6366F1",
        name: "Clip + Brand",
        what: "Prepares a video output with a title, captions, and thumbnail.",
        use: "Use it to give a finished clip a consistent, branded look before posting.",
      },
      {
        icon: Radio,
        color: "#0EA5E9",
        name: "Station Scheduler",
        what: "Plans a full 24-hour programming day for a station.",
        use: "Lay out shows, segments, hosts, and sponsors hour by hour, then export the day's plan.",
      },
      {
        icon: Users,
        color: "#FBBF24",
        name: "AI Staff",
        what: "Ready-made assistants for common newsroom jobs.",
        use: "Pick a staff role to get a focused helper for that task, all in your brand's voice.",
      },
      {
        icon: CheckSquare,
        color: "#A855F7",
        name: "Assignment Center",
        what: "Hands tasks to your team and tracks them.",
        use: "Assign work to your people and watch each item move from open to done.",
      },
    ],
  },
  {
    label: "Back Office",
    hint: "Health, history, and behind-the-scenes",
    tools: [
      {
        icon: LayoutDashboard,
        color: "#0EA5E9",
        name: "Founder Desk",
        what: "Your one-screen status check and to-do list for the whole app.",
        use: "Open it to see what's healthy, what needs attention, and what to do next — in plain English.",
        when: "Use it at the start of your day, or whenever you want a single picture of where everything stands.",
        buttons:
          "Today's Action Queue shows what's waiting: drafts, images, social posts, WordPress drafts, and any failed jobs, with the next recommended action. The readiness panel shows, honestly, which channels are ready, blocked, or not connected.",
        output: "A clear list of what to do next and an honest status for every manual publish channel and local intelligence check.",
        automatic: "Gathering the counts and statuses is automatic.",
        manual: "You decide what to act on. If a status check asks you to sign in, do that to see live numbers instead of a blank or stale view.",
        errors:
          "If a channel shows Not Connected or Blocked, that's the truth, not a bug — use Export or the manual path. \"Sign in to view\" means the status couldn't be read yet.",
        recover: "Sign in if prompted, then reload. If a job shows as failed, go back to the tool that created it and run it again.",
      },
      {
        icon: HeartPulse,
        color: "#22C55E",
        name: "System Health",
        what: "Live status for every tool, with one-tap recovery.",
        use: "If something feels off, come here to see what's working and reset a tool without losing your work.",
      },
      {
        icon: ScrollText,
        color: "#94A3B8",
        name: "Receipt Log",
        what: "A running record of important actions.",
        use: "Check it to see what happened and when. Sensitive details are always hidden.",
      },
      {
        icon: Database,
        color: "#14B8A6",
        name: "Knowledge Corpus",
        what: "Your private, owned knowledge base.",
        use: "Paste, upload, or fetch reference material so the app can draw on your own facts.",
      },
      {
        icon: Brain,
        color: "#7C3AED",
        name: "Haven AI Control Center",
        what: "Shows how your AI is being routed.",
        use: "A status view for advanced users — it runs on your owned intelligence by default.",
      },
    ],
  },
];

export function HelpGuideView() {
  return (
    <div
      className="mx-auto w-full max-w-2xl px-4 py-6"
      data-testid="help-guide-view"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-sky-500/15 text-sky-400">
          <LifeBuoy className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight leading-none">
            How To Use HMG
          </h1>
          <p className="text-[12px] text-muted-foreground mt-1">
            A plain-English guide to every tool — no tech knowledge needed.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-sky-400/30 bg-sky-500/[0.06] p-4">
        <p className="text-[11px] font-black uppercase tracking-wider text-sky-500 dark:text-sky-300 mb-2">
          New here? Start with these three steps
        </p>
        <ol className="space-y-2 text-sm">
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-500 text-white text-[11px] font-bold flex items-center justify-center">
              1
            </span>
            <span>
              Open the <strong>Editorial Desk</strong>, pick a brand, paste
              your notes, and create your first story.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-500 text-white text-[11px] font-bold flex items-center justify-center">
              2
            </span>
            <span>
              Create matching graphics in <strong>WebArt</strong> and social
              posts in <strong>Social Factory</strong>.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-500 text-white text-[11px] font-bold flex items-center justify-center">
              3
            </span>
            <span>
              Connect a site in <strong>WP Connections</strong>, then export
              the WordPress draft when it is Ready for Manual Publish.
            </span>
          </li>
        </ol>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/[0.06] p-4 flex gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-bold">Safe Mode</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Find this toggle in the menu. When it's on, the app won't make AI
            calls, manual publishing actions, or uploads — a safety net while
            you explore.
          </p>
        </div>
      </div>

      {HELP_SECTIONS.map((section) => (
        <section key={section.label} className="mt-7">
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-[12px] font-black uppercase tracking-[0.22em] text-foreground/80">
              {section.label}
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {section.hint}
            </span>
          </div>
          <div className="space-y-3">
            {section.tools.map((tool) => {
              const Icon = tool.icon;
              const details: { label: string; text?: string }[] = [
                { label: "When to use it", text: tool.when },
                { label: "What the buttons do", text: tool.buttons },
                { label: "What you get", text: tool.output },
                { label: "What's automatic", text: tool.automatic },
                { label: "What you still check", text: tool.manual },
                { label: "Common errors", text: tool.errors },
                { label: "How to recover", text: tool.recover },
              ].filter((d) => Boolean(d.text));
              return (
                <div
                  key={tool.name}
                  className="rounded-xl border border-border/60 bg-card p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${tool.color}1A`, color: tool.color }}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                    </div>
                    <h3 className="text-[15px] font-bold">{tool.name}</h3>
                  </div>
                  <p className="text-[13px] text-foreground/90">{tool.what}</p>
                  <p className="text-[12px] text-muted-foreground mt-1.5">
                    <span className="font-semibold text-foreground/70">
                      How to use:{" "}
                    </span>
                    {tool.use}
                  </p>
                  {details.length > 0 && (
                    <dl className="mt-3 space-y-2 border-t border-border/50 pt-3">
                      {details.map((d) => (
                        <div key={d.label}>
                          <dt className="text-[11px] font-bold uppercase tracking-wider text-foreground/60">
                            {d.label}
                          </dt>
                          <dd className="text-[12px] text-muted-foreground mt-0.5">
                            {d.text}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        Tip: every desk saves your work as you go. Outputs stay blocked until
        you choose the manual publish path.
      </p>
    </div>
  );
}
