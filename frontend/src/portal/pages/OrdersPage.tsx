import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, CheckCircle2, Clock, FileText, MapPin,
  MessageSquare, Package, Truck, Loader2, Download,
} from "lucide-react";
import {
  customerApi,
  type OrderComment,
  type OrderDetail,
  type OrderListItem,
  type TimelineEntry,
} from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate, formatMoney } from "../shared";
import { apiDownload } from "../../api/client";

/* ── Status badge ─────────────────────────────────────────────── */
const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  pattern_development: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  production: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  quality_check: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  packed: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  ready_to_dispatch: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  dispatched: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  delivered: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  on_hold: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const c = statusColors[status] ?? "bg-[#F1F5F9] text-[#64748B]";
  const display = label ?? status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${c}`}>
      {display}
    </span>
  );
}

/* ── Workflow stages ──────────────────────────────────────────── */
const WORKFLOW = [
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "pattern_development", label: "Pattern Dev.", icon: FileText },
  { key: "production", label: "Production", icon: Package },
  { key: "quality_check", label: "QC", icon: Clock },
  { key: "packed", label: "Packed", icon: Package },
  { key: "ready_to_dispatch", label: "Ready to Dispatch", icon: Truck },
  { key: "dispatched", label: "Dispatched", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];
const WORKFLOW_ORDER = Object.fromEntries(WORKFLOW.map((s, i) => [s.key, i]));

/* ── Section wrapper ──────────────────────────────────────────── */
function Section({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] m-0">{title}</h3>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── Info field row ───────────────────────────────────────────── */
function Field({ label, value, icon: Icon }: { label: string; value: string | ReactNode; icon?: any }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon size={14} className="mt-0.5 text-[var(--text-muted)] shrink-0" />}
      <div className="min-w-0">
        <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider block">{label}</span>
        <span className="text-[13px] text-[var(--text-primary)] font-medium break-words">{value}</span>
      </div>
    </div>
  );
}

/* ── Info Card ────────────────────────────────────────────────── */
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

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function OrderListPage() {
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerApi.orders().then(setOrders).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <h1>Orders</h1>
      {error && <EmptyState title="Orders unavailable" text={error} />}
      {!orders && !error && <Loading label="Loading orders" />}
      {orders && orders.length === 0 && <EmptyState title="No orders yet" />}
      {orders && orders.length > 0 && (
        <div className="list-rows">
          {orders.map((o) => (
            <Link key={o.id} to={`/customer/orders/${o.id}`} className="row-link">
              <div className="list-row">
                <div className="list-row__main">
                  <div className="list-row__title">{o.orderNumber}</div>
                  <div className="list-row__meta">
                    Placed {formatDate(o.placedAtUtc)} · {o.totalQuantity} pcs
                    {o.promisedDispatchDateUtc && ` · promised dispatch ${formatDate(o.promisedDispatchDateUtc)}`}
                    {` · updated ${formatDate(o.lastUpdatedAtUtc)}`}
                  </div>
                </div>
                <StatusBadge status={o.statusLabel} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

const trackingFlow = [
  "confirmed", "pattern_development", "production", "quality_check",
  "packed", "ready_to_dispatch", "dispatched", "delivered",
];

export function OrderTimelinePage() {
  const { id = "" } = useParams();
  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    customerApi.orderTimeline(id).then(setTimeline).catch(() => setMissing(true));
  }, [id]);

  if (missing) return <EmptyState title="Order not found" />;
  if (!timeline) return <Loading label="Loading timeline" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 min-w-0">
        <Link to={`/customer/orders/${id}`}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all shrink-0">
          <ArrowLeft size={15} />
        </Link>
        <h1 className="text-lg font-bold text-[var(--text-primary)] m-0">Order Timeline</h1>
      </div>
      <Section title="Tracking Progress">
        <OrderTrack timeline={timeline} />
      </Section>
      <p className="text-[13px] text-[var(--text-muted)] m-0">
        <Link to={`/customer/orders/${id}`} className="text-[var(--color-primary)] hover:underline">← Back to order details</Link>
      </p>
    </div>
  );
}

function OrderTrack({ timeline }: { timeline: TimelineEntry[] }) {
  const reachedCodes = new Set(timeline.map((t) => t.statusCode));
  const currentIndex = Math.max(...trackingFlow.map((code, i) => (reachedCodes.has(code) ? i : -1)));

  return (
    <ol className="track">
      {trackingFlow.map((code, i) => {
        const entries = timeline.filter((t) => t.statusCode === code);
        const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "";
        const label = entries[0]?.statusLabel
          ?? code.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
        return (
          <li key={code} className={state}>
            <div className="track__label">{label}</div>
            {entries.map((entry, j) => (
              <div key={j}>
                {entry.message && <div>{entry.message}</div>}
                <div className="track__meta">{formatDate(entry.occurredAtUtc)} · {entry.actorType}</div>
              </div>
            ))}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [comments, setComments] = useState<OrderComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [missing, setMissing] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    customerApi.order(id).then(setOrder).catch(() => setMissing(true));
    customerApi.orderTimeline(id).then(setTimeline).catch(() => {});
    customerApi.orderComments(id).then(setComments).catch(() => {});
  }, [id]);

  async function postComment() {
    const message = newComment.trim();
    if (!message || postingComment) return;
    setPostingComment(true);
    try {
      await customerApi.addOrderComment(id, message);
      setNewComment("");
      customerApi.orderComments(id).then(setComments).catch(() => {});
    } catch {
      // silently drop on transient failure; the refresh on reload will reconcile
    } finally {
      setPostingComment(false);
    }
  }

  async function submitSupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = (data.get("subject") as string).trim();
    const message = (data.get("message") as string).trim();
    if (subject.length < 3 || message.length < 10) return;

    setBusy(true);
    try {
      await customerApi.createSupportRequest(id, subject, message);
      setSupportMessage("Your support request has been raised. Our team will respond.");
      setSupportOpen(false);
    } catch {
      setSupportMessage("Could not raise the request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (missing) return <EmptyState title="Order not found" />;
  if (!order) return <Loading label="Loading order" />;

  const currentIndex = WORKFLOW_ORDER[order.status] ?? -1;

  return (
    <div className="space-y-6 pb-8">
      {/* ── Sticky header ─────────────────────────────────────── */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-[var(--bg-app)] border-b border-[var(--border-default)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => navigate("/customer/orders")}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all shrink-0">
            <ArrowLeft size={15} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[var(--text-primary)] truncate">{order.orderNumber}</h1>
              <StatusBadge status={order.status} label={order.statusLabel} />
            </div>
            {order.purchaseOrderReference && (
              <p className="text-[12px] text-[var(--text-muted)]">PO: {order.purchaseOrderReference}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to={`/customer/orders/${id}/timeline`}
            className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] text-[12px] font-medium hover:text-[var(--text-primary)] transition-all">
            <Clock size={14} /> Full timeline
          </Link>
        </div>
      </div>

      {/* ── Workflow timeline ─────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
          {WORKFLOW.map((stage, i) => {
            const Icon = stage.icon;
            const isCompleted = i < currentIndex;
            const isCurrent = i === currentIndex;
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
                  }`}>
                    {stage.label}
                  </span>
                </div>
                {i < WORKFLOW.length - 1 && (
                  <div className={`flex-1 h-px mx-1 mt-[-20px] ${
                    i < currentIndex ? "bg-emerald-400" : "bg-[var(--border-default)]"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        {order.statusDescription && (
          <p className="text-[12px] text-[var(--text-muted)] text-center mt-3 mb-0">{order.statusDescription}</p>
        )}
      </div>

      {/* ── Summary cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard icon={Calendar} label="Placed" value={formatDate(order.placedAtUtc)} color="bg-blue-500 text-white" />
        <InfoCard icon={Clock} label="Promised Dispatch" value={formatDate(order.promisedDispatchDateUtc)} color="bg-amber-500 text-white" />
        <InfoCard icon={Clock} label="Last Updated" value={formatDate(order.lastUpdatedAtUtc)} color="bg-violet-500 text-white" />
        <InfoCard icon={Package} label="Line Items" value={String(order.items.length)} color="bg-teal-500 text-white" />
      </div>

      {/* ── Two-column layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Line Items */}
          <Section title={`Line Items (${order.items.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border-default)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    <th className="text-left py-2 pr-3">Part #</th>
                    <th className="text-left py-2 pr-3">Description</th>
                    <th className="text-left py-2 pr-3">Grade</th>
                    <th className="text-left py-2 pr-3">Rev.</th>
                    <th className="text-right py-2 pr-3">Ordered</th>
                    <th className="text-right py-2 pr-3">Produced</th>
                    <th className="text-right py-2">Dispatched</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={item.partNumber} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-surface-hover)]">
                      <td className="py-2.5 pr-3 font-medium text-[var(--text-primary)]">{item.partNumber}</td>
                      <td className="py-2.5 pr-3 text-[var(--text-secondary)]">{item.description}</td>
                      <td className="py-2.5 pr-3 text-[var(--text-secondary)]">{item.materialGrade ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-[var(--text-secondary)]">{item.drawingRevision ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-[var(--text-primary)]">{item.quantityOrdered} {item.unit}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-[var(--text-primary)]">{item.quantityProduced} {item.unit}</td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--text-primary)]">{item.quantityDispatched} {item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Shipments */}
          {order.shipments.length > 0 ? (
            <Section title={`Shipments (${order.shipments.length})`}>
              <div className="space-y-4">
                {order.shipments.map((s) => (
                  <div key={s.id} className="border border-[var(--border-default)] rounded-lg p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <Field label="Transporter" value={s.transporter ?? "—"} icon={Truck} />
                      <Field label="Tracking / LR No." value={s.trackingNumber ?? "—"} />
                      <Field label="Dispatch Date" value={formatDate(s.dispatchDateUtc)} icon={Calendar} />
                      <Field label="Estimated Arrival" value={formatDate(s.estimatedArrivalUtc)} icon={Clock} />
                      <Field label="Delivered" value={formatDate(s.deliveredAtUtc)} icon={CheckCircle2} />
                      <Field label="Proof of Delivery" value={s.hasProofOfDelivery ? "Available in Documents" : "Not yet available"} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : (
            <Section title="Shipments">
              <p className="text-[13px] text-[var(--text-muted)] text-center py-4">No shipments recorded yet.</p>
            </Section>
          )}

          {/* Documents */}
          <Section title={`Documents (${order.documents.length})`}>
            {order.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.documents.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] p-3.5 hover:bg-[var(--bg-surface-hover)] transition-all">
                    <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] shrink-0">
                      <FileText size={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-[var(--text-primary)] truncate">{d.title || d.fileName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)] shrink-0">{d.category}</span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{(d.sizeBytes / 1024).toFixed(1)} KB</div>
                    </div>
                    <button type="button"
                      onClick={() => void apiDownload(customerApi.downloadDocument(d.id), d.title || d.fileName || "document")}
                      className="flex items-center gap-1 px-3 h-8 rounded-lg border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface)] transition-all shrink-0">
                      <Download size={13} /> Download
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[var(--text-muted)] text-center py-4">No documents shared for this order yet.</p>
            )}
          </Section>
        </div>

        {/* ── Right sidebar ──────────────────────────────────── */}
        <div className="space-y-5">
          {/* Current Status */}
          <Section title="Current Status">
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={order.status} label={order.statusLabel} />
            </div>
            <p className="text-[12px] text-[var(--text-muted)]">{order.statusDescription}</p>
          </Section>

          {/* Delivery Information */}
          <Section title="Delivery Information">
            <div className="space-y-2">
              <Field label="Delivery Address" value={order.deliveryAddress ?? "—"} icon={MapPin} />
              <Field label="Promised Dispatch" value={formatDate(order.promisedDispatchDateUtc)} icon={Calendar} />
              <Field label="PO Reference" value={order.purchaseOrderReference ?? "—"} icon={FileText} />
              <Field label="Last Update" value={formatDate(order.lastUpdatedAtUtc)} icon={Clock} />
            </div>
          </Section>

          {/* Commercial */}
          <Section title="Commercial Summary">
            {order.commercial ? (
              <div className="space-y-2">
                <Field label="Invoice" value={order.commercial.invoiceNumber ?? "—"} />
                <Field label="Total" value={order.commercial.total != null ? formatMoney(order.commercial.total) : "—"} />
                <Field label="Paid" value={order.commercial.amountPaid != null ? formatMoney(order.commercial.amountPaid) : "—"} />
                <Field label="Balance Due" value={order.commercial.balanceDue != null ? formatMoney(order.commercial.balanceDue) : "—"} />
                <Field label="Payment Status" value={order.commercial.paymentStatus ? <StatusBadge status={order.commercial.paymentStatus} /> : "—"} />
              </div>
            ) : (
              <p className="text-[13px] text-[var(--text-muted)] text-center py-4">No invoice has been issued for this order yet.</p>
            )}
            <Link to="/customer/invoices"
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg border border-dashed border-[var(--border-default)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all">
              View all invoices →
            </Link>
          </Section>

          {/* Support */}
          <Section title="Need help with this order?">
            {supportMessage && (
              <p className="mb-3 px-3 py-2 rounded-lg text-[12px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" role="status">
                {supportMessage}
              </p>
            )}
            {!supportOpen ? (
              <button type="button" onClick={() => setSupportOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] transition-all">
                <MessageSquare size={14} /> Raise a support request
              </button>
            ) : (
              <form className="space-y-3" onSubmit={submitSupport}>
                <div>
                  <label htmlFor="s-subject" className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Subject *</label>
                  <input id="s-subject" name="subject" required minLength={3}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
                </div>
                <div>
                  <label htmlFor="s-message" className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">How can we help? *</label>
                  <textarea id="s-message" name="message" required minLength={10} rows={3}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] resize-none" />
                </div>
                <div className="flex items-center gap-2">
                  <button type="submit" disabled={busy}
                    className="flex-1 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all">
                    {busy ? "Sending…" : "Submit request"}
                  </button>
                  <button type="button" onClick={() => setSupportOpen(false)}
                    className="px-4 h-9 rounded-lg border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </Section>
        </div>
      </div>

      {/* ── Activity & Comments ─────────────────────────────── */}
      <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-2.5 bg-[var(--bg-surface)]/50">
          <MessageSquare size={15} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">Activity &amp; Comments</h3>
        </div>
        <div className="p-5">
          {comments.length === 0 && (
            <p className="text-[13px] text-[var(--text-muted)] mb-4">No comments yet. Start the conversation with our team.</p>
          )}
          <div className="space-y-4 mb-4">
            {comments.map((c, i) => (
              <div key={i} className="flex gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                  c.authorRole === "Customer"
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}>
                  {(c.authorName || c.authorRole || "?").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-semibold text-[var(--text-primary)]">{c.authorName || c.authorRole || "Staff"}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)]">{c.authorRole}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{formatDateTime(c.createdAtUtc)}</span>
                  </div>
                  <p className="text-[13px] text-[var(--text-secondary)] mt-1 m-0 break-words whitespace-pre-wrap">{c.message}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type a message..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); postComment(); } }}
              className="flex-1 h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
            <button onClick={postComment} disabled={!newComment.trim() || postingComment}
              className="px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all">
              {postingComment ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderListPage;
