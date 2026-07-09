import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect } from "react";
import { installMobileLifecycle } from "@/lib/mobileLifecycle";
import { installLeakWatchdog } from "@/lib/leakWatchdog";
import { startBackpressure } from "@/lib/backpressure";
import { initTheme } from "@/components/ThemeToggle";

// Apply the saved (or default-dark) theme synchronously at module load so the
// app never flashes the wrong theme before React mounts.
initTheme();

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Werewolf transformation: install lifecycle gate, leak watchdog, and
  // backpressure poller exactly once at the app root. Each is idempotent
  // and pauses itself when the tab is hidden.
  useEffect(() => {
    const offLifecycle = installMobileLifecycle();
    const offWatchdog = installLeakWatchdog();
    const offBackpressure = startBackpressure();
    return () => {
      offLifecycle();
      offWatchdog();
      offBackpressure();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary moduleId="app" moduleName="HMG Newsroom">
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </ErrorBoundary>
        <Toaster 
          position="top-center" 
          toastOptions={{
            className: "rounded-xl border-border bg-background/80 backdrop-blur-xl"
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
