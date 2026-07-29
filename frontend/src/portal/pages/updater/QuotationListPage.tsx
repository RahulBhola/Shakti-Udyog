import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updaterApi } from "../../../api/updaterApi";
import type { Paged, QuotationListItem } from "../../../api/customerApi";
import { Loading } from "../../../components/ui";
import { formatDate, formatMoney } from "../../shared";
import {
  FileText, Search, Plus, Eye, Download, MoreHorizontal,
  Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  FileEdit
} from "lucide-react";

/* ── Status config ── */
const statusColor: Record<string, { bg: string; text: string; border: string; label: string }> = {
  Draft: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-l-blue-500", label: "Draft" },
  "Pending Approval": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-l-amber-500", label: "Pending" },
  Approved: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-l-emerald-500", label: "Approved" },
  Issued: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-l-orange-500", label: "Issued" },
  Viewed: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-l-purple-500", label: "Viewed" },
  Negotiating: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-l-amber-500", label: "Negotiating" },
  Accepted: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-l-emerald-500", label: "Accepted" },
  Converted: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-l-purple-500", label: "Converted" },
  Declined: { bg: "bg-red-500/10", text: "text-red-400", border: "border-l-red-500", label: "Declined" },
  Expired: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-l-slate-500", label: "Expired" },
  Cancelled: { bg: "bg-red-500/10", text: "text-red-400", border: "border-l-red-500", label: "Cancelled" },
};

function getStatus(s: string) {
  return statusColor[s] ?? { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-l-slate-500", label: s };
}

export default function QuotationListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Paged<QuotationListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    updaterApi.quotations(page, 20, search || undefined, statusFilter || undefined)
      .then(setData).catch((e: Error) => setError(e.message));
  }, [page, search, statusFilter]);

  useEffect(load, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
  const allStatuses = data?.items.map((r) => r.status) ?? [];
  const total = data?.totalCount ?? 0;
  const accepted = allStatuses.filter((s) => s === "Accepted" || s === "Converted").length;
  const pending = allStatuses.filter((s) => s === "Draft" || s === "Pending Approval" || s === "Issued" || s === "Negotiating").length;
  const cancelled = allStatuses.filter((s) => s === "Cancelled" || s === "Declined" || s === "Expired").length;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] text-[var(--text-muted)] mb-1">Admin / Quotations</div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] m-0 leading-none">Quotations</h1>
        </div>
        <button onClick={() => navigate("/admin/quotations/new")}
          className="flex items-center gap-2 px-5 h-10 rounded-[12px] bg-[var(--color-primary)] text-white text-[13px] font-semibold hover:bg-[var(--color-primary-hover)] transition-all shadow-sm">
          <Plus size={16} /> New Quotation
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Quotations", value: total, icon: FileText, color: "text-[var(--color-primary)]", bg: "bg-[var(--color-primary)]/10" },
          { label: "Accepted", value: accepted, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Pending", value: pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Cancelled", value: cancelled, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((k) => (
          <div key={k.label} className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/20 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <span className={`flex items-center justify-center w-9 h-9 rounded-[10px] ${k.bg} ${k.color}`}>
                <k.icon size={16} />
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">{k.label}</span>
            </div>
            <span className="text-[24px] font-bold text-[var(--text-primary)] tabular-nums">{k.value}</span>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-[10px] px-3.5 h-9 w-64 shadow-sm">
          <Search size={14} className="text-[var(--text-muted)] shrink-0" />
          <input type="text" placeholder="Search quotation no, customer, item..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent border-none outline-none text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-full" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]">
          <option value="">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="Issued">Issued</option>
          <option value="Accepted">Accepted</option>
          <option value="Converted">Converted</option>
          <option value="Declined">Declined</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* ── Content ── */}
      {error && (
        <div className="flex items-center justify-center min-h-[200px] rounded-[16px] border border-red-500/20 bg-red-500/5 p-8">
          <p className="text-[13px] text-red-400">{error}</p>
        </div>
      )}
      {!data && !error && <div className="py-10"><Loading label="Loading quotations" /></div>}
      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-[16px] border border-dashed border-[var(--border-default)]">
          <FileText size={48} className="text-[var(--text-muted)] opacity-30 mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] m-0">No Quotations Found</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1 mb-4">Create your first quotation to get started.</p>
          <button onClick={() => navigate("/admin/quotations/new")}
            className="flex items-center gap-2 px-4 h-9 rounded-[10px] bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] transition-all">
            <Plus size={14} /> New Quotation
          </button>
        </div>
      )}

      {/* ── Quotation Cards ── */}
      {data && data.items.length > 0 && (
        <>
        <div className="hidden lg:flex items-center px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <div className="flex-1 min-w-0 pl-2">Quotation / Customer</div>
          <div className="w-[120px] text-right">Amount</div>
          <div className="w-[120px] text-right">Valid Till</div>
          <div className="w-[160px] text-right">Payment / Delivery</div>
          <div className="w-[110px] text-right">Status</div>
        </div>
        <div className="space-y-3">
          {data.items.map((q) => {
            const sc = getStatus(q.status);
            return (
              <div key={q.id} onClick={() => navigate(`/admin/quotations/${q.id}`)}
                className={`group rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm hover:bg-[#182234] hover:shadow-md hover:border-[var(--color-primary)]/20 transition-all duration-200 cursor-pointer border-l-[3px] ${sc.border} overflow-hidden`}>
                <div className="p-5">
                  <div className="flex items-start gap-6">
                    {/* Left: Icon + Number */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shrink-0 mt-0.5">
                        <FileText size={18} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[14px] font-bold text-[var(--text-primary)]">{q.quotationNumber}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)]">Rev.{q.revisionNumber}</span>
                        </div>
                        <div className="text-[12px] font-medium text-[var(--text-secondary)]">{q.companyName || "—"}</div>
                        <div className="text-[12px] text-[var(--text-muted)] mt-0.5">{q.productType}</div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="hidden sm:block text-right shrink-0 w-[120px]">
                      <div className="text-[16px] font-bold text-[var(--text-primary)] tabular-nums">{formatMoney(q.total, q.currency)}</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{q.itemCount} {q.itemCount === 1 ? "item" : "items"}</div>
                    </div>

                    {/* Dates */}
                    <div className="hidden md:block shrink-0 text-right w-[120px]">
                      <div className="text-[12px] text-[var(--text-secondary)]">Valid Till</div>
                      <div className="text-[13px] font-medium text-[var(--text-primary)]">{formatDate(q.validUntilUtc)}</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-1">{new Date(q.createdAtUtc).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>

                    {/* Terms */}
                    <div className="hidden lg:block shrink-0 w-[160px]">
                      <div className="text-[11px] text-[var(--text-muted)]">Payment: <span className="text-[var(--text-secondary)] font-medium">{q.paymentTerms?.split("\n")[0] || "—"}</span></div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-1">Delivery: <span className="text-[var(--text-secondary)] font-medium">{q.deliveryTime || "—"}</span></div>
                    </div>

                    {/* Right: Status + Actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0 w-[110px]">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/quotations/${q.id}`); }}
                          className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface)] transition-all">
                          <Eye size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/quotations/new?editQuotationId=${q.id}`); }}
                          className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface)] transition-all">
                          <FileEdit size={13} />
                        </button>
                        <button className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface)] transition-all">
                          <Download size={13} />
                        </button>
                        <button className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-all">
                          <MoreHorizontal size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}

      {/* ── Pagination ── */}
      {data && data.items.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-[12px] text-[var(--text-muted)]">
            Showing {data.items.length > 0 ? (page - 1) * data.pageSize + 1 : 0}–{Math.min(page * data.pageSize, data.totalCount)} of {data.totalCount}
          </div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-40 transition-all">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-all ${p === page ? "bg-[var(--color-primary)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"}`}>
                  {p}
                </button>
              );
            })}
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-40 transition-all">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
