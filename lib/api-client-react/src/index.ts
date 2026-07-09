export type Silo = "news" | "sports" | "opinion" | "lifestyle" | "entertainment" | "investigations";

export type PublishStatus = "draft" | "publish" | "pending" | "future" | "private";

export type PublishRequestStatus = PublishStatus;

export interface WordpressStatus {
  connected: boolean;
  url?: string;
  siteName?: string;
}

export function useGetWordpressStatus(_opts: { silo: Silo }): {
  data: WordpressStatus | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  return { data: { connected: false }, isLoading: false, error: null };
}

export function useGenerateImage(_opts: { silo: Silo }): {
  mutate: (input: { prompt: string; count?: number }) => void;
  data: unknown;
  isLoading: boolean;
  error: Error | null;
} {
  return { mutate: () => {}, data: undefined, isLoading: false, error: null };
}

export function useGenerateImagePromptPack(_opts: { silo: Silo }): {
  mutate: (input: { prompt: string; count?: number }) => void;
  data: unknown;
  isLoading: boolean;
  error: Error | null;
} {
  return { mutate: () => {}, data: undefined, isLoading: false, error: null };
}
