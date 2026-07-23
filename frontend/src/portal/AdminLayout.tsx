import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Bell, User, Settings, Palette, LogOut, ExternalLink, Sun, Moon } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../auth/ThemeContext";
import { Sidebar } from "../components/sidebar/Sidebar";
import type { NavSection } from "../components/sidebar/Sidebar";
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
      { label: "RFQs", href: "/admin/rfqs" },
      { label: "Quotations", href: "/admin/quotations" },
      { label: "Orders", href: "/admin/orders" },
    ],
  },
  {
    label: "Production",
    items: [{ label: "Manufacturing Board", href: "/admin/production" }],
  },
  {
    label: "Documents",
    items: [{ label: "Upload Center", href: "/admin/documents" }],
  },
  {
    label: "Finance",
    items: [{ label: "Invoices", href: "/admin/invoices" }],
  },
  {
    label: "Administration",
    items: [
      { label: "Users", href: "/admin/users" },
      { label: "Companies", href: "/admin/companies" },
      { label: "Products", href: "/admin/products" },
      { label: "Categories", href: "/admin/categories" },
      { label: "Settings", href: "/admin/settings" },
      { label: "Audit Logs", href: "/admin/audit-logs" },
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
          return (
            <li key={href}>
              {i === parts.length - 1 ? (
                <span aria-current="page">
                  {part.charAt(0).toUpperCase() + part.slice(1).replaceAll("-", " ")}
                </span>
              ) : (
                <Link to={href}>
                  {part.charAt(0).toUpperCase() + part.slice(1).replaceAll("-", " ")}
                </Link>
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

  return (
    <div className="admin-portal-layout">
      <Sidebar sections={adminSections} />

      <div className="admin-portal-main">
        {/* Top Bar */}
        <header className="portal__topbar">
          <strong className="text-[15px] font-semibold text-[var(--text-primary)]">Admin Portal</strong>

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
          <NotificationBell />

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
/*  Notification Bell — Theme-aware                                    */
/* ------------------------------------------------------------------ */

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full",
          "text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface-hover)]",
          "shadow-sm border border-[var(--border-default)]",
          "transition-all duration-200",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)]",
        )}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={16} />
        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[var(--color-danger)] rounded-full ring-2 ring-[var(--bg-header)]" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 z-50 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-3 shadow-lg">
          <div className="text-sm font-semibold text-[var(--text-primary)] mb-2">Notifications</div>
          <div className="text-xs text-[var(--text-secondary)] py-4 text-center">No new notifications</div>
        </div>
      )}
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
    : user?.roles.includes("DataUpdater") ? "Data Updater"
    : "User";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full",
          "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)]",
          "text-white text-sm font-bold",
          "shadow-md hover:shadow-lg",
          "transition-all duration-200",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)]",
        )}
        aria-label="User menu"
        aria-expanded={open}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 z-50 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-1.5 shadow-lg">
          <div className="px-3 py-2.5 border-b border-[var(--border-default)] mb-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white text-xs font-bold shrink-0">
                {initials}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{displayName}</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{roleLabel}</div>
              </div>
            </div>
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