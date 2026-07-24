import { Package, Plus } from "lucide-react";

interface EmptyStateProps {
  onAdd: () => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export default function EmptyState({ onAdd, hasFilters, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--bg-surface-hover)] mb-5">
        <Package size={36} className="text-[var(--text-muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        {hasFilters ? "No Products Found" : "No Products Yet"}
      </h3>
      <p className="text-[13px] text-[var(--text-secondary)] text-center max-w-sm mb-6">
        {hasFilters
          ? "Try adjusting your search or filters to find what you're looking for."
          : "Products created here can be reused in RFQs, Quotations, Orders and Manufacturing."}
      </p>
      {hasFilters && onClearFilters ? (
        <button type="button" onClick={onClearFilters}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
          Clear Filters
        </button>
      ) : (
        <button type="button" onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] transition-all">
          <Plus size={15} />
          Create First Product
        </button>
      )}
    </div>
  );
}