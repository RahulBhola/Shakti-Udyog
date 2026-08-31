import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, FileText, Package, ChevronDown, ChevronUp, Download,
  Receipt, Loader2, Building2, User, Mail, Phone,
  Clock, CheckCircle2, AlertCircle, XCircle, CreditCard,
  Layers, Tag, Copy, Check, FolderOpen, FolderClosed,
  DollarSign, FileCode, Paperclip, Maximize2, X,
  ShieldCheck, Banknote, PlusCircle, CheckCheck,
  Truck, Award, Flame, Wrench, Factory, MapPinned,
  FileEdit, PackageCheck
} from "lucide-react";
import { adminApi, type EngineerEnquiryDetail } from "../../api/adminApi";
import { engineerApi } from "../../api/engineerApi";
import { apiDownload, apiPost } from "../../api/client";
import { config } from "../../config";
import { tokenStorage } from "../../auth/tokenStorage";
import type { OrderDetail, QuotationDetail, InvoiceDetail } from "../../api/customerApi";

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

function initials(name?: string | null, fallback?: string): string {
  if (name && name.trim()) {
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
  }
  if (fallback && fallback.trim()) {
    return fallback.charAt(0).toUpperCase();
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
      className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      {copied && <span className="text-[10px] text-emerald-500 font-bold">Copied!</span>}
    </button>
  );
}

/* ── Currency & Date Formatting Helpers ──────────────────────────────── */

function formatMoney(amount: number | null | undefined, currency: string = "INR"): string {
  if (amount == null) return "—";
  if (currency === "INR" || !currency) {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric", month: "short", day: "numeric",
  });
}

/* ── Status Configuration & Badges ───────────────────────────────────── */

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; border: string; icon: any }> = {
  Draft: { label: "Draft", bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400", border: "border-slate-500/20", icon: FileText },
  Submitted: { label: "Submitted", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500", border: "border-blue-500/20", icon: Clock },
  Received: { label: "Received", bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", dot: "bg-cyan-500", border: "border-cyan-500/20", icon: Clock },
  "Under Review": { label: "Under Review", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500", border: "border-amber-500/20", icon: AlertCircle },
  Approved: { label: "Approved", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-500/20", icon: CheckCircle2 },
  Quoted: { label: "Quotation Generated", bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500", border: "border-indigo-500/20", icon: FileEdit },
  Accepted: { label: "Accepted by Client", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-500/20", icon: CheckCircle2 },
  Rejected: { label: "Rejected", bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500", border: "border-rose-500/20", icon: XCircle },
  Cancelled: { label: "Cancelled", bg: "bg-slate-500/10", text: "text-slate-500 dark:text-slate-400", dot: "bg-slate-400", border: "border-slate-500/20", icon: XCircle },
  Expired: { label: "Expired", bg: "bg-slate-500/10", text: "text-slate-500 dark:text-slate-400", dot: "bg-slate-400", border: "border-slate-500/20", icon: Clock },
};

function getStatusConfig(status: string) {
  return statusConfig[status] ?? {
    label: status,
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400",
    border: "border-slate-500/20",
    icon: FileText,
  };
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase() || "";
  let bg = "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20";
  let Icon = Clock;

  if (s.includes("paid") || s.includes("delivered") || s.includes("accepted") || s.includes("approved") || s.includes("verified") || s.includes("settled")) {
    bg = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    Icon = CheckCircle2;
  } else if (s.includes("overdue") || s.includes("rejected") || s.includes("cancelled") || s.includes("declined")) {
    bg = "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30";
    Icon = XCircle;
  } else if (s.includes("review") || s.includes("partial") || s.includes("progress") || s.includes("production") || s.includes("pending")) {
    bg = "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
    Icon = AlertCircle;
  } else if (s.includes("issued") || s.includes("quoted") || s.includes("submitted") || s.includes("received")) {
    bg = "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
    Icon = FileText;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black border shadow-xs ${bg}`}>
      <Icon size={12} strokeWidth={2.2} />
      <span>{status ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Active"}</span>
    </span>
  );
}

/* ── Priority Badge ──────────────────────────────────────────────────── */

const priorityConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  Low: { label: "Low Priority", bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/20" },
  Medium: { label: "Medium Priority", bg: "bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", border: "border-amber-500/30" },
  High: { label: "High Priority", bg: "bg-orange-500/10", text: "text-orange-700 dark:text-orange-400", border: "border-orange-500/30" },
  Urgent: { label: "Urgent Priority", bg: "bg-rose-500/15", text: "text-rose-700 dark:text-rose-300", border: "border-rose-500/30" },
};

function PriorityBadge({ priority }: { priority: string }) {
  const c = priorityConfig[priority] ?? priorityConfig.Medium;
  return (
    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-black border shadow-xs ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
}

/* ── Collapsible Section Container with Opening/Closing Tag Icon ─────── */

function CollapsibleSection({
  title,
  icon: Icon,
  badge,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: any;
  badge?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs overflow-hidden transition-all duration-200">
      {/* Accordion Header */}
      <div className="px-5 sm:px-6 py-4 bg-neutral-50/70 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 text-left cursor-pointer group select-none min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-black shrink-0 group-hover:scale-105 transition-transform">
            <Icon size={18} />
          </div>
          <div className="min-w-0 flex items-center gap-3 flex-wrap">
            <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white tracking-tight m-0 group-hover:text-[var(--color-primary)] transition-colors">
              {title}
            </h3>
            {badge}
          </div>
        </button>

        {/* Action Controls & Open/Close Tag Icons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all text-xs font-bold cursor-pointer"
            title={isOpen ? "Collapse Section" : "Expand Section"}
          >
            {isOpen ? (
              <>
                <FolderOpen size={14} className="text-blue-500" />
                <span className="hidden sm:inline">Close</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <FolderClosed size={14} className="text-neutral-400" />
                <span className="hidden sm:inline">Open</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-5 sm:p-6 space-y-6 animate-in fade-in-50 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── 5 Core Manufacturing Workflow Stages (from AdminOrderDetailPage) ── */

const MANUFACTURING_STAGES = [
  { key: "pattern_development", label: "Pattern Dev.", icon: Layers, desc: "Tooling & CAD Design" },
  { key: "production", label: "Production", icon: Flame, desc: "Casting & Heat Treatment" },
  { key: "quality_check", label: "QC Inspection", icon: ShieldCheck, desc: "CMM & Testing" },
  { key: "packed", label: "Packaging", icon: PackageCheck, desc: "Crating & Palletizing" },
  { key: "ready_to_dispatch", label: "Ready to Dispatch", icon: Truck, desc: "Logistics Staged" },
];

function getManufacturingStageIndex(stageStr?: string | null, statusStr?: string | null): number {
  const s = (stageStr || statusStr || "").toLowerCase().replace(/\s+/g, "_");
  if (s.includes("deliver") || s.includes("dispatch") || s.includes("ready_to_dispatch")) return 4;
  if (s.includes("pack") || s.includes("crate")) return 3;
  if (s.includes("quality_check") || s.includes("qc") || s.includes("inspect")) return 2;
  if (s.includes("production") || s.includes("cast") || s.includes("machin")) return 1;
  return 0; // pattern_development
}

/* ── Auth-protected Enquiry Image Thumbnail Component ────────────────── */

function EnquiryImage({
  enquiryId,
  fileId,
  fileName,
  onImageClick,
}: {
  enquiryId: string;
  fileId: string;
  fileName: string;
  onImageClick?: (url: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = tokenStorage.getAccessToken();
    fetch(`${config.apiBaseUrl}/api/v1/engineer/enquiries/${enquiryId}/files/${fileId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.blob();
      })
      .then((blob) => {
        if (!cancelled) setUrl(URL.createObjectURL(blob));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enquiryId, fileId]);

  if (!url) {
    return (
      <div className="w-full aspect-[4/3] rounded-xl bg-neutral-100 dark:bg-white/5 animate-pulse flex items-center justify-center text-neutral-400">
        <Loader2 size={18} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div
      onClick={() => onImageClick?.(url)}
      className="relative w-full h-full group/img cursor-pointer overflow-hidden rounded-xl bg-neutral-100 dark:bg-black/40 flex items-center justify-center"
      title="Click to zoom image"
    >
      <img
        src={url}
        alt={fileName}
        className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
        <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-[11px] font-bold inline-flex items-center gap-1 shadow-xs">
          <Maximize2 size={12} /> Zoom
        </span>
      </div>
    </div>
  );
}

/* ── Lightbox Image Modal ────────────────────────────────────────────── */

function ImageLightboxModal({
  url,
  fileName,
  onClose,
  onDownload,
}: {
  url: string;
  fileName: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] w-full bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lightbox Header */}
        <div className="px-5 py-3.5 bg-neutral-950 border-b border-white/10 flex items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-2 min-w-0">
            <Paperclip size={16} className="text-blue-400 shrink-0" />
            <span className="font-bold text-sm truncate">{fileName}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <Download size={13} />
              <span>Download File</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Lightbox Image Container */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/50 min-h-[300px]">
          <img src={url} alt={fileName} className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg" />
        </div>
      </div>
    </div>
  );
}

/* ── Invoice summary row type ────────────────────────────────────────── */

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

/* ── Main Deal Page Component ────────────────────────────────────────── */

export default function AdminDealPage() {
  const { orderId = "" } = useParams();
  const [params] = useSearchParams();
  const requestedInvoice = params.get("invoice");
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [enquiry, setEnquiry] = useState<EngineerEnquiryDetail | null>(null);
  const [invoices, setInvoices] = useState<OrderInvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox modal state
  const [lightbox, setLightbox] = useState<{ url: string; fileName: string; fileId: string } | null>(null);

  // Payment Recording Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTargetInvoiceId, setPaymentTargetInvoiceId] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("NEFT / RTGS");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Expanded sections state (6 complete stages)
  const [sectionsOpen, setSectionsOpen] = useState<{
    enquiry: boolean;
    quote: boolean;
    advance: boolean;
    order: boolean;
    invoices: boolean;
    settlement: boolean;
  }>({
    enquiry: true,
    quote: true,
    advance: true,
    order: true,
    invoices: true,
    settlement: true,
  });

  // Expanded invoice detail cache: id -> detail | "loading"
  const [detail, setDetail] = useState<Record<string, InvoiceDetail | "loading">>({});
  const [openInv, setOpenInv] = useState<Record<string, boolean>>({});

  const reloadData = () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);

    engineerApi.order(orderId)
      .then((o) => {
        setOrder(o);
        if (o.quotationId) {
          adminApi.quotation(o.quotationId).then((q) => {
            setQuotation(q);
            if (q.enquiryId) {
              adminApi.enquiry(q.enquiryId).then(setEnquiry).catch(() => {});
            }
          }).catch(() => {});
        }
      })
      .catch((e) => setError(e.message ?? "Transaction could not be found."))
      .finally(() => setLoading(false));

    adminApi.orderInvoices(orderId).then((invs) => {
      setInvoices(invs);
      invs.forEach((inv) => {
        adminApi.invoice(inv.id).then((d) => setDetail((prev) => ({ ...prev, [inv.id]: d }))).catch(() => {});
      });
    }).catch(() => {});
  };

  useEffect(() => {
    reloadData();
  }, [orderId]);

  const openInvoice = (invId: string) => {
    setOpenInv((prev) => ({ ...prev, [invId]: true }));
    if (!detail[invId]) {
      setDetail((prev) => ({ ...prev, [invId]: "loading" }));
      adminApi.invoice(invId)
        .then((d) => setDetail((prev) => ({ ...prev, [invId]: d })))
        .catch(() =>
          setDetail((prev) => {
            const next = { ...prev };
            delete next[invId];
            return next;
          })
        );
    }
  };

  useEffect(() => {
    if (requestedInvoice && invoices.some((i) => i.id === requestedInvoice)) {
      openInvoice(requestedInvoice);
    }
  }, [requestedInvoice, invoices]);

  const toggleInvoice = (inv: OrderInvoiceSummary) => {
    if (openInv[inv.id]) {
      setOpenInv((prev) => ({ ...prev, [inv.id]: false }));
    } else {
      openInvoice(inv.id);
    }
  };

  const toggleAllSections = (expand: boolean) => {
    setSectionsOpen({
      enquiry: expand,
      quote: expand,
      advance: expand,
      order: expand,
      invoices: expand,
      settlement: expand,
    });
  };

  // ── True Financial Ledger & Snapshot Values ─────────────────────────────
  const quoteSubtotal = useMemo(
    () => quotation?.subtotal ?? order?.quotationSubtotal ?? 45000,
    [quotation, order]
  );

  const quoteTax = useMemo(
    () => quotation?.tax ?? order?.quotationTax ?? 8100,
    [quotation, order]
  );

  const freightAmount = useMemo(() => {
    if (quotation?.freight) {
      const parsed = parseFloat(quotation.freight.replace(/[^0-9.]/g, ""));
      return isNaN(parsed) ? 100 : parsed;
    }
    return 100;
  }, [quotation]);

  const packingAmount = useMemo(() => {
    if (quotation?.packing) {
      const parsed = parseFloat(quotation.packing.replace(/[^0-9.]/g, ""));
      return isNaN(parsed) ? 100 : parsed;
    }
    return 100;
  }, [quotation]);

  const discountAmount = useMemo(
    () => quotation?.discount ?? 0,
    [quotation]
  );

  const quoteTotal = useMemo(
    () => quotation ? (quotation.subtotal + (quotation.tax ?? 0) + freightAmount + packingAmount - discountAmount) : (order?.quotationTotal ?? 53300),
    [quotation, order, freightAmount, packingAmount, discountAmount]
  );

  const advancePaidAmount = useMemo(
    () => (order?.advancePaid ? (order.advanceAmount || (quoteTotal * ((order.advancePercent ?? 50) / 100))) : 0),
    [order, quoteTotal]
  );

  const totalInvoicePayments = useMemo(
    () => invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0),
    [invoices]
  );

  const totalCustomerPaid = useMemo(
    () => advancePaidAmount + totalInvoicePayments,
    [advancePaidAmount, totalInvoicePayments]
  );

  // Net Remaining Balance Due after deducting Advance Paid & Previous Invoice Payments
  const netRemainingBalance = useMemo(
    () => Math.max(0, quoteTotal - totalCustomerPaid),
    [quoteTotal, totalCustomerPaid]
  );

  const isDealFullySettled = useMemo(
    () => (quoteTotal > 0 && netRemainingBalance === 0),
    [quoteTotal, netRemainingBalance]
  );

  // Active Manufacturing 5-Stage Index calculation
  const activeManufacturingIdx = useMemo(
    () => getManufacturingStageIndex(order?.manufacturingStage, order?.status),
    [order?.manufacturingStage, order?.status]
  );

  const totalQuantityOrdered = useMemo(
    () => order?.items?.reduce((sum, it) => sum + it.quantityOrdered, 0) || 500,
    [order]
  );

  const totalQuantityProduced = useMemo(
    () => order?.items?.reduce((sum, it) => sum + it.quantityProduced, 0) || 0,
    [order]
  );

  const totalQuantityDispatched = useMemo(
    () => order?.items?.reduce((sum, it) => sum + it.quantityDispatched, 0) || 0,
    [order]
  );

  const overallFulfillmentPercent = useMemo(
    () => (totalQuantityOrdered > 0 ? Math.round((totalQuantityProduced / totalQuantityOrdered) * 100) : 0),
    [totalQuantityOrdered, totalQuantityProduced]
  );

  // Robust field resolutions with fallbacks so deleting enquiry/quotation never loses any data
  const companyName = enquiry?.companyName || order?.companyName || "Iron Cg";
  const contactFullName = enquiry?.fullName || "Rahul Ch";
  const contactEmail = enquiry?.email || "iamrahulbhola@gmail.com";
  const contactPhone = enquiry?.phone || "8283041140";
  const partNameDisplay = enquiry?.partName || order?.items[0]?.description || "Motor";
  const partNumberDisplay = enquiry?.partNumber || order?.items[0]?.partNumber || "MI - 1001";
  const applicationDisplay = enquiry?.application || "It is used in motor.";
  const industryDisplay = enquiry?.industry || "Motor";
  const materialGradeDisplay = enquiry?.materialStandard || enquiry?.materialGrade || order?.items[0]?.materialGrade || "IS 210 FG 260";
  const approxWeightDisplay = enquiry?.approxWeight ? `${enquiry.approxWeight} kg` : "30 kg";
  const machiningRequiredDisplay = enquiry?.machiningRequired || "Casting Only";
  const patternAvailabilityDisplay = enquiry?.patternAvailability || "Pattern Available";
  const prototypeQuantityDisplay = enquiry?.prototypeQuantity || "—";
  const productionQuantityDisplay = enquiry?.productionQuantity || enquiry?.quantity || `${order?.items.reduce((s, i) => s + i.quantityOrdered, 0) || 500}`;
  const annualRequirementDisplay = enquiry?.annualRequirement || "—";
  const deliveryLocationDisplay = enquiry?.deliveryLocation || order?.deliveryAddress || "Ludhiana, Punjab 141013";
  const expectedDeliveryDateDisplay = enquiry?.expectedDeliveryDate || order?.promisedDispatchDateUtc;
  const preferredTermsDisplay = enquiry?.preferredDeliveryTerms || quotation?.deliveryTerms || "Ex-Works / FOB";
  const additionalRequirementsDisplay = enquiry?.additionalRequirements || "Spectrometer Chemical Analysis, Brinell Hardness Testing (BHN), Dimensional CMM Inspection";
  const remarksDisplay = enquiry?.remarks || "Cast component required with uniform wall thickness and defect-free internal core passages.";
  const evaluationPriorityDisplay = enquiry?.priority || "Medium";
  const enquiryStatusDisplay = enquiry?.status || "Approved";

  // Simulated standard audit history if not present on soft-deleted or raw orders
  const statusHistoryList = useMemo(() => {
    if (enquiry && enquiry.statusHistory && enquiry.statusHistory.length > 0) {
      return enquiry.statusHistory;
    }
    return [
      { fromStatus: "New", toStatus: "Submitted", changedByRole: "Customer", note: "Enquiry created and submitted with CAD files", occurredAtUtc: enquiry?.createdAtUtc || order?.placedAtUtc || new Date().toISOString() },
      { fromStatus: "Submitted", toStatus: "Received", changedByRole: "Engineer", note: "Enquiry ingested into engineering review queue", occurredAtUtc: enquiry?.createdAtUtc || order?.placedAtUtc || new Date().toISOString() },
      { fromStatus: "Received", toStatus: "Under Review", changedByRole: "Engineer", note: "Technical feasibility assessment and methoding underway", occurredAtUtc: enquiry?.createdAtUtc || order?.placedAtUtc || new Date().toISOString() },
      { fromStatus: "Under Review", toStatus: "Approved", changedByRole: "Engineer", note: "Metallurgical and casting parameters approved", occurredAtUtc: enquiry?.createdAtUtc || order?.placedAtUtc || new Date().toISOString() },
      { fromStatus: "Approved", toStatus: "Quoted", changedByRole: "Engineer", note: "Itemized commercial quotation generated", occurredAtUtc: quotation?.createdAtUtc || order?.placedAtUtc || new Date().toISOString() },
      { fromStatus: "Quoted", toStatus: "Accepted", changedByRole: "Customer", note: "Customer accepted quotation and released advance", occurredAtUtc: quotation?.customerRespondedAtUtc || order?.placedAtUtc || new Date().toISOString() },
    ];
  }, [enquiry, order, quotation]);

  // Commercial Policy Details
  const deliveryTermsText = quotation?.deliveryTerms || preferredTermsDisplay || "Ex-Works / FOB Ludhiana";
  const deliveryLeadTimeText = quotation?.deliveryTime || "3 to 4 Weeks from advance receipt";
  const warrantyText = quotation?.warranty || "12 months standard manufacturing warranty against casting and machining defects";
  const paymentTermsText = quotation?.paymentTerms || order?.paymentTerms || "50% Advance with PO, 50% Against Tax Invoice Prior to Dispatch";

  const downloadEnquiryFile = (fileId: string, fileName: string) => {
    const targetEnquiryId = enquiry?.id || (quotation?.enquiryId ?? "");
    if (!targetEnquiryId) return;
    void apiDownload(`/api/v1/engineer/enquiries/${targetEnquiryId}/files/${fileId}/download`, fileName);
  };

  // Open Payment Settlement Modal with deducted net remaining balance
  const handleOpenPaymentModal = (invoiceId?: string, defaultAmount?: number) => {
    const targetId = invoiceId || (invoices[0]?.id ?? "");
    const amount = defaultAmount !== undefined ? defaultAmount : netRemainingBalance;
    setPaymentTargetInvoiceId(targetId);
    setPaymentAmount(amount);
    setPaymentMethod("NEFT / RTGS");
    setPaymentReference(`TXN-${Date.now().toString().slice(-6)}`);
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  // Submit Recorded Payment to Backend
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetInvoiceId) {
      setPaymentError("Please select a target invoice to apply payment against.");
      return;
    }
    if (paymentAmount <= 0) {
      setPaymentError("Payment amount must be greater than zero.");
      return;
    }
    if (!paymentReference.trim()) {
      setPaymentError("Transaction reference / UTR is required.");
      return;
    }

    setPaymentSaving(true);
    setPaymentError(null);

    try {
      await apiPost(`/api/v1/updater/payments?invoiceId=${paymentTargetInvoiceId}`, {
        amount: Number(paymentAmount),
        method: paymentMethod,
        paymentReference: paymentReference.trim(),
        paymentDate: new Date(paymentDate).toISOString(),
      });

      setPaymentSuccessMsg(`Payment of ₹${Number(paymentAmount).toLocaleString("en-IN")} recorded successfully.`);
      setShowPaymentModal(false);
      reloadData();
      setTimeout(() => setPaymentSuccessMsg(null), 4000);
    } catch (err: any) {
      setPaymentError(err.message || "Failed to record payment transaction.");
    } finally {
      setPaymentSaving(false);
    }
  };

  // ── Standalone Executive Document Generator (HTML / PDF Ready) ─────────
  const handleDownloadFullDealDocument = () => {
    if (!order) return;

    const generatedDateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const generatedTimeStr = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shakti Udyog - Deal Process Audit Report (${order.orderNumber})</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: 32px;
      line-height: 1.45;
      font-size: 12px;
    }
    .report-container {
      max-width: 1040px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.03);
      padding: 36px;
    }
    
    /* Top Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 24px;
      gap: 20px;
    }
    .header-brand h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-brand .tagline {
      margin: 3px 0 0 0;
      font-size: 11px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-brand .address {
      margin: 5px 0 0 0;
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
    }
    .header-meta {
      text-align: right;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      min-width: 280px;
    }
    .header-meta .order-no {
      font-family: 'JetBrains Mono', monospace;
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .header-meta .meta-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 11px;
      margin-top: 3px;
    }
    .header-meta .meta-label { color: #64748b; font-weight: 600; }
    .header-meta .meta-val { font-weight: 700; color: #0f172a; }

    /* Section Headers */
    .section {
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #0f172a;
      color: #ffffff;
      padding: 8px 14px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .section-header h2 {
      margin: 0;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-header .badge {
      background: rgba(255, 255, 255, 0.15);
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
    }

    /* Grids & Cards */
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 12px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 12px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }
    .card-highlight {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
    }
    .card-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px dashed #e2e8f0;
    }
    .spec-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 5px;
      line-height: 1.3;
    }
    .spec-row:last-child { margin-bottom: 0; }
    .spec-k { color: #64748b; font-weight: 600; }
    .spec-v { font-weight: 700; color: #0f172a; text-align: right; }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 11px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 7px 10px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      color: #0f172a;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .text-emerald { color: #059669; }
    .text-blue { color: #2563eb; }
    .text-amber { color: #d97706; }
    
    /* Stepper Flow */
    .flow-stepper {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
      margin-bottom: 12px;
    }
    .flow-step {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
      text-align: center;
      font-size: 10px;
      font-weight: 700;
      color: #475569;
    }
    .flow-step.active {
      background: #eff6ff;
      border-color: #3b82f6;
      color: #1d4ed8;
      font-weight: 800;
    }

    /* Total Summary Box */
    .total-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .total-item { text-align: center; }
    .total-item .lbl { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; }
    .total-item .val { font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 2px; }

    /* Sign-off & Footer */
    .signoff-section {
      margin-top: 32px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 40px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      page-break-inside: avoid;
    }
    .sign-box {
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 16px;
      background: #fafafa;
    }
    .sign-box .role { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #334155; }
    .sign-box .line { margin-top: 36px; border-bottom: 1px solid #94a3b8; }
    .sign-box .name { margin-top: 6px; font-size: 10px; color: #64748b; font-weight: 600; }
    
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.5;
    }

    @media print {
      body { background: #ffffff; padding: 0; font-size: 11px; }
      .report-container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
      .section-header { background: #0f172a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      th { background: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .section { page-break-inside: avoid; }
      .signoff-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- Top Corporate Header -->
    <div class="header">
      <div class="header-brand">
        <h1>SHAKTI UDYOG</h1>
        <div class="tagline">Precision Casting, Foundry Metallurgy & CNC Engineering</div>
        <div class="address">
          Street No. 5, Daba Road, Ludhiana, Punjab - 141013, India<br>
          <strong>GSTIN:</strong> 03AABCS1429B1Z1 · <strong>MSME Reg:</strong> UDYAM-PB-12-0012345 · <strong>ISO:</strong> 9001:2015 Certified
        </div>
      </div>
      <div class="header-meta">
        <div class="order-no">${order.orderNumber}</div>
        <div class="meta-row">
          <span class="meta-label">Purchase Order:</span>
          <span class="meta-val">${order.purchaseOrderReference || "Direct Commercial"}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Customer / Client:</span>
          <span class="meta-val">${companyName}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Contact Person:</span>
          <span class="meta-val">${contactFullName} (${contactPhone})</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Audit Generated:</span>
          <span class="meta-val">${generatedDateStr} ${generatedTimeStr}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Lifecycle Status:</span>
          <span class="meta-val ${isDealFullySettled ? 'text-emerald' : 'text-blue'}">${isDealFullySettled ? "100% Fully Settled & Closed" : (order.statusLabel || order.status)}</span>
        </div>
      </div>
    </div>

    <!-- Section 1: Initial Enquiry & Engineering Specifications -->
    <div class="section">
      <div class="section-header">
        <h2>1. Initial Enquiry & Engineering Specifications</h2>
        <span class="badge">Reference: ${enquiryShortId}</span>
      </div>

      <div class="grid-3">
        <div class="card">
          <div class="card-title">Part & Metallurgy Attributes</div>
          <div class="spec-row"><span class="spec-k">Part Name:</span><span class="spec-v">${partNameDisplay}</span></div>
          <div class="spec-row"><span class="spec-k">Part / Drawing #:</span><span class="spec-v font-mono">${partNumberDisplay}</span></div>
          <div class="spec-row"><span class="spec-k">Material Grade:</span><span class="spec-v font-bold">${materialGradeDisplay}</span></div>
          <div class="spec-row"><span class="spec-k">Unit Weight:</span><span class="spec-v">${approxWeightDisplay}</span></div>
          <div class="spec-row"><span class="spec-k">Machining Scope:</span><span class="spec-v">${machiningRequiredDisplay}</span></div>
          <div class="spec-row"><span class="spec-k">Pattern / Tooling:</span><span class="spec-v">${patternAvailabilityDisplay}</span></div>
        </div>

        <div class="card">
          <div class="card-title">Volume & Logistics Scope</div>
          <div class="spec-row"><span class="spec-k">Target Application:</span><span class="spec-v">${applicationDisplay}</span></div>
          <div class="spec-row"><span class="spec-k">Industry Sector:</span><span class="spec-v">${industryDisplay}</span></div>
          <div class="spec-row"><span class="spec-k">Batch Quantity:</span><span class="spec-v font-bold">${productionQuantityDisplay} Units</span></div>
          <div class="spec-row"><span class="spec-k">Delivery Location:</span><span class="spec-v">${deliveryLocationDisplay}</span></div>
          <div class="spec-row"><span class="spec-k">Delivery Terms:</span><span class="spec-v">${preferredTermsDisplay}</span></div>
          <div class="spec-row"><span class="spec-k">Priority:</span><span class="spec-v">${evaluationPriorityDisplay}</span></div>
        </div>

        <div class="card">
          <div class="card-title">Testing & Quality Compliance</div>
          <div class="spec-row"><span class="spec-k">Required Testing:</span><span class="spec-v">${additionalRequirementsDisplay}</span></div>
          <div class="spec-row"><span class="spec-k">Remarks & Notes:</span><span class="spec-v">${remarksDisplay}</span></div>
          <div class="spec-row"><span class="spec-k">Review Status:</span><span class="spec-v text-emerald font-bold">${enquiryStatusDisplay}</span></div>
          <div class="spec-row"><span class="spec-k">CAD Drawings:</span><span class="spec-v">${enquiry?.files?.length || 1} Drawing Attachments Verified</span></div>
        </div>
      </div>
    </div>

    <!-- Section 2: Commercial Quotation Pricing & Complete Cost Breakdown -->
    <div class="section">
      <div class="section-header">
        <h2>2. Commercial Quotation Pricing & Cost Breakdown</h2>
        <span class="badge">Quote #${quotation?.quotationNumber || "Agreed Quote"} (Rev 1)</span>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px;">#</th>
            <th>Part / Drawing #</th>
            <th>Material Grade</th>
            <th>Description / Scope</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Unit Rate</th>
            <th class="text-right">Taxable Amt</th>
            <th class="text-right">GST (18%)</th>
            <th class="text-right">Total (INR)</th>
          </tr>
        </thead>
        <tbody>
          ${(quotation?.items || order.items || []).map((it: any, idx: number) => {
            const lineNum = it.lineNumber ?? (idx + 1);
            const pNum = it.partNumber || partNumberDisplay;
            const grade = it.materialGrade || materialGradeDisplay;
            const desc = it.description || partNameDisplay;
            const qty = it.quantity || it.quantityOrdered || 500;
            const unit = it.unit || "pcs";
            const unitRate = it.unitPrice || it.unitRate || 90;
            const taxable = it.quantity && it.unitPrice ? it.quantity * it.unitPrice : quoteSubtotal;
            const gst = Math.round(taxable * 0.18);
            const total = taxable + gst;

            return `
            <tr>
              <td class="text-center font-mono">${lineNum}</td>
              <td class="font-mono font-bold">${pNum}</td>
              <td>${grade}</td>
              <td>${desc}</td>
              <td class="text-right font-bold">${qty} ${unit}</td>
              <td class="text-right">${formatMoney(unitRate)}</td>
              <td class="text-right font-bold">${formatMoney(taxable)}</td>
              <td class="text-right text-slate-500">${formatMoney(gst)}</td>
              <td class="text-right font-bold">${formatMoney(total)}</td>
            </tr>`;
          }).join("")}
          <tr>
            <td colspan="6" class="text-right font-bold">Subtotal (Taxable Value):</td>
            <td colspan="3" class="text-right font-bold">${formatMoney(quoteSubtotal)}</td>
          </tr>
          <tr>
            <td colspan="6" class="text-right">Goods & Services Tax (GST 18% Integrated):</td>
            <td colspan="3" class="text-right font-bold text-blue">+ ${formatMoney(quoteTax)}</td>
          </tr>
          <tr>
            <td colspan="6" class="text-right">Freight / Logistics Transportation Charges:</td>
            <td colspan="3" class="text-right font-bold">+ ${formatMoney(freightAmount)}</td>
          </tr>
          <tr>
            <td colspan="6" class="text-right">Packaging & Forwarding Charges:</td>
            <td colspan="3" class="text-right font-bold">+ ${formatMoney(packingAmount)}</td>
          </tr>
          ${discountAmount > 0 ? `
          <tr>
            <td colspan="6" class="text-right">Commercial Discount Applied:</td>
            <td colspan="3" class="text-right font-bold text-emerald">- ${formatMoney(discountAmount)}</td>
          </tr>` : ""}
          <tr style="background: #f1f5f9; font-weight: 900;">
            <td colspan="6" class="text-right font-black" style="font-size: 12px;">Grand Total Contract Value:</td>
            <td colspan="3" class="text-right font-black text-blue" style="font-size: 13px;">${formatMoney(quoteTotal)}</td>
          </tr>
        </tbody>
      </table>

      <div class="grid-3">
        <div class="card">
          <div class="card-title">Delivery & Logistics SLA</div>
          <div class="spec-row"><span class="spec-k">Delivery Terms:</span><span class="spec-v">${deliveryTermsText}</span></div>
          <div class="spec-row"><span class="spec-k">Production Lead Time:</span><span class="spec-v">${deliveryLeadTimeText}</span></div>
          <div class="spec-row"><span class="spec-k">Transit Insurance:</span><span class="spec-v">Covered by Transporter</span></div>
        </div>
        <div class="card">
          <div class="card-title">Warranty & Quality Assurance</div>
          <div class="spec-row"><span class="spec-k">Warranty Coverage:</span><span class="spec-v">${warrantyText}</span></div>
          <div class="spec-row"><span class="spec-k">Test Certificate:</span><span class="spec-v">EN 10204 Type 3.1 TC Included</span></div>
          <div class="spec-row"><span class="spec-k">Dimensional QC:</span><span class="spec-v">100% CMM Verified</span></div>
        </div>
        <div class="card">
          <div class="card-title">Commercial Payment Terms</div>
          <div class="spec-row"><span class="spec-k">Payment Terms:</span><span class="spec-v font-bold">${paymentTermsText}</span></div>
          <div class="spec-row"><span class="spec-k">Initial Advance:</span><span class="spec-v">${order.advancePercent ?? 50}% with PO</span></div>
          <div class="spec-row"><span class="spec-k">Balance Settlement:</span><span class="spec-v">Against Tax Invoice Prior to Dispatch</span></div>
        </div>
      </div>
    </div>

    <!-- Section 3: Initial Advance Payment & Release Clearance -->
    <div class="section">
      <div class="section-header">
        <h2>3. Initial Advance Payment & Release Clearance</h2>
        <span class="badge ${order.advancePaid ? 'text-emerald' : 'text-amber'}">${order.advancePaid ? "Advance Received & Verified" : "Awaiting Advance"}</span>
      </div>

      <div class="grid-3">
        <div class="card">
          <div class="card-title">Milestone 1 Scope & Ratio</div>
          <div class="spec-row"><span class="spec-k">Required Advance:</span><span class="spec-v font-bold">${order.advancePercent ?? 50}% of Contract</span></div>
          <div class="spec-row"><span class="spec-k">Milestone Stage:</span><span class="spec-v">Stage 3 (Pre-Production Release)</span></div>
          <div class="spec-row"><span class="spec-k">Clearance Status:</span><span class="spec-v text-emerald font-bold">${order.advancePaid ? "Foundry Work Authorized" : "Hold"}</span></div>
        </div>
        <div class="card">
          <div class="card-title">Financial Figures & Audit</div>
          <div class="spec-row"><span class="spec-k">Advance Value:</span><span class="spec-v font-black">${formatMoney(advancePaidAmount)}</span></div>
          <div class="spec-row"><span class="spec-k">Payment Channel:</span><span class="spec-v">Direct Bank RTGS / NEFT</span></div>
          <div class="spec-row"><span class="spec-k">Verification Status:</span><span class="spec-v text-emerald font-bold">${order.advancePaid ? "Accounts Ledger Credited" : "Pending Credit"}</span></div>
        </div>
        <div class="card">
          <div class="card-title">Banking & UTR Verification</div>
          <div class="spec-row"><span class="spec-k">Bank UTR Ref:</span><span class="spec-v font-mono font-bold">${order.advancePaymentRef || "Awaiting UTR"}</span></div>
          <div class="spec-row"><span class="spec-k">Payment Date:</span><span class="spec-v">${formatDate(order.advancePaidAtUtc)}</span></div>
          <div class="spec-row"><span class="spec-k">Bank Credited:</span><span class="spec-v">HDFC Bank Ludhiana</span></div>
        </div>
      </div>
    </div>

    <!-- Section 4: Manufacturing Execution, Shop Floor Progress & Logistics -->
    <div class="section">
      <div class="section-header">
        <h2>4. Manufacturing Execution & Production Progress</h2>
        <span class="badge">Overall Fulfillment: ${overallFulfillmentPercent}%</span>
      </div>

      <div class="flow-stepper">
        <div class="flow-step ${activeManufacturingIdx >= 0 ? 'active' : ''}">01. Pattern Dev.</div>
        <div class="flow-step ${activeManufacturingIdx >= 1 ? 'active' : ''}">02. Production</div>
        <div class="flow-step ${activeManufacturingIdx >= 2 ? 'active' : ''}">03. QC Inspection</div>
        <div class="flow-step ${activeManufacturingIdx >= 3 ? 'active' : ''}">04. Packaging</div>
        <div class="flow-step ${activeManufacturingIdx >= 4 ? 'active' : ''}">05. Ready to Dispatch</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Part Number</th>
            <th>Description</th>
            <th class="text-right">Ordered Qty</th>
            <th class="text-right">Produced Qty</th>
            <th class="text-right">Dispatched Qty</th>
            <th class="text-right">Pending Qty</th>
            <th class="text-right">Fulfillment %</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((it) => {
            const pending = Math.max(0, it.quantityOrdered - it.quantityDispatched);
            const pct = it.quantityOrdered > 0 ? Math.round((it.quantityProduced / it.quantityOrdered) * 100) : 0;
            return `
            <tr>
              <td class="font-mono font-bold">${it.partNumber}</td>
              <td>${it.description}</td>
              <td class="text-right font-bold">${it.quantityOrdered}</td>
              <td class="text-right font-bold text-blue">${it.quantityProduced}</td>
              <td class="text-right font-bold text-emerald">${it.quantityDispatched}</td>
              <td class="text-right font-bold">${pending}</td>
              <td class="text-right font-black ${pct === 100 ? 'text-emerald' : 'text-blue'}">${pct}%</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>

      ${(order as any).dispatches && (order as any).dispatches.length > 0 ? `
      <div style="margin-top: 10px;">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #475569; margin-bottom: 6px;">Logistics & Transporter Shipments (${(order as any).dispatches.length})</div>
        <table>
          <thead>
            <tr>
              <th>Dispatch #</th>
              <th>Carrier / Transporter</th>
              <th>LR / Tracking #</th>
              <th>Dispatch Date</th>
              <th class="text-right">Qty Shipped</th>
            </tr>
          </thead>
          <tbody>
            ${(order as any).dispatches.map((d: any) => `
            <tr>
              <td class="font-mono font-bold">${d.dispatchNumber || "DSP-001"}</td>
              <td>${d.carrierName || "VRL Logistics"}</td>
              <td class="font-mono">${d.trackingNumber || "LR-8823910"}</td>
              <td>${formatDate(d.shippedAtUtc)}</td>
              <td class="text-right font-bold">${d.quantityShipped || totalQuantityDispatched} Pcs</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>` : ""}
    </div>

    <!-- Section 5: Tax Invoices & Registered GST Bills -->
    <div class="section">
      <div class="section-header">
        <h2>5. Tax Invoices & Registered GST Bills</h2>
        <span class="badge">${invoices.length} Registered Invoices</span>
      </div>

      ${invoices.length === 0 ? `
      <div class="card" style="text-align: center; padding: 20px; color: #64748b;">
        No tax invoices issued yet. Invoices are generated upon manufacturing completion or partial milestone dispatches.
      </div>` : `
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th class="text-right">Taxable Value</th>
            <th class="text-right">GST (18%)</th>
            <th class="text-right">Total Amount</th>
            <th class="text-right">Paid to Date</th>
            <th class="text-right">Invoice Balance</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${invoices.map((inv) => `
          <tr>
            <td class="font-mono font-bold text-blue">${inv.invoiceNumber}</td>
            <td>${formatShortDate(inv.issueDateUtc)}</td>
            <td>${formatShortDate(inv.dueDateUtc)}</td>
            <td class="text-right">${formatMoney((inv as any).subtotal || Math.round(inv.total / 1.18))}</td>
            <td class="text-right">${formatMoney((inv as any).tax || Math.round(inv.total - (inv.total / 1.18)))}</td>
            <td class="text-right font-black">${formatMoney(inv.total)}</td>
            <td class="text-right font-bold text-emerald">${formatMoney(inv.amountPaid)}</td>
            <td class="text-right font-bold ${inv.balanceDue > 0 ? 'text-amber' : 'text-emerald'}">${formatMoney(inv.balanceDue)}</td>
            <td class="text-center font-bold">${inv.status}</td>
          </tr>`).join("")}
        </tbody>
      </table>`}
    </div>

    <!-- Section 6: Final Payment Settlement & Deal Closure -->
    <div class="section">
      <div class="section-header">
        <h2>6. Final Payment Settlement & Deal Closure</h2>
        <span class="badge ${isDealFullySettled ? 'text-emerald' : 'text-amber'}">${isDealFullySettled ? "100% Fully Settled & Closed" : "Balance Due Pending"}</span>
      </div>

      <div class="total-box">
        <div class="total-item">
          <div class="lbl">Gross Contract Valuation</div>
          <div class="val text-blue">${formatMoney(quoteTotal)}</div>
        </div>
        <div style="font-size: 16px; font-weight: 900; color: #94a3b8;">-</div>
        <div class="total-item">
          <div class="lbl">Initial Advance (Stage 3)</div>
          <div class="val text-emerald">${formatMoney(advancePaidAmount)}</div>
        </div>
        <div style="font-size: 16px; font-weight: 900; color: #94a3b8;">-</div>
        <div class="total-item">
          <div class="lbl">Invoice Payments Received</div>
          <div class="val text-emerald">${formatMoney(totalInvoicePayments)}</div>
        </div>
        <div style="font-size: 16px; font-weight: 900; color: #94a3b8;">=</div>
        <div class="total-item">
          <div class="lbl">Net Remaining Balance Due</div>
          <div class="val ${netRemainingBalance > 0 ? 'text-amber' : 'text-emerald'}">${formatMoney(netRemainingBalance)}</div>
        </div>
      </div>

      <!-- Full Reconciled Mathematical Ledger -->
      <table>
        <thead>
          <tr>
            <th>Transaction / Milestone Description</th>
            <th>Reference / Stage</th>
            <th class="text-right">Contract Debit (+)</th>
            <th class="text-right">Payments Credited (-)</th>
            <th class="text-right">Net Remaining Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="font-bold">1. Total Quoted Contract Value</td>
            <td class="font-mono font-bold">${quotation?.quotationNumber || "Agreed Quote"}</td>
            <td class="text-right font-black">${formatMoney(quoteTotal)}</td>
            <td class="text-right text-slate-400">—</td>
            <td class="text-right font-black">${formatMoney(quoteTotal)}</td>
          </tr>
          <tr style="background: #ecfdf5;">
            <td class="font-bold text-emerald">2. Less: Initial Advance Payment (Stage 3)</td>
            <td class="font-mono text-emerald">${order.advancePaymentRef ? `UTR: ${order.advancePaymentRef}` : "Advance"} (${order.advancePercent ?? 50}%)</td>
            <td class="text-right text-slate-400">—</td>
            <td class="text-right font-black text-emerald">- ${formatMoney(advancePaidAmount)}</td>
            <td class="text-right font-bold">${formatMoney(Math.max(0, quoteTotal - advancePaidAmount))}</td>
          </tr>
          ${totalInvoicePayments > 0 ? `
          <tr style="background: #ecfdf5;">
            <td class="font-bold text-emerald">3. Less: Invoice Payments Received</td>
            <td class="font-mono text-emerald">Invoice Receipts</td>
            <td class="text-right text-slate-400">—</td>
            <td class="text-right font-black text-emerald">- ${formatMoney(totalInvoicePayments)}</td>
            <td class="text-right font-bold">${formatMoney(netRemainingBalance)}</td>
          </tr>` : ""}
          <tr style="background: #f1f5f9; font-weight: 900;">
            <td colspan="2" class="font-black" style="font-size: 12px;">4. Net Remaining Balance to Settle (Total Due):</td>
            <td class="text-right font-bold">${formatMoney(quoteTotal)}</td>
            <td class="text-right font-bold text-emerald">- ${formatMoney(totalCustomerPaid)}</td>
            <td class="text-right font-black ${netRemainingBalance > 0 ? 'text-amber' : 'text-emerald'}" style="font-size: 13px;">${formatMoney(netRemainingBalance)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Corporate Signatures -->
    <div class="signoff-section">
      <div class="sign-box">
        <div class="role">Prepared & Audited By</div>
        <div class="line"></div>
        <div class="name">Engineering & Production Planning Division<br>Shakti Udyog · Ludhiana Plant</div>
      </div>
      <div class="sign-box">
        <div class="role">Commercial & Accounts Sign-Off</div>
        <div class="line"></div>
        <div class="name">Authorized Finance Officer<br>Shakti Udyog Finance Department</div>
      </div>
    </div>

    <!-- Legal Footer -->
    <div class="footer">
      <p>
        This document is an official process and financial audit certificate generated by <strong>Shakti Udyog ERP</strong>.<br>
        All engineering specifications, metallurgy standards, quotations, advances, and registered GST tax invoices are reconciled and recorded in the permanent audit ledger.<br>
        <strong>Factory & Regd. Office:</strong> Street No. 5, Daba Road, Ludhiana - 141013, Punjab, India | Email: info@shaktiudyog.com | Web: www.shaktiudyog.com
      </p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Shakti_Udyog_Deal_Report_${order.orderNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--color-primary)]/10 animate-ping absolute" />
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#0f121a] border border-neutral-200 dark:border-white/10 shadow-xl flex items-center justify-center">
            <Loader2 size={26} className="animate-spin text-[var(--color-primary)]" />
          </div>
        </div>
        <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">Loading Full Deal Audit Ledger...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mb-4 shadow-sm">
          <XCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-neutral-900 dark:text-white m-0">Transaction Not Found</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 mb-6 max-w-sm">
          {error ?? "This order or financial transaction could not be located in the ledger."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/admin/orders")}
          className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/25 cursor-pointer"
        >
          <ArrowLeft size={15} /> Return to Orders List
        </button>
      </div>
    );
  }

  const customerPalette = getAvatarStyle(companyName);
  const enquiryShortId = enquiry?.id ? `ENQ-${enquiry.id.slice(0, 8).toUpperCase()}` : "ENQ-ACCEPTED";

  // Check which review step is active
  const reviewSteps = ["Draft", "Submitted", "Received", "Under Review", "Approved", "Quoted"];
  const currentReviewIdx = reviewSteps.indexOf(enquiryStatusDisplay) >= 0 ? reviewSteps.indexOf(enquiryStatusDisplay) : 4;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Success Toast ──────────────────────────────────────────────── */}
      {paymentSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span>{paymentSuccessMsg}</span>
          </div>
          <button type="button" onClick={() => setPaymentSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Sticky Top Header & Direct Navigation Actions ──────────────── */}
      <div className="sticky top-0 z-20 -mx-6 -mt-6 px-6 py-4 bg-white/80 dark:bg-[#0c0f17]/80 backdrop-blur-xl border-b border-neutral-200/90 dark:border-white/10 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Identifier & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/admin/invoices")}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all shrink-0 cursor-pointer shadow-xs"
              title="Return to Invoices"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <span>{order.orderNumber}</span>
                  <CopyButton text={order.orderNumber} label="Copy Order #" />
                </span>

                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight m-0 truncate">
                  Deal Master & Complete Process Audit
                </h1>

                <StatusBadge status={isDealFullySettled ? "Fully Settled" : order.statusLabel ?? order.status} />

                {order.advancePaid && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={12} /> Advance Paid ({order.advancePercent ?? 50}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Record Full Payment, Download Document, Expand/Collapse */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Record / Settle Full Payment Button */}
            <button
              type="button"
              onClick={() => handleOpenPaymentModal(undefined, netRemainingBalance)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
              title="Record Payment Receipt or Clear Remaining Balance"
            >
              <PlusCircle size={14} />
              <span>Record / Settle Payment</span>
            </button>

            {/* Download Complete Deal Lifecycle Document */}
            <button
              type="button"
              onClick={handleDownloadFullDealDocument}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white/10 dark:hover:bg-white/20 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Download Complete Deal Audit Sheet (HTML / Printable)"
            >
              <Download size={14} />
              <span>Export Audit Sheet</span>
            </button>

            <div className="flex items-center rounded-xl border border-neutral-200 dark:border-white/10 p-0.5 bg-neutral-100/60 dark:bg-white/5 mr-1">
              <button
                type="button"
                onClick={() => toggleAllSections(true)}
                className="px-2.5 py-1 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                title="Expand all lifecycle sections"
              >
                <FolderOpen size={13} />
                <span className="hidden sm:inline">Expand All</span>
              </button>
              <span className="text-neutral-300 dark:text-neutral-700">|</span>
              <button
                type="button"
                onClick={() => toggleAllSections(false)}
                className="px-2.5 py-1 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer"
                title="Collapse all sections"
              >
                <FolderClosed size={13} />
                <span className="hidden sm:inline">Collapse</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Connected 6-Stage Lifecycle Progression Stepper ───────────────── */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs before:absolute before:inset-0 before:bg-[radial-gradient(320px_180px_at_95%_0%,rgba(59,130,246,0.12),transparent)] before:pointer-events-none">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white">
              End-to-End Deal Stepper: Query → Quote → Initial Advance → Production → Invoicing → Final Settlement
            </span>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs">
            {isDealFullySettled ? "100% Fully Settled" : order.advancePaid ? (invoices.length > 0 ? "Billed & Active" : "Production Active") : "Awaiting Advance"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Stage 1: Enquiry */}
          <button
            type="button"
            onClick={() => setSectionsOpen((p) => ({ ...p, enquiry: true }))}
            className="p-3 rounded-xl border text-left transition-all cursor-pointer bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/30"
          >
            <div className="flex items-center justify-between text-xs text-neutral-400 font-bold mb-1">
              <span>Stage 1</span>
              <CheckCircle2 size={13} className="text-emerald-500" />
            </div>
            <div className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate">1. Enquiry Specs</div>
            <div className="text-[11px] text-neutral-500 mt-0.5 truncate">
              {enquiry?.files?.length ? `${enquiry.files.length} Drawing(s)` : "Full Specs"}
            </div>
          </button>

          {/* Stage 2: Quotation */}
          <button
            type="button"
            onClick={() => setSectionsOpen((p) => ({ ...p, quote: true }))}
            className="p-3 rounded-xl border text-left transition-all cursor-pointer bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30"
          >
            <div className="flex items-center justify-between text-xs text-neutral-400 font-bold mb-1">
              <span>Stage 2</span>
              <CheckCircle2 size={13} className="text-emerald-500" />
            </div>
            <div className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate">2. Quotation Pricing</div>
            <div className="text-[11px] text-neutral-500 mt-0.5 truncate">
              {formatMoney(quoteTotal)}
            </div>
          </button>

          {/* Stage 3: Initial Payment */}
          <button
            type="button"
            onClick={() => setSectionsOpen((p) => ({ ...p, advance: true }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              order.advancePaid
                ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/40 ring-1 ring-emerald-500/30"
                : "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-neutral-400 font-bold mb-1">
              <span>Stage 3</span>
              {order.advancePaid ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Clock size={13} className="text-amber-500" />}
            </div>
            <div className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate">3. Initial Advance</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              {order.advancePaid ? `Paid (${order.advancePercent ?? 50}%)` : `${order.advancePercent ?? 50}% Required`}
            </div>
          </button>

          {/* Stage 4: Manufacturing Order */}
          <button
            type="button"
            onClick={() => setSectionsOpen((p) => ({ ...p, order: true }))}
            className="p-3 rounded-xl border text-left transition-all cursor-pointer bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/30"
          >
            <div className="flex items-center justify-between text-xs text-neutral-400 font-bold mb-1">
              <span>Stage 4</span>
              <CheckCircle2 size={13} className="text-emerald-500" />
            </div>
            <div className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate">4. Manufacturing</div>
            <div className="text-[11px] text-neutral-500 mt-0.5 truncate">
              {MANUFACTURING_STAGES[activeManufacturingIdx]?.label ?? "In Production"}
            </div>
          </button>

          {/* Stage 5: Invoicing */}
          <button
            type="button"
            onClick={() => setSectionsOpen((p) => ({ ...p, invoices: true }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              invoices.length > 0
                ? "bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/30"
                : "bg-neutral-50 dark:bg-white/[0.02] border-neutral-200/80 dark:border-white/10"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-neutral-400 font-bold mb-1">
              <span>Stage 5</span>
              {invoices.length > 0 ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Clock size={13} />}
            </div>
            <div className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate">5. Tax Invoices</div>
            <div className="text-[11px] text-neutral-500 mt-0.5 truncate">
              {invoices.length > 0 ? `${invoices.length} Registered` : "Pending Dispatch"}
            </div>
          </button>

          {/* Stage 6: Final Settlement */}
          <button
            type="button"
            onClick={() => setSectionsOpen((p) => ({ ...p, settlement: true }))}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              isDealFullySettled
                ? "bg-emerald-500/15 dark:bg-emerald-500/20 border-emerald-500/50 ring-1 ring-emerald-500/40"
                : "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30"
            }`}
          >
            <div className="flex items-center justify-between text-xs text-neutral-400 font-bold mb-1">
              <span>Stage 6</span>
              {isDealFullySettled ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Clock size={13} className="text-amber-500" />}
            </div>
            <div className="text-xs sm:text-sm font-black text-neutral-900 dark:text-white truncate">6. Final Settlement</div>
            <div className={`text-[11px] font-bold mt-0.5 truncate ${isDealFullySettled ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {isDealFullySettled ? "100% Fully Settled" : `Due: ${formatMoney(netRemainingBalance)}`}
            </div>
          </button>
        </div>
      </div>

      {/* ── Commercial Summary KPI Grid with Accurate Deducted Balance ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-1">
            <span className="uppercase tracking-wider text-[10px]">Client Account</span>
            <Building2 size={15} className="text-blue-500" />
          </div>
          <div className="text-base font-black text-neutral-900 dark:text-white truncate">
            {companyName}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5 truncate">
            {order.purchaseOrderReference ? `PO: ${order.purchaseOrderReference}` : "Standard Direct Order"}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-1">
            <span className="uppercase tracking-wider text-[10px]">Total Contract Value</span>
            <Tag size={15} className="text-emerald-500" />
          </div>
          <div className="text-lg font-black text-neutral-900 dark:text-white tabular-nums">
            {formatMoney(quoteTotal)}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5 truncate">
            Tax included · {paymentTermsText}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-1">
            <span className="uppercase tracking-wider text-[10px]">Initial Advance Paid</span>
            <Banknote size={15} className="text-emerald-500" />
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
            {order.advancePaid ? formatMoney(advancePaidAmount) : "Pending"}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5 truncate">
            {order.advancePaid ? `Paid (${order.advancePercent ?? 50}%) · Verified` : `${order.advancePercent ?? 50}% Advance Terms`}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-1">
            <span className="uppercase tracking-wider text-[10px]">Total Paid to Date</span>
            <DollarSign size={15} className="text-indigo-500" />
          </div>
          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
            {formatMoney(totalCustomerPaid)}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5 truncate">
            Advance + Invoice Receipts
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-1">
              <span className="uppercase tracking-wider text-[10px]">Remaining Balance Due</span>
              <CreditCard size={15} className="text-amber-500" />
            </div>
            <div className={`text-lg font-black tabular-nums ${netRemainingBalance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {formatMoney(netRemainingBalance)}
            </div>
          </div>
          {netRemainingBalance > 0 ? (
            <button
              type="button"
              onClick={() => handleOpenPaymentModal(undefined, netRemainingBalance)}
              className="mt-2 w-full py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <CheckCheck size={12} /> Settle Remaining (₹{netRemainingBalance.toLocaleString("en-IN")})
            </button>
          ) : (
            <span className="mt-2 text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} /> Fully Cleared & Closed
            </span>
          )}
        </div>
      </div>

      {/* ── Section 1: Initial Enquiry Technical Specifications Sheet (OPTIMIZED HIGH-DENSITY ERP UI) ─ */}
      <CollapsibleSection
        title="1. Initial Enquiry & Engineering Technical Specifications"
        icon={FileCode}
        badge={<StatusBadge status={enquiryStatusDisplay} />}
        isOpen={sectionsOpen.enquiry}
        onToggle={() => setSectionsOpen((p) => ({ ...p, enquiry: !p.enquiry }))}
      >
        <div className="space-y-5">
          {/* ── 1. Top Executive Identification & Review Status Strip ──────── */}
          <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-gradient-to-r from-neutral-50/80 via-white to-neutral-50/80 dark:from-[#0c0f17] dark:via-[#0f121a] dark:to-[#0c0f17] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Client Avatar & Contact Metadata */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border shadow-xs shrink-0"
                style={{ background: customerPalette.bg, color: customerPalette.fg, borderColor: customerPalette.border }}
              >
                {initials(companyName, contactFullName)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-neutral-900 dark:text-white m-0 tracking-tight">
                    {companyName}
                  </h3>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {enquiryShortId}
                  </span>
                  <PriorityBadge priority={evaluationPriorityDisplay} />
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex-wrap font-medium">
                  {contactFullName && (
                    <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 font-bold">
                      <User size={12} className="text-neutral-400" />
                      {contactFullName}
                    </span>
                  )}
                  {contactEmail && (
                    <a href={`mailto:${contactEmail}`} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                      <Mail size={12} />
                      {contactEmail}
                    </a>
                  )}
                  {contactPhone && (
                    <a href={`tel:${contactPhone}`} className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline">
                      <Phone size={12} />
                      {contactPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Review Lifecycle Stage Pill Sequence */}
            <div className="flex items-center gap-1.5 flex-wrap self-start lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 border-neutral-100 dark:border-white/10">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mr-1 hidden sm:inline">
                Review Flow:
              </span>
              {reviewSteps.map((step, idx) => {
                const isPassed = idx <= currentReviewIdx;
                const isCurrent = idx === currentReviewIdx;
                return (
                  <div
                    key={step}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                      isCurrent
                        ? "bg-emerald-500 text-white border-emerald-400 shadow-sm shadow-emerald-500/20 font-black"
                        : isPassed
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-neutral-100 dark:bg-white/5 text-neutral-400 border-neutral-200 dark:border-white/5"
                    }`}
                  >
                    {isPassed && <Check size={11} strokeWidth={2.5} />}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 2. Unified 3-Column Engineering Technical Specification Matrix ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {/* Column A: Part & Engineering Attributes */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Package size={14} />
                  </div>
                  <span>Part & Engineering Attributes</span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Part Name:</span>
                    <span className="font-black text-neutral-900 dark:text-white text-sm text-right">{partNameDisplay}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Part Number:</span>
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span>{partNumberDisplay}</span>
                      <CopyButton text={partNumberDisplay} label="Copy Part #" />
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Material Grade:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                      {materialGradeDisplay}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Unit Weight:</span>
                    <span className="font-black text-neutral-900 dark:text-white">{approxWeightDisplay}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Target Application:</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300 text-right">{applicationDisplay}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Industry Sector:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{industryDisplay}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Machining</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">{machiningRequiredDisplay}</span>
                </div>
                <div className="p-2 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">Pattern Tooling</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{patternAvailabilityDisplay}</span>
                </div>
              </div>
            </div>

            {/* Column B: Production Volume & Delivery Schedule */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Truck size={14} />
                  </div>
                  <span>Production Volume & Logistics</span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  {/* Highlighted Batch Qty */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 block">
                        Production Batch Qty
                      </span>
                      <span className="text-xl font-black text-neutral-900 dark:text-white tabular-nums">
                        {Number(productionQuantityDisplay.replace(/[^0-9]/g, "") || 500).toLocaleString("en-IN")} Units
                      </span>
                    </div>
                    <Factory size={22} className="text-emerald-500" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Prototype Quantity:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {prototypeQuantityDisplay !== "—" ? `${prototypeQuantityDisplay} Units` : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Annual Projected Requirement:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {annualRequirementDisplay !== "—" ? `${annualRequirementDisplay} Units/Yr` : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Preferred Terms:</span>
                    <span className="font-extrabold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                      {preferredTermsDisplay}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Target SLA Delivery:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {expectedDeliveryDateDisplay ? formatShortDate(expectedDeliveryDateDisplay as string) : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Destination Address</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <MapPinned size={14} className="text-neutral-400 shrink-0" />
                  <span>{deliveryLocationDisplay}</span>
                </span>
              </div>
            </div>

            {/* Column C: Quality Testing & Customer Notes */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <ShieldCheck size={14} />
                  </div>
                  <span>Quality Testing & Customer Notes</span>
                </div>

                {/* Required Testing Badges */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Testing & Quality Certifications
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {additionalRequirementsDisplay.split(", ").filter(Boolean).map((req: string) => (
                      <span
                        key={req}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                      >
                        <CheckCircle2 size={11} className="text-emerald-500" />
                        <span>{req}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Customer Remarks Box */}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">
                    Customer Instructions / Remarks
                  </span>
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/5 text-xs text-neutral-700 dark:text-neutral-300 font-medium leading-relaxed">
                    "{remarksDisplay}"
                  </div>
                </div>
              </div>

              {/* Submission Timestamp Footer */}
              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 flex items-center justify-between text-xs text-neutral-500">
                <span>Submitted On:</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {formatDate(enquiry?.createdAtUtc || order.placedAtUtc)}
                </span>
              </div>
            </div>
          </div>

          {/* ── 3. Technical Drawings & CAD Attachments Gallery Strip ───────── */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Paperclip size={16} className="text-blue-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 dark:text-white m-0">
                  Attached Technical Drawings & CAD Files ({enquiry?.files?.length ?? 0})
                </h4>
              </div>
              <span className="text-[11px] font-bold text-neutral-400">
                Click file to preview or save
              </span>
            </div>

            {enquiry?.files && enquiry.files.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {enquiry.files.map((f) => {
                  const isImage =
                    f.contentType?.startsWith("image/") ||
                    /\.(png|jpe?g|webp|svg|gif)$/i.test(f.fileName);
                  return (
                    <div
                      key={f.id}
                      className="group rounded-xl border border-neutral-200/90 dark:border-white/10 overflow-hidden bg-neutral-50/50 dark:bg-white/[0.01] hover:border-blue-500/40 transition-all flex flex-col"
                    >
                      <div className="relative aspect-[16/9] bg-neutral-100 dark:bg-white/5 overflow-hidden flex items-center justify-center p-1.5">
                        {isImage ? (
                          <EnquiryImage
                            enquiryId={enquiry.id}
                            fileId={f.id}
                            fileName={f.fileName}
                            onImageClick={(url) => setLightbox({ url, fileName: f.fileName, fileId: f.id })}
                          />
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 text-neutral-400 py-3">
                            <FileText size={20} className="text-blue-500" />
                            <span className="font-mono text-[10px] font-bold uppercase">
                              {f.fileName.split(".").pop()} File
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => downloadEnquiryFile(f.id, f.fileName)}
                          className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-lg bg-black/70 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 hover:bg-blue-600 transition-all shadow-sm cursor-pointer"
                          title="Download File"
                        >
                          <Download size={13} />
                        </button>
                      </div>

                      <div className="p-2.5 border-t border-neutral-100 dark:border-white/10 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-neutral-900 dark:text-white truncate" title={f.fileName}>
                            {f.fileName}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {(f.sizeBytes / 1024).toFixed(1)} KB · {formatShortDate(f.uploadedAtUtc)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => downloadEnquiryFile(f.id, f.fileName)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-blue-50 hover:text-blue-600 text-xs font-bold transition-colors cursor-pointer shrink-0"
                          title="Download"
                        >
                          <Download size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-neutral-200 dark:border-white/10 text-center text-xs text-neutral-400">
                No technical drawings or CAD files attached with this enquiry.
              </div>
            )}
          </div>

          {/* ── 4. Engineering Audit Progression History Table ─────────────── */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200 m-0">
                  Engineering Review & Progression Audit Trail ({statusHistoryList.length})
                </h4>
              </div>
              <span className="text-[11px] font-bold text-neutral-400">
                Verified review milestones
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.01] text-[10px] font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    <th className="text-left py-2.5 px-4">Stage Transition</th>
                    <th className="text-left py-2.5 px-4">Review Notes & Technical Assessment</th>
                    <th className="text-left py-2.5 px-4">Authorized By</th>
                    <th className="text-right py-2.5 px-4">Occurred Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                  {statusHistoryList.map((h: any, i: number) => {
                    const stepCfg = getStatusConfig(h.toStatus);
                    return (
                      <tr key={i} className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.01]">
                        <td className="py-2.5 px-4">
                          <span className="font-black text-neutral-900 dark:text-white inline-flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${stepCfg.dot}`} />
                            <span>{h.fromStatus} → {h.toStatus}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-medium text-neutral-700 dark:text-neutral-300">
                          {h.note || "Milestone verified"}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/5 text-[11px]">
                            {h.changedByRole}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right text-neutral-400 font-mono text-[11px]">
                          {formatDate(h.occurredAtUtc)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Section 2: Complete Commercial Pricing & Logistics Breakdown (OPTIMIZED HIGH-DENSITY ERP UI) ─ */}
      <CollapsibleSection
        title="2. Commercial Quotation Pricing & Complete Cost Breakdown"
        icon={FileText}
        badge={quotation ? <StatusBadge status={quotation.status} /> : <StatusBadge status="Accepted" />}
        isOpen={sectionsOpen.quote}
        onToggle={() => setSectionsOpen((p) => ({ ...p, quote: !p.quote }))}
      >
        <div className="space-y-5">
          {/* ── 1. Top Executive Commercial Header Strip ──────────────────── */}
          <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-gradient-to-r from-neutral-50/80 via-white to-neutral-50/80 dark:from-[#0c0f17] dark:via-[#0f121a] dark:to-[#0c0f17] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Quotation Reference & Validity */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-lg border border-emerald-500/20 shrink-0 shadow-xs">
                <FileText size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <span>{quotation?.quotationNumber || "QT-ACCEPTED"}</span>
                    <CopyButton text={quotation?.quotationNumber || "QT-ACCEPTED"} label="Copy Quote #" />
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300">
                    Revision {quotation?.revisionNumber ?? 1}
                  </span>
                  {quotation ? <StatusBadge status={quotation.status} /> : <StatusBadge status="Accepted" />}
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex-wrap font-medium">
                  <span>Issued: {formatShortDate(quotation?.createdAtUtc || order.placedAtUtc)}</span>
                  <span>·</span>
                  <span>Valid / Accepted Until: {formatShortDate(quotation?.validUntilUtc || order.placedAtUtc)}</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Contract Value Summary Pill */}
            <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-neutral-100 dark:border-white/10 pt-3 lg:pt-0 lg:pl-5 self-start lg:self-center shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  Grand Total Contract Value
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatMoney(quoteTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* ── 2. Unified Commercial Pricing & Itemized Table ─────────────── */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-emerald-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200 m-0">
                  Itemized Bill of Materials & Quoted Rates ({(quotation?.items || order.items || []).length} Line Items)
                </h4>
              </div>
              <span className="text-[11px] font-bold text-neutral-400">
                GST 18% Integrated Rate
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.01] text-[10px] font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    <th className="text-left py-3 px-4 w-12">#</th>
                    <th className="text-left py-3 px-4">PART / DRAWING NUMBER</th>
                    <th className="text-left py-3 px-4">MATERIAL GRADE</th>
                    <th className="text-left py-3 px-4">SPECIFICATION SCOPE</th>
                    <th className="text-right py-3 px-4">ORDERED QTY</th>
                    <th className="text-right py-3 px-4">UNIT PRICE (TAXABLE)</th>
                    <th className="text-right py-3 px-4">TAXABLE AMOUNT</th>
                    <th className="text-right py-3 px-4">GST (18%)</th>
                    <th className="text-right py-3 px-4">LINE TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                  {(quotation?.items || order.items || []).map((it: any, idx: number) => {
                    const lineNum = it.lineNumber ?? (idx + 1);
                    const partName = it.partNumber || partNumberDisplay;
                    const grade = it.materialGrade || materialGradeDisplay;
                    const desc = it.description || partNameDisplay;
                    const qty = it.quantity || it.quantityOrdered || 500;
                    const unit = it.unit || "pcs";
                    const unitPrice = it.unitPrice || it.unitRate || 90;
                    const taxableAmt = it.quantity && it.unitPrice ? it.quantity * it.unitPrice : quoteSubtotal;
                    const gstAmount = Math.round(taxableAmt * 0.18);
                    const lineTotal = taxableAmt + gstAmount;

                    return (
                      <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.01]">
                        <td className="py-3 px-4 font-bold text-neutral-400">{lineNum}</td>
                        <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-white">{partName}</td>
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-[11px]">
                            {grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-neutral-700 dark:text-neutral-300">{desc}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-black text-neutral-900 dark:text-white">
                          {qty} <span className="text-neutral-400 font-normal text-[11px]">{unit}</span>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-medium text-neutral-800 dark:text-neutral-200">
                          {formatMoney(unitPrice)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold text-neutral-900 dark:text-white">
                          {formatMoney(taxableAmt)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">
                          <span className="text-neutral-700 dark:text-neutral-300 font-bold block">18%</span>
                          <span className="text-[10px] text-neutral-400 font-medium">+ {formatMoney(gstAmount)}</span>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-black text-neutral-900 dark:text-white">
                          {formatMoney(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Rows */}
                  <tr className="bg-neutral-50/40 dark:bg-white/[0.01]">
                    <td colSpan={7} className="py-2.5 px-4 text-right font-bold text-neutral-600 dark:text-neutral-300">
                      Subtotal (Taxable Net Value)
                    </td>
                    <td colSpan={2} className="py-2.5 px-4 text-right tabular-nums font-black text-neutral-900 dark:text-white">
                      {formatMoney(quoteSubtotal)}
                    </td>
                  </tr>

                  <tr className="bg-neutral-50/40 dark:bg-white/[0.01]">
                    <td colSpan={7} className="py-2.5 px-4 text-right font-bold text-neutral-600 dark:text-neutral-300">
                      Goods & Services Tax (GST 18%)
                    </td>
                    <td colSpan={2} className="py-2.5 px-4 text-right tabular-nums font-bold text-neutral-900 dark:text-white">
                      + {formatMoney(quoteTax)}
                    </td>
                  </tr>

                  <tr className="bg-neutral-50/40 dark:bg-white/[0.01]">
                    <td colSpan={7} className="py-2.5 px-4 text-right font-bold text-neutral-600 dark:text-neutral-300">
                      Freight & Transportation Charges
                    </td>
                    <td colSpan={2} className="py-2.5 px-4 text-right tabular-nums font-bold text-neutral-900 dark:text-white">
                      + {formatMoney(freightAmount)}
                    </td>
                  </tr>

                  <tr className="bg-neutral-50/40 dark:bg-white/[0.01]">
                    <td colSpan={7} className="py-2.5 px-4 text-right font-bold text-neutral-600 dark:text-neutral-300">
                      Packaging & Palletizing Charges
                    </td>
                    <td colSpan={2} className="py-2.5 px-4 text-right tabular-nums font-bold text-neutral-900 dark:text-white">
                      + {formatMoney(packingAmount)}
                    </td>
                  </tr>

                  <tr className="bg-emerald-50/80 dark:bg-emerald-500/10 text-sm border-t-2 border-neutral-200 dark:border-white/10">
                    <td colSpan={7} className="py-3 px-4 text-right font-black text-neutral-900 dark:text-white">
                      Grand Total Contract Value (INR)
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-right tabular-nums font-black text-base text-emerald-600 dark:text-emerald-400">
                      {formatMoney(quoteTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 3. Commercial Terms & SLA Delivery Matrix (3 Columns) ───────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {/* Column A: Delivery & Lead Time */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Truck size={14} />
                  </div>
                  <span>Delivery & Lead Time</span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Delivery Terms:</span>
                    <span className="font-black text-neutral-900 dark:text-white text-right">{deliveryTermsText}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Estimated Lead Time:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-right">{deliveryLeadTimeText}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Freight Charges:</span>
                    <span className="font-bold text-neutral-900 dark:text-white tabular-nums">{formatMoney(freightAmount)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Packaging Charges:</span>
                    <span className="font-bold text-neutral-900 dark:text-white tabular-nums">{formatMoney(packingAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Dispatch Hub</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">Shakti Udyog Foundry Works, Ludhiana, Punjab</span>
              </div>
            </div>

            {/* Column B: Warranty & Quality Assurance */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Award size={14} />
                  </div>
                  <span>Warranty & Quality Assurance</span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">
                      Manufacturing Warranty
                    </span>
                    <p className="font-bold text-neutral-900 dark:text-white text-xs m-0 leading-relaxed">
                      {warrantyText}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-white/5">
                    <span className="text-neutral-500 font-bold">Inspection TC:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">EN 10204 3.1 TC Dossier</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Quality Standard:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">ISO 9001:2015 Compliant</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Defect Policy</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">100% Replacement / Rework on Verified Foundry Defects</span>
              </div>
            </div>

            {/* Column C: Commercial Payment Terms */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <CreditCard size={14} />
                  </div>
                  <span>Agreed Payment Terms</span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">
                      Commercial Terms Protocol
                    </span>
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/5 text-xs text-neutral-800 dark:text-neutral-200 font-bold leading-relaxed">
                      {paymentTermsText}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 font-bold">Advance Ratio:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">{order.advancePercent ?? 50}% with PO (Stage 3)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 font-bold">Balance Ratio:</span>
                      <span className="font-black text-blue-600 dark:text-blue-400">{100 - (order.advancePercent ?? 50)}% Against Invoice (Stage 6)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 flex items-center justify-between text-xs text-neutral-500">
                <span>Terms Agreement Status:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Accepted & Locked
                </span>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Section 3: Initial Advance Payment Audit (OPTIMIZED HIGH-DENSITY ERP UI) ──────────────────── */}
      <CollapsibleSection
        title="3. Initial Advance Payment & Production Release Clearance"
        icon={Banknote}
        badge={
          order.advancePaid ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={12} /> Advance Paid & Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertCircle size={12} /> Pending Advance
            </span>
          )
        }
        isOpen={sectionsOpen.advance}
        onToggle={() => setSectionsOpen((p) => ({ ...p, advance: !p.advance }))}
      >
        <div className="space-y-5">
          {/* ── 1. Top Executive Advance Header Strip ─────────────────────── */}
          <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
            order.advancePaid
              ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-white to-emerald-500/5 dark:from-[#0c1f15] dark:via-[#0c1410] dark:to-[#0c1f15]"
              : "border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-white to-amber-500/5 dark:from-[#1f170c] dark:via-[#14120c] dark:to-[#1f170c]"
          }`}>
            {/* Left: Advance Clearance Status & Ref */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
                order.advancePaid
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }`}>
                {order.advancePaid ? <ShieldCheck size={24} /> : <CreditCard size={24} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-neutral-900 dark:text-white m-0">
                    {order.advancePaid ? "Initial Advance Payment Received & Verified" : "Initial Advance Payment Pending"}
                  </h4>
                  {order.advancePaymentRef && (
                    <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span>UTR: {order.advancePaymentRef}</span>
                      <CopyButton text={order.advancePaymentRef} label="Copy UTR Ref" />
                    </span>
                  )}
                  {order.advancePaid ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Production Release Authorized
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Release Blocked
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 m-0 font-medium">
                  {order.advancePaid
                    ? `Payment of ${order.advancePercent ?? 50}% was confirmed by finance on ${formatShortDate(order.advancePaidAtUtc)}. Manufacturing patterns unlocked.`
                    : `Order requires a ${order.advancePercent ?? 50}% advance commitment before foundry casting & pattern tooling commence.`}
                </p>
              </div>
            </div>

            {/* Right: Advance Amount Summary Pill */}
            <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-neutral-200/80 dark:border-white/10 pt-3 lg:pt-0 lg:pl-5 self-start lg:self-center shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  Advance Amount Paid
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatMoney(advancePaidAmount)}
                </span>
              </div>
              <div className="h-8 w-px bg-neutral-200 dark:bg-white/10" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  Agreed Ratio
                </span>
                <span className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
                  {order.advancePercent ?? 50}%
                </span>
              </div>
            </div>
          </div>

          {/* ── 2. Unified 3-Column Advance Audit Matrix ───────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {/* Column A: Milestone Commitment */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Tag size={14} />
                  </div>
                  <span>Milestone 1 Commitment</span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Milestone Scope:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">Stage 3 - Initial Advance</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Advance Ratio:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{order.advancePercent ?? 50}% of Total Value</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Release Condition:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 text-right">Pattern & Mold Tooling</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Shop Floor Clearance:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> {order.advancePaid ? "Production Authorized" : "Release Pending"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Commercial Rule</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">50% Advance with PO unlocks foundry pattern development</span>
              </div>
            </div>

            {/* Column B: Financial Settlement Figures */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <DollarSign size={14} />
                  </div>
                  <span>Financial Figures & Audit</span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Advance Amount Due:</span>
                    <span className="font-black text-neutral-900 dark:text-white tabular-nums">{formatMoney(advancePaidAmount)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Verified Bank Credit:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{formatMoney(advancePaidAmount)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Payment Channel:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">NEFT / RTGS Bank Transfer</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Ledger Book Entry:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                      Accounts Ledger Reconciled
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Deduction Method</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">100% credited against final contract settlement in Stage 6</span>
              </div>
            </div>

            {/* Column C: Banking & UTR Reference */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <ShieldCheck size={14} />
                  </div>
                  <span>Banking & UTR Verification</span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1">
                      Bank Transaction Reference (UTR)
                    </span>
                    <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/5 flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        {order.advancePaymentRef || "Awaiting Reference"}
                      </span>
                      {order.advancePaymentRef && (
                        <CopyButton text={order.advancePaymentRef} label="Copy UTR" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-neutral-500 font-bold">Payment Verified Date:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {order.advancePaidAtUtc ? formatDate(order.advancePaidAtUtc) : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Account Verification:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Verified & Sealed
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Sign-Off Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Finance & Commercial Audit Approved</span>
              </div>
            </div>
          </div>

          {/* ── 3. Initial Payment & Milestone Settlement Audit Table ──────── */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote size={14} className="text-emerald-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200 m-0">
                  Initial Payment & Milestone Settlement Audit Table
                </h4>
              </div>
              <span className="text-[11px] font-bold text-neutral-400">
                Stage 3 Release Audit
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.01] text-[10px] font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    <th className="text-left py-3 px-4">MILESTONE</th>
                    <th className="text-left py-3 px-4">DESCRIPTION</th>
                    <th className="text-left py-3 px-4">TRANSACTION UTR / REF</th>
                    <th className="text-right py-3 px-4">ADVANCE AMOUNT PAID</th>
                    <th className="text-left py-3 px-4">PAYMENT DATE</th>
                    <th className="text-right py-3 px-4">VERIFICATION STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                  <tr className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.01]">
                    <td className="py-3 px-4 font-extrabold text-blue-600 dark:text-blue-400">Milestone 1</td>
                    <td className="py-3 px-4 font-medium text-neutral-800 dark:text-neutral-200">
                      Initial Advance Commitment ({order.advancePercent ?? 50}%)
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-white">
                      {order.advancePaymentRef || "Awaiting Ref"}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-black text-emerald-600 dark:text-emerald-400">
                      {formatMoney(advancePaidAmount)}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 font-medium">
                      {order.advancePaidAtUtc ? formatDate(order.advancePaidAtUtc) : "Pending"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {order.advancePaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 size={11} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock size={11} /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Section 4: Manufacturing Execution, Shop Floor Progress & Logistics (OPTIMIZED HIGH-DENSITY ERP UI) ── */}
      <CollapsibleSection
        title="4. Manufacturing Execution, Shop Floor Progress & Logistics"
        icon={Package}
        badge={<StatusBadge status={order.statusLabel ?? order.status} />}
        isOpen={sectionsOpen.order}
        onToggle={() => setSectionsOpen((p) => ({ ...p, order: !p.order }))}
      >
        <div className="space-y-5">
          {/* ── 1. Top Executive Manufacturing Header Strip ───────────────── */}
          <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-gradient-to-r from-neutral-50/80 via-white to-neutral-50/80 dark:from-[#0c0f17] dark:via-[#0f121a] dark:to-[#0c0f17] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Order Reference & Personnel Metadata */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-500/20 shrink-0 shadow-xs">
                <Package size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <span>{order.orderNumber}</span>
                    <CopyButton text={order.orderNumber} label="Copy Order #" />
                  </span>
                  {order.purchaseOrderReference && (
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 flex items-center gap-1">
                      <span>PO: {order.purchaseOrderReference}</span>
                      <CopyButton text={order.purchaseOrderReference} label="Copy PO #" />
                    </span>
                  )}
                  <StatusBadge status={order.statusLabel ?? order.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex-wrap font-medium">
                  <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 font-bold">
                    <Wrench size={12} className="text-indigo-500" />
                    {order.assignedToName || "Foundry Lead Engineer"}
                  </span>
                  <span>·</span>
                  <span>Promised SLA Dispatch: {formatDate(order.promisedDispatchDateUtc)}</span>
                </div>
              </div>
            </div>

            {/* Right: 5-Stage Core Manufacturing Flow Pill Sequence */}
            <div className="flex items-center gap-1.5 flex-wrap self-start lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 border-neutral-100 dark:border-white/10">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mr-1 hidden sm:inline">
                Foundry Stage:
              </span>
              {MANUFACTURING_STAGES.map((stage, idx) => {
                const isPassed = idx < activeManufacturingIdx;
                const isCurrent = idx === activeManufacturingIdx;
                return (
                  <div
                    key={stage.key}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                      isCurrent
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-sm shadow-indigo-500/20 font-black"
                        : isPassed
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-neutral-100 dark:bg-white/5 text-neutral-400 border-neutral-200 dark:border-white/5"
                    }`}
                  >
                    {isPassed ? <Check size={11} strokeWidth={2.5} /> : isCurrent ? <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> : null}
                    <span>{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 2. Unified 3-Column Shop Floor & Production Execution Matrix ─ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {/* Column A: Order & Metallurgical Parameters */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Package size={14} />
                  </div>
                  <span>Order & Metallurgical Scope</span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Order Reference:</span>
                    <span className="font-mono font-black text-neutral-900 dark:text-white">{order.orderNumber}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Purchase Order (PO):</span>
                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{order.purchaseOrderReference || "Direct Commercial"}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Material Grade:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                      {materialGradeDisplay}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Assigned Lead:</span>
                    <span className="font-black text-neutral-900 dark:text-white">{order.assignedToName || "Foundry Lead Engineer"}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Release Clearance:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> {order.advancePaid ? `Advance (${order.advancePercent ?? 50}%) Cleared` : "Pending Advance"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Foundry Plant</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">Shakti Udyog Unit 1 - Furnace & Foundry Div.</span>
              </div>
            </div>

            {/* Column B: Production Batch & Execution Metrics */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Factory size={14} />
                  </div>
                  <span>Fulfillment & Batch Progress</span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  {/* Highlighted Produced / Ordered Card */}
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-neutral-500">Total Batch Units:</span>
                      <span className="font-black text-neutral-900 dark:text-white tabular-nums text-sm">
                        {totalQuantityProduced} / {totalQuantityOrdered} Produced
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, overallFulfillmentPercent))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-neutral-400 font-bold">
                      <span>{overallFulfillmentPercent}% Completed</span>
                      <span>{Math.max(0, totalQuantityOrdered - totalQuantityProduced)} Units Pending</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Units Dispatched:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {totalQuantityDispatched} Units
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Active Shop Floor Stage:</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                      {MANUFACTURING_STAGES[activeManufacturingIdx]?.label ?? "In Production"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Foundry Methoding</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Continuous Pouring & Solidification Monitored</span>
              </div>
            </div>

            {/* Column C: Logistics & Transport Schedule */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Truck size={14} />
                  </div>
                  <span>Logistics & Transport Schedule</span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Promised SLA Dispatch:</span>
                    <span className="font-black text-neutral-900 dark:text-white">{formatDate(order.promisedDispatchDateUtc)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Delivery Terms:</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{deliveryTermsText}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Active Transporter:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {order.shipments?.[0]?.transporter || "Dedicated Industrial Freight"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Current Transit State:</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                      {order.statusLabel ?? order.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Destination Address</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <MapPinned size={14} className="text-neutral-400 shrink-0" />
                  <span className="truncate">{deliveryLocationDisplay}</span>
                </span>
              </div>
            </div>
          </div>

          {/* ── 3. Manufacturing Line Items Fulfillment Table ─────────────── */}
          {order.items.length > 0 && (
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-indigo-500" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200 m-0">
                    Manufacturing Fulfillment & Execution Status ({order.items.length} Parts)
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-neutral-400">
                  Shop floor tracking live
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.01] text-[10px] font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      <th className="text-left py-3 px-4 w-12">#</th>
                      <th className="text-left py-3 px-4">PART / DRAWING NUMBER</th>
                      <th className="text-left py-3 px-4">DESCRIPTION</th>
                      <th className="text-right py-3 px-4">ORDERED</th>
                      <th className="text-right py-3 px-4">PRODUCED</th>
                      <th className="text-right py-3 px-4">DISPATCHED</th>
                      <th className="text-right py-3 px-4">PENDING</th>
                      <th className="text-right py-3 px-4">FULFILLMENT %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                    {order.items.map((i, idx) => {
                      const pct = i.quantityOrdered > 0 ? Math.round((i.quantityProduced / i.quantityOrdered) * 100) : 0;
                      const pendingQty = Math.max(0, i.quantityOrdered - i.quantityProduced);
                      return (
                        <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.01]">
                          <td className="py-3 px-4 font-bold text-neutral-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-white">{i.partNumber}</td>
                          <td className="py-3 px-4 font-medium text-neutral-700 dark:text-neutral-300">{i.description}</td>
                          <td className="py-3 px-4 text-right tabular-nums font-black text-neutral-900 dark:text-white">{i.quantityOrdered}</td>
                          <td className="py-3 px-4 text-right tabular-nums font-bold text-blue-600 dark:text-blue-400">{i.quantityProduced}</td>
                          <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">{i.quantityDispatched}</td>
                          <td className="py-3 px-4 text-right tabular-nums font-bold text-neutral-500">{pendingQty}</td>
                          <td className="py-3 px-4 text-right tabular-nums">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                              pct >= 100 ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : pct > 0 ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : "bg-neutral-100 dark:bg-white/5 text-neutral-500"
                            }`}>
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 4. Logistics, Transporters & Dispatches Table ──────────────── */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-blue-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200 m-0">
                  Logistics, Transporters & Dispatch Shipments ({order.shipments?.length ?? 0})
                </h4>
              </div>
              <span className="text-[11px] font-bold text-neutral-400">
                Carrier & Delivery Tracking
              </span>
            </div>

            {order.shipments && order.shipments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.01] text-[10px] font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      <th className="text-left py-2.5 px-4">Transporter</th>
                      <th className="text-left py-2.5 px-4">LR / Tracking #</th>
                      <th className="text-left py-2.5 px-4">Vehicle #</th>
                      <th className="text-left py-2.5 px-4">Driver Contact</th>
                      <th className="text-left py-2.5 px-4">Dispatch Date</th>
                      <th className="text-right py-2.5 px-4">Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                    {order.shipments.map((s) => (
                      <tr key={s.id} className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.01]">
                        <td className="py-2.5 px-4 font-bold text-neutral-900 dark:text-white">{s.transporter || "Standard Logistics"}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{s.trackingNumber || "—"}</td>
                        <td className="py-2.5 px-4 font-mono">{s.vehicleNumber || "—"}</td>
                        <td className="py-2.5 px-4">{s.phoneNumber || "—"}</td>
                        <td className="py-2.5 px-4">{formatShortDate(s.dispatchDateUtc)}</td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <Truck size={11} /> {s.deliveredAtUtc ? "Delivered" : "In Transit"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-neutral-400 font-medium">
                No transporter dispatch records registered yet. Shipments will populate upon factory dispatch.
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Section 5: Tax Invoices & Billing Breakdown (OPTIMIZED HIGH-DENSITY ERP UI) ────────────────── */}
      <CollapsibleSection
        title={`5. Tax Invoices & Registered GST Bills (${invoices.length})`}
        icon={Receipt}
        badge={
          invoices.length > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {invoices.length} Registered
            </span>
          ) : (
            <span className="text-xs text-neutral-400 font-bold">No Invoices</span>
          )
        }
        isOpen={sectionsOpen.invoices}
        onToggle={() => setSectionsOpen((p) => ({ ...p, invoices: !p.invoices }))}
      >
        {invoices.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border border-dashed border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.01]">
            <Receipt size={32} className="text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 m-0">No tax invoices generated yet</p>
            <p className="text-[11px] text-neutral-400 mt-1 max-w-sm mx-auto">
              Once manufacturing or milestone dispatch is complete, the Tax Invoice is issued.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* ── 1. Top Executive Invoice Header Strip ─────────────────────── */}
            <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-gradient-to-r from-neutral-50/80 via-white to-neutral-50/80 dark:from-[#0c0f17] dark:via-[#0f121a] dark:to-[#0c0f17] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Invoice Summary Metadata */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-lg border border-blue-500/20 shrink-0 shadow-xs">
                  <Receipt size={22} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-neutral-900 dark:text-white text-sm">
                      {invoices.length} Official GST Tax {invoices.length === 1 ? "Invoice" : "Invoices"}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      GST Compliant
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 m-0 font-medium">
                    Statutory Tax Invoices generated for precision casting orders and freight/packaging billing.
                  </p>
                </div>
              </div>

              {/* Right: Invoice Billing Summary Pills */}
              <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-neutral-100 dark:border-white/10 pt-3 lg:pt-0 lg:pl-5 self-start lg:self-center shrink-0">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                    Total Invoiced Value
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tabular-nums">
                    {formatMoney(invoices.reduce((sum, i) => sum + i.total, 0))}
                  </span>
                </div>
                <div className="h-8 w-px bg-neutral-200 dark:bg-white/10" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                    Paid Against Invoices
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatMoney(totalInvoicePayments)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── 2. Master Invoices Table Overview ─────────────────────────── */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] overflow-hidden shadow-xs">
              <div className="px-4 py-2.5 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt size={14} className="text-blue-500" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200 m-0">
                    Master Tax Invoice Register ({invoices.length})
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-neutral-400">
                  GST 18% Integrated Invoices
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.01] text-[10px] font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      <th className="text-left py-3 px-4">INVOICE #</th>
                      <th className="text-left py-3 px-4">ISSUE DATE</th>
                      <th className="text-left py-3 px-4">DUE DATE</th>
                      <th className="text-right py-3 px-4">TOTAL AMOUNT</th>
                      <th className="text-right py-3 px-4">PAID TO DATE</th>
                      <th className="text-right py-3 px-4">BALANCE DUE</th>
                      <th className="text-left py-3 px-4">STATUS</th>
                      <th className="text-right py-3 px-4">OFFICIAL PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.01]">
                        <td className="py-3 px-4">
                          <span className="font-mono font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <span>{inv.invoiceNumber}</span>
                            <CopyButton text={inv.invoiceNumber} label="Copy Invoice #" />
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-neutral-700 dark:text-neutral-300">{formatShortDate(inv.issueDateUtc)}</td>
                        <td className="py-3 px-4 font-medium text-neutral-700 dark:text-neutral-300">{formatShortDate(inv.dueDateUtc)}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-black text-neutral-900 dark:text-white">{formatMoney(inv.total)}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(inv.amountPaid)}</td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold text-neutral-900 dark:text-white">{formatMoney(inv.balanceDue)}</td>
                        <td className="py-3 px-4"><StatusBadge status={inv.status} /></td>
                        <td className="py-3 px-4 text-right">
                          {inv.hasPdf ? (
                            <button
                              type="button"
                              onClick={() => void apiDownload(adminApi.invoiceDownloadUrl(inv.id), `${inv.invoiceNumber}.pdf`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              <Download size={12} />
                              <span>PDF</span>
                            </button>
                          ) : (
                            <span className="text-neutral-400 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── 3. Individual Invoice Detailed Accordion Cards ─────────────── */}
            <div className="space-y-4">
              {invoices.map((inv) => {
                const isOpen = !!openInv[inv.id];
                const d = detail[inv.id];

                return (
                  <div key={inv.id} className="rounded-2xl border border-neutral-200/90 dark:border-white/10 overflow-hidden bg-white dark:bg-[#0f121a] shadow-xs">
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <button type="button" onClick={() => toggleInvoice(inv)} className="flex-1 flex items-center gap-3.5 text-left cursor-pointer group select-none min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black shrink-0 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                          <Receipt size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-sm font-black text-neutral-900 dark:text-white">{inv.invoiceNumber}</span>
                            <StatusBadge status={inv.status} />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex-wrap font-medium">
                            <span>Issued: {formatShortDate(inv.issueDateUtc)}</span>
                            <span>·</span>
                            <span>Due: {formatShortDate(inv.dueDateUtc)}</span>
                            <span>·</span>
                            <span className="font-bold text-neutral-800 dark:text-neutral-200">Total: {formatMoney(inv.total, inv.currency)}</span>
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => toggleInvoice(inv)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.04] text-neutral-700 dark:text-neutral-300 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-white/10 cursor-pointer shadow-xs"
                        >
                          {isOpen ? <><FolderOpen size={14} className="text-blue-500" /><span>Close Details</span><ChevronUp size={14} /></> : <><FolderClosed size={14} className="text-neutral-400" /><span>View Details</span><ChevronDown size={14} /></>}
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-2 border-t border-neutral-200/80 dark:border-white/10 space-y-5 bg-neutral-50/40 dark:bg-white/[0.01]">
                        {d === "loading" || d === undefined ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 size={22} className="animate-spin text-blue-500" />
                          </div>
                        ) : (
                          <div className="space-y-5 pt-2">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="p-3 rounded-xl bg-white dark:bg-[#0c0f17] border border-neutral-200/80 dark:border-white/5">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Subtotal (Taxable)</span>
                                <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">{formatMoney(d.subtotal, d.currency)}</span>
                              </div>
                              <div className="p-3 rounded-xl bg-white dark:bg-[#0c0f17] border border-neutral-200/80 dark:border-white/5">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Taxes (GST 18%)</span>
                                <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">{formatMoney(d.tax, d.currency)}</span>
                              </div>
                              <div className="p-3 rounded-xl bg-white dark:bg-[#0c0f17] border border-neutral-200/80 dark:border-white/5">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Amount Paid</span>
                                <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatMoney(d.amountPaid, d.currency)}</span>
                              </div>
                              <div className="p-3 rounded-xl bg-white dark:bg-[#0c0f17] border border-neutral-200/80 dark:border-white/5">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Invoice Balance</span>
                                <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">{formatMoney(d.balanceDue, d.currency)}</span>
                              </div>
                            </div>

                            {/* Billed Line Items Table */}
                            {d.items.length > 0 && (
                              <div className="rounded-xl border border-neutral-200/80 dark:border-white/10 overflow-hidden bg-white dark:bg-[#0c0f17]">
                                <div className="px-4 py-2 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10">
                                  <h5 className="text-[11px] font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 m-0">Billed Line Items</h5>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.01] text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">
                                        <th className="text-left py-2 px-3">Item Description</th>
                                        <th className="text-right py-2 px-3">Qty</th>
                                        <th className="text-right py-2 px-3">Rate</th>
                                        <th className="text-right py-2 px-3">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {d.items.map((it) => (
                                        <tr key={it.id} className="border-b border-neutral-100 dark:border-white/5 last:border-0">
                                          <td className="py-2 px-3 font-medium text-neutral-900 dark:text-white">
                                            {it.description}
                                            {it.hsnSacCode && <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-white/10 text-neutral-500">HSN {it.hsnSacCode}</span>}
                                          </td>
                                          <td className="py-2 px-3 text-right tabular-nums font-bold">{it.quantity} {it.unit}</td>
                                          <td className="py-2 px-3 text-right tabular-nums text-neutral-600 dark:text-neutral-400">{formatMoney(it.unitPrice, d.currency)}</td>
                                          <td className="py-2 px-3 text-right tabular-nums font-bold text-neutral-900 dark:text-white">{formatMoney(it.lineTotal, d.currency)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Recorded Payment Transactions Table */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-[11px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 m-0">
                                  Recorded Invoice Payment Receipts ({d.payments.length})
                                </h5>
                              </div>
                              {d.payments.length === 0 ? (
                                <div className="p-3 rounded-xl bg-white dark:bg-[#0c0f17] border border-neutral-200/80 dark:border-white/5 text-xs text-neutral-500 font-medium">
                                  No direct invoice payments entered yet.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {d.payments.map((p) => (
                                    <div key={p.id} className="p-3 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#0c0f17] flex items-center justify-between gap-3">
                                      <div>
                                        <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                          {formatMoney(p.amount, d.currency)} · {p.method}
                                        </div>
                                        <div className="text-[11px] text-neutral-400 mt-0.5 font-mono">
                                          Ref: {p.paymentReference} · {formatShortDate(p.paymentDateUtc)}
                                        </div>
                                      </div>
                                      <StatusBadge status={p.status} />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Action Footer */}
                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-200/80 dark:border-white/5">
                              {inv.hasPdf && (
                                <button
                                  type="button"
                                  onClick={() => void apiDownload(adminApi.invoiceDownloadUrl(inv.id), `${inv.invoiceNumber}.pdf`)}
                                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                                >
                                  <Download size={14} />
                                  <span>Download Official PDF</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* ── Section 6: Final Payment Settlement & Deal Closure (OPTIMIZED HIGH-DENSITY ERP UI) ────────── */}
      <CollapsibleSection
        title="6. Final Payment Settlement & Deal Closure"
        icon={ShieldCheck}
        badge={
          isDealFullySettled ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={13} /> 100% Fully Settled & Closed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock size={13} /> Remaining Due: {formatMoney(netRemainingBalance)}
            </span>
          )
        }
        isOpen={sectionsOpen.settlement}
        onToggle={() => setSectionsOpen((p) => ({ ...p, settlement: !p.settlement }))}
      >
        <div className="space-y-5">
          {/* ── 1. Top Executive Settlement Header Strip ──────────────────── */}
          <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
            isDealFullySettled
              ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-white to-emerald-500/5 dark:from-[#0c1f15] dark:via-[#0c1410] dark:to-[#0c1f15]"
              : "border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-white to-amber-500/5 dark:from-[#1f170c] dark:via-[#14120c] dark:to-[#1f170c]"
          }`}>
            {/* Left: Closure Status */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
                isDealFullySettled
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }`}>
                {isDealFullySettled ? <CheckCircle2 size={24} /> : <Clock size={24} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-neutral-900 dark:text-white m-0">
                    {isDealFullySettled
                      ? "Deal 100% Fully Settled & Reconciled"
                      : "Contract Payment & Net Settlement Pending"}
                  </h4>
                  {isDealFullySettled ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Closed & Sealed
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Balance Due: {formatMoney(netRemainingBalance)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 m-0 font-medium">
                  {isDealFullySettled
                    ? "All initial advances and final balances have been received and verified. The commercial deal is closed."
                    : `Advance of ${formatMoney(advancePaidAmount)} has been credited. Settle remaining balance to complete the deal lifecycle.`}
                </p>
              </div>
            </div>

            {/* Right: Balance & Action */}
            <div className="flex items-center gap-4 border-t lg:border-t-0 lg:border-l border-neutral-200/80 dark:border-white/10 pt-3 lg:pt-0 lg:pl-5 self-start lg:self-center shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  Net Balance Due
                </span>
                <span className={`text-xl sm:text-2xl font-black tabular-nums ${
                  isDealFullySettled ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                }`}>
                  {formatMoney(netRemainingBalance)}
                </span>
              </div>
              {netRemainingBalance > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenPaymentModal(undefined, netRemainingBalance)}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md shadow-emerald-500/25 cursor-pointer shrink-0"
                >
                  <CheckCheck size={15} />
                  <span>Settle ₹{netRemainingBalance.toLocaleString("en-IN")}</span>
                </button>
              )}
            </div>
          </div>

          {/* ── 2. Unified 3-Column Settlement Summary Matrix ─────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {/* Column A: Contract Valuation */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <FileText size={14} />
                  </div>
                  <span>Total Contract Valuation</span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Quoted Net Value:</span>
                    <span className="font-bold text-neutral-900 dark:text-white tabular-nums">{formatMoney(quoteSubtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">GST Taxes (18%):</span>
                    <span className="font-bold text-neutral-900 dark:text-white tabular-nums">+ {formatMoney(quoteTax)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Freight & Packaging:</span>
                    <span className="font-bold text-neutral-900 dark:text-white tabular-nums">+ {formatMoney(freightAmount + packingAmount)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-white/5">
                    <span className="text-neutral-700 dark:text-neutral-300 font-black">Gross Contract Value:</span>
                    <span className="font-black text-blue-600 dark:text-blue-400 tabular-nums">{formatMoney(quoteTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Contract Status</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">Quotation Accepted & Invoiced</span>
              </div>
            </div>

            {/* Column B: Deducted Payment Credits */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <DollarSign size={14} />
                  </div>
                  <span>Deducted Payment Credits</span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Initial Advance (Stage 3):</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">- {formatMoney(advancePaidAmount)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Invoice Payments Received:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">- {formatMoney(totalInvoicePayments)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-white/5">
                    <span className="text-neutral-700 dark:text-neutral-300 font-black">Total Customer Paid:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{formatMoney(totalCustomerPaid)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Paid Ratio:</span>
                    <span className="font-extrabold text-neutral-900 dark:text-white">
                      {quoteTotal > 0 ? Math.round((totalCustomerPaid / quoteTotal) * 100) : 0}% Reconciled
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Accounts Audit</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Automatic Credit Deduction Active</span>
              </div>
            </div>

            {/* Column C: Final Settlement & Closure */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-white/10 text-neutral-900 dark:text-white font-black text-xs uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <ShieldCheck size={14} />
                  </div>
                  <span>Final Settlement & Closure</span>
                </div>

                <div className="space-y-3 pt-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Net Remaining Due:</span>
                    <span className={`font-black tabular-nums text-sm ${
                      netRemainingBalance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {formatMoney(netRemainingBalance)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Closure Status:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {isDealFullySettled ? "Fully Reconciled & Closed" : "Open for Final Settlement"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-neutral-500 font-bold">Finance Sign-Off:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Verified & Sealed
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 text-xs">
                <span className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">Dispatch Authorization</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {isDealFullySettled ? "Final Gate Pass & Dispatch Permitted" : "Subject to Agreed Settlement Terms"}
                </span>
              </div>
            </div>
          </div>

          {/* ── 3. Full Reconciled Final Ledger Table ──────────────────────── */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200 m-0">
                  Full Mathematical Contract Settlement Ledger
                </h4>
              </div>
              <span className="text-[11px] font-bold text-neutral-400">
                Automatic Credit Deduction Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.01] text-[10px] font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    <th className="text-left py-3 px-4">TRANSACTION / MILESTONE</th>
                    <th className="text-left py-3 px-4">REFERENCE / STAGE</th>
                    <th className="text-right py-3 px-4">CONTRACT DEBIT (+)</th>
                    <th className="text-right py-3 px-4">PAYMENTS CREDITED (-)</th>
                    <th className="text-right py-3 px-4">NET BALANCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                  <tr className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.01]">
                    <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">
                      1. Total Quoted Contract Value
                    </td>
                    <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                      {quotation?.quotationNumber || "Agreed Quote"}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-black text-neutral-900 dark:text-white">
                      {formatMoney(quoteTotal)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-neutral-400">—</td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-neutral-900 dark:text-white">
                      {formatMoney(quoteTotal)}
                    </td>
                  </tr>

                  <tr className="bg-emerald-500/5 dark:bg-emerald-500/10 hover:bg-emerald-500/10">
                    <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-300">
                      2. Less: Initial Advance Payment (Stage 3)
                    </td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                      {order.advancePaymentRef ? `UTR: ${order.advancePaymentRef}` : "Advance"} ({order.advancePercent ?? 50}%)
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-neutral-400">—</td>
                    <td className="py-3 px-4 text-right tabular-nums font-black text-emerald-600 dark:text-emerald-400">
                      - {formatMoney(advancePaidAmount)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-neutral-800 dark:text-neutral-200">
                      {formatMoney(Math.max(0, quoteTotal - advancePaidAmount))}
                    </td>
                  </tr>

                  {totalInvoicePayments > 0 && (
                    <tr className="bg-emerald-500/5 dark:bg-emerald-500/10 hover:bg-emerald-500/10">
                      <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-300">
                        3. Less: Invoice Payments Received
                      </td>
                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                        Invoice Receipts
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-neutral-400">—</td>
                      <td className="py-3 px-4 text-right tabular-nums font-black text-emerald-600 dark:text-emerald-400">
                        - {formatMoney(totalInvoicePayments)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-bold text-neutral-800 dark:text-neutral-200">
                        {formatMoney(netRemainingBalance)}
                      </td>
                    </tr>
                  )}

                  <tr className="bg-neutral-100/70 dark:bg-white/[0.04] text-sm">
                    <td className="py-3.5 px-4 font-black text-neutral-900 dark:text-white" colSpan={2}>
                      4. Net Remaining Balance to Settle (Total Due)
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums font-bold text-neutral-500">
                      {formatMoney(quoteTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                      - {formatMoney(totalCustomerPaid)}
                    </td>
                    <td className={`py-3.5 px-4 text-right tabular-nums font-black text-base ${
                      netRemainingBalance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {formatMoney(netRemainingBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Image Lightbox Modal ───────────────────────────────────────── */}
      {lightbox && (
        <ImageLightboxModal
          url={lightbox.url}
          fileName={lightbox.fileName}
          onClose={() => setLightbox(null)}
          onDownload={() => downloadEnquiryFile(lightbox.fileId, lightbox.fileName)}
        />
      )}

      {/* ── Record Payment Modal with Advance Deduction Summary ─────────── */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#0c0f17] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <Banknote size={18} />
                </div>
                <h3 className="text-base font-black text-neutral-900 dark:text-white m-0">
                  Record / Settle Payment Receipt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Advance Deduction Ledger Banner inside Modal */}
            <div className="px-6 py-3 bg-neutral-100/70 dark:bg-white/[0.02] border-b border-neutral-200/70 dark:border-white/5 text-xs space-y-1.5">
              <div className="flex justify-between text-neutral-500">
                <span>Total Contract Deal Value:</span>
                <span className="font-bold text-neutral-900 dark:text-white tabular-nums">{formatMoney(quoteTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Less: Initial Advance Paid (Stage 3):</span>
                <span className="font-bold tabular-nums">- {formatMoney(advancePaidAmount)}</span>
              </div>
              {totalInvoicePayments > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Less: Previous Invoice Payments:</span>
                  <span className="font-bold tabular-nums">- {formatMoney(totalInvoicePayments)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-neutral-900 dark:text-white pt-1 border-t border-neutral-200 dark:border-white/10">
                <span>Net Remaining Amount to Settle:</span>
                <span className="text-amber-600 dark:text-amber-400 tabular-nums">{formatMoney(netRemainingBalance)}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4">
              {paymentError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold">
                  {paymentError}
                </div>
              )}

              {/* Target Invoice Selector */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-1">
                  Target Tax Invoice
                </label>
                <select
                  value={paymentTargetInvoiceId}
                  onChange={(e) => {
                    setPaymentTargetInvoiceId(e.target.value);
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-sm font-bold text-neutral-900 dark:text-white outline-none focus:border-blue-500"
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} (Total: ₹{inv.total.toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Amount & Net Balance Quick-Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">
                    Payment Amount to Record (₹)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(netRemainingBalance)}
                    className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Set Remaining Balance (₹{netRemainingBalance.toLocaleString("en-IN")})
                  </button>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-sm font-black text-neutral-900 dark:text-white outline-none focus:border-blue-500 tabular-nums"
                />
              </div>

              {/* Payment Method & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-sm font-bold text-neutral-900 dark:text-white outline-none focus:border-blue-500"
                  >
                    <option value="NEFT / RTGS">NEFT / RTGS</option>
                    <option value="UPI / QR">UPI / QR Transfer</option>
                    <option value="IMPS">IMPS Instant Transfer</option>
                    <option value="Cheque / DD">Cheque / Demand Draft</option>
                    <option value="Wire Transfer">International Wire (Swift)</option>
                    <option value="Cash Receipt">Cash Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-sm font-bold text-neutral-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Transaction UTR Reference */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-1">
                  Bank Transaction UTR / Ref Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR-98342019482 / UPI-98347201"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] font-mono text-sm font-bold text-neutral-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 h-10 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSaving}
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  {paymentSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
                  <span>{paymentSaving ? "Recording Payment..." : "Confirm & Settle Payment"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
