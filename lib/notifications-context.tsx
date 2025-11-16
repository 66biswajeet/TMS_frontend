"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { Notification } from "@/components/layout/notification-dropdown";

/**
 * NotificationsContext provides a global notification system for the application.
 * Notifications are stored in localStorage for persistence across page refreshes.
 *
 * Usage:
 * ```tsx
 * const { addNotification } = useNotifications()
 *
 * addNotification({
 *   type: "success",
 *   title: "Operation Successful",
 *   message: "Your changes have been saved"
 * })
 * ```
 */

interface NotificationsContextType {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  loadMissedNotifications: (missedNotifications: any[]) => void;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

const STORAGE_KEY = "tms-notifications";
const MAX_NOTIFICATIONS = 50; // Limit stored notifications

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Mark component as mounted on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (!isClient) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = new Date().getTime();
        const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours

        // Convert timestamp strings back to Date objects and auto-mark old ones as read
        const notificationsWithDates = parsed.map((n: any) => {
          const timestamp = new Date(n.timestamp);
          const age = now - timestamp.getTime();

          return {
            ...n,
            timestamp,
            // Auto-mark notifications older than 24 hours as read
            read: n.read || age > oneDayInMs,
          };
        });

        setNotifications(notificationsWithDates);
      }
    } catch (error) {
      console.error("Failed to parse stored notifications:", error);
    }
  }, [isClient]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (!isClient) return;

    try {
      if (notifications.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to save notifications:", error);
    }
  }, [notifications, isClient]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      console.log(
        "[NOTIFICATION DEBUG] addNotification called with:",
        notification
      );
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        read: false,
      };
      console.log(
        "[NOTIFICATION DEBUG] Created notification object:",
        newNotification
      );

      setNotifications((prev) => {
        const updated = [newNotification, ...prev];
        console.log(
          "[NOTIFICATION DEBUG] Updated notifications array, total count:",
          updated.length
        );
        // Keep only the most recent MAX_NOTIFICATIONS
        return updated.slice(0, MAX_NOTIFICATIONS);
      });
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const loadMissedNotifications = useCallback((missedNotifications: any[]) => {
    console.log(
      "[NOTIFICATION DEBUG] Loading missed notifications:",
      missedNotifications
    );

    // Convert API response to Notification format
    const formattedNotifications: Notification[] = missedNotifications.map(
      (n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        timestamp: new Date(n.timestamp),
        scheduledTime: n.scheduledTime ? new Date(n.scheduledTime) : undefined,
        read: n.read || false,
      })
    );

    setNotifications((prev) => {
      // Merge missed notifications with existing ones, avoiding duplicates
      const existingIds = new Set(prev.map((n) => n.id));
      const newNotifications = formattedNotifications.filter(
        (n) => !existingIds.has(n.id)
      );

      // Combine and sort by timestamp (newest first)
      const combined = [...newNotifications, ...prev].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      // Keep only the most recent MAX_NOTIFICATIONS
      return combined.slice(0, MAX_NOTIFICATIONS);
    });
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        markAsRead,
        markAllAsRead,
        loadMissedNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
}
