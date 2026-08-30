import { useEffect, useState, useCallback, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../api/client";
import { Loading } from "../../components/ui";
import { DashboardCard, DashboardHeader, QuickAction } from "../../components/dashboard";
import {
  OrdersStatusChart,
  InvoicesPieChart,
  RevenueLineChart,
  CashflowDualAreaChart,
  PipelineGroupedBarChart,
  MesStageBreakdownChart,
  MetallurgyDonutChart,
  IndustrySectorBreakdownChart,
} from "../../components/AdminCharts";
import {
  UserCheck, ClipboardList, ShoppingCart, Truck, Wallet, Users, Building2, FileSearch,
  BarChart3, ArrowRight, Activity, TrendingUp, Factory, Award, Calendar,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Type definitions                                                   */
/* ------------------------------------------------------------------ */

interface AdminDashboard {
  totalCustomers: number; activeCustomers: number; pendingEnquiries: number; approvedEnquiries: number;
  pendingQuotations: number; ordersInProduction: number; ordersDispatched: number; pendingPayments: number;
  totalRevenue: number; outstandingBalance: number;
}

interface ChartData {
  ordersByStatus: { name: string; value: number }[];
  invoicesByStatus: { name: string; value: number }[];
  monthlyEnquiries: { year: number; month: number; count: number }[];
  monthlyRevenue: { year: number; month: number; revenue: number }[];
  mesStageBreakdown?: { stage: string; count: number; color?: string }[];
  metallurgyMix?: { name: string; value: number; color?: string; pct?: number }[];
  cashflowTrend?: { name: string; invoiced: number; collected: number }[];
  pipelineTrend?: { name: string; enquiries: number; quotations: number; orders: number }[];
  industrySectorMix?: { name: string; value: number }[];
  executiveKpis?: {
    onTimeDeliveryRate: number;
    foundryYield: number;
    quoteWinRate: number;
    avgCycleDays: number;
    totalTonnageTons: number;
  };
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
  hint: string;
}

const kpiMetrics: KpiDef[] = [
  { key: "totalCustomers", label: "Total Customers", icon: UserCheck, color: "blue", href: "/admin/users", hint: "Total registered accounts" },
  { key: "activeCustomers", label: "Active Customers", icon: UserCheck, color: "green", href: "/admin/users", hint: "Verified & active" },
  { key: "pendingEnquiries", label: "Pending Enquiries", icon: ClipboardList, color: "purple", href: "/admin/enquiries", hint: "Awaiting review" },
  { key: "approvedEnquiries", label: "Approved Enquiries", icon: ClipboardList, color: "teal", href: "/admin/enquiries", hint: "Approved & ready" },
  { key: "pendingQuotations", label: "Pending Quotes", icon: ClipboardList, color: "indigo", href: "/admin/quotations", hint: "Awaiting response" },
  { key: "ordersInProduction", label: "Orders in Production", icon: ShoppingCart, color: "orange", href: "/admin/orders", hint: "Currently in the foundry" },
  { key: "ordersDispatched", label: "Orders Dispatched", icon: Truck, color: "pink", href: "/admin/orders", hint: "Shipped to customers" },
  { key: "pendingPayments", label: "Pending Payments", icon: Wallet, color: "yellow", href: "/admin/invoices", hint: "Awaiting approval" },
];

const financeKpis = [
  { label: "Total Revenue", value: 0, prefix: "₹", icon: Wallet, color: "teal" as const, href: "/admin/invoices", hint: "Total invoiced to date" },
  { label: "Outstanding Balance", value: 0, prefix: "₹", icon: Wallet, color: "orange" as const, href: "/admin/invoices", hint: "Open receivables" },
];

// Literal classes so Tailwind can generate them
const colorClassMap: Record<string, string> = {
  blue: "text-[var(--kpi-blue)]", green: "text-[var(--kpi-green)]", purple: "text-[var(--kpi-purple)]",
  teal: "text-[var(--kpi-teal)]", orange: "text-[var(--kpi-orange)]", pink: "text-[var(--kpi-pink)]",
  yellow: "text-[var(--kpi-yellow)]", indigo: "text-[var(--kpi-indigo)]",
};
const bgClassMap: Record<string, string> = {
  blue: "bg-[var(--kpi-blue-bg)]", green: "bg-[var(--kpi-green-bg)]", purple: "bg-[var(--kpi-purple-bg)]",
  teal: "bg-[var(--kpi-teal-bg)]", orange: "bg-[var(--kpi-orange-bg)]", pink: "bg-[var(--kpi-pink-bg)]",
  yellow: "bg-[var(--kpi-yellow-bg)]", indigo: "bg-[var(--kpi-indigo-bg)]",
};

const quickActions = [
  { title: "Manage Users", description: "Add, edit, or manage user accounts", icon: Users, href: "/admin/users" },
  { title: "Companies", description: "View and manage all registered companies", icon: Building2, href: "/admin/companies" },
  { title: "Audit Logs", description: "Review system activity and history logs", icon: FileSearch, href: "/admin/audit-logs" },
  { title: "Reports", description: "View detailed business reports and analytics", icon: BarChart3, href: "/admin/reports" },
];

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Overview</div>
        <h2 className="text-[22px] font-bold tracking-tight text-[var(--text-primary)] m-0 leading-none">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function ViewAllLink({ href }: { href: string }) {
  return (
    <Link to={href} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-primary)] hover:underline no-underline hover:no-underline">
      View all <ArrowRight size={13} />
    </Link>
  );
}

const TIMEFRAMES = [
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "12 Months", value: "12m" },
  { label: "All Time", value: "all" },
];

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState("12m");

  const loadCharts = useCallback((range: string) => {
    apiGet<ChartData>(`/api/v1/admin/charts?range=${range}`).then(setCharts).catch(() => {});
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setError(false);
    Promise.all([
      apiGet<AdminDashboard>("/api/v1/admin/dashboard").then(setData).catch(() => setError(true)),
      apiGet<ChartData>(`/api/v1/admin/charts?range=${timeframe}`).then(setCharts).catch(() => {}),
    ]).finally(() => setRefreshing(false));
  }, [timeframe]);

  useEffect(() => {
    apiGet<AdminDashboard>("/api/v1/admin/dashboard").then(setData).catch(() => setError(true));
  }, []);

  useEffect(() => {
    loadCharts(timeframe);
  }, [timeframe, loadCharts]);

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

  const kpis = charts?.executiveKpis;

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Header */}
      <DashboardHeader onRefresh={handleRefresh} refreshing={refreshing} />

      {/* Financial Overview */}
      <div>
        <SectionHeader title="Financial Overview" action={<ViewAllLink href="/admin/invoices" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <DashboardCard icon={financeKpis[0].icon} label={financeKpis[0].label} value={data.totalRevenue}
            prefix={financeKpis[0].prefix} hint={financeKpis[0].hint} href={financeKpis[0].href}
            iconColorClass={colorClassMap.teal} iconBgClass={bgClassMap.teal} />
          <DashboardCard icon={financeKpis[1].icon} label={financeKpis[1].label} value={data.outstandingBalance}
            prefix={financeKpis[1].prefix} hint={financeKpis[1].hint} href={financeKpis[1].href}
            iconColorClass={colorClassMap.orange} iconBgClass={bgClassMap.orange} />
        </div>
      </div>

      {/* Business KPI cards: 2 rows of 4 */}
      <div>
        <SectionHeader title="Business Overview" action={<ViewAllLink href="/admin/orders" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {kpiMetrics.slice(0, 4).map((m) => (
            <DashboardCard key={m.key} icon={m.icon} label={m.label} value={data[m.key] as number}
              hint={m.hint} href={m.href} iconColorClass={colorClassMap[m.color]} iconBgClass={bgClassMap[m.color]} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {kpiMetrics.slice(4, 8).map((m) => (
            <DashboardCard key={m.key} icon={m.icon} label={m.label} value={data[m.key] as number}
              hint={m.hint} href={m.href} iconColorClass={colorClassMap[m.color]} iconBgClass={bgClassMap[m.color]} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <SectionHeader title="Quick Actions" action={<ViewAllLink href="/admin/reports" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {quickActions.map((a) => (
            <QuickAction key={a.title} icon={a.icon} title={a.title} description={a.description} href={a.href} />
          ))}
        </div>
      </div>

      {/* Analytics & Foundry Intelligence Command Center */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Intelligence & Insights</div>
            <h2 className="text-[22px] font-bold tracking-tight text-[var(--text-primary)] m-0 leading-none">Operations & Financial Analytics</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Timeframe selector */}
            <div className="flex items-center rounded-xl p-1 bg-[var(--bg-surface-hover)] border border-[var(--border-default)]">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.value}
                  type="button"
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    timeframe === tf.value
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <Link
              to="/admin/reports"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              <BarChart3 size={14} /> Full Audit
            </Link>
          </div>
        </div>

        {/* Executive Foundry Metric Highlights */}
        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                <span>On-Time Delivery</span>
                <Award size={14} className="text-emerald-500" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold text-emerald-500 tabular-nums">{kpis.onTimeDeliveryRate}%</span>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 font-mono">Target: &gt;95%</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                <span>Foundry Melt Yield</span>
                <Factory size={14} className="text-blue-500" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold text-blue-500 tabular-nums">{kpis.foundryYield}%</span>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 font-mono">Casting efficiency</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                <span>Quote Win Rate</span>
                <TrendingUp size={14} className="text-purple-500" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold text-purple-500 tabular-nums">{kpis.quoteWinRate}%</span>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 font-mono">Enquiry to order</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                <span>Avg Cycle Time</span>
                <Calendar size={14} className="text-amber-500" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold text-amber-500 tabular-nums">{kpis.avgCycleDays} <span className="text-xs font-normal">days</span></span>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 font-mono">Pattern to dispatch</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] col-span-2 sm:col-span-1 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-medium">
                <span>Catalog Cast Weight</span>
                <Activity size={14} className="text-orange-500" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold text-orange-500 tabular-nums">{kpis.totalTonnageTons} <span className="text-xs font-normal">Tons</span></span>
                <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 font-mono">Total casting mass</span>
              </div>
            </div>
          </div>
        )}

        {/* 6 Rich Interactive Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 1. Cashflow Dual-Series Area Chart */}
          <CashflowDualAreaChart data={charts?.cashflowTrend} />

          {/* 2. Commercial Pipeline Grouped Bar Chart */}
          <PipelineGroupedBarChart data={charts?.pipelineTrend} />

          {/* 3. MES Manufacturing Kanban Stage Throughput */}
          <MesStageBreakdownChart data={charts?.mesStageBreakdown} />

          {/* 4. Metallurgy & Grade Mix Donut */}
          <MetallurgyDonutChart data={charts?.metallurgyMix} />

          {/* 5. Orders by Status Horizontal Matrix */}
          <OrdersStatusChart data={charts?.ordersByStatus} />

          {/* 6. Invoices & Receivables Status Donut */}
          <InvoicesPieChart data={charts?.invoicesByStatus} />

          {/* 7. Industry Sector Distribution */}
          <IndustrySectorBreakdownChart data={charts?.industrySectorMix} />

          {/* 8. Revenue Trend Line Chart */}
          <RevenueLineChart data={charts?.monthlyRevenue} />
        </div>
      </div>
    </div>
  );
}
