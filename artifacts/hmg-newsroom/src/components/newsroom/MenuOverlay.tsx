import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Activity,
  Newspaper,
  Search,
  Brush,
  Video,
  Settings as SettingsIcon,
  ChevronRight,
  LayoutDashboard,
  Megaphone,
  Film,
  Users,
  Image as ImageIcon,
  CheckSquare,
  TrendingUp,
  ScrollText,
  ShieldAlert,
  Radio,
  Database,
  Brain,
  HeartPulse,
  LifeBuoy,
  BookMarked,
  FileText,
  Smartphone,
  Inbox,
} from "lucide-react";
import { ROLES, ROLE_LABELS, orderForRole, useRolePreset } from "@/lib/role";
import { useSafeMode } from "@/lib/safeMode";

export type View =
  | "newsroom"
  | "recovery"
  | "commandcenter"
  | "socialfactory"
  | "seomaster"
  | "artbot"
  | "cutmaster"
  | "clipbrand"
  | "stationscheduler"
  | "corpus"
  | "havenai"
  | "aistaff"
  | "medialibrary"
  | "sales"
  | "assignments"
  | "auditlog"
  | "wpconnections"
  | "help"
  | "founderkb"
  | "wp-draft-history"
  | "aicapability"
  | "operatorreadiness"
  | "artboteditorial"
  | "backendstatus"
  | "mobileappstatus"
  | "sessionrecap"
  | "maxcro";

export interface MenuItem {
  id: View;
  label: string;
  description: string;
  icon: typeof Newspaper;
  color: string;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "newsroom",
    label: "Editorial Desk",
    description: "Create, edit, and prepare articles",
    icon: Newspaper,
    color: "#D9D9D9",
  },
  {
    id: "recovery",
    label: "System Health",
    description: "Status, backup, and recovery checks",
    icon: HeartPulse,
    color: "#22C55E",
  },
  {
    id: "commandcenter",
    label: "Command Center",
    description: "Inbox, queues, and next actions",
    icon: LayoutDashboard,
    color: "#0EA5E9",
  },
  {
    id: "socialfactory",
    label: "Social Factory",
    description: "Create platform posts from finished assets",
    icon: Megaphone,
    color: "#F472B6",
  },
  {
    id: "seomaster",
    label: "SEO Master",
    description: "Headlines, meta, Yoast checklist",
    icon: Search,
    color: "#10B981",
  },
  {
    id: "artbot",
    label: "WebArt",
    description: "Upload assets, create graphics, export visuals",
    icon: Brush,
    color: "#A855F7",
  },
  {
    id: "cutmaster",
    label: "WebEdit",
    description: "Upload media, create cut plans, save outputs",
    icon: Video,
    color: "#EF4444",
  },
  {
    id: "clipbrand",
    label: "Clip + Brand",
    description: "Video packaging — title, captions, thumbnail",
    icon: Film,
    color: "#6366F1",
  },
  {
    id: "stationscheduler",
    label: "Station Scheduler",
    description: "24/7 programming clock — full day per station",
    icon: Radio,
    color: "#0EA5E9",
  },
  {
    id: "corpus",
    label: "HMG Memory",
    description: "Brand rules, facts, timelines, NotebookLM imports — paste, upload, fetch",
    icon: Database,
    color: "#14B8A6",
  },
  {
    id: "havenai",
    label: "Haven AI Status",
    description: "Where Haven's writing intelligence is connected and ready",
    icon: Brain,
    color: "#7C3AED",
  },
  {
    id: "aistaff",
    label: "AI Staff",
    description: "Internal staff prompts + Founder Voice",
    icon: Users,
    color: "#FBBF24",
  },
  {
    id: "medialibrary",
    label: "Output History",
    description: "Saved outputs, Media Library, WordPress drafts",
    icon: ImageIcon,
    color: "#22D3EE",
  },
  {
    id: "maxcro",
    label: "Max CRO Inbox",
    description: "Source Intake → Revenue signal detection → Max CRO review → Founder action",
    icon: Inbox,
    color: "#10B981",
  },
  {
    id: "sales",
    label: "Sales Desk",
    description: "Revenue partners and CRM",
    icon: TrendingUp,
    color: "#10B981",
  },
  {
    id: "assignments",
    label: "Assignment Center",
    description: "Delegate tasks to Marshall, Darry, Kris, Dana, Anna",
    icon: CheckSquare,
    color: "#A855F7",
  },
  {
    id: "auditlog",
    label: "Receipt Log",
    description: "Every local action receipt, secrets redacted",
    icon: ScrollText,
    color: "#94A3B8",
  },
  {
    id: "wpconnections",
    label: "WP Connections",
    description: "Manage all 7 WordPress sites",
    icon: SettingsIcon,
    color: "#F59E0B",
  },
  {
    id: "help",
    label: "How To Use HMG",
    description: "Plain-English guide to each desk",
    icon: LifeBuoy,
    color: "#38BDF8",
  },
  {
    id: "founderkb",
    label: "Founder Knowledge Base",
    description: "Load HMG DNA — Founder Voice, brand rules, Max notes, relationships, WordPress rules",
    icon: BookMarked,
    color: "#6366F1",
  },
  {
    id: "wp-draft-history",
    label: "WordPress Draft History",
    description: "All saved WordPress drafts — copy fields, export JSON/HTML, send to Social Factory",
    icon: FileText,
    color: "#F59E0B",
  },
  {
    id: "aicapability",
    label: "Haven AI Engine",
    description: "What intelligence is active now, what is memory-backed, and what needs future model wiring",
    icon: Brain,
    color: "#8B5CF6",
  },
  {
    id: "artboteditorial",
    label: "ARTBOT Editorial",
    description: "Headline variants, source check, gossip check, WP prep, SEO starter — deterministic, memory-backed",
    icon: Newspaper,
    color: "#38BDF8",
  },
  {
    id: "operatorreadiness",
    label: "Operator Readiness",
    description: "Multi-user operator roster, work queue model, and backend contract status",
    icon: Users,
    color: "#0EA5E9",
  },
  {
    id: "backendstatus",
    label: "Backend / API Status",
    description: "Live route ping — Contract Ready, Route Missing, Connected, Not Reachable",
    icon: Activity,
    color: "#0EA5E9",
  },
  {
    id: "mobileappstatus",
    label: "Mobile App Readiness",
    description: "PWA check, manifest, service worker, offline readiness, App Store path",
    icon: Smartphone,
    color: "#06B6D4",
  },
  {
    id: "sessionrecap",
    label: "Session Recap",
    description: "Today's outputs, memory fuel state, recommended next actions — end-of-shift cockpit",
    icon: ScrollText,
    color: "#6366F1",
  },
];

/**
 * Founder-facing navigation tiers. Every existing view ID stays intact — this
 * only groups them into plain-English sections. The "help" guide is pinned
 * separately above the tiers, so it is not listed here.
 */
export const MENU_SECTIONS: { label: string; hint: string; ids: View[] }[] = [
  {
    label: "Daily Desk",
    hint: "Command, editorial, WebArt, video, outputs",
    ids: [
      "commandcenter",
      "newsroom",
      "artbot",
      "cutmaster",
      "socialfactory",
      "medialibrary",
      "wp-draft-history",
      "sessionrecap",
    ],
  },
  {
    label: "Growth",
    hint: "Reach & optimization",
    ids: ["seomaster", "clipbrand", "stationscheduler", "aistaff", "assignments", "maxcro"],
  },
  {
    label: "System & Setup",
    hint: "Health, memory & connections",
    ids: [
      "sales",
      "recovery",
      "auditlog",
      "corpus",
      "founderkb",
      "havenai",
      "wpconnections",
      "aicapability",
      "artboteditorial",
      "operatorreadiness",
      "backendstatus",
      "mobileappstatus",
    ],
  },
];

interface MenuOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: View;
  onSelect: (view: View) => void;
}

export function MenuOverlay({
  open,
  onOpenChange,
  active,
  onSelect,
}: MenuOverlayProps) {
  const { role, setRole } = useRolePreset();
  const { enabled: safeMode, setSafeMode } = useSafeMode();
  const ordered = orderForRole(MENU_ITEMS, role);
  const helpItem = MENU_ITEMS.find((m) => m.id === "help");
  // Keep the active role's priority ordering, but only within each tier.
  const sectionItems = (ids: View[]) =>
    ordered.filter((item) => ids.includes(item.id));

  const renderItem = (item: MenuItem, idx: number) => {
    const Icon = item.icon;
    const isActive = item.id === active;
    return (
      <button
        key={item.id}
        onClick={() => {
          onSelect(item.id);
          onOpenChange(false);
        }}
        data-testid={`menu-item-${item.id}`}
        className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-foreground/5 transition-colors text-left ${
          isActive ? "bg-foreground/[0.03]" : ""
        }`}
        style={{ animationDelay: `${idx * 30}ms` }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: isActive ? item.color : `${item.color}1A`,
            color: isActive ? "#fff" : item.color,
          }}
        >
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[13.5px] font-bold uppercase tracking-wide"
              style={{ color: isActive ? item.color : undefined }}
            >
              {item.label}
            </span>
            {isActive && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-foreground/10 text-foreground/70">
                Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {item.description}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
      </button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        role="dialog"
        aria-label="Newsroom Suite navigation menu"
        className="w-[88vw] sm:max-w-sm bg-background border-border/60 p-0 flex flex-col"
      >
        <SheetTitle className="sr-only">Newsroom Suite Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Navigate between Editorial Desk, SEO Master, WebArt, WebEdit,
          Social Factory, Output History, and WP Connections.
        </SheetDescription>
        <div className="px-5 pt-6 pb-4 border-b border-border/40">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            Haven Media Group
          </p>
          <h2 className="text-xl font-black tracking-tight mt-1">
            Newsroom Suite
          </h2>
        </div>

        {/* Role preset selector — reorders the menu below */}
        <div
          className="px-5 pt-3 pb-3 border-b border-border/40"
          data-testid="menu-role-selector"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            View as
          </p>
          <div className="flex flex-wrap gap-1">
            {ROLES.map((r) => {
              const isActive = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  data-testid={`menu-role-${r}`}
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors ${
                    isActive
                      ? "bg-sky-500/20 border-sky-400/60 text-sky-700 dark:text-sky-200"
                      : "bg-transparent border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {ROLE_LABELS[r]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Safe Mode row */}
        <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert
              className={`w-4 h-4 ${safeMode ? "text-amber-400" : "text-muted-foreground"}`}
            />
            <div className="min-w-0">
              <div className="text-[12px] font-bold uppercase tracking-wider">
                Safe Mode
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                {safeMode
                  ? "AI calls, manual publishing actions, and uploads disabled"
                  : "Tap to disable AI calls, manual publishing actions, and uploads"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSafeMode(!safeMode)}
            data-testid="menu-safe-mode-toggle"
            aria-pressed={safeMode}
            className={`shrink-0 h-7 px-3 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
              safeMode
                ? "bg-amber-500/20 border-amber-400/60 text-amber-700 dark:text-amber-200"
                : "bg-transparent border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {safeMode ? "On" : "Off"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {helpItem && (
            <div className="px-3 pb-1">
              <button
                onClick={() => {
                  onSelect("help");
                  onOpenChange(false);
                }}
                data-testid="menu-item-help"
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left border transition-colors ${
                  active === "help"
                    ? "border-sky-400/60 bg-sky-500/10"
                    : "border-border/60 bg-card hover:border-sky-400/50 hover:bg-sky-500/[0.06]"
                }`}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${helpItem.color}1A`,
                    color: helpItem.color,
                  }}
                >
                  <helpItem.icon className="w-[18px] h-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-bold uppercase tracking-wide">
                    {helpItem.label}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {helpItem.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
              </button>
            </div>
          )}

          {MENU_SECTIONS.map((section) => (
            <div key={section.label} className="pt-1.5">
              <div className="px-5 pt-2 pb-1 flex items-baseline gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-foreground/75">
                  {section.label}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  {section.hint}
                </span>
              </div>
              {sectionItems(section.ids).map((item, idx) =>
                renderItem(item, idx),
              )}
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border/40 text-[10px] text-muted-foreground">
          v2 · Hip · Rap · Music · Sports · Fit · Canna · HMG
        </div>
      </SheetContent>
    </Sheet>
  );
}
