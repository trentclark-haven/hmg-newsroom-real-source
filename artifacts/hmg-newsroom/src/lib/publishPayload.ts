/**
 * Shared payload contract for outbound publishing.
 * Both the WordPress and Public App publishers consume `PublishPayload`,
 * so callers (PackOutput, QuickOutput, etc.) build it once and pass it
 * to PublishPanel without duplicating shape logic.
 */
export interface PublishPayload {
  title: string;
  content: string;
  excerpt?: string;
  metaDescription?: string;
  categories: string[];
  tags: string[];
}

interface BuildArgs {
  title: string;
  content: string;
  excerpt?: string | null;
  metaDescription?: string | null;
  categories?: ReadonlyArray<string> | null;
  tags?: ReadonlyArray<string> | null;
}

function dedupe(values: ReadonlyArray<string> | null | undefined): string[] {
  if (!values) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    const trimmed = (v ?? "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/**
 * Normalize a publish payload — trims, drops empties, dedupes
 * categories/tags case-insensitively.
 */
export function buildPublishPayload(args: BuildArgs): PublishPayload {
  return {
    title: (args.title ?? "").trim(),
    content: args.content ?? "",
    excerpt: args.excerpt?.trim() || undefined,
    metaDescription: args.metaDescription?.trim() || undefined,
    categories: dedupe(args.categories),
    tags: dedupe(args.tags),
  };
}

export function isPayloadPublishable(p: PublishPayload | null): boolean {
  if (!p) return false;
  return Boolean(p.title.trim() && p.content.trim());
}
