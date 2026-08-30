import { useEffect, useState, useCallback, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { customerApi, type Dashboard, type Profile } from "../../api/customerApi";
import { company } from "../../content/company";
import { Loading } from "../../components/ui";
import { DashboardHeader } from "../../components/dashboard";
import { ProfileCompletionBanner } from "../components/ProfileCompletion";
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
  LifeBuoy,
  Phone,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";

/* ------------------------------------------------------------------ */
/*  Section Header Helper                                              */
/* ------------------------------------------------------------------ */

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-0.5">
          Overview
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white m-0 leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function ViewAllLink({ href, text = "View all" }: { href: string; text?: string }) {
  return (
    <Link
      to={href}
      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline no-underline"
    >
      <span>{text}</span>
      <ArrowRight size={13} />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Customer Dashboard Page Component                                 */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setError(false);
    Promise.allSettled([
      customerApi.dashboard().then(setData),
      customerApi.profile().then(setProfile),
    ])
      .catch(() => setError(true))
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    customerApi
      .dashboard()
      .then(setData)
      .catch(() => setError(true));
    customerApi
      .profile()
      .then(setProfile)
      .catch(() => {});
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-6 text-center max-w-md space-y-3">
          <div className="text-red-600 dark:text-red-400 text-sm font-bold flex items-center justify-center gap-2">
            <AlertCircle size={18} />
            <span>Dashboard Unavailable</span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 m-0">
            Could not load customer dashboard data. Please check your connection or refresh.
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
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
        <Loading label="Loading your customer dashboard..." />
      </div>
    );
  }

  const quickActions = [
    {
      title: "Submit New Enquiry",
      description: "Upload CAD drawings, alloy specifications & quantities",
      icon: PlusCircle,
      href: "/customer/enquiries/new",
      themeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      title: "My Orders & Tracking",
      description: "Track 8-stage casting manufacturing & live dispatch LR",
      icon: ShoppingCart,
      href: "/customer/orders",
      themeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      title: "Document Vault",
      description: "Download 3.1 Mill Test Certificates, lab reports & invoices",
      icon: FileSearch,
      href: "/customer/documents",
      themeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      title: "Foundry Helpdesk",
      description: "Direct metallurgical support & ticket management",
      icon: LifeBuoy,
      href: "/customer/support",
      themeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      title: "Company & Profile",
      description: "Manage GSTIN, billing addresses & team contact directory",
      icon: Building,
      href: "/customer/profile",
      themeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Welcome Header */}
      <DashboardHeader
        userName={profile?.fullName || undefined}
        companyName={profile?.company?.name || undefined}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* 2. Profile Completion Banner */}
      {profile && (
        <ProfileCompletionBanner profileData={profile} href="/customer/profile" />
      )}

      {/* 3. Actionable Pending Quotes Alert (When activeQuotations > 0) */}
      {data.activeQuotations > 0 && (
        <div className="p-4.5 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>You have {data.activeQuotations} quotation{data.activeQuotations > 1 ? "s" : ""} awaiting response</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">Action Required</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0 mt-0.5">
                Review commercial pricing, delivery terms, and download official PDF quotation documents.
              </p>
            </div>
          </div>
          <Link
            to="/customer/quotations"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-600/20 shrink-0 no-underline"
          >
            <span>Review Quotations</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* 4. Procurement KPI Metrics */}
      <div className="space-y-3.5">
        <SectionHeader
          title="Procurement & Foundry Metrics"
          subtitle="Real-time status of your enquiries, manufacturing batches, and billing"
          action={<ViewAllLink href="/customer/orders" text="View All Orders" />}
        />

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Open Enquiries */}
          <Link
            to="/customer/enquiries"
            className="p-4.5 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs hover:shadow-md hover:shadow-blue-500/5 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-3 no-underline group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-xs">
                <ClipboardList size={19} />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Enquiries
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-neutral-900 dark:text-white leading-none">
                {data.openEnquiries}
              </div>
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Open Enquiries</div>
              <div className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">Under metallurgical review</div>
            </div>
          </Link>

          {/* Active Quotations */}
          <Link
            to="/customer/quotations"
            className="p-4.5 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs hover:shadow-md hover:shadow-blue-500/5 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-3 no-underline group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-xs">
                <FileText size={19} />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Issued
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-neutral-900 dark:text-white leading-none">
                {data.activeQuotations}
              </div>
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Active Quotes</div>
              <div className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">Proposals awaiting approval</div>
            </div>
          </Link>

          {/* Active Orders in Production */}
          <Link
            to="/customer/orders"
            className="p-4.5 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs hover:shadow-md hover:shadow-blue-500/5 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-3 no-underline group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-xs">
                <ShoppingCart size={19} />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Foundry
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-neutral-900 dark:text-white leading-none">
                {data.activeOrders}
              </div>
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Active Orders</div>
              <div className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">Casting batches in production</div>
            </div>
          </Link>

          {/* Unpaid Tax Invoices */}
          <Link
            to="/customer/invoices"
            className="p-4.5 rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs hover:shadow-md hover:shadow-blue-500/5 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-3 no-underline group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-xs">
                <Receipt size={19} />
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Invoices
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-neutral-900 dark:text-white leading-none">
                {data.unpaidInvoices}
              </div>
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Unpaid Invoices</div>
              <div className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">Pending advance or dispatch bill</div>
            </div>
          </Link>
        </div>
      </div>

      {/* 5. Quick Actions Hub */}
      <div className="space-y-3.5">
        <SectionHeader
          title="Quick Actions Hub"
          subtitle="Frequently used customer operations and direct technical channels"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.title}
                to={a.href}
                className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-xs hover:border-blue-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3 no-underline group"
              >
                <div className="space-y-2">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shrink-0", a.themeBg)}>
                    <Icon size={19} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors m-0">
                      {a.title}
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 m-0 line-clamp-2 leading-relaxed">
                      {a.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <span>Open</span>
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 6. Recent Activity & Shared Documents (2-Column Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activity Panel */}
        <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Clock size={16} />
              </span>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white m-0">Recent Activity Log</h3>
            </div>
            <ViewAllLink href="/customer/notifications" text="All notifications" />
          </div>

          {data.recentActivity.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/5 text-neutral-400 flex items-center justify-center mx-auto">
                <Clock size={18} />
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0">
                No recent activity recorded.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-white/5">
              {data.recentActivity.map((a, i) => (
                <div
                  key={i}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {a.title}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5 font-mono">
                      {formatDate(a.occurredAtUtc)}
                    </div>
                  </div>
                  {a.linkPath && (
                    <Link
                      to={a.linkPath}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-neutral-700 dark:text-neutral-300 hover:text-blue-600 text-xs font-bold transition-all no-underline shrink-0"
                    >
                      <span>View</span>
                      <ArrowRight size={11} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Documents Panel */}
        <div className="rounded-3xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FileCheck size={16} />
              </span>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white m-0">Shared Documents & MTCs</h3>
            </div>
            <ViewAllLink href="/customer/documents" text="Document library" />
          </div>

          {data.recentDocuments.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-white/5 text-neutral-400 flex items-center justify-center mx-auto">
                <FileCheck size={18} />
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0">
                No documents shared yet. Official MTCs and invoices will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-white/5">
              {data.recentDocuments.map((d) => (
                <div
                  key={d.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {d.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {d.category}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {formatDate(d.createdAtUtc)}
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/customer/documents"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all no-underline shrink-0 border border-blue-500/20"
                  >
                    <span>Open</span>
                    <ExternalLink size={11} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 7. Foundry Direct Line & Plant Helpdesk Footer Strip */}
      <div className="p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-gradient-to-r from-blue-500/[0.06] via-white dark:via-[#0f121a] to-white dark:to-[#0f121a] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <ShieldCheck size={14} />
            <span>Dedicated Foundry Support & Engineering Desk</span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 m-0">
            Have questions regarding casting tolerances (ISO 8062-3), pattern match-plates, or expedited dispatch?
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <a
            href={company.contact.phoneHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#121520] border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-all shadow-xs no-underline"
          >
            <Phone size={13} className="text-blue-600 dark:text-blue-400" />
            <span>{company.contact.phone}</span>
          </a>

          <a
            href={company.contact.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 no-underline"
          >
            <MessageSquare size={13} />
            <span>WhatsApp Priority Desk</span>
          </a>

          <Link
            to="/customer/support"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 no-underline"
          >
            <LifeBuoy size={13} />
            <span>Helpdesk Center</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
