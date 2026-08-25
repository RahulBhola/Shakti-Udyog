import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { connectRealtime, getRealtimeConnection, type StageChangedPayload } from "../../realtime/signalR";
import { formatDate } from "../shared";

export interface EngineerOrder {
  id: string;
  orderNumber: string;
  companyName: string | null;
  productType: string | null;
  totalQuantity: number;
  manufacturingStage: string;
  placedAtUtc: string;
  stageUpdatedAt: string | null;
}

/* ── Board columns (forward-only workflow) ────────────────────────────────── */

interface BoardColumn {
  code: string;
  label: string;
  color: string;
}

const COLUMNS: BoardColumn[] = [
  { code: "pattern_development", label: "Pattern Development", color: "#8b5cf6" },
  { code: "production", label: "Production", color: "#6366f1" },
  { code: "quality_check", label: "QC", color: "#a78bfa" },
  { code: "packed", label: "Packed", color: "#14b8a6" },
  { code: "ready_to_dispatch", label: "Ready To Dispatch", color: "#06b6d4" },
];

const columnIndex = (code: string): number => COLUMNS.findIndex((c) => c.code === code);
const columnLabel = (code: string): string => COLUMNS[columnIndex(code)]?.label ?? code;

/* ── Main board ───────────────────────────────────────────────────────────── */

export default function EngineerBoardPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes("Admin") ?? false;

  const [orders, setOrders] = useState<EngineerOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dragOrder = useRef<EngineerOrder | null>(null);

  const load = useCallback(() => {
    apiGet<EngineerOrder[]>("/api/v1/engineer/orders")
      .then((data) => { setOrders(data); setError(null); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // Keep the board in sync when any engineer moves an order.
  useEffect(() => {
    void connectRealtime();
    const conn = getRealtimeConnection();
    const handler = (_p: StageChangedPayload) => load();
    conn.on("stageChanged", handler);
    return () => { conn.off("stageChanged", handler); };
  }, [load]);

  const handleDragStart = useCallback((order: EngineerOrder) => {
    setDraggedId(order.id);
    dragOrder.current = order;
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    dragOrder.current = null;
  }, []);

  // Only the immediately-next column is a valid forward move (no skip/backward).
  const canDropOn = (targetStage: string): boolean => {
    const cur = dragOrder.current;
    if (!cur || cur.id !== draggedId) return false;
    const from = columnIndex(cur.manufacturingStage);
    const to = columnIndex(targetStage);
    return from >= 0 && to === from + 1;
  };

  const handleDrop = useCallback(async (targetStage: string) => {
    const order = dragOrder.current;
    if (!order || order.id !== draggedId) { setDraggedId(null); return; }
    const from = columnIndex(order.manufacturingStage);
    const to = columnIndex(targetStage);

    if (from < 0 || to !== from + 1) {
      const nextCode = COLUMNS[from + 1]?.code;
      setNotice(`"${order.orderNumber}" can only move one stage forward (to ${columnLabel(nextCode ?? order.manufacturingStage)}).`);
      setDraggedId(null);
      dragOrder.current = null;
      return;
    }

    // Optimistic move; revert on failure (backend re-enforces the rule).
    setOrders((prev) => prev?.map((o) => o.id === order.id ? { ...o, manufacturingStage: targetStage } : o) ?? prev);
    setDraggedId(null);
    dragOrder.current = null;
    try {
      await apiPatch(`/api/v1/engineer/orders/${order.id}/stage`, { stage: targetStage });
      load();
    } catch {
      setOrders((prev) => prev?.map((o) => o.id === order.id ? { ...o, manufacturingStage: order.manufacturingStage } : o) ?? prev);
      setNotice(`Unable to move "${order.orderNumber}": only one forward stage at a time is allowed.`);
    }
  }, [draggedId, load]);

  const byColumn = COLUMNS.map((c) => ({
    column: c,
    items: (orders ?? []).filter((o) => o.manufacturingStage === c.code),
  }));

  return (
    <div className="prod-board">
      <div className="prod-board__header">
        <div className="prod-board__header-left">
          <h1>{isAdmin ? "Manufacturing Pipeline" : "My Manufacturing"}</h1>
          <p>
            {isAdmin
              ? "All active factory orders across manufacturing stages. Track and advance orders through production."
              : "Orders assigned to you — move each one forward through the manufacturing stages."}
          </p>
        </div>
        <div className="prod-board__header-right">
          <div className="prod-board__kpi">
            <div className="prod-board__kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M2 12h20"/><path d="M12 2v20"/></svg></div>
            <div><div className="prod-board__kpi-value">{orders?.length ?? 0}</div><div className="prod-board__kpi-label">{isAdmin ? "Active Orders" : "Assigned Orders"}</div></div>
          </div>
          <button className="prod-board__btn-ghost" onClick={load}>⟳ Refresh</button>
        </div>
      </div>

      {loading && <div className="prod-board__loading"><div className="spinner" /></div>}
      {error && <p className="placeholder-note">{error}</p>}
      {!loading && !error && (orders ?? []).length === 0 && (
        <div style={{ textAlign: "center", padding: "28px 16px" }}>
          <p className="placeholder-note" style={{ margin: "0 0 12px" }}>
            {isAdmin
              ? "No active manufacturing orders found in the pipeline."
              : "No orders are assigned to you yet."}
          </p>
          {isAdmin && (
            <Link
              to="/admin/orders"
              className="prod-board__btn-ghost"
              style={{ display: "inline-flex", textDecoration: "none" }}
            >
              View Orders Management →
            </Link>
          )}
        </div>
      )}

      {notice && (
        <div style={{ padding: "10px 16px", margin: "0 24px 8px", borderRadius: "10px", background: "rgba(245,158,11,0.12)", color: "#f59e0b", fontSize: "13px" }}>{notice}</div>
      )}

      {/* Columns */}
      <div className="prod-board__columns">
        {byColumn.map(({ column, items }) => {
          const droppable = draggedId !== null && canDropOn(column.code);
          return (
            <div
              key={column.code}
              className={`prod-board__column ${draggedId ? "prod-board__column--droppable" : ""}`}
              onDragOver={(e) => { if (droppable) e.preventDefault(); }}
              onDrop={(e) => { if (droppable) { e.preventDefault(); void handleDrop(column.code); } }}
            >
              <div className="prod-board__column-header">
                <span className="prod-board__column-dot" style={{ backgroundColor: column.color }} />
                <span className="prod-board__column-title">{column.label}</span>
                <span className="prod-board__column-count">{items.length}</span>
              </div>
              <div className="prod-board__cards">
                {items.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isDragging={draggedId === order.id}
                    onDragStart={() => handleDragStart(order)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Order card ───────────────────────────────────────────────────────────── */

function OrderCard({
  order, isDragging, onDragStart, onDragEnd,
}: {
  order: EngineerOrder;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      className={`prod-board__card ${isDragging ? "prod-board__card--dragging" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={`${order.orderNumber} · ${order.companyName ?? ""}`}
    >
      <div className="prod-board__card-header">
        <span className="prod-board__card-key">{order.orderNumber}</span>
        <span className="prod-board__card-priority" style={{ color: "var(--color-primary)" }}>
          {order.totalQuantity} pcs
        </span>
      </div>
      <div className="prod-board__card-casting">{order.productType ?? order.orderNumber}</div>
      <div className="prod-board__card-customer">{order.companyName ?? "—"}</div>
      <div className="prod-board__card-bottom">
        {order.stageUpdatedAt
          ? <span className="prod-board__card-due">Updated {formatDate(order.stageUpdatedAt)}</span>
          : <span className="prod-board__card-due">{formatDate(order.placedAtUtc)}</span>}
      </div>
    </div>
  );
}
