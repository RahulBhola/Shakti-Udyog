import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, type AdminCategory, type ProductMasterListItem } from "../../../api/adminApi";
import { ConfirmDialog } from "../ConfirmDialog";
import {
  FolderTree, Plus, Search, Eye, EyeOff,
  Pencil, Trash2, X, AlertCircle,
  RefreshCw, Boxes, Tag, Check, Hash,
} from "lucide-react";
import "../erpListView.css";

const CAT_COLORS: Record<string, { bg: string; fg: string; border: string }> = {
  "Grey Iron Castings": { bg: "rgba(59,130,246,0.12)", fg: "#3B82F6", border: "rgba(59,130,246,0.25)" },
  "Ductile Iron Castings": { bg: "rgba(20,184,166,0.12)", fg: "#14B8A6", border: "rgba(20,184,166,0.25)" },
  "SG Iron Castings": { bg: "rgba(245,158,11,0.12)", fg: "#F59E0B", border: "rgba(245,158,11,0.25)" },
  "Machined Components": { bg: "rgba(139,92,246,0.12)", fg: "#8B5CF6", border: "rgba(139,92,246,0.25)" },
  "Custom Castings": { bg: "rgba(236,72,153,0.12)", fg: "#EC4899", border: "rgba(236,72,153,0.25)" },
  "Precision Mechanism": { bg: "rgba(14,165,233,0.12)", fg: "#0EA5E9", border: "rgba(14,165,233,0.25)" },
  "Commercial Hospitality": { bg: "rgba(249,115,22,0.12)", fg: "#F97316", border: "rgba(249,115,22,0.25)" },
  "Power Transmission": { bg: "rgba(168,85,247,0.12)", fg: "#A855F7", border: "rgba(168,85,247,0.25)" },
  "Agricultural Machinery": { bg: "rgba(34,197,94,0.12)", fg: "#22C55E", border: "rgba(34,197,94,0.25)" },
  "Automotive & Powertrain": { bg: "rgba(239,68,68,0.12)", fg: "#EF4444", border: "rgba(239,68,68,0.25)" },
  "Industrial Machinery": { bg: "rgba(59,130,246,0.12)", fg: "#3B82F6", border: "rgba(59,130,246,0.25)" },
  "Industrial & Structural": { bg: "rgba(139,92,246,0.12)", fg: "#8B5CF6", border: "rgba(139,92,246,0.25)" },
  "Fasteners & Hardware": { bg: "rgba(236,72,153,0.12)", fg: "#EC4899", border: "rgba(236,72,153,0.25)" },
};
const DEFAULT_COLOR = { bg: "rgba(148,163,184,0.12)", fg: "#94A3B8", border: "rgba(148,163,184,0.25)" };

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
  const [description, setDescription] = useState(category?.description ?? "");
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
        description: description.trim() || undefined,
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
      <div className="inv-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ maxWidth: 500 }}>
        <div className="inv-modal__head">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <FolderTree size={16} />
            </div>
            <div>
              <span className="inv-modal__title text-base">{isEdit ? "Edit Category" : "New Category"}</span>
              <p className="text-[11px] text-neutral-500 m-0">Set category name, slug, display order, and status.</p>
            </div>
          </div>
          <button className="inv-icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="inv-modal__body space-y-4 pt-4">
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
              className="inv-input font-mono text-xs"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="precision-mechanism"
            />
            <span className="text-[11px] text-neutral-400 mt-1">Used in website navigation and public catalog filters.</span>
          </div>

          <div className="inv-form-field">
            <label className="inv-form-label">Description (Optional)</label>
            <textarea
              className="inv-input resize-none text-xs"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of castings in this category..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="inv-form-field">
              <label className="inv-form-label">Parent Category</label>
              <select
                className="inv-select text-xs"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">Root (Top Level)</option>
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
                className="inv-input text-xs"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-white/[0.02]">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div>
                <span className="text-xs font-bold text-neutral-900 dark:text-white block">Category Status (Public Website)</span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mt-0.5">
                  When active, this category and its products appear in the public catalog.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 shrink-0 ml-3"
              />
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
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Hidden">("All");
  const [formModal, setFormModal] = useState<{ open: boolean; category: AdminCategory | null }>({
    open: false,
    category: null,
  });
  const [confirmDelete, setConfirmDelete] = useState<AdminCategory | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

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
  const categoryProductStats = useMemo(() => {
    const map = new Map<string, { total: number; active: number }>();
    for (const p of products) {
      if (p.categoryName) {
        const key = p.categoryName.trim().toLowerCase();
        const cur = map.get(key) ?? { total: 0, active: 0 };
        cur.total += 1;
        const st = p.status?.toLowerCase();
        if (!p.isArchived && st === "active") cur.active += 1;
        map.set(key, cur);
      }
    }
    return map;
  }, [products]);

  // Overall category KPIs
  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.isVisible).length;
  const hiddenCategories = categories.filter((c) => !c.isVisible).length;
  const totalMappedProducts = products.length;

  // Filtered categories
  const filtered = useMemo(() => {
    return categories.filter((c) => {
      if (statusFilter === "Active" && !c.isVisible) return false;
      if (statusFilter === "Hidden" && c.isVisible) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.slug?.toLowerCase().includes(q) ?? false);
      }
      return true;
    });
  }, [categories, statusFilter, search]);

  // Single Unified Status Toggle: Synchronizes Category Visibility & Product Statuses
  const toggleCategoryStatus = async (cat: AdminCategory) => {
    const newVisibility = !cat.isVisible;
    const targetStatus = newVisibility ? "Active" : "Inactive";

    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, isVisible: newVisibility } : c))
    );

    try {
      // 1. Update Category Visibility in database
      await adminApi.updateCategory(cat.id, {
        name: cat.name,
        slug: cat.slug ?? undefined,
        description: cat.description ?? undefined,
        parentId: cat.parentId ?? undefined,
        displayOrder: cat.displayOrder,
        isVisible: newVisibility,
      });

      // 2. Synchronize all products under this category
      await adminApi.setCategoryProductsStatus(cat.id, targetStatus).catch(() => null);

      setFeedbackNotice(`"${cat.name}" is now ${newVisibility ? "Active & Published" : "Hidden & Deactivated"}.`);
      setTimeout(() => setFeedbackNotice(null), 3000);

      loadData();
      onCategoriesChanged?.();
    } catch (e) {
      // Revert optimistic update on failure
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isVisible: cat.isVisible } : c))
      );
      setActionErr(e instanceof Error ? e.message : "Failed to update category status.");
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
        style={{ maxWidth: 900, width: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="inv-modal__head shrink-0 bg-white/90 dark:bg-[#0f121a]/90 backdrop-blur-xl border-b border-neutral-200/80 dark:border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm">
              <FolderTree size={20} />
            </div>
            <div>
              <span className="inv-modal__title text-lg font-bold text-neutral-900 dark:text-white">
                Manage Product Categories
              </span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0 mt-0.5">
                Organize casting categories and toggle active public status across your website catalog.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFormModal({ open: true, category: null })}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:brightness-110 shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>New Category</span>
            </button>
            <button className="inv-icon-btn" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Category KPIs Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 border-b border-neutral-200/60 dark:border-white/[0.06] bg-neutral-50/60 dark:bg-white/[0.01] shrink-0">
          <div className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#121520] flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Tag size={15} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-neutral-400">Total Categories</div>
              <div className="text-sm font-extrabold text-neutral-900 dark:text-white">{totalCategories}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#121520] flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Eye size={15} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-neutral-400">Active on Website</div>
              <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{activeCategories}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#121520] flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <EyeOff size={15} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-neutral-400">Hidden / Inactive</div>
              <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{hiddenCategories}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#121520] flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Boxes size={15} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-neutral-400">Products Mapped</div>
              <div className="text-sm font-extrabold text-purple-600 dark:text-purple-400">{totalMappedProducts}</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="px-6 py-3 border-b border-neutral-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-white dark:bg-[#0f121a]">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category name or slug..."
              className="w-full pl-9 pr-3 h-8 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#161a26] text-neutral-800 dark:text-white outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {(["All", "Active", "Hidden"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === s
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Success Notification */}
        {feedbackNotice && (
          <div className="mx-6 mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <Check size={14} />
            <span>{feedbackNotice}</span>
          </div>
        )}

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
        <div className="inv-modal__body flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-20 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={20} className="animate-spin text-orange-500" />
              <span>Loading categories...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-neutral-400 space-y-2">
              <FolderTree size={36} className="mx-auto opacity-30" />
              <p className="text-xs font-medium text-neutral-500">No categories found matching your filter.</p>
              <button
                type="button"
                onClick={() => { setSearch(""); setStatusFilter("All"); }}
                className="text-xs text-[var(--color-primary)] hover:underline font-bold cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] shadow-sm">
              <table className="w-full text-left border-collapse" style={{ minWidth: 700, tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "38%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>
                <thead>
                  <tr className="bg-neutral-50/80 dark:bg-white/[0.02] border-b border-neutral-200/80 dark:border-white/10">
                    <th className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 py-3.5 px-4 text-left">Category</th>
                    <th className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 py-3.5 px-3 text-left">Slug</th>
                    <th className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 py-3.5 px-3 text-left">Products</th>
                    <th className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 py-3.5 px-2 text-center">Order</th>
                    <th className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 py-3.5 px-3 text-left">Status</th>
                    <th className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-white/[0.04]">
                  {filtered.map((cat) => {
                    const cColor = catColor(cat.name);
                    const stats = categoryProductStats.get(cat.name.trim().toLowerCase()) ?? { total: 0, active: 0 };

                    return (
                      <tr
                        key={cat.id}
                        className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Category Info */}
                        <td className="py-3 px-4 align-middle" style={{ overflow: "hidden" }}>
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 font-bold text-xs shadow-xs border"
                              style={{ background: cColor.bg, color: cColor.fg, borderColor: cColor.border }}
                            >
                              <FolderTree size={16} />
                            </span>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <div className="text-[13px] font-bold text-neutral-900 dark:text-white truncate">{cat.name}</div>
                              {cat.description ? (
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5 leading-tight">{cat.description}</div>
                              ) : (
                                <div className="text-[11px] text-neutral-400/50 italic truncate mt-0.5">No description set</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Slug */}
                        <td className="py-3 px-3 align-middle" style={{ overflow: "hidden" }}>
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5 truncate max-w-full">
                            <span className="text-neutral-400 opacity-60">/</span>{cat.slug || "—"}
                          </span>
                        </td>

                        {/* Products Count */}
                        <td className="py-3 px-3 align-middle">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100/90 dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                            <Boxes size={13} className="text-orange-500 shrink-0" />
                            <span>{stats.total}</span>
                            <span className="text-[10px] font-normal text-neutral-400 uppercase tracking-wider">
                              {stats.total === 1 ? "Product" : "Products"}
                            </span>
                          </div>
                        </td>

                        {/* Display Order */}
                        <td className="py-3 px-2 align-middle text-center">
                          <div className="flex items-center justify-center">
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200/70 dark:border-white/10 font-mono text-xs font-bold text-neutral-600 dark:text-neutral-400">
                              <Hash size={10} className="text-neutral-400" />
                              <span>{cat.displayOrder}</span>
                            </span>
                          </div>
                        </td>

                        {/* Single Unified Category Status Switch */}
                        <td className="py-3 px-3 align-middle">
                          <button
                            type="button"
                            onClick={() => void toggleCategoryStatus(cat)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border transition-all cursor-pointer whitespace-nowrap ${
                              cat.isVisible
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25 shadow-xs"
                                : "bg-neutral-500/10 text-neutral-500 dark:text-neutral-400 border-neutral-300 dark:border-white/10 hover:bg-neutral-500/20"
                            }`}
                            title={`Click to switch between Active (Live) and Inactive (Hidden)`}
                          >
                            <span className={`w-2 h-2 rounded-full ${cat.isVisible ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`} />
                            <span>{cat.isVisible ? "Active" : "Inactive"}</span>
                          </button>
                        </td>

                        {/* Row Action Buttons */}
                        <td className="py-3 px-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setFormModal({ open: true, category: cat })}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 hover:shadow-xs transition-all cursor-pointer"
                              title="Edit Category"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(cat)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-400 hover:border-red-500/40 hover:text-red-500 hover:bg-red-500/5 hover:shadow-xs transition-all cursor-pointer"
                              title="Delete Category"
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
        </div>

        {/* Modal Foot */}
        <div className="inv-modal__foot shrink-0 flex items-center justify-between text-xs text-neutral-400 bg-white/90 dark:bg-[#0f121a]/90 backdrop-blur-xl border-t border-neutral-200/80 dark:border-white/10 px-6 py-3.5">
          <span className="font-mono">{categories.length} total categories registered</span>
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
