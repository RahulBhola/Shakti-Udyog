import { type ReactNode } from "react";
import { useTheme } from "../../auth/ThemeContext";

interface AuthLayoutProps {
  children: ReactNode;
  /** Show the "Sign Up" tab as active instead of "Login" */
  signUpActive?: boolean;
}

/** Company logo — adjusts stroke for dark/light theme automatically via currentColor. */
function LogoIcon() {
  return (
    <svg  width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="6" width="28" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M10 6V2h12v4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 12h3m10 0h3m-13 0h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 18h3m5 0h3m-11 0h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 24h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FeatureIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

const features = [
  {
    title: "RFQ to Quotation",
    description: "Create RFQs and get accurate quotations with ease.",
  },
  {
    title: "Track Every Stage",
    description: "Monitor orders, production, invoices and payments in real-time.",
  },
  {
    title: "Secure & Reliable",
    description: "Enterprise-grade security to keep your business data safe.",
  },
];

export function AuthLayout({ children, signUpActive }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`auth-split ${isDark ? "theme-dark" : "theme-light"}`}>
      {/* ── Left Panel ─────────────────────────────────────────── */}
      <div className="auth-left">
        {/* Content area (scrolls if needed) */}
        <div className="auth-left-content">
          {/* Top branding */}
          <div className="auth-logo">
            <LogoIcon />
            <span className="auth-logo-text">ShaktiUdyog</span>
          </div>
          <span className="auth-subtitle">Iron Casting Management System</span>

          {/* Hero */}
          <h1 className="auth-hero-heading">
            Powering Precision.<br />
            <span className="auth-hero-highlight">Casting Excellence.</span>
          </h1>
          <p className="auth-hero-desc">
            Streamline RFQs, quotations, orders and production with a complete end-to-end casting management system.
          </p>

          {/* Features */}
          <div className="auth-features">
            {features.map((f, i) => (
              <div key={i} className="auth-feature-item">
                <span className="auth-feature-icon">
                  <FeatureIcon />
                </span>
                <div>
                  <p className="auth-feature-title">{f.title}</p>
                  <p className="auth-feature-desc">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image spacer — fills remaining space */}
        <div className="auth-image-spacer">
          <div className="auth-image-spacer-bg" />
        </div>

        {/* Theme toggle moved to right panel */}
      </div>

      {/* ── Right Panel ────────────────────────────────────────── */}
      <div className="auth-right">
        {/* Theme toggle */}
        <button
          type="button"
          className="auth-theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
          title={`Switch to ${isDark ? "light" : "dark"} theme`}
        >
          <span className="auth-theme-toggle-icon">
            {isDark ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </span>
        </button>

        <div className="auth-card-wrapper">
          {/* Segmented tabs */}
          <div className="auth-segmented" role="tablist">
            <a
              href="/login"
              role="tab"
              aria-selected={!signUpActive}
              className={`auth-segmented-btn ${!signUpActive ? "active" : ""}`}
            >
              Login
            </a>
            <a
              href="/signup"
              role="tab"
              aria-selected={!!signUpActive}
              className={`auth-segmented-btn ${signUpActive ? "active" : ""}`}
            >
              Sign Up
            </a>
          </div>

          {children}

          {/* Security footer */}
          <div className="auth-security-footer">
            <ShieldIcon />
            <span>Your data is protected with industry-standard security.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
