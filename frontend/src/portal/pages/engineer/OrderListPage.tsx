import { useCallback, useEffect, useState } from "react";
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
  Eye, Loader2,
  Package, CheckCircle2, Cog, ShieldCheck, Truck, PackageCheck, UserCog,
} from "lucide-react";
import "../erpListView.css";

const PAGE_SIZES = [10, 20, 50];

const AVATAR_PALETTES = [
  { bg: "rgba(59,130,246,0.15)", fg: "#3B82F6", border: "rgba(59,130,246,0.3)" },
  { bg: "rgba(168,85,247,0.15)", fg: "#A855F7", border: "rgba(168,85,247,0.3)" },
  { bg: "rgba(20,184,166,0.15)", fg: "#14B8A6", border: "rgba(20,184,166,0.3)" },
  { bg: "rgba(249,115,22,0.15)", fg: "#F97316", border: "rgba(249,115,22,0.3)" },
  { bg: "rgba(236,72,153,0.15)", fg: "#EC4899", border: "rgba(236,72,153,0.3)" },
  { bg: "rgba(34,197,94,0.15)", fg: "#22C55E", border: "rgba(34,197,94,0.3)" },
];

function getAvatarStyle(identifier: string) {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

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

function initials(name: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
}

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
        total: totalResult?.totalCount ?? (totalResult as any)?.total ?? 0,
        confirmed: results[0]?.totalCount ?? (results[0] as any)?.total ?? 0,
        production: results[1]?.totalCount ?? (results[1] as any)?.total ?? 0,
        qualityCheck: results[2]?.totalCount ?? (results[2] as any)?.total ?? 0,
        readyToDispatch: results[3]?.totalCount ?? (results[3] as any)?.total ?? 0,
        delivered: results[4]?.totalCount ?? (results[4] as any)?.total ?? 0,
      });
    } catch {
      // Stats fail silently
    }
  }, []);

  useEffect(() => { load(page, search, statusFilter, companyId, assignedFilter); }, [page, search, statusFilter, companyId, assignedFilter, load]);
  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { setPage(1); }, [search, statusFilter, assignedFilter, pageSize]);

  // Load the engineer list (admins only) for inline assign control.
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

  const totalCount = data?.totalCount ?? (data as any)?.total ?? 0;
  const totalPages = data ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;

  const handleRefresh = () => { load(page, search, statusFilter, companyId, assignedFilter); loadStats(); };

  const handleExport = () => {
    if (!data?.items?.length) return;
    const headers = ["Order Number", "Status", "Quantity", "Placed Date", "Promised Dispatch", "Last Updated"];
    const rows = data.items.map((o) => [
      o.orderNumber, o.statusLabel, String(o.totalQuantity),
      o.placedAtUtc, o.promisedDispatchDateUtc ?? "", o.lastUpdatedAtUtc,
    ]);
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = !!search || !!statusFilter || !!assignedFilter;
  const clearFilters = () => { setSearchInput(""); setSearch(""); setStatusFilter(""); setAssignedFilter(""); setPage(1); };

  const kpis = [
    { label: "Total Orders", value: stats?.total ?? totalCount, hint: "All production orders", icon: Package, bgClass: "bg-blue-500/10", textClass: "text-blue-500", glow: "rgba(59,130,246,0.18)" },
    { label: "Confirmed", value: stats?.confirmed ?? 0, hint: "Orders confirmed", icon: CheckCircle2, bgClass: "bg-emerald-500/10", textClass: "text-emerald-500", glow: "rgba(16,185,129,0.18)" },
    { label: "In Production", value: stats?.production ?? 0, hint: "Foundry casting stage", icon: Cog, bgClass: "bg-purple-500/10", textClass: "text-purple-500", glow: "rgba(168,85,247,0.18)" },
    { label: "Quality Check", value: stats?.qualityCheck ?? 0, hint: "Inspection & testing", icon: ShieldCheck, bgClass: "bg-amber-500/10", textClass: "text-amber-500", glow: "rgba(245,158,11,0.18)" },
    { label: "Ready to Dispatch", value: stats?.readyToDispatch ?? 0, hint: "Packed & awaiting transit", icon: PackageCheck, bgClass: "bg-teal-500/10", textClass: "text-teal-500", glow: "rgba(20,184,166,0.18)" },
    { label: "Delivered", value: stats?.delivered ?? 0, hint: "Completed fulfillments", icon: Truck, bgClass: "bg-green-500/10", textClass: "text-green-500", glow: "rgba(34,197,94,0.18)" },
  ];

  const openOrder = (o: OrderListItem) => navigate(`/admin/orders/${o.id}`);

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Hero Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[var(--color-primary)] font-bold">Orders</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Customer Orders
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-xs">
              {stats?.total ?? totalCount} Orders
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Track production schedules, casting progress, quality inspections, and dispatches in real time.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer"
            title="Export visible orders to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-orange-500" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 2. Balanced 6-Card KPI Grid ────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="relative overflow-hidden p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,var(--glow),transparent)] before:pointer-events-none"
            style={{ "--glow": k.glow } as any}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.bgClass} ${k.textClass}`}>
              <k.icon size={17} />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white mt-2.5 leading-tight tracking-tight tabular-nums">
              {k.value.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{k.label}</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{k.hint}</div>
          </div>
        ))}
      </div>

      {/* ── 3. Toolbar & Segmented Quick Filters ───────────── */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Real-time search */}
          <div className="relative w-full lg:w-96">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput.trim()); }}
              placeholder="Search by order number, customer..."
              className="w-full pl-10 pr-4 h-10 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500 shadow-xs"
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(""); setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Segmented Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { label: "All Orders", status: "" },
              { label: "Confirmed", status: "confirmed" },
              { label: "Production", status: "production" },
              { label: "QC", status: "quality_check" },
              { label: "Ready", status: "ready_to_dispatch" },
              { label: "Delivered", status: "delivered" },
            ].map((tab) => {
              const isCurrent = statusFilter === tab.status;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => { setStatusFilter(tab.status); setPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assignment Filter & Company Scope */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-white/5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Assignment:</span>
            <div className="flex items-center gap-1">
              {[
                { label: "All", value: "" },
                { label: "Assigned", value: "true" },
                { label: "Unassigned", value: "false" },
              ].map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => setAssignedFilter(a.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    assignedFilter === a.value
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                      : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* ── 4. Interactive High-End Table ──────────────────── */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs overflow-hidden">
        {error ? (
          <div className="p-8 text-center"><EmptyState title="Orders unavailable" text={error} /></div>
        ) : loading && !data ? (
          <div className="py-24 text-center"><Loading label="Loading orders..." /></div>
        ) : (data?.items ?? []).length === 0 ? (
          <div className="py-24 text-center text-neutral-400 space-y-2">
            <Package size={44} className="mx-auto opacity-30" />
            <p className="text-sm font-medium text-neutral-500">No orders match the current filters.</p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="text-xs text-[var(--color-primary)] hover:underline font-bold cursor-pointer">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ minWidth: 1050 }}>
              <thead>
                <tr className="bg-neutral-50/80 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10">
                  <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Order Number
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Customer & Item
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-right">
                    Quantity
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Promised Dispatch
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Last Updated
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Engineer Assignment
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Status
                  </th>
                  <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).map((o) => {
                  const avatar = getAvatarStyle(o.companyName || o.id);
                  return (
                    <tr
                      key={o.id}
                      onClick={() => openOrder(o)}
                      className="border-b border-neutral-200/60 dark:border-white/5 hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-extrabold text-neutral-900 dark:text-white group-hover:text-[var(--color-primary)] transition-colors">
                          {o.orderNumber}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">{formatDate(o.placedAtUtc)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border"
                            style={{ background: avatar.bg, color: avatar.fg, borderColor: avatar.border }}
                          >
                            {initials(o.companyName)}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-white text-xs">{o.companyName ?? "—"}</div>
                            <div className="text-[11px] text-neutral-400">{o.productType ?? "Casting Item"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-neutral-900 dark:text-white text-[13.5px] tabular-nums">
                          {o.totalQuantity.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-neutral-400">units</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">{formatDate(o.promisedDispatchDateUtc)}</div>
                        <DaysTag date={o.promisedDispatchDateUtc} />
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">{formatDate(o.lastUpdatedAtUtc)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs" onClick={(e) => e.stopPropagation()}>
                        {isAdmin ? (
                          <div className="flex items-center gap-1.5">
                            {assigningId === o.id ? (
                              <Loader2 size={13} className="animate-spin text-neutral-400" />
                            ) : (
                              <UserCog size={13} className="text-neutral-400 shrink-0" />
                            )}
                            <select
                              aria-label="Assign engineer"
                              className="px-2 py-1 text-xs rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500 max-w-[150px]"
                              value={o.assignedToUserId ?? ""}
                              disabled={assigningId === o.id}
                              onChange={(e) => handleAssignOrder(o.id, e.target.value)}
                            >
                              <option value="">Unassigned</option>
                              {engineers.map((eng) => (
                                <option key={eng.id} value={eng.id}>{eng.fullName || eng.email}</option>
                              ))}
                            </select>
                          </div>
                        ) : o.assignedToName ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300">
                            <UserCog size={13} className="text-neutral-400" /> {o.assignedToName}
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <OrderBadge status={o.status} />
                      </td>
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openOrder(o)}
                            className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs cursor-pointer"
                            title="View Order Details"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 5. Standard Pagination Footer ──────────────────── */}
        {data && totalCount > 0 && (
          <div className="px-5 py-3.5 border-t border-neutral-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500 bg-neutral-50/50 dark:bg-white/[0.01]">
            <div>
              Showing <span className="font-bold text-neutral-900 dark:text-white">{(data?.items ?? []).length}</span> of{" "}
              <span className="font-bold text-neutral-900 dark:text-white">{totalCount}</span> orders
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-800 dark:text-white text-xs outline-none"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] disabled:opacity-30 hover:bg-neutral-50 dark:hover:bg-white/5 flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2.5 font-semibold text-neutral-800 dark:text-neutral-200">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] disabled:opacity-30 hover:bg-neutral-50 dark:hover:bg-white/5 flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


