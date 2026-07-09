import type {
  GenerateResponse,
  PackResponse,
} from "@workspace/api-client-react";

export type Role = "managing_editor" | "staff_writer";
export type Tone = "professional" | "viral" | "excited" | "fiery";
export type Platform =
  | "website"
  | "x"
  | "instagram"
  | "tiktok"
  | "newsletter"
  | "youtube";

export type QuickResult = {
  kind: "quick";
  platform: Platform;
  data: GenerateResponse;
};
export type PackResult = { kind: "pack"; data: PackResponse };
export type Result = QuickResult | PackResult;

export interface Brand {
  bg: string;
  on: string;
  color: string;
}
