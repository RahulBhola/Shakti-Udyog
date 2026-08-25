import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, type AdminCategory, type ProductMasterListItem } from "../../../api/adminApi";
import { ConfirmDialog } from "../ConfirmDialog";
import {
  FolderTree, Plus, Search, Eye, EyeOff,
  Pencil, Trash2, X, AlertCircle,
  RefreshCw, Boxes, Tag, Check, Hash, ArrowLeft,
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

  // View state: 'list' (Category List) or 'form' (Create / Edit Form in RHS Panel)
  const [activeView, setActiveView] = useState<"list" | "form">("list");
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formIsVisible, setFormIsVisible] = useState(true);
  const [savingForm, setSavingForm] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

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
      setActiveView("list");
    }
  }, [open, loadData]);

  // Open Edit form in RHS panel
  const handleOpenEdit = (cat: AdminCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug ?? "");
    setFormDescription(cat.description ?? "");
    setFormParentId(cat.parentId ?? "");
    setFormDisplayOrder(cat.displayOrder ?? 0);
    setFormIsVisible(cat.isVisible ?? true);
    setFormErr(null);
    setActiveView("form");
  };

  // Open Create form in RHS panel
  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormParentId("");
    setFormDisplayOrder(categories.length + 1);
    setFormIsVisible(true);
    setFormErr(null);
    setActiveView("form");
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory && !formSlug) {
      setFormSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  // Save Category (Create or Update)
  const handleSaveForm = async () => {
    if (!formName.trim()) {
      setFormErr("Category name is required.");
      return;
    }
    setSavingForm(true);
    setFormErr(null);
    try {
      const payload = {
        name: formName.trim(),
        slug: formSlug.trim() || undefined,
        description: formDescription.trim() || undefined,
        parentId: formParentId || undefined,
        displayOrder: Number(formDisplayOrder) || 0,
        isVisible: formIsVisible,
      };

      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, payload);
        setFeedbackNotice(`Category "${formName.trim()}" updated successfully.`);
      } else {
        await adminApi.createCategory(payload as any);
        setFeedbackNotice(`Category "${formName.trim()}" created successfully.`);
      }

      setTimeout(() => setFeedbackNotice(null), 3000);
      loadData();
      onCategoriesChanged?.();
      setActiveView("list");
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : "Could not save category.");
    } finally {
      setSavingForm(false);
    }
  };

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
    <>
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Right-Hand Side (RHS) Drawer */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-white dark:bg-[#0c0f17] border-l border-neutral-200 dark:border-white/10 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================================= */}
        {/* VIEW 1: CATEGORY LIST (Full Height, Smooth Scrolling)            */}
        {/* ================================================================= */}
        {activeView === "list" && (
          <>
            {/* Header */}
            <div className="shrink-0 bg-white/95 dark:bg-[#0f121a]/95 backdrop-blur-xl border-b border-neutral-200/80 dark:border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm">
                  <FolderTree size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-neutral-900 dark:text-white">
                      Category Manager
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                      {categories.length}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0 mt-0.5">
                    Configure casting product categories and website visibility.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:brightness-110 shadow-sm shadow-orange-500/20 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>New Category</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close Drawer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-6 py-3 border-b border-neutral-200/60 dark:border-white/[0.06] bg-neutral-50/60 dark:bg-white/[0.01] shrink-0">
              <div className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#121520] flex items-center gap-2.5 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Tag size={13} />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-neutral-400">Total</div>
                  <div className="text-sm font-extrabold text-neutral-900 dark:text-white">{totalCategories}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#121520] flex items-center gap-2.5 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Eye size={13} />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-neutral-400">Active Live</div>
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{activeCategories}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#121520] flex items-center gap-2.5 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <EyeOff size={13} />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-neutral-400">Hidden</div>
                  <div className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{hiddenCategories}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-white/[0.06] bg-white dark:bg-[#121520] flex items-center gap-2.5 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <Boxes size={13} />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-neutral-400">Products</div>
                  <div className="text-sm font-extrabold text-purple-600 dark:text-purple-400">{totalMappedProducts}</div>
                </div>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="px-6 py-3 border-b border-neutral-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-white dark:bg-[#0f121a]">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search category or slug..."
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

            {/* Toast Feedback */}
            {feedbackNotice && (
              <div className="mx-6 mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 shrink-0">
                <Check size={14} />
                <span>{feedbackNotice}</span>
              </div>
            )}

            {/* Error Notification */}
            {actionErr && (
              <div className="mx-6 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{actionErr}</span>
                </div>
                <button onClick={() => setActionErr(null)} className="text-red-400 hover:text-red-600">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Scrollable Category Cards List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
              {loading ? (
                <div className="py-24 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={22} className="animate-spin text-orange-500" />
                  <span>Loading all categories...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-24 text-center text-neutral-400 space-y-2">
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
                <div className="space-y-2.5">
                  {filtered.map((cat) => {
                    const cColor = catColor(cat.name);
                    const stats = categoryProductStats.get(cat.name.trim().toLowerCase()) ?? { total: 0, active: 0 };

                    return (
                      <div
                        key={cat.id}
                        className="p-3.5 sm:p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-[#121520] hover:border-orange-500/30 dark:hover:border-orange-500/30 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        {/* Left: Category Icon & Metadata */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-xs"
                            style={{ background: cColor.bg, color: cColor.fg, borderColor: cColor.border }}
                          >
                            <FolderTree size={18} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                                {cat.name}
                              </span>
                              <span className="inline-flex items-center font-mono text-[11px] font-medium text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5 shrink-0">
                                <span className="opacity-50 mr-0.5">/</span>{cat.slug || "—"}
                              </span>
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5 font-mono text-[11px] font-bold text-neutral-600 dark:text-neutral-400 shrink-0" title="Display Order Position">
                                <Hash size={10} className="text-neutral-400" />
                                <span>{cat.displayOrder}</span>
                              </span>
                            </div>

                            <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                              {cat.description ? (
                                <span>{cat.description}</span>
                              ) : (
                                <span className="text-neutral-400/60 italic">No description provided</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Product Count, Status Switch & Action Buttons */}
                        <div className="flex items-center gap-2.5 shrink-0 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-white/5">
                          {/* Product Count */}
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100/90 dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                            <Boxes size={13} className="text-orange-500 shrink-0" />
                            <span>{stats.total} {stats.total === 1 ? "Product" : "Products"}</span>
                          </div>

                          {/* Status Toggle */}
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

                          {/* Row Action Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cat)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 hover:shadow-xs transition-all cursor-pointer"
                              title="Edit Category"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(cat)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200/80 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-neutral-400 hover:border-red-500/40 hover:text-red-500 hover:bg-red-500/5 hover:shadow-xs transition-all cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-between text-xs text-neutral-400 bg-white/95 dark:bg-[#0f121a]/95 backdrop-blur-xl border-t border-neutral-200/80 dark:border-white/10 px-6 py-3.5">
              <span className="font-mono">{categories.length} total categories registered</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: CATEGORY FORM (Create / Edit View in RHS Drawer)          */}
        {/* ================================================================= */}
        {activeView === "form" && (
          <div className="flex flex-col h-full">
            {/* Header with Back Button */}
            <div className="shrink-0 bg-white/95 dark:bg-[#0f121a]/95 backdrop-blur-xl border-b border-neutral-200/80 dark:border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveView("list")}
                  className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Back to Categories"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white m-0">
                    {editingCategory ? `Edit "${editingCategory.name}"` : "Create New Category"}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0 mt-0.5">
                    {editingCategory ? "Update category details and publication status." : "Add a new product category to your casting catalogue."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveView("list")}
                className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Cancel & return to list"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
              {formErr && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formErr}</span>
                </div>
              )}

              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Precision Mechanism"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#161a26] text-neutral-900 dark:text-white outline-none focus:border-orange-500 shadow-xs"
                  autoFocus
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  URL Route Slug
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-neutral-400">/</span>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="precision-mechanism"
                    className="w-full pl-7 pr-3.5 py-2.5 text-xs font-mono rounded-xl border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#161a26] text-neutral-900 dark:text-white outline-none focus:border-orange-500 shadow-xs"
                  />
                </div>
                <span className="block text-[11px] text-neutral-400 mt-1">
                  Used in website navigation and public catalog filtering links.
                </span>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of castings in this category..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#161a26] text-neutral-900 dark:text-white outline-none focus:border-orange-500 resize-none shadow-xs"
                />
              </div>

              {/* Parent Category & Display Order Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Parent Category
                  </label>
                  <select
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#161a26] text-neutral-900 dark:text-white outline-none focus:border-orange-500 shadow-xs"
                  >
                    <option value="">Root (Top Level)</option>
                    {categories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Display Order (Priority)
                  </label>
                  <input
                    type="number"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-neutral-300 dark:border-white/10 bg-white dark:bg-[#161a26] text-neutral-900 dark:text-white outline-none focus:border-orange-500 shadow-xs"
                  />
                  <span className="block text-[10px] text-neutral-400">1 = First position on website</span>
                </div>
              </div>

              {/* Category Visibility Setting */}
              <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.02]">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                      Active Status (Live on Public Website)
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mt-0.5">
                      When active, this category and its products appear in the public catalog.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsVisible}
                    onChange={(e) => setFormIsVisible(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 shrink-0 ml-3"
                  />
                </label>
              </div>
            </div>

            {/* Form Footer */}
            <div className="shrink-0 flex items-center justify-between border-t border-neutral-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0f121a]/95 backdrop-blur-xl px-8 py-4">
              <button
                type="button"
                onClick={() => setActiveView("list")}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 font-bold text-xs hover:bg-neutral-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                disabled={savingForm}
              >
                Cancel & Return
              </button>

              <button
                type="button"
                onClick={() => void handleSaveForm()}
                disabled={savingForm}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:brightness-110 shadow-sm shadow-orange-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {savingForm ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>{editingCategory ? "Update Category" : "Create Category"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

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
    </>
  );
}
