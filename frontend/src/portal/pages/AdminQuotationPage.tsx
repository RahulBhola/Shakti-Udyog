import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import { updaterApi } from "../../api/updaterApi";
import type { QuotationDetail as QD, QuotationTimelineEntry } from "../../api/customerApi";
import { Loading } from "../../components/ui";
import { formatDate, formatMoney } from "../shared";
import { ArrowLeft, FileEdit, CheckCircle, Clock, AlertCircle, Send, Eye, XCircle, Loader2, Calendar, FileText, Tag, Hash, Package } from "lucide-react";

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

const WORKFLOW_ORDER = Object.fromEntries(WORKFLOW.map((s, i) => [s.key, i]));

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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1.5">
      <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider block">{label}</span>
      <span className="text-[13px] text-[var(--text-primary)] font-medium break-words">{value}</span>
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

export default function AdminQuotationDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [q, setQ] = useState<QD | null>(null);
  const [tl, setTl] = useState<QuotationTimelineEntry[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);

  useEffect(() => {
    adminApi.quotation(id).then(setQ).catch(() => setMissing(true));
    adminApi.history(id).then(setTl).catch(() => {});
  }, [id]);

  async function doAction(action: () => Promise<{ message: string }>) {
    setBusy(true); setMsg(null);
    try { const r = await action(); setMsg(r.message); setQ(await adminApi.quotation(id)); setTl(await adminApi.history(id)); }
    catch { setMsg("Action failed."); }
    finally { setBusy(false); }
  }

  if (missing) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <span className="text-red-500 text-2xl">!</span>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Quote Not Found</h3>
        <p className="text-[13px] text-[var(--text-muted)] mb-6">The quotation you're looking for doesn't exist or has been removed.</p>
        <button type="button" onClick={() => navigate("/admin/quotations")}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
          <ArrowLeft size={14} /> Back to Quotes
        </button>
      </div>
    );
  }

  if (!q) return <div className="flex items-center justify-center py-24"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div>;

  const currentIdx = WORKFLOW_ORDER[q.status] ?? -1;
  const isTerminal = ["Accepted", "Converted", "Declined", "Expired", "Cancelled"].includes(q.status);

  return (
    <div className="space-y-6 pb-8">
      {/* ── Sticky header ──────────────────────────────────── */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-[var(--bg-body)] border-b border-[var(--border-default)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => navigate("/admin/quotations")}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all shrink-0">
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
          {q.status === "Draft" && (
            <>
              <button type="button" onClick={() => navigate(`/admin/quotations/new?editQuotationId=${id}`)}
                className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
                <FileEdit size={15} /> Edit
              </button>
              <button type="button" disabled={busy} onClick={() => void doAction(() => updaterApi.submitQuotation(id))}
                className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all">
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Submit
              </button>
            </>
          )}
          {q.status === "Negotiating" && (
            <button type="button" onClick={() => navigate(`/admin/quotations/new?editQuotationId=${id}`)}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-amber-500 text-white text-[12px] font-semibold hover:bg-amber-600 transition-all">
              <FileEdit size={15} /> Revise & Re-issue
            </button>
          )}
          {q.status === "Pending Approval" && (
            <button type="button" disabled={busy} onClick={() => setShowApproveModal(true)}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all">
              {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Approve
            </button>
          )}
          {q.status === "Approved" && (
            <button type="button" disabled={busy} onClick={() => void doAction(() => adminApi.issueQuotation(id))}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all">
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Issue
            </button>
          )}
          {q.status === "Accepted" && (
            <button type="button" disabled={busy} onClick={async () => { try { const order: any = await adminApi.createOrder(id); if (order?.id) navigate(`/admin/orders/${order.id}`); else setMsg("Order created."); } catch { setMsg("Failed to create order."); } }}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all">
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Package size={13} />} Create Order
            </button>
          )}
          {q.orderId && (
            <Link to={`/admin/orders/${q.orderId}`}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 transition-all no-underline hover:no-underline">
              <Package size={13} /> View Order {q.orderNumber ? `· ${q.orderNumber}` : ""}
            </Link>
          )}
          {!isTerminal && (
            <button type="button" disabled={busy} onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg border border-red-200 text-red-600 text-[12px] font-medium hover:bg-red-50 disabled:opacity-50 transition-all">
              Cancel
            </button>
          )}
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

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard icon={Calendar} label="Issued" value={formatDate(q.createdAtUtc)} color="bg-blue-500 text-white" />
        <InfoCard icon={Tag} label="Total" value={formatMoney(q.total, q.currency)} color="bg-emerald-500 text-white" />
        <InfoCard icon={FileEdit} label="Items" value={String(q.items.length)} color="bg-violet-500 text-white" />
        <InfoCard icon={Calendar} label="Valid Until" value={formatDate(q.validUntilUtc)} color="bg-amber-500 text-white" />
      </div>

      {/* ── Two-column layout ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Commercial Details */}
          <Section title="Commercial Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Subtotal" value={formatMoney(q.subtotal, q.currency)} />
              <Field label="Tax" value={formatMoney(q.tax, q.currency)} />
              <Field label="Discount" value={formatMoney(q.discount, q.currency)} />
              <Field label="Total" value={formatMoney(q.total, q.currency)} />
              <Field label="Payment Terms" value={q.paymentTerms ?? "—"} />
              <Field label="Delivery Terms" value={q.deliveryTerms ?? "—"} />
              <Field label="Freight" value={q.freight ?? "—"} />
              <Field label="Packing" value={q.packing ?? "—"} />
              <Field label="Delivery Time" value={q.deliveryTime ?? "—"} />
              <Field label="Warranty" value={q.warranty ?? "—"} />
              <Field label="Valid Until" value={formatDate(q.validUntilUtc)} />
              <Field label="Currency" value={q.currency} />
            </div>
            {q.remarks && (
              <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                <Field label="Remarks" value={q.remarks} />
              </div>
            )}
          </Section>

          {/* Line Items */}
          <Section title={`Line Items (${q.items.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-app)]">
                    <th className="text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">#</th>
                    <th className="text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Part / Material</th>
                    <th className="text-left py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Description</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Qty</th>
                    <th className="text-center py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Unit</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Unit Price</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">GST</th>
                    <th className="text-right py-2.5 pl-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {q.items.map((i, idx) => (
                    <tr key={i.lineNumber} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="py-2.5 px-3 text-[var(--text-muted)] text-[12px] tabular-nums">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-[var(--text-primary)]">{i.partNumber}</div>
                        {i.materialGrade && <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{i.materialGrade}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-secondary)] max-w-[200px] truncate" title={i.description}>{i.description}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-medium text-[var(--text-primary)]">{i.quantity}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--bg-surface-hover)] text-[11px] font-medium text-[var(--text-secondary)]">{i.unit}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-[var(--text-primary)]">{formatMoney(i.unitPrice, q.currency)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-[var(--text-secondary)]">{i.taxPercent}%</td>
                      <td className="py-2.5 pl-3 text-right tabular-nums font-semibold text-[var(--text-primary)]">{formatMoney(i.lineTotal, q.currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--border-default)]">
                    <td colSpan={6} className="py-3 px-3 text-right text-[13px] font-medium text-[var(--text-secondary)]">Subtotal</td>
                    <td colSpan={2} className="py-3 pl-3 text-right text-[13px] tabular-nums font-semibold text-[var(--text-primary)]">{formatMoney(q.subtotal, q.currency)}</td>
                  </tr>
                  {q.discount > 0 && (
                    <tr className="border-t border-[var(--border-default)]">
                      <td colSpan={6} className="py-2 px-3 text-right text-[13px] font-medium text-red-600">Discount</td>
                      <td colSpan={2} className="py-2 pl-3 text-right text-[13px] tabular-nums font-semibold text-red-600">−{formatMoney(q.discount, q.currency)}</td>
                    </tr>
                  )}
                  {q.tax > 0 && (
                    <tr className="border-t border-[var(--border-default)]">
                      <td colSpan={6} className="py-2 px-3 text-right text-[13px] font-medium text-[var(--text-secondary)]">GST</td>
                      <td colSpan={2} className="py-2 pl-3 text-right text-[13px] tabular-nums font-semibold text-[var(--text-primary)]">{formatMoney(q.tax, q.currency)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
                    <td colSpan={6} className="py-3 px-3 text-right text-[14px] font-bold text-[var(--text-primary)]">Grand Total</td>
                    <td colSpan={2} className="py-3 pl-3 text-right text-[16px] tabular-nums font-bold text-[var(--color-primary)]">{formatMoney(q.total, q.currency)}</td>
                  </tr>
                  {(q.freight && q.freight !== "0" && q.freight !== "string") && (
                    <tr className="border-t border-[var(--border-default)]">
                      <td colSpan={6} className="py-1.5 px-3 text-right text-[11px] text-[var(--text-muted)]">Includes Freight: {q.freight}</td>
                      <td colSpan={2} />
                    </tr>
                  )}
                </tfoot>
              </table>
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
    </div>
  );
}
