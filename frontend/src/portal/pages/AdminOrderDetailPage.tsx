import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import type { OrderDetail } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { Panel, StatusBadge, formatDate } from "../shared";

export default function AdminOrderDetailPage() {
  const { id = "" } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi.order(id).then(setOrder).catch(() => setMissing(true));
  }, [id]);

  async function cancelOrder() {
    const reason = prompt("Cancellation reason:");
    if (!reason) return;
    setBusy(true);
    try {
      const r = await adminApi.cancelOrder(id, reason);
      setMsg(r.message);
      setOrder(await adminApi.order(id));
    } catch { setMsg("Cancel failed."); }
    finally { setBusy(false); }
  }

  if (missing) return <EmptyState title="Order not found" />;
  if (!order) return <Loading label="Loading order" />;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <h1>{order.orderNumber}</h1>
        <StatusBadge status={order.statusLabel} />
      </div>
      {msg && <p className={`form-status ${msg.includes("failed") ? "form-status--error" : "form-status--ok"}`}>{msg}</p>}

      <div className="panel-grid panel-grid--2">
        <Panel title="Order details">
          <div className="table-scroll"><table className="data-table"><tbody>
            <tr><th scope="row">PO reference</th><td>{order.purchaseOrderReference ?? "—"}</td></tr>
            <tr><th scope="row">Placed</th><td>{formatDate(order.placedAtUtc)}</td></tr>
            <tr><th scope="row">Promised dispatch</th><td>{formatDate(order.promisedDispatchDateUtc)}</td></tr>
            <tr><th scope="row">Delivery address</th><td>{order.deliveryAddress ?? "—"}</td></tr>
            <tr><th scope="row">Last update</th><td>{formatDate(order.lastUpdatedAtUtc)}</td></tr>
          </tbody></table></div>
        </Panel>

        <Panel title="Admin actions">
          <div className="quick-actions">
            <button className="btn btn--primary" disabled={busy} onClick={() => void cancelOrder()}>Cancel order</button>
          </div>
        </Panel>
      </div>

      <Panel title="Line items">
        <div className="table-scroll"><table className="data-table"><thead><tr>
          <th scope="col">Part</th><th scope="col">Description</th><th scope="col">Grade</th>
          <th scope="col">Ordered</th><th scope="col">Produced</th><th scope="col">Dispatched</th>
        </tr></thead><tbody>
          {order.items.map((i) => (
            <tr key={i.partNumber}><th scope="row">{i.partNumber}</th><td>{i.description}</td>
              <td>{i.materialGrade ?? "—"}</td><td>{i.quantityOrdered}</td><td>{i.quantityProduced}</td><td>{i.quantityDispatched}</td></tr>
          ))}
        </tbody></table></div>
      </Panel>

      {order.shipments.map((s) => (
        <Panel key={s.id} title="Shipment">
          <div className="table-scroll"><table className="data-table"><tbody>
            <tr><th scope="row">Transporter</th><td>{s.transporter ?? "—"}</td></tr>
            <tr><th scope="row">Tracking</th><td>{s.trackingNumber ?? "—"}</td></tr>
            <tr><th scope="row">Dispatch</th><td>{formatDate(s.dispatchDateUtc)}</td></tr>
            <tr><th scope="row">ETA</th><td>{formatDate(s.estimatedArrivalUtc)}</td></tr>
            <tr><th scope="row">Delivered</th><td>{formatDate(s.deliveredAtUtc)}</td></tr>
          </tbody></table></div>
        </Panel>
      ))}
    </>
  );
}
