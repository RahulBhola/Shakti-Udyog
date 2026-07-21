import { useEffect, useState, type FormEvent } from "react";
import { adminApi } from "../../api/adminApi";
import type { InvoiceListItem, Paged } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { Panel, StatusBadge, formatDate, formatMoney } from "../shared";

export function AdminInvoiceListPage() {
  const [data, setData] = useState<Paged<InvoiceListItem> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    adminApi.invoices(page).then(setData).catch((e: Error) => setError(e.message));
  }, [page]);

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
                <div className="list-row__title">{inv.invoiceNumber}{inv.orderNumber ? ` — ${inv.orderNumber}` : ""}</div>
                <div className="list-row__meta">Issued {formatDate(inv.issueDateUtc)} · Balance {formatMoney(inv.balanceDue, inv.currency)}</div>
              </div>
              <StatusBadge status={inv.status} />
            </div>
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

export function AdminInvoiceCreatePage() {
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setStatus("saving");
    try {
      await adminApi.createInvoice({
        orderId: (data.get("orderId") as string) || undefined,
        companyId: (data.get("companyId") as string),
        subtotal: Number(data.get("subtotal")),
        tax: Number(data.get("tax")),
        total: Number(data.get("total")),
        issueDate: (data.get("issueDate") as string),
        dueDate: (data.get("dueDate") as string) || undefined,
        currency: "INR",
      });
      setStatus("idle");
      alert("Invoice created successfully.");
    } catch { setStatus("error"); }
  }

  return (
    <>
      <h1>Create Invoice</h1>
      <Panel>
        <form className="form" onSubmit={submit}>
          <div className="form__field"><label>Company ID *</label><input name="companyId" required /></div>
          <div className="form__field"><label>Order ID</label><input name="orderId" /></div>
          <div className="form__field"><label>Subtotal *</label><input name="subtotal" type="number" step="0.01" required /></div>
          <div className="form__field"><label>Tax *</label><input name="tax" type="number" step="0.01" required /></div>
          <div className="form__field"><label>Total *</label><input name="total" type="number" step="0.01" required /></div>
          <div className="form__field"><label>Issue date *</label><input name="issueDate" type="date" required /></div>
          <div className="form__field"><label>Due date</label><input name="dueDate" type="date" /></div>
          {status === "error" && <p className="form-status form-status--error">Failed to create invoice.</p>}
          <button className="btn btn--primary" type="submit" disabled={status === "saving"}>Create Invoice</button>
        </form>
      </Panel>
    </>
  );
}
