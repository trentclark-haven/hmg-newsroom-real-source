import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getProofPackage,
  bodyToPlain,
} from "./data/wpProofPackages";
import { WP_PROOF_IMAGES } from "./data/wpProofImages";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Six-site WordPress Connection Diagnostics.
//
// All checks run server-side (/api/wp-diagnostics) because the browser cannot
// reach the WordPress sites directly and the app passwords must never leave the
// server. This panel only ever renders SAFE labels — no usernames, passwords,
// or application-password values are requested, returned, or shown.
// ---------------------------------------------------------------------------

type StatusClass =
  | "not configured"
  | "DNS failure"
  | "SSL failure"
  | "timeout"
  | "connection refused"
  | "Hostinger hcdn/WAF 403"
  | "REST blocked"
  | "auth failed"
  | "app password invalid"
  | "media permission missing"
  | "post permission missing"
  | "ready for draft proof"
  | "draft proof passed";

interface Layer {
  ok: boolean;
  status?: number | null;
  detail: string;
}

interface SiteReceipt {
  silo: string;
  siloName: string;
  storedHost: string | null;
  canonicalHost: string;
  hostMatch: boolean;
  configured: boolean;
  server: string | null;
  layers: {
    dns: Layer;
    httpsRoot: Layer;
    wpJson: Layer;
    usersMe: Layer;
    media: Layer;
    postDraft: Layer;
  };
  statusClass: StatusClass;
  blocker: string;
  founderAction: string;
  readyForDraft: boolean;
  checkedAt: string;
  // client-only: receipt of a draft proof post, if one was created
  draftProof?: { id: number; link: string };
}

const SIX_SILOS: { silo: string; siloName: string }[] = [
  { silo: "hiphophaven", siloName: "HipHopHaven" },
  { silo: "raphaven", siloName: "RapHaven" },
  { silo: "musichaven", siloName: "MusicHaven" },
  { silo: "cannahaven", siloName: "CannaHaven" },
  { silo: "fithaven", siloName: "FitHaven" },
  { silo: "sportshaven", siloName: "SportsHaven" },
];

const API_BASE = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/");

function badgeClasses(status: StatusClass): string {
  switch (status) {
    case "ready for draft proof":
    case "draft proof passed":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "Hostinger hcdn/WAF 403":
      return "bg-amber-500/15 text-amber-300 border-amber-500/40";
    case "media permission missing":
    case "post permission missing":
    case "auth failed":
    case "app password invalid":
      return "bg-orange-500/15 text-orange-300 border-orange-500/30";
    case "not configured":
      return "bg-zinc-700/40 text-muted-foreground border-border/50";
    default:
      return "bg-red-500/15 text-red-300 border-red-500/30";
  }
}

function LayerRow({ label, layer }: { label: string; layer: Layer }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      {layer.ok ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
      )}
      <span className="font-semibold text-foreground/80 w-[88px] flex-shrink-0">
        {label}
      </span>
      <span className="text-muted-foreground truncate">{layer.detail}</span>
    </div>
  );
}

function buildReceiptText(r: SiteReceipt): string {
  const line = (k: string, v: string) => `${k.padEnd(16)}: ${v}`;
  return [
    `WordPress Connection Receipt — ${r.siloName}`,
    `checked         : ${r.checkedAt}`,
    line("stored host", r.storedHost ?? "(none)"),
    line("canonical host", r.canonicalHost),
    line(
      "host match",
      r.hostMatch ? "yes" : "no (stored host differs from canonical)",
    ),
    line("server", r.server ?? "(unknown)"),
    "",
    line("DNS", r.layers.dns.detail),
    line("HTTPS root", r.layers.httpsRoot.detail),
    line("/wp-json", r.layers.wpJson.detail),
    line("users/me", r.layers.usersMe.detail),
    line("media cap", r.layers.media.detail),
    line("post cap", r.layers.postDraft.detail),
    "",
    line("STATUS", r.statusClass),
    line("ready for draft", r.readyForDraft ? "YES" : "no"),
    r.draftProof
      ? line("draft proof", `post #${r.draftProof.id} → ${r.draftProof.link}`)
      : "",
    "",
    "Founder action:",
    r.founderAction,
  ]
    .filter(Boolean)
    .join("\n");
}

function SiteCard({
  receipt,
  busy,
  onRetest,
  onCreateDraft,
  draftBusy,
}: {
  receipt: SiteReceipt;
  busy: boolean;
  onRetest: () => void;
  onCreateDraft: () => void;
  draftBusy: boolean;
}) {
  const [open, setOpen] = useState(true);
  const r = receipt;
  const isHcdn = r.statusClass === "Hostinger hcdn/WAF 403";

  return (
    <div
      className="rounded-xl border border-border/60 bg-secondary/20 overflow-hidden"
      data-testid={`wp-diag-card-${r.silo}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-foreground/[0.03] transition-colors"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
        <span className="text-[13px] font-bold uppercase tracking-wide flex-1 min-w-0 truncate">
          {r.siloName}
        </span>
        {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        <span
          data-testid={`wp-diag-status-${r.silo}`}
          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeClasses(
            r.statusClass,
          )}`}
        >
          {r.statusClass}
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-border/40 pt-2.5">
          {/* Host comparison */}
          <div className="grid grid-cols-1 gap-0.5 text-[10px] text-muted-foreground">
            <div className="flex gap-2">
              <span className="font-semibold text-foreground/70 w-[88px]">
                stored host
              </span>
              <span className="font-mono truncate">{r.storedHost ?? "(none)"}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold text-foreground/70 w-[88px]">
                canonical
              </span>
              <span className="font-mono truncate">
                {r.canonicalHost}
                {!r.hostMatch && (
                  <span className="ml-1 text-amber-400">(differs)</span>
                )}
              </span>
            </div>
            {r.server && (
              <div className="flex gap-2">
                <span className="font-semibold text-foreground/70 w-[88px]">
                  server
                </span>
                <span className="font-mono truncate">{r.server}</span>
              </div>
            )}
          </div>

          {/* Layer checks */}
          <div className="space-y-1 rounded-lg border border-border/40 bg-secondary/30 p-2.5">
            <LayerRow label="DNS" layer={r.layers.dns} />
            <LayerRow label="HTTPS root" layer={r.layers.httpsRoot} />
            <LayerRow label="/wp-json" layer={r.layers.wpJson} />
            <LayerRow label="users/me" layer={r.layers.usersMe} />
            <LayerRow label="media cap" layer={r.layers.media} />
            <LayerRow label="post cap" layer={r.layers.postDraft} />
          </div>

          {/* Hostinger-block emphasis — makes it obvious WordPress auth was
              never reached. */}
          {isHcdn && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 flex gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-200 leading-snug">
                Blocked by <strong>Hostinger CDN (hcdn)</strong> before WordPress
                authentication is evaluated. This is a host-side firewall/WAF
                block — not a credential problem.
              </p>
            </div>
          )}

          {/* Founder action */}
          <div className="rounded-lg border border-border/40 bg-background/40 p-2.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-foreground/60 mb-1">
              Required action
            </div>
            <p
              className="text-[11px] text-foreground/85 leading-snug"
              data-testid={`wp-diag-action-${r.silo}`}
            >
              {r.founderAction}
            </p>
          </div>

          {r.draftProof && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-200">
              Draft proof created — post #{r.draftProof.id}.{" "}
              <a
                href={r.draftProof.link}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Open draft
              </a>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] text-muted-foreground">
              checked {new Date(r.checkedAt).toLocaleTimeString()}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                disabled={busy}
                onClick={onRetest}
                data-testid={`wp-diag-retest-${r.silo}`}
              >
                {busy ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                Retest
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => {
                  navigator.clipboard
                    .writeText(buildReceiptText(r))
                    .then(() => toast.success(`Copied ${r.siloName} receipt`))
                    .catch(() => toast.error("Copy failed"));
                }}
                data-testid={`wp-diag-copy-${r.silo}`}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy receipt
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 text-[11px]"
                disabled={!r.readyForDraft || draftBusy || !!r.draftProof}
                onClick={onCreateDraft}
                data-testid={`wp-diag-draft-${r.silo}`}
                title={
                  r.draftProof
                    ? `Draft proof already created — post #${r.draftProof.id}`
                    : r.readyForDraft
                      ? "Create a draft proof post on this site"
                      : "Disabled until root + /wp-json + auth + media + post checks all pass"
                }
              >
                {draftBusy ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3 mr-1" />
                )}
                {r.draftProof ? "Draft Proof Created" : "Create Draft Proof Post"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function WPDiagnosticsPanel() {
  const [receipts, setReceipts] = useState<Record<string, SiteReceipt>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [draftBusy, setDraftBusy] = useState<Record<string, boolean>>({});
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);

  async function checkSilo(silo: string): Promise<SiteReceipt | null> {
    try {
      const res = await fetch(`${API_BASE}/wp-diagnostics/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ silo }),
      });
      if (!res.ok) {
        toast.error(`Diagnostics failed for ${silo}`);
        return null;
      }
      return (await res.json()) as SiteReceipt;
    } catch {
      toast.error("Network error talking to diagnostics API.");
      return null;
    }
  }

  async function runAll() {
    setRunningAll(true);
    try {
      const res = await fetch(`${API_BASE}/wp-diagnostics/check-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        toast.error("Diagnostics run failed.");
        return;
      }
      const data = (await res.json()) as {
        receipts: SiteReceipt[];
        checkedAt: string;
      };
      setReceipts((prev) => {
        const next: Record<string, SiteReceipt> = {};
        for (const r of data.receipts) {
          // Carry forward any proof already created this session so the
          // duplicate-post guard survives a re-check.
          const proof = prev[r.silo]?.draftProof;
          next[r.silo] = proof
            ? { ...r, readyForDraft: false, draftProof: proof }
            : r;
        }
        return next;
      });
      setLastRunAt(data.checkedAt);
      const ready = data.receipts.filter((r) => r.readyForDraft).length;
      toast.success(
        `Checked 6 sites — ${ready} ready for draft proof, ${6 - ready} blocked`,
      );
    } catch {
      toast.error("Network error talking to diagnostics API.");
    } finally {
      setRunningAll(false);
    }
  }

  async function retest(silo: string) {
    setBusy((b) => ({ ...b, [silo]: true }));
    const r = await checkSilo(silo);
    if (r)
      setReceipts((prev) => {
        // Preserve an existing proof so retest cannot re-enable a second post.
        const proof = prev[silo]?.draftProof;
        return {
          ...prev,
          [silo]: proof ? { ...r, readyForDraft: false, draftProof: proof } : r,
        };
      });
    setBusy((b) => ({ ...b, [silo]: false }));
  }

  async function createDraft(silo: string) {
    const r = receipts[silo];
    // Idempotency guard: never post twice for the same site.
    if (!r || !r.readyForDraft || r.draftProof || draftBusy[silo]) return;
    setDraftBusy((d) => ({ ...d, [silo]: true }));
    try {
      const pkg = getProofPackage(silo);
      if (!pkg) {
        toast.error(`No prepared WordPress draft for ${silo}`);
        return;
      }

      // Step 1 (best-effort): upload the featured image to the media library.
      // A media failure must NOT block the draft — we just publish without it.
      let featuredMediaId: number | undefined;
      try {
        const imgUrl = WP_PROOF_IMAGES[silo];
        if (!imgUrl) throw new Error("no bundled image");
        const imgRes = await fetch(imgUrl);
        const imgBlob = await imgRes.blob();
        const form = new FormData();
        form.append("silo", silo);
        form.append(
          "file",
          new File([imgBlob], `${pkg.slug}-featured.png`, {
            type: imgBlob.type || "image/png",
          }),
        );
        const mediaRes = await fetch(`${API_BASE}/wordpress/media`, {
          method: "POST",
          body: form,
        });
        const mediaData = (await mediaRes.json().catch(() => ({}))) as {
          id?: number;
        };
        if (mediaRes.ok && mediaData.id) featuredMediaId = mediaData.id;
        else toast.message(`${pkg.siloName}: featured image skipped`);
      } catch {
        toast.message(`${pkg.siloName}: featured image skipped`);
      }

      // Step 2: publish the full content as a DRAFT.
      const res = await fetch(`${API_BASE}/wordpress/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          silo,
          title: pkg.headline,
          content: bodyToPlain(pkg.body),
          excerpt: pkg.dek,
          metaDescription: pkg.seoMeta,
          categories: [pkg.category],
          tags: pkg.tags,
          slug: pkg.slug,
          status: "draft",
          ...(featuredMediaId ? { featuredMediaId } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: number;
        link?: string;
        url?: string;
        message?: string;
      };
      if (res.ok && data.id) {
        const link = data.link ?? data.url ?? "";
        setReceipts((prev) => ({
          ...prev,
          [silo]: {
            ...prev[silo],
            statusClass: "draft proof passed",
            readyForDraft: false,
            draftProof: { id: data.id!, link },
          },
        }));
        toast.success(`${r.siloName}: draft proof #${data.id} created`);
      } else {
        toast.error(data.message ?? `Draft proof failed for ${r.siloName}`);
      }
    } catch {
      toast.error("Network error creating draft proof.");
    } finally {
      setDraftBusy((d) => ({ ...d, [silo]: false }));
    }
  }

  const ordered = SIX_SILOS.map((s) => receipts[s.silo]).filter(
    (r): r is SiteReceipt => !!r,
  );
  const readyCount = ordered.filter((r) => r.readyForDraft).length;
  const hasRun = ordered.length > 0;

  return (
    <div
      className="rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-3 mb-4"
      data-testid="wp-diagnostics-panel"
    >
      <div className="flex items-start gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-500/15 text-amber-300">
          <Activity className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black tracking-tight leading-none">
            Connection Diagnostics
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            Live six-site WordPress reachability + capability check. Runs
            server-side using stored secrets — no usernames or passwords are ever
            shown. No posts are created until a site passes every gate.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <Button
          type="button"
          size="sm"
          className="h-8 bg-amber-500 text-[#1a1410] hover:bg-amber-400"
          disabled={runningAll}
          onClick={runAll}
          data-testid="wp-diag-run-all"
        >
          {runningAll ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Checking all six...
            </>
          ) : (
            <>
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              Run All Six Checks
            </>
          )}
        </Button>
        {hasRun && (
          <span
            className="text-[10px] text-muted-foreground"
            data-testid="wp-diag-summary"
          >
            {readyCount}/{ordered.length} ready for proof
            {lastRunAt && ` · ${new Date(lastRunAt).toLocaleTimeString()}`}
          </span>
        )}
      </div>

      {!hasRun ? (
        <div className="rounded-lg border border-dashed border-border/50 bg-secondary/20 p-4 text-center">
          <AlertTriangle className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
          <p className="text-[11px] text-muted-foreground">
            Run the checks to see the six-site reachability, REST, auth and
            capability status.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ordered.map((r) => (
            <SiteCard
              key={r.silo}
              receipt={r}
              busy={!!busy[r.silo]}
              draftBusy={!!draftBusy[r.silo]}
              onRetest={() => retest(r.silo)}
              onCreateDraft={() => createDraft(r.silo)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
