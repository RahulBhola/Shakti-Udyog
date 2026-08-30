import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  customerApi,
  type EnquiryDetail,
  type EnquiryTimelineEntry,
  type QuotationListItem,
  type Profile,
  type CompanyDetail,
} from "../../api/customerApi";
import { config } from "../../config";
import { tokenStorage } from "../../auth/tokenStorage";
import { Loading } from "../../components/ui";
import { formatDate } from "../shared";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Package,
  Send,
  FileEdit,
  Info,
  ChevronLeft,
  Download,
  Trash2,
  Paperclip,
  UploadCloud,
  FileCode,
  FileSpreadsheet,
  FileImage,
  Layers,
  Phone,
  Mail,
  Headphones,
  Check,
  Calendar,
  MapPin,
  Scale,
  Wrench,
  Loader2,
  Maximize2,
  X,
  ZoomIn,
  Building2,
  Sparkles,
  User,
  ArrowRight,
  Lock,
} from "lucide-react";
import { cn } from "../../lib/utils";
import "./erpListView.css";

/* ── Status Stepper Definitions ───────────────────────────────────── */

const STEPPER_STAGES = [
  { key: "Draft", label: "Drafted", desc: "Requirement details drafted" },
  { key: "Submitted", label: "Submitted", desc: "Sent to Shakti Udyog" },
  { key: "Received", label: "Received", desc: "Acknowledged by foundry" },
  { key: "Under Review", label: "Under Review", desc: "Feasibility & pattern check" },
  { key: "Approved", label: "Approved", desc: "Technical specs validated" },
  { key: "Quoted", label: "Quoted", desc: "Commercial quotation ready" },
  { key: "Accepted", label: "Accepted", desc: "Order confirmed & scheduled" },
];

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-neutral-500/10 border-neutral-500/20", text: "text-neutral-600 dark:text-neutral-400", dot: "bg-neutral-400" },
  submitted: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  received: { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  under_review: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  underreview: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  approved: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  accepted: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  quoted: { bg: "bg-purple-500/10 border-purple-500/20", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500" },
  rejected: { bg: "bg-rose-500/10 border-rose-500/20", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  cancelled: { bg: "bg-rose-500/10 border-rose-500/20", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  declined: { bg: "bg-rose-500/10 border-rose-500/20", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
};

function StatusBadge({ status }: { status: string }) {
  const normKey = status.toLowerCase().replace(/\s+/g, "_");
  const c = statusConfig[normKey] ?? {
    bg: "bg-neutral-500/10 border-neutral-500/20",
    text: "text-neutral-600 dark:text-neutral-400",
    dot: "bg-neutral-400",
  };
  const display = (status === "UnderReview" ? "Under Review" : status).replace(/_/g, " ");
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border", c.bg, c.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />
      <span>{display}</span>
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function isImageFile(fileName: string): boolean {
  return /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(fileName);
}

function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return <FileText size={18} className="text-red-500" />;
  if (["step", "stp", "iges", "igs", "dwg", "dxf"].includes(ext))
    return <FileCode size={18} className="text-blue-500" />;
  if (["xlsx", "xls", "csv"].includes(ext))
    return <FileSpreadsheet size={18} className="text-emerald-500" />;
  if (["png", "jpg", "jpeg", "webp"].includes(ext))
    return <FileImage size={18} className="text-purple-500" />;
  return <Paperclip size={18} className="text-[var(--text-secondary)]" />;
}

/* ── Auth-fetched Image Component ─────────────────────────────────── */

function AuthEnquiryImage({
  enquiryId,
  fileId,
  alt = "Casting Component Drawing",
  className = "w-full h-full object-cover",
  onClick,
}: {
  enquiryId: string;
  fileId: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let objUrl: string | null = null;
    const token = tokenStorage.getAccessToken();

    fetch(`${config.apiBaseUrl}/api/v1/customer/enquiries/${enquiryId}/files/${fileId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load image");
        return r.blob();
      })
      .then((blob) => {
        if (!cancelled) {
          objUrl = URL.createObjectURL(blob);
          setSrc(objUrl);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [enquiryId, fileId]);

  if (loading) {
    return (
      <div className="w-full h-full min-h-[140px] flex items-center justify-center bg-[var(--bg-surface)]/80 animate-pulse rounded-xl">
        <Loader2 size={24} className="animate-spin text-[var(--color-primary)] opacity-60" />
      </div>
    );
  }

  if (!src) {
    return (
      <div className="w-full h-full min-h-[140px] flex items-center justify-center bg-[var(--bg-surface)]/60 rounded-xl text-[var(--text-muted)]">
        <FileImage size={28} className="opacity-40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} cursor-pointer hover:opacity-95 transition-opacity`}
      onClick={onClick}
    />
  );
}

/* ── Section Card Component ───────────────────────────────────────── */

function SectionCard({
  title,
  icon: Icon,
  badge,
  children,
  action,
}: {
  title: string;
  icon?: any;
  badge?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden transition-all duration-200">
      <div className="px-5 py-3.5 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-surface)]/60">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="p-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Icon size={16} />
            </span>
          )}
          <h3 className="text-sm font-bold text-[var(--text-primary)] m-0">{title}</h3>
          {badge}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── Spec Row Component ───────────────────────────────────────────── */

function SpecField({
  label,
  value,
  icon: Icon,
  badge,
}: {
  label: string;
  value?: string | number | null;
  icon?: any;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]/50">
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1.5">
          {Icon && <Icon size={12} className="text-[var(--text-muted)]" />}
          {label}
        </span>
        {badge}
      </div>
      <span className="text-xs font-bold text-[var(--text-primary)] break-words">
        {value != null && String(value).trim() !== "" ? String(value) : "—"}
      </span>
    </div>
  );
}

/* ── Chip Pill ────────────────────────────────────────────────────── */

function RequirementChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] shadow-sm">
      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
      {label}
    </span>
  );
}

/* ── Main Component ───────────────────────────────────────────────── */

export default function EnquiryDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [enquiry, setEnquiry] = useState<EnquiryDetail | null>(null);
  const [timeline, setTimeline] = useState<EnquiryTimelineEntry[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [quotation, setQuotation] = useState<QuotationListItem | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewImageFile, setPreviewImageFile] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [enqRes, timelineRes, quotesRes, profileRes, companyRes] = await Promise.allSettled([
        customerApi.enquiry(id),
        customerApi.enquiryTimeline(id),
        customerApi.quotations(),
        customerApi.profile(),
        customerApi.companyDetail(),
      ]);

      if (enqRes.status === "fulfilled") {
        setEnquiry(enqRes.value);
      } else {
        setMissing(true);
      }

      if (timelineRes.status === "fulfilled") {
        setTimeline(timelineRes.value);
      }
      if (quotesRes.status === "fulfilled") {
        const match = quotesRes.value.find((q) => q.enquiryId === id);
        if (match) setQuotation(match);
      }
      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value);
      }
      if (companyRes.status === "fulfilled") {
        setCompany(companyRes.value);
      }
    } catch {
      setMissing(true);
    }
  };

  async function handleDeleteEnquiry() {
    if (!enquiry) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await customerApi.deleteEnquiry(enquiry.id);
      setShowDeleteModal(false);
      navigate("/customer/enquiries");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete enquiry. It may have already been acknowledged by the foundry.";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [id]);

  async function submitDraft() {
    setSubmitting(true);
    try {
      await customerApi.submitEnquiry(id);
      await loadData();
    } catch {
      alert("Could not submit the draft.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        await customerApi.uploadEnquiryFile(id, files[i]);
      }
      await loadData();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file. Check allowed format (max 10MB).");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteFile(fileId: string, fileName: string) {
    if (!confirm(`Delete attachment "${fileName}"?`)) return;
    try {
      await customerApi.deleteEnquiryFile(id, fileId);
      await loadData();
    } catch {
      alert("Could not delete the file.");
    }
  }

  function downloadFile(fileId: string, fileName: string) {
    const token = tokenStorage.getAccessToken();
    const downloadUrl = `${config.apiBaseUrl}/api/v1/customer/enquiries/${id}/files/${fileId}`;

    fetch(downloadUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    })
      .then((r) => {
        if (!r.ok) throw new Error("Download failed");
        return r.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        alert("Failed to download attachment.");
      });
  }

  if (missing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle size={48} className="text-[var(--text-muted)] mb-4 opacity-40" />
        <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">Enquiry Not Found</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">
          This enquiry may have been removed or you do not have permission to view it.
        </p>
        <Link
          to="/customer/enquiries"
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-primary-hover)] transition-all no-underline"
        >
          Back to Enquiries
        </Link>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading label="Loading enquiry specifications" />
      </div>
    );
  }

  const isDraft = enquiry.isDraft && enquiry.status === "Draft";
  const normStatus = enquiry.status === "UnderReview" ? "Under Review" : enquiry.status;
  const currentStageIndex = STEPPER_STAGES.findIndex(
    (s) => s.key.toLowerCase() === normStatus.toLowerCase(),
  );

  const additionalReqs = enquiry.additionalRequirements
    ? enquiry.additionalRequirements.split(", ").filter(Boolean)
    : [];

  const imageFiles = enquiry.files.filter((f) => isImageFile(f.fileName));
  const primaryImage = imageFiles.length > 0 ? imageFiles[0] : null;

  const enqRef = `ENQ-${enquiry.id.slice(0, 8).toUpperCase()}`;
  const partTitle = enquiry.partName || enquiry.productType;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Lightbox Image Preview Modal ───────────────────────────── */}
      {previewImageFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewImageFile(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-default)] overflow-hidden shadow-2xl p-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <FileImage size={18} className="text-[var(--color-primary)]" />
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {previewImageFile.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadFile(previewImageFile.id, previewImageFile.name)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] flex items-center gap-1"
                >
                  <Download size={13} />
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewImageFile(null)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="w-full h-[65vh] flex items-center justify-center p-2 mt-2 bg-[var(--bg-surface)]/40 rounded-xl overflow-hidden">
              <AuthEnquiryImage
                enquiryId={id}
                fileId={previewImageFile.id}
                alt={previewImageFile.name}
                className="max-h-full max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Enquiry Confirmation Modal Popup ────────────────── */}
      {showDeleteModal && enquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div
            style={{ width: "100%", maxWidth: 440, background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-default)", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", padding: 20 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid var(--border-default)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(239, 68, 68, 0.12)", color: "rgb(239, 68, 68)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                    Delete Enquiry
                  </h3>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>
                    {enqRef}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ paddingTop: 14, paddingBottom: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Policy Callout Notice */}
              <div style={{ padding: 12, borderRadius: 10, background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.25)", color: "#b45309", fontSize: 12, lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 10 }}>
                <AlertCircle size={16} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ display: "block", marginBottom: 2, fontWeight: 700 }}>Enquiry Deletion Policy</strong>
                  You can delete this generated enquiry only <strong>before the Admin or Foundry Engineering team changes the enquiry progress</strong> (while in <em>Draft</em> or <em>Submitted</em> status). Once the team acknowledges or advances progress to <em>Received</em>, <em>Under Review</em>, or beyond, the enquiry is locked to preserve engineering evaluations.
                </div>
              </div>

              {/* Enquiry Item Details Card */}
              <div style={{ padding: 12, borderRadius: 10, background: "var(--bg-surface)", border: "1px solid var(--border-default)", fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Part / Requirement:</span>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{partTitle}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Category:</span>
                  <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{enquiry.productType}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Quantity:</span>
                  <span style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--text-primary)" }}>{enquiry.quantity}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Current Status:</span>
                  <span style={{ fontWeight: 600, color: "#2563eb" }}>{isDraft ? "Draft" : enquiry.status}</span>
                </div>
              </div>

              {deleteError && (
                <p style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertCircle size={14} />
                  {deleteError}
                </p>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, paddingTop: 12, borderTop: "1px solid var(--border-default)" }}>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "1px solid var(--border-default)", background: "var(--bg-surface)", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDeleteEnquiry()}
                style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: "#ef4444", color: "#ffffff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{deleting ? "Deleting..." : "Yes, Delete Enquiry"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Action Header ─────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200/90 dark:border-white/10">
        <div>
          <div className="flex items-center flex-wrap gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white m-0">
              {partTitle}
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 font-semibold">
              {enqRef}
            </span>
            <StatusBadge status={isDraft ? "Draft" : enquiry.status} />
          </div>

          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 mb-0">
            Submitted on {formatDate(enquiry.createdAtUtc)} · Category:{" "}
            <strong className="text-neutral-800 dark:text-neutral-200">{enquiry.productType}</strong>
            {enquiry.partNumber ? ` · Part No: ${enquiry.partNumber}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => navigate("/customer/enquiries")}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all shadow-xs cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>Back to List</span>
          </button>

          {isDraft && (
            <>
              <Link
                to={`/customer/enquiries/${id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all no-underline shadow-xs"
              >
                <FileEdit size={14} />
                <span>Edit Draft</span>
              </Link>
              <button
                type="button"
                disabled={submitting}
                onClick={submitDraft}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Submit Enquiry</span>
              </button>
            </>
          )}

          {/* Delete action before acknowledged by foundry */}
          {(isDraft || enquiry.status === "Draft" || enquiry.status === "Submitted") && (
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all cursor-pointer shadow-xs"
              title="Delete enquiry before foundry acknowledgment"
            >
              <Trash2 size={14} />
              <span>Delete Enquiry</span>
            </button>
          )}

          {quotation && ["Quoted", "Accepted", "Declined"].includes(normStatus) && (
            <Link
              to={`/customer/quotations/${quotation.id}`}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all no-underline"
            >
              <FileText size={14} />
              <span>View Commercial Quotation</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Policy Notice Banner when Awaiting Foundry Progress or Locked ── */}
      {isDraft || enquiry.status === "Draft" || enquiry.status === "Submitted" ? (
        <div className="p-4 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent flex items-start gap-3">
          <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
            <strong className="text-blue-800 dark:text-blue-300 block mb-0.5">Foundry Acknowledgment Pending (Deletable)</strong>
            This enquiry is awaiting initial review by our foundry engineering team. You can delete or edit this enquiry anytime <strong>before the Admin or Foundry Engineering team changes the enquiry progress</strong> (to Received, Under Review, etc.).
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.02] flex items-start gap-3">
          <Lock size={18} className="text-neutral-500 dark:text-neutral-400 shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <strong className="text-neutral-900 dark:text-white block mb-0.5">Enquiry Progress Updated (Locked)</strong>
            Our engineering team has progressed this enquiry to <strong>{normStatus}</strong>. The technical specifications and drawings are locked and this enquiry can no longer be deleted to maintain audit traceability.
          </div>
        </div>
      )}

      {/* ── Main Layout Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* ══ LEFT SIDEBAR (4 Cols) ══ */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Status Progress Stepper */}
          <SectionCard title="Enquiry Progress" icon={Clock}>
            <div className="flex flex-col gap-4">
              {STEPPER_STAGES.map((step, idx) => {
                const isPassed = currentStageIndex > idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={step.key} className="flex items-start gap-3 relative">
                    {/* Vertical Connector Line */}
                    {idx < STEPPER_STAGES.length - 1 && (
                      <div
                        className={`absolute left-[13px] top-[26px] bottom-[-16px] w-[2px] ${
                          isPassed
                            ? "bg-[var(--color-primary)]"
                            : "bg-[var(--border-default)]"
                        }`}
                      />
                    )}

                    {/* Step Node Icon */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                        isPassed
                          ? "bg-[var(--color-primary)] text-white shadow-sm"
                          : isCurrent
                          ? "bg-[var(--color-primary)] text-white ring-4 ring-[var(--color-primary)]/20 shadow-md animate-pulse"
                          : "bg-[var(--bg-surface)] border-2 border-[var(--border-default)] text-[var(--text-muted)]"
                      }`}
                    >
                      {isPassed ? (
                        <Check size={14} className="stroke-[3]" />
                      ) : (
                        <span className="text-[11px] font-bold">{idx + 1}</span>
                      )}
                    </div>

                    {/* Step Text Info */}
                    <div className="flex flex-col min-w-0 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            isCurrent
                              ? "text-[var(--color-primary)]"
                              : isPassed
                              ? "text-[var(--text-primary)]"
                              : "text-[var(--text-muted)]"
                          }`}
                        >
                          {step.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-tight">
                        {step.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Deletion Policy Stepper Footnote */}
            <div className="mt-4 p-3 rounded-xl bg-[var(--bg-surface)]/70 border border-[var(--border-default)] flex items-start gap-2 text-[11px] text-[var(--text-muted)] leading-normal">
              <Info size={13} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
              <span>
                <strong>Deletion Policy:</strong> Enquiries can only be deleted during <em>Draft</em> and <em>Submitted</em> stages. Once the Admin/Foundry team updates progress to <em>Received</em> or beyond, deletion is disabled.
              </span>
            </div>

            {timeline && timeline.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[var(--border-default)]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] mb-2.5 block">
                  Status History Logs
                </span>
                <div className="flex flex-col gap-2">
                  {timeline.map((entry, tIdx) => (
                    <div
                      key={tIdx}
                      className="p-2 rounded-lg bg-[var(--bg-surface)]/60 border border-[var(--border-default)] text-[11px]"
                    >
                      <div className="flex items-center justify-between font-semibold text-[var(--text-primary)]">
                        <span>
                          {entry.fromStatus} → {entry.toStatus}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {formatDate(entry.occurredAtUtc)}
                        </span>
                      </div>
                      {entry.note && (
                        <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                          {entry.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Quick Summary Card */}
          <SectionCard title="Quick Summary" icon={Layers}>
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--border-default)]">
                <span className="text-[var(--text-muted)]">Enterprise Entity</span>
                <span className="font-semibold text-[var(--text-primary)] truncate max-w-[150px] text-right" title={company?.legalBusinessName || company?.name || enquiry.companyName}>
                  {company?.legalBusinessName || company?.name || enquiry.companyName || "Enterprise"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--border-default)]">
                <span className="text-[var(--text-muted)]">Delivery Hub</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[150px] text-right" title={enquiry.deliveryLocation || company?.city || "Registered Facility"}>
                  {enquiry.deliveryLocation || company?.city || "Registered Facility"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--border-default)]">
                <span className="text-[var(--text-muted)]">Product Type</span>
                <span className="font-semibold text-[var(--text-primary)]">{enquiry.productType}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--border-default)]">
                <span className="text-[var(--text-muted)]">Material Grade</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {enquiry.materialGrade || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--border-default)]">
                <span className="text-[var(--text-muted)]">Order Volume</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {enquiry.productionQuantity || enquiry.quantity} pcs
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-[var(--border-default)]">
                <span className="text-[var(--text-muted)]">Target Delivery</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {enquiry.expectedDeliveryDate ? formatDate(enquiry.expectedDeliveryDate) : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-muted)]">Attachments</span>
                <span className="font-semibold text-[var(--color-primary)]">
                  {enquiry.files.length} {enquiry.files.length === 1 ? "file" : "files"}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Technical Support & Foundry Contact */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <Headphones size={16} />
              </span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] m-0">
                Foundry Assistance
              </h4>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mb-4 leading-relaxed">
              Have customized alloy requirements or strict tolerance standards? Reach out directly to our
              foundry engineers.
            </p>
            <div className="flex flex-col gap-2 text-xs">
              <a
                href="mailto:iamrahulbhola@gmail.com"
                className="flex items-center gap-2.5 text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors no-underline"
              >
                <Mail size={13} className="text-[var(--text-muted)]" />
                iamrahulbhola@gmail.com
              </a>
              <a
                href="tel:+918283041140"
                className="flex items-center gap-2.5 text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors no-underline"
              >
                <Phone size={13} className="text-[var(--text-muted)]" />
                +91 8283041140
              </a>
            </div>
          </div>
        </div>

        {/* ══ MAIN CONTENT COLUMN (8 Cols) ══ */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* ── AUTO-FETCHED ENTERPRISE REQUESTER & PROFILE CARD ───────── */}
          <div className="rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] m-0 flex items-center gap-2 flex-wrap">
                    <span>{company?.legalBusinessName || company?.name || enquiry.companyName || profile?.company?.name || "Enterprise Requester"}</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Check size={10} /> Auto-Fetched Profile Details
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] m-0 mt-0.5">
                    GSTIN: <span className="font-mono font-semibold text-[var(--text-secondary)]">{company?.gstNumber || profile?.company?.gstNumber || "Not specified"}</span> • {company?.city ? `${company.city}, ${company.state || "India"}` : (enquiry.deliveryLocation || "Registered Customer")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5 font-medium"><User size={13} className="text-[var(--color-primary)]" /> {profile?.fullName || enquiry.fullName || "Representative"}</span>
                <span className="flex items-center gap-1.5 font-medium"><Phone size={13} className="text-[var(--color-primary)]" /> {profile?.phoneNumber || company?.companyPhone || "—"}</span>
              </div>
            </div>

            {/* Grid of Auto-Fetched Entity Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3.5 pb-3">
              <div className="p-2.5 rounded-xl bg-[var(--bg-surface)]/80 border border-[var(--border-default)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-0.5">Operating Industry</span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">{enquiry.industry || company?.industry || "General Engineering"}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-surface)]/80 border border-[var(--border-default)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-0.5">Primary Delivery Hub</span>
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate block" title={enquiry.deliveryLocation || company?.registeredAddress || company?.city || ""}>{enquiry.deliveryLocation || company?.city || "Registered Facility"}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-surface)]/80 border border-[var(--border-default)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-0.5">Standard Delivery Terms</span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">{enquiry.preferredDeliveryTerms || "Ex Works"}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-surface)]/80 border border-[var(--border-default)]">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-0.5">Official Email</span>
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate block" title={profile?.email || company?.companyEmail || ""}>{profile?.email || company?.companyEmail || "—"}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-default)]/60 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500 shrink-0" />
                Enterprise entity credentials, delivery hub location, and corporate contact details were automatically verified from your account profile.
              </span>
              <Link to="/customer/profile" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-xs shrink-0 flex items-center gap-1">
                <span>Manage Profile & Addresses</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
          {/* ── FEATURED IMAGE PREVIEW HERO (When Image Attachment Exists) ── */}
          {primaryImage && (
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-surface)]/60">
                <div className="flex items-center gap-2">
                  <FileImage size={16} className="text-[var(--color-primary)]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] m-0">
                    Component Visual Blueprint & Schematic
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewImageFile({ id: primaryImage.id, name: primaryImage.fileName })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all"
                >
                  <ZoomIn size={13} />
                  Full Size Preview
                </button>
              </div>

              <div
                className="relative w-full h-[260px] md:h-[320px] bg-[var(--bg-surface)]/40 flex items-center justify-center p-4 cursor-pointer group"
                onClick={() => setPreviewImageFile({ id: primaryImage.id, name: primaryImage.fileName })}
              >
                <AuthEnquiryImage
                  enquiryId={id}
                  fileId={primaryImage.id}
                  alt={primaryImage.fileName}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-md group-hover:scale-[1.01] transition-transform duration-200"
                />
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-white flex items-center gap-1.5">
                  <Maximize2 size={11} />
                  Click to Zoom · {primaryImage.fileName}
                </div>
              </div>
            </div>
          )}

          {/* ── HERO ATTACHMENTS CARD ─────────────────────────────────── */}
          <SectionCard
            title="Technical Drawings & CAD Models"
            icon={Paperclip}
            badge={
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold">
                {enquiry.files.length} {enquiry.files.length === 1 ? "file" : "files"}
              </span>
            }
            action={
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-all shadow-sm"
              >
                {uploading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <UploadCloud size={13} />
                )}
                Upload Drawing
              </button>
            }
          >
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.dwg,.dxf,.step,.stp,.iges,.igs,.jpg,.jpeg,.png,.zip"
            />

            {uploadError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={14} />
                {uploadError}
              </div>
            )}

            {/* Attachments List */}
            {enquiry.files.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--border-default)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--color-primary)] hover:bg-[var(--bg-surface)] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-3">
                  <UploadCloud size={24} />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1">
                  No technical drawings attached yet
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] max-w-sm mx-auto mb-3">
                  Upload 2D engineering blueprints (PDF, DWG, DXF) or 3D CAD files (STEP, IGES) for precise
                  cost estimation.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)]">
                  Browse Files (Max 10MB each)
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {enquiry.files.map((file) => {
                  const isImg = isImageFile(file.fileName);
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isImg ? (
                          <div
                            className="w-12 h-12 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] overflow-hidden shrink-0 cursor-pointer"
                            onClick={() => setPreviewImageFile({ id: file.id, name: file.fileName })}
                          >
                            <AuthEnquiryImage
                              enquiryId={id}
                              fileId={file.id}
                              alt={file.fileName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
                            {getFileIcon(file.fileName)}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span
                            onClick={() => isImg && setPreviewImageFile({ id: file.id, name: file.fileName })}
                            className={`text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--color-primary)] transition-colors ${
                              isImg ? "cursor-pointer" : ""
                            }`}
                          >
                            {file.fileName}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {formatBytes(file.sizeBytes)} · Uploaded {formatDate(file.uploadedAtUtc)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isImg && (
                          <button
                            type="button"
                            onClick={() => setPreviewImageFile({ id: file.id, name: file.fileName })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                            title="Preview Image"
                          >
                            <ZoomIn size={13} />
                            Preview
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => downloadFile(file.id, file.fileName)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                          title="Download file"
                        >
                          <Download size={13} />
                          Download
                        </button>

                        {isDraft && (
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file.id, file.fileName)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete file"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Quick Add Another File bar */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 p-2.5 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)]/30 hover:bg-[var(--bg-surface)] text-center cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--color-primary)]"
                >
                  <UploadCloud size={14} />
                  Add more drawings or specifications
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── MATERIAL & FOUNDRY SPECIFICATIONS ─────────────────────── */}
          <SectionCard title="Material & Foundry Specifications" icon={Wrench}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <SpecField
                label="Material Grade"
                value={enquiry.materialGrade}
                icon={Layers}
              />
              <SpecField
                label="Metallurgy Standard"
                value={enquiry.materialStandard}
                icon={FileText}
              />
              <SpecField
                label="Approx. Unit Weight"
                value={enquiry.approxWeight != null ? `${enquiry.approxWeight} kg` : null}
                icon={Scale}
              />
              <SpecField
                label="Machining Required"
                value={enquiry.machiningRequired}
                icon={Wrench}
              />
              <SpecField
                label="Pattern Tooling"
                value={enquiry.patternAvailability}
                icon={Package}
              />
              <SpecField
                label="Operating Industry"
                value={enquiry.industry}
                icon={Layers}
                badge={
                  enquiry.industry ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Check size={8} /> Auto-Fetched
                    </span>
                  ) : null
                }
              />
            </div>
          </SectionCard>

          {/* ── PRODUCTION VOLUMES & LOGISTICS ────────────────────────── */}
          <SectionCard title="Production Quantities & Logistics" icon={Package}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <SpecField
                label="Production Order Qty"
                value={`${enquiry.productionQuantity || enquiry.quantity} pcs`}
                icon={Package}
              />
              <SpecField
                label="Prototype Sample Qty"
                value={enquiry.prototypeQuantity ? `${enquiry.prototypeQuantity} pcs` : "0 pcs"}
                icon={Layers}
              />
              <SpecField
                label="Annual Estimated Run"
                value={enquiry.annualRequirement ? `${enquiry.annualRequirement} pcs/year` : null}
                icon={Calendar}
              />
              <SpecField
                label="Target Dispatch Date"
                value={enquiry.expectedDeliveryDate ? formatDate(enquiry.expectedDeliveryDate) : null}
                icon={Calendar}
              />
              <SpecField
                label="Delivery Terms"
                value={enquiry.preferredDeliveryTerms}
                icon={MapPin}
                badge={
                  enquiry.preferredDeliveryTerms ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Check size={8} /> Auto-Fetched
                    </span>
                  ) : null
                }
              />
              <SpecField
                label="Destination Location"
                value={enquiry.deliveryLocation}
                icon={MapPin}
                badge={
                  enquiry.deliveryLocation ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Check size={8} /> Auto-Fetched
                    </span>
                  ) : null
                }
              />
            </div>
          </SectionCard>

          {/* ── TECHNICAL REQUIREMENTS & DESCRIPTION ──────────────────── */}
          <SectionCard title="Technical Scope & Requirement Details" icon={FileText}>
            <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]/60">
              <p className="text-xs text-[var(--text-primary)] leading-relaxed m-0 whitespace-pre-wrap">
                {enquiry.requirementDetails || "No detailed technical notes specified."}
              </p>
            </div>

            {enquiry.application && (
              <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1 block">
                  Application & Environment
                </span>
                <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">
                  {enquiry.application}
                </p>
              </div>
            )}
          </SectionCard>

          {/* ── QUALITY & COMPLIANCE CHIPS ────────────────────────────── */}
          {additionalReqs.length > 0 && (
            <SectionCard title="Quality & Inspection Standards" icon={CheckCircle2}>
              <div className="flex flex-wrap gap-2.5">
                {additionalReqs.map((req) => (
                  <RequirementChip key={req} label={req} />
                ))}
              </div>
            </SectionCard>
          )}

          {/* ── REMARKS & NOTES ───────────────────────────────────────── */}
          {enquiry.remarks && (
            <SectionCard title="Special Remarks & Notes" icon={Info}>
              <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]/60">
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed m-0 whitespace-pre-wrap">
                  {enquiry.remarks}
                </p>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
