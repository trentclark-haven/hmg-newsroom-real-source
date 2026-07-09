export type WebEditState =
  | "empty"
  | "media_uploaded"
  | "transcript_added"
  | "hooks_selected"
  | "timeline_built"
  | "caption_ready"
  | "thumbnail_ready"
  | "ready_for_manual_edit"
  | "saved_to_output_history"
  | "blocked_needs_media"
  | "blocked_needs_transcript"
  | "backend_pending";

export type SegmentRole = "hook" | "context" | "payoff" | "cta";

export interface VideoSource {
  id: string;
  filename: string;
  fileType: string;
  size: number;
  durationEstimate: number | null;
  sourceUrl: string | null;
  localObjectUrl: string | null;
  createdAt: number;
}

export interface TranscriptBlock {
  id: string;
  speaker: string;
  start: number | null;
  end: number | null;
  text: string;
  flags: string[];
  selected: boolean;
}

export interface ClipSegment {
  id: string;
  label: string;
  start: string;
  end: string;
  role: SegmentRole;
  note: string;
  riskFlag: string;
  estimatedDuration: number | null;
}

export interface CaptionPlan {
  platform: string;
  style: string;
  headline: string;
  lowerThird: string;
  subtitleMode: boolean;
  safeArea: boolean;
  speakerLabel: string;
  platformNotes: string;
  pinnedComment: string;
  accessibilityNote: string;
}

export interface ThumbnailPlan {
  frameTime: string;
  headline: string;
  subheadline: string;
  logoPlacement: string;
  imageNote: string;
  webArtHandoff: string;
}

export interface WebEditOutput {
  id: string;
  title: string;
  silo: string;
  siloName: string;
  videoFilename: string | null;
  transcriptText: string;
  segments: ClipSegment[];
  captionStyle: string;
  platformTargets: string[];
  thumbnailHeadline: string;
  hookText: string;
  lowerThirdName: string;
  lowerThirdContext: string;
  readiness: WebEditState;
  exportText: string;
  exportJson: string;
  createdAt: number;
}

export const SEGMENT_ROLE_LABELS: Record<SegmentRole, string> = {
  hook: "Hook",
  context: "Context",
  payoff: "Payoff",
  cta: "CTA",
};

export const SEGMENT_ROLE_HINTS: Record<SegmentRole, string> = {
  hook: "Open with the strongest visual or quote",
  context: "Add the one detail viewers need",
  payoff: "Land the point or reveal",
  cta: "Comment bait or next step",
};
