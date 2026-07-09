import { LOGOS } from "./logos";

export interface Vertical {
  id: string;
  name: string;
  color: string;
  accentBg: string;
  onAccent: string;
  icon: string;
  logo?: string;
  tagline: string;
  placeholder: string;
  responses: string[];
}

export const verticals: Vertical[] = [
  {
    id: "hiphophaven",
    name: "HipHopHaven",
    color: "#1FA6D9",
    accentBg: "#1FA6D9",
    onAccent: "#ffffff",
    icon: "Mic",
    logo: LOGOS.hiphophaven,
    tagline: "Hip-Hop, all day",
    placeholder: "What's the story? Drop the artist, project, or moment...",
    responses: [
      "The new project is a statement record, plain and simple. From the opening 808 swell to the closing piano outro, every transition is engineered to feel inevitable. There's a maturity in the cadence, a confidence in the silences, and a willingness to let the beat breathe that you rarely get from a debut anymore. HipHopHaven cosign: this one earns its run.",
      "Three rollouts in and the strategy is finally crystal clear: control the narrative, control the release window, and never let a feature outshine the headliner. The numbers are quietly historic, but the cultural footprint is what's going to matter when we look back. The blueprint is being rewritten in real time.",
      "Don't sleep on the production credits. The same low-key collective that's been quietly placing beats for the last eighteen months just stamped their first full executive run, and it shows. The drum patterns alone are doing more storytelling than half the bars on the project. Watch this room — they're about to take over."
    ]
  },
  {
    id: "raphaven",
    name: "RapHaven",
    color: "#E32219",
    accentBg: "#E32219",
    onAccent: "#ffffff",
    icon: "Flame",
    logo: LOGOS.raphaven,
    tagline: "Rap with no filter",
    placeholder: "Pop off. What's the take? Who's getting smoked?...",
    responses: [
      "Let's keep it a stack: the verse was cold, but the response was colder. Whoever told the opp it was safe to step in the booth owes them an apology and a refund. The diss didn't just land — it ended the conversation. RapHaven is calling it: turn the lights off, the round is over.",
      "The streaming numbers don't lie, but neither does the sound system at the function. If your record can't survive a real speaker, it doesn't matter how many playlists added it on day one. We're entering a new era where club records are being judged by clubs again, and that filter is going to expose a lot of people.",
      "Stop pretending the new wave isn't moving the culture. The drill scene is doing more for regional identity in 18 months than the mainstream did in five years. The flows are sharper, the visuals are uncompromising, and the loyalty is real. Respect it or get left behind."
    ]
  },
  {
    id: "musichaven",
    name: "MusicHaven",
    color: "#D4A23A",
    accentBg: "#D4A23A",
    onAccent: "#1a1410",
    icon: "Music",
    logo: LOGOS.musichaven,
    tagline: "Music, beautifully written",
    placeholder: "Review an album, single, or live show...",
    responses: [
      "The record exists in a quiet dialogue between memory and reinvention. Every arrangement feels like it's been turned over a dozen times before being committed to tape — never overwrought, never underdressed. There's a rare kind of patience in the sequencing, the kind you can only earn from a decade of trusting your own ear over the algorithm's.",
      "Stripped of the maximalist production that defined the previous era, this latest effort lets the songwriting stand on its own. Acoustic guitars, breath-close vocals, and a rhythm section that knows exactly when to disappear. It's the sound of an artist deciding what they actually want to say once the noise stops.",
      "Drenched in shimmering reverb and anchored by a relentless, hypnotic groove, the EP plays like a transmission from a parallel city — one where the late-80s never ended and synth-pop quietly grew up. It doesn't just borrow from its influences; it builds something new in the negative space between them."
    ]
  },
  {
    id: "sportshaven",
    name: "SportsHaven",
    color: "#F26A21",
    accentBg: "#F26A21",
    onAccent: "#ffffff",
    icon: "Trophy",
    logo: LOGOS.sportshaven,
    tagline: "Sports, no fluff",
    placeholder: "Break it down. Game, trade, hot take, anything...",
    responses: [
      "If you're still defending that fourth-quarter playcalling, you're watching a different game. The refusal to establish the run when the defense was clearly dropping eight into coverage isn't stubbornness — it's coaching malpractice. They didn't get outplayed; they got outsmarted, and the locker room knows it.",
      "Everyone's hyping the franchise quarterback, but the real story is in the trenches. The offensive line couldn't generate a single yard of push on third-and-short, and that one stat alone tells you everything about how this season is going to end. You can have all the skill players in the league — if you can't win the point of attack, you're going home in January.",
      "That wasn't a win, that was a statement. They came out throwing on first down, attacked the secondary's weakest corner from the opening drive, and never let the defense catch its breath. The whole conference just got put on notice — and you can tell from the postgame podium that they know it too."
    ]
  },
  {
    id: "fithaven",
    name: "FitHaven",
    color: "#2EC5FF",
    accentBg: "linear-gradient(135deg, #2EC5FF 0%, #FF4FD8 100%)",
    onAccent: "#ffffff",
    icon: "Dumbbell",
    logo: LOGOS.fithaven,
    tagline: "Fitness, biohacked",
    placeholder: "Drop a protocol, training block, or recovery hack...",
    responses: [
      "The real unlock isn't another expensive supplement stack — it's mastering your circadian rhythm. Anchor the morning with ten minutes of direct sunlight before any screen time, hold a strict 10-hour feeding window, and protect the last 90 minutes before bed like it's training. Do that for 30 days and your HRV, sleep score, and recovery markers will tell you everything you need to know.",
      "Zone 2 is still the king of building mitochondrial density, but the smarter play right now is sandwiching it with two short sprint intervals a week. You stress the aerobic floor and the VO2 ceiling at the same time without accumulating junk fatigue. The recovery cost is minimal, the adaptive payoff is enormous.",
      "We're past the era of fragmented biohacks. The serious operators are running a systems-biology stack: continuous glucose, daily HRV, weekly bloodwork trends, and zero alcohol. Boring? Sure. But every elite performer over 35 is quietly running some version of this protocol because it works."
    ]
  },
  {
    id: "cannahaven",
    name: "CannaHaven",
    color: "#1F6B3A",
    accentBg: "#1F6B3A",
    onAccent: "#ffffff",
    icon: "Leaf",
    logo: LOGOS.cannahaven,
    tagline: "Cannabis, elevated",
    placeholder: "Strain notes, culture take, or industry insight...",
    responses: [
      "This latest harvest is a terpene powerhouse — sharp citrus on the nose, a heavy diesel funk underneath, and a finish that lingers like an old-school sativa should. The high leans cerebral first, sparking creative focus before easing into a warm body buzz that doesn't pin you to the couch. Easily one of the cleanest cultivars in the market this quarter.",
      "As the boutique market floods with another wave of generic dessert hybrids, finding a true skunky heirloom cut feels like striking gold. This batch delivers that classic, unmistakable pungency — the kind of full-spectrum experience the modern hyper-THC chase has all but erased. Old heads will know.",
      "The extraction on this rosin is immaculate. Smooth on the exhale, distinct notes of pine and sweet earth, and the kind of clean potency that respects the plant. Perfect for a late-afternoon session when you want to take the edge off without fully derailing the workday."
    ]
  },
  {
    id: "hmg",
    name: "HMG",
    color: "#D4A23A",
    accentBg: "linear-gradient(135deg, #0A0A0A 0%, #D4A23A 100%)",
    onAccent: "#ffffff",
    icon: "Newspaper",
    logo: LOGOS.hmg,
    tagline: "The Haven Media Group desk",
    placeholder: "Cross-vertical story, press release, or HMG-wide announcement...",
    responses: [
      "Haven Media Group today announced a major editorial expansion, adding three new senior contributors across its music and sports verticals. The move signals the company's continued investment in long-form, vertical-native journalism at a moment when most digital publishers are pulling back. Rollout begins next quarter across all HMG properties.",
      "Behind the scenes, the editorial team has been quietly rebuilding the content engine from the ground up. Faster publishing pipelines, sharper editorial standards, and a new cross-vertical desk that lets a single story move seamlessly between HipHopHaven, RapHaven, MusicHaven, SportsHaven, FitHaven, and CannaHaven. The reader gets one voice — Haven Media Group's voice — across every silo.",
      "HMG is doubling down on what's always set the brand apart: deep cultural fluency, unfiltered editorial voice, and a refusal to chase algorithmic trends. As the rest of the industry consolidates and softens, Haven is betting that audiences want the opposite — distinct verticals, real opinions, and writers who actually live the beats they cover."
    ]
  }
];

export const generateMockResponse = async (verticalId: string, _prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const vertical = verticals.find((v) => v.id === verticalId);
      if (!vertical) {
        resolve("Created content will appear here.");
        return;
      }
      const responses = vertical.responses;
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      resolve(randomResponse);
    }, 1200);
  });
};
