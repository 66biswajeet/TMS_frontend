"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Building, TrendingUp, FileCheck, AlertTriangle } from "lucide-react"
import { api } from "@/lib/axios"

interface AreaStats {
  totalBranches: number;
  avgComplianceRate: number;
  pendingReviews: number;
  criticalIssues: number;
}

interface BranchPerformance {
  name: string;
  compliance: number;
  pendingTasks: number;
  status: string;
}

interface CriticalIssue {
  branch: string;
  issue: string;
  severity: string;
  reported: string;
}

interface BranchManager {
  BranchId: string;
  BranchName: string;
  ManagerName: string;
  ManagerEmail: string;
  LastLogin: string;
}

export function AreaManagerDashboard() {
  const [areaStats, setAreaStats] = useState<AreaStats>({
    totalBranches: 0,
    avgComplianceRate: 0,
    pendingReviews: 0,
    criticalIssues: 0,
  })
  
  const [branchPerformance, setBranchPerformance] = useState<BranchPerformance[]>([])
  const [criticalIssues, setCriticalIssues] = useState<CriticalIssue[]>([])
  const [branchManagers, setBranchManagers] = useState<BranchManager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch area metrics
        const metricsResponse = await api.get("/metrics/area")
        setAreaStats({
          totalBranches: metricsResponse.data.totalBranches || 0,
          avgComplianceRate: metricsResponse.data.avgComplianceRate || 0,
          pendingReviews: metricsResponse.data.pendingReviews || 0,
          criticalIssues: metricsResponse.data.criticalIssues || 0,
        })
        
        // Fetch branch performance
        const performanceResponse = await api.get("/metrics/branch-performance")
        setBranchPerformance(performanceResponse.data.items || [])
        
        // Fetch critical issues
        const issuesResponse = await api.get("/metrics/critical-issues")
        setCriticalIssues(issuesResponse.data.items || [])
        
        setLoading(false)
      } catch (err) {
        setError("Failed to fetch dashboard data")
        setLoading(false)
        console.error("Error fetching dashboard data:", err)
      }
    }
    
    // Fetch branch managers data
    const fetchBranchManagers = async () => {
      try {
        const response = await api.get("/areas/branch-managers")
        setBranchManagers(response.data.items || [])
      } catch (err) {
        console.error("Error fetching branch managers:", err)
      }
    }
    
    fetchDashboardData()
    fetchBranchManagers()
  }, [])
  
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>
  }
  
  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-600">Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Area Overview</h1>
        <p className="text-muted-foreground">Monitor performance across all branches in your area</p>
      </div>

      {/* Area Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{areaStats.totalBranches}</div>
            <p className="text-xs text-muted-foreground">Under your management</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{areaStats.avgComplianceRate}%</div>
            <Progress value={areaStats.avgComplianceRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">+2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{areaStats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">Across all branches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{areaStats.criticalIssues}</div>
            <p className="text-xs text-muted-foreground">Require immediate action</p>
          </CardContent>
        </Card>
      </div>

      {/* Branch Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Performance</CardTitle>
          <CardDescription>Compliance rates and task status across all branches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {branchPerformance.map((branch: BranchPerformance) => (
              <div key={branch.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{branch.name}</h4>
                    <Badge
                      variant={
                        branch.status === "excellent"
                          ? "default"
                          : branch.status === "good"
                            ? "secondary"
                            : branch.status === "needs_attention"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {branch.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Compliance:</span>
                      <span className="font-medium">{branch.compliance}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Pending:</span>
                      <span className="font-medium">{branch.pendingTasks} tasks</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        branch.compliance >= 90
                          ? "bg-green-500"
                          : branch.compliance >= 80
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${branch.compliance}%` }}
                    />
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Critical Issues
            </CardTitle>
            <CardDescription>Issues requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalIssues.map((issue: CriticalIssue, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                <div className="flex-1">
                  <h4 className="font-medium text-red-800">{issue.branch}</h4>
                  <p className="text-sm text-red-600">{issue.issue}</p>
                  <p className="text-xs text-muted-foreground">Reported {issue.reported}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{issue.severity}</Badge>
                  <Button size="sm" variant="destructive">
                    Investigate
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Branch Management */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Management</CardTitle>
          <CardDescription>Overview of branch managers and quick access to branch dashboards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {branchManagers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No branch managers found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {branchManagers.map((branch) => (
                  <div key={branch.BranchId} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{branch.BranchName}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Manager: {branch.ManagerName}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          Last login: {new Date(branch.LastLogin).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View Dashboard
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
