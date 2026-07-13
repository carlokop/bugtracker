import { create } from "zustand";
import { MOCK_NOTIFICATIONS } from "@/mock/seed";
import { delay } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types";

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  fetchNotifications: (userId: string) => Promise<Notification[]>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  addNotification: (
    userId: string,
    type: NotificationType,
    referenceId: string,
    message: string,
  ) => Promise<Notification>;
  getUnreadCount: (userId: string) => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [...MOCK_NOTIFICATIONS],
  isLoading: false,

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true });
    await delay();
    set({ isLoading: false });
    return get()
      .notifications.filter((n) => n.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },

  markAsRead: async (id: string) => {
    await delay(50);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  },

  markAllAsRead: async (userId: string) => {
    await delay(50);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.userId === userId ? { ...n, read: true } : n,
      ),
    }));
  },

  addNotification: async (userId, type, referenceId, message) => {
    await delay(50);
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      userId,
      type,
      referenceId,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
    return notification;
  },

  getUnreadCount: (userId: string) => {
    return get().notifications.filter((n) => n.userId === userId && !n.read)
      .length;
  },
}));
