import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { config } from "../../config";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setSent(true);
      } else {
        const data = await response.json();
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <div className="auth-tabs">
        <Link to="/login" className="auth-tab">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 9h18"/></svg>
          <span>Login</span>
        </Link>
        <Link to="/signup" className="auth-tab">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          <span>Sign Up</span>
        </Link>
      </div>

      <div className="auth-card">
        {sent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" style={{ marginBottom: 16 }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>Check your email</h2>
            <p style={{ margin: 0, fontSize: 14, color: "var(--c-ink-muted)", lineHeight: 1.6 }}>
              If an account with <strong>{email}</strong> exists, we've sent a password reset link.
            </p>
            <Link to="/login" className="auth-button primary" style={{ display: "inline-block", marginTop: 20, textDecoration: "none", textAlign: "center" }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700 }}>Forgot Password</h2>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--c-ink-muted)" }}>
              Enter your email address and we'll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && <p role="alert" className="auth-error">{error}</p>}

              <button type="submit" className="auth-button primary" disabled={submitting || !email}>
                {submitting ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </div>

      <div className="auth-footer">
        Remember your password? <Link to="/login">Login</Link>
      </div>
    </main>
  );
}
