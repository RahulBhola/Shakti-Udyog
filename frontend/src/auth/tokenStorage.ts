/**
 * Token storage abstraction. The access token is kept in memory only — never
 * localStorage/sessionStorage — so it cannot be read by injected scripts. The
 * refresh token lives in an HttpOnly cookie managed entirely by the API.
 * Swappable later if a different strategy is needed.
 */
export interface TokenStorage {
  getAccessToken(): string | null;
  setAccessToken(token: string | null): void;
  clear(): void;
}

class InMemoryTokenStorage implements TokenStorage {
  private accessToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  clear(): void {
    this.accessToken = null;
  }
}

export const tokenStorage: TokenStorage = new InMemoryTokenStorage();
