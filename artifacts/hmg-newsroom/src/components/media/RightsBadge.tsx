import type { RightsStatus } from "./mediaItem";

const RIGHTS_META: Record<RightsStatus, { label: string; cls: string }> = {
  "user-supplied": {
    label: "User supplied",
    cls: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  },
  "brand-asset": {
    label: "Brand asset",
    cls: "border-sky-500/40 text-sky-300 bg-sky-500/10",
  },
  "screenshot-reference": {
    label: "Source reference",
    cls: "border-violet-500/40 text-violet-300 bg-violet-500/10",
  },
  "needs-clearance": {
    label: "Needs clearance",
    cls: "border-amber-500/40 text-amber-300 bg-amber-500/10",
  },
  "editorial-only": {
    label: "Editorial only",
    cls: "border-amber-500/40 text-amber-300 bg-amber-500/10",
  },
  "do-not-publish-unverified": {
    label: "Verify before publish",
    cls: "border-red-500/40 text-red-300 bg-red-500/10",
  },
};

export function RightsBadge({ status }: { status: RightsStatus }) {
  const meta = RIGHTS_META[status] ?? RIGHTS_META["user-supplied"];
  return (
    <span
      className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${meta.cls}`}
      data-testid={`rights-badge-${status}`}
    >
      {meta.label}
    </span>
  );
}
