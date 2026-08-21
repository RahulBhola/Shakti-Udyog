import { useEffect, useState, type FormEvent, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { authService } from "../../auth/authService";
import { AuthLayout } from "./AuthLayout";
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

/** Official Full-Color Google G Logo */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

/** Official Apple Logo */
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export function LoginPage() {
  const { user, login, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { from?: string; message?: string; email?: string } | null;

  // Already logged in — redirect to respective portal
  useEffect(() => {
    if (!user) return;
    const role = user.roles[0];
    const target =
      role === "Admin" || role === "Engineer"
        ? "/admin/dashboard"
        : "/customer/dashboard";
    navigate(target, { replace: true });
  }, [user, navigate]);

  const [email, setEmail] = useState(locationState?.email ?? "");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(locationState?.message ?? null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        const from = locationState?.from;
        if (from && from !== "/" && from !== "/login") {
          navigate(from, { replace: true });
        } else {
          const me = await authService.me();
          const role = me?.roles[0];
          const target =
            role === "Admin" || role === "Engineer"
              ? "/admin/dashboard"
              : "/customer/dashboard";
          navigate(target, { replace: true });
        }
      } else {
        setError("Invalid email or password. Please verify your credentials.");
      }
    } catch {
      setError("Unable to reach the server. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="auth-form-container">
        {/* Email Field */}
        <div className="auth-input-group">
          <label htmlFor="login-email" className="auth-input-label">
            Email Address
          </label>
          <div className="auth-control-wrap">
            <span className="auth-control-icon">
              <Mail size={17} />
            </span>
            <input
              id="login-email"
              className="auth-text-input"
              type="email"
              autoComplete="username"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="auth-input-group">
          <label htmlFor="login-password" className="auth-input-label">
            Password
          </label>
          <div className="auth-control-wrap">
            <span className="auth-control-icon">
              <Lock size={17} />
            </span>
            <input
              id="login-password"
              className="auth-text-input auth-text-input--has-toggle"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="auth-eye-toggle"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              title={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password */}
        <div className="auth-meta-row">
          <label className="auth-checkbox-label">
            <input type="checkbox" defaultChecked />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password" className="auth-link-forgot">
            Forgot password?
          </Link>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div role="status" className="auth-alert-success" style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            backgroundColor: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.35)",
            color: "#4ade80",
            fontSize: "0.875rem",
            marginBottom: "1rem"
          }}>
            <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div role="alert" className="auth-alert-error">
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          ref={submitRef}
          type="submit"
          className="auth-btn-primary"
          disabled={submitting}
        >
          {submitting ? (
            <span>Signing in…</span>
          ) : (
            <>
              <span>Sign In to Dashboard</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="auth-sep-row">
        <span>or continue with</span>
      </div>

      {/* Social Login Grid (Google & Apple) */}
      <div className="auth-social-grid">
        <button
          type="button"
          className="auth-btn-social"
          onClick={() => loginWithProvider("google")}
          title="Sign in with Google"
        >
          <GoogleIcon />
          <span>Google</span>
        </button>
        <button
          type="button"
          className="auth-btn-social"
          onClick={() => loginWithProvider("apple")}
          title="Sign in with Apple"
        >
          <AppleIcon />
          <span>Apple</span>
        </button>
      </div>

      {/* Footer Navigation */}
      <p className="auth-bottom-prompt">
        Don't have an account? <Link to="/signup">Create one now</Link>
      </p>
    </AuthLayout>
  );
}
