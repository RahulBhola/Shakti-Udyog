import { useCallback, useEffect, useState, type ReactNode, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, type ProductMasterListItem, type ProductMasterStats } from "../../api/adminApi";
import type { Paged } from "../../api/customerApi";
import { Loading } from "../../components/ui";
import { tokenStorage } from "../../auth/tokenStorage";
import { config } from "../../config";
import ProductDrawer from "./products/ProductDrawer";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  Package, Plus, Download, Search, RefreshCw, Eye, MoreVertical,
  ChevronLeft, ChevronRight, X, Copy, Archive, Trash2, FileEdit,
  Boxes, CheckCircle2, Clock, Tag, TrendingDown,
} from "lucide-react";
import "./erpListView.css";

const STATUS_FILTERS = ["All", "Active", "Draft", "Archived"];
const PAGE_SIZES = [10, 20, 50];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.firstAttachmentId]);
  if (blobUrl) {
    return <img src={blobUrl} alt={item.productName} className="inv-avatar" style={{ objectFit: "cover" }} />;
  }
  return <span className="inv-avatar" style={{ background: "var(--bg-surface-hover)" }}><Package size={16} /></span>;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminProductPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<Paged<ProductMasterListItem> | null>(null);
  const [stats, setStats] = useState<ProductMasterStats | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<{ id: string; dir: "up" | "down" } | null>(null);
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
    adminApi.productMaster.stats().then(setStats).catch(() => {});
  }, []);
  const loadCategories = useCallback(() => {
    adminApi.categories().then((cats) => setCategories(cats.map((c: any) => ({ id: c.id, name: c.name })))).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter, pageSize]);

  // Close the row menu on outside click
  useEffect(() => {
    if (!openMenu) return;
    const onDown = () => setOpenMenu(null);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
  const hasFilters = !!search || statusFilter !== "All" || !!categoryFilter;
  const clearFilters = () => { setSearchInput(""); setSearch(""); setStatusFilter("All"); setCategoryFilter(""); };

  const handleExport = () => {
    if (!data?.items.length) return;
    const headers = ["Product Name", "Code", "Category", "Casting Type", "Material", "Grade", "Weight", "Status", "Created"];
    const rows = data.items.map((r) => [
      r.productName, r.productCode, r.categoryName ?? "", r.castingType ?? "",
      r.material ?? "", r.materialGrade ?? "", r.weight != null ? String(r.weight) : "", r.status, r.createdAtUtc,
    ]);
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(esc).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
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
    { label: "Total Products", value: stats?.totalProducts ?? 0, hint: "All products", icon: Boxes, color: "var(--kpi-blue)", bg: "var(--kpi-blue-bg)", glow: "rgba(59,130,246,0.25)" },
    { label: "Active", value: stats?.activeProducts ?? 0, hint: "Published products", icon: CheckCircle2, color: "var(--kpi-green)", bg: "var(--kpi-green-bg)", glow: "rgba(34,197,94,0.22)" },
    { label: "Draft", value: stats?.draftProducts ?? 0, hint: "In progress", icon: Clock, color: "var(--kpi-orange)", bg: "var(--kpi-orange-bg)", glow: "rgba(249,115,22,0.22)" },
    { label: "Categories", value: stats?.categoryCount ?? 0, hint: "Product categories", icon: Tag, color: "var(--kpi-purple)", bg: "var(--kpi-purple-bg)", glow: "rgba(167,139,250,0.22)" },
    { label: "Low Usage", value: stats?.lowUsageProducts ?? 0, hint: "Rarely referenced", icon: TrendingDown, color: "var(--color-danger)", bg: "rgba(239,68,68,0.10)", glow: "rgba(239,68,68,0.22)" },
  ];

  const renderRow = (p: ProductMasterListItem) => {
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
            <div className="inv-menu-wrap" onMouseDown={(e) => e.stopPropagation()}>
              <button className="inv-icon-btn" title="More" aria-label="More actions"
                aria-expanded={openMenu?.id === p.id}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const dir = window.innerHeight - rect.bottom < 260 ? "up" : "down";
                  setOpenMenu((m) => (m && m.id === p.id ? null : { id: p.id, dir }));
                }}>
                <MoreVertical size={16} />
              </button>
              {openMenu?.id === p.id && (
                <div className={`inv-menu ${openMenu.dir === "up" ? "inv-menu--up" : ""}`}>
                  <button className="inv-menu__item" onClick={() => { setOpenMenu(null); navigate(`/admin/products/${p.id}`); }}>
                    <Eye size={15} /> View
                  </button>
                  <button className="inv-menu__item" onClick={() => { setOpenMenu(null); navigate(`/admin/products/${p.id}`); }}>
                    <FileEdit size={15} /> Edit
                  </button>
                  <button className="inv-menu__item" onClick={() => { setOpenMenu(null); void handleDuplicate(p.id); }}>
                    <Copy size={15} /> Duplicate
                  </button>
                  <div className="inv-menu__divider" />
                  <button className="inv-menu__item" onClick={() => { setOpenMenu(null); void handleArchive(p.id); }}>
                    <Archive size={15} /> Archive
                  </button>
                  <button className="inv-menu__item inv-menu__item--danger" onClick={() => { setOpenMenu(null); setConfirmDelete(p); }}>
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
          <h1 className="inv-header__title">Products</h1>
          <p className="inv-header__subtitle">Manage your casting products and inventory master.</p>
        </div>
        <div className="inv-header__actions">
          <button className="inv-btn" onClick={handleExport} title="Export visible products to Excel">
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
          <div key={k.label} className="inv-kpi"
            style={{ "--inv-kpi-color": k.color, "--inv-kpi-bg": k.bg, "--inv-kpi-glow": k.glow } as CSSProperties}>
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
          <label className="inv-field__label">Search</label>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input className="inv-input" style={{ paddingLeft: 32 }} type="search" value={searchInput}
              placeholder="Search products..." aria-label="Search products"
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
        <button className="inv-btn" onClick={handleExport} title="Export visible products to Excel">
          <Download size={14} /> Export
        </button>
        {hasFilters && (
          <button className="inv-btn" title="Clear filters" onClick={clearFilters}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Error / Loading */}
      {error && <EmptyStateBlock text={error} onRetry={load} />}
      {!error && loading && !data && <div className="inv-status"><Loading label="Loading products" /></div>}

      {/* Empty state */}
      {!error && data && data.items.length === 0 && (
        <div className="inv-status">
          <Package size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <div>{hasFilters ? "No products match the current filters." : "No products found."}</div>
        </div>
      )}

      {/* Table */}
      {!error && data && data.items.length > 0 && (
        <div className="inv-table-wrap">
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
                {data.items.map((p) => renderRow(p))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="inv-pagination">
        <span className="inv-pagination__info">
          {data ? `Showing ${data.items.length} of ${data.totalCount} products` : ""}
        </span>

        <div className="inv-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <label className="inv-field__label" style={{ margin: 0 }}>Rows</label>
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
