/**
 * HMG Founder Knowledge Base — core types.
 * Local-only, bounded, exportable, importable.
 * Future-ready for backend/vector DB — shape is stable.
 */

export const MEMORY_SCHEMA_VERSION = "hmg-memory-v1";

export type MemoryType =
  | "founder-voice"
  | "old-article"
  | "resume-bio"
  | "pitch-deck"
  | "sales-note"
  | "relationship-note"
  | "contact-csv"
  | "brand-rule"
  | "editorial-rule"
  | "wordpress-rule"
  | "social-example"
  | "revenue-max-note"
  | "artbot-content-note"
  | "webart-visual-rule"
  | "webedit-clip-rule";

export const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
  "founder-voice": "Founder Voice",
  "old-article": "Old Article",
  "resume-bio": "Resume / Bio",
  "pitch-deck": "Pitch Deck",
  "sales-note": "Sales Note",
  "relationship-note": "Relationship Note",
  "contact-csv": "Contact / CSV",
  "brand-rule": "Brand Rule",
  "editorial-rule": "Editorial Rule",
  "wordpress-rule": "WordPress Rule",
  "social-example": "Social Example",
  "revenue-max-note": "Revenue / Max Note",
  "artbot-content-note": "ARTBOT Content Note",
  "webart-visual-rule": "WebArt Visual Rule",
  "webedit-clip-rule": "WebEdit Clip Rule",
};

export const ALL_MEMORY_TYPES = Object.keys(MEMORY_TYPE_LABELS) as MemoryType[];

export type RoutedSystem =
  | "editorial-desk"
  | "artbot"
  | "social-factory"
  | "wordpress-builder"
  | "maximillion"
  | "webart"
  | "hmg-visual-engine"
  | "webedit"
  | "relationship-graph"
  | "founder-os";

export const ROUTED_SYSTEM_LABELS: Record<RoutedSystem, string> = {
  "editorial-desk": "Editorial Desk",
  artbot: "ARTBOT",
  "social-factory": "Social Factory",
  "wordpress-builder": "WordPress Builder",
  maximillion: "Maximillion",
  webart: "WebArt",
  "hmg-visual-engine": "HMG Visual Engine",
  webedit: "WebEdit",
  "relationship-graph": "Relationship Graph",
  "founder-os": "Founder OS",
};

export interface MemoryItem {
  id: string;
  title: string;
  type: MemoryType;
  brand: string;
  tags: string[];
  source: string;
  notes: string;
  content: string;
  dateAdded: number;
  lastModified: number;
  routedSystems: RoutedSystem[];
  localStatus: "saved" | "pending" | "error";
  pinned: boolean;
  preview: string;
}

export interface MemoryStore {
  schemaVersion: typeof MEMORY_SCHEMA_VERSION;
  items: MemoryItem[];
  lastUpdated: number;
}

export interface MemoryExportPayload {
  schemaVersion: typeof MEMORY_SCHEMA_VERSION;
  createdDate: string;
  sourceApp: "HMG Newsroom Suite";
  itemCount: number;
  items: MemoryItem[];
  routingMap: Record<MemoryType, RoutedSystem[]>;
}

export interface MemoryHealthReport {
  overall: "strong" | "needs-founder-voice" | "needs-wordpress" | "needs-max" | "needs-relationships" | "empty";
  totalItems: number;
  byType: Partial<Record<MemoryType, number>>;
  lastUpdated: number | null;
  localStorageStatus: "ok" | "warning" | "critical" | "hard-stop";
  missing: string[];
  recommended: string[];
}
