"use client";

import { createContext, useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import { taskMonitor } from "@/lib/task-monitor";
import { RootState } from "@/redux/store";
import { getSocket } from "@/lib/socket";

const TaskMonitorContext = createContext(null);

export function TaskMonitorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      // Load all active tasks when the user logs in
      taskMonitor.loadUserTasks(user.id);

      // Listen for socket events related to task updates
      const socket = getSocket();
      if (socket) {
        socket.on(
          "task:updated",
          ({ taskId, updates }: { taskId: string; updates: any }) => {
            taskMonitor.updateTask(taskId, updates);
          }
        );

        socket.on(
          "task:created",
          (task: {
            TaskId: string;
            Title: string;
            Deadline: string;
            Status: string;
            assignees?: string[];
          }) => {
            if (task.assignees?.includes(user.id)) {
              taskMonitor.addTask(task);
            }
          }
        );

        // Cleanup
        return () => {
          socket.off("task:updated");
          socket.off("task:created");
        };
      }
    }
  }, [user]);

  return (
    <TaskMonitorContext.Provider value={null}>
      {children}
    </TaskMonitorContext.Provider>
  );
}

export const useTaskMonitor = () => useContext(TaskMonitorContext);
