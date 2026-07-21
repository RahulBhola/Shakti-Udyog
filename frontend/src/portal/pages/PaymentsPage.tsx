import { useEffect, useState } from "react";
import { customerApi, type Payment } from "../../api/customerApi";
import { EmptyState, Loading } from "../../components/ui";
import { StatusBadge, formatDate, formatMoney } from "../shared";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerApi.payments().then(setPayments).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <h1>Payment History</h1>
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
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
