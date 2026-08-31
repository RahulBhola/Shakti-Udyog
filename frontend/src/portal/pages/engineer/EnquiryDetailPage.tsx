import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { engineerApi, type EngineerEnquiryDetail } from "../../../api/engineerApi";
import { tokenStorage } from "../../../auth/tokenStorage";
import { config } from "../../../config";
import {
  ArrowLeft, Mail, Phone, Package,
  MapPinned, Calendar, Clock, Activity, MessageSquare, Paperclip,
  ChevronRight, FileText, Loader2,
  XCircle, AlertCircle, Download, FileEdit, User,
  Factory, Truck, CreditCard,
  CheckCircle2, Copy, Check, Shield, Wrench,
  Layers, Flame, ShieldCheck, Tag, Hash
} from "lucide-react";

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
  const cfg = getStatusConfig(status);
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-black border ${cfg.bg} ${cfg.text} ${cfg.border} px-3 py-1 text-xs shadow-xs`}>
      <Icon size={13} className="stroke-[2.2]" />
      <span>{cfg.label}</span>
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

/* ── High-Contrast Spec Item Tile Component ─────────────────────────── */

function SpecTile({
  label,
  value,
  icon: Icon,
  badge,
  copyable,
  highlight,
}: {
  label: string;
  value: string | number | null | undefined | React.ReactNode;
  icon?: any;
  badge?: React.ReactNode;
  copyable?: boolean;
  highlight?: boolean;
}) {
  const displayVal = value == null || value === "" ? "—" : value;
  const isString = typeof displayVal === "string";

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      highlight
        ? "bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/30 shadow-xs"
        : "bg-white dark:bg-[#0f121a] border-neutral-200/90 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20 shadow-xs"
    }`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={14} className="text-neutral-400 dark:text-neutral-500" />}
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {label}
          </span>
        </div>
        {badge}
      </div>

      <div className="flex items-center justify-between gap-2 mt-1">
        <div className={`text-sm sm:text-[15px] font-bold text-neutral-900 dark:text-white leading-snug break-words ${
          displayVal === "—" ? "text-neutral-400 dark:text-neutral-500 font-medium" : ""
        }`}>
          {displayVal}
        </div>
        {copyable && isString && displayVal !== "—" && (
          <CopyButton text={displayVal as string} label={`Copy ${label}`} />
        )}
      </div>
    </div>
  );
}

/* ── Section Container Component ─────────────────────────────────────── */

function SpecSectionCard({
  title,
  icon: Icon,
  badge,
  children,
}: {
  title: string;
  icon: any;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.01] p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-200/80 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold">
            <Icon size={17} />
          </div>
          <h3 className="text-sm sm:text-[15px] font-black text-neutral-900 dark:text-white tracking-tight m-0">
            {title}
          </h3>
        </div>
        {badge}
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ── 6-Step Workflow Progression ─────────────────────────────────────── */

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
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white">
            Enquiry Review Lifecycle (6 Milestones)
          </span>
        </div>
        <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
          Stage {Math.min(6, Math.floor(currentIdx) + 1)} of 6 · {currentStatus}
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
              <div className="flex flex-col items-center gap-2 min-w-[85px] sm:min-w-[110px] select-none">
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all ${
                    isComplete
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                      : isCurrent
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30 scale-105"
                      : "bg-neutral-100 dark:bg-white/5 text-neutral-400 border border-neutral-200 dark:border-white/10"
                  }`}
                >
                  <Icon size={19} strokeWidth={2.2} />
                </div>

                <div className="text-center">
                  <div
                    className={`text-xs tracking-tight transition-colors leading-tight ${
                      isPastOrCurrent
                        ? "text-emerald-600 dark:text-emerald-400 font-black"
                        : "text-neutral-500 dark:text-neutral-400 font-bold"
                    }`}
                  >
                    {step}
                  </div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 hidden sm:block">
                    {isCurrent ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">● Active Stage</span>
                    ) : isComplete ? (
                      "Completed"
                    ) : (
                      "Pending"
                    )}
                  </div>
                </div>
              </div>

              {isNextStep && (
                <div
                  className={`flex-1 h-1 mx-2 sm:mx-3 mt-[-24px] rounded-full transition-colors ${
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
  );
}

/* ── Auth-fetched Image Component ────────────────────────────────────── */

function EnquiryImage({ enquiryId, fileId, fileName }: { enquiryId: string; fileId: string; fileName: string }) {
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

  if (!url) return <div className="w-full aspect-[4/3] rounded-2xl bg-neutral-100 dark:bg-white/5 animate-pulse" />;
  return <img src={url} alt={fileName} className="w-full h-full object-cover rounded-2xl" />;
}

/* ── Main Enquiry Detail Page Component ──────────────────────────────── */

export default function EngineerEnquiryDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
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
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.blob();
      })
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
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mb-4 shadow-sm">
          <XCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-neutral-900 dark:text-white m-0">Enquiry Not Found</h2>
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
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--color-primary)]/10 animate-ping absolute" />
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#0f121a] border border-neutral-200 dark:border-white/10 shadow-xl flex items-center justify-center">
            <Loader2 size={26} className="animate-spin text-[var(--color-primary)]" />
          </div>
        </div>
        <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400">Loading Enquiry Specifications...</p>
      </div>
    );
  }

  const cfg = getStatusConfig(enquiry.status);
  const currentStepIdx = getStepIndex(enquiry.status);
  const customerPalette = getAvatarStyle(enquiry.companyName || enquiry.fullName || "Customer");
  const enqShortId = `ENQ-${enquiry.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Sticky Top Header & Control Center ───────────────────────────── */}
      <div className="sticky top-0 z-20 -mx-6 -mt-6 px-6 py-4 bg-white/80 dark:bg-[#0c0f17]/80 backdrop-blur-xl border-b border-neutral-200/90 dark:border-white/10 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Identifier & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/admin/enquiries")}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all shrink-0 cursor-pointer shadow-xs"
              title="Return to Enquiries list"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <span>{enqShortId}</span>
                  <CopyButton text={enqShortId} label="Copy Enquiry ID" />
                </span>

                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight m-0 truncate">
                  {enquiry.partName || enquiry.productType}
                </h1>

                <StatusBadge status={enquiry.status} />
                <PriorityBadge priority={enquiry.priority} />
              </div>
            </div>
          </div>

          {/* Right: Stage Control Actions */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {!["Approved", "Quoted", "Accepted", "Rejected", "Declined", "Cancelled", "Expired"].includes(enquiry.status) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const workflowOrder = ["Draft", "Submitted", "Received", "Under Review", "Approved"];
                  const idx = workflowOrder.indexOf(enquiry.status);
                  if (idx >= 0 && idx < workflowOrder.length - 1) void updateStatus(workflowOrder[idx + 1]);
                }}
                className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-blue-600/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <ChevronRight size={14} />}
                <span>Advance to {
                  enquiry.status === "Submitted" ? "Received" :
                  enquiry.status === "Received" ? "Under Review" :
                  enquiry.status === "Under Review" ? "Approved" : "Next Stage"
                }</span>
              </button>
            )}

            {enquiry.status === "Approved" && !enquiry.hasDraftQuotation && (
              <button
                type="button"
                onClick={() => navigate(`/admin/quotations/new?enquiryId=${enquiry.id}&companyName=${encodeURIComponent(enquiry.companyName)}`)}
                className="inline-flex items-center gap-2 px-4 h-9 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <FileEdit size={14} />
                <span>Generate Official Quotation</span>
              </button>
            )}

            {enquiry.hasDraftQuotation && (
              <Link
                to={`/admin/quotations/${enquiry.draftQuotationId}`}
                className="inline-flex items-center gap-2 px-4 h-9 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-black hover:bg-amber-100 transition-all no-underline shadow-xs"
              >
                <FileEdit size={14} />
                <span>{enquiry.status === "Approved" ? "View Draft Quote" : "View Quote"}</span>
              </Link>
            )}

            {!["Draft", "Quoted", "Accepted", "Rejected", "Declined", "Cancelled", "Expired"].includes(enquiry.status) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowRejectModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100/60 dark:hover:bg-rose-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                <XCircle size={14} />
                <span>Reject</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Status Flash Message ──────────────────────────────────────────── */}
      {msg && (
        <div
          className={`rounded-2xl p-4 text-xs font-bold flex items-center justify-between border shadow-xs animate-in fade-in slide-in-from-top-2 ${
            msg.includes("failed") || msg.includes("Fail")
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {msg.includes("failed") ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{msg}</span>
          </div>
          <button type="button" onClick={() => setMsg(null)} className="opacity-70 hover:opacity-100 cursor-pointer">
            <XCircle size={15} />
          </button>
        </div>
      )}

      {/* ── 6-Step Manufacturing Review Lifecycle Stepper ─────────────────── */}
      {currentStepIdx >= 0 && (
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs before:absolute before:inset-0 before:bg-[radial-gradient(280px_160px_at_95%_0%,rgba(59,130,246,0.12),transparent)] before:pointer-events-none">
          <WorkflowProgress currentStatus={enquiry.status} />
        </div>
      )}

      {/* ── Top Customer & Overview Banner ───────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border shadow-xs shrink-0"
            style={{ background: customerPalette.bg, color: customerPalette.fg, borderColor: customerPalette.border }}
          >
            {initials(enquiry.companyName, enquiry.fullName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white m-0 tracking-tight">
                {enquiry.companyName}
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300">
                Commercial Client
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex-wrap font-medium">
              {enquiry.fullName && (
                <span className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 font-bold">
                  <User size={13} className="text-neutral-400" />
                  {enquiry.fullName}
                </span>
              )}
              {enquiry.email && (
                <a href={`mailto:${enquiry.email}`} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                  <Mail size={13} />
                  {enquiry.email}
                </a>
              )}
              {enquiry.phone && (
                <a href={`tel:${enquiry.phone}`} className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline">
                  <Phone size={13} />
                  {enquiry.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-neutral-100 dark:border-white/10 pt-4 md:pt-0 md:pl-6 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Target Production Qty</span>
            <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tabular-nums">
              {Number((enquiry.productionQuantity ?? enquiry.quantity) || 0).toLocaleString("en-IN") || enquiry.quantity} Units
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ══ LEFT COLUMN (2 Cols wide - Technical Specs) ══ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Group 1: Part & Component Specs */}
          <SpecSectionCard title="Part & Component Specifications" icon={Package}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <SpecTile
                label="Part Name"
                value={enquiry.partName}
                icon={Tag}
                highlight={true}
                copyable={true}
              />
              <SpecTile
                label="Part Number"
                value={
                  enquiry.partNumber ? (
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400">
                      {enquiry.partNumber}
                    </span>
                  ) : (
                    "—"
                  )
                }
                icon={Hash}
                copyable={!!enquiry.partNumber}
              />
              <SpecTile
                label="Target Application"
                value={enquiry.application}
                icon={Wrench}
              />
              <SpecTile
                label="Industry Sector"
                value={
                  enquiry.industry ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-neutral-200">
                      {enquiry.industry}
                    </span>
                  ) : (
                    "—"
                  )
                }
                icon={Factory}
              />
            </div>
          </SpecSectionCard>

          {/* Group 2: Metallurgy & Tooling */}
          <SpecSectionCard title="Metallurgy, Tooling & Weight" icon={Flame}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <SpecTile
                label="Material Standard / Grade"
                value={
                  enquiry.materialStandard ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {enquiry.materialStandard}
                    </span>
                  ) : (
                    "—"
                  )
                }
                icon={Shield}
                copyable={!!enquiry.materialStandard}
              />
              <SpecTile
                label="Approximate Unit Weight"
                value={enquiry.approxWeight != null ? `${enquiry.approxWeight} kg` : "—"}
                icon={Package}
              />
              <SpecTile
                label="Machining Required"
                value={
                  enquiry.machiningRequired ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      {enquiry.machiningRequired}
                    </span>
                  ) : (
                    "—"
                  )
                }
                icon={Wrench}
              />
              <SpecTile
                label="Pattern Tooling Availability"
                value={
                  enquiry.patternAvailability ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      {enquiry.patternAvailability}
                    </span>
                  ) : (
                    "—"
                  )
                }
                icon={Layers}
              />
            </div>
          </SpecSectionCard>

          {/* Group 3: Volume & Logistics */}
          <SpecSectionCard title="Production Volume & Logistics Terms" icon={Truck}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <SpecTile
                label="Prototype Quantity"
                value={enquiry.prototypeQuantity != null ? `${enquiry.prototypeQuantity} Units` : "—"}
                icon={Package}
              />
              <SpecTile
                label="Production Batch Qty"
                value={
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">
                    {Number((enquiry.productionQuantity ?? enquiry.quantity) || 0).toLocaleString("en-IN") || enquiry.quantity} Units
                  </span>
                }
                icon={Factory}
                highlight={true}
              />
              <SpecTile
                label="Annual Requirement"
                value={enquiry.annualRequirement != null ? `${enquiry.annualRequirement} Units/Yr` : "—"}
                icon={Activity}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3 border-t border-neutral-200/80 dark:border-white/10">
              <SpecTile
                label="Delivery Location"
                value={enquiry.deliveryLocation}
                icon={MapPinned}
                copyable={!!enquiry.deliveryLocation}
              />
              <SpecTile
                label="Expected Delivery Date"
                value={enquiry.expectedDeliveryDate ? formatShortDate(enquiry.expectedDeliveryDate) : "—"}
                icon={Calendar}
              />
              <SpecTile
                label="Preferred Terms"
                value={
                  enquiry.preferredDeliveryTerms ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                      {enquiry.preferredDeliveryTerms}
                    </span>
                  ) : (
                    "—"
                  )
                }
                icon={CreditCard}
              />
            </div>
          </SpecSectionCard>

          {/* Group 4: Certifications & Special Requirements */}
          {enquiry.additionalRequirements && (
            <SpecSectionCard title="Testing & Quality Certifications Required" icon={ShieldCheck}>
              <div className="flex flex-wrap gap-2.5">
                {enquiry.additionalRequirements.split(", ").filter(Boolean).map((r: string) => (
                  <span
                    key={r}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-xs"
                  >
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>{r}</span>
                  </span>
                ))}
              </div>
            </SpecSectionCard>
          )}

          {/* Group 5: Customer Special Remarks */}
          {enquiry.remarks && (
            <SpecSectionCard title="Customer Special Remarks" icon={MessageSquare}>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#0f121a] border border-neutral-200/90 dark:border-white/10 shadow-xs">
                <p className="text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed m-0 whitespace-pre-wrap font-medium">
                  {enquiry.remarks}
                </p>
              </div>
            </SpecSectionCard>
          )}

          {/* Group 6: Drawings & CAD Attachments */}
          <SpecSectionCard
            title={`Technical Drawings & CAD Files (${enquiry.files.length})`}
            icon={Paperclip}
          >
            {enquiry.files.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {enquiry.files.map((f) => {
                  const isImage = f.contentType?.startsWith("image/");
                  return (
                    <div
                      key={f.id}
                      className="group rounded-2xl border border-neutral-200/90 dark:border-white/10 overflow-hidden bg-white dark:bg-[#0f121a] hover:shadow-md hover:border-blue-500/40 transition-all duration-200 flex flex-col"
                    >
                      <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-white/5 overflow-hidden flex items-center justify-center">
                        {isImage ? (
                          <EnquiryImage enquiryId={id} fileId={f.id} fileName={f.fileName} />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-neutral-400">
                            <FileText size={40} className="text-blue-500/60" />
                            <span className="text-[10px] font-bold uppercase">{f.fileName.split('.').pop()}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => downloadFile(f.id, f.fileName)}
                          className="absolute top-2.5 right-2.5 flex items-center justify-center w-8 h-8 rounded-xl bg-black/70 backdrop-blur-xs text-white opacity-0 group-hover:opacity-100 hover:bg-blue-600 transition-all duration-200 shadow-sm cursor-pointer"
                          title="Download File"
                        >
                          <Download size={14} />
                        </button>
                      </div>

                      <div className="p-3 border-t border-neutral-100 dark:border-white/10 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {f.fileName}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                            {(f.sizeBytes / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => downloadFile(f.id, f.fileName)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 rounded-2xl border border-dashed border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a]">
                <Paperclip size={28} className="text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 m-0">No files attached</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Customer did not upload CAD drawings for this enquiry.</p>
              </div>
            )}
          </SpecSectionCard>
        </div>

        {/* ══ RIGHT COLUMN (Sidebar with Lifecycle & Audit) ══ */}
        <div className="space-y-6">
          {/* Lifecycle & Status Overview Card */}
          <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/10 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 m-0">
                Current Lifecycle State
              </h3>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/80 dark:border-white/10">
              <div className={`w-12 h-12 rounded-2xl ${cfg.bg} ${cfg.border} border flex items-center justify-center shrink-0 shadow-xs`}>
                <cfg.icon size={22} className={cfg.text} />
              </div>
              <div className="min-w-0">
                <div className={`text-sm font-black ${cfg.text} truncate`}>{cfg.label}</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {enquiry.statusHistory.length > 0
                    ? `Updated ${formatDate(enquiry.statusHistory[enquiry.statusHistory.length - 1].occurredAtUtc)}`
                    : `Created ${formatDate(enquiry.createdAtUtc)}`}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs pt-1">
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-white/5">
                <span className="font-bold text-neutral-500">Evaluation Priority</span>
                <PriorityBadge priority={enquiry.priority} />
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-white/5">
                <span className="font-bold text-neutral-500">Submission Date</span>
                <span className="font-bold text-neutral-800 dark:text-neutral-200">
                  {formatDate(enquiry.createdAtUtc)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="font-bold text-neutral-500">Enquiry ID</span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                  {enquiry.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Trail Timeline */}
          {enquiry.statusHistory.length > 0 && (
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-white/10 pb-3">
                <Clock size={15} className="text-blue-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 m-0">
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
                        <div className="text-xs font-black text-neutral-900 dark:text-white truncate">
                          {h.fromStatus} → {h.toStatus}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          {formatDate(h.occurredAtUtc)} · <span className="font-bold text-neutral-600 dark:text-neutral-300">{h.changedByRole}</span>
                        </div>
                        {h.note && (
                          <div className="mt-1.5 text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-white/[0.03] border border-neutral-100 dark:border-white/5 rounded-xl p-2.5 font-medium leading-relaxed">
                            {h.note}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Internal Engineering Notes */}
          {enquiry.comments.length > 0 && (
            <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-white/10 pb-3">
                <MessageSquare size={15} className="text-blue-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 m-0">
                  Engineering Notes
                </h3>
              </div>

              <div className="space-y-2.5">
                {enquiry.comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">{c.authorRole}</span>
                      <span className="text-neutral-400">{formatDate(c.createdAtUtc)}</span>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 m-0 leading-relaxed font-medium">
                      {c.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Custom Reject Modal (Zero native popups) ─────────────────────── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => { setShowRejectModal(false); setRejectReason(""); }}>
          <div
            className="w-full max-w-md bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-rose-500/5 text-rose-600 dark:text-rose-400">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <XCircle size={18} />
                </div>
                <h3 className="font-extrabold text-sm m-0">Reject Enquiry</h3>
              </div>
              <button onClick={() => { setShowRejectModal(false); setRejectReason(""); }} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
                <XCircle size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
                Please provide an engineering rationale for declining this enquiry. This note will be recorded in the audit log.
              </p>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Rejection Reason / Engineering Note *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Incompatible metallurgy grade or casting volume exceeds single-pour foundry capacity..."
                  className="w-full rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 p-3.5 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none focus:border-rose-500 resize-none font-medium"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => { setShowRejectModal(false); setRejectReason(""); }}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
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
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}