import { config } from "../config";
import { tokenStorage } from "./tokenStorage";
import type { Role } from "./roles";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  roles: Role[];
  permissions: string[];
}

interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
}

const base = config.apiBaseUrl;

/**
 * Authentication API calls. All requests use credentials: "include" so the
 * HttpOnly refresh cookie flows to /api/v1/auth endpoints. The refresh token
 * in the response body is intentionally ignored — the cookie is the source.
 */
export const authService = {
  async login(email: string, password: string): Promise<boolean> {
    const response = await fetch(`${base}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) return false;

    const data = (await response.json()) as AuthResponse;
    tokenStorage.setAccessToken(data.accessToken);
    return true;
  },

  /** Attempts session renewal via the refresh cookie. */
  async refresh(): Promise<boolean> {
    const response = await fetch(`${base}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      tokenStorage.clear();
      return false;
    }

    const data = (await response.json()) as AuthResponse;
    tokenStorage.setAccessToken(data.accessToken);
    return true;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${base}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
    } finally {
      tokenStorage.clear();
    }
  },

  async me(): Promise<AuthUser | null> {
    const token = tokenStorage.getAccessToken();
    if (!token) return null;

    const response = await fetch(`${base}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    if (!response.ok) return null;
    return (await response.json()) as AuthUser;
  },
};
