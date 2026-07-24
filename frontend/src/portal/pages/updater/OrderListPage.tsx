import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updaterApi } from "../../../api/updaterApi";
import type { OrderListItem, Paged } from "../../../api/customerApi";
import OrderStats from "../orders/OrderStats";
import OrderToolbar from "../orders/OrderToolbar";
import OrderTable from "../orders/OrderTable";
import OrderEmptyState from "../orders/OrderEmptyState";

const PAGE_SIZE = 10;

export default function UpdaterOrderListPage() {
  const navigate = useNavigate();

  // ── Data state ─────────────────────────────────────────────────
  const [data, setData] = useState<Paged<OrderListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Stats state ────────────────────────────────────────────────
  const [stats, setStats] = useState<{
    total: number;
    confirmed: number;
    production: number;
    qualityCheck: number;
    readyToDispatch: number;
    delivered: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Load main data ─────────────────────────────────────────────
  const load = useCallback(async (p: number, s: string, st: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updaterApi.orders(p, PAGE_SIZE, s || undefined, st || undefined);
      setData(result);
    } catch (e: any) {
      setError(e.message ?? "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load stats (parallel status-filtered calls) ────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const statuses = ["confirmed", "production", "quality_check", "ready_to_dispatch", "delivered"];
      const results = await Promise.all(
        statuses.map((st) => updaterApi.orders(1, 1, undefined, st).catch(() => null))
      );
      const totalResult = await updaterApi.orders(1, 1).catch(() => null);

      setStats({
        total: totalResult?.totalCount ?? 0,
        confirmed: results[0]?.totalCount ?? 0,
        production: results[1]?.totalCount ?? 0,
        qualityCheck: results[2]?.totalCount ?? 0,
        readyToDispatch: results[3]?.totalCount ?? 0,
        delivered: results[4]?.totalCount ?? 0,
      });
    } catch {
      // Stats silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Initial load ───────────────────────────────────────────────
  useEffect(() => {
    load(page, search, statusFilter);
  }, [page, search, statusFilter, load]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ── Handlers ───────────────────────────────────────────────────
  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const handleStatusChange = (v: string) => {
    setStatusFilter(v);
    setPage(1);
  };

  const handleRefresh = () => {
    load(page, search, statusFilter);
    loadStats();
  };

  const handleView = (id: string) => {
    navigate(`/admin/orders/${id}`);
  };

  const handleExport = () => {
    if (!data?.items.length) return;
    const headers = ["Order Number", "Status", "Quantity", "Placed Date", "Promised Dispatch", "Last Updated"];
    const rows = data.items.map((o) => [
      o.orderNumber, o.statusLabel, String(o.totalQuantity),
      o.placedAtUtc, o.promisedDispatchDateUtc ?? "", o.lastUpdatedAtUtc,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = !!search || !!statusFilter;

  // ── Skeleton when loading first page ────────────────────────────
  if (!data && loading && !error) {
    return (
      <div className="space-y-6 pb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Orders</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">Track and manage customer production orders.</p>
        </div>
        <OrderStats stats={null} loading />
        <OrderToolbar search="" onSearchChange={() => {}} status="" onStatusChange={() => {}} onExport={() => {}} onRefresh={() => {}} />
        <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm overflow-hidden">
          <div className="p-12 text-center text-[var(--text-muted)] text-sm">Loading orders...</div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Orders</h1>
        <p className="text-[13px] text-[var(--text-muted)] mt-0.5">Track and manage customer production orders.</p>
      </div>

      {/* KPI Cards */}
      <OrderStats stats={stats} loading={statsLoading} />

      {/* Toolbar */}
      <OrderToolbar
        search={search}
        onSearchChange={handleSearchChange}
        status={statusFilter}
        onStatusChange={handleStatusChange}
        onExport={handleExport}
        onRefresh={handleRefresh}
      />

      {/* Error state */}
      {error && (
        <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm">
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Failed to load orders</h3>
            <p className="text-[13px] text-[var(--text-muted)] mb-4">{error}</p>
            <button type="button" onClick={handleRefresh}
              className="px-4 h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!error && data && data.items.length === 0 && (
        <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] shadow-sm">
          <OrderEmptyState
            hasFilters={hasFilters}
            onClearFilters={() => { setSearch(""); setStatusFilter(""); setPage(1); }}
          />
        </div>
      )}

      {/* Data table */}
      {!error && data && data.items.length > 0 && (
        <OrderTable
          items={data.items}
          totalCount={data.totalCount}
          page={page}
          pageSize={PAGE_SIZE}
          loading={false}
          onPageChange={setPage}
          onView={handleView}
        />
      )}
    </div>
  );
}
