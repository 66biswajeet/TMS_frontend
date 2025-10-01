"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Clock,
  Users,
  Building,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  ArrowUp,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/axios";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { showError, showSuccess, showWarning } from "@/lib/toast";

interface TaskDetailsProps {
  taskId: string;
}

interface Task {
  TaskId: string;
  Title: string;
  Description: string;
  Scope: string;
  Status: string;
  Deadline: string;
  BranchNames?: string[];
  Priority: string;
  CreatedAt: string;
  CreatedBy: string;
  AutoForward: boolean;
}

interface ChecklistItem {
  TaskChecklistItemId: string;
  Title: string;
  Completed: boolean;
  Notes?: string;
  SortOrder: number;
}

interface ActivityItem {
  id: number;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

interface WorkflowStep {
  level: string;
  role: string;
  user?: string;
  status: "pending" | "completed" | "current";
  completedAt?: string;
  comments?: string;
}

interface Assignee {
  id: string;
  name: string;
  email: string;
}

export function TaskDetails({ taskId }: TaskDetailsProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user from Redux state
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        // Fetch task details
        const taskResponse = await api.get(`/tasks/${taskId}`);
        console.log("Task response:", taskResponse.data);
        setTask(taskResponse.data);

        // Fetch checklist items
        const checklistResponse = await api.get(`/tasks/${taskId}/checklist`);
        console.log("Checklist response:", checklistResponse.data);
        console.log("Checklist items:", checklistResponse.data.items);

        const items = checklistResponse.data.items || [];
        console.log("Setting checklist items:", items.length, "items");
        setChecklistItems(items);

        // Fetch activity log
        const activityResponse = await api.get(`/tasks/${taskId}/activity`);
        setActivityLog(activityResponse.data.items || []);

        // Fetch workflow steps
        const workflowResponse = await api.get(`/tasks/${taskId}/workflow`);
        setWorkflowSteps(workflowResponse.data.steps || []);

        // Fetch assignees
        const assigneesResponse = await api.get(`/tasks/${taskId}/assignees`);
        setAssignees(assigneesResponse.data.items || []);

        setLoading(false);
      } catch (err) {
        setError("Failed to fetch task data");
        setLoading(false);
        console.error("Error fetching task data:", err);
      }
    };

    fetchTaskData();
  }, [taskId]);

  const [reviewReason, setReviewReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateChecklistItem = async (
    itemId: string,
    completed: boolean,
    notes?: string
  ) => {
    try {
      // Update local state immediately for responsive UI
      setChecklistItems((items) =>
        items.map((item) =>
          item.TaskChecklistItemId === itemId
            ? { ...item, Completed: completed, Notes: notes || item.Notes }
            : item
        )
      );

      // Save checklist item changes to database
      await api.patch(`/tasks/${taskId}/checklist/${itemId}`, {
        completed,
        notes: notes || "",
      });
    } catch (error: any) {
      console.error("Failed to update checklist item:", error);
      // Revert local state on error
      setChecklistItems((items) =>
        items.map((item) =>
          item.TaskChecklistItemId === itemId
            ? { ...item, Completed: !completed }
            : item
        )
      );

      // Show more specific error message
      const errorMessage =
        error.response?.data?.error ||
        "Failed to update checklist item. Please try again.";
      showError(errorMessage);
    }
  };

  const submitTask = async () => {
    try {
      setSubmitting(true);
      const checklistJson = checklistItems.reduce((acc, item) => {
        acc[item.TaskChecklistItemId] = {
          completed: item.Completed,
          notes: item.Notes || "",
        };
        return acc;
      }, {} as Record<string, any>);

      await api.post(`/tasks/submit`, {
        taskId: taskId,
        checklistJson: checklistJson,
        notes: reviewReason,
      });

      // Refresh task data to show updated status
      window.location.reload();
    } catch (error) {
      console.error("Failed to submit task:", error);
      showError("Failed to submit task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const approveTask = async () => {
    try {
      setSubmitting(true);
      await api.post(`/tasks/approve`, {
        taskId: taskId,
      });

      // Refresh task data to show updated status
      window.location.reload();
    } catch (error) {
      console.error("Failed to approve task:", error);
      showError("Failed to approve task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const rejectTask = async () => {
    if (!reviewReason.trim()) {
      showWarning("Please provide a reason for rejection.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/tasks/reject`, {
        taskId: taskId,
        reason: reviewReason,
      });

      // Refresh task data to show updated status
      window.location.reload();
    } catch (error) {
      console.error("Failed to reject task:", error);
      showError("Failed to reject task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const forwardTask = async () => {
    try {
      setSubmitting(true);
      // This would require selecting a target user - for now, let backend handle the logic
      showWarning(
        "Forward functionality requires selecting target user. This will be implemented based on business rules."
      );

      // Example API call (commented out until user selection is implemented):
      // await api.post(`/tasks/${taskId}/forward`, {
      //   toUserId: selectedUserId,
      //   notes: "Task forwarded"
      // })
    } catch (error) {
      console.error("Failed to forward task:", error);
      showError("Failed to forward task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeadlineReached = async () => {
    if (task?.AutoForward) {
      try {
        // Use auto-forward endpoint that preserves checklist state
        await api.post(`/tasks/${taskId}/auto-forward`);
        window.location.reload();
      } catch (error) {
        console.error("Failed to auto-forward task:", error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "submitted":
        return "secondary";
      case "in_progress":
        return "outline";
      case "assigned":
        return "outline";
      case "rejected":
        return "destructive";
      case "expired":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Check if current user can approve this task
  const canApproveTask = () => {
    if (!currentUser || !task) return false;

    // Rule 1: Users assigned to the task cannot approve it
    const isAssigned = assignees.some(
      (assignee) => assignee.email === currentUser.email
    );
    if (isAssigned) return false;

    // Rule 2: Only supervisors (branch managers, area managers, auditors, management) can approve
    const approverRoles = [
      "branch_manager",
      "area_manager",
      "auditor",
      "management",
    ];
    if (!approverRoles.includes(currentUser.role)) return false;

    // Rule 3: Task must be submitted to be approved
    if (task.Status !== "submitted") return false;

    return true;
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffHours = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    // Don't show overdue if task is completed, submitted, or approved
    if (
      task?.Status === "completed" ||
      task?.Status === "submitted" ||
      task?.Status === "approved"
    ) {
      return { text: `Task ${task.Status}`, color: "text-green-600" };
    }

    if (diffHours < 0) {
      if (task?.AutoForward) {
        handleDeadlineReached();
      }
      return {
        text: `Overdue by ${Math.abs(diffHours)}h${
          task?.AutoForward ? " - Auto-forwarded" : ""
        }`,
        color: "text-red-600",
      };
    } else if (diffHours < 24) {
      return { text: `${diffHours}h remaining`, color: "text-amber-600" };
    } else {
      return {
        text: `${Math.ceil(diffHours / 24)}d remaining`,
        color: "text-green-600",
      };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading task details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex justify-center items-center h-64">
        Task not found
      </div>
    );
  }

  const deadlineInfo = formatDeadline(task.Deadline);
  const completedItems = checklistItems.filter((item) => item.Completed).length;
  const progressPercentage =
    checklistItems.length > 0
      ? (completedItems / checklistItems.length) * 100
      : 0;

  // Check if task is locked (cannot modify checklist)
  const now = new Date();
  const deadline = new Date(task.Deadline);
  const isExpired = now > deadline;
  const isLocked =
    task.Status === "submitted" || task.Status === "approved" || isExpired;

  // Check if current user is assigned to this task (only assignees can edit checklist)
  const canEditChecklist =
    assignees.some((assignee) => assignee.email === currentUser?.email) &&
    !isLocked;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tasks">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{task.Title}</h1>
          <p className="text-muted-foreground">{task.Description}</p>
        </div>
      </div>

      {/* Task Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={getStatusColor(task.Status)} className="text-sm">
                {task.Status.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {task.Scope}
              </Badge>
              <Badge
                variant={task.Priority === "high" ? "destructive" : "secondary"}
                className="text-sm"
              >
                {task.Priority} priority
              </Badge>
              {task.AutoForward && (
                <Badge
                  variant="secondary"
                  className="text-sm bg-blue-100 text-blue-800"
                >
                  Auto-Forward
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {(task.Status === "in_progress" || task.Status === "Pending") && (
                <>
                  <Button
                    variant="outline"
                    onClick={forwardTask}
                    disabled={submitting}
                  >
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Forward Now
                  </Button>
                  <Button onClick={submitTask} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit for Review"}
                  </Button>
                </>
              )}
              {task.Status === "submitted" && canApproveTask() && (
                <>
                  <Button
                    variant="outline"
                    onClick={rejectTask}
                    disabled={submitting || !reviewReason.trim()}
                  >
                    {submitting ? "Rejecting..." : "Reject"}
                  </Button>
                  <Button onClick={approveTask} disabled={submitting}>
                    {submitting ? "Approving..." : "Approve"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Deadline</p>
                <p className={`text-sm ${deadlineInfo.color}`}>
                  {deadlineInfo.text}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Branch</p>
                <p className="text-sm text-muted-foreground">
                  {Array.isArray(task.BranchNames) &&
                  task.BranchNames.length > 0
                    ? task.BranchNames.join(", ")
                    : task.BranchNames || task.BranchNames || "Unassigned"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Assignees</p>
                <p className="text-sm text-muted-foreground">
                  {assignees.length > 0
                    ? assignees.map((a) => a.name).join(", ")
                    : "No assignees"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Progress</p>
                <p className="text-sm text-muted-foreground">
                  {completedItems}/{checklistItems.length} (
                  {Math.round(progressPercentage)}%)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="checklist" className="space-y-6">
        <TabsList>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle>Task Checklist</CardTitle>
              <CardDescription>
                Complete all items to finish the task.{" "}
                {task.Status === "expired" &&
                  "This task has expired and is read-only."}
                {!canEditChecklist &&
                  !isLocked &&
                  " Only assigned users can edit the checklist."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {checklistItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    This task has no checklist items. Tasks created without
                    checklist items will show 0/0 progress.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Check the browser console for API debugging information.
                  </p>
                </div>
              ) : (
                checklistItems.map((item, index) => (
                  <div key={item.TaskChecklistItemId} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`item-${item.TaskChecklistItemId}`}
                        checked={item.Completed}
                        onCheckedChange={(checked) =>
                          updateChecklistItem(
                            item.TaskChecklistItemId,
                            checked as boolean,
                            item.Notes
                          )
                        }
                        disabled={!canEditChecklist}
                      />
                      <div className="flex-1 space-y-2">
                        <label
                          htmlFor={`item-${item.TaskChecklistItemId}`}
                          className={`text-sm font-medium cursor-pointer ${
                            item.Completed
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {item.Title}
                        </label>
                        {item.Notes && (
                          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                            <MessageSquare className="h-3 w-3 inline mr-1" />
                            {item.Notes}
                          </p>
                        )}
                        <Textarea
                          placeholder="Add notes for this item..."
                          value={item.Notes || ""}
                          onChange={(e) =>
                            updateChecklistItem(
                              item.TaskChecklistItemId,
                              item.Completed,
                              e.target.value
                            )
                          }
                          className="text-sm"
                          rows={2}
                          disabled={!canEditChecklist}
                        />
                      </div>
                    </div>
                    {index < checklistItems.length - 1 && <Separator />}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow">
          <Card>
            <CardHeader>
              <CardTitle>Approval Workflow</CardTitle>
              <CardDescription>
                Track the task progress through the organizational hierarchy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowSteps.map((step, index) => (
                  <div key={step.level} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          step.status === "completed"
                            ? "bg-green-500"
                            : step.status === "current"
                            ? "bg-blue-500"
                            : "bg-gray-300"
                        }`}
                      />
                      {index < workflowSteps.length - 1 && (
                        <div className="w-px h-8 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{step.role}</span>
                        <Badge
                          variant={
                            step.status === "completed"
                              ? "default"
                              : step.status === "current"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {step.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {step.user || "Unassigned"}
                      </p>
                      {step.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          Completed:{" "}
                          {new Date(step.completedAt).toLocaleString()}
                        </p>
                      )}
                      {step.comments && (
                        <p className="text-sm text-muted-foreground mt-1 bg-muted p-2 rounded">
                          {step.comments}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Review & Approval</CardTitle>
              <CardDescription>
                {task.Status === "submitted"
                  ? "This task has been submitted and is awaiting review."
                  : "Task must be submitted before it can be reviewed."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.Status === "submitted" && canApproveTask() ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Review Comments
                    </label>
                    <Textarea
                      placeholder="Add your review comments..."
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={rejectTask}
                      disabled={submitting || !reviewReason.trim()}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      {submitting ? "Rejecting..." : "Reject Task"}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={approveTask}
                      disabled={submitting}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {submitting ? "Approving..." : "Approve Task"}
                    </Button>
                  </div>
                </div>
              ) : task.Status === "submitted" ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    You are not authorized to approve this task. Only
                    supervisors who are not assigned to the task can approve it.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Task must be submitted by assignees before it can be
                    reviewed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Timeline of all actions performed on this task
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLog.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      {index < activityLog.length - 1 && (
                        <div className="w-px h-8 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {activity.action}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          by {activity.user}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                      {activity.details && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
