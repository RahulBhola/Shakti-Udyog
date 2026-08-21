import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Bell, User, LogOut, ExternalLink, Sun, Moon, HelpCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../auth/ThemeContext";
import { customerApi, type NotificationItem } from "../api/customerApi";
import { Sidebar } from "../components/sidebar/Sidebar";
import type { NavSection } from "../components/sidebar/Sidebar";
import { cn } from "../lib/utils";
import "./portal.css";

const customerSections: NavSection[] = [
  {
    label: null,
    items: [{ label: "Dashboard", href: "/customer/dashboard" }],
  },
  {
    label: "Orders & Quotes",
    items: [
      { label: "Enquiries", href: "/customer/enquiries" },
      { label: "Quotations", href: "/customer/quotations" },
      { label: "My Orders", href: "/customer/orders" },
    ],
  },
  {
    label: "Finance & Files",
    items: [
      { label: "Invoices & Billing", href: "/customer/invoices" },
      { label: "Document Library", href: "/customer/documents" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Company & Profile", href: "/customer/profile" },
      { label: "Help & Support", href: "/customer/support" },
    ],
  },
];

/** Breadcrumb derived from the current portal path. */
export function CustomerBreadcrumb() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, i) => ({
    label:
      part.length > 20
        ? "Details"
        : part.charAt(0).toUpperCase() +
          part.slice(1).replaceAll("-", " "),
    href: "/" + parts.slice(0, i + 1).join("/"),
  }));

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb" style={{ padding: 0 }}>
      <ol>
        {crumbs.map((crumb, i) => (
          <li key={crumb.href}>
            {i === crumbs.length - 1 ? (
              <span aria-current="page">{crumb.label}</span>
            ) : (
              <Link to={crumb.href}>{crumb.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function CustomerLayout() {
  const { user } = useAuth();
  const displayName = user?.fullName ?? user?.email ?? "Customer";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="admin-portal-layout">
      <Sidebar sections={customerSections} />

      <div className="admin-portal-main">
        {/* Top Bar */}
        <header className="portal__topbar">
          <strong className="text-[15px] font-semibold text-[var(--text-primary)]">Customer Portal</strong>

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
          <CustomerNotificationBell />

          {/* Profile Avatar */}
          <CustomerProfileAvatar initials={initials} displayName={displayName} />
        </header>

        {/* Mobile Nav */}
        <nav className="portal-mobile-nav" aria-label="Customer portal">
          {customerSections.map((section) =>
            section.items.map((item) => (
              <NavLink key={item.href} to={item.href}>
                {item.label}
              </NavLink>
            )),
          )}
        </nav>

        {/* Main Content */}
        <main className="portal__content" id="main-content">
          <CustomerBreadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Notification Bell — Theme-aware                                    */
/* ------------------------------------------------------------------ */

function CustomerNotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    customerApi
      .notifications(1, 5, true)
      .then((d) => setItems(d.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = items.length;

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
        {unread > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[var(--color-danger)] rounded-full ring-2 ring-[var(--bg-header)]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-3 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-2 mb-2">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Notifications</span>
            {unread > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
                {unread} new
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-xs text-[var(--text-secondary)] py-6 text-center">No unread notifications</div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
              {items.map((n) => (
                <Link
                  key={n.id}
                  to={n.linkPath ?? "/customer/notifications"}
                  className="flex flex-col gap-0.5 p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] no-underline transition-colors duration-150"
                  onClick={() => setOpen(false)}
                >
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{n.title}</span>
                  <span className="text-[11px] text-[var(--text-secondary)]">{n.type}</span>
                </Link>
              ))}
            </div>
          )}

          <div className="border-t border-[var(--border-default)] pt-2 mt-2 text-center">
            <Link
              to="/customer/notifications"
              className="text-xs font-semibold text-[var(--color-primary)] hover:underline no-underline"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Customer Profile Avatar Dropdown — Theme-aware                     */
/* ------------------------------------------------------------------ */

function CustomerProfileAvatar({ initials, displayName }: { initials: string; displayName: string }) {
  const { logout } = useAuth();
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
        <div className="absolute right-0 top-full mt-2 w-56 z-50 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-1.5 shadow-lg backdrop-blur-xl">
          <div className="px-3 py-2.5 border-b border-[var(--border-default)] mb-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white text-xs font-bold shrink-0">
                {initials}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--text-primary)] truncate">{displayName}</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-medium">Customer Account</div>
              </div>
            </div>
          </div>

          <CustomerDropdownItem icon={User} label="Company & Profile" href="/customer/profile" />
          <CustomerDropdownItem icon={HelpCircle} label="Help & Support" href="/customer/support" />
          <CustomerDropdownItem
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

function CustomerDropdownItem({
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