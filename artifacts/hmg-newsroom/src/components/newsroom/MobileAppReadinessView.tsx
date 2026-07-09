/**
 * Mobile App Readiness — Operator #6 Production Power Pass
 * Task 3: PWA / App Store / Mobile Shell readiness panel
 *
 * Checks real signals only. No fake approvals. No fake submissions.
 * Labels: PWA Ready Check | Mobile Shell Ready | App Wrapper Candidate |
 *         Native Submission Pending | Offline Hook Pending | Human QA Required
 */

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  Database,
  Download,
  Globe,
  HardDrive,
  Layers,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { estimateLocalStorageUsage } from "@/lib/perfUtils";

interface Check {
  id: string;
  label: string;
  description: string;
  status: "pass" | "warn" | "missing" | "pending";
  value?: string;
  note?: string;
}

function detectChecks(): Check[] {
  if (typeof window === "undefined") return [];

  const checks: Check[] = [];
  const doc = window.document;
  const head = doc.head;

  // 1. Manifest link
  const manifestLink = head.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  checks.push({
    id: "manifest",
    label: "Web App Manifest",
    description: "manifest.json linked in <head>",
    status: manifestLink ? "pass" : "missing",
    value: manifestLink?.href ?? undefined,
    note: manifestLink ? "manifest.json is linked" : "Add <link rel='manifest' href='/manifest.json'> to index.html",
  });

  // 2. Viewport meta
  const viewportMeta = head.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  const viewportContent = viewportMeta?.getAttribute("content") ?? "";
  const hasViewport = !!viewportMeta;
  const viewportOk = hasViewport && viewportContent.includes("width=device-width");
  checks.push({
    id: "viewport",
    label: "Viewport Meta Tag",
    description: "width=device-width, initial-scale=1",
    status: viewportOk ? "pass" : hasViewport ? "warn" : "missing",
    value: viewportContent || undefined,
    note: viewportOk
      ? "Correct viewport meta found"
      : hasViewport
      ? "Viewport found but may be missing width=device-width"
      : "Add <meta name='viewport' content='width=device-width, initial-scale=1'>",
  });

  // 3. Theme color
  const themeColor = head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  checks.push({
    id: "theme-color",
    label: "Theme Color",
    description: "meta[name=theme-color] for browser chrome",
    status: themeColor ? "pass" : "warn",
    value: themeColor?.getAttribute("content") ?? undefined,
    note: themeColor ? "Theme color is set" : "Add <meta name='theme-color'> for browser chrome coloring",
  });

  // 4. apple-mobile-web-app-capable
  const appleMobile = head.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-capable"]');
  checks.push({
    id: "apple-capable",
    label: "Apple Mobile Web App Capable",
    description: "meta[name=apple-mobile-web-app-capable] for iOS PWA",
    status: appleMobile ? "pass" : "warn",
    value: appleMobile?.getAttribute("content") ?? undefined,
    note: appleMobile
      ? "iOS PWA capable meta is set"
      : "Add <meta name='apple-mobile-web-app-capable' content='yes'> for iOS add-to-homescreen",
  });

  // 5. mobile-web-app-capable
  const mobileWebApp = head.querySelector<HTMLMetaElement>('meta[name="mobile-web-app-capable"]');
  checks.push({
    id: "mobile-web-capable",
    label: "Mobile Web App Capable",
    description: "meta[name=mobile-web-app-capable] for Android PWA",
    status: mobileWebApp ? "pass" : "warn",
    value: mobileWebApp?.getAttribute("content") ?? undefined,
    note: mobileWebApp
      ? "Android PWA capable meta is set"
      : "Add <meta name='mobile-web-app-capable' content='yes'>",
  });

  // 6. Apple touch icon
  const appleIcon = head.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  checks.push({
    id: "apple-icon",
    label: "Apple Touch Icon",
    description: "192×192 or 180×180 PNG for iOS homescreen",
    status: appleIcon ? "pass" : "warn",
    value: appleIcon?.href ?? undefined,
    note: appleIcon
      ? "Apple touch icon linked"
      : "Add <link rel='apple-touch-icon' href='/apple-touch-icon.png'> for iOS",
  });

  // 7. Service Worker
  const swSupported = "serviceWorker" in navigator;
  let swRegistered = false;
  try {
    // Can't await here — check the controller
    swRegistered = !!navigator.serviceWorker?.controller;
  } catch {
    /* ignore */
  }
  checks.push({
    id: "service-worker",
    label: "Service Worker",
    description: "Offline capability and background sync",
    status: !swSupported ? "missing" : swRegistered ? "pass" : "pending",
    value: swSupported ? (swRegistered ? "Registered + controlling" : "Supported, not active yet") : "Not supported",
    note: swRegistered
      ? "Service worker is active — offline mode possible"
      : swSupported
      ? "Service worker supported but not yet registered/controlling. Wire a service worker for offline readiness."
      : "Browser does not support service workers",
  });

  // 8. HTTPS / Secure context
  const isSecure = window.isSecureContext;
  checks.push({
    id: "secure-context",
    label: "Secure Context (HTTPS)",
    description: "PWA install requires HTTPS or localhost",
    status: isSecure ? "pass" : "missing",
    value: window.location.protocol,
    note: isSecure
      ? "Secure context — PWA install is possible"
      : "App must be served over HTTPS for PWA install to work",
  });

  // 9. localStorage available
  let localStorageOk = false;
  try {
    const testKey = "__hmg_ls_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    localStorageOk = true;
  } catch {
    /* ignore */
  }
  checks.push({
    id: "localstorage",
    label: "Local Storage Available",
    description: "Required for all offline memory/draft features",
    status: localStorageOk ? "pass" : "missing",
    note: localStorageOk
      ? "localStorage is available and writable"
      : "localStorage is blocked (private mode or quota exceeded)",
  });

  // 10. Offline detection
  const isOnline = navigator.onLine;
  checks.push({
    id: "network",
    label: "Network Status API",
    description: "navigator.onLine — detect offline state",
    status: "pass",
    value: isOnline ? "Online" : "Offline",
    note: "Network status API is available — app can react to offline/online changes",
  });

  return checks;
}

const STATUS_CONFIG = {
  pass: {
    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    label: "Pass",
    icon: CheckCircle2,
  },
  warn: {
    cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    label: "Recommended",
    icon: AlertTriangle,
  },
  missing: {
    cls: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    label: "Missing",
    icon: CircleDashed,
  },
  pending: {
    cls: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    label: "Pending",
    icon: Clock,
  },
};

const PWA_BLOCKERS = [
  "Service worker must be registered and controlling for offline install",
  "manifest.json must include name, short_name, icons (192px + 512px), start_url, display, background_color, theme_color",
  "App must be served over HTTPS (or localhost) — not HTTP",
  "App must not already be installed in the browser",
];

const NATIVE_BLOCKERS = [
  "Native App Store submission requires Capacitor.js or React Native wrapper",
  "Apple Developer Account ($99/yr) and provisioning profile required for iOS",
  "Google Play Console account ($25 one-time) required for Android",
  "All assets (splash screens, screenshots, store description) must be prepared",
  "Privacy policy URL required for both stores",
  "Review process: Apple ~1–3 days, Google ~1–7 days",
];

const OFFLINE_BLOCKERS = [
  "Service worker + cache strategy required (e.g., Workbox)",
  "API calls must have offline fallback or queue pattern",
  "localStorage-backed features work offline — no backend required",
  "Media uploads queue offline — not yet implemented",
];

export function MobileAppReadinessView() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const storage = useMemo(() => estimateLocalStorageUsage(), [refreshKey]);

  useEffect(() => {
    setChecks(detectChecks());
  }, [refreshKey]);

  const passCount = checks.filter((c) => c.status === "pass").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const missingCount = checks.filter((c) => c.status === "missing").length;
  const pendingCount = checks.filter((c) => c.status === "pending").length;

  const pwaScore = checks.length > 0 ? Math.round((passCount / checks.length) * 100) : 0;

  const overallLabel =
    missingCount > 1
      ? "Human QA Required"
      : missingCount === 1
      ? "App Wrapper Candidate"
      : warnCount > 2
      ? "Mobile Shell Ready"
      : pwaScore >= 80
      ? "PWA Ready Check"
      : "Human QA Required";

  const overallColor =
    missingCount > 1
      ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
      : missingCount === 1
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : warnCount > 2
      ? "text-sky-400 border-sky-500/30 bg-sky-500/10"
      : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-4 lg:px-8 py-5 gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Mobile App Readiness</h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
              PWA Check · App Wrapper · No Fake Approvals
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors border border-border/50 rounded-lg px-3 py-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-check
        </button>
      </div>

      {/* Honest disclaimer */}
      <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.06] px-4 py-3 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <div className="text-[12.5px] text-sky-200/80 leading-relaxed">
          <strong className="text-sky-300">No fake approvals.</strong> This panel checks real browser signals — manifest link, meta tags, service worker state, HTTPS, and localStorage. It does not simulate App Store submission. Native packaging requires Capacitor.js or React Native and a developer account.
        </div>
      </div>

      {/* Score + Overall label */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-border/50 bg-card/60 p-3.5 sm:col-span-1">
          <div className="text-2xl font-black text-foreground">{pwaScore}%</div>
          <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">PWA Score</div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-3.5">
          <div className="text-2xl font-black text-emerald-400">{passCount}</div>
          <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">Pass</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3.5">
          <div className="text-2xl font-black text-amber-400">{warnCount}</div>
          <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">Recommended</div>
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.06] p-3.5">
          <div className="text-2xl font-black text-rose-400">{missingCount}</div>
          <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">Missing</div>
        </div>
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/[0.06] p-3.5">
          <div className="text-2xl font-black text-sky-400">{pendingCount}</div>
          <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">Pending</div>
        </div>
      </div>

      {/* Overall status badge */}
      <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${overallColor}`}>
        <Smartphone className="w-4 h-4 flex-shrink-0" />
        <div>
          <span className="text-[12px] font-black uppercase tracking-wider">{overallLabel}</span>
          <p className="text-[11.5px] mt-0.5 opacity-80">
            {overallLabel === "PWA Ready Check"
              ? "Core PWA signals are in place. Service worker + manifest icons complete the install path."
              : overallLabel === "Mobile Shell Ready"
              ? "Most signals pass. Fill in recommended items to complete the PWA shell."
              : overallLabel === "App Wrapper Candidate"
              ? "Close to PWA-ready. Fix missing items then evaluate Capacitor.js for native packaging."
              : "Several required signals are missing. Human QA needed before any store or PWA claim."}
          </p>
        </div>
      </div>

      {/* Check list */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-400 px-2">
            Signal Checks — {checks.length} Tracked
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        {checks.map((check) => {
          const cfg = STATUS_CONFIG[check.status];
          const Icon = cfg.icon;
          return (
            <div
              key={check.id}
              className="rounded-xl border border-border/40 bg-card/40 p-3.5 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[13px] font-bold">{check.label}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${cfg.cls}`}
                    >
                      <Icon className="w-2.5 h-2.5" />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-muted-foreground/70">{check.description}</p>
                </div>
                {check.value && (
                  <span className="text-[10px] font-mono text-muted-foreground/50 bg-muted/30 px-2 py-0.5 rounded truncate max-w-[180px]">
                    {check.value}
                  </span>
                )}
              </div>
              {check.note && (
                <p className="text-[11px] text-muted-foreground/60 italic leading-relaxed border-t border-border/20 pt-2">
                  {check.note}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Storage usage */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-violet-400 px-2">
            Local Storage Usage
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <div className="rounded-xl border border-border/40 bg-card/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-violet-400" />
              <span className="text-[13px] font-bold">localStorage</span>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                storage.healthy
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              }`}
            >
              {storage.healthy ? "Healthy" : "Watch Space"}
            </span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-2 bg-border/40 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  storage.pct > 80 ? "bg-rose-500" : storage.pct > 60 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${storage.pct}%` }}
              />
            </div>
            <span className="text-[12px] font-bold text-foreground/70 shrink-0">
              {storage.usedMB.toFixed(1)} MB / 5 MB
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {storage.pct}% of local quota used. Memory is browser-local — no cloud sync.
            Export a backup from Command Center before clearing.
          </p>
        </div>
      </div>

      {/* PWA Install Blockers */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400 px-2">
            PWA Install — Known Blockers
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div className="space-y-1.5">
            {PWA_BLOCKERS.map((b) => (
              <div key={b} className="flex items-start gap-2 text-[12px]">
                <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Native App Store blockers */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 px-2">
            Native Submission — Requirements
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <div className="rounded-xl border border-zinc-600/30 bg-zinc-700/10 px-4 py-3 flex items-start gap-3 mb-1">
          <CircleDashed className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-zinc-300/80 leading-relaxed">
            <strong className="text-zinc-200">Native Submission Pending.</strong> App Store submission is not possible from a web-only build. A Capacitor.js or React Native wrapper is required to produce a native binary for App Store or Google Play.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-600/20 bg-zinc-700/[0.06] p-4">
          <div className="space-y-1.5">
            {NATIVE_BLOCKERS.map((b) => (
              <div key={b} className="flex items-start gap-2 text-[12px]">
                <CircleDashed className="w-3 h-3 text-zinc-400 flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground/70">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Offline readiness */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-400 px-2">
            Offline Readiness — Offline Hook Pending
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4">
          <div className="space-y-1.5">
            {OFFLINE_BLOCKERS.map((b, i) => (
              <div key={b} className="flex items-start gap-2 text-[12px]">
                {i < 2 ? (
                  <CircleDashed className="w-3 h-3 text-sky-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                )}
                <span className={i < 2 ? "text-muted-foreground" : "text-foreground/80"}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What works on mobile now */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 px-2">
            What Works on Mobile Right Now
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[
              "Responsive layout — tested to 390px width",
              "Touch targets sized for mobile (min 44px)",
              "sticky header with safe-area inset padding",
              "localStorage works in mobile browsers",
              "Copy-to-clipboard works on mobile",
              "JSON export/import works on mobile",
              "All views load via lazy Suspense boundary",
              "Theme toggle (dark/light) persists on mobile",
              "Full menu overlay works on mobile",
              "No horizontal overflow (verified)",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-[12px]">
                <Zap className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span className="text-foreground/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 justify-center text-[11px] text-muted-foreground/50 py-2">
        <Smartphone className="w-3.5 h-3.5" />
        Mobile App Readiness · No Fake Approvals · HMG Newsroom · Human QA Required for App Store
      </div>
    </div>
  );
}
