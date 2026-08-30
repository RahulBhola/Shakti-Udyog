import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { customerApi, type Paged, type EnquiryListItem, type Profile } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate } from "../shared";
import { calculateProfileCompleteness } from "../components/ProfileCompletion";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Eye,
  FileText,
  Clock,
  Plus,
  Trash2,
  FileEdit,
  Layers,
  Paperclip,
  CheckCircle2,
  Package,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
  Lock,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { tokenStorage } from "../../auth/tokenStorage";
import { config } from "../../config";
import { cn } from "../../lib/utils";
import "./erpListView.css";

const STATUS_FILTERS = [
  "All",
  "Draft",
  "Submitted",
  "Received",
  "Under Review",
  "Approved",
  "Quoted",
  "Accepted",
  "Rejected",
  "Cancelled",
];

const PAGE_SIZES = [10, 20, 50];

/* ── Helpers ──────────────────────────────────────────────────────── */

function enquiryNo(id: string): string {
  return `ENQ-${id.slice(0, 8).toUpperCase()}`;
}

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

function EnquiryBadge({ status }: { status: string }) {
  const normKey = status.toLowerCase().replace(/\s+/g, "_");
  const c = statusConfig[normKey] ?? {
    bg: "bg-neutral-500/10 border-neutral-500/20",
    text: "text-neutral-600 dark:text-neutral-400",
    dot: "bg-neutral-400",
  };
  const display = status.replace(/_/g, " ");
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border", c.bg, c.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />
      <span>{display}</span>
    </span>
  );
}

/* ── CSV Export ───────────────────────────────────────────────────── */

function exportToCsv(items: EnquiryListItem[]) {
  const headers = [
    "Enquiry No.",
    "Part Name",
    "Part Number",
    "Product Type",
    "Quantity",
    "Status",
    "Files",
    "Submitted Date",
  ];
  const rows = items.map((r) => [
    enquiryNo(r.id),
    r.partName ?? r.productType,
    r.partNumber ?? "—",
    r.productType,
    r.quantity,
    r.isDraft ? "Draft" : r.status,
    String(r.fileCount),
    formatDate(r.createdAtUtc),
  ]);
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((row) => row.map(esc).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `my-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── Thumbnail image (auth-fetched) ────────────────────────────────── */
function ListEnquiryImage({
  enquiryId,
  fileId,
  fileContentType,
  hasFiles,
  onImageClick,
}: {
  enquiryId: string;
  fileId?: string | null;
  fileContentType?: string | null;
  hasFiles: boolean;
  onImageClick?: (url: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFiles && !fileId) return;

    let cancelled = false;
    let objectUrl: string | null = null;
    const token = tokenStorage.getAccessToken();

    async function resolveAndFetchImage() {
      try {
        let targetFileId = fileId;

        // If fileId is not an image or missing, fetch enquiry details to find attached drawing image
        if ((!targetFileId || !fileContentType?.startsWith("image/")) && hasFiles) {
          const detail = await customerApi.enquiry(enquiryId);
          const img = detail.files?.find(
            (f) =>
              f.contentType?.startsWith("image/") ||
              /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f.fileName),
          );
          if (img) {
            targetFileId = img.id;
          }
        }

        if (!targetFileId) return;

        const res = await fetch(
          `${config.apiBaseUrl}/api/v1/customer/enquiries/${enquiryId}/files/${targetFileId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: "include",
          },
        );

        if (!res.ok) throw new Error("Failed to load thumbnail");
        const blob = await res.blob();
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      } catch {}
    }

    void resolveAndFetchImage();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [enquiryId, fileId, fileContentType, hasFiles]);

  if (url) {
    return (
      <div
        className="inv-drawing-thumb"
        title="Click to view full drawing"
        onClick={(e) => {
          if (onImageClick) {
            e.stopPropagation();
            onImageClick(url);
          }
        }}
      >
        <img src={url} alt="CAD Drawing Blueprint" />
      </div>
    );
  }

  if (hasFiles) {
    return (
      <div className="inv-drawing-thumb inv-drawing-thumb--empty" title="CAD Document Attached">
        <FileText size={16} className="text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="inv-drawing-thumb inv-drawing-thumb--empty" title="No Drawings">
      <Package size={16} className="opacity-40" />
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────── */

export default function EnquiryListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Paged<EnquiryListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  // ── Profile Gate Status ──────────────────────────────────────────
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function checkProfile() {
      try {
        const [p, addrs] = await Promise.allSettled([
          customerApi.profile(),
          customerApi.addresses(),
        ]);
        if (!mounted) return;
        if (p.status === "fulfilled" && p.value) {
          const prof = p.value;
          if (addrs.status === "fulfilled" && Array.isArray(addrs.value)) {
            (prof as unknown as Record<string, unknown>).addresses = addrs.value;
          }
          setProfile(prof);
        }
      } catch (err) {
        console.error("Failed to fetch customer profile in enquiry list", err);
      } finally {
        if (mounted) setProfileLoading(false);
      }
    }
    void checkProfile();
    return () => { mounted = false; };
  }, []);

  const completeness = useMemo(() => calculateProfileCompleteness(profile), [profile]);
  const isProfileComplete = completeness.percentage === 100;

  const load = useCallback(() => {
    setRefreshing(true);
    setError(null);
    customerApi
      .enquiries(
        page,
        pageSize,
        search || undefined,
        statusFilter === "All" ? undefined : statusFilter,
      )
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setRefreshing(false));
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const items = data?.items ?? [];
    return {
      total: data?.totalCount ?? 0,
      underReview: items.filter((i) => i.status === "UnderReview" || i.status === "Under Review").length,
      quoted: items.filter((i) => i.status === "Quoted").length,
      approved: items.filter((i) => i.status === "Approved" || i.status === "Accepted").length,
    };
  }, [data]);

  const [deleteModalEnquiry, setDeleteModalEnquiry] = useState<EnquiryListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteEnquiry() {
    if (!deleteModalEnquiry) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await customerApi.deleteEnquiry(deleteModalEnquiry.id);
      setDeleteModalEnquiry(null);
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete enquiry. It may have already been acknowledged by the foundry.";
      setDeleteError(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Delete Enquiry Confirmation Modal Popup ────────────────── */}
      {deleteModalEnquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => !deleting && setDeleteModalEnquiry(null)}
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
                    {enquiryNo(deleteModalEnquiry.id)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModalEnquiry(null)}
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
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{deleteModalEnquiry.partName || deleteModalEnquiry.productType}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Category:</span>
                  <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{deleteModalEnquiry.productType}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Quantity:</span>
                  <span style={{ fontWeight: 700, fontFamily: "monospace", color: "var(--text-primary)" }}>{deleteModalEnquiry.quantity}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Current Status:</span>
                  <span style={{ fontWeight: 600, color: "#2563eb" }}>{deleteModalEnquiry.isDraft ? "Draft" : deleteModalEnquiry.status}</span>
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
                onClick={() => setDeleteModalEnquiry(null)}
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

      {/* ── Lightbox Drawing Modal ──────────────────────────────────── */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewModalUrl(null)}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0, 0, 0, 0.82)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            style={{ position: "relative", maxWidth: "85vw", maxHeight: "88vh", background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-default)", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", padding: 16, display: "flex", flexDirection: "column", alignItems: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid var(--border-default)" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                CAD Drawing & Blueprint Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ width: "100%", maxHeight: "72vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 12, marginTop: 8, background: "var(--bg-surface)", borderRadius: 12, overflow: "hidden" }}>
              <img
                src={previewModalUrl}
                alt="Full Drawing Preview"
                style={{ maxHeight: "68vh", maxWidth: "100%", objectFit: "contain", borderRadius: 8 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileText size={18} />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white m-0">
              My Enquiries
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 m-0">
            Track casting requirement feasibility, engineering reviews, and commercial quotation status.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          {data && data.items.length > 0 && (
            <button
              type="button"
              onClick={() => exportToCsv(data.items)}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 shadow-xs cursor-pointer transition-all"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={load}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 shadow-xs cursor-pointer transition-all"
            aria-label="Refresh list"
          >
            <RefreshCw size={13} className={cn(refreshing && "animate-spin text-blue-600")} />
            <span>Refresh</span>
          </button>

          <Link
            to="/customer/enquiries/new"
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 no-underline cursor-pointer transition-all"
          >
            {!profileLoading && !isProfileComplete ? <Lock size={13} className="text-amber-300" /> : <Plus size={15} />}
            <span>New Enquiry</span>
          </Link>
        </div>
      </div>

      {/* ── Profile Incomplete Alert Banner ──────────────────────── */}
      {!profileLoading && !isProfileComplete && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Profile Incomplete ({completeness.percentage}%)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {completeness.pendingItems.length} required detail{completeness.pendingItems.length > 1 ? "s" : ""} pending
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5 m-0">
                Please complete 100% of your customer profile to submit new casting & machining enquiries.
              </p>
            </div>
          </div>
          <Link
            to="/customer/profile"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs no-underline cursor-pointer shrink-0 transition-all self-start sm:self-center"
          >
            <span>Complete Profile</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* ── Summary KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Enquiries */}
        <div className="p-4 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <FileText size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">Total Enquiries</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {metrics.total}
            </div>
          </div>
        </div>

        {/* Under Review */}
        <div className="p-4 rounded-2xl border border-amber-500/20 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80">Under Review</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {metrics.underReview}
            </div>
          </div>
        </div>

        {/* Quotes Issued */}
        <div className="p-4 rounded-2xl border border-purple-500/20 dark:border-purple-500/30 bg-gradient-to-br from-purple-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <Layers size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600/80 dark:text-purple-400/80">Quotes Issued</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {metrics.quoted}
            </div>
          </div>
        </div>

        {/* Approved / Active */}
        <div className="p-4 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80">Approved / Active</div>
            <div className="text-xl font-extrabold text-neutral-900 dark:text-white leading-none mt-1">
              {metrics.approved}
            </div>
          </div>
        </div>
      </div>

      {/* ── Enquiry Deletion & Progress Policy Callout ────────────── */}
      <div className="p-4 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/[0.08] via-blue-500/[0.03] to-transparent flex items-start gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/25 mt-0.5">
          <Info size={16} />
        </div>
        <div className="flex-1 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <span className="font-bold text-neutral-900 dark:text-white block mb-0.5">
            Enquiry Cancellation & Deletion Policy
          </span>
          You can delete or edit your generated enquiry anytime while it is in{" "}
          <strong className="text-blue-600 dark:text-blue-400">Draft</strong> or{" "}
          <strong className="text-blue-600 dark:text-blue-400">Submitted</strong> status{" "}
          <strong>before the Admin or Foundry Engineering team changes the enquiry progress</strong> (e.g. Received, Under Review). Once review begins, the enquiry is locked to maintain engineering assessment records.
        </div>
      </div>

      {/* ── Filter & Search Bar ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border",
                statusFilter === s
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white dark:bg-[#121520] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5"
              )}
            >
              <span>{s}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by part, grade or ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-9 pl-9 pr-8 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-blue-500 shadow-xs"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Table / Content ────────────────────────────────────────── */}
      {error && <EmptyState title="Enquiries unavailable" text={error} />}

      {!data && !error && (
        <div className="py-12 flex justify-center">
          <Loading label="Fetching enquiries..." />
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
            <FileText size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {search || statusFilter !== "All" ? "No matching enquiries found" : "No enquiries generated yet"}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {search || statusFilter !== "All"
                ? "Try adjusting your search terms or status filters."
                : "Submit your casting drawings, quantity, and grade specifications to receive an itemized manufacturing quotation."}
            </p>
          </div>
          <Link
            to="/customer/enquiries/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 no-underline"
          >
            <Plus size={14} />
            <span>Submit Your First Enquiry</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-neutral-200/80 dark:border-white/10 bg-neutral-50/80 dark:bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <th className="py-3.5 px-4 w-14 text-center">Image</th>
                  <th className="py-3.5 px-4">Enquiry & Part</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Drawings / Files</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                {data.items.map((r) => {
                  const partDisplay = r.partName || r.productType;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/customer/enquiries/${r.id}`)}
                      className="hover:bg-neutral-50/60 dark:hover:bg-white/[0.02] cursor-pointer transition-colors duration-150 group"
                    >
                      {/* Image Thumbnail Column */}
                      <td className="py-3 px-4 w-14 text-center">
                        <div className="flex items-center justify-center">
                          <ListEnquiryImage
                            enquiryId={r.id}
                            fileId={r.firstFileId}
                            fileContentType={r.firstFileContentType}
                            hasFiles={r.fileCount > 0}
                            onImageClick={(u) => setPreviewModalUrl(u)}
                          />
                        </div>
                      </td>

                      {/* Part Name & Reference */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {partDisplay}
                          </span>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {enquiryNo(r.id)} {r.partNumber ? `· Part: ${r.partNumber}` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Product Type */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                          {r.productType}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white font-mono">
                          {r.quantity}
                        </span>
                      </td>

                      {/* Attachments */}
                      <td className="py-3 px-4">
                        {r.fileCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                            <Paperclip size={12} />
                            {r.fileCount} {r.fileCount === 1 ? "file" : "files"}
                          </span>
                        ) : (
                          <span className="text-[11px] text-neutral-400">—</span>
                        )}
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {formatDate(r.createdAtUtc)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <EnquiryBadge status={r.isDraft ? "Draft" : r.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/customer/enquiries/${r.id}`}
                            className="p-2 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 transition-all inline-flex items-center justify-center"
                            title="View Technical Details"
                          >
                            <Eye size={14} />
                          </Link>

                          {r.isDraft && r.status === "Draft" && (
                            <Link
                              to={`/customer/enquiries/${r.id}/edit`}
                              className="p-2 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 transition-all inline-flex items-center justify-center"
                              title="Edit Draft"
                            >
                              <FileEdit size={14} />
                            </Link>
                          )}

                          {/* Allow deletion before acknowledged by foundry (Draft or Submitted status) */}
                          {r.isDraft || r.status === "Draft" || r.status === "Submitted" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteModalEnquiry(r);
                              }}
                              className="p-2 rounded-xl border border-rose-200/80 dark:border-rose-500/20 bg-white dark:bg-[#121520] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all inline-flex items-center justify-center cursor-pointer"
                              title="Delete Enquiry (Allowed before Admin/Foundry changes progress)"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <span
                              className="p-2 rounded-xl border border-neutral-200/50 dark:border-white/5 bg-neutral-100/50 dark:bg-white/[0.02] text-neutral-400 dark:text-neutral-500 cursor-not-allowed inline-flex items-center justify-center"
                              title="Locked: Deletion is only allowed before Admin/Foundry changes enquiry progress"
                            >
                              <Lock size={14} className="opacity-60" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination Footer ────────────────────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3 px-6 py-4 border-t border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.01]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 text-xs font-bold rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-900 dark:text-white"
              >
                {PAGE_SIZES.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
              <span className="text-xs text-neutral-400">
                per page · Showing {data.items.length} of {data.totalCount} enquiries
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-600 dark:text-neutral-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>

              <span className="text-xs font-bold text-neutral-900 dark:text-white px-2">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-600 dark:text-neutral-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
