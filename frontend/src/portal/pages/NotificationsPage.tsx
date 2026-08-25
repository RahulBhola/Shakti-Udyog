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

function getNotificationIcon(type: string) {
  const normalized = (type || "").toLowerCase();
  if (normalized.includes("enquiry") || normalized.includes("rfq")) {
    return <ClipboardList className="w-5 h-5 text-emerald-500" />;
  }
  if (normalized.includes("quotation") || normalized.includes("quote")) {
    return <FileText className="w-5 h-5 text-indigo-500" />;
  }
  if (normalized.includes("order") || normalized.includes("stage") || normalized.includes("production")) {
    return <ShoppingCart className="w-5 h-5 text-blue-500" />;
  }
  if (normalized.includes("invoice") || normalized.includes("payment")) {
    return <Receipt className="w-5 h-5 text-amber-500" />;
  }
  return <Bell className="w-5 h-5 text-teal-500" />;
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

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                <Bell className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Notification Center
              </h1>
              {data && data.unreadCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full shadow-sm animate-pulse">
                  {data.unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Real-time notifications for enquiries, quotations, manufacturing stages, invoices, and payments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void loadNotifications()}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
              title="Refresh notifications"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            {data && data.unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
              >
                <CheckCheck size={16} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "all", label: "All" },
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
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all",
                categoryFilter === tab.id
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Unread Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--text-secondary)] select-none">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => {
                setUnreadOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded border-[var(--border-default)] text-[var(--color-primary)] focus:ring-0"
            />
            <span>Unread only</span>
          </label>
        </div>
      </div>

      {/* Notifications List */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && !data && (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-[var(--color-primary)] animate-spin mb-3" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">Loading notification history...</p>
        </div>
      )}

      {data && filteredItems.length === 0 && (
        <div className="py-16 px-4 text-center flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-card)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] mb-3">
            <Inbox className="w-8 h-8 opacity-50" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">No notifications found</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mt-1">
            {unreadOnly
              ? "You don't have any unread notifications matching your filters."
              : "No notifications match your current filter and search criteria."}
          </p>
        </div>
      )}

      {data && filteredItems.length > 0 && (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (!item.isRead) void handleMarkRead(item.id);
                if (item.linkPath) navigate(item.linkPath);
              }}
              className={cn(
                "group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                !item.isRead
                  ? "bg-[var(--bg-card)] border-[var(--color-primary)]/40 shadow-xs hover:border-[var(--color-primary)]"
                  : "bg-[var(--bg-card)] border-[var(--border-default)] hover:border-[var(--border-strong,var(--border-default))] opacity-90 hover:opacity-100"
              )}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                {/* Category Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center shadow-xs mt-0.5">
                  {getNotificationIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={cn(
                        "text-sm",
                        !item.isRead
                          ? "font-bold text-[var(--text-primary)]"
                          : "font-medium text-[var(--text-primary)]"
                      )}
                    >
                      {item.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] uppercase">
                      {item.type || "General"}
                    </span>
                    {!item.isRead && (
                      <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                    )}
                  </div>

                  {item.body && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {item.body}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--text-muted)]">
                    <span>{formatTimeAgo(item.createdAtUtc)}</span>
                    {item.linkPath && (
                      <span className="text-[var(--color-primary)] font-medium flex items-center gap-1">
                        View Resource <ExternalLink size={11} />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {!item.isRead && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleMarkRead(item.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-all"
                  >
                    <Check size={13} />
                    <span>Mark as read</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(item.id);
                  }}
                  className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-rose-600 hover:bg-rose-500/10 transition-all"
                  title="Delete notification"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {data && totalPages > 1 && (
        <div className="p-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>

          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Page <strong className="text-[var(--text-primary)]">{page}</strong> of{" "}
            <strong className="text-[var(--text-primary)]">{totalPages}</strong> ({data.totalCount} total)
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
