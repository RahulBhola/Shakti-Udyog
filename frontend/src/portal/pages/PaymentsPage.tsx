import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { customerApi, type InvoiceListItem, type Payment } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { StatusBadge, formatDate, formatMoney } from "../shared";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [bills, setBills] = useState<InvoiceListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerApi.payments().then(setPayments).catch((e: Error) => setError(e.message));
    customerApi.invoices()
      .then((invs) => setBills(invs.filter((i) => i.balanceDue > 0)))
      .catch(() => setBills([]));
  }, []);

  return (
    <>
      <h1>Payment History</h1>

      {/* Bills / outstanding invoices to pay */}
      <section>
        <h2 className="text-lg font-semibold mt-2 mb-2">Bills to pay</h2>
        {!bills && !error && <Loading label="Loading bills" />}
        {bills && bills.length === 0 && (
          <p className="placeholder-note">No outstanding bills. Invoices you have to pay will appear here.</p>
        )}
        {bills && bills.length > 0 && (
          <div className="list-rows">
            {bills.map((inv) => (
              <Link key={inv.id} to={`/customer/invoices/${inv.id}`} className="row-link">
                <div className="list-row">
                  <div className="list-row__main">
                    <div className="list-row__title">{inv.invoiceNumber}{inv.orderNumber && ` — ${inv.orderNumber}`}</div>
                    <div className="list-row__meta">
                      Balance {formatMoney(inv.balanceDue, inv.currency)}
                      {inv.dueDateUtc && ` · due ${formatDate(inv.dueDateUtc)}`}
                    </div>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Submitted payment proofs */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Submitted payments</h2>
        {error && <EmptyState title="Payments unavailable" text={error} />}
        {!payments && !error && <Loading label="Loading payments" />}
        {payments && payments.length === 0 && <EmptyState title="No payments yet" text="Upload a payment proof from any invoice to see it here." />}
        {payments && payments.length > 0 && (
          <div className="list-rows">
            {payments.map((p) => (
              <div key={p.id} className="list-row">
                <div className="list-row__main">
                  <div className="list-row__title">{formatMoney(p.amount)} via {p.method}</div>
                  <div className="list-row__meta">
                    Ref: {p.paymentReference} · {formatDate(p.paymentDateUtc)} · submitted {formatDate(p.createdAtUtc)}
                  </div>
                  {p.status === "Rejected" && p.verificationNote && (
                    <div className="list-row__meta" style={{ color: "var(--c-ember)", marginTop: "var(--sp-1)" }}>
                      Rejected: {p.verificationNote}
                    </div>
                  )}
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}