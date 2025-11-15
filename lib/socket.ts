"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { showNotification } from "@/lib/notifications";
import { taskMonitor } from "./task-monitor";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function initializeSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(process.env.NEXT_PUBLIC_API_BASE_URL, {
    auth: {
      token,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
    // Start task monitoring when socket connects
    taskMonitor.start();
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  // Add these event handlers
  socket.on("password_reset:request", (data) => {
    console.log("New password reset request:", data);
    // Show notification to managers
    showNotification(
      "New Password Reset Request",
      `${data.userName} (${data.userRole}) has requested a password reset`
    );
  });

  socket.on("password_reset:approved", (data) => {
    console.log("Password reset approved:", data);
    showNotification(
      "Password Reset Approved",
      "Your password reset request has been approved. Please check your email for the temporary password."
    );
  });

  socket.on("password_reset:rejected", (data) => {
    console.log("Password reset rejected:", data);
    showNotification(
      "Password Reset Rejected",
      data.reason || "Your password reset request has been rejected."
    );
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Hook for using socket in components
export function useSocket(token?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    // Initialize socket
    socketRef.current = initializeSocket(token);
    const currentSocket = socketRef.current;

    const onConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onError = (err: Error) => {
      setError(err.message);
      setIsConnected(false);
    };

    currentSocket.on("connect", onConnect);
    currentSocket.on("disconnect", onDisconnect);
    currentSocket.on("connect_error", onError);

    return () => {
      currentSocket.off("connect", onConnect);
      currentSocket.off("disconnect", onDisconnect);
      currentSocket.off("connect_error", onError);
    };
  }, [token]);

  const emit = (event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event: string, handler: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
      return () => socketRef.current?.off(event, handler);
    }
  };

  const off = (event: string, handler?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    emit,
    on,
    off,
  };
}

// Room management helpers
export const rooms = {
  user: (userId: string) => `user:${userId}`,
  role: (roleName: string) => `role:${roleName}`,
  branch: (branchId: string) => `branch:${branchId}`,
};

export const joinRoom = (room: string) => {
  socket?.emit("join-room", room);
};

export const leaveRoom = (room: string) => {
  socket?.emit("leave-room", room);
};
