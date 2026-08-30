import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye, Download, FileSpreadsheet, RefreshCw,
  Search, ChevronLeft, ChevronRight, AlertTriangle,
  Receipt, TrendingUp, Wallet, Landmark, X, Plus,
} from "lucide-react";
import { adminApi } from "../../api/adminApi";
import { apiDownload } from "../../api/client";
import type { Paged, InvoiceListItem } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate } from "../shared";
import "./erpListView.css";

const STATUS_FILTERS = ["All", "Issued", "Partially Paid", "Paid", "Overdue", "Cancelled"];
const PAYMENT_FILTERS = ["All", "Paid", "Unpaid", "Partially Paid", "Overdue"];
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

function isOverdue(inv: InvoiceListItem): boolean {
  if (inv.status === "Overdue") return true;
  const pastDue = inv.dueDateUtc != null && new Date(inv.dueDateUtc).getTime() < Date.now();
  return (inv.status === "Issued" || inv.status === "Partially Paid") && pastDue && inv.balanceDue > 0;
}

function paymentStatusOf(inv: InvoiceListItem): string {
  if (isOverdue(inv)) return "Overdue";
  if (inv.balanceDue <= 0) return "Paid";
  if (inv.amountPaid <= 0) return "Unpaid";
  return "Partially Paid";
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function money(value: number | null | undefined, currency = "INR"): string {
  if (value === null || value === undefined) return "₹0.00";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function invoiceTone(status: string): string {
  if (status === "Cancelled" || status === "Rejected") return "red";
  if (status === "Credit Note") return "purple";
  if (status === "Paid") return "green";
  if (status === "Overdue") return "orange";
  if (status === "Issued" || status === "Draft") return "blue";
  return "gray";
}

function paymentTone(status: string): string {
  if (status === "Paid") return "green";
  if (status === "Overdue") return "red";
  if (status === "Partially Paid") return "orange";
  if (status === "Unpaid") return "gray";
  return "blue";
}

function InvoiceBadge({ status }: { status: string }) {
  return <span className={`inv-badge inv-badge--${invoiceTone(status)}`}>{status.replaceAll("_", " ")}</span>;
}

function PaymentBadge({ status }: { status: string }) {
  const label = status === "Overdue" ? "Overdue" : status === "Paid" ? "Paid" : status === "Partially Paid" ? "Partially Paid" : "Unpaid";
  return <span className={`inv-badge inv-badge--${paymentTone(status)}`}>{label}</span>;
}

function InlineOverdue() {
  return (
    <span className="inv-overdue-tag">
      <AlertTriangle size={11} /> Overdue
    </span>
  );
}

interface Finance {
  outstandingAmount: number;
  collectedAmount: number;
  pendingVerification: number;
  overdueInvoices: number;
  invoicesThisMonth: number;
  paymentsThisMonth: number;
}

export default function AdminInvoiceManagePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("company") ?? "";

  const [data, setData] = useState<Paged<InvoiceListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [finance, setFinance] = useState<Finance | null>(null);
  const [companies, setCompanies] = useState<string[]>([]);

  const [paymentStatus, setPaymentStatus] = useState("All");
  const [customerFilter, setCustomerFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    adminApi.invoices(page, pageSize, status, search, companyId || undefined).then(setData).catch((e: Error) => setError(e.message));
  }, [page, pageSize, status, search, companyId]);

  useEffect(load, [load]);

  useEffect(() => {
    adminApi.financialDashboard().then(setFinance).catch(() => {});
    adminApi.companies()
      .then((list) => setCompanies(list.map((c) => c.name).filter(Boolean)))
      .catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [status, search, pageSize]);

  const visible = useMemo(() => {
    const items = data?.items ?? [];
    return items.filter((inv) => {
      if (paymentStatus !== "All" && paymentStatusOf(inv) !== paymentStatus) return false;
      if (customerFilter !== "All" && inv.companyName !== customerFilter) return false;
      if (dateFrom && new Date(inv.issueDateUtc) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(inv.issueDateUtc) > end) return false;
      }
      return true;
    });
  }, [data, paymentStatus, customerFilter, dateFrom, dateTo]);

  const totalCount = data?.totalCount ?? (data as any)?.total ?? 0;
  const totalPages = data ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
  const allSelected = visible.length > 0 && visible.every((i) => selected.has(i.id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) visible.forEach((i) => next.delete(i.id));
      else visible.forEach((i) => next.add(i.id));
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openInvoice = (inv: InvoiceListItem) => {
    navigate(`/admin/deals/${inv.orderId}?invoice=${inv.id}`);
  };

  const downloadPdf = (inv: InvoiceListItem) => {
    void apiDownload(adminApi.invoiceDownloadUrl(inv.id), `${inv.invoiceNumber || "invoice"}.pdf`);
  };

  const clearFilters = () => {
    setSearchInput(""); setSearch(""); setStatus("All"); setPaymentStatus("All");
    setCustomerFilter("All"); setDateFrom(""); setDateTo(""); setPage(1);
  };

  const hasActiveFilter = !!search || status !== "All" || paymentStatus !== "All" || customerFilter !== "All" || !!dateFrom || !!dateTo;

  const exportCsv = () => {
    if (!visible.length) return;
    const headers = ["Invoice No", "Customer", "Order No", "Issue Date", "Due Date", "Total", "Paid", "Balance", "Invoice Status", "Payment Status"];
    const rows = visible.map((i) => [
      i.invoiceNumber, i.companyName ?? "", i.orderNumber ?? "", formatDate(i.issueDateUtc),
      formatDate(i.dueDateUtc), String(i.total), String(i.amountPaid), String(i.balanceDue),
      i.status, paymentStatusOf(i),
    ]);
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    {
      label: "Outstanding", value: money(finance?.outstandingAmount), hint: "Unpaid balance across open invoices",
      icon: Wallet, bgClass: "bg-blue-500/10", textClass: "text-blue-500", glow: "rgba(59,130,246,0.18)",
    },
    {
      label: "Collected", value: money(finance?.collectedAmount), hint: "Total payments received to date",
      icon: Landmark, bgClass: "bg-emerald-500/10", textClass: "text-emerald-500", glow: "rgba(16,185,129,0.18)",
    },
    {
      label: "Overdue", value: `${finance?.overdueInvoices ?? 0}`,
      hint: (finance?.overdueInvoices ?? 0) === 1 ? "Invoice past due date" : "Invoices past due date",
      icon: AlertTriangle, bgClass: "bg-amber-500/10", textClass: "text-amber-500", glow: "rgba(245,158,11,0.18)",
    },
    {
      label: "Total Invoices", value: `${finance?.invoicesThisMonth ?? totalCount}`, hint: "Active month billing",
      icon: Receipt, bgClass: "bg-purple-500/10", textClass: "text-purple-500", glow: "rgba(168,85,247,0.18)",
    },
    {
      label: "Revenue", value: money((finance?.outstandingAmount ?? 0) + (finance?.collectedAmount ?? 0)),
      hint: `${finance?.paymentsThisMonth ?? 0} payments this month`,
      icon: TrendingUp, bgClass: "bg-teal-500/10", textClass: "text-teal-500", glow: "rgba(20,184,166,0.18)",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Hero Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[var(--color-primary)] font-bold">Invoices</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Invoice Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-xs">
              {totalCount} Invoices
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage customer tax invoices, payment milestones, receivables, and collections.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer"
            title="Export visible invoices to CSV"
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/invoices/new")}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Create New Invoice"
          >
            <Plus size={14} />
            <span>New Invoice</span>
          </button>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer"
            title="Refresh Invoices"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 2. Balanced 5-Card KPI Grid ────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
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
              {k.value}
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
              placeholder="Search by invoice, order, customer..."
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
            {STATUS_FILTERS.map((tab) => {
              const isCurrent = status === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => { setStatus(tab); setPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{tab === "All" ? "All Invoices" : tab}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary filters (Payment status, Customer, Date range) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2 border-t border-neutral-100 dark:border-white/5 items-center">
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 mb-1">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none"
            >
              {PAYMENT_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-400 mb-1">Customer Filter</label>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none"
            >
              <option value="All">All Customers</option>
              {companies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="sm:col-span-1 lg:col-span-2 flex items-center justify-between gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-neutral-400 mb-1">Date Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none"
                />
                <span className="text-neutral-400 text-xs">—</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none"
                />
              </div>
            </div>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="self-end px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer whitespace-nowrap"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Interactive High-End Table ──────────────────── */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs overflow-hidden">
        {error ? (
          <div className="p-8 text-center"><EmptyState title="Invoices unavailable" text={error} /></div>
        ) : !data ? (
          <div className="py-24 text-center"><Loading label="Loading invoices..." /></div>
        ) : visible.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 space-y-2">
            <Receipt size={44} className="mx-auto opacity-30" />
            <p className="text-sm font-medium text-neutral-500">No invoices match the current filters.</p>
            {hasActiveFilter && (
              <button type="button" onClick={clearFilters} className="text-xs text-[var(--color-primary)] hover:underline font-bold cursor-pointer">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ minWidth: 1100 }}>
              <thead>
                <tr className="bg-neutral-50/80 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10">
                  <th className="py-3.5 px-4 w-[40px] text-center">
                    <input type="checkbox" className="inv-check cursor-pointer" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Customer
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Invoice & Order ID
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Issue Date
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Due Date
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-right">
                    Amount & Balance
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Invoice Status
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Payment Status
                  </th>
                  <th className="py-3.5 px-5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((inv) => {
                  const avatar = getAvatarStyle(inv.companyName || inv.id);
                  const payStatus = paymentStatusOf(inv);
                  const overdue = isOverdue(inv);

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => openInvoice(inv)}
                      className="border-b border-neutral-200/60 dark:border-white/5 hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="inv-check cursor-pointer"
                          checked={selected.has(inv.id)}
                          onChange={() => toggleRow(inv.id)}
                          aria-label="Select invoice"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border"
                            style={{ background: avatar.bg, color: avatar.fg, borderColor: avatar.border }}
                          >
                            {initials(inv.companyName)}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-white text-xs">{inv.companyName ?? "—"}</div>
                            <div className="text-[11px] text-neutral-400">{inv.companyEmail || inv.companyPhone || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-neutral-900 dark:text-white group-hover:text-[var(--color-primary)] transition-colors">
                          {inv.invoiceNumber}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">{inv.orderNumber ?? "—"}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">{formatDate(inv.issueDateUtc)}</div>
                        <div className="text-[11px] text-neutral-400">{formatTime(inv.issueDateUtc)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">{formatDate(inv.dueDateUtc)}</div>
                        {overdue && <InlineOverdue />}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-black text-neutral-900 dark:text-white text-[13.5px] tabular-nums">
                          {money(inv.total, inv.currency)}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Paid {money(inv.amountPaid, inv.currency)} · Bal {money(inv.balanceDue, inv.currency)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <InvoiceBadge status={inv.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <PaymentBadge status={payStatus} />
                      </td>
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => downloadPdf(inv)}
                            className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs cursor-pointer"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openInvoice(inv)}
                            className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs cursor-pointer"
                            title="View Deal / Invoice"
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
              Showing <span className="font-bold text-neutral-900 dark:text-white">{visible.length}</span> of{" "}
              <span className="font-bold text-neutral-900 dark:text-white">{totalCount}</span> invoices
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
