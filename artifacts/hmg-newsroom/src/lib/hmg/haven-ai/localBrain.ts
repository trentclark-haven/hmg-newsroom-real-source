import type { HmgBrandKnowledge } from "@/lib/hmg/haven-ai/hmgKnowledgeBase";
import type { HavenMissionDefinition } from "@/lib/hmg/haven-ai/maximillionPersonality";
import type { HavenContext } from "@/lib/hmg/haven-ai/contextBuilder";
import type {
  HavenAISection,
  HavenConfidenceLabel,
  HavenCopyPacket,
  HavenMissionMode,
} from "@/lib/hmg/haven-ai/types";

/**
 * Local Brain — the Haven AI Engine's deterministic intelligence lane.
 *
 * This is intentionally NOT a generic template dump. Each mission applies a real
 * business framework (sponsorship tiers, sales motion, follow-up cadence,
 * objection handling, founder briefing, LA market read, internal ops) shaped by
 * the active brand voice. It produces copy-ready drafts the founder can send.
 */
export interface LocalBrainArgs {
  message: string;
  mission: HavenMissionMode;
  missionDef: HavenMissionDefinition;
  brand: HmgBrandKnowledge;
  context: HavenContext;
}

export interface LocalBrainOutput {
  message: string;
  sections: HavenAISection[];
  nextActions: string[];
  copyPackets: HavenCopyPacket[];
  followUps: string[];
  confidence: HavenConfidenceLabel;
}

function sec(id: string, title: string, body: string): HavenAISection {
  return { id, title, body };
}

function pkt(id: string, label: string, content: string): HavenCopyPacket {
  return { id, label, content };
}

function extractSubject(message: string): string {
  const cleaned = message
    .replace(/^\s*(hey|yo|ok|okay|max(imillion)?|please)\b[,:\s]*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "this opportunity";
  const firstClause = cleaned.split(/[.!?\n]/)[0].trim();
  return firstClause.length > 90 ? `${firstClause.slice(0, 87)}...` : firstClause;
}

function resolveMission(
  message: string,
  mission: HavenMissionMode,
): Exclude<HavenMissionMode, "auto"> {
  if (mission !== "auto") return mission;
  const m = message.toLowerCase();
  if (/(sponsor|advertiser|brand deal|package|ad read)/.test(m)) return "sponsorship";
  if (/(objection|too expensive|no budget|not interested|pushback|hesit)/.test(m))
    return "objection_handling";
  if (/(follow ?up|nudge|check in|ghosted|no response|haven'?t heard)/.test(m))
    return "follow_up";
  if (/(partner|collab|alliance|joint)/.test(m)) return "partnership";
  if (/(brief|status|where do we stand|priorities|overview|recap of)/.test(m))
    return "founder_briefing";
  if (/(\bla\b|los angeles|culver|hollywood|local|near )/.test(m)) return "la_market";
  if (/(team|workflow|process|\bops\b|internal|assign|organize|handoff)/.test(m))
    return "internal_ops";
  if (/(sell|sales|close|pipeline|deal|pitch|revenue|email|call)/.test(m)) return "sales";
  return "sales";
}

export function runLocalBrain(args: LocalBrainArgs): LocalBrainOutput {
  const { message, brand } = args;
  const resolved = resolveMission(message, args.mission);
  const subject = extractSubject(message);

  switch (resolved) {
    case "sponsorship":
      return sponsorship(subject, brand);
    case "sales":
      return sales(subject, brand);
    case "partnership":
      return partnership(subject, brand);
    case "follow_up":
      return followUp(subject, brand);
    case "objection_handling":
      return objections(subject, brand);
    case "founder_briefing":
      return founderBriefing(subject, brand, args.context);
    case "la_market":
      return laMarket(subject, brand);
    case "internal_ops":
      return internalOps(subject, brand);
    default:
      return sales(subject, brand);
  }
}

function sponsorship(subject: string, brand: HmgBrandKnowledge): LocalBrainOutput {
  const tiers = [
    `Starter ($1.5k-$3k): 1 sponsored ${brand.categories[0].toLowerCase()} feature + 2 social pushes + a results recap.`,
    `Growth ($4k–$8k/mo): weekly integration across ${brand.name}, a branded series slot, newsletter placement, and monthly reporting.`,
    `Flagship ($10k+/mo): category exclusivity, event/IRL tie-in, co-branded content, and a quarterly performance review.`,
  ].join("\n");

  const email = [
    `Subject: ${brand.name} x [Sponsor] — a clean partnership around ${subject}`,
    "",
    `Hi [Name],`,
    "",
    `I run partnerships for ${brand.name} (${brand.audience.toLowerCase()}). We're lining up ${subject}, and [Sponsor] is a natural fit for our audience.`,
    "",
    `Here's the simple version: one priced offer, clear deliverables, and a reporting note so you see exactly what you got. Tiers start at our Starter offer and scale to category exclusivity.`,
    "",
    `Worth a 15-minute call this week to size the right tier?`,
    "",
    `— [Your name], ${brand.name}`,
  ].join("\n");

  const objection =
    "Expect a measurement objection. Answer with deliverables, reporting cadence, usage rights, and a short 30-day pilot window so the buyer can prove ROI before committing long-term.";

  return {
    message: `Sponsorship play for ${brand.name} around "${subject}". I'd lead with one priced offer, three tiers, and a 30-day pilot to remove risk. Below is the angle, the tiers, a ready-to-send email, and the objection you should pre-empt.`,
    sections: [
      sec("angle", "Angle", `Position ${brand.name} as the credible, culture-first lane for ${subject}. Sell ownership of a moment, not impressions.`),
      sec("tiers", "Offer tiers", tiers),
      sec("email", "Outreach email", email),
      sec("objection", "Objection answer", objection),
    ],
    nextActions: [
      "Pick the single best-fit sponsor and personalize [Sponsor]/[Name].",
      "Set the Starter tier price for this specific deal.",
      "Send the email and book the 15-minute call.",
    ],
    copyPackets: [
      pkt("copy-email", "Copy outreach email", email),
      pkt("copy-tiers", "Copy offer tiers", tiers),
      pkt("copy-objection", "Copy objection answer", objection),
    ],
    followUps: [
      "Want me to tailor this to a specific company?",
      "Should I draft the 30-day pilot scope?",
    ],
    confidence: "high",
  };
}

function sales(subject: string, brand: HmgBrandKnowledge): LocalBrainOutput {
  const email = [
    `Subject: Quick idea for [Company] x ${brand.name}`,
    "",
    `Hi [Name],`,
    "",
    `I'll keep this short. ${brand.name} reaches ${brand.audience.toLowerCase()} and I think there's a clean win for [Company] around ${subject}.`,
    "",
    `If it's useful, I can send a one-page plan with deliverables and a price. No long pitch — just the move and the number.`,
    "",
    `Open to a quick look?`,
    "",
    `— [Your name]`,
  ].join("\n");

  const callOpener =
    `"Hey [Name], thanks for the few minutes. I run ${brand.name} — we cover ${brand.categories[0].toLowerCase()} for ${brand.audience.toLowerCase()}. I reached out because of ${subject}. Before I pitch anything, what's the outcome that would actually matter to you this quarter?"`;

  const discovery = [
    "1. What's the outcome that matters this quarter?",
    "2. Who else touches this decision?",
    "3. What's the budget reality — range, not exact?",
    "4. What would make this an easy yes?",
  ].join("\n");

  return {
    message: `Sales motion for ${brand.name} on "${subject}". Lead with a short value email, qualify on the call before pitching, and drive to one priced one-pager. Everything below is copy-ready.`,
    sections: [
      sec("discovery", "Discovery framing", discovery),
      sec("email", "Sales email", email),
      sec("call", "Call opener", callOpener),
      sec("close", "Close path", "Discovery call -> one-page priced plan within 24h -> 30-day pilot -> monthly retainer. Keep one CTA per touch."),
    ],
    nextActions: [
      "Personalize [Company]/[Name] and send the email today.",
      "Run the four discovery questions on the call.",
      "Send the one-page priced plan within 24 hours.",
    ],
    copyPackets: [
      pkt("copy-email", "Copy sales email", email),
      pkt("copy-call", "Copy call opener", callOpener),
      pkt("copy-discovery", "Copy discovery questions", discovery),
    ],
    followUps: [
      "Want a one-page priced plan template for this?",
      "Should I write the follow-up sequence for after the call?",
    ],
    confidence: "high",
  };
}

function partnership(subject: string, brand: HmgBrandKnowledge): LocalBrainOutput {
  const dm = [
    `Hey [Name] — quick one. I run ${brand.name}. I've been watching ${subject} and there's an obvious overlap with what you're building.`,
    "",
    `Not pitching a sponsorship — thinking partnership: we bring audience and culture credibility, you bring [their strength], and we both win. Worth a 15-min call to see if it's real?`,
  ].join("\n");

  const structure = [
    "What we bring: audience, content engine, culture credibility, distribution.",
    "What they bring: [product, reach, capital, access, or expertise].",
    "Shared upside: co-branded content, cross-promo, revenue share on a joint offer.",
    "Guardrails: clear scope, a trial window, and one owner on each side.",
  ].join("\n");

  return {
    message: `Partnership read on "${subject}" for ${brand.name}. Frame it as mutual value, not a favor. Below is the value exchange, a clean structure, and a warm DM.`,
    sections: [
      sec("value", "Value exchange", structure),
      sec("structure", "Partnership structure", "Start with a small, time-boxed collaboration (one piece of co-branded content + cross-promo). Prove it, then formalize revenue share."),
      sec("dm", "Outreach DM", dm),
    ],
    nextActions: [
      "Fill in [their strength] with something specific and true.",
      "Send the DM and propose the 15-minute call.",
      "Define the first small collaboration to test fit.",
    ],
    copyPackets: [
      pkt("copy-dm", "Copy outreach DM", dm),
      pkt("copy-structure", "Copy partnership structure", structure),
    ],
    followUps: ["Want me to design the first co-branded content piece?"],
    confidence: "medium",
  };
}

function followUp(subject: string, brand: HmgBrandKnowledge): LocalBrainOutput {
  const t1 = `Touch 1 (day 2): "Hi [Name] — circling back on ${subject}. Did the plan land okay? Happy to adjust the scope or price."`;
  const t2 = `Touch 2 (day 5): Add value. "One more idea for [Company]: [specific angle for ${brand.name}]. Even if the timing's off, thought it was worth sending."`;
  const t3 = `Touch 3 (day 10): "Know inboxes get buried. Should I keep this warm for later, or is now not the right time?"`;
  const breakup = `Breakup (day 17): "I'll stop nudging — totally respect it. If ${subject} comes back around, I'm one reply away. Wishing [Company] a strong quarter."`;
  const all = [t1, t2, t3, breakup].join("\n\n");

  return {
    message: `Respectful 4-touch follow-up for "${subject}". Every touch adds value or makes saying no easy — that's what gets replies. Copy the full sequence below.`,
    sections: [
      sec("plan", "Sequence plan", "Four touches over ~17 days. Never just 'checking in' — each touch carries value or a clean exit."),
      sec("t1", "Touch 1", t1),
      sec("t2", "Touch 2", t2),
      sec("t3", "Touch 3", t3),
      sec("breakup", "Breakup note", breakup),
    ],
    nextActions: [
      "Drop the sequence into your outreach tool or calendar.",
      "Personalize the day-5 value angle.",
    ],
    copyPackets: [
      pkt("copy-seq", "Copy full sequence", all),
      pkt("copy-breakup", "Copy breakup note", breakup),
    ],
    followUps: ["Want these as ready-to-schedule calendar reminders?"],
    confidence: "high",
  };
}

function objections(subject: string, brand: HmgBrandKnowledge): LocalBrainOutput {
  const map = [
    `"Too expensive" -> "Totally fair. Let's start with the 30-day pilot at the Starter tier so you see results before scaling."`,
    `"We don't have budget" → "Understood. When does the next budget cycle open? I'll send a right-sized plan you can slot in."`,
    `"Not the right time" → "No problem. Want me to keep ${subject} warm and check back in [timeframe]?"`,
    `"We tried influencer stuff, it didn't work" → "${brand.name} isn't a one-off post — it's owned, reported content with usage rights. Different model, measurable."`,
    `"Send me info" → "Will do — one page, deliverables and price. Can I also grab 15 minutes so it's tailored, not generic?"`,
  ].join("\n");

  return {
    message: `Objection playbook for "${subject}" on ${brand.name}. Stay calm, agree first, then redirect to a low-risk next step. Copy the full map below.`,
    sections: [
      sec("objections", "Likely objections", "Price, budget timing, timing, prior bad experience, and the 'send info' brush-off."),
      sec("responses", "Responses", map),
      sec("reframe", "Reframe", "Always move from 'big commitment' to 'small, provable pilot.' Risk is the real objection — shrink it."),
    ],
    nextActions: [
      "Pick the objection you're actually hearing and lead with that response.",
      "Have the 30-day pilot scope ready to send.",
    ],
    copyPackets: [pkt("copy-objections", "Copy objection map", map)],
    followUps: ["Want me to script the pilot offer they can't easily refuse?"],
    confidence: "high",
  };
}

function founderBriefing(
  subject: string,
  brand: HmgBrandKnowledge,
  context: HavenContext,
): LocalBrainOutput {
  const pipelineLine = context.summary.includes("Visible pipeline")
    ? "Pipeline is visible in context — protect follow-up cadence on the top 3 by value."
    : "No priced pipeline is visible yet — the first win is creating qualified, priced opportunities.";

  return {
    message: `Founder briefing on "${subject}" through the ${brand.name} lens. Candid, not cheerleading: here's where you stand and the one move that matters most.`,
    sections: [
      sec("situation", "Situation", `${brand.name} is positioned for ${brand.audience.toLowerCase()}. ${pipelineLine}`),
      sec("wins", "Wins", `Brand voice and content lanes are clear. ${brand.monetization[0]} and ${brand.monetization[1]} are ready to price.`),
      sec("risks", "Risks", "Attention without a priced offer is the main leak. Don't let warm interest go un-priced."),
      sec("opps", "Opportunities", `Strongest near-term lane: ${brand.monetization[0]}. Fastest cash: turn one current story into a sponsored offer.`),
      sec("move", "Highest-leverage move", `Price one ${brand.name} offer this week and put it in front of one real buyer. One offer, one buyer, one CTA.`),
    ],
    nextActions: [
      `Price one ${brand.name} offer today.`,
      "Identify the single best buyer for it.",
      "Send the offer before end of week.",
    ],
    copyPackets: [
      pkt("copy-brief", "Copy founder brief", `${brand.name} briefing on ${subject}. Move: price one offer and put it in front of one buyer this week.`),
    ],
    followUps: ["Want me to draft that priced offer now?"],
    confidence: "medium",
  };
}

function laMarket(subject: string, brand: HmgBrandKnowledge): LocalBrainOutput {
  const targets = [
    "Culver City / Westside: local brands, studios, and gyms that want culture-credible reach.",
    "Hollywood / mid-city: labels, venues, and event promoters for content + IRL tie-ins.",
    "Downtown LA: cannabis and lifestyle operators (compliant), plus sports-bar offers on game days.",
  ].join("\n");

  return {
    message: `LA market read for ${brand.name} on "${subject}". LA rewards in-person credibility — pair a local content drop with an IRL touch. Targets and a local play below.`,
    sections: [
      sec("read", "Market read", "LA is relationship- and presence-driven. A local sponsor pilot plus one IRL moment converts far better than cold outreach alone."),
      sec("targets", "Local targets", targets),
      sec("play", "Local play", `Offer a 30-day LA pilot: one ${brand.categories[0].toLowerCase()} feature, one social recap, and one IRL/event mention. Price it as a local Starter tier.`),
    ],
    nextActions: [
      "Pick one neighborhood and list three real local targets.",
      "Offer the 30-day LA pilot to the best fit.",
    ],
    copyPackets: [pkt("copy-targets", "Copy LA targets", targets)],
    followUps: ["Want me to draft outreach for a specific LA neighborhood?"],
    confidence: "medium",
  };
}

function internalOps(subject: string, brand: HmgBrandKnowledge): LocalBrainOutput {
  const workflow = [
    "1. Intake the idea in the Founder Inbox / Story Queue.",
    "2. Pick the brand and confirm voice + compliance.",
    "3. Create the source notes, then the editorial draft or social output.",
    "4. Route to WebArt (image) / WebEdit (clips) as needed.",
    "5. Run Product Truth QA, then send to WordPress Builder.",
    "6. Log the handoff and the next action.",
  ].join("\n");

  return {
    message: `Internal ops read on "${subject}" for ${brand.name}. Keep work moving through one clean lane with a named owner at each step. Workflow below.`,
    sections: [
      sec("read", "Read", "The risk in ops is work that stalls between modules. Every item needs an owner and a next action."),
      sec("workflow", "Workflow", workflow),
      sec("handoffs", "Handoffs", "Editorial Desk -> WordPress draft. Story -> WebArt/WebEdit for assets. Always carry the brand and compliance note with the handoff."),
    ],
    nextActions: [
      "Assign one owner to this item.",
      "Set its next action and status.",
      "Move it to the next module in the lane.",
    ],
    copyPackets: [pkt("copy-workflow", "Copy workflow", workflow)],
    followUps: ["Want a checklist tailored to this specific item?"],
    confidence: "medium",
  };
}
