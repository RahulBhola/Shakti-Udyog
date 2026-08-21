/**
 * Authentication and authorization domain models.
 */

export type RoleType = "Admin" | "Engineer" | "Customer";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber?: string | null;
  roles: RoleType[] | string[];
  companyName?: string | null;
  companyId?: string | null;
  sessionId?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  expiresAtUtc: string;
  refreshToken?: string;
  user?: AuthUser;
}

export interface LoginRequest {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  companyName?: string;
}

export interface UserSession {
  id: string;
  deviceName: string;
  deviceType: string;
  operatingSystem: string;
  browser: string;
  ipAddress: string | null;
  location: string | null;
  createdAtUtc: string;
  lastActiveAtUtc: string;
  expiresAtUtc: string;
  isCurrent: boolean;
}

export interface SessionRevokedPayload {
  sessionId: string;
  reason: string;
  revokedAtUtc: string;
  message?: string;
}
