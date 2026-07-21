import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { customerApi, type NotificationItem } from "../api/customerApi";
import "./portal.css";

const navItems = [
  { label: "Dashboard", href: "/customer/dashboard" },
  { label: "RFQs", href: "/customer/rfqs" },
  { label: "Quotations", href: "/customer/quotations" },
  { label: "Orders", href: "/customer/orders" },
  { label: "Invoices", href: "/customer/invoices" },
  { label: "Payments", href: "/customer/payments" },
  { label: "Documents", href: "/customer/documents" },
  { label: "Company", href: "/customer/company" },
  { label: "Notifications", href: "/customer/notifications" },
  { label: "Profile", href: "/customer/profile" },
  { label: "Support", href: "/customer/support" },
];

function NavLinks() {
  return (
    <>
      {navItems.map((item) => (
        <NavLink key={item.href} to={item.href}>
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

/** Breadcrumb derived from the current portal path. */
export function CustomerBreadcrumb() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((part, i) => ({
    label: part.length > 20 ? "Details" : part.charAt(0).toUpperCase() + part.slice(1).replaceAll("-", " "),
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
    customerApi.notifications(1, 5, true).then((d) => setItems(d.items)).catch(() => {});
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
      <button type="button" className="btn btn--ghost" style={{ padding: "0.4rem 0.7rem", position: "relative" }} onClick={() => setOpen(!open)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-ink)" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
        {unread > 0 && (
          <span style={{ position: "absolute", top: "-2px", right: "-2px", background: "var(--c-error)", color: "white", fontSize: "10px", fontWeight: 700, borderRadius: "50%", width: 16, height: 16, display: "grid", placeItems: "center" }}>
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", right: 0, width: 300, background: "var(--c-iron-800)", border: "1px solid var(--c-line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", zIndex: 100, padding: "var(--sp-3)", marginTop: "var(--sp-1)" }}>
          <div style={{ fontWeight: 700, marginBottom: "var(--sp-3)", fontSize: "var(--fs-sm)" }}>Notifications</div>
          {items.length === 0 ? (
            <p className="placeholder-note" style={{ margin: 0 }}>No unread notifications.</p>
          ) : (
            <div style={{ display: "grid", gap: "var(--sp-2)" }}>
              {items.map((n) => (
                <Link key={n.id} to={n.linkPath ?? "/customer/notifications"} style={{ display: "block", padding: "var(--sp-2)", borderRadius: "var(--radius)", background: "var(--glass)", fontSize: "var(--fs-sm)" }} onClick={() => setOpen(false)}>
                  <div style={{ fontWeight: 600 }}>{n.title}</div>
                  <div style={{ color: "var(--c-ink-muted)", fontSize: "var(--fs-xs)" }}>{n.type}</div>
                </Link>
              ))}
            </div>
          )}
          <Link to="/customer/notifications" style={{ display: "block", textAlign: "center", marginTop: "var(--sp-2)", fontSize: "var(--fs-sm)" }} onClick={() => setOpen(false)}>View all</Link>
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="btn btn--ghost" style={{ padding: "0.3rem 0.7rem", fontSize: "var(--fs-sm)", color: "var(--c-ink)", display: "flex", alignItems: "center", gap: "var(--sp-2)" }} onClick={() => setOpen(!open)}>
        <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--c-ember-soft)", color: "var(--c-ember)", display: "grid", placeItems: "center", fontSize: "var(--fs-xs)", fontWeight: 700 }}>
          {(user?.email ?? "U")[0].toUpperCase()}
        </span>
        <span>{user?.email}</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", right: 0, minWidth: 180, background: "var(--c-iron-800)", border: "1px solid var(--c-line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-md)", zIndex: 100, padding: "var(--sp-2)", marginTop: "var(--sp-1)" }}>
          <Link to="/customer/profile" className="portal__nav" style={{ display: "block", padding: "var(--sp-2) var(--sp-3)", fontSize: "var(--fs-sm)", color: "var(--c-ink)" }} onClick={() => setOpen(false)}>Profile</Link>
          <Link to="/customer/settings" className="portal__nav" style={{ display: "block", padding: "var(--sp-2) var(--sp-3)", fontSize: "var(--fs-sm)", color: "var(--c-ink)" }} onClick={() => setOpen(false)}>Settings</Link>
          <hr style={{ border: "none", borderTop: "1px solid var(--c-line)", margin: "var(--sp-1) 0" }} />
          <button type="button" className="btn--ghost" style={{ display: "block", width: "100%", textAlign: "left", padding: "var(--sp-2) var(--sp-3)", fontSize: "var(--fs-sm)", color: "var(--c-ink)", background: "none", border: "none", cursor: "pointer" }} onClick={() => { setOpen(false); void logout(); }}>Sign out</button>
        </div>
      )}
    </div>
  );
}

export function CustomerLayout() {
  return (
    <div className="portal">
      <aside className="portal__sidebar">
        <Link to="/" className="brand" aria-label="Shakti Udyog — public website">
          Shakti <em>Udyog</em>
        </Link>
        <nav className="portal__nav" aria-label="Customer portal">
          <NavLinks />
        </nav>
      </aside>
      <div className="portal__main">
        <header className="portal__topbar">
          <strong>Customer Portal</strong>
          <span className="nav-spacer" />
          <NotificationBell />
          <ProfileMenu />
          <Link to="/" style={{ fontSize: "var(--fs-sm)" }}>Public site</Link>
        </header>
        <nav className="portal-mobile-nav" aria-label="Customer portal">
          <NavLinks />
        </nav>
        <main className="portal__content" id="main-content">
          <CustomerBreadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
