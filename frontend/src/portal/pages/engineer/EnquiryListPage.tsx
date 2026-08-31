import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { engineerApi, type EngineerEnquiryListItem } from "../../../api/engineerApi";
import type { Paged } from "../../../api/customerApi";
import { EmptyState, Loading } from "../../../components/ui";
import { tokenStorage } from "../../../auth/tokenStorage";
import { config } from "../../../config";
import { formatDate } from "../../shared";
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, X, Download,
  Eye, FileText, Clock, CheckCircle2, AlertCircle,
  XCircle, FileEdit, Package, Trash2, AlertTriangle,
} from "lucide-react";
import "../erpListView.css";

const PRIORITY_FILTERS = ["All", "Low", "Medium", "High", "Urgent"];
const PAGE_SIZES = [10, 20, 50];

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

function enquiryNo(id: string): string {
  return `Enquiry-${id.slice(0, 8).toUpperCase()}`;
}

function statusTone(status: string): string {
  switch (status) {
    case "Accepted":
    case "Approved": return "green";
    case "Rejected":
    case "Cancelled": return "red";
    case "Under Review": return "orange";
    case "Quoted": return "purple";
    case "Draft":
    case "Received": return "blue";
    case "Expired": return "gray";
    default: return "gray";
  }
}

function priorityTone(priority: string): string {
  switch (priority) {
    case "High":
    case "Urgent": return "red";
    case "Medium": return "orange";
    default: return "gray";
  }
}

function EnquiryBadge({ status }: { status: string }) {
  return <span className={`inv-badge inv-badge--${statusTone(status)}`}>{status}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  return <span className={`inv-badge inv-badge--${priorityTone(priority)}`}>{priority}</span>;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("") || "?";
}

/* CSV export */
function exportToCsv(items: EngineerEnquiryListItem[]) {
  const headers = ["Enquiry No.", "Customer", "Product", "Quantity", "Status", "Date", "Files"];
  const rows = items.map((r) => [
    enquiryNo(r.id),
    r.companyName ?? "Unknown",
    r.productType,
    r.quantity,
    r.status,
    formatDate(r.createdAtUtc),
    String(r.fileCount),
  ]);
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((row) => row.map(esc).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `enquiries-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* Thumbnail image (auth-fetched) */
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

        if ((!targetFileId || !fileContentType?.startsWith("image/")) && hasFiles) {
          const detail = await engineerApi.enquiry(enquiryId);
          const img = detail.files?.find(
            (f) =>
              f.contentType?.startsWith("image/") ||
              /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f.fileName),
          );
          if (img) targetFileId = img.id;
        }

        if (!targetFileId) return;

        const res = await fetch(
          `${config.apiBaseUrl}/api/v1/engineer/enquiries/${enquiryId}/files/${targetFileId}/download`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: "include",
          },
        );

        if (!res.ok) throw new Error();
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
        className="w-11 h-11 rounded-lg border border-neutral-200 dark:border-white/10 overflow-hidden bg-neutral-100 dark:bg-white/5 flex items-center justify-center cursor-pointer hover:border-orange-500 transition-all shadow-xs"
        title="Click to view full drawing"
        onClick={(e) => {
          if (onImageClick) {
            e.stopPropagation();
            onImageClick(url);
          }
        }}
      >
        <img src={url} alt="CAD Drawing Blueprint" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (hasFiles) {
    return (
      <div className="w-11 h-11 rounded-lg border border-neutral-200 dark:border-white/10 bg-blue-500/10 text-blue-500 flex items-center justify-center" title="CAD Document Attached">
        <FileText size={18} />
      </div>
    );
  }

  return (
    <div className="w-11 h-11 rounded-lg border border-dashed border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02] text-neutral-400 flex items-center justify-center" title="No Drawings Attached">
      <Package size={16} className="opacity-40" />
    </div>
  );
}

export default function EngineerEnquiryListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get("company") ?? "";

  const [data, setData] = useState<Paged<EngineerEnquiryListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<EngineerEnquiryListItem | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    engineerApi.enquiries(page, pageSize, search || undefined, statusFilter === "All" ? undefined : statusFilter, companyId || undefined)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [page, pageSize, search, statusFilter, companyId]);

  useEffect(load, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter, pageSize]);

  const handleDeleteSingle = async () => {
    if (!deletingItem) return;
    setActionLoading(true);
    try {
      await engineerApi.deleteEnquiry(deletingItem.id);
      setFeedbackNotice(`Enquiry ${enquiryNo(deletingItem.id)} deleted successfully.`);
      setTimeout(() => setFeedbackNotice(null), 3000);
      setDeletingItem(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deletingItem.id);
        return next;
      });
      load();
    } catch (e: any) {
      window.alert(e instanceof Error ? e.message : "Failed to delete enquiry.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      const ids = Array.from(selectedIds);
      await engineerApi.bulkDeleteEnquiries(ids);
      setFeedbackNotice(`Successfully deleted ${ids.length} enquiries.`);
      setTimeout(() => setFeedbackNotice(null), 3000);
      setShowBulkDeleteModal(false);
      setSelectedIds(new Set());
      load();
    } catch (e: any) {
      window.alert(e instanceof Error ? e.message : "Failed to delete selected enquiries.");
    } finally {
      setActionLoading(false);
    }
  };

  const totalCount = data?.totalCount ?? (data as any)?.total ?? 0;
  const totalPages = data ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;

  const filteredItems = (data?.items ?? []).filter((r) => priorityFilter === "All" || r.priority === priorityFilter);

  const allStatuses = data?.items.map((r) => r.status) ?? [];
  const totalEnquiries = totalCount;
  const newCount = allStatuses.filter((s) => s === "Received").length;
  const reviewCount = allStatuses.filter((s) => s === "Under Review").length;
  const quotedCount = allStatuses.filter((s) => s === "Quoted").length;
  const acceptedCount = allStatuses.filter((s) => s === "Accepted").length;
  const rejectedCount = allStatuses.filter((s) => s === "Rejected").length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (!data) return;
    setSelectedIds((prev) => (prev.size === filteredItems.length ? new Set() : new Set(filteredItems.map((r) => r.id))));
  };
  const allSelected = filteredItems.length > 0 && selectedIds.size === filteredItems.length;

  const clearFilters = () => { setSearchInput(""); setSearch(""); setStatusFilter("All"); setPriorityFilter("All"); setPage(1); };
  const hasFilters = !!search || statusFilter !== "All" || priorityFilter !== "All";

  const kpis = [
    { label: "Total Enquiries", value: totalEnquiries, hint: "All requests", icon: FileText, bgClass: "bg-blue-500/10", textClass: "text-blue-500", glow: "rgba(59,130,246,0.18)" },
    { label: "Received", value: newCount, hint: "New incoming", icon: Clock, bgClass: "bg-sky-500/10", textClass: "text-sky-500", glow: "rgba(14,165,233,0.18)" },
    { label: "Under Review", value: reviewCount, hint: "In engineering review", icon: AlertCircle, bgClass: "bg-amber-500/10", textClass: "text-amber-500", glow: "rgba(245,158,11,0.18)" },
    { label: "Quoted", value: quotedCount, hint: "Quotes issued", icon: FileEdit, bgClass: "bg-purple-500/10", textClass: "text-purple-500", glow: "rgba(168,85,247,0.18)" },
    { label: "Accepted", value: acceptedCount, hint: "Approved & won", icon: CheckCircle2, bgClass: "bg-emerald-500/10", textClass: "text-emerald-500", glow: "rgba(16,185,129,0.18)" },
    { label: "Rejected", value: rejectedCount, hint: "Declined requests", icon: XCircle, bgClass: "bg-rose-500/10", textClass: "text-rose-500", glow: "rgba(244,63,94,0.18)" },
  ];

  const openEnquiry = (r: EngineerEnquiryListItem) => navigate(`/admin/enquiries/${r.id}`);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Blueprint Preview Modal ────────────────────────── */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in" onClick={() => setPreviewModalUrl(null)}>
          <div className="relative w-full max-w-4xl bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/10">
              <span className="text-sm font-bold text-neutral-900 dark:text-white">
                CAD Drawing & Blueprint Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="w-full max-h-[72vh] flex items-center justify-center p-3 mt-3 bg-neutral-50 dark:bg-[#0a0c12] rounded-xl overflow-hidden">
              <img src={previewModalUrl} alt="Full Drawing Preview" className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-sm" />
            </div>
          </div>
        </div>
      )}

      {/* ── 1. Hero Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Customer Enquiries
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-xs">
              {totalEnquiries} RFQs
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Track customer RFQ requests, review technical specifications, and generate engineering quotes.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => { if (data) exportToCsv(data.items); }}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer"
            title="Export visible Enquiries to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-xs cursor-pointer"
            title="Refresh Enquiries"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* ── 2. Balanced 6-Card KPI Grid ────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="relative overflow-hidden p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,var(--glow),transparent)] before:pointer-events-none"
            style={{ "--glow": k.glow } as any}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.bgClass} ${k.textClass}`}>
              <k.icon size={17} />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white mt-2.5 leading-tight tracking-tight tabular-nums">
              {k.value.toLocaleString()}
            </div>
            <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{k.label}</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{k.hint}</div>
          </div>
        ))}
      </div>

      {/* ── 3. Toolbar & Segmented Quick Filters ───────────── */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Real-time search */}
          <div className="relative w-full lg:w-96">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput.trim()); }}
              placeholder="Search by Enquiry No, Company, Product..."
              className="w-full pl-10 pr-4 h-10 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500 shadow-xs"
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(""); setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Segmented Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { label: "All", status: "All", count: totalEnquiries },
              { label: "Received", status: "Received", count: newCount },
              { label: "Under Review", status: "Under Review", count: reviewCount },
              { label: "Quoted", status: "Quoted", count: quotedCount },
              { label: "Accepted", status: "Accepted", count: acceptedCount },
              { label: "Rejected", status: "Rejected", count: rejectedCount },
            ].map((tab) => {
              const isCurrent = statusFilter === tab.status;
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => { setStatusFilter(tab.status); setPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    isCurrent ? "bg-white/20 text-white" : "bg-neutral-200/70 dark:bg-white/10 text-neutral-500 dark:text-neutral-400"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority Filter & Company Indicator */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-white/5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Priority:</span>
            <div className="flex items-center gap-1">
              {PRIORITY_FILTERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    priorityFilter === p
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                      : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* ── 4. Interactive High-End Table ──────────────────── */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs overflow-hidden">
        {error ? (
          <div className="p-8 text-center"><EmptyState title="Enquiries unavailable" text={error} /></div>
        ) : !data ? (
          <div className="py-24 text-center"><Loading label="Loading Enquiries..." /></div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 text-center text-neutral-400 space-y-2">
            <Package size={44} className="mx-auto opacity-30" />
            <p className="text-sm font-medium text-neutral-500">No Enquiries match the current filters.</p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="text-xs text-[var(--color-primary)] hover:underline font-bold cursor-pointer">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ minWidth: 1050 }}>
              <thead>
                <tr className="bg-neutral-50/80 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10">
                  <th className="py-3.5 px-4 w-[40px] text-center">
                    <input type="checkbox" className="inv-check cursor-pointer" checked={allSelected} onChange={toggleSelectAll} aria-label="Select all" />
                  </th>
                  <th className="py-3.5 px-3 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-center w-[60px]">
                    Drawing
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Enquiry No.
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Customer & Product
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-right">
                    Quantity
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Priority
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((r) => {
                  const avatar = getAvatarStyle(r.companyName || r.id);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => openEnquiry(r)}
                      className="border-b border-neutral-200/60 dark:border-white/5 hover:bg-neutral-50/70 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="inv-check cursor-pointer"
                          checked={selectedIds.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          aria-label="Select Enquiry"
                        />
                      </td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <ListEnquiryImage
                          enquiryId={r.id}
                          fileId={r.firstFileId}
                          fileContentType={r.firstFileContentType}
                          hasFiles={r.fileCount > 0}
                          onImageClick={(url) => setPreviewModalUrl(url)}
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-neutral-900 dark:text-white group-hover:text-[var(--color-primary)] transition-colors">
                          {enquiryNo(r.id)}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">{formatDate(r.createdAtUtc)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border"
                            style={{ background: avatar.bg, color: avatar.fg, borderColor: avatar.border }}
                          >
                            {initials(r.companyName)}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900 dark:text-white text-xs">{r.companyName ?? "Unknown Company"}</div>
                            <div className="text-[11px] text-neutral-400">{r.productType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-black text-neutral-900 dark:text-white text-[13.5px]">
                        {r.quantity.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={r.priority} />
                      </td>
                      <td className="py-3.5 px-4">
                        <EnquiryBadge status={r.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEnquiry(r)}
                            className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/10 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all shadow-xs cursor-pointer"
                            title="View Enquiry Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingItem(r)}
                            className="w-8 h-8 rounded-lg border border-red-500/20 dark:border-red-500/20 bg-red-500/5 hover:bg-red-500/15 flex items-center justify-center text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-all shadow-xs cursor-pointer"
                            title="Delete Enquiry"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 5. Standard Pagination Footer ──────────────────── */}
        {data && totalCount > 0 && (
          <div className="px-5 py-3.5 border-t border-neutral-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500 bg-neutral-50/50 dark:bg-white/[0.01]">
            <div>
              Showing <span className="font-bold text-neutral-900 dark:text-white">{filteredItems.length}</span> of{" "}
              <span className="font-bold text-neutral-900 dark:text-white">{totalCount}</span> Enquiries
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] text-neutral-800 dark:text-white text-xs outline-none"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] disabled:opacity-30 hover:bg-neutral-50 dark:hover:bg-white/5 flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2.5 font-semibold text-neutral-800 dark:text-neutral-200">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] disabled:opacity-30 hover:bg-neutral-50 dark:hover:bg-white/5 flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating Bulk Action Bar ─────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 dark:bg-[#151926]/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl border border-white/15 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs font-black flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold text-neutral-200">
              {selectedIds.size === 1 ? "1 enquiry selected" : `${selectedIds.size} enquiries selected`}
            </span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete Selected</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Single Delete Confirm Modal ────────────────────── */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => setDeletingItem(null)}>
          <div className="w-full max-w-md bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-red-500/5">
              <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle size={17} />
                </div>
                <h3 className="font-extrabold text-sm m-0">Delete Enquiry</h3>
              </div>
              <button onClick={() => setDeletingItem(null)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
                Are you sure you want to permanently delete enquiry <strong className="text-neutral-900 dark:text-white font-mono">{enquiryNo(deletingItem.id)}</strong> from <strong className="text-neutral-900 dark:text-white">{deletingItem.companyName || "Unknown Customer"}</strong>?
              </p>

              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 leading-relaxed font-medium">
                <strong>Warning:</strong> This action cannot be undone. All linked drawings, items, status logs, and quotations will be deleted permanently.
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => setDeletingItem(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteSingle}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm shadow-red-500/20 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{actionLoading ? "Deleting..." : "Permanently Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Delete Confirm Modal ──────────────────────── */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => setShowBulkDeleteModal(false)}>
          <div className="w-full max-w-md bg-white dark:bg-[#121520] rounded-2xl border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-red-500/5">
              <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle size={17} />
                </div>
                <h3 className="font-extrabold text-sm m-0">Bulk Delete Enquiries</h3>
              </div>
              <button onClick={() => setShowBulkDeleteModal(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
                Are you sure you want to permanently delete <strong className="text-red-500 font-bold">{selectedIds.size} selected enquiries</strong>?
              </p>

              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 leading-relaxed font-medium">
                <strong>Warning:</strong> All drawings, quotations, and activity timelines attached to these {selectedIds.size} enquiries will be removed permanently.
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm shadow-red-500/20 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>{actionLoading ? "Deleting..." : `Delete ${selectedIds.size} Enquiries`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
