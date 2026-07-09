/**
 * Connector registry for the Media Connectivity Layer.
 *
 * Honesty mandate: never claim a service is live unless it actually is. Local
 * upload, clipboard, the saved bank and the brand library are genuinely active.
 * YouTube is active for URL + thumbnail + (server) transcript ingest. Google
 * Drive and the future cloud sources are HONEST placeholders — "ready for
 * configuration" — with no fake browsing or fake OAuth.
 */

export type ConnectorState =
  | "active"
  | "browser"
  | "ready"
  | "unconfigured"
  | "coming-soon";

export interface ConnectorInfo {
  id: string;
  label: string;
  state: ConnectorState;
  blurb: string;
}

export const CONNECTOR_STATE_META: Record<
  ConnectorState,
  { label: string; dot: string; tone: string }
> = {
  active: { label: "Active", dot: "#22c55e", tone: "text-emerald-300" },
  browser: { label: "Browser", dot: "#38bdf8", tone: "text-sky-300" },
  ready: { label: "Ready to configure", dot: "#f59e0b", tone: "text-amber-300" },
  unconfigured: { label: "Not connected", dot: "#9ca3af", tone: "text-muted-foreground" },
  "coming-soon": { label: "Coming later", dot: "#6b7280", tone: "text-muted-foreground" },
};

export function clipboardSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard !== "undefined" &&
    typeof (navigator.clipboard as { read?: unknown }).read === "function"
  );
}

export function getConnectors(): ConnectorInfo[] {
  return [
    {
      id: "local",
      label: "Local Upload",
      state: "active",
      blurb: "Images, video & audio from this device. Drag-drop or pick.",
    },
    {
      id: "clipboard",
      label: "Screenshot / Clipboard",
      state: clipboardSupported() ? "browser" : "unconfigured",
      blurb: clipboardSupported()
        ? "Paste screenshots of X posts, comments or receipts straight in."
        : "This browser blocks clipboard image reads — use upload instead.",
    },
    {
      id: "youtube",
      label: "YouTube",
      state: "active",
      blurb: "Paste a URL for thumbnail + source reference. No auto-transcript — upload the file to WebEdit to transcribe.",
    },
    {
      id: "saved",
      label: "Saved Asset Bank",
      state: "active",
      blurb: "Reusable, local-first library shared across every module.",
    },
    {
      id: "brand",
      label: "Brand Asset Library",
      state: "active",
      blurb: "Haven logos, bugs & brand colors, ready as overlays.",
    },
    {
      id: "google_drive",
      label: "Google Drive",
      state: "ready",
      blurb: "Connector ready for configuration — local uploads active now.",
    },
    {
      id: "dropbox",
      label: "Dropbox / OneDrive / Photos",
      state: "coming-soon",
      blurb: "Future cloud sources — slot reserved, wires in cleanly later.",
    },
    {
      id: "storage",
      label: "Cloud media storage (R2 / S3)",
      state: "coming-soon",
      blurb: "Future per-user media storage with signed uploads.",
    },
  ];
}
