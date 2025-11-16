"use client";

import { useNotifications } from "@/lib/notifications-context";
import { Button } from "@/components/ui/button";
import { getSocket } from "@/lib/socket";
import { useState } from "react";

export default function TestNotificationsPage() {
  const { addNotification } = useNotifications();
  const [socketStatus, setSocketStatus] = useState<string>("Unknown");

  const testSuccess = () => {
    addNotification({
      type: "success",
      title: "Success Test",
      message: "This is a test success notification",
    });
  };

  const testError = () => {
    addNotification({
      type: "error",
      title: "Error Test",
      message: "This is a test error notification",
    });
  };

  const testInfo = () => {
    addNotification({
      type: "info",
      title: "Info Test",
      message: "This is a test info notification",
    });
  };

  const testWarning = () => {
    addNotification({
      type: "warning",
      title: "Warning Test",
      message: "This is a test warning notification",
    });
  };

  const checkSocketStatus = () => {
    const socket = getSocket();
    if (!socket) {
      setSocketStatus("Not initialized");
    } else if (socket.connected) {
      setSocketStatus(`Connected (ID: ${socket.id})`);
    } else {
      setSocketStatus("Disconnected");
    }
  };

  const testSocketNotification = () => {
    const socket = getSocket();
    if (!socket || !socket.connected) {
      addNotification({
        type: "error",
        title: "Socket Test Failed",
        message: "Socket is not connected. Please wait and try again.",
      });
      return;
    }

    // Emit a test event (this would need backend support)
    socket.emit("test-notification", {
      type: "info",
      title: "Socket Test",
      message: "This is a test notification via socket",
    });

    addNotification({
      type: "info",
      title: "Socket Event Sent",
      message: "Test notification event emitted to server",
    });
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Notification System</h1>
      <p className="text-gray-600 mb-4">
        Click the buttons below to test different notification types. Check the
        bell icon in the header to see the notifications.
      </p>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Socket Status</h2>
        <p className="text-sm mb-2">
          Status: <span className="font-mono">{socketStatus}</span>
        </p>
        <Button onClick={checkSocketStatus} size="sm" variant="outline">
          Check Socket Status
        </Button>
      </div>

      <h3 className="text-lg font-semibold mb-3">Local Notifications</h3>
      <div className="grid grid-cols-2 gap-4 max-w-md mb-6">
        <Button onClick={testSuccess} variant="default">
          Test Success
        </Button>
        <Button onClick={testError} variant="destructive">
          Test Error
        </Button>
        <Button onClick={testInfo} variant="secondary">
          Test Info
        </Button>
        <Button onClick={testWarning} variant="outline">
          Test Warning
        </Button>
      </div>

      <h3 className="text-lg font-semibold mb-3">Socket Notifications</h3>
      <div className="max-w-md">
        <Button
          onClick={testSocketNotification}
          variant="default"
          className="w-full"
        >
          Test Socket Notification
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          This tests real-time notifications via WebSocket connection
        </p>
      </div>
    </div>
  );
}
