import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { customerApi, type Paged, type RfqListItem } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { StatusBadge, formatDate } from "../shared";

export default function RfqListPage() {
  const [data, setData] = useState<Paged<RfqListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    customerApi.rfqs(page, 20, search || undefined, statusFilter || undefined)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [page, search, statusFilter]);

  useEffect(load, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  async function cancelDraft(id: string) {
    if (!confirm("Cancel this draft RFQ?")) return;
    try {
      await customerApi.deleteRfq(id);
      load();
    } catch {
      alert("Could not cancel the draft.");
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <h1>My RFQs</h1>
        <Link className="btn btn--primary" to="/customer/rfqs/new">New RFQ</Link>
      </div>

      {/* Search & filter */}
      <div className="form" style={{ maxWidth: "none", flexDirection: "row", gap: "var(--sp-3)" }}>
        <input
          placeholder="Search RFQs..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, padding: "0.6rem", border: "1px solid var(--c-line)", borderRadius: "var(--radius)", background: "rgba(15,21,36,0.55)", color: "var(--c-ink)", font: "inherit" }}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "0.6rem", border: "1px solid var(--c-line)", borderRadius: "var(--radius)", background: "rgba(15,21,36,0.55)", color: "var(--c-ink)", font: "inherit" }}
        >
          <option value="">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Received">Received</option>
          <option value="Under Review">Under Review</option>
          <option value="Waiting for Customer">Waiting for Customer</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Quoted">Quoted</option>
          <option value="Accepted">Accepted</option>
          <option value="Declined">Declined</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {error && <EmptyState title="RFQs unavailable" text={error} />}
      {!data && !error && <Loading label="Loading RFQs" />}
      {data && data.items.length === 0 && (
        <EmptyState title="No RFQs yet" text="Submit your first quotation request to get started." />
      )}
      {data && data.items.length > 0 && (
        <div className="list-rows">
          {data.items.map((r) => (
            <div key={r.id} className="list-row">
              <Link to={`/customer/rfqs/${r.id}`} className="row-link" style={{ flex: 1 }}>
                <div className="list-row__main">
                  <div className="list-row__title">{r.productType} — {r.quantity}</div>
                  <div className="list-row__meta">
                    Submitted {formatDate(r.createdAtUtc)} · {r.fileCount} file(s)
                    {r.isDraft && " · Draft"}
                  </div>
                </div>
              </Link>
              <StatusBadge status={r.isDraft ? "Draft" : r.status} />
              <div className="quick-actions" style={{ flexShrink: 0 }}>
                {r.isDraft && r.status === "Draft" && (
                  <>
                    <Link className="btn btn--ghost" style={{ color: "var(--c-ink)", padding: "0.3rem 0.7rem", fontSize: "var(--fs-xs)" }} to={`/customer/rfqs/${r.id}/edit`}>
                      Edit
                    </Link>
                    <button className="btn btn--ghost" style={{ color: "var(--c-error)", padding: "0.3rem 0.7rem", fontSize: "var(--fs-xs)" }} type="button" onClick={() => void cancelDraft(r.id)}>
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && totalPages > 1 && (
        <div className="quick-actions" style={{ justifyContent: "center" }}>
          <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Previous
          </button>
          <span style={{ alignSelf: "center", color: "var(--c-ink-muted)", fontSize: "var(--fs-sm)" }}>
            Page {page} of {totalPages} ({data.totalCount} total)
          </span>
          <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </>
  );
}
