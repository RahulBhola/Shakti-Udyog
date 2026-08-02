import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiDownload } from "../../api/client";
import { adminApi } from "../../api/adminApi";
import type { InvoiceDetail } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { Panel, StatusBadge, formatDate, formatMoney } from "../shared";

export default function AdminInvoiceDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    adminApi.invoice(id).then(setInvoice).catch(() => setMissing(true));
  }, [id]);

  async function cancel() {
    if (!invoice) return;
    setBusy(true);
    try {
      await adminApi.cancelInvoice(invoice.id, "Cancelled by admin");
      setMessage("Invoice cancelled.");
      setInvoice(await adminApi.invoice(id));
    } catch {
      setMessage("Could not cancel the invoice.");
    } finally {
      setBusy(false);
    }
  }

  if (missing) return <EmptyState title="Invoice not found" text="The invoice could not be loaded." />;
  if (!invoice) return <Loading label="Loading invoice" />;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
        <h1>{invoice.invoiceNumber}</h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <StatusBadge status={invoice.status} />
          <button className="btn btn--ghost" type="button" onClick={() => navigate("/admin/invoices")}>← Back to invoices</button>
        </div>
      </div>

      {invoice.companyName && <p className="list-row__meta" style={{ marginTop: "var(--sp-2)" }}>{invoice.companyName}</p>}

      {message && <p className="form-status form-status--ok" role="status">{message}</p>}

      <div className="panel-grid panel-grid--2">
        <Panel title="Invoice summary">
          <div className="table-scroll">
            <table className="data-table">
              <tbody>
                {invoice.companyName && <tr><th scope="row">Company</th><td>{invoice.companyName}</td></tr>}
                {invoice.orderNumber && <tr><th scope="row">Order</th><td>{invoice.orderNumber}</td></tr>}
                <tr><th scope="row">Issued</th><td>{formatDate(invoice.issueDateUtc)}</td></tr>
                <tr><th scope="row">Due date</th><td>{formatDate(invoice.dueDateUtc)}</td></tr>
                <tr><th scope="row">Subtotal</th><td>{formatMoney(invoice.subtotal, invoice.currency)}</td></tr>
                <tr><th scope="row">Tax</th><td>{formatMoney(invoice.tax, invoice.currency)}</td></tr>
                <tr><th scope="row">Total</th><td>{formatMoney(invoice.total, invoice.currency)}</td></tr>
                <tr><th scope="row">Paid</th><td>{formatMoney(invoice.amountPaid, invoice.currency)}</td></tr>
                <tr><th scope="row">Balance due</th><td><strong>{formatMoney(invoice.balanceDue, invoice.currency)}</strong></td></tr>
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "var(--sp-4)", flexWrap: "wrap" }}>
            {invoice.documentId ? (
              <button
                className="btn btn--ghost"
                style={{ color: "var(--c-ink)" }}
                type="button"
                onClick={() => void apiDownload(adminApi.invoiceDownloadUrl(invoice.id), `${invoice.invoiceNumber}.pdf`)}
              >
                Download PDF
              </button>
            ) : (
              <p className="placeholder-note">[Invoice PDF not yet available.]</p>
            )}
            {invoice.status === "Issued" && (
              <button className="btn btn--ghost" style={{ color: "var(--c-error)" }} type="button" disabled={busy} onClick={() => void cancel()}>
                Cancel invoice
              </button>
            )}
          </div>
        </Panel>

        <Panel title="Line items">
          {invoice.items.length === 0 && <p className="placeholder-note">No line items recorded.</p>}
          {invoice.items.length > 0 && (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col">Qty</th>
                    <th scope="col">Unit price</th>
                    <th scope="col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.description}{it.hsnSacCode ? ` · HSN ${it.hsnSacCode}` : ""}</td>
                      <td>{it.quantity} {it.unit}</td>
                      <td>{formatMoney(it.unitPrice, invoice.currency)}</td>
                      <td>{formatMoney(it.lineTotal, invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Payments">
        {invoice.payments.length === 0 && <p className="placeholder-note">No payments recorded yet.</p>}
        {invoice.payments.length > 0 && (
          <div className="list-rows">
            {invoice.payments.map((p) => (
              <div className="list-row" key={p.id}>
                <div className="list-row__main">
                  <div className="list-row__title">{formatMoney(p.amount, invoice.currency)} · {p.method}</div>
                  <div className="list-row__meta">Ref {p.paymentReference} · {formatDate(p.paymentDateUtc)}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}