import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { tokenStorage } from "../../auth/tokenStorage";
import { authService } from "../../auth/authService";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) { setError("Authentication failed."); return; }

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    if (!accessToken) { setError("Authentication failed. No token received."); return; }

    tokenStorage.setAccessToken(accessToken);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    (async () => {
      try {
        const user = await authService.me();
        navigate(user ? "/customer/dashboard" : "/login", { replace: true });
      } catch { setError("Failed to complete authentication."); }
    })();
  }, [searchParams, navigate]);

  if (error) return <main className="page"><div className="auth-card"><p role="alert" className="auth-error">{error}</p><a href="/login" className="auth-button primary">Return to Login</a></div></main>;
  return <main className="page"><div className="auth-card"><p>Completing sign-in…</p></div></main>;
}
