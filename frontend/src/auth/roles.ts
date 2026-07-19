/**
 * Application role names. Must match the backend role constants
 * (backend/src/ShaktiUdyog.Domain/Constants/Roles.cs). These are used for
 * role-based routing only — real authorization is always enforced by the API.
 */
export const Roles = {
  Admin: "Admin",
  DataUpdater: "DataUpdater",
  Customer: "Customer",
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];
