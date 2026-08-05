import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { engineerApi } from "../../../api/engineerApi";
import type { Paged, QuotationListItem } from "../../../api/customerApi";
import { EmptyState, Loading } from "../../../components/ui";
import { formatDate } from "../../shared";
import {
  FileText, Search, RefreshCw, ChevronLeft, ChevronRight, X,
  ClipboardList, CheckCircle, Clock, XCircle,
} from "lucide-react";
import "../erpListView.css";

const STATUS_FILTERS = [
  "All", "Draft", "Pending Approval", "Approved", "Issued",
  "Accepted", "Converted", "Declined", "Cancelled",
];
const PAGE_SIZES = [10, 20, 50];

/* ---- helpers ------------------------------------------------------- */

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function money(value: number | null | undefined, currency = "INR"): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function statusTone(status: string): string {
  switch (status) {
    case "Accepted":
    case "Approved": return "green";
    case "Declined":
    case "Cancelled": return "red";
    case "Pending Approval":
    case "Issued":
    case "Negotiating": return "orange";
    case "Viewed":
    case "Converted": return "purple";
    case "Draft": return "blue";
    case "Expired": return "gray";
    default: return "gray";
  }
}

function QuotationBadge({ status }: { status: string }) {
  return <span className={`inv-badge inv-badge--${statusTone(status)}`}>{status.replaceAll("_", " ")}</span>;
}

/* ---- main page ----------------------------------------------------- */

export default function QuotationListPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<Paged<QuotationListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Client-side status refinement on the current page
  const [quickStatus, setQuickStatus] = useState("All");

  const load = useCallback(() => {
    engineerApi.quotations(page, pageSize, search || undefined, statusFilter === "All" ? undefined : statusFilter)
      .then(setData).catch((e: Error) => setError(e.message));
  }, [page, pageSize, search, statusFilter]);
  useEffect(load, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter, pageSize]);

  const visible = useMemo(() => {
    const items = data?.items ?? [];
    if (quickStatus === "All") return items;
    return items.filter((q) => q.status === quickStatus);
  }, [data, quickStatus]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  // Page-scoped KPI counts (preserving existing behaviour)
  const pageStatuses = data?.items.map((r) => r.status) ?? [];
  const total = data?.totalCount ?? 0;
  const accepted = pageStatuses.filter((s) => s === "Accepted" || s === "Converted").length;
  const pending = pageStatuses.filter((s) => s === "Draft" || s === "Pending Approval" || s === "Issued" || s === "Negotiating").length;
  const cancelled = pageStatuses.filter((s) => s === "Cancelled" || s === "Declined" || s === "Expired").length;

  const clearFilters = () => {
    setSearchInput(""); setSearch(""); setStatusFilter("All"); setQuickStatus("All");
  };
  const hasActiveFilter = search !== "" || statusFilter !== "All" || quickStatus !== "All";

  const kpis = [
    { label: "Total Quotes", value: total, hint: "This Month view", icon: ClipboardList, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", glow: "rgba(59,130,246,0.25)" },
    { label: "Accepted", value: accepted, hint: "Accepted & converted", icon: CheckCircle, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", glow: "rgba(34,197,94,0.22)" },
    { label: "Pending", value: pending, hint: "Draft / issued / negotiating", icon: Clock, color: "var(--kpi-orange)", bg: "var(--kpi-orange-bg)", glow: "rgba(249,115,22,0.22)" },
    { label: "Cancelled", value: cancelled, hint: "Cancelled / declined / expired", icon: XCircle, color: "var(--color-danger)", bg: "rgba(239,68,68,0.10)", glow: "rgba(239,68,68,0.22)" },
  ];

  const openQuotation = (q: QuotationListItem) => navigate(`/admin/quotations/${q.id}`);

  const renderRow = (q: QuotationListItem) => {
    return (
      <tr key={q.id} onClick={() => openQuotation(q)}>
        <td>
          <span className="inv-link" role="link" tabIndex={0}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); openQuotation(q); } }}
          >
            {q.quotationNumber}
          </span>
          <span className="inv-sub">
            Rev.{q.revisionNumber}{q.enquiryId ? " · linked to Enquiry" : ""}
          </span>
        </td>
        <td>
          <div className="inv-customer">
            <span className="inv-avatar">{initials(q.companyName)}</span>
            <div>
              <div className="inv-customer__name" title={q.companyName ?? undefined}>{q.companyName ?? "—"}</div>
              <div className="inv-customer__contact">{q.productType}</div>
            </div>
          </div>
        </td>
        <td>
          <div className="inv-amount">
            <span className="inv-amount__total">{money(q.total, q.currency)}</span>
            <span className="inv-amount__balance">{q.itemCount} {q.itemCount === 1 ? "item" : "items"}</span>
          </div>
        </td>
        <td>
          <div className="inv-date">{formatDate(q.validUntilUtc)}</div>
          <div className="inv-time">Valid till</div>
        </td>
        <td>
          <div className="inv-date">{formatDate(q.createdAtUtc)}</div>
          <div className="inv-time">{formatTime(q.createdAtUtc)}</div>
        </td>
        <td>
          <div className="inv-sub" style={{ marginTop: 0 }}>
            {q.paymentTerms?.split("\n")[0] ? `Pay: ${q.paymentTerms.split("\n")[0]}` : "Pay: —"}
          </div>
          <div className="inv-time" style={{ marginTop: 3 }}>Delivery: {q.deliveryTime || "—"}</div>
        </td>
        <td><QuotationBadge status={q.status} /></td>
      </tr>
    );
  };

  const renderCard = (q: QuotationListItem) => {
    return (
      <div key={q.id} className="inv-card" onClick={() => openQuotation(q)}>
        <div className="inv-card__top">
          <div className="inv-card__customer">
            <span className="inv-avatar">{initials(q.companyName)}</span>
            <div>
              <div className="inv-customer__name">{q.companyName ?? "—"}</div>
              <div className="inv-sub">{q.quotationNumber} · Rev.{q.revisionNumber}</div>
            </div>
          </div>
          <QuotationBadge status={q.status} />
        </div>
        <div className="inv-card__body">
          <div className="inv-card__cell">
            <span className="inv-card__label">Product</span>
            <span className="inv-card__value">{q.productType}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Amount</span>
            <span className="inv-card__value">{money(q.total, q.currency)}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Valid Till</span>
            <span className="inv-card__value">{formatDate(q.validUntilUtc)}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Created</span>
            <span className="inv-card__value">{formatDate(q.createdAtUtc)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="inv-page">
      {/* Page header (no create action) */}
      <div className="inv-header">
        <div>
          <h1 className="inv-header__title">Quotes</h1>
          <p className="inv-header__subtitle">Track and manage every customer quotation across the sales cycle.</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="inv-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="inv-kpi"
            style={{ "--inv-kpi-color": k.color, "--inv-kpi-bg": k.bg, "--inv-kpi-glow": k.glow } as CSSProperties}>
            <span className="inv-kpi__icon"><k.icon size={20} /></span>
            <span className="inv-kpi__value">{k.value}</span>
            <span className="inv-kpi__label">{k.label}</span>
            <span className="inv-kpi__hint">{k.hint}</span>
          </div>
        ))}
      </div>

      {/* Search & filter bar */}
      <div className="inv-filterbar">
        <div className="inv-field" style={{ flex: "1 1 260px" }}>
          <label className="inv-field__label">Search</label>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="inv-input" style={{ paddingLeft: 32 }} type="search" value={searchInput}
              placeholder="Quote no, customer, item..."
              aria-label="Search quotations"
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput.trim()); }}
            />
          </div>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Status</label>
          <select className="inv-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Quick Filter</label>
          <select className="inv-select" value={quickStatus} onChange={(e) => setQuickStatus(e.target.value)}>
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button className="inv-btn inv-btn--icon" title="Refresh" aria-label="Refresh" onClick={load}>
          <RefreshCw size={16} />
        </button>
        {hasActiveFilter && (
          <button className="inv-btn" title="Clear filters" onClick={clearFilters}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Desktop table */}
      {data && visible.length > 0 && (
        <div className="inv-table-wrap">
          <div className="inv-scroll">
            <table className="inv-table">
              <colgroup>
                <col style={{ width: "16%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Quote No</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Valid Till</th>
                  <th>Created</th>
                  <th>Payment / Delivery</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((q) => renderRow(q))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      <div className="inv-mobile">
        {visible.length === 0 && !error && !data && <Loading label="Loading quotations" />}
        {visible.length === 0 && !error && data && data.items.length === 0 && (
          <div className="inv-status">No quotations found.</div>
        )}
        {visible.map((q) => renderCard(q))}
      </div>

      {/* Errors / empty (desktop) */}
      {error && <EmptyState title="Quotes unavailable" text={error} />}
      {!data && !error && <div className="inv-status"><Loading label="Loading quotations" /></div>}
      {data && visible.length === 0 && !error && (
        <div className="inv-status">
          <FileText size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <div>No quotations match the current filters.</div>
        </div>
      )}

      {/* Pagination */}
      <div className="inv-pagination">
        <span className="inv-pagination__info">
          {data ? `Showing ${data.items.length} of ${data.totalCount} quotations` : ""}
        </span>

        <div className="inv-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <label className="inv-field__label" style={{ margin: 0 }}>Rows</label>
          <select className="inv-select" style={{ width: "auto", padding: "7px 34px 7px 10px" }}
            value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <button className="inv-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
          .reduce<ReactNode[]>((acc, n, idx, arr) => {
            if (idx > 0 && n - arr[idx - 1] > 1) acc.push(<span key={`e${n}`} style={{ color: "var(--text-muted)", padding: "0 2px" }}>…</span>);
            acc.push(
              <button key={n} className={`inv-page-btn ${n === page ? "inv-page-btn--active" : ""}`}
                onClick={() => setPage(n)}>{n}</button>,
            );
            return acc;
          }, [])}

        <button className="inv-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
}
