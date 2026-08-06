import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye, MoreVertical, Download, FileSpreadsheet, FileText, RefreshCw,
  CalendarRange, Search, ChevronLeft, ChevronRight, AlertTriangle, BadgeCheck,
  Receipt, TrendingUp, Wallet, Landmark, X,
} from "lucide-react";
import { adminApi } from "../../api/adminApi";
import { apiDownload } from "../../api/client";
import { connectRealtime, getRealtimeConnection } from "../../realtime/signalR";
import type { Paged, InvoiceListItem } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate } from "../shared";
import "./erpListView.css";

const STATUS_FILTERS = ["All", "Issued", "Partially Paid", "Paid", "Overdue", "Cancelled"];
const PAYMENT_FILTERS = ["All", "Paid", "Unpaid", "Partially Paid", "Overdue"];
const PAGE_SIZES = [10, 20, 50];

/* ---- helpers ------------------------------------------------------- */

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
  if (value === null || value === undefined) return "—";
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

/* ---- small presentational pieces ----------------------------------- */

function Avatar({ companyName, logoUrl }: { companyName: string | null; logoUrl: string | null }) {
  return (
    <span className="inv-avatar">
      {logoUrl ? <img src={logoUrl} alt={companyName ?? "Customer"} /> : initials(companyName)}
    </span>
  );
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

/* ---- main page ----------------------------------------------------- */

export default function AdminInvoiceManagePage() {
  const navigate = useNavigate();

  const [data, setData] = useState<Paged<InvoiceListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [finance, setFinance] = useState<Finance | null>(null);
  const [companies, setCompanies] = useState<string[]>([]);

  // Payments awaiting admin verification (verify => invoice becomes Fully Paid).
  const [pendingPayments, setPendingPayments] = useState<{
    id: string; paymentReference: string; method: string; amount: number;
    paymentDateUtc: string; status: string; createdAtUtc: string;
    invoiceId: string; invoiceNumber: string; companyName: string;
  }[] | null>(null);

  // Payment-proof review modal state.
  const [proofPayment, setProofPayment] = useState<NonNullable<typeof pendingPayments>[number] | null>(null);
  const [proofPreview, setProofPreview] = useState<{ url: string; contentType: string; name: string } | null>(null);
  const [proofLoading, setProofLoading] = useState(false);

  // Client-side refinements on top of the server results
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [customerFilter, setCustomerFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Selection (client-side only)
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Row action menu
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = useCallback(() => {
    adminApi.invoices(page, pageSize, status, search).then(setData).catch((e: Error) => setError(e.message));
  }, [page, pageSize, status, search]);
  useEffect(load, [load]);

  useEffect(() => {
    adminApi.financialDashboard().then(setFinance).catch(() => {});
    adminApi.pendingPayments().then(setPendingPayments).catch(() => {});
    adminApi.companies()
      .then((list) => setCompanies(list.map((c) => c.name).filter(Boolean)))
      .catch(() => {});
  }, []);

  // Realtime: when a payment is verified (e.g. from another tab), refresh the
  // pending list and KPIs without a manual reload.
  useEffect(() => {
    void connectRealtime();
    const conn = getRealtimeConnection();
    const handler = () => {
      adminApi.pendingPayments().then(setPendingPayments).catch(() => {});
      adminApi.financialDashboard().then(setFinance).catch(() => {});
      load();
    };
    conn.on("paymentVerified", handler);
    return () => { conn.off("paymentVerified", handler); };
  }, [load]);

  async function handleVerifyPayment(paymentId: string) {
    try {
      await adminApi.verifyPayment(paymentId);
      setPendingPayments((prev) => prev?.filter((p) => p.id !== paymentId) ?? prev);
      await load();
      adminApi.financialDashboard().then(setFinance).catch(() => {});
    } catch {
      /* surface via the row refresh */
    }
  }

  async function handleRejectPayment(paymentId: string) {
    const reason = window.prompt("Reason for rejecting this payment?");
    if (!reason) return;
    try {
      await adminApi.rejectPayment(paymentId, reason);
      setPendingPayments((prev) => prev?.filter((p) => p.id !== paymentId) ?? prev);
      await load();
      adminApi.financialDashboard().then(setFinance).catch(() => {});
    } catch {
      /* ignore */
    }
  }

  async function handleViewProof(p: NonNullable<typeof pendingPayments>[number]) {
    setProofPayment(p);
    setProofPreview(null);
    setProofLoading(true);
    try {
      const preview = await adminApi.paymentProofPreview(p.id);
      setProofPreview(preview);
    } catch {
      setProofPreview(null);
    } finally {
      setProofLoading(false);
    }
  }

  const closeProof = () => {
    if (proofPreview) URL.revokeObjectURL(proofPreview.url);
    setProofPayment(null);
    setProofPreview(null);
  };

  useEffect(() => { setPage(1); }, [status, search, pageSize]);

  // Close the row menu on outside click
  useEffect(() => {
    if (!openMenu) return;
    const onDown = () => setOpenMenu(null);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

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

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
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

  const cancelInvoice = async (inv: InvoiceListItem) => {
    if (!window.confirm(`Cancel invoice ${inv.invoiceNumber}? This cannot be undone.`)) return;
    try {
      await adminApi.cancelInvoice(inv.id, "Cancelled from invoice management");
      setOpenMenu(null);
      load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not cancel invoice");
    }
  };

  const approveInvoice = async (inv: InvoiceListItem) => {
    try {
      await adminApi.approveInvoice(inv.id);
      setOpenMenu(null);
      load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not approve invoice");
    }
  };

  // Client-side exports of the currently visible rows
  const exportCsv = () => {
    if (visible.length === 0) return;
    const header = ["Invoice No", "Order No", "Customer", "Invoice Date", "Due Date", "Amount", "Paid", "Balance", "Status", "Payment Status"];
    const rows = visible.map((i) => [
      i.invoiceNumber, i.orderNumber ?? "", i.companyName ?? "",
      formatDate(i.issueDateUtc), formatDate(i.dueDateUtc),
      money(i.total, i.currency), money(i.amountPaid, i.currency), money(i.balanceDue, i.currency),
      i.status, paymentStatusOf(i),
    ]);
    const esc = (s: string) => `"${String(s).replaceAll('"', '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    if (visible.length === 0) return;
    const body = visible
      .map((i) => `<tr>
        <td>${i.invoiceNumber}</td><td>${i.orderNumber ?? ""}</td><td>${i.companyName ?? ""}</td>
        <td>${formatDate(i.issueDateUtc)}</td><td>${formatDate(i.dueDateUtc)}</td>
        <td>${money(i.total, i.currency)}</td><td>${money(i.amountPaid, i.currency)}</td><td>${money(i.balanceDue, i.currency)}</td>
        <td>${i.status}</td><td>${paymentStatusOf(i)}</td></tr>`)
      .join("");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Invoices</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#0f172a}
      h1{font-size:20px;margin:0 0 4px}h2{font-size:12px;font-weight:400;color:#64748b;margin:0 0 20px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left}th{background:#f1f5f9;font-weight:700}</style></head>
      <body><h1>Invoice Management</h1><h2>Generated on ${new Date().toLocaleString()}</h2>
      <table><thead><tr><th>Invoice No</th><th>Order No</th><th>Customer</th><th>Invoice Date</th><th>Due Date</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th><th>Payment</th></tr></thead>
      <tbody>${body}</tbody></table><script>window.print()</script></body></html>`);
    w.document.close();
  };

  const clearFilters = () => {
    setSearchInput(""); setSearch(""); setStatus("All");
    setPaymentStatus("All"); setCustomerFilter("All"); setDateFrom(""); setDateTo("");
  };

  const hasActiveFilter = search !== "" || status !== "All" || paymentStatus !== "All" || customerFilter !== "All" || dateFrom || dateTo;

  const renderRow = (inv: InvoiceListItem) => {
    const overdue = isOverdue(inv);
    const payStatus = paymentStatusOf(inv);
    return (
      <tr
        key={inv.id}
        className={selected.has(inv.id) ? "inv-row--selected" : undefined}
        onClick={() => openInvoice(inv)}
      >
        <td onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="inv-check"
            checked={selected.has(inv.id)}
            onChange={() => toggleRow(inv.id)}
            aria-label="Select invoice"
          />
        </td>
        <td>
          <div className="inv-customer">
            <Avatar companyName={inv.companyName} logoUrl={inv.companyLogoUrl} />
            <div>
              <div className="inv-customer__name" title={inv.companyName ?? undefined}>{inv.companyName ?? "—"}</div>
              <div className="inv-customer__contact" title={inv.companyEmail ?? inv.companyPhone ?? undefined}>
                {inv.companyEmail ?? inv.companyPhone ?? "—"}
              </div>
            </div>
          </div>
        </td>
        <td>
          <span className="inv-link" role="link" tabIndex={0}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); openInvoice(inv); } }}
          >
            {inv.orderNumber ?? "—"}
          </span>
          <div className="inv-sub">{inv.invoiceNumber}</div>
        </td>
        <td>
          <div className="inv-date">{formatDate(inv.issueDateUtc)}</div>
          <div className="inv-time">{formatTime(inv.issueDateUtc)}</div>
        </td>
        <td>
          <div className="inv-date">{formatDate(inv.dueDateUtc)}</div>
          {overdue && <InlineOverdue />}
        </td>
        <td>
          <div className="inv-amount">
            <span className="inv-amount__total">{money(inv.total, inv.currency)}</span>
            <span className="inv-amount__paid">Paid {money(inv.amountPaid, inv.currency)}</span>
            <span className="inv-amount__balance">Balance {money(inv.balanceDue, inv.currency)}</span>
          </div>
        </td>
        <td><InvoiceBadge status={inv.status} /></td>
        <td><PaymentBadge status={payStatus} /></td>
        <td>
          <div className="inv-actions" onClick={(e) => e.stopPropagation()}>
            <button className="inv-icon-btn" title="View" aria-label="View"
              onClick={() => openInvoice(inv)}><Eye size={16} /></button>
            <div className="inv-menu-wrap" onMouseDown={(e) => e.stopPropagation()}>
              <button className="inv-icon-btn" title="More" aria-label="More actions"
                aria-expanded={openMenu === inv.id}
                onClick={() => setOpenMenu((m) => (m === inv.id ? null : inv.id))}>
                <MoreVertical size={16} />
              </button>
              {openMenu === inv.id && (
                <div className="inv-menu">
                  <button className="inv-menu__item" onClick={() => { setOpenMenu(null); downloadPdf(inv); }}>
                    <Download size={15} /> Download PDF
                  </button>
                  <button className="inv-menu__item" onClick={() => { setOpenMenu(null); openInvoice(inv); }}>
                    <Eye size={15} /> View Order
                  </button>
                  <button className="inv-menu__item" onClick={() => { setOpenMenu(null); void approveInvoice(inv); }}>
                    <BadgeCheck size={15} /> Approve Invoice
                  </button>
                  <div className="inv-menu__divider" />
                  <button className="inv-menu__item inv-menu__item--danger"
                    onClick={() => { setOpenMenu(null); void cancelInvoice(inv); }}>
                    <X size={15} /> Cancel Invoice
                  </button>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  const renderCard = (inv: InvoiceListItem) => {
    const overdue = isOverdue(inv);
    return (
      <div key={inv.id} className="inv-card" onClick={() => openInvoice(inv)}>
        <div className="inv-card__top">
          <div className="inv-card__customer">
            <Avatar companyName={inv.companyName} logoUrl={inv.companyLogoUrl} />
            <div>
              <div className="inv-customer__name">{inv.companyName ?? "—"}</div>
              <div className="inv-sub">{inv.invoiceNumber}</div>
              <div className="inv-customer__contact">{inv.companyEmail ?? inv.companyPhone ?? "—"}</div>
            </div>
          </div>
          <InvoiceBadge status={inv.status} />
        </div>
        <div className="inv-card__body">
          <div className="inv-card__cell">
            <span className="inv-card__label">Order</span>
            <span className="inv-card__value inv-link">{inv.orderNumber ?? "—"}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Amount</span>
            <span className="inv-card__value">{money(inv.total, inv.currency)}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Invoice Date</span>
            <span className="inv-card__value">{formatDate(inv.issueDateUtc)}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Due Date</span>
            <span className="inv-card__value">{formatDate(inv.dueDateUtc)} {overdue && "⚠"}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Paid</span>
            <span className="inv-card__value" style={{ color: "var(--color-success)" }}>{money(inv.amountPaid, inv.currency)}</span>
          </div>
          <div className="inv-card__cell">
            <span className="inv-card__label">Balance</span>
            <span className="inv-card__value">{money(inv.balanceDue, inv.currency)}</span>
          </div>
        </div>
        <div className="inv-card__footer">
          <PaymentBadge status={paymentStatusOf(inv)} />
          <button className="inv-icon-btn" title="Download PDF" onClick={(e) => { e.stopPropagation(); downloadPdf(inv); }}>
            <Download size={16} />
          </button>
        </div>
      </div>
    );
  };

  /* ---- KPI cards (mapped to real dashboard data) ---- */
  const kpis = [
    {
      label: "Outstanding", value: money(finance?.outstandingAmount), hint: "Unpaid balance across open invoices",
      icon: Wallet, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", glow: "rgba(59,130,246,0.25)",
    },
    {
      label: "Collected", value: money(finance?.collectedAmount), hint: "Total payments received to date",
      icon: Landmark, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", glow: "rgba(34,197,94,0.22)",
    },
    {
      label: "Overdue", value: `${finance?.overdueInvoices ?? 0}`,
      hint: finance?.overdueInvoices === 1 ? "Invoice past its due date" : "Invoices past their due date",
      icon: AlertTriangle, color: "var(--kpi-orange)", bg: "var(--kpi-orange-bg)", glow: "rgba(249,115,22,0.22)",
    },
    {
      label: "Total Invoices", value: `${finance?.invoicesThisMonth ?? 0}`, hint: "This Month",
      icon: Receipt, color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)", glow: "rgba(167,139,250,0.22)",
    },
    {
      label: "Revenue", value: money((finance?.outstandingAmount ?? 0) + (finance?.collectedAmount ?? 0)),
      hint: `${finance?.paymentsThisMonth ?? 0} payments this month`, delta: "+Total billed",
      icon: TrendingUp, color: "var(--kpi-teal)", bg: "var(--kpi-teal-bg)", glow: "rgba(20,184,166,0.22)",
    },
  ];

  return (
    <div className="inv-page">
      {/* Page header */}
      <div className="inv-header">
        <div>
          <h1 className="inv-header__title">Invoice Management</h1>
          <p className="inv-header__subtitle">Manage and monitor every invoice generated from customer orders.</p>
        </div>
        <div className="inv-header__actions">
          <button className="inv-btn" onClick={exportCsv} title="Export visible invoices to Excel">
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          <button className="inv-btn" onClick={exportPdf} title="Export visible invoices to PDF">
            <FileText size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="inv-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="inv-kpi" style={{ "--inv-kpi-color": k.color, "--inv-kpi-bg": k.bg, "--inv-kpi-glow": k.glow } as CSSProperties}>
            <span className="inv-kpi__icon"><k.icon size={20} /></span>
            <span className="inv-kpi__value">{k.value}</span>
            <span className="inv-kpi__label">{k.label}</span>
            {k.delta ? <span className="inv-kpi__delta">{k.delta}</span> : null}
            <span className="inv-kpi__hint">{k.hint}</span>
          </div>
        ))}
      </div>

      {/* Pending payment approvals */}
      {pendingPayments && pendingPayments.length > 0 && (
        <div className="inv-card" style={{ border: "1px solid var(--border-default)" }}>
          <div className="inv-card__top" style={{ padding: "14px 18px", alignItems: "center" }}>
            <div className="inv-card__customer">
              <div className="inv-customer__name">Pending Payment Approvals</div>
              <div className="inv-sub">Verify a payment to mark the bill Fully Paid, or reject it.</div>
            </div>
            <span className="inv-badge inv-badge--orange">{pendingPayments.length} pending</span>
          </div>
          <div className="inv-scroll">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Company</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((p) => (
                  <tr key={p.id}>
                    <td><span className="inv-link">{p.invoiceNumber}</span></td>
                    <td><span className="inv-customer__name">{p.companyName}</span></td>
                    <td>{money(p.amount)}</td>
                    <td>{p.method}</td>
                    <td>{p.paymentReference}</td>
                    <td>{formatDate(p.paymentDateUtc)}</td>
                    <td>
                      <div className="inv-actions">
                        <button className="inv-btn" style={{ height: 30, padding: "0 10px" }} onClick={() => void handleViewProof(p)}>
                          <Eye size={14} /> View Payment Proof
                        </button>
                        <button className="inv-btn" style={{ height: 30, padding: "0 10px" }} onClick={() => void handleVerifyPayment(p.id)}>
                          <BadgeCheck size={14} /> Verify → Fully Paid
                        </button>
                        <button className="inv-btn inv-btn--icon" style={{ color: "var(--color-danger)" }} title="Reject" aria-label="Reject payment" onClick={() => void handleRejectPayment(p.id)}>
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search & filter bar */}
      <div className="inv-filterbar">
        <div className="inv-field" style={{ flex: "1 1 220px" }}>
          <label className="inv-field__label">Search</label>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="inv-input"
              style={{ paddingLeft: 32 }}
              type="search"
              value={searchInput}
              placeholder="Invoice / order / company"
              aria-label="Search invoices"
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput.trim()); }}
            />
          </div>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Status</label>
          <select className="inv-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Payment Status</label>
          <select className="inv-select" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
            {PAYMENT_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Customer</label>
          <select className="inv-select" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
            <option value="All">All customers</option>
            {companies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="inv-field">
          <label className="inv-field__label"><CalendarRange size={11} style={{ verticalAlign: "-1px" }} /> Date Range</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input type="date" className="inv-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="From date" />
            <input type="date" className="inv-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="To date" />
          </div>
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
                <col style={{ width: 40 }} />
                <col style={{ width: "21%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: 90 }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ width: 40 }}><input type="checkbox" className="inv-check" checked={allSelected} onChange={toggleAll} aria-label="Select all" /></th>
                  <th>Customer</th>
                  <th>Order ID</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Invoice Status</th>
                  <th>Payment Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((inv) => renderRow(inv))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      <div className="inv-mobile">
        {visible.length === 0 && !error && !data && <Loading label="Loading invoices" />}
        {visible.length === 0 && !error && data && data.items.length === 0 && (
          <div className="inv-status">No invoices found.</div>
        )}
        {visible.map((inv) => renderCard(inv))}
      </div>

      {/* Errors / empty (desktop) */}
      {error && <EmptyState title="Invoices unavailable" text={error} />}
      {!data && !error && <div className="inv-table-wrap inv-status"><Loading label="Loading invoices" /></div>}
      {data && visible.length === 0 && !error && (
        <div className="inv-status">No invoices match the current filters.</div>
      )}

      {/* Pagination */}
      <div className="inv-pagination">
        <span className="inv-pagination__info">
          {selected.size > 0
            ? `${selected.size} selected`
            : data ? `Showing ${data.items.length} of ${data.totalCount} invoices` : ""}
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

      {/* ── Payment Proof Review Modal ─────────────────────────── */}
      {proofPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeProof} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl">
            <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between sticky top-0 bg-[var(--bg-card)]">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">Payment Proof</h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 m-0">
                  Invoice {proofPayment.invoiceNumber} · {proofPayment.companyName}
                </p>
              </div>
              <button className="inv-icon-btn" onClick={closeProof} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden min-h-[220px] flex items-center justify-center">
                {proofLoading && <span className="text-[13px] text-[var(--text-muted)]">Loading proof…</span>}
                {!proofLoading && proofPreview?.contentType.startsWith("image") && (
                  <img src={proofPreview.url} alt="Payment proof" className="max-h-[420px] w-full object-contain" />
                )}
                {!proofLoading && proofPreview?.contentType === "application/pdf" && (
                  <iframe src={proofPreview.url} title="Payment proof" className="w-full h-[420px]" />
                )}
                {!proofLoading && proofPreview === null && (
                  <span className="text-[13px] text-[var(--text-muted)]">No payment proof has been uploaded for this payment.</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ProofField label="Invoice Number" value={proofPayment.invoiceNumber} />
                <ProofField label="Customer" value={proofPayment.companyName} />
                <ProofField label="Transaction Reference" value={proofPayment.paymentReference} />
                <ProofField label="Payment Amount" value={money(proofPayment.amount)} />
                <ProofField label="Payment Date" value={formatDate(proofPayment.paymentDateUtc)} />
                <ProofField label="Method" value={proofPayment.method} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProofField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[var(--border-default)] px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
      <div className="text-[14px] font-medium text-[var(--text-primary)] mt-0.5 break-words">{value}</div>
    </div>
  );
}
