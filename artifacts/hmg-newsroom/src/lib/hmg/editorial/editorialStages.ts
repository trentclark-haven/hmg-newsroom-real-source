/**
 * Editorial stage definitions for the 6-stage Editorial Desk.
 * Each stage maps to a visible workspace panel. Only one stage dominates at a time.
 */

export type EditorialStageId =
  | "notes"
  | "angle"
  | "sources"
  | "draft"
  | "package"
  | "publish";

export interface EditorialStage {
  id: EditorialStageId;
  label: string;
  shortLabel: string;
  hint: string;
  icon: string;
}

export const EDITORIAL_STAGES: EditorialStage[] = [
  {
    id: "notes",
    label: "Notes",
    shortLabel: "Notes",
    hint: "Paste research, founder notes, transcripts, and raw material",
    icon: "FileText",
  },
  {
    id: "angle",
    label: "Angle",
    shortLabel: "Angle",
    hint: "Pick the story angle, tone, and article type",
    icon: "Compass",
  },
  {
    id: "sources",
    label: "Sources",
    shortLabel: "Sources",
    hint: "Verify facts, quotes, links, and attribution",
    icon: "ShieldCheck",
  },
  {
    id: "draft",
    label: "Draft",
    shortLabel: "Draft",
    hint: "Generate the article body, headline, and dek",
    icon: "PenTool",
  },
  {
    id: "package",
    label: "Package",
    shortLabel: "Package",
    hint: "Assemble SEO, social, visual, and clip handoffs",
    icon: "Package",
  },
  {
    id: "publish",
    label: "Publish",
    shortLabel: "Publish",
    hint: "Prepare WordPress draft and review readiness",
    icon: "Send",
  },
];

export const STAGE_ORDER: EditorialStageId[] = [
  "notes",
  "angle",
  "sources",
  "draft",
  "package",
  "publish",
];

export function stageIndex(id: EditorialStageId): number {
  return STAGE_ORDER.indexOf(id);
}

export function nextStage(id: EditorialStageId): EditorialStageId | null {
  const idx = stageIndex(id);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function prevStage(id: EditorialStageId): EditorialStageId | null {
  const idx = stageIndex(id);
  if (idx <= 0) return null;
  return STAGE_ORDER[idx - 1];
}

export function isStageComplete(
  id: EditorialStageId,
  state: Record<string, unknown>,
): boolean {
  switch (id) {
    case "notes":
      return Boolean(
        (state.sections as Array<{ text?: string }>)?.some((s) =>
          s.text?.trim(),
        ),
      );
    case "angle":
      return Boolean(state.articleType) && Boolean(state.tone);
    case "sources":
      return Boolean(
        (state.parsedNotes as { verifiedFacts?: unknown[] })?.verifiedFacts
          ?.length,
      );
    case "draft":
      return Boolean(state.articlePkg);
    case "package":
      return Boolean(state.socialPkg) || Boolean(state.wpPkg);
    case "publish":
      return Boolean(state.voiceGatePassed);
    default:
      return false;
  }
}
