"use client";
import React from "react";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { TaskMonitorProvider } from "@/components/tasks/task-monitor-provider";
import { NotificationsProvider } from "@/lib/notifications-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <NotificationsProvider>
        <TaskMonitorProvider>{children}</TaskMonitorProvider>
      </NotificationsProvider>
    </Provider>
  );
}
