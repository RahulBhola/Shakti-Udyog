import { config } from "../config";
import { tokenStorage } from "../auth/tokenStorage";
import { authService } from "../auth/authService";

/**
 * Typed fetch wrapper for the Shakti Udyog API. Attaches the JWT
 * automatically and, on a 401, attempts one silent refresh (via the HttpOnly
 * cookie) before retrying the request once — the refresh-interceptor
 * foundation for later milestones.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly traceId?: string;

  constructor(status: number, traceId?: string, message?: string) {
    super(message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.traceId = traceId;
  }
}

async function request<T>(path: string, init: RequestInit, retryOn401 = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  const token = tokenStorage.getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retryOn401) {
    const renewed = await authService.refresh();
    if (renewed) {
      return request<T>(path, init, false);
    }
  }

  if (!response.ok) {
    let traceId: string | undefined;
    let detail: string | undefined;
    try {
      const problem = await response.json();
      traceId = problem?.traceId;
      detail = problem?.title ?? problem?.message;
    } catch {
      // Non-JSON error body; fall through with status only.
    }
    throw new ApiError(response.status, traceId, detail);
  }

  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
