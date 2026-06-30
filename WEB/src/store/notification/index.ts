import { create } from "zustand";
import { SystemNotification } from "@/types/notification";
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/api/notification/notificationApi";

interface NotificationStore {
  notifications: SystemNotification[];
  unreadCount: number;
  loading: boolean;

  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  addNotification: (notification: SystemNotification) => void;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: number) => Promise<void>;
  reset: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    try {
      set({ loading: true });
      const notifications = await getMyNotifications();
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ notifications, unreadCount, loading: false });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const unreadCount = await getUnreadCount();
      set({ unreadCount });
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  },

  addNotification: (notification: SystemNotification) => {
    set((state) => ({
      notifications: [
        { ...notification, isRead: false },
        ...state.notifications,
      ],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await markAllNotificationsAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  },

  removeNotification: async (notificationId: number) => {
    try {
      await deleteNotification(notificationId);
      set((state) => {
        const removed = state.notifications.find(
          (n) => n.id === notificationId
        );
        return {
          notifications: state.notifications.filter(
            (n) => n.id !== notificationId
          ),
          unreadCount:
            removed && !removed.isRead
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
        };
      });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  },

  reset: () => {
    set({ notifications: [], unreadCount: 0, loading: false });
  },
}));
