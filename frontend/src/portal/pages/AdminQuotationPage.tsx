import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { engineerApi } from "../../api/engineerApi";
import type { QuotationDetail as QD, QuotationTimelineEntry } from "../../api/customerApi";
import { formatDate, formatMoney } from "../shared";
import { ArrowLeft, FileEdit, CheckCircle, Clock, Send, Eye, XCircle, Loader2, Calendar, Tag, Package, Info, IndianRupee, Trash2 } from "lucide-react";
import { extractAdvancePercent, calculateAdvanceAmount } from "../../utils/paymentTerms";

/* ── Status colors ──────────────────────────────────────────── */

const statusColors: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400",
  "Pending Approval": "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  Approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  Issued: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  Viewed: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  Accepted: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  Declined: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  Expired: "bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400",
  Cancelled: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

function StatusBadge({ status }: { status: string }) {
  const c = statusColors[status] ?? "bg-[#F1F5F9] text-[#64748B]";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${c}`}>
      {status}
    </span>
  );
}

/* ── Workflow stages ────────────────────────────────────────── */

const WORKFLOW = [
  { key: "Draft", label: "Draft", icon: FileEdit },
  { key: "Pending Approval", label: "Pending Approval", icon: Clock },
  { key: "Approved", label: "Approved", icon: CheckCircle },
  { key: "Issued", label: "Issued", icon: Send },
  { key: "Viewed", label: "Viewed", icon: Eye },
];

const WORKFLOW_ORDER: Record<string, number> = {
  Draft: 0,
  "Pending Approval": 1,
  Approved: 2,
  Issued: 3,
  Viewed: 4,
};

/* ── Section ────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border-default)]">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color ?? "bg-[var(--bg-surface-hover)]"}`}>
        <Icon size={18} className={color ? "text-white" : "text-[var(--text-muted)]"} />
      </div>
      <div>
        <div className="text-[20px] font-bold text-[var(--text-primary)] tabular-nums">{value}</div>
        <div className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */

export default function AdminQuotationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [q, setQ] = useState<QD | null>(null);
  const [tl, setTl] = useState<QuotationTimelineEntry[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const load = () => {
    if (!id) return;
    adminApi.quotation(id).then(setQ).catch(() => setMsg("Failed to load quotation."));
    adminApi.history(id).then(setTl).catch(() => {});
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleDeleteQuotation = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await adminApi.deleteQuotation(id);
      navigate("/admin/quotations");
    } catch (err: any) {
      setMsg(err?.message ?? "Failed to delete quotation.");
      setBusy(false);
      setShowDeleteModal(false);
    }
  };

  const doAction = async (fn: () => Promise<any>) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      load();
    } catch {
      setMsg("Action failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!id) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)]">No Quotation ID provided.</p>
        <button type="button" onClick={() => navigate("/admin/quotations")} className="mt-4 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-[13px] font-medium">
          Back to Quotations
        </button>
      </div>
    );
  }

  if (!q) return <div className="flex items-center justify-center py-24"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div>;

  const currentIdx = WORKFLOW_ORDER[q.status] ?? -1;
  const isTerminal = ["Accepted", "Converted", "Declined", "Expired", "Cancelled"].includes(q.status);
  const canEdit = ["Draft", "Pending Approval", "Approved", "Negotiating"].includes(q.status);

  return (
    <div className="space-y-6 pb-8">
      {/* ── Sticky header ──────────────────────────────────── */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-[var(--bg-body)] border-b border-[var(--border-default)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => navigate("/admin/quotations")}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all shrink-0 cursor-pointer"
            title="Back to Quotations List">
            <ArrowLeft size={15} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[var(--text-primary)] truncate">{q.quotationNumber}</h1>
              <StatusBadge status={q.status} />
            </div>
            <p className="text-[12px] text-[var(--text-muted)]">{q.productType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && (
            <button
              type="button"
              onClick={() => navigate(`/admin/quotations/new?editQuotationId=${id}`)}
              className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg border border-[var(--border-default)] text-[12px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] hover:border-orange-500/50 transition-all cursor-pointer shadow-xs"
              title="Edit quotation pricing, items, and terms"
            >
              <FileEdit size={14} className="text-orange-500" /> Edit Quote
            </button>
          )}
          {q.status === "Draft" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void doAction(() => engineerApi.submitQuotation(id))}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all cursor-pointer"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Submit for Approval
            </button>
          )}
          {q.status === "Negotiating" && (
            <button
              type="button"
              onClick={() => navigate(`/admin/quotations/new?editQuotationId=${id}`)}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-amber-500 text-white text-[12px] font-semibold hover:bg-amber-600 transition-all cursor-pointer"
            >
              <FileEdit size={14} /> Revise & Re-issue
            </button>
          )}
          {q.status === "Pending Approval" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowApproveModal(true)}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all cursor-pointer"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Approve
            </button>
          )}
          {q.status === "Approved" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void doAction(() => adminApi.issueQuotation(id))}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all cursor-pointer"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Issue to Customer
            </button>
          )}
          {q.status === "Accepted" && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setMsg(null);
                try {
                  const order: any = await adminApi.createOrder(id);
                  if (order?.id) {
                    navigate(`/admin/orders/${order.id}`);
                  } else {
                    setMsg("Order created successfully.");
                    void load();
                  }
                } catch (err: any) {
                  setMsg(err?.message ?? "Failed to create order.");
                } finally {
                  setBusy(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-emerald-600 text-white text-[12px] font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Package size={13} />}
              <span>{q.advancePaymentRef ? "Approve Payment & Create Order" : "Create Order"}</span>
            </button>
          )}
          {q.orderId && (
            <Link
              to={`/admin/orders/${q.orderId}`}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition-all no-underline hover:no-underline"
            >
              <Package size={13} /> View Order {q.orderNumber ? `· ${q.orderNumber}` : ""}
            </Link>
          )}
          {!isTerminal && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-[12px] font-medium hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-[12px] font-medium hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-50 transition-all cursor-pointer"
            title="Delete this quotation"
          >
            <Trash2 size={13} /> Delete Quote
          </button>
        </div>
      </div>

      {/* ── Status message ── */}
      {msg && (
        <div className={`px-4 py-2.5 rounded-xl text-[13px] font-medium ${msg.includes("failed") || msg.includes("Fail") ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"}`}>
          {msg}
        </div>
      )}

      {/* ── Workflow Timeline ──────────────────────────────── */}
      {!isTerminal && currentIdx >= 0 && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            {WORKFLOW.map((stage, i) => {
              const Icon = stage.icon;
              const isCompleted = i < currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={stage.key} className="flex items-center gap-0 flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isCompleted ? "bg-emerald-500 text-white" :
                      isCurrent ? "bg-[var(--color-primary)] text-white ring-2 ring-[var(--color-primary)]/30" :
                      "bg-[var(--bg-surface-hover)] text-[var(--text-muted)]"
                    }`}>
                      <Icon size={15} />
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight max-w-[80px] ${
                      isCurrent ? "text-[var(--color-primary)]" :
                      isCompleted ? "text-emerald-600 dark:text-emerald-400" :
                      "text-[var(--text-muted)]"
                    }`}>{stage.label}</span>
                  </div>
                  {i < WORKFLOW.length - 1 && (
                    <div className={`flex-1 h-px mx-1 mt-[-20px] ${i < currentIdx ? "bg-emerald-400" : "bg-[var(--border-default)]"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quotation Editability Notification Banner ── */}
      {canEdit && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border border-blue-200/80 dark:border-blue-500/20 bg-blue-50/70 dark:bg-blue-500/5 text-[12.5px] text-blue-800 dark:text-blue-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Info size={16} />
            </div>
            <div>
              <span className="font-bold">Quotation Editable:</span> You can edit line items, rates, taxes, freight/packing charges, and commercial terms anytime before issuing this quote to the customer.
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/admin/quotations/new?editQuotationId=${id}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 active:scale-98 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <FileEdit size={13} /> Edit Quotation
          </button>
        </div>
      )}

      {/* ── Quotation Accepted & Payment Verification Card (Admin) ── */}
      {q.status === "Accepted" && (
        <div className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 shadow-sm border ${
          q.advancePaymentRef
            ? "border-emerald-300/80 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-[#0b1612] dark:via-[#0c1a16] dark:to-[#0f121a]"
            : "border-amber-300/80 dark:border-amber-500/30 bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white dark:from-[#1c1509] dark:via-[#161208] dark:to-[#0f121a]"
        }`}>
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-400/10 dark:bg-emerald-500/10 blur-2xl" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                q.advancePaymentRef
                  ? "bg-gradient-to-br from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white shadow-emerald-600/25"
                  : "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-500/25"
              }`}>
                <IndianRupee size={24} className="stroke-[2.3]" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wide shadow-xs ${
                    q.advancePaymentRef
                      ? "bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30"
                      : "bg-amber-600 text-white dark:bg-amber-500/20 dark:text-amber-300 dark:border dark:border-amber-500/30"
                  }`}>
                    {q.advancePaymentRef ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-emerald-400 animate-pulse" />
                        Advance Payment Submitted
                      </>
                    ) : (
                      "Quotation Accepted · Awaiting Payment"
                    )}
                  </span>
                  {q.advancePaymentRef && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-black/50 text-neutral-800 dark:text-neutral-100 border border-emerald-200 dark:border-white/10 shadow-xs">
                      <span className="text-neutral-400 font-sans text-[11px] font-semibold uppercase">UTR</span> {q.advancePaymentRef}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs ${
                    q.advancePaymentRef
                      ? "bg-emerald-100/90 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-800/60"
                      : "bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border border-amber-300/80 dark:border-amber-800/60"
                  }`}>
                    <span>Advance ({q.advancePercent ?? extractAdvancePercent(q.paymentTerms)}%):</span>
                    <span className="font-mono font-extrabold">₹{(q.advanceAmount ?? calculateAdvanceAmount(q.total, q.paymentTerms)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
                  {q.advancePaymentRef
                    ? "Customer Advance Payment Received for Verification"
                    : "Customer Confirmed Quote — Advance Payment Being Arranged"}
                </h2>
                <p className="text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-300 m-0 max-w-2xl leading-relaxed">
                  {q.advancePaymentRef
                    ? `Customer submitted payment reference (${q.advancePaymentRef}) for quotation ${q.quotationNumber}. Please verify the credited funds in the bank account and click "Approve Payment & Create Order" to convert this proposal into an active production job order.`
                    : (q.advancePercent ?? extractAdvancePercent(q.paymentTerms)) === 0
                    ? `Customer has accepted quotation terms with approved credit terms (0% advance). You can approve and create the order directly to initiate manufacturing.`
                    : `Customer has accepted quotation terms. Once customer transfers the ${q.advancePercent ?? extractAdvancePercent(q.paymentTerms)}% advance and enters their UTR/cheque reference, you can approve and initiate manufacturing.`}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setMsg(null);
                try {
                  const order: any = await adminApi.createOrder(id);
                  if (order?.id) {
                    navigate(`/admin/orders/${order.id}`);
                  } else {
                    setMsg("Order created successfully.");
                    void load();
                  }
                } catch (err: any) {
                  setMsg(err?.message ?? "Failed to create order.");
                } finally {
                  setBusy(false);
                }
              }}
              className="inline-flex items-center gap-2 px-4.5 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
              <span>{q.advancePaymentRef ? "Approve Payment & Create Order" : "Create Order (Bypass Advance)"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard icon={Calendar} label="Issued" value={formatDate(q.createdAtUtc)} color="bg-blue-500 text-white" />
        <InfoCard icon={Tag} label="Total Value" value={formatMoney(q.total, q.currency)} color="bg-emerald-500 text-white" />
        <InfoCard icon={FileEdit} label="Line Items" value={String(q.items.length)} color="bg-violet-500 text-white" />
        <InfoCard icon={Calendar} label="Valid Until" value={formatDate(q.validUntilUtc)} color="bg-amber-500 text-white" />
      </div>

      {/* ── Two-column layout ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Line Items */}
          <Section title={`Line Items (${q.items.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="text-center py-2.5 px-3 w-[40px]">#</th>
                    <th className="text-left py-2.5 px-3 min-w-[140px]">Part / Material</th>
                    <th className="text-left py-2.5 px-3 min-w-[180px]">Description</th>
                    <th className="text-right py-2.5 px-3">Qty</th>
                    <th className="text-right py-2.5 px-3">Unit Price</th>
                    <th className="text-right py-2.5 px-3">Taxable Amt</th>
                    <th className="text-right py-2.5 px-3">GST</th>
                    <th className="text-right py-2.5 pl-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {q.items.map((i, idx) => {
                    const taxableAmt = i.quantity * i.unitPrice;
                    const gstAmt = taxableAmt * (i.taxPercent / 100);
                    return (
                      <tr key={i.lineNumber} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <td className="py-3 px-3 text-center text-[var(--text-muted)] text-[12px] tabular-nums font-medium">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[var(--text-primary)]">{i.partNumber}</div>
                          {i.materialGrade ? (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                              {i.materialGrade}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)]">{q.productType || "Standard Grade"}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-[var(--text-secondary)] font-medium leading-relaxed">{i.description}</div>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums">
                          <span className="font-bold text-[var(--text-primary)]">{i.quantity}</span>
                          <span className="ml-1 text-[11px] text-[var(--text-muted)]">{i.unit}</span>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-[var(--text-primary)] font-medium">
                          {formatMoney(i.unitPrice, q.currency)}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-[var(--text-primary)] font-semibold">
                          {formatMoney(taxableAmt, q.currency)}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums">
                          <span className="text-[12px] font-medium text-[var(--text-secondary)]">{i.taxPercent}%</span>
                          <div className="text-[10.5px] text-[var(--text-muted)]">+{formatMoney(gstAmt, q.currency)}</div>
                        </td>
                        <td className="py-3 pl-3 text-right tabular-nums font-bold text-[var(--text-primary)]">
                          {formatMoney(i.lineTotal, q.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {/* 1. Subtotal */}
                  <tr className="border-t-2 border-[var(--border-default)] bg-[var(--bg-surface)]/30">
                    <td colSpan={6} className="py-2.5 px-3 text-right text-[12.5px] font-semibold text-[var(--text-secondary)]">Subtotal (Taxable Value)</td>
                    <td colSpan={2} className="py-2.5 pl-3 text-right text-[13px] tabular-nums font-semibold text-[var(--text-primary)]">{formatMoney(q.subtotal, q.currency)}</td>
                  </tr>

                  {/* 2. Discount */}
                  {q.discount > 0 && (
                    <tr className="border-t border-[var(--border-default)]">
                      <td colSpan={6} className="py-2 px-3 text-right text-[12.5px] font-semibold text-red-600">Discount</td>
                      <td colSpan={2} className="py-2 pl-3 text-right text-[13px] tabular-nums font-semibold text-red-600">−{formatMoney(q.discount, q.currency)}</td>
                    </tr>
                  )}

                  {/* 3. GST */}
                  {q.tax > 0 && (
                    <tr className="border-t border-[var(--border-default)]">
                      <td colSpan={6} className="py-2 px-3 text-right text-[12.5px] font-semibold text-[var(--text-secondary)]">Goods & Services Tax (GST)</td>
                      <td colSpan={2} className="py-2 pl-3 text-right text-[13px] tabular-nums font-semibold text-[var(--text-primary)]">+{formatMoney(q.tax, q.currency)}</td>
                    </tr>
                  )}

                  {/* 4. Freight Charges */}
                  {Boolean(q.freight && q.freight !== "0" && q.freight !== "string") && (
                    <tr className="border-t border-[var(--border-default)]">
                      <td colSpan={6} className="py-2 px-3 text-right text-[12.5px] font-semibold text-[var(--text-secondary)]">
                        Freight / Transportation Charges
                      </td>
                      <td colSpan={2} className="py-2 pl-3 text-right text-[13px] tabular-nums font-semibold text-[var(--text-primary)]">
                        +{!isNaN(Number(q.freight)) && Number(q.freight) > 0 ? formatMoney(Number(q.freight), q.currency) : q.freight}
                      </td>
                    </tr>
                  )}

                  {/* 5. Packing & Forwarding */}
                  {Boolean(q.packing && q.packing !== "0" && q.packing !== "string") && (
                    <tr className="border-t border-[var(--border-default)]">
                      <td colSpan={6} className="py-2 px-3 text-right text-[12.5px] font-semibold text-[var(--text-secondary)]">
                        Packaging & Forwarding Charges
                      </td>
                      <td colSpan={2} className="py-2 pl-3 text-right text-[13px] tabular-nums font-semibold text-[var(--text-primary)]">
                        +{!isNaN(Number(q.packing)) && Number(q.packing) > 0 ? formatMoney(Number(q.packing), q.currency) : q.packing}
                      </td>
                    </tr>
                  )}

                  {/* 6. Grand Total */}
                  <tr className="border-t-2 border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
                    <td colSpan={6} className="py-3 px-3 text-right text-[14px] font-bold text-[var(--text-primary)]">
                      Grand Total ({q.currency})
                    </td>
                    <td colSpan={2} className="py-3 pl-3 text-right text-[16.5px] tabular-nums font-black text-[var(--color-primary)]">
                      {formatMoney(q.total, q.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Section>

          {/* Commercial & Delivery Terms */}
          <Section title="Commercial Terms & Conditions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Payment & Commercial */}
              <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]/30 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-1.5">
                  <Tag size={13} /> Commercial & Payment
                </h4>
                <div className="space-y-2.5 text-[12.5px]">
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] block">Payment Terms:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{q.paymentTerms || "30% advance with PO, 70% before dispatch"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] block">Currency:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{q.currency} (₹)</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] block">Validity:</span>
                      <span className="font-semibold text-[var(--text-primary)]">{formatDate(q.validUntilUtc)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery & Logistics */}
              <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]/30 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-1.5">
                  <Package size={13} /> Delivery & Logistics
                </h4>
                <div className="space-y-2.5 text-[12.5px]">
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] block">Delivery Terms:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{q.deliveryTerms || "Ex-Works / FOB Ludhiana"}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] block">Estimated Lead Time:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{q.deliveryTime || "3 to 4 Weeks from advance receipt"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] block">Freight:</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {q.freight && q.freight !== "0" && q.freight !== "string"
                          ? (!isNaN(Number(q.freight)) && Number(q.freight) > 0 ? formatMoney(Number(q.freight), q.currency) : q.freight)
                          : "Included"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] block">Packaging:</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {q.packing && q.packing !== "0" && q.packing !== "string"
                          ? (!isNaN(Number(q.packing)) && Number(q.packing) > 0 ? formatMoney(Number(q.packing), q.currency) : q.packing)
                          : "Standard"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Warranty & Remarks */}
            <div className="mt-4 p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]/30 space-y-2.5 text-[12.5px]">
              <div>
                <span className="text-[11px] text-[var(--text-muted)] block font-medium">Warranty & Quality Assurance:</span>
                <span className="font-semibold text-[var(--text-primary)]">{q.warranty || "12 months standard manufacturing warranty against casting and machining defects"}</span>
              </div>
              {q.remarks && (
                <div className="pt-2.5 border-t border-[var(--border-default)]">
                  <span className="text-[11px] text-[var(--text-muted)] block font-medium">Remarks / Special Notes:</span>
                  <p className="text-[var(--text-secondary)] font-normal whitespace-pre-wrap mt-0.5 leading-relaxed">{q.remarks}</p>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Status */}
          <Section title="Current Status">
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={q.status} />
            </div>
            {q.customerRespondedAtUtc && (
              <div className="text-[12px] text-[var(--text-muted)]">
                Customer responded {formatDate(q.customerRespondedAtUtc)}
                {q.customerResponseComment && <p className="mt-1 text-[var(--text-secondary)]">&ldquo;{q.customerResponseComment}&rdquo;</p>}
              </div>
            )}
          </Section>

          {/* History */}
          {tl && tl.length > 0 && (
            <Section title="History">
              <div className="space-y-0">
                {tl.map((e, i) => (
                  <div key={i} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20" />
                      {i < tl.length - 1 && <div className="flex-1 w-px bg-[var(--border-default)] mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-[13px] font-medium text-[var(--text-primary)]">{e.fromStatus} → {e.toStatus}</div>
                      {e.note && <div className="text-[12px] text-[var(--text-muted)] mt-0.5">{e.note}</div>}
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{formatDate(e.occurredAtUtc)} · {e.changedByRole}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Quick Links */}
          <Section title="Quick Links">
            <div className="space-y-2">
              <button type="button" onClick={() => navigate(`/admin/enquiries/${q.enquiryId}`)}
                className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                View Originating Enquiry →
              </button>
            </div>
          </Section>
        </div>
      </div>

            {/* ── Approve Confirmation Modal ── */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setShowApproveModal(false)} />
          <div className="relative w-full max-w-md mx-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 shrink-0 mt-1">
                  <CheckCircle size={22} />
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-[var(--text-primary)] m-0">Approve Quote</h3>
                  <p className="text-[12px] text-[var(--text-muted)] m-0 mt-2 leading-relaxed">
                    After approval, the customer will be able to <strong>Accept</strong> or <strong>Decline</strong> this quote from their portal. 
                    The quotation will be issued to the customer for their review and response.
                  </p>
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 p-3.5">
                    <p className="text-[12px] text-amber-800 dark:text-amber-300 m-0 leading-relaxed">
                      <strong>Note:</strong> Customers can accept or decline quotations after they are approved. 
                      Any changes after approval require cancelling and re-issuing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--border-default)] mb-4" />
              <div className="flex items-center justify-end gap-2.5">
                <button type="button" disabled={busy} onClick={() => setShowApproveModal(false)}
                  className="px-4 h-9 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" disabled={busy} onClick={() => { doAction(() => adminApi.approveQuotation(id)); setShowApproveModal(false); }}
                  className="px-5 h-9 rounded-xl bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  {busy ? "Approving..." : "Approve & Issue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
{/* ── Cancel Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => { setShowCancelModal(false); setCancelReason(""); }} />
          <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-400" />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 shrink-0">
                  <XCircle size={22} />
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-[var(--text-primary)] m-0">Cancel Quote</h3>
                  <p className="text-[12px] text-[var(--text-muted)] m-0 mt-0.5">This will cancel the quote for the customer.</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1.5">Reason for Cancellation</label>
                <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} placeholder="Explain why this quote is being cancelled..."
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-red-500 resize-none" />
              </div>

              <div className="border-t border-[var(--border-default)] mb-4" />
              <div className="flex items-center justify-end gap-2.5">
                <button type="button" disabled={busy} onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                  className="px-4 h-9 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50">
                  Keep
                </button>
                <button type="button" disabled={busy || !cancelReason.trim()} onClick={() => { doAction(() => adminApi.cancelQuotation(id, cancelReason.trim())); setShowCancelModal(false); setCancelReason(""); }}
                  className="px-5 h-9 rounded-xl bg-red-500 text-white text-[12px] font-semibold hover:bg-red-600 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  {busy ? "Cancelling..." : "Cancel Quote"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setShowDeleteModal(false)} />
          <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="h-1.5 bg-gradient-to-r from-rose-600 to-rose-400" />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 shrink-0">
                  <Trash2 size={22} />
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-[var(--text-primary)] m-0">Delete Quotation</h3>
                  <p className="text-[12px] text-[var(--text-muted)] m-0 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-5">
                Are you sure you want to permanently delete quotation <strong className="font-mono text-[var(--text-primary)]">{q.quotationNumber}</strong>?
              </p>
              <div className="border-t border-[var(--border-default)] mb-4" />
              <div className="flex items-center justify-end gap-2.5">
                <button type="button" disabled={busy} onClick={() => setShowDeleteModal(false)}
                  className="px-4 h-9 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50 cursor-pointer">
                  Cancel
                </button>
                <button type="button" disabled={busy} onClick={handleDeleteQuotation}
                  className="px-5 h-9 rounded-xl bg-rose-600 text-white text-[12px] font-semibold hover:bg-rose-700 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {busy ? "Deleting..." : "Delete Quotation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
