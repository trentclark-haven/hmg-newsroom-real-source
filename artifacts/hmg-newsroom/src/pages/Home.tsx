import React, { Suspense, lazy, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Flame, Music, Trophy, Dumbbell, Leaf, Newspaper, Menu, ChartBar as BarChart3, History, Loader as Loader2 } from "lucide-react";
import { verticals } from "@/lib/mock-data";
import { TabContent } from "@/components/newsroom/TabContent";
import { StatsDashboard } from "@/components/newsroom/StatsDashboard";
import { OutputHistory } from "@/components/newsroom/OutputHistory";
import {
  MenuOverlay,
  MENU_ITEMS,
  type View,
} from "@/components/newsroom/MenuOverlay";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { viewToModuleId } from "@/lib/hmg/recoveryCenter";
import { motion } from "framer-motion";

const QuickLaunchView = lazy(() =>
  import("@/components/newsroom/QuickLaunchView").then((m) => ({
    default: m.QuickLaunchView,
  })),
);
const SEOMasterView = lazy(() =>
  import("@/components/newsroom/SEOMasterView").then((m) => ({
    default: m.SEOMasterView,
  })),
);
const ArtBotView = lazy(() =>
  import("@/components/newsroom/ArtBotView").then((m) => ({
    default: m.ArtBotView,
  })),
);
const CutMasterView = lazy(() =>
  import("@/components/newsroom/CutMasterView").then((m) => ({
    default: m.CutMasterView,
  })),
);
const WPConnectionsView = lazy(() =>
  import("@/components/newsroom/WPConnectionsView").then((m) => ({
    default: m.WPConnectionsView,
  })),
);
const CommandCenterView = lazy(() =>
  import("@/components/newsroom/CommandCenterView").then((m) => ({
    default: m.CommandCenterView,
  })),
);
const SocialFactoryView = lazy(() =>
  import("@/components/newsroom/SocialFactoryView").then((m) => ({
    default: m.SocialFactoryView,
  })),
);
const ClipBrandView = lazy(() =>
  import("@/components/newsroom/ClipBrandView").then((m) => ({
    default: m.ClipBrandView,
  })),
);
const StationSchedulerView = lazy(() =>
  import("@/components/newsroom/StationSchedulerView").then((m) => ({
    default: m.StationSchedulerView,
  })),
);
const AIStaffView = lazy(() =>
  import("@/components/newsroom/AIStaffView").then((m) => ({
    default: m.AIStaffView,
  })),
);
const CorpusView = lazy(() =>
  import("@/components/newsroom/CorpusView").then((m) => ({
    default: m.CorpusView,
  })),
);
const HavenAIControlCenter = lazy(() =>
  import("@/components/newsroom/HavenAIControlCenter").then((m) => ({
    default: m.HavenAIControlCenter,
  })),
);
const MediaLibraryView = lazy(() =>
  import("@/components/newsroom/MediaLibraryView").then((m) => ({
    default: m.MediaLibraryView,
  })),
);
const SalesPipelineView = lazy(() =>
  import("@/components/newsroom/SalesPipelineView").then((m) => ({
    default: m.SalesPipelineView,
  })),
);
const AssignmentCenterView = lazy(() =>
  import("@/components/newsroom/AssignmentCenterView").then((m) => ({
    default: m.AssignmentCenterView,
  })),
);
const AuditLogView = lazy(() =>
  import("@/components/newsroom/AuditLogView").then((m) => ({
    default: m.AuditLogView,
  })),
);
const RecoveryCenterView = lazy(() =>
  import("@/components/newsroom/RecoveryCenterView").then((m) => ({
    default: m.RecoveryCenterView,
  })),
);
const HelpGuideView = lazy(() =>
  import("@/components/newsroom/HelpGuideView").then((m) => ({
    default: m.HelpGuideView,
  })),
);
const FounderKnowledgeBaseView = lazy(() =>
  import("@/components/newsroom/FounderKnowledgeBaseView").then((m) => ({
    default: m.FounderKnowledgeBaseView,
  })),
);
const WordPressDraftHistoryView = lazy(() =>
  import("@/components/newsroom/WordPressDraftHistoryView").then((m) => ({
    default: m.WordPressDraftHistoryView,
  })),
);
const AICapabilityMatrixView = lazy(() =>
  import("@/components/newsroom/AICapabilityMatrixView").then((m) => ({
    default: m.AICapabilityMatrixView,
  })),
);
const OperatorReadinessView = lazy(() =>
  import("@/components/newsroom/OperatorReadinessView").then((m) => ({
    default: m.OperatorReadinessView,
  })),
);
const HavenAIEngineView = lazy(() =>
  import("@/components/newsroom/HavenAIEngineView").then((m) => ({
    default: m.HavenAIEngineView,
  })),
);
const BackendStatusView = lazy(() =>
  import("@/components/newsroom/BackendStatusView").then((m) => ({
    default: m.BackendStatusView,
  }))
);
const ARTBOTEditorialDeskView = lazy(() =>
  import("@/components/newsroom/ARTBOTEditorialDeskView").then((m) => ({
    default: m.ARTBOTEditorialDeskView,
  })),
);
const MobileAppReadinessView = lazy(() =>
  import("@/components/newsroom/MobileAppReadinessView").then((m) => ({
    default: m.MobileAppReadinessView,
  })),
);
const SessionRecapView = lazy(() =>
  import("@/components/newsroom/SessionRecapView").then((m) => ({
    default: m.SessionRecapView,
  })),
);

function ViewSpinner() {
  return (
    <div
      className="flex-1 flex items-center justify-center"
      data-testid="view-loading-spinner"
    >
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

const iconMap: Record<string, React.ElementType> = {
  Mic,
  Flame,
  Music,
  Trophy,
  Dumbbell,
  Leaf,
  Newspaper,
};

const HMG_LAST_VIEW_KEY = "hmg-last-view-v1";

export default function Home() {
  const [activeTab, setActiveTab] = useState(verticals[0].id);
  const [statsOpen, setStatsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setViewState] = useState<View>(() => {
    if (typeof window === "undefined") return "quicklaunch";
    const requested = new URLSearchParams(window.location.search).get("view");
    if (requested && MENU_ITEMS.some((m) => m.id === requested)) {
      return requested as View;
    }
    const saved = window.localStorage.getItem(HMG_LAST_VIEW_KEY);
    if (saved && MENU_ITEMS.some((m) => m.id === saved)) {
      return saved as View;
    }
    return "quicklaunch";
  });

  const setView = (v: View) => {
    setViewState(v);
    try {
      window.localStorage.setItem(HMG_LAST_VIEW_KEY, v);
    } catch {
      /* ignore quota errors */
    }
  };

  const activeVertical = verticals.find((v) => v.id === activeTab)!;
  const activeMenu = MENU_ITEMS.find((m) => m.id === view)!;

  const navigateTo = (v: string) => setView(v as View);

  const openEditorial = (verticalId: string) => {
    setActiveTab(verticalId);
    setView("newsroom");
  };

  // For non-Editorial Desk views, header brand color comes from the menu item.
  const brandColor =
    view === "newsroom" ? activeVertical.color : activeMenu.color;
  const brandBg =
    view === "newsroom" ? activeVertical.accentBg : activeMenu.color;
  const brandOn =
    view === "newsroom" ? activeVertical.onAccent : "#ffffff";

  return (
    <div
      className="hmg-paper-mode flex flex-col h-[100dvh] lg:h-auto lg:min-h-screen w-full max-w-[640px] lg:max-w-[1280px] xl:max-w-[1440px] mx-auto bg-background text-foreground overflow-hidden lg:overflow-visible"
      style={
        {
          "--brand": brandColor,
          "--brand-bg": brandBg,
          "--brand-on": brandOn,
        } as React.CSSProperties
      }
    >
      {/* Header */}
      <header className="flex-none px-4 py-3 border-b border-border/70 bg-card/85 backdrop-blur-xl z-10 sticky top-0 pt-[max(env(safe-area-inset-top),0.75rem)] shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-500 shadow-lg overflow-hidden"
              style={{
                background:
                  view === "newsroom" && activeVertical.logo
                    ? "transparent"
                    : brandBg,
                color: brandOn,
              }}
            >
              {view === "newsroom" && activeVertical.logo ? (
                <img
                  src={activeVertical.logo}
                  alt={activeVertical.name}
                  className="w-full h-full object-contain"
                />
              ) : view === "newsroom" ? (
                <span className="font-black tracking-tight text-[11px]">
                  HMG
                </span>
              ) : (
                <activeMenu.icon className="w-5 h-5" />
              )}
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide leading-none">
                {view === "quicklaunch"
                  ? "QUICK LAUNCH"
                  : view === "newsroom"
                    ? "EDITORIAL DESK"
                    : activeMenu.label.toUpperCase()}
              </h1>
              <p
                className="text-[10px] font-semibold transition-colors duration-500 uppercase tracking-[0.15em] leading-none mt-1"
                style={{ color: brandColor }}
              >
                {view === "quicklaunch"
                  ? "Haven Media Group"
                  : view === "newsroom"
                    ? activeVertical.name
                    : "Haven Media Group"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setHistoryOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
              aria-label="Output history"
              data-testid="header-history"
            >
              <History className="w-5 h-5" />
            </button>
            {view !== "quicklaunch" && (
              <button
                onClick={() => setStatsOpen(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
                aria-label="Editorial Desk stats"
                data-testid="header-stats"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setMenuOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
              aria-label="Open menu"
              data-testid="header-menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <StatsDashboard open={statsOpen} onOpenChange={setStatsOpen} />
      <OutputHistory open={historyOpen} onOpenChange={setHistoryOpen} onNavigate={navigateTo} />
      <MenuOverlay
        open={menuOpen}
        onOpenChange={setMenuOpen}
        active={view}
        onSelect={setView}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden lg:overflow-visible pb-[env(safe-area-inset-bottom)]">
        {view === "newsroom" && (
          <ErrorBoundary
            key="newsroom"
            moduleId="newsroom"
            moduleName="Editorial Desk"
            onReset={() => setActiveTab(verticals[0].id)}
            onOpenHealth={() => setView("recovery")}
          >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col w-full px-4 lg:px-8 pt-2"
          >
            {/* Scrollable Tab Strip */}
            <div className="relative px-1 pb-2 mb-2">
              <TabsList className="h-auto p-1 bg-muted/30 rounded-2xl flex flex-wrap w-full justify-start border border-border/20">
                {verticals.map((v) => {
                  const Icon = iconMap[v.icon] ?? Newspaper;
                  const isActive = activeTab === v.id;
                  return (
                    <TabsTrigger
                      key={v.id}
                      value={v.id}
                      className="relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground/80 data-[state=active]:font-semibold whitespace-nowrap"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-tab-bg"
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background: v.accentBg,
                            opacity: 0.18,
                          }}
                          initial={false}
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.6,
                          }}
                        />
                      )}
                      {v.logo ? (
                        <img
                          src={v.logo}
                          alt=""
                          className="w-5 h-5 z-10 object-contain"
                        />
                      ) : (
                        <Icon
                          className="w-4 h-4 z-10"
                          style={{
                            color: isActive ? v.color : "currentColor",
                          }}
                        />
                      )}
                      <span className="z-10">{v.name}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 relative overflow-hidden lg:overflow-visible">
              {verticals.map((v) => (
                <TabsContent
                  key={v.id}
                  value={v.id}
                  className="h-full lg:h-auto m-0 outline-none data-[state=inactive]:hidden"
                  forceMount
                >
                  <TabContent verticalId={v.id} />
                </TabsContent>
              ))}
            </div>
          </Tabs>
          </ErrorBoundary>
        )}

        {view !== "newsroom" && (
          <ErrorBoundary
            key={view}
            moduleId={viewToModuleId(view)}
            moduleName={activeMenu.label}
            onReset={() => setView("newsroom")}
            onOpenHealth={() => setView("recovery")}
          >
          <Suspense fallback={<ViewSpinner />}>
            {view === "quicklaunch" && (
              <QuickLaunchView
                onSelectView={setView}
                onOpenEditorial={openEditorial}
              />
            )}
            {view === "recovery" && <RecoveryCenterView />}
            {view === "commandcenter" && <CommandCenterView onNavigate={setView} />}
            {view === "socialfactory" && <SocialFactoryView />}
            {view === "seomaster" && <SEOMasterView />}
            {view === "artbot" && <ArtBotView />}
            {view === "cutmaster" && <CutMasterView />}
            {view === "clipbrand" && <ClipBrandView />}
            {view === "stationscheduler" && <StationSchedulerView />}
            {view === "corpus" && <CorpusView />}
            {view === "havenai" && <HavenAIControlCenter />}
            {view === "aistaff" && <AIStaffView />}
            {view === "medialibrary" && <MediaLibraryView />}
            {view === "sales" && <SalesPipelineView />}
            {view === "assignments" && <AssignmentCenterView />}
            {view === "auditlog" && <AuditLogView />}
            {view === "wpconnections" && <WPConnectionsView />}
            {view === "help" && <HelpGuideView />}
            {view === "founderkb" && <FounderKnowledgeBaseView />}
            {view === "wp-draft-history" && (
              <div className="flex-1 flex flex-col overflow-hidden px-4 lg:px-8 py-4">
                <WordPressDraftHistoryView onNavigate={navigateTo} />
              </div>
            )}
            {view === "aicapability" && <HavenAIEngineView onNavigate={setView} />}
            {view === "operatorreadiness" && <OperatorReadinessView />}
            {view === "artboteditorial" && <ARTBOTEditorialDeskView />}
            {view === "backendstatus" && <BackendStatusView onNavigate={setView} />}
            {view === "mobileappstatus" && <MobileAppReadinessView />}
            {view === "sessionrecap" && <SessionRecapView onNavigate={setView} />}
          </Suspense>
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}
