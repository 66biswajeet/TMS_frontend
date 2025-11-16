"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, CheckCircle, XCircle, Archive } from "lucide-react";
import { api } from "@/lib/axios";
import { format } from "date-fns";

interface HistoryTask {
  TaskId: string;
  Title: string;
  Description: string;
  Scope: string;
  Status: string;
  Deadline: string;
  StartTime?: string;
  EndTime?: string;
  BranchName: string;
  AssignedAt: string;
  CreatedAt: string;
  UpdatedAt: string;
  TaskRelation: string;
  HistoryType: "Completed" | "Expired" | "Overdue";
  ChecklistTotal: number;
  ChecklistCompleted: number;
  ChecklistPercentage: number;
}

export function TaskHistory() {
  const router = useRouter();
  const [tasks, setTasks] = useState<HistoryTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<
    "all" | "completed" | "expired" | "overdue"
  >("all");

  useEffect(() => {
    fetchTaskHistory();
  }, []);

  const fetchTaskHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tasks/history");
      setTasks(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch task history:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.BranchName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === "all" || task.HistoryType.toLowerCase() === filter;

    return matchesSearch && matchesFilter;
  });

  const getHistoryTypeIcon = (type: string) => {
    switch (type) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Expired":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "Overdue":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Archive className="h-4 w-4 text-gray-600" />;
    }
  };

  const getHistoryTypeBadge = (type: string) => {
    switch (type) {
      case "Completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case "Expired":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Expired
          </Badge>
        );
      case "Overdue":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            Overdue
          </Badge>
        );
      default:
        return <Badge variant="secondary">Archived</Badge>;
    }
  };

  const handleTaskClick = (taskId: string) => {
    router.push(`/tasks/${taskId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task History</h1>
          <p className="text-muted-foreground">
            View completed, expired, and overdue tasks
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All ({tasks.length})
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("completed")}
              >
                Completed (
                {tasks.filter((t) => t.HistoryType === "Completed").length})
              </Button>
              <Button
                variant={filter === "expired" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("expired")}
              >
                Expired (
                {tasks.filter((t) => t.HistoryType === "Expired").length})
              </Button>
              <Button
                variant={filter === "overdue" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("overdue")}
              >
                Overdue (
                {tasks.filter((t) => t.HistoryType === "Overdue").length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                No historical tasks found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Complete some tasks to see them here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.TaskId}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleTaskClick(task.TaskId)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getHistoryTypeIcon(task.HistoryType)}
                      <h3 className="font-semibold text-lg">{task.Title}</h3>
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700"
                      >
                        {task.ChecklistCompleted} of {task.ChecklistTotal}{" "}
                        completed
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.Scope}
                      </Badge>
                    </div>

                    {task.Description && (
                      <p className="text-muted-foreground mb-3">
                        {task.Description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Branch:</span>
                        <p className="text-muted-foreground">
                          {task.BranchName || "N/A"}
                        </p>
                      </div>

                      <div>
                        <span className="font-medium">Deadline:</span>
                        <p className="text-muted-foreground">
                          {format(
                            new Date(task.Deadline),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </p>
                      </div>

                      {task.StartTime && task.EndTime && (
                        <div>
                          <span className="font-medium">Time Window:</span>
                          <p className="text-muted-foreground">
                            {format(new Date(task.StartTime), "HH:mm")} -{" "}
                            {format(new Date(task.EndTime), "HH:mm")}
                          </p>
                        </div>
                      )}

                      <div>
                        <span className="font-medium">Progress:</span>
                        <p className="text-muted-foreground">
                          {task.ChecklistCompleted}/{task.ChecklistTotal} items
                          ({task.ChecklistPercentage}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Created:</span>{" "}
                        {format(new Date(task.CreatedAt), "MMM dd, yyyy")}
                      </div>
                      <div>
                        <span className="font-medium">Updated:</span>{" "}
                        {format(new Date(task.UpdatedAt), "MMM dd, yyyy")}
                      </div>
                      <div>
                        <span className="font-medium">Relation:</span>{" "}
                        {task.TaskRelation}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
