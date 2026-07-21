import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { updaterApi, type UpdaterRfqListItem } from "../../../api/updaterApi";
import type { Paged } from "../../../api/customerApi";
import { EmptyState, Loading } from "../../../components/ui";
import { StatusBadge, formatDate } from "../../shared";

export default function UpdaterRfqListPage() {
  const [data, setData] = useState<Paged<UpdaterRfqListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    updaterApi.rfqs(page, 20, undefined, statusFilter || undefined)
      .then(setData).catch((e: Error) => setError(e.message));
  }, [page, statusFilter]);

  useEffect(load, [load]);
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <>
      <h1>RFQs</h1>
      <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        style={{ padding: "0.6rem", marginBottom: "var(--sp-4)", border: "1px solid var(--c-line)", borderRadius: "var(--radius)", background: "rgba(15,21,36,0.55)", color: "var(--c-ink)" }}>
        <option value="">All statuses</option>
        <option value="Received">Received</option><option value="Under Review">Under Review</option>
        <option value="Approved">Approved</option><option value="Rejected">Rejected</option>
        <option value="Quoted">Quoted</option>
      </select>
      {error && <EmptyState title="RFQs unavailable" text={error} />}
      {!data && !error && <Loading label="Loading RFQs" />}
      {data && data.items.length === 0 && <EmptyState title="No RFQs found" />}
      {data && data.items.length > 0 && (
        <div className="list-rows">
          {data.items.map((r) => (
            <Link key={r.id} to={`/updater/rfqs/${r.id}`} className="row-link">
              <div className="list-row">
                <div className="list-row__main">
                  <div className="list-row__title">{r.productType} — {r.companyName ?? "Unknown"}</div>
                  <div className="list-row__meta">{r.quantity} · {formatDate(r.createdAtUtc)} · {r.fileCount} file(s) · Assigned: {r.assignedToUserId ? "Yes" : "No"}</div>
                </div>
                <StatusBadge status={r.status} />
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
