export type SourceMode =
  | "local"
  | "paste"
  | "search"
  | "import"
  | "evergreen"
  | "future";

export interface SourcePacket {
  title: string;
  mode: SourceMode;
  content: string;
  facts: string[];
  missingContext: string[];
  warnings: string[];
}
