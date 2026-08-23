import { useCallback, useEffect, useState, type ReactNode, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, type ProductMasterListItem, type ProductMasterStats } from "../../api/adminApi";
import type { Paged } from "../../api/customerApi";
import { Loading } from "../../components/ui";
import { tokenStorage } from "../../auth/tokenStorage";
import { config } from "../../config";
import ProductDrawer from "./products/ProductDrawer";
import { CategoryManagerModal } from "./products/CategoryManagerModal";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  Package, Plus, Download, Search, RefreshCw, Eye, MoreVertical,
  ChevronLeft, ChevronRight, X, Copy, Archive, Trash2, FileEdit,
  Boxes, CheckCircle2, Clock, Tag, TrendingDown, LayoutGrid, Table as TableIcon,
  Scale, FolderTree,
} from "lucide-react";
import "./erpListView.css";

const STATUS_FILTERS = ["All", "Active", "Draft", "Archived"];
const PAGE_SIZES = [8, 12, 24, 48];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

import { getThemedImage } from "../../utils/themeImage";

function useIsLightMode() {
  const [isLight, setIsLight] = useState(!document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(!document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isLight;
}

function statusTone(status: string): string {
  switch (status) {
    case "Active": return "green";
    case "Draft": return "orange";
    case "Archived": return "gray";
    default: return "gray";
  }
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`inv-badge inv-badge--${statusTone(status)}`}>{status}</span>;
}

function ProductThumb({ item }: { item: ProductMasterListItem }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const isLightMode = useIsLightMode();

  useEffect(() => {
    if (item.imageUrl || item.lightImageUrl) return;
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
  }, [item.id, item.firstAttachmentId, item.imageUrl, item.lightImageUrl]);

  const rawImage = isLightMode
    ? (item.lightImageUrl || (item.imageUrl ? getThemedImage(item.imageUrl, true) : null))
    : (item.imageUrl || (item.lightImageUrl ? getThemedImage(item.lightImageUrl, false) : null));

  const displaySrc = rawImage || blobUrl;

  if (displaySrc) {
    return (
      <img
        src={displaySrc}
        alt={item.productName}
        className="inv-avatar"
        style={{ objectFit: "contain", background: "var(--bg-surface-hover, rgba(0,0,0,0.03))", padding: "2px", borderRadius: "8px" }}
      />
    );
  }
  return <span className="inv-avatar" style={{ background: "var(--bg-surface-hover)" }}><Package size={16} /></span>;
}

/* ------------------------------------------------------------------ */
/*  Rich Product Card (Theme-Adaptive Light & Dark Modes)             */
/* ------------------------------------------------------------------ */

function AdminProductCard({
  product,
  onView,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  openMenuId,
  setOpenMenuId,
}: {
  product: ProductMasterListItem;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const isLightMode = useIsLightMode();
  const isDuctile = (product.material ?? "").toLowerCase().includes("ductile") || (product.materialGrade ?? "").startsWith("SG");

  useEffect(() => {
    if (product.imageUrl || product.lightImageUrl) return;
    if (!product.firstAttachmentId) return;
    let cancelled = false;
    (async () => {
      try {
        const token = tokenStorage.getAccessToken();
        const url = adminApi.productMaster.downloadAttachmentUrl(product.id, product.firstAttachmentId!);
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
  }, [product.id, product.firstAttachmentId, product.imageUrl, product.lightImageUrl]);

  const sourceImage = product.imageUrl || product.lightImageUrl;
  const rawImage = sourceImage ? getThemedImage(sourceImage, isLightMode) : null;

  const displayImg = rawImage || blobUrl;
  const isMenuOpen = openMenuId === product.id;

  return (
    <div
      onClick={onView}
      className="group relative flex flex-col justify-between rounded-2xl p-5 border transition-all duration-300 cursor-pointer overflow-visible bg-white dark:bg-[#0f121a] border-neutral-200/90 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:border-orange-400 dark:hover:border-orange-500/50 hover:shadow-[0_12px_28px_rgba(249,115,22,0.12)] hover:-translate-y-1"
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold uppercase border truncate ${
              isDuctile
                ? "bg-blue-500/10 text-blue-600 dark:text-sky-400 border-blue-500/30"
                : "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30"
            }`}
          >
            {product.materialGrade || product.material || "Cast Iron"}
          </span>

          <div className="flex items-center gap-2">
            {product.weight != null && (
              <div className="flex items-center gap-1 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                <Scale size={12} className="opacity-70" />
                <span>{product.weight} kg</span>
              </div>
            )}
            <StatusBadge status={product.status} />
          </div>
        </div>

        {/* 3D Studio Visual Stage */}
        <div
          className="relative w-full h-44 rounded-xl flex items-center justify-center p-3 overflow-hidden my-2 bg-gradient-to-b from-neutral-50 to-neutral-100/90 dark:from-[#161a26] dark:to-[#0d1017] border border-neutral-200/70 dark:border-white/[0.04]"
        >
          {displayImg ? (
            <img
              src={displayImg}
              alt={product.productName}
              loading="lazy"
              className="max-h-36 max-w-[90%] w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-105 filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_8px_16px_rgba(0,0,0,0.75)]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 gap-2">
              <Package size={36} className="opacity-40" />
              <span className="text-[11px] font-mono">No Image Uploaded</span>
            </div>
          )}

          {/* Code Overlay Pill */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/90 dark:bg-black/60 backdrop-blur-sm border border-neutral-200 dark:border-white/10 font-mono text-[10px] font-semibold text-neutral-800 dark:text-white/90 shadow-sm">
            {product.productCode}
          </div>
        </div>

        {/* Title & Category */}
        <div className="mt-3 space-y-1">
          <div className="text-[10.5px] font-mono font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {product.categoryName || "Uncategorized"}
          </div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
            {product.productName}
          </h3>
        </div>

        {/* Specification Attribute Pills Grid */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-white/[0.06] text-[11px] font-mono">
          <div className="p-2 rounded-lg bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/[0.04]">
            <span className="text-neutral-500 dark:text-neutral-400 block text-[9px] uppercase tracking-wider font-medium">Casting Type</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate block">
              {product.castingType || "Sand Casting"}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/80 dark:border-white/[0.04]">
            <span className="text-neutral-500 dark:text-neutral-400 block text-[9px] uppercase tracking-wider font-medium">Material</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate block">
              {product.material || "Grey / SG Iron"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div
        className="mt-4 pt-3 border-t border-neutral-100 dark:border-white/[0.06] flex items-center justify-between gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onView}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all bg-[var(--color-primary)] text-white hover:brightness-110 shadow-sm"
        >
          <Eye size={14} /> View Details
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center p-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 hover:bg-neutral-100 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 transition-all"
          title="Edit Product"
        >
          <FileEdit size={15} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenuId(isMenuOpen ? null : product.id)}
            className="inline-flex items-center justify-center p-2 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 hover:bg-neutral-100 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 transition-all"
            title="More Options"
          >
            <MoreVertical size={15} />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 bottom-full mb-1 w-36 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#161a24] shadow-2xl p-1 z-30 flex flex-col gap-0.5"
            >
              <button
                type="button"
                onClick={() => { setOpenMenuId(null); onDuplicate(); }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-lg text-left font-medium"
              >
                <Copy size={13} /> Duplicate
              </button>
              <button
                type="button"
                onClick={() => { setOpenMenuId(null); onArchive(); }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-lg text-left font-medium"
              >
                <Archive size={13} /> Archive
              </button>
              <div className="h-px bg-neutral-200 dark:bg-white/10 my-0.5" />
              <button
                type="button"
                onClick={() => { setOpenMenuId(null); onDelete(); }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg text-left font-medium"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                    */
/* ------------------------------------------------------------------ */

export default function AdminProductPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<Paged<ProductMasterListItem> | null>(null);
  const [stats, setStats] = useState<ProductMasterStats | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProductMasterListItem | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi.productMaster.list({
      page, pageSize,
      search: search || undefined,
      status: statusFilter === "All" ? undefined : statusFilter,
      categoryId: categoryFilter || undefined,
    })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, pageSize, search, statusFilter, categoryFilter]);

  const loadStats = useCallback(() => {
    adminApi.productMaster.stats().then(setStats).catch(() => { });
  }, []);
  const loadCategories = useCallback(() => {
    adminApi.categories().then((cats) => setCategories(cats.map((c: any) => ({ id: c.id, name: c.name })))).catch(() => { });
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter, pageSize]);

  // Close menus on click outside
  useEffect(() => {
    if (!openMenuId) return;
    const onDown = () => setOpenMenuId(null);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenuId]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
  const hasFilters = !!search || statusFilter !== "All" || !!categoryFilter;
  const clearFilters = () => { setSearchInput(""); setSearch(""); setStatusFilter("All"); setCategoryFilter(""); };

  const handleExport = () => {
    if (!data?.items.length) return;
    const headers = ["Product Name", "Code", "Category", "Casting Type", "Material", "Grade", "Weight (kg)", "Status", "Created"];
    const rows = data.items.map((r) => [
      r.productName, r.productCode, r.categoryName ?? "", r.castingType ?? "",
      r.material ?? "", r.materialGrade ?? "", r.weight != null ? String(r.weight) : "", r.status, r.createdAtUtc,
    ]);
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(esc).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateProduct = async (payload: Record<string, any>, files: File[]) => {
    const product = await adminApi.productMaster.create(payload);
    for (const file of files) await adminApi.productMaster.uploadAttachment(product.id, file);
    setDrawerOpen(false);
    load();
    loadStats();
  };

  const handleArchive = async (id: string) => { await adminApi.productMaster.archive(id); load(); loadStats(); };
  const handleDuplicate = async (id: string) => { await adminApi.productMaster.duplicate(id); load(); loadStats(); };
  const handleDelete = async (id: string) => { await adminApi.productMaster.archive(id); load(); loadStats(); };

  const kpis = [
    { label: "Total Products", value: stats?.totalProducts ?? 0, hint: "All products in master", icon: Boxes, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", glow: "rgba(59,130,246,0.25)" },
    { label: "Active", value: stats?.activeProducts ?? 0, hint: "Published products", icon: CheckCircle2, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", glow: "rgba(34,197,94,0.22)" },
    { label: "Draft", value: stats?.draftProducts ?? 0, hint: "In progress", icon: Clock, color: "var(--kpi-orange)", bg: "var(--kpi-orange-bg)", glow: "rgba(249,115,22,0.22)" },
    { label: "Categories", value: stats?.categoryCount ?? 0, hint: "Product categories", icon: Tag, color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)", glow: "rgba(167,139,250,0.22)" },
    { label: "Low Usage", value: stats?.lowUsageProducts ?? 0, hint: "Rarely referenced", icon: TrendingDown, color: "var(--color-danger)", bg: "rgba(239,68,68,0.10)", glow: "rgba(239,68,68,0.22)" },
  ];

  const renderTableRow = (p: ProductMasterListItem) => {
    return (
      <tr key={p.id} onClick={() => navigate(`/admin/products/${p.id}`)}>
        <td>
          <div className="inv-customer">
            <ProductThumb item={p} />
            <div>
              <div className="inv-customer__name">{p.productName}</div>
              <div className="inv-customer__contact">{p.productCode}</div>
            </div>
          </div>
        </td>
        <td><div className="inv-date">{p.categoryName ?? "—"}</div></td>
        <td><div className="inv-date">{p.castingType ?? "—"}</div></td>
        <td><div className="inv-date">{p.material ?? "—"}</div></td>
        <td><div className="inv-date">{p.materialGrade ?? "—"}</div></td>
        <td><div className="inv-amount__total">{p.weight != null ? `${p.weight} kg` : "—"}</div></td>
        <td><StatusBadge status={p.status} /></td>
        <td>
          <div className="inv-actions" onClick={(e) => e.stopPropagation()}>
            <button className="inv-icon-btn" title="View" aria-label="View" onClick={() => navigate(`/admin/products/${p.id}`)}>
              <Eye size={16} />
            </button>
            <button className="inv-icon-btn" title="Edit" aria-label="Edit" onClick={() => navigate(`/admin/products/${p.id}`)}>
              <FileEdit size={16} />
            </button>
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
          <h1 className="inv-header__title">Products Master</h1>
          <p className="inv-header__subtitle">Manage your casting product catalog, 3D renders, and technical specifications.</p>
        </div>
        <div className="inv-header__actions">
          {/* Segmented Cards vs Table View Toggle */}
          <div
            className="flex items-center p-1 rounded-xl border bg-neutral-100 dark:bg-[#0f121a] border-neutral-200 dark:border-white/10"
          >
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "cards"
                  ? "bg-[var(--color-primary)] text-white shadow-md shadow-orange-500/20"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid size={15} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-[var(--color-primary)] text-white shadow-md shadow-orange-500/20"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <TableIcon size={15} />
              <span>Table</span>
            </button>
          </div>

          <button className="inv-btn" onClick={() => setCategoriesModalOpen(true)} title="Manage product categories">
            <FolderTree size={16} /> Categories
          </button>
          <button className="inv-btn" onClick={handleExport} title="Export visible products to Excel/CSV">
            <Download size={16} /> Export Excel
          </button>
          <button className="inv-btn inv-btn--primary" onClick={() => setDrawerOpen(true)}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="inv-kpi-grid">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`inv-kpi ${k.label === "Categories" ? "cursor-pointer hover:scale-[1.02] transition-transform" : ""}`}
            onClick={k.label === "Categories" ? () => setCategoriesModalOpen(true) : undefined}
            title={k.label === "Categories" ? "Click to manage categories" : undefined}
            style={{ "--inv-kpi-color": k.color, "--inv-kpi-bg": k.bg, "--inv-kpi-glow": k.glow } as CSSProperties}
          >
            <span className="inv-kpi__icon"><k.icon size={20} /></span>
            <span className="inv-kpi__value">{k.value.toLocaleString()}</span>
            <span className="inv-kpi__label">{k.label}</span>
            <span className="inv-kpi__hint">{k.hint}</span>
          </div>
        ))}
      </div>

      {/* Search & filter bar */}
      <div className="inv-filterbar">
        <div className="inv-field" style={{ flex: "1 1 240px" }}>
          <label className="inv-field__label">Search Products</label>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input className="inv-input" style={{ paddingLeft: 32 }} type="search" value={searchInput}
              placeholder="Search by name, part code, material or grade..." aria-label="Search products"
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput.trim()); }} />
          </div>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Status</label>
          <select className="inv-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="inv-field">
          <label className="inv-field__label">Category</label>
          <select className="inv-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <button className="inv-btn inv-btn--icon" title="Refresh" aria-label="Refresh" onClick={() => { load(); loadStats(); }}>
          <RefreshCw size={16} />
        </button>
        {hasFilters && (
          <button className="inv-btn" title="Clear filters" onClick={clearFilters}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Error / Loading */}
      {error && <EmptyStateBlock text={error} onRetry={load} />}
      {!error && loading && !data && <div className="inv-status"><Loading label="Loading products master..." /></div>}

      {/* Empty state */}
      {!error && data && data.items.length === 0 && (
        <div className="inv-status">
          <Package size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <div>{hasFilters ? "No products match the current filters." : "No products found in catalog."}</div>
        </div>
      )}

      {/* MAIN CONTENT: Cards Grid vs Table View */}
      {!error && data && data.items.length > 0 && (
        viewMode === "cards" ? (
          /* Cards Grid View matching Public Catalog Aesthetic */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 my-4">
            {data.items.map((product) => (
              <AdminProductCard
                key={product.id}
                product={product}
                onView={() => navigate(`/admin/products/${product.id}`)}
                onEdit={() => navigate(`/admin/products/${product.id}`)}
                onDuplicate={() => void handleDuplicate(product.id)}
                onArchive={() => void handleArchive(product.id)}
                onDelete={() => setConfirmDelete(product)}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
              />
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="inv-table-wrap my-4">
            <div className="inv-scroll">
              <table className="inv-table">
                <colgroup>
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "6%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Material</th>
                    <th>Grade</th>
                    <th>Weight</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => renderTableRow(p))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Pagination */}
      <div className="inv-pagination">
        <span className="inv-pagination__info">
          {data ? `Showing ${data.items.length} of ${data.totalCount} products` : ""}
        </span>

        <div className="inv-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <label className="inv-field__label" style={{ margin: 0 }}>Per Page</label>
          <select className="inv-select" style={{ width: "auto", padding: "7px 34px 7px 10px" }}
            value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <button className="inv-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
          .reduce<ReactNode[]>((acc, n, idx, arr) => {
            if (idx > 0 && n - arr[idx - 1] > 1) acc.push(<span key={`e${n}`} style={{ color: "var(--text-muted)", padding: "0 2px" }}>…</span>);
            acc.push(
              <button key={n} className={`inv-page-btn ${n === page ? "inv-page-btn--active" : ""}`}
                onClick={() => setPage(n)}>{n}</button>,
            );
            return acc;
          }, [])}

        <button className="inv-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Add product drawer */}
      <ProductDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSave={handleCreateProduct} categories={categories} />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        open={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        onCategoriesChanged={() => {
          loadCategories();
          load();
          loadStats();
        }}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this product?"
        message={confirmDelete ? `"${confirmDelete.productName}" will be removed from the catalog. This cannot be undone.` : ""}
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          const p = confirmDelete;
          setConfirmDelete(null);
          if (p) void handleDelete(p.id);
        }}
      />
    </div>
  );
}

function EmptyStateBlock({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="inv-filterbar" style={{ justifyContent: "center" }}>
      <span style={{ color: "var(--color-danger)", fontSize: 13 }}>{text}</span>
      <button className="inv-btn" onClick={onRetry}>Retry</button>
    </div>
  );
}
