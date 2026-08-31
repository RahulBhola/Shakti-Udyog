import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Package, Calendar, MapPin, FileText, Truck, CheckCircle2, Clock,
  Loader2, MessageSquare, Download, Upload, ChevronDown, ChevronUp, X, UserCog,
  Pencil, Trash2, Layers, Flame, ShieldCheck, PackageCheck, Sparkles, RefreshCw,
  Lock, Copy, Check, ExternalLink, Building2, Phone, AlertTriangle, CreditCard,
  Receipt, Send, ChevronRight
} from "lucide-react";
import { engineerApi } from "../../api/engineerApi";
import { adminApi } from "../../api/adminApi";
import { apiDownload } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Roles } from "../../auth/roles";
import { connectRealtime, getRealtimeConnection, type StageChangedPayload } from "../../realtime/signalR";
import type { OrderDetail, InvoiceDetail, Shipment } from "../../api/customerApi";
import { ConfirmActionModal } from "./orders/ConfirmModal";

/* ── Avatar Palette & Helpers ────────────────────────────────────────── */

const AVATAR_PALETTES = [
  { bg: "rgba(59,130,246,0.15)", fg: "#3B82F6", border: "rgba(59,130,246,0.3)" },
  { bg: "rgba(168,85,247,0.15)", fg: "#A855F7", border: "rgba(168,85,247,0.3)" },
  { bg: "rgba(20,184,166,0.15)", fg: "#14B8A6", border: "rgba(20,184,166,0.3)" },
  { bg: "rgba(249,115,22,0.15)", fg: "#F97316", border: "rgba(249,115,22,0.3)" },
  { bg: "rgba(236,72,153,0.15)", fg: "#EC4899", border: "rgba(236,72,153,0.3)" },
  { bg: "rgba(34,197,94,0.15)", fg: "#22C55E", border: "rgba(34,197,94,0.3)" },
];

function getAvatarStyle(identifier: string) {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

function initials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
  }
  if (email && email.trim()) {
    return email.charAt(0).toUpperCase();
  }
  return "?";
}

/* ── Copy to Clipboard Button Component ──────────────────────────────── */

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={label || "Copy to clipboard"}
      className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors inline-flex items-center gap-1 cursor-pointer"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      {copied && <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>}
    </button>
  );
}

/* ── Status Badge ────────────────────────────────────────────────────── */

const statusConfig: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  pending_advance: { label: "Pending Advance", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", dot: "bg-amber-500" },
  awaiting_approval: { label: "Awaiting Approval", bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20", dot: "bg-purple-500" },
  advance_paid: { label: "Advance Paid", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-500" },
  confirmed: { label: "Confirmed", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-500" },
  pattern_development: { label: "Pattern Dev.", bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20", dot: "bg-purple-500" },
  production: { label: "In Production", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20", dot: "bg-blue-500" },
  quality_check: { label: "Quality Check", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", dot: "bg-amber-500" },
  packed: { label: "Packed", bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400", border: "border-teal-500/20", dot: "bg-teal-500" },
  ready_to_dispatch: { label: "Ready to Dispatch", bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-500/20", dot: "bg-cyan-500" },
  dispatched: { label: "Dispatched", bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20", dot: "bg-indigo-500" },
  delivered: { label: "Delivered", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-500" },
  on_hold: { label: "On Hold", bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-500/20", dot: "bg-yellow-500" },
  cancelled: { label: "Cancelled", bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-500/20", dot: "bg-red-500" },
};

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const cfg = statusConfig[status] ?? {
    label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    bg: "bg-neutral-500/10",
    text: "text-neutral-600 dark:text-neutral-400",
    border: "border-neutral-500/20",
    dot: "bg-neutral-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} shadow-xs`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      <span>{label ?? cfg.label}</span>
    </span>
  );
}

/* ── Date formatting helpers ─────────────────────────────────────────── */

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatShortDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── 5 Core Manufacturing Workflow Stages ────────────────────────────── */

const WORKFLOW = [
  { key: "pattern_development", label: "Pattern Dev.", icon: Layers, desc: "Tooling & CAD Design" },
  { key: "production", label: "Production", icon: Flame, desc: "Foundry Moulding & Pouring" },
  { key: "quality_check", label: "QC Inspection", icon: ShieldCheck, desc: "Dimensional & CMM QA" },
  { key: "packed", label: "Packaging", icon: PackageCheck, desc: "Wooden Crate Packing" },
  { key: "ready_to_dispatch", label: "Ready to Dispatch", icon: Truck, desc: "Staged for Logistics" },
];

/* ── Section Card Component ──────────────────────────────────────────── */

function SectionCard({
  title,
  icon: Icon,
  badge,
  action,
  children,
}: {
  title: string;
  icon?: any;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs overflow-hidden transition-all">
      <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between gap-3 bg-neutral-50/50 dark:bg-white/[0.01]">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Icon size={15} />
            </div>
          )}
          <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white tracking-tight truncate m-0">
            {title}
          </h3>
          {badge}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── Info Field Helper ───────────────────────────────────────────────── */

function InfoField({
  label,
  value,
  icon: Icon,
  copyable,
}: {
  label: string;
  value: string | React.ReactNode;
  icon?: any;
  copyable?: boolean;
}) {
  const isString = typeof value === "string";
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && (
        <div className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-white/5 flex items-center justify-center text-neutral-500 dark:text-neutral-400 shrink-0 mt-0.5">
          <Icon size={13} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
          {label}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs sm:text-[13px] text-neutral-800 dark:text-neutral-200 font-semibold break-words">
            {value}
          </span>
          {copyable && isString && value !== "—" && (
            <CopyButton text={value as string} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Admin Order Detail Page Component ───────────────────────────── */

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
  const [orderComments, setOrderComments] = useState<{ authorRole: string; authorName: string | null; message: string; createdAtUtc: string }[]>([]);
  const [newOrderComment, setNewOrderComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // ── Invoice state ──
  const [orderInvoices, setOrderInvoices] = useState<any[]>([]);
  const [invDetail, setInvDetail] = useState<Record<string, InvoiceDetail | "loading">>({});
  const [invOpen, setInvOpen] = useState<Record<string, boolean>>({});
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoiceMsg, setInvoiceMsg] = useState<string | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState<any | null>(null);

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

  // ── Shipment creation & delete state ──
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

  // ── Auto-fetch quotation details for invoice ──
  async function openSendInvoiceModal() {
    setInvoiceMsg(null);
    setShowInvoiceModal(true);

    const genNum = `INV-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, "0")}${new Date().getDate().toString().padStart(2, "0")}-${order?.orderNumber ? order.orderNumber.replace(/[^a-zA-Z0-9]/g, "").slice(-4) : "001"}`;
    const todayStr = new Date().toISOString().split("T")[0];

    const termsStr = order?.paymentTerms || "30 days";
    const daysMatch = termsStr.match(/(\d+)\s*days?/i);
    const termDays = daysMatch ? parseInt(daysMatch[1], 10) : 30;
    const due = new Date();
    due.setDate(due.getDate() + termDays);
    const dueStr = due.toISOString().split("T")[0];

    let subtotalVal = order?.quotationSubtotal || 0;
    let taxVal = order?.quotationTax || 0;
    let totalVal = order?.quotationTotal || order?.commercial?.total || 0;
    let quoteTerms = order?.paymentTerms || termsStr;

    if (totalVal > 0 && subtotalVal === 0) {
      subtotalVal = Number((totalVal / 1.18).toFixed(2));
      taxVal = Number((totalVal - subtotalVal).toFixed(2));
    } else if (subtotalVal > 0 && totalVal === 0) {
      taxVal = Number((subtotalVal * 0.18).toFixed(2));
      totalVal = Number((subtotalVal + taxVal).toFixed(2));
    } else if (subtotalVal > 0 && totalVal > 0 && taxVal === 0) {
      taxVal = Number((totalVal - subtotalVal).toFixed(2));
    }

    setInvoiceForm({
      invoiceNumber: genNum,
      subtotal: subtotalVal > 0 ? String(subtotalVal) : "",
      tax: taxVal >= 0 ? String(taxVal) : "",
      total: totalVal > 0 ? String(totalVal) : "",
      issueDate: todayStr,
      dueDate: dueStr,
      paymentTerms: quoteTerms,
      notes: "",
      file: null,
    });

    if (order?.quotationId) {
      setFetchingPrice(true);
      try {
        const q = await adminApi.quotation(order.quotationId);
        if (q) {
          const qSub = q.subtotal || (q.total ? Number((q.total / 1.18).toFixed(2)) : 0);
          const qTx = q.tax || (q.total ? Number((q.total - qSub).toFixed(2)) : 0);
          const qTot = q.total || (qSub + qTx);

          setInvoiceForm((prev) => ({
            ...prev,
            subtotal: String(qSub),
            tax: String(qTx),
            total: String(qTot),
            paymentTerms: q.paymentTerms || prev.paymentTerms,
          }));
        }
      } catch {
        // use already populated values
      } finally {
        setFetchingPrice(false);
      }
    }
  }

  // ── Load order and comments ──
  const loadOrder = useCallback(() => {
    if (!id) return;
    engineerApi.order(id)
      .then((o) => {
        setOrder(o);
        setError(null);
      })
      .catch((e) => setError(e.message ?? "Order not found"))
      .finally(() => setLoading(false));
    engineerApi.getOrderComments(id).then(setOrderComments).catch(() => {});
    adminApi.orderInvoices(id).then(setOrderInvoices).catch(() => {});
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadOrder();
  }, [loadOrder]);

  // Realtime SignalR sync
  useEffect(() => {
    void connectRealtime();
    const conn = getRealtimeConnection();
    const handler = (p: StageChangedPayload) => {
      if (p.orderId === id) {
        loadOrder();
      }
    };
    conn.on("stageChanged", handler);
    return () => {
      conn.off("stageChanged", handler);
    };
  }, [id, loadOrder]);

  // Load engineers list for assignment
  useEffect(() => {
    if (!isAdmin || !id) return;
    adminApi.users()
      .then((users) => setEngineers(users.filter((u) => u.role === Roles.Engineer)))
      .catch(() => {});
  }, [isAdmin, id]);

  // ── Handlers ──
  async function handleAssign(assignedToUserId: string | null) {
    setAssignBusy(true);
    setAssignMsg(null);
    try {
      await adminApi.assignOrder(id, assignedToUserId);
      const o = await engineerApi.order(id);
      setOrder(o);
      setAssignMsg(assignedToUserId ? "✅ Staff assigned successfully." : "✅ Order unassigned.");
    } catch {
      setAssignMsg("❌ Could not update assignment.");
    } finally {
      setAssignBusy(false);
    }
  }

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
      adminApi.orderInvoices(id).then(setOrderInvoices).catch(() => {});
    } catch {
      setInvoiceMsg("❌ Failed to upload invoice. Please try again.");
    } finally {
      setInvoiceBusy(false);
    }
  }

  function toggleInvDetail(invId: string) {
    setInvOpen((p) => ({ ...p, [invId]: !p[invId] }));
    if (!invDetail[invId]) {
      setInvDetail((p) => ({ ...p, [invId]: "loading" }));
      adminApi.invoice(invId)
        .then((d) => setInvDetail((p) => ({ ...p, [invId]: d })))
        .catch(() => {});
    }
  }

  async function handleDeleteInvoiceConfirm() {
    if (!deletingInvoice) return;
    setInvoiceBusy(true);
    try {
      await adminApi.deleteInvoice(deletingInvoice.id);
      setDeletingInvoice(null);
      setActionMsg(`Invoice ${deletingInvoice.invoiceNumber} deleted successfully.`);
      adminApi.orderInvoices(id).then(setOrderInvoices).catch(() => {});
    } catch {
      setActionMsg("Could not delete invoice.");
    } finally {
      setInvoiceBusy(false);
    }
  }

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
      const o = await engineerApi.order(id);
      setOrder(o);
    } catch {
      setDocMsg("❌ Failed to upload document.");
    } finally {
      setDocBusy(false);
    }
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
    } finally {
      setShipmentBusy(false);
    }
  }

  async function handleDeleteShipmentConfirm() {
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
    } finally {
      setShipmentBusy(false);
    }
  }

  // Milestone transitions
  const handleAdvanceMilestone = () => {
    const STAGES = ["pattern_development", "production", "quality_check", "packed", "ready_to_dispatch"];
    const curStage = order!.manufacturingStage ?? (STAGES.includes(order!.status) ? order!.status : "pattern_development");
    const currentIdx = STAGES.indexOf(curStage);
    if (currentIdx < 0 || currentIdx >= STAGES.length - 1) return;
    const nextStatus = STAGES[currentIdx + 1];
    setMilestoneModal({
      nextStatus,
      label: nextStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    });
  };

  const handleRegressMilestone = () => {
    const STAGES = ["pattern_development", "production", "quality_check", "packed", "ready_to_dispatch"];
    const curStage = order!.manufacturingStage ?? (STAGES.includes(order!.status) ? order!.status : "pattern_development");
    const currentIdx = STAGES.indexOf(curStage);
    if (currentIdx <= 0) return;
    const nextStatus = STAGES[currentIdx - 1];
    setMilestoneModal({
      nextStatus,
      label: nextStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    });
  };

  const handleJumpToMilestone = (targetStatus: string) => {
    if (order?.manufacturingStage === targetStatus || order?.status === targetStatus) return;
    setMilestoneModal({
      nextStatus: targetStatus,
      label: targetStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    });
  };

  const confirmMilestoneAdvance = async (customerMsg?: string) => {
    if (!milestoneModal) return;
    const targetStatus = milestoneModal.nextStatus;
    setMilestoneModal(null);
    setActionBusy(true);
    setActionMsg(null);
    try {
      await engineerApi.updateMilestone(id, targetStatus, customerMsg);
      const o = await engineerApi.order(id);
      setOrder(o);
      setActionMsg(`Status updated to ${milestoneModal.label}`);
    } catch {
      setActionMsg("Failed to update status.");
    } finally {
      setActionBusy(false);
    }
  };

  // ── Summary metrics calculation ──
  const summaryMetrics = useMemo(() => {
    if (!order) return { totalOrdered: 0, totalProduced: 0, totalDispatched: 0, progressPct: 0 };
    const totalOrdered = order.items.reduce((acc, it) => acc + (it.quantityOrdered || 0), 0);
    const totalProduced = order.items.reduce((acc, it) => acc + (it.quantityProduced || 0), 0);
    const totalDispatched = order.items.reduce((acc, it) => acc + (it.quantityDispatched || 0), 0);
    const progressPct = totalOrdered > 0 ? Math.min(100, Math.round((totalProduced / totalOrdered) * 100)) : 0;
    return { totalOrdered, totalProduced, totalDispatched, progressPct };
  }, [order]);

  // ── Loading Screen ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--color-primary)]/10 animate-ping absolute" />
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#0f121a] border border-neutral-200 dark:border-white/10 shadow-xl flex items-center justify-center">
            <Loader2 size={26} className="animate-spin text-[var(--color-primary)]" />
          </div>
        </div>
        <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">Loading order dossier...</p>
      </div>
    );
  }

  // ── Error Screen ──
  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center mb-4 shadow-sm">
          <AlertTriangle size={28} />
        </div>
        <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-1">Order Not Found</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 text-center max-w-md">
          {error ?? "The order you're looking for doesn't exist or has been removed from the system."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/admin/orders")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a] text-xs font-extrabold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Orders
        </button>
      </div>
    );
  }

  const STAGES = ["pattern_development", "production", "quality_check", "packed", "ready_to_dispatch"];
  const currentStageKey = order.manufacturingStage ?? (STAGES.includes(order.status) ? order.status : (order.status === "dispatched" || order.status === "delivered" ? "ready_to_dispatch" : "pattern_development"));
  const currentIndex = STAGES.indexOf(currentStageKey);
  const isTerminal = ["cancelled", "delivered", "closed", "returned"].includes(order.status);
  const assignedStaffPalette = getAvatarStyle(order.assignedToName || order.assignedToUserId || "Staff");

  return (
    <div className="space-y-6 pb-12">
      {/* ── Breadcrumb & Sticky Top Control Header ───────────────────────── */}
      <div className="sticky top-0 z-20 -mx-6 -mt-6 px-6 py-4 bg-white/80 dark:bg-[#0c0f17]/80 backdrop-blur-xl border-b border-neutral-200/90 dark:border-white/10 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Breadcrumbs & Identifier */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/admin/orders")}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all shrink-0 cursor-pointer shadow-xs"
              title="Return to Orders list"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight m-0 flex items-center gap-1.5">
                  <span>{order.orderNumber}</span>
                  <CopyButton text={order.orderNumber} label="Copy Order #" />
                </h1>

                <StatusBadge status={order.status} />

                {order.advancePaid && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                    <CheckCircle2 size={12} /> Advance Paid
                  </span>
                )}

                {order.companyName && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
                    <Building2 size={12} className="text-neutral-400" />
                    <span>{order.companyName}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => navigate("/admin/production")}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a] text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 transition-all shadow-xs cursor-pointer"
            >
              <Package size={14} className="text-blue-500" />
              <span>Production Board</span>
            </button>

            <button
              type="button"
              onClick={openSendInvoiceModal}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all shadow-xs cursor-pointer"
            >
              <Sparkles size={14} className="text-emerald-500" />
              <span>Send Invoice</span>
            </button>

            {!isTerminal && currentIndex > 0 && (
              <button
                type="button"
                onClick={handleRegressMilestone}
                disabled={actionBusy}
                className="inline-flex items-center gap-1 px-3.5 h-9 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
              >
                <span>← Move Back</span>
              </button>
            )}

            {!isTerminal && currentIndex < STAGES.length - 1 && (
              <button
                type="button"
                onClick={handleAdvanceMilestone}
                disabled={actionBusy}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black transition-all disabled:opacity-50 shadow-md shadow-orange-500/20 cursor-pointer"
              >
                {actionBusy ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>Advance Stage →</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Status Feedback Notification Banner ──────────────────────────── */}
      {actionMsg && (
        <div className={`px-4 py-3 rounded-2xl text-xs font-bold border flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 ${
          actionMsg.includes("failed") || actionMsg.includes("Fail") || actionMsg.includes("Could not")
            ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{actionMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMsg(null)}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-current cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── 5 Core Manufacturing Progression (Connected Stepper UI) ────── */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs before:absolute before:inset-0 before:bg-[radial-gradient(280px_160px_at_95%_0%,rgba(16,185,129,0.12),transparent)] before:pointer-events-none">
        <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white m-0 tracking-tight">
                Manufacturing Progression (5 Core Stages)
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 m-0">
                Click any stage node to fast-track or update milestone with customer notes
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs shrink-0">
            Stage {Math.max(1, currentIndex + 1)} of 5 · {WORKFLOW[currentIndex]?.label ?? "In Progress"}
          </span>
        </div>

        {/* Connected Stepper Nodes */}
        <div className="flex items-center justify-between gap-0 overflow-x-auto py-2 px-1">
          {WORKFLOW.map((stage, i) => {
            const Icon = stage.icon;
            const isCompleted = i < currentIndex;
            const isCurrent = i === currentIndex;
            const isPastOrCurrent = i <= currentIndex;
            const isNextStep = i < WORKFLOW.length - 1;
            const isLineActive = i < currentIndex;

            return (
              <div key={stage.key} className="flex items-center flex-1 min-w-0 last:flex-none">
                <div
                  onClick={() => !isCurrent && !actionBusy && handleJumpToMilestone(stage.key)}
                  className={`flex flex-col items-center gap-2 min-w-[95px] sm:min-w-[120px] select-none transition-all ${
                    !isCurrent ? "cursor-pointer group hover:opacity-100" : ""
                  }`}
                  title={!isCurrent ? `Switch order stage to ${stage.label}` : "Current active production stage"}
                >
                  {/* Squircle Node Badge */}
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 group-hover:scale-105"
                        : isCurrent
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30 scale-105"
                        : "bg-neutral-100 dark:bg-white/5 text-neutral-400 border border-neutral-200 dark:border-white/10 group-hover:border-emerald-500/40 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 group-hover:scale-105"
                    }`}
                  >
                    <Icon size={20} strokeWidth={2.2} />
                  </div>

                  {/* Stage Label */}
                  <div className="text-center">
                    <div
                      className={`text-xs tracking-tight transition-colors leading-tight ${
                        isPastOrCurrent
                          ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                          : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white font-bold"
                      }`}
                    >
                      {stage.label}
                    </div>
                    <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 hidden sm:block line-clamp-1 max-w-[110px]">
                      {isCurrent ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">● Active Now</span>
                      ) : (
                        stage.desc
                      )}
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                {isNextStep && (
                  <div
                    className={`flex-1 h-1 mx-2 sm:mx-4 mt-[-24px] rounded-full transition-colors ${
                      isLineActive
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                        : "bg-neutral-200 dark:bg-white/10"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── KPI Metric Grid with Ambient Top-Right Radial Glows ───────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Commercial Total */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(249,115,22,0.18),transparent)] before:pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300">
              GST Inclusive
            </span>
          </div>
          <div className="text-2xl sm:text-[26px] font-black text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight tabular-nums">
            {order.commercial?.total != null ? `₹${order.commercial.total.toLocaleString("en-IN")}` : "—"}
          </div>
          <div className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 mt-1">Total Commercial Value</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center justify-between">
            <span>Paid: ₹{order.commercial?.amountPaid?.toLocaleString("en-IN") || "0"}</span>
            <span className="font-semibold text-orange-600 dark:text-orange-400">
              Due: ₹{order.commercial?.balanceDue?.toLocaleString("en-IN") || "0"}
            </span>
          </div>
        </div>

        {/* KPI 2: Production Fulfillment */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(16,185,129,0.18),transparent)] before:pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <PackageCheck size={20} />
            </div>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {summaryMetrics.progressPct}% Cast
            </span>
          </div>
          <div className="text-2xl sm:text-[26px] font-black text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight tabular-nums">
            {summaryMetrics.totalProduced} / {summaryMetrics.totalOrdered}
          </div>
          <div className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 mt-1">Production Fulfillment</div>
          <div className="w-full bg-neutral-100 dark:bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${summaryMetrics.progressPct}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Promised SLA / Dates */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(59,130,246,0.18),transparent)] before:pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              SLA Delivery
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight truncate">
            {formatShortDate(order.promisedDispatchDateUtc)}
          </div>
          <div className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 mt-1">Promised Dispatch Date</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            Placed on {formatShortDate(order.placedAtUtc)}
          </div>
        </div>

        {/* KPI 4: Lead Engineer */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(168,85,247,0.18),transparent)] before:pointer-events-none">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-black text-sm">
              <UserCog size={20} />
            </div>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
              Responsible
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight truncate">
            {order.assignedToName || "Unassigned"}
          </div>
          <div className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 mt-1">Staff Engineer</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
            {order.assignedToUserId ? "Active supervisor" : "Requires staff assignment"}
          </div>
        </div>
      </div>

      {/* ── Main Content 2-Column Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column (2 Cols wide) ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Line Items Table */}
          <SectionCard
            title="Manufactured Line Items"
            icon={Package}
            badge={
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300">
                {order.items.length} {order.items.length === 1 ? "Item" : "Items"}
              </span>
            }
          >
            <div className="overflow-x-auto -mx-5 -my-2">
              <table className="w-full text-xs sm:text-[13px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-white/10 text-[11px] font-extrabold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider bg-neutral-50/50 dark:bg-white/[0.01]">
                    <th className="py-3 px-5">Part #</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4 text-right">Ordered</th>
                    <th className="py-3 px-4 text-right">Produced</th>
                    <th className="py-3 px-5 text-right">Dispatched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                  {order.items.map((i, idx) => {
                    const itemFulfillmentPct = i.quantityOrdered > 0 ? Math.round((i.quantityProduced / i.quantityOrdered) * 100) : 0;
                    return (
                      <tr key={idx} className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-5 font-black text-neutral-900 dark:text-white">
                          <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                            {i.partNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-neutral-700 dark:text-neutral-200">
                          {i.description}
                        </td>
                        <td className="py-3.5 px-4">
                          {i.materialGrade ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              {i.materialGrade}
                            </span>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums font-bold text-neutral-900 dark:text-white">
                          {i.quantityOrdered.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {i.quantityProduced.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {itemFulfillmentPct}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right tabular-nums font-bold text-neutral-700 dark:text-neutral-300">
                          {i.quantityDispatched.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Section 2: Shipments & Logistics Hub */}
          <SectionCard
            title={`Shipments & Logistics (${order.shipments.length})`}
            icon={Truck}
            action={
              <button
                type="button"
                onClick={openAddShipment}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400 text-xs font-bold hover:bg-teal-500/20 transition-all shadow-xs cursor-pointer"
              >
                <Truck size={13} />
                <span>Add Shipment</span>
              </button>
            }
          >
            {order.shipments.length > 0 ? (
              <div className="space-y-4">
                {order.shipments.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.02] hover:border-teal-500/30 transition-all shadow-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <InfoField label="Transporter" value={s.transporter ?? "—"} icon={Truck} copyable />
                      <InfoField
                        label="Vehicle Number"
                        value={
                          s.vehicleNumber ? (
                            <span className="font-mono font-black px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/10">
                              {s.vehicleNumber}
                            </span>
                          ) : (
                            "—"
                          )
                        }
                        icon={Truck}
                        copyable={!!s.vehicleNumber}
                      />
                      <InfoField
                        label="Driver Phone"
                        value={
                          s.phoneNumber ? (
                            <a
                              href={`tel:${s.phoneNumber}`}
                              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
                            >
                              {s.phoneNumber}
                            </a>
                          ) : (
                            "—"
                          )
                        }
                        icon={Phone}
                        copyable={!!s.phoneNumber}
                      />
                      <InfoField label="Dispatch Date" value={formatDate(s.dispatchDateUtc)} icon={Calendar} />
                      <InfoField label="Estimated Arrival (ETA)" value={formatDate(s.estimatedArrivalUtc)} icon={Clock} />
                      <InfoField
                        label="Proof of Delivery"
                        value={
                          s.hasProofOfDelivery ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                              <CheckCircle2 size={13} /> Verified
                            </span>
                          ) : (
                            <span className="text-neutral-400">Pending</span>
                          )
                        }
                        icon={ShieldCheck}
                      />
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-neutral-200/80 dark:border-white/10 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditShipment(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a] text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:text-[var(--color-primary)] transition-all shadow-xs cursor-pointer"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingShipment(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all shadow-xs cursor-pointer"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-neutral-200 dark:border-white/10 bg-neutral-50/40 dark:bg-white/[0.01]">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center mx-auto mb-3">
                  <Truck size={22} />
                </div>
                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 m-0">No shipments recorded yet</p>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 max-w-xs mx-auto">
                  Add vehicle and transporter tracking details once products are staged for dispatch.
                </p>
                <button
                  type="button"
                  onClick={openAddShipment}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 text-white text-xs font-extrabold hover:bg-teal-600 transition-all shadow-sm cursor-pointer"
                >
                  <Truck size={13} /> Add First Shipment
                </button>
              </div>
            )}
          </SectionCard>

          {/* Section 3: Engineering & Quality Documents */}
          <SectionCard
            title={`Quality & Engineering Documents (${order.documents?.length ?? 0})`}
            icon={FileText}
            action={
              <button
                type="button"
                onClick={() => setShowDocModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all shadow-xs cursor-pointer"
              >
                <Upload size={13} />
                <span>Upload Document</span>
              </button>
            }
          >
            {order.documents && order.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.02] hover:bg-neutral-100/60 dark:hover:bg-white/[0.04] transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {doc.title || doc.fileName}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-200/70 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 shrink-0">
                          {doc.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                        {(doc.sizeBytes / 1024).toFixed(1)} KB · {formatShortDate(doc.createdAtUtc)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 px-4 rounded-2xl border border-dashed border-neutral-200 dark:border-white/10 bg-neutral-50/40 dark:bg-white/[0.01]">
                <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 m-0">No documents uploaded yet</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Attach inspection sheets, CAD drawings, or material test certs.</p>
              </div>
            )}
          </SectionCard>

          {/* Section 4: Invoices & Commercial Billing Hub */}
          <SectionCard
            title={`Customer Invoices & Billing (${orderInvoices.length})`}
            icon={Receipt}
            action={
              <button
                type="button"
                onClick={openSendInvoiceModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold transition-all shadow-xs cursor-pointer"
              >
                <Upload size={13} />
                <span>Upload Invoice</span>
              </button>
            }
          >
            {orderInvoices.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-neutral-200 dark:border-white/10 bg-neutral-50/40 dark:bg-white/[0.01]">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                  <Receipt size={22} />
                </div>
                <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 m-0">No invoices generated for this order</p>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 max-w-xs mx-auto">
                  Create and send official GST tax invoice PDF to the customer.
                </p>
                <button
                  type="button"
                  onClick={openSendInvoiceModal}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-extrabold hover:bg-emerald-600 transition-all shadow-sm cursor-pointer"
                >
                  <Upload size={13} /> Generate &amp; Send Invoice
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {orderInvoices.map((inv) => {
                  const open = !!invOpen[inv.id];
                  const det = invDetail[inv.id];
                  return (
                    <div
                      key={inv.id}
                      className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.02] overflow-hidden shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={() => toggleInvDetail(inv.id)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-neutral-100/70 dark:hover:bg-white/[0.04] transition-all cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Receipt size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white font-mono">
                              {inv.invoiceNumber}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              inv.status === "Issued" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
                              inv.status === "Paid" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                              "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20"
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Total: <strong>₹{inv.total.toLocaleString("en-IN")}</strong> · Due: {formatShortDate(inv.dueDateUtc)} · Balance: ₹{inv.balanceDue.toLocaleString("en-IN")}
                          </div>
                        </div>
                        <span className="text-neutral-400 shrink-0">
                          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </button>

                      {open && (
                        <div className="px-5 pb-5 pt-3 border-t border-neutral-200/80 dark:border-white/10 bg-white/70 dark:bg-black/20">
                          {det === "loading" || det === undefined ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 size={20} className="animate-spin text-neutral-400" />
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Invoice Items */}
                                <div>
                                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                                    Billed Line Items
                                  </h4>
                                  {det.items.length === 0 ? (
                                    <p className="text-xs text-neutral-400">No item details recorded.</p>
                                  ) : (
                                    <div className="rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#0f121a]">
                                      <table className="w-full text-xs">
                                        <thead className="bg-neutral-50 dark:bg-white/5 text-[10px] text-neutral-400 font-bold uppercase">
                                          <tr>
                                            <th className="py-2 px-3 text-left">Item</th>
                                            <th className="py-2 px-2 text-right">Qty</th>
                                            <th className="py-2 px-2 text-right">Rate</th>
                                            <th className="py-2 px-3 text-right">Total</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                                          {det.items.map((it) => (
                                            <tr key={it.id}>
                                              <td className="py-2 px-3 text-neutral-800 dark:text-neutral-200 font-medium">{it.description}</td>
                                              <td className="py-2 px-2 text-right tabular-nums text-neutral-500">{it.quantity} {it.unit}</td>
                                              <td className="py-2 px-2 text-right tabular-nums text-neutral-500">₹{it.unitPrice.toLocaleString()}</td>
                                              <td className="py-2 px-3 text-right tabular-nums font-bold text-neutral-900 dark:text-white">₹{it.lineTotal.toLocaleString()}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>

                                {/* Invoice Payments */}
                                <div>
                                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                                    Payment Transactions
                                  </h4>
                                  {det.payments.length === 0 ? (
                                    <div className="p-3 rounded-xl border border-dashed border-neutral-200 dark:border-white/10 text-xs text-neutral-400 text-center">
                                      No payments received for this invoice yet.
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {det.payments.map((p) => (
                                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a]">
                                          <div>
                                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                              ₹{p.amount.toLocaleString()} · {p.method}
                                            </div>
                                            <div className="text-[10px] text-neutral-400">
                                              Ref {p.paymentReference} · {formatDate(p.paymentDateUtc)}
                                            </div>
                                          </div>
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                            {p.status}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Invoice Actions */}
                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200/80 dark:border-white/10">
                                {inv.hasPdf && (
                                  <button
                                    type="button"
                                    onClick={() => void apiDownload(adminApi.invoiceDownloadUrl(inv.id), `${inv.invoiceNumber}.pdf`)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a] text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:text-emerald-600 transition-all shadow-xs cursor-pointer"
                                  >
                                    <Download size={13} /> Download PDF
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setDeletingInvoice(inv)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all shadow-xs cursor-pointer"
                                >
                                  <Trash2 size={13} /> Delete Invoice
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Section 5: Activity Log & Comments */}
          <SectionCard
            title="Activity & Staff Discussion"
            icon={MessageSquare}
            badge={
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300">
                {orderComments.length}
              </span>
            }
          >
            <div className="space-y-4">
              {orderComments.length === 0 ? (
                <p className="text-xs text-neutral-400 py-3 text-center">No comments or activity notes logged yet.</p>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {orderComments.map((co, i) => {
                    const commentPalette = getAvatarStyle(co.authorName || co.authorRole || "?");
                    return (
                      <div key={i} className="flex gap-3 p-3 rounded-2xl border border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.01]">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border"
                          style={{ background: commentPalette.bg, color: commentPalette.fg, borderColor: commentPalette.border }}
                        >
                          {initials(co.authorName, co.authorRole)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                              {co.authorName || co.authorRole || "Staff"}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-neutral-200/80 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                              {co.authorRole}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {formatDateTime(co.createdAtUtc)}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 m-0 break-words whitespace-pre-wrap leading-relaxed">
                            {co.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Comment Composer */}
              <div className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-white/10">
                <input
                  type="text"
                  value={newOrderComment}
                  onChange={(e) => setNewOrderComment(e.target.value)}
                  placeholder="Type an internal note or milestone comment..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handlePostOrderComment();
                    }
                  }}
                  className="flex-1 h-10 px-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-[var(--color-primary)] transition-all"
                />
                <button
                  type="button"
                  onClick={handlePostOrderComment}
                  disabled={!newOrderComment.trim() || postingComment}
                  className="px-5 h-10 rounded-xl bg-[var(--color-primary)] text-white text-xs font-black hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {postingComment ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Send</span>
                </button>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── Right Column / Sidebar ───────────────────────────────────── */}
        <div className="space-y-6">
          {/* Sidebar 1: Assigned Staff Engineer */}
          <SectionCard title="Assigned Staff Engineer" icon={UserCog}>
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-3 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.02]">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm border shadow-xs shrink-0"
                  style={{ background: assignedStaffPalette.bg, color: assignedStaffPalette.fg, borderColor: assignedStaffPalette.border }}
                >
                  {initials(order.assignedToName, order.assignedToUserId)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate">
                    {order.assignedToName || "Unassigned"}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {order.assignedToUserId ? "Responsible Lead Engineer" : "Needs engineer assigned"}
                  </div>
                </div>
              </div>

              {assignMsg && (
                <div className={`p-2.5 rounded-xl text-xs font-bold border ${
                  assignMsg.includes("✅") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                }`}>
                  {assignMsg}
                </div>
              )}

              {isAdmin && (
                <div className="pt-2 border-t border-neutral-100 dark:border-white/10">
                  <label className="text-[11px] font-extrabold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-1.5">
                    Assign / Reassign Staff
                  </label>
                  <select
                    value={order.assignedToUserId || ""}
                    onChange={(e) => handleAssign(e.target.value ? e.target.value : null)}
                    disabled={assignBusy}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-xs font-bold text-neutral-800 dark:text-neutral-200 outline-none focus:border-[var(--color-primary)] disabled:opacity-50 cursor-pointer"
                  >
                    <option value="">-- Select Engineer / Staff --</option>
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>
                        {eng.fullName || eng.email} ({eng.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Sidebar 2: Customer & Company Dossier */}
          <SectionCard title="Customer & Delivery Dossier" icon={Building2}>
            <div className="divide-y divide-neutral-100 dark:divide-white/5 -my-2">
              <InfoField
                label="Company Name"
                value={order.companyName ?? "—"}
                icon={Building2}
                copyable={!!order.companyName}
              />
              <InfoField
                label="Purchase Order Ref (PO)"
                value={
                  order.purchaseOrderReference ? (
                    <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                      {order.purchaseOrderReference}
                    </span>
                  ) : (
                    "—"
                  )
                }
                icon={FileText}
                copyable={!!order.purchaseOrderReference}
              />
              <InfoField
                label="Delivery Address"
                value={order.deliveryAddress ?? "—"}
                icon={MapPin}
                copyable={!!order.deliveryAddress}
              />
              <InfoField
                label="Payment Terms"
                value={
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {order.paymentTerms || "Standard Terms"}
                  </span>
                }
                icon={CreditCard}
              />
            </div>
          </SectionCard>

          {/* Sidebar 3: Commercial & Payment Summary */}
          <SectionCard title="Commercial & Financial Summary" icon={Receipt}>
            {order.commercial ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.02] space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
                    <span>Tax Invoice Ref</span>
                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      {order.commercial.invoiceNumber || "Not Issued"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
                    <span>Total Payable</span>
                    <span className="font-bold text-neutral-900 dark:text-white tabular-nums">
                      ₹{order.commercial.total?.toLocaleString("en-IN") || "0"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-neutral-500">
                    <span>Amount Paid</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      ₹{order.commercial.amountPaid?.toLocaleString("en-IN") || "0"}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-neutral-900 dark:text-white">Balance Due</span>
                    <span className={`text-sm font-black tabular-nums ${
                      (order.commercial.balanceDue || 0) <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"
                    }`}>
                      ₹{order.commercial.balanceDue?.toLocaleString("en-IN") || "0"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-500">Payment Status:</span>
                  <span className="font-extrabold text-neutral-800 dark:text-neutral-200">
                    {order.commercial.paymentStatus || "Pending"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-400 text-center py-4">No commercial billing recorded.</p>
            )}
          </SectionCard>

          {/* Sidebar 4: Quick Portal Navigation */}
          <SectionCard title="Related Quick Links" icon={ExternalLink}>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate("/admin/invoices")}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-[var(--color-primary)] hover:bg-neutral-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Receipt size={14} className="text-emerald-500" />
                  <span>All Invoices Hub</span>
                </div>
                <ChevronRight size={14} className="text-neutral-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/production")}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-[var(--color-primary)] hover:bg-neutral-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Flame size={14} className="text-orange-500" />
                  <span>Manufacturing Board</span>
                </div>
                <ChevronRight size={14} className="text-neutral-400" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/enquiries")}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-[var(--color-primary)] hover:bg-neutral-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-blue-500" />
                  <span>Enquiries &amp; Quotations</span>
                </div>
                <ChevronRight size={14} className="text-neutral-400" />
              </button>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ── Milestone Advance/Jump Confirmation Modal ────────────────────── */}
      <ConfirmActionModal
        open={milestoneModal !== null}
        title={`Advance Stage to ${milestoneModal?.label ?? ""}`}
        message="Optionally add an update note that will be logged in the audit trail and visible to the customer."
        placeholder="Customer-visible note (optional)"
        confirmLabel={`Confirm ${milestoneModal?.label ?? "Stage"}`}
        cancelLabel="Cancel"
        onConfirm={confirmMilestoneAdvance}
        onCancel={() => setMilestoneModal(null)}
      />

      {/* ── Invoice Upload Modal (Quotation Locked) ───────────────────────── */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => { setShowInvoiceModal(false); setInvoiceMsg(null); }}>
          <div
            className="w-full max-w-lg bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Upload size={17} />
                </div>
                <h3 className="font-extrabold text-sm m-0">Send Invoice to Customer</h3>
              </div>
              <button onClick={() => { setShowInvoiceModal(false); setInvoiceMsg(null); }} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="shrink-0" />
                  <span>Price details auto-synced from approved quotation</span>
                </div>
                {order?.quotationId && (
                  <button
                    type="button"
                    onClick={openSendInvoiceModal}
                    disabled={fetchingPrice}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 transition-colors text-[11px] cursor-pointer"
                  >
                    <RefreshCw size={11} className={fetchingPrice ? "animate-spin" : ""} />
                    <span>{fetchingPrice ? "Syncing..." : "Re-sync"}</span>
                  </button>
                )}
              </div>

              {invoiceMsg && (
                <div className={`px-4 py-2.5 rounded-xl text-xs font-bold ${
                  invoiceMsg.includes("✅") ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                }`}>
                  {invoiceMsg}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Invoice Number *</label>
                <input
                  type="text"
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => setInvoiceForm((f) => ({ ...f, invoiceNumber: e.target.value }))}
                  placeholder="e.g. INV-20260729-001"
                  className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-xs text-neutral-900 dark:text-white font-mono outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              {/* Quotation Pricing Breakdown */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-500 flex items-center gap-1">
                    <Lock size={12} className="text-emerald-500" />
                    <span>Quotation Pricing (Verified)</span>
                  </span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Locked to Quote</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-2 rounded-lg bg-white dark:bg-[#0f121a] border border-neutral-200 dark:border-white/10">
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">Subtotal</span>
                    <span className="text-xs font-black text-neutral-900 dark:text-white tabular-nums">
                      ₹{Number(invoiceForm.subtotal || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#0f121a] border border-neutral-200 dark:border-white/10">
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">GST (18%)</span>
                    <span className="text-xs font-black text-neutral-900 dark:text-white tabular-nums">
                      ₹{Number(invoiceForm.tax || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">Total</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      ₹{Number(invoiceForm.total || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Issue Date *</label>
                  <input
                    type="date"
                    value={invoiceForm.issueDate}
                    onChange={(e) => setInvoiceForm((f) => ({ ...f, issueDate: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-xs text-neutral-900 dark:text-white outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-xs text-neutral-900 dark:text-white outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={invoiceForm.paymentTerms}
                  onChange={(e) => setInvoiceForm((f) => ({ ...f, paymentTerms: e.target.value }))}
                  placeholder="e.g. 30 days"
                  className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-xs text-neutral-900 dark:text-white outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Invoice PDF *</label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setInvoiceForm((prev) => ({ ...prev, file: f }));
                  }}
                  className="w-full text-xs text-neutral-700 dark:text-neutral-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20 file:cursor-pointer"
                />
                <p className="text-[11px] text-neutral-400 mt-1">Supported: <strong>PDF only</strong></p>
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={invoiceBusy}
                onClick={() => { setShowInvoiceModal(false); setInvoiceMsg(null); }}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={invoiceBusy || !invoiceForm.file || !invoiceForm.invoiceNumber || !invoiceForm.total}
                onClick={handleUploadInvoice}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {invoiceBusy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                <span>{invoiceBusy ? "Uploading..." : "Upload & Send to Customer"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Upload Modal ────────────────────────────────────────── */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => { setShowDocModal(false); setDocMsg(null); }}>
          <div
            className="w-full max-w-md bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-blue-500/5 text-blue-600 dark:text-blue-400">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText size={17} />
                </div>
                <h3 className="font-extrabold text-sm m-0">Upload Document</h3>
              </div>
              <button onClick={() => { setShowDocModal(false); setDocMsg(null); }} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {docMsg && (
                <div className={`px-4 py-2.5 rounded-xl text-xs font-bold ${
                  docMsg.includes("✅") ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                }`}>
                  {docMsg}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Document Category *</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-xs text-neutral-900 dark:text-white outline-none focus:border-[var(--color-primary)] cursor-pointer"
                >
                  <option value="Inspection Report">Inspection Report</option>
                  <option value="Certificate">Certificate / Test Report</option>
                  <option value="Packing List">Packing List</option>
                  <option value="Delivery Challan">Delivery Challan</option>
                  <option value="Drawing">CAD / Engineering Drawing</option>
                  <option value="Other">Other Order Document</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">File Attachment *</label>
                <input
                  type="file"
                  accept=".pdf,.dwg,.dxf,.step,.stp,.iges,.igs,.jpg,.jpeg,.png,.zip"
                  onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-neutral-700 dark:text-neutral-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20 file:cursor-pointer"
                />
                <p className="text-[11px] text-neutral-400 mt-1">Supported: PDF, CAD (DWG, DXF, STEP), ZIP, Images</p>
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={docBusy}
                onClick={() => { setShowDocModal(false); setDocMsg(null); }}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={docBusy || !docFile}
                onClick={handleUploadDocument}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {docBusy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                <span>{docBusy ? "Uploading..." : "Upload Document"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Shipment Modal ────────────────────────────────────── */}
      {showShipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => { setShowShipmentModal(false); setEditingShipment(null); setShipmentMsg(null); }}>
          <div
            className="w-full max-w-md bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-teal-500/5 text-teal-600 dark:text-teal-400">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Truck size={17} />
                </div>
                <h3 className="font-extrabold text-sm m-0">
                  {editingShipment ? "Edit Shipment Record" : "Add Shipment Record"}
                </h3>
              </div>
              <button onClick={() => { setShowShipmentModal(false); setEditingShipment(null); }} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {shipmentMsg && (
                <div className={`px-4 py-2.5 rounded-xl text-xs font-bold ${
                  shipmentMsg.includes("Could") || shipmentMsg.includes("Enter") ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                }`}>
                  {shipmentMsg}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Transporter / Carrier</label>
                <input
                  type="text"
                  value={shipmentForm.transporter}
                  onChange={(e) => setShipmentForm((f) => ({ ...f, transporter: e.target.value }))}
                  placeholder="e.g. VRL Logistics / Delhivery"
                  className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-xs text-neutral-900 dark:text-white outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={shipmentForm.vehicleNumber}
                    onChange={(e) => setShipmentForm((f) => ({ ...f, vehicleNumber: e.target.value }))}
                    placeholder="e.g. PB10 JP 2002"
                    className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-xs text-neutral-900 dark:text-white font-mono outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Driver Contact #</label>
                  <input
                    type="tel"
                    value={shipmentForm.phoneNumber}
                    onChange={(e) => setShipmentForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-xs text-neutral-900 dark:text-white outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Dispatch Date</label>
                  <input
                    type="date"
                    value={shipmentForm.dispatchDate}
                    onChange={(e) => setShipmentForm((f) => ({ ...f, dispatchDate: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-xs text-neutral-900 dark:text-white outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Estimated Arrival (ETA)</label>
                  <input
                    type="date"
                    value={shipmentForm.eta}
                    onChange={(e) => setShipmentForm((f) => ({ ...f, eta: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-xs text-neutral-900 dark:text-white outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={shipmentBusy}
                onClick={() => { setShowShipmentModal(false); setEditingShipment(null); setShipmentMsg(null); }}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={shipmentBusy}
                onClick={handleSaveShipment}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {shipmentBusy ? <Loader2 size={13} className="animate-spin" /> : <Truck size={13} />}
                <span>{shipmentBusy ? "Saving..." : editingShipment ? "Update Shipment" : "Add Shipment"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Delete Shipment Modal (Zero native browser alerts) ────── */}
      {deletingShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => setDeletingShipment(null)}>
          <div
            className="w-full max-w-sm bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-red-500/5 text-red-600 dark:text-red-400">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Trash2 size={17} />
                </div>
                <h3 className="font-extrabold text-sm m-0">Delete Shipment Record?</h3>
              </div>
              <button onClick={() => setDeletingShipment(null)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
                Are you sure you want to remove the shipment record for transporter <strong>"{deletingShipment.transporter || deletingShipment.vehicleNumber || "Dispatch"}"</strong>?
              </p>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300 font-medium">
                This action cannot be undone. Customer dispatch tracking will be cleared.
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={shipmentBusy}
                onClick={() => setDeletingShipment(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={shipmentBusy}
                onClick={handleDeleteShipmentConfirm}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {shipmentBusy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Delete Invoice Modal (Zero native browser alerts) ──────── */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => setDeletingInvoice(null)}>
          <div
            className="w-full max-w-sm bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-red-500/5 text-red-600 dark:text-red-400">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Trash2 size={17} />
                </div>
                <h3 className="font-extrabold text-sm m-0">Delete Invoice {deletingInvoice.invoiceNumber}?</h3>
              </div>
              <button onClick={() => setDeletingInvoice(null)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
                Are you sure you want to permanently remove invoice <strong>{deletingInvoice.invoiceNumber}</strong> for ₹{deletingInvoice.total?.toLocaleString()}?
              </p>
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300 font-medium">
                The invoice PDF and billing records will be deleted. This cannot be undone.
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={invoiceBusy}
                onClick={() => setDeletingInvoice(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={invoiceBusy}
                onClick={handleDeleteInvoiceConfirm}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {invoiceBusy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>Delete Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
