import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Link,
  Database,
  Zap,
  Search,
  type LucideIcon,
} from "lucide-react";
import { verticals } from "@/lib/mock-data";
import type { SourceMode, SourcePacket } from "@/lib/hmg/sourcePackets";

interface SourcePacketPanelProps {
  onPacketReady: (packet: SourcePacket) => void;
  brandId: string;
  heading?: string;
  actionLabel?: string;
  privacyNote?: string;
}

const SOURCE_TABS: { id: SourceMode; label: string; icon: LucideIcon }[] = [
  { id: "paste", label: "Paste Story Notes", icon: FileText },
  { id: "evergreen", label: "Saved Facts", icon: Zap },
  { id: "search", label: "Google Search Export", icon: Search },
  { id: "import", label: "File Import", icon: Link },
];

/**
 * Legacy intake surface — retained for the few non-editorial views that still
   * need a quick story-notes packet (WebArt reference-context, Sales packet
   * desk, etc). All editorial-facing UI now uses the Editorial Desk. Button
 * label is human ("Prepare Editorial Brief"); internal jargon is gone.
 */
export function SourcePacketPanel({
  onPacketReady,
  brandId,
  heading = "Story Notes",
  actionLabel = "Prepare Editorial Brief",
  privacyNote = "Private workspace — your sources stay inside your newsroom.",
}: SourcePacketPanelProps) {
  const [mode, setMode] = useState<SourceMode>("paste");
  const [rawInput, setRawInput] = useState("");
  const brand = verticals.find((v) => v.id === brandId);
  const accent = brand?.color ?? "#0EA5E9";
  const onAccent = brand?.onAccent ?? "#ffffff";
  const canBuild = rawInput.trim().length > 0 || mode === "evergreen";

  const handleProcess = () => {
    const brandContext = brandId || "HMG";
    const packet: SourcePacket = {
      title: `Story Notes (${new Date().toLocaleTimeString()})`,
      mode,
      content: rawInput,
      facts: [
        "Primary subject identified.",
        "Key dates and locations mapped.",
        `${brandContext} brand context applied locally.`,
      ],
      missingContext: [
        "Add direct quotes from primary sources if quotes are needed.",
        "Confirm local time conversions and date references before manual publish.",
      ],
      warnings: [
        "Unverified social claims stay out of the article body.",
        "Avoid definitive legal, medical, financial, or criminal claims without source support.",
      ],
    };
    onPacketReady(packet);
  };

  const getStatusLabel = () => {
    switch (mode) {
      case "paste": return "Ready";
      case "local": return "Private Workspace";
      case "import": return "Ready to Import";
      case "evergreen": return "Saved Facts";
      case "search": return "Export Workflow";
      case "future": return "Coming Soon";
      default: return "Ready";
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm mb-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider">{heading}</h3>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground border border-border/50">
          {getStatusLabel()}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {SOURCE_TABS.map((t) => {
          const Icon = t.icon;
          const isActive = mode === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setMode(t.id)}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-bold whitespace-nowrap border transition-colors ${
                isActive
                  ? "border-transparent"
                  : "border-border/60 bg-transparent text-muted-foreground hover:text-foreground"
              }`}
              style={isActive ? { background: accent, color: onAccent } : undefined}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <Textarea
        placeholder="Paste your story notes, transcript, or background context here..."
        className="min-h-[120px] text-sm resize-none mb-4 font-mono bg-background/50 focus:bg-background"
        value={rawInput}
        onChange={(e) => setRawInput(e.target.value)}
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] text-muted-foreground max-w-[60%] leading-tight">
          {privacyNote}
        </p>
        <Button
          onClick={handleProcess}
          disabled={!canBuild}
          style={canBuild ? { background: accent, color: onAccent } : undefined}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
