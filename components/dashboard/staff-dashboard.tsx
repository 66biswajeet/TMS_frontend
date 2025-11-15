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
  TrendingUp,
  Clock,
  Zap,
  Calendar,
  BarChart3,
  Trophy,
  Star,
  ArrowUp,
  ArrowDown,
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
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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
        `📄 Fetching staff dashboard data for branch: ${selectedBranchId}`
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
      setLastUpdated(new Date());
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <Activity className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
        {/* Error Alert with Animation */}
        {error && (
          <Alert
            variant="destructive"
            className="mb-4 animate-in slide-in-from-top-2 duration-300 border-l-4"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-semibold">Connection Issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 md:p-8 shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,white)]"></div>
          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                    <UserCheck className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white flex items-center gap-2">
                      My Performance Hub
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                      <p className="text-blue-100 text-sm md:text-base">
                        <span className="font-medium text-white">
                          {branchName || "Loading..."}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-blue-100 text-xs md:text-sm flex items-center gap-2 ml-14">
                  <Clock className="h-3 w-3" />
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => fetchStaffData(filters)}
                  disabled={isLoading}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-200"
                >
                  <RefreshCw
                    className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")}
                  />
                  Refresh
                </Button>
                <Button
                  onClick={handleExport}
                  className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced KPI Grid */}
        <div className="animate-in fade-in-50 duration-500">
          <KPIGrid kpis={kpiCards} className="mb-6" />
        </div>

        {/* Quick Stats Cards Row */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-700">
            {/* Weekly Progress Card */}
            <Card className="overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-950/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-blue-600" />
                    Weekly Target
                  </CardTitle>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Progress
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {Math.round(
                      (kpis.CompletedTasks / kpis.WeeklyTarget) * 100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={(kpis.CompletedTasks / kpis.WeeklyTarget) * 100}
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground">
                  {kpis.CompletedTasks} of {kpis.WeeklyTarget} tasks completed
                </p>
              </CardContent>
            </Card>

            {/* On-Time Performance */}
            <Card className="overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-green-50/50 dark:from-slate-900 dark:to-green-950/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5 text-green-600" />
                    On-Time Rate
                  </CardTitle>
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-green-600">
                    {kpis.OnTimeRate}%
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Tasks delivered
                    </p>
                    <p className="text-xs text-muted-foreground">on schedule</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                    {kpis.OnTimeRate >= 80
                      ? "Excellent performance! 🎉"
                      : "Keep improving!"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Checklist Completion */}
            <Card className="overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-900 dark:to-purple-950/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Avg. Checklist
                  </CardTitle>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Star className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-purple-600">
                    {kpis.AvgChecklistCompletion}%
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Checklist items
                    </p>
                    <p className="text-xs text-muted-foreground">completed</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-purple-700 dark:text-purple-400 font-medium">
                    {kpis.AvgChecklistCompletion >= 85
                      ? "Outstanding thoroughness! ⭐"
                      : "Good attention to detail!"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Tabs Section */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6 animate-in slide-in-from-bottom-6 duration-1000"
        >
          <Card className="border-2">
            <CardContent className="pt-6">
              <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 rounded-lg py-3 transition-all duration-200"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger
                  value="tasks"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 rounded-lg py-3 transition-all duration-200"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">My Tasks</span>
                  <span className="sm:hidden">Tasks</span>
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 rounded-lg py-3 transition-all duration-200"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Performance</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card className="border-2 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Daily Task Completion
                </CardTitle>
                <CardDescription>
                  Your task completion pattern over the week
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <DrillChart
                  title=""
                  description=""
                  data={chartData}
                  type="line"
                  xAxisKey="name"
                  yAxisKeys={["completed", "pending", "overdue"]}
                  height={300}
                  exportable={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6 mt-6">
            <HeatTable
              title="My Task List"
              description="All tasks assigned to you with progress tracking"
              data={tasks}
              columns={taskColumns}
              exportable={true}
            />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6 mt-6">
            <Card className="border-2 hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-purple-600" />
                  Task Status Distribution
                </CardTitle>
                <CardDescription>
                  Visual breakdown of your task portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <DrillChart
                  title=""
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
