import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { customerApi, type QuotationDetail, type QuotationListItem, type QuotationTimelineEntry } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate, formatMoney } from "../shared";
import {
  IndianRupee, Truck, Banknote, CalendarDays, FileText, Package,
  ScrollText, MessageSquareText, CheckCircle, XCircle, Loader2, Send,
  Phone, Mail, Download, Printer, Share2, Clock, MessageSquare,
} from "lucide-react";

export function QuotationListPage() {
  const [quotations, setQuotations] = useState<QuotationListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerApi.quotations().then(setQuotations).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <h1>Quotations</h1>
      {error && <EmptyState title="Quotations unavailable" text={error} />}
      {!quotations && !error && <Loading label="Loading quotations" />}
      {quotations && quotations.length === 0 && <EmptyState title="No quotations yet" />}
      {quotations && quotations.length > 0 && (
        <div className="list-rows">
          {quotations.map((q) => (
            <Link key={q.id} to={`/customer/quotations/${q.id}`} className="row-link">
              <div className="list-row">
                <div className="list-row__main">
                  <div className="list-row__title">{q.quotationNumber} — {q.productType}</div>
                  <div className="list-row__meta">
                    {formatMoney(q.total, q.currency)} · issued {formatDate(q.createdAtUtc)}
                    {q.validUntilUtc && ` · valid until ${formatDate(q.validUntilUtc)}`}
                  </div>
                </div>
                <StatusBadge status={q.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
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

  if (missing) return <EmptyState title="Quotation not found" />;
  if (!quotation) return <Loading label="Loading quotation" />;

  const canRespond = quotation.status === "Issued" || quotation.status === "Viewed";
  const validDays = quotation.validUntilUtc
    ? Math.max(0, Math.ceil((new Date(quotation.validUntilUtc).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="space-y-6 pb-8">

      {/* ── Breadcrumb ── */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li><Link to="/customer/dashboard" style={{ color: "var(--color-primary)" }}>Home</Link></li>
          <li><Link to="/customer/quotations" style={{ color: "var(--color-primary)" }}>Quotations</Link></li>
          <li aria-current="page">{quotation.quotationNumber}</li>
        </ol>
      </nav>

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
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Quotation Value</span>
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

          {/* Section 1: Quotation Overview */}
          <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-2.5 bg-[var(--bg-surface)]/50">
              <FileText size={15} className="text-[var(--color-primary)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)] m-0">Quotation Overview</h2>
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

          {/* Section 3: Quotation Items */}
          {quotation.items.length > 0 && (
            <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-2.5 bg-[var(--bg-surface)]/50">
                <Package size={15} className="text-[var(--color-primary)]" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)] m-0">Quotation Items ({quotation.items.length})</h2>
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
                <SidebarField label="Quotation Value" value={formatMoney(quotation.total, quotation.currency)} />
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
                      <CheckCircle size={16} /> Accept Quotation
                    </button>
                    <button type="button" onClick={() => setResponding("negotiate")}
                      className="w-full flex items-center justify-center gap-2 h-11 rounded-[12px] border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[13px] font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all duration-200">
                      <MessageSquare size={16} /> Request Revision
                    </button>
                    <button type="button" onClick={() => setResponding("decline")}
                      className="w-full flex items-center justify-center gap-2 h-11 rounded-[12px] border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-[13px] font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200">
                      <XCircle size={16} /> Reject Quotation
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
              <button type="button"
                className="w-full flex items-center justify-center gap-2 h-10 rounded-[10px] bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] transition-all duration-200">
                <Download size={14} /> Download PDF
              </button>
              <button type="button"
                className="w-full flex items-center justify-center gap-2 h-9 rounded-[10px] border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200">
                <Printer size={14} /> Print Quotation
              </button>
              <button type="button"
                className="w-full flex items-center justify-center gap-2 h-9 rounded-[10px] border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200">
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>

          {/* Originating RFQ */}
          <Link to={`/customer/rfqs/${quotation.rfqId}`}
            className="flex items-center justify-center gap-2 h-11 rounded-[16px] border border-dashed border-[var(--border-default)] text-[13px] font-medium text-[var(--color-primary)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--color-primary)]/30 transition-all no-underline hover:no-underline">
            <FileText size={15} /> View Originating RFQ
          </Link>
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
