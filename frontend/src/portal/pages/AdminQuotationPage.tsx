import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import type { QuotationDetail as QD, QuotationTimelineEntry } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { Panel, StatusBadge, formatDate, formatMoney } from "../shared";

export default function AdminQuotationDetailPage() {
  const { id = "" } = useParams();
  const [q, setQ] = useState<QD | null>(null);
  const [tl, setTl] = useState<QuotationTimelineEntry[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi.quotation(id).then(setQ).catch(() => setMissing(true));
    adminApi.history(id).then(setTl).catch(() => {});
  }, [id]);

  async function doAction(action: () => Promise<{ message: string }>) {
    setBusy(true); setMsg(null);
    try { const r = await action(); setMsg(r.message); setQ(await adminApi.quotation(id)); setTl(await adminApi.history(id)); }
    catch { setMsg("Action failed."); }
    finally { setBusy(false); }
  }

  if (missing) return <EmptyState title="Quotation not found" />;
  if (!q) return <Loading label="Loading quotation" />;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <h1>{q.quotationNumber}</h1>
        <StatusBadge status={q.status} />
      </div>

      {msg && <p className={`form-status ${msg.includes("failed") ? "form-status--error" : "form-status--ok"}`}>{msg}</p>}

      <div className="panel-grid panel-grid--2">
        <Panel title="Details">
          <div className="table-scroll"><table className="data-table"><tbody>
            <tr><th>RFQ</th><td>{q.productType}</td></tr>
            <tr><th>Total</th><td><strong>{formatMoney(q.total, q.currency)}</strong></td></tr>
            <tr><th>Subtotal</th><td>{formatMoney(q.subtotal, q.currency)}</td></tr>
            <tr><th>Tax</th><td>{formatMoney(q.tax, q.currency)}</td></tr>
            <tr><th>Discount</th><td>{formatMoney(q.discount, q.currency)}</td></tr>
            <tr><th>Payment</th><td>{q.paymentTerms ?? "—"}</td></tr>
            <tr><th>Delivery</th><td>{q.deliveryTerms ?? "—"}</td></tr>
            <tr><th>Valid until</th><td>{formatDate(q.validUntilUtc)}</td></tr>
          </tbody></table></div>
        </Panel>

        <Panel title="Actions">
          <div className="quick-actions">
            <button className="btn btn--primary" disabled={busy} onClick={() => void doAction(() => adminApi.approveQuotation(id))}>Approve</button>
            <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} disabled={busy} onClick={() => void doAction(() => adminApi.issueQuotation(id))}>Issue</button>
            <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} disabled={busy} onClick={() => void doAction(() => adminApi.cancelQuotation(id))}>Cancel</button>
          </div>
        </Panel>
      </div>

      {q.items.length > 0 && (
        <Panel title="Line items">
          <div className="table-scroll"><table className="data-table"><thead><tr>
            <th>Part</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Line Total</th>
          </tr></thead><tbody>
            {q.items.map((i) => (
              <tr key={i.lineNumber}>
                <td>{i.partNumber}</td><td>{i.description}</td>
                <td>{i.quantity} {i.unit}</td>
                <td>{formatMoney(i.unitPrice, q.currency)}</td>
                <td>{formatMoney(i.lineTotal, q.currency)}</td>
              </tr>
            ))}
          </tbody></table></div>
        </Panel>
      )}

      {tl && tl.length > 0 && (
        <Panel title="History">
          <ol className="track">
            {tl.map((e, i) => (
              <li key={i} className="done">
                <div className="track__label">{e.fromStatus} → {e.toStatus}</div>
                {e.note && <div>{e.note}</div>}
                <div className="track__meta">{formatDate(e.occurredAtUtc)} · {e.changedByRole}</div>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </>
  );
}
