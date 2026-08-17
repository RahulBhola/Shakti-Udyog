import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { config } from "../../config";
import { useAuth } from "../../auth/AuthContext";
import { AuthLayout } from "./AuthLayout";
import {
  User,
  Building2,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

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
      setError("Passwords do not match. Please verify.");
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
          state: { message: "Registration successful! Please sign in with your credentials." },
        });
      } else {
        const data = await response.json();
        setError(data.message || "Registration could not be completed. Please try again.");
      }
    } catch {
      setError("Unable to reach the server. Please check your network connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout signUpActive isWide>
      <form onSubmit={handleSubmit} className="auth-form-container">
        {/* Row 1: Full Name & Company Name */}
        <div className="auth-field-row-grid">
          <div className="auth-input-group">
            <label htmlFor="su-name" className="auth-input-label">
              Full Name *
            </label>
            <div className="auth-control-wrap">
              <span className="auth-control-icon">
                <User size={17} />
              </span>
              <input
                id="su-name"
                className="auth-text-input"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                placeholder="Rahul Sharma"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label htmlFor="su-company" className="auth-input-label">
              Company Name *
            </label>
            <div className="auth-control-wrap">
              <span className="auth-control-icon">
                <Building2 size={17} />
              </span>
              <input
                id="su-company"
                className="auth-text-input"
                name="companyName"
                type="text"
                autoComplete="organization"
                required
                placeholder="Apex Engineering Ltd"
                value={formData.companyName}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Email & Phone Number */}
        <div className="auth-field-row-grid">
          <div className="auth-input-group">
            <label htmlFor="su-email" className="auth-input-label">
              Business Email *
            </label>
            <div className="auth-control-wrap">
              <span className="auth-control-icon">
                <Mail size={17} />
              </span>
              <input
                id="su-email"
                className="auth-text-input"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label htmlFor="su-phone" className="auth-input-label">
              Phone Number *
            </label>
            <div className="auth-control-wrap">
              <span className="auth-control-icon">
                <Phone size={17} />
              </span>
              <input
                id="su-phone"
                className="auth-text-input"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Row 3: Password & Confirm Password */}
        <div className="auth-field-row-grid">
          <div className="auth-input-group">
            <label htmlFor="su-password" className="auth-input-label">
              Password *
            </label>
            <div className="auth-control-wrap">
              <span className="auth-control-icon">
                <Lock size={17} />
              </span>
              <input
                id="su-password"
                className="auth-text-input auth-text-input--has-toggle"
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Create secure password"
                value={formData.password}
                onChange={handleChange}
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
            <label htmlFor="su-confirm" className="auth-input-label">
              Confirm Password *
            </label>
            <div className="auth-control-wrap">
              <span className="auth-control-icon">
                <Lock size={17} />
              </span>
              <input
                id="su-confirm"
                className="auth-text-input auth-text-input--has-toggle"
                name="confirmPassword"
                type={showConfirmPw ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
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
        </div>

        {/* Password Helper Hint */}
        <div className="auth-pw-hint">
          <CheckCircle2 size={13} color="#3B82F6" />
          <span>Min 8 characters with mixed case, digits & special symbols</span>
        </div>

        {/* Terms & Privacy Checkbox */}
        <label className="auth-terms-clause">
          <input type="checkbox" required />
          <span>
            I agree to the{" "}
            <Link to="/terms-of-use" target="_blank">
              Terms of Use
            </Link>{" "}
            and acknowledge the{" "}
            <Link to="/privacy-policy" target="_blank">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {/* Error Alert */}
        {error && (
          <div role="alert" className="auth-alert-error">
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="auth-btn-primary"
          disabled={submitting}
        >
          {submitting ? (
            <span>Creating your account…</span>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="auth-sep-row">
        <span>or sign up with</span>
      </div>

      {/* Social Options (Google & Apple) */}
      <div className="auth-social-grid">
        <button
          type="button"
          className="auth-btn-social"
          onClick={() => loginWithProvider("google")}
          title="Sign up with Google"
        >
          <GoogleIcon />
          <span>Google</span>
        </button>
        <button
          type="button"
          className="auth-btn-social"
          onClick={() => loginWithProvider("apple")}
          title="Sign up with Apple"
        >
          <AppleIcon />
          <span>Apple</span>
        </button>
      </div>

      {/* Footer */}
      <p className="auth-bottom-prompt">
        Already registered? <Link to="/login">Sign in here</Link>
      </p>
    </AuthLayout>
  );
}
