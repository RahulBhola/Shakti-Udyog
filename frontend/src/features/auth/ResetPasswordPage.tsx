import { useState, type FormEvent } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { config } from "../../config";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing reset token. Use the link from your email.");
      return;
    }

    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, newPassword }),
      });

      if (response.ok) {
        setDone(true);
        setTimeout(() => navigate("/login", { replace: true }), 3000);
      } else {
        const data = await response.json();
        setError(data.message || "The reset link is invalid or expired.");
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main className="page">
        <div className="auth-card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>Invalid Link</h2>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--c-ink-muted)" }}>
            This password reset link is missing or invalid. Please request a new one.
          </p>
          <Link to="/forgot-password" className="auth-button primary" style={{ display: "inline-block", textDecoration: "none", textAlign: "center" }}>
            Request New Link
          </Link>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="page">
        <div className="auth-card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" style={{ marginBottom: 16 }}>
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>Password Reset</h2>
          <p style={{ margin: 0, fontSize: 14, color: "var(--c-ink-muted)" }}>
            Your password has been reset successfully. Redirecting to login…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="auth-tabs">
        <Link to="/login" className="auth-tab">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 9h18"/></svg>
          <span>Login</span>
        </Link>
      </div>

      <div className="auth-card">
        <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700 }}>Reset Password</h2>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--c-ink-muted)" }}>
          Enter your new password. Must be at least 12 characters with mixed case, digits, and symbols.
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-wrapper">
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="password-input-wrapper">
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p role="alert" className="auth-error">{error}</p>}

          <button type="submit" className="auth-button primary" disabled={submitting}>
            {submitting ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      </div>

      <div className="auth-footer">
        <Link to="/login">Back to Login</Link>
      </div>
    </main>
  );
}
