import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Calendar, MapPin, FileText, Truck, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { updaterApi } from "../../api/updaterApi";
import type { OrderDetail } from "../../api/customerApi";
import { ConfirmActionModal } from "./orders/ConfirmModal";

/* ── Status badge ──────────────────────────────────────────────── */

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

/* ── Helper ────────────────────────────────────────────────────── */

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── Workflow stages ───────────────────────────────────────────── */

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

/* ── Section wrapper ───────────────────────────────────────────── */

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

/* ── Info field row ────────────────────────────────────────────── */

function Field({ label, value, icon: Icon }: { label: string; value: string | React.ReactNode; icon?: any }) {
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

/* ── Info Card ─────────────────────────────────────────────────── */

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

/* ── Main Page ─────────────────────────────────────────────────── */

export default function AdminOrderDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [milestoneModal, setMilestoneModal] = useState<{ nextStatus: string; label: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    updaterApi.order(id)
      .then((o) => setOrder(o))
      .catch((e) => setError(e.message ?? "Order not found"))
      .finally(() => setLoading(false));
  }, [id]);

  // Open milestone confirmation modal
  const handleAdvanceMilestone = () => {
    const WORKFLOW_KEYS = ["confirmed", "pattern_development", "production", "quality_check", "packed", "ready_to_dispatch", "dispatched", "delivered"];
    const currentIdx = WORKFLOW_KEYS.indexOf(order!.status);
    if (currentIdx < 0 || currentIdx >= WORKFLOW_KEYS.length - 1) return;
    const nextStatus = WORKFLOW_KEYS[currentIdx + 1];
    setMilestoneModal({
      nextStatus,
      label: nextStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    });
  };

  const confirmMilestoneAdvance = async (customerMsg?: string) => {
    if (!milestoneModal) return;
    setMilestoneModal(null);
    setActionBusy(true);
    setActionMsg(null);
    try {
      await updaterApi.updateMilestone(id, milestoneModal.nextStatus, customerMsg);
      const o = await updaterApi.order(id);
      setOrder(o);
      setActionMsg(`Status updated to ${milestoneModal.label}`);
    } catch {
      setActionMsg("Failed to update status.");
    } finally {
      setActionBusy(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
          <span className="text-red-500 text-2xl">!</span>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Order Not Found</h3>
        <p className="text-[13px] text-[var(--text-muted)] mb-6">{error ?? "The order you're looking for doesn't exist or has been removed."}</p>
        <button type="button" onClick={() => navigate("/admin/orders")}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
          <ArrowLeft size={14} /> Back to Orders
        </button>
      </div>
    );
  }

  const currentIndex = WORKFLOW_ORDER[order.status] ?? -1;
  const workflowKeys = WORKFLOW.map((w) => w.key);
  const isTerminal = ["cancelled", "delivered", "closed", "returned"].includes(order.status);

  return (
    <div className="space-y-6 pb-8">
      {/* ── Sticky header ────────────────────────────────────── */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-[var(--bg-body)] border-b border-[var(--border-default)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => navigate("/admin/orders")}
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
          {!isTerminal && (
            <button type="button" onClick={handleAdvanceMilestone} disabled={actionBusy}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] transition-all disabled:opacity-50">
              {actionBusy ? "Updating..." : "Advance Stage →"}
            </button>
          )}
        </div>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className={`px-4 py-2.5 rounded-xl text-[13px] font-medium ${
          actionMsg.includes("failed") || actionMsg.includes("Fail")
            ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
            : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        }`}>
          {actionMsg}
        </div>
      )}

      {/* ── Workflow Timeline ───────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
          {WORKFLOW.map((stage, i) => {
            const Icon = stage.icon;
            const isCompleted = i < currentIndex;
            const isCurrent = i === currentIndex;
            const isPending = i > currentIndex;
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
      </div>

      {/* ── Summary Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard icon={Calendar} label="Placed" value={formatDate(order.placedAtUtc)} color="bg-blue-500 text-white" />
        <InfoCard icon={Clock} label="Promised Dispatch" value={formatDate(order.promisedDispatchDateUtc)} color="bg-amber-500 text-white" />
        <InfoCard icon={Clock} label="Last Updated" value={formatDate(order.lastUpdatedAtUtc)} color="bg-violet-500 text-white" />
        <InfoCard icon={FileText} label="Items" value={String(order.items.length)} color="bg-teal-500 text-white" />
      </div>

      {/* ── Two-column layout ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Line Items */}
          <Section title="Line Items">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border-default)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    <th className="text-left py-2 pr-3">Part #</th>
                    <th className="text-left py-2 pr-3">Description</th>
                    <th className="text-left py-2 pr-3">Grade</th>
                    <th className="text-right py-2 pr-3">Ordered</th>
                    <th className="text-right py-2 pr-3">Produced</th>
                    <th className="text-right py-2">Dispatched</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((i, idx) => (
                    <tr key={idx} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-surface-hover)]">
                      <td className="py-2.5 pr-3 font-medium text-[var(--text-primary)]">{i.partNumber}</td>
                      <td className="py-2.5 pr-3 text-[var(--text-secondary)]">{i.description}</td>
                      <td className="py-2.5 pr-3 text-[var(--text-secondary)]">{i.materialGrade ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-[var(--text-primary)]">{i.quantityOrdered}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-[var(--text-primary)]">{i.quantityProduced}</td>
                      <td className="py-2.5 text-right tabular-nums text-[var(--text-primary)]">{i.quantityDispatched}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Shipments */}
          {order.shipments.length > 0 && (
            <Section title={`Shipments (${order.shipments.length})`}>
              <div className="space-y-4">
                {order.shipments.map((s) => (
                  <div key={s.id} className="border border-[var(--border-default)] rounded-lg p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <Field label="Transporter" value={s.transporter ?? "—"} icon={Truck} />
                      <Field label="Tracking #" value={s.trackingNumber ?? "—"} />
                      <Field label="Dispatch Date" value={formatDate(s.dispatchDateUtc)} icon={Calendar} />
                      <Field label="ETA" value={formatDate(s.estimatedArrivalUtc)} icon={Clock} />
                      <Field label="Delivered" value={formatDate(s.deliveredAtUtc)} icon={CheckCircle2} />
                      <Field label="POD" value={s.hasProofOfDelivery ? "Available" : "Not available"} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* No shipments yet */}
          {order.shipments.length === 0 && (
            <Section title="Shipments">
              <p className="text-[13px] text-[var(--text-muted)] text-center py-4">No shipments recorded yet.</p>
            </Section>
          )}
        </div>

        {/* ── Right sidebar ─────────────────────────────────── */}
        <div className="space-y-5">
          {/* Status */}
          <Section title="Current Status">
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={order.status} label={order.statusLabel} />
            </div>
            <p className="text-[12px] text-[var(--text-muted)]">{order.statusDescription}</p>
            <div className="mt-3 text-[11px] text-[var(--text-muted)] font-medium">
              Status code: <code className="text-[var(--text-primary)]">{order.status}</code>
            </div>
          </Section>

          {/* Delivery Info */}
          <Section title="Delivery Information">
            <div className="space-y-2">
              <Field label="Delivery Address" value={order.deliveryAddress ?? "—"} icon={MapPin} />
              <Field label="Promised Dispatch" value={formatDate(order.promisedDispatchDateUtc)} icon={Calendar} />
              <Field label="PO Reference" value={order.purchaseOrderReference ?? "—"} icon={FileText} />
            </div>
          </Section>

          {/* Commercial */}
          <Section title="Commercial">
            {order.commercial ? (
              <div className="space-y-2">
                <Field label="Invoice" value={order.commercial.invoiceNumber ?? "—"} />
                <Field label="Total" value={order.commercial.total != null ? `₹${order.commercial.total.toLocaleString()}` : "—"} />
                <Field label="Paid" value={order.commercial.amountPaid != null ? `₹${order.commercial.amountPaid.toLocaleString()}` : "—"} />
                <Field label="Balance" value={order.commercial.balanceDue != null ? `₹${order.commercial.balanceDue.toLocaleString()}` : "—"} />
                <Field label="Payment Status" value={order.commercial.paymentStatus ?? "—"} />
              </div>
            ) : (
              <p className="text-[13px] text-[var(--text-muted)] text-center py-4">No commercial data available.</p>
            )}
          </Section>

          {/* Quick Actions */}
          <Section title="Quick Links">
            <div className="space-y-2">
              <button type="button" onClick={() => navigate("/admin/invoices")}
                className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                View Invoices →
              </button>
              <button type="button" onClick={() => navigate("/admin/production")}
                className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                Production Board →
              </button>
              <button type="button" onClick={() => navigate("/admin/rfqs")}
                className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                View RFQs →
              </button>
            </div>
          </Section>
        </div>
      </div>

      {/* ── Milestone Confirmation Modal ──────────────────── */}
      <ConfirmActionModal
        open={milestoneModal !== null}
        title={`Advance to ${milestoneModal?.label ?? ""}`}
        message="Optionally add a note that will be visible to the customer."
        placeholder="Customer-visible note (optional)"
        confirmLabel={`Advance to ${milestoneModal?.label ?? ""}`}
        cancelLabel="Cancel"
        onConfirm={confirmMilestoneAdvance}
        onCancel={() => setMilestoneModal(null)}
      />
    </div>
  );
}
