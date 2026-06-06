import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWPSettings } from "@/lib/useWPSettings";
import { CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface WPSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  silo: string;
  siloName: string;
  brand: { bg: string; on: string; color: string };
}

export function WPSettingsModal({
  open,
  onOpenChange,
  silo,
  siloName,
  brand,
}: WPSettingsModalProps) {
  const { creds, save, remove } = useWPSettings(silo);
  const [url, setUrl] = useState(creds?.url ?? "");
  const [user, setUser] = useState(creds?.user ?? "");
  const [password, setPassword] = useState(creds?.password ?? "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<
    { ok: boolean; message: string } | null
  >(null);

  useEffect(() => {
    if (open) {
      setUrl(creds?.url ?? "");
      setUser(creds?.user ?? "");
      setPassword(creds?.password ?? "");
      setTestResult(null);
    }
  }, [open, creds]);

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
    toast.success(`${siloName} WordPress credentials saved`, {
      style: { background: brand.bg, color: brand.on, border: "none" },
    });
    onOpenChange(false);
  }

  function handleClear() {
    remove();
    setUrl("");
    setUser("");
    setPassword("");
    setTestResult(null);
    toast.success(`${siloName} WordPress credentials cleared`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: brand.color }}>
            {siloName} WordPress
          </DialogTitle>
          <DialogDescription>
            Enter the site URL, a WordPress user, and an Application Password.
            Stored only in this browser. Server env vars take precedence if also
            set.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="wp-url" className="text-xs uppercase tracking-wider">
              Site URL
            </Label>
            <Input
              id="wp-url"
              placeholder="https://www.example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoComplete="off"
              className="min-h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="wp-user"
              className="text-xs uppercase tracking-wider"
            >
              Username
            </Label>
            <Input
              id="wp-user"
              placeholder="editor"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoComplete="off"
              className="min-h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="wp-pass"
              className="text-xs uppercase tracking-wider"
            >
              Application Password
            </Label>
            <Input
              id="wp-pass"
              type="password"
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              className="min-h-11"
            />
            <p className="text-[11px] text-muted-foreground">
              Generate one in WordPress under Users → Profile → Application
              Passwords.
            </p>
          </div>
          {testResult && (
            <div
              className={`text-[12px] rounded-md border px-3 py-2 inline-flex items-center gap-1.5 ${
                testResult.ok
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                  : "border-red-500/30 bg-red-500/5 text-red-300"
              }`}
            >
              {testResult.ok && <CheckCircle2 className="w-3.5 h-3.5" />}
              {testResult.message}
            </div>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {creds && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleClear}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 sm:mr-auto"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Clear
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={testing}
            onClick={handleTest}
          >
            {testing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            style={{ background: brand.bg, color: brand.on }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
