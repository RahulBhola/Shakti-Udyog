import { useEffect, useState, type FormEvent, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { AuthLayout } from "./AuthLayout";

export function LoginPage() {
  const { user, login, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Already logged in — redirect away from login page (useEffect, not during render).
  useEffect(() => {
    if (!user) return;
    const role = user.roles[0];
    const target = role === "Admin" || role === "Engineer" ? "/admin/dashboard"
      : "/customer/dashboard";
    navigate(target, { replace: true });
  }, [user, navigate]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const ok = await login(email, password);
      if (ok) {
        const from = (location.state as { from?: string } | null)?.from ?? "/";
        navigate(from, { replace: true });
      } else {
        // Mirrors the API's uniform message — no account-existence hints.
        setError("Invalid credentials.");
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Ripple effect on button
  function handleRipple(e: React.MouseEvent<HTMLButtonElement>) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty("--x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    btn.style.setProperty("--y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }

  return (
    <AuthLayout>
      <h2 className="auth-form-heading">Welcome back!</h2>
      <p className="auth-form-subtitle">Log in to access your account.</p>

      <form onSubmit={handleSubmit} className="auth-form">
        {/* Email */}
        <div className="auth-field">
          <label htmlFor="login-email">Email</label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </span>
            <input
              id="login-email"
              className="auth-input"
              type="email"
              autoComplete="username"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <input
              id="login-password"
              className="auth-input"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="auth-pw-toggle"
              onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* Forgot password + Remember me */}
        <div className="auth-forgot-row">
          <label className="auth-remember">
            <input type="checkbox" defaultChecked />
            Remember me
          </label>
          <Link to="/forgot-password" className="auth-forgot-link">
            Forgot password?
          </Link>
        </div>

        {/* Error */}
        {error && <p role="alert" className="auth-error-msg">{error}</p>}

        {/* Submit */}
        <button
          ref={submitRef}
          type="submit"
          className="auth-submit"
          disabled={submitting}
          onMouseMove={handleRipple}
        >
          {submitting ? (
            <span className="auth-spinner" />
          ) : (
            <>
              Log In
              <svg className="auth-submit-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="auth-divider">
        <span>OR</span>
      </div>

      {/* Social */}
      <div className="auth-social">
        <button type="button" className="auth-social-btn" onClick={() => loginWithProvider("apple")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          Continue with Apple
        </button>
      </div>

      {/* Footer */}
      <p className="auth-footer-text">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </AuthLayout>
  );
}
