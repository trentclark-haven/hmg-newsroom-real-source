export type PublishTargetId = "wordpress" | "public-app" | "both";

export interface PublishTarget {
  id: PublishTargetId;
  label: string;
  description: string;
}

export const PUBLISH_TARGETS: PublishTarget[] = [
  {
    id: "wordpress",
    label: "WordPress",
    description: "Publish to the silo's WordPress site",
  },
  {
    id: "public-app",
    label: "Public App",
    description: "Publish to the HMG Public App (placeholder until env wired)",
  },
  {
    id: "both",
    label: "Both",
    description: "Publish to WordPress AND the Public App",
  },
];
