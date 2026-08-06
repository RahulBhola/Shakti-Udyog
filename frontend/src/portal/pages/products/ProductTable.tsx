import { useEffect, useRef, useState } from "react";
import { Eye, FileEdit, Copy, Archive, Trash2, MoreHorizontal, ChevronLeft, ChevronRight, Package } from "lucide-react";
import type { ProductMasterListItem } from "../../../api/adminApi";
import { adminApi } from "../../../api/adminApi";
import { tokenStorage } from "../../../auth/tokenStorage";
import { config } from "../../../config";

/* ------------------------------------------------------------------ */
/*  Status badge                                                        */
/* ------------------------------------------------------------------ */

const statusColors: Record<string, string> = {
  Active: "bg-[#F0FDF4] text-[#22C55E]",
  Draft: "bg-[#FFF7ED] text-[#F97316]",
  Archived: "bg-[#F1F5F9] text-[#64748B]",
};

function StatusBadge({ status }: { status: string }) {
  const c = statusColors[status] ?? "bg-[#F1F5F9] text-[#64748B]";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c}`}>{status}</span>;
}

/* ------------------------------------------------------------------ */
/*  Product Table                                                      */
/* ------------------------------------------------------------------ */

interface ProductTableProps {
  items: ProductMasterListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (p: number) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ProductTable({
  items, totalCount, page, pageSize, loading,
  onPageChange, onView, onEdit, onDuplicate, onArchive, onDelete,
}: ProductTableProps) {
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

  // Pagination page range
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
        <div className="p-8 text-center text-[var(--text-muted)] text-sm">Loading products...</div>
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
              <th className="text-left px-3 py-3">Product</th>
              <th className="text-left px-3 py-3">Category</th>
              <th className="text-left px-3 py-3">Type</th>
              <th className="text-left px-3 py-3">Material</th>
              <th className="text-left px-3 py-3">Grade</th>
              <th className="text-right px-3 py-3">Weight</th>
              <th className="text-center px-3 py-3">Status</th>
              <th className="text-right px-3 py-3 w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-[var(--text-muted)] text-sm">
                  No products found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <ProductRow
                  key={item.id}
                  item={item}
                  selected={selected.has(item.id)}
                  onToggle={() => toggleSelect(item.id)}
                  onView={() => onView(item.id)}
                  onEdit={() => onEdit(item.id)}
                  onDuplicate={() => onDuplicate(item.id)}
                  onArchive={() => onArchive(item.id)}
                  onDelete={() => onDelete(item.id)}
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

/* ------------------------------------------------------------------ */
/*  Product Row                                                        */
/* ------------------------------------------------------------------ */

function ProductRow({
  item, selected, onToggle, onView, onEdit, onDuplicate, onArchive, onDelete,
}: {
  item: ProductMasterListItem;
  selected: boolean;
  onToggle: () => void;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = () => {
    if (!menuOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      // Show dropdown to the left of the button, aligned to its bottom
      const dropdownWidth = 144; // w-36 = 9rem = 144px
      setMenuPos({
        top: rect.bottom + 4,
        left: Math.max(8, rect.right - dropdownWidth),
      });
    }
    setMenuOpen(!menuOpen);
  };

  return (
    <tr className="border-b border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors text-[13px]">
      <td className="pl-4 pr-2 py-3">
        <input type="checkbox" checked={selected} onChange={onToggle}
          className="rounded border-[var(--border-input)]" />
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <ProductThumbnail item={item} />
          <button type="button" onClick={onView}
            className="font-medium text-[var(--text-primary)] hover:text-[var(--color-primary)] transition-colors text-left leading-tight">
            {item.productName}
            <span className="block text-[11px] text-[var(--text-muted)] font-normal">{item.productCode}</span>
          </button>
        </div>
      </td>
      <td className="px-3 py-3 text-[var(--text-secondary)]">{item.categoryName ?? "—"}</td>
      <td className="px-3 py-3 text-[var(--text-secondary)]">{item.castingType ?? "—"}</td>
      <td className="px-3 py-3 text-[var(--text-secondary)]">{item.material ?? "—"}</td>
      <td className="px-3 py-3 text-[var(--text-secondary)]">{item.materialGrade ?? "—"}</td>
      <td className="px-3 py-3 text-right text-[var(--text-secondary)] tabular-nums">
        {item.weight != null ? `${item.weight} kg` : "—"}
      </td>
      <td className="px-3 py-3 text-center">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-3 py-3 text-right">
        <button type="button" ref={btnRef} onClick={toggleMenu}
          className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]">
          <MoreHorizontal size={14} />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="fixed z-20 w-36 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] shadow-lg py-1"
              style={{ top: menuPos.top, left: menuPos.left }}>
              <ActionItem icon={Eye} label="View" onClick={() => { onView(); setMenuOpen(false); }} />
              <ActionItem icon={FileEdit} label="Edit" onClick={() => { onEdit(); setMenuOpen(false); }} />
              <ActionItem icon={Copy} label="Duplicate" onClick={() => { onDuplicate(); setMenuOpen(false); }} />
              <ActionItem icon={Archive} label="Archive" onClick={() => { onArchive(); setMenuOpen(false); }} />
              <div className="border-t border-[var(--border-default)] my-1" />
              <ActionItem icon={Trash2} label="Delete" danger onClick={() => { onDelete(); setMenuOpen(false); }} />
            </div>
          </>
        )}
      </td>
    </tr>
  );
}

function ActionItem({ icon: Icon, label, danger, onClick }: { icon: any; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-1.5 text-[12px] transition-colors ${
        danger ? "text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
      }`}>
      <Icon size={13} />
      {label}
    </button>
  );
}

/* ── Product thumbnail (real image or placeholder icon) ────────────── */

function ProductThumbnail({ item }: { item: ProductMasterListItem }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!item.firstAttachmentId) return;
    let cancelled = false;
    (async () => {
      try {
        const token = tokenStorage.getAccessToken();
        const url = adminApi.productMaster.downloadAttachmentUrl(item.id, item.firstAttachmentId!);
        const response = await fetch(`${config.apiBaseUrl}${url}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });
        if (!response.ok) return;
        const blob = await response.blob();
        if (!cancelled) setBlobUrl(URL.createObjectURL(blob));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [item.id, item.firstAttachmentId]);

  if (blobUrl) {
    return (
      <img
        src={blobUrl}
        alt={item.productName}
        className="w-9 h-9 rounded-lg object-cover shrink-0 bg-[var(--bg-surface-hover)]"
      />
    );
  }

  return (
    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--bg-surface-hover)] shrink-0">
      <Package size={16} className="text-[var(--text-muted)]" />
    </span>
  );
}