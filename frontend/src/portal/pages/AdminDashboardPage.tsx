import { useEffect, useState, useCallback } from "react";
import { apiGet } from "../../api/client";
import { Loading } from "../../components/ui";
import { DashboardCard, DashboardHeader, QuickAction } from "../../components/dashboard";
import { OrdersPieChart, InvoicesPieChart, MonthlyBarChart, RevenueLineChart } from "../../components/AdminCharts";
import { UserCheck, ClipboardList, ShoppingCart, Truck, Wallet, Users, Building2, FileSearch, BarChart3 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Type definitions                                                   */
/* ------------------------------------------------------------------ */

interface AdminDashboard {
  totalCustomers: number; activeCustomers: number; pendingRfqs: number; approvedRfqs: number;
  pendingQuotations: number; ordersInProduction: number; ordersDispatched: number; pendingPayments: number;
  totalRevenue: number; outstandingBalance: number;
}

interface ChartData {
  ordersByStatus: { name: string; value: number }[];
  invoicesByStatus: { name: string; value: number }[];
  monthlyRfqs: { year: number; month: number; count: number }[];
}

/* ------------------------------------------------------------------ */
/*  KPI definitions                                                    */
/* ------------------------------------------------------------------ */

interface KpiDef {
  key: keyof AdminDashboard;
  label: string;
  icon: typeof UserCheck;
  color: "blue" | "green" | "purple" | "teal" | "orange" | "pink" | "yellow" | "indigo";
  href: string;
}

const kpiMetrics: KpiDef[] = [
  { key: "totalCustomers", label: "Total Customers", icon: UserCheck, color: "blue", href: "/admin/users" },
  { key: "activeCustomers", label: "Active Customers", icon: UserCheck, color: "green", href: "/admin/users" },
  { key: "pendingRfqs", label: "Pending RFQs", icon: ClipboardList, color: "purple", href: "/admin/rfqs" },
  { key: "approvedRfqs", label: "Approved RFQs", icon: ClipboardList, color: "teal", href: "/admin/rfqs" },
  { key: "pendingQuotations", label: "Pending Quotations", icon: ClipboardList, color: "indigo", href: "/admin/quotations" },
  { key: "ordersInProduction", label: "Orders in Production", icon: ShoppingCart, color: "orange", href: "/admin/orders" },
  { key: "ordersDispatched", label: "Orders Dispatched", icon: Truck, color: "pink", href: "/admin/orders" },
  { key: "pendingPayments", label: "Pending Payments", icon: Wallet, color: "yellow", href: "/admin/invoices" },
];

const quickActions = [
  { title: "Manage Users", description: "Add, edit, or manage user accounts", icon: Users, href: "/admin/users" },
  { title: "Companies", description: "View and manage all registered companies", icon: Building2, href: "/admin/companies" },
  { title: "Audit Logs", description: "Review system activity and history logs", icon: FileSearch, href: "/admin/audit-logs" },
  { title: "Reports", description: "View detailed business reports and analytics", icon: BarChart3, href: "/admin/reports" },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setError(false);
    Promise.all([
      apiGet<AdminDashboard>("/api/v1/admin/dashboard").then(setData).catch(() => setError(true)),
      apiGet<ChartData>("/api/v1/admin/charts").then(setCharts).catch(() => {}),
    ]).finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    apiGet<AdminDashboard>("/api/v1/admin/dashboard").then(setData).catch(() => setError(true));
    apiGet<ChartData>("/api/v1/admin/charts").then(setCharts).catch(() => {});
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="rounded-[16px] border border-red-200 bg-red-50 p-6 text-center max-w-md">
          <div className="text-red-600 text-sm font-semibold mb-2">Dashboard Unavailable</div>
          <p className="text-[var(--text-secondary)] text-xs">Could not load dashboard data. Please try refreshing the page.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-3 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-colors duration-200">Refresh</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading label="Loading dashboard" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Welcome Header */}
      <DashboardHeader onRefresh={handleRefresh} refreshing={refreshing} />

      {/* 8 KPI cards: 2 rows of 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiMetrics.slice(0, 4).map((m) => (
          <DashboardCard key={m.key} icon={m.icon} label={m.label} value={data[m.key] as number} href={m.href} />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiMetrics.slice(4, 8).map((m) => (
          <DashboardCard key={m.key} icon={m.icon} label={m.label} value={data[m.key] as number} href={m.href} />
        ))}
      </div>

      {/* Quick Actions: 4 in a row */}
      <div>
        <h2 className="text-[26px] font-bold tracking-tight text-[var(--text-primary)] m-0 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((a) => (
            <QuickAction key={a.title} icon={a.icon} title={a.title} description={a.description} href={a.href} />
          ))}
        </div>
      </div>

      {/* Charts: 2x2 grid */}
      <div>
        <h2 className="text-[26px] font-bold tracking-tight text-[var(--text-primary)] m-0 mb-4">Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <OrdersPieChart data={charts?.ordersByStatus} />
          <InvoicesPieChart data={charts?.invoicesByStatus} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <MonthlyBarChart data={charts?.monthlyRfqs} />
          <RevenueLineChart />
        </div>
      </div>
    </div>
  );
}