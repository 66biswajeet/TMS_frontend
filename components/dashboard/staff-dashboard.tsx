"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";
import {
  UserCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  RefreshCw,
  Download,
  AlertCircle,
  Target,
  Award,
  Activity,
} from "lucide-react";

// Import our reusable components and the type for props
import { KPIGrid, type KPICardProps } from "./kpi-card";
import { HeatTable } from "./heat-table";
import { DrillChart } from "./drill-chart";

interface DashboardKPIs {
  MyTasks: number;
  CompletedTasks: number;
  PendingTasks: number;
  OverdueTasks: number;
  CompletionRate: number;
  OnTimeRate: number;
  AvgChecklistCompletion: number;
  CurrentStreak: number;
  WeeklyTarget: number;
}

interface TaskData {
  TaskId: string;
  Title: string;
  Status: string;
  Priority: string;
  Deadline: string;
  Progress: number;
  ChecklistCompletion: number;
}

export const StaffDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [branchName, setBranchName] = useState<string>("");

  const fetchStaffData = useCallback(async (currentFilters: any = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const selectedBranchId = localStorage.getItem("selectedBranchId");
      const selectedBranchName = localStorage.getItem("selectedBranchName");

      if (selectedBranchName) {
        setBranchName(selectedBranchName);
      }

      if (!selectedBranchId) {
        setError(
          "No branch selected for this session. Please log out and select a branch."
        );
        setIsLoading(false);
        return;
      }

      console.log(
        `🔄 Fetching staff dashboard data for branch: ${selectedBranchId}`
      );

      try {
        const tasksResponse = await api.get(
          `/tasks/my?branchId=${selectedBranchId}`
        );
        const tasksData = tasksResponse.data;
        console.log("✅ Real staff tasks from TMS:", tasksData);

        const userTasks = tasksData.items || [];

        const completedTasks = userTasks.filter(
          (t: any) => t.Status === "Completed" || t.Status === "Approved"
        ).length;
        const pendingTasks = userTasks.filter((t: any) =>
          ["Pending", "In Progress", "Submitted"].includes(t.Status)
        ).length;
        const overdueTasks = userTasks.filter(
          (t: any) =>
            new Date(t.Deadline) < new Date() &&
            !["Completed", "Approved"].includes(t.Status)
        ).length;
        const totalTasks = userTasks.length;
        const completionRate =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        setKpis({
          MyTasks: totalTasks,
          CompletedTasks: completedTasks,
          PendingTasks: pendingTasks,
          OverdueTasks: overdueTasks,
          CompletionRate: completionRate,
          OnTimeRate: completionRate,
          AvgChecklistCompletion: completionRate,
          CurrentStreak: 5,
          WeeklyTarget: 20,
        });
        setTasks(
          userTasks.slice(0, 10).map((task: any) => ({
            TaskId: task.TaskId,
            Title: task.Title,
            Status: task.Status,
            Priority: task.Priority || "medium",
            Deadline: new Date(task.Deadline).toLocaleDateString(),
            Progress: task.ChecklistPercentage || 0,
            ChecklistCompletion: task.ChecklistPercentage || 0,
          }))
        );
      } catch (taskError) {
        console.error(
          "⚠️ Staff tasks API failed, using fallback demo data:",
          taskError
        );
        setError(
          "Could not connect to the server to fetch tasks. Showing demo data instead."
        );
        setKpis({
          MyTasks: 18,
          CompletedTasks: 15,
          PendingTasks: 2,
          OverdueTasks: 1,
          CompletionRate: 83,
          OnTimeRate: 81,
          AvgChecklistCompletion: 88,
          CurrentStreak: 5,
          WeeklyTarget: 20,
        });
        setTasks([
          {
            TaskId: "1",
            Title: "Daily Inventory Check (Demo)",
            Status: "completed",
            Priority: "high",
            Deadline: "2024-01-15",
            Progress: 100,
            ChecklistCompletion: 95,
          },
          {
            TaskId: "2",
            Title: "Customer Service Review (Demo)",
            Status: "in_progress",
            Priority: "medium",
            Deadline: "2024-01-16",
            Progress: 75,
            ChecklistCompletion: 80,
          },
        ]);
      }
      setChartData([
        { name: "Mon", completed: 4, pending: 1, overdue: 0 },
        { name: "Tue", completed: 3, pending: 2, overdue: 0 },
        { name: "Wed", completed: 5, pending: 1, overdue: 1 },
        { name: "Thu", completed: 3, pending: 1, overdue: 0 },
        { name: "Fri", completed: 4, pending: 2, overdue: 0 },
        { name: "Sat", completed: 2, pending: 1, overdue: 0 },
        { name: "Sun", completed: 1, pending: 1, overdue: 0 },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      console.error("Staff dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    fetchStaffData(newFilters);
  };

  const handleExport = async () => {
    const csvData = [
      "Task,Status,Priority,Deadline,Progress,Checklist Completion",
      ...tasks.map(
        (task) =>
          `"${task.Title}","${task.Status}","${task.Priority}","${task.Deadline}",${task.Progress}%,${task.ChecklistCompletion}%`
      ),
    ].join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-performance-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchStaffData();
  }, [fetchStaffData]);

  const kpiCards: KPICardProps[] = kpis
    ? [
        {
          title: "My Tasks",
          value: kpis.MyTasks,
          description: "Total assigned tasks",
          icon: FileText,
        },
        {
          title: "Completion Rate",
          value: kpis.CompletionRate,
          format: "percentage",
          description: "Personal completion rate",
          icon: CheckCircle,
          variant:
            kpis.CompletionRate >= 85
              ? "success"
              : kpis.CompletionRate >= 70
              ? "warning"
              : "destructive",
        },
        {
          title: "Current Streak",
          value: kpis.CurrentStreak,
          description: "Days with completed tasks",
          icon: Award,
          variant: kpis.CurrentStreak >= 5 ? "success" : "default",
        },
        {
          title: "Overdue Tasks",
          value: kpis.OverdueTasks,
          description: "Tasks past deadline",
          icon: AlertTriangle,
          variant:
            kpis.OverdueTasks === 0
              ? "success"
              : kpis.OverdueTasks <= 2
              ? "warning"
              : "destructive",
        },
      ]
    : [];

  const taskColumns = [
    { key: "Title", label: "Task", type: "text" as const, sortable: true },
    { key: "Status", label: "Status", type: "badge" as const, sortable: true },
    {
      key: "Priority",
      label: "Priority",
      type: "badge" as const,
      sortable: true,
    },
    {
      key: "Progress",
      label: "Progress %",
      type: "heat" as const,
      sortable: true,
    },
    {
      key: "ChecklistCompletion",
      label: "Checklist %",
      type: "heat" as const,
      sortable: true,
    },
    {
      key: "Deadline",
      label: "Deadline",
      type: "text" as const,
      sortable: true,
    },
  ];

  if (isLoading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="space-y-6 p-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <UserCheck className="h-8 w-8 text-blue-600" />
            My Performance Dashboard
          </h1>
          <p className="text-muted-foreground">
            Showing tasks for branch:{" "}
            <span className="font-semibold text-primary">
              {branchName || "..."}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchStaffData(filters)}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export My Data
          </Button>
        </div>
      </div>

      <KPIGrid kpis={kpiCards} className="mb-6" />

      {kpis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Weekly Progress
            </CardTitle>
            <CardDescription>
              Track your progress towards weekly targets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Weekly Target Progress
                </span>
                <span className="text-sm text-muted-foreground">
                  {kpis.CompletedTasks} / {kpis.WeeklyTarget} tasks
                </span>
              </div>
              <Progress
                value={(kpis.CompletedTasks / kpis.WeeklyTarget) * 100}
                className="h-3"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="space-y-6">
          <HeatTable
            title="My Task List"
            description="All tasks assigned to you with progress tracking"
            data={tasks}
            columns={taskColumns}
            exportable={true}
          />
        </TabsContent>
        <TabsContent value="overview">
          <DrillChart
            title="Daily Task Completion"
            description="Your task completion pattern over the week"
            data={chartData}
            type="line"
            xAxisKey="name"
            yAxisKeys={["completed", "pending", "overdue"]}
            height={300}
            exportable={true}
          />
        </TabsContent>
        <TabsContent value="performance">
          <DrillChart
            title="Task Status Distribution"
            data={[
              { name: "Completed", value: kpis?.CompletedTasks || 15 },
              { name: "Pending", value: kpis?.PendingTasks || 3 },
              { name: "Overdue", value: kpis?.OverdueTasks || 1 },
            ]}
            type="pie"
            yAxisKeys={["value"]}
            height={350}
            exportable={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
