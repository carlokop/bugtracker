import { create } from "zustand";
import * as notificationsApi from "@/api/notifications";
import type { Notification } from "@/types";

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  fetchNotifications: (userId: string) => Promise<Notification[]>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  getUnreadCount: (userId: string) => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,

  fetchNotifications: async (_userId: string) => {
    set({ isLoading: true });
    try {
      const { notifications } = await notificationsApi.fetchNotifications();
      set({ notifications, isLoading: false });
      return notifications;
    } catch {
      set({ isLoading: false });
      return [];
    }
  },

  markAsRead: async (id: string) => {
    await notificationsApi.markNotificationRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  },

  markAllAsRead: async (_userId: string) => {
    await notificationsApi.markAllNotificationsRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  getUnreadCount: (userId: string) => {
    return get().notifications.filter((n) => n.userId === userId && !n.read)
      .length;
  },
}));
