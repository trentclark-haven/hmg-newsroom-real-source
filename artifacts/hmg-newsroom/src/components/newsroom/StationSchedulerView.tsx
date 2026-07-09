import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Radio,
  Wand2,
  Copy,
  FileJson,
  FileText,
  Trash2,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  Repeat,
} from "lucide-react";
import { toast } from "sonner";
import { verticals } from "@/lib/mock-data";
import { useSponsors } from "@/lib/sponsors";
import { recordAudit } from "@/lib/auditLog";
import {
  HOST_PERSONALITIES,
  PLAYLIST_THEME_SUGGESTIONS,
  SEGMENT_TYPES,
  downloadFile,
  formatHourRange,
  scheduleToText,
  shiftIsoDate,
  todayIsoDate,
  useStationSchedule,
  type HourBlock,
  type SegmentType,
} from "@/lib/stationSchedule";

const STATION_COLOR = "#0EA5E9";

export function StationSchedulerView() {
  const {
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
  } = useStationSchedule();
  const { sponsors } = useSponsors();
  const [expanded, setExpanded] = useState<number | null>(null);

  const stationName =
    verticals.find((v) => v.id === station)?.name ?? station;
  const stationBrandColor =
    verticals.find((v) => v.id === station)?.color ?? STATION_COLOR;

  const sponsorOptions = useMemo(() => {
    const filtered = sponsors
      .filter((s) => s.active && (s.silo === station || s.silo === "all"))
      .map((s) => s.name);
    const unique = Array.from(new Set(filtered));
    return unique.sort();
  }, [sponsors, station]);

  const filledCount = schedule.blocks.filter(
    (b) => b.showTitle.trim().length > 0,
  ).length;
  const repeatCount = schedule.blocks.filter((b) => b.repeatDaily).length;

  function handleGenerate() {
    generate();
    toast.success(`Full day generated for ${stationName}`);
    recordAudit("schedule-generated", station, `${date} · 24 blocks`);
  }

  function handleClear() {
    if (
      !window.confirm(
        `Clear the entire schedule for ${stationName} on ${date}? This cannot be undone.`,
      )
    ) {
      return;
    }
    clear();
    toast.message("Schedule cleared");
    recordAudit("schedule-cleared", station, date);
  }

  function handleCopy() {
    const text = scheduleToText(schedule);
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Full day copied to clipboard");
        recordAudit("schedule-copied", station, `${date} · text`);
      })
      .catch(() => toast.error("Copy failed"));
  }

  function handleExportJson() {
    const filename = `${station}-schedule-${date}.json`;
    downloadFile(filename, JSON.stringify(schedule, null, 2), "application/json");
    toast.success(`Exported ${filename}`);
    recordAudit("schedule-exported", station, `${date} · json`);
  }

  function handleExportTxt() {
    const filename = `${station}-schedule-${date}.txt`;
    downloadFile(filename, scheduleToText(schedule), "text/plain");
    toast.success(`Exported ${filename}`);
    recordAudit("schedule-exported", station, `${date} · txt`);
  }

  function handleDuplicateYesterday() {
    const sourceDate = shiftIsoDate(date, -1);
    const ok = duplicateFrom(sourceDate);
    if (ok) {
      toast.success(`Duplicated ${sourceDate} into ${date}`);
      recordAudit("schedule-duplicated", station, `${sourceDate} → ${date}`);
    } else {
      toast.error(`No saved schedule for ${sourceDate}`);
    }
  }

  function handleApplyRepeatDaily() {
    const count = applyRepeatDaily();
    if (count === 0) {
      toast.message("No blocks marked Repeat daily");
      return;
    }
    const tomorrow = shiftIsoDate(date, 1);
    toast.success(`Pushed ${count} block${count === 1 ? "" : "s"} to ${tomorrow}`);
    recordAudit(
      "schedule-repeat-applied",
      station,
      `${date} → ${tomorrow} · ${count} blocks`,
    );
  }

  function handleResetToday() {
    setDate(todayIsoDate());
  }

  return (
    <div
      data-testid="stationscheduler-view"
      className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-4 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: STATION_COLOR, color: "#0b1416" }}
        >
          <Radio className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black tracking-tight leading-none">
            24/7 Station Scheduler
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            Programming clock — build a full day per station, hour by hour
          </p>
        </div>
      </div>

      {/* Station + date picker */}
      <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Station
            </Label>
            <select
              value={station}
              onChange={(e) => setStation(e.target.value)}
              data-testid="stationscheduler-station"
              aria-label="Station"
              className="w-full bg-secondary/40 border border-border rounded-md text-sm h-9 px-2"
            >
              {verticals.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Date
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-testid="stationscheduler-date"
              className="h-9 bg-secondary/40"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span data-testid="stationscheduler-summary">
            {filledCount}/24 hours filled · {repeatCount} marked repeat
          </span>
          {date !== todayIsoDate() && (
            <button
              type="button"
              onClick={handleResetToday}
              className="text-[10px] text-sky-300 hover:text-sky-700 dark:text-sky-200 underline"
            >
              jump to today
            </button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          onClick={handleGenerate}
          data-testid="stationscheduler-generate"
          className="h-10 font-semibold rounded-md"
          style={{ background: STATION_COLOR, color: "#0b1416" }}
        >
          <Wand2 className="w-4 h-4 mr-1.5" />
          Generate full day
        </Button>
        <Button
          type="button"
          onClick={handleCopy}
          variant="outline"
          data-testid="stationscheduler-copy"
          className="h-10 font-semibold rounded-md"
        >
          <Copy className="w-4 h-4 mr-1.5" />
          Copy full day
        </Button>
        <Button
          type="button"
          onClick={handleExportJson}
          variant="outline"
          data-testid="stationscheduler-export-json"
          className="h-10 text-[12px] font-semibold rounded-md"
        >
          <FileJson className="w-4 h-4 mr-1.5" />
          Export JSON
        </Button>
        <Button
          type="button"
          onClick={handleExportTxt}
          variant="outline"
          data-testid="stationscheduler-export-txt"
          className="h-10 text-[12px] font-semibold rounded-md"
        >
          <FileText className="w-4 h-4 mr-1.5" />
          Export TXT
        </Button>
        <Button
          type="button"
          onClick={handleDuplicateYesterday}
          variant="outline"
          disabled={!hasYesterday}
          data-testid="stationscheduler-duplicate-yesterday"
          className="h-10 text-[12px] font-semibold rounded-md"
        >
          <CalendarPlus className="w-4 h-4 mr-1.5" />
          Duplicate yesterday
        </Button>
        <Button
          type="button"
          onClick={handleApplyRepeatDaily}
          variant="outline"
          disabled={repeatCount === 0}
          data-testid="stationscheduler-apply-repeat"
          className="h-10 text-[12px] font-semibold rounded-md"
        >
          <Repeat className="w-4 h-4 mr-1.5" />
          Push repeats →
        </Button>
        <Button
          type="button"
          onClick={handleClear}
          variant="outline"
          disabled={!hasToday && filledCount === 0}
          data-testid="stationscheduler-clear"
          className="h-10 text-[12px] font-semibold rounded-md col-span-2 text-red-300 hover:text-red-700 dark:text-red-200 hover:bg-red-500/10 border-red-500/30"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Clear schedule
        </Button>
      </div>

      {/* Programming clock */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Programming Clock · {stationName}
          </p>
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: stationBrandColor }}
          >
            {date}
          </span>
        </div>
        <ol
          className="space-y-1.5"
          data-testid="stationscheduler-clock"
          aria-label="24-hour programming clock"
        >
          {schedule.blocks.map((block) => (
            <HourRow
              key={block.hour}
              block={block}
              parentStation={station}
              stationBrandColor={stationBrandColor}
              expanded={expanded === block.hour}
              onToggle={() =>
                setExpanded((cur) => (cur === block.hour ? null : block.hour))
              }
              onChange={(patch) => updateBlock(block.hour, patch)}
              sponsorOptions={sponsorOptions}
            />
          ))}
        </ol>
      </div>
    </div>
  );
}

interface HourRowProps {
  block: HourBlock;
  parentStation: string;
  stationBrandColor: string;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<HourBlock>) => void;
  sponsorOptions: string[];
}

function HourRow({
  block,
  parentStation,
  stationBrandColor,
  expanded,
  onToggle,
  onChange,
  sponsorOptions,
}: HourRowProps) {
  const filled = block.showTitle.trim().length > 0;
  const isOverride = block.station !== parentStation;
  const overrideStationName = isOverride
    ? verticals.find((v) => v.id === block.station)?.name ?? block.station
    : null;

  return (
    <li
      data-testid={`stationscheduler-block-${block.hour}`}
      className={`rounded-lg border bg-secondary/30 transition-colors ${
        filled ? "border-border/60" : "border-dashed border-border/40"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        data-testid={`stationscheduler-block-toggle-${block.hour}`}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <div className="flex flex-col items-center justify-center min-w-[64px] py-0.5">
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: stationBrandColor }}
          >
            {formatHourRange(block.hour).split(" – ")[0]}
          </span>
          <span className="text-[9px] text-muted-foreground">
            {formatHourRange(block.hour).split(" – ")[1]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] font-semibold text-foreground/95 truncate">
              {block.showTitle || (
                <span className="text-muted-foreground italic">
                  empty hour
                </span>
              )}
            </span>
            {block.repeatDaily && (
              <span
                title="Repeats daily"
                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-700 dark:text-sky-200 border border-sky-400/40"
              >
                ↻ daily
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-2">
            <span>{block.segmentType}</span>
            {block.hostPersonality && (
              <>
                <span>·</span>
                <span>{block.hostPersonality}</span>
              </>
            )}
            {block.playlistTheme && (
              <>
                <span>·</span>
                <span className="truncate">{block.playlistTheme}</span>
              </>
            )}
            {block.sponsor && (
              <>
                <span>·</span>
                <span className="text-amber-300">{block.sponsor}</span>
              </>
            )}
            {overrideStationName && (
              <>
                <span>·</span>
                <span
                  className="text-fuchsia-300"
                  data-testid={`stationscheduler-override-${block.hour}`}
                >
                  via {overrideStationName}
                </span>
              </>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/40">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Show title
            </Label>
            <Input
              value={block.showTitle}
              onChange={(e) => onChange({ showTitle: e.target.value })}
              placeholder="e.g. Drive Time Block Party"
              data-testid={`stationscheduler-show-${block.hour}`}
              className="h-9 bg-secondary/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Segment type
              </Label>
              <select
                value={block.segmentType}
                onChange={(e) =>
                  onChange({ segmentType: e.target.value as SegmentType })
                }
                data-testid={`stationscheduler-segment-${block.hour}`}
                aria-label="Segment type"
                className="w-full bg-secondary/40 border border-border rounded-md text-sm h-9 px-2"
              >
                {SEGMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Station (override)
              </Label>
              <select
                value={block.station}
                onChange={(e) => onChange({ station: e.target.value })}
                data-testid={`stationscheduler-block-station-${block.hour}`}
                aria-label="Block station"
                className="w-full bg-secondary/40 border border-border rounded-md text-sm h-9 px-2"
              >
                {verticals.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Playlist theme
            </Label>
            <Input
              list={`stationscheduler-themes-${block.hour}`}
              value={block.playlistTheme}
              onChange={(e) => onChange({ playlistTheme: e.target.value })}
              placeholder="e.g. New Releases"
              data-testid={`stationscheduler-theme-${block.hour}`}
              className="h-9 bg-secondary/40"
            />
            <datalist id={`stationscheduler-themes-${block.hour}`}>
              {PLAYLIST_THEME_SUGGESTIONS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Host
              </Label>
              <Input
                list={`stationscheduler-hosts-${block.hour}`}
                value={block.hostPersonality}
                onChange={(e) =>
                  onChange({ hostPersonality: e.target.value })
                }
                placeholder="e.g. Drive-Time Host"
                data-testid={`stationscheduler-host-${block.hour}`}
                className="h-9 bg-secondary/40"
              />
              <datalist id={`stationscheduler-hosts-${block.hour}`}>
                {HOST_PERSONALITIES.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Sponsor
              </Label>
              <Input
                list={`stationscheduler-sponsors-${block.hour}`}
                value={block.sponsor}
                onChange={(e) => onChange({ sponsor: e.target.value })}
                placeholder="(optional)"
                data-testid={`stationscheduler-sponsor-${block.hour}`}
                className="h-9 bg-secondary/40"
              />
              <datalist id={`stationscheduler-sponsors-${block.hour}`}>
                {sponsorOptions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Notes
            </Label>
            <Textarea
              value={block.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="Talking points, transitions, ad reads..."
              data-testid={`stationscheduler-notes-${block.hour}`}
              className="min-h-[60px] bg-secondary/40 text-[12px]"
            />
          </div>
          <label className="flex items-center gap-2 text-[11px] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={block.repeatDaily}
              onChange={(e) => onChange({ repeatDaily: e.target.checked })}
              data-testid={`stationscheduler-repeat-${block.hour}`}
              className="h-3.5 w-3.5 accent-sky-500"
            />
            <span>Repeat daily — push this hour into tomorrow</span>
          </label>
        </div>
      )}
    </li>
  );
}
