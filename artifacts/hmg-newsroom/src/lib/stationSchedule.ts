import { useCallback, useEffect, useState } from "react";
import { verticals } from "./mock-data";

export const STATION_SCHEDULE_STORAGE_KEY = "hmg-station-schedule-v1";
const CHANGED_EVENT = "hmg-station-schedule-changed";
const MAX_DAYS = 60;

export const SEGMENT_TYPES = [
  "Music",
  "News",
  "Talk",
  "Interview",
  "Mix",
  "Live",
  "Promo",
  "Replay",
  "Sports",
  "Wellness",
  "Lifestyle",
] as const;
export type SegmentType = (typeof SEGMENT_TYPES)[number];

export const HOST_PERSONALITIES = [
  "DJ Auto",
  "Morning Crew",
  "Midday Host",
  "Drive-Time Host",
  "Evening Host",
  "Overnight DJ",
  "Weekend Mix Show",
  "Guest Host",
  "Marshall (AI)",
  "Darry (AI)",
  "Kris (AI)",
  "Dana (AI)",
  "Anna (AI)",
] as const;

export const PLAYLIST_THEME_SUGGESTIONS = [
  "New Releases",
  "Throwback",
  "Top 40",
  "Indie Spotlight",
  "Slow Jams",
  "Workout Mix",
  "Chill Vibes",
  "Block Party",
  "Studio Acoustic",
  "Underground",
  "Live Sessions",
  "Year in Review",
] as const;

export interface HourBlock {
  hour: number;
  station: string;
  showTitle: string;
  segmentType: SegmentType;
  playlistTheme: string;
  hostPersonality: string;
  sponsor: string;
  notes: string;
  repeatDaily: boolean;
}

export interface StationDaySchedule {
  station: string;
  date: string;
  blocks: HourBlock[];
  updatedAt: number;
}

type ScheduleMap = Record<string, StationDaySchedule>;

export function scheduleKey(station: string, date: string): string {
  return `${station}::${date}`;
}

export function todayIsoDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftIsoDate(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return todayIsoDate(
    new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()),
  );
}

export function emptyHourBlock(hour: number, station: string): HourBlock {
  return {
    hour,
    station,
    showTitle: "",
    segmentType: "Music",
    playlistTheme: "",
    hostPersonality: "DJ Auto",
    sponsor: "",
    notes: "",
    repeatDaily: false,
  };
}

export function emptyDaySchedule(
  station: string,
  date: string,
): StationDaySchedule {
  return {
    station,
    date,
    blocks: Array.from({ length: 24 }, (_, h) => emptyHourBlock(h, station)),
    updatedAt: Date.now(),
  };
}

export function formatHour(hour: number): string {
  const h12 = ((hour + 11) % 12) + 1;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h12}:00 ${ampm}`;
}

export function formatHourRange(hour: number): string {
  return `${formatHour(hour)} – ${formatHour((hour + 1) % 24)}`;
}

interface DayParts {
  morning: { showTitle: string; segmentType: SegmentType; host: string };
  midday: { showTitle: string; segmentType: SegmentType; host: string };
  drive: { showTitle: string; segmentType: SegmentType; host: string };
  evening: { showTitle: string; segmentType: SegmentType; host: string };
  overnight: { showTitle: string; segmentType: SegmentType; host: string };
}

const STATION_PROGRAMMING: Record<string, DayParts & { themes: string[] }> = {
  hiphophaven: {
    morning: {
      showTitle: "Haven Morning Drop",
      segmentType: "Talk",
      host: "Morning Crew",
    },
    midday: {
      showTitle: "Midday Heat Check",
      segmentType: "Music",
      host: "Midday Host",
    },
    drive: {
      showTitle: "Drive Time Block Party",
      segmentType: "Mix",
      host: "Drive-Time Host",
    },
    evening: {
      showTitle: "Haven After Dark",
      segmentType: "Music",
      host: "Evening Host",
    },
    overnight: {
      showTitle: "Late Night Lo-Fi",
      segmentType: "Mix",
      host: "Overnight DJ",
    },
    themes: [
      "New Hip-Hop",
      "Throwback Hip-Hop",
      "Trap Hour",
      "East Coast Classics",
      "West Coast Classics",
      "Indie Bars",
    ],
  },
  raphaven: {
    morning: {
      showTitle: "Bars Before Breakfast",
      segmentType: "Talk",
      host: "Morning Crew",
    },
    midday: {
      showTitle: "Lyric Lab",
      segmentType: "Interview",
      host: "Midday Host",
    },
    drive: {
      showTitle: "Cypher Drive",
      segmentType: "Live",
      host: "Drive-Time Host",
    },
    evening: {
      showTitle: "Underground Hour",
      segmentType: "Music",
      host: "Evening Host",
    },
    overnight: {
      showTitle: "Late Night Freestyle",
      segmentType: "Mix",
      host: "Overnight DJ",
    },
    themes: [
      "Lyrical Spotlight",
      "Battle Rap",
      "Producer Beats",
      "Indie Bars",
      "Classic Cyphers",
      "Studio Sessions",
    ],
  },
  musichaven: {
    morning: {
      showTitle: "Morning Mix",
      segmentType: "Music",
      host: "Morning Crew",
    },
    midday: {
      showTitle: "Midday Sessions",
      segmentType: "Music",
      host: "Midday Host",
    },
    drive: {
      showTitle: "Drive Time Variety",
      segmentType: "Mix",
      host: "Drive-Time Host",
    },
    evening: {
      showTitle: "Evening Sessions",
      segmentType: "Music",
      host: "Evening Host",
    },
    overnight: {
      showTitle: "Overnight Easy",
      segmentType: "Music",
      host: "DJ Auto",
    },
    themes: [
      "New Releases",
      "Throwback",
      "Indie Spotlight",
      "Acoustic Hour",
      "Live Sessions",
      "Top 40",
    ],
  },
  sportshaven: {
    morning: {
      showTitle: "Sports Morning Brief",
      segmentType: "News",
      host: "Morning Crew",
    },
    midday: {
      showTitle: "Midday Talk",
      segmentType: "Talk",
      host: "Midday Host",
    },
    drive: {
      showTitle: "Drive-Time Recap",
      segmentType: "Sports",
      host: "Drive-Time Host",
    },
    evening: {
      showTitle: "Tonight's Game",
      segmentType: "Live",
      host: "Evening Host",
    },
    overnight: {
      showTitle: "Game Replay",
      segmentType: "Replay",
      host: "DJ Auto",
    },
    themes: [
      "Headlines",
      "Player Profiles",
      "League Recap",
      "Fantasy Talk",
      "Live Game",
      "Highlight Reel",
    ],
  },
  fithaven: {
    morning: {
      showTitle: "Sunrise Workout Mix",
      segmentType: "Music",
      host: "Morning Crew",
    },
    midday: {
      showTitle: "Midday Motivation",
      segmentType: "Talk",
      host: "Midday Host",
    },
    drive: {
      showTitle: "Drive-Time Energy",
      segmentType: "Mix",
      host: "Drive-Time Host",
    },
    evening: {
      showTitle: "Evening Wind Down",
      segmentType: "Wellness",
      host: "Evening Host",
    },
    overnight: {
      showTitle: "Overnight Recovery",
      segmentType: "Wellness",
      host: "DJ Auto",
    },
    themes: [
      "HIIT Mix",
      "Yoga Flow",
      "Run Tempo",
      "Strength Training",
      "Cool Down",
      "Recovery Sleep",
    ],
  },
  cannahaven: {
    morning: {
      showTitle: "Wake & Bake Mix",
      segmentType: "Music",
      host: "Morning Crew",
    },
    midday: {
      showTitle: "Midday Cannabis Talk",
      segmentType: "Talk",
      host: "Midday Host",
    },
    drive: {
      showTitle: "Drive-Time Chill",
      segmentType: "Mix",
      host: "Drive-Time Host",
    },
    evening: {
      showTitle: "After Hours Sessions",
      segmentType: "Music",
      host: "Evening Host",
    },
    overnight: {
      showTitle: "Overnight Lounge",
      segmentType: "Lifestyle",
      host: "DJ Auto",
    },
    themes: [
      "Strain of the Day",
      "Industry News",
      "Chill Hop",
      "Reggae Hour",
      "Lifestyle Talk",
      "Lounge Mix",
    ],
  },
  hmg: {
    morning: {
      showTitle: "HMG Morning Network",
      segmentType: "News",
      host: "Morning Crew",
    },
    midday: {
      showTitle: "Cross-Network Midday",
      segmentType: "Talk",
      host: "Midday Host",
    },
    drive: {
      showTitle: "Network Drive",
      segmentType: "Mix",
      host: "Drive-Time Host",
    },
    evening: {
      showTitle: "Prime Time Network",
      segmentType: "Live",
      host: "Evening Host",
    },
    overnight: {
      showTitle: "Overnight Network Mix",
      segmentType: "Replay",
      host: "DJ Auto",
    },
    themes: [
      "Cross-Promo Block",
      "Best of the Network",
      "Highlights",
      "Replay Hour",
      "Network News",
      "Affiliate Hour",
    ],
  },
};

function programmingFor(station: string) {
  return STATION_PROGRAMMING[station] ?? STATION_PROGRAMMING.musichaven;
}

function dayPartFor(hour: number): keyof DayParts {
  if (hour >= 6 && hour < 10) return "morning";
  if (hour >= 10 && hour < 15) return "midday";
  if (hour >= 15 && hour < 19) return "drive";
  if (hour >= 19 && hour < 24) return "evening";
  return "overnight";
}

export function generateFullDay(
  station: string,
  date: string,
): StationDaySchedule {
  const config = programmingFor(station);
  const blocks: HourBlock[] = Array.from({ length: 24 }, (_, hour) => {
    const part = dayPartFor(hour);
    const slot = config[part];
    const theme = config.themes[hour % config.themes.length];
    return {
      hour,
      station,
      showTitle: slot.showTitle,
      segmentType: slot.segmentType,
      playlistTheme: theme,
      hostPersonality: slot.host,
      sponsor: "",
      notes: "",
      repeatDaily: false,
    };
  });
  return { station, date, blocks, updatedAt: Date.now() };
}

function readMap(): ScheduleMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STATION_SCHEDULE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ScheduleMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: ScheduleMap): void {
  try {
    const entries = Object.entries(map).sort(
      ([, a], [, b]) => b.updatedAt - a.updatedAt,
    );
    const trimmed: ScheduleMap = {};
    for (const [k, v] of entries.slice(0, MAX_DAYS)) trimmed[k] = v;
    window.localStorage.setItem(
      STATION_SCHEDULE_STORAGE_KEY,
      JSON.stringify(trimmed),
    );
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    /* ignore quota errors */
  }
}

export interface StationScheduleApi {
  schedule: StationDaySchedule;
  station: string;
  date: string;
  setStation: (station: string) => void;
  setDate: (date: string) => void;
  updateBlock: (hour: number, patch: Partial<HourBlock>) => void;
  applyRepeatDaily: () => number;
  generate: () => void;
  clear: () => void;
  duplicateFrom: (sourceDate: string) => boolean;
  hasYesterday: boolean;
  hasToday: boolean;
}

export function useStationSchedule(
  initialStation: string = verticals[0]?.id ?? "hiphophaven",
): StationScheduleApi {
  const [station, setStationState] = useState<string>(initialStation);
  const [date, setDateState] = useState<string>(() => todayIsoDate());
  const [map, setMap] = useState<ScheduleMap>(() => readMap());

  useEffect(() => {
    const handler = () => setMap(readMap());
    window.addEventListener(CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const key = scheduleKey(station, date);
  const schedule = map[key] ?? emptyDaySchedule(station, date);

  const setStation = useCallback((next: string) => setStationState(next), []);
  const setDate = useCallback((next: string) => setDateState(next), []);

  const persist = useCallback((next: StationDaySchedule) => {
    const current = readMap();
    const updated = { ...current, [scheduleKey(next.station, next.date)]: next };
    writeMap(updated);
    setMap(updated);
  }, []);

  const updateBlock = useCallback(
    (hour: number, patch: Partial<HourBlock>) => {
      const base = readMap()[key] ?? emptyDaySchedule(station, date);
      const next: StationDaySchedule = {
        ...base,
        blocks: base.blocks.map((b) =>
          b.hour === hour ? { ...b, ...patch } : b,
        ),
        updatedAt: Date.now(),
      };
      persist(next);
    },
    [date, key, persist, station],
  );

  const applyRepeatDaily = useCallback((): number => {
    const current = readMap();
    const today = current[key] ?? emptyDaySchedule(station, date);
    const flagged = today.blocks.filter((b) => b.repeatDaily);
    if (flagged.length === 0) return 0;
    const tomorrowDate = shiftIsoDate(date, 1);
    const tomorrowKey = scheduleKey(station, tomorrowDate);
    const tomorrow =
      current[tomorrowKey] ?? emptyDaySchedule(station, tomorrowDate);
    const nextBlocks = tomorrow.blocks.map((b) => {
      const source = flagged.find((f) => f.hour === b.hour);
      if (!source) return b;
      return {
        ...source,
        repeatDaily: true,
      };
    });
    const next: StationDaySchedule = {
      ...tomorrow,
      blocks: nextBlocks,
      updatedAt: Date.now(),
    };
    persist(next);
    return flagged.length;
  }, [date, key, persist, station]);

  const generate = useCallback(() => {
    persist(generateFullDay(station, date));
  }, [date, persist, station]);

  const clear = useCallback(() => {
    persist(emptyDaySchedule(station, date));
  }, [date, persist, station]);

  const duplicateFrom = useCallback(
    (sourceDate: string): boolean => {
      const current = readMap();
      const source = current[scheduleKey(station, sourceDate)];
      if (!source) return false;
      const cloned: StationDaySchedule = {
        station,
        date,
        // Preserve per-hour station overrides exactly as the source had them.
        blocks: source.blocks.map((b) => ({ ...b })),
        updatedAt: Date.now(),
      };
      persist(cloned);
      return true;
    },
    [date, persist, station],
  );

  const yesterday = shiftIsoDate(date, -1);
  const hasYesterday = Boolean(map[scheduleKey(station, yesterday)]);
  const hasToday = Boolean(map[key]);

  return {
    schedule,
    station,
    date,
    setStation,
    setDate,
    updateBlock,
    applyRepeatDaily,
    generate,
    clear,
    duplicateFrom,
    hasYesterday,
    hasToday,
  };
}

export function scheduleToText(schedule: StationDaySchedule): string {
  const stationName =
    verticals.find((v) => v.id === schedule.station)?.name ?? schedule.station;
  const lines: string[] = [
    `${stationName} — Programming Clock`,
    `Date: ${schedule.date}`,
    "",
    "HOUR".padEnd(20) +
      "SHOW".padEnd(28) +
      "TYPE".padEnd(12) +
      "HOST".padEnd(20) +
      "PLAYLIST".padEnd(22) +
      "SPONSOR",
    "-".repeat(124),
  ];
  for (const b of schedule.blocks) {
    const stationLabel =
      b.station === schedule.station
        ? ""
        : ` (via ${verticals.find((v) => v.id === b.station)?.name ?? b.station})`;
    const repeatTag = b.repeatDaily ? " ↻" : "";
    lines.push(
      formatHourRange(b.hour).padEnd(20) +
        (b.showTitle || "—").slice(0, 27).padEnd(28) +
        (b.segmentType || "—").padEnd(12) +
        (b.hostPersonality || "—").slice(0, 19).padEnd(20) +
        (b.playlistTheme || "—").slice(0, 21).padEnd(22) +
        (b.sponsor || "—") +
        stationLabel +
        repeatTag,
    );
    if (b.notes) {
      lines.push(`  notes: ${b.notes}`);
    }
  }
  lines.push("");
  lines.push(`Generated ${new Date(schedule.updatedAt).toISOString()}`);
  return lines.join("\n");
}

export function downloadFile(
  filename: string,
  content: string,
  mime: string,
): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
