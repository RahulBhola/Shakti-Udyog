import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import { updaterApi, type UpdaterRfqDetail } from "../../../api/updaterApi";
import { adminApi, type EngineerWorkload } from "../../../api/adminApi";
import { tokenStorage } from "../../../auth/tokenStorage";
import { config } from "../../../config";
import { Loading } from "../../../components/ui";
import { formatDate } from "../../shared";
import {
  ArrowLeft, Building2, Mail, Phone, Package,
  MapPinned, Calendar, Clock, Activity, MessageSquare, Paperclip,
  ChevronRight, FileText,
  CheckCircle, XCircle, AlertCircle, Download, FileEdit, User,
  ChevronDown, ChevronUp, Factory, Truck, CreditCard,
  ChevronLeft, Loader2,
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

function RfqImage({ rfqId, fileId, fileName }: { rfqId: string; fileId: string; fileName: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const token = tokenStorage.getAccessToken();
    fetch(`${config.apiBaseUrl}/api/v1/updater/rfqs/${rfqId}/files/${fileId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include",
    }).then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then((blob) => { if (!cancelled) setUrl(URL.createObjectURL(blob)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [rfqId, fileId]);
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

export default function UpdaterRfqDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const isEngineer = user?.roles.includes("Engineer") === true && user?.roles.includes("Admin") !== true;

  const [rfq, setRfq] = useState<UpdaterRfqDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Admin-only: engineer assignment (with workload) + the engineer roster.
  const [engineers, setEngineers] = useState<EngineerWorkload[]>([]);
  const [assignTo, setAssignTo] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  // Comment composer (engineers are view + comment only).
  const [comment, setComment] = useState("");
  const [commentVisible, setCommentVisible] = useState(true);
  const [commentBusy, setCommentBusy] = useState(false);

  useEffect(() => {
    updaterApi.rfq(id).then(setRfq).catch(() => setMissing(true));
  }, [id]);

  useEffect(() => {
    if (isEngineer) return;
    adminApi.engineers().then(setEngineers).catch(() => {});
  }, [isEngineer]);

  async function handleAssign() {
    if (!rfq || !assignTo) return;
    setAssignBusy(true); setAssignMsg(null);
    try {
      await adminApi.assignRfq(rfq.id, assignTo);
      setAssignTo("");
      setAssignMsg("RFQ assigned.");
      const updated = await updaterApi.rfq(rfq.id);
      setRfq(updated);
      adminApi.engineers().then(setEngineers).catch(() => {});
    } catch (e) {
      setAssignMsg((e as Error).message || "Assignment failed.");
    } finally {
      setAssignBusy(false);
    }
  }

  async function handleComment() {
    if (!rfq || !comment.trim()) return;
    setCommentBusy(true);
    try {
      await updaterApi.addRfqComment(rfq.id, comment.trim(), commentVisible);
      setComment("");
      const updated = await updaterApi.rfq(rfq.id);
      setRfq(updated);
    } catch (e) {
      setMsg((e as Error).message || "Failed to add comment.");
    } finally {
      setCommentBusy(false);
    }
  }

  async function updateStatus(newStatus: string, note?: string) {
    setBusy(true); setMsg(null);
    try { const r = await updaterApi.updateRfqStatus(id, newStatus, note); setMsg(r.message); setRfq(await updaterApi.rfq(id)); }
    catch { setMsg("Status update failed."); }
    finally { setBusy(false); }
  }

  function downloadFile(fileId: string, fileName: string) {
    const token = tokenStorage.getAccessToken();
    const url = `${config.apiBaseUrl}/api/v1/updater/rfqs/${id}/files/${fileId}/download`;
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then((blob) => { const u = URL.createObjectURL(blob); const d = document.createElement("a"); d.href = u; d.download = fileName; d.click(); URL.revokeObjectURL(u); })
      .catch(() => setMsg("Download failed."));
  }

  if (missing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle size={48} className="text-[var(--text-muted)] mb-4 opacity-40" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)] m-0">RFQ not found</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1 mb-4">This RFQ may have been deleted or you may not have access.</p>
        <Link to="/admin/rfqs" className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-all no-underline hover:no-underline">
          <ArrowLeft size={14} /> Back to RFQs
        </Link>
      </div>
    );
  }

  if (!rfq) return <div className="py-10"><Loading label="Loading RFQ" /></div>;

  const cfg = getStatusConfig(rfq.status);
  const currentStepIdx = getStepIndex(rfq.status);

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)]">

      {/* ── Sticky Header ── */}
      <div className="shrink-0 bg-[var(--bg-card)] border-b border-[var(--border-default)] rounded-t-[16px] shadow-sm">
        <div className="px-6 pt-5 pb-4">
          {/* Back + breadcrumb */}
          <div className="flex items-center gap-2 mb-3">
            <Link to="/admin/rfqs" className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all no-underline">
              <ChevronLeft size={16} />
            </Link>
            <span className="text-[13px] text-[var(--text-muted)]">Back to RFQs</span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] m-0 leading-none">
                  RFQ — {rfq.productType}
                </h1>
                <StatusBadge status={rfq.status} size="md" />
                {rfq.isDraft && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                    DRAFT
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[13px] text-[var(--text-secondary)] flex-wrap">
                <span className="font-mono text-[12px] font-medium text-[var(--color-primary)]">
                  RFQ-{rfq.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                {!isEngineer && (
                  <><span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                  <span className="flex items-center gap-1"><Building2 size={12} /> {rfq.companyName}</span></>
                )}
                <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                <span className="flex items-center gap-1"><Calendar size={12} /> Received {formatDate(rfq.createdAtUtc)}</span>
                {rfq.assignedToUserId && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                    <span className="flex items-center gap-1"><User size={12} /> Assigned</span>
                  </>
                )}
                <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
                <span className="flex items-center gap-1"><AlertCircle size={12} /> <PriorityBadge priority={rfq.priority} /></span>
              </div>
            </div>

            {/* Actions (admin only) */}
            {!isEngineer && (
            <div className="flex items-center gap-2 shrink-0 ml-4">
              {!["Approved", "Quoted", "Accepted", "Rejected", "Declined", "Cancelled", "Expired"].includes(rfq.status) && (
                <button type="button" disabled={busy} onClick={() => {
                  const workflowOrder = ["Draft", "Submitted", "Received", "Under Review", "Approved", "Quoted"];
                  const idx = workflowOrder.indexOf(rfq.status);
                  if (idx >= 0 && idx < workflowOrder.length - 1) void updateStatus(workflowOrder[idx + 1]);
                }}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all">
                  <ChevronRight size={14} /> Advance Stage
                </button>
              )}
              {rfq.status === "Approved" && !rfq.hasDraftQuotation && (
                <button type="button" onClick={() => window.location.assign(`/admin/quotations/new?rfqId=${rfq.id}&companyName=${encodeURIComponent(rfq.companyName)}`)}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-all">
                  <FileEdit size={14} /> Generate Quotation
                </button>
              )}
              {rfq.hasDraftQuotation && (
                <Link to={`/admin/quotations/${rfq.draftQuotationId}`}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-all no-underline hover:no-underline">
                  <FileEdit size={14} /> {rfq.status === "Approved" ? "View Draft" : "View Quotation"}
                </Link>
              )}
              {!["Draft", "Quoted", "Accepted", "Rejected", "Declined", "Cancelled", "Expired"].includes(rfq.status) && (
                <button type="button" disabled={busy} onClick={() => setShowRejectModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-50 transition-all">
                  <XCircle size={14} /> Reject
                </button>
              )}
            </div>
            )}
          </div>
        </div>

        {/* ── Workflow Progress ── */}
        {currentStepIdx >= 0 && (
          <div className="px-6 pb-5">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] p-4">
              <WorkflowProgress currentStatus={rfq.status} />
            </div>
          </div>
        )}

        {/* ── Summary Cards ── */}
        <div className="px-6 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {!isEngineer && <InfoCard icon={Building2} label="Customer" value={rfq.companyName} sub={rfq.fullName ? `Contact: ${rfq.fullName}` : undefined} color="bg-[var(--color-primary)]/10" />}
            <InfoCard icon={Package} label="Product / Material" value={rfq.productType} sub={rfq.materialGrade ? `Grade: ${rfq.materialGrade}` : undefined} color="bg-[#F0FDF4]" />
            <InfoCard icon={MapPinned} label="Quantity / Delivery" value={rfq.quantity} sub={rfq.deliveryLocation ?? "No delivery location"} color="bg-[#EFF6FF]" />
            <InfoCard icon={Activity} label="Status / Priority" value={cfg.label} sub={`Priority: ${rfq.priority}`} color="bg-[#FFF7ED]" />
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

          {/* Customer Information (admin only) */}
          {!isEngineer && (
          <Section icon={Building2} title="Customer Information">
            <div className="flex items-center gap-4 mb-5 p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)]">
              <span className="flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--color-primary)]/10 text-xl font-bold text-[var(--color-primary)] shrink-0">
                {rfq.companyName.charAt(0)}
              </span>
              <div>
                <div className="text-base font-bold text-[var(--text-primary)]">{rfq.companyName}</div>
                <div className="text-[12px] text-[var(--text-secondary)]">Customer since N/A</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <Field label="Contact Person" value={rfq.fullName} icon={User} />
              <Field label="Phone" value={rfq.phone || "—"} icon={Phone} />
              <Field label="Email" value={rfq.email} icon={Mail} />
              <Field label="Company" value={rfq.companyName} icon={Building2} />
            </div>
          </Section>
          )}

          {/* RFQ Information */}
          <Section icon={FileText} title="RFQ Information">
            <div className="space-y-6">

              {/* Part Details */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Part Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Field label="Part Name" value={rfq.partName ?? "—"} />
                  <Field label="Part Number" value={rfq.partNumber ?? "—"} />
                  <Field label="Application" value={rfq.application ?? "—"} />
                  <Field label="Industry" value={rfq.industry ?? "—"} />
                </div>
              </div>
              <div className="border-t border-[var(--border-default)]" />

              {/* Material Details */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Material Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Field label="Material Standard" value={rfq.materialStandard ?? "—"} />
                  <Field label="Approx Weight" value={rfq.approxWeight != null ? `${rfq.approxWeight} kg` : "—"} />
                  <Field label="Machining Required" value={rfq.machiningRequired ?? "—"} />
                  <Field label="Pattern Availability" value={rfq.patternAvailability ?? "—"} />
                </div>
              </div>
              <div className="border-t border-[var(--border-default)]" />

              {/* Quantity Details */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Quantity Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
                  <Field label="Prototype Quantity" value={rfq.prototypeQuantity ?? "—"} />
                  <Field label="Production Quantity" value={rfq.productionQuantity ?? rfq.quantity} />
                  <Field label="Annual Requirement" value={rfq.annualRequirement ?? "—"} />
                </div>
              </div>
              <div className="border-t border-[var(--border-default)]" />

              {/* Delivery Details */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Delivery Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <Field label="Delivery Location" value={rfq.deliveryLocation ?? "—"} />
                  <Field label="Expected Delivery Date" value={rfq.expectedDeliveryDate ? formatDate(rfq.expectedDeliveryDate) : "—"} />
                  <Field label="Preferred Delivery Terms" value={rfq.preferredDeliveryTerms ?? "—"} />
                </div>
              </div>

              {/* Additional Requirements */}
              {rfq.additionalRequirements && (
                <>
                  <div className="border-t border-[var(--border-default)]" />
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Additional Requirements</h4>
                    <div className="flex flex-wrap gap-2">
                      {rfq.additionalRequirements.split(", ").filter(Boolean).map((r: string) => (
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
              {rfq.remarks && (
                <>
                  <div className="border-t border-[var(--border-default)]" />
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Remarks</h4>
                    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] px-4 py-3">
                      <p className="text-[13px] text-[var(--text-primary)] leading-relaxed m-0 whitespace-pre-wrap">{rfq.remarks}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Section>

          {/* Drawings & Attachments */}
          <Section icon={Paperclip} title={`Drawings & Attachments${rfq.files.length > 0 ? ` (${rfq.files.length})` : ""}`}>
            {rfq.files.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {rfq.files.map((f) => {
                  const isImage = f.contentType?.startsWith("image/");
                  return (
                    <div key={f.id} className="group rounded-xl border border-[var(--border-default)] overflow-hidden bg-[var(--bg-app)] hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all duration-200">
                      {/* Preview area */}
                      <div className="relative aspect-[4/3] bg-[var(--bg-surface)]">
                        {isImage ? (
                          <RfqImage rfqId={id} fileId={f.id} fileName={f.fileName} />
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

          {/* Related Records (admin only) */}
          {!isEngineer && (
          <Section icon={Activity} title="Related Records" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RelatedCard icon={FileEdit} label="Quotation" status={rfq.status === "Approved" ? "Pending" : "Not Started"} href="/admin/quotations" />
              <RelatedCard icon={Factory} label="Pattern / Tooling" status="Not Started" href="/admin/production" />
              <RelatedCard icon={Truck} label="Dispatch" status="Pending" href="/admin/orders" />
              <RelatedCard icon={CreditCard} label="Invoice" status="Pending" href="/admin/invoices" />
            </div>
          </Section>
          )}
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
                  Updated {rfq.statusHistory.length > 0 ? formatDate(rfq.statusHistory[rfq.statusHistory.length - 1].occurredAtUtc) : formatDate(rfq.createdAtUtc)}
                </div>
              </div>
            </div>
            <div className="space-y-3 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Priority</span>
                <PriorityBadge priority={rfq.priority} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--text-muted)] shrink-0">Assigned Engineer</span>
                {isEngineer ? (
                  <span className="text-[var(--text-primary)] font-medium truncate">
                    {rfq.assignedToName ?? (rfq.assignedToUserId ? "Assigned" : "Unassigned")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 min-w-0">
                    <select
                      value={assignTo}
                      onChange={(e) => setAssignTo(e.target.value)}
                      className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5 text-[12px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] max-w-[150px]"
                      aria-label="Assign engineer"
                    >
                      <option value="">{rfq.assignedToName ?? "Unassigned"}</option>
                      {engineers
                        .filter((e) => e.id !== rfq.assignedToUserId)
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.fullName} ({e.activeRfqCount} active)
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      disabled={assignBusy || !assignTo}
                      onClick={() => void handleAssign()}
                      className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg bg-[var(--color-primary)] text-white text-[11px] font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all shrink-0"
                    >
                      {assignBusy ? <Loader2 size={12} className="animate-spin" /> : <User size={12} />}
                      Assign
                    </button>
                  </span>
                )}
              </div>
              {!isEngineer && assignMsg && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400">{assignMsg}</div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Created</span>
                <span className="text-[var(--text-primary)]">{formatDate(rfq.createdAtUtc)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Last Updated</span>
                <span className="text-[var(--text-primary)]">
                  {rfq.statusHistory.length > 0 ? formatDate(rfq.statusHistory[rfq.statusHistory.length - 1].occurredAtUtc) : formatDate(rfq.createdAtUtc)}
                </span>
              </div>
            </div>
          </section>

          {/* Add Comment */}
          <section className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare size={14} className="text-[var(--text-muted)]" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0">Add Comment</h3>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Add a note on this RFQ..."
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] cursor-pointer">
                <input type="checkbox" checked={commentVisible} onChange={(e) => setCommentVisible(e.target.checked)} aria-label="Visible to customer" />
                Customer-visible
              </label>
              <button
                type="button"
                disabled={commentBusy || !comment.trim()}
                onClick={() => void handleComment()}
                className="inline-flex items-center gap-1.5 px-4 h-8 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-all"
              >
                {commentBusy ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
                Post Comment
              </button>
            </div>
          </section>

          {/* Status Timeline */}
          {rfq.statusHistory.length > 0 && (
            <section className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={14} className="text-[var(--text-muted)]" />
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0">Timeline</h3>
              </div>
              <div className="space-y-0">
                {rfq.statusHistory.map((h, i) => {
                  const isLast = i === rfq.statusHistory.length - 1;
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
          {rfq.comments.length > 0 && (
            <section className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={14} className="text-[var(--text-muted)]" />
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0">Activity</h3>
              </div>
              <div className="space-y-4">
                {rfq.comments.map((c) => (
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
        {!isEngineer && (rfq.hasDraftQuotation ? (
          <Link to={`/admin/quotations/${rfq.draftQuotationId}`}
            className="inline-flex items-center gap-1.5 px-5 h-10 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-all no-underline hover:no-underline">
            <FileEdit size={14} /> {rfq.status === "Approved" ? "View Draft Quotation" : "View Quotation"}
          </Link>
        ) : rfq.status === "Approved" ? (
          <button type="button" onClick={() => window.location.assign(`/admin/quotations/new?rfqId=${rfq.id}&companyName=${encodeURIComponent(rfq.companyName)}`)}
            className="inline-flex items-center gap-1.5 px-5 h-10 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-all">
            <FileEdit size={14} /> Generate Quotation
          </button>
        ) : (
          <span />
        ))}
        <div className="flex-1" />
        <Link to="/admin/rfqs"
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
                  <h3 className="text-[16px] font-bold text-[var(--text-primary)] m-0">Reject RFQ</h3>
                  <p className="text-[12px] text-[var(--text-muted)] m-0 mt-0.5">This will mark the RFQ as rejected.</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-[12px] font-medium text-[var(--text-primary)] block mb-1.5">Reason for Rejection</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Explain why this RFQ is being rejected..."
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
                  {busy ? "Rejecting..." : "Reject RFQ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}