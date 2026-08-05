import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Package, Calendar, MapPin, FileText, Truck, CheckCircle2, Clock, Loader2, MessageSquare, Download, Upload, Plus, ChevronDown, ChevronUp, X, UserCog, UserPlus, Pencil, Trash2 } from "lucide-react";
import { engineerApi } from "../../api/engineerApi";
import { adminApi } from "../../api/adminApi";
import { apiDownload } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Roles } from "../../auth/roles";
import type { OrderDetail, InvoiceDetail, Shipment } from "../../api/customerApi";
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
  const { user } = useAuth();
  const isAdmin = !!user?.roles.includes(Roles.Admin);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [milestoneModal, setMilestoneModal] = useState<{ nextStatus: string; label: string } | null>(null);
  const [orderComments, setOrderComments] = useState<{authorRole: string; authorName: string | null; message: string; createdAtUtc: string}[]>([]);
  const [newOrderComment, setNewOrderComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // ── Invoice state ──
  const [orderInvoices, setOrderInvoices] = useState<any[]>([]);
  const [invDetail, setInvDetail] = useState<Record<string, InvoiceDetail | "loading">>({});
  const [invOpen, setInvOpen] = useState<Record<string, boolean>>({});
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoiceMsg, setInvoiceMsg] = useState<string | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: "",
    subtotal: "",
    tax: "",
    total: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
    paymentTerms: "",
    file: null as File | null,
  });

  // ── Document upload state ──
  const [showDocModal, setShowDocModal] = useState(false);
  const [docBusy, setDocBusy] = useState(false);
  const [docMsg, setDocMsg] = useState<string | null>(null);
  const [docCategory, setDocCategory] = useState("Inspection Report");
  const [docFile, setDocFile] = useState<File | null>(null);

  // ── Engineer assignment state ──
  const [engineers, setEngineers] = useState<{ id: string; fullName: string | null; email: string; role: string }[]>([]);
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  // ── Shipment creation state ──
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentBusy, setShipmentBusy] = useState(false);
  const [shipmentMsg, setShipmentMsg] = useState<string | null>(null);
  const [shipmentForm, setShipmentForm] = useState({
    transporter: "",
    vehicleNumber: "",
    phoneNumber: "",
    dispatchDate: "",
    eta: "",
  });
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [deletingShipment, setDeletingShipment] = useState<Shipment | null>(null);

  async function handlePostOrderComment() {
    if (!newOrderComment.trim() || postingComment) return;
    setPostingComment(true);
    try {
      await engineerApi.addOrderComment(id, newOrderComment.trim());
      setNewOrderComment("");
      engineerApi.getOrderComments(id).then(setOrderComments).catch(() => {});
    } catch {}
    setPostingComment(false);
  }

  // ── Invoice upload handler ──
  const ALLOWED_DOC_EXTENSIONS = [".pdf", ".dwg", ".dxf", ".step", ".stp", ".iges", ".igs", ".jpg", ".jpeg", ".png", ".zip"];

  function isAllowedFileType(file: File, allowed: string[]): boolean {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    return allowed.includes(ext);
  }

  async function handleUploadInvoice() {
    if (!invoiceForm.file || !invoiceForm.invoiceNumber || !invoiceForm.total || !invoiceForm.subtotal || !invoiceForm.tax) return;
    if (!isAllowedFileType(invoiceForm.file, [".pdf"])) {
      setInvoiceMsg("❌ Only PDF files are allowed for invoices.");
      return;
    }
    setInvoiceBusy(true);
    setInvoiceMsg(null);
    try {
      const result = await adminApi.uploadOrderInvoice(id, {
        invoiceNumber: invoiceForm.invoiceNumber,
        subtotal: Number(invoiceForm.subtotal),
        tax: Number(invoiceForm.tax),
        total: Number(invoiceForm.total),
        issueDate: new Date(invoiceForm.issueDate).toISOString(),
        dueDate: invoiceForm.dueDate ? new Date(invoiceForm.dueDate).toISOString() : undefined,
        notes: invoiceForm.notes || undefined,
        paymentTerms: invoiceForm.paymentTerms || undefined,
        file: invoiceForm.file,
      });
      setInvoiceMsg(`✅ Invoice ${result.invoiceNumber} uploaded and sent to customer.`);
      setShowInvoiceModal(false);
      setInvoiceForm({
        invoiceNumber: "", subtotal: "", tax: "", total: "",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: "", notes: "", paymentTerms: "", file: null,
      });
      // Refresh invoices
      adminApi.orderInvoices(id).then(setOrderInvoices).catch(() => {});
    } catch {
      setInvoiceMsg("❌ Failed to upload invoice. Please try again.");
    } finally {
      setInvoiceBusy(false);
    }
  }

  // ── Expandable invoice detail handler ──
  function toggleInvDetail(invId: string) {
    setInvOpen((p) => ({ ...p, [invId]: !p[invId] }));
    if (!invDetail[invId]) {
      setInvDetail((p) => ({ ...p, [invId]: "loading" }));
      adminApi.invoice(invId)
        .then((d) => setInvDetail((p) => ({ ...p, [invId]: d })))
        .catch(() => {});
    }
  }

  // ── Document upload handler ──
  async function handleUploadDocument() {
    if (!docFile) return;
    if (!isAllowedFileType(docFile, ALLOWED_DOC_EXTENSIONS)) {
      setDocMsg("❌ Unsupported file format. Allowed: PDF, DWG, DXF, STEP, STP, IGES, IGS, JPG, PNG, ZIP.");
      return;
    }
    setDocBusy(true);
    setDocMsg(null);
    try {
      await engineerApi.uploadOrderDocument(id, docFile, docCategory);
      setDocMsg(`✅ ${docCategory} uploaded successfully.`);
      setShowDocModal(false);
      setDocFile(null);
      setDocCategory("Inspection Report");
      // Refresh order to show new document
      const o = await engineerApi.order(id);
      setOrder(o);
    } catch {
      setDocMsg("❌ Failed to upload document.");
    } finally {
      setDocBusy(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    engineerApi.order(id)
      .then((o) => setOrder(o))
      .catch((e) => setError(e.message ?? "Order not found"))
      .finally(() => setLoading(false));
    engineerApi.getOrderComments(id).then(setOrderComments).catch(() => {});
    adminApi.orderInvoices(id).then(setOrderInvoices).catch(() => {});
  }, [id]);

  // Load engineer list (admins only) for the assignment dropdown.
  useEffect(() => {
    if (!isAdmin || !id) return;
    adminApi.users()
      .then((users) => setEngineers(users.filter((u) => u.role === Roles.Engineer)))
      .catch(() => {});
  }, [isAdmin, id]);

  async function handleAssign(assignedToUserId: string | null) {
    setAssignBusy(true);
    setAssignMsg(null);
    try {
      await adminApi.assignOrder(id, assignedToUserId);
      const o = await engineerApi.order(id);
      setOrder(o);
      setAssignMsg(assignedToUserId ? "Order assigned to engineer." : "Order unassigned.");
    } catch {
      setAssignMsg("Could not update assignment.");
    } finally { setAssignBusy(false); }
  }

  function openAddShipment() {
    setEditingShipment(null);
    setShipmentMsg(null);
    setShipmentForm({ transporter: "", vehicleNumber: "", phoneNumber: "", dispatchDate: "", eta: "" });
    setShowShipmentModal(true);
  }

  function openEditShipment(s: Shipment) {
    setEditingShipment(s);
    setShipmentMsg(null);
    setShipmentForm({
      transporter: s.transporter ?? "",
      vehicleNumber: s.vehicleNumber ?? "",
      phoneNumber: s.phoneNumber ?? "",
      dispatchDate: s.dispatchDateUtc ? s.dispatchDateUtc.slice(0, 10) : "",
      eta: s.estimatedArrivalUtc ? s.estimatedArrivalUtc.slice(0, 10) : "",
    });
    setShowShipmentModal(true);
  }

  async function handleSaveShipment() {
    if (!shipmentForm.transporter.trim() && !shipmentForm.vehicleNumber.trim() && !shipmentForm.phoneNumber.trim()) {
      setShipmentMsg("Enter at least a transporter, a vehicle number, or a phone number.");
      return;
    }
    const transporter = shipmentForm.transporter.trim() || undefined;
    const vehicleNumber = shipmentForm.vehicleNumber.trim() || undefined;
    const phoneNumber = shipmentForm.phoneNumber.trim() || undefined;
    const dispatchDateUtc = shipmentForm.dispatchDate ? new Date(shipmentForm.dispatchDate).toISOString() : undefined;
    const estimatedArrivalUtc = shipmentForm.eta ? new Date(shipmentForm.eta).toISOString() : undefined;
    setShipmentBusy(true);
    setShipmentMsg(null);
    try {
      if (editingShipment) {
        await engineerApi.updateShipment(id, editingShipment.id, transporter, vehicleNumber, phoneNumber, dispatchDateUtc, estimatedArrivalUtc);
        setActionMsg("Shipment updated.");
      } else {
        await engineerApi.createShipment(id, transporter, vehicleNumber, phoneNumber, dispatchDateUtc, estimatedArrivalUtc);
        setActionMsg("Shipment created.");
      }
      setShowShipmentModal(false);
      setEditingShipment(null);
      setShipmentForm({ transporter: "", vehicleNumber: "", phoneNumber: "", dispatchDate: "", eta: "" });
      const o = await engineerApi.order(id);
      setOrder(o);
    } catch {
      setShipmentMsg(editingShipment ? "Could not update shipment." : "Could not create shipment.");
    } finally { setShipmentBusy(false); }
  }

  async function handleDeleteShipment() {
    if (!deletingShipment) return;
    setShipmentBusy(true);
    try {
      await engineerApi.deleteShipment(id, deletingShipment.id);
      setDeletingShipment(null);
      setActionMsg("Shipment deleted.");
      const o = await engineerApi.order(id);
      setOrder(o);
    } catch {
      setActionMsg("Could not delete shipment.");
    } finally { setShipmentBusy(false); }
  }

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
      await engineerApi.updateMilestone(id, milestoneModal.nextStatus, customerMsg);
      const o = await engineerApi.order(id);
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
          {order.quotationId && (
            <Link to={`/admin/quotations/${order.quotationId}`}
              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] text-[12px] font-medium hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all no-underline hover:no-underline">
              <FileText size={13} /> View Quote
            </Link>
          )}
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
                      <Field label="Vehicle #" value={s.vehicleNumber ?? "—"} icon={Truck} />
                      <Field label="Phone" value={s.phoneNumber ?? "—"} icon={Truck} />
                      <Field label="Dispatch Date" value={formatDate(s.dispatchDateUtc)} icon={Calendar} />
                      <Field label="ETA" value={formatDate(s.estimatedArrivalUtc)} icon={Clock} />
                      <Field label="Delivered" value={formatDate(s.deliveredAtUtc)} icon={CheckCircle2} />
                      <Field label="Proof of Delivery" value={s.hasProofOfDelivery ? "Available" : "Not available"} />
                    </div>
                    <div className="mt-3 pt-3 border-t border-[var(--border-default)] flex items-center gap-2">
                      <button type="button" onClick={() => openEditShipment(s)}
                        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all">
                        <Pencil size={13} /> Edit
                      </button>
                      <button type="button" onClick={() => setDeletingShipment(s)}
                        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 text-[12px] font-medium hover:bg-red-500/10 transition-all">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={openAddShipment}
                className="mt-4 w-full flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg border border-dashed border-[var(--border-default)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all">
                <Truck size={14} /> Add Shipment
              </button>
            </Section>
          )}

          {/* No shipments yet */}
          {order.shipments.length === 0 && (
            <Section title="Shipments">
              <p className="text-[13px] text-[var(--text-muted)] text-center py-2">No shipments recorded yet.</p>
              <button type="button" onClick={openAddShipment}
                className="w-full flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg border border-dashed border-[var(--border-default)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all">
                <Truck size={14} /> Add Shipment
              </button>
            </Section>
          )}

          {/* Documents */}
          <Section title={`Documents (${order.documents?.length ?? 0})`}>
            {order.documents && order.documents.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {order.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] p-3.5 hover:bg-[var(--bg-surface-hover)] transition-all">
                      <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] shrink-0">
                        <FileText size={18} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-[var(--text-primary)] truncate">{doc.title || doc.fileName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)] shrink-0">{doc.category}</span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          {(doc.sizeBytes / 1024).toFixed(1)} KB · {formatDate(doc.createdAtUtc)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[13px] text-[var(--text-muted)] text-center py-3">No documents uploaded yet.</p>
            )}
            <button type="button" onClick={() => setShowDocModal(true)}
              className="w-full flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg border border-dashed border-[var(--border-default)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all">
              <Upload size={14} /> Upload Document
            </button>
          </Section>

          {/* Invoices */}
          <Section title={`Invoices (${orderInvoices.length})`}>
            {orderInvoices.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[13px] text-[var(--text-muted)] mb-3">No invoices uploaded yet.</p>
                <button type="button" onClick={() => setShowInvoiceModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] transition-all">
                  <Upload size={14} /> Upload Invoice
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {orderInvoices.map((inv) => {
                  const open = !!invOpen[inv.id];
                  const det = invDetail[inv.id];
                  return (
                    <div key={inv.id} className="rounded-xl border border-[var(--border-default)] overflow-hidden">
                      <button type="button" onClick={() => toggleInvDetail(inv.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-surface-hover)] transition-all">
                        <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                          <FileText size={18} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-[var(--text-primary)]">{inv.invoiceNumber}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              inv.status === "Issued" ? "bg-amber-500/10 text-amber-400" :
                              inv.status === "Paid" ? "bg-emerald-500/10 text-emerald-400" :
                              "bg-slate-500/10 text-slate-400"
                            }`}>{inv.status}</span>
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            ₹{inv.total.toLocaleString()} · Due {formatDate(inv.dueDateUtc)} · Balance ₹{inv.balanceDue.toLocaleString()}
                          </div>
                        </div>
                        <span className="text-[var(--text-muted)] shrink-0">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                      </button>

                      {open && (
                        <div className="px-4 pb-4 pt-1 border-t border-[var(--border-default)]">
                          {det === "loading" || det === undefined ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 size={18} className="animate-spin text-[var(--text-muted)]" />
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-3">
                              <div>
                                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Line items</h4>
                                {det.items.length === 0 ? (
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
                                      {det.items.map((it) => (
                                        <tr key={it.id} className="border-b border-[var(--border-default)] last:border-0">
                                          <td className="py-2 pr-3">{it.description}{it.hsnSacCode ? ` · HSN ${it.hsnSacCode}` : ""}</td>
                                          <td className="py-2 pr-3 text-right tabular-nums">{it.quantity} {it.unit}</td>
                                          <td className="py-2 pr-3 text-right tabular-nums">{it.unitPrice.toLocaleString()}</td>
                                          <td className="py-2 text-right tabular-nums font-medium">{it.lineTotal.toLocaleString()}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                              <div>
                                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Payments</h4>
                                {det.payments.length === 0 ? (
                                  <p className="text-[13px] text-[var(--text-muted)]">No payments recorded.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {det.payments.map((p) => (
                                      <div key={p.id} className="flex items-center justify-between rounded-lg border border-[var(--border-default)] px-3 py-2">
                                        <div>
                                          <div className="text-[13px] font-medium text-[var(--text-primary)]">₹{p.amount.toLocaleString()} · {p.method}</div>
                                          <div className="text-[11px] text-[var(--text-muted)]">Ref {p.paymentReference} · {formatDate(p.paymentDateUtc)}</div>
                                        </div>
                                        <span className="text-[11px] text-[var(--text-muted)]">{p.status}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 flex items-center gap-2">
                            {inv.hasPdf && (
                              <button type="button"
                                onClick={() => void apiDownload(adminApi.invoiceDownloadUrl(inv.id), `${inv.invoiceNumber}.pdf`)}
                                className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
                                <Download size={14} /> Download PDF
                              </button>
                            )}
                            <button type="button"
                              onClick={() => {
                                if (window.confirm(`Delete invoice ${inv.invoiceNumber}? This cannot be undone.`)) {
                                  adminApi.deleteInvoice(inv.id).then(() => adminApi.orderInvoices(id).then(setOrderInvoices)).catch(() => {});
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 text-[12px] font-medium hover:bg-red-500/10 transition-all">
                              Delete Invoice
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button type="button" onClick={() => setShowInvoiceModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg border border-dashed border-[var(--border-default)] text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all">
                  <Plus size={14} /> Upload Another Invoice
                </button>
              </div>
            )}
          </Section>
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

          {/* Assigned Engineer */}
          <Section title="Assigned Engineer">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] shrink-0">
                <UserCog size={16} />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{order.assignedToName ?? "Unassigned"}</div>
                <div className="text-[11px] text-[var(--text-muted)]">Engineer responsible for this order</div>
              </div>
            </div>
            {isAdmin && (
              <div>
                {assignMsg && (
                  <div className={`mb-2 text-[12px] font-medium ${assignMsg.includes("Could") ? "text-red-500" : "text-emerald-500"}`}>{assignMsg}</div>
                )}
                <div className="flex gap-2">
                  <select
                    value={order.assignedToUserId ?? ""}
                    onChange={(e) => handleAssign(e.target.value || null)}
                    disabled={assignBusy}
                    className="flex-1 h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-[12px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
                  >
                    <option value="">Unassigned</option>
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>{eng.fullName || eng.email}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={assignBusy}
                    onClick={() => handleAssign(null)}
                    title="Unassign"
                    aria-label="Unassign"
                    className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all shrink-0 disabled:opacity-50"
                  >
                    {assignBusy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  </button>
                </div>
              </div>
            )}
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
              <button type="button" onClick={() => setShowInvoiceModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
                <Upload size={14} /> Send Invoice to Customer
              </button>
              <button type="button" onClick={() => navigate("/admin/invoices")}
                className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                View All Invoices →
              </button>
              <button type="button" onClick={() => navigate("/admin/production")}
                className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                Production Board →
              </button>
              <button type="button" onClick={() => navigate("/admin/enquiries")}
                className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                View Enquiries →
              </button>
            </div>
          </Section>
        </div>
      </div>

      {/* ── Comments ──────────────────── */}
      <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center gap-2.5 bg-[var(--bg-surface)]/50">
          <MessageSquare size={15} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">Activity &amp; Comments</h3>
        </div>
        <div className="p-5">
          {orderComments.length === 0 && <p className="text-[13px] text-[var(--text-muted)] mb-4">No comments yet.</p>}
          <div className="space-y-4 mb-4">
            {orderComments.map((co, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[11px] font-bold text-[var(--color-primary)] shrink-0 mt-0.5">{(co.authorName || co.authorRole || "?").charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-semibold text-[var(--text-primary)]">{co.authorName || co.authorRole || "Staff"}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)]">{co.authorRole}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{formatDateTime(co.createdAtUtc)}</span>
                  </div>
                  <p className="text-[13px] text-[var(--text-secondary)] mt-1 m-0 break-words whitespace-pre-wrap">{co.message}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={newOrderComment} onChange={(e) => setNewOrderComment(e.target.value)}
              placeholder="Add a comment..." onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handlePostOrderComment(); } }}
              className="flex-1 h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
            <button onClick={handlePostOrderComment} disabled={!newOrderComment.trim() || postingComment}
              className="px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all">Send</button>
          </div>
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

      {/* ── Invoice Upload Modal ─────────────────────────── */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => { setShowInvoiceModal(false); setInvoiceMsg(null); }} />
          <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 shrink-0 mt-1">
                  <Upload size={22} />
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-[var(--text-primary)] m-0">Send Invoice to Customer</h3>
                  <p className="text-[12px] text-[var(--text-muted)] m-0 mt-1 leading-relaxed">
                    Upload the invoice PDF. It will be visible to the customer in their portal immediately.
                  </p>
                </div>
              </div>

              {invoiceMsg && (
                <div className={`mb-4 px-4 py-2.5 rounded-xl text-[13px] font-medium ${
                  invoiceMsg.includes("✅") ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                }`}>{invoiceMsg}</div>
              )}

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Invoice number */}
                <div>
                  <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Invoice Number *</label>
                  <input type="text" value={invoiceForm.invoiceNumber} onChange={(e) => setInvoiceForm(f => ({ ...f, invoiceNumber: e.target.value }))}
                    placeholder="e.g. INV-20260729-001"
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
                </div>

                {/* Financial fields */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Subtotal *</label>
                    <input type="number" value={invoiceForm.subtotal} onChange={(e) => setInvoiceForm(f => ({ ...f, subtotal: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Tax *</label>
                    <input type="number" value={invoiceForm.tax} onChange={(e) => setInvoiceForm(f => ({ ...f, tax: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Total *</label>
                    <input type="number" value={invoiceForm.total} onChange={(e) => setInvoiceForm(f => ({ ...f, total: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Issue Date *</label>
                    <input type="date" value={invoiceForm.issueDate} onChange={(e) => setInvoiceForm(f => ({ ...f, issueDate: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Due Date</label>
                    <input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  </div>
                </div>

                {/* Payment terms */}
                <div>
                  <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Payment Terms</label>
                  <input type="text" value={invoiceForm.paymentTerms} onChange={(e) => setInvoiceForm(f => ({ ...f, paymentTerms: e.target.value }))}
                    placeholder="e.g. 30 days"
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Notes</label>
                  <textarea value={invoiceForm.notes} onChange={(e) => setInvoiceForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    placeholder="Optional notes for the customer"
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] resize-none" />
                </div>

                {/* File upload */}
                <div>
                  <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Invoice PDF *</label>
                  <input type="file" accept=".pdf,application/pdf" onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setInvoiceForm(prev => ({ ...prev, file: f }));
                  }}
                    className="w-full text-[13px] text-[var(--text-primary)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20 file:cursor-pointer" />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">Supported: <strong>PDF</strong> only</p>
                </div>
              </div>

              <div className="border-t border-[var(--border-default)] my-4" />
              <div className="flex items-center justify-end gap-2.5">
                <button type="button" disabled={invoiceBusy} onClick={() => { setShowInvoiceModal(false); setInvoiceMsg(null); }}
                  className="px-4 h-9 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" disabled={invoiceBusy || !invoiceForm.file || !invoiceForm.invoiceNumber || !invoiceForm.total}
                  onClick={handleUploadInvoice}
                  className="px-5 h-9 rounded-xl bg-emerald-500 text-white text-[12px] font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm">
                  {invoiceBusy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {invoiceBusy ? "Uploading..." : "Upload & Send to Customer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Upload Modal ────────────────────────── */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => { setShowDocModal(false); setDocMsg(null); }} />
          <div className="relative w-full max-w-md mx-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-400" />
            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 shrink-0 mt-1">
                  <FileText size={22} />
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-[var(--text-primary)] m-0">Upload Document</h3>
                  <p className="text-[12px] text-[var(--text-muted)] m-0 mt-1 leading-relaxed">
                    Upload inspection reports, certificates, packing lists, or other order documents.
                  </p>
                </div>
              </div>

              {docMsg && (
                <div className={`mb-4 px-4 py-2.5 rounded-xl text-[13px] font-medium ${
                  docMsg.includes("✅") ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                }`}>{docMsg}</div>
              )}

              <div className="space-y-4">
                {/* Category */}
                <div>
                  <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Document Type *</label>
                  <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
                    <option value="Inspection Report">Inspection Report</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Packing List">Packing List</option>
                    <option value="Delivery Challan">Delivery Challan</option>
                    <option value="Drawing">Drawing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* File */}
                <div>
                  <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">File *</label>
                  <input type="file" accept=".pdf,.dwg,.dxf,.step,.stp,.iges,.igs,.jpg,.jpeg,.png,.zip" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                    className="w-full text-[13px] text-[var(--text-primary)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[12px] file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20 file:cursor-pointer" />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">Supported: <strong>PDF, DWG, DXF, STEP, STP, IGES, IGS, JPG, PNG, ZIP</strong></p>
                </div>

                <p className="text-[11px] text-[var(--text-muted)]">
                  Uploaded documents are visible to the customer in their portal.
                </p>
              </div>

              <div className="border-t border-[var(--border-default)] my-4" />
              <div className="flex items-center justify-end gap-2.5">
                <button type="button" disabled={docBusy} onClick={() => { setShowDocModal(false); setDocMsg(null); }}
                  className="px-4 h-9 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" disabled={docBusy || !docFile} onClick={handleUploadDocument}
                  className="px-5 h-9 rounded-xl bg-blue-500 text-white text-[12px] font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm">
                  {docBusy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {docBusy ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Shipment Creation Modal ──────────────────────── */}
      {showShipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => { setShowShipmentModal(false); setEditingShipment(null); setShipmentMsg(null); }} />
          <div className="relative w-full max-w-md mx-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="h-1.5 bg-gradient-to-r from-teal-500 to-teal-400" />
            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-500 shrink-0 mt-1">
                  <Truck size={22} />
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-[var(--text-primary)] m-0">{editingShipment ? "Edit Shipment" : "Add Shipment"}</h3>
                  <p className="text-[12px] text-[var(--text-muted)] m-0 mt-1 leading-relaxed">
                    {editingShipment ? "Update the dispatch details for this order." : "Record the dispatch details for this order."}
                  </p>
                </div>
                <button type="button" onClick={() => { setShowShipmentModal(false); setEditingShipment(null); }} className="ml-auto bg-[var(--bg-surface)] rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0">
                  <X size={16} />
                </button>
              </div>

              {shipmentMsg && (
                <div className={`mb-4 px-4 py-2.5 rounded-xl text-[13px] font-medium ${
                  shipmentMsg.includes("Could") ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                }`}>{shipmentMsg}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Transporter</label>
                  <input type="text" value={shipmentForm.transporter} onChange={(e) => setShipmentForm(f => ({ ...f, transporter: e.target.value }))}
                    placeholder="e.g. XYZ Transport Co."
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Vehicle Number</label>
                    <input type="text" value={shipmentForm.vehicleNumber} onChange={(e) => setShipmentForm(f => ({ ...f, vehicleNumber: e.target.value }))}
                      placeholder="e.g. PB10 AB 1234"
                      className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Phone Number</label>
                    <input type="tel" value={shipmentForm.phoneNumber} onChange={(e) => setShipmentForm(f => ({ ...f, phoneNumber: e.target.value }))}
                      placeholder="e.g. +91 98xxx xxxxx"
                      className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Dispatch Date</label>
                    <input type="date" value={shipmentForm.dispatchDate} onChange={(e) => setShipmentForm(f => ({ ...f, dispatchDate: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1">Estimated Arrival</label>
                    <input type="date" value={shipmentForm.eta} onChange={(e) => setShipmentForm(f => ({ ...f, eta: e.target.value }))}
                      className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]" />
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">Enter at least a transporter, a vehicle number, or a phone number.</p>
              </div>

              <div className="border-t border-[var(--border-default)] my-4" />
              <div className="flex items-center justify-end gap-2.5">
                <button type="button" disabled={shipmentBusy} onClick={() => { setShowShipmentModal(false); setShipmentMsg(null); }}
                  className="px-4 h-9 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" disabled={shipmentBusy} onClick={handleSaveShipment}
                  className="px-5 h-9 rounded-xl bg-teal-500 text-white text-[12px] font-semibold hover:bg-teal-600 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm">
                  {shipmentBusy ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                  {shipmentBusy ? "Saving..." : editingShipment ? "Update Shipment" : "Add Shipment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Shipment Confirmation Modal ─────────────── */}
      {deletingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setDeletingShipment(null)} />
          <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-400" />
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <span className="flex items-center justify-center w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 shrink-0 mt-1">
                  <Trash2 size={20} />
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-[var(--text-primary)] m-0">Delete Shipment?</h3>
                  <p className="text-[12px] text-[var(--text-muted)] m-0 mt-1 leading-relaxed">
                    This will permanently remove the {deletingShipment.transporter ? `"${deletingShipment.transporter}" ` : ""}dispatch record. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5">
                <button type="button" disabled={shipmentBusy} onClick={() => setDeletingShipment(null)}
                  className="px-4 h-9 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" disabled={shipmentBusy} onClick={handleDeleteShipment}
                  className="px-5 h-9 rounded-xl bg-red-500 text-white text-[12px] font-semibold hover:bg-red-600 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm">
                  {shipmentBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {shipmentBusy ? "Deleting..." : "Delete Shipment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
