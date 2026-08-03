import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api/adminApi";
import type { Paged, InvoiceListItem } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { StatusBadge, formatDate, formatMoney } from "../shared";

const STATUS_FILTERS = ["All", "Issued", "Partially Paid", "Paid", "Overdue", "Cancelled"];

function isOverdue(inv: InvoiceListItem): boolean {
  if (inv.status === "Overdue") return true;
  const pastDue = inv.dueDateUtc != null && new Date(inv.dueDateUtc).getTime() < Date.now();
  return (inv.status === "Issued" || inv.status === "Partially Paid") && pastDue && inv.balanceDue > 0;
}

export default function AdminInvoiceManagePage() {
  const [data, setData] = useState<Paged<InvoiceListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Financial dashboard stats
  const [finance, setFinance] = useState<{
    outstandingAmount: number;
    collectedAmount: number;
    pendingVerification: number;
    overdueInvoices: number;
  } | null>(null);

  const load = useCallback(() => {
    adminApi.invoices(page, 20, status, search).then(setData).catch((e: Error) => setError(e.message));
  }, [page, status, search]);
  useEffect(load, [load]);

  useEffect(() => {
    adminApi.financialDashboard().then(setFinance).catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [status, search]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

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

      <form
        className="quick-actions"
        style={{ flexWrap: "wrap", gap: "0.5rem", marginTop: "var(--sp-4)" }}
        onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); }}
      >
        <input
          type="search"
          value={searchInput}
          placeholder="Search invoice / order / company"
          aria-label="Search invoices"
          style={{ minWidth: "240px", padding: "0.45rem 0.7rem", borderRadius: "8px", border: "1px solid var(--c-line, rgba(127,127,127,0.4))" }}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button className="btn" type="submit">Search</button>
        {search && <button className="btn btn--ghost" type="button" onClick={() => { setSearch(""); setSearchInput(""); }}>Clear</button>}
      </form>

      <div className="quick-actions" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            className={status === s ? "btn btn--primary" : "btn btn--ghost"}
            aria-pressed={status === s}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <EmptyState title="Invoices unavailable" text={error} />}
      {!data && !error && <Loading label="Loading invoices" />}
      {data && data.items.length === 0 && <EmptyState title="No invoices" />}

      {data && data.items.length > 0 && (
        <div className="list-rows">
          {data.items.map((inv) => {
            const overdue = isOverdue(inv);
            return (
              <Link key={inv.id} to={`/admin/deals/${inv.orderId}?invoice=${inv.id}`} className="row-link">
                <div className="list-row" style={overdue ? { borderLeft: "4px solid var(--c-error)" } : undefined}>
                  <div className="list-row__main">
                    <div className="list-row__title">
                      {inv.invoiceNumber}{inv.orderNumber ? ` — ${inv.orderNumber}` : ""}
                    </div>
                    <div className="list-row__meta">
                      {inv.companyName ? `${inv.companyName} · ` : ""}
                      {formatMoney(inv.total, inv.currency)} · Due {inv.dueDateUtc ? formatDate(inv.dueDateUtc) : "—"} · Balance {formatMoney(inv.balanceDue, inv.currency)}
                    </div>
                  </div>
                  {overdue && <span className="badge" style={{ color: "var(--c-error)", borderColor: "currentColor" }}>Overdue</span>}
                  <StatusBadge status={inv.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="quick-actions" style={{ justifyContent: "center" }}>
          <button className="btn btn--ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Previous</button>
          <span style={{ color: "var(--c-ink-muted)", fontSize: "var(--fs-sm)" }}>Page {page} of {totalPages}</span>
          <button className="btn btn--ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </>
  );
}