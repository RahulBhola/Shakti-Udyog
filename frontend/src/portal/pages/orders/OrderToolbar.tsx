import { Search, X, Download, RotateCcw } from "lucide-react";

const ORDER_STATUSES = [
  "confirmed",
  "pattern_development",
  "production",
  "quality_check",
  "packed",
  "ready_to_dispatch",
  "dispatched",
  "delivered",
  "on_hold",
  "cancelled",
];

interface OrderToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  onExport: () => void;
  onRefresh: () => void;
}

export default function OrderToolbar({
  search, onSearchChange,
  status, onStatusChange,
  onExport, onRefresh,
}: OrderToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search by order number..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-9 pl-9 pr-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
        />
        {search && (
          <button type="button" onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Status filter */}
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
      >
        <option value="">All Statuses</option>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
        ))}
      </select>

      {/* Refresh */}
      <button type="button" onClick={onRefresh}
        className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
        <RotateCcw size={14} />
        Refresh
      </button>

      {/* Export */}
      <button type="button" onClick={onExport}
        className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
        <Download size={14} />
        Export
      </button>
    </div>
  );
}
