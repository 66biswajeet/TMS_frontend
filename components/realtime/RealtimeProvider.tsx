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

/**
 * RealtimeProvider
 * - Initializes socket when user is logged in
 * - Joins user room and listens for task-created events
 * - Shows desktop notification and in-app toast, and increments notification count
 */
export default function RealtimeProvider() {
  const dispatch = useDispatch<AppDispatch>();
  const socketRef = useRef<any>(null);

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

    if (!token || !user) {
      return;
    }

    // Initialize socket and keep a ref
    const socket = initializeSocket(token);
    socketRef.current = socket;

    const userRoom = rooms.user(user.id);

    const onConnect = () => {
      // Join user-specific room on connect
      try {
        joinRoom(userRoom);
      } catch (err) {
        console.warn("Failed to join user room:", err);
      }
    };

    const onTaskCreated = (payload: any) => {
      try {
        // payload.assignedTo might be an array of user ids
        const assignedTo: string[] = payload?.assignedTo || [];

        const isForMe =
          Array.isArray(assignedTo) && assignedTo.includes(user.id);

        // If server already scoped this event to the user's room, it will arrive only to relevant users
        if (isForMe || payload?.userId === user.id) {
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

          // Increment notification count
          dispatch(setNotificationCount((notificationCount || 0) + 1));
        }
      } catch (err) {
        console.error("Error handling task:created event:", err);
      }
    };

    socket.on("connect", onConnect);
    socket.on("task:created", onTaskCreated);

    // Cleanup on unmount or change
    return () => {
      try {
        socket.off("connect", onConnect);
        socket.off("task:created", onTaskCreated);
        // leave room if needed
        // socket.emit('leave-room', userRoom)
      } catch (err) {
        // ignore
      }
    };
  }, [auth, dispatch, notificationCount]);

  return null;
}
