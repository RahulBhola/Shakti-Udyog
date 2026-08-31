import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPatch, apiPost, apiDelete } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { connectRealtime, getRealtimeConnection, type StageChangedPayload } from "../../realtime/signalR";
import { formatDateTime } from "../shared";
import {
  Layers,
  Flame,
  ShieldCheck,
  PackageCheck,
  Truck,
  Calendar,
  Building2,
  User,
  ArrowRight,
  ArrowLeft,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Package,
  Boxes,
  MessageSquare,
  History,
  X,
  Send,
  Loader2,
  BarChart3,
  Kanban,
  Clock,
  MoreVertical,
  Wallet,
  CreditCard,
  FileText,
  Trash2,
} from "lucide-react";

export interface EngineerOrder {
  id: string;
  orderNumber: string;
  companyName: string | null;
  productType: string | null;
  totalQuantity: number;
  manufacturingStage: string;
  placedAtUtc: string;
  stageUpdatedAt: string | null;
  promisedDispatchDateUtc?: string | null;
  status?: string | null;
  advancePaid?: boolean;
  assignedToUserName?: string | null;
  quotationTotal?: number | null;
  advanceAmount?: number | null;
  advancePercent?: number;
  paidAmount?: number | null;
  pendingAmount?: number | null;
  paymentTerms?: string | null;
}

export interface OrderCommentItem {
  id?: string;
  authorRole: string;
  authorName: string | null;
  message: string;
  createdAtUtc: string;
}

export interface OrderHistoryItem {
  fromStatus: string;
  toStatus: string;
  changedByRole: string;
  note: string | null;
  createdAtUtc: string;
}

/* ── 5 Core Manufacturing Columns (Bidirectional Workflow) ───────────────────── */

interface BoardColumn {
  code: string;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
  icon: any;
}

const COLUMNS: BoardColumn[] = [
  {
    code: "pattern_development",
    label: "Pattern Development",
    shortLabel: "Pattern Dev",
    description: "CAD Tooling & Match Plate",
    color: "#8b5cf6",
    badgeBg: "bg-purple-500/10 dark:bg-purple-500/20",
    badgeText: "text-purple-700 dark:text-purple-300",
    borderAccent: "border-purple-500/30",
    icon: Layers,
  },
  {
    code: "production",
    label: "Production",
    shortLabel: "Production",
    description: "Moulding, Core & Casting",
    color: "#3b82f6",
    badgeBg: "bg-blue-500/10 dark:bg-blue-500/20",
    badgeText: "text-blue-700 dark:text-blue-300",
    borderAccent: "border-blue-500/30",
    icon: Flame,
  },
  {
    code: "quality_check",
    label: "Quality Check (QC)",
    shortLabel: "QC Check",
    description: "Dimensional CMM & Metallurgical",
    color: "#f59e0b",
    badgeBg: "bg-amber-500/10 dark:bg-amber-500/20",
    badgeText: "text-amber-700 dark:text-amber-300",
    borderAccent: "border-amber-500/30",
    icon: ShieldCheck,
  },
  {
    code: "packed",
    label: "Packed",
    shortLabel: "Packed",
    description: "Treated Wooden Crating",
    color: "#10b981",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    borderAccent: "border-emerald-500/30",
    icon: PackageCheck,
  },
  {
    code: "ready_to_dispatch",
    label: "Ready To Dispatch",
    shortLabel: "Ready Dispatch",
    description: "Staged for Logistics / Transport",
    color: "#06b6d4",
    badgeBg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    badgeText: "text-cyan-700 dark:text-cyan-300",
    borderAccent: "border-cyan-500/30",
    icon: Truck,
  },
];

const columnIndex = (code: string): number => COLUMNS.findIndex((c) => c.code === code);
const columnLabel = (code: string): string => COLUMNS[columnIndex(code)]?.label ?? code;

/* ── Main Manufacturing Kanban Board & Analytics ───────────────────────────── */

export default function EngineerBoardPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes("Admin") ?? false;
  const navigate = useNavigate();

  const [orders, setOrders] = useState<EngineerOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewTab, setViewTab] = useState<"board" | "analytics">("board");

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const dragOrder = useRef<EngineerOrder | null>(null);

  // RHS Drawer state for Order Story & Comments
  const [selectedStoryOrder, setSelectedStoryOrder] = useState<EngineerOrder | null>(null);
  const [deleteModalOrder, setDeleteModalOrder] = useState<EngineerOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiGet<any>("/api/v1/engineer/board/orders")
      .then((data) => {
        const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        setOrders(list);
        setError(null);
      })
      .catch((e: Error) => {
        setOrders([]);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteOrder = async () => {
    if (!deleteModalOrder) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/v1/admin/orders/${deleteModalOrder.id}`);
      if (selectedStoryOrder?.id === deleteModalOrder.id) {
        setSelectedStoryOrder(null);
      }
      setDeleteModalOrder(null);
      load();
    } catch (err: any) {
      setNotice(err.message || "Failed to delete order.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(load, [load]);

  // Realtime SignalR sync
  useEffect(() => {
    void connectRealtime();
    const conn = getRealtimeConnection();
    const handler = (_p: StageChangedPayload) => load();
    conn.on("stageChanged", handler);
    return () => {
      conn.off("stageChanged", handler);
    };
  }, [load]);

  const handleDragStart = useCallback((order: EngineerOrder) => {
    setDraggedId(order.id);
    dragOrder.current = order;
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    dragOrder.current = null;
  }, []);

  // Drop permitted on ANY different column (backward or forward)
  const canDropOn = (targetStage: string): boolean => {
    const cur = dragOrder.current;
    if (!cur || cur.id !== draggedId) return false;
    return cur.manufacturingStage !== targetStage;
  };

  const moveOrderStage = useCallback(async (order: EngineerOrder, targetStage: string) => {
    if (order.manufacturingStage === targetStage) return;
    setMovingId(order.id);

    // Optimistic update
    setOrders((prev) => prev?.map((o) => (o.id === order.id ? { ...o, manufacturingStage: targetStage } : o)) ?? prev);
    setDraggedId(null);
    dragOrder.current = null;

    try {
      await apiPatch(`/api/v1/engineer/orders/${order.id}/stage`, { stage: targetStage });
      setNotice(null);
      load();
    } catch {
      setOrders((prev) => prev?.map((o) => (o.id === order.id ? { ...o, manufacturingStage: order.manufacturingStage } : o)) ?? prev);
      setNotice(`Unable to move "${order.orderNumber}" to ${columnLabel(targetStage)}.`);
    } finally {
      setMovingId(null);
    }
  }, [load]);

  const handleDrop = useCallback(
    async (targetStage: string) => {
      const order = dragOrder.current;
      if (!order || order.id !== draggedId) {
        setDraggedId(null);
        return;
      }
      await moveOrderStage(order, targetStage);
    },
    [draggedId, moveOrderStage]
  );

  // Filter orders by search query
  const filteredOrders = (orders ?? []).filter((o) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      (o.companyName && o.companyName.toLowerCase().includes(q)) ||
      (o.productType && o.productType.toLowerCase().includes(q)) ||
      (o.assignedToUserName && o.assignedToUserName.toLowerCase().includes(q))
    );
  });

  const effectiveOrderStage = (o: EngineerOrder) => {
    if (o.manufacturingStage && COLUMNS.some((col) => col.code === o.manufacturingStage)) {
      return o.manufacturingStage;
    }
    if (o.status && COLUMNS.some((col) => col.code === o.status)) {
      return o.status;
    }
    if (o.status === "dispatched" || o.status === "delivered") {
      return "ready_to_dispatch";
    }
    return "pattern_development";
  };

  const byColumn = COLUMNS.map((c) => ({
    column: c,
    items: filteredOrders.filter((o) => effectiveOrderStage(o) === c.code),
  }));

  // KPI calculations
  const totalOrders = orders?.length ?? 0;
  const totalQuantitySum = orders?.reduce((acc, o) => acc + (o.totalQuantity || 0), 0) ?? 0;
  const inPattern = orders?.filter((o) => effectiveOrderStage(o) === "pattern_development").length ?? 0;
  const inProduction = orders?.filter((o) => effectiveOrderStage(o) === "production").length ?? 0;
  const inQC = orders?.filter((o) => effectiveOrderStage(o) === "quality_check").length ?? 0;
  const readyOrPacked = orders?.filter((o) => {
    const s = effectiveOrderStage(o);
    return s === "packed" || s === "ready_to_dispatch";
  }).length ?? 0;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header with Tab Switcher & Search ──────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f121a] p-6 sm:p-7 rounded-3xl border border-neutral-200/90 dark:border-white/10 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              {isAdmin ? "Factory Operations" : "Engineer Workspace"}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Realtime Sync</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
            {isAdmin ? "Foundry Manufacturing Pipeline" : "My Assigned Production Orders"}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 m-0">
            Monitor and advance casting orders across 5 synced stages with live Order Story & discussion notes.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {/* View Tab Switcher (Kanban vs Pipeline Analytics) */}
          <div className="inline-flex p-1 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 shadow-xs">
            <button
              type="button"
              onClick={() => setViewTab("board")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${viewTab === "board"
                  ? "bg-white dark:bg-[#151926] text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
            >
              <Kanban size={14} />
              <span>Board View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab("analytics")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${viewTab === "analytics"
                  ? "bg-white dark:bg-[#151926] text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
            >
              <BarChart3 size={14} />
              <span>Pipeline Analytics</span>
            </button>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search Order #, Client, Engineer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 pr-4 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 w-52 sm:w-64 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#141824] text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-600" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Metric Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f121a] border border-neutral-200/90 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Pipeline</span>
            <Boxes size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 dark:text-white tabular-nums">{totalOrders}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">{totalQuantitySum.toLocaleString()} total pcs</div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-500/20 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pattern Dev</span>
            <Layers size={16} />
          </div>
          <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-300 tabular-nums">{inPattern}</div>
          <div className="text-[10px] text-purple-600/70 dark:text-purple-400/70 mt-0.5">CAD & Tooling</div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/20 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Production</span>
            <Flame size={16} />
          </div>
          <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 tabular-nums">{inProduction}</div>
          <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-0.5">Foundry Mould & Pour</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">QC Inspection</span>
            <ShieldCheck size={16} />
          </div>
          <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 tabular-nums">{inQC}</div>
          <div className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">CMM & Metallurgical</div>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-500/20 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Dispatch Ready</span>
            <Truck size={16} />
          </div>
          <div className="text-2xl font-extrabold text-cyan-700 dark:text-cyan-300 tabular-nums">{readyOrPacked}</div>
          <div className="text-[10px] text-cyan-600/70 dark:text-cyan-400/70 mt-0.5">Packed & Staged</div>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold shadow-xs">
          <AlertCircle size={16} className="shrink-0" />
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="ml-auto text-amber-500 hover:text-amber-700 cursor-pointer">✕</button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold shadow-xs">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── View Tab 1: KANBAN BOARD VIEW ──────────────────────────────────── */}
      {viewTab === "board" && (
        <div className="overflow-x-auto pb-4 -mx-1 px-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 items-stretch min-w-[280px] xl:min-w-0">
            {byColumn.map(({ column, items }, colIndex) => {
              const Icon = column.icon;
              const droppable = draggedId !== null && canDropOn(column.code);
              const prevColumn = colIndex > 0 ? COLUMNS[colIndex - 1] : undefined;
              const nextColumn = colIndex < COLUMNS.length - 1 ? COLUMNS[colIndex + 1] : undefined;

              return (
                <div
                  key={column.code}
                  onDragOver={(e) => {
                    if (droppable) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    if (droppable) {
                      e.preventDefault();
                      void handleDrop(column.code);
                    }
                  }}
                  className={`flex flex-col h-full rounded-2xl border bg-neutral-50/70 dark:bg-[#0c0e14] p-3 transition-all ${
                    droppable
                      ? "border-dashed border-2 border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 shadow-md ring-2 ring-blue-500/20"
                      : "border-neutral-200/90 dark:border-white/10"
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-3 mb-2.5 rounded-xl bg-white dark:bg-[#121520] border border-neutral-200/80 dark:border-white/10 shadow-2xs">
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`p-1.5 rounded-lg ${column.badgeBg} ${column.badgeText} shrink-0`}>
                          <Icon size={15} className="stroke-[2.2]" />
                        </div>
                        <span className="text-xs font-black text-neutral-900 dark:text-white leading-tight truncate">
                          {column.label}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] font-black ${column.badgeBg} ${column.badgeText} shrink-0`}
                      >
                        {items.length}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-neutral-400 font-medium leading-tight truncate">
                      {column.description}
                    </div>
                  </div>

                  {/* Order Cards Container - expands dynamically */}
                  <div className="flex-1 flex flex-col space-y-2.5">
                    {items.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        isAdmin={isAdmin}
                        colIndex={colIndex}
                        prevColumn={prevColumn}
                        nextColumn={nextColumn}
                        isDragging={draggedId === order.id}
                        isMoving={movingId === order.id}
                        onDragStart={() => handleDragStart(order)}
                        onDragEnd={handleDragEnd}
                        onRegress={() => prevColumn && void moveOrderStage(order, prevColumn.code)}
                        onAdvance={() => nextColumn && void moveOrderStage(order, nextColumn.code)}
                        onView={() => navigate(isAdmin ? `/admin/orders/${order.id}` : `/engineer/orders/${order.id}`)}
                        onViewInvoice={() => navigate(`/admin/invoices?search=${encodeURIComponent(order.orderNumber)}`)}
                        onOpenStory={() => setSelectedStoryOrder(order)}
                        onDelete={() => setDeleteModalOrder(order)}
                      />
                    ))}

                    {items.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center py-6 px-2 text-center border border-dashed border-neutral-200 dark:border-white/10 rounded-xl min-h-[90px]">
                        <span className="text-[11px] font-medium text-neutral-400">No orders in this stage</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── View Tab 2: PIPELINE ANALYTICS VIEW ────────────────────────────── */}
      {viewTab === "analytics" && (
        <PipelineAnalyticsView orders={orders ?? []} />
      )}

      {/* ── RHS Slide-Over Drawer: ORDER STORY & ALL COMMENTS ──────────────── */}
      {selectedStoryOrder && (
        <OrderStoryDrawer
          order={selectedStoryOrder}
          isAdmin={isAdmin}
          onClose={() => setSelectedStoryOrder(null)}
        />
      )}

      {/* ── Delete Order Confirmation Modal ── */}
      {deleteModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-white/10 flex items-center justify-between bg-rose-500/5 text-rose-600 dark:text-rose-400">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <Trash2 size={17} />
                </div>
                <h3 className="font-extrabold text-sm m-0">Delete Order {deleteModalOrder.orderNumber}?</h3>
              </div>
              <button onClick={() => setDeleteModalOrder(null)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
                Are you sure you want to permanently delete order <strong className="font-mono text-neutral-900 dark:text-white">{deleteModalOrder.orderNumber}</strong>?
                {deleteModalOrder.companyName ? ` (${deleteModalOrder.companyName})` : ""}
              </p>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 font-medium">
                This will delete the story from the Kanban board and remove the order from active manufacturing. Invoices will remain accessible in the invoices section.
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModalOrder(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteOrder}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                <span>Delete Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatCardDate(iso?: string | null): { date: string; time: string } {
  if (!iso) return { date: "—", time: "" };
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { date: "—", time: "" };
    const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return { date, time };
  } catch {
    return { date: "—", time: "" };
  }
}

/* ── Modern High-Density Order Card Component ─────────────────────────────── */

function OrderCard({
  order,
  colIndex,
  prevColumn,
  nextColumn,
  isDragging,
  isMoving,
  onDragStart,
  onDragEnd,
  onRegress,
  onAdvance,
  onView,
  onViewInvoice,
  onOpenStory,
  onDelete,
}: {
  order: EngineerOrder;
  isAdmin?: boolean;
  colIndex: number;
  prevColumn?: BoardColumn;
  nextColumn?: BoardColumn;
  isDragging: boolean;
  isMoving: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onRegress?: () => void;
  onAdvance?: () => void;
  onView: () => void;
  onViewInvoice?: () => void;
  onOpenStory: () => void;
  onDelete?: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { date: updatedDate, time: updatedTime } = formatCardDate(order.stageUpdatedAt || order.placedAtUtc);
  const engineerInitial = (order.assignedToUserName || "P").charAt(0).toUpperCase();

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpenStory}
      className={`group relative rounded-2xl bg-white dark:bg-[#121520] border border-neutral-200/90 dark:border-white/10 p-3 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:cursor-grabbing hover:border-blue-500/40 select-none space-y-2.5 ${
        isDragging ? "opacity-40 scale-95 ring-2 ring-blue-500" : ""
      }`}
    >
      {/* ── 1. Top Row: Order ID Mono Badge, Quantity Pill, Kebab Menu ── */}
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[11px] font-black text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 truncate">
          {order.orderNumber}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 whitespace-nowrap">
            <Package size={11} className="text-neutral-400 stroke-[2.2]" />
            <span>{order.totalQuantity} pcs</span>
          </span>

          {/* 3-Dots Kebab Menu */}
          <div className="relative shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="More Options"
            >
              <MoreVertical size={14} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-7 z-30 w-44 rounded-xl bg-white dark:bg-[#161a26] border border-neutral-200 dark:border-white/10 shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onOpenStory();
                  }}
                  className="w-full px-3 py-1.5 text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <MessageSquare size={13} className="text-blue-500" />
                  <span>Order Story & Notes</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onView();
                  }}
                  className="w-full px-3 py-1.5 text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <Package size={13} className="text-neutral-400" />
                  <span>Full Order Details</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    if (onViewInvoice) onViewInvoice();
                    else onView();
                  }}
                  className="w-full px-3 py-1.5 text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <FileText size={13} className="text-emerald-500" />
                  <span>View Tax Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete?.();
                  }}
                  className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer font-semibold border-t border-neutral-100 dark:border-white/5"
                >
                  <Trash2 size={13} className="text-rose-500" />
                  <span>Delete Order</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Part Name & Client ── */}
      <div className="min-w-0">
        <h4 className="text-xs font-black text-neutral-900 dark:text-white truncate m-0 leading-tight">
          {order.productType || "Grey Iron Casting"}
        </h4>
        <p className="text-[10.5px] font-medium text-neutral-500 dark:text-neutral-400 truncate mt-0.5 m-0">
          {order.companyName || "Direct Client"}
        </p>
      </div>

      {/* ── 3. Compact Info Bar: Advance Status, Assigned Avatar, Timestamp ── */}
      <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-neutral-100 dark:border-white/5 text-[10px]">
        {/* Status Pill */}
        {order.advancePaid ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <CheckCircle2 size={10} className="stroke-[2.5]" />
            <span>Adv. Verified</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <Clock size={10} className="stroke-[2.5]" />
            <span>Adv. Pending</span>
          </span>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-neutral-400 font-medium whitespace-nowrap" title={`${updatedDate} ${updatedTime}`}>
            {updatedDate}
          </span>
          <div
            className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[9px] shadow-2xs shrink-0"
            title={order.assignedToUserName || "Primary Staff Engineer"}
          >
            {engineerInitial}
          </div>
        </div>
      </div>

      {/* ── 4. Compact Quick Action Stepper Buttons ── */}
      <div className="pt-0.5 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {prevColumn && colIndex > 0 && (
          <button
            type="button"
            title={`Move back to ${prevColumn.label}`}
            onClick={(e) => {
              e.stopPropagation();
              onRegress?.();
            }}
            disabled={isMoving}
            className="flex-1 inline-flex items-center justify-center gap-1 h-7 px-2 rounded-lg text-[10.5px] font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200/80 dark:border-white/10 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft size={11} />
            <span className="truncate">{prevColumn.shortLabel}</span>
          </button>
        )}

        {nextColumn && colIndex < 4 ? (
          <button
            type="button"
            title={`Advance to ${nextColumn.label}`}
            onClick={(e) => {
              e.stopPropagation();
              onAdvance?.();
            }}
            disabled={isMoving}
            className="flex-1 inline-flex items-center justify-center gap-1 h-7 px-2 rounded-lg text-[10.5px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs shadow-blue-500/20 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <span className="truncate">{isMoving ? "Moving..." : nextColumn.shortLabel}</span>
            <ArrowRight size={11} />
          </button>
        ) : !prevColumn || colIndex === 0 ? (
          nextColumn && (
            <button
              type="button"
              title={`Advance to ${nextColumn.label}`}
              onClick={(e) => {
                e.stopPropagation();
                onAdvance?.();
              }}
              disabled={isMoving}
              className="w-full inline-flex items-center justify-center gap-1 h-7 px-2 rounded-lg text-[10.5px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
            >
              <span>{isMoving ? "Moving..." : nextColumn.shortLabel}</span>
              <ArrowRight size={11} />
            </button>
          )
        ) : (
          <button
            type="button"
            title="View tax invoice for dispatched order"
            onClick={(e) => {
              e.stopPropagation();
              if (onViewInvoice) {
                onViewInvoice();
              } else {
                onView();
              }
            }}
            className="flex-1 inline-flex items-center justify-center gap-1 h-7 px-2 rounded-lg text-[10.5px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs shadow-emerald-500/20 cursor-pointer"
          >
            <span>View Invoice</span>
            <FileText size={11} />
          </button>
        )}
      </div>
    </div>
  );
}




/* ── RHS Slide-Over Drawer: Order Story & Comments ──────────────────────────── */

function OrderStoryDrawer({
  order,
  isAdmin,
  onClose,
}: {
  order: EngineerOrder;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [comments, setComments] = useState<OrderCommentItem[]>([]);
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "story">("comments");

  const detailUrl = isAdmin ? `/admin/orders/${order.id}` : `/engineer/orders/${order.id}`;

  const totalVal = order.quotationTotal ?? order.advanceAmount ?? 0;
  const paidVal =
    order.paidAmount ??
    (order.advancePaid
      ? (order.advanceAmount ?? (order.quotationTotal ? order.quotationTotal * ((order.advancePercent || 30) / 100) : 0))
      : 0);
  const pendingVal = order.pendingAmount ?? (totalVal > paidVal ? totalVal - paidVal : 0);

  const commentsUrl = isAdmin
    ? `/api/v1/admin/orders/${order.id}/comments`
    : `/api/v1/engineer/orders/${order.id}/comments`;

  const historyUrl = isAdmin
    ? `/api/v1/admin/orders/${order.id}/history`
    : `/api/v1/engineer/orders/${order.id}/history`;

  const loadDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [cData, hData] = await Promise.all([
        apiGet<OrderCommentItem[]>(commentsUrl).catch(() => []),
        apiGet<OrderHistoryItem[]>(historyUrl).catch(() => []),
      ]);
      setComments(Array.isArray(cData) ? cData : []);
      setHistory(Array.isArray(hData) ? hData : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [commentsUrl, historyUrl]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || posting) return;

    setPosting(true);
    try {
      await apiPost(commentsUrl, { message: newComment.trim() });
      setNewComment("");
      await loadDetails();
    } catch (err: any) {
      alert(err.message || "Could not post comment");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* RHS Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#10131d] h-full shadow-2xl border-l border-neutral-200/80 dark:border-white/10 flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* 1. Header with Full Details Button */}
        <div className="p-5 border-b border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.02] space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="font-mono text-xs font-black text-neutral-900 dark:text-white px-2.5 py-0.5 rounded-lg bg-white dark:bg-white/10 border border-neutral-200 dark:border-white/10 shadow-2xs">
                  {order.orderNumber}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {order.totalQuantity} pcs
                </span>
                {order.advancePaid ? (
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Advance Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Payment Pending
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-neutral-900 dark:text-white truncate m-0">
                {order.productType || "Casting Job"}
              </h2>
              <div className="text-xs text-neutral-400 mt-1 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 font-medium text-neutral-600 dark:text-neutral-300">
                  <Building2 size={12} className="text-neutral-400" />
                  <span>{order.companyName || "Direct Client"}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 text-[11px]">
                  <Calendar size={12} className="text-neutral-400" />
                  <span>Placed {formatDateTime(order.placedAtUtc)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#161a26] text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <X size={16} />
            </button>
          </div>

          {/* View Full Order Details CTA Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(detailUrl);
            }}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/25 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <ExternalLink size={14} className="stroke-[2.2]" />
            <span>View Full Order Details</span>
          </button>
        </div>

        {/* 2. Financial & Payment Summary Cards */}
        <div className="p-4 mx-5 my-3.5 rounded-2xl bg-neutral-50/80 dark:bg-[#151924] border border-neutral-200/80 dark:border-white/10 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
              <Wallet size={12} className="text-blue-500" />
              <span>PAYMENT & FINANCIAL OVERVIEW</span>
            </span>
            {order.paymentTerms && (
              <span className="text-[10.5px] font-semibold text-neutral-500 dark:text-neutral-400">
                {order.paymentTerms}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* Paid Amount */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#121520] border border-emerald-500/20 shadow-2xs">
              <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <span>PAID</span>
                <CheckCircle2 size={12} className="stroke-[2.2]" />
              </div>
              <div className="text-sm font-black text-neutral-900 dark:text-white mt-1">
                {paidVal > 0 ? `₹${paidVal.toLocaleString("en-IN")}` : "₹0.00"}
              </div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {order.advancePaid ? "Advance Received" : "Unpaid"}
              </div>
            </div>

            {/* Pending Payment */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#121520] border border-amber-500/20 shadow-2xs">
              <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                <span>PENDING</span>
                <Clock size={12} className="stroke-[2.2]" />
              </div>
              <div className="text-sm font-black text-neutral-900 dark:text-white mt-1">
                {pendingVal > 0 ? `₹${pendingVal.toLocaleString("en-IN")}` : (totalVal > 0 && paidVal >= totalVal ? "₹0.00" : "Pending Quote")}
              </div>
              <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {pendingVal > 0 ? "Balance Due" : "No Dues"}
              </div>
            </div>

            {/* Total Order Value */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 shadow-2xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-neutral-500 uppercase tracking-wider">
                <span>TOTAL VALUE</span>
                <CreditCard size={12} />
              </div>
              <div className="text-sm font-black text-neutral-900 dark:text-white mt-1">
                {totalVal > 0 ? `₹${totalVal.toLocaleString("en-IN")}` : "On Request"}
              </div>
              <div className="text-[10px] font-medium text-neutral-400 mt-0.5">
                {order.advancePercent ? `${order.advancePercent}% Advance Term` : "Standard Terms"}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Drawer Tabs: Comments & Notes vs Order Story */}
        <div className="px-5 pt-1 pb-2 border-b border-neutral-100 dark:border-white/5 flex items-center gap-2 bg-white dark:bg-[#10131d]">
          <button
            type="button"
            onClick={() => setActiveTab("comments")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "comments"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
              }`}
          >
            <MessageSquare size={13} />
            <span>Comments & Notes</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current">
              {comments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("story")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "story"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
              }`}
          >
            <History size={13} />
            <span>Order Story (Timeline)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current">
              {history.length}
            </span>
          </button>
        </div>

        {/* 3. Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
              <Loader2 size={24} className="animate-spin text-blue-600 mb-2" />
              <span className="text-xs font-medium">Loading details...</span>
            </div>
          ) : activeTab === "comments" ? (
            /* Comments & Notes Thread */
            <div className="space-y-4">
              <div className="space-y-3">
                {comments.map((c, idx) => {
                  const isAdminRole = c.authorRole?.toLowerCase() === "admin";
                  const isEngineerRole = c.authorRole?.toLowerCase() === "engineer";

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/70 dark:border-white/5 space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shadow-2xs shrink-0 ${isAdminRole
                              ? "bg-gradient-to-tr from-purple-600 to-indigo-600"
                              : isEngineerRole
                                ? "bg-gradient-to-tr from-blue-600 to-cyan-600"
                                : "bg-gradient-to-tr from-emerald-600 to-teal-600"
                            }`}>
                            {(c.authorName || c.authorRole || "U").charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-extrabold text-neutral-900 dark:text-white truncate">
                            {c.authorName || c.authorRole || "User"}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${isAdminRole
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              : isEngineerRole
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}>
                            {c.authorRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 shrink-0">
                          {formatDateTime(c.createdAtUtc)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed m-0 pl-8">
                        {c.message}
                      </p>
                    </div>
                  );
                })}

                {comments.length === 0 && (
                  <div className="text-center py-12 px-4 border border-dashed border-neutral-200 dark:border-white/10 rounded-2xl">
                    <MessageSquare size={24} className="text-neutral-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 m-0">No comments recorded yet</p>
                    <p className="text-[11px] text-neutral-400 mt-1 m-0">
                      Post an engineering note or updates regarding tooling, casting, or dispatch.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Order Story (Timeline) */
            <div className="space-y-4">
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-white/10">
                {history.map((h, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white dark:ring-[#10131d]" />
                    <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200/70 dark:border-white/5 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-neutral-900 dark:text-white">
                          {h.toStatus.replace(/_/g, " ").toUpperCase()}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {formatDateTime(h.createdAtUtc)}
                        </span>
                      </div>
                      {h.note && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 m-0">
                          {h.note}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 pt-0.5 text-[10.5px]">
                        <div className="w-4 h-4 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center text-[9px]">
                          {(h.changedByRole || "S").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-neutral-600 dark:text-neutral-400">
                          {h.changedByRole || "System"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {history.length === 0 && (
                  <div className="text-center py-12 px-4 border border-dashed border-neutral-200 dark:border-white/10 rounded-2xl">
                    <History size={24} className="text-neutral-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 m-0">No timeline history recorded</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. Post New Comment Box (Available on RHS) */}
        <div className="p-4 border-t border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.02]">
          <form onSubmit={handlePostComment} className="space-y-2">
            <div className="relative">
              <textarea
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write an internal note or update..."
                className="w-full p-3 rounded-xl text-xs bg-white dark:bg-[#161a26] border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 resize-none font-medium"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] text-neutral-400">
                Visible to engineers & admins
              </span>
              <button
                type="submit"
                disabled={!newComment.trim() || posting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {posting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
                <span>Post Comment</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Live Pipeline Analytics View Component ─────────────────────────────────── */

function PipelineAnalyticsView({ orders }: { orders: EngineerOrder[] }) {
  const total = orders.length;

  const stageCounts = COLUMNS.map((col) => {
    const count = orders.filter((o) => {
      const stage = o.manufacturingStage || o.status || "pattern_development";
      return stage === col.code;
    }).length;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return { ...col, count, percent };
  });

  const totalPcs = orders.reduce((acc, o) => acc + (o.totalQuantity || 0), 0);

  const readyOrPacked = orders.filter((o) => {
    const s = o.manufacturingStage || o.status || "";
    return s === "packed" || s === "ready_to_dispatch" || s === "dispatched" || s === "delivered";
  }).length;

  // Group by engineer
  const engineerLoads = orders.reduce<Record<string, { count: number; pcs: number }>>((acc, o) => {
    const name = o.assignedToUserName || "Unassigned";
    if (!acc[name]) acc[name] = { count: 0, pcs: 0 };
    acc[name].count += 1;
    acc[name].pcs += o.totalQuantity || 0;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* 1. Stage Distribution Breakdown */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0f121a] border border-neutral-200/90 dark:border-white/10 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-white m-0">
              Manufacturing Pipeline Stage Distribution
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5 m-0">
              Real-time progress and bottleneck distribution across all 5 foundry stages.
            </p>
          </div>
          <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-3 py-1 rounded-full">
            {total} Active Orders ({totalPcs.toLocaleString()} Total Pcs)
          </span>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          {stageCounts.map((col) => {
            const Icon = col.icon;
            return (
              <div key={col.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                    <div className={`p-1 rounded-md ${col.badgeBg} ${col.badgeText}`}>
                      <Icon size={14} />
                    </div>
                    <span>{col.label}</span>
                    <span className="text-neutral-400 text-[11px] font-medium">({col.description})</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-neutral-900 dark:text-white tabular-nums">{col.count} orders</span>
                    <span className="text-neutral-400">({col.percent}%)</span>
                  </div>
                </div>
                <div className="w-full h-3 rounded-full bg-neutral-100 dark:bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${col.percent}%`,
                      backgroundColor: col.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Engineer Load Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0f121a] border border-neutral-200/90 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white m-0 flex items-center gap-2">
              <User size={15} className="text-blue-500" />
              <span>Engineer Workload & Allocation</span>
            </h3>
            <span className="text-xs text-neutral-400">Live Load</span>
          </div>

          <div className="space-y-3">
            {Object.entries(engineerLoads).map(([name, data]) => (
              <div
                key={name}
                className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200/70 dark:border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">{name}</div>
                    <div className="text-[10px] text-neutral-400">{data.pcs.toLocaleString()} pieces in casting</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{data.count} jobs</div>
                  <div className="text-[10px] text-neutral-400">{total > 0 ? Math.round((data.count / total) * 100) : 0}% share</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Dispatch SLA Readiness */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0f121a] border border-neutral-200/90 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white m-0 flex items-center gap-2">
              <Clock size={15} className="text-amber-500" />
              <span>Dispatch Readiness & Timelines</span>
            </h3>
            <span className="text-xs text-neutral-400">Schedule SLA</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Advance Payment Verified</div>
                <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">Ready for full production throughput</div>
              </div>
              <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums">
                {orders.filter((o) => o.advancePaid).length}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-cyan-800 dark:text-cyan-300">Ready for Dispatch / Packed</div>
                <div className="text-[10px] text-cyan-600/70 dark:text-cyan-400/70">Staged in wooden crating / logistics bay</div>
              </div>
              <div className="text-lg font-extrabold text-cyan-700 dark:text-cyan-300 tabular-nums">
                {readyOrPacked}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
