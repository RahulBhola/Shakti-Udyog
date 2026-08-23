import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, type AdminCategory, type ProductMasterListItem } from "../../../api/adminApi";
import { ConfirmDialog } from "../ConfirmDialog";
import {
  Folder, FolderTree, Plus, Search, Eye, EyeOff,
  Pencil, Trash2, X, AlertCircle,
} from "lucide-react";
import "../erpListView.css";

const CAT_COLORS: Record<string, { bg: string; fg: string }> = {
  "Grey Iron Castings": { bg: "rgba(37,99,235,0.15)", fg: "#3B82F6" },
  "Ductile Iron Castings": { bg: "rgba(20,184,166,0.15)", fg: "#14B8A6" },
  "SG Iron Castings": { bg: "rgba(245,158,11,0.15)", fg: "#F59E0B" },
  "Machined Components": { bg: "rgba(124,58,237,0.15)", fg: "#8B5CF6" },
  "Custom Castings": { bg: "rgba(236,72,153,0.15)", fg: "#EC4899" },
  "Precision Mechanism": { bg: "rgba(14,165,233,0.15)", fg: "#0EA5E9" },
  "Commercial Hospitality": { bg: "rgba(249,115,22,0.15)", fg: "#F97316" },
  "Power Transmission": { bg: "rgba(168,85,247,0.15)", fg: "#A855F7" },
  "Agricultural Machinery": { bg: "rgba(34,197,94,0.15)", fg: "#22C55E" },
  "Automotive & Powertrain": { bg: "rgba(239,68,68,0.15)", fg: "#EF4444" },
  "Industrial Machinery": { bg: "rgba(59,130,246,0.15)", fg: "#3B82F6" },
  "Industrial & Structural": { bg: "rgba(139,92,246,0.15)", fg: "#8B5CF6" },
  "Fasteners & Hardware": { bg: "rgba(236,72,153,0.15)", fg: "#EC4899" },
};
const DEFAULT_COLOR = { bg: "rgba(148,163,184,0.15)", fg: "#94A3B8" };

function catColor(name: string) {
  return CAT_COLORS[name] ?? DEFAULT_COLOR;
}

interface CategoryFormModalProps {
  category: AdminCategory | null;
  parents: AdminCategory[];
  onClose: () => void;
  onSaved: () => void;
}

function CategoryFormModal({ category, parents, onClose, onSaved }: CategoryFormModalProps) {
  const isEdit = !!category;
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [parentId, setParentId] = useState(category?.parentId ?? "");
  const [displayOrder, setDisplayOrder] = useState(category?.displayOrder ?? 0);
  const [isVisible, setIsVisible] = useState(category?.isVisible ?? true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEdit && !slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const save = async () => {
    if (!name.trim()) {
      setErr("Category name is required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        parentId: parentId || undefined,
        displayOrder: Number(displayOrder) || 0,
        isVisible,
      };
      if (isEdit && category) {
        await adminApi.updateCategory(category.id, payload);
      } else {
        await adminApi.createCategory(payload as any);
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save category.");
      setSaving(false);
    }
  };

  return (
    <div className="inv-modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: 480 }}>
        <div className="inv-modal__head">
          <div className="flex items-center gap-2">
            <FolderTree size={18} className="text-[var(--color-primary)]" />
            <span className="inv-modal__title">{isEdit ? "Edit Category" : "New Category"}</span>
          </div>
          <button className="inv-icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="inv-modal__body space-y-4">
          <div className="inv-form-field">
            <label className="inv-form-label">Category Name <span className="text-red-500">*</span></label>
            <input
              className="inv-input"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Precision Mechanism"
              autoFocus
            />
          </div>
          <div className="inv-form-field">
            <label className="inv-form-label">URL Slug</label>
            <input
              className="inv-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="precision-mechanism"
            />
            <span className="text-[11px] text-neutral-400 mt-1">Used for filtering in web catalog routes.</span>
          </div>
          <div className="inv-form-field">
            <label className="inv-form-label">Parent Category</label>
            <select
              className="inv-select"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">Root Category (Top Level)</option>
              {parents
                .filter((p) => !category || p.id !== category.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
          </div>
          <div className="inv-form-field">
            <label className="inv-form-label">Display Order</label>
            <input
              className="inv-input"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
            />
          </div>
          <div className="inv-form-field pt-1">
            <label className="inv-toggle flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
              />
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Visible on public catalog & website filters
              </span>
            </label>
          </div>
          {err && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
              <AlertCircle size={14} className="shrink-0" />
              <span>{err}</span>
            </div>
          )}
        </div>
        <div className="inv-modal__foot">
          <button className="inv-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="inv-btn inv-btn--primary" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface CategoryManagerModalProps {
  open: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
}

export function CategoryManagerModal({ open, onClose, onCategoriesChanged }: CategoryManagerModalProps) {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [products, setProducts] = useState<ProductMasterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Visible" | "Hidden">("All");
  const [formModal, setFormModal] = useState<{ open: boolean; category: AdminCategory | null }>({
    open: false,
    category: null,
  });
  const [confirmDelete, setConfirmDelete] = useState<AdminCategory | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setActionErr(null);
    Promise.all([
      adminApi.categories(),
      adminApi.productMaster.list({ pageSize: 1000 }).catch(() => null),
    ])
      .then(([cats, prodRes]) => {
        setCategories(cats || []);
        setProducts(prodRes?.items || []);
      })
      .catch((e: Error) => setActionErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  // Map category product counts by categoryName
  const productCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (p.categoryName) {
        const key = p.categoryName.trim().toLowerCase();
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
    return map;
  }, [products]);

  // Filtered categories
  const filtered = useMemo(() => {
    return categories.filter((c) => {
      if (statusFilter === "Visible" && !c.isVisible) return false;
      if (statusFilter === "Hidden" && c.isVisible) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.slug?.toLowerCase().includes(q) ?? false);
      }
      return true;
    });
  }, [categories, statusFilter, search]);

  const toggleVisibility = async (cat: AdminCategory) => {
    try {
      await adminApi.updateCategory(cat.id, {
        name: cat.name,
        description: cat.description ?? undefined,
        displayOrder: cat.displayOrder,
        isVisible: !cat.isVisible,
      });
      loadData();
      onCategoriesChanged?.();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Failed to update category.");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await adminApi.deleteCategory(confirmDelete.id);
      setConfirmDelete(null);
      loadData();
      onCategoriesChanged?.();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Could not delete category. It may still be in use.");
      setConfirmDelete(null);
    }
  };

  if (!open) return null;

  return (
    <div className="inv-modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="inv-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 840, width: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="inv-modal__head shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <FolderTree size={18} />
            </div>
            <div>
              <span className="inv-modal__title" style={{ fontSize: "16px" }}>Manage Product Categories</span>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 m-0">
                Create, organize, and configure visibility of casting categories across the catalog.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFormModal({ open: true, category: null })}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:brightness-110 shadow-sm transition-all"
            >
              <Plus size={14} />
              <span>New Category</span>
            </button>
            <button className="inv-icon-btn" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="px-6 py-3 border-b border-neutral-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-neutral-50/50 dark:bg-white/[0.01]">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-9 pr-3 h-8 text-xs rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#12151e] text-neutral-800 dark:text-white outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto">
            {(["All", "Visible", "Hidden"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === s
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-white/5"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {actionErr && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{actionErr}</span>
            </div>
            <button onClick={() => setActionErr(null)} className="text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Modal Body / Table */}
        <div className="inv-modal__body flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="py-16 text-center text-xs text-neutral-400">Loading categories...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 space-y-2">
              <Folder size={32} className="mx-auto opacity-30" />
              <p className="text-xs font-medium text-neutral-500">No categories found matching your filter.</p>
              <button
                type="button"
                onClick={() => { setSearch(""); setStatusFilter("All"); }}
                className="text-xs text-[var(--color-primary)] hover:underline font-semibold"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <table className="inv-table w-full" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "35%" }} />
                <col style={{ width: "23%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ width: "35%" }}>Category</th>
                  <th style={{ width: "23%" }}>Slug</th>
                  <th style={{ width: "14%" }}>Products</th>
                  <th style={{ width: "8%" }}>Order</th>
                  <th style={{ width: "12%" }}>Visibility</th>
                  <th style={{ width: "8%", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => {
                  const cColor = catColor(cat.name);
                  const pCount = productCountMap.get(cat.name.trim().toLowerCase()) ?? 0;
                  return (
                    <tr key={cat.id}>
                      <td style={{ overflow: "hidden", maxWidth: 0 }}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 font-bold text-xs"
                            style={{ background: cColor.bg, color: cColor.fg }}
                          >
                            <Folder size={15} />
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">{cat.name}</div>
                            {cat.description && (
                              <div className="text-[11px] text-neutral-400 truncate">{cat.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ overflow: "hidden", maxWidth: 0 }}>
                        <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 block truncate">
                          {cat.slug || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-neutral-100 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                          {pCount} {pCount === 1 ? "product" : "products"}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-neutral-500">{cat.displayOrder}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => void toggleVisibility(cat)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold border transition-all ${
                            cat.isVisible
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-neutral-500/10 text-neutral-500 border-neutral-500/20 hover:bg-neutral-500/20"
                          }`}
                          title="Click to toggle visibility"
                        >
                          {cat.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{cat.isVisible ? "Visible" : "Hidden"}</span>
                        </button>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setFormModal({ open: true, category: cat })}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-all"
                            title="Edit Category"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(cat)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                            title="Delete Category"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Foot */}
        <div className="inv-modal__foot shrink-0 flex items-center justify-between text-xs text-neutral-400">
          <span>{categories.length} total categories registered</span>
          <button className="inv-btn" onClick={onClose}>Close</button>
        </div>
      </div>

      {/* Nested Form Modal */}
      {formModal.open && (
        <CategoryFormModal
          category={formModal.category}
          parents={categories}
          onClose={() => setFormModal({ open: false, category: null })}
          onSaved={() => {
            loadData();
            onCategoriesChanged?.();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          open={!!confirmDelete}
          title="Delete Category"
          message={`Are you sure you want to delete "${confirmDelete.name}"? Products assigned to this category may become unassigned.`}
          confirmLabel="Delete Category"
          danger
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
