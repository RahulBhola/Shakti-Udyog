import { useState, type FormEvent } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { config } from "../../config";
import { AuthLayout } from "./AuthLayout";
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing reset token. Please use the valid link sent to your email.");
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
        setError(data.message || "The password reset link is invalid or has expired.");
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout hideTabs title="Invalid Reset Link">
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <p style={{ fontSize: 14, color: "var(--auth-text-body)", marginBottom: 20 }}>
            This password reset link is missing or invalid. Please request a new link.
          </p>
          <Link to="/forgot-password" className="auth-btn-primary" style={{ textDecoration: "none" }}>
            <span>Request New Reset Link</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout hideTabs title="Password Updated">
        <div style={{ textAlign: "center", padding: "10px 0" }}>
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
          <p style={{ fontSize: 14, color: "var(--auth-text-body)", marginBottom: 20 }}>
            Your password has been successfully updated. Redirecting you to sign in…
          </p>
          <Link to="/login" className="auth-btn-primary" style={{ textDecoration: "none" }}>
            <span>Sign In Now</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      hideTabs
      title="Create New Password"
      subtitle="Enter your new secure password (minimum 12 characters)."
    >
      <form onSubmit={handleSubmit} className="auth-form-container">
        <div className="auth-input-group">
          <label htmlFor="new-password" className="auth-input-label">
            New Password
          </label>
          <div className="auth-control-wrap">
            <span className="auth-control-icon">
              <Lock size={17} />
            </span>
            <input
              id="new-password"
              className="auth-text-input auth-text-input--has-toggle"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={12}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              className="auth-eye-toggle"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="auth-input-group">
          <label htmlFor="confirm-new-password" className="auth-input-label">
            Confirm New Password
          </label>
          <div className="auth-control-wrap">
            <span className="auth-control-icon">
              <Lock size={17} />
            </span>
            <input
              id="confirm-new-password"
              className="auth-text-input auth-text-input--has-toggle"
              type={showConfirmPw ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={12}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className="auth-eye-toggle"
              onClick={() => setShowConfirmPw((v) => !v)}
              aria-label={showConfirmPw ? "Hide password" : "Show password"}
            >
              {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
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
          disabled={submitting}
        >
          {submitting ? (
            <span>Updating Password…</span>
          ) : (
            <>
              <span>Save New Password</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>

        <p className="auth-bottom-prompt" style={{ marginTop: 12 }}>
          <Link to="/login">Back to Sign In</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
