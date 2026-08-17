import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiDelete } from "../../api/client";
import { Loading } from "../../components/ui";
import { formatDate } from "../shared";
import {
  Building2, CheckCircle2, Clock, Search, RefreshCw, ChevronLeft, ChevronRight,
  X, Download, Filter, Mail, Phone, Eye, Folder, FileText, Receipt,
  Trash2, AlertTriangle,
} from "lucide-react";
import "./erpListView.css";

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                    */
/* ------------------------------------------------------------------ */

interface Company {
  id: string;
  name: string;
  industry: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  city: string | null;
  state: string | null;
  gstNumber: string | null;
  companyLogoUrl: string | null;
  verificationStatus: string;
  isActive: boolean;
  createdAtUtc: string;
  addressLine1: string | null;
  website: string | null;
  panNumber: string | null;
  cinNumber: string | null;
  msmeNumber: string | null;
}

const STATUS_FILTERS = ["All", "Active", "Inactive"];
const SORTS = ["Recently Registered", "Company Name"];
const PAGE_SIZES = [10, 20, 50];

function statusInfo(_v: string, active: boolean): { label: string; tone: string } {
  if (!active) return { label: "Inactive", tone: "gray" };
  return { label: "Active", tone: "green" };
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
}

interface Filters { search: string; status: string; state: string; sort: string; }
const EMPTY: Filters = { search: "", status: "All", state: "All", sort: "Recently Registered" };

function DeleteCompanyModal({
  company,
  onClose,
  onConfirm,
  loading,
}: {
  company: Company;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const [typed, setTyped] = useState("");
  const isMatch = typed.trim().toLowerCase() === "delete";

  return (
    <div className="inv-modal-backdrop" onClick={onClose}>
      <div
        className="inv-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Confirm company deletion"
        style={{ maxWidth: 460 }}
      >
        <div className="inv-modal__head" style={{ borderBottomColor: "rgba(239, 68, 68, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(239, 68, 68, 0.12)",
                color: "var(--color-danger)",
              }}
            >
              <AlertTriangle size={18} />
            </span>
            <span className="inv-modal__title" style={{ color: "var(--color-danger)" }}>
              Delete Company Record
            </span>
          </div>
          <button className="inv-icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="inv-modal__body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
            Are you sure you want to permanently delete company{" "}
            <strong style={{ color: "var(--text-primary)" }}>{company.name}</strong>?
          </p>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              fontSize: 12.5,
              color: "var(--color-danger)",
              lineHeight: 1.45,
            }}
          >
            <strong>Warning:</strong> If this company has no operational documents (orders/invoices), it will be permanently removed.
          </div>

          <div className="inv-field">
            <label className="inv-field__label" style={{ fontSize: 13 }}>
              To confirm, type <span style={{ color: "var(--color-danger)", fontWeight: 700 }}>delete</span> below:
            </label>
            <input
              type="text"
              className="inv-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type 'delete' to confirm"
              autoFocus
              style={{
                borderColor: isMatch ? "var(--color-danger)" : undefined,
                boxShadow: isMatch ? "0 0 0 3px rgba(239, 68, 68, 0.2)" : undefined,
              }}
            />
          </div>
        </div>

        <div className="inv-modal__foot" style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" className="inv-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className="inv-btn"
            disabled={!isMatch || loading}
            onClick={onConfirm}
            style={{
              background: isMatch ? "var(--color-danger)" : "var(--bg-surface)",
              color: isMatch ? "#ffffff" : "var(--text-muted)",
              border: isMatch ? "none" : "1px solid var(--border-default)",
              cursor: isMatch && !loading ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
            }}
          >
            <Trash2 size={14} />
            <span>{loading ? "Deleting Company…" : "Permanently Delete Company"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminCompaniesPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewing, setViewing] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet<Company[]>("/api/v1/admin/companies").then(setCompanies).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [applied, pageSize]);

  const stateOptions = useMemo(() => {
    if (!companies) return [] as string[];
    return Array.from(new Set(companies.map((c) => c.state).filter((s): s is string => !!s))).sort();
  }, [companies]);

  const filtered = useMemo(() => {
    const list = companies ?? [];
    const q = applied.search.trim().toLowerCase();
    return list
      .filter((c) => {
        if (q) {
          const match = c.name.toLowerCase().includes(q)
            || (c.gstNumber ?? "").toLowerCase().includes(q)
            || (c.city ?? "").toLowerCase().includes(q)
            || (c.state ?? "").toLowerCase().includes(q);
          if (!match) return false;
        }
        if (applied.status === "Active" && !c.isActive) return false;
        if (applied.status === "Inactive" && c.isActive) return false;
        if (applied.state !== "All" && (c.state ?? "") !== applied.state) return false;
        return true;
      })
      .sort((a, b) => {
        if (applied.sort === "Company Name") return a.name.localeCompare(b.name);
        return new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime();
      });
  }, [companies, applied]);

  const kpis = useMemo(() => {
    const list = companies ?? [];
    return {
      total: list.length,
      active: list.filter((c) => c.isActive).length,
      inactive: list.filter((c) => !c.isActive).length,
      withGst: list.filter((c) => Boolean(c.gstNumber)).length,
    };
  }, [companies]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const clearFilters = () => { setDraft(EMPTY); setApplied(EMPTY); setPage(1); };
  const hasFilters = applied.search !== "" || applied.status !== "All" || applied.state !== "All" || applied.sort !== "Recently Registered";

  const handleDeleteCompanyConfirm = async () => {
    if (!deletingCompany) return;
    setDeleteLoading(true);
    try {
      await apiDelete(`/api/v1/admin/companies/${deletingCompany.id}`);
      setDeletingCompany(null);
      if (viewing?.id === deletingCompany.id) setViewing(null);
      setMsg(`Company ${deletingCompany.name} removed successfully.`);
      setTimeout(() => setMsg(null), 4000);
      load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Failed to delete company.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const exportCsv = () => {
    const list = companies ?? [];
    const rows = [
      ["Company Name", "GST", "City", "State", "Status", "Registered At"],
      ...list.map((c) => [c.name, c.gstNumber ?? "", c.city ?? "", c.state ?? "", c.isActive ? "Active" : "Inactive", c.createdAtUtc]),
    ];
    const csv = rows.map((r) => r.map((f) => `"${f.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "companies.csv"; a.click(); URL.revokeObjectURL(a.href);
  };

  const kpiCards = [
    { label: "Total Companies", value: kpis.total, hint: "All registered companies", icon: Building2, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", glow: "rgba(59,130,246,0.25)" },
    { label: "Active Accounts", value: kpis.active, hint: "Operational customer accounts", icon: CheckCircle2, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", glow: "rgba(34,197,94,0.22)" },
    { label: "GST Registered", value: kpis.withGst, hint: "Companies with valid GSTIN", icon: Clock, color: "var(--kpi-orange)", bg: "var(--kpi-orange-bg)", glow: "rgba(249,115,22,0.22)" },
    { label: "Inactive Accounts", value: kpis.inactive, hint: "Deactivated organizations", icon: Building2, color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)", glow: "rgba(167,139,250,0.22)" },
  ];

  const renderCard = (c: Company) => {
    const st = statusInfo(c.verificationStatus, c.isActive);
    return (
      <div key={c.id} className="inv-company-card">
        {/* Left: logo + status */}
        <div className="inv-company__left">
          <div className="inv-company__logo">
            {c.companyLogoUrl ? <img src={c.companyLogoUrl} alt={c.name} /> : initials(c.name)}
          </div>
          <span className={`inv-badge inv-badge--${st.tone}`}>{st.label}</span>
        </div>

        {/* Center: identity */}
        <div className="inv-company__center">
          <div className="inv-company__name">{c.name}</div>
          <div className="inv-company__detail">
            <span><span className="inv-company__label">GST</span> {c.gstNumber ?? "GST Pending"}</span>
            <span><span className="inv-company__label">Industry</span> {c.industry ?? "—"}</span>
            <span><span className="inv-company__label">Customer Since</span> {formatDate(c.createdAtUtc)}</span>
          </div>
          <div className="inv-company__detail">
            <span><Mail size={13} /> {c.companyEmail ?? "Not Provided"}</span>
            <span><Phone size={13} /> {c.companyPhone ?? "Not Provided"}</span>
          </div>
        </div>

        {/* Right: metrics + actions */}
        <div className="inv-company__right">
          <div className="inv-company__stats">
            <div className="inv-company__stat"><span className="inv-company__stat-value">{c.city ?? "—"}</span><span className="inv-company__stat-label">City</span></div>
            <div className="inv-company__stat"><span className="inv-company__stat-value">{c.state ?? "—"}</span><span className="inv-company__stat-label">State</span></div>
            <div className="inv-company__stat"><span className="inv-company__stat-value">—</span><span className="inv-company__stat-label">Orders</span></div>
            <div className="inv-company__stat"><span className="inv-company__stat-value">—</span><span className="inv-company__stat-label">Enquiries</span></div>
            <div className="inv-company__stat"><span className="inv-company__stat-value">—</span><span className="inv-company__stat-label">Quotes</span></div>
            <div className="inv-company__stat"><span className="inv-company__stat-value">—</span><span className="inv-company__stat-label">Invoices</span></div>
          </div>
          <div className="inv-company__actions">
            <button className="inv-company__btn inv-company__btn--primary" onClick={() => setViewing(c)}>
              <Eye size={13} /> View Company
            </button>
            <button className="inv-company__btn" onClick={() => navigate(`/admin/orders?company=${c.id}`)}><Folder size={13} /> Orders</button>
            <button className="inv-company__btn" onClick={() => navigate(`/admin/enquiries?company=${c.id}`)}><FileText size={13} /> Enquiries</button>
            <button className="inv-company__btn" onClick={() => navigate(`/admin/invoices?company=${c.id}`)}><Receipt size={13} /> Invoices</button>
            <button
              className="inv-company__btn"
              style={{ color: "var(--color-danger)" }}
              title="Delete Company"
              onClick={() => setDeletingCompany(c)}
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="inv-page">
      {/* Header */}
      <div className="inv-header">
        <div>
          <h1 className="inv-header__title">Companies</h1>
          <p className="inv-header__subtitle">Manage customer companies and business information.</p>
        </div>
        <div className="inv-header__actions">
          <button className="inv-btn" onClick={exportCsv} title="Export companies to CSV">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Message */}
      {msg && <div className="inv-filterbar" style={{ padding: "12px 18px" }}><span style={{ color: "var(--color-success)", fontSize: 13, fontWeight: 600 }}>{msg}</span></div>}
      {error && <div className="inv-status" style={{ color: "var(--color-danger)" }}>{error}</div>}

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

      {/* Search & filter bar */}
      <div className="inv-filterbar">
        <div className="inv-field" style={{ flex: "1 1 220px" }}>
          <label className="inv-field__label">Search</label>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input className="inv-input" style={{ paddingLeft: 32 }} type="search" value={draft.search}
              placeholder="Search company..." aria-label="Search companies"
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))} />
          </div>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Status</label>
          <select className="inv-select" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">State</label>
          <select className="inv-select" value={draft.state} onChange={(e) => setDraft((d) => ({ ...d, state: e.target.value }))}>
            <option value="All">All States</option>
            {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Sort By</label>
          <select className="inv-select" value={draft.sort} onChange={(e) => setDraft((d) => ({ ...d, sort: e.target.value }))}>
            {SORTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button className="inv-btn" title="Reset filters" onClick={clearFilters}>
          <X size={14} /> Reset
        </button>
        <button className="inv-btn inv-btn--primary" onClick={() => { setApplied(draft); setPage(1); }}>
          <Filter size={15} /> Filter
        </button>
        <button className="inv-btn inv-btn--icon" title="Refresh" aria-label="Refresh" onClick={load}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Loading / empty */}
      {!error && loading && <div className="inv-status"><Loading label="Loading companies" /></div>}
      {!error && !loading && companies && filtered.length === 0 && (
        <div className="inv-status"><div>{hasFilters ? "No companies match the current filters." : "No companies found."}</div></div>
      )}

      {/* Company cards */}
      {!error && !loading && companies && paged.length > 0 && (
        <div className="inv-company-grid">
          {paged.map((c) => renderCard(c))}
        </div>
      )}

      {/* Pagination */}
      <div className="inv-pagination">
        <span className="inv-pagination__info">
          {`Showing ${filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length} companies`}
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

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
          .reduce<ReactNode[]>((acc, n, idx, arr) => {
            if (idx > 0 && n - arr[idx - 1] > 1) acc.push(<span key={`e${n}`} style={{ color: "var(--text-muted)", padding: "0 2px" }}>…</span>);
            acc.push(
              <button key={n} className={`inv-page-btn ${n === safePage ? "inv-page-btn--active" : ""}`}
                onClick={() => setPage(n)}>{n}</button>,
            );
            return acc;
          }, [])}

        <button className="inv-page-btn" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Company detail modal */}
      {viewing && (
        <div className="inv-modal-backdrop" onClick={() => setViewing(null)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Company details">
            <div className="inv-modal__head">
              <span className="inv-modal__title">{viewing.name}</span>
              <button className="inv-icon-btn" onClick={() => setViewing(null)} aria-label="Close"><X size={16} /></button>
            </div>
            <div className="inv-modal__body">
              {[
                ["Status", statusInfo(viewing.verificationStatus, viewing.isActive).label],
                ["GST", viewing.gstNumber ?? "GST Pending"],
                ["Industry", viewing.industry ?? "—"],
                ["City / State", [viewing.city, viewing.state].filter(Boolean).join(", ") || "—"],
                ["Address", viewing.addressLine1 ?? "—"],
                ["Email", viewing.companyEmail ?? "Not Provided"],
                ["Phone", viewing.companyPhone ?? "Not Provided"],
                ["Website", viewing.website ?? "—"],
                ["PAN", viewing.panNumber ?? "—"],
                ["CIN", viewing.cinNumber ?? "—"],
                ["MSME", viewing.msmeNumber ?? "—"],
                ["Customer Since", formatDate(viewing.createdAtUtc)],
              ].map(([k, v]) => (
                <div key={k} className="inv-modal__row">
                  <span className="inv-modal__row-label">{k}</span>
                  <span className="inv-modal__row-value">{v}</span>
                </div>
              ))}
            </div>
            <div className="inv-modal__foot" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                className="inv-btn"
                style={{ color: "var(--color-danger)", borderColor: "rgba(239, 68, 68, 0.3)" }}
                onClick={() => {
                  const toDelete = viewing;
                  setViewing(null);
                  setDeletingCompany(toDelete);
                }}
              >
                <Trash2 size={14} /> Delete Company
              </button>
              <button className="inv-btn" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Company Confirmation Modal */}
      {deletingCompany && (
        <DeleteCompanyModal
          company={deletingCompany}
          onClose={() => setDeletingCompany(null)}
          onConfirm={() => { void handleDeleteCompanyConfirm(); }}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
