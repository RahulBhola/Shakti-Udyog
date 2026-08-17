import { useCallback, useEffect, useMemo, useState, type ReactNode, type CSSProperties } from "react";
import { adminApi, type AdminCategory, type AdminProduct } from "../../api/adminApi";
import { Loading } from "../../components/ui";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  Tag, Eye, EyeOff, Package, Clock, Plus, Upload, Search, RefreshCw,
  ChevronLeft, ChevronRight, X, MoreVertical, Filter, Pencil, Trash2,
  Folder, FolderTree,
} from "lucide-react";
import "./erpListView.css";

const STATUS_FILTERS = ["All", "Visible", "Hidden"];
const SORTS = ["Display Order", "Recently Updated", "Alphabetical"];
const PAGE_SIZES = [10, 20, 50];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const CAT_COLORS: Record<string, { bg: string; fg: string }> = {
  "Grey Iron Castings": { bg: "rgba(37,99,235,0.15)", fg: "#3B82F6" },
  "Ductile Iron Castings": { bg: "rgba(20,184,166,0.15)", fg: "#14B8A6" },
  "SG Iron Castings": { bg: "rgba(245,158,11,0.15)", fg: "#F59E0B" },
  "Machined Components": { bg: "rgba(124,58,237,0.15)", fg: "#8B5CF6" },
  "Custom Castings": { bg: "rgba(236,72,153,0.15)", fg: "#EC4899" },
};
const DEFAULT_COLOR = { bg: "rgba(148,163,184,0.15)", fg: "#94A3B8" };

function catColor(name: string) {
  return CAT_COLORS[name] ?? DEFAULT_COLOR;
}

function CategoryIcon({ name }: { name: string }) {
  const c = catColor(name);
  return (
    <span className="inv-avatar" style={{ background: c.bg, color: c.fg }}>
      <Folder size={16} />
    </span>
  );
}

function StatusBadge({ visible }: { visible: boolean }) {
  return visible
    ? <span className="inv-badge inv-badge--green"><span className="inv-dot" /> Visible</span>
    : <span className="inv-badge inv-badge--gray"><span className="inv-dot" /> Hidden</span>;
}

interface Filters {
  search: string;
  status: string;
  parent: string;
  sort: string;
}
const EMPTY_FILTERS: Filters = { search: "", status: "All", parent: "All", sort: "Display Order" };

/* ------------------------------------------------------------------ */
/*  Create / Edit modal                                                */
/* ------------------------------------------------------------------ */

function CategoryModal({
  category, parents, onClose, onSaved,
}: {
  category: AdminCategory | null;
  parents: AdminCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!category;
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [parentId, setParentId] = useState(category?.parentId ?? "");
  const [displayOrder, setDisplayOrder] = useState(category?.displayOrder ?? 0);
  const [isVisible, setIsVisible] = useState(category?.isVisible ?? true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) { setErr("Category name is required."); return; }
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
      if (isEdit && category) await adminApi.updateCategory(category.id, payload);
      else await adminApi.createCategory(payload as any);
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save category.");
      setSaving(false);
    }
  };

  return (
    <div className="inv-modal-backdrop" onClick={onClose}>
      <div className="inv-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="inv-modal__head">
          <span className="inv-modal__title">{isEdit ? "Edit Category" : "New Category"}</span>
          <button className="inv-icon-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className="inv-modal__body">
          <div className="inv-form-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div className="inv-form-field">
              <label className="inv-form-label">Name</label>
              <input className="inv-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grey Iron Castings" />
            </div>
            <div className="inv-form-field">
              <label className="inv-form-label">Slug</label>
              <input className="inv-input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="grey-iron-castings" />
            </div>
            <div className="inv-form-field">
              <label className="inv-form-label">Parent Category</label>
              <select className="inv-select" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">Root Category</option>
                {parents.filter((p) => !category || p.id !== category.id).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="inv-form-field">
              <label className="inv-form-label">Display Order</label>
              <input className="inv-input" type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} />
            </div>
            <div className="inv-form-field">
              <label className="inv-toggle">
                <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
                <span className="inv-form-label">Visible on public site</span>
              </label>
            </div>
          </div>
          {err && <div style={{ color: "var(--color-danger)", fontSize: 13 }}>{err}</div>}
        </div>
        <div className="inv-modal__foot">
          <button className="inv-btn" onClick={onClose}>Cancel</button>
          <button className="inv-btn inv-btn--primary" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminCategoryPage() {
  const [categories, setCategories] = useState<AdminCategory[] | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openMenu, setOpenMenu] = useState<{ id: string; dir: "up" | "down" } | null>(null);
  const [modal, setModal] = useState<{ open: boolean; category: AdminCategory | null }>({ open: false, category: null });
  const [confirmDelete, setConfirmDelete] = useState<AdminCategory | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi.categories()
      .then(setCategories)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    adminApi.products().then(setProducts).catch(() => {});
  }, []);

  // Close the row menu on outside click
  useEffect(() => {
    if (!openMenu) return;
    const onDown = () => setOpenMenu(null);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  useEffect(() => { setPage(1); }, [applied, pageSize]);

  const productCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      if (p.categoryId) counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const parentName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories ?? []) map.set(c.id, c.name);
    return map;
  }, [categories]);

  const parentOptions = useMemo(() => {
    if (!categories) return [] as string[];
    return Array.from(new Set(categories.filter((c) => c.parentId).map((c) => parentName.get(c.parentId!) ?? "").filter(Boolean))).sort();
  }, [categories, parentName]);

  const filtered = useMemo(() => {
    const list = categories ?? [];
    const q = applied.search.trim().toLowerCase();
    let result = list.filter((c) => {
      if (q && !(c.name.toLowerCase().includes(q) || (c.slug ?? "").toLowerCase().includes(q))) return false;
      if (applied.status === "Visible" && !c.isVisible) return false;
      if (applied.status === "Hidden" && c.isVisible) return false;
      if (applied.parent !== "All" && (parentName.get(c.parentId ?? "") ?? "") !== applied.parent) return false;
      return true;
    });
    if (applied.sort === "Alphabetical") result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    else result = [...result].sort((a, b) => a.displayOrder - b.displayOrder);
    return result;
  }, [categories, applied, parentName]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const total = categories?.length ?? 0;
  const visible = categories?.filter((c) => c.isVisible).length ?? 0;
  const hidden = total - visible;
  const hasFilters = applied.search !== "" || applied.status !== "All" || applied.parent !== "All";

  const clearFilters = () => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPage(1); };

  const doDelete = async (c: AdminCategory) => {
    try {
      await adminApi.deleteCategory(c.id);
      setOpenMenu(null);
      load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not delete category");
    }
  };

  const kpis = [
    { label: "Total Categories", value: total, hint: "All categories", icon: Tag, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", glow: "rgba(59,130,246,0.25)" },
    { label: "Visible Categories", value: visible, hint: "Shown on the site", icon: Eye, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", glow: "rgba(34,197,94,0.22)" },
    { label: "Hidden Categories", value: hidden, hint: "Not published", icon: EyeOff, color: "var(--kpi-orange)", bg: "var(--kpi-orange-bg)", glow: "rgba(249,115,22,0.22)" },
    { label: "Products", value: products.length, hint: "Across all categories", icon: Package, color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)", glow: "rgba(167,139,250,0.22)" },
    { label: "Last Updated", value: "—", hint: "Latest category change", icon: Clock, color: "var(--kpi-teal)", bg: "var(--kpi-teal-bg)", glow: "rgba(20,184,166,0.22)" },
  ];

  const renderRow = (c: AdminCategory) => {
    const count = productCounts.get(c.id) ?? 0;
    const parent = c.parentId ? parentName.get(c.parentId) ?? "—" : "Root Category";
    return (
      <tr key={c.id}>
        <td>
          <div className="inv-customer">
            <CategoryIcon name={c.name} />
            <div>
              <div className="inv-customer__name">{c.name}</div>
            </div>
          </div>
        </td>
        <td><div className="inv-sub" style={{ marginTop: 0 }}>{c.slug ?? "—"}</div></td>
        <td>
          <div className="inv-date">{parent}</div>
        </td>
        <td>
          <span className="inv-badge inv-badge--blue">{count} {count === 1 ? "Product" : "Products"}</span>
        </td>
        <td><StatusBadge visible={c.isVisible} /></td>
        <td><div className="inv-date">{c.displayOrder}</div></td>
        <td><div className="inv-sub" style={{ marginTop: 0 }}>—</div></td>
        <td>
          <div className="inv-actions" onClick={(e) => e.stopPropagation()}>
            <button className="inv-icon-btn" title="Edit" aria-label="Edit" onClick={() => setModal({ open: true, category: c })}>
              <Pencil size={16} />
            </button>
            <div className="inv-menu-wrap" onMouseDown={(e) => e.stopPropagation()}>
              <button className="inv-icon-btn" title="More" aria-label="More actions"
                aria-expanded={openMenu?.id === c.id}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const dir = window.innerHeight - rect.bottom < 220 ? "up" : "down";
                  setOpenMenu((m) => (m && m.id === c.id ? null : { id: c.id, dir }));
                }}>
                <MoreVertical size={16} />
              </button>
              {openMenu?.id === c.id && (
                <div className={`inv-menu ${openMenu.dir === "up" ? "inv-menu--up" : ""}`}>
                  <button className="inv-menu__item" onClick={() => { setOpenMenu(null); setModal({ open: true, category: c }); }}>
                    <Pencil size={15} /> Edit
                  </button>
                  <div className="inv-menu__divider" />
                  <button className="inv-menu__item inv-menu__item--danger" onClick={() => { setOpenMenu(null); setConfirmDelete(c); }}>
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="inv-page">
      {/* Header */}
      <div className="inv-header">
        <div>
          <div className="breadcrumb"><span>Admin / Categories</span></div>
          <h1 className="inv-header__title">Categories</h1>
          <p className="inv-header__subtitle">Manage product categories used throughout the casting catalog.</p>
        </div>
        <div className="inv-header__actions">
          <button className="inv-btn" title="Import from CSV (not yet available)" disabled>
            <Upload size={16} /> Import Categories
          </button>
          <button className="inv-btn inv-btn--primary" onClick={() => setModal({ open: true, category: null })}>
            <Plus size={16} /> New Category
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="inv-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="inv-kpi"
            style={{ "--inv-kpi-color": k.color, "--inv-kpi-bg": k.bg, "--inv-kpi-glow": k.glow } as CSSProperties}>
            <span className="inv-kpi__icon"><k.icon size={20} /></span>
            <span className="inv-kpi__value">{k.value}</span>
            <span className="inv-kpi__label">{k.label}</span>
            <span className="inv-kpi__hint">{k.hint}</span>
          </div>
        ))}
      </div>

      {/* Search & filter bar */}
      <div className="inv-filterbar">
        <div className="inv-field" style={{ flex: "1 1 220px" }}>
          <label className="inv-field__label">Search</label>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input className="inv-input" style={{ paddingLeft: 32 }} type="search" value={draft.search}
              placeholder="Search category..." aria-label="Search categories"
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))} />
          </div>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Status</label>
          <select className="inv-select" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Parent Category</label>
          <select className="inv-select" value={draft.parent} onChange={(e) => setDraft((d) => ({ ...d, parent: e.target.value }))}>
            <option value="All">All</option>
            {parentOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Sort</label>
          <select className="inv-select" value={draft.sort} onChange={(e) => setDraft((d) => ({ ...d, sort: e.target.value }))}>
            {SORTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button className="inv-btn" title="Reset filters" onClick={clearFilters}>
          <X size={14} /> Reset
        </button>
        <button className="inv-btn inv-btn--primary" onClick={() => { setApplied(draft); setPage(1); }}>
          <Filter size={15} /> Filter
        </button>
        <button className="inv-btn inv-btn--icon" title="Refresh" aria-label="Refresh" onClick={load}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Loading / error / empty */}
      {error && <div className="inv-status" style={{ color: "var(--color-danger)" }}>{error}</div>}
      {!error && loading && !categories && <div className="inv-status"><Loading label="Loading categories" /></div>}
      {!error && categories && filtered.length === 0 && (
        <div className="inv-status">
          <FolderTree size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <div>{hasFilters ? "No categories match the current filters." : "No categories found."}</div>
        </div>
      )}

      {/* Table */}
      {!error && categories && paged.length > 0 && (
        <div className="inv-table-wrap">
          <div className="inv-scroll">
            <table className="inv-table">
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "6%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Parent Category</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Display Order</th>
                  <th>Updated</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c) => renderRow(c))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="inv-pagination">
        <span className="inv-pagination__info">
          {categories ? `Showing ${filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length} Categories` : ""}
        </span>

        <div className="inv-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <label className="inv-field__label" style={{ margin: 0 }}>Rows</label>
          <select className="inv-select" style={{ width: "auto", padding: "7px 34px 7px 10px" }}
            value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <button className="inv-page-btn" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
          .reduce<ReactNode[]>((acc, n, idx, arr) => {
            if (idx > 0 && n - arr[idx - 1] > 1) acc.push(<span key={`e${n}`} style={{ color: "var(--text-muted)", padding: "0 2px" }}>…</span>);
            acc.push(
              <button key={n} className={`inv-page-btn ${n === safePage ? "inv-page-btn--active" : ""}`}
                onClick={() => setPage(n)}>{n}</button>,
            );
            return acc;
          }, [])}

        <button className="inv-page-btn" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* New / Edit modal */}
      {modal.open && (
        <CategoryModal
          category={modal.category}
          parents={categories ?? []}
          onClose={() => setModal({ open: false, category: null })}
          onSaved={() => load()}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this category?"
        message={confirmDelete
          ? `"${confirmDelete.name}" will be deleted.\nProducts will be unassigned and sub-categories moved to root.`
          : ""}
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          const c = confirmDelete;
          setConfirmDelete(null);
          if (c) void doDelete(c);
        }}
      />
    </div>
  );
}
