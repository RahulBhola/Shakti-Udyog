import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPatch } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { connectRealtime, getRealtimeConnection, type StageChangedPayload } from "../../realtime/signalR";
import { formatDate } from "../shared";
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
  GripVertical,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Package,
  Boxes,
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

/* ── Main Manufacturing Kanban Board ────────────────────────────────────────── */

export default function EngineerBoardPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes("Admin") ?? false;
  const navigate = useNavigate();

  const [orders, setOrders] = useState<EngineerOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const dragOrder = useRef<EngineerOrder | null>(null);

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
  const inPattern = orders?.filter((o) => effectiveOrderStage(o) === "pattern_development").length ?? 0;
  const inProduction = orders?.filter((o) => effectiveOrderStage(o) === "production").length ?? 0;
  const inQC = orders?.filter((o) => effectiveOrderStage(o) === "quality_check").length ?? 0;
  const readyOrPacked = orders?.filter((o) => {
    const s = effectiveOrderStage(o);
    return s === "packed" || s === "ready_to_dispatch";
  }).length ?? 0;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header & KPI Banner ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f121a] p-6 sm:p-7 rounded-3xl border border-neutral-200/90 dark:border-white/10 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              {isAdmin ? "Factory Operations" : "Engineer Workspace"}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Realtime Sync (Bidirectional Stages)</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
            {isAdmin ? "Foundry Manufacturing Pipeline" : "My Assigned Production Orders"}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 m-0">
            Move orders backward or forward across 5 synchronized production stages via drag-and-drop or quick stage buttons.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search Order #, Client, Engineer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 pr-4 rounded-xl text-xs bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 w-56 sm:w-68 font-medium"
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
          <div className="text-[10px] text-neutral-400 mt-0.5">Total Orders in Factory</div>
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

      {/* ── Kanban Columns Horizontal Board (Responsive with Smooth Scroll) ─────────── */}
      <div className="overflow-x-auto pb-4 -mx-1 px-1">
        <div className="flex gap-4 items-start min-w-[1280px]">
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
                className={`flex-1 min-w-[275px] max-w-[340px] flex flex-col rounded-3xl border bg-neutral-50/70 dark:bg-[#0c0e14] p-3 transition-all min-h-[560px] ${
                  droppable
                    ? "border-dashed border-2 border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 shadow-md ring-2 ring-blue-500/20"
                    : "border-neutral-200/90 dark:border-white/10"
                }`}
              >
                {/* Column Header */}
                <div className="p-3.5 mb-2.5 rounded-2xl bg-white dark:bg-[#121520] border border-neutral-200/80 dark:border-white/10 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-xl ${column.badgeBg} ${column.badgeText} shrink-0`}>
                        <Icon size={17} className="stroke-[2.2]" />
                      </div>
                      <span className="text-[13px] font-extrabold text-neutral-900 dark:text-white leading-tight">
                        {column.label}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full text-xs font-extrabold ${column.badgeBg} ${column.badgeText} shrink-0`}
                    >
                      {items.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-medium leading-tight">
                    {column.description}
                  </div>
                </div>

                {/* Order Cards Container */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
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
                    />
                  ))}

                  {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-14 px-3 text-center border border-dashed border-neutral-200 dark:border-white/10 rounded-2xl">
                      <span className="text-xs font-medium text-neutral-400">No orders in this stage</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Modern Rich Order Card Component with Explicit Engineer Display ─────── */

function OrderCard({
  order,
  isAdmin,
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
}: {
  order: EngineerOrder;
  isAdmin: boolean;
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
}) {
  const detailUrl = isAdmin ? `/admin/orders/${order.id}` : `/engineer/orders/${order.id}`;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group relative rounded-2xl bg-white dark:bg-[#121520] border border-neutral-200/90 dark:border-white/10 p-4 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing hover:border-blue-500/50 space-y-3 ${
        isDragging ? "opacity-40 scale-95 ring-2 ring-blue-500" : ""
      }`}
    >
      {/* 1. Top Row: Order Number Monospace Chip + Quantity Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical size={14} className="text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 shrink-0" />
          <Link
            to={detailUrl}
            className="font-mono text-xs font-bold text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate no-underline"
            title={order.orderNumber}
          >
            {order.orderNumber}
          </Link>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 shrink-0 border border-neutral-200/60 dark:border-white/10">
          {order.totalQuantity} pcs
        </span>
      </div>

      {/* 2. Product Name & Client Details */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-white">
          <Package size={14} className="text-blue-500 shrink-0" />
          <span className="truncate">{order.productType || "Commercial Casting Job"}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <Building2 size={13} className="shrink-0 text-neutral-400" />
          <span className="truncate">{order.companyName || "Direct Client"}</span>
        </div>
      </div>

      {/* 3. Prominent Assigned Engineer Banner */}
      <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <User size={12} className="stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-extrabold text-neutral-400 uppercase tracking-wider block leading-none">
              Assigned Engineer
            </span>
            <span className="text-[11.5px] font-extrabold text-blue-700 dark:text-blue-300 truncate block mt-0.5">
              {order.assignedToUserName || "Primary Staff Engineer"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Milestone & Logistics Metadata */}
      <div className="space-y-1.5 pt-1 text-[11px]">
        {order.advancePaid && (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} className="stroke-[2.2]" />
            <span>Advance Verified</span>
          </div>
        )}

        {order.promisedDispatchDateUtc && (
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[10.5px]">
            <span className="flex items-center gap-1">
              <Calendar size={11} className="text-neutral-400" /> Target Dispatch:
            </span>
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              {formatDate(order.promisedDispatchDateUtc)}
            </span>
          </div>
        )}

        <div className="text-[10px] text-neutral-400">
          {order.stageUpdatedAt ? `Updated ${formatDate(order.stageUpdatedAt)}` : `Placed ${formatDate(order.placedAtUtc)}`}
        </div>
      </div>

      {/* 5. Responsive Stage Action Controls (No Overflow / Overflow-Safe) */}
      <div className="pt-2 border-t border-neutral-100 dark:border-white/5 grid grid-cols-3 gap-1.5">
        {prevColumn && colIndex > 0 ? (
          <button
            type="button"
            title={`Move back to ${prevColumn.label}`}
            onClick={onRegress}
            disabled={isMoving}
            className="inline-flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl text-[10px] font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-white/5 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors shadow-xs disabled:opacity-50 cursor-pointer truncate min-w-0"
          >
            <ArrowLeft size={10} className="shrink-0" />
            <span className="truncate">{prevColumn.shortLabel}</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl text-[10.5px] font-bold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer truncate min-w-0"
        >
          <span>Details</span>
          <ExternalLink size={10} className="shrink-0" />
        </button>

        {nextColumn && colIndex < 4 ? (
          <button
            type="button"
            title={`Advance to ${nextColumn.label}`}
            onClick={onAdvance}
            disabled={isMoving}
            className="inline-flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-xl text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer truncate min-w-0"
          >
            <span className="truncate">{isMoving ? "..." : nextColumn.shortLabel}</span>
            <ArrowRight size={10} className="shrink-0" />
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
