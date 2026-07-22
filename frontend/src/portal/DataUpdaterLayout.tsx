import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./portal.css";

const navItems = [
  { label: "Dashboard", href: "/updater/dashboard" },
  { label: "RFQs", href: "/updater/rfqs" },
  { label: "Quotations", href: "/updater/quotations" },
  { label: "Orders", href: "/updater/orders" },
  { label: "Documents", href: "/updater/documents" },
];

export function UpdaterBreadcrumb() {
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
                <span aria-current="page">{part.charAt(0).toUpperCase() + part.slice(1)}</span>
              ) : (
                <Link to={href}>{part.charAt(0).toUpperCase() + part.slice(1)}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function DataUpdaterLayout() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  return (
    <div className="portal">
      <aside className="portal__sidebar">
        <Link to="/" className="brand" aria-label="Shakti Udyog — public website">
          Shakti <em>Udyog</em>
        </Link>
        <nav className="portal__nav" aria-label="Data updater portal">
          {navItems.map((item) => (
            <NavLink key={item.href} to={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="portal__main">
        <header className="portal__topbar">
          <strong>Data Updater Portal</strong>
          {user && <span style={{ fontSize: "var(--fs-sm)", color: "var(--c-muted)", marginLeft: "0.5rem" }}>{user.email}</span>}
          <span className="nav-spacer" />
          <Link to="/" style={{ fontSize: "var(--fs-sm)" }}>Public site</Link>
          <button className="btn btn--ghost" onClick={() => void handleLogout()} style={{ fontSize: "var(--fs-sm)", color: "var(--c-error)", marginLeft: "0.5rem" }}>
            Logout
          </button>
        </header>
        <nav className="portal-mobile-nav" aria-label="Data updater portal">
          {navItems.map((item) => (
            <NavLink key={item.href} to={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="portal__content" id="main-content">
          <UpdaterBreadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
