import { LOGOS } from "./logos";

export interface BrandFrameDef {
  id: string;
  name: string;
  shortName: string;
  color: string;
  on: string;
  logo?: string;
}

/**
 * The eight brand color slots required by the founder spec for SocialFrame
 * exports. FitHaven appears twice (Blue and Pink) because the legacy mock
 * vertical packs a gradient that mixes both — for export frames each color
 * is treated as its own brand slot.
 */
export const BRAND_FRAMES: BrandFrameDef[] = [
  {
    id: "hiphophaven",
    name: "HipHopHaven",
    shortName: "HipHopHaven Blue",
    color: "#1FA6D9",
    on: "#ffffff",
    logo: LOGOS.hiphophaven,
  },
  {
    id: "raphaven",
    name: "RapHaven",
    shortName: "RapHaven Red",
    color: "#E32219",
    on: "#ffffff",
    logo: LOGOS.raphaven,
  },
  {
    id: "musichaven",
    name: "MusicHaven",
    shortName: "MusicHaven Gold",
    color: "#D4A23A",
    on: "#1a1410",
    logo: LOGOS.musichaven,
  },
  {
    id: "sportshaven",
    name: "SportsHaven",
    shortName: "SportsHaven Orange",
    color: "#F26A21",
    on: "#ffffff",
    logo: LOGOS.sportshaven,
  },
  {
    id: "cannahaven",
    name: "CannaHaven",
    shortName: "CannaHaven Green",
    color: "#1F6B3A",
    on: "#ffffff",
    logo: LOGOS.cannahaven,
  },
  {
    id: "fithaven-blue",
    name: "FitHaven Blue",
    shortName: "FitHaven Blue",
    color: "#2EC5FF",
    on: "#ffffff",
    logo: LOGOS.fithaven,
  },
  {
    id: "fithaven-pink",
    name: "FitHaven Pink",
    shortName: "FitHaven Pink",
    color: "#FF4FD8",
    on: "#ffffff",
    logo: LOGOS.fithaven,
  },
  {
    id: "hmg",
    name: "HMG",
    shortName: "HMG Gold",
    color: "#D4A23A",
    on: "#0a0a0a",
    logo: LOGOS.hmg,
  },
];

/**
 * Founder-locked safe-zone grid. Every SocialFrame template must respect
 * these constants so exported assets clear the platform-specific UI overlays
 * (handle bars, action rails, like buttons, etc.).
 */
export const SAFE_ZONES = {
  /** 5% outer safe zone — no critical content within this margin. */
  outer: 0.05,
  /** 8% inner padding for caption blocks. */
  caption: 0.08,
  /** 10% reserved exclusion zone around the lower-third logo. */
  logo: 0.1,
} as const;

/**
 * Frame geometry constants. The legacy templates used 8% borders; the new
 * spec compresses borders to 1-2% and gives the caption zone its own
 * dedicated 18-24% band (hard cap 25%).
 */
export const FRAME_GEOMETRY = {
  borderWidthPct: 0.015,
  captionMinPct: 0.18,
  captionMaxPct: 0.24,
  captionHardCapPct: 0.25,
} as const;

/**
 * A12 — LOGO MUSCLE MEMORY:
 * Per-platform fixed logo width as a fraction of CANVAS width (NOT content).
 * Midpoint of founder spec ranges. The logo never scales with caption length;
 * caption text autoflows around the locked footprint.
 */
export const LOGO_OCCUPANCY = {
  "instagram-feed": 0.12, // 11-13%
  "instagram-story": 0.1, // 9-11%
  tiktok: 0.1, // 9-11%
  "youtube-short": 0.1, // 9-11%
  "youtube-thumbnail": 0.11,
  x: 0.13, // 12-14%
  facebook: 0.11,
  website: 0.11, // 10-12%
} as const;

/**
 * Locked logo anchor offset from canvas edges. Default position is
 * bottom-right; founder must explicitly select an alternate layout to move it.
 */
export const LOGO_ANCHOR = {
  x: 0.04,
  y: 0.04,
} as const;

/**
 * Default placeholder used by the proof page so the frame design can be
 * reviewed without depending on a live image generation. Encoded inline so
 * the proof renders offline.
 */
export const PROOF_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='#0f0f1f'/>
      <stop offset='1' stop-color='#2a1845'/>
    </linearGradient>
    <radialGradient id='glow' cx='0.7' cy='0.3' r='0.6'>
      <stop offset='0' stop-color='#ff6fa8' stop-opacity='0.55'/>
      <stop offset='1' stop-color='#ff6fa8' stop-opacity='0'/>
    </radialGradient>
  </defs>
  <rect width='800' height='800' fill='url(#bg)'/>
  <rect width='800' height='800' fill='url(#glow)'/>
  <circle cx='240' cy='560' r='180' fill='#1e90ff' opacity='0.35'/>
  <circle cx='600' cy='200' r='110' fill='#ffd166' opacity='0.45'/>
  <path d='M0,640 Q200,560 400,640 T800,640 L800,800 L0,800 Z' fill='#000' opacity='0.35'/>
</svg>`
)}`;
