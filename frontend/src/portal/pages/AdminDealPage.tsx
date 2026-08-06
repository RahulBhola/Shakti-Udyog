import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText, Package, ChevronDown, ChevronUp, Download, Receipt, Loader2 } from "lucide-react";
import { adminApi } from "../../api/adminApi";
import { updaterApi } from "../../api/updaterApi";
import { apiDownload } from "../../api/client";
import type { OrderDetail, QuotationDetail, InvoiceDetail } from "../../api/customerApi";
import type { UpdaterRfqDetail } from "../../api/adminApi";
import { formatDate, formatMoney } from "../shared";

/* ── Minimal badge ─────────────────────────────────────────────── */

function Badge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const color =
    lower.includes("delivered") || lower.includes("paid") || lower.includes("issued")
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : lower.includes("cancelled") || lower.includes("rejected")
        ? "bg-red-500/10 text-red-600 dark:text-red-400"
        : "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </span>
  );
}

/* ── Layout helpers (mirrors AdminOrderDetailPage) ─────────────── */

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</h3>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-1.5">
      <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider block">{label}</span>
      <span className="text-[13px] text-[var(--text-primary)] font-medium break-words">{value ?? "—"}</span>
    </div>
  );
}

function GridFields({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-1">{children}</div>;
}

/* ── Invoice summary row type ──────────────────────────────────── */

interface OrderInvoiceSummary {
  id: string;
  invoiceNumber: string;
  issueDateUtc: string;
  dueDateUtc: string | null;
  total: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  status: string;
  documentId: string | null;
  hasPdf: boolean;
}

/* ── Main page ─────────────────────────────────────────────────── */

export default function AdminDealPage() {
  const { orderId = "" } = useParams();
  const [params] = useSearchParams();
  const requestedInvoice = params.get("invoice");
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [rfq, setRfq] = useState<UpdaterRfqDetail | null>(null);
  const [invoices, setInvoices] = useState<OrderInvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded invoice detail cache: id -> detail | "loading"
  const [detail, setDetail] = useState<Record<string, InvoiceDetail | "loading">>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    setOrder(null); setQuotation(null); setRfq(null); setInvoices([]);
    updaterApi.order(orderId)
      .then((o) => {
        setOrder(o);
        // Quotation → RFQ chain
        if (o.quotationId) {
          return adminApi.quotation(o.quotationId).then((q) => {
            setQuotation(q);
            if (q.rfqId) {
              adminApi.rfq(q.rfqId).then(setRfq).catch(() => {});
            }
          });
        }
      })
      .catch((e) => setError(e.message ?? "Deal not found"))
      .finally(() => setLoading(false));
    adminApi.orderInvoices(orderId).then(setInvoices).catch(() => {});
  }, [orderId]);

  // Open an invoice: mark it open and fetch its detail if not cached yet.
  const openInvoice = (invId: string) => {
    setOpen((prev) => ({ ...prev, [invId]: true }));
    if (!detail[invId]) {
      setDetail((prev) => ({ ...prev, [invId]: "loading" }));
      adminApi.invoice(invId)
        .then((d) => setDetail((prev) => ({ ...prev, [invId]: d })))
        .catch(() => setDetail((prev) => {
          const next = { ...prev };
          delete next[invId];
          return next;
        }));
    }
  };

  // Auto-open the invoice the dashboard deep-linked to.
  useEffect(() => {
    if (requestedInvoice && invoices.some((i) => i.id === requestedInvoice)) {
      openInvoice(requestedInvoice);
    }
  }, [requestedInvoice, invoices]);

  const toggleInvoice = (inv: OrderInvoiceSummary) => {
    if (open[inv.id]) {
      setOpen((prev) => ({ ...prev, [inv.id]: false }));
    } else {
      openInvoice(inv.id);
    }
  };

  const quoteTotal = useMemo(
    () => (quotation ? quotation.subtotal + (quotation.tax ?? 0) - (quotation.discount ?? 0) : 0),
    [quotation]
  );

  // Refresh a single invoice's cached detail after a payment action.
  const refreshInvoice = (invId: string) => {
    adminApi.invoice(invId)
      .then((d) => setDetail((prev) => ({ ...prev, [invId]: d })))
      .catch(() => {});
  };

  const handleVerifyPayment = (paymentId: string, invId: string) => {
    adminApi.verifyPayment(paymentId).then(() => refreshInvoice(invId)).catch(() => {});
  };

  const handleRejectPayment = (paymentId: string, invId: string) => {
    const reason = window.prompt("Reason for rejecting this payment?");
    if (reason === null) return; // user cancelled
    adminApi.rejectPayment(paymentId, reason).then(() => refreshInvoice(invId)).catch(() => {});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <span className="text-red-500 text-2xl">!</span>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Deal Not Found</h3>
        <p className="text-[13px] text-[var(--text-muted)] mb-6">{error ?? "This transaction could not be loaded."}</p>
        <button type="button" onClick={() => navigate("/admin/invoices")}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
          <ArrowLeft size={14} /> Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ── Sticky header ───────────────────────────────────── */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-[var(--bg-body)] border-b border-[var(--border-default)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => navigate("/admin/invoices")}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all shrink-0">
            <ArrowLeft size={15} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[var(--text-primary)] truncate">{order.orderNumber}</h1>
              <Badge status={order.statusLabel ?? order.status} />
            </div>
            <p className="text-[12px] text-[var(--text-muted)]">
              RFQ → Quotation → Order → Invoice{rfq?.companyName ? ` · ${rfq.companyName}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to={`/admin/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] text-[12px] font-medium hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all no-underline hover:no-underline">
            <Package size={13} /> Order
          </Link>
          {quotation && (
            <Link to={`/admin/quotations/${quotation.id}`}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] text-[12px] font-medium hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all no-underline hover:no-underline">
              <FileText size={13} /> Quotation
            </Link>
          )}
          {rfq && (
            <Link to={`/admin/rfqs/${rfq.id}`}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] text-[12px] font-medium hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all no-underline hover:no-underline">
              <FileText size={13} /> RFQ
            </Link>
          )}
        </div>
      </div>

      {/* ── Pipeline: RFQ → Quotation → Order → Invoice ────── */}
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        <span>RFQ</span><span>→</span><span>Quotation</span><span>→</span><span>Order</span><span>→</span><span>Invoice</span>
      </div>

      {/* RFQ */}
      <Section title="RFQ" right={rfq ? <Badge status={rfq.status} /> : undefined}>
        {rfq ? (
          <div className="space-y-4">
            <GridFields>
              <Field label="Company" value={rfq.companyName} />
              <Field label="Contact" value={rfq.fullName} />
              <Field label="Product type" value={rfq.productType} />
              <Field label="Part no." value={rfq.partNumber} />
              <Field label="Part name" value={rfq.partName} />
              <Field label="Material grade" value={rfq.materialGrade} />
              <Field label="Quantity" value={rfq.quantity} />
              <Field label="Delivery location" value={rfq.deliveryLocation} />
              <Field label="Submitted" value={formatDate(rfq.createdAtUtc)} />
              <Field label="Files" value={rfq.files.length > 0 ? `${rfq.files.length} attachment(s)` : "None"} />
            </GridFields>
            <div>
              <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider block">Requirement details</span>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">{rfq.requirementDetails || "—"}</p>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-[var(--text-muted)] text-center py-4">No RFQ linked to this transaction.</p>
        )}
      </Section>

      {/* Quotation */}
      <Section title="Quotation" right={quotation ? <Badge status={quotation.status} /> : undefined}>
        {quotation ? (
          <div className="space-y-4">
            <GridFields>
              <Field label="Quotation no." value={quotation.quotationNumber} />
              <Field label="Revision" value={quotation.revisionNumber} />
              <Field label="Valid until" value={formatDate(quotation.validUntilUtc)} />
              <Field label="Payment terms" value={quotation.paymentTerms} />
              <Field label="Delivery terms" value={quotation.deliveryTerms} />
              <Field label="Subtotal" value={formatMoney(quotation.subtotal, quotation.currency)} />
              <Field label="Tax" value={formatMoney(quotation.tax ?? 0, quotation.currency)} />
              <Field label="Total" value={<strong>{formatMoney(quoteTotal, quotation.currency)}</strong>} />
            </GridFields>
            {quotation.items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      <th className="text-left py-2 pr-3">#</th>
                      <th className="text-left py-2 pr-3">Part</th>
                      <th className="text-left py-2 pr-3">Description</th>
                      <th className="text-right py-2 pr-3">Qty</th>
                      <th className="text-right py-2 pr-3">Rate</th>
                      <th className="text-right py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((it) => (
                      <tr key={it.lineNumber} className="border-b border-[var(--border-default)] last:border-0">
                        <td className="py-2.5 pr-3 text-[var(--text-muted)]">{it.lineNumber}</td>
                        <td className="py-2.5 pr-3 font-medium text-[var(--text-primary)]">{it.partNumber}</td>
                        <td className="py-2.5 pr-3 text-[var(--text-secondary)]">{it.description}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{it.quantity} {it.unit}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">{formatMoney(it.unitPrice, quotation.currency)}</td>
                        <td className="py-2.5 text-right tabular-nums font-medium">{formatMoney(it.lineTotal, quotation.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[13px] text-[var(--text-muted)] text-center py-4">No quotation linked to this transaction.</p>
        )}
      </Section>

      {/* Order */}
      <Section title="Order" right={<Badge status={order.statusLabel ?? order.status} />}>
        <div className="space-y-4">
          <GridFields>
            <Field label="Order no." value={order.orderNumber} />
            <Field label="PO reference" value={order.purchaseOrderReference} />
            <Field label="Placed" value={formatDate(order.placedAtUtc)} />
            <Field label="Promised dispatch" value={formatDate(order.promisedDispatchDateUtc)} />
            <Field label="Delivery address" value={order.deliveryAddress} />
            <Field label="Last updated" value={formatDate(order.lastUpdatedAtUtc)} />
          </GridFields>
          {order.items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border-default)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    <th className="text-left py-2 pr-3">Part #</th>
                    <th className="text-left py-2 pr-3">Description</th>
                    <th className="text-right py-2 pr-3">Ordered</th>
                    <th className="text-right py-2 pr-3">Produced</th>
                    <th className="text-right py-2">Dispatched</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((i, idx) => (
                    <tr key={idx} className="border-b border-[var(--border-default)] last:border-0">
                      <td className="py-2.5 pr-3 font-medium text-[var(--text-primary)]">{i.partNumber}</td>
                      <td className="py-2.5 pr-3 text-[var(--text-secondary)]">{i.description}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{i.quantityOrdered}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{i.quantityProduced}</td>
                      <td className="py-2.5 text-right tabular-nums">{i.quantityDispatched}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Section>

      {/* Invoices */}
      <Section
        title={`Invoices (${invoices.length})`}
        right={invoices.length > 0 ? undefined : <span className="text-[11px] text-[var(--text-muted)]">No invoices yet</span>}
      >
        {invoices.length === 0 ? (
          <p className="text-[13px] text-[var(--text-muted)] text-center py-4">
            No invoice has been sent for this order yet. Use the Order page to send one.
          </p>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => {
              const isOpen = !!open[inv.id];
              const d = detail[inv.id];
              return (
                <div key={inv.id} className="rounded-xl border border-[var(--border-default)] overflow-hidden">
                  <button type="button" onClick={() => toggleInvoice(inv)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-surface-hover)] transition-all">
                    <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                      <Receipt size={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[var(--text-primary)]">{inv.invoiceNumber}</span>
                        <Badge status={inv.status} />
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Issued {formatDate(inv.issueDateUtc)} · Due {formatDate(inv.dueDateUtc)} · Balance {formatMoney(inv.balanceDue, inv.currency)}
                      </div>
                    </div>
                    <span className="text-[var(--text-muted)] shrink-0">{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)]">
                      {d === "loading" || d === undefined ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 size={18} className="animate-spin text-[var(--text-muted)]" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-3">
                          {/* Line items */}
                          <div>
                            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Line items</h4>
                            {d.items.length === 0 ? (
                              <p className="text-[13px] text-[var(--text-muted)]">No line items recorded.</p>
                            ) : (
                              <table className="w-full text-[12px]">
                                <thead>
                                  <tr className="border-b border-[var(--border-default)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                                    <th className="text-left py-1.5 pr-3">Item</th>
                                    <th className="text-right py-1.5 pr-3">Qty</th>
                                    <th className="text-right py-1.5 pr-3">Rate</th>
                                    <th className="text-right py-1.5">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {d.items.map((it) => (
                                    <tr key={it.id} className="border-b border-[var(--border-default)] last:border-0">
                                      <td className="py-2 pr-3">{it.description}{it.hsnSacCode ? ` · HSN ${it.hsnSacCode}` : ""}</td>
                                      <td className="py-2 pr-3 text-right tabular-nums">{it.quantity} {it.unit}</td>
                                      <td className="py-2 pr-3 text-right tabular-nums">{formatMoney(it.unitPrice, d.currency)}</td>
                                      <td className="py-2 text-right tabular-nums font-medium">{formatMoney(it.lineTotal, d.currency)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t border-[var(--border-default)]">
                                    <td className="py-2 pr-3 text-[var(--text-muted)]">Subtotal</td>
                                    <td colSpan={2} />
                                    <td className="py-2 text-right tabular-nums font-medium">{formatMoney(d.subtotal, d.currency)}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1 pr-3 text-[var(--text-muted)]">Tax</td>
                                    <td colSpan={2} />
                                    <td className="py-1 text-right tabular-nums">{formatMoney(d.tax, d.currency)}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1 pr-3 text-[var(--text-muted)]">Total</td>
                                    <td colSpan={2} />
                                    <td className="py-1 text-right tabular-nums font-semibold text-[var(--text-primary)]">{formatMoney(d.total, d.currency)}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1 pr-3 text-[var(--text-muted)]">Paid</td>
                                    <td colSpan={2} />
                                    <td className="py-1 text-right tabular-nums">{formatMoney(d.amountPaid, d.currency)}</td>
                                  </tr>
                                  <tr>
                                    <td className="py-1 pr-3 text-[var(--text-muted)]">Balance due</td>
                                    <td colSpan={2} />
                                    <td className="py-1 text-right tabular-nums font-semibold text-[var(--text-primary)]">{formatMoney(d.balanceDue, d.currency)}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            )}
                          </div>

                          {/* Payments */}
                          <div>
                            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Payments</h4>
                            {d.payments.length === 0 ? (
                              <p className="text-[13px] text-[var(--text-muted)]">No payments recorded.</p>
                            ) : (
                              <div className="space-y-2">
                                {d.payments.map((p) => (
                                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-default)] px-3 py-2">
                                    <div className="min-w-0">
                                      <div className="text-[13px] font-medium text-[var(--text-primary)]">{formatMoney(p.amount, d.currency)} · {p.method}</div>
                                      <div className="text-[11px] text-[var(--text-muted)]">Ref {p.paymentReference} · {formatDate(p.paymentDateUtc)}</div>
                                      <div className="flex items-center gap-1.5 mt-1.5"><Badge status={p.status} /></div>
                                      {p.status === "Rejected" && p.verificationNote && (
                                        <div className="text-[11px] text-red-500/90 mt-1">Rejected: {p.verificationNote}</div>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                      {p.proofDocumentId && (
                                        <button type="button"
                                          onClick={() => void apiDownload(adminApi.paymentProofDownloadUrl(p.id), "payment-proof")}
                                          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
                                          <Download size={12} /> View Proof
                                        </button>
                                      )}
                                      {p.status === "Pending Verification" && (
                                        <div className="flex items-center gap-1.5">
                                          <button type="button" onClick={() => handleVerifyPayment(p.id, inv.id)}
                                            className="inline-flex items-center gap-1 px-3 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold hover:bg-emerald-500/25 transition-all">
                                            Approve
                                          </button>
                                          <button type="button" onClick={() => handleRejectPayment(p.id, inv.id)}
                                            className="inline-flex items-center gap-1 px-3 h-7 rounded-lg bg-red-500/10 text-red-500 text-[11px] font-semibold hover:bg-red-500/20 transition-all">
                                            Reject
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex justify-end">
                        {inv.hasPdf && (
                          <button type="button"
                            onClick={() => void apiDownload(adminApi.invoiceDownloadUrl(inv.id), `${inv.invoiceNumber}.pdf`)}
                            className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
                            <Download size={14} /> Download PDF
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
