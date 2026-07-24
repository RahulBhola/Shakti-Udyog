import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, type ProductMasterListItem, type ProductMasterStats } from "../../api/adminApi";
import type { Paged } from "../../api/customerApi";
import { Loading } from "../../components/ui";
import ProductStats from "./products/ProductStats";
import ProductToolbar from "./products/ProductToolbar";
import ProductTable from "./products/ProductTable";
import ProductDrawer from "./products/ProductDrawer";
import EmptyState from "./products/EmptyState";

export default function AdminProductPage() {
  const navigate = useNavigate();

  const [data, setData] = useState<Paged<ProductMasterListItem> | null>(null);
  const [stats, setStats] = useState<ProductMasterStats | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pageSize = 10;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi.productMaster.list({
      page, pageSize,
      search: search || undefined,
      status: statusFilter || undefined,
      categoryId: categoryFilter || undefined,
    })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter, categoryFilter]);

  const loadStats = useCallback(() => {
    adminApi.productMaster.stats()
      .then(setStats)
      .catch(() => {});
  }, []);

  const loadCategories = useCallback(() => {
    adminApi.categories()
      .then((cats) => setCategories(cats.map((c: any) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter]);

  const handleExport = () => {
    if (!data?.items.length) return;
    const headers = ["Product Name", "Code", "Category", "Casting Type", "Material", "Grade", "Weight", "Status", "Created"];
    const rows = data.items.map((r: ProductMasterListItem) => [
      r.productName, r.productCode, r.categoryName ?? "", r.castingType ?? "",
      r.material ?? "", r.materialGrade ?? "",
      r.weight != null ? String(r.weight) : "", r.status, r.createdAtUtc,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
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
    // Upload each file — errors propagate to drawer error banner
    for (const file of files) {
      await adminApi.productMaster.uploadAttachment(product.id, file);
    }
    setDrawerOpen(false);
    load();
    loadStats();
  };

  const handleArchive = async (id: string) => {
    await adminApi.productMaster.archive(id);
    load();
    loadStats();
  };

  const handleDuplicate = async (id: string) => {
    await adminApi.productMaster.duplicate(id);
    load();
    loadStats();
  };

  const handleDelete = async (id: string) => {
    await adminApi.productMaster.archive(id);
    load();
    loadStats();
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-bold text-[var(--text-primary)] m-0">Products</h1>
        <p className="text-[14px] text-[var(--text-secondary)] mt-1 mb-0">
          Manage your casting products and inventory master.
        </p>
      </div>

      {/* KPI Cards */}
      <ProductStats
        total={stats?.totalProducts ?? 0}
        active={stats?.activeProducts ?? 0}
        draft={stats?.draftProducts ?? 0}
        categories={stats?.categoryCount ?? 0}
        lowUsage={stats?.lowUsageProducts ?? 0}
        loading={!stats && !error}
      />

      {/* Toolbar */}
      <ProductToolbar
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        categoryId={categoryFilter}
        onCategoryChange={setCategoryFilter}
        onExport={handleExport}
        onAdd={() => setDrawerOpen(true)}
        categories={categories}
      />

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12 rounded-[16px] border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 p-8">
          <p className="text-[var(--color-danger)] font-medium text-sm">{error}</p>
          <button type="button" onClick={load}
            className="mt-3 inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-[var(--border-default)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
            Retry
          </button>
        </div>
      )}

      {/* Table or Empty State */}
      {!error && data && data.items.length === 0 && (
        <EmptyState
          onAdd={() => setDrawerOpen(true)}
          hasFilters={!!(search || statusFilter || categoryFilter)}
          onClearFilters={() => { setSearch(""); setStatusFilter(""); setCategoryFilter(""); }}
        />
      )}

      {!error && (loading || (data && data.items.length > 0)) && (
        <ProductTable
          items={data?.items ?? []}
          totalCount={data?.totalCount ?? 0}
          page={page}
          pageSize={pageSize}
          loading={loading && !data}
          onPageChange={setPage}
          onView={(id) => navigate(`/admin/products/${id}`)}
          onEdit={(id) => navigate(`/admin/products/${id}`)}
          onDuplicate={handleDuplicate}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      )}

      {/* Drawer */}
      <ProductDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleCreateProduct}
        categories={categories}
      />
    </>
  );
}