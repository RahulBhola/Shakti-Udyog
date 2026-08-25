import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  ClipboardList,
  FileText,
  ShoppingCart,
  Receipt,
  Inbox,
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { cn } from "../../lib/utils";
import type { NotificationItem } from "../../api/notificationApi";

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
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function getNotificationIcon(type: string) {
  const normalized = (type || "").toLowerCase();
  if (normalized.includes("enquiry") || normalized.includes("rfq")) {
    return <ClipboardList className="w-4 h-4 text-emerald-500" />;
  }
  if (normalized.includes("quotation") || normalized.includes("quote")) {
    return <FileText className="w-4 h-4 text-indigo-500" />;
  }
  if (normalized.includes("order") || normalized.includes("stage") || normalized.includes("production")) {
    return <ShoppingCart className="w-4 h-4 text-blue-500" />;
  }
  if (normalized.includes("invoice") || normalized.includes("payment")) {
    return <Receipt className="w-4 h-4 text-amber-500" />;
  }
  return <Bell className="w-4 h-4 text-teal-500" />;
}

export function PortalNotificationBell() {
  const { unreadCount, notifications, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isCustomerPortal = location.pathname.startsWith("/customer");
  const fullNotificationsUrl = isCustomerPortal ? "/customer/notifications" : "/admin/notifications";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filteredItems = useMemo(() => {
    if (activeTab === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, activeTab]);

  const handleItemClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      await markAsRead(n.id);
    }
    setOpen(false);
    if (n.linkPath) {
      navigate(n.linkPath);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-full",
          "text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface-hover)]",
          "shadow-sm border border-[var(--border-default)]",
          "transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)]",
          open && "bg-[var(--bg-surface-hover)] border-[var(--color-primary)] text-[var(--color-primary)]"
        )}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 flex items-center justify-center",
              "min-w-[19px] h-[19px] px-1 rounded-full",
              "bg-gradient-to-r from-rose-500 to-red-600 text-white font-mono text-[10px] font-extrabold",
              "shadow-md ring-2 ring-[var(--bg-header)] animate-pulse"
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2.5 w-80 sm:w-96 max-w-[calc(100vw-2rem)] z-50",
            "rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)]",
            "shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          )}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-[var(--border-default)] flex items-center justify-between gap-2 bg-[var(--bg-surface)]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--text-primary)]">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full border border-rose-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline transition-colors"
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-[var(--border-default)] bg-[var(--bg-card)] px-3 pt-2 gap-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "pb-2 px-2.5 border-b-2 transition-colors",
                activeTab === "all"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={cn(
                "pb-2 px-2.5 border-b-2 transition-colors",
                activeTab === "unread"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)] font-semibold"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--border-default)]">
            {filteredItems.length === 0 ? (
              <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-secondary)] mb-2.5">
                  <Inbox className="w-6 h-6 opacity-60" />
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  {activeTab === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  You're all caught up on system updates.
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => void handleItemClick(item)}
                  className={cn(
                    "group relative p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left",
                    !item.isRead
                      ? "bg-[var(--color-primary-subtle,rgba(14,165,233,0.04))] hover:bg-[var(--bg-surface-hover)]"
                      : "hover:bg-[var(--bg-surface-hover)]"
                  )}
                >
                  {/* Category Icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center shadow-xs">
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={cn(
                          "text-xs leading-snug truncate",
                          !item.isRead
                            ? "font-bold text-[var(--text-primary)]"
                            : "font-medium text-[var(--text-primary)]"
                        )}
                      >
                        {item.title}
                      </p>
                    </div>

                    {item.body && (
                      <p className="text-[11.5px] text-[var(--text-secondary)] line-clamp-2 mt-0.5 leading-relaxed">
                        {item.body}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[var(--text-muted)]">
                      <span>{formatTimeAgo(item.createdAtUtc)}</span>
                      {item.linkPath && (
                        <>
                          <span>•</span>
                          <span className="text-[var(--color-primary)] flex items-center gap-0.5 font-medium">
                            View details <ExternalLink size={9} />
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Unread dot / quick actions */}
                  <div className="absolute right-3 top-3.5 flex items-center gap-1">
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-sm" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteNotification(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-secondary)] hover:text-red-500 hover:bg-[var(--bg-surface)] rounded transition-all"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-[var(--border-default)] bg-[var(--bg-surface)] text-center">
            <Link
              to={fullNotificationsUrl}
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center justify-center gap-1 py-1"
            >
              <span>View all notifications</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
