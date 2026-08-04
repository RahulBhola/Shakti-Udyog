import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { updaterApi, type UpdaterRfqListItem } from "../../../api/updaterApi";
import type { Paged } from "../../../api/customerApi";
import { EmptyState, Loading } from "../../../components/ui";
import { tokenStorage } from "../../../auth/tokenStorage";
import { config } from "../../../config";
import { formatDate } from "../../shared";
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, X, Download,
  Eye, MoreVertical, FileText, Clock, CheckCircle, AlertCircle,
  XCircle, FileEdit, Package,
} from "lucide-react";
import "../erpListView.css";

const STATUS_FILTERS = ["All", "Draft", "Received", "Under Review", "Approved", "Quoted", "Accepted", "Rejected", "Cancelled"];
const PRIORITY_FILTERS = ["All", "Low", "Medium", "High", "Urgent"];
const PAGE_SIZES = [10, 20, 50];

/* ---- helpers ------------------------------------------------------- */

function rfqNo(id: string): string {
  return `RFQ-${id.slice(0, 8).toUpperCase()}`;
}

function statusTone(status: string): string {
  switch (status) {
    case "Accepted":
    case "Approved": return "green";
    case "Rejected":
    case "Cancelled": return "red";
    case "Under Review": return "orange";
    case "Quoted": return "purple";
    case "Draft":
    case "Received": return "blue";
    case "Expired": return "gray";
    default: return "gray";
  }
}

function priorityTone(priority: string): string {
  switch (priority) {
    case "High":
    case "Urgent": return "red";
    case "Medium": return "orange";
    default: return "gray";
  }
}

function RfqBadge({ status }: { status: string }) {
  return <span className={`inv-badge inv-badge--${statusTone(status)}`}>{status}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  return <span className={`inv-badge inv-badge--${priorityTone(priority)}`}>{priority}</span>;
}

/*  CSV export                                                        */
function exportToCsv(items: UpdaterRfqListItem[]) {
  const headers = ["RFQ No.", "Customer", "Product", "Quantity", "Status", "Date", "Files", "Assigned"];
  const rows = items.map((r) => [
    rfqNo(r.id),
    r.companyName ?? "Unknown",
    r.productType,
    r.quantity,
    r.status,
    formatDate(r.createdAtUtc),
    String(r.fileCount),
    r.assignedToUserId ? "Yes" : "No",
  ]);
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((row) => row.map(esc).join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rfqs-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/*  Thumbnail image (auth-fetched)                                    */
function ListRfqImage({ rfqId, fileId }: { rfqId: string; fileId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    const token = tokenStorage.getAccessToken();
    fetch(`${config.apiBaseUrl}/api/v1/updater/rfqs/${rfqId}/files/${fileId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include",
    }).then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then((blob) => { if (!cancelled) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); } })
      .catch(() => {});
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [rfqId, fileId]);
  if (!url) return <span className="inv-avatar" style={{ background: "var(--bg-surface-hover)" }} />;
  return <img src={url} alt="" className="inv-avatar" style={{ objectFit: "cover" }} />;
}

/* ---- main page ----------------------------------------------------- */

export default function UpdaterRfqListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("company") ?? "";

  const [data, setData] = useState<Paged<UpdaterRfqListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = useCallback(() => {
    updaterApi.rfqs(page, pageSize, search || undefined, statusFilter === "All" ? undefined : statusFilter, companyId || undefined)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [page, pageSize, search, statusFilter, companyId]);
  useEffect(load, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter, pageSize]);

  // Close the row menu on outside click
  useEffect(() => {
    if (!openMenu) return;
    const onDown = () => setOpenMenu(null);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  // Priority is a client-side refinement on the current page (no backend param)
  const filteredItems = data?.items.filter((r) => priorityFilter === "All" || r.priority === priorityFilter) ?? [];

  // RFQ-specific summary from the current page (preserving existing behaviour)
  const allStatuses = data?.items.map((r) => r.status) ?? [];
  const totalRfqs = data?.totalCount ?? 0;
  const newCount = allStatuses.filter((s) => s === "Received").length;
  const reviewCount = allStatuses.filter((s) => s === "Under Review").length;
  const quotedCount = allStatuses.filter((s) => s === "Quoted").length;
  const acceptedCount = allStatuses.filter((s) => s === "Accepted").length;
  const rejectedCount = allStatuses.filter((s) => s === "Rejected").length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (!data) return;
    setSelectedIds((prev) => (prev.size === filteredItems.length ? new Set() : new Set(filteredItems.map((r) => r.id))));
  };
  const allSelected = filteredItems.length > 0 && selectedIds.size === filteredItems.length;

  const clearFilters = () => { setSearchInput(""); setSearch(""); setStatusFilter("All"); setPriorityFilter("All"); setPage(1); };
  const hasFilters = !!search || statusFilter !== "All" || priorityFilter !== "All";

  const kpis = [
    { label: "Total RFQs", value: totalRfqs, hint: "All requests", icon: FileText, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", glow: "rgba(59,130,246,0.25)" },
    { label: "Received", value: newCount, hint: "New requests", icon: Clock, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", glow: "rgba(59,130,246,0.22)" },
    { label: "Under Review", value: reviewCount, hint: "In review", icon: AlertCircle, color: "var(--kpi-orange)", bg: "var(--kpi-orange-bg)", glow: "rgba(249,115,22,0.22)" },
    { label: "Quoted", value: quotedCount, hint: "Quotations sent", icon: FileEdit, color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)", glow: "rgba(167,139,250,0.22)" },
    { label: "Accepted", value: acceptedCount, hint: "Accepted", icon: CheckCircle, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", glow: "rgba(34,197,94,0.22)" },
    { label: "Rejected", value: rejectedCount, hint: "Rejected", icon: XCircle, color: "var(--color-danger)", bg: "rgba(239,68,68,0.10)", glow: "rgba(239,68,68,0.22)" },
  ];

  const openRfq = (r: UpdaterRfqListItem) => navigate(`/admin/rfqs/${r.id}`);

  const renderThumb = (r: UpdaterRfqListItem) => {
    if (r.firstFileId && r.firstFileContentType?.startsWith("image/")) {
      return <ListRfqImage rfqId={r.id} fileId={r.firstFileId} />;
    }
    if (r.fileCount > 0) {
      return <span className="inv-avatar" style={{ background: "var(--bg-surface-hover)" }}><FileText size={16} /></span>;
    }
    return <span className="inv-avatar" style={{ background: "var(--bg-surface)" }} />;
  };

  const renderRow = (r: UpdaterRfqListItem) => {
    return (
      <tr key={r.id} onClick={() => openRfq(r)}>
        <td onClick={(e) => e.stopPropagation()}>
          <input type="checkbox" className="inv-check" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} aria-label="Select RFQ" />
        </td>
        <td>{renderThumb(r)}</td>
        <td>
          <span className="inv-link" role="link" tabIndex={0}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); openRfq(r); } }}>
            {rfqNo(r.id)}
          </span>
          <div className="inv-sub">{formatDate(r.createdAtUtc)}</div>
        </td>
        <td>
          <div className="inv-customer">
            <span className="inv-avatar">{initials(r.companyName)}</span>
            <div>
              <div className="inv-customer__name" title={r.companyName ?? undefined}>{r.companyName ?? "Unknown"}</div>
              <div className="inv-customer__contact">{r.productType}</div>
            </div>
          </div>
        </td>
        <td>
          <div className="inv-amount__total" style={{ fontSize: 15 }}>{r.quantity}</div>
        </td>
        <td>
          {r.assignedToUserId ? (
            <div className="inv-customer__name" style={{ fontSize: 13 }}>Assigned</div>
          ) : (
            <span className="inv-sub">—</span>
          )}
        </td>
        <td><PriorityBadge priority={r.priority} /></td>
        <td><RfqBadge status={r.status} /></td>
        <td>
          <div className="inv-actions" onClick={(e) => e.stopPropagation()}>
            <button className="inv-icon-btn" title="View" aria-label="View" onClick={() => openRfq(r)}>
              <Eye size={16} />
            </button>
            <div className="inv-menu-wrap" onMouseDown={(e) => e.stopPropagation()}>
              <button className="inv-icon-btn" title="More" aria-label="More actions"
                aria-expanded={openMenu === r.id}
                onClick={() => setOpenMenu((m) => (m === r.id ? null : r.id))}>
                <MoreVertical size={16} />
              </button>
              {openMenu === r.id && (
                <div className="inv-menu">
                  <button className="inv-menu__item" onClick={() => { setOpenMenu(null); openRfq(r); }}>
                    <Eye size={15} /> View Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  const renderCard = (r: UpdaterRfqListItem) => {
    return (
      <div key={r.id} className="inv-card" onClick={() => openRfq(r)}>
        <div className="inv-card__top">
          <div className="inv-card__customer">
            <span className="inv-avatar">{initials(r.companyName)}</span>
            <div>
              <div className="inv-customer__name">{r.companyName ?? "Unknown"}</div>
              <div className="inv-sub inv-link">{rfqNo(r.id)}</div>
            </div>
          </div>
          <RfqBadge status={r.status} />
        </div>
        <div className="inv-card__body">
          <div className="inv-card__cell">
            <span className="inv-card__label">Product</span>
            <span className="inv-card__value">{r.productType}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Quantity</span>
            <span className="inv-card__value">{r.quantity}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Date</span>
            <span className="inv-card__value">{formatDate(r.createdAtUtc)}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Priority</span>
            <span className="inv-card__value"><PriorityBadge priority={r.priority} /></span>
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
          <h1 className="inv-header__title">RFQs</h1>
          <p className="inv-header__subtitle">Manage customer Requests for Quotation.</p>
        </div>
        <div className="inv-header__actions">
          <button className="inv-btn" onClick={() => { if (data) exportToCsv(data.items); }} title="Export visible RFQs to Excel">
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="inv-kpi-grid">
        {kpis.map((k) => (
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
        <div className="inv-field" style={{ flex: "1 1 240px" }}>
          <label className="inv-field__label">Search</label>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="inv-input" style={{ paddingLeft: 32 }} type="search" value={searchInput}
              placeholder="Search RFQs..."
              aria-label="Search RFQs"
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
          <label className="inv-field__label">Priority</label>
          <select className="inv-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            {PRIORITY_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button className="inv-btn inv-btn--icon" title="Refresh" aria-label="Refresh" onClick={load}>
          <RefreshCw size={16} />
        </button>
        <button className="inv-btn" onClick={() => { if (data) exportToCsv(data.items); }} title="Export visible RFQs to Excel">
          <Download size={14} /> Export
        </button>
        {hasFilters && (
          <button className="inv-btn" title="Clear filters" onClick={clearFilters}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Company scope indicator */}
      {companyId && (
        <div className="inv-filterbar" style={{ padding: "10px 16px", alignItems: "center", gap: 10 }}>
          <span className="inv-badge inv-badge--blue">Filtered by company</span>
          <button className="inv-btn" onClick={() => navigate("/admin/rfqs")}>
            <X size={14} /> Clear company filter
          </button>
        </div>
      )}

      {/* Desktop table */}
      {data && filteredItems.length > 0 && (
        <div className="inv-table-wrap">
          <div className="inv-scroll">
            <table className="inv-table">
              <colgroup>
                <col style={{ width: 40 }} />
                <col style={{ width: 52 }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: 90 }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" className="inv-check" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all" />
                  </th>
                  <th style={{ width: 52 }}>Image</th>
                  <th>RFQ No.</th>
                  <th>Customer</th>
                  <th>Qty</th>
                  <th>Assigned</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((r) => renderRow(r))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      <div className="inv-mobile">
        {!data && !error && <Loading label="Loading RFQs" />}
        {data && filteredItems.length === 0 && !error && <div className="inv-status">No RFQs found.</div>}
        {filteredItems.map((r) => renderCard(r))}
      </div>

      {/* Errors / loading / empty (desktop) */}
      {error && <EmptyState title="RFQs unavailable" text={error} />}
      {!data && !error && <div className="inv-status"><Loading label="Loading RFQs" /></div>}
      {data && filteredItems.length === 0 && !error && (
        <div className="inv-status">
          <Package size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <div>{hasFilters ? "No RFQs match the current filters." : "No RFQs found."}</div>
        </div>
      )}

      {/* Pagination */}
      <div className="inv-pagination">
        <span className="inv-pagination__info">
          {selectedIds.size > 0
            ? `${selectedIds.size} selected`
            : data ? `Showing ${data.items.length} of ${data.totalCount} RFQs` : ""}
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
