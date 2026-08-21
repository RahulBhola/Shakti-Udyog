import { useEffect, useState, useCallback, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { customerApi, type Dashboard } from "../../api/customerApi";
import { Loading } from "../../components/ui";
import { DashboardCard, DashboardHeader, QuickAction } from "../../components/dashboard";
import { formatDate } from "../shared";
import {
  ClipboardList,
  FileText,
  ShoppingCart,
  Receipt,
  PlusCircle,
  FileSearch,
  ArrowRight,
  Clock,
  FileCheck,
  Building,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  KPI & Color mapping                                                */
/* ------------------------------------------------------------------ */

const colorClassMap: Record<string, string> = {
  blue: "text-[var(--kpi-blue)]",
  green: "text-[var(--kpi-green)]",
  purple: "text-[var(--kpi-purple)]",
  teal: "text-[var(--kpi-teal)]",
  orange: "text-[var(--kpi-orange)]",
  pink: "text-[var(--kpi-pink)]",
  yellow: "text-[var(--kpi-yellow)]",
  indigo: "text-[var(--kpi-indigo)]",
};

const bgClassMap: Record<string, string> = {
  blue: "bg-[var(--kpi-blue-bg)]",
  green: "bg-[var(--kpi-green-bg)]",
  purple: "bg-[var(--kpi-purple-bg)]",
  teal: "bg-[var(--kpi-teal-bg)]",
  orange: "bg-[var(--kpi-orange-bg)]",
  pink: "bg-[var(--kpi-pink-bg)]",
  yellow: "bg-[var(--kpi-yellow-bg)]",
  indigo: "bg-[var(--kpi-indigo-bg)]",
};

const quickActions = [
  {
    title: "Submit New RFQ",
    description: "Submit casting requirements, specifications & CAD drawings",
    icon: PlusCircle,
    href: "/customer/enquiries/new",
  },
  {
    title: "View Active Orders",
    description: "Track 8-stage manufacturing & live dispatch timeline",
    icon: ShoppingCart,
    href: "/customer/orders",
  },
  {
    title: "Document Library",
    description: "Download MTCs, inspection reports, and tax invoices",
    icon: FileSearch,
    href: "/customer/documents",
  },
  {
    title: "Company Profile",
    description: "Manage GSTIN, billing addresses & contact directory",
    icon: Building,
    href: "/customer/profile",
  },
];

/* ------------------------------------------------------------------ */
/*  Section Header & Helper                                            */
/* ------------------------------------------------------------------ */

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
          Overview
        </div>
        <h2 className="text-[22px] font-bold tracking-tight text-[var(--text-primary)] m-0 leading-none">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function ViewAllLink({ href }: { href: string }) {
  return (
    <Link
      to={href}
      className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-primary)] hover:underline no-underline hover:no-underline"
    >
      View all <ArrowRight size={13} />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Customer Dashboard Page Component                                 */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setError(false);
    customerApi
      .dashboard()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    customerApi
      .dashboard()
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="rounded-[16px] border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-6 text-center max-w-md">
          <div className="text-red-600 dark:text-red-400 text-sm font-semibold mb-2">Dashboard Unavailable</div>
          <p className="text-[var(--text-secondary)] text-xs">
            Could not load customer dashboard data. Please check your connection or refresh.
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-hover)] transition-colors duration-200"
          >
            Refresh Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading label="Loading your dashboard" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Header */}
      <DashboardHeader onRefresh={handleRefresh} refreshing={refreshing} />

      {/* KPI Cards: 4 column grid */}
      <div>
        <SectionHeader title="Procurement Metrics" action={<ViewAllLink href="/customer/orders" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <DashboardCard
            icon={ClipboardList}
            label="Open Enquiries"
            value={data.openEnquiries}
            hint="RFQs currently under engineering review"
            href="/customer/enquiries"
            iconColorClass={colorClassMap.purple}
            iconBgClass={bgClassMap.purple}
          />
          <DashboardCard
            icon={FileText}
            label="Active Quotes"
            value={data.activeQuotations}
            hint="Proposals awaiting your approval"
            href="/customer/quotations"
            iconColorClass={colorClassMap.indigo}
            iconBgClass={bgClassMap.indigo}
          />
          <DashboardCard
            icon={ShoppingCart}
            label="Active Orders"
            value={data.activeOrders}
            hint="Casting batches in manufacturing"
            href="/customer/orders"
            iconColorClass={colorClassMap.orange}
            iconBgClass={bgClassMap.orange}
          />
          <DashboardCard
            icon={Receipt}
            label="Unpaid Invoices"
            value={data.unpaidInvoices}
            hint="Pending tax invoices awaiting clearance"
            href="/customer/invoices"
            iconColorClass={colorClassMap.yellow}
            iconBgClass={bgClassMap.yellow}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <SectionHeader title="Quick Actions" action={<ViewAllLink href="/customer/documents" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {quickActions.map((a) => (
            <QuickAction
              key={a.title}
              icon={a.icon}
              title={a.title}
              description={a.description}
              href={a.href}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity & Recent Documents: 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Panel */}
        <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[var(--color-primary)]" />
              <h3 className="text-[15px] font-bold text-[var(--text-primary)] m-0">Recent Activity</h3>
            </div>
            <ViewAllLink href="/customer/notifications" />
          </div>

          {data.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--text-secondary)]">
              No recent activity recorded.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.recentActivity.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] transition-colors duration-150"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{a.title}</div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{formatDate(a.occurredAtUtc)}</div>
                  </div>
                  {a.linkPath && (
                    <Link
                      to={a.linkPath}
                      className="text-xs font-semibold text-[var(--color-primary)] hover:underline no-underline shrink-0"
                    >
                      View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Documents Panel */}
        <div className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-card)] p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <FileCheck size={16} className="text-[var(--kpi-teal)]" />
              <h3 className="text-[15px] font-bold text-[var(--text-primary)] m-0">Shared Documents & MTCs</h3>
            </div>
            <ViewAllLink href="/customer/documents" />
          </div>

          {data.recentDocuments.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--text-secondary)]">
              No documents shared yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {data.recentDocuments.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] transition-colors duration-150"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{d.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                        {d.category}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">{formatDate(d.createdAtUtc)}</span>
                    </div>
                  </div>
                  <Link
                    to="/customer/documents"
                    className="text-xs font-semibold text-[var(--color-primary)] hover:underline no-underline shrink-0"
                  >
                    Open
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
