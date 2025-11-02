//-- Changes to show on github to see the diff --//
"use client";
import { useState, useEffect, useRef } from "react";
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
  ActivityId: number;
  Action: string;
  UserName: string;
  Timestamp: string;
  Details?: string;
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

// Type definition for the component's props
interface ChecklistItemComponentProps {
  item: ChecklistItem;
  canEdit: boolean;
  onUpdate: (itemId: string, completed: boolean, notes?: string) => void;
}

interface ChecklistPhoto {
  PhotoId: string;
  PhotoUrl: string;
  UploadedAt: string;
  UploadedByName?: string;
}

interface ChecklistItem {
  TaskChecklistItemId: string;
  Title: string;
  Completed: boolean;
  Notes?: string;
  SortOrder: number;
  Photos?: ChecklistPhoto[]; // ✅ Add this line
}

// The new component for rendering a single checklist item
const ChecklistItemComponent = ({
  item,
  canEdit,
  onUpdate,
}: ChecklistItemComponentProps) => {
  // 1. Use local state to manage the notes for this specific item
  const [notes, setNotes] = useState(item.Notes || "");

  // 2. This function saves the notes when the user clicks away from the textarea
  const handleSaveNotes = () => {
    // Only call the API if the notes have actually changed
    if (notes !== (item.Notes || "")) {
      onUpdate(item.TaskChecklistItemId, item.Completed, notes);
    }
  };

  // 3. This function updates the checkbox status immediately
  const handleCheckedChange = (checked: boolean) => {
    onUpdate(item.TaskChecklistItemId, checked, item.Notes);
  };

  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={`item-${item.TaskChecklistItemId}`}
        checked={item.Completed}
        onCheckedChange={handleCheckedChange}
        disabled={!canEdit}
      />
      <div className="flex-1 space-y-2">
        <label
          htmlFor={`item-${item.TaskChecklistItemId}`}
          className={`text-sm font-medium cursor-pointer ${
            item.Completed ? "line-through text-muted-foreground" : ""
          }`}
        >
          {item.Title}
        </label>
        <Textarea
          placeholder="Add notes for this item..."
          value={notes}
          // The onChange handler now ONLY updates local state. No API call here.
          onChange={(e) => setNotes(e.target.value)}
          // The onBlur handler calls the API to save the data.
          onBlur={handleSaveNotes}
          className="text-sm"
          rows={2}
          disabled={!canEdit}
        />
      </div>
    </div>
  );
};

export function TaskDetails({ taskId }: TaskDetailsProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const hasAutoSubmittedRef = useRef(false);
  const [recurrence, setRecurrence] = useState<{
    isDaily: boolean;
    totalDays: number;
    daysCompleted: number;
  } | null>(null);

  //-- Placeholder for selected user to forward task to --
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
        // const checklistResponse = await api.get(`/tasks/${taskId}/checklist`);
        // console.log("Checklist response:", checklistResponse.data);
        // console.log("Checklist items:", checklistResponse.data.items);

        const checklistUrl = selectedDate
          ? `/tasks/${taskId}/checklist?date=${selectedDate}`
          : `/tasks/${taskId}/checklist`;

        const checklistResponse = await api.get(checklistUrl);

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
  }, [taskId, selectedDate]);

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
        date: selectedDate || undefined,
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

  //--function to add photo to checklist item
  const uploadCompletionPhoto = async (itemId: string, file: File) => {
    const form = new FormData();
    form.append("photo", file);
    const r = await api.post(
      `/tasks/${taskId}/checklist/${itemId}/photo`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return r.data.photoUrl as string;
  };

  const handleAddChecklistItem = async () => {
    try {
      const token = localStorage.getItem("token"); // Or however you're storing it

      const response = await api.post(
        `/tasks/${taskId}/checklist`,
        {
          title: newItemTitle,
          description: "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      showSuccess(response.data.message);
      setNewItemTitle("");

      // Refresh checklist
      const checklistResponse = await api.get(`/tasks/${taskId}/checklist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChecklistItems(checklistResponse.data.items || []);
    } catch (error) {
      console.error("Failed to add checklist item:", error);
      showError("Failed to add checklist item. Please try again.");
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
      await api.post(`/tasks/${taskId}/forward`, {
        toUserId: "B864DE36-5234-4A64-B5C5-7D85E1CBB50C",
        notes: "Task forwarded",
      });
    } catch (error) {
      console.error("Failed to forward task:", error);
      showError("Failed to forward task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ... (Lines 348-429: submitTask, approveTask, rejectTask, forwardTask definitions)

  // ----------------------------------------------------
  // ✅ NEW useEffect for Auto-Submission 10 Seconds BEFORE Deadline
  // ----------------------------------------------------
  // ----------------------------------------------------
  // ✅ NEW useEffect for Auto-Submission 10 Seconds BEFORE Deadline
  // ----------------------------------------------------
  useEffect(() => {
    // 1. **CRITICAL CHECK**: Exit immediately if auto-submission has already run
    if (hasAutoSubmittedRef.current) {
      return;
    }

    // Only auto-submit if we have a task and it's not already submitted/approved/rejected/expired
    if (
      !task ||
      task.Status === "submitted" ||
      task.Status === "approved" ||
      task.Status === "rejected" ||
      task.Status === "expired"
    ) {
      return;
    }

    const deadlineDate = new Date(task.Deadline);
    const now = new Date();
    const timeRemaining = deadlineDate.getTime() - now.getTime();

    // Set a buffer of 10 seconds (10000 milliseconds)
    const SUBMIT_BUFFER_MS = 10000;

    // Calculate the delay until 10 seconds *before* the deadline
    const delayBeforeDeadline = timeRemaining - SUBMIT_BUFFER_MS;

    let timerId: NodeJS.Timeout | null = null;

    const triggerSubmit = () => {
      // 2. Set the flag *before* calling submitTask
      hasAutoSubmittedRef.current = true;
      console.log(`[Auto-Submit] Task ${taskId}: Triggering submitTask...`);
      // Call the existing function to submit the task
      submitTask();
    };

    // 1. If the submission window is in the future (i.e., more than 10 seconds remaining)
    if (delayBeforeDeadline > 1000) {
      // Check if we have at least 1 second for the timer itself
      timerId = setTimeout(() => {
        console.log(
          `[Auto-Submit] Task ${taskId}: 10 seconds before deadline. Triggering submitTask...`
        );
        triggerSubmit();
      }, delayBeforeDeadline);
    }
    // 2. If the current time is inside the 10-second buffer
    //    (i.e., deadline is 10s to 0s away) AND the task is not yet submitted.
    else if (timeRemaining > 0 && timeRemaining <= SUBMIT_BUFFER_MS) {
      console.log(
        `[Auto-Submit] Task ${taskId}: Deadline is imminent (<10s). Submitting immediately.`
      );
      triggerSubmit(); // <-- Use the new function
    }
    // 3. If the deadline has passed (timeRemaining <= 0) and the status is still not final,
    //    submit it immediately. This handles cases where the page was loaded late.
    else if (timeRemaining <= 0 && task.Status !== "submitted") {
      console.log(
        `[Auto-Submit] Task ${taskId}: Deadline has already passed. Submitting immediately.`
      );
      triggerSubmit(); // <-- Use the new function
    }

    // Cleanup function to clear the timer if the component unmounts or task changes
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [taskId, task, submitTask]); // Dependencies

  // const handleDeadlineReached = async () => {
  //   if (task?.AutoForward) {
  //     try {
  //       // Use auto-forward endpoint that preserves checklist state
  //       await api.post(`/tasks/${taskId}/auto-forward`);
  //       window.location.reload();
  //     } catch (error) {
  //       console.error("Failed to auto-forward task:", error);
  //     }
  //   }
  // };

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
  // const canApproveTask = () => {
  //   if (!currentUser || !task) return false;

  //   // Rule 1: Users assigned to the task cannot approve it
  //   const isAssigned = assignees.some(
  //     (assignee) => assignee.email === currentUser.email
  //   );
  //   if (isAssigned) return false;

  //   // Rule 2: Only supervisors (branch managers, area managers, auditors, management) can approve
  //   const approverRoles = [
  //     "branch_manager",
  //     "area_manager",
  //     "auditor",
  //     "management",
  //   ];
  //   if (!approverRoles.includes(currentUser.role)) return false;

  //   // Rule 3: Task must be submitted to be approved
  //   if (task.Status !== "submitted") return false;

  //   return true;
  // };

  // Replace your existing canApproveTask function with this one

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
    const isAwaitingReview =
      task.Status === "submitted" || task.Status.startsWith("Pending");
    if (!isAwaitingReview) return false;

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
      // Just show it's overdue. The backend scheduler will handle the submission.
      // When the page reloads, the 'if' block above will catch the new 'submitted' status.
      return {
        text: `Overdue by ${Math.abs(diffHours)}h`,
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
    assignees.some(
      (assignee) =>
        assignee.email === currentUser?.email ||
        currentUser?.role === "management"
    ) && !isLocked;

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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">View Date:</label>
                  <input
                    type="date"
                    value={selectedDate ?? ""}
                    onChange={(e) => setSelectedDate(e.target.value || null)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                </div>

                {recurrence?.isDaily && (
                  <div className="text-sm text-gray-600">
                    Day {recurrence.daysCompleted} of {recurrence.totalDays}
                  </div>
                )}
              </div>

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
                // checklistItems.map((item, index) => (
                //   <div key={item.TaskChecklistItemId} className="space-y-3">
                //     <div className="flex items-start gap-3">
                //       <Checkbox
                //         id={`item-${item.TaskChecklistItemId}`}
                //         checked={item.Completed}
                //         onCheckedChange={(checked) => updateChecklistItem(item.TaskChecklistItemId, checked as boolean, item.Notes)}
                //         disabled={!canEditChecklist}
                //       />
                //       <div className="flex-1 space-y-2">
                //         <label
                //           htmlFor={`item-${item.TaskChecklistItemId}`}
                //           className={`text-sm font-medium cursor-pointer ${
                //             item.Completed ? "line-through text-muted-foreground" : ""
                //           }`}
                //         >
                //           {item.Title}
                //         </label>
                //         {item.Notes && (
                //           <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                //             <MessageSquare className="h-3 w-3 inline mr-1" />
                //             {item.Notes}
                //           </p>
                //         )}
                //         <Textarea
                //           placeholder="Add notes for this item..."
                //           value={item.Notes || ""}
                //           onChange={(e) => updateChecklistItem(item.TaskChecklistItemId, item.Completed, e.target.value)}
                //           className="text-sm"
                //           rows={2}
                //           disabled={!canEditChecklist}
                //         />
                //       </div>
                //     </div>
                //     {index < checklistItems.length - 1 && <Separator />}
                //   </div>
                // ))
                // REPLACE IT WITH THIS
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
                        {/* Display photos if any */}
                        {/* Photo upload section */}
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Add a completion photo (optional)
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment" // ✅ opens phone camera
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const url = await uploadCompletionPhoto(
                                  item.TaskChecklistItemId,
                                  file
                                );
                                setChecklistItems((items) =>
                                  items.map((it) =>
                                    it.TaskChecklistItemId ===
                                    item.TaskChecklistItemId
                                      ? {
                                          ...it,
                                          Photos: [
                                            {
                                              PhotoId: "temp",
                                              PhotoUrl: url,
                                              UploadedAt:
                                                new Date().toISOString(),
                                              UploadedByName: currentUser?.name,
                                            },
                                            ...(it.Photos || []),
                                          ],
                                        }
                                      : it
                                  )
                                );
                                showSuccess("Photo uploaded successfully");
                              } catch (err) {
                                console.error(err);
                                showError("Failed to upload photo");
                              }
                            }}
                          />
                          {item.Photos && item.Photos.length > 0 && (
                            <div className="flex gap-2 flex-wrap pt-2">
                              {item.Photos.slice(0, 3).map((ph) => (
                                <div
                                  key={ph.PhotoId}
                                  className="flex flex-col items-center"
                                >
                                  <img
                                    src={ph.PhotoUrl}
                                    alt="Completion"
                                    className="h-16 w-16 object-cover rounded border"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {ph.UploadedByName || "Uploaded"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {index < checklistItems.length - 1 && <Separator />}
                  </div>
                ))
              )}
              {/* Add new checklist item UI */}
              {canEditChecklist && (
                <div className="space-y-2 pt-4">
                  <Textarea
                    placeholder="New checklist item title..."
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    rows={2}
                  />
                  <Button
                    onClick={handleAddChecklistItem}
                    disabled={!newItemTitle.trim()}
                  >
                    Add Checklist Item
                  </Button>
                </div>
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

        {/* <TabsContent value="review">
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
        </TabsContent> */}

        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Review & Approval</CardTitle>
              <CardDescription>
                Current status and history of task reviews.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                // Find the most recent "approved" or "rejected" action in the log
                const reviewActivity = activityLog.find(
                  (a) =>
                    a.Action === "Task approved" || a.Action === "Task rejected"
                );

                // 1. If task is "approved", "completed", or "rejected"
                //    AND we have a log entry for it, show the final review.
                if (
                  (task.Status === "approved" ||
                    task.Status === "completed" ||
                    task.Status === "rejected") &&
                  reviewActivity
                ) {
                  return (
                    <div className="space-y-4">
                      <h4 className="font-medium">Review Complete</h4>
                      <div className="p-4 bg-muted rounded-md border">
                        <div className="flex justify-between items-center">
                          <span
                            className={`font-semibold ${
                              reviewActivity.Action === "Task approved"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {reviewActivity.Action}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            by {reviewActivity.UserName}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(reviewActivity.Timestamp).toLocaleString()}
                        </p>
                        {reviewActivity.Details &&
                          reviewActivity.Details.trim().length > 0 && (
                            <p className="mt-3 text-sm">
                              {reviewActivity.Details}
                            </p>
                          )}
                      </div>
                    </div>
                  );
                }

                // 2. (FIXED) If task status is "Pending_Role" (e.g., "Pending_Area_Manager")
                //    Show who it is waiting for.
                if (
                  task.Status.startsWith("Pending") &&
                  task.Status.includes("_")
                ) {
                  // This formats "Pending_Area_Manager" into "Area Manager"
                  const awaitingRole = task.Status.split("_")
                    .slice(1)
                    .join(" ");

                  return (
                    <div className="text-center py-8">
                      <p className="font-medium text-lg">Awaiting Review</p>
                      <p className="text-muted-foreground">
                        This task is currently pending review from:{" "}
                        <span className="font-semibold text-primary">
                          {awaitingRole}
                        </span>
                      </p>
                    </div>
                  );
                }

                // 3. If task is "submitted" but not yet pending a specific person
                if (task.Status === "submitted") {
                  return (
                    <div className="text-center py-8">
                      <p className="font-medium text-lg">Submitted</p>
                      <p className="text-muted-foreground">
                        The task has been submitted and is processing for
                        review.
                      </p>
                    </div>
                  );
                }

                // 4. Default case (e.g., "in_progress", or "Pending")
                //    This will now correctly catch the "Pending" status
                return (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Task must be submitted by assignees before it can be
                      reviewed.
                    </p>
                  </div>
                );
              })()}
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
                  <div key={activity.ActivityId} className="flex gap-4">
                    {" "}
                    {/* Use ActivityId */}
                    {/* ... icon ... */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {activity.Action} {/* Use Action */}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          by {activity.UserName} {/* Use UserName */}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.Timestamp).toLocaleString()}{" "}
                        {/* Use Timestamp */}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 bg-muted p-2 rounded">
                        {activity.Details} {/* Use Details */}
                      </p>
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
