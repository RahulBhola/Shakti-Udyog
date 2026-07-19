import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService, type AuthUser } from "./authService";

interface AuthContextValue {
  user: AuthUser | null;
  /** True while the initial silent-refresh session bootstrap is running. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Session bootstrap: try to renew via the HttpOnly refresh cookie so a
  // page reload does not sign the user out (access token is memory-only).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const renewed = await authService.refresh();
      if (renewed) {
        const me = await authService.me();
        if (!cancelled) setUser(me);
      }
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const ok = await authService.login(email, password);
    if (ok) {
      setUser(await authService.me());
    }
    return ok;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
