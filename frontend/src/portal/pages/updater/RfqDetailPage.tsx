import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { updaterApi, type UpdaterRfqDetail } from "../../../api/updaterApi";
import { EmptyState, Loading } from "../../../components/ui";
import { Panel, StatusBadge, formatDate } from "../../shared";

export default function UpdaterRfqDetailPage() {
  const { id = "" } = useParams();
  const [rfq, setRfq] = useState<UpdaterRfqDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    updaterApi.rfq(id).then(setRfq).catch(() => setMissing(true));
  }, [id]);

  async function updateStatus(newStatus: string) {
    setBusy(true); setMsg(null);
    try { const r = await updaterApi.updateRfqStatus(id, newStatus); setMsg(r.message); setRfq(await updaterApi.rfq(id)); }
    catch { setMsg("Status update failed."); }
    finally { setBusy(false); }
  }

  if (missing) return <EmptyState title="RFQ not found" />;
  if (!rfq) return <Loading label="Loading RFQ" />;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <h1>RFQ — {rfq.productType}</h1>
        <StatusBadge status={rfq.status} />
      </div>
      {msg && <p className={`form-status ${msg.includes("failed") ? "form-status--error" : "form-status--ok"}`}>{msg}</p>}

      <div className="panel-grid panel-grid--2">
        <Panel title="Customer details">
          <div className="table-scroll"><table className="data-table"><tbody>
            <tr><th scope="row">Company</th><td>{rfq.companyName}</td></tr>
            <tr><th scope="row">Contact</th><td>{rfq.fullName}</td></tr>
            <tr><th scope="row">Email</th><td>{rfq.email}</td></tr>
            <tr><th scope="row">Phone</th><td>{rfq.phone}</td></tr>
          </tbody></table></div>
        </Panel>
        <Panel title="Request details">
          <div className="table-scroll"><table className="data-table"><tbody>
            <tr><th scope="row">Type</th><td>{rfq.productType}</td></tr>
            <tr><th scope="row">Grade</th><td>{rfq.materialGrade ?? "—"}</td></tr>
            <tr><th scope="row">Quantity</th><td>{rfq.quantity}</td></tr>
            <tr><th scope="row">Delivery</th><td>{rfq.deliveryLocation ?? "—"}</td></tr>
            <tr><th scope="row">Submitted</th><td>{formatDate(rfq.createdAtUtc)}</td></tr>
          </tbody></table></div>
          <h3 style={{ marginTop: "var(--sp-3)" }}>Details</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{rfq.requirementDetails}</p>
        </Panel>
      </div>

      <Panel title="Actions">
        <div className="quick-actions">
          <button className="btn btn--primary" disabled={busy} onClick={() => void updateStatus("Under Review")}>Review</button>
          <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} disabled={busy} onClick={() => void updateStatus("Approved")}>Approve</button>
          <button className="btn btn--ghost" style={{ color: "var(--c-error)" }} disabled={busy} onClick={() => void updateStatus("Rejected")}>Reject</button>
        </div>
      </Panel>

      {rfq.statusHistory.length > 0 && (
        <Panel title="Status history">
          <ol className="track">
            {rfq.statusHistory.map((h, i) => (
              <li key={i} className="done">
                <div className="track__label">{h.fromStatus} → {h.toStatus}</div>
                {h.note && <div>{h.note}</div>}
                <div className="track__meta">{formatDate(h.occurredAtUtc)} · {h.changedByRole}</div>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {rfq.files.length > 0 && (
        <Panel title="Attachments">
          <div className="list-rows">
            {rfq.files.map((f) => (
              <div key={f.id} className="list-row">
                <div className="list-row__main">
                  <div className="list-row__title">{f.fileName}</div>
                  <div className="list-row__meta">{(f.sizeBytes / 1024).toFixed(1)} KB</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
