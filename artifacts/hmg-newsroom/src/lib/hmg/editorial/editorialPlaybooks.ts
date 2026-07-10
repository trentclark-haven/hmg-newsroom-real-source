/**
 * Vertical Editorial Playbooks — HMG-owned editorial guidance for each Haven silo.
 *
 * Each playbook encodes what "great" looks like for that vertical, source discipline
 * rules, headline style, angles to pursue, what to avoid, and when to trigger founder
 * review. Used by the Editorial Desk to show brand-aware intelligence panels.
 *
 * No external brand or person names. All language is HMG-owned.
 */

export type VerticalId =
  | "hiphophaven"
  | "raphaven"
  | "musichaven"
  | "sportshaven"
  | "fithaven"
  | "cannahaven"
  | "hmg";

export interface AngleGuidance {
  bestUseCase: string;
  requiredSourceLevel: "confirmed" | "reported" | "unconfirmed";
  headlineWarning: string;
  whatToAvoid: string;
  whatUnlocksPublish: string;
}

export type AngleType =
  | "breaking"
  | "article"
  | "profile"
  | "review"
  | "explainer"
  | "opinion"
  | "release"
  | "event-recap"
  | "ranking"
  | "interview"
  | "rumor-control";

export interface EditorialPlaybook {
  verticalId: VerticalId;
  verticalName: string;
  editorialMission: string;
  whatGreatLooksLike: string;
  urgencyRules: string;
  sourceDiscipline: string;
  headlineStyle: string;
  avoidTheseMistakes: string[];
  idealArticleAngles: string[];
  socialTone: string;
  webArtGuidance: string;
  webEditGuidance: string;
  wordpressChecklist: string[];
  founderReviewTriggers: string[];
}

export const ANGLE_GUIDANCE: Record<AngleType, AngleGuidance> = {
  breaking: {
    bestUseCase: "A confirmed event just happened and the story is still developing.",
    requiredSourceLevel: "confirmed",
    headlineWarning: "State what happened. Do not speculate on motive or outcome.",
    whatToAvoid: "Inflating unconfirmed details. Adding context you cannot source.",
    whatUnlocksPublish: "At least one confirmed source + a clear 'developing' tag if story is still moving.",
  },
  article: {
    bestUseCase: "A full treatment of a story with context, quotes, and analysis.",
    requiredSourceLevel: "confirmed",
    headlineWarning: "Promise what the body delivers. No clickbait gap.",
    whatToAvoid: "Padding. Vague sourcing. Leaving the reader without a takeaway.",
    whatUnlocksPublish: "Two or more verified facts, at least one source link, and a clear angle.",
  },
  profile: {
    bestUseCase: "A deep look at a person — their work, impact, and what drives them.",
    requiredSourceLevel: "confirmed",
    headlineWarning: "Name the person. Do not reduce them to a single label.",
    whatToAvoid: "Hagiography. Unverified personal claims. Reducing a career to one moment.",
    whatUnlocksPublish: "Direct quotes from or about the subject, plus verified biographical facts.",
  },
  review: {
    bestUseCase: "A structured assessment of a release, product, or performance.",
    requiredSourceLevel: "confirmed",
    headlineWarning: "State the verdict direction. Do not bury it in the body.",
    whatToAvoid: "Vague praise. No-clear-stance reviews. Comparisons without evidence.",
    whatUnlocksPublish: "A clear verdict, specific evidence, and fair context.",
  },
  explainer: {
    bestUseCase: "A complex topic that readers need broken down clearly.",
    requiredSourceLevel: "confirmed",
    headlineWarning: "Name the topic. Do not overpromise depth you cannot deliver.",
    whatToAvoid: "Jargon without definition. Assuming prior knowledge. Condescension.",
    whatUnlocksPublish: "Every claim sourced, every term defined, and a reader who can follow.",
  },
  opinion: {
    bestUseCase: "A strong, evidence-backed stance on a cultural or industry question.",
    requiredSourceLevel: "reported",
    headlineWarning: "Make the stance clear in the headline. No hedging.",
    whatToAvoid: "Opinion without evidence. Personal attacks. Unstated conflicts of interest.",
    whatUnlocksPublish: "A clear thesis, supporting evidence, and a fair treatment of the other side.",
  },
  release: {
    bestUseCase: "Coverage of a new album, single, product, or announcement.",
    requiredSourceLevel: "confirmed",
    headlineWarning: "Name the release and the artist/creator. Do not inflate significance.",
    whatToAvoid: "Press-release copy. Unverified chart or sales claims. Missing context.",
    whatUnlocksPublish: "Verified release details, at least one source link, and cultural context.",
  },
  "event-recap": {
    bestUseCase: "A wrap-up of a live event, show, game, or cultural moment.",
    requiredSourceLevel: "confirmed",
    headlineWarning: "State what happened. Do not editorialize in the headline.",
    whatToAvoid: "Chronological dumps without narrative. Missing the 'what it means' beat.",
    whatUnlocksPublish: "Verified results, at least one quote or key moment, and a takeaway.",
  },
  ranking: {
    bestUseCase: "A ranked list with clear criteria and reasoning for each entry.",
    requiredSourceLevel: "confirmed",
    headlineWarning: "State the ranking scope. Do not promise objectivity you cannot defend.",
    whatToAvoid: "Rankings without reasoning. Entries that do not earn their spot. Clickbait order.",
    whatUnlocksPublish: "Every entry has a stated reason, and the ranking criteria are transparent.",
  },
  interview: {
    bestUseCase: "A conversation with a subject, captured with their voice front and center.",
    requiredSourceLevel: "confirmed",
    headlineWarning: "Name the subject and the most interesting reveal.",
    whatToAvoid: "Q&A dumps without context. Missing the best quote. Over-editing the voice.",
    whatUnlocksPublish: "Verified quotes, clear attribution, and context around each answer.",
  },
  "rumor-control": {
    bestUseCase: "An unconfirmed claim is circulating and the desk needs to address it carefully.",
    requiredSourceLevel: "unconfirmed",
    headlineWarning: "State what is unconfirmed. Do not present the rumor as fact.",
    whatToAvoid: "Amplifying the rumor without adding verification. Gossip framing. Naming unverified sources.",
    whatUnlocksPublish: "Clear 'unconfirmed' labeling, safer wording, and a founder review sign-off.",
  },
};

export const SOURCE_DISCIPLINE_MICROCOPY: Record<string, string> = {
  confirmed: "Confirmed by a named source. Can be stated as fact.",
  "needs-verification": "Needs verification. Flag this in the draft so it does not slip through.",
  "safer-wording": "Use safer wording. Rephrase to avoid legal or credibility risk.",
  "rights-credit": "Rights / credit note. Photo credit, quote permission, or copyright attribution.",
  "do-not-publish": "Do not publish until verified. This claim is not ready for the draft.",
  "founder-review": "Founder review recommended. This claim or angle needs a human sign-off.",
};

export const EDITORIAL_PLAYBOOKS: Record<VerticalId, EditorialPlaybook> = {
  hiphophaven: {
    verticalId: "hiphophaven",
    verticalName: "HipHop Haven",
    editorialMission:
      "Cover hip-hop as culture, art form, and business — with the depth the genre deserves.",
    whatGreatLooksLike:
      "Cultural context that earns its place, references that show real listening, and credibility that holds up to scrutiny from people who know the history.",
    urgencyRules:
      "Breaking: move fast but confirm first. Release coverage: same-day if possible. Cultural analysis: take the time to get it right.",
    sourceDiscipline:
      "Two-source minimum for claims about artists. No unnamed insiders. Verify chart and sales numbers before stating them.",
    headlineStyle:
      "Direct, culturally fluent, no forced slang. The headline should sound like someone who actually listens wrote it.",
    avoidTheseMistakes: [
      "Surface-level takes that show no real listening",
      "Recycled narratives from other outlets",
      "Performative slang that does not match the writer's voice",
      "Gossip framing dressed up as cultural reporting",
    ],
    idealArticleAngles: [
      "How this moment fits the longer arc of the artist's work",
      "The business story behind the music",
      "What the reception reveals about where the culture is right now",
      "A ranking or debate with clear criteria and real reasoning",
    ],
    socialTone:
      "Sharp, culturally fluent, confident. Never try too hard. The post should sound like a friend who knows the music.",
    webArtGuidance:
      "Bold, culture-forward visuals. Album art or artist imagery with clean typography. No generic stock photos.",
    webEditGuidance:
      "Short-form video for social. Pull the best quote or moment. Keep cuts tight and energy high.",
    wordpressChecklist: [
      "Category set to the correct Haven vertical",
      "Tags include artist name, release, and topic",
      "Featured image is set and credited",
      "Excerpt is one clean sentence",
      "Social posts are generated and reviewed",
    ],
    founderReviewTriggers: [
      "Any claim about an artist that is not source-confirmed",
      "Any ranking or list that could draw public pushback",
      "Any legal-adjacent claim (contracts, disputes, criminal matters)",
      "Any breaking story that is still developing",
    ],
  },
  raphaven: {
    verticalId: "raphaven",
    verticalName: "Rap Haven",
    editorialMission:
      "Sharp rap coverage with rankings, debates, and release urgency — the competitive edge of the culture.",
    whatGreatLooksLike:
      "Clean arguments, real listening evidence, and the confidence to rank without fear. The reader should feel the writer actually studied the material.",
    urgencyRules:
      "Release drops: same-day. Rankings: publish within 48 hours of the event. Debates: strike while the conversation is hot.",
    sourceDiscipline:
      "Verify sales and streaming numbers against a named source. No mock beef or invented diss claims. Confirm release details before publishing.",
    headlineStyle:
      "Competitive, direct, confident. Name the artist and the stakes. No fence-sitting.",
    avoidTheseMistakes: [
      "Vague praise without specific evidence",
      "Listless recaps that read like press releases",
      "Fence-sitting on debates that demand a stance",
      "Unverified sales or chart claims",
    ],
    idealArticleAngles: [
      "Where this release sits in the competitive landscape",
      "A ranked assessment with clear criteria",
      "The debate angle — two sides, evidence on both",
      "The rollout strategy story",
    ],
    socialTone:
      "Competitive, punchy, debate-ready. The post should start a conversation, not just announce.",
    webArtGuidance:
      "High-contrast, bold typography. Artist imagery with competitive framing. Rankings get numbered visuals.",
    webEditGuidance:
      "Reaction clips, ranking reveals, debate moments. Keep energy at peak from first frame.",
    wordpressChecklist: [
      "Category set to Rap Haven",
      "Tags include artist, release, and ranking topic if applicable",
      "Featured image set and credited",
      "Excerpt states the verdict or key takeaway",
      "Social posts match the competitive tone",
    ],
    founderReviewTriggers: [
      "Any ranking that places an artist above a more established peer",
      "Any claim about a feud or dispute that is not confirmed",
      "Any sales or streaming number without a named source",
      "Any opinion piece that takes a controversial stance",
    ],
  },
  musichaven: {
    verticalId: "musichaven",
    verticalName: "Music Haven",
    editorialMission:
      "Broad music-programming instincts with rollout intelligence — finding the story before the crowd does.",
    whatGreatLooksLike:
      "Spotting the rollout story, feeling the visual-era energy, and finding artists before the crowd. The reader should discover something new.",
    urgencyRules:
      "New artist discovery: move fast. Rollout analysis: within the week. Festival or tour coverage: same-week.",
    sourceDiscipline:
      "Verify tour dates and festival lineups against official sources. Do not assign chart placements without confirmation.",
    headlineStyle:
      "Curatorial, forward-looking. Name the artist and why they matter right now.",
    avoidTheseMistakes: [
      "Genre tunnel vision — missing the cross-genre story",
      "Missing the visual rollout component",
      "Late discovery — writing about an artist everyone already knows",
      "Hyperbole without evidence",
    ],
    idealArticleAngles: [
      "The rollout story — how the artist is releasing this one",
      "An artist you should know about before they break",
      "The cross-genre moment that connects the dots",
      "A review with cultural context, not just a verdict",
    ],
    socialTone:
      "Curatorial, enthusiastic, discovery-focused. The post should make someone want to listen right now.",
    webArtGuidance:
      "Artist-forward imagery, clean aesthetic. Visual rollout components highlighted. No generic concert stock.",
    webEditGuidance:
      "Discovery clips, rollout breakdowns, first-listen reactions. Keep it fresh and fast.",
    wordpressChecklist: [
      "Category set to Music Haven",
      "Tags include artist, genre, and release or tour",
      "Featured image set and credited",
      "Excerpt names the artist and the angle",
      "Social posts are generated and reviewed",
    ],
    founderReviewTriggers: [
      "Any claim about an artist 'breaking out' without evidence",
      "Any chart placement claim without a named source",
      "Any tour or festival date that is not officially confirmed",
      "Any opinion that could alienate a genre community",
    ],
  },
  sportshaven: {
    verticalId: "sportshaven",
    verticalName: "Sports Haven",
    editorialMission:
      "Sports urgency with clean storytelling and what-matters-now clarity — the highlight leads, the context follows.",
    whatGreatLooksLike:
      "The highlight leads, the context follows, and the reader knows what matters right now. The story should feel like it was written by someone who watched the game.",
    urgencyRules:
      "Game results: same-hour. Trade or signing: within 2 hours. Analysis: same-day. Rankings: within 24 hours.",
    sourceDiscipline:
      "Do not report injuries unless source-confirmed. No trade speculation as fact. Verify stats against official box scores.",
    headlineStyle:
      "Result-first, stakes-forward. Name the teams and the outcome. No burying the lede.",
    avoidTheseMistakes: [
      "Stale angles that rehash what everyone already said",
      "Buried ledes — the result must lead",
      "Stat dumps without narrative context",
      "Trade or injury speculation presented as fact",
    ],
    idealArticleAngles: [
      "What the result means for the standings or playoff picture",
      "The individual performance story",
      "The strategic or coaching decision that decided it",
      "A ranking or power ranking with clear criteria",
    ],
    socialTone:
      "Urgent, highlight-driven, stakes-forward. The post should make someone feel like they missed something by not watching.",
    webArtGuidance:
      "Action-forward imagery. Score graphics for breaking results. No generic stadium stock.",
    webEditGuidance:
      "Highlight clips, reaction videos, breakdown segments. Keep pace fast and energy high.",
    wordpressChecklist: [
      "Category set to Sports Haven",
      "Tags include teams, players, and sport",
      "Featured image set and credited",
      "Excerpt states the result and the stakes",
      "Social posts are generated and reviewed",
    ],
    founderReviewTriggers: [
      "Any injury report that is not source-confirmed",
      "Any trade or signing claim without official confirmation",
      "Any stat that does not match the official box score",
      "Any opinion that could draw organized fanbase pushback",
    ],
  },
  fithaven: {
    verticalId: "fithaven",
    verticalName: "Fit Haven",
    editorialMission:
      "Motivational fitness energy with wellness clarity and training sense — real advice, not shame.",
    whatGreatLooksLike:
      "Training that is safe and real, nutrition that is grounded, and motivation that does not condescend. The reader should feel capable, not inadequate.",
    urgencyRules:
      "Trending fitness topic: same-week. Training protocol: take time to verify safety. Wellness news: within 48 hours.",
    sourceDiscipline:
      "No unverified fitness or health claims. Tag protocols as personal training advice, not medical advice. Cite studies where possible.",
    headlineStyle:
      "Motivational but honest. State the benefit and the work required. No 'quick fix' framing.",
    avoidTheseMistakes: [
      "Unverified fitness claims — no 'cures' or 'guaranteed' results",
      "Shame-based motivation that makes the reader feel inadequate",
      "Vague advice without specific protocol or reasoning",
      "Medical advice framing for training content",
    ],
    idealArticleAngles: [
      "A training protocol with specific sets, reps, and reasoning",
      "A nutrition breakdown with evidence, not trends",
      "A motivational piece that respects the reader's intelligence",
      "A wellness trend explained with clarity and caution",
    ],
    socialTone:
      "Motivational, practical, encouraging. The post should make someone want to train, not feel guilty.",
    webArtGuidance:
      "Clean, energetic visuals. Real training imagery, not stock gym photos. Form demonstrations over posed shots.",
    webEditGuidance:
      "Form breakdowns, protocol walkthroughs, quick tips. Keep it practical and actionable.",
    wordpressChecklist: [
      "Category set to Fit Haven",
      "Tags include training type, muscle group, or wellness topic",
      "Featured image set and credited",
      "Excerpt states the benefit and the protocol",
      "Medical disclaimer included if applicable",
    ],
    founderReviewTriggers: [
      "Any health or medical claim without a source",
      "Any training protocol that could be unsafe for beginners",
      "Any nutrition advice that contradicts established guidelines",
      "Any 'miracle results' framing",
    ],
  },
  cannahaven: {
    verticalId: "cannahaven",
    verticalName: "Canna Haven",
    editorialMission:
      "Cannabis culture literacy with strain, legal, and safety discipline — adult, compliant, credible.",
    whatGreatLooksLike:
      "Accurate strain info, legal context, safety-first language, and sources that hold up. The reader should trust the information enough to act on it.",
    urgencyRules:
      "Legal or regulatory news: same-day. Strain or product coverage: within 48 hours. Culture pieces: take the time to get it right.",
    sourceDiscipline:
      "No unsupported medical or therapeutic claims. Confirm state-level legality before asserting anything about product distribution. Credit all sources.",
    headlineStyle:
      "Adult, informed, compliant. State the topic without hype. No stoner cliches.",
    avoidTheseMistakes: [
      "Unverified health or therapeutic claims",
      "Legal vagueness about state or federal status",
      "Uncredited sources or unverified strain information",
      "Hype framing that undermines credibility",
    ],
    idealArticleAngles: [
      "A regulatory or legal development with clear context",
      "A strain or product review with verified information",
      "A culture piece that treats the community with respect",
      "A business or industry story with real numbers",
    ],
    socialTone:
      "Adult, informed, culture-aware. The post should be shareable without being reckless.",
    webArtGuidance:
      "Clean, compliant visuals. Product imagery with proper attribution. No illegal or suggestive imagery.",
    webEditGuidance:
      "Product reviews, culture moments, regulatory breakdowns. Keep it credible and compliant.",
    wordpressChecklist: [
      "Category set to Canna Haven",
      "Tags include strain, topic, and legal context",
      "Featured image set and credited",
      "Excerpt is factual and compliant",
      "Compliance disclaimer included if applicable",
    ],
    founderReviewTriggers: [
      "Any medical or therapeutic claim without a source",
      "Any legal claim that is not verified for the relevant jurisdiction",
      "Any product recommendation without disclosure",
      "Any content that could create regulatory exposure",
    ],
  },
  hmg: {
    verticalId: "hmg",
    verticalName: "HMG",
    editorialMission:
      "Fast entertainment-news instincts with source discipline and legal caution — fast but accurate, sourced but not gossip.",
    whatGreatLooksLike:
      "Fast but accurate, sourced but not gossip, clear about what is confirmed and what is not. The reader should trust the story enough to share it without embarrassment.",
    urgencyRules:
      "Breaking: move fast but confirm first. Trending: within 2 hours. Analysis: same-day.",
    sourceDiscipline:
      "No unverified rumors presented as fact. No unnamed insiders without context. Legal-adjacent claims need founder review.",
    headlineStyle:
      "Direct, factual, attention-grabbing without overstating. State what is known and what is developing.",
    avoidTheseMistakes: [
      "Unverified rumors presented as fact",
      "Gossip slop that undermines credibility",
      "Reckless legal exposure from unconfirmed claims",
      "Missing the 'what is confirmed vs. what is not' distinction",
    ],
    idealArticleAngles: [
      "A confirmed development with clear context",
      "A trend story with evidence, not just vibes",
      "A careful rumor-control piece with safer wording",
      "An analysis of what a development means for the industry",
    ],
    socialTone:
      "Fast, clear, shareable. The post should be accurate enough to stand on its own.",
    webArtGuidance:
      "Clean, news-forward visuals. Proper imagery with credit. No paparazzi-style shots.",
    webEditGuidance:
      "Breaking-news clips, trend breakdowns, quick analysis. Keep pace fast and accuracy high.",
    wordpressChecklist: [
      "Category set to HMG",
      "Tags include topic, subjects, and development type",
      "Featured image set and credited",
      "Excerpt states what is confirmed and what is developing",
      "Social posts match the factual tone",
    ],
    founderReviewTriggers: [
      "Any claim that is not source-confirmed",
      "Any legal-adjacent claim (contracts, disputes, criminal matters)",
      "Any rumor-control piece that could amplify the rumor",
      "Any breaking story that is still developing",
    ],
  },
};

export function getPlaybook(verticalId: string): EditorialPlaybook {
  const id = (verticalId?.toLowerCase() ?? "hmg") as VerticalId;
  return EDITORIAL_PLAYBOOKS[id] ?? EDITORIAL_PLAYBOOKS.hmg;
}

export function getAngleGuidance(angle: AngleType): AngleGuidance {
  return ANGLE_GUIDANCE[angle] ?? ANGLE_GUIDANCE.article;
}

export function getSourceMicrocopy(key: string): string {
  return SOURCE_DISCIPLINE_MICROCOPY[key] ?? "";
}
