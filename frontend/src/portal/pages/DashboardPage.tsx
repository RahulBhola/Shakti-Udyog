import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { customerApi, type Dashboard } from "../../api/customerApi";
import { EmptyState } from "../../components/ui";
import { SkeletonCard } from "../../components/Skeleton";
import { Panel, formatDate } from "../shared";

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customerApi.dashboard().then(setData).catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <EmptyState title="Dashboard unavailable" text={error} />;

  return (
    <>
      <h1>Dashboard</h1>

      {!data ? (
        <div style={{ display: "grid", gap: "var(--sp-4)" }}>
          <div className="stat-cards">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} height={96} />)}
          </div>
          <SkeletonCard height={140} />
          <div className="panel-grid panel-grid--2">
            <SkeletonCard height={200} />
            <SkeletonCard height={200} />
          </div>
        </div>
      ) : (
        <>
          <div className="stat-cards">
            <Link to="/customer/rfqs" className="row-link">
              <div className="stat-card">
                <div className="stat-card__value">{data.openRfqs}</div>
                <div className="stat-card__label">Open RFQs</div>
              </div>
            </Link>
            <Link to="/customer/quotations" className="row-link">
              <div className="stat-card">
                <div className="stat-card__value">{data.activeQuotations}</div>
                <div className="stat-card__label">Active Quotations</div>
              </div>
            </Link>
            <Link to="/customer/orders" className="row-link">
              <div className="stat-card">
                <div className="stat-card__value">{data.activeOrders}</div>
                <div className="stat-card__label">Active Orders</div>
              </div>
            </Link>
            <Link to="/customer/invoices" className="row-link">
              <div className="stat-card">
                <div className="stat-card__value">{data.unpaidInvoices}</div>
                <div className="stat-card__label">Unpaid Invoices</div>
              </div>
            </Link>
          </div>

          <Panel title="Quick actions">
            <div className="quick-actions">
              <Link className="btn btn--primary" to="/customer/rfqs/new">Submit a new RFQ</Link>
              <Link className="btn btn--ghost" style={{ color: "var(--c-ink)" }} to="/customer/documents">Browse documents</Link>
              <Link className="btn btn--ghost" style={{ color: "var(--c-ink)" }} to="/customer/support">Raise a support request</Link>
              <Link className="btn btn--ghost" style={{ color: "var(--c-ink)" }} to="/customer/payments">Payment history</Link>
            </div>
          </Panel>

          <div className="panel-grid panel-grid--2">
            <Panel title="Recent activity">
              {data.recentActivity.length === 0 ? (
                <p className="placeholder-note">No recent activity yet.</p>
              ) : (
                <div className="list-rows">
                  {data.recentActivity.map((a, i) => (
                    <div className="list-row" key={i}>
                      <div className="list-row__main">
                        <div className="list-row__title">{a.title}</div>
                        <div className="list-row__meta">{formatDate(a.occurredAtUtc)}</div>
                      </div>
                      {a.linkPath && <Link to={a.linkPath}>View</Link>}
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Recent documents">
              {data.recentDocuments.length === 0 ? (
                <p className="placeholder-note">No documents shared yet.</p>
              ) : (
                <div className="list-rows">
                  {data.recentDocuments.map((d) => (
                    <div className="list-row" key={d.id}>
                      <div className="list-row__main">
                        <div className="list-row__title">{d.title}</div>
                        <div className="list-row__meta">{d.category} · {formatDate(d.createdAtUtc)}</div>
                      </div>
                      <Link to="/customer/documents">Open</Link>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <Panel title="Notifications">
            <div className="quick-actions">
              <span style={{ color: "var(--c-ink-muted)", fontSize: "var(--fs-sm)" }}>
                {data.unreadNotifications} unread notification{data.unreadNotifications !== 1 ? "s" : ""}
              </span>
              <Link className="btn btn--ghost" style={{ color: "var(--c-ink)" }} to="/customer/notifications">View all</Link>
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
