import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../auth/ThemeContext";
import { ArrowLeft, Moon, Sun, ShieldCheck } from "lucide-react";
import "./auth.css";

interface AuthLayoutProps {
  children: ReactNode;
  /** Show the "Create Account" / Sign Up tab as active */
  signUpActive?: boolean;
  /** Wide card layout for multi-column forms like Sign Up */
  isWide?: boolean;
  /** Optional custom title & description if not using tabs */
  title?: string;
  subtitle?: string;
  hideTabs?: boolean;
}

/** Precision Crucible & Molten Cast Iron Emblem */
function FoundryEmblem() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 8H26L23 23C22.8 25.5 20.5 27 18 27H14C11.5 27 9.2 25.5 9 23L6 8Z"
        fill="url(#foundryGrad)"
        stroke="#60A5FA"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M4 8H28"
        stroke="#93C5FD"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 13C12 14.5 14 14.5 16 13C18 11.5 20 11.5 22 13"
        stroke="#F97316"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="16" cy="18" r="2.5" fill="#F97316" />
      <defs>
        <linearGradient id="foundryGrad" x1="6" y1="8" x2="26" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E3A8A" stopOpacity="0.8" />
          <stop offset="1" stopColor="#0F172A" stopOpacity="0.95" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AuthLayout({
  children,
  signUpActive,
  isWide,
  title,
  subtitle,
  hideTabs = false,
}: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`auth-root ${isDark ? "theme-dark" : "theme-light"}`}>
      {/* ── Fixed Floating Header ── */}
      <header className="auth-header-bar">
        <Link to="/" className="auth-back-link" title="Return to Public Website">
          <ArrowLeft size={15} />
          <span>Back to Website</span>
        </Link>

        <button
          type="button"
          className="auth-theme-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
          title={`Switch to ${isDark ? "light" : "dark"} theme`}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* ── Main Centered Floating Card ── */}
      <main className={`auth-box ${isWide ? "auth-box--wide" : ""}`}>
        {/* Brand Header */}
        <div className="auth-brand">
          <Link to="/" className="auth-emblem-wrap" title="Shakti Udyog Home">
            <FoundryEmblem />
          </Link>
          <div className="auth-brand-row">
            <span className="auth-brand-name">Shakti Udyog</span>
            <span className="auth-portal-badge">PORTAL</span>
          </div>
          <p className="auth-brand-subtitle">
            Iron Casting Manufacturing & ERP Platform
          </p>
        </div>

        {/* Segmented Pill Tabs (shown on Login & Signup) */}
        {!hideTabs && (
          <div className="auth-segmented-nav" role="tablist">
            <Link
              to="/login"
              role="tab"
              aria-selected={!signUpActive}
              className={`auth-tab-btn ${!signUpActive ? "active" : ""}`}
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              role="tab"
              aria-selected={!!signUpActive}
              className={`auth-tab-btn ${signUpActive ? "active" : ""}`}
            >
              Create Account
            </Link>
          </div>
        )}

        {/* Custom Header if provided */}
        {title && <h1 className="auth-title">{title}</h1>}
        {subtitle && <p className="auth-desc">{subtitle}</p>}

        {/* Form Body */}
        {children}

        {/* Enterprise Security Footer */}
        <div className="auth-security-strip">
          <ShieldCheck size={14} />
          <span>256-bit Encrypted • ISO 9001:2015 Certified Portal</span>
        </div>
      </main>
    </div>
  );
}
