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
  CheckCircle, XCircle, AlertCircle, Download, FileEdit, User,
  ChevronDown, ChevronUp, Factory, Truck, CreditCard,
  ChevronLeft,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; icon: any }> = {
  Draft:           { label: "Draft",        bg: "bg-[#F1F5F9]",  text: "text-[#64748B]", dot: "bg-[#94A3B8]",  icon: FileText },
  Received:        { label: "Received",     bg: "bg-[#EFF6FF]",  text: "text-[#2563EB]", dot: "bg-[#3B82F6]",  icon: Clock },
  "Under Review":  { label: "Under Review", bg: "bg-[#FFF7ED]",  text: "text-[#F97316]", dot: "bg-[#F97316]",  icon: AlertCircle },
  Approved:        { label: "Approved",     bg: "bg-[#F0FDF4]",  text: "text-[#22C55E]", dot: "bg-[#22C55E]",  icon: CheckCircle },
  Quoted:          { label: "Quoted",       bg: "bg-[#EEF2FF]",  text: "text-[#6366F1]", dot: "bg-[#6366F1]",  icon: FileEdit },
  Accepted:        { label: "Accepted",     bg: "bg-[#F0FDF4]",  text: "text-[#16A34A]", dot: "bg-[#16A34A]",  icon: CheckCircle },
  Rejected:        { label: "Rejected",     bg: "bg-[#FEF2F2]",  text: "text-[#EF4444]", dot: "bg-[#EF4444]",  icon: XCircle },
  Cancelled:       { label: "Cancelled",    bg: "bg-[#F8FAFC]",  text: "text-[#94A3B8]", dot: "bg-[#CBD5E1]",  icon: XCircle },
  Expired:         { label: "Expired",      bg: "bg-[#F8FAFC]",  text: "text-[#94A3B8]", dot: "bg-[#CBD5E1]",  icon: Clock },
};

function getStatusConfig(status: string) {
  return statusConfig[status] ?? { label: status, bg: "bg-[#F1F5F9]", text: "text-[#64748B]", dot: "bg-[#94A3B8]", icon: FileText };
}

function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const cfg = getStatusConfig(status);
  const Icon = cfg.icon;
  const px = size === "md" ? "px-3 py-1 text-[12px]" : "px-2.5 py-0.5 text-[11px]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${cfg.bg} ${cfg.text} ${px}`}>
      <Icon size={size === "md" ? 13 : 11} />
      {cfg.label}
    </span>
  );
}

/* ── Priority badge ────────────────────────────────────────────── */

const priorityColors: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400",
  Medium: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  High: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  Urgent: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 ring-1 ring-red-300 dark:ring-red-500/30",
};

function PriorityBadge({ priority }: { priority: string }) {
  const c = priorityColors[priority] ?? priorityColors.Medium;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${c}`}>
      {priority}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Info card                                                          */
/* ------------------------------------------------------------------ */

function InfoCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm hover:shadow-md transition-all">
      <span className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${color ?? "bg-[var(--color-primary)]/10"}`}>
        <Icon size={22} className={color?.replace("bg-", "text-") ?? "text-[var(--color-primary)]"} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-0.5">{label}</div>
        <div className="text-[15px] font-bold text-[var(--text-primary)] truncate">{value}</div>
        {sub && <div className="text-[12px] text-[var(--text-secondary)] mt-0.5 truncate">{sub}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Collapsible Section                                                */
/* ------------------------------------------------------------------ */

function Section({ icon: Icon, title, children, defaultOpen = true }: { icon: any; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-4 hover:bg-[var(--bg-surface-hover)] transition-all text-left">
        <div className="flex items-center gap-2.5">
          <Icon size={15} className="text-[var(--color-primary)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)] m-0">{title}</h2>
        </div>
        {open ? <ChevronUp size={15} className="text-[var(--text-muted)]" /> : <ChevronDown size={15} className="text-[var(--text-muted)]" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Field                                                              */
/* ------------------------------------------------------------------ */

function Field({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon && <Icon size={14} className="text-[var(--text-muted)] mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <div className="text-[11px] text-[var(--text-muted)]">{label}</div>
        <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">{value}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress Step                                                      */
/* ------------------------------------------------------------------ */

/* ── Workflow Steps ──────────────────────────────────────────────── */

const workflowSteps = ["Draft", "Submitted", "Received", "Under Review", "Approved", "Quoted"];
const workflowIcons: Record<string, any> = {
  Draft: FileText, Submitted: Clock, Received: Clock,
  "Under Review": AlertCircle, Approved: CheckCircle,
  Quoted: FileEdit,
};

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    Draft: 0, Submitted: 1, Received: 2, "Under Review": 3,
    "Waiting for Customer": 3.5, Approved: 4, Quoted: 5,
    Accepted: 6, Rejected: -1, Declined: -1, Expired: -1, Cancelled: -1,
  };
  const idx = map[status];
  // Show full timeline if status is beyond Quoted (e.g. Accepted from customer side)
  if (idx !== undefined && idx > 5) return 6;
  return idx !== undefined ? Math.max(0, idx) : 0;
}

function WorkflowProgress({ currentStatus }: { currentStatus: string }) {
  const currentIdx = getStepIndex(currentStatus);
  if (currentIdx < 0) return null;

  return (
    <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
      {workflowSteps.map((step, i) => {
        const Icon = workflowIcons[step] ?? Clock;
        const isComplete = Math.floor(currentIdx) > i;
        const isCurrent = Math.floor(currentIdx) === i;
        const isPartial = currentIdx > i && currentIdx < i + 1;
        return (
          <div key={step} className="flex items-center gap-0 flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                isComplete || isPartial ? "bg-emerald-500 text-white" :
                isCurrent ? "bg-[var(--color-primary)] text-white ring-2 ring-[var(--color-primary)]/30" :
                "bg-[var(--bg-surface-hover)] text-[var(--text-muted)]"
              }`}>
                <Icon size={15} />
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight max-w-[80px] ${
                isCurrent ? "text-[var(--color-primary)]" :
                isComplete || isPartial ? "text-emerald-600 dark:text-emerald-400" :
                "text-[var(--text-muted)]"
              }`}>
                {step}
              </span>
            </div>
            {i < workflowSteps.length - 1 && (
              <div className={`flex-1 h-px mx-1 mt-[-20px] ${
                (isComplete || isPartial) || (isCurrent && i < Math.floor(currentIdx)) ? "bg-emerald-400" : "bg-[var(--border-default)]"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Auth-fetched image                                                 */
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
  if (!url) return <div className="w-full aspect-[4/3] rounded-xl bg-[var(--bg-surface)] animate-pulse" />;
  return <img src={url} alt={fileName} className="w-full h-full object-cover rounded-xl" />;
}

/* ------------------------------------------------------------------ */
/*  Related Record Card                                                */
/* ------------------------------------------------------------------ */

function RelatedCard({ icon: Icon, label, status, href }: { icon: any; label: string; status: string; href: string }) {
  const statusColor = status === "Generated" || status === "Approved" ? "text-[#22C55E] bg-[#F0FDF4]"
    : status === "Pending" ? "text-[#F59E0B] bg-[#FFFBEB]"
    : "text-[#64748B] bg-[#F1F5F9]";
  return (
    <Link to={href} className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] p-3.5 hover:bg-[var(--bg-surface-hover)] transition-all no-underline hover:no-underline">
      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 shrink-0">
        <Icon size={16} className="text-[var(--color-primary)]" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-[var(--text-primary)]">{label}</div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold mt-1 ${statusColor}`}>{status}</span>
      </div>
      <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0" />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
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
    setBusy(true); setMsg(null);
    try { const r = await engineerApi.updateEnquiryStatus(id, newStatus, note); setMsg(r.message); setEnquiry(await engineerApi.enquiry(id)); }
    catch { setMsg("Status update failed."); }
    finally { setBusy(false); }
  }

  function downloadFile(fileId: string, fileName: string) {
    const token = tokenStorage.getAccessToken();
    const url = `${config.apiBaseUrl}/api/v1/engineer/enquiries/${id}/files/${fileId}/download`;
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then((blob) => { const u = URL.createObjectURL(blob); const d = document.createElement("a"); d.href = u; d.download = fileName; d.click(); URL.revokeObjectURL(u); })
      .catch(() => setMsg("Download failed."));
  }

  if (missing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle size={48} className="text-[var(--text-muted)] mb-4 opacity-40" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)] m-0">Enquiry not found</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1 mb-4">This Enquiry may have been deleted or you may not have access.</p>
        <Link to="/admin/enquiries" className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-all no-underline hover:no-underline">
          <ArrowLeft size={14} /> Back to Enquiries
        </Link>
      </div>
    );
  }

  if (!enquiry) return <div className="py-10"><Loading label="Loading Enquiry" /></div>;

  const cfg = getStatusConfig(enquiry.status);
  const currentStepIdx = getStepIndex(enquiry.status);

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)]">

      {/* ── Sticky Header ── */}
      <div className="shrink-0 bg-[var(--bg-card)] border-b border-[var(--border-default)] rounded-t-[16px] shadow-sm">
        <div className="px-6 pt-5 pb-4">
          {/* Back + breadcrumb */}
          <div className="flex items-center gap-2 mb-3">
            <Link to="/admin/enquiries" className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all no-underline">
              <ChevronLeft size={16} />
            </Link>
            <span className="text-[13px] text-[var(--text-muted)]">Back to Enquiries</span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] m-0 leading-none">
                  Enquiry — {enquiry.productType}
                </h1>
                <StatusBadge status={enquiry.status} size="md" />
                {enquiry.isDraft && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                    DRAFT
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[13px] text-[var(--text-secondary)] flex-wrap">
                <span className="font-mono text-[12px] font-medium text-[var(--color-primary)]">
                  Enquiry-{enquiry.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                <span className="flex items-center gap-1"><Building2 size={12} /> {enquiry.companyName}</span>
                <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                <span className="flex items-center gap-1"><Calendar size={12} /> Received {formatDate(enquiry.createdAtUtc)}</span>
                {enquiry.assignedToUserId && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                    <span className="flex items-center gap-1"><User size={12} /> Assigned</span>
                  </>
                )}
                <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                <span className="flex items-center gap-1"><AlertCircle size={12} /> <PriorityBadge priority={enquiry.priority} /></span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 ml-4">
              {!["Approved", "Quoted", "Accepted", "Rejected", "Declined", "Cancelled", "Expired"].includes(enquiry.status) && (
                <button type="button" disabled={busy} onClick={() => {
                  const workflowOrder = ["Draft", "Submitted", "Received", "Under Review", "Approved"];
                  const idx = workflowOrder.indexOf(enquiry.status);
                  if (idx >= 0 && idx < workflowOrder.length - 1) void updateStatus(workflowOrder[idx + 1]);
                }}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all">
                  <ChevronRight size={14} /> Advance Stage
                </button>
              )}
              {enquiry.status === "Approved" && !enquiry.hasDraftQuotation && (
                <button type="button" onClick={() => window.location.assign(`/admin/quotations/new?enquiryId=${enquiry.id}&companyName=${encodeURIComponent(enquiry.companyName)}`)}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-all">
                  <FileEdit size={15} /> Generate Quote
                </button>
              )}
              {enquiry.hasDraftQuotation && (
                <Link to={`/admin/quotations/${enquiry.draftQuotationId}`}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-all no-underline hover:no-underline">
                  <FileEdit size={15} /> {enquiry.status === "Approved" ? "View Draft" : "View Quote"}
                </Link>
              )}
              {!["Draft", "Quoted", "Accepted", "Rejected", "Declined", "Cancelled", "Expired"].includes(enquiry.status) && (
                <button type="button" disabled={busy} onClick={() => setShowRejectModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50 transition-all">
                  <XCircle size={14} /> Reject
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Workflow Progress ── */}
        {currentStepIdx >= 0 && (
          <div className="px-6 pb-5">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] p-4">
              <WorkflowProgress currentStatus={enquiry.status} />
            </div>
          </div>
        )}

        {/* ── Summary Cards ── */}
        <div className="px-6 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <InfoCard icon={Building2} label="Customer" value={enquiry.companyName} sub={enquiry.fullName ? `Contact: ${enquiry.fullName}` : undefined} color="bg-[var(--color-primary)]/10" />
            <InfoCard icon={Package} label="Product / Material" value={enquiry.productType} sub={enquiry.materialGrade ? `Grade: ${enquiry.materialGrade}` : undefined} color="bg-[#F0FDF4]" />
            <InfoCard icon={MapPinned} label="Quantity / Delivery" value={enquiry.quantity} sub={enquiry.deliveryLocation ?? "No delivery location"} color="bg-[#EFF6FF]" />
            <InfoCard icon={Activity} label="Status / Priority" value={cfg.label} sub={`Priority: ${enquiry.priority}`} color="bg-[#FFF7ED]" />
          </div>
        </div>
      </div>

      {/* ── Status message ── */}
      {msg && (
        <div className={`mx-6 mt-4 rounded-xl px-4 py-3 text-xs font-medium flex items-center gap-2 ${
          msg.includes("failed") ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          {msg.includes("failed") ? <XCircle size={14} /> : <CheckCircle size={14} />}
          {msg}
        </div>
      )}

      {/* ── Two-Column Body ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 px-6 py-6 items-start">

        {/* ══ LEFT COLUMN ══ */}
        <div className="space-y-5">

          {/* Customer Information */}
          <Section icon={Building2} title="Customer Information">
            <div className="flex items-center gap-4 mb-5 p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)]">
              <span className="flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--color-primary)]/10 text-xl font-bold text-[var(--color-primary)] shrink-0">
                {enquiry.companyName.charAt(0)}
              </span>
              <div>
                <div className="text-base font-bold text-[var(--text-primary)]">{enquiry.companyName}</div>
                <div className="text-[12px] text-[var(--text-secondary)]">Customer since N/A</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <Field label="Contact Person" value={enquiry.fullName} icon={User} />
              <Field label="Phone" value={enquiry.phone || "—"} icon={Phone} />
              <Field label="Email" value={enquiry.email} icon={Mail} />
              <Field label="Company" value={enquiry.companyName} icon={Building2} />
            </div>
          </Section>

          {/* Enquiry Information */}
          <Section icon={FileText} title="Enquiry Information">
            <div className="space-y-6">

              {/* Part Details */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Part Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Field label="Part Name" value={enquiry.partName ?? "—"} />
                  <Field label="Part Number" value={enquiry.partNumber ?? "—"} />
                  <Field label="Application" value={enquiry.application ?? "—"} />
                  <Field label="Industry" value={enquiry.industry ?? "—"} />
                </div>
              </div>
              <div className="border-t border-[var(--border-default)]" />

              {/* Material Details */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Material Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Field label="Material Standard" value={enquiry.materialStandard ?? "—"} />
                  <Field label="Approx Weight" value={enquiry.approxWeight != null ? `${enquiry.approxWeight} kg` : "—"} />
                  <Field label="Machining Required" value={enquiry.machiningRequired ?? "—"} />
                  <Field label="Pattern Availability" value={enquiry.patternAvailability ?? "—"} />
                </div>
              </div>
              <div className="border-t border-[var(--border-default)]" />

              {/* Quantity Details */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Quantity Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
                  <Field label="Prototype Quantity" value={enquiry.prototypeQuantity ?? "—"} />
                  <Field label="Production Quantity" value={enquiry.productionQuantity ?? enquiry.quantity} />
                  <Field label="Annual Requirement" value={enquiry.annualRequirement ?? "—"} />
                </div>
              </div>
              <div className="border-t border-[var(--border-default)]" />

              {/* Delivery Details */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Delivery Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Field label="Delivery Location" value={enquiry.deliveryLocation ?? "—"} />
                  <Field label="Expected Delivery Date" value={enquiry.expectedDeliveryDate ? formatDate(enquiry.expectedDeliveryDate) : "—"} />
                  <Field label="Preferred Delivery Terms" value={enquiry.preferredDeliveryTerms ?? "—"} />
                </div>
              </div>

              {/* Additional Requirements */}
              {enquiry.additionalRequirements && (
                <>
                  <div className="border-t border-[var(--border-default)]" />
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Additional Requirements</h4>
                    <div className="flex flex-wrap gap-2">
                      {enquiry.additionalRequirements.split(", ").filter(Boolean).map((r: string) => (
                        <span key={r} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-white dark:bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)]">
                          <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Remarks */}
              {enquiry.remarks && (
                <>
                  <div className="border-t border-[var(--border-default)]" />
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Remarks</h4>
                    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] px-4 py-3">
                      <p className="text-[13px] text-[var(--text-primary)] leading-relaxed m-0 whitespace-pre-wrap">{enquiry.remarks}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Section>

          {/* Drawings & Attachments */}
          <Section icon={Paperclip} title={`Drawings & Attachments${enquiry.files.length > 0 ? ` (${enquiry.files.length})` : ""}`}>
            {enquiry.files.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {enquiry.files.map((f) => {
                  const isImage = f.contentType?.startsWith("image/");
                  return (
                    <div key={f.id} className="group rounded-xl border border-[var(--border-default)] overflow-hidden bg-[var(--bg-app)] hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all duration-200">
                      {/* Preview area */}
                      <div className="relative aspect-[4/3] bg-[var(--bg-surface)]">
                        {isImage ? (
                          <EnquiryImage enquiryId={id} fileId={f.id} fileName={f.fileName} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText size={36} className="text-[var(--text-muted)] opacity-40" />
                          </div>
                        )}
                        {/* Download overlay */}
                        <button
                          type="button"
                          onClick={() => downloadFile(f.id, f.fileName)}
                          className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-[var(--color-primary)] transition-all duration-200"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                      {/* Info bar */}
                      <div className="px-3 py-2.5 border-t border-[var(--border-default)]">
                        <div className="text-[12px] font-medium text-[var(--text-primary)] truncate leading-tight">{f.fileName}</div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{(f.sizeBytes / 1024).toFixed(1)} KB</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-[var(--border-default)]">
                <Paperclip size={36} className="text-[var(--text-muted)] opacity-30 mb-3" />
                <p className="text-[13px] text-[var(--text-muted)] m-0">No drawings or attachments uploaded</p>
                <button type="button" disabled className="mt-3 inline-flex items-center gap-1.5 px-4 h-8 rounded-lg border border-[var(--border-default)] text-xs font-medium text-[var(--text-muted)] opacity-50 cursor-not-allowed">
                  <Download size={13} /> Upload Drawing
                </button>
              </div>
            )}
          </Section>

          {/* Related Records */}
          <Section icon={Activity} title="Related Records" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RelatedCard icon={FileEdit} label="Quote" status={enquiry.status === "Approved" ? "Pending" : "Not Started"} href="/admin/quotations" />
              <RelatedCard icon={Factory} label="Pattern / Tooling" status="Not Started" href="/admin/production" />
              <RelatedCard icon={Truck} label="Dispatch" status="Pending" href="/admin/orders" />
              <RelatedCard icon={CreditCard} label="Invoice" status="Pending" href="/admin/invoices" />
            </div>
          </Section>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div className="space-y-5 lg:sticky lg:top-6">

          {/* Current Status */}
          <section className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0 mb-4">Current Status</h3>
            <div className="flex items-center gap-3 mb-4">
              <span className={`flex items-center justify-center w-12 h-12 rounded-xl ${cfg.bg}`}>
                <cfg.icon size={22} className={cfg.text} />
              </span>
              <div>
                <div className={`text-base font-bold ${cfg.text}`}>{cfg.label}</div>
                <div className="text-[12px] text-[var(--text-secondary)]">
                  Updated {enquiry.statusHistory.length > 0 ? formatDate(enquiry.statusHistory[enquiry.statusHistory.length - 1].occurredAtUtc) : formatDate(enquiry.createdAtUtc)}
                </div>
              </div>
            </div>
            <div className="space-y-3 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Priority</span>
                <PriorityBadge priority={enquiry.priority} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Assigned Engineer</span>
                <span className="text-[var(--text-primary)] font-medium">{enquiry.assignedToUserId ? "Assigned" : "Unassigned"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Created</span>
                <span className="text-[var(--text-primary)]">{formatDate(enquiry.createdAtUtc)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Last Updated</span>
                <span className="text-[var(--text-primary)]">
                  {enquiry.statusHistory.length > 0 ? formatDate(enquiry.statusHistory[enquiry.statusHistory.length - 1].occurredAtUtc) : formatDate(enquiry.createdAtUtc)}
                </span>
              </div>
            </div>
          </section>

          {/* Status Timeline */}
          {enquiry.statusHistory.length > 0 && (
            <section className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} className="text-[var(--text-muted)]" />
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0">Timeline</h3>
              </div>
              <div className="space-y-0">
                {enquiry.statusHistory.map((h, i) => {
                  const isLast = i === enquiry.statusHistory.length - 1;
                  const stepCfg = getStatusConfig(h.toStatus);
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1 ring-2 ring-[var(--bg-card)] ${stepCfg.dot}`} />
                        {!isLast && <div className="w-px flex-1 bg-[var(--border-default)]" />}
                      </div>
                      <div className={`${isLast ? "" : "pb-4"}`}>
                        <div className="text-[12px] font-semibold text-[var(--text-primary)]">{h.fromStatus} → {h.toStatus}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{formatDate(h.occurredAtUtc)} · {h.changedByRole}</div>
                        {h.note && <div className="mt-1 text-[11px] text-[var(--text-secondary)] bg-[var(--bg-surface-hover)] rounded-lg px-2.5 py-1.5">{h.note}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Activity */}
          {enquiry.comments.length > 0 && (
            <section className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={14} className="text-[var(--text-muted)]" />
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0">Activity</h3>
              </div>
              <div className="space-y-4">
                {enquiry.comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-primary)]/10 text-[10px] font-bold text-[var(--color-primary)] shrink-0 mt-0.5">
                      {c.authorRole.charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-[var(--text-primary)]">{c.authorRole}</span>
                        <span className="text-[11px] text-[var(--text-muted)]">{formatDate(c.createdAtUtc)}</span>
                      </div>
                      <p className="text-[12px] text-[var(--text-secondary)] mt-1 m-0">{c.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── Sticky Bottom Action Bar ── */}
      <div className="shrink-0 border-t border-[var(--border-default)] bg-[var(--bg-card)] px-6 py-4 flex items-center gap-3">
        {enquiry.hasDraftQuotation ? (
          <Link to={`/admin/quotations/${enquiry.draftQuotationId}`}
            className="inline-flex items-center gap-1.5 px-5 h-10 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-all no-underline hover:no-underline">
            <FileEdit size={15} /> {enquiry.status === "Approved" ? "View Draft Quote" : "View Quote"}
          </Link>
        ) : enquiry.status === "Approved" ? (
          <button type="button" onClick={() => window.location.assign(`/admin/quotations/new?enquiryId=${enquiry.id}&companyName=${encodeURIComponent(enquiry.companyName)}`)}
            className="inline-flex items-center gap-1.5 px-5 h-10 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-all">
            <FileEdit size={15} /> Generate Quote
          </button>
        ) : (
          <span />
        )}
        <div className="flex-1" />
        <Link to="/admin/enquiries"
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all no-underline hover:no-underline">
          <ArrowLeft size={14} /> Back to List
        </Link>
      </div>

      {/* ── Reject Modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => { setShowRejectModal(false); setRejectReason(""); }} />
          <div className="relative w-full max-w-sm mx-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-400" />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 shrink-0">
                  <XCircle size={22} />
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-[var(--text-primary)] m-0">Reject Enquiry</h3>
                  <p className="text-[12px] text-[var(--text-muted)] m-0 mt-0.5">This will mark the Enquiry as rejected.</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1.5">Reason for Rejection</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Explain why this Enquiry is being rejected..."
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-red-500 resize-none" />
              </div>

              <div className="border-t border-[var(--border-default)] mb-4" />
              <div className="flex items-center justify-end gap-2.5">
                <button type="button" disabled={busy} onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
                  className="px-4 h-9 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50">
                  Cancel
                </button>
                <button type="button" disabled={busy || !rejectReason.trim()} onClick={() => {
                  void updateStatus("Rejected", rejectReason.trim());
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                  className="px-5 h-9 rounded-xl bg-red-500 text-white text-[12px] font-semibold hover:bg-red-600 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  {busy ? "Rejecting..." : "Reject Enquiry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}