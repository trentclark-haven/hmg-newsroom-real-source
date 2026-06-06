/**
 * Founder login page (server-authenticated).
 *
 * Reachable only by direct URL — no nav link surfaces this. On success
 * the server sets the signed `hmg-founder-session` cookie; the client
 * then unlocks founder-only UI surfaces (telemetry toggle, etc.) via
 * useFounderSession.
 *
 * Visual: minimal centered card. No branding chrome, no debug panels.
 */

import { useEffect, useState, type ReactElement } from "react";
import { useLocation } from "wouter";
import { useFounderSession } from "@/lib/useFounderSession";

export default function FounderLogin(): ReactElement {
  const [, setLocation] = useLocation();
  const { founder, loading, login, logout } = useFounderSession();
  const [passphrase, setPassphrase] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Sign in";
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    const result = await login(passphrase);
    setSubmitting(false);
    if (!result.ok) {
      setErrorMsg(result.error ?? "Sign in failed");
      return;
    }
    setPassphrase("");
    setLocation("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (founder) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6 space-y-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Signed in</h1>
            <p className="text-xs text-muted-foreground">
              Privileged controls are now visible inside the app.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="flex-1 h-10 rounded-md bg-foreground text-background text-sm font-medium"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="h-10 px-4 rounded-md border border-border text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6 space-y-4"
        autoComplete="off"
      >
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="text-xs text-muted-foreground">
            Enter the operator passphrase to unlock privileged controls.
          </p>
        </div>
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Passphrase
          </span>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            data-testid="founder-login-passphrase"
            className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm font-mono"
          />
        </label>
        {errorMsg && (
          <div
            data-testid="founder-login-error"
            className="text-xs text-red-400"
          >
            {errorMsg}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting || passphrase.length === 0}
          data-testid="founder-login-submit"
          className="w-full h-10 rounded-md bg-foreground text-background text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
