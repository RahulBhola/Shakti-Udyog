import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { customerApi, type QuotationDetail, type QuotationListItem, type QuotationTimelineEntry } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { Panel, StatusBadge, formatDate, formatMoney } from "../shared";

export function QuotationListPage() {
  const [quotations, setQuotations] = useState<QuotationListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerApi.quotations().then(setQuotations).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <h1>Quotations</h1>
      {error && <EmptyState title="Quotations unavailable" text={error} />}
      {!quotations && !error && <Loading label="Loading quotations" />}
      {quotations && quotations.length === 0 && <EmptyState title="No quotations yet" />}
      {quotations && quotations.length > 0 && (
        <div className="list-rows">
          {quotations.map((q) => (
            <Link key={q.id} to={`/customer/quotations/${q.id}`} className="row-link">
              <div className="list-row">
                <div className="list-row__main">
                  <div className="list-row__title">{q.quotationNumber} — {q.productType}</div>
                  <div className="list-row__meta">
                    {formatMoney(q.total, q.currency)} · issued {formatDate(q.createdAtUtc)}
                    {q.validUntilUtc && ` · valid until ${formatDate(q.validUntilUtc)}`}
                  </div>
                </div>
                <StatusBadge status={q.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export function QuotationDetailPage() {
  const { id = "" } = useParams();
  const [quotation, setQuotation] = useState<QuotationDetail | null>(null);
  const [timeline, setTimeline] = useState<QuotationTimelineEntry[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [responding, setResponding] = useState<"accept" | "decline" | null>(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    customerApi.quotation(id).then(setQuotation).catch(() => setMissing(true));
    customerApi.quotationTimeline(id).then(setTimeline).catch(() => {});
  }, [id]);

  async function respond() {
    if (!responding || !quotation) return;
    setBusy(true);
    try {
      const result = await customerApi.respondToQuotation(quotation.id, responding, comment || undefined);
      setMessage(result.message);
      setQuotation(await customerApi.quotation(id));
      setTimeline(await customerApi.quotationTimeline(id));
      setResponding(null);
    } catch {
      setMessage("Could not record your response. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (missing) return <EmptyState title="Quotation not found" />;
  if (!quotation) return <Loading label="Loading quotation" />;

  const canRespond = quotation.status === "Issued" || quotation.status === "Viewed";

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <h1>{quotation.quotationNumber}</h1>
        <StatusBadge status={quotation.status} />
      </div>

      <div className="panel-grid panel-grid--2">
        <Panel title="Quotation summary">
          <div className="table-scroll">
            <table className="data-table">
              <tbody>
                <tr><th scope="row">Requirement</th><td>{quotation.productType}</td></tr>
                <tr><th scope="row">Revision</th><td>{quotation.revisionNumber}</td></tr>
                <tr><th scope="row">Subtotal</th><td>{formatMoney(quotation.subtotal, quotation.currency)}</td></tr>
                <tr><th scope="row">Tax</th><td>{formatMoney(quotation.tax, quotation.currency)}</td></tr>
                <tr><th scope="row">Discount</th><td>{formatMoney(quotation.discount, quotation.currency)}</td></tr>
                <tr><th scope="row"><strong>Total</strong></th><td><strong>{formatMoney(quotation.total, quotation.currency)}</strong></td></tr>
                <tr><th scope="row">Payment terms</th><td>{quotation.paymentTerms ?? "—"}</td></tr>
                <tr><th scope="row">Delivery terms</th><td>{quotation.deliveryTerms ?? "—"}</td></tr>
                <tr><th scope="row">Freight</th><td>{quotation.freight ?? "—"}</td></tr>
                <tr><th scope="row">Packing</th><td>{quotation.packing ?? "—"}</td></tr>
                <tr><th scope="row">Valid until</th><td>{formatDate(quotation.validUntilUtc)}</td></tr>
                <tr><th scope="row">Issued</th><td>{formatDate(quotation.createdAtUtc)}</td></tr>
              </tbody>
            </table>
          </div>
          {quotation.remarks && <p style={{ marginTop: "var(--sp-3)" }}><strong>Remarks:</strong> {quotation.remarks}</p>}
          <p><Link to={`/customer/rfqs/${quotation.rfqId}`}>View the originating RFQ →</Link></p>
        </Panel>

        <Panel title="Your response">
          {message && <p className={`form-status form-status--ok`} role="status">{message}</p>}
          {quotation.customerRespondedAtUtc && (
            <p>
              Responded on {formatDate(quotation.customerRespondedAtUtc)}
              {quotation.customerResponseComment && (
                <><br />Comment: &ldquo;{quotation.customerResponseComment}&rdquo;</>
              )}
            </p>
          )}
          {canRespond && !responding && (
            <div className="quick-actions">
              <button className="btn btn--primary" type="button" onClick={() => setResponding("accept")}>
                Accept quotation
              </button>
              <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} type="button" onClick={() => setResponding("decline")}>
                Decline
              </button>
            </div>
          )}
          {canRespond && responding && (
            <div className="form">
              <div className="form__field">
                <label htmlFor="q-comment">
                  Comment {responding === "decline" ? "(optional)" : "(optional)"}
                </label>
                <textarea id="q-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />
              </div>
              <div className="quick-actions">
                <button className="btn btn--primary" type="button" disabled={busy} onClick={() => void respond()}>
                  {busy ? "Recording…" : `Confirm ${responding}`}
                </button>
                <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} type="button" disabled={busy} onClick={() => setResponding(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {!canRespond && !quotation.customerRespondedAtUtc && (
            <p className="placeholder-note">This quotation is not open for a response.</p>
          )}
        </Panel>
      </div>

      {/* Line items */}
      {quotation.items.length > 0 && (
        <Panel title="Line items">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">#</th><th scope="col">Part</th><th scope="col">Description</th>
                  <th scope="col">Grade</th><th scope="col">Qty</th><th scope="col">Unit</th>
                  <th scope="col">Unit Price</th><th scope="col">Tax %</th><th scope="col">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((i) => (
                  <tr key={i.lineNumber}>
                    <td>{i.lineNumber}</td>
                    <td>{i.partNumber}</td>
                    <td>{i.description}</td>
                    <td>{i.materialGrade ?? "—"}</td>
                    <td>{i.quantity}</td>
                    <td>{i.unit}</td>
                    <td>{formatMoney(i.unitPrice, quotation.currency)}</td>
                    <td>{i.taxPercent}%</td>
                    <td>{formatMoney(i.lineTotal, quotation.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Timeline */}
      {timeline && timeline.length > 0 && (
        <Panel title="Status history">
          <ol className="track">
            {timeline.map((entry, i) => (
              <li key={i} className="done">
                <div className="track__label">{entry.fromStatus} → {entry.toStatus}</div>
                {entry.note && <div>{entry.note}</div>}
                <div className="track__meta">{formatDate(entry.occurredAtUtc)} · {entry.changedByRole}</div>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </>
  );
}

export default QuotationListPage;
