import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { config } from "../../config";
import { AuthLayout } from "./AuthLayout";
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

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
      setError("Unable to reach the server. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      hideTabs
      title="Reset Your Password"
      subtitle="Enter your business email and we'll send you secure recovery instructions."
    >
      {sent ? (
        <div style={{ textAlign: "center", padding: "10px 0 16px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "#10B981",
            }}
          >
            <CheckCircle2 size={28} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: "var(--auth-text-title)" }}>
            Recovery Link Sent
          </h2>
          <p style={{ fontSize: 13.5, color: "var(--auth-text-body)", margin: "0 0 24px", lineHeight: 1.5 }}>
            If an account is associated with <strong>{email}</strong>, we have dispatched a password reset link.
          </p>
          <Link
            to="/login"
            className="auth-btn-primary"
            style={{ textDecoration: "none", display: "inline-flex" }}
          >
            <span>Return to Sign In</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form-container">
          <div className="auth-input-group">
            <label htmlFor="forgot-email" className="auth-input-label">
              Registered Email Address
            </label>
            <div className="auth-control-wrap">
              <span className="auth-control-icon">
                <Mail size={17} />
              </span>
              <input
                id="forgot-email"
                className="auth-text-input"
                type="email"
                autoComplete="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="auth-alert-error">
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="auth-btn-primary"
            disabled={submitting || !email}
          >
            {submitting ? (
              <span>Sending Instructions…</span>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>

          <p className="auth-bottom-prompt" style={{ marginTop: 12 }}>
            Remembered your password? <Link to="/login">Back to Sign In</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
