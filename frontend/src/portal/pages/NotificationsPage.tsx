import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Check,
  Trash2,
  ExternalLink,
  ClipboardList,
  FileText,
  ShoppingCart,
  Receipt,
  Search,
  RefreshCw,
  Inbox,
  AlertCircle,
  Clock,
  Layers,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { notificationApi, type NotificationsPagedResponse } from "../../api/notificationApi";
import { useNotifications } from "../../context/NotificationContext";
import { cn } from "../../lib/utils";

function formatTimeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function getNotificationMeta(type: string) {
  const normalized = (type || "").toLowerCase();
  if (normalized.includes("enquiry") || normalized.includes("rfq")) {
    return {
      icon: ClipboardList,
      bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      label: "Enquiry",
    };
  }
  if (normalized.includes("quotation") || normalized.includes("quote")) {
    return {
      icon: FileText,
      bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      label: "Quotation",
    };
  }
  if (normalized.includes("order") || normalized.includes("stage") || normalized.includes("production")) {
    return {
      icon: ShoppingCart,
      bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      label: "Order",
    };
  }
  if (normalized.includes("invoice") || normalized.includes("payment")) {
    return {
      icon: Receipt,
      bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      label: "Invoice",
    };
  }
  return {
    icon: Bell,
    bg: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    label: "System",
  };
}

export default function NotificationsPage() {
  const { fetchNotifications: refreshGlobalNotifications } = useNotifications();
  const [data, setData] = useState<NotificationsPagedResponse | null>(null);
  const [page, setPage] = useState<number>(1);
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await notificationApi.getNotifications(page, 20, unreadOnly);
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((n) =>
                n.id === id ? { ...n, isRead: true, readAtUtc: new Date().toISOString() } : n
              ),
              unreadCount: Math.max(0, prev.unreadCount - 1),
            }
          : prev
      );
      void refreshGlobalNotifications();
    } catch {
      void loadNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((n) => ({ ...n, isRead: true, readAtUtc: new Date().toISOString() })),
              unreadCount: 0,
            }
          : prev
      );
      void refreshGlobalNotifications();
    } catch {
      void loadNotifications();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      void loadNotifications();
      void refreshGlobalNotifications();
    } catch {
      // Ignored
    }
  };

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((item) => {
      // Category filter
      if (categoryFilter !== "all") {
        const itemType = (item.type || "").toLowerCase();
        if (categoryFilter === "orders" && !itemType.includes("order") && !itemType.includes("production")) return false;
        if (categoryFilter === "quotations" && !itemType.includes("quotation") && !itemType.includes("quote")) return false;
        if (categoryFilter === "invoices" && !itemType.includes("invoice") && !itemType.includes("payment")) return false;
        if (categoryFilter === "enquiries" && !itemType.includes("enquiry") && !itemType.includes("rfq")) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesBody = item.body ? item.body.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesBody) return false;
      }

      return true;
    });
  }, [data?.items, categoryFilter, searchQuery]);

  // KPI calculations
  const totalCount = data?.totalCount || 0;
  const unreadCount = data?.unreadCount || 0;

  const { ordersCount, quotesCount, invoicesCount } = useMemo(() => {
    const items = data?.items || [];
    let orders = 0;
    let quotes = 0;
    let invoices = 0;
    for (const it of items) {
      const t = (it.type || "").toLowerCase();
      if (t.includes("order") || t.includes("production") || t.includes("stage")) orders++;
      if (t.includes("quotation") || t.includes("quote") || t.includes("enquiry") || t.includes("rfq")) quotes++;
      if (t.includes("invoice") || t.includes("payment")) invoices++;
    }
    return { ordersCount: orders, quotesCount: quotes, invoicesCount: invoices };
  }, [data?.items]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* ================================================================= */}
      {/* 1. HERO HEADER                                                    */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 flex items-center justify-center shadow-xs">
            <Bell size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight m-0">
                Notification Center
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-white/10">
                Real-Time Delivery
              </span>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full shadow-xs animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 m-0">
              Live alerts for enquiries, quotations, order stage progressions, invoice generation, and payment approvals.
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => void loadNotifications()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#121520] hover:bg-neutral-50 dark:hover:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-all shadow-2xs cursor-pointer"
            title="Refresh notifications"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin text-blue-600" : ""} />
            <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <CheckCheck size={14} />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. KPI METRICS GRID                                               */}
      {/* ================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Notifications */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(59,130,246,0.15),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Layers size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight font-mono">
            {totalCount}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Total Logs</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Dispatched alerts</div>
        </div>

        {/* Unread Alerts */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(244,63,94,0.15),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight font-mono">
            {unreadCount}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Unread Alerts</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Pending review</div>
        </div>

        {/* Orders & Production */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(16,185,129,0.15),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Zap size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight font-mono">
            {ordersCount}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Orders & Shopfloor</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Stage transitions</div>
        </div>

        {/* Quotes & Enquiries */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(99,102,241,0.15),transparent)] before:pointer-events-none">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <FileText size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight font-mono">
            {quotesCount}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Quotes & Enquiries</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Estimation requests</div>
        </div>

        {/* Invoices & Billing */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all before:absolute before:inset-0 before:bg-[radial-gradient(150px_110px_at_95%_0%,rgba(245,158,11,0.15),transparent)] before:pointer-events-none col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Receipt size={18} />
          </div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-neutral-900 dark:text-white mt-3 leading-tight tracking-tight font-mono">
            {invoicesCount}
          </div>
          <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1">Invoices & Finance</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Payment receipts</div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. FILTER TOOLBAR                                                 */}
      {/* ================================================================= */}
      <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "all", label: "All Notifications" },
            { id: "orders", label: "Orders & Production" },
            { id: "quotations", label: "Quotes" },
            { id: "invoices", label: "Invoices & Payments" },
            { id: "enquiries", label: "Enquiries" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setCategoryFilter(tab.id);
                setPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none",
                categoryFilter === tab.id
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "bg-neutral-100 dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Unread Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#090b10] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-700 dark:text-neutral-300 select-none shrink-0">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => {
                setUnreadOnly(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4 rounded border-neutral-300 text-[var(--color-primary)] focus:ring-0 cursor-pointer"
            />
            <span>Unread only</span>
          </label>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. NOTIFICATIONS LIST                                             */}
      {/* ================================================================= */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && !data && (
        <div className="p-16 text-center flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-[var(--color-primary)] animate-spin mb-3" />
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Loading notification history...</p>
        </div>
      )}

      {data && filteredItems.length === 0 && (
        <div className="py-16 px-4 text-center flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 dark:border-white/10 bg-white dark:bg-[#0f121a]">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-400 mb-3">
            <Inbox className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">No notifications found</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
            {unreadOnly
              ? "You don't have any unread notifications matching your filters."
              : "No notifications match your current filter and search criteria."}
          </p>
        </div>
      )}

      {data && filteredItems.length > 0 && (
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const meta = getNotificationMeta(item.type);
            const Icon = meta.icon;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.isRead) void handleMarkRead(item.id);
                  if (item.linkPath) navigate(item.linkPath);
                }}
                className={cn(
                  "group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:shadow-md hover:-translate-y-0.5",
                  !item.isRead
                    ? "bg-blue-50/40 dark:bg-blue-500/[0.04] border-blue-300 dark:border-blue-500/30 hover:border-[var(--color-primary)]"
                    : "bg-white dark:bg-[#0f121a] border-neutral-200/90 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20"
                )}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Category Icon */}
                  <div
                    className={cn(
                      "shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center shadow-2xs mt-0.5",
                      meta.bg
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={cn(
                          "text-sm",
                          !item.isRead
                            ? "font-extrabold text-neutral-900 dark:text-white"
                            : "font-semibold text-neutral-800 dark:text-neutral-200"
                        )}
                      >
                        {item.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10 uppercase">
                        {meta.label}
                      </span>
                      {!item.isRead && (
                        <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                      )}
                    </div>

                    {item.body && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                        {item.body}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatTimeAgo(item.createdAtUtc)}
                      </span>
                      {item.linkPath && (
                        <span className="text-[var(--color-primary)] font-bold flex items-center gap-1 hover:underline">
                          <span>View resource</span>
                          <ExternalLink size={11} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleMarkRead(item.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200/70 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <Check size={13} className="text-emerald-500" />
                      <span>Mark read</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(item.id);
                    }}
                    className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
                    title="Delete notification"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================= */}
      {/* 5. PAGINATION CONTROLS                                             */}
      {/* ================================================================= */}
      {data && totalPages > 1 && (
        <div className="p-4 rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-[#0f121a] shadow-2xs flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            ← Previous
          </button>

          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Page <strong className="text-neutral-900 dark:text-white">{page}</strong> of{" "}
            <strong className="text-neutral-900 dark:text-white">{totalPages}</strong> ({data.totalCount} total)
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
