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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, FileCheck, XCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/axios";

interface PendingReview {
  TaskId: string;
  Title: string;
  Scope: string;
  AssigneeName: string;
  AssigneeRole: string;
  AssigneePosition: string;
  AssigneeBranch: string;
  Deadline: string;
  Priority: string;
  ChecklistTotal: number;
  ChecklistCompleted: number;
  ChecklistPercentage: number;
}

export function ReviewsList() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(
    null
  );
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(
    null
  );
  const [reviewReason, setReviewReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredReviews = reviews.filter((review) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      review.Title.toLowerCase().includes(searchLower) ||
      review.AssigneeName.toLowerCase().includes(searchLower) ||
      review.AssigneeRole?.toLowerCase().includes(searchLower) ||
      review.AssigneePosition?.toLowerCase().includes(searchLower) ||
      review.AssigneeBranch?.toLowerCase().includes(searchLower) ||
      review.Scope?.toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await api.get("/tasks/pending-reviews");
        const uniqueReviews = (response.data.items || []).filter(
          (review: PendingReview, index: number, array: PendingReview[]) =>
            array.findIndex((r) => r.TaskId === review.TaskId) === index
        );
        setReviews(uniqueReviews);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch pending reviews");
        setLoading(false);
        console.error("Error fetching reviews:", err);
      }
    };

    fetchReviews();
  }, []);

  const handleReviewAction = (
    review: PendingReview,
    action: "approve" | "reject"
  ) => {
    setSelectedReview(review);
    setReviewAction(action);
    setReviewReason("");
    setIsDialogOpen(true);
  };

  const submitReview = async () => {
    if (!selectedReview || !reviewAction) return;

    try {
      if (reviewAction === "approve") {
        await api.post("/tasks/approve", { taskId: selectedReview.TaskId });
      } else {
        await api.post("/tasks/reject", {
          taskId: selectedReview.TaskId,
          reason: reviewReason,
        });
      }

      // Remove from pending reviews
      setReviews(
        reviews.filter((review) => review.TaskId !== selectedReview.TaskId)
      );
      setIsDialogOpen(false);
      setSelectedReview(null);
      setReviewAction(null);
      setReviewReason("");
    } catch (err) {
      console.error("Error submitting review:", err);
      import("@/lib/toast").then(({ showError }) => {
        showError("Failed to submit review. Please try again.");
      });
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 1) {
      const diffMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  // const formatTimeDistance = (timestamp: string): string => {
  //   const date = new Date(timestamp);

  //   // Guard clause for invalid timestamps (prevents 'NaN' output)
  //   if (isNaN(date.getTime())) {
  //     return "N/A";
  //   }

  //   const now = new Date();
  //   const diffMilliseconds = now.getTime() - date.getTime();

  //   // Check if the timestamp is in the future (for a deadline)
  //   if (diffMilliseconds < 0) {
  //     // You can return a different format for future dates if needed,
  //     // but for consistency, we'll return a simple N/A or a placeholder.
  //     // Since this function is based on "diffHours", it's best suited for
  //     // past events. Returning the date itself might be better for deadlines.
  //     return "N/A";
  //   }

  //   const diffHours = Math.floor(diffMilliseconds / (1000 * 60 * 60));

  //   if (diffHours < 1) {
  //     const diffMinutes = Math.floor(diffMilliseconds / (1000 * 60));
  //     return `${diffMinutes}m`; // Removed ' ago'
  //   } else if (diffHours < 24) {
  //     return `${diffHours}h`; // Removed ' ago'
  //   } else {
  //     const diffDays = Math.floor(diffHours / 24);
  //     return `${diffDays}d`; // Removed ' ago'
  //   }
  // };

  const formatTimeUntilDeadline = (timestamp: string): string => {
    const deadlineDate = new Date(timestamp);

    // 1. Error Handling
    if (isNaN(deadlineDate.getTime())) {
      return "N/A";
    }

    const now = new Date();
    // Calculate difference: positive if deadline is in the future, negative if past
    const diffMilliseconds = deadlineDate.getTime() - now.getTime();

    let prefix = "Due in";
    let absoluteMilliseconds = diffMilliseconds;

    if (diffMilliseconds < 0) {
      prefix = "Overdue by";
      absoluteMilliseconds = Math.abs(diffMilliseconds);
    }

    const diffHours = Math.floor(absoluteMilliseconds / (1000 * 60 * 60));

    // 2. Format based on time remaining/overdue
    if (absoluteMilliseconds < 60000) {
      // Less than 1 minute
      // Use "Less than 1m" for clarity when very close
      return `${prefix} <1m`;
    } else if (diffHours < 1) {
      const diffMinutes = Math.floor(absoluteMilliseconds / (1000 * 60));
      return `${prefix} ${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${prefix} ${diffHours}h`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${prefix} ${diffDays}d`;
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading reviews...
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
          <h1 className="text-3xl font-bold text-foreground">Reviews</h1>
          <p className="text-muted-foreground">
            Review and approve submitted tasks
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              {filteredReviews.length} pending reviews
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <FileCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {reviews.length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <FileCheck className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {
                reviews.filter((r) => r.Priority?.toLowerCase() === "high")
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Urgent Deadlines
            </CardTitle>
            <FileCheck className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground">Due within 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-muted-foreground">Reviews processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, assignee, role, branch, position, or scope..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
          <CardDescription>
            Tasks submitted and awaiting your review and approval
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Title & Scope</th>
                  <th className="text-left p-4 font-medium">
                    Assignee Details
                  </th>
                  <th className="text-left p-4 font-medium">Deadline</th>
                  <th className="text-left p-4 font-medium">Priority</th>
                  <th className="text-left p-4 font-medium">
                    Checklist Progress
                  </th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review, index) => (
                  <tr
                    key={`review-${review.TaskId}-${index}`}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="p-4">
                      <div className="font-medium">{review.Title}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {review.Scope || "N/A"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="font-medium text-sm">
                          {review.AssigneeName.split(",")[0].trim()}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {/* <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {review.AssigneeRole?.replace("_", " ") || "N/A"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {review.AssigneePosition || "N/A"}
                            </span>
                          </div> */}
                          <span className="text-xs text-muted-foreground">
                            📍 {review.AssigneeBranch || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {formatTimeUntilDeadline(review.Deadline)}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={getPriorityColor(review.Priority)}
                        className="text-xs"
                      >
                        {review.Priority}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {review.ChecklistCompleted}/{review.ChecklistTotal}{" "}
                            completed
                          </span>
                          <Badge
                            variant={
                              review.ChecklistPercentage >= 80
                                ? "default"
                                : review.ChecklistPercentage >= 60
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {review.ChecklistPercentage}%
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              review.ChecklistPercentage >= 80
                                ? "bg-green-500"
                                : review.ChecklistPercentage >= 60
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                review.ChecklistPercentage,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link href={`/tasks/${review.TaskId}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReviewAction(review, "reject")}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReviewAction(review, "approve")}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredReviews.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No pending reviews found matching your filters.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve Task" : "Reject Task"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "Confirm approval of this task. You can add optional comments."
                : "Provide a reason for rejecting this task. This will be sent to the assignees."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReview && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedReview.Title}</h4>
                <p className="text-sm text-muted-foreground">
                  Assignee: {selectedReview.AssigneeName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Deadline {formatTimeUntilDeadline(selectedReview.Deadline)}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="review-reason">
                {reviewAction === "approve"
                  ? "Comments (optional)"
                  : "Rejection Reason *"}
              </Label>
              <Textarea
                id="review-reason"
                placeholder={
                  reviewAction === "approve"
                    ? "Add any comments about this approval..."
                    : "Explain why this task is being rejected..."
                }
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                rows={3}
                required={reviewAction === "reject"}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={submitReview}
                className="flex-1"
                variant={reviewAction === "reject" ? "destructive" : "default"}
                disabled={
                  reviewAction === "reject" && reviewReason.trim() === ""
                }
              >
                {reviewAction === "approve" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Task
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Task
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
