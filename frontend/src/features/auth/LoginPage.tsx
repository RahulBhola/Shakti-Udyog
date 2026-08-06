import { useEffect, useState, type FormEvent, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { AuthLayout } from "./AuthLayout";

export function LoginPage() {
  const { user, login, verifyOtp, resendOtp, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Already logged in — redirect away from login page (useEffect, not during render).
  useEffect(() => {
    if (!user) return;
    const role = user.roles[0];
    const target = role === "Admin" ? "/admin/dashboard"
      : role === "Engineer" ? "/admin/rfqs"
      : "/customer/dashboard";
    navigate(target, { replace: true });
  }, [user, navigate]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const submitRef = useRef<HTMLButtonElement>(null);

  // Email-OTP verification step.
  const [otp, setOtp] = useState<{ challengeId: string; debugOtp: string | null } | null>(null);
  const [code, setCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.ok && result.requiresOtp) {
        setOtp({ challengeId: result.challengeId, debugOtp: result.debugOtp });
      } else if (result.ok) {
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

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    if (!otp) return;
    setOtpError(null);
    setVerifying(true);
    try {
      const ok = await verifyOtp(otp.challengeId, code.trim());
      if (ok) {
        const from = (location.state as { from?: string } | null)?.from ?? "/";
        navigate(from, { replace: true });
      } else {
        setOtpError("The code is invalid or has expired. Check it and try again, or request a new one.");
      }
    } catch {
      setOtpError("Unable to reach the server. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendOtp() {
    if (!otp || resending) return;
    setResending(true);
    setOtpError(null);
    try {
      const ok = await resendOtp(otp.challengeId);
      setOtpError(ok ? "A new code has been sent to your email." : "Could not resend the code. Please try again.");
    } catch {
      setOtpError("Could not resend the code. Please try again.");
    } finally {
      setResending(false);
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
      {otp ? (
        <>
          <h2 className="auth-form-heading">Verify your login</h2>
          <p className="auth-form-subtitle">Enter the 6-digit code we sent to <strong>{email}</strong>.</p>

          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="auth-field">
              <label htmlFor="otp-code">Verification code</label>
              <div className="auth-input-wrapper">
                <input
                  id="otp-code"
                  className="auth-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            {otp.debugOtp && (
              <p style={{ color: "var(--c-muted, #8a93a6)", textAlign: "center", fontSize: "12px", marginTop: "8px" }}>
                Dev code: {otp.debugOtp}
              </p>
            )}
            {otpError && <p role="alert" className="auth-error-msg">{otpError}</p>}

            <button type="submit" className="auth-submit" disabled={verifying}>
              {verifying ? <span className="auth-spinner" /> : "Verify & continue"}
            </button>

            <div className="auth-forgot-row" style={{ justifyContent: "center" }}>
              <button type="button" className="auth-forgot-link" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "inherit" }} onClick={() => void handleResendOtp()} disabled={resending}>
                {resending ? "Sending…" : "Resend code"}
              </button>
              <button type="button" className="auth-forgot-link" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "inherit" }} onClick={() => { setOtp(null); setCode(""); setOtpError(null); }}>
                Use a different email
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
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
        <button type="button" className="auth-social-btn" onClick={() => loginWithProvider("google")}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <button type="button" className="auth-social-btn" onClick={() => loginWithProvider("apple")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          Continue with Apple
        </button>
      </div>
        </>
      )}

      {/* Footer */}
      <p className="auth-footer-text">
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </AuthLayout>
  );
}
