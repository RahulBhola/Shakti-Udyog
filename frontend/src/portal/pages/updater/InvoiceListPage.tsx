import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../../../api/client";
import type { InvoiceListItem, Paged } from "../../../api/customerApi";
import { EmptyState, Loading } from "../../../components/ui";
import { StatusBadge, formatDate, formatMoney } from "../../shared";

export default function UpdaterInvoiceListPage() {
  const [data, setData] = useState<Paged<InvoiceListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    apiGet<Paged<InvoiceListItem>>(`/api/v1/updater/invoices?page=${page}&pageSize=20`).then(setData).catch((e: Error) => setError(e.message));
  }, [page]);
  useEffect(load, [load]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;
  return (
    <>
      <h1>Invoices</h1>
      {error && <EmptyState title="Invoices unavailable" text={error} />}
      {!data && !error && <Loading label="Loading invoices" />}
      {data && data.items.length === 0 && <EmptyState title="No invoices" />}
      {data && data.items.length > 0 && (
        <div className="list-rows">
          {data.items.map((inv) => (
            <div key={inv.id} className="list-row">
              <div className="list-row__main">
                <div className="list-row__title">{inv.invoiceNumber}</div>
                <div className="list-row__meta">{formatMoney(inv.total, inv.currency)} · {formatDate(inv.issueDateUtc)} · Balance {formatMoney(inv.balanceDue)}</div>
              </div>
              <StatusBadge status={inv.status} />
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="quick-actions" style={{ justifyContent: "center" }}>
          <button className="btn btn--ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
          <span style={{ color: "var(--c-ink-muted)" }}>Page {page} of {totalPages}</span>
          <button className="btn btn--ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </>
  );
}
