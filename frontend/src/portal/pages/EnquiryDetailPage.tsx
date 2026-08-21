import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  customerApi,
  type EnquiryDetail,
  type EnquiryTimelineEntry,
  type QuotationListItem,
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
} from "lucide-react";
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

function statusTone(status: string): string {
  switch (status) {
    case "Accepted":
    case "Approved":
      return "green";
    case "Rejected":
    case "Cancelled":
    case "Declined":
      return "red";
    case "Under Review":
    case "UnderReview":
      return "orange";
    case "Quoted":
      return "purple";
    case "Draft":
    case "Submitted":
    case "Received":
      return "blue";
    default:
      return "gray";
  }
}

function StatusBadge({ status }: { status: string }) {
  const norm = status === "UnderReview" ? "Under Review" : status;
  return <span className={`inv-badge inv-badge--${statusTone(norm)}`}>{norm}</span>;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
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
}: {
  label: string;
  value?: string | number | null;
  icon?: any;
}) {
  return (
    <div className="flex flex-col p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]/50">
      <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1">
        {Icon && <Icon size={12} className="text-[var(--text-muted)]" />}
        {label}
      </span>
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
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const enq = await customerApi.enquiry(id);
      setEnquiry(enq);
    } catch {
      setMissing(true);
    }

    try {
      const t = await customerApi.enquiryTimeline(id);
      setTimeline(t);
    } catch {}

    try {
      const quotes = await customerApi.quotations();
      const match = quotes.find((q) => q.enquiryId === id);
      if (match) setQuotation(match);
    } catch {}
  };

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

  const enqRef = `ENQ-${enquiry.id.slice(0, 8).toUpperCase()}`;
  const partTitle = enquiry.partName || enquiry.productType;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Breadcrumb & Top Action Header ─────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1.5">
            <Link
              to="/customer/dashboard"
              className="hover:text-[var(--color-primary)] transition-colors no-underline text-[var(--text-muted)]"
            >
              Dashboard
            </Link>
            <span>/</span>
            <Link
              to="/customer/enquiries"
              className="hover:text-[var(--color-primary)] transition-colors no-underline text-[var(--text-muted)]"
            >
              My Enquiries
            </Link>
            <span>/</span>
            <span className="font-mono font-semibold text-[var(--text-secondary)]">{enqRef}</span>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] m-0">
              {partTitle}
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] font-semibold">
              {enqRef}
            </span>
            <StatusBadge status={isDraft ? "Draft" : enquiry.status} />
          </div>

          <p className="text-xs text-[var(--text-secondary)] mt-1.5 mb-0">
            Submitted on {formatDate(enquiry.createdAtUtc)} · Category:{" "}
            <strong>{enquiry.productType}</strong>
            {enquiry.partNumber ? ` · Part No: ${enquiry.partNumber}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/customer/enquiries")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200"
          >
            <ChevronLeft size={14} />
            Back to List
          </button>

          {isDraft && (
            <>
              <Link
                to={`/customer/enquiries/${id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200 no-underline"
              >
                <FileEdit size={14} />
                Edit Draft
              </Link>
              <button
                type="button"
                disabled={submitting}
                onClick={submitDraft}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm hover:shadow-md transition-all duration-200"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit Enquiry
              </button>
            </>
          )}

          {quotation && ["Quoted", "Accepted", "Declined"].includes(normStatus) && (
            <Link
              to={`/customer/quotations/${quotation.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm hover:shadow-md transition-all duration-200 no-underline"
            >
              <FileText size={14} />
              View Commercial Quotation
            </Link>
          )}
        </div>
      </div>

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
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-all duration-150 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
                          {getFileIcon(file.fileName)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                            {file.fileName}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {formatBytes(file.sizeBytes)} · Uploaded {formatDate(file.uploadedAtUtc)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
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
              />
              <SpecField
                label="Destination Location"
                value={enquiry.deliveryLocation}
                icon={MapPin}
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
