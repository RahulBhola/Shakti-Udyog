import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, type AdminCategory, type ProductMasterListItem } from "../../../api/adminApi";
import { ConfirmDialog } from "../ConfirmDialog";
import {
  Folder, FolderTree, Plus, Search, Eye, EyeOff,
  Pencil, Trash2, X, AlertCircle,
  Power, Layers, RefreshCw, Boxes, Tag,
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
              <p className="text-[11px] text-neutral-500 m-0">Set category name, slug, order, and public visibility.</p>
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
                <span className="text-xs font-bold text-neutral-900 dark:text-white block">Public Website Visibility</span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mt-0.5">
                  When enabled, this category and its active products appear in the public catalog.
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
  const [statusFilter, setStatusFilter] = useState<"All" | "Visible" | "Hidden">("All");
  const [formModal, setFormModal] = useState<{ open: boolean; category: AdminCategory | null }>({
    open: false,
    category: null,
  });
  const [confirmDelete, setConfirmDelete] = useState<AdminCategory | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Category bulk status confirmation dialog state
  const [bulkStatusPrompt, setBulkStatusPrompt] = useState<{
    open: boolean;
    category: AdminCategory | null;
    targetStatus: "Active" | "Inactive" | "Draft";
    productCount: number;
  }>({
    open: false,
    category: null,
    targetStatus: "Active",
    productCount: 0,
  });
  const [bulkProcessing, setBulkProcessing] = useState(false);

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
    const map = new Map<string, { total: number; active: number; draft: number; inactive: number; archived: number }>();
    for (const p of products) {
      if (p.categoryName) {
        const key = p.categoryName.trim().toLowerCase();
        const cur = map.get(key) ?? { total: 0, active: 0, draft: 0, inactive: 0, archived: 0 };
        cur.total += 1;
        const st = p.status?.toLowerCase();
        if (p.isArchived || st === "archived") cur.archived += 1;
        else if (st === "active") cur.active += 1;
        else if (st === "draft") cur.draft += 1;
        else cur.inactive += 1;
        map.set(key, cur);
      }
    }
    return map;
  }, [products]);

  // Overall category KPIs
  const totalCategories = categories.length;
  const visibleCategories = categories.filter((c) => c.isVisible).length;
  const hiddenCategories = categories.filter((c) => !c.isVisible).length;
  const totalMappedProducts = products.length;

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
    const newVisibility = !cat.isVisible;
    // Optimistic update in UI
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, isVisible: newVisibility } : c))
    );

    try {
      await adminApi.updateCategory(cat.id, {
        name: cat.name,
        slug: cat.slug ?? undefined,
        description: cat.description ?? undefined,
        parentId: cat.parentId ?? undefined,
        displayOrder: cat.displayOrder,
        isVisible: newVisibility,
      });
      onCategoriesChanged?.();
    } catch (e) {
      // Revert optimistic update
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isVisible: cat.isVisible } : c))
      );
      setActionErr(e instanceof Error ? e.message : "Failed to update category visibility.");
    }
  };

  const handleBulkStatusConfirm = async () => {
    if (!bulkStatusPrompt.category) return;
    setBulkProcessing(true);
    try {
      await adminApi.setCategoryProductsStatus(bulkStatusPrompt.category.id, bulkStatusPrompt.targetStatus);
      setBulkStatusPrompt({ open: false, category: null, targetStatus: "Active", productCount: 0 });
      loadData();
      onCategoriesChanged?.();
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Failed to update category products status.");
    } finally {
      setBulkProcessing(false);
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
        onClick={(e) => {
          e.stopPropagation();
          setOpenActionMenuId(null);
        }}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 960, width: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="inv-modal__head shrink-0 bg-white/80 dark:bg-[#0f121a]/80 backdrop-blur-xl border-b border-neutral-200/80 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm">
              <FolderTree size={20} />
            </div>
            <div>
              <span className="inv-modal__title text-lg font-bold text-neutral-900 dark:text-white">
                Manage Product Categories
              </span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0 mt-0.5">
                Organize casting categories, toggle public catalog visibility, and bulk manage product statuses.
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 border-b border-neutral-200/60 dark:border-white/[0.06] bg-neutral-50/50 dark:bg-white/[0.01] shrink-0">
          <div className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#121520] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Tag size={15} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-neutral-400">Total Categories</div>
              <div className="text-sm font-extrabold text-neutral-900 dark:text-white">{totalCategories}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#121520] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Eye size={15} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-neutral-400">Publicly Visible</div>
              <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{visibleCategories}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#121520] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <EyeOff size={15} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-neutral-400">Hidden / Draft</div>
              <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{hiddenCategories}</div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#121520] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Boxes size={15} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-neutral-400">Total Products Mapped</div>
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
            {(["All", "Visible", "Hidden"] as const).map((s) => (
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
            <div className="py-20 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={20} className="animate-spin text-orange-500" />
              <span>Loading categories...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-neutral-400 space-y-2">
              <Folder size={36} className="mx-auto opacity-30" />
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
            <table className="inv-table w-full" style={{ tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "32%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ width: "32%" }}>Category</th>
                  <th style={{ width: "20%" }}>Slug</th>
                  <th style={{ width: "20%" }}>Category Products</th>
                  <th style={{ width: "7%" }}>Order</th>
                  <th style={{ width: "13%" }}>Web Visibility</th>
                  <th style={{ width: "8%", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => {
                  const cColor = catColor(cat.name);
                  const stats = categoryProductStats.get(cat.name.trim().toLowerCase()) ?? { total: 0, active: 0, draft: 0, inactive: 0, archived: 0 };
                  const isActionMenuOpen = openActionMenuId === cat.id;

                  return (
                    <tr key={cat.id}>
                      <td style={{ overflow: "hidden", maxWidth: 0 }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0 font-bold text-xs shadow-sm"
                            style={{ background: cColor.bg, color: cColor.fg }}
                          >
                            <Folder size={15} />
                          </span>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">{cat.name}</div>
                            {cat.description ? (
                              <div className="text-[11px] text-neutral-400 truncate mt-0.5">{cat.description}</div>
                            ) : (
                              <div className="text-[10px] text-neutral-400/60 italic truncate mt-0.5">No description set</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ overflow: "hidden", maxWidth: 0 }}>
                        <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 block truncate px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/5 w-fit max-w-full">
                          {cat.slug || "—"}
                        </span>
                      </td>

                      {/* Category-wise Product Activation / Deactivation Column */}
                      <td>
                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(isActionMenuOpen ? null : cat.id);
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                                stats.total === 0
                                  ? "bg-neutral-100 dark:bg-white/5 text-neutral-400 border-neutral-200/60 dark:border-white/5"
                                  : stats.active === stats.total
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                  : stats.active > 0
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                              }`}
                              title="Click to manage product statuses in this category"
                            >
                              <Layers size={12} />
                              <span>{stats.total} {stats.total === 1 ? "Product" : "Products"}</span>
                              {stats.total > 0 && (
                                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${stats.active > 0 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300" : "bg-neutral-500/20 text-neutral-500"}`}>
                                  {stats.active} Active
                                </span>
                              )}
                            </button>
                          </div>

                          {/* Quick Category-wise Product Status Menu */}
                          {isActionMenuOpen && (
                            <div
                              className="absolute left-0 top-full mt-1.5 w-52 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#161a26] shadow-2xl p-1.5 z-40 flex flex-col gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-400 border-b border-neutral-100 dark:border-white/5">
                                Category Products ({stats.total})
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  setBulkStatusPrompt({
                                    open: true,
                                    category: cat,
                                    targetStatus: "Active",
                                    productCount: stats.total,
                                  });
                                }}
                                disabled={stats.total === 0}
                                className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg text-left font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <Power size={13} className="text-emerald-500" />
                                <span>Activate All Products</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  setBulkStatusPrompt({
                                    open: true,
                                    category: cat,
                                    targetStatus: "Inactive",
                                    productCount: stats.total,
                                  });
                                }}
                                disabled={stats.total === 0}
                                className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg text-left font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <EyeOff size={13} className="text-amber-500" />
                                <span>Deactivate All Products</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  setBulkStatusPrompt({
                                    open: true,
                                    category: cat,
                                    targetStatus: "Draft",
                                    productCount: stats.total,
                                  });
                                }}
                                disabled={stats.total === 0}
                                className="flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg text-left font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <Tag size={13} />
                                <span>Set All to Draft</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="font-mono text-xs text-neutral-500">{cat.displayOrder}</span>
                      </td>

                      {/* Interactive Website Visibility Toggle */}
                      <td>
                        <button
                          type="button"
                          onClick={() => void toggleVisibility(cat)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border transition-all cursor-pointer ${
                            cat.isVisible
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/10"
                              : "bg-neutral-500/15 text-neutral-500 dark:text-neutral-400 border-neutral-400/30 hover:bg-neutral-500/25"
                          }`}
                          title={`Click to ${cat.isVisible ? "Hide from" : "Show on"} public website`}
                        >
                          <span className={`w-2 h-2 rounded-full ${cat.isVisible ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`} />
                          <span>{cat.isVisible ? "Visible" : "Hidden"}</span>
                        </button>
                      </td>

                      {/* Row Action Buttons */}
                      <td style={{ textAlign: "right" }}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setFormModal({ open: true, category: cat })}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                            title="Edit Category"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(cat)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
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
        <div className="inv-modal__foot shrink-0 flex items-center justify-between text-xs text-neutral-400 bg-white/80 dark:bg-[#0f121a]/80 backdrop-blur-xl border-t border-neutral-200/80 dark:border-white/10">
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

      {/* Category-wise Products Status Bulk Confirmation Modal */}
      {bulkStatusPrompt.open && bulkStatusPrompt.category && (
        <div className="inv-modal-backdrop" onClick={() => setBulkStatusPrompt({ open: false, category: null, targetStatus: "Active", productCount: 0 })} style={{ zIndex: 1200 }}>
          <div
            className="inv-modal"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="inv-modal__body" style={{ alignItems: "center", textAlign: "center", padding: "28px 24px 16px" }}>
              <span
                className="inv-avatar"
                style={{
                  background: bulkStatusPrompt.targetStatus === "Active" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                  color: bulkStatusPrompt.targetStatus === "Active" ? "var(--color-success, #22c55e)" : "var(--color-warning, #f59e0b)",
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  marginBottom: 10,
                }}
              >
                <Power size={24} />
              </span>

              <div className="inv-modal__title" style={{ fontSize: 18, fontWeight: 700 }}>
                {bulkStatusPrompt.targetStatus === "Active" ? "Activate All Products?" : "Deactivate All Products?"}
              </div>

              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "8px 0 0", lineHeight: 1.55 }}>
                You are about to set <strong>{bulkStatusPrompt.productCount} product(s)</strong> in{" "}
                <strong>"{bulkStatusPrompt.category.name}"</strong> to <strong>{bulkStatusPrompt.targetStatus}</strong>.
                {bulkStatusPrompt.targetStatus === "Active"
                  ? " These products will immediately become visible to public website visitors if this category is visible."
                  : " These products will be hidden from the public catalogue."}
              </p>
            </div>

            <div className="inv-modal__foot" style={{ justifyContent: "center", gap: 10, padding: "16px 24px 24px" }}>
              <button
                className="inv-btn"
                disabled={bulkProcessing}
                onClick={() => setBulkStatusPrompt({ open: false, category: null, targetStatus: "Active", productCount: 0 })}
              >
                Cancel
              </button>
              <button
                className={`inv-btn ${bulkStatusPrompt.targetStatus === "Active" ? "inv-btn--primary" : "inv-btn--warning"}`}
                style={{ minWidth: 140 }}
                disabled={bulkProcessing}
                onClick={() => void handleBulkStatusConfirm()}
              >
                {bulkProcessing ? "Updating..." : `Yes, ${bulkStatusPrompt.targetStatus === "Active" ? "Activate All" : "Deactivate All"}`}
              </button>
            </div>
          </div>
        </div>
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
