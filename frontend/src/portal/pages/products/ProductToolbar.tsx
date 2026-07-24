import { Search, X, Download, Plus } from "lucide-react";

interface ProductToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  categoryId: string;
  onCategoryChange: (v: string) => void;
  onExport: () => void;
  onAdd: () => void;
  categories?: { id: string; name: string }[];
}

export default function ProductToolbar({
  search, onSearchChange,
  status, onStatusChange,
  categoryId, onCategoryChange,
  onExport, onAdd,
  categories,
}: ProductToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search products by name, code, or material..."
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
        <option value="Active">Active</option>
        <option value="Draft">Draft</option>
        <option value="Archived">Archived</option>
      </select>

      {/* Category filter */}
      <select
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="h-9 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
      >
        <option value="">All Categories</option>
        {categories?.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Export */}
      <button type="button" onClick={onExport}
        className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all">
        <Download size={14} />
        Export
      </button>

      {/* Add Product */}
      <button type="button" onClick={onAdd}
        className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] transition-all ml-auto">
        <Plus size={15} />
        Add Product
      </button>
    </div>
  );
}