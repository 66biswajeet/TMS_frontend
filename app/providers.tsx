"use client";
import React from "react";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { TaskMonitorProvider } from "@/components/tasks/task-monitor-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <TaskMonitorProvider>{children}</TaskMonitorProvider>
    </Provider>
  );
}
