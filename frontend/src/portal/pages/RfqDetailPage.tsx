import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { customerApi, type RfqDetail, type RfqTimelineEntry } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { Panel, StatusBadge, formatBytes, formatDate } from "../shared";

const rfqStatuses = [
  "Draft", "Submitted", "Received", "Under Review", "Waiting for Customer",
  "Approved", "Rejected", "Quoted", "Accepted", "Declined", "Expired", "Cancelled",
];

export default function RfqDetailPage() {
  const { id = "" } = useParams();
  const [rfq, setRfq] = useState<RfqDetail | null>(null);
  const [timeline, setTimeline] = useState<RfqTimelineEntry[] | null>(null);
  const [missing, setMissing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    customerApi.rfq(id).then(setRfq).catch(() => setMissing(true));
    customerApi.rfqTimeline(id).then(setTimeline).catch(() => {});
  }, [id]);

  async function submitDraft() {
    if (!confirm("Submit this draft RFQ? You won't be able to edit it after submission.")) return;
    setSubmitting(true);
    try {
      await customerApi.submitRfq(id);
      const updated = await customerApi.rfq(id);
      setRfq(updated);
      setTimeline(await customerApi.rfqTimeline(id));
    } catch {
      alert("Could not submit the draft. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (missing) return <EmptyState title="RFQ not found" />;
  if (!rfq) return <Loading label="Loading RFQ" />;

  const terminalNegative = ["Rejected", "Declined", "Expired", "Cancelled"].includes(rfq.status);
  const isDraft = rfq.isDraft && rfq.status === "Draft";

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <h1>RFQ — {rfq.productType}</h1>
        <StatusBadge status={isDraft ? "Draft" : rfq.status} />
      </div>

      <div className="panel-grid panel-grid--2">
        <Panel title="Status">
          {terminalNegative ? (
            <p>This RFQ has been <strong>{rfq.status.toLowerCase()}</strong>.</p>
          ) : (
            <>
              <ol className="track">
                {rfqStatuses.map((step, i) => {
                  const flowIndex = rfqStatuses.indexOf(rfq.status);
                  return (
                    <li key={step} className={i < flowIndex ? "done" : i === flowIndex ? "current" : ""}>
                      <div className="track__label">{step}</div>
                    </li>
                  );
                })}
              </ol>
              {isDraft && (
                <div className="quick-actions" style={{ marginTop: "var(--sp-4)" }}>
                  <Link className="btn btn--primary" to={`/customer/rfqs/${id}/edit`}>Edit draft</Link>
                  <button className="btn btn--primary" type="button" disabled={submitting} onClick={() => void submitDraft()}>
                    {submitting ? "Submitting…" : "Submit draft"}
                  </button>
                </div>
              )}
            </>
          )}
        </Panel>

        <Panel title="Request details">
          <div className="table-scroll">
            <table className="data-table">
              <tbody>
                <tr><th scope="row">Requirement</th><td>{rfq.productType}</td></tr>
                <tr><th scope="row">Material grade</th><td>{rfq.materialGrade ?? "—"}</td></tr>
                <tr><th scope="row">Quantity</th><td>{rfq.quantity}</td></tr>
                <tr><th scope="row">Delivery location</th><td>{rfq.deliveryLocation ?? "—"}</td></tr>
                <tr><th scope="row">Submitted</th><td>{formatDate(rfq.createdAtUtc)}</td></tr>
                <tr><th scope="row">Draft</th><td>{rfq.isDraft ? "Yes" : "No"}</td></tr>
              </tbody>
            </table>
          </div>
          <h3 style={{ marginTop: "var(--sp-4)" }}>Details</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{rfq.requirementDetails}</p>
        </Panel>
      </div>

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

      <Panel title="Drawings & specifications">
        {rfq.files.length === 0 ? (
          <p className="placeholder-note">No files attached.</p>
        ) : (
          <div className="list-rows">
            {rfq.files.map((f) => (
              <div className="list-row" key={f.id}>
                <div className="list-row__main">
                  <div className="list-row__title">{f.fileName}</div>
                  <div className="list-row__meta">{formatBytes(f.sizeBytes)} · uploaded {formatDate(f.uploadedAtUtc)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {isDraft && (
          <Link className="btn btn--ghost" style={{ color: "var(--c-ink)", marginTop: "var(--sp-3)" }} to={`/customer/rfqs/new`}>
            Upload files from New RFQ page
          </Link>
        )}
      </Panel>
    </>
  );
}
