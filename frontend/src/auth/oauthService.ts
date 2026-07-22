import { config } from "../config";

export type OAuthProvider = "google" | "apple";

export const oauthService = {
  initiateLogin(provider: OAuthProvider): void {
    const returnUrl = encodeURIComponent(config.appBaseUrl + "/auth/callback");
    window.location.href = `${config.apiBaseUrl}/api/v1/auth/external/${provider}/authorize?returnUrl=${returnUrl}`;
  },
};
