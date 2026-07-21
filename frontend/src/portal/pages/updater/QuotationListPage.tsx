import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { updaterApi } from "../../../api/updaterApi";
import type { Paged, QuotationListItem } from "../../../api/customerApi";
import { EmptyState, Loading } from "../../../components/ui";
import { StatusBadge, formatDate, formatMoney } from "../../shared";

export default function QuotationListPage() {
  const [data, setData] = useState<Paged<QuotationListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    updaterApi.quotations(page, 20, undefined, statusFilter || undefined)
      .then(setData).catch((e: Error) => setError(e.message));
  }, [page, statusFilter]);

  useEffect(load, [load]);
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <>
      <h1>Quotations</h1>
      <div className="form" style={{ maxWidth: "none", flexDirection: "row", gap: "var(--sp-3)" }}>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "0.6rem", border: "1px solid var(--c-line)", borderRadius: "var(--radius)", background: "rgba(15,21,36,0.55)", color: "var(--c-ink)", font: "inherit" }}>
          <option value="">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="Issued">Issued</option>
          <option value="Accepted">Accepted</option>
          <option value="Declined">Declined</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
      {error && <EmptyState title="Quotations unavailable" text={error} />}
      {!data && !error && <Loading label="Loading quotations" />}
      {data && data.items.length === 0 && <EmptyState title="No quotations found" />}
      {data && data.items.length > 0 && (
        <div className="list-rows">
          {data.items.map((q) => (
            <Link key={q.id} to={`/portal/updater/quotations/${q.id}`} className="row-link">
              <div className="list-row">
                <div className="list-row__main">
                  <div className="list-row__title">{q.quotationNumber} — {q.productType}</div>
                  <div className="list-row__meta">{formatMoney(q.total, q.currency)} · {formatDate(q.createdAtUtc)}</div>
                </div>
                <StatusBadge status={q.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
      {data && totalPages > 1 && (
        <div className="quick-actions" style={{ justifyContent: "center" }}>
          <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Previous</button>
          <span style={{ alignSelf: "center", color: "var(--c-ink-muted)", fontSize: "var(--fs-sm)" }}>Page {page} of {totalPages}</span>
          <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </>
  );
}
