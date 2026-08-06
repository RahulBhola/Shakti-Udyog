/**
 * Central runtime configuration. All values come from Vite environment
 * variables (see .env.example). Never hard-code URLs or secrets elsewhere.
 */
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000",
  appBaseUrl: window.location.origin,
} as const;
