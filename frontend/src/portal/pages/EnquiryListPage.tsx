import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { customerApi, type Paged, type EnquiryListItem } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { formatDate } from "../shared";
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
} from "lucide-react";
import { tokenStorage } from "../../auth/tokenStorage";
import { config } from "../../config";
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

function EnquiryBadge({ status }: { status: string }) {
  return <span className={`inv-badge inv-badge--${statusTone(status)}`}>{status}</span>;
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
  hasFiles,
}: {
  enquiryId: string;
  fileId?: string | null;
  hasFiles: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    const token = tokenStorage.getAccessToken();

    fetch(`${config.apiBaseUrl}/api/v1/customer/enquiries/${enquiryId}/files/${fileId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.blob();
      })
      .then((blob) => {
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [enquiryId, fileId]);

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="w-10 h-10 rounded-lg border border-[var(--border-default)] object-cover shrink-0 shadow-sm bg-[var(--bg-card)]"
      />
    );
  }

  if (hasFiles) {
    return (
      <span className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] shrink-0">
        <FileText size={16} />
      </span>
    );
  }

  return (
    <span className="w-10 h-10 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
      <Package size={16} className="opacity-40" />
    </span>
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
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
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

  async function cancelDraft(id: string) {
    if (!confirm("Cancel and delete this draft enquiry? This action cannot be undone.")) return;
    try {
      await customerApi.deleteEnquiry(id);
      load();
    } catch {
      alert("Could not cancel the draft.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Procurement & RFQs
          </div>
          <h1 className="text-[24px] font-bold tracking-tight text-[var(--text-primary)] m-0">
            My Enquiries
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 mb-0">
            Track casting requirement feasibility, engineering reviews, and commercial quotation status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {data && data.items.length > 0 && (
            <button
              type="button"
              onClick={() => exportToCsv(data.items)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200"
            >
              <Download size={14} />
              Export CSV
            </button>
          )}

          <button
            type="button"
            onClick={load}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200"
            aria-label="Refresh list"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <Link
            to="/customer/enquiries/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm hover:shadow-md transition-all duration-200 no-underline"
          >
            <Plus size={15} />
            New Enquiry
          </Link>
        </div>
      </div>

      {/* ── Summary KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Total Enquiries</span>
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <FileText size={16} />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)] mt-2">
            {metrics.total}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Submitted RFQ records</div>
        </div>

        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Under Review</span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock size={16} />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)] mt-2">
            {metrics.underReview}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">In foundry engineering check</div>
        </div>

        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Quotes Issued</span>
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Layers size={16} />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)] mt-2">
            {metrics.quoted}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Commercial proposal ready</div>
        </div>

        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Approved / Active</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-primary)] mt-2">
            {metrics.approved}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Accepted & converted</div>
        </div>
      </div>

      {/* ── Filter & Search Bar ────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by part, grade or ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-thin">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                statusFilter === s
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table / Content ────────────────────────────────────────── */}
      {error && <EmptyState title="Enquiries unavailable" text={error} />}

      {!data && !error && (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loading label="Loading your enquiries" />
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
            <FileText size={28} />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
            {search || statusFilter !== "All" ? "No matching enquiries found" : "No enquiries yet"}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mb-5">
            {search || statusFilter !== "All"
              ? "Try adjusting your search terms or status filters."
              : "Submit your casting drawings, quantity, and grade specifications to receive an itemized manufacturing quotation."}
          </p>
          <Link
            to="/customer/enquiries/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] no-underline transition-all"
          >
            <Plus size={14} />
            Submit Your First RFQ
          </Link>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
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
              <tbody className="divide-y divide-[var(--border-default)]">
                {data.items.map((r) => {
                  const partDisplay = r.partName || r.productType;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/customer/enquiries/${r.id}`)}
                      className="hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors duration-150 group"
                    >
                      {/* Image Thumbnail Column */}
                      <td className="py-3 px-4 w-14 text-center">
                        <div className="flex items-center justify-center">
                          <ListEnquiryImage
                            enquiryId={r.id}
                            fileId={r.firstFileId}
                            hasFiles={r.fileCount > 0}
                          />
                        </div>
                      </td>

                      {/* Part Name & Reference */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                            {partDisplay}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] font-mono">
                            {enquiryNo(r.id)} {r.partNumber ? `· Part: ${r.partNumber}` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Product Type */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-[var(--text-secondary)] font-medium">
                          {r.productType}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          {r.quantity}
                        </span>
                      </td>

                      {/* Attachments */}
                      <td className="py-3 px-4">
                        {r.fileCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] font-semibold">
                            <Paperclip size={12} />
                            {r.fileCount} {r.fileCount === 1 ? "file" : "files"}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)]">—</span>
                        )}
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-4">
                        <span className="text-xs text-[var(--text-secondary)]">
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
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                            title="View Technical Details"
                          >
                            <Eye size={15} />
                          </Link>

                          {r.isDraft && r.status === "Draft" && (
                            <>
                              <Link
                                to={`/customer/enquiries/${r.id}/edit`}
                                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                                title="Edit Draft"
                              >
                                <FileEdit size={15} />
                              </Link>
                              <button
                                type="button"
                                onClick={() => void cancelDraft(r.id)}
                                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--bg-surface)] transition-colors"
                                title="Delete Draft"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
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
          <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)]/40">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 text-xs rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-primary)]"
              >
                {PAGE_SIZES.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
              <span className="text-xs text-[var(--text-muted)]">
                per page · Showing {data.items.length} of {data.totalCount} enquiries
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>

              <span className="text-xs font-semibold text-[var(--text-primary)] px-2">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
