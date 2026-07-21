import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { updaterApi } from "../../../api/updaterApi";
import type { OrderDetail } from "../../../api/customerApi";
import { EmptyState, Loading } from "../../../components/ui";
import { Panel, StatusBadge, formatDate } from "../../shared";

export default function UpdaterOrderDetailPage() {
  const { id = "" } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    updaterApi.order(id).then(setOrder).catch(() => setMissing(true));
  }, [id]);

  async function updateMilestone(statusCode: string) {
    setBusy(true); setMsg(null);
    try {
      const r = await updaterApi.updateMilestone(id, statusCode);
      setMsg(r.message);
      setOrder(await updaterApi.order(id));
    } catch { setMsg("Update failed."); }
    finally { setBusy(false); }
  }

  if (missing) return <EmptyState title="Order not found" />;
  if (!order) return <Loading label="Loading order" />;

  const milestones = ["confirmed", "pattern_development", "production", "quality_check", "packed", "ready_to_dispatch", "dispatched", "delivered"];

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
          </tbody></table></div>
        </Panel>
        <Panel title="Update milestone">
          <div className="quick-actions">
            {milestones.map((m) => (
              <button key={m} className="btn btn--ghost" style={{ color: "var(--c-ink)", padding: "0.3rem 0.7rem", fontSize: "var(--fs-xs)" }}
                disabled={busy || order.status === m} onClick={() => void updateMilestone(m)}>
                {m.replaceAll("_", " ")}
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Line items">
        <div className="table-scroll"><table className="data-table"><thead><tr>
          <th scope="col">Part</th><th scope="col">Description</th><th scope="col">Ordered</th>
          <th scope="col">Produced</th><th scope="col">Dispatched</th>
        </tr></thead><tbody>
          {order.items.map((i) => (
            <tr key={i.partNumber}><th scope="row">{i.partNumber}</th><td>{i.description}</td>
              <td>{i.quantityOrdered}</td><td>{i.quantityProduced}</td><td>{i.quantityDispatched}</td></tr>
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
