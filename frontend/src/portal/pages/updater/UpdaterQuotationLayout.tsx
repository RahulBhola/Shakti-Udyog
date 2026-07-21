import { NavLink, Outlet } from "react-router-dom";

const nav = [
  { label: "Quotations", href: "/portal/updater/quotations" },
  { label: "Create Quotation", href: "/portal/updater/quotations/new" },
];

export default function UpdaterQuotationLayout() {
  return (
    <div>
      <nav style={{ display: "flex", gap: "var(--sp-3)", marginBottom: "var(--sp-5)", borderBottom: "1px solid var(--c-line)", paddingBottom: "var(--sp-3)" }}>
        {nav.map((n) => (
          <NavLink key={n.href} to={n.href} className={({ isActive }) => isActive ? "nav-active" : ""}>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
