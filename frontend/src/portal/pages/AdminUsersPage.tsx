import { useCallback, useEffect, useMemo, useState, type ReactNode, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch } from "../../api/client";
import { EmptyState, Loading } from "../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { formatDate } from "../shared";
import {
  RefreshCw, ChevronLeft, ChevronRight, X, Eye, MoreVertical,
  Mail, Phone, KeyRound, Building2, Ban, CheckCircle2, Filter, X as CloseIcon,
  User as UserIcon, Users, UserCheck, UserX, Crown, TrendingUp, UserPlus,
} from "lucide-react";
import "./erpListView.css";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
  companyName: string | null;
  role: string;
}

interface Filters {
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  company: string;
  joinedFrom: string;
  joinedTo: string;
}

const EMPTY_FILTERS: Filters = {
  name: "", email: "", phone: "", role: "All", status: "All", company: "All", joinedFrom: "", joinedTo: "",
};
const ROLES = ["Admin", "Engineer", "Customer"];
const PAGE_SIZES = [10, 20, 50];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function initials(name: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
}

function roleInfo(role: string | null | undefined): { label: string; tone: string } {
  const r = role?.trim() || "Customer";
  switch (r) {
    case "Admin": return { label: "Administrator", tone: "blue" };
    case "Engineer": return { label: "Engineer", tone: "orange" };
    case "Customer": return { label: "Customer", tone: "gray" };
    default: return { label: r, tone: "gray" };
  }
}

function lastLoginLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return `Today ${time}`;
  if (diffDays === 1) return `Yesterday ${time}`;
  return formatDate(iso);
}

function matches(u: AdminUser, f: Filters): boolean {
  if (f.name && !(u.fullName ?? "").toLowerCase().includes(f.name.toLowerCase())) return false;
  if (f.email && !u.email.toLowerCase().includes(f.email.toLowerCase())) return false;
  if (f.phone && !(u.phoneNumber ?? "").toLowerCase().includes(f.phone.toLowerCase())) return false;
  if (f.role !== "All" && u.role !== f.role) return false;
  if (f.status === "Active" && !u.isActive) return false;
  if (f.status === "Inactive" && u.isActive) return false;
  if (f.company !== "All" && (u.companyName ?? "") !== f.company) return false;
  if (f.joinedFrom && new Date(u.createdAtUtc) < new Date(f.joinedFrom)) return false;
  if (f.joinedTo) {
    const end = new Date(f.joinedTo);
    end.setHours(23, 59, 59, 999);
    if (new Date(u.createdAtUtc) > end) return false;
  }
  return true;
}

function hasActive(f: Filters): boolean {
  return f.name !== "" || f.email !== "" || f.phone !== "" || f.role !== "All"
    || f.status !== "All" || f.company !== "All" || f.joinedFrom !== "" || f.joinedTo !== "";
}

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

function RoleBadge({ role }: { role: string }) {
  const r = roleInfo(role);
  return <span className={`inv-badge inv-badge--${r.tone}`}>{r.label}</span>;
}

function StatusBadge({ active }: { active: boolean }) {
  return active
    ? <span className="inv-badge inv-badge--green"><span className="inv-dot" /> Active</span>
    : <span className="inv-badge inv-badge--red"><span className="inv-dot" /> Inactive</span>;
}

function Modal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  return (
    <div className="inv-modal-backdrop" onClick={onClose}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="User details">
        <div className="inv-modal__head">
          <span className="inv-modal__title">User Details</span>
          <button className="inv-icon-btn" onClick={onClose} aria-label="Close"><CloseIcon size={16} /></button>
        </div>
        <div className="inv-modal__body">
          <div className="inv-customer" style={{ paddingBottom: 4 }}>
            <span className="inv-avatar" style={{ width: 52, height: 52, fontSize: 18 }}>{initials(user.fullName)}</span>
            <div>
              <div className="inv-customer__name" style={{ fontSize: 16 }}>{user.fullName ?? "—"}</div>
              <div className="inv-customer__contact">{user.email}</div>
            </div>
          </div>
          <div className="inv-modal__row">
            <span className="inv-modal__row-label">Role</span>
            <span className="inv-modal__row-value"><RoleBadge role={user.role} /></span>
          </div>
          <div className="inv-modal__row">
            <span className="inv-modal__row-label">Status</span>
            <span className="inv-modal__row-value"><StatusBadge active={user.isActive} /></span>
          </div>
          <div className="inv-modal__row">
            <span className="inv-modal__row-label">Company</span>
            <span className="inv-modal__row-value">{user.companyName ?? "—"}</span>
          </div>
          <div className="inv-modal__row">
            <span className="inv-modal__row-label">Phone</span>
            <span className="inv-modal__row-value">{user.phoneNumber ?? "—"}</span>
          </div>
          <div className="inv-modal__row">
            <span className="inv-modal__row-label">Joined On</span>
            <span className="inv-modal__row-value">{formatDate(user.createdAtUtc)}</span>
          </div>
          <div className="inv-modal__row">
            <span className="inv-modal__row-label">Last Login</span>
            <span className="inv-modal__row-value">{lastLoginLabel(user.lastLoginAtUtc) ?? "Never"}</span>
          </div>
        </div>
        <div className="inv-modal__foot">
          <button className="inv-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewing, setViewing] = useState<AdminUser | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = useCallback(() => {
    apiGet<AdminUser[]>("/api/v1/admin/users").then(setUsers).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => { void load(); }, [load]);

  // Close the row menu on outside click
  useEffect(() => {
    if (!openMenu) return;
    const onDown = () => setOpenMenu(null);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  useEffect(() => { setPage(1); }, [applied, pageSize]);

  const companies = useMemo(() => {
    if (!users) return [] as string[];
    return Array.from(new Set(users.map((u) => u.companyName).filter((c): c is string => !!c))).sort();
  }, [users]);

  const filtered = useMemo(() => (users ?? []).filter((u) => matches(u, applied)), [users, applied]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Global KPI stats from all users
  const kpis = useMemo(() => {
    const list = users ?? [];
    const now = new Date();
    return {
      total: list.length,
      active: list.filter((u) => u.isActive).length,
      inactive: list.filter((u) => !u.isActive).length,
      admins: list.filter((u) => u.role === "Admin").length,
      newThisMonth: list.filter((u) => {
        const d = new Date(u.createdAtUtc);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length,
    };
  }, [users]);

  async function toggleActive(u: AdminUser) {
    if (!window.confirm(`${u.isActive ? "Deactivate" : "Activate"} ${u.fullName ?? u.email}?`)) return;
    try {
      await apiPatch(`/api/v1/admin/users/${u.id}/toggle-active`, {});
      setOpenMenu(null);
      load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not update user status");
    }
  }

  const isSelf = (u: AdminUser) => currentUser != null && String(u.id) === String(currentUser.id);

  const setFilter = (key: keyof Filters, value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const reset = () => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPage(1); };

  const renderRow = (u: AdminUser) => {
    const self = isSelf(u);
    return (
      <tr key={u.id} onClick={() => setViewing(u)} className={self ? "inv-row--self" : undefined}>
        <td>
          <div className="inv-customer">
            <span className="inv-avatar">{initials(u.fullName)}</span>
            <div>
              <div className="inv-customer__name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="truncate">{u.fullName ?? "—"}</span>
                {self && <span className="inv-badge inv-badge--blue">You</span>}
              </div>
              <div className="inv-customer__contact">{u.email}</div>
            </div>
          </div>
        </td>
        <td><RoleBadge role={u.role} /></td>
        <td>
          <div className="inv-customer__name" style={{ fontSize: 13 }}>{u.companyName ?? "—"}</div>
          <div className="inv-sub">{u.role === "Customer" ? "Customer" : "Staff"}</div>
        </td>
        <td>
          <div className="inv-amount">
            <span className="inv-amount__paid" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Phone size={12} /> {u.phoneNumber ?? "—"}
            </span>
            <span className="inv-amount__balance" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Mail size={12} /> {u.email}
            </span>
          </div>
        </td>
        <td>
          <div className="inv-date">{formatDate(u.createdAtUtc)}</div>
        </td>
        <td><StatusBadge active={u.isActive} /></td>
        <td>
          <div className="inv-date" style={{ fontWeight: 500 }}>{lastLoginLabel(u.lastLoginAtUtc) ?? "Never"}</div>
        </td>
        <td>
          <div className="inv-actions" onClick={(e) => e.stopPropagation()}>
            <button className="inv-icon-btn" title="View Profile" aria-label="View profile" onClick={() => setViewing(u)}>
              <Eye size={16} />
            </button>
            <div className="inv-menu-wrap" onMouseDown={(e) => e.stopPropagation()}>
              <button className="inv-icon-btn" title="More" aria-label="More actions"
                aria-expanded={openMenu === u.id}
                onClick={() => setOpenMenu((m) => (m === u.id ? null : u.id))}>
                <MoreVertical size={16} />
              </button>
              {openMenu === u.id && (
                <div className="inv-menu">
                  <button className="inv-menu__item" onClick={() => { setOpenMenu(null); setViewing(u); }}>
                    <Eye size={15} /> View Details
                  </button>
                  <button className="inv-menu__item" disabled title="Company detail page not available">
                    <Building2 size={15} /> View Company
                  </button>
                  <button className="inv-menu__item" disabled title="Reset password endpoint not available">
                    <KeyRound size={15} /> Reset Password
                  </button>
                  <button className="inv-menu__item" disabled title="Role assignment endpoint not available">
                    <Crown size={15} /> Assign Role
                  </button>
                  <div className="inv-menu__divider" />
                  {u.isActive ? (
                    <button className="inv-menu__item inv-menu__item--danger" onClick={() => { void toggleActive(u); }}>
                      <Ban size={15} /> Deactivate Account
                    </button>
                  ) : (
                    <button className="inv-menu__item" onClick={() => { void toggleActive(u); }}>
                      <CheckCircle2 size={15} /> Activate Account
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  const renderCard = (u: AdminUser) => {
    const self = isSelf(u);
    return (
      <div key={u.id} className="inv-card" onClick={() => setViewing(u)}>
        <div className="inv-card__top">
          <div className="inv-card__customer">
            <span className="inv-avatar">{initials(u.fullName)}</span>
            <div>
              <div className="inv-customer__name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {u.fullName ?? "—"} {self && <span className="inv-badge inv-badge--blue">You</span>}
              </div>
              <div className="inv-sub">{u.email}</div>
            </div>
          </div>
          <StatusBadge active={u.isActive} />
        </div>
        <div className="inv-card__body">
          <div className="inv-card__cell">
            <span className="inv-card__label">Role</span>
            <span className="inv-card__value"><RoleBadge role={u.role} /></span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Company</span>
            <span className="inv-card__value">{u.companyName ?? "—"}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Joined</span>
            <span className="inv-card__value">{formatDate(u.createdAtUtc)}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Last Login</span>
            <span className="inv-card__value">{lastLoginLabel(u.lastLoginAtUtc) ?? "Never"}</span>
          </div>
        </div>
      </div>
    );
  };

  const kpiCards = [
    { label: "Total Users", value: kpis.total, hint: "All registered users", icon: Users, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", glow: "rgba(59,130,246,0.25)" },
    { label: "Active Users", value: kpis.active, hint: "Currently active", icon: UserCheck, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", glow: "rgba(34,197,94,0.22)" },
    { label: "Inactive Users", value: kpis.inactive, hint: "Inactive accounts", icon: UserX, color: "var(--kpi-orange)", bg: "var(--kpi-orange-bg)", glow: "rgba(249,115,22,0.22)" },
    { label: "Administrators", value: kpis.admins, hint: "Users with admin access", icon: Crown, color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)", glow: "rgba(167,139,250,0.22)" },
    { label: "New This Month", value: kpis.newThisMonth, hint: "Joined this month", icon: TrendingUp, color: "var(--kpi-teal)", bg: "var(--kpi-teal-bg)", glow: "rgba(20,184,166,0.22)" },
  ];

  if (error) return <EmptyState title="Users unavailable" text={error} />;
  if (!users) return <div className="inv-status"><Loading label="Loading users" /></div>;

  return (
    <div className="inv-page">
      {/* Header */}
      <div className="inv-header">
        <div>
          <h1 className="inv-header__title">Users</h1>
          <p className="inv-header__subtitle">Manage all registered users and monitor their platform access.</p>
        </div>
        {currentUser?.roles.includes("Admin") && (
          <Link
            to="/admin/engineers"
            className="inv-btn inv-btn--primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          >
            <UserPlus size={16} /> Add Engineer Profile
          </Link>
        )}
      </div>

      {/* KPI cards */}
      <div className="inv-kpi-grid">
        {kpiCards.map((k) => (
          <div key={k.label} className="inv-kpi"
            style={{ "--inv-kpi-color": k.color, "--inv-kpi-bg": k.bg, "--inv-kpi-glow": k.glow } as CSSProperties}>
            <span className="inv-kpi__icon"><k.icon size={20} /></span>
            <span className="inv-kpi__value">{k.value.toLocaleString()}</span>
            <span className="inv-kpi__label">{k.label}</span>
            <span className="inv-kpi__hint">{k.hint}</span>
          </div>
        ))}
      </div>

      {/* Filter section */}
      <div className="inv-filterbar">
        <div className="inv-field" style={{ flex: "1 1 180px" }}>
          <label className="inv-field__label">Search by Name</label>
          <input className="inv-input" placeholder="Name" value={draft.name} onChange={(e) => setFilter("name", e.target.value)} />
        </div>
        <div className="inv-field" style={{ flex: "1 1 200px" }}>
          <label className="inv-field__label">Search by Email</label>
          <input className="inv-input" placeholder="Email" value={draft.email} onChange={(e) => setFilter("email", e.target.value)} />
        </div>
        <div className="inv-field" style={{ flex: "1 1 160px" }}>
          <label className="inv-field__label">Search by Phone</label>
          <input className="inv-input" placeholder="Phone" value={draft.phone} onChange={(e) => setFilter("phone", e.target.value)} />
        </div>
        <div className="inv-field">
          <label className="inv-field__label">Role</label>
          <select className="inv-select" value={draft.role} onChange={(e) => setFilter("role", e.target.value)}>
            <option value="All">All Roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{roleInfo(r).label}</option>)}
          </select>
        </div>
        <div className="inv-field">
          <label className="inv-field__label">Status</label>
          <select className="inv-select" value={draft.status} onChange={(e) => setFilter("status", e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="inv-field">
          <label className="inv-field__label">Company</label>
          <select className="inv-select" value={draft.company} onChange={(e) => setFilter("company", e.target.value)}>
            <option value="All">All Companies</option>
            {companies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="inv-field">
          <label className="inv-field__label">Joined Date Range</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input type="date" className="inv-input" value={draft.joinedFrom} onChange={(e) => setFilter("joinedFrom", e.target.value)} aria-label="From date" />
            <input type="date" className="inv-input" value={draft.joinedTo} onChange={(e) => setFilter("joinedTo", e.target.value)} aria-label="To date" />
          </div>
        </div>
        <button className="inv-btn inv-btn--primary" onClick={() => { setApplied(draft); setPage(1); }}>
          <Filter size={15} /> Filter
        </button>
        <button className="inv-btn" onClick={reset} title="Reset filters">
          <X size={14} /> Reset
        </button>
        <button className="inv-btn inv-btn--icon" title="Refresh" aria-label="Refresh" onClick={load}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Desktop table */}
      {paged.length > 0 && (
        <div className="inv-table-wrap">
          <div className="inv-scroll">
            <table className="inv-table">
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: 90 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Joined On</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((u) => renderRow(u))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      <div className="inv-mobile">
        {filtered.length === 0 && <div className="inv-status">No users found.</div>}
        {paged.map((u) => renderCard(u))}
      </div>

      {/* Empty (desktop) */}
      {filtered.length === 0 && (
        <div className="inv-status">
          <UserIcon size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <div>{hasActive(applied) ? "No users match the current filters." : "No users found."}</div>
        </div>
      )}

      {/* Pagination */}
      <div className="inv-pagination">
        <span className="inv-pagination__info">
          {`Showing ${filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length} users`}
        </span>

        <div className="inv-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <label className="inv-field__label" style={{ margin: 0 }}>Rows</label>
          <select className="inv-select" style={{ width: "auto", padding: "7px 34px 7px 10px" }}
            value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <button className="inv-page-btn" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: pageCount }, (_, i) => i + 1)
          .filter((n) => n === 1 || n === pageCount || Math.abs(n - safePage) <= 1)
          .reduce<ReactNode[]>((acc, n, idx, arr) => {
            if (idx > 0 && n - arr[idx - 1] > 1) acc.push(<span key={`e${n}`} style={{ color: "var(--text-muted)", padding: "0 2px" }}>…</span>);
            acc.push(
              <button key={n} className={`inv-page-btn ${n === safePage ? "inv-page-btn--active" : ""}`}
                onClick={() => setPage(n)}>{n}</button>,
            );
            return acc;
          }, [])}

        <button className="inv-page-btn" disabled={safePage >= pageCount} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* View Details modal */}
      {viewing && <Modal user={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
