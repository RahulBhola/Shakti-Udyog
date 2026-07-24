import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updaterApi, type UpdaterRfqListItem } from "../../../api/updaterApi";
import type { Paged } from "../../../api/customerApi";
import { Loading } from "../../../components/ui";
import { formatDate } from "../../shared";
import {
  Search, Plus, Download, Eye, ExternalLink, X,
  FileText, Clock, CheckCircle, AlertCircle, XCircle,
  ChevronRight, RotateCcw, MoreHorizontal, FileEdit,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Status badge color map                                             */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  Draft:           { label: "Draft",           bg: "bg-[#F1F5F9]",   text: "text-[#64748B]",     dot: "bg-[#94A3B8]" },
  Received:        { label: "Received",        bg: "bg-[#EFF6FF]",   text: "text-[#2563EB]",     dot: "bg-[#3B82F6]" },
  "Under Review":  { label: "Under Review",    bg: "bg-[#FFF7ED]",   text: "text-[#F97316]",     dot: "bg-[#F97316]" },
  Approved:        { label: "Approved",        bg: "bg-[#F0FDF4]",   text: "text-[#22C55E]",     dot: "bg-[#22C55E]" },
  Quoted:          { label: "Quoted",          bg: "bg-[#EEF2FF]",   text: "text-[#6366F1]",     dot: "bg-[#6366F1]" },
  Accepted:        { label: "Accepted",        bg: "bg-[#F0FDF4]",   text: "text-[#16A34A]",     dot: "bg-[#16A34A]" },
  Rejected:        { label: "Rejected",        bg: "bg-[#FEF2F2]",   text: "text-[#EF4444]",     dot: "bg-[#EF4444]" },
  Cancelled:       { label: "Cancelled",       bg: "bg-[#F8FAFC]",   text: "text-[#94A3B8]",     dot: "bg-[#CBD5E1]" },
  Expired:         { label: "Expired",         bg: "bg-[#F8FAFC]",   text: "text-[#94A3B8]",     dot: "bg-[#CBD5E1]" },
};

function getStatusConfig(status: string) {
  return statusConfig[status] ?? { label: status, bg: "bg-[#F1F5F9]", text: "text-[#64748B]", dot: "bg-[#94A3B8]" };
}

function StatusBadge({ status }: { status: string }) {
  const cfg = getStatusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Priority badge                                                     */
/* ------------------------------------------------------------------ */

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    Low: "bg-[#F1F5F9] text-[#64748B]",
    Medium: "bg-[#FFF7ED] text-[#F97316]",
    High: "bg-[#FEF2F2] text-[#EF4444]",
    Urgent: "bg-[#FEF2F2] text-[#DC2626] ring-1 ring-red-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[priority] ?? colors.Medium}`}>
      {priority}
    </span>
  );
}

/*  Summary card                                                       */
/* ------------------------------------------------------------------ */

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-card)] p-3.5 shadow-sm h-[76px]">
      <span className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${color}/10`}>
        <Icon size={18} className={color} />
      </span>
      <div className="min-w-0">
        <div className="text-[22px] font-bold text-[var(--text-primary)] leading-none tabular-nums">{value}</div>
        <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">{label}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CSV export                                                         */
/* ------------------------------------------------------------------ */

function exportToCsv(items: UpdaterRfqListItem[]) {
  const headers = ["RFQ No.", "Customer", "Product", "Quantity", "Status", "Date", "Files", "Assigned"];
  const rows = items.map((r) => [
    `RFQ-${r.id.slice(0, 8).toUpperCase()}`,
    r.companyName ?? "Unknown",
    r.productType,
    r.quantity,
    r.status,
    formatDate(r.createdAtUtc),
    String(r.fileCount),
    r.assignedToUserId ? "Yes" : "No",
  ]);

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rfqs-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function UpdaterRfqListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Paged<UpdaterRfqListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pageSize = 20;

  const load = useCallback(() => {
    updaterApi.rfqs(page, pageSize, search || undefined, statusFilter || undefined)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [page, search, statusFilter]);

  useEffect(load, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  // Compute RFQ-specific summary from data
  const allStatuses = data?.items.map((r) => r.status) ?? [];
  const totalRfqs = data?.totalCount ?? 0;
  const newCount = allStatuses.filter((s) => s === "Received").length;
  const reviewCount = allStatuses.filter((s) => s === "Under Review").length;
  const quotedCount = allStatuses.filter((s) => s === "Quoted").length;
  const acceptedCount = allStatuses.filter((s) => s === "Accepted").length;
  const rejectedCount = allStatuses.filter((s) => s === "Rejected").length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data) return;
    if (selectedIds.size === data.items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.items.map((r) => r.id)));
    }
  };

  const clearFilters = () => { setSearch(""); setStatusFilter(""); setPage(1); };

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-[var(--text-primary)] m-0 leading-none">RFQs</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5 m-0">
            Manage customer Requests for Quotation.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Search input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search RFQs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-56 h-9 pl-9 pr-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all duration-200"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={14} />
              </button>
            )}
          </div>

          {/* View options */}

          {/* Export button */}
          <button
            type="button"
            onClick={() => { if (data) exportToCsv(data.items); }}
            className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200"
          >
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* ── RFQ Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard icon={FileText} label="Total RFQs" value={totalRfqs} color="text-[var(--color-primary)]" />
        <SummaryCard icon={Clock} label="Received" value={newCount} color="text-[#3B82F6]" />
        <SummaryCard icon={AlertCircle} label="Under Review" value={reviewCount} color="text-[#F97316]" />
        <SummaryCard icon={FileEdit} label="Quoted" value={quotedCount} color="text-[#6366F1]" />
        <SummaryCard icon={CheckCircle} label="Accepted" value={acceptedCount} color="text-[#22C55E]" />
        <SummaryCard icon={XCircle} label="Rejected" value={rejectedCount} color="text-[#EF4444]" />
      </div>

      {/* ── Quick Actions ── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 px-3.5 h-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200"
        >
          <RotateCcw size={13} />
          Refresh
        </button>
        {selectedIds.size > 0 && (
          <span className="text-[11px] text-[var(--text-muted)] ml-1">{selectedIds.size} selected</span>
        )}
      </div>

      {/* ── Error / Empty / Loading ── */}
      {error && (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center max-w-sm">
            <AlertCircle size={24} className="text-red-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-red-600 mb-1">RFQs unavailable</div>
            <p className="text-[12px] text-[var(--text-secondary)]">{error}</p>
            <button type="button" onClick={load} className="mt-2 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors">Retry</button>
          </div>
        </div>
      )}

      {!data && !error && <div className="py-10"><Loading label="Loading RFQs" /></div>}

      {data && data.items.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16">
          <FileText size={48} className="text-[var(--text-muted)] mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] m-0">No RFQs found</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1 mb-4">
            {search || statusFilter ? "Try adjusting your search or filters." : "Create your first RFQ to get started."}
          </p>
          {search || statusFilter ? (
            <button type="button" onClick={clearFilters} className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-all">
              <RotateCcw size={13} />
              Clear Filters
            </button>
          ) : (
            <span className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--border-default)] text-[var(--text-muted)] text-xs font-semibold cursor-not-allowed">
              <Plus size={15} />
              Create RFQ
            </span>
          )}
        </div>
      )}

      {/* ── Data Table ── */}
      {data && data.items.length > 0 && (
        <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-app)]">
                  <th className="w-10 px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={data.items.length > 0 && selectedIds.size === data.items.length}
                      onChange={toggleSelectAll}
                      className="rounded border-[var(--border-default)] accent-[var(--color-primary)]"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">RFQ No.</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Customer</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Product</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Qty</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Date</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Assigned</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Priority</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                  <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors duration-150 cursor-pointer"
                    onClick={() => navigate(`/admin/rfqs/${r.id}`)}
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="rounded border-[var(--border-default)] accent-[var(--color-primary)]"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-mono text-[12px] font-medium text-[var(--color-primary)]">
                        RFQ-{r.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-primary)]/10 text-[11px] font-bold text-[var(--color-primary)] shrink-0">
                          {(r.companyName ?? "?").charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-[var(--text-primary)] truncate max-w-[140px]">
                            {r.companyName ?? "Unknown"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">{r.productType}</td>
                    <td className="px-3 py-3 text-[var(--text-primary)] font-medium tabular-nums">{r.quantity}</td>
                    <td className="px-3 py-3 text-[12px] text-[var(--text-secondary)] whitespace-nowrap">{formatDate(r.createdAtUtc)}</td>
                    <td className="px-3 py-3">
                      {r.assignedToUserId ? (
                        <span className="inline-flex items-center gap-1 text-[12px] text-[var(--text-secondary)]">
                          <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]/10 text-[10px] font-bold text-[var(--color-primary)] flex items-center justify-center">E</span>
                          Assigned
                        </span>
                      ) : (
                        <span className="text-[12px] text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <PriorityBadge priority={r.priority} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/rfqs/${r.id}`)}
                          className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface-hover)] transition-all"
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>
                        <Link
                          to={`/admin/rfqs/${r.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface-hover)] transition-all no-underline"
                          title="Open"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <div className="relative group">
                          <button
                            type="button"
                            className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all"
                            title="More"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-default)]">
            <div className="text-[12px] text-[var(--text-muted)]">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.totalCount)} of {data.totalCount}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                      p === page
                        ? "bg-[var(--color-primary)] text-white"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
  );
}