import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { apiDownload } from "../../api/client";
import { customerApi, type InvoiceDetail, type InvoiceListItem } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { Panel, StatusBadge, formatDate, formatMoney } from "../shared";

export function InvoiceListPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerApi.invoices().then(setInvoices).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <h1>Invoices</h1>
      {error && <EmptyState title="Invoices unavailable" text={error} />}
      {!invoices && !error && <Loading label="Loading invoices" />}
      {invoices && invoices.length === 0 && <EmptyState title="No invoices yet" />}
      {invoices && invoices.length > 0 && (
        <div className="list-rows">
          {invoices.map((inv) => (
            <Link key={inv.id} to={`/customer/invoices/${inv.id}`} className="row-link">
              <div className="list-row">
                <div className="list-row__main">
                  <div className="list-row__title">{inv.invoiceNumber}{inv.orderNumber && ` — ${inv.orderNumber}`}</div>
                  <div className="list-row__meta">
                    Issued {formatDate(inv.issueDateUtc)}
                    {inv.dueDateUtc && ` · due ${formatDate(inv.dueDateUtc)}`}
                    {` · balance ${formatMoney(inv.balanceDue, inv.currency)}`}
                  </div>
                </div>
                <StatusBadge status={inv.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export function InvoiceDetailPage() {
  const { id = "" } = useParams();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    customerApi.invoice(id).then(setInvoice).catch(() => setMissing(true));
  }, [id]);

  async function submitProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invoice) return;
    const data = new FormData(event.currentTarget);
    const reference = (data.get("reference") as string).trim();
    const method = data.get("method") as string;
    const amount = Number(data.get("amount"));
    const date = data.get("date") as string;
    if (!reference || !method || !amount || !date) return;

    setBusy(true);
    try {
      await customerApi.submitPaymentProof({
        invoiceId: invoice.id,
        paymentReference: reference,
        method,
        amount,
        paymentDateUtc: new Date(date).toISOString(),
        proofFile: proofFile ?? undefined,
      });
      setMessage("Payment proof submitted. It will show as Pending Verification until reviewed.");
      setProofOpen(false);
      setInvoice(await customerApi.invoice(id));
    } catch {
      setMessage("Could not submit the payment proof. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (missing) return <EmptyState title="Invoice not found" />;
  if (!invoice) return <Loading label="Loading invoice" />;

  const canPay = ["Issued", "Partially Paid", "Overdue"].includes(invoice.status);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <h1>{invoice.invoiceNumber}</h1>
        <StatusBadge status={invoice.status} />
      </div>

      <div className="panel-grid panel-grid--2">
        <Panel title="Invoice summary">
          <div className="table-scroll">
            <table className="data-table">
              <tbody>
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
          {invoice.documentId ? (
            <button
              className="btn btn--ghost"
              style={{ color: "var(--c-ink)", marginTop: "var(--sp-4)" }}
              type="button"
              onClick={() => void apiDownload(`/api/v1/customer/invoices/${invoice.id}/download`, `${invoice.invoiceNumber}.pdf`)}
            >
              Download PDF
            </button>
          ) : (
            <p className="placeholder-note" style={{ marginTop: "var(--sp-3)" }}>
              [Invoice PDF not yet available — it appears here once attached.]
            </p>
          )}
        </Panel>

        <Panel title="Payments">
          {message && <p className="form-status form-status--ok" role="status">{message}</p>}
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

          {canPay && !proofOpen && (
            <button className="btn btn--primary" style={{ marginTop: "var(--sp-4)" }} type="button" onClick={() => setProofOpen(true)}>
              Upload payment proof
            </button>
          )}
          {canPay && proofOpen && (
            <form className="form" style={{ marginTop: "var(--sp-4)" }} onSubmit={submitProof}>
              <div className="form__field">
                <label htmlFor="p-reference">Payment reference (UTR / NEFT / UPI) *</label>
                <input id="p-reference" name="reference" required minLength={3} />
              </div>
              <div className="form__field">
                <label htmlFor="p-method">Method *</label>
                <select id="p-method" name="method" defaultValue="Bank Transfer">
                  {["Bank Transfer", "NEFT", "RTGS", "UPI"].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form__field">
                <label htmlFor="p-amount">Amount ({invoice.currency}) *</label>
                <input id="p-amount" name="amount" type="number" min="1" step="0.01" required />
              </div>
              <div className="form__field">
                <label htmlFor="p-date">Payment date *</label>
                <input id="p-date" name="date" type="date" required />
              </div>
              <div className="form__field">
                <label htmlFor="p-file">Proof document (pdf/jpg/png, optional)</label>
                <input id="p-file" type="file" accept=".pdf,.jpg,.png" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
              </div>
              <div className="quick-actions">
                <button className="btn btn--primary" type="submit" disabled={busy}>
                  {busy ? "Submitting…" : "Submit proof"}
                </button>
                <button className="btn btn--ghost" style={{ color: "var(--c-ink)" }} type="button" onClick={() => setProofOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Panel>
      </div>
    </>
  );
}

export default InvoiceListPage;
