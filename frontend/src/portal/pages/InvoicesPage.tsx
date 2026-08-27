import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { apiDownload } from "../../api/client";
import { customerApi, type InvoiceDetail, type InvoiceListItem } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate, formatMoney } from "../shared";
import {
  Receipt,
  Search,
  RefreshCw,
  ChevronRight,
  Clock,
  AlertTriangle,
  Download,
  IndianRupee,
  UploadCloud,
  ArrowLeft,
  Loader2,
  Send,
  X,
  CreditCard,
} from "lucide-react";
import { cn } from "../../lib/utils";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    Paid: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
    "Partially Paid": { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
    Issued: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
    Overdue: { bg: "bg-rose-500/10 border-rose-500/20", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
    Cancelled: { bg: "bg-neutral-500/10 border-neutral-500/20", text: "text-neutral-600 dark:text-neutral-400", dot: "bg-neutral-400" },
    Draft: { bg: "bg-neutral-500/10 border-neutral-500/20", text: "text-neutral-600 dark:text-neutral-400", dot: "bg-neutral-400" },
  };
  const c = config[status] ?? { bg: "bg-neutral-500/10 border-neutral-500/20", text: "text-neutral-600 dark:text-neutral-400", dot: "bg-neutral-400" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border", c.bg, c.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />
      <span>{status}</span>
    </span>
  );
}

/* ========================================================================= */
/*  1. INVOICE LIST PAGE (ADMIN ERP STYLED)                                  */
/* ========================================================================= */

export function InvoiceListPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadInvoices = () => {
    setLoading(true);
    setError(null);
    customerApi
      .invoices()
      .then(setInvoices)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = (invoices || []).filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (inv.orderNumber && inv.orderNumber.toLowerCase().includes(search.toLowerCase())) ||
      (inv.companyName && inv.companyName.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "All") return true;
    if (statusFilter === "Unpaid") return ["Issued", "Partially Paid", "Overdue"].includes(inv.status);
    if (statusFilter === "Paid") return inv.status === "Paid";
    if (statusFilter === "Overdue") return inv.status === "Overdue";
    return inv.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const totalInvoices = invoices?.length || 0;
  const unpaidInvoices = (invoices || []).filter((inv) => ["Issued", "Partially Paid", "Overdue"].includes(inv.status)).length;
  const overdueInvoices = (invoices || []).filter((inv) => inv.status === "Overdue").length;
  const totalBalanceDue = (invoices || []).reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. HERO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Receipt size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white m-0">
              Invoices & Billing Statement
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 m-0">
            View tax invoices, payment milestones, GST receipts, and upload NEFT/RTGS transaction proofs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={loadInvoices}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 shadow-xs cursor-pointer transition-all"
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin text-blue-600")} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRIC CARDS (ADMIN ERP DESIGN SYSTEM GRADIENTS) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Invoices */}
        <div className="p-4 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <Receipt size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">Total Invoices</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {totalInvoices}
            </div>
          </div>
        </div>

        {/* Unpaid / Pending */}
        <div className="p-4 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">Pending Invoices</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {unpaidInvoices}
            </div>
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="p-4 rounded-2xl border border-rose-500/20 dark:border-rose-500/30 bg-gradient-to-br from-rose-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600/80 dark:text-rose-400/80">Overdue</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {overdueInvoices}
            </div>
          </div>
        </div>

        {/* Total Outstanding Balance */}
        <div className="p-4 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <IndianRupee size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">Outstanding Balance</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {formatMoney(totalBalanceDue, "INR")}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR: SEARCH & STATUS FILTER TABS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "All", label: "All Invoices", count: totalInvoices },
            { id: "Unpaid", label: "Unpaid / Pending", count: unpaidInvoices },
            { id: "Paid", label: "Paid", count: totalInvoices - unpaidInvoices },
            { id: "Overdue", label: "Overdue", count: overdueInvoices },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border",
                statusFilter === tab.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white dark:bg-[#121520] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                  statusFilter === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-neutral-100 dark:bg-white/10 text-neutral-500"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice # or order..."
            className="w-full h-9 pl-9 pr-3.5 rounded-xl bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 4. LISTING / CARDS */}
      {error && <EmptyState title="Invoices unavailable" text={error} />}

      {loading && !error && (
        <div className="py-12 flex justify-center">
          <Loading label="Fetching tax invoices and billing history..." />
        </div>
      )}

      {!loading && !error && filteredInvoices.length === 0 && (
        <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
            <Receipt size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {search || statusFilter !== "All" ? "No matching invoices found" : "No invoices generated yet"}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Tax invoices and milestone advance requests generated for your confirmed manufacturing orders will appear here.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && filteredInvoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.map((inv) => {
            const isUnpaid = ["Issued", "Partially Paid", "Overdue"].includes(inv.status);
            return (
              <div
                key={inv.id}
                className="group relative rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] hover:border-blue-500/40 p-5 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Row: Invoice Number + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold font-mono text-neutral-900 dark:text-white px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                      {inv.invoiceNumber}
                    </span>
                    <StatusBadge status={inv.status} />
                  </div>

                  {/* Order Reference */}
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {inv.orderNumber ? `Order #${inv.orderNumber}` : "General Procurement Invoice"}
                    </h3>
                    <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2">
                      <span>Issued: {formatDate(inv.issueDateUtc)}</span>
                      {inv.dueDateUtc && <span>• Due: {formatDate(inv.dueDateUtc)}</span>}
                    </div>
                  </div>

                  {/* Financial Breakdown Box */}
                  <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Balance Due</span>
                      <span className={cn("text-base font-extrabold", inv.balanceDue > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
                        {formatMoney(inv.balanceDue, inv.currency)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-neutral-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span>Paid: {formatMoney(inv.amountPaid, inv.currency)}</span>
                      <span>Total: {formatMoney(inv.total, inv.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <Link
                    to={`/customer/invoices/${inv.id}`}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all no-underline",
                      isUnpaid
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20"
                        : "bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200"
                    )}
                  >
                    <span>{isUnpaid ? "Pay / Upload Proof" : "View Statement"}</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/*  2. INVOICE DETAIL PAGE (ADMIN ERP STYLED)                                */
/* ========================================================================= */

export function InvoiceDetailPage() {
  const { id = "" } = useParams();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    customerApi.invoice(id).then(setInvoice).catch(() => setMissing(true));
  }, [id]);

  async function submitProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invoice) return;
    const data = new FormData(event.currentTarget);
    const reference = (data.get("reference") as string).trim();
    const method = data.get("method") as string;
    const amount = Number(data.get("amount"));
    const date = data.get("date") as string;
    if (!reference || !method || !amount || !date) return;

    setBusy(true);
    try {
      await customerApi.submitPaymentProof({
        invoiceId: invoice.id,
        paymentReference: reference,
        method,
        amount,
        paymentDateUtc: new Date(date).toISOString(),
        proofFile: proofFile ?? undefined,
      });
      setMessage("Payment proof submitted successfully! It is now pending verification by accounts.");
      setProofOpen(false);
      setInvoice(await customerApi.invoice(id));
    } catch {
      setMessage("Could not submit payment proof. Please try again or reach out to accounts desk.");
    } finally {
      setBusy(false);
    }
  }

  if (missing) return <EmptyState title="Invoice not found" text="The requested tax invoice could not be located." />;
  if (!invoice) return <Loading label="Loading tax invoice statement..." />;

  const canPay = ["Issued", "Partially Paid", "Overdue"].includes(invoice.status);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. HERO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/customer/invoices"
              className="p-1.5 rounded-lg bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors no-underline"
            >
              <ArrowLeft size={16} />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white m-0">
              {invoice.invoiceNumber}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 m-0">
            Issued on {formatDate(invoice.issueDateUtc)} {invoice.orderNumber ? `· Order #${invoice.orderNumber}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          {invoice.documentId && (
            <button
              type="button"
              onClick={() => void apiDownload(`/api/v1/customer/invoices/${invoice.id}/download`, `${invoice.invoiceNumber}.pdf`)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 cursor-pointer transition-all"
            >
              <Download size={13} />
              <span>Download Tax Invoice PDF</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. TWO-COLUMN SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Line Items & Financials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Box */}
          <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white m-0">Invoice Financial Summary</h3>
              <span className="text-xs font-mono font-bold text-neutral-400">Currency: {invoice.currency}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Subtotal</span>
                <span className="text-sm font-extrabold text-neutral-900 dark:text-white mt-1 block">
                  {formatMoney(invoice.subtotal, invoice.currency)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">GST Amount</span>
                <span className="text-sm font-extrabold text-neutral-900 dark:text-white mt-1 block">
                  {formatMoney(invoice.tax, invoice.currency)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Total Billed</span>
                <span className="text-sm font-extrabold text-neutral-900 dark:text-white mt-1 block">
                  {formatMoney(invoice.total, invoice.currency)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Balance Due</span>
                <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
                  {formatMoney(invoice.balanceDue, invoice.currency)}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            {invoice.items && invoice.items.length > 0 && (
              <div className="space-y-3 pt-3">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Line Items</h4>
                <div className="overflow-x-auto rounded-2xl border border-neutral-200/90 dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200/90 dark:border-white/10">
                      <tr>
                        <th className="py-2.5 px-4 font-bold text-neutral-400">Description</th>
                        <th className="py-2.5 px-3 font-bold text-neutral-400">HSN/SAC</th>
                        <th className="py-2.5 px-3 font-bold text-neutral-400 text-center">Qty</th>
                        <th className="py-2.5 px-3 font-bold text-neutral-400 text-right">Unit Price</th>
                        <th className="py-2.5 px-4 font-bold text-neutral-400 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                      {invoice.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-4 font-bold text-neutral-900 dark:text-white">{item.description}</td>
                          <td className="py-2.5 px-3 font-mono text-neutral-500">{item.hsnSacCode || "7325.99"}</td>
                          <td className="py-2.5 px-3 text-center text-neutral-700 dark:text-neutral-300">{item.quantity} {item.unit}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{formatMoney(item.unitPrice, invoice.currency)}</td>
                          <td className="py-2.5 px-4 text-right font-bold font-mono">{formatMoney(item.lineTotal, invoice.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Payments History & Upload Proof */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white m-0">Payment History</h3>
              </div>
              <span className="text-xs font-bold text-neutral-400">{invoice.payments?.length || 0} Records</span>
            </div>

            {(!invoice.payments || invoice.payments.length === 0) ? (
              <div className="text-center py-6 text-xs text-neutral-400 space-y-1">
                <CreditCard size={24} className="mx-auto text-neutral-300 dark:text-white/10" />
                <p className="m-0">No payments credited yet for this invoice.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-white/5">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        {formatMoney(p.amount, invoice.currency)}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        Ref: {p.paymentReference} • {formatDate(p.paymentDateUtc)}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}

            {canPay && !proofOpen && (
              <button
                type="button"
                onClick={() => setProofOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
              >
                <UploadCloud size={15} />
                <span>Upload Payment Proof</span>
              </button>
            )}

            {canPay && proofOpen && (
              <form onSubmit={submitProof} className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white m-0">Submit NEFT / UPI UTR</h4>
                  <button type="button" onClick={() => setProofOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase">Payment Reference / UTR *</label>
                  <input
                    name="reference"
                    required
                    minLength={3}
                    placeholder="e.g. UTR29183049102"
                    className="w-full h-8 px-3 rounded-lg bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500 uppercase">Method *</label>
                    <select
                      name="method"
                      defaultValue="Bank Transfer"
                      className="w-full h-8 px-2 rounded-lg bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                    >
                      {["Bank Transfer", "NEFT", "RTGS", "UPI"].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500 uppercase">Amount ({invoice.currency}) *</label>
                    <input
                      name="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      defaultValue={invoice.balanceDue}
                      required
                      className="w-full h-8 px-3 rounded-lg bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase">Payment Date *</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full h-8 px-3 rounded-lg bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase">Screenshot / Slip (Optional)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.png"
                    onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    className="w-full text-[11px] text-neutral-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-500/10 file:text-blue-600 dark:file:text-blue-400 hover:file:bg-blue-500/20"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>{busy ? "Submitting..." : "Submit Proof"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProofOpen(false)}
                    className="px-3 h-8 rounded-lg border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-600 dark:text-neutral-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceListPage;
