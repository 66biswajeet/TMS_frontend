"use client";

import { useState, useEffect } from "react";
import { formatTimeRemaining } from "@/lib/time-utils";
import { useDispatch, useSelector } from "react-redux";
import dynamic from "next/dynamic";
import type { RootState } from "@/redux/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Users,
  Building,
  UserCheck,
  Shield,
  Crown,
} from "lucide-react";
import Link from "next/link";
import {
  fetchMyTasks,
  fetchWorkflowTasks,
  updateTaskStatus,
  forwardTask,
} from "@/redux/modules/tasks/actions";
import { fetchBranches } from "@/redux/modules/branches/actions";

interface Task {
  TaskId: string;
  Title: string;
  Description: string;
  Scope: string;
  Status: string;
  Deadline: string;
  BranchName: string;
  Priority: string;
  CreatedAt: string;
  AssignedAt: string;
  TaskRelation?: string; // "Assigned to me" | "Created by me"
  AssigneeNames?: string; // Legacy field for backward compatibility
  AssigneeName?: string; // New field from backend
  AssigneeBranch?: string; // New field from backend
  ChecklistTotal: number;
  ChecklistCompleted: number;
  ChecklistPercentage: number;
}

function ClientOnlyTaskList() {
  const dispatch = useDispatch();
  const {
    items: tasks,
    loading,
    error,
    workflowTasks,
    workflowLoading,
    updating,
  } = useSelector((state: RootState) => state.tasks);
  const { items: branches } = useSelector((state: RootState) => state.branches);
  const { user } = useSelector((state: RootState) => state.auth);

  // before using user.userId / user.branchId normalize:
  const userId = (user as any)?.userId ?? (user as any)?.id ?? null;
  const branchId =
    (user as any)?.branchId ??
    (user as any)?.BranchId ??
    (user as any)?.branchId ??
    null;

  // use userId/branchId safely:
  useEffect(() => {
    dispatch(fetchMyTasks() as any); // if your action expects a param
    dispatch(fetchBranches() as any);
    if (user?.role) {
      dispatch(fetchWorkflowTasks(user.role, branchId) as any);
    }
  }, [dispatch, user, userId, branchId]);

  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [activeTab, setActiveTab] = useState<
    "my-tasks" | "workflow" | "hierarchy"
  >("my-tasks");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");

  const filteredTasks = tasks.filter((task: any) => {
    const matchesSearch =
      task.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.Description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.Status === statusFilter;
    const matchesScope = scopeFilter === "all" || task.Scope === scopeFilter;
    const matchesBranch =
      branchFilter === "all" || task.BranchName === branchFilter;

    return matchesSearch && matchesStatus && matchesScope && matchesBranch;
  });

  const getStatusColor = (status: string, checklistPercentage?: number) => {
    // First check if task is partially complete
    if (
      status.toLowerCase() !== "completed" &&
      checklistPercentage &&
      checklistPercentage > 0
    ) {
      return "warning"; // Add this variant to your Badge component
    }

    switch (status.toLowerCase()) {
      case "completed":
        return "default";
      case "approved":
        return "default";
      case "submitted":
        return "secondary";
      case "in_progress":
        return "outline";
      case "pending":
        return "outline";
      case "assigned":
        return "outline";
      case "rejected":
        return "destructive";
      case "expired":
        return "destructive";
      case "partial":
        return "warning";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string, checklistPercentage?: number) => {
    // First check if task is partially complete
    if (
      status.toLowerCase() !== "completed" &&
      checklistPercentage &&
      checklistPercentage > 0
    ) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }

    switch (status.toLowerCase()) {
      case "completed":
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "expired":
      case "rejected":
        return <AlertTriangle className="h-4 w-4" />;
      case "in_progress":
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "partial":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case "management":
        return <Crown className="h-4 w-4" />;
      case "auditor":
        return <Shield className="h-4 w-4" />;
      case "area_manager":
        return <Users className="h-4 w-4" />;
      case "branch_manager":
        return <Building className="h-4 w-4" />;
      case "staff":
        return <UserCheck className="h-4 w-4" />;
      default:
        return <UserCheck className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    if (updating) return;
    await dispatch(updateTaskStatus(taskId, newStatus) as any);
  };

  const formatDeadline = (deadline: string, status: string) => {
    try {
      return formatTimeRemaining(deadline, status).text;
    } catch (error) {
      return "Date error";
    }
  };

  const renderTaskCard = (task: any) => (
    <Card
      key={task.TaskId}
      className="hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group cursor-pointer border-border/50 hover:border-primary/20"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 group-hover:translate-x-1 transition-transform duration-200">
            <CardTitle className="text-lg group-hover:text-primary transition-colors duration-200">
              {task.Title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <CardDescription>{task.BranchName}</CardDescription>
              {task.TaskRelation && (
                <Badge
                  variant={
                    task.TaskRelation === "Created by me"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-xs"
                >
                  {task.TaskRelation === "Created by me"
                    ? "My Task"
                    : "Assigned"}
                </Badge>
              )}
            </div>

            {/* Assignee Info */}
            {((task.AssigneeName && task.AssigneeName !== "Unassigned") ||
              (task.AssigneeNames && task.AssigneeNames !== "Unassigned")) && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {task.AssigneeName || task.AssigneeNames}
                </span>
              </div>
            )}

            {/* Checklist Progress */}
            <div className="flex items-center gap-2 mt-2 p-2 rounded">
              <div
                className={`w-full ${
                  task.ChecklistPercentage === 100
                    ? "bg-green-50"
                    : task.ChecklistPercentage > 0
                    ? "bg-yellow-50"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      className={`h-4 w-4 ${
                        task.ChecklistPercentage === 100
                          ? "text-green-600"
                          : task.ChecklistPercentage > 0
                          ? "text-yellow-600"
                          : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        task.ChecklistPercentage === 100
                          ? "text-green-800"
                          : task.ChecklistPercentage > 0
                          ? "text-yellow-800"
                          : "text-gray-600"
                      }`}
                    >
                      {task.ChecklistCompleted || 0} of{" "}
                      {task.ChecklistTotal || 0} (
                      {task.ChecklistPercentage || 0}%)
                    </span>
                  </div>
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        task.ChecklistPercentage === 100
                          ? "bg-green-600"
                          : "bg-yellow-500"
                      }`}
                      style={{ width: `${task.ChecklistPercentage || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Badge
            variant={getStatusColor(task.Status, task.ChecklistPercentage)}
            className="flex items-center gap-1 group-hover:scale-105 transition-transform duration-200"
          >
            {getStatusIcon(task.Status, task.ChecklistPercentage)}
            {task.ChecklistPercentage > 0 && task.ChecklistPercentage < 100
              ? "Partial"
              : task.Status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors duration-200">
          {task.Description}
        </p>

        <div className="flex items-center justify-between text-sm">
          <Badge
            variant="outline"
            className="text-xs group-hover:border-primary/50 transition-colors duration-200"
          >
            {task.Scope}
          </Badge>
          <span
            className={`font-medium transition-colors duration-200 ${
              task.Status === "expired"
                ? "text-red-600 group-hover:text-red-700"
                : "text-muted-foreground group-hover:text-foreground"
            }`}
          >
            {formatDeadline(task.Deadline, task.Status)}
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <Link href={`/tasks/${task.TaskId}`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent hover:bg-primary hover:text-primary-foreground hover:border-primary"
            >
              {task.TaskRelation === "Created by me" &&
              task.Status === "Submitted"
                ? "Review"
                : "Open"}
            </Button>
          </Link>
          {task.TaskRelation === "Assigned to me" &&
            (task.Status === "assigned" ||
              task.Status === "pending" ||
              task.Status === "in_progress") && (
              <Button
                size="sm"
                className="flex-1 hover:shadow-md"
                onClick={() => handleStatusUpdate(task.TaskId, "completed")}
                disabled={updating}
              >
                Complete
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );

  const renderTaskTable = (taskList: any[]) => (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left p-4 font-medium">Title</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Branch</th>
                <th className="text-left p-4 font-medium">Deadline</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {taskList.map((task: any) => (
                <tr
                  key={task.TaskId}
                  className="border-b hover:bg-muted/50 hover:shadow-sm transition-all duration-200 group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="group-hover:translate-x-1 transition-transform duration-200">
                      <div className="font-medium group-hover:text-primary transition-colors duration-200">
                        {task.Title}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{task.Scope}</span>
                        {task.TaskRelation && (
                          <Badge
                            variant={
                              task.TaskRelation === "Created by me"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {task.TaskRelation === "Created by me"
                              ? "My Task"
                              : "Assigned"}
                          </Badge>
                        )}
                      </div>
                      {/* Assignee Info */}
                      {((task.AssigneeName &&
                        task.AssigneeName !== "Unassigned") ||
                        (task.AssigneeNames &&
                          task.AssigneeNames !== "Unassigned")) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Users className="h-3 w-3" />
                          <span>{task.AssigneeName || task.AssigneeNames}</span>
                        </div>
                      )}
                      {/* Checklist Progress */}
                      {(task.ChecklistTotal > 0 ||
                        task.ChecklistCompleted > 0) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>
                            {task.ChecklistCompleted || 0}/
                            {task.ChecklistTotal || 0} (
                            {task.ChecklistPercentage || 0}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={getStatusColor(
                        task.Status,
                        task.ChecklistPercentage
                      )}
                      className="flex items-center gap-1 w-fit group-hover:scale-105 transition-transform duration-200"
                    >
                      {getStatusIcon(task.Status, task.ChecklistPercentage)}
                      {task.ChecklistPercentage > 0 &&
                      task.ChecklistPercentage < 100
                        ? "Partial"
                        : task.Status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm group-hover:text-foreground transition-colors duration-200">
                    {task.BranchName}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-sm transition-colors duration-200 ${
                        task.Status === "expired"
                          ? "text-red-600 font-medium group-hover:text-red-700"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {formatDeadline(task.Deadline, task.Status)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                      <Link href={`/tasks/${task.TaskId}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-primary hover:text-primary-foreground hover:border-primary bg-transparent"
                        >
                          Open
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading tasks...
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track all pharmacy tasks
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/tasks/history">
            <Button variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Task History
            </Button>
          </Link>
          {user?.role !== "staff" && (
            <Link href="/tasks/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={scopeFilter} onValueChange={setScopeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scopes</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch: any) => (
                  <SelectItem key={branch.BranchId} value={branch.BranchName}>
                    {branch.BranchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                size="icon"
                onClick={() => {
                  console.log("Switching to card view");
                  setViewMode("card");
                }}
                title="Card View"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon"
                onClick={() => {
                  console.log("Switching to table view");
                  setViewMode("table");
                }}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "my-tasks" | "workflow" | "hierarchy")
        }
      >
        <TabsList
          className={`grid ${
            user?.role === "staff" ? "w-fit grid-cols-2" : "w-full grid-cols-3"
          }`}
        >
          <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
          {user?.role !== "staff" && (
            <TabsTrigger value="workflow">
              Staff Tasks (Created by Me)
            </TabsTrigger>
          )}
          <TabsTrigger value="hierarchy">Hierarchy View</TabsTrigger>
        </TabsList>

        <TabsContent value="my-tasks">
          {viewMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks
                .filter((task: any) => task.TaskRelation === "Assigned to me")
                .map(renderTaskCard)}
            </div>
          ) : (
            renderTaskTable(
              filteredTasks.filter(
                (task: any) => task.TaskRelation === "Assigned to me"
              )
            )
          )}

          {filteredTasks.filter(
            (task: any) => task.TaskRelation === "Assigned to me"
          ).length === 0 && (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No tasks assigned to you</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your assigned tasks will appear here
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflow">
          {viewMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks
                .filter((task: any) => task.TaskRelation === "Created by me")
                .map((task: any) => (
                  <Card
                    key={task.TaskId}
                    className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {task.Title}
                          </CardTitle>
                          <CardDescription>{task.BranchName}</CardDescription>
                        </div>
                        <Badge
                          variant={getStatusColor(
                            task.Status,
                            task.ChecklistPercentage
                          )}
                          className="flex items-center gap-1 group-hover:scale-105 transition-transform"
                        >
                          {getStatusIcon(task.Status, task.ChecklistPercentage)}
                          {task.ChecklistPercentage > 0 &&
                          task.ChecklistPercentage < 100
                            ? "Partial"
                            : task.Status.replace("_", " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.Description}
                      </p>

                      {/* Assignee Info */}
                      {((task.AssigneeName &&
                        task.AssigneeName !== "Unassigned") ||
                        (task.AssigneeNames &&
                          task.AssigneeNames !== "Unassigned")) && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border-l-2 border-blue-200">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Assigned to:{" "}
                            {task.AssigneeName || task.AssigneeNames}
                          </span>
                        </div>
                      )}

                      {/* Checklist Progress */}
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded border-l-2 border-green-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Progress: {task.ChecklistCompleted || 0} out of{" "}
                            {task.ChecklistTotal || 0} (
                            {task.ChecklistPercentage || 0}%)
                          </span>
                        </div>
                        <div className="w-20 bg-green-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${task.ChecklistPercentage || 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="outline" className="text-xs">
                          {task.Scope}
                        </Badge>
                        <span
                          className={`font-medium ${
                            task.Status === "expired"
                              ? "text-red-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatDeadline(task.Deadline, task.Status)}
                        </span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link href={`/tasks/${task.TaskId}`} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full hover:bg-primary hover:text-primary-foreground"
                          >
                            {task.Status === "submitted"
                              ? "Review & Approve"
                              : "View Details"}
                          </Button>
                        </Link>
                        {task.Status === "submitted" && (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Needs Review
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            renderTaskTable(
              filteredTasks.filter(
                (task: any) => task.TaskRelation === "Created by me"
              )
            )
          )}

          {filteredTasks.filter(
            (task: any) => task.TaskRelation === "Created by me"
          ).length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">
                  No staff tasks created yet
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create tasks to assign to your branch staff
                </p>
                {user?.role !== "staff" && (
                  <Link href="/tasks/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Task
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hierarchy">
          {workflowLoading ? (
            <div className="flex justify-center items-center h-64">
              Loading hierarchy...
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Hierarchy view coming soon
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Organizational hierarchy will be displayed here
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              No tasks found matching your filters.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Create a dynamic component that only renders on client side
const DynamicTaskList = dynamic(
  () => Promise.resolve({ default: ClientOnlyTaskList }),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track all pharmacy tasks
            </p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">Loading tasks...</div>
        </div>
      </div>
    ),
  }
);

export function TaskList() {
  return <DynamicTaskList />;
}
