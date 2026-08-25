import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { notificationApi, type NotificationItem } from "../api/notificationApi";
import { connectRealtime, type NotificationCreatedPayload } from "../realtime/signalR";
import { useAuth } from "../auth/AuthContext";

interface NotificationContextType {
  unreadCount: number;
  notifications: NotificationItem[];
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationApi.getUnreadCount();
      setUnreadCount(res.unreadCount);
    } catch {
      // Ignored
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await notificationApi.getNotifications(1, 10, false);
      setNotifications(res.items);
      setUnreadCount(res.unreadCount);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAtUtc: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const res = await notificationApi.markAsRead(id);
      if (res && typeof res.unreadCount === "number") {
        setUnreadCount(res.unreadCount);
      }
    } catch {
      // Revert if error
      void fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAtUtc: new Date().toISOString() }))
      );
      setUnreadCount(0);

      await notificationApi.markAllAsRead();
    } catch {
      void fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const target = notifications.find((n) => n.id === id);
      const wasUnread = target ? !target.isRead : false;

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      await notificationApi.deleteNotification(id);
    } catch {
      void fetchNotifications();
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    void fetchUnreadCount();
    void fetchNotifications();
    void connectRealtime();

    const handleRealtimeNotification = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationCreatedPayload>;
      const payload = customEvent.detail;
      if (!payload) return;

      const newItem: NotificationItem = {
        id: payload.id,
        type: "General",
        title: payload.title,
        body: payload.body,
        linkPath: payload.linkPath,
        isRead: false,
        createdAtUtc: payload.createdAtUtc,
        readAtUtc: null,
      };

      setNotifications((prev) => [newItem, ...prev.filter((n) => n.id !== newItem.id)].slice(0, 10));
      setUnreadCount((prev) => prev + 1);
    };

    window.addEventListener("shakti:notification_created", handleRealtimeNotification);
    return () => {
      window.removeEventListener("shakti:notification_created", handleRealtimeNotification);
    };
  }, [isAuthenticated, fetchUnreadCount, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
