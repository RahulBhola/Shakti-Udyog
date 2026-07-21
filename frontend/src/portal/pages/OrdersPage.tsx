import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  customerApi,
  type OrderDetail,
  type OrderListItem,
  type TimelineEntry,
} from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { Panel, StatusBadge, formatDate, formatMoney } from "../shared";

export function OrderListPage() {
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerApi.orders().then(setOrders).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <h1>Orders</h1>
      {error && <EmptyState title="Orders unavailable" text={error} />}
      {!orders && !error && <Loading label="Loading orders" />}
      {orders && orders.length === 0 && <EmptyState title="No orders yet" />}
      {orders && orders.length > 0 && (
        <div className="list-rows">
          {orders.map((o) => (
            <Link key={o.id} to={`/customer/orders/${o.id}`} className="row-link">
              <div className="list-row">
                <div className="list-row__main">
                  <div className="list-row__title">{o.orderNumber}</div>
                  <div className="list-row__meta">
                    Placed {formatDate(o.placedAtUtc)} · {o.totalQuantity} pcs
                    {o.promisedDispatchDateUtc && ` · promised dispatch ${formatDate(o.promisedDispatchDateUtc)}`}
                    {` · updated ${formatDate(o.lastUpdatedAtUtc)}`}
                  </div>
                </div>
                <StatusBadge status={o.statusLabel} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

const trackingFlow = [
  "confirmed", "pattern_development", "production", "quality_check",
  "packed", "ready_to_dispatch", "dispatched", "delivered",
];

export function OrderTimelinePage() {
  const { id = "" } = useParams();
  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    customerApi.orderTimeline(id).then(setTimeline).catch(() => setMissing(true));
  }, [id]);

  if (missing) return <EmptyState title="Order not found" />;
  if (!timeline) return <Loading label="Loading timeline" />;

  return (
    <>
      <h1>Order Timeline</h1>
      <Panel>
        <OrderTrack timeline={timeline} />
      </Panel>
      <p><Link to={`/customer/orders/${id}`}>← Back to order details</Link></p>
    </>
  );
}

function OrderTrack({ timeline }: { timeline: TimelineEntry[] }) {
  const reachedCodes = new Set(timeline.map((t) => t.statusCode));
  const currentIndex = Math.max(...trackingFlow.map((code, i) => (reachedCodes.has(code) ? i : -1)));

  return (
    <ol className="track">
      {trackingFlow.map((code, i) => {
        const entries = timeline.filter((t) => t.statusCode === code);
        const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "";
        const label = entries[0]?.statusLabel
          ?? code.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
        return (
          <li key={code} className={state}>
            <div className="track__label">{label}</div>
            {entries.map((entry, j) => (
              <div key={j}>
                {entry.message && <div>{entry.message}</div>}
                <div className="track__meta">{formatDate(entry.occurredAtUtc)} · {entry.actorType}</div>
              </div>
            ))}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderDetailPage() {
  const { id = "" } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    customerApi.order(id).then(setOrder).catch(() => setMissing(true));
    customerApi.orderTimeline(id).then(setTimeline).catch(() => {});
  }, [id]);

  async function submitSupport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = (data.get("subject") as string).trim();
    const message = (data.get("message") as string).trim();
    if (subject.length < 3 || message.length < 10) return;

    setBusy(true);
    try {
      await customerApi.createSupportRequest(id, subject, message);
      setSupportMessage("Your support request has been raised. Our team will respond.");
      setSupportOpen(false);
    } catch {
      setSupportMessage("Could not raise the request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (missing) return <EmptyState title="Order not found" />;
  if (!order) return <Loading label="Loading order" />;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <h1>{order.orderNumber}</h1>
        <StatusBadge status={order.statusLabel} />
      </div>
      <p>{order.statusDescription}</p>

      <div className="panel-grid panel-grid--2">
        <Panel title="Tracking" actions={<Link to={`/customer/orders/${id}/timeline`}>Full timeline</Link>}>
          {timeline ? <OrderTrack timeline={timeline} /> : <Loading label="Loading timeline" />}
        </Panel>

        <div style={{ display: "grid", gap: "var(--sp-5)", alignContent: "start" }}>
          <Panel title="Order summary">
            <div className="table-scroll">
              <table className="data-table">
                <tbody>
                  <tr><th scope="row">PO reference</th><td>{order.purchaseOrderReference ?? "—"}</td></tr>
                  <tr><th scope="row">Placed</th><td>{formatDate(order.placedAtUtc)}</td></tr>
                  <tr><th scope="row">Promised dispatch</th><td>{formatDate(order.promisedDispatchDateUtc)}</td></tr>
                  <tr><th scope="row">Delivery address</th><td>{order.deliveryAddress ?? "—"}</td></tr>
                  <tr><th scope="row">Last update</th><td>{formatDate(order.lastUpdatedAtUtc)}</td></tr>
                </tbody>
              </table>
            </div>
          </Panel>

          {order.shipments.map((s) => (
            <Panel key={s.id} title="Shipment">
              <div className="table-scroll">
                <table className="data-table">
                  <tbody>
                    <tr><th scope="row">Transporter</th><td>{s.transporter ?? "—"}</td></tr>
                    <tr><th scope="row">Tracking / LR no.</th><td>{s.trackingNumber ?? "—"}</td></tr>
                    <tr><th scope="row">Dispatch date</th><td>{formatDate(s.dispatchDateUtc)}</td></tr>
                    <tr><th scope="row">Estimated arrival</th><td>{formatDate(s.estimatedArrivalUtc)}</td></tr>
                    <tr><th scope="row">Delivered</th><td>{formatDate(s.deliveredAtUtc)}</td></tr>
                    <tr>
                      <th scope="row">Proof of delivery</th>
                      <td>{s.hasProofOfDelivery ? "Available in Documents" : "[Not yet available]"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Panel>
          ))}
        </div>
      </div>

      <Panel title="Line items">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Part</th>
                <th scope="col">Description</th>
                <th scope="col">Grade</th>
                <th scope="col">Rev.</th>
                <th scope="col">Ordered</th>
                <th scope="col">Produced</th>
                <th scope="col">Dispatched</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.partNumber}>
                  <th scope="row">{item.partNumber}</th>
                  <td>{item.description}</td>
                  <td>{item.materialGrade ?? "—"}</td>
                  <td>{item.drawingRevision ?? "—"}</td>
                  <td>{item.quantityOrdered} {item.unit}</td>
                  <td>{item.quantityProduced} {item.unit}</td>
                  <td>{item.quantityDispatched} {item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="panel-grid panel-grid--2">
        <Panel title="Commercial summary">
          {order.commercial ? (
            <div className="table-scroll">
              <table className="data-table">
                <tbody>
                  <tr><th scope="row">Invoice</th><td>{order.commercial.invoiceNumber}</td></tr>
                  <tr><th scope="row">Invoice date</th><td>{formatDate(order.commercial.invoiceDateUtc)}</td></tr>
                  <tr><th scope="row">Due date</th><td>{formatDate(order.commercial.dueDateUtc)}</td></tr>
                  <tr><th scope="row">Total</th><td>{formatMoney(order.commercial.total)}</td></tr>
                  <tr><th scope="row">Paid</th><td>{formatMoney(order.commercial.amountPaid)}</td></tr>
                  <tr><th scope="row">Balance</th><td><strong>{formatMoney(order.commercial.balanceDue)}</strong></td></tr>
                  <tr><th scope="row">Payment status</th><td>{order.commercial.paymentStatus && <StatusBadge status={order.commercial.paymentStatus} />}</td></tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="placeholder-note">No invoice has been issued for this order yet.</p>
          )}
        </Panel>

        <Panel title="Documents">
          {order.documents.length === 0 ? (
            <p className="placeholder-note">No documents shared for this order yet.</p>
          ) : (
            <div className="list-rows">
              {order.documents.map((d) => (
                <div className="list-row" key={d.id}>
                  <div className="list-row__main">
                    <div className="list-row__title">{d.title}</div>
                    <div className="list-row__meta">{d.category}</div>
                  </div>
                  <Link to="/customer/documents">Open</Link>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Need help with this order?">
        {supportMessage && <p className="form-status form-status--ok" role="status">{supportMessage}</p>}
        {!supportOpen ? (
          <button className="btn btn--primary" type="button" onClick={() => setSupportOpen(true)}>
            Raise a support request
          </button>
        ) : (
          <form className="form" onSubmit={submitSupport}>
            <div className="form__field">
              <label htmlFor="s-subject">Subject *</label>
              <input id="s-subject" name="subject" required minLength={3} />
            </div>
            <div className="form__field">
              <label htmlFor="s-message">How can we help? *</label>
              <textarea id="s-message" name="message" required minLength={10} />
            </div>
            <div className="quick-actions">
              <button className="btn btn--primary" type="submit" disabled={busy}>
                {busy ? "Sending…" : "Submit request"}
              </button>
              <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} type="button" onClick={() => setSupportOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </Panel>
    </>
  );
}

export default OrderListPage;
