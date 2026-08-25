import { apiGet, apiPatch, apiDelete } from "./client";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkPath: string | null;
  isRead: boolean;
  createdAtUtc: string;
  readAtUtc: string | null;
}

export interface NotificationsPagedResponse {
  items: NotificationItem[];
  totalCount: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

export const notificationApi = {
  getNotifications: (page = 1, pageSize = 20, unreadOnly = false) =>
    apiGet<NotificationsPagedResponse>(
      `/api/v1/notifications?page=${page}&pageSize=${pageSize}&unreadOnly=${unreadOnly}`
    ),

  getUnreadCount: () =>
    apiGet<{ unreadCount: number }>("/api/v1/notifications/unread-count"),

  markAsRead: (id: string) =>
    apiPatch<{ success: boolean; unreadCount: number }>(`/api/v1/notifications/${id}/read`, {}),

  markAllAsRead: () =>
    apiPatch<{ success: boolean; markedCount: number; unreadCount: number }>(
      "/api/v1/notifications/read-all",
      {}
    ),

  deleteNotification: (id: string) =>
    apiDelete<{ success: boolean }>(`/api/v1/notifications/${id}`),
};
