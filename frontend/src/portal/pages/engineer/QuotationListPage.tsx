import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { engineerApi } from "../../../api/engineerApi";
import type { Paged, QuotationListItem } from "../../../api/customerApi";
import { EmptyState, Loading } from "../../../components/ui";
import { formatDate } from "../../shared";
import {
  FileText, Search, RefreshCw, ChevronLeft, ChevronRight, X,
  ClipboardList, CheckCircle2, Clock, XCircle, Download, Eye,
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

function initials(name: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
}

function exportToCsv(items: QuotationListItem[]) {
  const headers = ["Quote Number", "Customer", "Product Type", "Amount", "Status", "Valid Until", "Created At"];
  const rows = items.map((q) => [
    q.quotationNumber,
    q.companyName ?? "Unknown",
    q.productType,
    String(q.total),
    q.status,
    formatDate(q.validUntilUtc),
    formatDate(q.createdAtUtc),
  ]);
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((row) => row.map(esc).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quotations-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function QuotationListPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<Paged<QuotationListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const load = useCallback(() => {
    engineerApi.quotations(page, pageSize, search || undefined, statusFilter === "All" ? undefined : statusFilter)
      .then(setData).catch((e: Error) => setError(e.message));
  }, [page, pageSize, search, statusFilter]);

  useEffect(load, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter, pageSize]);

  const totalCount = data?.totalCount ?? (data as any)?.total ?? 0;
  const totalPages = data ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;

  const pageStatuses = data?.items.map((r) => r.status) ?? [];
  const total = totalCount;
  const accepted = pageStatuses.filter((s) => s === "Accepted" || s === "Converted").length;
  const pending = pageStatuses.filter((s) => s === "Draft" || s === "Pending Approval" || s === "Issued" || s === "Negotiating").length;
  const cancelled = pageStatuses.filter((s) => s === "Cancelled" || s === "Declined" || s === "Expired").length;

  const clearFilters = () => {
    setSearchInput(""); setSearch(""); setStatusFilter("All"); setPage(1);
  };
  const hasActiveFilter = search !== "" || statusFilter !== "All";

  const kpis = [
    { label: "Total Quotes", value: total, hint: "All generated quotes", icon: ClipboardList, bgClass: "bg-blue-500/10", textClass: "text-blue-500", glow: "rgba(59,130,246,0.18)" },
    { label: "Accepted & Won", value: accepted, hint: "Approved & converted", icon: CheckCircle2, bgClass: "bg-emerald-500/10", textClass: "text-emerald-500", glow: "rgba(16,185,129,0.18)" },
    { label: "Pending / In Review", value: pending, hint: "Draft / issued / negotiating", icon: Clock, bgClass: "bg-amber-500/10", textClass: "text-amber-500", glow: "rgba(245,158,11,0.18)" },
    { label: "Cancelled / Declined", value: cancelled, hint: "Declined or expired", icon: XCircle, bgClass: "bg-rose-500/10", textClass: "text-rose-500", glow: "rgba(244,63,94,0.18)" },
  ];

  const openQuotation = (q: QuotationListItem) => navigate(`/admin/quotations/${q.id}`);

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Hero Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[var(--color-primary)] font-bold">Quotations</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Quotes & Estimates
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-xs">
              {total} Quotes
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Track and manage engineering quotations, commercial terms, and customer approvals across the sales cycle.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => { if (data) exportToCsv(data.items); }}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer"
            title="Export visible Quotations to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer"
            title="Refresh Quotations"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 2. Balanced 4-Card KPI Grid ────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,var(--glow),transparent)] before:pointer-events-none"
            style={{ "--glow": k.glow } as any}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.bgClass} ${k.textClass}`}>
              <k.icon size={18} />
            </div>
            <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight tabular-nums">
              {k.value.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">{k.label}</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{k.hint}</div>
          </div>
        ))}
      </div>

      {/* ── 3. Toolbar & Quick Filters ─────────────────────── */}
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
              placeholder="Search by quote number, customer, item..."
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
              { label: "All Quotes", status: "All" },
              { label: "Draft", status: "Draft" },
              { label: "Pending", status: "Pending Approval" },
              { label: "Approved", status: "Approved" },
              { label: "Issued", status: "Issued" },
              { label: "Accepted", status: "Accepted" },
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

        {hasActiveFilter && (
          <div className="flex items-center justify-end pt-2 border-t border-neutral-100 dark:border-white/5">
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <X size={12} /> Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ── 4. Interactive High-End Table ──────────────────── */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs overflow-hidden">
        {error ? (
          <div className="p-8 text-center"><EmptyState title="Quotes unavailable" text={error} /></div>
        ) : !data ? (
          <div className="py-24 text-center"><Loading label="Loading quotations..." /></div>
        ) : data.items.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 space-y-2">
            <FileText size={44} className="mx-auto opacity-30" />
            <p className="text-sm font-medium text-neutral-500">No quotations match the current filters.</p>
            {hasActiveFilter && (
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
                    Quote Number
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Customer & Item
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-right">
                    Quoted Amount
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Validity
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Created
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Payment & Delivery
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
                {data.items.map((q) => {
                  const avatar = getAvatarStyle(q.companyName || q.id);
                  return (
                    <tr
                      key={q.id}
                      onClick={() => openQuotation(q)}
                      className="border-b border-neutral-200/60 dark:border-white/5 hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-extrabold text-neutral-900 dark:text-white group-hover:text-[var(--color-primary)] transition-colors">
                          {q.quotationNumber}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          Rev.{q.revisionNumber}{q.enquiryId ? " · linked to RFQ" : ""}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border"
                            style={{ background: avatar.bg, color: avatar.fg, borderColor: avatar.border }}
                          >
                            {initials(q.companyName)}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-white text-xs">{q.companyName ?? "—"}</div>
                            <div className="text-[11px] text-neutral-400">{q.productType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-neutral-900 dark:text-white text-[13.5px] tabular-nums">
                          {money(q.total, q.currency)}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {q.itemCount} {q.itemCount === 1 ? "line item" : "line items"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200">{formatDate(q.validUntilUtc)}</div>
                        <div className="text-[11px] text-neutral-400">Valid till</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">{formatDate(q.createdAtUtc)}</div>
                        <div className="text-[11px] text-neutral-400">{formatTime(q.createdAtUtc)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-neutral-700 dark:text-neutral-300 font-medium truncate max-w-[150px]">
                          {q.paymentTerms?.split("\n")[0] ? `Pay: ${q.paymentTerms.split("\n")[0]}` : "Pay: Standard"}
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate max-w-[150px]">
                          Delivery: {q.deliveryTime || "Ex-Works"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <QuotationBadge status={q.status} />
                      </td>
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openQuotation(q)}
                            className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/10 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs cursor-pointer"
                            title="View Quotation"
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
              Showing <span className="font-bold text-neutral-900 dark:text-white">{data.items.length}</span> of{" "}
              <span className="font-bold text-neutral-900 dark:text-white">{totalCount}</span> quotations
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

