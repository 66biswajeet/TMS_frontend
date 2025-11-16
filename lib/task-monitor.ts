import { api } from "./axios";
import { getSocket } from "./socket";
import { showNotification } from "./notifications";

type TaskInfo = {
  TaskId: string;
  Title: string;
  Deadline: string;
  Status: string;
  checklistItems?: Array<{
    TaskChecklistItemId: string;
    Completed: boolean;
    Notes?: string;
  }>;
};

class TaskMonitor {
  private tasks: Map<string, TaskInfo> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private static instance: TaskMonitor | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): TaskMonitor {
    if (!TaskMonitor.instance) {
      TaskMonitor.instance = new TaskMonitor();
    }
    return TaskMonitor.instance;
  }

  // Add a task to monitor
  addTask(task: TaskInfo) {
    this.tasks.set(task.TaskId, task);
    // If the deadline has already passed (or is exactly now) trigger a one-off immediate check.
    // Use a small guard (1 second) to avoid submitting tasks that are scheduled a fraction into the future.
    try {
      const now = new Date();
      const deadline = new Date(task.Deadline);
      if (deadline.getTime() <= now.getTime() - 1000) {
        // overdue: run check immediately but asynchronously so addTask finishes quickly
        setTimeout(
          () => this.checkDeadlines().catch((e) => console.error(e)),
          50
        );
      }
    } catch (err) {
      // If parsing fails, just rely on interval checks
    }
  }

  // Remove a task from monitoring
  removeTask(taskId: string) {
    this.tasks.delete(taskId);
    this.autoSubmittedTasks.delete(taskId); // Also remove from auto-submitted tracking
  }

  // Start monitoring
  start() {
    if (!this.checkInterval) {
      // Check every minute
      this.checkInterval = setInterval(() => this.checkDeadlines(), 60000);
      console.log("[TaskMonitor] Started monitoring tasks");
    }
  }

  // Stop monitoring
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log("[TaskMonitor] Stopped monitoring tasks");
    }
  }

  // Track tasks that have been auto-submitted to prevent retries
  private autoSubmittedTasks = new Set<string>();

  // Main deadline checking logic
  private async checkDeadlines() {
    // Check if user is logged in before proceeding
    if (typeof window !== "undefined" && !localStorage.getItem("user")) {
      console.log("[TaskMonitor] No user logged in, skipping deadline checks");
      return;
    }

    const now = new Date();
    const SUBMIT_BUFFER_MS = 10000; // 10 second buffer

    for (const [taskId, task] of this.tasks.entries()) {
      // Skip if task is already in a final state or has been auto-submitted
      if (this.autoSubmittedTasks.has(taskId)) {
        // Check if auto-submit succeeded recently
        continue;
      }

      // Skip tasks in final states OR already in approval workflow
      if (
        [
          "submitted",
          "approved",
          "rejected",
          "expired",
          "Pending_Area_Manager",
          "Pending_Auditor",
          "Pending_Management",
          "Completed",
        ].includes(task.Status)
      ) {
        this.removeTask(taskId);
        continue;
      }

      const deadline = new Date(task.Deadline);
      const timeRemaining = deadline.getTime() - now.getTime();

      // Only auto-submit if the deadline has passed (timeRemaining is negative)
      // or if we're within the last few seconds of the deadline
      if (
        timeRemaining <= 0 ||
        (timeRemaining <= SUBMIT_BUFFER_MS && timeRemaining > -SUBMIT_BUFFER_MS)
      ) {
        console.log(`[TaskMonitor] Task ${taskId} ready for auto-submit:`, {
          deadline: deadline.toISOString(),
          now: now.toISOString(),
          timeRemaining: Math.round(timeRemaining / 1000) + " seconds",
        });

        // Track that we're attempting to auto-submit this task
        this.autoSubmittedTasks.add(taskId);
        try {
          // Get latest checklist items before submitting
          const response = await api.get(`/tasks/${taskId}/checklist`);
          const checklistItems = response.data.items || [];

          const checklistJson = checklistItems.reduce((acc: any, item: any) => {
            acc[item.TaskChecklistItemId] = {
              completed: item.Completed,
              notes: item.Notes || "",
            };
            return acc;
          }, {});

          // Get current user ID and role
          const userDataStr = localStorage.getItem("user");
          if (!userDataStr) {
            throw new Error("User not logged in");
          }
          const userData = JSON.parse(userDataStr);
          const userId = userData.UserId;
          const userRole = userData.role || "staff";

          // Submit the task
          await api.post("/tasks/submit", {
            taskId,
            submittedBy: userId,
            submitterRole: userRole,
            checklistJson,
            notes: "Auto-submitted: Task deadline reached",
          });

          // Remove from monitoring
          this.removeTask(taskId);

          // Show notification
          showNotification(
            "Task Auto-submitted",
            `Task "${task.Title}" has been automatically submitted as the deadline was reached.`
          );

          // Emit socket event for real-time updates
          const socket = getSocket();
          if (socket) {
            socket.emit("task:auto-submitted", { taskId });
          }
        } catch (error) {
          console.error(
            `[TaskMonitor] Failed to auto-submit task ${taskId}:`,
            error
          );
          // Remove from auto-submitted set on failure so it can be retried
          this.autoSubmittedTasks.delete(taskId);

          // If the error indicates a permanent failure condition, remove the task
          if (error && typeof error === "object" && "response" in error) {
            const errorMessage = (error.response as any)?.data?.message;
            if (
              typeof errorMessage === "string" &&
              (errorMessage.includes("already submitted") ||
                errorMessage.includes("already auto-submitted") ||
                errorMessage.includes("already expired") ||
                errorMessage.includes("not authorized") ||
                errorMessage.includes("not found"))
            ) {
              // These are permanent failures, remove the task
              this.removeTask(taskId);
            } else {
              // For other errors (like network issues), leave the task for retry
              console.log(`[TaskMonitor] Will retry task ${taskId} later`);
            }
          }
        }
      }
    }
  }

  // Update task info (e.g., when checklist changes)
  updateTask(taskId: string, updates: Partial<TaskInfo>) {
    const task = this.tasks.get(taskId);
    if (task) {
      const updatedTask = { ...task, ...updates };

      // If task enters a final state or approval workflow, remove it from monitoring
      if (
        [
          "submitted",
          "approved",
          "rejected",
          "expired",
          "Pending_Area_Manager",
          "Pending_Auditor",
          "Pending_Management",
          "Completed",
        ].includes(updatedTask.Status)
      ) {
        this.removeTask(taskId);
        if (this.autoSubmittedTasks.has(taskId)) {
          this.autoSubmittedTasks.delete(taskId);
        }
        return;
      }

      this.tasks.set(taskId, updatedTask);
    }
  }

  // Load all pending tasks for a user
  async loadUserTasks(userId: string) {
    try {
      const response = await api.get("/tasks", {
        params: {
          userId,
          status: ["Pending", "In Progress"],
        },
      });

      const tasks = response.data.items || [];
      tasks.forEach((task: TaskInfo) => this.addTask(task));
      console.log(`[TaskMonitor] Loaded ${tasks.length} tasks for monitoring`);
    } catch (error) {
      console.error("[TaskMonitor] Failed to load user tasks:", error);
    }
  }
}

export const taskMonitor = TaskMonitor.getInstance();
