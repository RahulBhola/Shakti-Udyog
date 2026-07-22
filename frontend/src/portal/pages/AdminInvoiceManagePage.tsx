import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPatch } from "../../api/client";
import type { Paged, InvoiceListItem } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { StatusBadge, formatDate, formatMoney } from "../shared";

export default function AdminInvoiceManagePage() {
  const [data, setData] = useState<Paged<InvoiceListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    apiGet<Paged<InvoiceListItem>>(`/api/v1/admin/invoices?page=${page}&pageSize=20`).then(setData).catch((e: Error) => setError(e.message));
  }, [page]);
  useEffect(load, [load]);

  async function doAction(action: () => Promise<any>) {
    setMsg(null);
    try { const r = await action(); setMsg(r.message ?? "Done."); load(); }
    catch { setMsg("Action failed."); }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  // Financial dashboard stats
  const [finance, setFinance] = useState<any>(null);
  useEffect(() => { apiGet<any>("/api/v1/admin/financial-dashboard").then(setFinance).catch(() => {}); }, []);

  return (
    <>
      <h1>Invoice Management</h1>

      {finance && (
        <div className="stat-cards" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="stat-card"><div className="stat-card__value">{formatMoney(finance.outstandingAmount)}</div><div className="stat-card__label">Outstanding</div></div>
          <div className="stat-card"><div className="stat-card__value">{formatMoney(finance.collectedAmount)}</div><div className="stat-card__label">Collected</div></div>
          <div className="stat-card"><div className="stat-card__value">{finance.pendingVerification}</div><div className="stat-card__label">Pending Verification</div></div>
          <div className="stat-card"><div className="stat-card__value">{finance.overdueInvoices}</div><div className="stat-card__label">Overdue</div></div>
        </div>
      )}

      {msg && <p className="form-status form-status--ok">{msg}</p>}
      {error && <EmptyState title="Invoices unavailable" text={error} />}
      {!data && !error && <Loading label="Loading invoices" />}
      {data && data.items.length === 0 && <EmptyState title="No invoices" />}
      {data && data.items.length > 0 && (
        <div className="list-rows">
          {data.items.map((inv) => (
            <div key={inv.id} className="list-row">
              <div className="list-row__main">
                <div className="list-row__title">{inv.invoiceNumber} — {inv.orderNumber ?? "No order"}</div>
                <div className="list-row__meta">{formatMoney(inv.total, inv.currency)} · Due {formatDate(inv.dueDateUtc)} · Balance {formatMoney(inv.balanceDue)}</div>
              </div>
              <StatusBadge status={inv.status} />
              <div className="quick-actions">
                {inv.status === "Issued" && <button className="btn btn--ghost" style={{ color: "var(--c-error)", padding: "0.2rem 0.6rem", fontSize: "var(--fs-xs)" }} onClick={() => void doAction(() => apiPatch(`/api/v1/admin/invoices/${inv.id}/cancel`, "Cancelled by admin"))}>Cancel</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="quick-actions" style={{ justifyContent: "center" }}>
          <button className="btn btn--ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
          <span style={{ color: "var(--c-ink-muted)", fontSize: "var(--fs-sm)" }}>Page {page} of {totalPages}</span>
          <button className="btn btn--ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </>
  );
}
