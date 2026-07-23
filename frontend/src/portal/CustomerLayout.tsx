import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { customerApi, type NotificationItem } from "../api/customerApi";
import { Sidebar } from "../components/sidebar/Sidebar";
import type { NavSection } from "../components/sidebar/Sidebar";
import "./portal.css";

const customerSections: NavSection[] = [
  {
    label: null,
    items: [{ label: "Dashboard", href: "/customer/dashboard" }],
  },
  {
    label: "Sales",
    items: [
      { label: "RFQs", href: "/customer/rfqs" },
      { label: "Quotations", href: "/customer/quotations" },
      { label: "Orders", href: "/customer/orders" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Invoices", href: "/customer/invoices" },
      { label: "Payments", href: "/customer/payments" },
    ],
  },
  {
    label: "Documents",
    items: [{ label: "Documents", href: "/customer/documents" }],
  },
  {
    label: "Company",
    items: [{ label: "Company", href: "/customer/company" }],
  },
  {
    label: "Account",
    items: [
      { label: "Notifications", href: "/customer/notifications" },
      { label: "Profile", href: "/customer/profile" },
      { label: "Settings", href: "/customer/settings" },
      { label: "Support", href: "/customer/support" },
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

function NotificationBell() {
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
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn--ghost"
        style={{
          padding: "0.4rem 0.7rem",
          position: "relative",
        }}
        onClick={() => setOpen(!open)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--c-ink)"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              background: "var(--c-error)",
              color: "white",
              fontSize: "10px",
              fontWeight: 700,
              borderRadius: "50%",
              width: 16,
              height: 16,
              display: "grid",
              placeItems: "center",
            }}
          >
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            width: 300,
            background: "var(--c-iron-800)",
            border: "1px solid var(--c-line)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-md)",
            zIndex: 100,
            padding: "var(--sp-3)",
            marginTop: "var(--sp-1)",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: "var(--sp-3)",
              fontSize: "var(--fs-sm)",
            }}
          >
            Notifications
          </div>
          {items.length === 0 ? (
            <p className="placeholder-note" style={{ margin: 0 }}>
              No unread notifications.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "var(--sp-2)" }}>
              {items.map((n) => (
                <Link
                  key={n.id}
                  to={n.linkPath ?? "/customer/notifications"}
                  style={{
                    display: "block",
                    padding: "var(--sp-2)",
                    borderRadius: "var(--radius)",
                    background: "var(--glass)",
                    fontSize: "var(--fs-sm)",
                  }}
                  onClick={() => setOpen(false)}
                >
                  <div style={{ fontWeight: 600 }}>{n.title}</div>
                  <div
                    style={{
                      color: "var(--c-ink-muted)",
                      fontSize: "var(--fs-xs)",
                    }}
                  >
                    {n.type}
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link
            to="/customer/notifications"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: "var(--sp-2)",
              fontSize: "var(--fs-sm)",
            }}
            onClick={() => setOpen(false)}
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}

export function CustomerLayout() {
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  return (
    <div className="admin-portal-layout">
      <Sidebar sections={customerSections} onLogout={handleLogout} />

      <div className="admin-portal-main">
        <header className="portal__topbar">
          <strong>Customer Portal</strong>
          <span className="nav-spacer" />
          <NotificationBell />
          <Link to="/" style={{ fontSize: "var(--fs-sm)" }}>
            Public site
          </Link>
          <button
            className="btn btn--ghost"
            onClick={() => void handleLogout()}
            style={{
              fontSize: "var(--fs-sm)",
              color: "var(--c-error)",
              marginLeft: "0.5rem",
            }}
          >
            Logout
          </button>
        </header>
        <nav className="portal-mobile-nav" aria-label="Customer portal">
          {customerSections.map((section) =>
            section.items.map((item) => (
              <NavLink key={item.href} to={item.href}>
                {item.label}
              </NavLink>
            )),
          )}
        </nav>
        <main className="portal__content" id="main-content">
          <CustomerBreadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
}