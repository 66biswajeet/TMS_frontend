"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, Building, CheckCircle, Clock, TrendingUp } from "lucide-react"
import { api } from "@/lib/axios"

interface PerformanceData {
  employeeId: string
  name: string
  position: string
  branch: string
  tasksCompleted: number
  tasksTotal: number
  onTimeCompletion: number
  averageScore: number
  status: "excellent" | "good" | "needs_improvement"
}

interface BranchPerformance {
  branchId: string
  name: string
  totalTasks: number
  completedTasks: number
  onTimeRate: number
  complianceScore: number
  staffCount: number
}

export function PerformanceOverview({ userRole }: { userRole: string }) {
  const [employeePerformance, setEmployeePerformance] = useState<PerformanceData[]>([])
  const [branchPerformance, setBranchPerformance] = useState<BranchPerformance[]>([])
  const [summaryData, setSummaryData] = useState({
    totalEmployees: 0,
    taskCompletion: 0,
    onTimeRate: 0,
    complianceScore: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        // Fetch employee performance
        const employeeResponse = await api.get("/performance/employees")
        setEmployeePerformance(employeeResponse.data.items || [])
        
        // Fetch branch performance
        const branchResponse = await api.get("/performance/branches")
        setBranchPerformance(branchResponse.data.items || [])
        
        // Fetch summary data
        const summaryResponse = await api.get("/performance/summary")
        setSummaryData({
          totalEmployees: summaryResponse.data.totalEmployees || 0,
          taskCompletion: summaryResponse.data.taskCompletion || 0,
          onTimeRate: summaryResponse.data.onTimeRate || 0,
          complianceScore: summaryResponse.data.complianceScore || 0,
        })
        
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch performance data")
        setLoading(false)
        console.error("Error fetching performance data:", err)
      }
    }
    
    fetchPerformanceData()
  }, [])
  
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading performance data...</div>
  }
  
  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-600">Error: {error}</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800"
      case "good":
        return "bg-blue-100 text-blue-800"
      case "needs_improvement":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Performance Overview</h2>
        <p className="text-muted-foreground">Monitor employee and branch performance across your organization</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{summaryData.totalEmployees}</p>
                <p className="text-sm text-muted-foreground">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{summaryData.taskCompletion}%</p>
                <p className="text-sm text-muted-foreground">Task Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{summaryData.onTimeRate}%</p>
                <p className="text-sm text-muted-foreground">On-Time Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{summaryData.complianceScore}%</p>
                <p className="text-sm text-muted-foreground">Compliance Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Performance</CardTitle>
          <CardDescription>Individual performance metrics for staff members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employeePerformance.map((employee) => (
              <div key={employee.employeeId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.position} • {employee.branch}
                    </p>
                  </div>
                  <Badge className={getStatusColor(employee.status)}>{employee.status.replace("_", " ")}</Badge>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {employee.tasksCompleted}/{employee.tasksTotal}
                    </p>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{employee.onTimeCompletion}%</p>
                    <p className="text-xs text-muted-foreground">On-Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{employee.averageScore}/5</p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                  <div className="w-24">
                    <Progress value={(employee.tasksCompleted / employee.tasksTotal) * 100} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Branch Performance */}
      {(userRole === "area_manager" || userRole === "auditor" || userRole === "management") && (
        <Card>
          <CardHeader>
            <CardTitle>Branch Performance</CardTitle>
            <CardDescription>Performance metrics across different branches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {branchPerformance.map((branch) => (
                <div key={branch.branchId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Building className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{branch.name}</p>
                      <p className="text-sm text-muted-foreground">{branch.staffCount} staff members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {branch.completedTasks}/{branch.totalTasks}
                      </p>
                      <p className="text-xs text-muted-foreground">Tasks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{branch.onTimeRate}%</p>
                      <p className="text-xs text-muted-foreground">On-Time</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${getComplianceColor(branch.complianceScore)}`}>
                        {branch.complianceScore}%
                      </p>
                      <p className="text-xs text-muted-foreground">Compliance</p>
                    </div>
                    <div className="w-24">
                      <Progress value={(branch.completedTasks / branch.totalTasks) * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
