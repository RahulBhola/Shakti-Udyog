import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./portal.css";

const navItems = [
  { label: "Dashboard", href: "/customer/dashboard" },
  { label: "RFQs", href: "/customer/rfqs" },
  { label: "Quotations", href: "/customer/quotations" },
  { label: "Orders", href: "/customer/orders" },
  { label: "Invoices", href: "/customer/invoices" },
  { label: "Documents", href: "/customer/documents" },
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

export function CustomerLayout() {
  const { user, logout } = useAuth();

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
          <span className="portal__user">{user?.email}</span>
          <Link to="/" style={{ fontSize: "var(--fs-sm)" }}>Public site</Link>
          <button type="button" className="btn btn--ghost" style={{ color: "var(--c-ink)", padding: "0.4rem 0.9rem" }} onClick={() => void logout()}>
            Sign out
          </button>
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
