import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { updaterApi } from "../../../api/updaterApi";
import type { OrderListItem, Paged } from "../../../api/customerApi";
import { EmptyState, Loading } from "../../../components/ui";
import { StatusBadge, formatDate } from "../../shared";

const statusOptions = ["confirmed", "pattern_development", "production", "quality_check", "packed", "ready_to_dispatch", "dispatched", "delivered", "on_hold", "cancelled"];

export default function UpdaterOrderListPage() {
  const [data, setData] = useState<Paged<OrderListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    updaterApi.orders(page, 20, undefined, statusFilter || undefined)
      .then(setData).catch((e: Error) => setError(e.message));
  }, [page, statusFilter]);

  useEffect(load, [load]);
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <>
      <h1>Orders</h1>
      <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        style={{ padding: "0.6rem", marginBottom: "var(--sp-4)", border: "1px solid var(--c-line)", borderRadius: "var(--radius)", background: "rgba(15,21,36,0.55)", color: "var(--c-ink)" }}>
        <option value="">All statuses</option>
        {statusOptions.map(s => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
      </select>
      {error && <EmptyState title="Orders unavailable" text={error} />}
      {!data && !error && <Loading label="Loading orders" />}
      {data && data.items.length === 0 && <EmptyState title="No orders found" />}
      {data && data.items.length > 0 && (
        <div className="list-rows">
          {data.items.map((o) => (
            <Link key={o.id} to={`/admin/orders/${o.id}`} className="row-link">
              <div className="list-row">
                <div className="list-row__main">
                  <div className="list-row__title">{o.orderNumber}</div>
                  <div className="list-row__meta">Placed {formatDate(o.placedAtUtc)} · {o.totalQuantity} pcs</div>
                </div>
                <StatusBadge status={o.statusLabel} />
              </div>
            </Link>
          ))}
        </div>
      )}
      {data && totalPages > 1 && (
        <div className="quick-actions" style={{ justifyContent: "center" }}>
          <button className="btn btn--ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
          <span style={{ color: "var(--c-ink-muted)", fontSize: "var(--fs-sm)" }}>Page {page} of {totalPages}</span>
          <button className="btn btn--ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </>
  );
}
