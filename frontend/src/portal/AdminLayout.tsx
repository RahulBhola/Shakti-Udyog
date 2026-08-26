import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { User, Settings, LogOut, ExternalLink, Sun, Moon } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../auth/ThemeContext";
import { Sidebar } from "../components/sidebar/Sidebar";
import type { NavSection } from "../components/sidebar/Sidebar";
import { PortalNotificationBell } from "../components/notifications/PortalNotificationBell";
import { ProfileProgressBar, calculateProfileCompleteness } from "./components/ProfileCompletion";
import { UserAvatar } from "../components/ui";
import { cn } from "../lib/utils";
import "./portal.css";

const adminSections: NavSection[] = [
  {
    label: null,
    items: [{ label: "Dashboard", href: "/admin/dashboard" }],
  },
  {
    label: "Sales",
    items: [
      { label: "Enquiries", href: "/admin/enquiries" },
      { label: "Quotes", href: "/admin/quotations" },
      { label: "Orders", href: "/admin/orders" },
    ],
  },
  {
    label: "Production",
    items: [{ label: "Manufacturing Board", href: "/admin/production" }],
  },
  {
    label: "Finance",
    items: [{ label: "Invoices", href: "/admin/invoices" }],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", href: "/admin/users" },
      { label: "Engineers", href: "/admin/engineers" },
      { label: "Companies", href: "/admin/companies" },
      { label: "Products", href: "/admin/products" },
      { label: "Settings", href: "/admin/settings" },
      { label: "Activity Log", href: "/admin/audit-logs" },
    ],
  },
  {
    label: "Reporting",
    items: [{ label: "Reports", href: "/admin/reports" }],
  },
];

export function AdminBreadcrumb() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb" style={{ padding: 0 }}>
      <ol>
        {parts.map((part, i) => {
          const href = "/" + parts.slice(0, i + 1).join("/");
          const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)
            || /^[0-9a-f]{32}$/i.test(part);
          const label = isGuid ? "Product Details" : (part.charAt(0).toUpperCase() + part.slice(1).replaceAll("-", " "));
          return (
            <li key={href}>
              {i === parts.length - 1 ? (
                <span aria-current="page">{label}</span>
              ) : (
                <Link to={href}>{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function AdminLayout() {
  const { user } = useAuth();
  const displayName = user?.fullName ?? user?.email ?? "User";
  const initials = displayName.charAt(0).toUpperCase();

  const isAdmin = user?.roles.includes("Admin");
  const isEngineer = user?.roles.includes("Engineer");

  const navSections = useMemo(() => {
    if (isAdmin) return adminSections;
    if (isEngineer) {
      return adminSections.filter(
        (s) => s.label === null || s.label === "Sales" || s.label === "Production"
      );
    }
    return adminSections;
  }, [isAdmin, isEngineer]);

  const portalTitle = isAdmin ? "Admin Portal" : isEngineer ? "Engineer Portal" : "Portal";

  return (
    <div className="admin-portal-layout">
      <Sidebar sections={navSections} />

      <div className="admin-portal-main">
        {/* Top Bar */}
        <header className="portal__topbar">
          <strong className="text-[15px] font-semibold text-[var(--text-primary)]">{portalTitle}</strong>

          <span className="nav-spacer" />

          {/* Public site link */}
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary)] no-underline transition-colors duration-200"
          >
            <ExternalLink size={13} />
            Public site
          </Link>

          {/* Notification Bell */}
          <PortalNotificationBell />

          {/* Profile Avatar */}
          <ProfileAvatar initials={initials} displayName={displayName} />
        </header>

        {/* Mobile Nav */}
        <nav className="portal-mobile-nav" aria-label="Admin portal">
          {adminSections.map((section) =>
            section.items.map((item) => (
              <NavLink key={item.href} to={item.href}>
                {item.label}
              </NavLink>
            )),
          )}
        </nav>

        {/* Main Content */}
        <main className="portal__content" id="main-content">
          <AdminBreadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile Avatar — Theme-aware                                       */
/* ------------------------------------------------------------------ */

function ProfileAvatar({ initials, displayName }: { initials: string; displayName: string }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    await logout();
    window.location.href = "/login";
  }, [logout]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const roleLabel =
    user?.roles.includes("Admin") ? "Administrator"
    : user?.roles.includes("Engineer") ? "Engineer"
    : "User";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)] transition-transform hover:scale-105"
        aria-label="User menu"
        aria-expanded={open}
      >
        <UserAvatar
          avatarUrl={user?.avatarUrl}
          displayName={displayName}
          initials={initials}
          size="lg"
          className="shadow-md hover:shadow-lg"
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 z-50 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-1.5 shadow-lg">
          <div className="px-3 py-2.5 border-b border-[var(--border-default)] mb-1">
            <div className="flex items-center gap-3">
              <UserAvatar
                avatarUrl={user?.avatarUrl}
                displayName={displayName}
                initials={initials}
                size="md"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{displayName}</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{roleLabel}</div>
              </div>
            </div>
            {/* Profile Completion Indicator */}
            {user && (
              <div className="mt-2.5 pt-2 border-t border-[var(--border-default)]">
                <Link to="/admin/profile" onClick={() => setOpen(false)} className="block no-underline hover:no-underline">
                  <ProfileProgressBar
                    percentage={calculateProfileCompleteness(user).percentage}
                    size="sm"
                    showLabel
                  />
                </Link>
              </div>
            )}
          </div>

          <DropdownItem icon={User} label="Profile" href="/admin/profile" />
          <DropdownItem icon={Settings} label="Settings" href="/admin/settings" />
          <DropdownItem
            icon={theme === "light" ? Moon : Sun}
            label={theme === "light" ? "Dark mode" : "Light mode"}
            onClick={toggleTheme}
          />

          <div className="border-t border-[var(--border-default)] my-1" />

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)] transition-all duration-200"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  icon: typeof User;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const classes = cn(
    "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium",
    "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]",
    "transition-all duration-200 no-underline hover:no-underline",
  );

  if (href) {
    return <Link to={href} className={classes}><Icon size={15} />{label}</Link>;
  }
  return <button type="button" onClick={onClick} className={classes}><Icon size={15} />{label}</button>;
}