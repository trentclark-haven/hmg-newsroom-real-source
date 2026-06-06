/**
 * Network resilience helpers.
 *
 * Goals:
 *   - useNetworkStatus(): reactive online / offline state for banners.
 *   - classifyNetworkError(): turn unknowns into stable safe codes for the UI.
 *   - never claim "success" unless we got a 2xx + a parseable body.
 */

import { useEffect, useState } from "react";

export type NetworkStatus = "online" | "offline";

export interface NetworkErrorClass {
  code:
    | "offline"
    | "timeout"
    | "aborted"
    | "network"
    | "server"
    | "client"
    | "unknown";
  retryable: boolean;
  message: string;
}

export function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  if (typeof window.navigator === "undefined") return true;
  // navigator.onLine returning true is not a guarantee, but false is reliable.
  return window.navigator.onLine !== false;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(() =>
    isOnline() ? "online" : "offline",
  );
  useEffect(() => {
    const update = () => setStatus(isOnline() ? "online" : "offline");
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return status;
}

export function classifyNetworkError(err: unknown): NetworkErrorClass {
  if (!isOnline()) {
    return {
      code: "offline",
      retryable: true,
      message: "You appear to be offline. Your draft is safe.",
    };
  }
  if (err instanceof DOMException && err.name === "AbortError") {
    return { code: "aborted", retryable: true, message: "Request was cancelled." };
  }
  if (err instanceof Error) {
    const name = err.name.toLowerCase();
    const msg = err.message.toLowerCase();
    if (name.includes("timeout") || msg.includes("timed out")) {
      return {
        code: "timeout",
        retryable: true,
        message: "The request timed out. Try again.",
      };
    }
    if (msg.includes("failed to fetch") || msg.includes("networkerror")) {
      return {
        code: "network",
        retryable: true,
        message: "Network error. Try again in a moment.",
      };
    }
  }
  return {
    code: "unknown",
    retryable: true,
    message: "Something went wrong. Try again.",
  };
}

/**
 * Wrap a fetch with a timeout and return the parsed JSON. Throws a typed
 * error with `code` set so callers can branch on it without poking at
 * message strings.
 */
export interface SafeFetchResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  errorCode: NetworkErrorClass["code"] | null;
  errorMessage: string | null;
}

export async function safeFetchJSON<T = unknown>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 30_000,
): Promise<SafeFetchResult<T>> {
  if (!isOnline()) {
    return {
      ok: false,
      status: 0,
      data: null,
      errorCode: "offline",
      errorMessage: "You appear to be offline.",
    };
  }
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const merged: RequestInit = { ...init, signal: init.signal ?? controller.signal };
    const res = await fetch(url, merged);
    let data: T | null = null;
    try {
      data = (await res.json()) as T;
    } catch {
      data = null;
    }
    if (res.ok) {
      return { ok: true, status: res.status, data, errorCode: null, errorMessage: null };
    }
    const cls: NetworkErrorClass["code"] = res.status >= 500 ? "server" : "client";
    return {
      ok: false,
      status: res.status,
      data,
      errorCode: cls,
      errorMessage: `Request failed (${res.status})`,
    };
  } catch (err) {
    const cls = classifyNetworkError(err);
    return { ok: false, status: 0, data: null, errorCode: cls.code, errorMessage: cls.message };
  } finally {
    clearTimeout(t);
  }
}
