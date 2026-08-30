import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { customerApi, type QuotationDetail, type QuotationListItem, type QuotationTimelineEntry } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate, formatMoney } from "../shared";
import {
  IndianRupee, Truck, Banknote, CalendarDays, FileText, Package,
  ScrollText, MessageSquareText, CheckCircle, XCircle, Loader2, Send,
  Phone, Mail, Download, Printer, Share2, Clock, MessageSquare,
  Search, RefreshCw, ChevronRight, ArrowUpRight, ArrowLeft,
  CheckCircle2, FileCheck, ExternalLink, Check, Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { extractAdvancePercent, calculateAdvanceAmount } from "../../utils/paymentTerms";

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
                : "Submit a new Enquiry with your casting specifications to receive an official proposal."}
            </p>
          </div>
          <Link
            to="/customer/enquiries/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 no-underline"
          >
            <span>Submit New Enquiry</span>
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
                        : q.status === "Converted"
                        ? "bg-emerald-600/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/20 border border-emerald-500/30"
                        : "bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200"
                    )}
                  >
                    <span>
                      {isPending
                        ? "Review & Respond"
                        : q.status === "Converted"
                        ? "View Proposal · Order Created"
                        : q.status === "Accepted"
                        ? "View Proposal · Order in Progress"
                        : "View Proposal"}
                    </span>
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
  const [copied, setCopied] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);

  const loadData = async () => {
    try { setQuotation(await customerApi.quotation(id)); } catch { setMissing(true); }
    try { setTimeline(await customerApi.quotationTimeline(id)); } catch { }
  };

  const handlePayAdvance = async () => {
    if (!paymentRef.trim()) {
      setMessage("Please enter a valid Transaction / UTR reference number.");
      return;
    }
    setPaymentBusy(true);
    setMessage(null);
    try {
      const res = await customerApi.payQuotationAdvance(id, paymentRef.trim());
      setMessage(res.message || "Advance payment submitted successfully! Awaiting admin verification.");
      setPaymentRef("");
      await loadData();
    } catch {
      setMessage("Could not submit payment details. Please try again.");
    } finally {
      setPaymentBusy(false);
    }
  };

  useEffect(() => {
    customerApi.quotation(id).then(setQuotation).catch(() => setMissing(true));
    customerApi.quotationTimeline(id).then(setTimeline).catch(() => {});
  }, [id]);

  const copyShareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Quotation ${quotation?.quotationNumber}`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;">${idx + 1}</td>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;"><strong style="font-size:13px;color:#0f172a;">${i.partNumber}</strong><br><span style="font-size:11px;color:#64748b;">${i.description}</span></td>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#334155;font-weight:500;">${i.materialGrade || "—"}</td>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:600;">${i.quantity} ${i.unit}</td>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;font-variant-numeric:tabular-nums;">${formatItem(i.unitPrice, q.currency)}</td>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;color:#64748b;">${i.taxPercent}%</td>
      <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;color:#0f172a;">${formatItem(i.lineTotal, q.currency)}</td>
    </tr>`).join("");

    let discRow = q.discount > 0 ? `<tr><td style="padding:6px 0;color:#64748b;">Discount</td><td style="padding:6px 0;text-align:right;color:#ef4444;font-weight:600;">\u2212${formatItem(q.discount, q.currency)}</td></tr>` : "";
    let freightRow = (q.freight && q.freight !== "0" && q.freight !== "string") ? `<tr><td class="lbl">Freight / Logistics</td><td class="val">${!isNaN(Number(q.freight)) && Number(q.freight) > 0 ? formatItem(Number(q.freight), q.currency) : q.freight}</td></tr>` : "";
    let packingRow = (q.packing && q.packing !== "0" && q.packing !== "string") ? `<tr><td class="lbl">Packaging & Forwarding</td><td class="val">${!isNaN(Number(q.packing)) && Number(q.packing) > 0 ? formatItem(Number(q.packing), q.currency) : q.packing}</td></tr>` : "";

    w.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${q.quotationNumber} - Shakti Udyog</title>
<style>
  @page { margin: 15mm 15mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 32px; font-size: 12px; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
  .header-left h1 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #2563eb; margin: 0 0 2px; font-weight: 700; }
  .header-left h2 { font-size: 24px; font-weight: 800; margin: 0; color: #0f172a; letter-spacing: -0.5px; }
  .header-right { text-align: right; font-size: 11px; color: #64748b; line-height: 1.4; }
  .header-right strong { color: #0f172a; display: block; font-size: 13px; font-weight: 700; }
  .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .meta-box { background: #f8fafc; border-radius: 8px; padding: 10px 14px; border: 1px solid #e2e8f0; }
  .meta-box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin: 0 0 3px; }
  .meta-box .val { font-size: 13px; font-weight: 700; color: #0f172a; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead th { background: #f1f5f9; text-align: left; padding: 9px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-weight: 700; border-bottom: 2px solid #cbd5e1; }
  .total-table { width: 340px; margin-left: auto; margin-bottom: 24px; }
  .total-table td { padding: 5px 0; font-size: 12px; }
  .total-table .lbl { color: #64748b; }
  .total-table .val { text-align: right; font-weight: 600; color: #0f172a; }
  .grand td { padding-top: 8px; border-top: 2px solid #2563eb; font-size: 16px; font-weight: 800; color: #2563eb; }
  .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
  .terms-box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 0 0 4px; font-weight: 700; }
  .terms-box p { font-size: 11px; color: #334155; margin: 0; line-height: 1.4; }
  .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; background: #eff6ff; color: #1d4ed8; }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>Commercial Proposal</h1>
      <h2>${q.quotationNumber}</h2>
      <div style="margin-top:4px;"><span class="badge">${q.status}</span> · Revision ${q.revisionNumber}</div>
    </div>
    <div class="header-right">
      <strong>Shakti Udyog Industrial Solutions</strong>
      Industrial Area, Phase II, Ludhiana<br>
      Punjab, India · contact@shaktiudyog.com
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box"><h3>Customer</h3><div class="val">${q.companyName || "Industrial Partner"}</div></div>
    <div class="meta-box"><h3>Requirement</h3><div class="val">${q.productType || "Precision Casting"}</div></div>
    <div class="meta-box"><h3>Issue Date</h3><div class="val">${fmtDate(q.createdAtUtc)}</div></div>
    <div class="meta-box"><h3>Valid Until</h3><div class="val">${fmtDate(q.validUntilUtc)}</div></div>
  </div>

  <table>
    <thead><tr><th style="text-align:center;width:28px;">#</th><th>Item & Part Description</th><th>Grade</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">GST</th><th style="text-align:right;">Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <table class="total-table">
    <tr><td class="lbl">Subtotal (Taxable Value)</td><td class="val">${formatItem(q.subtotal, q.currency)}</td></tr>
    ${discRow}
    <tr><td class="lbl">GST Tax Component</td><td class="val">${formatItem(q.tax, q.currency)}</td></tr>
    ${freightRow}
    ${packingRow}
    <tr class="grand"><td>Grand Total</td><td class="val">${formatItem(q.total, q.currency)}</td></tr>
  </table>

  <div class="terms-grid">
    <div class="terms-box">
      <h3>Payment & Commercial Terms</h3>
      <p>${q.paymentTerms || "100% against Proforma Invoice / Dispatch"}</p>
    </div>
    <div class="terms-box">
      <h3>Delivery Terms & Lead Time</h3>
      <p>${q.deliveryTerms || "Ex-Works Factory"} ${q.deliveryTime ? `· ${q.deliveryTime}` : ""}</p>
    </div>
    <div class="terms-box">
      <h3>Quality & Warranty Standard</h3>
      <p>${q.warranty || "12 Months against manufacturing defects."}</p>
    </div>
    ${q.remarks ? `<div class="terms-box"><h3>Technical Notes</h3><p>${q.remarks.replace(/\n/g, "<br>")}</p></div>` : ""}
  </div>

  <div class="footer">
    This is an authentic, computer-generated quotation issued by Shakti Udyog. For confirmation or questions, contact +91 82830 41140.
  </div>

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

  if (missing) return <EmptyState title="Quotation not found" text="The requested quotation does not exist or has been archived." />;
  if (!quotation) return <div className="py-24 flex justify-center"><Loading label="Loading quotation details..." /></div>;

  const canRespond = quotation.status === "Issued" || quotation.status === "Viewed";
  const validDays = quotation.validUntilUtc
    ? Math.max(0, Math.ceil((new Date(quotation.validUntilUtc).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const effectiveAdvancePct =
    quotation.advancePercent ?? extractAdvancePercent(quotation.paymentTerms);
  const effectiveAdvanceAmt =
    quotation.advanceAmount ?? calculateAdvanceAmount(quotation.total, quotation.paymentTerms);

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Hero Header & Breadcrumb Bar ─────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 mb-1">
            <Link to="/customer/quotations" className="hover:text-neutral-900 dark:hover:text-white transition-colors no-underline">
              Quotations
            </Link>
            <span>/</span>
            <span className="text-[var(--color-primary)] font-bold font-mono">{quotation.quotationNumber}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
              {quotation.quotationNumber}
            </h1>
            <StatusBadge status={quotation.status} hasPayment={!!quotation.advancePaymentRef} orderId={quotation.orderId} />
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
              Revision #{quotation.revisionNumber}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 m-0">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{quotation.productType || "Commercial Quote"}</span>
            {quotation.companyName ? ` for ${quotation.companyName}` : ""} · Issued {formatDate(quotation.createdAtUtc)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={printQuotationDoc}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Download Official PDF"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            onClick={printQuotationDoc}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer"
            title="Print Quotation"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={copyShareLink}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer"
            title="Copy Share Link"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
            <span>{copied ? "Link Copied" : "Share"}</span>
          </button>
          <Link
            to="/customer/quotations"
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs no-underline"
          >
            <ArrowLeft size={13} />
            <span>All Quotes</span>
          </Link>
        </div>
      </div>

      {/* ── Status Toast / Banner ──────────────────────────── */}
      {message && (
        <div className={`rounded-2xl p-4 text-xs font-bold flex items-center gap-3 shadow-xs ${message.includes("Could not") ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"}`}>
          {message.includes("Could not") ? <XCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
          <span>{message}</span>
        </div>
      )}

      {/* ── 2. High-Impact Customer Response Decision Strip ── */}
      {canRespond && (
        <div className="relative overflow-hidden rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white dark:from-[#0b1326] dark:via-[#0e172a] dark:to-[#0f121a] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-400/15 dark:bg-blue-500/10 blur-2xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/25">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10.5px] font-extrabold uppercase tracking-wide bg-blue-600 text-white dark:bg-blue-500/20 dark:text-blue-300 dark:border dark:border-blue-500/30 shadow-xs">
                    Action Required
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
                    Review & Confirm Quotation Terms
                  </h2>
                </div>
                <p className="text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-300 mt-1 m-0">
                  Accept this commercial proposal to immediately trigger production order scheduling, or submit counter-terms.
                </p>
              </div>
            </div>

            {!responding && (
              <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center flex-wrap sm:flex-nowrap pl-15 lg:pl-0">
                <button
                  type="button"
                  onClick={() => setResponding("accept")}
                  className="inline-flex items-center gap-1.5 px-4.5 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/35 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap active:translate-y-0"
                >
                  <CheckCircle2 size={15} />
                  <span>Accept Quote & Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResponding("negotiate")}
                  className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                >
                  <MessageSquare size={14} />
                  <span>Request Revision</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResponding("decline")}
                  className="inline-flex items-center gap-1 px-3.5 h-10 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 text-neutral-600 dark:text-neutral-400 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                >
                  <XCircle size={14} />
                  <span>Decline</span>
                </button>
              </div>
            )}
          </div>

          {/* Interactive Response Form Drawer */}
          {responding && (
            <div className="pt-4 border-t border-neutral-200/80 dark:border-white/10 space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${responding === "accept" ? "bg-emerald-500" : responding === "negotiate" ? "bg-amber-500" : "bg-red-500"}`} />
                  {responding === "accept" ? "Confirm Quotation Acceptance" : responding === "negotiate" ? "Submit Revision / Counter-Offer Notes" : "Decline Quotation Proposal"}
                </div>
                <button
                  type="button"
                  onClick={() => { setResponding(null); setComment(""); }}
                  className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-white font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mb-1.5">
                  {responding === "negotiate" ? "Proposed Modifications / Price Terms *" : "Optional Comments / PO Reference"}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={responding === "negotiate" ? "Describe your requested changes to part quantities, target pricing, or delivery schedules..." : "Add any specific instructions, Purchase Order #, or delivery notes..."}
                  className="w-full text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-900 dark:text-white p-3 outline-none focus:border-blue-500 shadow-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void respond()}
                  className={`inline-flex items-center gap-2 px-5 h-10 rounded-xl text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
                    responding === "accept"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : responding === "negotiate"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
                  <span>{busy ? "Processing..." : responding === "accept" ? "Confirm & Place Order" : responding === "negotiate" ? "Send Revision Request" : "Confirm Decline"}</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => { setResponding(null); setComment(""); }}
                  className="px-4 h-10 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Customer Advance Payment Submission */}
      {quotation.status === "Accepted" && !quotation.orderId && !quotation.advancePaymentRef && (
        <div className="relative overflow-hidden rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white dark:from-[#0b1326] dark:via-[#0e172a] dark:to-[#0f121a] p-5 sm:p-6 shadow-sm space-y-5">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-400/15 dark:bg-blue-500/10 blur-2xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-200/80 dark:border-blue-500/20">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/25">
                <Banknote size={22} className="stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10.5px] font-extrabold uppercase tracking-wide bg-blue-600 text-white dark:bg-blue-500/20 dark:text-blue-300 dark:border dark:border-blue-500/30 shadow-xs">
                    Step 2 of 2 · Action Required
                  </span>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300/80">Quote Accepted</span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
                  {effectiveAdvancePct === 100
                    ? "Complete 100% Full Payment to Initiate Production"
                    : effectiveAdvancePct === 0
                    ? "Confirm Order Initiation Under Approved Credit Terms"
                    : `Complete ${effectiveAdvancePct}% Advance Payment to Initiate Production`}
                </h2>
              </div>
            </div>
            <div className="text-left sm:text-right bg-white dark:bg-black/40 p-3 sm:px-4 sm:py-2.5 rounded-xl border border-blue-200 dark:border-blue-500/30 shadow-xs shrink-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {effectiveAdvancePct === 100
                  ? "Payable Total (100%)"
                  : effectiveAdvancePct === 0
                  ? "Advance Required"
                  : `Payable Advance (${effectiveAdvancePct}%)`}
              </div>
              <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                ₹{effectiveAdvanceAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Column: Bank Account Details */}
            <div className="p-4.5 rounded-xl bg-white dark:bg-[#121824] border border-blue-100 dark:border-white/10 shadow-xs space-y-3.5">
              <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <IndianRupee size={14} />
                  </div>
                  <span>Company Bank Transfer Details</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                  Verified Account
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-white/[0.03]">
                  <span className="text-[10.5px] font-medium text-neutral-400 block">Beneficiary Name</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">Shakti Udyog</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-white/[0.03]">
                  <span className="text-[10.5px] font-medium text-neutral-400 block">Bank Name</span>
                  <span className="font-bold text-neutral-900 dark:text-neutral-100">HDFC Bank Ltd</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-white/[0.03]">
                  <span className="text-[10.5px] font-medium text-neutral-400 block">Account Number</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">50200012345678</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-white/[0.03]">
                  <span className="text-[10.5px] font-medium text-neutral-400 block">IFSC Code</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">HDFC0001234</span>
                </div>
              </div>
              <div className="pt-2.5 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">UPI ID / VPA:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-500/20">
                  shaktiudyog@hdfcbank
                </span>
              </div>
            </div>

            {/* Right Column: Reference Input & Submit */}
            <div className="flex flex-col justify-between p-4.5 rounded-xl bg-white dark:bg-[#121824] border border-blue-100 dark:border-white/10 shadow-xs space-y-3.5">
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white mb-1">
                  Submit Transfer Proof / UTR Reference
                </div>
                <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 m-0 mb-3 leading-relaxed">
                  {effectiveAdvancePct === 100
                    ? "Transfer the full payment amount via NEFT, RTGS, IMPS, or UPI, then enter your transaction reference / UTR number below."
                    : effectiveAdvancePct === 0
                    ? "Enter your Purchase Order reference or credit authorization note to initiate production under approved credit terms."
                    : `Transfer the ${effectiveAdvancePct}% advance (₹${effectiveAdvanceAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}) via NEFT, RTGS, IMPS, or UPI, then enter your transaction reference / UTR number below.`}
                </p>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder={effectiveAdvancePct === 0 ? "e.g. PO-2026-9871 / APPROVED" : "e.g. UTR1234567890 / IMPS894231"}
                  className="w-full text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black/40 text-neutral-900 dark:text-white px-3.5 py-2.5 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-black/60 shadow-xs font-mono font-semibold transition-all"
                />
              </div>
              <button
                type="button"
                disabled={paymentBusy || !paymentRef.trim()}
                onClick={() => void handlePayAdvance()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
              >
                {paymentBusy ? <Loader2 size={15} className="animate-spin" /> : <Send size={14} />}
                <span>
                  {paymentBusy
                    ? "Submitting Payment Proof..."
                    : effectiveAdvancePct === 100
                    ? "Submit Full Payment Details"
                    : effectiveAdvancePct === 0
                    ? "Submit PO / Authorization Reference"
                    : "Submit Advance Payment Details"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quotation Accepted & Payment Submitted — Awaiting Admin Verification */}
      {quotation.status === "Accepted" && !quotation.orderId && quotation.advancePaymentRef && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-300/80 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-[#0b1612] dark:via-[#0c1a16] dark:to-[#0f121a] p-5 sm:p-6 shadow-sm">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-2xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <CheckCircle2 size={24} className="stroke-[2.3]" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-neutral-900"></span>
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wide bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-emerald-400 animate-pulse" />
                    Payment Submitted · Verification Pending
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-black/50 text-neutral-800 dark:text-neutral-100 border border-emerald-200 dark:border-white/10 shadow-xs">
                    <span className="text-neutral-400 font-sans text-[11px] font-semibold uppercase">UTR</span> {quotation.advancePaymentRef}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-800/60 shadow-xs">
                    <span>Advance ({effectiveAdvancePct}%):</span>
                    <span className="font-mono font-extrabold">₹{effectiveAdvanceAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
                  Advance Payment Received — Admin Approval in Progress
                </h2>

                <p className="text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-300 m-0 max-w-2xl leading-relaxed">
                  Thank you! Your advance payment details (Ref: <span className="font-mono font-bold text-neutral-900 dark:text-white">{quotation.advancePaymentRef}</span>) have been recorded. Our accounts and administrative team is verifying the credited payment. Once approved by Admin, your official manufacturing order will be created and live foundry tracking will begin.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center pl-16 lg:pl-0">
              <Link
                to="/customer/orders"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 !text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/35 hover:-translate-y-0.5 no-underline active:translate-y-0 cursor-pointer"
              >
                <span className="!text-white font-bold">View All Orders</span>
                <ArrowUpRight size={15} className="!text-white stroke-[2.3]" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Generated Order Success Banner (If Converted / Order Created) */}
      {(quotation.orderId || quotation.status === "Converted") && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-300/80 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-[#0b1612] dark:via-[#0c1a16] dark:to-[#0f121a] p-5 sm:p-6 shadow-sm">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-2xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/25">
                <FileCheck size={24} className="stroke-[2.3]" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wide bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30 shadow-xs">
                    Converted to Order
                  </span>
                  {quotation.orderNumber && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-black/50 text-neutral-800 dark:text-white border border-emerald-200 dark:border-white/10 shadow-xs">
                      {quotation.orderNumber}
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
                  Official Production Job Active
                </h2>
                <p className="text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-300 m-0 max-w-2xl leading-relaxed">
                  This quotation is now converted into an active manufacturing order. You can track casting progress, pattern development, inspection milestones, dispatch ETA, and payment history in real-time.
                </p>
              </div>
            </div>
            {quotation.orderId && (
              <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center pl-16 lg:pl-0">
                <Link
                  to={`/customer/orders/${quotation.orderId}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 !text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25 hover:shadow-emerald-600/35 hover:-translate-y-0.5 no-underline active:translate-y-0 cursor-pointer"
                >
                  <span className="!text-white font-bold">Track Production Order</span>
                  <ExternalLink size={15} className="!text-white stroke-[2.3]" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. Balanced 4-Card KPI Metrics Grid ─────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Quote Total */}
        <div
          className="relative overflow-hidden p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,var(--glow),transparent)] before:pointer-events-none"
          style={{ "--glow": "rgba(16,185,129,0.18)" } as any}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500">
            <IndianRupee size={17} />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white mt-2.5 leading-tight tracking-tight tabular-nums">
            {formatMoney(quotation.total, quotation.currency)}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">Grand Total Value</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Inclusive of GST & charges</div>
        </div>

        {/* Delivery Lead Time */}
        <div
          className="relative overflow-hidden p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,var(--glow),transparent)] before:pointer-events-none"
          style={{ "--glow": "rgba(59,130,246,0.18)" } as any}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500">
            <Truck size={17} />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white mt-2.5 leading-tight tracking-tight">
            {quotation.deliveryTime || "4-6 Weeks"}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">Delivery Timeline</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{quotation.deliveryTerms || "Ex-Works Factory"}</div>
        </div>

        {/* Payment Terms */}
        <div
          className="relative overflow-hidden p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,var(--glow),transparent)] before:pointer-events-none"
          style={{ "--glow": "rgba(168,85,247,0.18)" } as any}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-500">
            <Banknote size={17} />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white mt-2.5 leading-tight tracking-tight truncate" title={quotation.paymentTerms || "Standard Terms"}>
            {quotation.paymentTerms ? quotation.paymentTerms.split("\n")[0] : "Standard Terms"}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">Payment Terms</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Milestone schedule</div>
        </div>

        {/* Validity */}
        <div
          className="relative overflow-hidden p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,var(--glow),transparent)] before:pointer-events-none"
          style={{ "--glow": "rgba(245,158,11,0.18)" } as any}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500">
            <CalendarDays size={17} />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white mt-2.5 leading-tight tracking-tight">
            {validDays !== null ? (validDays === 0 ? "Expires Today" : `${validDays} Days Left`) : "30 Days"}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">Quote Validity</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Valid until {formatDate(quotation.validUntilUtc)}
          </div>
        </div>
      </div>

      {/* ── 4. Main Content Layout (70% Left / 30% Right) ───── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ══ LEFT COLUMN (70%) ══ */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* Section 1: Itemized Commercial Table */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between bg-neutral-50/50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  <Package size={16} />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
                    Quotation Line Items ({quotation.items.length})
                  </h2>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 m-0">
                    Industrial casting specifications, material grades, unit economics, and GST.
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ minWidth: 640 }}>
                <thead>
                  <tr className="bg-neutral-50/80 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10">
                    <th className="py-3 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 w-10 text-center">#</th>
                    <th className="py-3 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Part & Description</th>
                    <th className="py-3 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Material Grade</th>
                    <th className="py-3 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-center">Qty & Unit</th>
                    <th className="py-3 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-right">GST</th>
                    <th className="py-3 px-5 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, idx) => (
                    <tr
                      key={item.lineNumber || idx}
                      className="border-b border-neutral-200/60 dark:border-white/5 hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center text-xs font-bold text-neutral-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-neutral-900 dark:text-white text-xs font-mono">
                          {item.partNumber}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {item.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {item.materialGrade || "Standard Grade"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {item.quantity} <span className="text-neutral-400 font-normal">{item.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">
                        {formatMoney(item.unitPrice, quotation.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        {item.taxPercent}%
                      </td>
                      <td className="py-3.5 px-5 text-right text-xs font-black tabular-nums text-neutral-900 dark:text-white">
                        {formatMoney(item.lineTotal, quotation.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Financial Ledger Breakdown & Commercial Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Commercial Financial Breakdown */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-200/80 dark:border-white/10">
                <IndianRupee size={16} className="text-[var(--color-primary)]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900 dark:text-white m-0">
                  Financial Breakdown
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 text-neutral-600 dark:text-neutral-400">
                  <span>Subtotal (Taxable Value)</span>
                  <span className="font-bold text-neutral-900 dark:text-white tabular-nums">
                    {formatMoney(quotation.subtotal, quotation.currency)}
                  </span>
                </div>

                {quotation.discount > 0 && (
                  <div className="flex items-center justify-between py-1 text-red-600 dark:text-red-400 font-semibold">
                    <span>Discount Applied</span>
                    <span className="tabular-nums">−{formatMoney(quotation.discount, quotation.currency)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1 text-neutral-600 dark:text-neutral-400">
                  <span>GST (Total Tax)</span>
                  <span className="font-bold text-neutral-900 dark:text-white tabular-nums">
                    {formatMoney(quotation.tax, quotation.currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 text-neutral-600 dark:text-neutral-400">
                  <span>Freight & Transportation</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {quotation.freight && quotation.freight !== "0" && quotation.freight !== "string"
                      ? !isNaN(Number(quotation.freight)) && Number(quotation.freight) > 0
                        ? formatMoney(Number(quotation.freight), quotation.currency)
                        : quotation.freight
                      : "Included"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 text-neutral-600 dark:text-neutral-400">
                  <span>Packaging & Forwarding</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {quotation.packing && quotation.packing !== "0" && quotation.packing !== "string"
                      ? !isNaN(Number(quotation.packing)) && Number(quotation.packing) > 0
                        ? formatMoney(Number(quotation.packing), quotation.currency)
                        : quotation.packing
                      : "Standard"}
                  </span>
                </div>

                <div className="pt-3 mt-2 border-t-2 border-neutral-200 dark:border-white/10 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-neutral-900 dark:text-white">Grand Total</span>
                  <span className="text-xl font-black text-[var(--color-primary)] tabular-nums">
                    {formatMoney(quotation.total, quotation.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Commercial Terms & Scope */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs p-5 space-y-3.5">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-200/80 dark:border-white/10">
                <ScrollText size={16} className="text-[var(--color-primary)]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900 dark:text-white m-0">
                  Commercial Terms
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">Payment Terms</span>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200 m-0 whitespace-pre-wrap">
                    {quotation.paymentTerms || "100% against Proforma Invoice / Dispatch"}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">Delivery & Transit</span>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200 m-0">
                    {quotation.deliveryTerms || "Ex-Works Factory"} · {quotation.deliveryTime || "4-6 Weeks from order approval"}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">Quality Assurance</span>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-200 m-0">
                    {quotation.warranty || "12 Months warranty against casting porosity & material defects."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Technical Notes / Engineer Remarks */}
          {quotation.remarks && (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquareText size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900 dark:text-white m-0 mb-1">
                    Special Engineering Notes
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap m-0">
                    {quotation.remarks}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT COLUMN (30%) — Sticky Meta Sidebar ══ */}
        <div className="w-full lg:w-[340px] shrink-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
          {/* Quick Summary Card */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs p-5 space-y-3.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 m-0">
              Proposal Metadata
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Quote ID</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-white">{quotation.quotationNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Issue Date</span>
                <span className="font-semibold text-neutral-900 dark:text-white">{formatDate(quotation.createdAtUtc)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Valid Until</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{formatDate(quotation.validUntilUtc)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Status</span>
                <StatusBadge status={quotation.status} />
              </div>
            </div>
          </div>

          {/* Quick Response Details (If already responded) */}
          {quotation.customerRespondedAtUtc && (
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs p-5 space-y-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 m-0">
                Your Feedback
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 m-0">
                Responded on <span className="font-bold">{formatDate(quotation.customerRespondedAtUtc)}</span>
              </p>
              {quotation.customerResponseComment && (
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/5 text-xs text-neutral-700 dark:text-neutral-300 italic">
                  &ldquo;{quotation.customerResponseComment}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Originating Enquiry Card */}
          <Link
            to={`/customer/enquiries/${quotation.enquiryId}`}
            className="group flex items-center justify-between p-4 rounded-2xl border border-dashed border-neutral-300 dark:border-white/15 bg-white dark:bg-[#0f121a] hover:border-[var(--color-primary)] hover:bg-neutral-50 dark:hover:bg-white/5 transition-all text-xs font-bold text-neutral-700 dark:text-neutral-300 no-underline shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <FileText size={16} className="text-[var(--color-primary)]" />
              <span>View Originating Enquiry</span>
            </div>
            <ChevronRight size={14} className="text-neutral-400 group-hover:text-[var(--color-primary)] transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Direct Support Card */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs p-5 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 m-0">
              Account Manager Support
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0">
              Have technical questions regarding mold tolerances, metallurgical grades, or delivery schedules?
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <a
                href="tel:+918283041140"
                className="flex items-center gap-2.5 p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors no-underline font-semibold"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Phone size={13} />
                </div>
                <span>+91 82830 41140</span>
              </a>

              <a
                href="mailto:contact@shaktiudyog.com"
                className="flex items-center gap-2.5 p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors no-underline font-semibold"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Mail size={13} />
                </div>
                <span>contact@shaktiudyog.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Status Timeline ──────────────────────────────── */}
      {timeline && timeline.length > 0 && (
        <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <Clock size={16} className="text-[var(--color-primary)]" />
            <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0">
              Quotation Lifecycle & Activity Timeline
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {timeline.map((entry, i) => {
              const isLast = i === timeline.length - 1;
              return (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isLast
                      ? "border-blue-500/30 bg-blue-500/[0.04]"
                      : "border-neutral-200/60 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.01]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-white">
                    <span className={`w-2 h-2 rounded-full ${isLast ? "bg-blue-500 animate-pulse" : "bg-emerald-500"}`} />
                    <span>{entry.toStatus}</span>
                  </div>
                  {entry.note && (
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                      {entry.note}
                    </div>
                  )}
                  <div className="text-[10px] text-neutral-400 mt-2 font-medium">
                    {formatDate(entry.occurredAtUtc)} · {entry.changedByRole}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function StatusBadge({ status, hasPayment, orderId }: { status: string; hasPayment?: boolean; orderId?: string | null }) {
  const config: Record<string, { bg: string; text: string; dot: string; label?: string }> = {
    Issued: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500", label: "Awaiting Action" },
    "Pending Approval": { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-700 dark:text-purple-400", dot: "bg-purple-500", label: "Pending Approval" },
    Accepted: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
      label: orderId ? "Order Active" : hasPayment ? "Payment Submitted · Awaiting Order" : "Accepted · Payment Pending",
    },
    Converted: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", label: "Converted to Order" },
    Declined: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400", dot: "bg-red-500", label: "Declined" },
    Expired: { bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400", label: "Expired" },
    Draft: { bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400", label: "Draft" },
    Approved: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", label: "Approved" },
    Viewed: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500", label: "Viewed" },
    Negotiating: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500", label: "Revision Requested" },
  };
  const c = config[status] ?? { bg: "bg-slate-50 dark:bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label || status}
    </span>
  );
}

export default QuotationListPage;

