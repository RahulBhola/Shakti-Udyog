import { useEffect, useRef, useState } from "react";
import { Eye, ChevronLeft, ChevronRight, MoreHorizontal, Clock } from "lucide-react";
import type { OrderListItem } from "../../../api/customerApi";

/* ── Status badge with unique colors ────────────────────────────── */

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  pattern_development: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  production: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  quality_check: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  packed: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  ready_to_dispatch: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
  dispatched: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  delivered: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  on_hold: "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  returned: "bg-slate-50 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400",
  closed: "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400",
};

function StatusBadge({ status }: { status: string }) {
  const c = statusColors[status] ?? "bg-[#F1F5F9] text-[#64748B]";
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c}`}>
      {label}
    </span>
  );
}

/* ── Helpers ────────────────────────────────────────────────────── */

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function daysRemaining(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ── OrderTable ─────────────────────────────────────────────────── */

interface OrderTableProps {
  items: OrderListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (p: number) => void;
  onView: (id: string) => void;
}

export default function OrderTable({
  items, totalCount, page, pageSize, loading,
  onPageChange, onView,
}: OrderTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  // Pagination page numbers
  const pageNumbers: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pageNumbers.push(i);
    if (page < totalPages - 2) pageNumbers.push("...");
    pageNumbers.push(totalPages);
  }

  if (loading) {
    return (
      <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
        <div className="p-8 text-center text-[var(--text-muted)] text-sm">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
      <div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-default)] text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              <th className="text-left pl-4 pr-2 py-3 w-10">
                <input type="checkbox"
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={toggleAll}
                  className="rounded border-[var(--border-input)]" />
              </th>
              <th className="text-left px-3 py-3">Order Number</th>
              <th className="text-left px-3 py-3">Status</th>
              <th className="text-right px-3 py-3">Quantity</th>
              <th className="text-left px-3 py-3">Promised Dispatch</th>
              <th className="text-left px-3 py-3">Last Updated</th>
              <th className="text-right px-3 py-3 w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-[var(--text-muted)] text-sm">
                  No orders found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <OrderRow
                  key={item.id}
                  item={item}
                  selected={selected.has(item.id)}
                  onToggle={() => toggleSelect(item.id)}
                  onView={() => onView(item.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-default)]">
          <span className="text-[12px] text-[var(--text-muted)]">
            Showing {startItem}–{endItem} of {totalCount}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}
              className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-40 disabled:pointer-events-none">
              <ChevronLeft size={14} />
            </button>
            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`e${i}`} className="px-1 text-[var(--text-muted)] text-xs">…</span>
              ) : (
                <button key={p} type="button" onClick={() => onPageChange(p)}
                  className={`flex items-center justify-center min-w-[28px] h-7 rounded-md text-xs font-medium transition-all ${
                    p === page
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                  }`}>
                  {p}
                </button>
              )
            )}
            <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
              className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-40 disabled:pointer-events-none">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Row ────────────────────────────────────────────────────────── */

function OrderRow({
  item, selected, onToggle, onView,
}: {
  item: OrderListItem;
  selected: boolean;
  onToggle: () => void;
  onView: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const days = daysRemaining(item.promisedDispatchDateUtc);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [menuOpen]);

  return (
    <tr className="border-b border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors text-[13px]">
      <td className="pl-4 pr-2 py-3">
        <input type="checkbox" checked={selected} onChange={onToggle}
          className="rounded border-[var(--border-input)]" />
      </td>
      <td className="px-3 py-3">
        <button type="button" onClick={onView}
          className="font-medium text-[var(--text-primary)] hover:text-[var(--color-primary)] transition-colors text-left leading-tight">
          {item.orderNumber}
          <span className="block text-[11px] text-[var(--text-muted)] font-normal">
            {formatDate(item.placedAtUtc)}
          </span>
        </button>
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-3 py-3 text-right text-[var(--text-secondary)] tabular-nums">
        {item.totalQuantity}
      </td>
      <td className="px-3 py-3">
        <span className="text-[var(--text-secondary)]">{formatDate(item.promisedDispatchDateUtc)}</span>
        {days !== null && (
          <span className={`ml-2 inline-flex items-center gap-0.5 text-[11px] font-medium ${
            days < 0 ? 'text-red-500' : days <= 7 ? 'text-amber-500' : 'text-emerald-500'
          }`}>
            <Clock size={10} />
            {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
          </span>
        )}
      </td>
      <td className="px-3 py-3 text-[var(--text-secondary)] text-sm">
        {formatDate(item.lastUpdatedAtUtc)}
      </td>
      <td className="px-3 py-3 text-right">
        <div className="relative inline-flex">
          <button type="button" ref={btnRef} onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-xl py-1.5 origin-top-right animate-in fade-in zoom-in-95"
                style={{ minWidth: "160px" }}>
                <button type="button" onClick={() => { onView(); setMenuOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <Eye size={14} className="shrink-0" />
                  View Details
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
