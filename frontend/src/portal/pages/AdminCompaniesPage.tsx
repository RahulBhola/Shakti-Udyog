import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../api/client";
import { Loading } from "../../components/ui";
import { formatDate } from "../shared";
import {
  Building2, CheckCircle2, Clock, MapPin, Calendar, Search, RefreshCw, ChevronLeft, ChevronRight,
  X, Download, Filter, Mail, Phone, Eye, Folder, FileText, Receipt, ShieldCheck,
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

interface PendingUser {
  id: string;
  fullName: string | null;
  companyName: string | null;
  email: string;
  phoneNumber: string | null;
  createdAtUtc: string;
}

const STATUS_FILTERS = ["All", "Approved", "Pending", "Rejected"];
const SORTS = ["Recently Registered", "Company Name"];
const PAGE_SIZES = [10, 20, 50];

function statusInfo(v: string, active: boolean): { label: string; tone: string } {
  if (!active) return { label: "Inactive", tone: "gray" };
  switch (v) {
    case "Approved": return { label: "Approved", tone: "green" };
    case "Pending": return { label: "Pending", tone: "orange" };
    case "Rejected": return { label: "Rejected", tone: "red" };
    default: return { label: v || "Pending", tone: "gray" };
  }
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
}

interface Filters { search: string; status: string; state: string; sort: string; }
const EMPTY: Filters = { search: "", status: "All", state: "All", sort: "Recently Registered" };

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminCompaniesPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [pending, setPending] = useState<PendingUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewing, setViewing] = useState<Company | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet<Company[]>("/api/v1/admin/companies").then(setCompanies).catch((e: Error) => setError(e.message)).finally(() => setLoading(false));
    apiGet<PendingUser[]>("/api/v1/admin/pending-approvals").then(setPending).catch(() => {});
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
    let result = list.filter((c) => {
      if (q && !(c.name.toLowerCase().includes(q) || (c.gstNumber ?? "").toLowerCase().includes(q) || (c.city ?? "").toLowerCase().includes(q))) return false;
      if (applied.status === "Approved" && c.verificationStatus !== "Approved") return false;
      if (applied.status === "Pending" && c.verificationStatus !== "Pending") return false;
      if (applied.status === "Rejected" && c.verificationStatus !== "Rejected") return false;
      if (applied.state !== "All" && c.state !== applied.state) return false;
      return true;
    });
    if (applied.sort === "Company Name") result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    else result = [...result].sort((a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime());
    return result;
  }, [companies, applied]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const kpis = useMemo(() => {
    const list = companies ?? [];
    const now = new Date();
    return {
      total: list.length,
      approved: list.filter((c) => c.verificationStatus === "Approved").length,
      pending: list.filter((c) => c.verificationStatus === "Pending" || !c.verificationStatus).length,
      cities: new Set(list.map((c) => c.city).filter(Boolean)).size,
      newThisMonth: list.filter((c) => { const d = new Date(c.createdAtUtc); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); }).length,
    };
  }, [companies]);

  const hasFilters = applied.search !== "" || applied.status !== "All" || applied.state !== "All";
  const clearFilters = () => { setDraft(EMPTY); setApplied(EMPTY); setPage(1); };

  const approve = async (u: PendingUser) => {
    setBusy(u.id); setMsg(null);
    try {
      const r = await apiPost<{ message: string }>(`/api/v1/admin/pending-approvals/${u.id}/approve`, { companyName: u.companyName ?? u.email });
      setMsg(r.message); load();
    } catch { setMsg("Approval failed."); }
    finally { setBusy(null); }
  };

  const exportCsv = () => {
    if (!filtered.length) return;
    const header = ["Company", "GST", "City", "State", "Industry", "Status", "Email", "Phone", "Registered"];
    const rows = filtered.map((c) => [c.name, c.gstNumber ?? "—", c.city ?? "—", c.state ?? "—", c.industry ?? "—", statusInfo(c.verificationStatus, c.isActive).label, c.companyEmail ?? "—", c.companyPhone ?? "—", formatDate(c.createdAtUtc)]);
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "companies.csv"; a.click(); URL.revokeObjectURL(a.href);
  };

  const kpiCards = [
    { label: "Total Companies", value: kpis.total, hint: "All registered companies", icon: Building2, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", glow: "rgba(59,130,246,0.25)" },
    { label: "Approved", value: kpis.approved, hint: "Verified & approved", icon: CheckCircle2, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", glow: "rgba(34,197,94,0.22)" },
    { label: "Pending Approval", value: kpis.pending, hint: "Awaiting approval", icon: Clock, color: "var(--kpi-orange)", bg: "var(--kpi-orange-bg)", glow: "rgba(249,115,22,0.22)" },
    { label: "Cities Covered", value: kpis.cities, hint: "Distinct cities", icon: MapPin, color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)", glow: "rgba(167,139,250,0.22)" },
    { label: "New This Month", value: kpis.newThisMonth, hint: "Registered this month", icon: Calendar, color: "var(--kpi-teal)", bg: "var(--kpi-teal-bg)", glow: "rgba(20,184,166,0.22)" },
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
          <p className="inv-header__subtitle">Manage customer companies, approvals and business information.</p>
        </div>
        <div className="inv-header__actions">
          <button className="inv-btn" onClick={exportCsv} title="Export companies to CSV">
            <Download size={16} /> Export CSV
          </button>
          {(pending?.length ?? 0) > 0 && (
            <button className="inv-btn inv-btn--primary" onClick={() => document.getElementById("pending-section")?.scrollIntoView({ behavior: "smooth" })}>
              <Clock size={16} /> Pending Approvals ({pending?.length})
            </button>
          )}
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
            <option value="All">All</option>
            {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Sort</label>
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

      {/* Pending approvals */}
      {(pending?.length ?? 0) > 0 && (
        <section id="pending-section" className="inv-settings__section">
          <div className="inv-settings__head">
            <span className="inv-settings__icon"><ShieldCheck size={18} /></span>
            <div>
              <div className="inv-settings__title">Pending Approvals ({pending!.length})</div>
              <div className="inv-settings__desc">Users waiting for company approval</div>
            </div>
          </div>
          <div className="inv-settings__body">
            <div className="inv-company-grid">
              {pending!.map((u) => (
                <div key={u.id} className="inv-company-card" style={{ gridTemplateColumns: "auto 1fr auto", alignItems: "center" }}>
                  <span className="inv-avatar">{initials(u.fullName ?? u.email)}</span>
                  <div className="inv-company__center">
                    <div className="inv-company__name">{u.fullName ?? u.email}</div>
                    <div className="inv-company__detail">
                      <span><Mail size={13} /> {u.email}</span>
                      <span><Phone size={13} /> {u.phoneNumber ?? "—"}</span>
                      <span><Building2 size={13} /> {u.companyName ?? "—"}</span>
                      <span><Calendar size={13} /> {formatDate(u.createdAtUtc)}</span>
                    </div>
                  </div>
                  <button className="inv-company__btn inv-company__btn--primary" disabled={busy === u.id} onClick={() => void approve(u)}>
                    {busy === u.id ? "Approving…" : "Approve"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
            <div className="inv-modal__foot">
              <button className="inv-btn" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
