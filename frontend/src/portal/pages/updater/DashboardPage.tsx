import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { updaterApi, type UpdaterDashboard as Dash } from "../../../api/updaterApi";
import { Loading } from "../../../components/ui";
import { Panel } from "../../shared";

export default function UpdaterDashboardPage() {
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    updaterApi.dashboard().then(setData).catch(() => setError(true));
  }, []);

  if (error) return <p className="form-status form-status--error">Dashboard unavailable</p>;
  if (!data) return <Loading label="Loading dashboard" />;

  const stats = [
    { label: "Pending RFQs", value: data.pendingRfqs, href: "/admin/rfqs", filter: "Received" },
    { label: "Pending Quotations", value: data.pendingQuotations, href: "/admin/quotations", filter: "Draft" },
    { label: "Orders in Production", value: data.ordersInProduction, href: "/admin/orders", filter: "production" },
    { label: "Awaiting Shipment", value: data.ordersAwaitingShipment, href: "/admin/orders", filter: "ready_to_dispatch" },
  ];

  return (
    <>
      <h1>Dashboard</h1>
      <div className="stat-cards">
        {stats.map((s) => (
          <Link key={s.label} to={s.href} className="row-link">
            <div className="stat-card">
              <div className="stat-card__value">{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>
      <Panel title="Quick actions">
        <div className="quick-actions">
          <Link className="btn btn--primary" to="/admin/rfqs">Review RFQs</Link>
          <Link className="btn btn--ghost" style={{ color: "var(--c-ink)" }} to="/admin/quotations">Manage quotations</Link>
          <Link className="btn btn--ghost" style={{ color: "var(--c-ink)" }} to="/admin/orders">Manage orders</Link>
        </div>
      </Panel>
    </>
  );
}
