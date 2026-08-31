import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { engineerApi, type EngineerEnquiryDetail } from "../../../api/engineerApi";
import { tokenStorage } from "../../../auth/tokenStorage";
import { config } from "../../../config";
import { Loading } from "../../../components/ui";
import { formatDate } from "../../shared";
import {
  ArrowLeft, Building2, Mail, Phone, Package,
  MapPinned, Calendar, Clock, Activity, MessageSquare, Paperclip,
  ChevronRight, FileText, Loader2,
  XCircle, AlertCircle, Download, FileEdit, User,
  ChevronDown, ChevronUp, Factory, Truck, CreditCard,
  ChevronLeft, CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Status Configuration & Badges                                      */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; border: string; icon: any }> = {
  Draft:           { label: "Draft",        bg: "bg-slate-100 dark:bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400", border: "border-slate-200 dark:border-slate-500/20", icon: FileText },
  Submitted:       { label: "Submitted",    bg: "bg-blue-50 dark:bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400",    dot: "bg-blue-500",  border: "border-blue-200 dark:border-blue-500/20",   icon: Clock },
  Received:        { label: "Received",     bg: "bg-cyan-50 dark:bg-cyan-500/10",    text: "text-cyan-700 dark:text-cyan-400",    dot: "bg-cyan-500",  border: "border-cyan-200 dark:border-cyan-500/20",   icon: Clock },
  "Under Review":  { label: "Under Review", bg: "bg-amber-50 dark:bg-amber-500/10",  text: "text-amber-700 dark:text-amber-400",  dot: "bg-amber-500", border: "border-amber-200 dark:border-amber-500/20", icon: AlertCircle },
  Approved:        { label: "Approved",     bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-200 dark:border-emerald-500/20", icon: CheckCircle2 },
  Quoted:          { label: "Quoted",       bg: "bg-indigo-50 dark:bg-indigo-500/10", text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-500", border: "border-indigo-200 dark:border-indigo-500/20", icon: FileEdit },
  Accepted:        { label: "Accepted",     bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-200 dark:border-emerald-500/20", icon: CheckCircle2 },
  Rejected:        { label: "Rejected",     bg: "bg-rose-50 dark:bg-rose-500/10",    text: "text-rose-700 dark:text-rose-400",    dot: "bg-rose-500",  border: "border-rose-200 dark:border-rose-500/20",   icon: XCircle },
  Cancelled:       { label: "Cancelled",    bg: "bg-slate-100 dark:bg-slate-500/10", text: "text-slate-500 dark:text-slate-400", dot: "bg-slate-400", border: "border-slate-200 dark:border-slate-500/20", icon: XCircle },
  Expired:         { label: "Expired",      bg: "bg-slate-100 dark:bg-slate-500/10", text: "text-slate-500 dark:text-slate-400", dot: "bg-slate-400", border: "border-slate-200 dark:border-slate-500/20", icon: Clock },
};

function getStatusConfig(status: string) {
  return statusConfig[status] ?? {
    label: status,
    bg: "bg-slate-100 dark:bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400",
    border: "border-slate-200 dark:border-slate-500/20",
    icon: FileText,
  };
}

function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const cfg = getStatusConfig(status);
  const Icon = cfg.icon;
  const px = size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[11px]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-bold border ${cfg.bg} ${cfg.text} ${cfg.border} ${px} shadow-xs`}>
      <Icon size={size === "md" ? 13 : 11} className="stroke-[2.2]" />
      {cfg.label}
    </span>
  );
}

/* ── Priority Badge ────────────────────────────────────────────── */

const priorityColors: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-500/20",
  Medium: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  High: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-500/20",
  Urgent: "bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border-rose-300 dark:border-rose-500/30 ring-1 ring-rose-300/50",
};

function PriorityBadge({ priority }: { priority: string }) {
  const c = priorityColors[priority] ?? priorityColors.Medium;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border shadow-xs ${c}`}>
      {priority}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Summary KPI Card                                                   */
/* ------------------------------------------------------------------ */

function InfoCard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  gradient: string;
}) {
  return (
    <div className="group relative flex items-center gap-3.5 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:p-4.5 shadow-xs hover:shadow-md hover:border-neutral-300 dark:hover:border-white/20 transition-all duration-200">
      <div className={`w-11 h-11 rounded-2xl ${gradient} text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
        <Icon size={20} className="stroke-[2.2]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-neutral-400 dark:text-neutral-400 uppercase tracking-wider font-extrabold mb-0.5">
          {label}
        </div>
        <div className="text-[14px] font-extrabold text-neutral-900 dark:text-white truncate">
          {value}
        </div>
        {sub && (
          <div className="text-[11.5px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate font-medium">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Collapsible Section                                                */
/* ------------------------------------------------------------------ */

function Section({
  icon: Icon,
  title,
  children,
  defaultOpen = true,
  badge,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-3xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 sm:px-6 py-4 hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-all text-left cursor-pointer border-b border-transparent"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Icon size={16} className="stroke-[2.2]" />
          </div>
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-[14.5px] font-bold text-neutral-900 dark:text-white m-0 tracking-tight">
              {title}
            </h2>
            {badge && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                {badge}
              </span>
            )}
          </div>
        </div>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      {open && (
        <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-neutral-100 dark:border-white/5">
          {children}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Field Tile                                                         */
/* ------------------------------------------------------------------ */

function Field({ label, value, icon: Icon }: { label: string; value: string | React.ReactNode; icon?: any }) {
  return (
    <div className="flex items-start gap-3 p-2.5 rounded-xl bg-neutral-50/60 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5">
      {Icon && (
        <div className="w-7 h-7 rounded-lg bg-neutral-200/60 dark:bg-white/5 flex items-center justify-center text-neutral-500 dark:text-neutral-400 shrink-0 mt-0.5">
          <Icon size={14} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[10.5px] font-bold uppercase tracking-wide text-neutral-400 dark:text-neutral-400">
          {label}
        </div>
        <div className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200 truncate mt-0.5">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Workflow Steps (Connected Stepper UI)                              */
/* ------------------------------------------------------------------ */

const workflowSteps = ["Draft", "Submitted", "Received", "Under Review", "Approved", "Quoted"];
const workflowIcons: Record<string, any> = {
  Draft: FileText,
  Submitted: Clock,
  Received: Clock,
  "Under Review": AlertCircle,
  Approved: CheckCircle2,
  Quoted: FileEdit,
};

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    Draft: 0,
    Submitted: 1,
    Received: 2,
    "Under Review": 3,
    "Waiting for Customer": 3.5,
    Approved: 4,
    Quoted: 5,
    Accepted: 6,
    Rejected: -1,
    Declined: -1,
    Expired: -1,
    Cancelled: -1,
  };
  const idx = map[status];
  if (idx !== undefined && idx > 5) return 6;
  return idx !== undefined ? Math.max(0, idx) : 0;
}

function WorkflowProgress({ currentStatus }: { currentStatus: string }) {
  const currentIdx = getStepIndex(currentStatus);
  if (currentIdx < 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
            Enquiry Review Lifecycle (6 Steps)
          </span>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono">
          Step {Math.min(6, Math.floor(currentIdx) + 1)} of 6 · {currentStatus}
        </span>
      </div>

      <div className="flex items-center justify-between gap-0 overflow-x-auto py-2 px-1">
        {workflowSteps.map((step, i) => {
          const Icon = workflowIcons[step] ?? Clock;
          const isComplete = Math.floor(currentIdx) > i;
          const isCurrent = Math.floor(currentIdx) === i;
          const isPastOrCurrent = isComplete || isCurrent;
          const isLineActive = isComplete;
          const isNextStep = i < workflowSteps.length - 1;

          return (
            <div key={step} className="flex items-center flex-1 min-w-0 last:flex-none">
              {/* Step Node & Label */}
              <div className="flex flex-col items-center gap-2 min-w-[85px] sm:min-w-[100px] select-none">
                {/* Squircle Icon Badge */}
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all ${
                    isComplete
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                      : isCurrent
                      ? "bg-emerald-500 text-white ring-4 ring-emerald-500/20 shadow-md shadow-emerald-500/30 scale-105"
                      : "bg-neutral-100 dark:bg-white/5 text-neutral-400 dark:text-neutral-400 border border-neutral-200/80 dark:border-white/10"
                  }`}
                >
                  <Icon size={18} className="stroke-[2.2]" />
                </div>

                {/* Step Label */}
                <div className="text-center">
                  <div
                    className={`text-[11.5px] tracking-tight transition-colors leading-tight ${
                      isPastOrCurrent
                        ? "text-emerald-600 dark:text-emerald-400 font-bold"
                        : "text-neutral-400 dark:text-neutral-400 font-medium"
                    }`}
                  >
                    {step}
                  </div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-400 mt-0.5 hidden sm:block">
                    {isCurrent ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
                    ) : isComplete ? (
                      "Completed"
                    ) : (
                      "Pending"
                    )}
                  </div>
                </div>
              </div>

              {/* Horizontal Connector Line */}
              {isNextStep && (
                <div
                  className={`flex-1 h-0.5 mx-1.5 sm:mx-3 mt-[-22px] rounded-full transition-colors ${
                    isLineActive
                      ? "bg-emerald-400 dark:bg-emerald-500/70"
                      : "bg-neutral-200 dark:bg-white/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Auth-fetched Image Component                                       */
/* ------------------------------------------------------------------ */

function EnquiryImage({ enquiryId, fileId, fileName }: { enquiryId: string; fileId: string; fileName: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const token = tokenStorage.getAccessToken();
    fetch(`${config.apiBaseUrl}/api/v1/engineer/enquiries/${enquiryId}/files/${fileId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include",
    }).then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then((blob) => { if (!cancelled) setUrl(URL.createObjectURL(blob)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [enquiryId, fileId]);
  if (!url) return <div className="w-full aspect-[4/3] rounded-2xl bg-neutral-100 dark:bg-white/5 animate-pulse" />;
  return <img src={url} alt={fileName} className="w-full h-full object-cover rounded-2xl" />;
}

/* ------------------------------------------------------------------ */
/*  Related Record Card                                                */
/* ------------------------------------------------------------------ */

function RelatedCard({ icon: Icon, label, status, href }: { icon: any; label: string; status: string; href: string }) {
  const isGood = status === "Generated" || status === "Approved";
  const isPending = status === "Pending";
  const badgeStyle = isGood
    ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
    : isPending
    ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
    : "text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10";

  return (
    <Link
      to={href}
      className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:shadow-xs transition-all no-underline group"
    >
      <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
        <Icon size={18} className="stroke-[2.2]" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-neutral-900 dark:text-white truncate">
          {label}
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold mt-1 border ${badgeStyle}`}>
          {status}
        </span>
      </div>
      <ChevronRight size={15} className="text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                                */
/* ------------------------------------------------------------------ */

export default function EngineerEnquiryDetailPage() {
  const { id = "" } = useParams();
  const [enquiry, setEnquiry] = useState<EngineerEnquiryDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    engineerApi.enquiry(id).then(setEnquiry).catch(() => setMissing(true));
  }, [id]);

  async function updateStatus(newStatus: string, note?: string) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await engineerApi.updateEnquiryStatus(id, newStatus, note);
      setMsg(r.message);
      setEnquiry(await engineerApi.enquiry(id));
    } catch {
      setMsg("Status update failed.");
    } finally {
      setBusy(false);
    }
  }

  function downloadFile(fileId: string, fileName: string) {
    const token = tokenStorage.getAccessToken();
    const url = `${config.apiBaseUrl}/api/v1/engineer/enquiries/${id}/files/${fileId}/download`;
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then((blob) => {
        const u = URL.createObjectURL(blob);
        const d = document.createElement("a");
        d.href = u;
        d.download = fileName;
        d.click();
        URL.revokeObjectURL(u);
      })
      .catch(() => setMsg("Download failed."));
  }

  if (missing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <XCircle size={32} />
        </div>
        <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white m-0">Enquiry Not Found</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 mb-6 max-w-sm">
          This enquiry may have been removed or you do not have permission to view it.
        </p>
        <Link
          to="/admin/enquiries"
          className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/25 no-underline"
        >
          <ArrowLeft size={15} /> Back to Enquiries
        </Link>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="py-16">
        <Loading label="Loading Enquiry Specifications..." />
      </div>
    );
  }

  const cfg = getStatusConfig(enquiry.status);
  const currentStepIdx = getStepIndex(enquiry.status);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Navigation & Header Hero ────────────────────────────── */}
      <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-6 sm:p-7 shadow-xs space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-4 border-b border-neutral-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Link
              to="/admin/enquiries"
              className="flex items-center justify-center w-8 h-8 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all no-underline shadow-xs"
            >
              <ChevronLeft size={16} />
            </Link>
            <span className="text-xs font-semibold text-neutral-400">Back to Enquiries</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              ENQ-{enquiry.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Title & Primary Action Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
                Enquiry — {enquiry.productType}
              </h1>
              <StatusBadge status={enquiry.status} size="md" />
              {enquiry.isDraft && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                  DRAFT
                </span>
              )}
            </div>

            {/* Metadata Badges */}
            <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
              <span className="flex items-center gap-1.5 font-semibold text-neutral-700 dark:text-neutral-300">
                <Building2 size={13} className="text-blue-500" />
                {enquiry.companyName}
              </span>
              <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-neutral-400" />
                Received {formatDate(enquiry.createdAtUtc)}
              </span>
              <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <PriorityBadge priority={enquiry.priority} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center flex-wrap">
            {!["Approved", "Quoted", "Accepted", "Rejected", "Declined", "Cancelled", "Expired"].includes(enquiry.status) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const workflowOrder = ["Draft", "Submitted", "Received", "Under Review", "Approved"];
                  const idx = workflowOrder.indexOf(enquiry.status);
                  if (idx >= 0 && idx < workflowOrder.length - 1) void updateStatus(workflowOrder[idx + 1]);
                }}
                className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={15} />}
                <span>Advance Stage</span>
              </button>
            )}

            {enquiry.status === "Approved" && !enquiry.hasDraftQuotation && (
              <button
                type="button"
                onClick={() => window.location.assign(`/admin/quotations/new?enquiryId=${enquiry.id}&companyName=${encodeURIComponent(enquiry.companyName)}`)}
                className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <FileEdit size={15} />
                <span>Generate Quotation</span>
              </button>
            )}

            {enquiry.hasDraftQuotation && (
              <Link
                to={`/admin/quotations/${enquiry.draftQuotationId}`}
                className="inline-flex items-center gap-2 px-4.5 h-10 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition-all no-underline shadow-xs"
              >
                <FileEdit size={15} />
                <span>{enquiry.status === "Approved" ? "View Draft Quote" : "View Quote"}</span>
              </Link>
            )}

            {!["Draft", "Quoted", "Accepted", "Rejected", "Declined", "Cancelled", "Expired"].includes(enquiry.status) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowRejectModal(true)}
                className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100/60 dark:hover:bg-rose-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                <XCircle size={15} />
                <span>Reject</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Connected Horizontal Stepper ────────────────────────────── */}
        {currentStepIdx >= 0 && (
          <div className="pt-2 border-t border-neutral-100 dark:border-white/5">
            <WorkflowProgress currentStatus={enquiry.status} />
          </div>
        )}
      </div>

      {/* ── Summary KPI Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <InfoCard
          icon={Building2}
          label="Customer"
          value={enquiry.companyName}
          sub={enquiry.fullName ? `Contact: ${enquiry.fullName}` : undefined}
          gradient="bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/20"
        />
        <InfoCard
          icon={Package}
          label="Product / Material"
          value={enquiry.productType}
          sub={enquiry.materialGrade ? `Grade: ${enquiry.materialGrade}` : undefined}
          gradient="bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-500/20"
        />
        <InfoCard
          icon={MapPinned}
          label="Quantity / Delivery"
          value={`${enquiry.quantity} Units`}
          sub={enquiry.deliveryLocation ?? "No location specified"}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600 shadow-orange-500/20"
        />
        <InfoCard
          icon={Activity}
          label="Status / Priority"
          value={cfg.label}
          sub={`Priority: ${enquiry.priority}`}
          gradient="bg-gradient-to-br from-violet-600 to-purple-600 shadow-purple-500/20"
        />
      </div>

      {/* ── Status Flash Message ────────────────────────────────────── */}
      {msg && (
        <div
          className={`rounded-2xl p-4 text-xs font-bold flex items-center justify-between border shadow-xs ${
            msg.includes("failed") || msg.includes("Fail")
              ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
              : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {msg.includes("failed") ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{msg}</span>
          </div>
          <button type="button" onClick={() => setMsg(null)} className="opacity-70 hover:opacity-100">
            <XCircle size={15} />
          </button>
        </div>
      )}

      {/* ── Main Two-Column Layout ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ══ LEFT COLUMN (Accordion Specs) ══ */}
        <div className="space-y-5">
          {/* Customer Information */}
          <Section icon={Building2} title="Customer Information" badge="Verified Account">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 shrink-0">
                  {enquiry.companyName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white m-0">
                    {enquiry.companyName}
                  </h3>
                  <p className="text-xs text-neutral-400 m-0 mt-0.5">Commercial Industrial Account</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Contact Person" value={enquiry.fullName} icon={User} />
                <Field label="Phone Number" value={enquiry.phone || "—"} icon={Phone} />
                <Field label="Email Address" value={enquiry.email} icon={Mail} />
                <Field label="Company Name" value={enquiry.companyName} icon={Building2} />
              </div>
            </div>
          </Section>

          {/* Enquiry Information */}
          <Section icon={FileText} title="Enquiry Technical Specifications">
            <div className="space-y-6 pt-1">
              {/* Part Details */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 m-0">
                    Part & Component Details
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Part Name" value={enquiry.partName} />
                  <Field label="Part Number" value={enquiry.partNumber} />
                  <Field label="Target Application" value={enquiry.application} />
                  <Field label="Industry Sector" value={enquiry.industry} />
                </div>
              </div>

              {/* Material Details */}
              <div className="pt-4 border-t border-neutral-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 m-0">
                    Metallurgy & Tooling
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Material Standard" value={enquiry.materialStandard} />
                  <Field label="Approx Weight" value={enquiry.approxWeight != null ? `${enquiry.approxWeight} kg` : "—"} />
                  <Field label="Machining Required" value={enquiry.machiningRequired} />
                  <Field label="Pattern Availability" value={enquiry.patternAvailability} />
                </div>
              </div>

              {/* Quantity Details */}
              <div className="pt-4 border-t border-neutral-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 m-0">
                    Volume & Production Schedule
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Prototype Qty" value={enquiry.prototypeQuantity} />
                  <Field label="Production Qty" value={enquiry.productionQuantity ?? enquiry.quantity} />
                  <Field label="Annual Requirement" value={enquiry.annualRequirement} />
                </div>
              </div>

              {/* Delivery Details */}
              <div className="pt-4 border-t border-neutral-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 m-0">
                    Logistics & Delivery Terms
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Delivery Location" value={enquiry.deliveryLocation} />
                  <Field label="Expected Delivery Date" value={enquiry.expectedDeliveryDate ? formatDate(enquiry.expectedDeliveryDate) : "—"} />
                  <Field label="Preferred Terms" value={enquiry.preferredDeliveryTerms} />
                </div>
              </div>

              {/* Additional Requirements */}
              {enquiry.additionalRequirements && (
                <div className="pt-4 border-t border-neutral-100 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 m-0">
                      Additional Certifications & Testing
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {enquiry.additionalRequirements.split(", ").filter(Boolean).map((r: string) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 shadow-xs"
                      >
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Remarks */}
              {enquiry.remarks && (
                <div className="pt-4 border-t border-neutral-100 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 m-0">
                      Customer Special Remarks
                    </h4>
                  </div>
                  <div className="rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/70 dark:bg-white/[0.02] p-4">
                    <p className="text-xs sm:text-[13px] text-neutral-800 dark:text-neutral-200 leading-relaxed m-0 whitespace-pre-wrap font-medium">
                      {enquiry.remarks}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Drawings & Attachments */}
          <Section
            icon={Paperclip}
            title="Drawings & CAD Attachments"
            badge={`${enquiry.files.length} Attached`}
          >
            {enquiry.files.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {enquiry.files.map((f) => {
                  const isImage = f.contentType?.startsWith("image/");
                  return (
                    <div
                      key={f.id}
                      className="group rounded-2xl border border-neutral-200/80 dark:border-white/10 overflow-hidden bg-neutral-50/60 dark:bg-white/[0.02] hover:shadow-md hover:border-blue-500/40 transition-all duration-200"
                    >
                      {/* Preview */}
                      <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-white/5">
                        {isImage ? (
                          <EnquiryImage enquiryId={id} fileId={f.id} fileName={f.fileName} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText size={36} className="text-neutral-400 opacity-40" />
                          </div>
                        )}
                        {/* Download Overlay */}
                        <button
                          type="button"
                          onClick={() => downloadFile(f.id, f.fileName)}
                          className="absolute top-2.5 right-2.5 flex items-center justify-center w-8 h-8 rounded-xl bg-black/60 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 hover:bg-blue-600 transition-all duration-200 shadow-sm cursor-pointer"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                      {/* Info */}
                      <div className="p-3 border-t border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#0f121a]">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white truncate leading-tight">
                          {f.fileName}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                          {(f.sizeBytes / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-neutral-200 dark:border-white/10 text-center">
                <Paperclip size={36} className="text-neutral-300 dark:text-neutral-700 mb-3" />
                <p className="text-xs text-neutral-500 font-medium m-0">No technical drawings or CAD files uploaded</p>
              </div>
            )}
          </Section>

          {/* Related Records */}
          <Section icon={Activity} title="Related Workflow Records" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <RelatedCard
                icon={FileEdit}
                label="Commercial Quotation"
                status={enquiry.status === "Approved" ? "Pending Creation" : enquiry.hasDraftQuotation ? "Quotation Active" : "Not Started"}
                href="/admin/quotations"
              />
              <RelatedCard
                icon={Factory}
                label="Foundry Production Board"
                status="Awaiting Quotation"
                href="/admin/production"
              />
              <RelatedCard
                icon={Truck}
                label="Dispatch & Logistics"
                status="Pending Order"
                href="/admin/orders"
              />
              <RelatedCard
                icon={CreditCard}
                label="Tax Invoicing"
                status="Pending Delivery"
                href="/admin/invoices"
              />
            </div>
          </Section>
        </div>

        {/* ══ RIGHT COLUMN (Status & Audit Timeline) ══ */}
        <div className="space-y-5 lg:sticky lg:top-6">
          {/* Current Status Sidebar Card */}
          <section className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 m-0">
                Current Lifecycle State
              </h3>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5">
              <span className={`flex items-center justify-center w-12 h-12 rounded-2xl ${cfg.bg} ${cfg.border} border shadow-xs`}>
                <cfg.icon size={22} className={cfg.text} />
              </span>
              <div>
                <div className={`text-base font-black ${cfg.text}`}>{cfg.label}</div>
                <div className="text-[11px] text-neutral-400 font-medium">
                  {enquiry.statusHistory.length > 0
                    ? `Updated ${formatDate(enquiry.statusHistory[enquiry.statusHistory.length - 1].occurredAtUtc)}`
                    : `Created ${formatDate(enquiry.createdAtUtc)}`}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                <span className="text-neutral-500">Evaluation Priority</span>
                <PriorityBadge priority={enquiry.priority} />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-100 dark:border-white/5">
                <span className="text-neutral-500">Created Timestamp</span>
                <span className="font-mono text-neutral-700 dark:text-neutral-300">
                  {formatDate(enquiry.createdAtUtc)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-neutral-500">Last System Update</span>
                <span className="font-mono text-neutral-700 dark:text-neutral-300">
                  {enquiry.statusHistory.length > 0
                    ? formatDate(enquiry.statusHistory[enquiry.statusHistory.length - 1].occurredAtUtc)
                    : formatDate(enquiry.createdAtUtc)}
                </span>
              </div>
            </div>
          </section>

          {/* Audit Timeline Sidebar Card */}
          {enquiry.statusHistory.length > 0 && (
            <section className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-white/5 pb-3">
                <Clock size={15} className="text-blue-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 m-0">
                  Audit Progression History
                </h3>
              </div>

              <div className="space-y-0 pt-1">
                {enquiry.statusHistory.map((h, i) => {
                  const isLast = i === enquiry.statusHistory.length - 1;
                  const stepCfg = getStatusConfig(h.toStatus);
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ring-4 ring-white dark:ring-[#0f121a] ${stepCfg.dot}`} />
                        {!isLast && <div className="w-0.5 flex-1 bg-neutral-200 dark:bg-white/10 my-1" />}
                      </div>
                      <div className={`${isLast ? "" : "pb-4"} flex-1 min-w-0`}>
                        <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {h.fromStatus} → {h.toStatus}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                          {formatDate(h.occurredAtUtc)} · <span className="font-sans font-bold text-neutral-500">{h.changedByRole}</span>
                        </div>
                        {h.note && (
                          <div className="mt-1.5 text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-white/[0.03] border border-neutral-100 dark:border-white/5 rounded-xl p-2.5">
                            {h.note}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Internal Comments Sidebar Card */}
          {enquiry.comments.length > 0 && (
            <section className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-white/5 pb-3">
                <MessageSquare size={15} className="text-blue-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 m-0">
                  Engineering Notes
                </h3>
              </div>

              <div className="space-y-3">
                {enquiry.comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{c.authorRole}</span>
                      <span className="text-neutral-400 font-mono">{formatDate(c.createdAtUtc)}</span>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 m-0 leading-relaxed font-medium">
                      {c.message}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── Sticky Bottom Action Bar ────────────────────────────────── */}
      <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          {enquiry.hasDraftQuotation ? (
            <Link
              to={`/admin/quotations/${enquiry.draftQuotationId}`}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition-all no-underline shadow-xs"
            >
              <FileEdit size={15} />
              <span>{enquiry.status === "Approved" ? "View Draft Quote" : "View Quote"}</span>
            </Link>
          ) : enquiry.status === "Approved" ? (
            <button
              type="button"
              onClick={() => window.location.assign(`/admin/quotations/new?enquiryId=${enquiry.id}&companyName=${encodeURIComponent(enquiry.companyName)}`)}
              className="inline-flex items-center gap-2 px-5 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <FileEdit size={15} />
              <span>Generate Quotation</span>
            </button>
          ) : null}
        </div>

        <Link
          to="/admin/enquiries"
          className="inline-flex items-center gap-2 px-4 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all no-underline shadow-xs"
        >
          <ArrowLeft size={14} /> Back to Enquiries
        </Link>
      </div>

      {/* ── Reject Modal ────────────────────────────────────────────── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="h-1.5 bg-gradient-to-r from-rose-500 to-rose-600" />
            <div className="p-6 sm:p-7 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-500/20">
                  <XCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white m-0">Reject Enquiry</h3>
                  <p className="text-xs text-neutral-400 m-0 mt-0.5">Please provide a clear reason for administrative record.</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Rejection Reason / Note
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Incompatible metallurgy standard or unsupported casting dimensions..."
                  className="w-full rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#121520] p-3.5 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100 dark:border-white/5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
                  className="px-4.5 h-10 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy || !rejectReason.trim()}
                  onClick={() => {
                    void updateStatus("Rejected", rejectReason.trim());
                    setShowRejectModal(false);
                    setRejectReason("");
                  }}
                  className="px-5 h-10 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm shadow-rose-500/20 cursor-pointer"
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  <span>{busy ? "Rejecting..." : "Confirm Rejection"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}