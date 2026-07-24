import { PackageOpen } from "lucide-react";

interface OrderEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export default function OrderEmptyState({ hasFilters, onClearFilters }: OrderEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface-hover)] flex items-center justify-center mb-4">
        <PackageOpen size={32} className="text-[var(--text-muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        {hasFilters ? "No matching orders" : "No orders yet"}
      </h3>
      <p className="text-[13px] text-[var(--text-muted)] text-center max-w-sm mb-6">
        {hasFilters
          ? "Try adjusting your search or filter criteria to find what you're looking for."
          : "Orders will appear here once customers confirm quotations and place their orders."}
      </p>
      {hasFilters && onClearFilters && (
        <button type="button" onClick={onClearFilters}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
          Clear Filters
        </button>
      )}
    </div>
  );
}
