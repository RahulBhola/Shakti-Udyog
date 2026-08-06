import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { config } from "../../config";
import { useAuth } from "../../auth/AuthContext";
import { AuthLayout } from "./AuthLayout";

export function SignUpPage() {
  const navigate = useNavigate();
  const { loginWithProvider } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          companyName: formData.companyName,
          password: formData.password,
        }),
      });

      if (response.ok) {
        navigate("/login", {
          replace: true,
          state: { message: "Registration successful! Please login." }
        });
      } else {
        const data = await response.json();
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Ripple effect
  function handleRipple(e: React.MouseEvent<HTMLButtonElement>) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty("--x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    btn.style.setProperty("--y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }

  return (
    <AuthLayout signUpActive>
      <h2 className="auth-form-heading">Create your account</h2>
      <p className="auth-form-subtitle">Register to access the Shakti Udyog portal.</p>

      <form onSubmit={handleSubmit} className="auth-form">
        {/* Row 1: Full Name + Company Name */}
        <div className="auth-field-grid">
          <div className="auth-field">
            <label htmlFor="su-name">Full Name *</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input id="su-name" className="auth-input" name="fullName" type="text" autoComplete="name" required placeholder="Full name" value={formData.fullName} onChange={handleChange} />
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="su-company">Company Name *</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/></svg>
              </span>
              <input id="su-company" className="auth-input" name="companyName" type="text" autoComplete="organization" required placeholder="Company name" value={formData.companyName} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Row 2: Email + Phone */}
        <div className="auth-field-grid">
          <div className="auth-field">
            <label htmlFor="su-email">Business Email *</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </span>
              <input id="su-email" className="auth-input" name="email" type="email" autoComplete="email" required placeholder="Business email" value={formData.email} onChange={handleChange} />
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="su-phone">Phone Number *</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </span>
              <input id="su-phone" className="auth-input" name="phone" type="tel" autoComplete="tel" required placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Row 3: Password + Confirm Password */}
        <div className="auth-field-grid">
          <div className="auth-field">
            <label htmlFor="su-password">Password *</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input id="su-password" className="auth-input" name="password" type={showPw ? "text" : "password"} autoComplete="new-password" required minLength={8} placeholder="Create password" value={formData.password} onChange={handleChange} />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)} aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            <span style={{ fontSize: 11, color: "var(--auth-text-muted)", marginTop: 2 }}>Min 8 chars, mixed case, digit & symbol</span>
          </div>
          <div className="auth-field">
            <label htmlFor="su-confirm">Confirm Password *</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input id="su-confirm" className="auth-input" name="confirmPassword" type={showConfirmPw ? "text" : "password"} autoComplete="new-password" required minLength={8} placeholder="Confirm password" value={formData.confirmPassword} onChange={handleChange} />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowConfirmPw(v => !v)} aria-label={showConfirmPw ? "Hide password" : "Show password"}>
                {showConfirmPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Terms */}
        <label className="auth-terms">
          <input type="checkbox" required />
          <span>
            I agree to receive emails about product updates, research findings, and event notifications from Shakti Udyog. Your data is handled per our <a href="/privacy-policy" target="_blank">Privacy Policy</a>.
          </span>
        </label>

        {/* Error */}
        {error && <p role="alert" className="auth-error-msg">{error}</p>}

        {/* Submit */}
        <button
          type="submit"
          className="auth-submit"
          disabled={submitting}
          onMouseMove={handleRipple}
        >
          {submitting ? (
            <span className="auth-spinner" />
          ) : (
            <>
              Create Account
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

      {/* Footer */}
      <p className="auth-footer-text">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </AuthLayout>
  );
}
