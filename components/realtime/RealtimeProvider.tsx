"use client";

import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initializeSocket, joinRoom, rooms } from "@/lib/socket";
import {
  requestNotificationPermission,
  showNotification,
} from "@/lib/notifications";
import type { RootState, AppDispatch } from "@/redux/store";
import {
  showInfoToast,
  setNotificationCount,
} from "@/redux/modules/ui/actions";
import { useNotifications } from "@/lib/notifications-context";

/**
 * RealtimeProvider
 * - Initializes socket when user is logged in
 * - Joins user room and listens for task-created events
 * - Shows desktop notification and in-app toast, and increments notification count
 */
export default function RealtimeProvider() {
  const dispatch = useDispatch<AppDispatch>();
  const socketRef = useRef<any>(null);
  const { addNotification, loadMissedNotifications } = useNotifications();
  const greetedRef = useRef(false);
  const missedNotificationsFetchedRef = useRef(false);

  const auth = useSelector((state: RootState) => state.auth);
  const notificationCount = useSelector(
    (state: RootState) => state.ui.notificationCount
  );

  useEffect(() => {
    // Ask for permission once (non-blocking)
    if (typeof window !== "undefined") {
      requestNotificationPermission();
    }
  }, []);

  useEffect(() => {
    const token = auth?.token;
    const user = auth?.user;

    console.log(
      "[NOTIFICATION DEBUG] RealtimeProvider useEffect triggered, user:",
      user?.userId,
      "hasToken:",
      !!token
    );
    console.log("[NOTIFICATION DEBUG] Full auth object:", auth);
    console.log("[NOTIFICATION DEBUG] User object:", user);
    console.log(
      "[NOTIFICATION DEBUG] localStorage token:",
      localStorage.getItem("token") ? "exists" : "missing"
    );
    console.log(
      "[NOTIFICATION DEBUG] localStorage user:",
      localStorage.getItem("user")
    );

    // Don't attempt socket connection if no valid token or user
    if (!token || !user || !user.userId) {
      console.log(
        "RealtimeProvider: No token or user, skipping socket connection"
      );
      return;
    }

    // Validate token format (basic check)
    if (typeof token !== "string" || token.trim().length === 0) {
      console.warn("RealtimeProvider: Invalid token format");
      return;
    }

    try {
      // Initialize socket and keep a ref
      const socket = initializeSocket(token);
      socketRef.current = socket;

      const userRoom = rooms.user(user.userId);

      const onConnect = () => {
        console.log(
          "[NOTIFICATION DEBUG] Socket connected, joining user room:",
          userRoom
        );
        // Join user-specific room on connect
        try {
          joinRoom(userRoom);
          console.log(
            "[NOTIFICATION DEBUG] Successfully joined room:",
            userRoom
          );
        } catch (err) {
          console.warn("Failed to join user room:", err);
        }

        // Fetch missed notifications on connect (only once per session)
        if (!missedNotificationsFetchedRef.current) {
          fetchMissedNotifications();
          missedNotificationsFetchedRef.current = true;
        }

        // Previously showed a dummy in-app notification here ("Realtime Connected").
        // Removed to avoid repetitive, unnecessary notifications on reconnects.
      };

      const fetchMissedNotifications = async () => {
        try {
          console.log(
            "[NOTIFICATION DEBUG] Fetching missed notifications for user:",
            user.userId
          );

          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050"
            }/notifications/missed`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            console.error(
              "[NOTIFICATION DEBUG] Failed to fetch missed notifications:",
              response.status
            );
            return;
          }

          const data = await response.json();
          console.log(
            "[NOTIFICATION DEBUG] Received missed notifications:",
            data
          );

          if (data.success && data.notifications?.length > 0) {
            loadMissedNotifications(data.notifications);
            console.log(
              `[NOTIFICATION DEBUG] Loaded ${data.notifications.length} missed notifications`
            );
          }
        } catch (error) {
          console.error(
            "[NOTIFICATION DEBUG] Error fetching missed notifications:",
            error
          );
        }
      };

      const onTaskCreated = (payload: any) => {
        try {
          // payload.assignedTo might be an array of user ids
          const assignedTo: string[] = payload?.assignedTo || [];

          const isForMe =
            Array.isArray(assignedTo) && assignedTo.includes(user.userId);

          // If server already scoped this event to the user's room, it will arrive only to relevant users
          if (isForMe || payload?.userId === user.userId) {
            // Show in-app toast
            dispatch(
              showInfoToast(
                "New task assigned",
                `Task ${payload.taskId} has been assigned to you.`
              )
            );

            // Show desktop notification (if permission granted)
            try {
              showNotification(
                "New Task Assigned",
                `Task ${payload.taskId} has been assigned to you.`
              );
            } catch (err) {
              console.warn("showNotification failed:", err);
            }

            // Add to in-app notifications (bell dropdown)
            try {
              addNotification({
                type: "info",
                title: "New Task Assigned",
                message: `Task ${payload.taskId} has been assigned to you.`,
              });
            } catch (err) {
              console.warn("addNotification failed:", err);
            }

            // Increment notification count
            dispatch(setNotificationCount((notificationCount || 0) + 1));
          }
        } catch (err) {
          console.error("Error handling task:created event:", err);
        }
      };

      // Password reset related events
      const onPasswordResetRequest = (data: any) => {
        try {
          addNotification({
            type: "warning",
            title: "Password Reset Requested",
            message: `${data?.userName ?? "A user"} requested a password reset`,
          });
        } catch (err) {
          console.warn("addNotification failed (password_reset:request):", err);
        }
      };

      const onPasswordResetApproved = (_data: any) => {
        try {
          addNotification({
            type: "success",
            title: "Password Reset Approved",
            message: "Your password reset request was approved.",
          });
        } catch (err) {
          console.warn(
            "addNotification failed (password_reset:approved):",
            err
          );
        }
      };

      const onPasswordResetRejected = (data: any) => {
        try {
          addNotification({
            type: "error",
            title: "Password Reset Rejected",
            message:
              data?.reason || "Your password reset request was rejected.",
          });
        } catch (err) {
          console.warn(
            "addNotification failed (password_reset:rejected):",
            err
          );
        }
      };

      // Generic notification handler for notification:new events
      const onNotificationNew = (data: any) => {
        console.log(
          "[NOTIFICATION DEBUG] Received notification:new event:",
          data
        );
        try {
          console.log("[NOTIFICATION DEBUG] Adding notification to context:", {
            type: data?.type || "info",
            title: data?.title || "Notification",
            message: data?.message || "You have a new notification",
            scheduledTime: data?.data?.scheduledTime,
          });
          addNotification({
            type: data?.type || "info",
            title: data?.title || "Notification",
            message: data?.message || "You have a new notification",
            scheduledTime: data?.data?.scheduledTime
              ? new Date(data.data.scheduledTime)
              : undefined,
          });
          console.log("[NOTIFICATION DEBUG] Notification added successfully");
        } catch (err) {
          console.error(
            "[NOTIFICATION DEBUG] addNotification failed (notification:new):",
            err
          );
        }
      };

      socket.on("connect", onConnect);
      socket.on("task:created", onTaskCreated);
      socket.on("password_reset:request", onPasswordResetRequest);
      socket.on("password_reset:approved", onPasswordResetApproved);
      socket.on("password_reset:rejected", onPasswordResetRejected);
      socket.on("notification:new", onNotificationNew);
      console.log(
        "[NOTIFICATION DEBUG] All socket event listeners registered for user:",
        user.userId
      );

      // Cleanup on unmount or change
      return () => {
        try {
          missedNotificationsFetchedRef.current = false; // Reset for next connection
          socket.off("connect", onConnect);
          socket.off("task:created", onTaskCreated);
          socket.off("password_reset:request", onPasswordResetRequest);
          socket.off("password_reset:approved", onPasswordResetApproved);
          socket.off("password_reset:rejected", onPasswordResetRejected);
          socket.off("notification:new", onNotificationNew);
          // leave room if needed
          // socket.emit('leave-room', userRoom)
        } catch (err) {
          console.warn("Error during socket cleanup:", err);
        }
      };
    } catch (err) {
      console.error("Error initializing socket:", err);
    }
  }, [
    auth,
    dispatch,
    notificationCount,
    addNotification,
    loadMissedNotifications,
  ]);

  return null;
}
