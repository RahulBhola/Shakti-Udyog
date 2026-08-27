import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { customerApi, type QuotationDetail, type QuotationListItem, type QuotationTimelineEntry } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate, formatMoney } from "../shared";
import {
  IndianRupee, Truck, Banknote, CalendarDays, FileText, Package,
  ScrollText, MessageSquareText, CheckCircle, XCircle, Loader2, Send,
  Phone, Mail, Download, Printer, Share2, Clock, MessageSquare,
  Search, RefreshCw, ChevronRight, ArrowUpRight,
} from "lucide-react";
import { cn } from "../../lib/utils";

export function QuotationListPage() {
  const [quotations, setQuotations] = useState<QuotationListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const loadQuotations = () => {
    setLoading(true);
    setError(null);
    customerApi
      .quotations()
      .then(setQuotations)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const filteredQuotations = (quotations || []).filter((q) => {
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.productType.toLowerCase().includes(search.toLowerCase()) ||
      (q.companyName && q.companyName.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === "All") return true;
    if (statusFilter === "Pending") return ["Issued", "Pending Approval", "Viewed"].includes(q.status);
    if (statusFilter === "Accepted") return ["Accepted", "Approved"].includes(q.status);
    if (statusFilter === "Negotiating") return q.status === "Negotiating";
    if (statusFilter === "Closed") return ["Declined", "Expired"].includes(q.status);
    return q.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const totalQuotes = quotations?.length || 0;
  const pendingQuotes = (quotations || []).filter((q) => ["Issued", "Pending Approval", "Viewed"].includes(q.status)).length;
  const acceptedQuotes = (quotations || []).filter((q) => ["Accepted", "Approved"].includes(q.status)).length;
  const totalValue = (quotations || []).reduce((sum, q) => sum + (q.total || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. HERO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white m-0">
              Quotations & Commercial Proposals
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 m-0">
            Review detailed price quotations, tooling costs, GST breakdowns, payment terms, and delivery lead times.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={loadQuotations}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 shadow-xs cursor-pointer transition-all"
          >
            <RefreshCw size={13} className={cn(loading && "animate-spin text-blue-600")} />
            <span>Refresh</span>
          </button>

          <Link
            to="/customer/enquiries/new"
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 no-underline cursor-pointer transition-all"
          >
            <span>Request New Quote</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI METRIC CARDS (ADMIN ERP DESIGN SYSTEM GRADIENTS) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Quotations */}
        <div className="p-4 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <FileText size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">Total Proposals</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {totalQuotes}
            </div>
          </div>
        </div>

        {/* Pending Action */}
        <div className="p-4 rounded-2xl border border-amber-500/20 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80">Awaiting Response</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {pendingQuotes}
            </div>
          </div>
        </div>

        {/* Accepted & Orders */}
        <div className="p-4 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80">Accepted / Won</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {acceptedQuotes}
            </div>
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="p-4 rounded-2xl border border-purple-500/20 dark:border-purple-500/30 bg-gradient-to-br from-purple-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <IndianRupee size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600/80 dark:text-purple-400/80">Pipeline Value</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {formatMoney(totalValue, "INR")}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR: SEARCH & STATUS FILTER TABS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "All", label: "All Proposals", count: totalQuotes },
            { id: "Pending", label: "Awaiting Action", count: pendingQuotes },
            { id: "Accepted", label: "Accepted", count: acceptedQuotes },
            { id: "Closed", label: "Declined / Expired", count: totalQuotes - pendingQuotes - acceptedQuotes },
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
            placeholder="Search by quote # or product..."
            className="w-full h-9 pl-9 pr-3.5 rounded-xl bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 4. LISTING / CARDS */}
      {error && <EmptyState title="Quotations unavailable" text={error} />}

      {loading && !error && (
        <div className="py-12 flex justify-center">
          <Loading label="Fetching commercial quotations..." />
        </div>
      )}

      {!loading && !error && filteredQuotations.length === 0 && (
        <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
            <FileText size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {search || statusFilter !== "All" ? "No matching quotations found" : "No quotations generated yet"}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {search || statusFilter !== "All"
                ? "Try clearing your search query or switching the status filter tab."
                : "Submit a new Request for Quotation (RFQ) with your casting specifications to receive an official proposal."}
            </p>
          </div>
          <Link
            to="/customer/enquiries/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 no-underline"
          >
            <span>Submit New RFQ</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      )}

      {!loading && !error && filteredQuotations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuotations.map((q) => {
            const isPending = ["Issued", "Pending Approval", "Viewed"].includes(q.status);
            return (
              <div
                key={q.id}
                className="group relative rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] hover:border-blue-500/40 p-5 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Row: Quote Number + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold font-mono text-neutral-900 dark:text-white px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                      {q.quotationNumber}
                    </span>
                    <StatusBadge status={q.status} />
                  </div>

                  {/* Product Title */}
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {q.productType}
                    </h3>
                    <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>Revision #{q.revisionNumber}</span>
                      <span>•</span>
                      <span>{q.itemCount || 1} line item{(q.itemCount || 1) > 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Value & Terms Box */}
                  <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Total Value</span>
                      <span className="text-base font-extrabold text-neutral-900 dark:text-white">
                        {formatMoney(q.total, q.currency)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-neutral-200/60 dark:border-white/5 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span>Issued: {formatDate(q.createdAtUtc)}</span>
                      {q.validUntilUtc && (
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          Valid: {formatDate(q.validUntilUtc)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <Link
                    to={`/customer/quotations/${q.id}`}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all no-underline",
                      isPending
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20"
                        : "bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200"
                    )}
                  >
                    <span>{isPending ? "Review & Respond" : "View Proposal"}</span>
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

export function QuotationDetailPage() {
  const { id = "" } = useParams();
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [timeline, setTimeline] = useState<QuotationTimelineEntry[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [responding, setResponding] = useState<"accept" | "decline" | "negotiate" | null>(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    customerApi.quotation(id).then(setQuotation).catch(() => setMissing(true));
    customerApi.quotationTimeline(id).then(setTimeline).catch(() => {});
  }, [id]);

  
  function printQuotationDoc() {
    if (!quotation) return;
    const q = quotation;
    const items = q.items || [];
    const formatItem = (n: number, curr: string) => {
      try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: curr, maximumFractionDigits: 0 }).format(n); }
      catch { return String(n); }
    };
    const fmtDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—";
    const w = window.open("", "_blank");
    if (!w) return;

    let rows = items.map((i, idx) => `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;">${idx + 1}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;"><strong style="font-size:13px;">${i.partNumber}</strong><br><span style="font-size:11px;color:#64748b;">${i.description}</span></td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#64748b;">${i.materialGrade || "—"}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;">${i.unit}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-variant-numeric:tabular-nums;">${formatItem(i.unitPrice, q.currency)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;">${i.taxPercent}%</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;font-variant-numeric:tabular-nums;">${formatItem(i.lineTotal, q.currency)}</td>
    </tr>`).join("");

    let discRow = q.discount > 0 ? `<tr><td style="padding:5px 0;color:#64748b;">Discount</td><td style="padding:5px 0;text-align:right;color:#ef4444;font-weight:500;">\u2212${formatItem(q.discount, q.currency)}</td></tr>` : "";

    w.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${q.quotationNumber}</title>
<style>
  @page { margin: 20mm 15mm; }
  body { font-family: "Inter", "Segoe UI", Arial, sans-serif; color: #1a1a2e; margin: 0; padding: 40px; font-size: 12px; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 24px; }
  .header-left h1 { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #2563eb; margin: 0 0 4px; }
  .header-left h2 { font-size: 24px; font-weight: 700; margin: 0; color: #1a1a2e; }
  .header-right { text-align: right; font-size: 11px; color: #64748b; }
  .header-right strong { color: #1a1a2e; display: block; font-size: 13px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
  .meta-box { background: #f8fafc; border-radius: 8px; padding: 14px 18px; border: 1px solid #e2e8f0; }
  .meta-box h3 { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 0 0 4px; }
  .meta-box .val { font-size: 15px; font-weight: 600; color: #1a1a2e; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
  .total-table { width: 320px; margin-left: auto; }
  .total-table td { padding: 6px 0; font-size: 12px; }
  .total-table .lbl { color: #64748b; }
  .total-table .val { text-align: right; font-weight: 600; }
  .grand td { padding-top: 10px; border-top: 2px solid #2563eb; font-size: 15px; font-weight: 700; color: #2563eb; }
  .terms { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
  .terms h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 0 0 8px; }
  .terms p { font-size: 11px; color: #64748b; margin: 0 0 4px; line-height: 1.6; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
  .badge { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 10px; font-weight: 600; background: #f0fdf4; color: #16a34a; }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>Quote</h1>
      <h2>${q.quotationNumber}</h2>
      <div style="margin-top:6px;"><span class="badge">${q.status}</span></div>
    </div>
    <div class="header-right">
      <strong>Shakti Udyog</strong>
      Industrial Area, Ludhiana<br>Punjab, India
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box"><h3>Customer</h3><div class="val">Customer Name</div></div>
    <div class="meta-box"><h3>Issue Date</h3><div class="val">${fmtDate(q.createdAtUtc)}</div></div>
    <div class="meta-box"><h3>Valid Until</h3><div class="val">${fmtDate(q.validUntilUtc)}</div></div>
    <div class="meta-box"><h3>Revision</h3><div class="val">${q.revisionNumber}</div></div>
  </div>

  <table>
    <thead><tr><th style="text-align:center;width:32px;">#</th><th>Part / Description</th><th>Grade</th><th style="text-align:center;">Qty</th><th style="text-align:center;">Unit</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">GST</th><th style="text-align:right;">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <table class="total-table">
    <tr><td class="lbl">Subtotal</td><td class="val">${formatItem(q.subtotal, q.currency)}</td></tr>
    ${discRow}
    <tr><td class="lbl">GST</td><td class="val">${formatItem(q.tax, q.currency)}</td></tr>
    <tr class="grand"><td>Grand Total</td><td class="val">${formatItem(q.total, q.currency)}</td></tr>
  </table>

  <div class="terms">
    <h3>Terms &amp; Conditions</h3>
    <p>${q.paymentTerms || "Standard payment terms apply."}</p>
    <p>Delivery: ${q.deliveryTerms || "As per mutual agreement."}</p>
    ${q.deliveryTime ? "<p>Delivery Time: " + q.deliveryTime + "</p>" : ""}
    ${q.warranty ? "<p>Warranty: " + q.warranty + "</p>" : ""}
  </div>

  ${q.remarks ? '<div class="terms"><h3>Notes</h3><p>' + q.remarks.replace(/\n/g, "<br>") + "</p></div>" : ""}

  <div class="footer">This is a computer-generated quotation. For any queries, contact Shakti Udyog.</div>

  <script>window.onload = function() { window.print(); window.close(); }<\/script>
</body>
</html>`);
    w.document.close();
  }

async function respond() {
    if (!responding || !quotation) return;
    setBusy(true);
    try {
      const result = await customerApi.respondToQuotation(quotation.id, responding, comment || undefined);
      setMessage(result.message);
      try { setQuotation(await customerApi.quotation(id)); } catch { }
      try { setTimeline(await customerApi.quotationTimeline(id)); } catch { }
      setResponding(null);
    } catch {
      setMessage("Could not record your response. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (missing) return <EmptyState title="Quote not found" />;
  if (!quotation) return <Loading label="Loading quotation" />;

  const canRespond = quotation.status === "Issued" || quotation.status === "Viewed";
  const validDays = quotation.validUntilUtc
    ? Math.max(0, Math.ceil((new Date(quotation.validUntilUtc).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Status message ── */}
      {message && (
        <div className={`rounded-xl px-4 py-3 text-[13px] font-medium flex items-center gap-2 ${message.includes("Could not") ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"}`}>
          {message.includes("Could not") ? <XCircle size={16} /> : <CheckCircle size={16} />}
          {message}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] m-0 leading-tight">
            {quotation.quotationNumber}
          </h1>
          <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)] flex-wrap">
            <span>Customer Name</span>
            <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
            <span>Issued {formatDate(quotation.createdAtUtc)}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
            <span>Rev {quotation.revisionNumber}</span>
          </div>
        </div>
        <StatusBadge status={quotation.status} />
      </div>

      {/* ── 4 KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/20 transition-all duration-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-emerald-500/10 text-emerald-500">
              <IndianRupee size={16} />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Quote Value</span>
          </div>
          <span className="text-[22px] font-bold text-[var(--text-primary)] tabular-nums">{formatMoney(quotation.total, quotation.currency)}</span>
        </div>
        <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/20 transition-all duration-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-blue-500/10 text-blue-500">
              <Truck size={16} />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Delivery Time</span>
          </div>
          <span className="text-[22px] font-bold text-[var(--text-primary)]">{quotation.deliveryTime ?? "—"}</span>
        </div>
        <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/20 transition-all duration-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-purple-500/10 text-purple-500">
              <Banknote size={16} />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Payment Terms</span>
          </div>
          <span className="text-[22px] font-bold text-[var(--text-primary)]">{quotation.paymentTerms ? quotation.paymentTerms.split("\n")[0] : "—"}</span>
        </div>
        <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/20 transition-all duration-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-amber-500/10 text-amber-500">
              <CalendarDays size={16} />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Validity</span>
          </div>
          <span className="text-[22px] font-bold text-[var(--text-primary)]">{validDays !== null ? `${validDays} Days Left` : "—"}</span>
        </div>
      </div>

      {/* ── 70/30 Layout ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ══ LEFT COLUMN (70%) ══ */}
        <div className="flex-1 min-w-0 space-y-6 w-full">

          {/* Section 1: Quote Overview */}
          <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-2.5 bg-[var(--bg-surface)]/50">
              <FileText size={15} className="text-[var(--color-primary)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)] m-0">Quote Overview</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <OverviewField label="Requirement" value={quotation.productType} />
                <OverviewField label="Material Grade" value={quotation.items[0]?.materialGrade ?? "—"} />
                <OverviewField label="Quantity" value={quotation.items.length > 0 ? `${quotation.items.reduce((s, i) => s + i.quantity, 0)} ${quotation.items[0]?.unit ?? "pcs"}` : "—"} />
                <OverviewField label="Unit Price" value={quotation.items.length > 0 ? formatMoney(quotation.items[0].unitPrice, quotation.currency) : "—"} />
                <OverviewField label="GST" value={quotation.items.length > 0 ? `${quotation.items[0].taxPercent}%` : "—"} />
                <OverviewField label="Delivery" value={quotation.deliveryTerms ?? "—"} />
                <OverviewField label="Warranty" value={quotation.warranty ?? "—"} />
                <OverviewField label="Revision" value={String(quotation.revisionNumber)} />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing Breakdown */}
          <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-2.5 bg-[var(--bg-surface)]/50">
              <IndianRupee size={15} className="text-[var(--color-primary)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)] m-0">Pricing Breakdown</h2>
            </div>
            <div className="p-5 space-y-0">
              <PricingRow label="Subtotal" value={formatMoney(quotation.subtotal, quotation.currency)} />
              {quotation.discount > 0 && <PricingRow label="Discount" value={`−${formatMoney(quotation.discount, quotation.currency)}`} valueClass="text-red-500" />}
              <PricingRow label="GST" value={formatMoney(quotation.tax, quotation.currency)} />
              <PricingRow label="Freight" value={quotation.freight && quotation.freight !== "0" ? `₹${quotation.freight}` : "₹0"} />
              <PricingRow label="Packing" value={quotation.packing && quotation.packing !== "0" ? `₹${quotation.packing}` : "₹0"} />
              <div className="border-t border-[var(--border-default)] pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Grand Total</span>
                  <span className="text-xl font-bold text-[var(--color-primary)] tabular-nums">{formatMoney(quotation.total, quotation.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Quote Items */}
          {quotation.items.length > 0 && (
            <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-2.5 bg-[var(--bg-surface)]/50">
                <Package size={15} className="text-[var(--color-primary)]" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)] m-0">Quote Items ({quotation.items.length})</h2>
              </div>
              <div className="p-5 space-y-3">
                {quotation.items.map((i, idx) => (
                  <div key={i.lineNumber}
                    className={`rounded-[12px] border border-[var(--border-default)] p-4 transition-all duration-150 hover:border-[var(--color-primary)]/30 hover:shadow-sm ${idx % 2 === 0 ? "bg-[var(--bg-surface)]/30" : "bg-transparent"}`}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">Part Name</span>
                        <span className="text-[13px] font-medium text-[var(--text-primary)]">{i.partNumber}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">Description</span>
                        <span className="text-[13px] text-[var(--text-secondary)]">{i.description}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">Material Grade</span>
                        <span className="text-[13px] text-[var(--text-primary)]">{i.materialGrade ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">Quantity</span>
                        <span className="text-[13px] font-medium text-[var(--text-primary)]">{i.quantity} {i.unit}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">Unit Price</span>
                        <span className="text-[13px] tabular-nums text-[var(--text-primary)]">{formatMoney(i.unitPrice, quotation.currency)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">GST</span>
                        <span className="text-[13px] text-[var(--text-primary)]">{i.taxPercent}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">Line Total</span>
                        <span className="text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">{formatMoney(i.lineTotal, quotation.currency)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Commercial Terms */}
          <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-2.5 bg-[var(--bg-surface)]/50">
              <ScrollText size={15} className="text-[var(--color-primary)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)] m-0">Commercial Terms</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">Payment Terms</span>
                  <span className="text-[13px] text-[var(--text-primary)] whitespace-pre-wrap">{quotation.paymentTerms ?? "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">Delivery Terms</span>
                  <span className="text-[13px] text-[var(--text-primary)]">{quotation.deliveryTerms ?? "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">Delivery Time</span>
                  <span className="text-[13px] text-[var(--text-primary)]">{quotation.deliveryTime ?? "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">Warranty</span>
                  <span className="text-[13px] text-[var(--text-primary)]">{quotation.warranty ?? "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">Validity</span>
                  <span className="text-[13px] text-[var(--text-primary)]">{validDays !== null ? `${validDays} days from issue` : "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">Freight</span>
                  <span className="text-[13px] text-[var(--text-primary)]">{quotation.freight && quotation.freight !== "0" ? `₹${quotation.freight}` : "Included"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Customer Notes */}
          {quotation.remarks && (
            <div className="rounded-[16px] border border-blue-200/60 dark:border-blue-500/20 bg-blue-50/80 dark:bg-blue-500/10 p-5">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  <MessageSquareText size={16} />
                </span>
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-primary)] m-0 mb-2">Customer Notes</h3>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap m-0">{quotation.remarks}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT COLUMN (30%) — Sticky Sidebar ══ */}
        <div className="w-full lg:w-[340px] shrink-0 space-y-5 lg:sticky lg:top-6 lg:self-start">

          {/* Status Card */}
          <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0">Status</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-center">
                <StatusBadge status={quotation.status} />
              </div>
              <div className="space-y-2.5 text-[13px]">
                <SidebarField label="Issue Date" value={formatDate(quotation.createdAtUtc)} />
                <SidebarField label="Revision" value={String(quotation.revisionNumber)} />
                <SidebarField label="Expiry Date" value={formatDate(quotation.validUntilUtc)} />
                <SidebarField label="Quote Value" value={formatMoney(quotation.total, quotation.currency)} />
              </div>
            </div>
          </div>

          {/* Response Card */}
          {(canRespond || quotation.customerRespondedAtUtc) && (
            <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border-default)]">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0">
                  {quotation.customerRespondedAtUtc ? "Your Response" : "Your Response"}
                </h3>
              </div>
              <div className="p-5 space-y-3">
                {quotation.customerRespondedAtUtc && (
                  <div className="text-[13px] text-[var(--text-secondary)]">
                    Responded on {formatDate(quotation.customerRespondedAtUtc)}
                    {quotation.customerResponseComment && (
                      <p className="mt-1 text-[12px] text-[var(--text-muted)]">&ldquo;{quotation.customerResponseComment}&rdquo;</p>
                    )}
                  </div>
                )}
                {canRespond && !responding && (
                  <div className="space-y-2.5">
                    <button type="button" onClick={() => setResponding("accept")}
                      className="w-full flex items-center justify-center gap-2 h-11 rounded-[12px] bg-emerald-500 text-white text-[13px] font-semibold hover:bg-emerald-600 transition-all duration-200 shadow-sm hover:shadow-md">
                      <CheckCircle size={16} /> Accept Quote
                    </button>
                    <button type="button" onClick={() => setResponding("negotiate")}
                      className="w-full flex items-center justify-center gap-2 h-11 rounded-[12px] border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[13px] font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all duration-200">
                      <MessageSquare size={16} /> Request Revision
                    </button>
                    <button type="button" onClick={() => setResponding("decline")}
                      className="w-full flex items-center justify-center gap-2 h-11 rounded-[12px] border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-[13px] font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200">
                      <XCircle size={16} /> Reject Quote
                    </button>
                  </div>
                )}
                {canRespond && responding && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-[var(--text-muted)] block mb-1.5">
                        {responding === "negotiate" ? "Your counter-offer / terms *" : "Comment (optional)"}
                      </label>
                      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={2000}
                        placeholder={responding === "negotiate" ? "Describe your proposed changes to pricing, terms, delivery, etc." : undefined}
                        className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] resize-none" />
                    </div>
                    <button type="button" disabled={busy} onClick={() => void respond()}
                      className="w-full flex items-center justify-center gap-2 h-11 rounded-[12px] bg-[var(--color-primary)] text-white text-[13px] font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all duration-200">
                      {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      {busy ? "Recording…" : responding === "negotiate" ? "Send Proposal" : `Confirm ${responding}`}
                    </button>
                    <button type="button" disabled={busy} onClick={() => { setResponding(null); setComment(""); }}
                      className="w-full flex items-center justify-center gap-2 h-10 rounded-[12px] border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Contact */}
          <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0">Quick Contact</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 text-[13px] text-[var(--text-secondary)]">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 shrink-0"><Phone size={14} /></span>
                <span>+91 82830 41140</span>
              </div>
              <div className="flex items-center gap-3 text-[13px] text-[var(--text-secondary)]">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 shrink-0"><Mail size={14} /></span>
                <span>iamrahulbhola@gmail.com</span>
              </div>
              <button type="button"
                className="w-full flex items-center justify-center gap-2 h-9 rounded-[10px] border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200">
                <Send size={14} /> Send Message
              </button>
            </div>
          </div>

          {/* Download */}
          <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-default)]">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0">Download</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-center py-2">
                <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  <FileText size={28} />
                </span>
              </div>
              <button type="button" onClick={printQuotationDoc}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-[10px] bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] transition-all duration-200">
                <Download size={14} /> Download PDF
              </button>
              <button type="button" onClick={printQuotationDoc}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-[10px] border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200">
                <Printer size={14} /> Print Quote
              </button>
              <button type="button" onClick={async () => { try { await navigator.share({ title: document.title, url: window.location.href }); } catch { navigator.clipboard?.writeText(window.location.href); } }}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-[10px] border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200">
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>

          {/* Originating Enquiry */}
          <Link to={`/customer/enquiries/${quotation.enquiryId}`}
            className="flex items-center justify-center gap-2 h-11 rounded-[16px] border border-dashed border-[var(--border-default)] text-[13px] font-medium text-[var(--color-primary)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--color-primary)]/30 transition-all no-underline hover:no-underline">
            <FileText size={15} /> View Originating Enquiry
          </Link>

          {/* Generated Order */}
          {quotation.orderId && (
            <Link to={`/customer/orders/${quotation.orderId}`}
              className="flex items-center justify-center gap-2 h-11 rounded-[16px] border border-dashed border-[var(--border-default)] text-[13px] font-medium text-[var(--color-primary)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--color-primary)]/30 transition-all no-underline hover:no-underline">
              <Package size={15} /> View Generated Order {quotation.orderNumber ? `· ${quotation.orderNumber}` : ""}
            </Link>
          )}
        </div>
      </div>

      {/* ── Timeline ── */}
      {timeline && timeline.length > 0 && (
        <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-2.5 bg-[var(--bg-surface)]/50">
            <Clock size={15} className="text-[var(--color-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)] m-0">Status Timeline</h2>
          </div>
          <div className="p-5">
            <div className="hidden sm:flex items-center justify-between gap-2 overflow-x-auto pb-2">
              {timeline.map((entry, i) => {
                const isLast = i === timeline.length - 1;
                return (
                  <div key={i} className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-all ${isLast ? "bg-[var(--color-primary)] text-white ring-2 ring-[var(--color-primary)]/30" : "bg-emerald-500/10 text-emerald-500"}`}>
                        <CheckCircle size={15} />
                      </div>
                      <span className={`text-[10px] font-medium text-center leading-tight ${isLast ? "text-[var(--color-primary)]" : "text-emerald-500"}`}>
                        {entry.toStatus}
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)] text-center leading-tight whitespace-nowrap">{formatDate(entry.occurredAtUtc)}</span>
                    </div>
                    {!isLast && <div className="flex-1 h-px bg-[var(--border-default)] mt-[-32px]" />}
                  </div>
                );
              })}
            </div>
            {/* Mobile timeline */}
            <div className="sm:hidden space-y-0">
              {timeline.map((entry, i) => {
                const isLast = i === timeline.length - 1;
                return (
                  <div key={i} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 ${isLast ? "bg-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30" : "bg-emerald-500/70"}`} />
                      {!isLast && <div className="flex-1 w-px bg-[var(--border-default)] mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="text-[13px] font-medium text-[var(--text-primary)]">{entry.fromStatus} → {entry.toStatus}</div>
                      {entry.note && <div className="text-[12px] text-[var(--text-muted)] mt-0.5">{entry.note}</div>}
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{formatDate(entry.occurredAtUtc)} · {entry.changedByRole}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ── Sub-components ── */

function OverviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1">{label}</span>
      <span className="text-[14px] font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function PricingRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--border-default)]/50 last:border-b-0">
      <span className="text-[13px] text-[var(--text-secondary)]">{label}</span>
      <span className={`text-[13px] font-medium tabular-nums ${valueClass ?? "text-[var(--text-primary)]"}`}>{value}</span>
    </div>
  );
}

function SidebarField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[var(--text-muted)]">{label}</span>
      <span className="text-[13px] font-medium text-[var(--text-primary)] text-right">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    Issued: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
    "Pending Approval": { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-500" },
    Accepted: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
    Declined: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
    Expired: { bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
    Draft: { bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
    Approved: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
    Viewed: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  };
  const c = config[status] ?? { bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

export default QuotationListPage;
