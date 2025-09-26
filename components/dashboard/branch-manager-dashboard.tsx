"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, FileCheck, AlertTriangle, Users } from "lucide-react"
import { api } from "@/lib/axios"

interface BranchStats {
  complianceRate: number;
  pendingReviews: number;
  overdueTasks: number;
  totalStaff: number;
  activeTasks: number;
}

interface PendingReview {
  TaskId: string;
  Title: string;
  Assignee: string;
  Submitted: string;
  Priority: string;
}

interface OverdueTask {
  TaskId: string;
  Title: string;
  Assignee: string;
  Deadline: string;
}

interface StaffMember {
  UserId: string;
  FullName: string;
  Email: string;
  Position: string;
  LastLogin: string;
  TaskCompletionRate: number;
}

export function BranchManagerDashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [branchStats, setBranchStats] = useState<BranchStats>({
    complianceRate: 0,
    pendingReviews: 0,
    overdueTasks: 0,
    totalStaff: 0,
    activeTasks: 0,
  })
  
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Ensure client-side hydration
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const handleReviewTask = (taskId: string) => {
    router.push(`/tasks/${taskId}`)
  }
  
  const handleFollowUpTask = (taskId: string) => {
    router.push(`/tasks/${taskId}`)
  }
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch branch metrics
        const metricsResponse = await api.get("/metrics/branch")
        setBranchStats({
          complianceRate: metricsResponse.data.complianceRate || 0,
          pendingReviews: metricsResponse.data.pendingReviews || 0,
          overdueTasks: metricsResponse.data.overdueTasks || 0,
          totalStaff: metricsResponse.data.totalStaff || 0,
          activeTasks: metricsResponse.data.activeTasks || 0,
        })
        
        // Fetch pending reviews
        const reviewsResponse = await api.get("/tasks/pending-reviews")
        const uniqueReviews = (reviewsResponse.data.items || []).filter((review: PendingReview, index: number, array: PendingReview[]) =>
          array.findIndex(r => r.TaskId === review.TaskId) === index
        )
        setPendingReviews(uniqueReviews)
        
        // Fetch overdue tasks
        const overdueResponse = await api.get("/tasks/overdue")
        const uniqueOverdueTasks = (overdueResponse.data.items || []).filter((task: OverdueTask, index: number, array: OverdueTask[]) =>
          array.findIndex(t => t.TaskId === task.TaskId) === index
        )
        setOverdueTasks(uniqueOverdueTasks)
        
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch dashboard data")
        setLoading(false)
        console.error("Error fetching dashboard data:", err)
      }
    }
    
    // Fetch staff data for the branch
    const fetchStaffData = async () => {
      try {
        const response = await api.get("/branches/staff")
        setStaffMembers(response.data.items || [])
      } catch (err) {
        console.error("Error fetching staff data:", err)
      }
    }
    
    fetchDashboardData()
    fetchStaffData()
  }, [])
  
  // Prevent hydration mismatch
  if (!mounted) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }
  
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>
  }
  
  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-600">Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Branch Overview</h1>
        <p className="text-muted-foreground">Monitor your branch performance and team activities</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{branchStats.complianceRate}%</div>
            <Progress value={branchStats.complianceRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">+3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{branchStats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">Tasks awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{branchStats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{branchStats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">{branchStats.activeTasks} active tasks</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-500" />
              Pending Reviews
            </CardTitle>
            <CardDescription>Tasks submitted and awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No pending reviews found</p>
                <p className="text-xs mt-1">Tasks will appear here when staff submit them for approval</p>
              </div>
            ) : (
              pendingReviews.map((review: PendingReview, index: number) => (
                <div key={`review-${review.TaskId}-${index}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex-1" onClick={() => handleReviewTask(review.TaskId)}>
                    <h4 className="font-medium">{review.Title}</h4>
                    <p className="text-sm text-muted-foreground">
                      By {review.Assignee} • {review.Submitted}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        review.Priority === "high"
                          ? "destructive"
                          : review.Priority === "medium"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {review.Priority}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => {
                        console.log('Navigating to task:', review.TaskId);
                        handleReviewTask(review.TaskId);
                      }}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Overdue Tasks
            </CardTitle>
            <CardDescription>Tasks that have exceeded their deadlines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No overdue tasks found</p>
                <p className="text-xs mt-1">Great! All tasks are on track</p>
              </div>
            ) : (
              overdueTasks.map((task: OverdueTask, index: number) => (
                <div
                  key={`overdue-${task.TaskId}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                  onClick={() => handleFollowUpTask(task.TaskId)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-red-800">{task.Title}</h4>
                    <p className="text-sm text-red-600">
                      {task.Assignee} • Due: {new Date(task.Deadline).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Following up on task:', task.TaskId);
                      handleFollowUpTask(task.TaskId);
                    }}
                  >
                    Follow Up
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Breakdown</CardTitle>
          <CardDescription>Detailed view of compliance metrics by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { category: "Safety Protocols", rate: 95, color: "bg-green-500" },
              { category: "Inventory Management", rate: 88, color: "bg-blue-500" },
              { category: "Customer Service", rate: 82, color: "bg-yellow-500" },
              { category: "Documentation", rate: 78, color: "bg-red-500" },
            ].map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.category}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.rate}%` }} />
                  </div>
                  <span className="text-sm font-medium w-12">{item.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Staff Management */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Staff</CardTitle>
          <CardDescription>Manage and monitor your team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staffMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No staff members found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffMembers.map((staff) => (
                  <div key={staff.UserId} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{staff.FullName}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {staff.Position}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          Last login: {new Date(staff.LastLogin).toLocaleDateString()}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {staff.TaskCompletionRate}%
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View Profile
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
