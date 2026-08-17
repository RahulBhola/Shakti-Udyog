import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { engineerApi } from "../../../api/engineerApi";
import { adminApi } from "../../../api/adminApi";
import { useAuth } from "../../../auth/AuthContext";
import { Roles } from "../../../auth/roles";
import type { OrderListItem, Paged } from "../../../api/customerApi";
import { EmptyState, Loading } from "../../../components/ui";
import { formatDate } from "../../shared";
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, X, Download, Clock,
  Eye, MoreVertical, FileText, Loader2,
  Package, CheckCircle2, Cog, ShieldCheck, Truck, PackageCheck, UserCog,
} from "lucide-react";
import "../erpListView.css";

const ORDER_STATUSES = [
  "confirmed", "pattern_development", "production", "quality_check", "packed",
  "ready_to_dispatch", "dispatched", "delivered", "on_hold", "cancelled",
];
const PAGE_SIZES = [10, 20, 50];

/* ---- helpers ------------------------------------------------------- */

function humanize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusTone(status: string): string {
  switch (status) {
    case "confirmed":
    case "delivered": return "green";
    case "cancelled": return "red";
    case "pattern_development":
    case "ready_to_dispatch":
    case "on_hold": return "orange";
    case "production": return "blue";
    case "quality_check":
    case "dispatched": return "purple";
    case "packed":
    case "returned": return "green";
    case "closed": return "gray";
    default: return "gray";
  }
}

function OrderBadge({ status }: { status: string }) {
  return <span className={`inv-badge inv-badge--${statusTone(status)}`}>{humanize(status)}</span>;
}

function daysRemaining(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function DaysTag({ date }: { date: string | null | undefined }) {
  const days = daysRemaining(date);
  if (days === null) return null;
  const tone = days < 0 ? "var(--color-danger)" : days <= 7 ? "var(--color-warning)" : "var(--color-success)";
  return (
    <span className="inv-time" style={{ color: tone, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
      <Clock size={11} /> {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
    </span>
  );
}

/* ---- main page ----------------------------------------------------- */

export default function EngineerOrderListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("company") ?? "";

  const [data, setData] = useState<Paged<OrderListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");

  // Row action menu
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { user } = useAuth();
  const isAdmin = !!user?.roles.includes(Roles.Admin);
  const [engineers, setEngineers] = useState<{ id: string; fullName: string | null; email: string; role: string }[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const [stats, setStats] = useState<{
    total: number; confirmed: number; production: number;
    qualityCheck: number; readyToDispatch: number; delivered: number;
  } | null>(null);

  const load = useCallback(async (p: number, s: string, st: string, cid: string, asg: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await engineerApi.orders(p, pageSize, s || undefined, st || undefined, cid || undefined, asg || undefined);
      setData(result);
    } catch (e: any) {
      setError(e.message ?? "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const loadStats = useCallback(async () => {
    try {
      const statuses = ["confirmed", "production", "quality_check", "ready_to_dispatch", "delivered"];
      const results = await Promise.all(
        statuses.map((st) => engineerApi.orders(1, 1, undefined, st).catch(() => null)),
      );
      const totalResult = await engineerApi.orders(1, 1).catch(() => null);
      setStats({
        total: totalResult?.totalCount ?? 0,
        confirmed: results[0]?.totalCount ?? 0,
        production: results[1]?.totalCount ?? 0,
        qualityCheck: results[2]?.totalCount ?? 0,
        readyToDispatch: results[3]?.totalCount ?? 0,
        delivered: results[4]?.totalCount ?? 0,
      });
    } catch {
      // Stats silently fail
    }
  }, []);

  useEffect(() => { load(page, search, statusFilter, companyId, assignedFilter); }, [page, search, statusFilter, companyId, assignedFilter, load]);
  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { setPage(1); }, [search, statusFilter, assignedFilter, pageSize]);

  // Load the engineer list (admins only) for the inline assign control.
  useEffect(() => {
    if (!isAdmin) return;
    adminApi.users()
      .then((users) => setEngineers(users.filter((u) => u.role === Roles.Engineer)))
      .catch(() => {});
  }, [isAdmin]);

  const handleAssignOrder = async (orderId: string, engineerId: string) => {
    setAssigningId(orderId);
    try {
      await adminApi.assignOrder(orderId, engineerId || null);
      load(page, search, statusFilter, companyId, assignedFilter);
    } catch {
      // Ignore list-level assign errors; detail page shows them.
    } finally {
      setAssigningId(null);
    }
  };
  // Close the row menu on outside click
  useEffect(() => {
    if (!openMenu) return;
    const onDown = () => setOpenMenu(null);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  const handleRefresh = () => { load(page, search, statusFilter, companyId, assignedFilter); loadStats(); };

  const handleExport = () => {
    if (!data?.items.length) return;
    const headers = ["Order Number", "Status", "Quantity", "Placed Date", "Promised Dispatch", "Last Updated"];
    const rows = data.items.map((o) => [
      o.orderNumber, o.statusLabel, String(o.totalQuantity),
      o.placedAtUtc, o.promisedDispatchDateUtc ?? "", o.lastUpdatedAtUtc,
    ]);
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = !!search || !!statusFilter || !!assignedFilter;
  const clearFilters = () => { setSearchInput(""); setSearch(""); setStatusFilter(""); setAssignedFilter(""); };

  const kpis = [
    { label: "Total Orders", value: stats?.total ?? 0, hint: "All orders", icon: Package, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", glow: "rgba(59,130,246,0.25)" },
    { label: "Confirmed", value: stats?.confirmed ?? 0, hint: "Confirmed orders", icon: CheckCircle2, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", glow: "rgba(34,197,94,0.22)" },
    { label: "In Production", value: stats?.production ?? 0, hint: "In the foundry", icon: Cog, color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)", glow: "rgba(167,139,250,0.22)" },
    { label: "Quality Check", value: stats?.qualityCheck ?? 0, hint: "QC stage", icon: ShieldCheck, color: "var(--kpi-orange)", bg: "var(--kpi-orange-bg)", glow: "rgba(249,115,22,0.22)" },
    { label: "Ready to Dispatch", value: stats?.readyToDispatch ?? 0, hint: "Awaiting shipment", icon: PackageCheck, color: "var(--kpi-teal)", bg: "var(--kpi-teal-bg)", glow: "rgba(20,184,166,0.22)" },
    { label: "Delivered", value: stats?.delivered ?? 0, hint: "Completed deliveries", icon: Truck, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", glow: "rgba(34,197,94,0.22)" },
  ];

  const openOrder = (o: OrderListItem) => navigate(`/admin/orders/${o.id}`);

  const renderRow = (o: OrderListItem) => {
    return (
      <tr key={o.id} onClick={() => openOrder(o)}>
        <td>
          <span className="inv-link" role="link" tabIndex={0}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); openOrder(o); } }}>
            {o.orderNumber}
          </span>
          <div className="inv-sub">{formatDate(o.placedAtUtc)}</div>
        </td>
        <td>
          <div className="inv-customer">
            <span className="inv-avatar">{initials(o.companyName)}</span>
            <div>
              <div className="inv-customer__name" title={o.companyName ?? undefined}>{o.companyName ?? "—"}</div>
              <div className="inv-customer__contact">{o.productType}</div>
            </div>
          </div>
        </td>
        <td>
          <div className="inv-amount__total" style={{ fontSize: 15 }}>{o.totalQuantity}</div>
          <div className="inv-sub">units</div>
        </td>
        <td>
          <div className="inv-date">{formatDate(o.promisedDispatchDateUtc)}</div>
          <DaysTag date={o.promisedDispatchDateUtc} />
        </td>
        <td>
          <div className="inv-date">{formatDate(o.lastUpdatedAtUtc)}</div>
        </td>
        <td>
          {isAdmin ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {assigningId === o.id ? (
                <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-muted)" }} />
              ) : (
                <UserCog size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              )}
              <select
                className="inv-select"
                aria-label="Assign engineer"
                style={{ padding: "5px 8px", fontSize: 12, maxWidth: 150 }}
                value={o.assignedToUserId ?? ""}
                disabled={assigningId === o.id}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleAssignOrder(o.id, e.target.value)}
              >
                <option value="">Unassigned</option>
                {engineers.map((eng) => (
                  <option key={eng.id} value={eng.id}>{eng.fullName || eng.email}</option>
                ))}
              </select>
            </div>
          ) : o.assignedToName ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-secondary)" }}>
              <UserCog size={13} style={{ color: "var(--text-muted)" }} /> {o.assignedToName}
            </span>
          ) : (
            <span className="inv-badge inv-badge--gray">Unassigned</span>
          )}
        </td>
        <td><OrderBadge status={o.status} /></td>
        <td>
          <div className="inv-actions" onClick={(e) => e.stopPropagation()}>
            <button className="inv-icon-btn" title="View" aria-label="View" onClick={() => openOrder(o)}>
              <Eye size={16} />
            </button>
            <div className="inv-menu-wrap" onMouseDown={(e) => e.stopPropagation()}>
              <button className="inv-icon-btn" title="More" aria-label="More actions"
                aria-expanded={openMenu === o.id}
                onClick={() => setOpenMenu((m) => (m === o.id ? null : o.id))}>
                <MoreVertical size={16} />
              </button>
              {openMenu === o.id && (
                <div className="inv-menu">
                  <button className="inv-menu__item" onClick={() => { setOpenMenu(null); openOrder(o); }}>
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

  const renderCard = (o: OrderListItem) => {
    return (
      <div key={o.id} className="inv-card" onClick={() => openOrder(o)}>
        <div className="inv-card__top">
          <div className="inv-card__customer">
            <span className="inv-avatar">{initials(o.companyName)}</span>
            <div>
              <div className="inv-customer__name">{o.companyName ?? "—"}</div>
              <div className="inv-sub inv-link">{o.orderNumber}</div>
            </div>
          </div>
          <OrderBadge status={o.status} />
        </div>
        <div className="inv-card__body">
          <div className="inv-card__cell">
            <span className="inv-card__label">Product</span>
            <span className="inv-card__value">{o.productType ?? "—"}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Quantity</span>
            <span className="inv-card__value">{o.totalQuantity}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Placed</span>
            <span className="inv-card__value">{formatDate(o.placedAtUtc)}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Promised Dispatch</span>
            <span className="inv-card__value">{formatDate(o.promisedDispatchDateUtc)}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Engineer</span>
            <span className="inv-card__value">{o.assignedToName ?? "Unassigned"}</span>
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
          <h1 className="inv-header__title">Orders</h1>
          <p className="inv-header__subtitle">Track and manage customer production orders.</p>
        </div>
        <div className="inv-header__actions">
          <button className="inv-btn" onClick={handleExport} title="Export visible orders to Excel">
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
        <div className="inv-field" style={{ flex: "1 1 260px" }}>
          <label className="inv-field__label">Search</label>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="inv-input" style={{ paddingLeft: 32 }} type="search" value={searchInput}
              placeholder="Search by order number..."
              aria-label="Search orders"
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput.trim()); }}
            />
          </div>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Status</label>
          <select className="inv-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
          </select>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Assignment</label>
          <select className="inv-select" value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value)}>
            <option value="">All</option>
            <option value="true">Assigned</option>
            <option value="false">Unassigned</option>
          </select>
        </div>

        <button className="inv-btn inv-btn--icon" title="Refresh" aria-label="Refresh" onClick={handleRefresh}>
          <RefreshCw size={16} />
        </button>
        <button className="inv-btn" onClick={handleExport} title="Export visible orders to Excel">
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
          <button className="inv-btn" onClick={() => navigate("/admin/orders")}>
            <X size={14} /> Clear company filter
          </button>
        </div>
      )}

      {/* Desktop table */}
      {Boolean(data?.items?.length) && (
        <div className="inv-table-wrap">
          <div className="inv-scroll">
            <table className="inv-table">
              <colgroup>
                <col style={{ width: "15%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "6%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Quantity</th>
                  <th>Promised Dispatch</th>
                  <th>Last Updated</th>
                  <th>Assigned</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => renderRow(o))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      <div className="inv-mobile">
        {loading && !data && !error && <Loading label="Loading orders" />}
        {!loading && data && (data.items ?? []).length === 0 && !error && <div className="inv-status">No orders found.</div>}
        {(data?.items ?? []).map((o) => renderCard(o))}
      </div>

      {/* Errors / loading / empty (desktop) */}
      {error && <EmptyState title="Failed to load orders" text={error} />}
      {loading && !data && !error && <div className="inv-status"><Loading label="Loading orders" /></div>}
      {!error && data && (data.items ?? []).length === 0 && (
        <div className="inv-status">
          <FileText size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <div>{hasFilters ? "No orders match the current filters." : "No orders found."}</div>
        </div>
      )}

      {/* Pagination */}
      <div className="inv-pagination">
        <span className="inv-pagination__info">
          {data ? `Showing ${(data.items ?? []).length} of ${data.totalCount} orders` : ""}
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
