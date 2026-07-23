import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../api/client";
import { Loading } from "../../components/ui";
import { Panel } from "../shared";
import { OrdersPieChart, InvoicesPieChart, MonthlyBarChart, RevenueLineChart } from "../../components/AdminCharts";
import { KanbanBoard } from "../../components/KanbanBoard";

interface AdminDashboard {
  totalCustomers: number; activeCustomers: number; pendingRfqs: number; approvedRfqs: number;
  pendingQuotations: number; ordersInProduction: number; ordersDispatched: number;
  pendingPayments: number; totalRevenue: number; outstandingBalance: number;
}

interface ChartData {
  ordersByStatus: { name: string; value: number }[];
  invoicesByStatus: { name: string; value: number }[];
  monthlyRfqs: { year: number; month: number; count: number }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiGet<AdminDashboard>("/api/v1/admin/dashboard").then(setData).catch(() => setError(true));
    apiGet<ChartData>("/api/v1/admin/charts").then(setCharts).catch(() => {});
  }, []);

  if (error) return <p className="form-status form-status--error">Dashboard unavailable</p>;
  if (!data) return <Loading label="Loading dashboard" />;

  return (
    <>
      <h1>Executive Dashboard</h1>
      <div className="stat-cards" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {[
          { label: "Total Customers", value: data.totalCustomers, href: "/admin/users" },
          { label: "Active Customers", value: data.activeCustomers, href: "/admin/users" },
          { label: "Pending RFQs", value: data.pendingRfqs, href: "/admin/rfqs" },
          { label: "Approved RFQs", value: data.approvedRfqs, href: "/admin/rfqs" },
          { label: "Pending Quotations", value: data.pendingQuotations, href: "/admin/quotations" },
          { label: "Orders in Production", value: data.ordersInProduction, href: "/admin/orders" },
          { label: "Orders Dispatched", value: data.ordersDispatched, href: "/admin/orders" },
          { label: "Pending Payments", value: data.pendingPayments, href: "/admin/invoices" },
        ].map((k) => (
          <Link key={k.label} to={k.href} className="row-link">
            <div className="stat-card"><div className="stat-card__value">{k.value}</div><div className="stat-card__label">{k.label}</div></div>
          </Link>
        ))}
      </div>

      <Panel title="Quick actions">
        <div className="quick-actions">
          <Link className="btn btn--primary" to="/admin/users">Manage users</Link>
          <Link className="btn btn--ghost" style={{ color: "var(--c-ink)" }} to="/admin/companies">Companies</Link>
          <Link className="btn btn--ghost" style={{ color: "var(--c-ink)" }} to="/admin/audit-logs">Audit logs</Link>
          <Link className="btn btn--ghost" style={{ color: "var(--c-ink)" }} to="/admin/reports">Reports</Link>
        </div>
      </Panel>

      <div className="panel-grid panel-grid--2">
        <OrdersPieChart data={charts?.ordersByStatus} />
        <InvoicesPieChart data={charts?.invoicesByStatus} />
      </div>
      <div className="panel-grid panel-grid--2">
        <MonthlyBarChart data={charts?.monthlyRfqs} />
        <RevenueLineChart />
      </div>

      <KanbanBoard />
    </>
  );
}
