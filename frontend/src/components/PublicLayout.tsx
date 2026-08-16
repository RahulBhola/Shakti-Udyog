import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../auth/ThemeContext";
import { company } from "../content/company";
import { cta, navItems } from "../content/navigation";
import { Sun, Moon, Menu, X, ArrowRight, User } from "lucide-react";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return null;
}

export function BrandLogo({ isLight = false }: { isLight?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0 select-none">
      {/* Authentic Foundry Molten Ladle Icon */}
      <svg
        className="w-7 h-7 shrink-0 drop-shadow-[0_2px_8px_rgba(234,88,12,0.35)]"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Handle */}
        <path
          d="M20 15L30 5C30.6 4.4 31.5 4.4 32.1 5C32.7 5.6 32.7 6.5 32.1 7.1L22 17"
          stroke="#EA580C"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Crucible / Ladle Bowl */}
        <path
          d="M7 16C7 24.5 12 28.5 19 28.5C24.5 28.5 28 25 29 20.5H10C8.5 20.5 7.5 19.5 7 18V16Z"
          fill="url(#ladleBrandGrad)"
        />
        {/* Crucible Rim */}
        <path
          d="M6 15C6 14.2 6.6 13.5 7.5 13.5H28.5C29.4 13.5 30 14.2 30 15C30 15.8 29.4 16.5 28.5 16.5H7.5C6.6 16.5 6 15.8 6 15Z"
          fill="#F97316"
        />
        {/* Molten Surface */}
        <ellipse cx="18" cy="15" rx="10" ry="2.2" fill="#FDBA74" />
        {/* Pouring Molten Stream */}
        <path
          d="M8 18C7.5 21 6.5 26 6 29C5.8 30 6.6 31 7.5 31C8.4 31 9.2 30 9 29C8.5 26 8.5 21 8 18Z"
          fill="#EA580C"
        />
        <circle cx="7.5" cy="30" r="2" fill="#FF8A3D" />

        <defs>
          <linearGradient id="ladleBrandGrad" x1="7" y1="16" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EA580C" />
            <stop offset="1" stopColor="#C2410C" />
          </linearGradient>
        </defs>
      </svg>

      {/* Brand Typography */}
      <div className="flex flex-col leading-[1.08]">
        <span
          className={`text-[17px] font-bold tracking-tight font-sans transition-colors ${
            isLight ? "text-neutral-900" : "text-white"
          }`}
        >
          Shakti
        </span>
        <span className="text-[14px] font-bold tracking-tight text-orange-500 font-sans">
          Udyog
        </span>
      </div>
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const isLight = theme === "light";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  function portalHref() {
    if (!user) return "/login";
    const role = user.roles[0];
    if (role === "Admin" || role === "Engineer") return "/admin/dashboard";
    return "/customer/dashboard";
  }

  function portalLabel() {
    if (!user) return "Login";
    const role = user.roles[0];
    if (role === "Admin" || role === "Engineer") return "Admin Portal";
    return "Customer Portal";
  }

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed top-3 sm:top-4 left-0 right-0 z-50 px-3 sm:px-6 pointer-events-none">
      <div
        className={`max-w-[1400px] mx-auto px-5 sm:px-7 py-2.5 sm:py-3 rounded-2xl sm:rounded-[22px] border transition-all duration-300 pointer-events-auto flex items-center justify-between gap-4 ${
          isLight
            ? isScrolled
              ? "bg-white/95 backdrop-blur-2xl border-neutral-300 shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
              : "bg-white/90 backdrop-blur-xl border-neutral-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
            : isScrolled
              ? "bg-[#0b0c10]/95 backdrop-blur-2xl border-white/[0.12] shadow-[0_12px_45px_rgba(0,0,0,0.85)]"
              : "bg-[#0c0d12]/80 backdrop-blur-xl border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.7)]"
        }`}
      >
        {/* Brand Logo Link */}
        <Link
          to="/"
          className="group hover:opacity-95 transition-opacity inline-flex items-center shrink-0"
          aria-label={`${company.name} — home`}
        >
          <BrandLogo isLight={isLight} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden xl:flex items-center gap-6 2xl:gap-8"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                `relative text-sm font-medium transition-colors py-1 ${
                  isActive
                    ? isLight
                      ? "text-orange-500 font-semibold"
                      : "text-white font-semibold"
                    : isLight
                      ? "text-neutral-600 hover:text-neutral-950"
                      : "text-neutral-400 hover:text-neutral-100"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-2 left-0 right-0 h-[2px] bg-orange-500 rounded-full shadow-[0_0_8px_rgba(255,109,0,0.8)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions Cluster */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Primary CTA: Request a Quote */}
          <Link
            to={cta.primary.href}
            className={`group hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${
              isLight
                ? "text-orange-600 bg-orange-500/5 border border-orange-500 hover:bg-orange-500 hover:text-white shadow-[0_0_12px_rgba(255,109,0,0.15)] hover:shadow-[0_0_20px_rgba(255,109,0,0.4)]"
                : "text-white bg-orange-500/15 border border-orange-500/70 hover:bg-orange-500 hover:border-orange-500 shadow-[0_0_15px_rgba(255,109,0,0.2)] hover:shadow-[0_0_25px_rgba(255,109,0,0.5)]"
            }`}
          >
            <span>{cta.primary.label}</span>
            <ArrowRight
              className={`w-3.5 h-3.5 transition-all group-hover:translate-x-0.5 ${
                isLight ? "text-orange-500 group-hover:text-white" : "text-orange-400 group-hover:text-white"
              }`}
            />
          </Link>

          {/* Auth Actions: Login & Sign Up or User portal */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to={portalHref()}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  isLight
                    ? "text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200"
                    : "text-neutral-300 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5 text-neutral-400" />
                <span className="max-w-[100px] truncate">{user.email}</span>
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="px-3 py-2 rounded-full text-xs font-medium text-neutral-400 hover:text-red-400 bg-neutral-900/60 border border-neutral-800 hover:border-red-500/30 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  isLight
                    ? "text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200"
                    : "text-neutral-300 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 hover:text-white"
                }`}
              >
                <span>Login</span>
                <User className="w-3.5 h-3.5 text-neutral-400" />
              </Link>
              <Link
                to="/signup"
                className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  isLight
                    ? "text-neutral-700 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200"
                    : "text-neutral-300 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 hover:text-white"
                }`}
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Compact Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
            title={`Switch to ${isLight ? "dark" : "light"} mode`}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm ${
              isLight
                ? "bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-950"
                : "bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 text-orange-400/80 hover:text-orange-400"
            }`}
          >
            {isLight ? (
              <Moon className="w-4 h-4 text-neutral-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Mobile Menu Trigger Button */}
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className={`xl:hidden w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isLight
                ? "bg-neutral-100 border border-neutral-200 text-neutral-700 hover:bg-neutral-200"
                : "bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white"
            }`}
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {open && (
        <div
          id="mobile-nav"
          className={`xl:hidden max-w-[1400px] mx-auto mt-2 px-4 py-4 rounded-2xl border pointer-events-auto transition-all ${
            isLight
              ? "bg-white/95 backdrop-blur-2xl border-neutral-200 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
              : "bg-[#0c0d12]/95 backdrop-blur-2xl border-white/[0.08] shadow-[0_12px_45px_rgba(0,0,0,0.9)]"
          }`}
        >
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/"}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? isLight
                        ? "text-orange-600 bg-orange-50 font-semibold"
                        : "text-white bg-orange-500/15 font-semibold"
                      : isLight
                        ? "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100"
                        : "text-neutral-300 hover:text-white hover:bg-white/[0.04]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(255,109,0,0.8)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}

            <div className="pt-3 mt-2 border-t border-neutral-200/60 dark:border-white/[0.06] space-y-2">
              <Link
                to={cta.primary.href}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-xs font-semibold tracking-wide text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-[0_0_15px_rgba(255,109,0,0.2)]"
              >
                <span>{cta.primary.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </Link>

              {user ? (
                <div className="space-y-1.5 pt-1">
                  <Link
                    to={portalHref()}
                    className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-full text-xs font-medium ${
                      isLight
                        ? "text-neutral-800 bg-neutral-100 border border-neutral-200"
                        : "text-neutral-200 bg-neutral-900/80 border border-neutral-800"
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{user.email} · {portalLabel()}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex items-center justify-center w-full py-2 rounded-full text-xs font-medium text-red-500 bg-red-500/5 border border-red-500/20"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    to="/login"
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium ${
                      isLight
                        ? "text-neutral-700 bg-neutral-100 border border-neutral-200"
                        : "text-neutral-300 bg-neutral-900/80 border border-neutral-800"
                    }`}
                  >
                    <span>Login</span>
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                  </Link>
                  <Link
                    to="/signup"
                    className={`flex items-center justify-center py-2 rounded-full text-xs font-medium ${
                      isLight
                        ? "text-neutral-700 bg-neutral-100 border border-neutral-200"
                        : "text-neutral-300 bg-neutral-900/80 border border-neutral-800"
                    }`}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

import { SiteFooter } from "./SiteFooter";

export function PublicLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <ScrollToTop />
      <Header />
      <main id="main-content"><Outlet /></main>
      <SiteFooter />
    </>
  );
}
