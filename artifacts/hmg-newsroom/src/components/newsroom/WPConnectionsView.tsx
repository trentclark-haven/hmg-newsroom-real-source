import { useState } from "react";
import { verticals } from "@/lib/mock-data";
import { useWPSettings } from "@/lib/useWPSettings";
import { WPDiagnosticsPanel } from "./WPDiagnosticsPanel";
import { ManualPublishPanel } from "./ManualPublishPanel";
import {
  useGetWordpressStatus,
  type Silo as ApiSilo,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Globe,
  KeyRound,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface SiloRowProps {
  silo: string;
  siloName: string;
  brand: { color: string; bg: string; on: string };
}

function safeWpAdminUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `${u.origin}/wp-admin`;
  } catch {
    return null;
  }
}

function SiloRow({ silo, siloName, brand }: SiloRowProps) {
  const { creds, save, remove } = useWPSettings(silo);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(creds?.url ?? "");
  const [user, setUser] = useState(creds?.user ?? "");
  const [password, setPassword] = useState(creds?.password ?? "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<
    { ok: boolean; message: string } | null
  >(null);

  // Env-side status (independent of browser-saved creds, so the user can see
  // which credential source is actually in play).
  const envStatusQuery = useGetWordpressStatus({ silo: silo as ApiSilo });
  const envConfigured = envStatusQuery.data?.configured ?? false;
  const envSiteUrl = envStatusQuery.data?.siteUrl ?? "";

  function toggleOpen() {
    if (!open) {
      setUrl(creds?.url ?? "");
      setUser(creds?.user ?? "");
      setPassword(creds?.password ?? "");
      setTestResult(null);
    }
    setOpen((v) => !v);
  }

  async function handleTest() {
    if (!url.trim() || !user.trim() || !password.trim()) {
      setTestResult({ ok: false, message: "Fill in all three fields first." });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const apiBase = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");
      const res = await fetch(`${apiBase}/wordpress/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          silo,
          overrideUrl: url.trim(),
          overrideUser: user.trim(),
          overridePassword: password.trim(),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        siteUrl?: string;
        user?: string;
        message?: string;
      };
      if (data.ok) {
        setTestResult({
          ok: true,
          message: `Connected to ${data.siteUrl ?? url.trim()}${
            data.user ? ` as ${data.user}` : ""
          }`,
        });
      } else {
        setTestResult({
          ok: false,
          message: data.message ?? "Server rejected the credentials.",
        });
      }
    } catch (err) {
      setTestResult({
        ok: false,
        message:
          err instanceof Error ? err.message : "Network error talking to API.",
      });
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    if (!url.trim() || !user.trim() || !password.trim()) {
      toast.error("Fill in all three fields before saving.");
      return;
    }
    save({ url: url.trim(), user: user.trim(), password: password.trim() });
    toast.success(`${siloName} credentials saved`, {
      style: { background: brand.bg, color: brand.on, border: "none" },
    });
  }

  function handleClear() {
    remove();
    setUrl("");
    setUser("");
    setPassword("");
    setTestResult(null);
    toast.success(`${siloName} credentials cleared`);
  }

  function copy(text: string, label: string) {
    if (!text) {
      toast.error(`${label} is empty.`);
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(`Copied ${label}`))
      .catch(() => toast.error("Copy failed"));
  }

  // Login helper sources: prefer browser creds, then env-resolved siteUrl.
  const helperUrl = creds?.url || envSiteUrl || url;
  const helperUser = creds?.user || user;
  const wpAdminUrl = safeWpAdminUrl(helperUrl);

  const browserOk = !!creds;

  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 overflow-hidden">
      <button
        onClick={toggleOpen}
        data-testid={`wp-row-${silo}`}
        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-foreground/[0.03] transition-colors"
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: brand.bg, color: brand.on }}
        >
          <Globe className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[13px] font-bold uppercase tracking-wide"
              style={{ color: brand.color }}
            >
              {siloName}
            </span>
            <span
              data-testid={`wp-env-status-${silo}`}
              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                envConfigured
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-zinc-700/40 text-muted-foreground"
              }`}
              title="Env vars configured server-side"
            >
              env: {envConfigured ? "set" : "off"}
            </span>
            <span
              data-testid={`wp-browser-status-${silo}`}
              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                browserOk
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-zinc-700/40 text-muted-foreground"
              }`}
              title="Browser-saved credentials"
            >
              browser: {browserOk ? "saved" : "off"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {creds?.url ?? envSiteUrl ?? "No credentials saved yet"}
          </p>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/40 pt-3">
          {/* Login helper */}
          <div className="rounded-lg border border-border/40 bg-secondary/30 p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/90">
              <KeyRound className="w-3.5 h-3.5" />
              Login helper
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">
              Use the dashboard password (the one you log into{" "}
              <span className="font-mono">/wp-admin</span> with) for the link
              below. The <strong>Application Password</strong> field on this
              page is a separate, machine-only token generated at{" "}
              <span className="font-mono">
                Users → Profile → Application Passwords
              </span>{" "}
              — do not type that into the dashboard login.
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {wpAdminUrl ? (
                <a
                  href={wpAdminUrl}
                  target="_blank"
                  rel="noreferrer"
                  data-testid={`wp-login-url-${silo}`}
                  className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border/60 hover:border-foreground/40 text-foreground/90"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open {wpAdminUrl}
                </a>
              ) : (
                <span
                  data-testid={`wp-login-url-${silo}`}
                  className="text-[11px] text-muted-foreground italic"
                >
                  Add a Site URL to enable the dashboard link
                </span>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                onClick={() =>
                  copy(wpAdminUrl ?? helperUrl ?? "", "login URL")
                }
                data-testid={`wp-copy-login-${silo}`}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy login URL
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                onClick={() => copy(helperUser ?? "", "username")}
                data-testid={`wp-copy-user-${silo}`}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy username
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider">
              Site URL
            </Label>
            <Input
              data-testid={`wp-url-${silo}`}
              placeholder="https://www.example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoComplete="off"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider">
              Username
            </Label>
            <Input
              data-testid={`wp-user-${silo}`}
              placeholder="editor"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoComplete="off"
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider">
              Application Password (machine token)
            </Label>
            <Input
              data-testid={`wp-pass-${silo}`}
              type="password"
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              className="h-9"
            />
            <p className="text-[10px] text-muted-foreground">
              Stored only in this browser. Never displayed after refresh.
            </p>
          </div>
          {testResult && (
            <div
              className={`text-[12px] rounded-md border px-2.5 py-1.5 inline-flex items-center gap-1.5 ${
                testResult.ok
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                  : "border-red-500/30 bg-red-500/5 text-red-300"
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              {testResult.message}
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={testing}
              onClick={handleTest}
              className="h-8"
            >
              {testing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              data-testid={`wp-save-${silo}`}
              className="h-8"
              style={{ background: brand.bg, color: brand.on }}
            >
              Save
            </Button>
            {creds && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function WPConnectionsView() {
  return (
    <div className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "#F59E0B", color: "#1a1410" }}
        >
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-black tracking-tight leading-none">
            WP Connections
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            Manage WordPress credentials for all 7 silos · saved in this
            browser, never shipped over the wire as a query param
          </p>
        </div>
      </div>

      <div
        className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-[12px] leading-snug text-foreground/85"
        data-testid="wp-kodee-note"
      >
        <p className="font-bold text-amber-300 mb-0.5">
          Hosting check — Kodee (Hostinger support)
        </p>
        <p>
          Hosting layer reports healthy. The reviewed edge IP <code className="text-foreground">34.148.87.135</code> is not blocked.
          raphaven.com root returns HTTP 200 from the host side. Re-run the six-site app-side probe below
          to confirm REST / Application Password / draft POST from inside the app.
        </p>
      </div>

      <WPDiagnosticsPanel />

      <ManualPublishPanel />

      <div className="space-y-2 mt-2">
        {verticals.map((v) => (
          <SiloRow
            key={v.id}
            silo={v.id}
            siloName={v.name}
            brand={{ color: v.color, bg: v.accentBg, on: v.onAccent }}
          />
        ))}
      </div>
    </div>
  );
}
