import { config } from "../config";

/**
 * Minimal typed fetch wrapper for the Shakti Udyog API.
 * Authentication (JWT + refresh rotation) is wired in Milestone 2.
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

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    let traceId: string | undefined;
    let detail: string | undefined;
    try {
      const problem = await response.json();
      traceId = problem?.traceId;
      detail = problem?.title;
    } catch {
      // Non-JSON error body; fall through with status only.
    }
    throw new ApiError(response.status, traceId, detail);
  }

  return response.json() as Promise<T>;
}
