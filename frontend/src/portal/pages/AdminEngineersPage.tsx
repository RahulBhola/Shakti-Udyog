import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { apiGet, apiPatch } from "../../api/client";
import { adminApi } from "../../api/adminApi";
import { EmptyState, Loading } from "../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { formatDate } from "../shared";
import {
  RefreshCw, ChevronLeft, ChevronRight, X as CloseIcon, Eye, MoreVertical,
  Mail, Phone, Ban, CheckCircle2, Filter, UserCheck, UserPlus, ShieldAlert,
  KeyRound, Lock, EyeOff, Sparkles, Check,
} from "lucide-react";
import "./erpListView.css";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EngineerUser {
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
  status: string;
}

const EMPTY_FILTERS: Filters = { name: "", email: "", status: "All" };
const PAGE_SIZES = [10, 20, 50];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function initials(name: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
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

function generateStrongPassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
  let res = "Eng!";
  for (let i = 0; i < 16; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

/* ------------------------------------------------------------------ */
/*  Create Engineer Modal                                              */
/* ------------------------------------------------------------------ */

function CreateEngineerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (createdEmail: string) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePassword = () => {
    const pwd = generateStrongPassword();
    setPassword(pwd);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter full name.");
      return;
    }
    if (!password || password.length < 12) {
      setError("Password must be at least 12 characters long.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.createEngineer({
        fullName: fullName.trim(),
        password,
        email: email.trim() ? email.trim() : undefined,
      });
      onCreated(res.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create engineer profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inv-modal-backdrop" onClick={onClose}>
      <div
        className="inv-modal"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Create Engineer Profile"
      >
        <div className="inv-modal__head">
          <span className="inv-modal__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserPlus size={18} style={{ color: "var(--color-primary)" }} />
            Create Engineer Profile
          </span>
          <button className="inv-icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="inv-modal__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px border var(--color-danger)",
                  color: "var(--color-danger)",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <div className="inv-field">
              <label className="inv-field__label">
                Full Name <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                type="text"
                className="inv-input"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="inv-field">
              <label className="inv-field__label">
                Email Address <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-secondary)" }}>(Optional)</span>
              </label>
              <input
                type="email"
                className="inv-input"
                placeholder="e.g. rahul.sharma@shaktiudyog.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                If left empty, email will auto-generate as <code>firstname.lastname@shaktiudyog.local</code>
              </span>
            </div>

            <div className="inv-field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <label className="inv-field__label" style={{ margin: 0 }}>
                  Password <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inv-btn"
                  style={{ padding: "2px 8px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Sparkles size={12} /> Auto Generate
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="inv-input"
                  style={{ paddingRight: 40 }}
                  placeholder="Minimum 12 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={12}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    padding: 4,
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                Must be at least 12 characters long.
              </span>
            </div>
          </div>

          <div className="inv-modal__foot" style={{ justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Only Admin can create Engineer profiles.</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="inv-btn" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="inv-btn inv-btn--primary" disabled={loading}>
                {loading ? "Creating..." : "Create Engineer"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  View Detail Modal                                                  */
/* ------------------------------------------------------------------ */

function Modal({ user, onClose }: { user: EngineerUser; onClose: () => void }) {
  return (
    <div className="inv-modal-backdrop" onClick={onClose}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Engineer details">
        <div className="inv-modal__head">
          <span className="inv-modal__title">Engineer Details</span>
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
            <span className="inv-modal__row-value">
              <span className="inv-badge inv-badge--orange">Engineer</span>
            </span>
          </div>
          <div className="inv-modal__row">
            <span className="inv-modal__row-label">Status</span>
            <span className="inv-modal__row-value">
              {user.isActive ? (
                <span className="inv-badge inv-badge--green"><span className="inv-dot" /> Active</span>
              ) : (
                <span className="inv-badge inv-badge--red"><span className="inv-dot" /> Inactive</span>
              )}
            </span>
          </div>
          <div className="inv-modal__row">
            <span className="inv-modal__row-label">Phone</span>
            <span className="inv-modal__row-value">{user.phoneNumber ?? "—"}</span>
          </div>
          <div className="inv-modal__row">
            <span className="inv-modal__row-label">Created On</span>
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
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function AdminEngineersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.roles.includes("Admin");
  const [users, setUsers] = useState<EngineerUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewing, setViewing] = useState<EngineerUser | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    apiGet<EngineerUser[]>("/api/v1/admin/users")
      .then((all) => setUsers(all.filter((u) => u.role === "Engineer")))
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!openMenu) return;
    const onDown = () => setOpenMenu(null);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  useEffect(() => { setPage(1); }, [applied, pageSize]);

  const filtered = useMemo(() => {
    return (users ?? []).filter((u) => {
      if (applied.name && !(u.fullName ?? "").toLowerCase().includes(applied.name.toLowerCase())) return false;
      if (applied.email && !u.email.toLowerCase().includes(applied.email.toLowerCase())) return false;
      if (applied.status === "Active" && !u.isActive) return false;
      if (applied.status === "Inactive" && u.isActive) return false;
      return true;
    });
  }, [users, applied]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const kpis = useMemo(() => {
    const list = users ?? [];
    const now = new Date();
    return {
      total: list.length,
      active: list.filter((u) => u.isActive).length,
      inactive: list.filter((u) => !u.isActive).length,
      newThisMonth: list.filter((u) => {
        const d = new Date(u.createdAtUtc);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }).length,
    };
  }, [users]);

  async function toggleActive(u: EngineerUser) {
    if (!window.confirm(`${u.isActive ? "Deactivate" : "Activate"} ${u.fullName ?? u.email}?`)) return;
    try {
      await apiPatch(`/api/v1/admin/users/${u.id}/toggle-active`, {});
      setOpenMenu(null);
      load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not update user status");
    }
  }

  const setFilter = (key: keyof Filters, value: string) => setDraft((d) => ({ ...d, [key]: value }));
  const reset = () => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPage(1); };

  if (!isAdmin) {
    return (
      <EmptyState
        title="Access Restricted"
        text="Only Administrators are authorized to view and manage Engineer profiles."
      />
    );
  }

  if (error) return <EmptyState title="Engineers unavailable" text={error} />;
  if (!users) return <div className="inv-status"><Loading label="Loading engineers" /></div>;

  return (
    <div className="inv-page">
      {toastMsg && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 10,
            backgroundColor: "rgba(34, 197, 94, 0.12)",
            border: "1px border var(--color-success)",
            color: "var(--color-success)",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Check size={16} /> {toastMsg}
          </span>
          <button
            onClick={() => setToastMsg(null)}
            style={{ background: "none", border: "none", color: "currentColor", cursor: "pointer" }}
          >
            <CloseIcon size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="inv-header">
        <div>
          <h1 className="inv-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Engineers
          </h1>
          <p className="inv-header__subtitle">
            Manage technical engineer accounts responsible for reviewing enquiries, quotes, orders, and shop floor tasks.
          </p>
        </div>

        <button
          className="inv-btn inv-btn--primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <UserPlus size={16} /> Add Engineer Profile
        </button>
      </div>

      {/* KPI Cards */}
      <div className="inv-kpi-grid">
        <div
          className="inv-kpi"
          style={
            {
              "--inv-kpi-color": "var(--kpi-orange)",
              "--inv-kpi-bg": "var(--kpi-orange-bg)",
              "--inv-kpi-glow": "rgba(249,115,22,0.22)",
            } as CSSProperties
          }
        >
          <span className="inv-kpi__icon"><UserCheck size={20} /></span>
          <span className="inv-kpi__value">{kpis.total.toLocaleString()}</span>
          <span className="inv-kpi__label">Total Engineers</span>
          <span className="inv-kpi__hint">Admin-created staff</span>
        </div>

        <div
          className="inv-kpi"
          style={
            {
              "--inv-kpi-color": "var(--kpi-green)",
              "--inv-kpi-bg": "var(--kpi-green-bg)",
              "--inv-kpi-glow": "rgba(34,197,94,0.22)",
            } as CSSProperties
          }
        >
          <span className="inv-kpi__icon"><UserCheck size={20} /></span>
          <span className="inv-kpi__value">{kpis.active.toLocaleString()}</span>
          <span className="inv-kpi__label">Active Engineers</span>
          <span className="inv-kpi__hint">Authorized for platform</span>
        </div>

        <div
          className="inv-kpi"
          style={
            {
              "--inv-kpi-color": "var(--kpi-blue)",
              "--inv-kpi-bg": "var(--kpi-blue-bg)",
              "--inv-kpi-glow": "rgba(59,130,246,0.25)",
            } as CSSProperties
          }
        >
          <span className="inv-kpi__icon"><UserPlus size={20} /></span>
          <span className="inv-kpi__value">{kpis.newThisMonth.toLocaleString()}</span>
          <span className="inv-kpi__label">New This Month</span>
          <span className="inv-kpi__hint">Recently onboarded</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="inv-filterbar">
        <div className="inv-field" style={{ flex: "1 1 200px" }}>
          <label className="inv-field__label">Search by Name</label>
          <input className="inv-input" placeholder="Name" value={draft.name} onChange={(e) => setFilter("name", e.target.value)} />
        </div>
        <div className="inv-field" style={{ flex: "1 1 220px" }}>
          <label className="inv-field__label">Search by Email</label>
          <input className="inv-input" placeholder="Email" value={draft.email} onChange={(e) => setFilter("email", e.target.value)} />
        </div>
        <div className="inv-field">
          <label className="inv-field__label">Status</label>
          <select className="inv-select" value={draft.status} onChange={(e) => setFilter("status", e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <button className="inv-btn inv-btn--primary" onClick={() => { setApplied(draft); setPage(1); }}>
          <Filter size={15} /> Filter
        </button>
        <button className="inv-btn" onClick={reset} title="Reset filters">
          <CloseIcon size={14} /> Reset
        </button>
        <button className="inv-btn inv-btn--icon" title="Refresh" aria-label="Refresh" onClick={load}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Desktop Table */}
      {paged.length > 0 && (
        <div className="inv-table-wrap">
          <div className="inv-scroll">
            <table className="inv-table">
              <colgroup>
                <col style={{ width: "25%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: 80 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Engineer</th>
                  <th>Contact Email</th>
                  <th>Status</th>
                  <th>Created On</th>
                  <th>Last Login</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((u) => (
                  <tr key={u.id} onClick={() => setViewing(u)}>
                    <td>
                      <div className="inv-customer">
                        <span className="inv-avatar" style={{ backgroundColor: "var(--kpi-orange-bg)", color: "var(--kpi-orange)" }}>
                          {initials(u.fullName)}
                        </span>
                        <div>
                          <div className="inv-customer__name">{u.fullName ?? "—"}</div>
                          <div className="inv-sub">Engineer Staff</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="inv-amount__paid" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Mail size={12} /> {u.email}
                      </span>
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="inv-badge inv-badge--green"><span className="inv-dot" /> Active</span>
                      ) : (
                        <span className="inv-badge inv-badge--red"><span className="inv-dot" /> Inactive</span>
                      )}
                    </td>
                    <td><div className="inv-date">{formatDate(u.createdAtUtc)}</div></td>
                    <td><div className="inv-date">{lastLoginLabel(u.lastLoginAtUtc) ?? "Never"}</div></td>
                    <td>
                      <div className="inv-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="inv-icon-btn" title="View Profile" onClick={() => setViewing(u)}>
                          <Eye size={16} />
                        </button>
                        <div className="inv-menu-wrap" onMouseDown={(e) => e.stopPropagation()}>
                          <button
                            className="inv-icon-btn"
                            title="More"
                            onClick={() => setOpenMenu((m) => (m === u.id ? null : u.id))}
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenu === u.id && (
                            <div className="inv-menu">
                              <button className="inv-menu__item" onClick={() => { setOpenMenu(null); setViewing(u); }}>
                                <Eye size={15} /> View Details
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="inv-pagination">
        <span className="inv-pagination__info">
          {`Showing ${filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length} engineers`}
        </span>

        <div className="inv-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <label className="inv-field__label" style={{ margin: 0 }}>Rows</label>
          <select
            className="inv-select"
            style={{ width: "auto", padding: "7px 34px 7px 10px" }}
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <button className="inv-page-btn" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: pageCount }, (_, i) => i + 1)
          .filter((n) => n === 1 || n === pageCount || Math.abs(n - safePage) <= 1)
          .reduce<ReactNode[]>((acc, n, idx, arr) => {
            if (idx > 0 && n - arr[idx - 1] > 1) acc.push(<span key={`e${n}`} style={{ color: "var(--text-muted)", padding: "0 2px" }}>…</span>);
            acc.push(
              <button key={n} className={`inv-page-btn ${n === safePage ? "inv-page-btn--active" : ""}`} onClick={() => setPage(n)}>{n}</button>,
            );
            return acc;
          }, [])}

        <button className="inv-page-btn" disabled={safePage >= pageCount} onClick={() => setPage((p) => p + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Modals */}
      {viewing && <Modal user={viewing} onClose={() => setViewing(null)} />}
      {showCreateModal && (
        <CreateEngineerModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(createdEmail) => {
            setShowCreateModal(false);
            setToastMsg(`Engineer account successfully created for ${createdEmail}`);
            load();
          }}
        />
      )}
    </div>
  );
}
