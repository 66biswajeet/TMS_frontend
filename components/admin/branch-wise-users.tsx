"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Users, Crown, Shield, Eye, MapPin, Search, Filter } from "lucide-react"
import { api } from "@/lib/axios"

interface User {
  UserId: string
  FullName: string
  Email: string
  Phone: string
  RoleName: string
  RoleRank: number
  PositionName: string
  IsActive: boolean
  LastLogin: string
}

interface Branch {
  BranchId: string
  BranchName: string
  GroupName: string
  LocationCode: string
  IsActive: boolean
  AreaName?: string
  BranchManager?: User
  Staff?: User[]
  Auditors?: User[]
}

interface Area {
  AreaId: string
  AreaName: string
  Description?: string
  IsActive: boolean
  Branches: Branch[]
}

interface AreaManager extends User {
  ManagedBranches: string[]
  BranchNames: string[]
  BranchCount: number
}

interface Auditor extends User {
  OverseenManagers: AreaManager[]
  OverseenBranches: string[]
}

interface Statistics {
  totalAreaManagers: number
  totalAuditors: number
  totalBranchManagers: number
  totalStaff: number
  totalAreas: number
}

export function BranchWiseUsers() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [areaManagers, setAreaManagers] = useState<AreaManager[]>([])
  const [auditors, setAuditors] = useState<Auditor[]>([])
  const [managementUsers, setManagementUsers] = useState<User[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchBranchWiseData()
  }, [])

  const fetchBranchWiseData = async () => {
    try {
      setLoading(true)
      
      // Fetch area hierarchy directly
      const areasResponse = await api.get("/management/area-hierarchy")
      const branches = areasResponse.data.items || []

      // Set data from the response
      setBranches(branches)
      setAreaManagers(areasResponse.data.areaManagers || [])
      setAuditors(areasResponse.data.auditors || [])
      setStatistics(areasResponse.data.statistics || null)
      
      // Set only true management users (not branch-assigned)
      if (areasResponse.data.management) {
        setManagementUsers(areasResponse.data.management.staff || [])
      } else {
        setManagementUsers([])
      }
      setLoading(false)
    } catch (err) {
      setError("Failed to fetch branch-wise user data")
      setLoading(false)
      console.error("Error fetching branch-wise data:", err)
    }
  }

  const getRoleIcon = (role: string) => {
    const lowerRole = role.toLowerCase()
    if (lowerRole.includes('management') || lowerRole.includes('admin')) {
      return <Crown className="h-4 w-4 text-yellow-500" />
    }
    if (lowerRole.includes('area') || lowerRole.includes('cluster')) {
      return <MapPin className="h-4 w-4 text-blue-500" />
    }
    if (lowerRole.includes('branch_manager')) {
      return <Building className="h-4 w-4 text-green-500" />
    }
    if (lowerRole.includes('auditor')) {
      return <Shield className="h-4 w-4 text-purple-500" />
    }
    return <Users className="h-4 w-4 text-gray-500" />
  }

  const getRoleBadgeColor = (role: string) => {
    const lowerRole = role.toLowerCase()
    if (lowerRole.includes('management') || lowerRole.includes('admin')) return "default"
    if (lowerRole.includes('area') || lowerRole.includes('cluster')) return "secondary"
    if (lowerRole.includes('branch_manager')) return "secondary"
    if (lowerRole.includes('auditor')) return "outline"
    return "outline"
  }

  const filteredBranches = branches.filter((branch: Branch) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return branch.BranchName.toLowerCase().includes(searchLower) ||
             (branch.BranchManager && (branch.BranchManager.FullName.toLowerCase().includes(searchLower) || branch.BranchManager.Email.toLowerCase().includes(searchLower))) ||
             (branch.Staff && branch.Staff.some((staff: User) =>
               staff.FullName.toLowerCase().includes(searchLower) ||
               staff.Email.toLowerCase().includes(searchLower)
             ))
    }
    return true
  })

  const filteredAreaManagers = areaManagers.filter((manager: AreaManager) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return manager.FullName.toLowerCase().includes(searchLower) ||
             manager.Email.toLowerCase().includes(searchLower) ||
             manager.BranchNames.some(name => name.toLowerCase().includes(searchLower))
    }
    return true
  })

  const filteredAuditors = auditors.filter((auditor: Auditor) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return auditor.FullName.toLowerCase().includes(searchLower) ||
             auditor.Email.toLowerCase().includes(searchLower) ||
             auditor.OverseenManagers.some((manager: AreaManager) =>
               manager.FullName.toLowerCase().includes(searchLower) ||
               manager.BranchNames.some(name => name.toLowerCase().includes(searchLower))
             )
    }
    return true
  })

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading branch-wise user data...</div>
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-600">Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Management Hierarchy</h2>
          <p className="text-muted-foreground">Pure Management Structure: Management → Auditors → Area Managers → Branch Managers → Staff</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <Eye className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search areas, branches, or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Level 1: Management Level Users */}
      {managementUsers.length > 0 && (
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-yellow-600" />
              Level 1: Management (Sees Everything)
            </CardTitle>
            <CardDescription className="font-medium">Top-level executives and administrators with organization-wide visibility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {managementUsers.map((user) => (
                <div key={user.UserId} className="flex items-center space-x-3 p-4 border-2 border-yellow-300 rounded-lg bg-white shadow-sm">
                  <div className="flex-shrink-0">
                    <Crown className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.FullName}</p>
                      <Badge variant="default" className="text-xs bg-yellow-600">
                        {user.RoleName}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{user.Email}</p>
                    <p className="text-xs text-yellow-600 font-medium">{user.PositionName}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Management Statistics */}
      {statistics && (
        <Card className="border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-6 w-6 text-gray-600" />
              Management Structure Overview
            </CardTitle>
            <CardDescription className="font-medium">Current management hierarchy and assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-blue-600">{statistics.totalAreaManagers}</div>
                <div className="text-xs text-gray-600">Area Managers</div>
                <div className="text-xs text-blue-500">(Multi-Branch Clusters)</div>
              </div>
              <div className="p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-purple-600">{statistics.totalAuditors}</div>
                <div className="text-xs text-gray-600">Auditors</div>
                <div className="text-xs text-purple-500">(Oversee Area Managers)</div>
              </div>
              <div className="p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-green-600">{statistics.totalBranchManagers}</div>
                <div className="text-xs text-gray-600">Branch Managers</div>
                <div className="text-xs text-green-500">(Single Branch)</div>
              </div>
              <div className="p-3 bg-white rounded border">
                <div className="text-2xl font-bold text-gray-600">{statistics.totalStaff}</div>
                <div className="text-xs text-gray-600">Staff</div>
                <div className="text-xs text-gray-500">(Under Branch Mgrs)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Level 2: Auditors */}
      {filteredAuditors.length > 0 && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-600" />
              Level 2: Auditors (Oversee Area Managers)
            </CardTitle>
            <CardDescription className="font-medium">Auditors who oversee area managers and their multiple branches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAuditors.map((auditor, index) => {
                const uniqueKey = `${auditor.UserId}-${auditor.Email}-${index}`;

                return (
                  <div key={uniqueKey} className="border-2 border-purple-300 rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="h-6 w-6 text-purple-600" />
                      <div className="flex-1">
                        <h4 className="font-bold text-purple-900">{auditor.FullName}</h4>
                        <p className="text-sm text-purple-700">{auditor.Email}</p>
                        <Badge variant="outline" className="text-xs mt-1 border-purple-300 text-purple-700">
                          {auditor.RoleName}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3">
                      <h5 className="text-sm font-bold text-purple-800 mb-2">
                        🔍 Oversees {auditor.OverseenManagers.length} Area Manager(s):
                      </h5>
                      <div className="space-y-1">
                        {auditor.OverseenManagers.slice(0, 3).map((manager) => (
                          <div key={manager.UserId} className="text-xs bg-purple-50 px-2 py-1 rounded border border-purple-200">
                            {manager.FullName} ({manager.BranchCount} branches)
                          </div>
                        ))}
                        {auditor.OverseenManagers.length > 3 && (
                          <div className="text-xs text-purple-600 font-medium">
                            +{auditor.OverseenManagers.length - 3} more managers
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Level 3: Area Managers */}
      {filteredAreaManagers.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              Level 3: Area Managers (Manage Multiple Branches)
            </CardTitle>
            <CardDescription className="font-medium">Managers assigned to multiple branches (regardless of geographic area)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAreaManagers.map((manager) => (
                <div key={manager.UserId} className="border-2 border-blue-300 rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="h-6 w-6 text-blue-600" />
                    <div className="flex-1">
                      <h4 className="font-bold text-blue-900">{manager.FullName}</h4>
                      <p className="text-sm text-blue-700">{manager.Email}</p>
                      <Badge variant="secondary" className="text-xs mt-1 bg-blue-600 text-white">
                        {manager.RoleName}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h5 className="text-sm font-bold text-blue-800 mb-2">
                      🏢 Manages {manager.BranchCount} Branches:
                    </h5>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {manager.BranchNames.map((branchName, idx) => (
                        <div key={idx} className="text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200">
                          {branchName}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Level 4 & 5: Branch Operations - Grouped by Area Manager */}
      {filteredAreaManagers.length > 0 && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <h3 className="text-lg font-bold text-blue-700 mb-2">Area Manager Clusters → Branch Operations</h3>
            <p className="text-sm text-blue-600">Each area manager oversees multiple branches with their managers and staff</p>
          </div>
          
          {filteredAreaManagers.map((areaManager) => (
            <Card key={areaManager.UserId} className="overflow-hidden border-blue-300">
              <CardHeader className="bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg text-blue-900">🏢 {areaManager.FullName}</CardTitle>
                      <CardDescription className="font-medium">
                        Area Manager - Manages {areaManager.BranchCount} branches
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-600 text-white">
                    {areaManager.RoleName}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4">
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-700 font-medium">
                    📋 Managed Branches: {areaManager.BranchNames.join(', ')}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {branches
                    .filter((branch: Branch) => areaManager.ManagedBranches.includes(branch.BranchId))
                    .map((branch: Branch) => (
                      <div key={branch.BranchId} className="border-2 border-gray-300 rounded-lg p-4 space-y-3 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-green-600" />
                            <h5 className="font-bold text-gray-900">{branch.BranchName}</h5>
                            <Badge variant="default" className="text-xs">Active</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">
                            {(branch.Staff?.length || 0) + (branch.BranchManager ? 1 : 0)} users
                          </span>
                        </div>

                        {/* Branch Manager */}
                        {branch.BranchManager ? (
                          <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                            <div className="flex items-center gap-2 mb-1">
                              <Building className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-bold text-green-800">Branch Manager</span>
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <p className="text-sm font-bold text-green-900">{branch.BranchManager.FullName}</p>
                              <p className="text-xs text-green-700">{branch.BranchManager.Email}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                            <p className="text-sm text-red-600 font-bold">⚠️ No Branch Manager</p>
                          </div>
                        )}

                        {/* Branch Staff */}
                        {branch.Staff && branch.Staff.length > 0 ? (
                          <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-400">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-bold text-gray-800">Staff ({branch.Staff.length})</span>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {branch.Staff.slice(0, 3).map((staff: User) => (
                                <div key={staff.UserId} className="text-sm bg-white p-2 rounded border">
                                  <span className="font-medium text-gray-900">{staff.FullName}</span>
                                  <Badge variant="outline" className="text-xs ml-2">{staff.RoleName}</Badge>
                                </div>
                              ))}
                              {branch.Staff.length > 3 && (
                                <p className="text-xs text-gray-600 text-center py-1">
                                  +{branch.Staff.length - 3} more staff
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                            <p className="text-sm text-yellow-700 font-medium">📋 No Staff Assigned</p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}